import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { root } from "./contracts-lib.mjs";

const script = path.join(root, "skills/agent-conductor/scripts/check-sent-dispatch.mjs");

function check(checked, sent, { stdin = false, rolePrefix = null } = {}) {
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
    if (rolePrefix !== null) args.push("--role-prefix", rolePrefix);
    const result = spawnSync(process.execPath, args, {
      encoding: "utf8",
      input: stdin ? sent : undefined,
    });
    return { code: result.status, output: result.stdout + result.stderr };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function checkSession(checked, delivered, sessionId, { roleId, roleRevision, roleName, prefix }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sent-dispatch-"));
  try {
    const checkedPath = path.join(dir, "message.md");
    fs.writeFileSync(checkedPath, checked);
    const bin = path.join(dir, "bin");
    fs.mkdirSync(bin);
    const fakeLody = path.join(bin, "lody");
    fs.writeFileSync(
      fakeLody,
      [
        "#!/bin/sh",
        'case "$1 $2" in',
        `"session show") printf '%s\\n' '${JSON.stringify({
          ok: true,
          session: { agentRoleId: roleId, agentRoleRevision: roleRevision },
        })}' ;;`,
        `"agent-role get") printf '%s\\n' '${JSON.stringify({
          ok: true,
          item: { id: roleId, name: roleName, revision: roleRevision, promptPrefix: prefix },
        })}' ;;`,
        `"session history") printf '%s\\n' '${JSON.stringify({
          ok: true,
          entries: [{ role: "user", text: delivered }],
        })}' ;;`,
        "*) exit 9;;",
        "esac",
        "",
      ].join("\n"),
    );
    fs.chmodSync(fakeLody, 0o755);
    const result = spawnSync(process.execPath, [script, checkedPath, "--session", sessionId], {
      encoding: "utf8",
      env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` },
    });
    return { code: result.status, output: result.stdout + result.stderr };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const message =
  "请执行任务包 /Users/guoxudong/codes/mym5/.pio/verification/adventure-implementation/storage-task.md，完成后按包内要求写API说明、测试报告并返回最终回执。\n";
const workerPrefix = "只执行任务，不要进行额外的思考，不要自作主张";

test("delivered text equal to the checked message passes", () => {
  // The file is written with a trailing newline; child transcripts do not
  // preserve it, so trailing whitespace is normalized before comparing.
  const result = check(message, message.trimEnd());
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /sent message matches checked message/);
});

test("configured role prompt prefix is accepted before the checked body", () => {
  const result = check(message, `${workerPrefix}\n\n${message.trimEnd()}`, { rolePrefix: workerPrefix });
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /after the configured role prompt prefix/);
});

test("role prompt prefix does not excuse a body edit", () => {
  const delivered = `${workerPrefix}\n\n${message.replace("完成后", "务必完成后").trimEnd()}`;
  const result = check(message, delivered, { rolePrefix: workerPrefix });
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /role prompt prefix was found and removed/);
  assert.match(result.output, /sent message differs from checked message/);
});

test("a role prompt prefix without the checked body is rejected", () => {
  const result = check(message, `${workerPrefix}\n\n请执行另一个任务。`, { rolePrefix: workerPrefix });
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /sent message differs from checked message/);
});

test("session mode reads the child role promptPrefix from Lody", () => {
  const result = checkSession(message, `${workerPrefix}\n\n${message.trimEnd()}`, "child-1", {
    roleId: "role-1",
    roleRevision: 4,
    roleName: "worker+",
    prefix: workerPrefix,
  });
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /configured role prompt prefix \(worker\+\)/);
});

test("session mode still rejects a body edit under the role prefix", () => {
  const result = checkSession(
    message,
    `${workerPrefix}\n\n${message.replace("完成后", "务必完成后").trimEnd()}`,
    "child-1",
    {
      roleId: "role-1",
      roleRevision: 4,
      roleName: "worker+",
      prefix: workerPrefix,
    },
  );
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /sent message differs from checked message/);
});

test("an unconfigured prepended suppression opener is rejected", () => {
  // The same text is genuine pollution when the child's role has no such
  // promptPrefix. The configured case is covered above.
  const delivered = `${workerPrefix}\n\n${message.trimEnd()}`;
  const result = check(message, delivered);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /sent message differs from checked message/);
  assert.match(result.output, /first difference at character 0/);
  assert.match(result.output, /Cancel the child session/);
});

test("stdin delivery comparison works", () => {
  const result = check(message, `\n${message}\n`, { stdin: true });
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /first difference at character 0/);
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
