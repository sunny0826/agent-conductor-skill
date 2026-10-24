#!/usr/bin/env node
// Post-dispatch guard: compare the text the host actually delivered as the
// child's first user message with the message file that was linted before
// sending. Pre-send linting only proves the file is clean.
//
// A host may also inject the configured promptPrefix of the child's Agent Role
// in front of the message. On 2026-10-24 the worker+ and Reviewer roles both had
// such prefixes; the eleven "prepended" dispatches blamed on send-time edits in
// 2026-10-22/23 were those configured prefixes, not rewritten text. Resolve the
// role prefix from the child session (or pass --role-prefix) and compare the
// message body, so a legitimate role prefix is not reported as pollution.
//
// Usage:
//   node check-sent-dispatch.mjs <message.md> --session <childSessionId>
//   node check-sent-dispatch.mjs <message.md> --sent <file | ->
//   node check-sent-dispatch.mjs <message.md> --sent <file | -> --role-prefix <text>
// "--sent -" reads the delivered text from stdin, for hosts that expose the
// first user message without the Lody CLI. Text is compared after normalizing
// CRLF and trailing whitespace; an unconfigured prefix, suffix or body edit
// fails. Exit code 2 means the role prefix could not be verified.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import process from "node:process";

function usage(message) {
  if (message) console.error(message);
  console.error(
    "Usage: node check-sent-dispatch.mjs <message.md> (--session <id> | --sent <file|->) [--role-prefix <text>]",
  );
  process.exit(2);
}

const args = process.argv.slice(2);
let checkedFile = null;
let sessionId = null;
let sentFile = null;
let rolePrefix = null;
let explicitRolePrefix = false;
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--session" || arg === "--sent" || arg === "--role-prefix") {
    const value = args[index + 1];
    if (value === undefined) usage(`${arg} needs a value`);
    if (arg === "--session") sessionId = value;
    else if (arg === "--sent") sentFile = value;
    else {
      rolePrefix = value;
      explicitRolePrefix = true;
    }
    index += 1;
  } else if (checkedFile === null) {
    checkedFile = arg;
  } else {
    usage(`Unexpected argument: ${arg}`);
  }
}
if (!checkedFile) usage("Missing checked message file");
if ((sessionId === null) === (sentFile === null)) usage("Pass exactly one of --session or --sent");

let checked;
try {
  checked = fs.readFileSync(checkedFile, "utf8");
} catch (error) {
  console.error(`Cannot read checked message: ${error.message}`);
  process.exit(2);
}

function lodyJson(lodyArgs, label) {
  const result = spawnSync("lody", lodyArgs, { encoding: "utf8" });
  if (result.error) throw new Error(`cannot run lody: ${result.error.message}`);
  if (result.status !== 0) {
    throw new Error(`lody ${label} exited ${result.status}: ${(result.stderr || "").trim()}`);
  }
  const line = result.stdout
    .split("\n")
    .filter((item) => item.trim().startsWith("{"))
    .pop();
  if (!line) throw new Error(`lody ${label} returned no JSON`);
  const payload = JSON.parse(line);
  if (payload.ok === false) throw new Error(`lody ${label} error: ${payload.error}`);
  return payload;
}

function firstUserTextFromLody(id) {
  const payload = lodyJson(["session", "history", id, "--json", "--offline"], "session history");
  const first = (payload.entries || []).find((entry) => entry.role === "user" && typeof entry.text === "string");
  if (!first) throw new Error("no readable user message in the child session");
  return first.text;
}

function resolveRolePrefix(id) {
  const show = lodyJson(["session", "show", id, "--json", "--offline"], "session show");
  const roleId = show?.session?.agentRoleId;
  if (!roleId) return { prefix: "", name: null };
  const role = lodyJson(["agent-role", "get", roleId, "--json", "--offline"], "agent-role get");
  const item = role?.item || {};
  return {
    prefix: typeof item.promptPrefix === "string" ? item.promptPrefix : "",
    name: item.name || roleId,
  };
}

let roleInfo = { prefix: rolePrefix || "", name: null };
if (!explicitRolePrefix && sessionId !== null) {
  try {
    roleInfo = resolveRolePrefix(sessionId);
  } catch (error) {
    console.error(`Cannot resolve the child role prompt prefix: ${error.message}`);
    console.error("Re-run with --role-prefix <text> after checking the Agent Role, or compare manually.");
    process.exit(2);
  }
}

let sent;
try {
  if (sessionId !== null) {
    sent = firstUserTextFromLody(sessionId);
  } else if (sentFile === "-") {
    sent = fs.readFileSync(0, "utf8");
  } else {
    sent = fs.readFileSync(sentFile, "utf8");
  }
} catch (error) {
  console.error(error.message);
  process.exit(2);
}

const normalize = (text) => text.replace(/\r\n/g, "\n").trimEnd();
const expected = normalize(checked);
const configuredPrefix = normalize(roleInfo.prefix).trimEnd();
const delivered = normalize(sent);

let matched = expected === delivered;
let strippedPrefix = false;
if (!matched && configuredPrefix) {
  for (const separator of ["\n\n", "\n"]) {
    if (delivered === `${configuredPrefix}${separator}${expected}`) {
      matched = true;
      strippedPrefix = true;
      break;
    }
  }
}

if (matched) {
  const roleSuffix = roleInfo.name ? ` (${roleInfo.name})` : "";
  console.log(
    strippedPrefix
      ? `sent message matches checked message after the configured role prompt prefix${roleSuffix}`
      : "sent message matches checked message",
  );
  process.exit(0);
}

let comparison = delivered;
let hadPrefix = false;
if (configuredPrefix && (comparison === configuredPrefix || comparison.startsWith(`${configuredPrefix}\n`))) {
  comparison = comparison.slice(configuredPrefix.length).replace(/^\n+/, "");
  hadPrefix = true;
}

let offset = 0;
while (offset < expected.length && offset < comparison.length && expected[offset] === comparison[offset]) {
  offset += 1;
}
console.error("sent message differs from checked message");
if (hadPrefix) {
  console.error("the configured role prompt prefix was found and removed before this comparison");
}
console.error(`first difference at character ${offset}`);
console.error(`checked: ${JSON.stringify(expected.slice(0, 80))}`);
console.error(`sent:    ${JSON.stringify(comparison.slice(0, 80))}`);
console.error("Cancel the child session and resend the checked file unchanged; do not edit the delivered text.");
process.exit(1);
