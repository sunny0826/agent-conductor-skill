import assert from "node:assert/strict";
import test from "node:test";

import { run } from "./contracts-lib.mjs";

const checkMessage = (text) => run("skills/agent-conductor/scripts/check-dispatch.mjs", text, "--message");

test("clean pointer dispatch messages pass", () => {
  // Real 2026-10-18 shape (session 70f7879c with the suppression opener
  // removed): package pointer plus receipt requirement, nothing else.
  const msg = `请完整读取并执行任务包 /Users/guoxudong/codes/local-ai/inferyard/.lody/context-speed-implementation/studio-c-v2.md，在包指定的独立工作区接续实施，最终提供包内指定的完整 result.md 回执。`;
  const result = checkMessage(msg);
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /dispatch message: 0 problems/);
});

test("suppression openers in dispatch messages are rejected", () => {
  // Verbatim shape of the dispatch message sent to session 70f7879c on
  // 2026-10-18 17:18 CST: the opener migrated from packages (linted since
  // PR #9) into the covering message, which nothing checked.
  const msg = `只执行任务，不要进行额外的思考，不要自作主张

请完整读取并执行任务包 /Users/guoxudong/codes/local-ai/inferyard/.lody/context-speed-implementation/studio-c-v2.md，在包指定的独立工作区接续实施，最终提供包内指定的完整 result.md 回执。`;
  const result = checkMessage(msg);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /execution-suppression opener .* in dispatch message/);
});

test("2026-10-19 post-deploy long-session dispatch is rejected", () => {
  // Verbatim shape of the message sent to session 5305a8f1 on 2026-10-19
  // 11:19 CST, 37 minutes after the v3 checker was deployed. The forked
  // coordinator's parent started five minutes before deployment; it saved the
  // clean pointer message, then prepended the old suppression opener when
  // sending.
  const msg = `只执行任务，不要进行额外的思考，不要自作主张

请读取 /Users/guoxudong/codes/local-ai/inferyard/.tools/studio-dev-20261019/go-task.md 执行，并按任务包要求返回最终回执。`;
  const result = checkMessage(msg);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /execution-suppression opener .* in dispatch message/);
});

test("2026-10-21 experiment dispatch with inline package is rejected", () => {
  // Verbatim opener and shape of the two child sessions created by
  // a14b6d49 on 2026-10-21 03:03/03:07 CST (2ce934db / d218375e). The
  // coordinator treated the replay as ad-hoc work, so the inline package was
  // never linted; the same opener still carries three suppression problems.
  const msg = `只执行任务，不要进行额外的思考，不要自作主张

你是 InferYard 仓库的实施者，由你自身执行。确需再分工先回报协调者重派。仓库在 /private/tmp/inferyard-instruction-ab-20261021/repo。当前分支必须是 studio-first-run，HEAD 必须是 006ff48。

目标：首次打开 Studio 时打开任务页，只显示环境准备卡。

只改这些文件：
studio/internal/pages/window.go
docs/subsystems/studio-panel.md

不要提交，不要推送，不要开 PR。不要改上述清单以外的文件。

完成回执写回本会话：改了哪些文件、测试命令与结果、未改的范围。不要提交。`;
  const result = checkMessage(msg);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /execution-suppression opener/);
  assert.match(result.output, /thought-suppression opener/);
  assert.match(result.output, /blanket no-initiative opener/);
  assert.match(result.output, /dispatch message: 3 problems/);
});

test("boundary clauses in dispatch messages are rejected", () => {
  // Real 2026-10-18 shape (session 0923abac): pointer and receipt are fine, but
  // the message carries 禁止-class boundary clauses that belong in the package.
  const msg = `请自身执行只读原生启动边界定位。先完整读 /Users/guoxudong/codes/local-ai/inferyard/.lody/context-speed-implementation/analyze-native-launch.md，按指定源码和日志给事实、推导及最小验证。严禁启动XCTest或应用、写文件、再派发。最终回执由Operation自动回传。`;
  const result = checkMessage(msg);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /prohibition\/boundary clauses/);
});

test("dispatch messages need a package pointer and a receipt requirement", () => {
  for (const [msg, diagnostic] of [
    ["请审查当前 diff，最终回复给出结论。", /no package pointer/],
    ["请完整读取并执行任务包 /Users/guoxudong/codes/x/tasks/implement.md。", /no receipt requirement/],
  ]) {
    const result = checkMessage(msg);
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, diagnostic);
  }
});

test("light boundary phrasing in dispatch messages is tolerated", () => {
  // Real 2026-10-18 shape (challenge-role dispatches): the task statement
  // 只挑…不要修改 is a decidable scope line, not a suppression opener, and
  // carries no 禁止-class clause — message mode lets it pass.
  const msg = `只挑代码和文档中的问题，不要修改

请读取任务包 /Users/guoxudong/codes/local-ai/inferyard/.lody/context-speed-review/review-r1.md 并按包执行。回执：第一行 approve 或 request changes。`;
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
  // Review finding 1a (2026-10-19): 不得不/不得已 are ordinary Chinese
  // compounds, not boundary clauses; 不得 alone stays rejected.
  const msg = `时间紧张不得不缩小范围。请执行 /Users/x/pkg.md，最终回复给回执。`;
  assert.equal(checkMessage(msg).code, 0, checkMessage(msg).output);
  const boundary = `请执行 /Users/x/pkg.md，不得修改任何文件，最终回复给回执。`;
  const result = checkMessage(boundary);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /prohibition\/boundary clauses/);
});
