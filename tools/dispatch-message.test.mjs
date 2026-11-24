import assert from "node:assert/strict";
import test from "node:test";

import { run } from "./contracts-lib.mjs";

const checkMessage = (text) => run("skills/agent-conductor/scripts/check-dispatch.mjs", text, "--message");

test("clean pointer dispatch messages pass", () => {
  // Expected shape: package pointer plus receipt requirement, nothing else.
  const msg = `请完整读取并执行任务包 /workspace/example-app/.tasks/task-v2.md，在包指定的独立工作区接续实施，最终提供包内指定的完整 result.md 回执。`;
  const result = checkMessage(msg);
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /dispatch message: 0 problems/);
});

test("English completion replies are recognized without hiding other defects", () => {
  // Multi-clause English completion receipt phrasing.
  const receipt = "When done, reply with: the file path, the list of links you created, and any place where you had to make a judgment call about terminology.";
  const valid = checkMessage(`Read and execute the task package ./tasks/translate.md. ${receipt}`);
  assert.equal(valid.code, 0, valid.output);
  const missingPointer = checkMessage(`Write the English README. ${receipt}`);
  assert.equal(missingPointer.code, 1, missingPointer.output);
  assert.match(missingPointer.output, /no package pointer/);
  assert.doesNotMatch(missingPointer.output, /no receipt requirement/);
});

test("English receipt wording also works in a bounded package", () => {
  const result = run("skills/agent-conductor/scripts/check-dispatch.mjs", `package type: verification
Allowed commands: git diff --check.
When done, reply with: command results and unresolved issues.`);
  assert.equal(result.code, 0, result.output);
});

test("mentioning an English reply without requesting one is insufficient", () => {
  for (const ending of ["The previous reply with results is archived.", "Read the reply format."]) {
    const result = checkMessage(`Read and execute the package ./tasks/translate.md. ${ending}`);
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, /no receipt requirement/);
  }
});

test("suppression openers in dispatch messages are rejected", () => {
  // A suppression opener placed in the covering message instead of the
  // package file must still be caught by message mode.
  const msg = `只执行任务，不要进行额外的思考，不要自作主张

请完整读取并执行任务包 /workspace/example-app/.tasks/task-v2.md，在包指定的独立工作区接续实施，最终提供包内指定的完整 result.md 回执。`;
  const result = checkMessage(msg);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /execution-suppression opener .* in dispatch message/);
});

test("post-deploy long-session dispatch with prepended suppression is rejected", () => {
  // Even when a clean pointer message was saved first, prepending an old
  // suppression opener at send time must be rejected.
  const msg = `只执行任务，不要进行额外的思考，不要自作主张

请读取 /workspace/example-app/.tasks/go-task.md 执行，并按任务包要求返回最终回执。`;
  const result = checkMessage(msg);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /execution-suppression opener .* in dispatch message/);
});

test("ad-hoc dispatch with inline package and suppression opener is rejected", () => {
  // An inline package sent without package-type declaration and carrying a
  // suppression opener must fail both the pointer check and opener checks.
  const msg = `只执行任务，不要进行额外的思考，不要自作主张

你是 example-repo 仓库的实施者，由你自身执行。确需再分工先回报协调者重派。仓库在 /tmp/example-repo。当前分支必须是 feat-first-run，HEAD 必须是 006ff48。

目标：首次打开工作台时打开任务页，只显示环境准备卡。

只改这些文件：
app/internal/pages/window.go
docs/subsystems/panel.md

不要提交，不要推送，不要开 PR。不要改上述清单以外的文件。

完成回执写回本会话：改了哪些文件、测试命令与结果、未改的范围。不要提交。`;
  const result = checkMessage(msg);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /no package pointer/);
  assert.match(result.output, /execution-suppression opener/);
  assert.match(result.output, /thought-suppression opener/);
  assert.match(result.output, /blanket no-initiative opener/);
  assert.match(result.output, /dispatch message: 4 problems/);
});

test("boundary clauses in dispatch messages are rejected", () => {
  // Pointer and receipt are present, but 禁止-class boundary clauses belong
  // in the package file rather than the dispatch message.
  const msg = `请自身执行只读原生启动边界定位。先完整读 /workspace/example-app/.tasks/analyze-native-launch.md，按指定源码和日志给事实、推导及最小验证。严禁启动测试或应用、写文件、再派发。最终回执由Operation自动回传。`;
  const result = checkMessage(msg);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /prohibition\/boundary clauses/);
});

