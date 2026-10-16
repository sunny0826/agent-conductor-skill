---
name: principle-fix-root-causes
description: "修复问题时复现并追到系统第一次出错的地方。状态合法时，就地处理是修复；状态不该存在时，防御分支只是掩盖。"
---

# 追到第一次出错的地方

以下保留上游原则原文；只在当前任务与授权范围内应用，不因此扩大重构、修改用户状态或自动提交。固定文件数属于阅读成本启发式，不是验收硬门槛。

# Fix Root Causes

When debugging, fix the fault, not the place where it surfaced. The symptom is where a wrong state became visible. The root cause is the first place the system did something it should not do, or failed to handle a state it should handle.

**Why:** A symptom fix hides the evidence and leaves the fault free to surface somewhere else. Each one makes the system harder to reason about, because the code now carries a workaround for a bug that nobody named.

**Pattern:**
- Reproduce first.
- Ask "why" at each step until the answer is a wrong decision in the code, not a consequence of an earlier one.
- When stuck, instrument. Read the actual error and the actual state. Do not guess.
- Ask whether the state that triggered the symptom is legitimate. If the system may be in that state, the code that broke on it is the root cause, and handling the state there is the fix. If the state should never exist, a check where it broke hides the bug. Find what produced the state. Guards, retries, swallowed errors, clamped values, and discarded state are the usual ways to hide a bug.
- When something fails only after a restart, suspect persisted state first: config files, caches, lock files, serialized state.
- Check for the pattern, not just the instance. Find every place with the same fault and fix them all.
- If a workaround needs a paragraph-long comment to justify it, the code is wrong. Fix the code, not the comment.
- If the deciding fact took a deep dig to find, propose the cheap, always-on signal that would have shown it at first look.

来源见 [说明](references/sources.md)。
