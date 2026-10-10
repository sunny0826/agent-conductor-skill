---
name: principle-sequence-verifiable-units
description: "多步迁移、批量改动或交付时，每个单元以可检验状态结束，先验证当前单元再依赖它继续。"
---

# 逐单元验证工作

以下保留上游原则原文；在当前任务与既有授权内应用，不自动提交、变基、删除用户数据或修改外部系统。

# Sequence work into verifiable units

Order work as a sequence of small units, each ending in a state you can check, and don't advance until the current one is green.

**Why:** A break caught at the unit that caused it is cheap to localize. A break caught after a batch is buried, and you have already built further on a broken base. Sequencing those same units into a delivery a reviewer can replay turns "trust me" into "watch it go red, then green."

**Execution.** In a sweep, migration, or any run of similar edits, verify each change before starting the next. Each unit is a before/after bracket: known-good state, one change, run the check, then proceed. Rebase onto clean trunk first so every check measures against the real baseline. When a lever does the edits, the per-unit check is nearly free. Run it anyway.

**Delivery.** Stack commits and PRs in the order that proves the work. The canonical shape is the failing test first, then the fix on top. Other story orders are a subtraction before the reshape, a baseline capture before the treatment, the scaffold before the feature. Each commit lands on its own and the sequence reads as an argument.

The sequencing complement to the **prove-it-works** principle skill, which keeps each check real, and the **build-the-lever** principle skill, which makes the per-unit check cheap.

包内关联：[真实验证](../principle-prove-it-works/SKILL.md)、[工具](../principle-build-the-lever/SKILL.md)。变基仅在已授权且不会覆盖用户工作时执行。

来源与适配见 [说明](references/sources.md)，保留 [MIT 许可](LICENSE)。
