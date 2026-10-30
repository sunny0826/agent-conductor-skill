#!/usr/bin/env node
// Dispatch-package linter. Task packages drift toward suppression openers and
// missing contract terms even when the skill text forbids them, so the shape is
// checked here instead of relying on the writer's discipline alone.
// Usage:
//   node check-dispatch.mjs <dispatch.md | ->            lint a package
//   node check-dispatch.mjs --message <message.md | ->   lint a dispatch message
// "-" reads stdin, so inline packages and messages can be checked without a
// temp file. Message mode is the structural anchor for the "dispatch message
// carries only a pointer and a receipt requirement" rule: 2026-10-18 showed
// suppression openers migrating from packages (now linted) into the covering
// dispatch messages, which nothing checked.
//
// The package declares its own type on the leading line, and the value must be
// exactly one of 实施 / 只读审查 / 验证 (or "package type: implementation /
// read-only review / verification"); substring matches silently accepted
// out-of-contract values like 只读调查 on 2026-10-18, so the check is a
// whitelist. Undeclared packages are still rejected (exit 1); the heuristic
// only decides how they are classified.
// Known limits, kept deliberately: in package mode suppression openers are
// only checked in the first three lines; review/verification command
// boundaries are only checked when the type is declared; grant and boundary
// wording variants outside the patterns below read as absent. In message
// mode: light 不-verb boundary phrasing (只挑…，不要修改 / 不要提交) is
// tolerated and only 禁止/严禁/不得/不许 carriers are rejected — the two
// forms sit on one lexical continuum, so tightening would break the tolerated
// challenge-role openers (review finding 1b, 2026-10-19); Chinese compounds
// 不得不/不得已 are exempted from the 不得 pattern, but other meta-mention of
// the audited wording (quoting 「不要自作主张」 while discussing the rule) can
// still hit (1a); text appended after an inline package skips the prohibition
// check because the inline form is treated as package content (1c). Message
// mode validates the supplied file, not what the host actually sent; dispatch
// through a host file-input option (Lody --prompt-file) so the checked text is
// the sent text.
import fs from "node:fs";
import process from "node:process";

