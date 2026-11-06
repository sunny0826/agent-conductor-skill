---
name: principle-exhaust-the-design-space
description: "新结构没有明确先例时，比较结构不同的设计，不把改名当作探索。"
---

# 比较不同结构

以下保留上游原则原文；只在当前任务与既有授权内应用，不因此扩大重构、自动提交、变基、删除用户数据或修改外部系统。

# Exhaust the Design Space

When a novel interaction or architectural decision has no established precedent, explore several concrete alternatives before implementation. Building the wrong thing costs more than exploring three options.

**The rule.** When the right answer is not obvious, build 2-3 competing prototypes or sketches. Compare them side by side. Only then commit. Design it twice is this rule by another name. A second flavor of the first shape does not count.

**When it applies:**
- Novel UI interactions (no prior art in the codebase)
- Architectural choices with multiple viable approaches
- Product design decisions where user experience depends on feel, not logic

**When it doesn't:**
- Mechanical implementation where the pattern is established
- Bug fixes or refactors with a clear target state
- Changes where constraints dictate a single viable approach

来源见 [说明](references/sources.md)。
