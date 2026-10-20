import assert from "node:assert/strict";
import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { checkDeployment } from "./check-deployment.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS = path.join(ROOT, "skills");
const SAMPLE = "bro";

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "skill-deploy-"));
  await cp(path.join(SKILLS, SAMPLE), path.join(root, SAMPLE), { recursive: true });
  return root;
}

function check(root, skills = [SAMPLE]) {
  return checkDeployment({ skillsBase: SKILLS, deployRoot: root, skills });
}

test("matching deployment passes", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const report = await check(root);
  assert.equal(report.error, null);
  assert.equal(report.ok, true);
  assert.equal(report.results[0].status, "ok");
});

test("a modified file is reported as drift", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, SAMPLE, "SKILL.md"), "changed\n", { flag: "a" });
  const report = await check(root);
  assert.equal(report.ok, false);
  assert.deepEqual(report.results[0].modified, ["SKILL.md"]);
});

test("an extra deployed file is reported as drift", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, SAMPLE, "stale.md"), "stale\n");
  const report = await check(root);
  assert.equal(report.ok, false);
  assert.deepEqual(report.results[0].extra, ["stale.md"]);
});

test("a missing deployed skill is reported", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const report = await check(root, ["rigor"]);
  assert.equal(report.ok, false);
  assert.equal(report.results[0].status, "missing");
});

test("a missing deploy root is an error", async () => {
  const report = await check(path.join(tmpdir(), "skill-deploy-does-not-exist"));
  assert.equal(report.ok, false);
  assert.match(report.error, /deploy root not found/);
});

test("host files such as .DS_Store do not count as drift", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, SAMPLE, ".DS_Store"), "");
  const report = await check(root);
  assert.equal(report.ok, true);
});

test("an unknown skill name is reported", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const report = await check(root, ["not-a-skill"]);
  assert.equal(report.ok, false);
  assert.equal(report.results[0].status, "unknown");
});
