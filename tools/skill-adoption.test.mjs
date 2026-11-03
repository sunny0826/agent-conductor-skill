import assert from "node:assert/strict";
import test from "node:test";

import { run } from "./contracts-lib.mjs";

function state() {
  return {
    goals: [{ id: "G1", source: "User: fix the parser regression", status: "active",
      acceptance: [{ id: "A1", expected: "Invalid input is rejected", status: "passed",
        observed: "The regression check rejects invalid input", evidence: ["checks.log"] }] }],
    tasks: [{ id: "T1", goal: "G1", owner: "worker", workspace: "checkout", status: "done",
      writes: ["src/parser.mjs"], constraints: [], evidence: ["result.md"],
      skill_review: {
        assessed_by: "coordinator", catalog_evidence: ["session:catalog"],
        selection_reason: "A local regression check is available, so tdd applies",
        skills: [{
          name: "tdd", applicability: "required", reason: "Reproduce the parser regression before fixing it",
          reading: {
            sources: ["skills/tdd/SKILL.md"], read_at: "2026-10-29T06:00:00Z",
            evidence: ["session:read-skill"],
            freshness: { status: "confirmed", reason: "Installed content matches the current authoritative source",
              evidence: ["deployment-comparison.json"] },
          },
          requirements: [{ id: "R1", expected: "The same regression fails before and passes after the fix",
            status: "verified", observed: "The same command failed on invalid acceptance, then passed",
            evidence: ["before.log", "after.log"],
            review: { by: "coordinator", evidence: ["review.md#same-command-and-target-failure"] } }],
        }],
      } }],
  };
}

const check = (value, ...args) => run("skills/agent-conductor/scripts/check-task-state.mjs", JSON.stringify(value), ...args);
const skill = (value) => value.tasks[0].skill_review.skills[0];
const requirement = (value) => skill(value).requirements[0];

test("current skill requirements with execution and review evidence can complete", () => {
  const result = check(state(), "--complete");
  assert.equal(result.code, 0, result.output);
});

test("legacy records remain readable but active completion needs a skill assessment", () => {
  const value = state();
  delete value.tasks[0].skill_review;
  assert.equal(check(value).code, 0);
  const result = check(value, "--complete");
  assert.equal(result.code, 1);
  assert.match(result.output, /T1.*skill_review/);
});

test("recording a skill name without reading or requirements cannot prove adoption", () => {
  const value = state();
  delete skill(value).reading;
  skill(value).requirements = [];
  const result = check(value, "--complete");
  assert.equal(result.code, 1);
  assert.match(result.output, /tdd.*reading/);
  assert.match(result.output, /tdd.*requirements/);
});

test("honest pending skill work is allowed until completion", () => {
  const value = state();
  value.tasks[0].status = "running";
  delete skill(value).reading;
  skill(value).requirements = [];
  const result = check(value);
  assert.equal(result.code, 0, result.output);
  assert.equal(check(value, "--complete").code, 1);
});

test("reading alone cannot pass an unperformed requirement", () => {
  const value = state();
  Object.assign(requirement(value), { status: "pending", observed: "", evidence: [] });
  delete requirement(value).review;
  const result = check(value, "--complete");
  assert.equal(result.code, 1);
  assert.match(result.output, /R1.*pending/);
});

test("execution evidence needs a checked result before completion", () => {
  const value = state();
  requirement(value).status = "applied";
  delete requirement(value).review;
  const result = check(value, "--complete");
  assert.equal(result.code, 1);
  assert.match(result.output, /R1.*applied/);
});

test("verified claims require both execution evidence and a review record", () => {
  for (const remove of [
    (r) => { r.observed = ""; },
    (r) => { r.evidence = []; },
    (r) => { delete r.review; },
    (r) => { r.review.by = ""; },
    (r) => { r.review.evidence = []; },
  ]) {
    const value = state();
    remove(requirement(value));
    const result = check(value, "--complete");
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, /R1/);
  }
});

test("a skill cannot be current merely because a local copy was read", () => {
  const value = state();
  skill(value).reading.freshness = { status: "unconfirmed", reason: "The authoritative source is unavailable", evidence: [] };
  value.tasks[0].status = "running";
  requirement(value).status = "applied";
  delete requirement(value).review;
  assert.equal(check(value).code, 0);
  const result = check(value, "--complete");
  assert.equal(result.code, 1);
  assert.match(result.output, /tdd.*freshness.*unconfirmed/);
});

test("confirmed freshness needs a comparison reference and reason", () => {
  for (const field of ["evidence", "reason"]) {
    const value = state();
    skill(value).reading.freshness[field] = field === "evidence" ? [] : "";
    const result = check(value);
    assert.equal(result.code, 1);
    assert.match(result.output, /freshness/);
  }
});

