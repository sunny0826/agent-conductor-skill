import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const template = fs.readFileSync(path.join(root, "skills/rigor/assets/plan-template.md"), "utf8");

function run(script, content, ...args) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "skill-contract-"));
  try {
    const input = path.join(dir, "input");
    fs.writeFileSync(input, content);
    const result = spawnSync(process.execPath, [path.join(root, script), input, ...args], { encoding: "utf8" });
    assert.ifError(result.error);
    return { code: result.status, output: result.stdout + result.stderr };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function plan(count = 3, risk = "low", audits = 1) {
  const header = template.match(/\*\*Verify, live\.\*\*[^\n]+/)[0];
  const rule = header.slice(0, header.indexOf("checked.") + "checked.".length);
  const lanes = Array.from({ length: count }, (_, i) =>
    `- [ ] Lane ${i + 1}. ${i === 0 ? "Regression lane against trunk." : "Reject malformed input."} Save \`evidence/${i + 1}.log\`. Pass when the CLI returns the expected status.`).join("\n");
  return template.replace(/\*\*Verify, live\.\*\*[\s\S]*?(?=\*\*Verify, perf\.\*\*)/,
    `${rule} ${count} lanes on \`configured-model\` at the PR head.\n\nRisk: ${risk}\nCoverage: CLI success, rejection, and trunk regression; no UI or concurrent writes.\nAudit lanes: ${audits}\n\n${lanes}\n\n`);
}

const checkPlan = (text) => run("skills/rigor/scripts/check-plan.mjs", text);

test("three low-risk CLI scenarios and one audit are accepted", () => {
  assert.equal(checkPlan(plan()).code, 0);
});
test("performance not applicable uses the four fields without fabricated measurements", () => {
  const text = plan().replace(/^- \[ \] (Metric|Probe|Baseline|Rule)\. .*$/gm,
    "- [ ] $1. N/A — Only documentation links change; no executable workload changes.");
  const result = checkPlan(text);
  assert.equal(result.code, 0, result.output);
});
test("high-risk plan with two audits is accepted", () => {
  assert.equal(checkPlan(plan(10, "high", 2)).code, 0);
});
test("CLI plans do not require screenshots", () => {
  const text = plan().replace(/\*\*Review gate\.\*\*[\s\S]*?(?=\*\*Merge\.\*\*)/,
    "**Review gate.** None. CLI is not review-gated.\n\n");
  assert.equal(checkPlan(text).code, 0);
});
test("UI review gates accept screenshots without a recording", () => {
  const text = plan().replace(/\*\*Review gate\.\*\*[\s\S]*?(?=\*\*Merge\.\*\*)/,
    "**Review gate.** UI review.\n\n- [ ] Capture before and after screenshots with control-ui.\n- [ ] Show the evidence to the operator and wait for the agreed review.\n\n");
  const result = checkPlan(text);
  assert.equal(result.code, 0, result.output);
});
test("UI review gates still require screenshots and operator review", () => {
  for (const [body, missing] of [
    ["- [ ] Wait for the operator.", "screenshot"],
    ["- [ ] Save screenshots.", "operator"],
  ]) {
    const text = plan().replace(/\*\*Review gate\.\*\*[\s\S]*?(?=\*\*Merge\.\*\*)/,
      `**Review gate.** UI review.\n\n${body}\n\n`);
    const result = checkPlan(text);
    assert.equal(result.code, 1);
    assert.ok(result.output.includes(`Review gate lacks "${missing}"`), result.output);
  }
});
test("scaled plans still require coverage, numbering, artifacts and predicates", () => {
  for (const [text, diagnostic] of [
    [plan().replace(/^Coverage:.*\n/m, ""), /Coverage/],
    [plan().replace("Lane 2.", "Lane 1."), /number/],
    [plan().replace("Save `evidence/2.log`.", ""), /evidence artifact/],
    [plan().replace("Pass when the CLI returns the expected status.", ""), /pass predicate/],
    [plan(10, "high", 1), /audit/i],
    [plan().replace("Risk: low", "Risk: unknown"), /Risk/],
    [plan().replace("3 lanes on", "0 lanes on"), /lane/i],
    [plan().replace("3 lanes on", "-3 lanes on"), /lane/i],
  ]) {
    const result = checkPlan(text);
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, diagnostic);
  }
});

function state() {
  return {
    goals: [{ id: "G1", source: "User: verify the two-bundle report contains 19 files", status: "active",
      acceptance: [{ id: "A1", expected: "Two bundles and report: 19 files", status: "pending", observed: "", evidence: [] }] }],
    tasks: [{ id: "T1", goal: "G1", owner: "worker", workspace: "checkout-1", status: "running",
      writes: ["src/model.py"], constraints: ["No external downloads"], evidence: [] }],
  };
}
const checkState = (value, ...args) => run("skills/agent-conductor/scripts/check-task-state.mjs", JSON.stringify(value), ...args);

