#!/usr/bin/env node
// Post-dispatch guard: compare the text the host actually delivered as the
// child's first user message with the message file that was linted before
// sending. Pre-send linting only proves the file is clean; 2026-10-22/23 showed
// eleven dispatches where the clean file was sent with "只执行任务，不要进行
// 额外的思考，不要自作主张" prepended. Only reading back the delivered text
// catches that.
// Usage:
//   node check-sent-dispatch.mjs <message.md> --session <childSessionId>
//   node check-sent-dispatch.mjs <message.md> --sent <file | ->
// "--sent -" reads the delivered text from stdin, for hosts that expose the
// first user message without the Lody CLI. Text is compared after normalizing
// CRLF and trailing whitespace; any prefix, suffix or body edit fails.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import process from "node:process";

function usage(message) {
  if (message) console.error(message);
  console.error("Usage: node check-sent-dispatch.mjs <message.md> (--session <id> | --sent <file|->)");
  process.exit(2);
}

const args = process.argv.slice(2);
let checkedFile = null;
let sessionId = null;
let sentFile = null;
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--session" || arg === "--sent") {
    const value = args[index + 1];
    if (value === undefined) usage(`${arg} needs a value`);
    if (arg === "--session") sessionId = value;
    else sentFile = value;
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

function firstUserTextFromLody(id) {
  const result = spawnSync("lody", ["session", "history", id, "--json", "--offline"], { encoding: "utf8" });
  if (result.error) throw new Error(`cannot run lody: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`lody exited ${result.status}: ${(result.stderr || "").trim()}`);
  const line = result.stdout.split("\n").filter((item) => item.trim().startsWith("{")).pop();
  if (!line) throw new Error("lody returned no JSON");
  const payload = JSON.parse(line);
  if (payload.ok === false) throw new Error(`lody error: ${payload.error}`);
  const first = (payload.entries || []).find((entry) => entry.role === "user" && typeof entry.text === "string");
  if (!first) throw new Error("no readable user message in the child session");
  return first.text;
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
const delivered = normalize(sent);

if (expected === delivered) {
  console.log("sent message matches checked message");
  process.exit(0);
}

let offset = 0;
while (offset < expected.length && offset < delivered.length && expected[offset] === delivered[offset]) offset += 1;
console.error("sent message differs from checked message");
console.error(`first difference at character ${offset}`);
console.error(`checked: ${JSON.stringify(expected.slice(0, 80))}`);
console.error(`sent:    ${JSON.stringify(delivered.slice(0, 80))}`);
console.error("Cancel the child session and resend the checked file unchanged; do not edit the delivered text.");
process.exit(1);
