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
const BARE_SCRIPT = /(?:node|python3?|bash|sh)\s+scripts\/|包内 `scripts\/|本技能 `scripts\/|（`scripts\//;
const LINK = /\]\(([^)]+)\)/g;

function walkMarkdown(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkMarkdown(full));
    else if (entry.isFile() && entry.name.endsWith(".md")) results.push(full);
  }
  return results.sort();
}

function headingSlugs(mdText) {
  const slugs = new Set();
  const seen = new Map();
  let inFence = false;
  for (const line of mdText.split(/\r?\n/)) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = line.match(/^#{1,6}\s+(.+?)\s*$/);
    if (!match) continue;
    const heading = match[1].replace(/[`*_]/g, "").trim().toLowerCase();
    const base = heading.replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s+/g, "-");
    if (!base) continue;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    slugs.add(count === 0 ? base : `${base}-${count}`);
  }
  return slugs;
}

const args = process.argv.slice(2);
if (args.length && !(args.length === 2 && args[0] === "--root")) {
  console.error("Usage: node tools/lint-skills.mjs [--root <repo root>]");
  process.exit(2);
}
const root = args[1] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = path.join(root, "skills");

const problems = [];
const names = fs.readdirSync(base).filter((name) => fs.existsSync(path.join(base, name, "SKILL.md"))).sort();
const graph = new Map(names.map((name) => [name, new Set()]));
const slugCache = new Map();

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
  if (!fs.existsSync(path.join(dir, "agents/openai.yaml"))) fail("missing agents/openai.yaml");
  if (name.startsWith("principle-") && !raw.includes(WRAPPER)) fail("missing the canonical principle wrapper sentence");

  for (const doc of walkMarkdown(dir)) {
    const docRaw = fs.readFileSync(doc, "utf8");
    const relDoc = path.relative(dir, doc);
    if (BARE_SCRIPT.test(docRaw)) {
      fail(`${relDoc}: script path is relative to the skill, not the caller's cwd — write <本技能目录>/scripts/...`);
    }
    for (const match of docRaw.matchAll(LINK)) {
      const cleaned = match[1].trim().replace(/^<|>$/g, "");
      if (!cleaned || /^[a-zA-Z][\w+.-]*:/.test(cleaned)) continue;
      const hashIdx = cleaned.indexOf("#");
      const targetPart = hashIdx === -1 ? cleaned : cleaned.slice(0, hashIdx);
      const rawAnchor = hashIdx === -1 ? "" : cleaned.slice(hashIdx + 1);
      const targetPath = targetPart ? path.resolve(path.dirname(doc), targetPart) : doc;
      if (!fs.existsSync(targetPath)) {
        fail(`${relDoc}: broken reference -> ${cleaned}`);
        continue;
      }
      const relToBase = path.relative(base, targetPath);
      if (!relToBase.startsWith("..") && !path.isAbsolute(relToBase)) {
        const owner = relToBase.split(path.sep)[0];
        if (owner && owner !== name && graph.has(owner)) graph.get(name).add(owner);
      }
      if (rawAnchor && targetPath.endsWith(".md")) {
        let anchor = rawAnchor.toLowerCase();
        try { anchor = decodeURIComponent(rawAnchor).toLowerCase(); } catch {}
        if (!slugCache.has(targetPath)) {
          slugCache.set(targetPath, headingSlugs(fs.readFileSync(targetPath, "utf8")));
        }
        if (!slugCache.get(targetPath).has(anchor)) {
          fail(`${relDoc}: broken anchor -> ${cleaned}`);
        }
      }
    }
  }
}

// Detect cross-skill dependency cycles.
const visitState = new Map();
const stack = [];
function detectCycle(node) {
  visitState.set(node, 1);
  stack.push(node);
  for (const next of [...(graph.get(node) ?? [])].sort()) {
    if (visitState.get(next) === 1) {
      const cycle = [...stack.slice(stack.indexOf(next)), next].join(" -> ");
      problems.push(`dependency cycle: ${cycle}`);
    } else if (!visitState.has(next)) {
      detectCycle(next);
    }
  }
  stack.pop();
  visitState.set(node, 2);
}
for (const name of names) {
  if (!visitState.has(name)) detectCycle(name);
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
