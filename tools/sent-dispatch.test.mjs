import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { root } from "./contracts-lib.mjs";

const script = path.join(root, "skills/agent-conductor/scripts/check-sent-dispatch.mjs");

function check(checked, sent, { stdin = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sent-dispatch-"));
  try {
    const checkedPath = path.join(dir, "message.md");
    fs.writeFileSync(checkedPath, checked);
    const args = [script, checkedPath, "--sent", "-"];
    if (!stdin) {
      const sentPath = path.join(dir, "sent.txt");
      fs.writeFileSync(sentPath, sent);
      args[3] = sentPath;
    }
    const result = spawnSync(process.execPath, args, {
      encoding: "utf8",
      input: stdin ? sent : undefined,
    });
    return { code: result.status, output: result.stdout + result.stderr };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const message = "请执行任务包 /Users/guoxudong/codes/mym5/.pio/verification/adventure-implementation/storage-task.md，完成后按包内要求写API说明、测试报告并返回最终回执。\n";

test("delivered text equal to the checked message passes", () => {
  // The file is written with a trailing newline; child transcripts do not
  // preserve it, so trailing whitespace is normalized before comparing.
  const result = check(message, message.trimEnd());
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /sent message matches checked message/);
});

test("stdin delivery comparison works", () => {
  const result = check(message, `\n${message}\n`, { stdin: true });
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /first difference at character 0/);
});

test("2026-10-23 prepended suppression opener is rejected", () => {
  // Verbatim shape of sessions 2aadb54c / fdfde833 / a03b47df and eight more
  // created by 46e3f88a on 2026-10-22..23: the saved *-message.md file is
  // clean, but the delivered prompt prepends the old suppression opener.
  const delivered = `只执行任务，不要进行额外的思考，不要自作主张\n\n${message.trimEnd()}`;
  const result = check(message, delivered);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /sent message differs from checked message/);
  assert.match(result.output, /first difference at character 0/);
  assert.match(result.output, /Cancel the child session/);
});

test("a delivered body edit is rejected", () => {
  const result = check(message, message.replace("完成后", "务必完成后"));
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /first difference at character \d+/);
});

test("missing checked message exits before comparing", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sent-dispatch-"));
  try {
    const result = spawnSync(process.execPath, [script, path.join(dir, "absent.md"), "--sent", "-"], {
      encoding: "utf8",
      input: message,
    });
    assert.equal(result.status, 2);
    assert.match(`${result.stdout}${result.stderr}`, /Cannot read checked message/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
