import assert from "node:assert/strict";
import test from "node:test";

import { run } from "./contracts-lib.mjs";

const checkDispatch = (text) => run("skills/agent-conductor/scripts/check-dispatch.mjs", text);

test("review packages enforce the 3-round review cap and allow rounds 1..3", () => {
  for (const okLine of ["进行第 3 轮独立只读复审。", "Perform a fresh independent Round 3 review."]) {
    const pkg = `任务包类型：只读审查\n\n${okLine}允许只读命令：git diff、读取源码。\n\n回执：approve 或 request changes。`;
    assert.equal(checkDispatch(pkg).code, 0, checkDispatch(pkg).output);
  }
  for (const overCap of [
    "请对 PR #55 进行第 4 轮独立只读复审。",
    "Please perform a fresh independent read-only Round 4 review of PR #55.",
    "本次操作标识 review-pr-55-r10，请核对最新提交。",
  ]) {
    const pkg = `任务包类型：只读审查\n\n${overCap}允许只读命令：git diff、读取源码。\n\n回执：approve 或 request changes。`;
    const result = checkDispatch(pkg);
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, /3-round/);
  }
});

test("review packages reject in-place worktree updates and same-session continuation", () => {
  for (const bad of [
    "你的 worktree 目前可能停留在 93e8c15，请先执行 git fetch origin 并 git checkout 1122334 复审。",
    "已推送修复提交，请在同一会话继续复审。",
  ]) {
    const pkg = `任务包类型：只读审查\n\n${bad}允许只读命令：git diff、读取源码。\n\n回执：approve 或 request changes。`;
    const result = checkDispatch(pkg);
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, /fresh session/);
  }
  const negated = `任务包类型：只读审查\n\n只读核对固定快照。不要执行 git fetch、git pull 或 git checkout。允许只读命令：git diff、读取源码。\n\n回执：approve 或 request changes。`;
  assert.equal(checkDispatch(negated).code, 0, checkDispatch(negated).output);
});
