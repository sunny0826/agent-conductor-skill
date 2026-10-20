#!/usr/bin/env node
/** Check deployed skill copies match this repository's skills. */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS = path.join(ROOT, "skills");
const DEFAULT_DEPLOY_ROOT =
  process.env.SKILL_DEPLOY_ROOT ||
  path.join(homedir(), ".config", "magpie", "library", "skills");
const IGNORED_NAMES = new Set([".DS_Store", "__pycache__"]);
const IGNORED_SUFFIXES = [".pyc"];

export async function listSkills(base = SKILLS) {
  const names = [];
  for (const entry of await readdir(base, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (existsSync(path.join(base, entry.name, "SKILL.md"))) names.push(entry.name);
  }
  return names.sort();
}

function ignored(relative) {
  return (
    relative.split(path.sep).some((part) => IGNORED_NAMES.has(part)) ||
    IGNORED_SUFFIXES.some((suffix) => relative.endsWith(suffix))
  );
}

async function walk(dir, prefix = "") {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const relative = prefix ? path.join(prefix, entry.name) : entry.name;
    if (ignored(relative)) continue;
    const full = path.join(dir, entry.name);
    const info = await stat(full);
    if (info.isDirectory()) files.push(...(await walk(full, relative)));
    else if (info.isFile()) files.push(relative);
  }
  return files;
}

async function hashes(dir) {
  const result = new Map();
  for (const relative of await walk(dir)) {
    const content = await readFile(path.join(dir, relative));
    result.set(relative, createHash("sha256").update(content).digest("hex"));
  }
  return result;
}

export async function compareSkill(
  name,
  { skillsBase = SKILLS, deployRoot = DEFAULT_DEPLOY_ROOT } = {},
) {
  const deployDir = path.join(deployRoot, name);
  if (!existsSync(deployDir)) {
    return { skill: name, status: "missing", missing: [], extra: [], modified: [] };
  }
  const [repo, deployed] = await Promise.all([
    hashes(path.join(skillsBase, name)),
    hashes(deployDir),
  ]);
  const missing = [...repo.keys()].filter((file) => !deployed.has(file)).sort();
  const extra = [...deployed.keys()].filter((file) => !repo.has(file)).sort();
  const modified = [...repo.keys()]
    .filter((file) => deployed.has(file) && repo.get(file) !== deployed.get(file))
    .sort();
  return {
    skill: name,
    status: missing.length || extra.length || modified.length ? "drift" : "ok",
    missing,
    extra,
    modified,
  };
}

export async function checkDeployment(options = {}) {
  const skillsBase = options.skillsBase || SKILLS;
  const deployRoot = options.deployRoot || DEFAULT_DEPLOY_ROOT;
  if (!existsSync(deployRoot)) {
    return {
      deployRoot,
      ok: false,
      error: `deploy root not found: ${deployRoot}`,
      results: [],
    };
  }
  const names = options.skills?.length ? options.skills : await listSkills(skillsBase);
  const results = [];
  for (const name of names) {
    if (!existsSync(path.join(skillsBase, name, "SKILL.md"))) {
      results.push({
        skill: name,
        status: "unknown",
        missing: [],
        extra: [],
        modified: [],
      });
      continue;
    }
    results.push(await compareSkill(name, { skillsBase, deployRoot }));
  }
  return {
    deployRoot,
    ok: results.every((result) => result.status === "ok"),
    error: null,
    results,
  };
}

function describe(result) {
  const parts = [];
  if (result.status === "missing") parts.push("missing directory");
  if (result.status === "unknown") parts.push("not a repository skill");
  for (const [label, files] of [
    ["missing", result.missing],
    ["extra", result.extra],
    ["modified", result.modified],
  ]) {
    if (!files.length) continue;
    const preview = files.slice(0, 3).join(", ");
    parts.push(`${label} ${files.length}: ${preview}${files.length > 3 ? ", …" : ""}`);
  }
  return `${result.skill}: ${parts.join("; ")}`;
}

function printReport(report) {
  if (report.error) {
    console.error(report.error);
    return;
  }
  const drifted = report.results.filter((result) => result.status !== "ok");
  if (!drifted.length) {
    console.log(`OK ${report.results.length} skills match ${report.deployRoot}`);
    return;
  }
  console.log(`DRIFT ${drifted.length}/${report.results.length} skills differ from ${report.deployRoot}`);
  for (const result of drifted) console.log(`  ${describe(result)}`);
}

function usage() {
  return [
    "Usage: node tools/check-deployment.mjs [options]",
    "",
    "Options:",
    "  --deploy-root <path>  deployed skills directory",
    "  --skills <name...>    only check these skills",
    "  --json                print a JSON report",
    "  -h, --help            show this help",
    "",
    `Default deploy root: ${DEFAULT_DEPLOY_ROOT}`,
  ].join("\n");
}

function parseArgs(argv) {
  const options = { deployRoot: DEFAULT_DEPLOY_ROOT, skills: [], json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") options.json = true;
    else if (arg === "-h" || arg === "--help") {
      console.log(usage());
      process.exit(0);
    } else if (arg === "--deploy-root") {
      const value = argv[(index += 1)];
      if (!value) throw new Error("--deploy-root needs a path");
      options.deployRoot = value;
    } else if (arg === "--skills") {
      while (argv[index + 1] && !argv[index + 1].startsWith("--")) {
        options.skills.push(argv[(index += 1)]);
      }
      if (!options.skills.length) throw new Error("--skills needs at least one name");
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return options;
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`${error.message}\n\n${usage()}`);
    process.exit(2);
  }
  const report = await checkDeployment(options);
  if (options.json) console.log(JSON.stringify(report, null, 2));
  else printReport(report);
  process.exit(report.error ? 2 : report.ok ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
