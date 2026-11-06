#!/usr/bin/env node
// Single entry for the dispatch gate. check-dispatch.mjs lints one text and
// check-sent-dispatch.mjs compares one delivery; the coordinator previously had
// to remember which modes to combine. The linters stay the source of each rule.
// This script also closes one gap neither covers: a clean message that points
// at a different file than the package that was linted.
//
// Usage:
//   node dispatch-gate.mjs pre <package.md> <message.md>
//   node dispatch-gate.mjs pre --inline <message.md>
//   node dispatch-gate.mjs post <message.md> (--session <id> | --sent <file|->) [--role-prefix <text>]
//   node dispatch-gate.mjs post --session <id> [--role-prefix <text>]
// Exit codes: 0 pass, 1 violation, 2 could not verify or bad usage.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const checkDispatch = path.join(here, "check-dispatch.mjs");
const checkSent = path.join(here, "check-sent-dispatch.mjs");

function usage(message) {
  if (message) console.error(message);
  console.error("Usage: node dispatch-gate.mjs pre <package.md> <message.md>");
  console.error("       node dispatch-gate.mjs pre --inline <message.md>");
  console.error("       node dispatch-gate.mjs post [<message.md>] --session <id> [--role-prefix <text>]");
  console.error("       node dispatch-gate.mjs post <message.md> --sent <file|-> [--role-prefix <text>]");
  process.exit(2);
}

function run(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], { stdio: "inherit" });
  if (result.error) {
    console.error(`Cannot run ${path.basename(script)}: ${result.error.message}`);
    return 2;
  }
  return result.status === null ? 2 : result.status;
}

function pointsAtPackage(messagePath, packagePath) {
  const message = fs.readFileSync(messagePath, "utf8");
  const resolved = path.resolve(packagePath);
  return message.includes(resolved) || message.includes(packagePath);
}

const [command, ...args] = process.argv.slice(2);

if (command === "pre") {
  const inline = args[0] === "--inline";
  const files = inline ? args.slice(1) : args;
  if (files.length !== (inline ? 1 : 2)) usage("pre needs <package.md> <message.md>, or --inline <message.md>");
  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.error(`Cannot read ${file}`);
      process.exit(2);
    }
  }
  const [packagePath, messagePath] = inline ? [files[0], files[0]] : files;
  const codes = [run(checkDispatch, [packagePath]), run(checkDispatch, ["--message", messagePath])];
  if (!inline && !pointsAtPackage(messagePath, packagePath)) {
    console.error(`dispatch message does not point at the checked package ${packagePath}`);
    codes.push(1);
  }
  process.exit(codes.includes(2) ? 2 : Math.max(...codes));
}

if (command === "post") {
  const hasMessageFile = args.length > 0 && !args[0].startsWith("--");
  process.exit(run(checkSent, hasMessageFile ? args : [...args, "--lint"]));
}

usage(`Unknown command: ${command ?? "(none)"}`);