const args = process.argv.slice(2);
const messageMode = args.includes("--message");
const file = args.find((arg) => arg !== "--message");
if (!file || args.filter((arg) => arg !== "--message" && arg !== file).length > 0) {
  console.error("Usage: node check-dispatch.mjs <dispatch.md | ->  |  --message <message.md | ->");
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
let declaredType = null;

// Shared patterns for both modes.
const suppressionOpeners = [
  [/只执行任务/, "execution-suppression opener"],
  [/不要.{0,6}思考/, "thought-suppression opener"],
  [/无需思考/, "thought-suppression opener"],
  [/自作主张/, "blanket no-initiative opener"],
  [/不要问.{0,3}问题/, "question-suppression opener"],
];
const receiptPattern = /(回执|回报|最终[^\n。；]{0,4}(?:报告|回复|结论)|VERDICT|裁决|\bwhen\s+done,?\s+reply\s+with\s*:)/i;

if (messageMode) {
  // Dispatch-message mode: the message must carry a pointer to the package
  // file (or be an inline package led by its type declaration) plus a receipt
  // requirement, and no suppression openers or boundary clauses — boundaries
  // live in the package, where they are linted for consistency.
  const firstContentLine = text.split("\n").find((line) => line.trim());
  const inlinePackage = firstContentLine !== undefined &&
    /^\s*(?:任务包类型|package type)[:：]/i.test(firstContentLine);
  // A `.md` path alone is not a package pointer. 2026-10-27 sessions b3c5f708
  // and da113c7f were sent full task bodies whose first `.md` reference was an
  // incidental document 400+ characters in; the old any-.md test counted them
  // as pointers, so the message lint reported only the receipt/boundary
  // problems and would have passed a task body that added a receipt line.
  // Require an execution/package cue before a path; a source-document path
  // near the start is still only context. Inspect later paths as well.
  const pointerPattern = /(?:[~/]|[.]{1,2}\/|[A-Za-z]:\\)[^\s，。；）)"'《》`]*\.md/gi;
  const hasPointer = [...text.matchAll(pointerPattern)].some((match) => {
    const lineStart = text.lastIndexOf("\n", match.index) + 1;
    const prefix = text.slice(lineStart, match.index);
    return /(?:任务包|\bpackage\b|请(?:完整)?(?:读取并)?执行|请(?:完整)?读取|先完整读|\bexecute\b)/i.test(prefix);
  });
  if (!hasPointer && !inlinePackage) {
    fail("dispatch message has no package pointer — point at the package file path, or inline the full package led by its 任务包类型 declaration");
  }
  if (!receiptPattern.test(text)) {
    fail("no receipt requirement (回执 / 回报 / 最终报告 / 最终回复 / 最终结论 / 裁决) in the dispatch message");
  }
  for (const [pattern, label] of suppressionOpeners) {
    if (pattern.test(text)) {
      fail(`${label} /${pattern.source}/ in dispatch message — replace with decidable boundaries in the package: commands, paths, exemptions`);
    }
  }
  if (!inlinePackage && /(禁止|严禁|不得(?!不|已)|不许)/.test(text)) {
    fail("dispatch message carries prohibition/boundary clauses (禁止/严禁/不得/不许) — boundaries belong in the package, keep the message to pointer plus receipt requirement");
  }
  for (const problem of problems) console.error(problem);
  console.log(`dispatch message: ${problems.length} problems`);
  process.exit(problems.length ? 1 : 0);
}

// 1. Package type declaration. The declaration leads the package (first
// non-empty line); extra or misplaced declaration lines are rejected. The
// value is matched exactly against the three contract values — substring
// matching accepted out-of-contract values (只读调查, 2026-10-18). A package
// that both implements and verifies declares 实施 (the stronger class).
const typeLines = [...text.matchAll(/^\s*(?:任务包类型|package type)[:：]\s*(.+?)\s*$/gim)];
const firstContentLine = text.split("\n").find((line) => line.trim());
if (typeLines.length === 0) {
  fail("no package-type declaration — lead with 任务包类型：实施 / 只读审查 / 验证");
} else {
  if (!firstContentLine || !/^\s*(?:任务包类型|package type)[:：]/i.test(firstContentLine)) {
    fail("package-type declaration must be the first line of the package");
  }
  if (typeLines.length > 1) {
    fail(`duplicate package-type declaration (${typeLines.length} lines) — keep exactly one leading line`);
  }
  const value = typeLines[0][1];
  const normalized = value.trim().toLowerCase();
  if (/^(?:实施|implementation)$/.test(normalized)) declaredType = "implementation";
  else if (/^(?:只读审查|验证|read[- ]?only review|review only|verification)$/.test(normalized)) declaredType = "bounded";
  else fail(`unrecognized package type "${value}" — use 实施 / 只读审查 / 验证`);
}

// 2. Strip slash-delimited regex literals of the form /(...)/flags before
// pattern matching, so a review package that quotes an audited regex (e.g.
// the grant patterns of this very script) is not read as granting writes.
// Only alternation/quantifier bodies (containing | or {) are stripped; prose
// paths and parentheses survive.
const stripped = text.replace(/\/\([^\n/]{1,2000}\)\/[gimsuy]*/g, (m) => (/[|{]/.test(m) ? "" : m));

// 3. Suppression openers. Global "just execute, don't think" lines are not
// decidable boundaries; the first three lines are where they appear in
// practice (known limit: a suppression line placed fourth or later passes).
const opener = stripped.split("\n").slice(0, 3).join("\n");
for (const [pattern, label] of suppressionOpeners) {
  if (pattern.test(opener)) {
    fail(`${label} /${pattern.source}/ — replace with decidable boundaries: commands, paths, exemptions`);
  }
}

// 4. Every package needs a receipt channel so completion claims stay checkable.
// 最终{0,4}(报告|回复|结论) covers wording like 最终完整报告 / 最终回复 /
// 最终结论 seen in real packages.
if (!receiptPattern.test(stripped)) {
  fail("no receipt requirement (回执 / 回报 / 最终报告 / 最终回复 / 最终结论 / 裁决) — completion claims need a checkable channel");
}

// 5. Write grants. Sentences that merely prohibit or deny a write ("git push
// 一律禁止", "作者没有 git push", "do not commit") are stripped first, and so
// are sentences that describe a third party's actions or claims (被审…声明 /
// 核对作者是否…) — a review package verifying someone else's boundary must
// not read as granting it. File-write grants (只能改…文件 / 只拥有…文件 /
// 唯一写入) classify a package as implementation even without VCS wording;
// writing a designated report file does not.
const negation = /(不要|禁止|不得|不许|一律不|没有|并未|未曾|never|forbidden|do not|don'?t)/i;
const thirdParty = /(被审|作者|对方|声称|声明|是否)/;
const affirmative = stripped
  .split(/[\n。；!?！？]/)
  .filter((sentence) => sentence.trim() && !negation.test(sentence) && !thirdParty.test(sentence))
  .join("\n");
const vcsGrants = /(git (commit|push|merge)|gh pr (create|merge)|提交你改的|开(一个|一条)?.{0,8}PR|创建.{0,6}PR|合并(进|到|入).{0,20}(main|主分支|主干))/i.test(affirmative);
const fileGrants = /(只能?改[^\n。；]{0,6}文件|只拥有[^\n。；]{0,4}文件|唯一写入|可写的?文件|允许你?(?:写|改)[^\n。；]{0,6}文件)/.test(affirmative);
const heuristicGrants = vcsGrants || fileGrants;

let grantsWrites;
if (declaredType === "implementation") grantsWrites = true;
else if (declaredType === "bounded") {
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
// implied by ordered instructions or a bare mention of the word — executors
// otherwise treat the package as open-ended. Boundary headers need a colon so
// prose that merely mentions 验证命令/命令边界 does not pass.
if (declaredType === "bounded" &&
    !/(?<![不莫])允许[^\n。；]{0,12}(?:命令|执行|运行|搜索|只读)|(?:可用|可以|能够)[^\n。；]{0,60}(?:命令|执行|运行)|(?:命令边界|验证命令)[^\n。；]{0,30}[:：]|在[^\n。；]{0,30}运行[:：]|不要?(?:执行|运行|跑)(?:任何)?命令|(?:allowed|permitted|verification) commands?|command boundary|(?:runs?|execute) no commands/i.test(stripped)) {
  fail("review/verification package lacks a command boundary (允许执行的命令… / 不执行任何命令 / 验证命令在…运行：)");
}

for (const problem of problems) console.error(problem);
console.log(`dispatch package: ${grantsWrites ? "implementation" : "read-only"}${declaredType ? ` (declared ${declaredType})` : ""}, ${problems.length} problems`);
process.exit(problems.length ? 1 : 0);
