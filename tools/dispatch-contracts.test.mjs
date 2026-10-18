import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";

import { root, run } from "./contracts-lib.mjs";

const checkDispatch = (text) => run("skills/agent-conductor/scripts/check-dispatch.mjs", text);

function verificationPackage() {
  return `任务包类型：验证

你是 PR #55 的独立 gates lane。你不是作者。不要修改产品代码，不要提交，不要推送。

目标 head 必须是 93e8c15。用 git rev-parse HEAD 核对，不一致就停，裁决 BLOCKED。

验证命令在 studio/ 目录运行：两条 go test 命令，保留完整输出和退出码。

裁决：两条命令退出码 0 且 HEAD 正确写 PASS，否则写 ISSUES 或 BLOCKED。回复以 VERDICT、HEAD、EVIDENCE 三行开头。`;
}
function implementationPackage() {
  return `任务包类型：实施

你是 studio-shell 这一个 PR 的 owner。角色是 worker+。执行身份：被派会话自身执行，确需再分工先回报协调者重派。

只能改这些文件：studio/internal/pages/window.go。

失败基线：主干全绿；完成判定为相对基线无新增失败，预存失败列出。

验证：在 studio/ 目录执行 go test ./internal/pages/ -count=1。

检查通过后，只在 studio-shell 上提交你改的文件，git push 后用 gh pr create 开一个普通 PR。

完成回执必须包含：工作目录、分支名、head 完整 SHA、PR URL、测试命令的退出码。测试没过就不要开 PR，回报失败输出。`;
}
test("verification dispatch packages pass with explicit boundaries", () => {
  const result = checkDispatch(verificationPackage());
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /read-only/);
});
test("suppression openers are rejected with a fix hint", () => {
  for (const opener of ["只执行任务，不要进行额外的思考，不要自作主张", "不要进行额外的思考", "不要自作主张"]) {
    const result = checkDispatch(`${opener}\n\n${verificationPackage()}`);
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, /opener .*decidable boundaries/);
  }
});
test("implementation packages need identity and baseline terms", () => {
  const full = implementationPackage();
  assert.equal(checkDispatch(full).code, 0, checkDispatch(full).output);
  for (const [mutate, diagnostic] of [
    [(p) => p.replace("执行身份：被派会话自身执行，确需再分工先回报协调者重派。", ""), /execution-identity/],
    [(p) => p.replace("失败基线：主干全绿；完成判定为相对基线无新增失败，预存失败列出。", ""), /failure baseline/],
  ]) {
    const result = checkDispatch(mutate(full));
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, diagnostic);
  }
});
test("packages without a receipt channel are rejected", () => {
  const stripped = verificationPackage()
    .replace(/回复以 VERDICT、HEAD、EVIDENCE 三行开头。/, "")
    .replace(/裁决：两条命令退出码 0 且 HEAD 正确写 PASS，否则写 ISSUES 或 BLOCKED。/, "两条命令退出码 0 即为完成。")
    .replace(/不一致就停，裁决 BLOCKED。/, "不一致就停。");
  const result = checkDispatch(stripped);
  assert.equal(result.code, 1);
  assert.match(result.output, /receipt/);
});
test("real 2026-10-16 suppression package is caught with all five problems", () => {
  // Verbatim shape of the dispatch package sent to session 143e2c10 on
  // 2026-10-16 (prose kept, file lists trimmed to one entry).
  const pkg = `只执行任务，不要进行额外的思考，不要自作主张

你是 studio-shell 这一个 PR 的替代 owner。角色是 worker+。上一个会话已结束，不要续用它。它没有改任何文件。

计划只读：studio/docs/plans/studio-ux.md 的「Show the shell (studio-shell)」一节。不要改这份计划。

只能改这些文件：studio/internal/pages/window.go

验证：在 studio/ 目录执行 go test ./internal/pages/ -count=1，再跑 go vet ./...。不要启动模型服务。

提交与 PR：检查通过后，只在 studio-shell 上提交你改的文件。不要改 git config，不要 --no-verify，不要提交 main，不要合并。然后 git push -u origin studio-shell，并用 gh pr create 开一个普通 PR，base 是 main。

完成回执必须包含：工作目录、分支名、head 完整 SHA、PR URL、测试命令的退出码、改过的文件清单。测试没过就不要开 PR，回报失败输出。`;
  const result = checkDispatch(pkg);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /execution-suppression opener/);
  assert.match(result.output, /implementation package lacks an execution-identity/);
  assert.match(result.output, /failure baseline/);
});
test("explicit prohibitions do not read as write grants", () => {
  const pkg = `Package type: verification

You are an independent gates lane for PR #55. You are not the author. git push, git commit, gh pr merge: all forbidden. Do not modify any file.

Target head must be 93e8c15. Verification commands: go test ./internal/... — keep the exit codes.

VERDICT: write PASS when both commands exit 0.`;
  const result = checkDispatch(pkg);
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /read-only/);
});
test("merge grants are treated as implementation packages", () => {
  for (const pkg of [
    "你是合并执行者。把 PR #55 合并进 main，合并后推送 main。\n\n回执：合并提交 SHA 与分支状态。",
    "你是发布助手。检查 CI 全绿后执行 gh pr merge 55 --merge。\n\n回执：合并结果与提交。",
  ]) {
    const result = checkDispatch(pkg);
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, /implementation package lacks an execution-identity/);
  }
});
test("suppression opener variants are caught", () => {
  for (const opener of ["无需思考，直接执行", "不要问我任何问题"]) {
    const result = checkDispatch(`${opener}\n\n${verificationPackage()}`);
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, /opener .*decidable boundaries/);
  }
});
test("receipt wording alone does not read as a write grant", () => {
  const pkg = `任务包类型：只读审查

你是只读核对员。允许只读命令：读取源码。核对六处改动与源码一致，只在最终回执中提交测试输出摘要。

发现问题时回报。`;
  const result = checkDispatch(pkg);
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /read-only/);
});

