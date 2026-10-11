#!/usr/bin/env node
import fs from "node:fs";
import process from "node:process";

const [file, mode] = process.argv.slice(2);
if (!file || (mode && mode !== "--complete") || process.argv.length > 4) {
  console.error("Usage: node check-task-state.mjs <task-state.json> [--complete]");
  process.exit(2);
}
const problems = [];
const fail = (message) => problems.push(message);
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string" && value.trim().length > 0;
const strings = (value) => Array.isArray(value) && value.every(text);
const evidence = (value) => strings(value) && value.length > 0;
const active = (task) => ["pending", "running", "blocked"].includes(task.status);
const overlaps = (a, b) => a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
const relativePath = (value) => text(value) && !/[\\:*?\[\]{}]/.test(value)
  && value.split("/").every((part) => part && part !== "." && part !== "..");

function rows(value, label) {
  if (!Array.isArray(value)) { fail(`${label} must be an array`); return []; }
  const ids = new Set();
  return value.filter((row) => {
    if (!object(row) || !text(row.id)) { fail(`${label} entry needs an id`); return false; }
    if (ids.has(row.id)) fail(`${label}: duplicate id ${row.id}`);
    ids.add(row.id);
    return true;
  });
}

let state;
try { state = JSON.parse(fs.readFileSync(file, "utf8")); }
catch (error) { console.error(`Invalid task state: ${error.message}`); process.exit(1); }
if (!object(state)) { console.error("Task state must be an object"); process.exit(1); }
const goals = rows(state.goals, "goals");
const tasks = rows(state.tasks, "tasks");
if (!goals.length) fail("At least one goal is required");
if (mode === "--complete" && !goals.some((g) => g.status === "active")) fail("Completion needs an active goal");

for (const goal of goals) {
  if (!text(goal.source)) fail(`${goal.id}: source must identify the user request or authorized requirement`);
  if (!["active", "superseded"].includes(goal.status)) fail(`${goal.id}: invalid goal status`);
  const checks = rows(goal.acceptance, `${goal.id}.acceptance`);
  if (!checks.length) fail(`${goal.id}: at least one acceptance item is required`);
  for (const check of checks) {
    const label = `${goal.id}/${check.id}`;
    if (!text(check.expected)) fail(`${label}: expected result is required`);
    if (!["pending", "passed", "blocked"].includes(check.status)) fail(`${label}: invalid acceptance status`);
    if (!strings(check.evidence)) fail(`${label}: evidence must be an array of references`);
    if (check.status === "passed" && (!text(check.observed) || !evidence(check.evidence))) {
      fail(`${label}: passed needs an observed result and evidence`);
    }
    if (mode === "--complete" && goal.status === "active" && check.status !== "passed") {
      fail(`${label}: ${check.status}; cannot claim completion`);
    }
  }
}
for (const task of tasks) {
  const goal = goals.find((g) => g.id === task.goal);
  if (!goal) fail(`${task.id}: unknown goal ${task.goal}`);
  if (goal?.status === "superseded" && active(task)) fail(`${task.id}: active work belongs to superseded goal ${goal.id}`);
  if (!["pending", "running", "blocked", "done", "stopped"].includes(task.status)) fail(`${task.id}: invalid task status`);
  if (!text(task.owner) || !text(task.workspace)) fail(`${task.id}: owner and workspace are required`);
  if (!strings(task.writes) || !task.writes.every(relativePath)) fail(`${task.id}: writes must be normalized relative paths, without globs`);
  if (!strings(task.constraints)) fail(`${task.id}: constraints must be an array`);
  if (!strings(task.evidence)) fail(`${task.id}: evidence must be an array`);
  if (["done", "stopped"].includes(task.status) && !evidence(task.evidence)) fail(`${task.id}: ${task.status} needs a result or stop acknowledgement`);
  if (mode === "--complete" && active(task)) fail(`${task.id}: ${task.status}; work has not reached a terminal state`);
}
const writers = tasks.filter((t) => t.status === "running" && strings(t.writes));
for (let i = 0; i < writers.length; i++) {
  for (const other of writers.slice(i + 1)) {
    const task = writers[i];
    if (task.workspace !== other.workspace) continue;
    if (task.writes.some((a) => other.writes.some((b) => overlaps(a, b)))) {
      fail(`${task.id} and ${other.id}: write paths overlap in ${task.workspace}`);
    }
  }
}
for (const problem of problems) console.error(problem);
console.log(`${goals.length} goals, ${tasks.length} tasks, ${problems.length} problems`);
process.exit(problems.length ? 1 : 0);
