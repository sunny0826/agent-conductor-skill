---
name: principle-guard-the-context-window
description: "处理大输出、长任务或大量文件时，分阶段读取，保留必要证据并控制主上下文负担。"
---

# 保护上下文窗口

以下保留上游原则原文；只在当前任务与既有授权内应用，不因此扩大重构、自动提交、变基、删除用户数据或修改外部系统。固定文件数属于阅读成本启发式，不是验收硬门槛。

# Guard the Context Window

The context window is finite and non-renewable within a session. Every token should be worth its cost.

**Why:** Context overflow degrades reasoning quality, creates compression artifacts, and halts progress.

**Pattern:**
- **Isolate large payloads.** When delegation is available and authorized, route verbose outputs, screenshots, and large documents to isolated subagents; otherwise read bounded portions locally. The main context gets summaries, not raw data.
- **Keep frequently used content inline.** Templates and references used on every invocation belong in the skill file, not in separate files that cost a read each time.
- **Size phases and cap scope.** Limit files per phase, set turn budgets, account for mechanism costs.

来源见 [说明](references/sources.md)。
