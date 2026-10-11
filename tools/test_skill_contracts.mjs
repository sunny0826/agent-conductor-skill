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
test("high-risk plan with two audits is accepted", () => {
  assert.equal(checkPlan(plan(10, "high", 2)).code, 0);
});
test("CLI plans do not require screenshots or video", () => {
  const text = plan().replace(/\*\*Review gate\.\*\*[\s\S]*?(?=\*\*Merge\.\*\*)/,
    "**Review gate.** None. CLI is not review-gated.\n\n");
  assert.equal(checkPlan(text).code, 0);
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