test("dispatch messages need a package pointer and a receipt requirement", () => {
  for (const [msg, diagnostic] of [
    ["请审查当前 diff，最终回复给出结论。", /no package pointer/],
    ["请完整读取并执行任务包 /workspace/example-app/tasks/implement.md。", /no receipt requirement/],
  ]) {
    const result = checkMessage(msg);
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, diagnostic);
  }
});

test("light boundary phrasing in dispatch messages is tolerated", () => {
  // A light decidable scope line like 只挑…不要修改 carries no 禁止-class
  // clause, so message mode lets it pass.
  const msg = `只挑代码和文档中的问题，不要修改

请读取任务包 /workspace/example-app/.tasks/review-r1.md 并按包执行。回执：第一行 approve 或 request changes。`;
  const result = checkMessage(msg);
  assert.equal(result.code, 0, result.output);
});

test("inline-package dispatch messages keep package terms but shed suppression openers", () => {
  // Inline fallback (no shared file): the message is led by its type
  // declaration, so package terms like 禁止 are expected in the message and the
  // boundary-clause check is skipped — but suppression openers still reject.
  const inline = `任务包类型：只读审查

你是核对员。允许只读命令：git diff、读取源码。禁止修改文件、禁止提交。

回执：第一行 approve 或 request changes。`;
  assert.equal(checkMessage(inline).code, 0, checkMessage(inline).output);
  const suppressed = `只执行任务，不要进行额外的思考，不要自作主张

${inline}`;
  const result = checkMessage(suppressed);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /execution-suppression opener/);
});

test("common compounds are exempted from the prohibition pattern", () => {
  // 不得不/不得已 are ordinary Chinese compounds, not boundary clauses;
  // bare 不得 stays rejected.
  const msg = `时间紧张不得不缩小范围。请执行 /workspace/example-app/pkg.md，最终回复给回执。`;
  assert.equal(checkMessage(msg).code, 0, checkMessage(msg).output);
  const boundary = `请执行 /workspace/example-app/pkg.md，不得修改任何文件，最终回复给回执。`;
  const result = checkMessage(boundary);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /prohibition\/boundary clauses/);
});

test("incidental markdown references are not a package pointer", () => {
  // Incidental document paths hundreds of characters into a task body must
  // not pass as package pointers when no package execution cue leads them.
  const msg = `任务：检查项目文档是否最新。

背景：${"上一轮已更新玩法、设计稿与验证记录，本轮只核对残留。".repeat(12)}README.md 与 docs/usage.md 的主体已更新。

最终回复给出回执。`;
  const result = checkMessage(msg);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /no package pointer/);
});

test("source-document references near the start are not task packages", () => {
  // Source paths given as context are not a task package.
  const source = "You are writing the English usage guide (read docs/usage.md first, it is the Chinese source; also skim docs/design/save-migration.md for context).";
  const result = checkMessage(`${source}\nWhen done, reply with: the file path.`);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /no package pointer/);
  assert.doesNotMatch(result.output, /no receipt requirement/);
  const valid = checkMessage(`${source}\nRead and execute the task package ./tasks/translate.md. When done, reply with: results.`);
  assert.equal(valid.code, 0, valid.output);
});

test("a task-package pointer later in the message still counts", () => {
  const msg = `${"范围说明：只核对文档，不改代码。".repeat(20)}
请读取任务包 /workspace/example-app/tasks/impl.md，最终回复给回执。`;
  const result = checkMessage(msg);
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /dispatch message: 0 problems/);
});

test("dispatch messages reject Round 4+ review dispatches and same-session review continuation", () => {
  const r3 = checkMessage("请读取任务包 /workspace/example-app/.tasks/review-r3.md 并按包执行。回执：第一行 approve 或 request changes。");
  assert.equal(r3.code, 0, r3.output);
  for (const [msg, diagnostic] of [
    ["请读取任务包 /workspace/example-app/.tasks/review-r4.md 进行第 4 轮复审。回执：approve 或 request changes。", /3-round/],
    ["已推送新提交，请读取任务包 /workspace/example-app/.tasks/review-r2.md 并在同一会话复审。回执：approve 或 request changes。", /fresh session/],
  ]) {
    const result = checkMessage(msg);
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, diagnostic);
  }
});
