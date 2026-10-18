import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Runs a contract script with the given content on stdin-backed temp file and
// returns its exit code plus combined output. Shared by the *.test.mjs suites.
export function run(script, content, ...args) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "skill-contract-"));
  try {
    const input = path.join(dir, "input");
    fs.writeFileSync(input, content);
    const result = spawnSync(process.execPath, [path.join(root, script), input, ...args], { encoding: "utf8" });
    if (result.error) throw result.error;
    return { code: result.status, output: result.stdout + result.stderr };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
