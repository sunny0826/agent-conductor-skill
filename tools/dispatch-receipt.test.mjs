import assert from "node:assert/strict";
import test from "node:test";

import { run } from "./contracts-lib.mjs";

const check = (text, ...args) => run("skills/agent-conductor/scripts/check-dispatch.mjs", text, ...args);
const pointer = "请执行任务包 ./tasks/vector-dimensions.md。";

test("Chinese return-result instructions satisfy the receipt requirement", () => {
  for (const receipt of [
    "完成后回传向量维度检查结果。",
    "请回传维度不匹配的输入数量。",
    "回传：有效向量数量及检查结果。",
  ]) {
    const result = check(`${pointer}${receipt}`, "--message");
    assert.equal(result.code, 0, result.output);
  }
});

test("return-result instructions work in a bounded verification package", () => {
  const result = check(`任务包类型：验证
不执行任何命令，仅核对给定向量的维度。
完成后回传维度不一致的条目。`);
  assert.equal(result.code, 0, result.output);
});

test("a recognized return-result request does not hide a missing package", () => {
  const result = check("核对向量维度，完成后回传不一致的条目。", "--message");
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /no package pointer/);
  assert.doesNotMatch(result.output, /no receipt requirement/);
});

test("mentions, past returns and negated returns do not request a receipt", () => {
  for (const text of [
    "回传机制采用文本格式。",
    "请阅读回传格式说明。",
    "上次完成后回传了维度清单。",
    "完成后回传了维度清单。",
    "完成后不要回传结果。",
    "无需回传检查结果。",
    "回传：",
  ]) {
    const result = check(`${pointer}${text}`, "--message");
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, /no receipt requirement/);
  }
});
