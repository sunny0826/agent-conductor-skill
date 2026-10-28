import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { root } from "./contracts-lib.mjs";

const script = path.join(root, "tools/check-user-claims.mjs");

function check(userMessages, delivery, { json = false, deliveryFile = null, failHistory = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "user-claims-"));
  try {
    const bin = path.join(dir, "bin");
    fs.mkdirSync(bin);
    const fakeLody = path.join(bin, "lody");
    fs.writeFileSync(
      fakeLody,
      [
        "#!/bin/sh",
        "case \"$1 $2\" in",
        `"session history") ${failHistory ? "exit 7" : `printf '%s\\n' '${JSON.stringify({
          ok: true,
          entries: [
            { role: "user", text: userMessages[0] || "" },
            ...userMessages.slice(1).map((text) => ({ role: "user", text })),
            { role: "assistant", text: delivery },
          ],
        })}'`} ;;`,
        "*) exit 9;;",
        "esac",
        "",
      ].join("\n"),
    );
    fs.chmodSync(fakeLody, 0o755);
    const args = [script, "--session", "child-1"];
    if (json) args.push("--json");
    if (deliveryFile !== null) args.push("--delivery", deliveryFile);
    const result = spawnSync(process.execPath, args, {
      encoding: "utf8",
      env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` },
    });
    return { code: result.status, output: result.stdout + result.stderr };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("a delivery without user-confirmation claims passes", () => {
  const result = check(["设备已连接"], "烧录完成，串口显示启动正常。");
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /0 user-confirmation claims/);
});

test("a confirmation claim without a user quote is rejected", () => {
  const result = check(["设备已连接，请烧录并验证"], "烧录完成。你已确认首页显示具体步数。");
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /unsupported \(no quoted user words, turn \d+\)/);
});

test("a visual-confirmation claim without a user quote is rejected", () => {
  const result = check(["设备已连接，进行烧录并验证"], "实体设备（你的目视确认 + 串口证据）：动画正常无裁切。");
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /你的目视确认/);
});

test("a claim with a quote from a user message passes", () => {
  const result = check(["我看到首页显示数字了"], "你已确认“首页显示数字”。");
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /0 unsupported/);
});

test("a quote that the user never wrote is rejected", () => {
  const result = check(["设备已连接"], "你已确认“图鉴动画正常无裁切”。");
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /quoted text not found/);
});

test("a request for confirmation is not a claim", () => {
  const result = check(["设备已连接"], "需要你确认是否符合本意；请你确认后我再继续。");
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /No user-confirmation claims/);
});

test("delivery file overrides the session transcript", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "user-claims-draft-"));
  try {
    const draft = path.join(dir, "draft.md");
    fs.writeFileSync(draft, "你已确认“全部通过”。", "utf8");
    const result = check(["设备已连接"], "串口正常。", { deliveryFile: draft });
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, /quoted text not found/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("json output carries claims and unsupported entries", () => {
  const result = check(["设备已连接"], "你已确认首页显示具体步数。", { json: true });
  assert.equal(result.code, 1, result.output);
  const payload = JSON.parse(result.output.slice(result.output.indexOf("{")));
  assert.equal(payload.claims.length, 1);
  assert.equal(payload.unsupported.length, 1);
});

test("unreadable history exits 2", () => {
  const result = check([], "", { failHistory: true });
  assert.equal(result.code, 2, result.output);
  assert.match(result.output, /lody session history exited 7/);
});
