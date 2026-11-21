import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { root } from "./contracts-lib.mjs";

const logScript = path.join(root, "skills/show-me-your-work/scripts/log.sh");

test("log.sh initializes header, appends rows, sanitizes whitespace, and neutralizes formulas", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "show-work-log-"));
  try {
    const logFile = path.join(dir, "nested", "decisions.tsv");
    const first = spawnSync(
      logScript,
      [logFile, "plan", "choose\tA\nnow", "=cmd()", "file.txt", "+ok"],
      { encoding: "utf8" },
    );
    assert.equal(first.status, 0, first.stdout + first.stderr);

    const second = spawnSync(
      logScript,
      [logFile, "verify", "-check", "@mention", "out\r\nlog", "pass"],
      { encoding: "utf8" },
    );
    assert.equal(second.status, 0, second.stdout + second.stderr);

    const lines = fs.readFileSync(logFile, "utf8").trimEnd().split("\n");
    assert.equal(lines.length, 3);
    assert.equal(lines[0], "ts\tphase\tdecision\twhy\tevidence\tresult");

    const row1 = lines[1].split("\t");
    assert.equal(row1.length, 6);
    assert.match(row1[0], /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    assert.equal(row1[1], "plan");
    assert.equal(row1[2], "choose A now");
    assert.equal(row1[3], "'=cmd()");
    assert.equal(row1[4], "file.txt");
    assert.equal(row1[5], "'+ok");

    const row2 = lines[2].split("\t");
    assert.equal(row2.length, 6);
    assert.equal(row2[2], "'-check");
    assert.equal(row2[3], "'@mention");
    assert.equal(row2[4], "out  log");
    assert.equal(row2[5], "pass");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("log.sh rejects missing arguments with exit code 1", () => {
  const result = spawnSync(logScript, ["only-one-arg"], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /usage: log\.sh/);
});
