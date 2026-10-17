#!/usr/bin/env node
// Dispatch-package linter. Task packages drift toward suppression openers and
// missing contract terms even when the skill text forbids them, so the shape is
// checked here instead of relying on the writer's discipline alone.
// Usage: node check-dispatch.mjs <dispatch.md>   (or "-" to read stdin, so an
// inline package can be checked without writing a temp file first).
//
// The package declares its own type on a leading line (任务包类型：实施 /
// 只读审查 / 验证, or "package type: …"), which replaces the write-grant
// heuristic as the source of truth; undeclared packages keep the heuristic.
// Known limits, kept deliberately: suppression openers are only checked in the
// first three lines; review/verification command boundaries are only checked
// when the type is declared; grant wording variants outside the patterns below
// read as read-only for undeclared packages.
import fs from "node:fs";
import process from "node:process";

const [file] = process.argv.slice(2);
if (!file || process.argv.length > 3) {
  console.error("Usage: node check-dispatch.mjs <dispatch.md | ->");
  process.exit(2);
}

let text;
if (file === "-") {
  try { text = fs.readFileSync(0, "utf8"); }
  catch (error) { console.error(`Cannot read stdin: ${error.message}`); process.exit(1); }
} else {
  try { text = fs.readFileSync(file, "utf8"); }
  catch (error) { console.error(`Cannot read dispatch package: ${error.message}`); process.exit(1); }
}

const problems = [];
const fail = (message) => problems.push(message);

// 1. Package type declaration. The declared type decides whether
// implementation terms are required; the grant heuristic only applies when no
// declaration exists. A package that both implements and verifies declares
// 实施 (the stronger class).
const typeLine = text.match(/^\s*(?:任务包类型|package type)[:：]\s*(.+?)\s*$/im);
let declared = null;
if (!typeLine) {
  fail("no package-type declaration — lead with 任务包类型：实施 / 只读审查 / 验证");
} else {
  const value = typeLine[1].toLowerCase();
  if (/实施|implement/.test(value)) declared = "implementation";
  else if (/只读|审查|验证|review|verif|read[- ]?only/.test(value)) declared = "bounded";
  else fail(`unrecognized package type "${typeLine[1]}" — use 实施 / 只读审查 / 验证`);
}

// 2. Strip slash-delimited regex literals of the form /(...)/flags before
// pattern matching, so a review package that quotes an audited regex (e.g.
// the grant patterns of this very script) is not read as granting writes.
// Only alternation/quantifier bodies (containing | or {) are stripped; prose
// paths and parentheses survive.
const stripped = text.replace(/\/\([^\n/]{1,300}\)\/[gimsuy]*/g, (m) => (/[|{]/.test(m) ? "" : m));

// 3. Suppression openers. Global "just execute, don't think" lines are not
// decidable boundaries; the first three lines are where they appear in
// practice (known limit: a suppression line placed fourth or later passes).
const opener = stripped.split("\n").slice(0, 3).join("\n");
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

// 4. Every package needs a receipt channel so completion claims stay checkable.
// 最终.{0,4}报告 covers wording like 最终完整报告 seen in real packages.
if (!/(回执|回报|最终[^\n。；]{0,4}报告|最终回复|VERDICT|裁决)/.test(stripped)) {
  fail("no receipt requirement (回执 / 回报 / 最终报告 / 最终回复 / 裁决) — completion claims need a checkable channel");
}

// 5. Write grants. Sentences that merely prohibit a write ("git push 一律禁
// 止", "do not commit") are stripped first so explicit prohibitions do not
// read as grants. File-write grants (只能改…文件 / 只拥有…文件 / 唯一写入)
// classify a package as implementation even without VCS wording; writing a
// designated report file does not. Known limit: grant wording variants
// outside these patterns are treated as read-only for undeclared packages.
const negation = /(不要|禁止|不得|不许|一律不|never|forbidden|do not|don'?t)/i;
const affirmative = stripped
  .split(/[\n。；!?！？]/)
  .filter((sentence) => sentence.trim() && !negation.test(sentence))
  .join("\n");
const vcsGrants = /(git (commit|push|merge)|gh pr (create|merge)|提交你改的|开(一个|一条)?.{0,8}PR|创建.{0,6}PR|合并(进|到|入).{0,20}(main|主分支|主干))/i.test(affirmative);
const fileGrants = /(只能?改[^\n。；]{0,6}文件|只拥有[^\n。；]{0,4}文件|唯一写入|可写的?文件|允许你?(?:写|改)[^\n。；]{0,6}文件)/.test(affirmative);
const heuristicGrants = vcsGrants || fileGrants;

let grantsWrites;
if (declared === "implementation") grantsWrites = true;
else if (declared === "bounded") {
  if (heuristicGrants) {
    fail("declared read-only/review but the text grants writes — fix the type or the grants");
  }
  grantsWrites = heuristicGrants;
} else grantsWrites = heuristicGrants;

if (grantsWrites) {
  if (!/(自身执行|再分工|重派|回报协调者)/.test(stripped)) {
    fail("implementation package lacks an execution-identity term (自身执行 / 确需再分工先回报协调者重派)");
  }
  if (!/(失败基线|相对基线|无新增失败|预存失败|已知失败)/.test(stripped)) {
    fail("implementation package lacks a failure baseline (失败基线 / 相对基线无新增失败 / 预存失败)");
  }
}

// 6. Command boundary for declared review/verification packages: the allowed
// command list (or an explicit "runs no commands") must be stated, not just
// implied by a couple of ordered instructions — executors otherwise treat the
// package as open-ended. Wording variants outside these patterns pass.
if (declared === "bounded" &&
    !/(?<![不莫])允许[^\n。；]{0,12}(?:命令|执行|运行|搜索|只读)|命令边界|不要?(?:执行|运行|跑)(?:任何)?命令|验证命令|在[^\n。；]{0,30}运行[:：]|(?:allowed|permitted|verification) commands?|command boundary|(?:runs?|execute) no commands/i.test(stripped)) {
  fail("review/verification package lacks a command boundary (允许执行的命令… / 不执行任何命令 / 验证命令在…运行：)");
}

for (const problem of problems) console.error(problem);
console.log(`dispatch package: ${grantsWrites ? "implementation" : "read-only"}${declared ? ` (declared ${declared})` : ""}, ${problems.length} problems`);
process.exit(problems.length ? 1 : 0);
