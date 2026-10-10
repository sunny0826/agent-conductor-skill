---
name: principle-foundational-thinking
description: "设计时先确定数据形状、访问模式和归属，再设计逻辑与抽象。"
---

# 设计时先确定数据形状、访问模式和归属，再设计逻辑与抽象。

以下保留上游原则原文；只在当前任务与授权范围内应用，不因此扩大重构、修改用户状态或自动提交。固定文件数属于阅读成本启发式，不是验收硬门槛。

# Foundational Thinking

**Structural decisions** protect option value. **Code-level decisions** protect simplicity.

**Data structures first.** Get the data shape right before writing logic. Define core types early, trace every access pattern, and choose structures that match the dominant paths.

At code level, DRY the structure, not every line. Types and data models should converge. Three similar statements still beat a premature abstraction. Prefer explicit over clever. Test behavior and edge cases, not line counts.

**Concurrency corollary.** Before sharing state between actors, ask "what happens if another actor modifies this concurrently?" If not "nothing", isolate.

**Scaffold first.** If something helps every later phase, do it first. Ask "does every subsequent phase benefit from this existing?" CI, linting, test infrastructure, and shared types are scaffold. Sequence for option value: setup before features, tests before fixes. Keep commits small and single-purpose.

Each increment should land a coherent abstraction or deepen one that exists. Do not spread a new capability across callers as special-case coordination.

Subtraction comes before scaffolding. Remove dead code first, then lay foundations.

来源见 [说明](references/sources.md)。