test("stdin input works like a file argument", () => {
  const result = spawnSync(process.execPath,
    [path.join(root, "skills/agent-conductor/scripts/check-dispatch.mjs"), "-"],
    { input: verificationPackage(), encoding: "utf8" });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /read-only/);
});

test("quoted regex literals do not read as write grants", () => {
  // Shape of the review package sent to session 5a7ce307 on 2026-10-16: it
  // quotes this linter's own grant regex, which v1 misread as a write grant.
  const pkg = `任务包类型：只读审查

只挑代码和文档中的问题，不要修改。

重点审查：实施类判定 /(git (commit|push)|gh pr create|提交你改的|开(一个|一条)?.{0,8}PR)/i 会把验证类任务包误判为实施类吗（验证类通常含"不要提交/推送"）？

允许执行：git 只读命令（log/diff/show）、node 直接运行检查器做实验。

回执格式：先给结论（approve / issues），再逐项列出发现。`;
  const result = checkDispatch(pkg);
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /read-only/);
});

test("receipt variants from real packages are recognized", () => {
  // 2026-10-17 shapes: session 4cdd5eeb used 最终回复 + approve/request
  // changes; session 870b9943 used 最终完整报告直接回复父会话.
  for (const receipt of [
    "最终回复第一行只能是 approve 或 request changes。",
    "最终完整报告直接回复父会话，宿主自动回传。",
  ]) {
    const pkg = `任务包类型：只读审查\n\n只读审查未提交 diff。允许只读命令：git diff、读取源码。\n\n${receipt}`;
    const result = checkDispatch(pkg);
    assert.equal(result.code, 0, result.output);
  }
  const withoutReceipt = checkDispatch(
    "任务包类型：只读审查\n\n只读审查未提交 diff。允许只读命令：git diff、读取源码。没有别的完成声明通道。");
  assert.equal(withoutReceipt.code, 1);
  assert.match(withoutReceipt.output, /receipt/);
});

test("file-write grants are treated as implementation packages", () => {
  // Shape of the packages sent to sessions 141a538a/83ff5cc8 on 2026-10-17:
  // product-file writes with no VCS wording; v1 classified them read-only.
  const pkg = `任务包类型：实施

实现持久 journal。自身执行，不再分工；你不是唯一写者，禁止覆盖他人改动。产品唯一写入：firmware/grokbot/main/voice_journal.cpp（新建）、firmware/grokbot/tests/voice_journal_test.cpp（新建）。

失败基线：现 voice.cpp 阻塞 Read 时不能 Idle，基线证明已落盘；journal 是新模块，完成判定为对上述行为有可观察验证。

允许编译运行你拥有的测试于 /tmp。最终报告回执父会话。禁止commit/push。`;
  const result = checkDispatch(pkg);
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /implementation/);
  const undeclared = checkDispatch(pkg.replace("任务包类型：实施\n\n", ""));
  assert.match(undeclared.output, /implementation/);
  const noBaseline = checkDispatch(pkg.replace(/失败基线：[^\n]*/, ""));
  assert.equal(noBaseline.code, 1, noBaseline.output);
  assert.match(noBaseline.output, /failure baseline/);
});

test("declared type conflicting with granted writes is rejected", () => {
  const pkg = `任务包类型：只读审查

审查该 PR。允许只读命令：git diff、读取源码。检查通过后 git push 并用 gh pr create 开一个 PR。

回执：结论与 PR URL。`;
  const result = checkDispatch(pkg);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /declared read-only\/review but the text grants writes/);
});

