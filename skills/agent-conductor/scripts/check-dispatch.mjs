#!/usr/bin/env node
// Dispatch-package linter. Task packages drift toward suppression openers and
// missing contract terms even when the skill text forbids them, so the shape is
// checked here instead of relying on the writer's discipline alone.
// Usage: node check-dispatch.mjs <dispatch.md>
import fs from "node:fs";
import process from "node:process";

const [file] = process.argv.slice(2);
if (!file || process.argv.length > 3) {
  console.error("Usage: node check-dispatch.mjs <dispatch.md>");
  process.exit(2);
}

let text;
try { text = fs.readFileSync(file, "utf8"); }
catch (error) { console.error(`Cannot read dispatch package: ${error.message}`); process.exit(1); }

const problems = [];
const fail = (message) => problems.push(message);

// 1. Suppression openers. Global "just execute, don't think" lines are not
// decidable boundaries; the first three lines are where they appear in
// practice (known limit: a suppression line placed fourth or later passes).
const opener = text.split("\n").slice(0, 3).join("\n");
const suppressionOpeners = [
  [/只执行任务/, "execution-suppression opener"],
  [/不要.{0,6}思考/, "thought-suppression opener"],
  [/无需思考/, "thought-suppression opener"],
  [/自作主张/, "blanket no-initiative opener"],
  [/不要问.{0,3}问题/, "question-suppression opener"],
];
for (const [pattern, label] of suppressionOpeners) {
  if (pattern.test(opener)) {
    fail(`${label} /${pattern.source}/ — replace with decidable boundaries: commands, paths, exemptions`);
  }
}

// 2. Every package needs a receipt channel so completion claims stay checkable.
if (!/(回执|回报|最终报告|VERDICT|裁决)/.test(text)) {
  fail("no receipt requirement (回执 / 回报 / 裁决) — completion claims need a checkable channel");
}

// 3. Implementation packages grant file or VCS writes. Sentences that merely
// prohibit a write ("git push 一律禁止", "do not commit") are stripped first so
// explicit prohibitions do not read as grants. Known limit: grant wording
// variants outside these patterns are treated as read-only.
const negation = /(不要|禁止|不得|不许|一律不|never|forbidden|do not|don'?t)/i;
const affirmative = text
  .split(/[\n。；!?！？]/)
  .filter((sentence) => sentence.trim() && !negation.test(sentence))
  .join("\n");
const grantsWrites = /(git (commit|push|merge)|gh pr (create|merge)|提交你改的|开(一个|一条)?.{0,8}PR|创建.{0,6}PR|合并(进|到|入).{0,20}(main|主分支|主干))/i.test(affirmative);
if (grantsWrites) {
  if (!/(自身执行|再分工|重派|回报协调者)/.test(text)) {
    fail("implementation package lacks an execution-identity term (自身执行 / 确需再分工先回报协调者重派)");
  }
  if (!/(失败基线|相对基线|无新增失败|预存失败|已知失败)/.test(text)) {
    fail("implementation package lacks a failure baseline (失败基线 / 相对基线无新增失败 / 预存失败)");
  }
}

for (const problem of problems) console.error(problem);
console.log(`dispatch package: ${grantsWrites ? "implementation" : "read-only"}, ${problems.length} problems`);
process.exit(problems.length ? 1 : 0);