test("reading records identify sources, time and the actual read evidence", () => {
  for (const change of [
    (r) => { r.sources = []; },
    (r) => { r.read_at = "recently"; },
    (r) => { r.read_at = "2026-10-29T06:00:00"; },
    (r) => { r.evidence = []; },
  ]) {
    const value = state();
    change(skill(value).reading);
    const result = check(value);
    assert.equal(result.code, 1);
    assert.match(result.output, /reading/);
  }
});

test("a justified empty selection is valid without inventing skill use", () => {
  const value = state();
  value.tasks[0].skill_review.skills = [];
  value.tasks[0].skill_review.selection_reason = "The bounded factual lookup matches no catalog trigger";
  const result = check(value, "--complete");
  assert.equal(result.code, 0, result.output);
});

test("selection must show who checked the current catalog and why", () => {
  for (const field of ["assessed_by", "catalog_evidence", "selection_reason"]) {
    const value = state();
    delete value.tasks[0].skill_review[field];
    const result = check(value);
    assert.equal(result.code, 1);
    assert.match(result.output, /skill_review/);
  }
});

test("excluded candidates preserve the trigger decision without reading every skill", () => {
  const value = state();
  value.tasks[0].skill_review.skills.push({ name: "control-ui", applicability: "not_applicable",
    reason: "This parser has no UI surface", requirements: [] });
  const result = check(value, "--complete");
  assert.equal(result.code, 0, result.output);
  value.tasks[0].skill_review.skills[1].reason = "";
  assert.equal(check(value, "--complete").code, 1);
});

test("skipping a requirement needs a checked explanation", () => {
  const value = state();
  skill(value).requirements.push({ ...structuredClone(requirement(value)), id: "R2" });
  Object.assign(requirement(value), { status: "not_applicable", observed: "This assigned candidate does not organize other agents",
    evidence: [], review: { by: "coordinator", evidence: ["task-package.md#candidate-scope"] } });
  assert.equal(check(value, "--complete").code, 0);
  delete requirement(value).review;
  assert.equal(check(value, "--complete").code, 1);
});

test("excluding every requirement requires reassessing applicability", () => {
  const value = state();
  Object.assign(requirement(value), { status: "not_applicable", observed: "The candidate has no implementation scope" });
  const result = check(value, "--complete");
  assert.equal(result.code, 1);
  assert.match(result.output, /no applicable requirements/);
});

test("blocked requirements stay visible instead of being counted as adopted", () => {
  const value = state();
  Object.assign(requirement(value), { status: "blocked", observed: "Test dependency is unavailable", evidence: [] });
  delete requirement(value).review;
  value.tasks[0].status = "blocked";
  assert.equal(check(value).code, 0);
  const result = check(value, "--complete");
  assert.equal(result.code, 1);
  assert.match(result.output, /R1.*blocked/);
});

test("newly discovered requirements invalidate a premature completion claim", () => {
  const value = state();
  skill(value).reading.sources.push("skills/tdd/references/new-check.md");
  skill(value).requirements.push({ id: "R2", expected: "Check the newly identified consumer", status: "pending", observed: "", evidence: [] });
  const result = check(value, "--complete");
  assert.equal(result.code, 1);
  assert.match(result.output, /R2.*pending/);
});

test("historical and cancelled tasks do not acquire retrospective obligations", () => {
  const value = state();
  const historical = structuredClone(value.tasks[0]);
  delete historical.skill_review;
  value.goals.push({ id: "G0", source: "Earlier request", status: "superseded", acceptance: [] });
  value.goals[1].acceptance = structuredClone(value.goals[0].acceptance);
  value.tasks.push({ ...historical, id: "T0", goal: "G0" });
  value.tasks.push({ ...historical, id: "T2", status: "stopped", evidence: ["stop-receipt"] });
  const result = check(value, "--complete");
  assert.equal(result.code, 0, result.output);
});

test("malformed records, duplicate skills and contradictory decisions are rejected", () => {
  for (const change of [
    (s) => { s.tasks[0].skill_review = null; },
    (s) => { s.tasks[0].skill_review.skills = {}; },
    (s) => { s.tasks[0].skill_review.skills.push(structuredClone(skill(s))); },
    (s) => { skill(s).applicability = "maybe"; },
    (s) => { skill(s).requirements.push(structuredClone(requirement(s))); },
    (s) => { skill(s).requirements = [null]; },
    (s) => { skill(s).applicability = "not_applicable"; },
    (s) => { requirement(s).status = "passed"; },
  ]) {
    const value = state();
    change(value);
    const result = check(value);
    assert.equal(result.code, 1, result.output);
    assert.doesNotMatch(result.output, /TypeError|ReferenceError/);
  }
});