test("in-progress state is valid but cannot be delivered as complete", () => {
  assert.equal(checkState(state()).code, 0);
  const result = checkState(state(), "--complete");
  assert.equal(result.code, 1);
  assert.match(result.output, /A1.*pending/);
});
test("user correction invalidates active work for the superseded goal", () => {
  const value = state();
  value.goals[0].status = "superseded";
  const result = checkState(value);
  assert.equal(result.code, 1);
  assert.match(result.output, /T1.*superseded/);
  value.tasks[0].status = "stopped";
  value.tasks[0].evidence = ["session://worker stop acknowledgement"];
  assert.equal(checkState(value).code, 0);
});
test("coordinator cannot claim a concurrent worker-owned path", () => {
  const value = state();
  value.tasks.push({ ...value.tasks[0], id: "T2", owner: "coordinator", writes: ["src"] });
  const result = checkState(value);
  assert.equal(result.code, 1);
  assert.match(result.output, /T1.*T2.*overlap/);
  value.tasks[0].status = "stopped";
  value.tasks[0].evidence = ["session://worker stop acknowledgement"];
  assert.equal(checkState(value).code, 0);
});
test("independent workspaces may use the same relative path", () => {
  const value = state();
  value.tasks.push({ ...value.tasks[0], id: "T2", workspace: "checkout-2" });
  assert.equal(checkState(value).code, 0);
});
test("completion requires observed results and evidence for every acceptance item", () => {
  const value = state();
  value.tasks[0].status = "done";
  value.tasks[0].evidence = ["checks.json"];
  value.goals[0].acceptance[0].status = "passed";
  assert.equal(checkState(value, "--complete").code, 1);
  Object.assign(value.goals[0].acceptance[0], { observed: "Two bundles and report: 19 files", evidence: ["inventory.json"] });
  assert.equal(checkState(value, "--complete").code, 0);
  value.goals[0].acceptance.push({ id: "A2", expected: "Independent review", status: "blocked", observed: "dispatch failed", evidence: [] });
  const result = checkState(value, "--complete");
  assert.equal(result.code, 1);
  assert.match(result.output, /A2.*blocked/);
});
test("malformed or empty state cannot pass", () => {
  for (const value of [{}, { goals: [], tasks: [] }, { goals: null, tasks: [] }]) {
    const result = checkState(value);
    assert.equal(result.code, 1);
    assert.match(result.output, /goals|goal/);
  }
});
test("unknown goals, duplicate task ids and ambiguous paths are rejected", () => {
  for (const [change, diagnostic] of [
    [(s) => { s.tasks[0].goal = "missing"; }, /unknown goal/],
    [(s) => { s.tasks.push({ ...s.tasks[0] }); }, /duplicate id/],
    [(s) => { s.tasks[0].writes = ["../src/model.py"]; }, /normalized relative paths/],
    [(s) => { s.tasks[0].writes = ["src/*.py"]; }, /without globs/],
    [(s) => { s.tasks[0].status = "stopped"; }, /stop acknowledgement/],
  ]) {
    const value = state();
    change(value);
    const result = checkState(value);
    assert.equal(result.code, 1);
    assert.match(result.output, diagnostic);
  }
});

const checkDispatch = (text) => run("skills/agent-conductor/scripts/check-dispatch.mjs", text);

function verificationPackage() {
  return `你是 PR #55 的独立 gates lane。你不是作者。不要修改产品代码，不要提交，不要推送。

目标 head 必须是 93e8c15。用 git rev-parse HEAD 核对，不一致就停，裁决 BLOCKED。

在 studio/ 目录跑两条 go test 命令，保留完整输出和退出码。

裁决：两条命令退出码 0 且 HEAD 正确写 PASS，否则写 ISSUES 或 BLOCKED。回复以 VERDICT、HEAD、EVIDENCE 三行开头。`;
}
function implementationPackage() {
  return `你是 studio-shell 这一个 PR 的 owner。角色是 worker+。执行身份：被派会话自身执行，确需再分工先回报协调者重派。

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
  const pkg = `You are an independent gates lane for PR #55. You are not the author. git push, git commit, gh pr merge: all forbidden. Do not modify any file.

Target head must be 93e8c15. Run go test ./internal/... and keep the exit codes.

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
  const result = checkDispatch("你是只读核对员。核对六处改动与源码一致，只在最终回执中提交测试输出摘要。\n\n发现问题时回报。");
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /read-only/);
});
