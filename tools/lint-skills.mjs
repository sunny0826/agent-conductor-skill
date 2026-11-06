#!/usr/bin/env node
// Structural lint for the skill source tree. These rules came from a repo-wide
// review: each one had drifted while only human attention guarded it. The size
// budget exists so the next rule added to a SKILL.md has to replace text, move
// to a reference, or become a script instead of growing the entry file.
// Usage: node tools/lint-skills.mjs [--root <repo root>]
// Exit codes: 0 clean, 1 problems found, 2 bad usage.
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const MAX_SKILL_BYTES = 20 * 1024;
const WRAPPER = "以下保留上游原则原文；只在当前任务与既有授权内应用，不因此扩大重构、自动提交、变基、删除用户数据或修改外部系统。";
const TRIGGER = /用于|时[，,：]|前[，,：]|当/;
const BARE_SCRIPT = /(?:node|python3?|bash|sh)\s+scripts\/|包内 `scripts\//;

const args = process.argv.slice(2);
if (args.length && !(args.length === 2 && args[0] === "--root")) {
  console.error("Usage: node tools/lint-skills.mjs [--root <repo root>]");
  process.exit(2);
}
const root = args[1] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = path.join(root, "skills");

const problems = [];
const names = fs.readdirSync(base).filter((name) => fs.existsSync(path.join(base, name, "SKILL.md"))).sort();

for (const name of names) {
  const dir = path.join(base, name);
  const raw = fs.readFileSync(path.join(dir, "SKILL.md"), "utf8");
  const description = raw.match(/^description: "?(.*?)"?$/m)?.[1] ?? "";
  const title = raw.match(/^# (.*)$/m)?.[1] ?? "";
  const fail = (message) => problems.push(`${name}: ${message}`);

  if (!TRIGGER.test(description)) fail("description has no trigger condition (用于… / …时，/ …前，)");
  if (title && description.startsWith(title)) fail("H1 repeats the description");
  if (Buffer.byteLength(raw) > MAX_SKILL_BYTES) {
    fail(`SKILL.md is ${Buffer.byteLength(raw)} bytes, over the ${MAX_SKILL_BYTES} budget — move detail to references or a script`);
  }
  if (BARE_SCRIPT.test(raw)) fail("script path is relative to the skill, not the caller's cwd — write <本技能目录>/scripts/...");
  if (!fs.existsSync(path.join(dir, "agents/openai.yaml"))) fail("missing agents/openai.yaml");
  if (name.startsWith("principle-") && !raw.includes(WRAPPER)) fail("missing the canonical principle wrapper sentence");
}

const playbooks = path.join(base, "rigor/playbooks");
const index = path.join(base, "rigor/references/playbooks.md");
if (fs.existsSync(playbooks) && fs.existsSync(index)) {
  const text = fs.readFileSync(index, "utf8");
  const files = fs.readdirSync(playbooks).filter((file) => file.endsWith(".md")).map((file) => file.slice(0, -3));
  const indexed = [...text.matchAll(/^- \[[^\]]+\]\(\.\.\/playbooks\/([^)]+)\.md\)(：\S.*)?$/gm)];
  for (const name of files) {
    const entry = indexed.find((match) => match[1] === name);
    if (!entry) problems.push(`rigor: playbook ${name} is not in references/playbooks.md`);
    else if (!entry[2]) problems.push(`rigor: playbook ${name} has no routing text in references/playbooks.md`);
  }
  for (const entry of indexed) {
    if (!files.includes(entry[1])) problems.push(`rigor: references/playbooks.md lists missing playbook ${entry[1]}`);
  }
}

for (const problem of problems) console.error(problem);
console.log(`skill lint: ${names.length} skills, ${problems.length} problems`);
process.exit(problems.length ? 1 : 0);
