---
name: principle-outcome-oriented-execution
description: "授权迁移以完整最终状态为目标，限定中间破坏范围并验证最终行为。"
---

# 授权迁移以完整最终状态为目标，限定中间破坏范围并验证最终行为。

以下保留上游原则原文；只在当前任务与授权范围内应用，不因此扩大重构、修改用户状态或自动提交。固定文件数属于阅读成本启发式，不是验收硬门槛。

# Outcome-Oriented Execution

Optimize for the intended, verifiable end state rather than preserving smooth intermediate states.

**Why:** Keeping every intermediate step fully stable often creates temporary compatibility code that becomes long-lived debt. Converge on the target architecture and prove correctness at explicit verification boundaries.

**Core rule:**
- Prioritize end-state integrity over transitional stability
- Intermediate breakage is acceptable when it is planned, scoped, and reversible

**Guardrails:**
- Use this for planned rewrites and migrations with explicit phase boundaries
- Declare where temporary breakage is acceptable
- Keep high-signal checks for actively touched areas while migrating
- Require full static and runtime verification at plan completion

来源见 [说明](references/sources.md)。