test("unrecognized and missing package types are rejected", () => {
  for (const [pkg, diagnostic] of [
    ["任务包类型：调研\n\n允许只读命令：读取源码。发现问题时回报。", /unrecognized package type/],
    ["允许只读命令：读取源码。发现问题时回报。", /no package-type declaration/],
    // Real 2026-10-18 sample (session 0923abac, analyze-native-launch.md): the
    // v2 substring branch /只读|审查|验证/ silently accepted this value.
    ["任务包类型：只读调查\n\n你是核对员。允许只读命令：读取源码。\n\n发现问题时回报。", /unrecognized package type "只读调查"/],
  ]) {
    const result = checkDispatch(pkg);
    assert.equal(result.code, 1);
    assert.match(result.output, diagnostic);
  }
});

test("declared review packages need a command boundary", () => {
  // Shape of the package sent to session 0f57c6c8 on 2026-10-17: it listed two
  // ordered commands but no allowed-command boundary; a sibling reviewer then
  // ran unscoped go vet/go test.
  const pkg = `任务包类型：只读审查

只挑代码和文档中的冗余。不要修改任何文件，不要提交，不要推送，不要切分支。先跑 git show --stat bb23e19 和 git show bb23e19。

最终回复第一行只能是 approve 或 request changes。`;
  const result = checkDispatch(pkg);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /command boundary/);
  const fixed = pkg.replace("先跑 git show --stat bb23e19 和 git show bb23e19。",
    "允许只读命令：git show、git diff、读取源码。");
  assert.equal(checkDispatch(fixed).code, 0, checkDispatch(fixed).output);
});

test("review packages quoting audited grants are not misread as write grants", () => {
  // Adversarial shapes from the 2026-10-17 review of this branch: prose
  // citations of the audited package's boundaries and denials must not read
  // as grants of this package.
  for (const pkg of [
    `任务包类型：只读审查

你是 PR #64 的独立审查者。被审实施包声明「只能改 src/entry/ 下的文件，产品唯一写入 main.cpp」，请核对该边界是否被遵守，并确认作者是否按流程用 gh pr create 开 PR、未私自 git push。

允许只读命令：git diff、git show、读取源码。

回执：第一行 approve 或 request changes，逐项列发现。`,
    `任务包类型：只读审查

审查未提交 diff。核对作者没有 git push、没有提交你改的文件到远端，范围仅限工作区。

允许只读命令：git diff、读取源码。

回执：第一行 approve 或 request changes。`,
  ]) {
    const result = checkDispatch(pkg);
    assert.equal(result.code, 0, result.output);
    assert.match(result.output, /read-only/);
  }
});

test("bare boundary words do not satisfy the command-boundary check", () => {
  // The word 验证命令 mentioned in prose (SKILL step-4 wording itself) must
  // not count as a boundary; the list form needs a colon.
  const pkg = `任务包类型：只读审查

只挑代码问题，不要修改。协调者已确认验证命令不与禁止事项冲突，按你的判断自由检查。

回执：第一行 approve 或 request changes。`;
  const result = checkDispatch(pkg);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /command boundary/);
});

test("alternative boundary wordings pass", () => {
  // Real wordings seen in 2026-10-17 packages: 可用 X/Y/Z 运行 (dc7d1548
  // line), 可以执行的命令 (adversarial), 验证命令在…运行： (f1da85e9).
  for (const boundary of [
    "可用 rg/cat/git diff 和 .venv Python 运行临时数据库检查（仅 /tmp 瞬态写入）。",
    "可以执行的命令：git diff、git show、读取源码。不跑任何其他东西。",
    "验证命令在 studio/ 目录运行：两条 go test 命令。",
  ]) {
    const pkg = `任务包类型：只读审查\n\n审查未提交 diff。${boundary}\n\n回执：第一行 approve 或 request changes。`;
    const result = checkDispatch(pkg);
    assert.equal(result.code, 0, result.output);
  }
});

test("type declarations must lead the package and appear exactly once", () => {
  for (const [pkg, diagnostic] of [
    [`你是 PR #70 的审查者。审查 HEAD 快照 fc65b5e。\n任务包类型：只读审查\n允许只读命令：git diff、读取源码。\n回执：结论与逐项发现。`, /must be the first line/],
    [`任务包类型：只读审查\n\n你是审查者。允许只读命令：git diff、读取源码。\n\n任务包类型：实施\n\n回执：结论。`, /duplicate package-type declaration/],
    [`任务包类型：不实施任何改动\n\n你是核对员。允许只读命令：读取源码。发现问题时回报。`, /unrecognized package type/],
  ]) {
    const result = checkDispatch(pkg);
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, diagnostic);
  }
});

test("long quoted regex literals and 最终结论 receipts are handled", () => {
  const pkg = `任务包类型：只读审查

只挑问题，不要修改。重点审查该正则 /(git (commit|push)|${"x".repeat(300)}|提交你改的)/i 的字面分支是否过宽。

允许只读命令：读取源码。

最终结论：approve 或 request changes，附逐项发现。`;
  const result = checkDispatch(pkg);
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /read-only/);
});

