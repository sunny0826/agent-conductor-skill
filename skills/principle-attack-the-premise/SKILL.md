---
name: principle-attack-the-premise
description: "多次修复在同一检查失败且共享同一前提时，先写下前提并直接检验，再决定下一修。"
---

# 质疑共同前提

以下保留上游原则原文；在当前任务与既有授权内应用，不自动提交、变基、删除用户数据或修改外部系统。

# Attack the Premise

When two or more fixes that share one premise have failed the same gate, suspect the premise, not the fixes.

**Why:** Each failed fix is evidence against the belief it assumed. A third fix on the same premise spends effort where the evidence already says the cause is not.

**Pattern:**
- **Write the premise down.** The premise is the one sentence that every failed fix assumed.
- **Test the premise before the next fix.** Find an observation that would come out differently if the premise were false, and make it. Look at how the failures are distributed, not only at how large they are. Make the check rerunnable per [Build the Lever](../principle-build-the-lever/SKILL.md).
- **Follow the evidence.** If it contradicts the premise, the cause is elsewhere. Look for what the failures have in common that the premise did not predict. If it confirms the premise, ask the next "why" per [Fix Root Causes](../principle-fix-root-causes/SKILL.md). The earlier fixes may have treated a consequence instead of the cause.
- **Remove the condition instead of compensating for it**, per the [Laziness Protocol](../principle-laziness-protocol/SKILL.md). If the evidence shows that one part always lands on the losing side, change what puts it there. A mechanism that cleans up after it leaves the cause in place and adds work on every run.

**Stop:** Do not start the next fix before the premise is written down and tested.

This principle is distinct from [Redesign from First Principles](../principle-redesign-from-first-principles/SKILL.md), which rebuilds a design around a new requirement. It questions a fact the current design assumes.

来源与适配见 [说明](references/sources.md)，保留 [MIT 许可](LICENSE)。
