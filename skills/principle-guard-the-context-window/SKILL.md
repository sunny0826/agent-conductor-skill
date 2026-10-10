---
name: principle-guard-the-context-window
description: "大输出与长任务分阶段读取，保留必要证据并控制主上下文负担。"
---

# 大输出与长任务分阶段读取，保留必要证据并控制主上下文负担。

以下保留上游原则原文；只在当前任务与授权范围内应用，不因此扩大重构、修改用户状态或自动提交。固定文件数属于阅读成本启发式，不是验收硬门槛。

# Guard the Context Window

The context window is finite and non-renewable within a session. Every token should be worth its cost.

**Why:** Context overflow degrades reasoning quality, creates compression artifacts, and halts progress.

**Pattern:**
- **Isolate large payloads.** When delegation is available and authorized, route verbose outputs, screenshots, and large documents to isolated subagents; otherwise read bounded portions locally. The main context gets summaries, not raw data.
- **Keep frequently used content inline.** Templates and references used on every invocation belong in the skill file, not in separate files that cost a read each time.
- **Size phases and cap scope.** Limit files per phase, set turn budgets, account for mechanism costs.

来源见 [说明](references/sources.md)。
