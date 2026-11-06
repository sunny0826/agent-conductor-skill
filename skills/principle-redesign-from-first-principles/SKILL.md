---
name: principle-redesign-from-first-principles
description: "新约束使结构失效时，重新设计并同步类型、调用者、文档和例子。"
---

# 从第一性原理重新设计

以下保留上游原则原文；只在当前任务与既有授权内应用，不因此扩大重构、自动提交、变基、删除用户数据或修改外部系统。

# Redesign From First Principles

When integrating a change, don't bolt it onto the existing design. Redesign as if the requirement had been there from the start.

- Read all affected files and understand the current design
- Ask: "if we were writing this from scratch with this new requirement, what would we build?"
- Propagate the change through every reference: types, docs, examples, rationale sections
- Think about the whole redesign, then deliver it incrementally

This is the method for preserving option value when integrating changes into an existing design.

来源见 [说明](references/sources.md)。
