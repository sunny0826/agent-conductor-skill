---
name: principle-make-operations-idempotent
description: "有重试、启动恢复或重复执行时，验证多次执行与部分失败能收敛。"
---

# 有重试、启动恢复或重复执行时，验证多次执行与部分失败能收敛。

以下保留上游原则原文；只在当前任务与授权范围内应用，不因此扩大重构、修改用户状态或自动提交。固定文件数属于阅读成本启发式，不是验收硬门槛。

# Make Operations Idempotent

Design operations so they converge to the correct state regardless of how many times they run or where they start from. Every state-mutating operation should answer: "What happens if this runs twice? What happens if the previous run crashed halfway?"

**Why:** Commands, lifecycle operations, and processing loops run where crashes, restarts, and retries are normal. If partial state changes the next run's outcome, every restart becomes a debugging session.

**The pattern:**
- Convergent startup: scan for existing state, clean stale artifacts, adopt live sessions
- Content-based cleanup: compare by content equivalence, not creation order
- Self-healing locks: use PID-based stale lock detection
- Idempotent scheduling: failed work respawns cleanly, fresh input regenerated after each cycle

**The test:**
1. What happens if this runs twice in a row?
2. What happens if the previous run crashed at every possible point?
3. Does re-execution converge to the same end state?

If any answer is "it depends on what state was left behind," the operation needs a reconciliation step.

来源见 [说明](references/sources.md)。
