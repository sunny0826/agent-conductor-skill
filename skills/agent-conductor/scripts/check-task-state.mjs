#!/usr/bin/env node
import fs from "node:fs";
import process from "node:process";
import { checkSkillAdoption } from "./skill-adoption.mjs";

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
  if (task.review_target !== undefined && !text(task.review_target)) fail(`${task.id}: review_target must be a non-empty string`);
  if (task.review_round !== undefined) {
    if (!Number.isInteger(task.review_round) || task.review_round < 1) fail(`${task.id}: review_round must be a positive integer`);
    else if (task.review_round > 3) fail(`${task.id}: review_round ${task.review_round} exceeds the 3-round hard limit (h1..h3)`);
  }
  if (task.rework_round !== undefined) {
    const raw = task.rework_round;
    const match = typeof raw === "string" ? raw.trim().match(/^h([1-9]\d*)$/i) : null;
    const num = Number.isInteger(raw) && raw >= 1 ? raw : match ? Number(match[1]) : null;
    if (num === null) fail(`${task.id}: rework_round must be h1..h3 or 1..3`);
    else if (num > 3) fail(`${task.id}: rework_round ${raw} exceeds the h1..h3 hard limit`);
  }
  if (mode === "--complete" && active(task)) fail(`${task.id}: ${task.status}; work has not reached a terminal state`);
  checkSkillAdoption(task, mode === "--complete" && goal?.status === "active" && task.status !== "stopped", fail);
}
const reviewCounts = new Map();
const reviewerSessions = new Map();
for (const task of tasks) {
  const goal = goals.find((g) => g.id === task.goal);
  if (!goal || goal.status === "superseded" || task.status === "stopped" || !text(task.owner)) continue;
  if (!/^reviewer(?:$|[-_])/i.test(task.owner.trim())) continue;
  const target = text(task.review_target) ? task.review_target.trim() : task.goal;
  const key = `${task.goal}::${target}::${task.owner.trim().toLowerCase()}`;
  const group = reviewCounts.get(key) ?? [];
  group.push(task.id);
  reviewCounts.set(key, group);
  if (strings(task.evidence)) {
    const taskSessions = new Set();
    for (const ref of task.evidence) {
      for (const match of ref.matchAll(/(?:lody:\/\/session\/|session:\/\/)([^?\s/#]+)/gi)) {
        taskSessions.add(match[1]);
      }
    }
    for (const sid of taskSessions) {
      const prior = reviewerSessions.get(sid);
      if (prior && prior !== task.id) {
        fail(`${prior} and ${task.id}: independent review rounds cannot reuse the same reviewer session (${sid})`);
      } else {
        reviewerSessions.set(sid, task.id);
      }
    }
  }
}
for (const [key, ids] of reviewCounts) {
  if (ids.length > 3) {
    fail(`${ids.join(", ")}: ${ids.length} review rounds on ${key.split("::")[1]} exceeds the 3-round hard limit (h1..h3)`);
  }
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
