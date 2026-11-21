import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { root } from "./contracts-lib.mjs";

const lint = path.join(root, "tools/lint-skills.mjs");
const goodSkill = '---\nname: sample\ndescription: "用户要求示例时，给出示例。"\n---\n\n# 示例\n\n正文。\n';

function runLint(extraRoot) {
  const result = spawnSync(process.execPath, extraRoot ? [lint, "--root", extraRoot] : [lint], { encoding: "utf8" });
  return { code: result.status, output: result.stdout + result.stderr };
}

function withSkill(content, fn, { name = "sample", yaml = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lint-skills-"));
  try {
    const skill = path.join(dir, "skills", name);
    fs.mkdirSync(path.join(skill, "agents"), { recursive: true });
    fs.writeFileSync(path.join(skill, "SKILL.md"), content);
    if (yaml) fs.writeFileSync(path.join(skill, "agents/openai.yaml"), "interface: {}\n");
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("the repository passes its own lint", () => {
  const result = runLint();
  assert.equal(result.code, 0, result.output);
});

test("a well-formed skill passes", () => {
  withSkill(goodSkill, (dir) => assert.equal(runLint(dir).code, 0));
});

test("each structural rule rejects its violation", () => {
  for (const [content, diagnostic] of [
    [goodSkill.replace("用户要求示例时，给出示例。", "示例技能。"), /no trigger condition/],
    [goodSkill.replace("# 示例", "# 用户要求示例时，给出示例。"), /H1 repeats/],
    [`${goodSkill}\n运行 \`node scripts/check.mjs\`。\n`, /relative to the skill/],
    [`${goodSkill}${"字".repeat(8000)}\n`, /over the 20480 budget/],
  ]) {
    withSkill(content, (dir) => {
      const result = runLint(dir);
      assert.equal(result.code, 1, result.output);
      assert.match(result.output, diagnostic);
    });
  }
});

test("a skill without agent metadata is rejected", () => {
  withSkill(goodSkill, (dir) => assert.match(runLint(dir).output, /missing agents\/openai.yaml/), { yaml: false });
});

test("every playbook needs an index entry with routing text", () => {
  withSkill(goodSkill, (dir) => {
    const rigor = path.join(dir, "skills/rigor");
    fs.mkdirSync(path.join(rigor, "playbooks"), { recursive: true });
    fs.mkdirSync(path.join(rigor, "references"), { recursive: true });
    fs.writeFileSync(path.join(rigor, "playbooks/a.md"), "# a\n");
    fs.writeFileSync(path.join(rigor, "playbooks/b.md"), "# b\n");
    fs.writeFileSync(path.join(rigor, "references/playbooks.md"), "- [a](../playbooks/a.md)\n- [c](../playbooks/c.md)：不存在\n");
    const { output } = runLint(dir);
    assert.match(output, /playbook a has no routing text/);
    assert.match(output, /playbook b is not in/);
    assert.match(output, /lists missing playbook c/);
  });
});

test("the conductor keeps the dispatch gate reachable from its entry file", () => {
  const skill = fs.readFileSync(path.join(root, "skills/agent-conductor/SKILL.md"), "utf8");
  assert.ok(skill.includes("references/dispatch.md"));
  assert.ok(skill.includes("scripts/dispatch-gate.mjs"));
});

test("bare script paths in references/playbooks, broken anchors, and cross-skill cycles are rejected", () => {
  withSkill(goodSkill, (dir) => {
    const refDir = path.join(dir, "skills/sample/references");
    fs.mkdirSync(refDir, { recursive: true });
    fs.writeFileSync(
      path.join(refDir, "guide.md"),
      "# 指南\n\n运行 `python3 scripts/helper.py`，见 [缺失锚点](../SKILL.md#不存在的锚点)。\n",
    );
    const first = runLint(dir);
    assert.equal(first.code, 1, first.output);
    assert.match(first.output, /references\/guide\.md: script path is relative/);
    assert.match(first.output, /references\/guide\.md: broken anchor -> \.\.\/SKILL\.md#不存在的锚点/);

    // Now test cross-skill cycle detection cleanly without broken anchors.
    fs.writeFileSync(path.join(refDir, "guide.md"), "# 指南\n\n见 [other](../../other/SKILL.md)。\n");
    const other = path.join(dir, "skills/other");
    fs.mkdirSync(path.join(other, "agents"), { recursive: true });
    fs.writeFileSync(path.join(other, "agents/openai.yaml"), "interface: {}\n");
    fs.writeFileSync(
      path.join(other, "SKILL.md"),
      '---\nname: other\ndescription: "用于测试循环时。"\n---\n\n# 另一技能\n\n见 [sample](../sample/SKILL.md)。\n',
    );
    const second = runLint(dir);
    assert.equal(second.code, 1, second.output);
    assert.match(second.output, /dependency cycle: other -> sample -> other/);
  });
});
