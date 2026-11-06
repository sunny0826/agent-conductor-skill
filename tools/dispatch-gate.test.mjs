import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { root } from "./contracts-lib.mjs";

const gate = path.join(root, "skills/agent-conductor/scripts/dispatch-gate.mjs");
const reviewPackage = "任务包类型：只读审查\n允许执行的命令：rg。\n完成后最终回执写入 report.md。\n";

function withFiles(files, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dispatch-gate-"));
  try {
    const paths = {};
    for (const [name, content] of Object.entries(files)) {
      paths[name] = path.join(dir, name);
      fs.writeFileSync(paths[name], typeof content === "function" ? content(paths) : content);
    }
    return fn(paths);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function runGate(...args) {
  const result = spawnSync(process.execPath, [gate, ...args], { encoding: "utf8" });
  return { code: result.status, output: result.stdout + result.stderr };
}

test("pre passes a clean package with a message pointing at it", () => {
  withFiles({
    "package.md": reviewPackage,
    "message.md": (p) => `请读取并执行任务包 ${p["package.md"]}，完成后给出最终回执。\n`,
  }, (p) => assert.equal(runGate("pre", p["package.md"], p["message.md"]).code, 0));
});

test("pre fails when the message is clean but points at another package", () => {
  withFiles({
    "package.md": reviewPackage,
    "message.md": "请读取并执行任务包 /tmp/other-package.md，完成后给出最终回执。\n",
  }, (p) => {
    const result = runGate("pre", p["package.md"], p["message.md"]);
    assert.equal(result.code, 1);
    assert.match(result.output, /does not point at the checked package/);
  });
});

test("pre fails on a package violation even when the message is clean", () => {
  withFiles({
    "package.md": "任务包类型：只读调查\n完成后最终回执。\n",
    "message.md": (p) => `请读取并执行任务包 ${p["package.md"]}，完成后给出最终回执。\n`,
  }, (p) => {
    const result = runGate("pre", p["package.md"], p["message.md"]);
    assert.equal(result.code, 1);
    assert.match(result.output, /unrecognized package type/);
  });
});

test("pre --inline checks one file as package and message", () => {
  withFiles({ "inline.md": reviewPackage, "bad.md": "任务包类型：只读审查\n没有回执要求。\n" }, (p) => {
    assert.equal(runGate("pre", "--inline", p["inline.md"]).code, 0);
    assert.equal(runGate("pre", "--inline", p["bad.md"]).code, 1);
  });
});

test("pre reports an unreadable file as unverifiable", () => {
  assert.equal(runGate("pre", "/nonexistent/package.md", "/nonexistent/message.md").code, 2);
});

test("post compares the delivered text with the checked message", () => {
  withFiles({ "message.md": "正文\n", "same.txt": "正文\n", "polluted.txt": "开场白\n正文\n" }, (p) => {
    assert.equal(runGate("post", p["message.md"], "--sent", p["same.txt"]).code, 0);
    assert.equal(runGate("post", p["message.md"], "--sent", p["polluted.txt"]).code, 1);
  });
});

test("usage errors exit 2", () => {
  assert.equal(runGate().code, 2);
  assert.equal(runGate("pre", "only-one.md").code, 2);
});
