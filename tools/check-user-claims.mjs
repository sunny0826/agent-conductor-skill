#!/usr/bin/env node
// Check user-confirmation claims against the user's own messages. Logs,
// screenshots, and test results are product evidence, not user confirmations.
// A claim is flagged unless its sentence quotes text found in a user turn.
// Matching text alone does not prove that the quote supports the whole claim;
// review broad approvals and uncovered acceptance items using skills/agent-conductor/SKILL.md.
//
// Usage:
//   mise exec -- node tools/check-user-claims.mjs --session <sessionId> [--delivery <draft.md>] [--json]
// Without --delivery every assistant turn is audited, including intermediate reports.
// Keep drafts and audit output in an authorized private directory outside the repository.
// Exit 0: no unsupported claims; 1: at least one unsupported claim; 2: unreadable.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import process from "node:process";

function usage(message) {
  if (message) console.error(message);
  console.error("Usage: node check-user-claims.mjs --session <sessionId> [--delivery <draft.md>] [--json]");
  process.exit(2);
}

const args = process.argv.slice(2);
let sessionId = null;
let deliveryFile = null;
let json = false;
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--json") json = true;
  else if (arg === "--session" || arg === "--delivery") {
    const value = args[index + 1];
    if (value === undefined) usage(`${arg} needs a value`);
    if (arg === "--session") sessionId = value;
    else deliveryFile = value;
    index += 1;
  } else usage(`Unexpected argument: ${arg}`);
}
if (!sessionId) usage("Missing --session <sessionId>");

function lodyJson(lodyArgs, label) {
  const result = spawnSync("lody", lodyArgs, { encoding: "utf8", maxBuffer: 200 * 1024 * 1024 });
  if (result.error) throw new Error(`cannot run lody: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`lody ${label} exited ${result.status}: ${(result.stderr || "").trim()}`);
  const line = result.stdout.split("\n").filter((item) => item.trim().startsWith("{")).pop();
  if (!line) throw new Error(`lody ${label} returned no JSON`);
  const payload = JSON.parse(line);
  if (payload.ok === false) throw new Error(`lody ${label} error: ${payload.error}`);
  return payload;
}

let entries;
try {
  entries = lodyJson(["session", "history", sessionId, "--json", "--offline", "--all"], "session history").entries || [];
} catch (error) {
  console.error(error.message);
  process.exit(2);
}
const userMessages = entries
  .filter((entry) => entry.role === "user" && typeof entry.text === "string")
  .map((entry) => entry.text);
let delivery = null;
if (deliveryFile) {
  try {
    delivery = fs.readFileSync(deliveryFile, "utf8");
  } catch (error) {
    console.error(`Cannot read delivery: ${error.message}`);
    process.exit(2);
  }
}
const assistantTurns = deliveryFile
  ? [{ turn: "file", text: delivery }]
  : entries
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => entry.role === "assistant" && typeof entry.text === "string")
      .map(({ entry, index }) => ({ turn: index + 1, text: entry.text }));

const normalize = (text) => text.replace(/\s+/g, " ").trim();
const normalizedUsers = userMessages.map(normalize);
const claimPattern = /(?:你|用户)已确认|(?:你|用户)的目视确认|用户验收通过|(?:你|用户)已验收/;
const quotePattern = /[“"「『]([^”"」』\n]{2,200})[”"」』]/g;
const claims = [];
const unsupported = [];
for (const { turn, text } of assistantTurns) {
  const sentences = text.split(/[\n。；]/).map((sentence) => sentence.trim()).filter(Boolean);
  for (const sentence of sentences) {
    if (!claimPattern.test(sentence)) continue;
    const quotes = [...sentence.matchAll(quotePattern)].map((match) => normalize(match[1])).filter(Boolean);
    const supported = quotes.length > 0 && quotes.some((quote) => normalizedUsers.some((user) => user.includes(quote)));
    const claim = { turn, sentence, quotes, supported };
    claims.push(claim);
    if (!supported) unsupported.push(claim);
  }
}

if (json) {
  console.log(JSON.stringify({ sessionId, deliverySource: deliveryFile || "assistant turns", claims, unsupported }, null, 2));
} else {
  console.log(`${sessionId}: ${claims.length} user-confirmation claims, ${unsupported.length} unsupported`);
  for (const claim of unsupported) {
    const reason = claim.quotes.length ? "quoted text not found in any user message" : "no quoted user words";
    console.log(`- unsupported (${reason}, turn ${claim.turn}): ${claim.sentence}`);
  }
  if (!claims.length) console.log("No user-confirmation claims in the delivery.");
  if (unsupported.length) {
    console.log("Rewrite these as device/product evidence, quote the user's exact words, or mark the item unverified.");
  }
}
process.exit(unsupported.length ? 1 : 0);
