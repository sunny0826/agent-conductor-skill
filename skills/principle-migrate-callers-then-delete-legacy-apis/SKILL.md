---
name: principle-migrate-callers-then-delete-legacy-apis
description: "没有外部兼容承诺且允许协调迁移时，同一轮迁移内部调用者并删除旧接口，避免双路径长期并存。"
---

# 迁移调用者后删除旧接口

以下保留上游原则原文；在当前任务与既有授权内应用，不自动提交、变基、删除用户数据或修改外部系统。

# Migrate Callers Then Delete Legacy APIs

When we decide a new API is the right design, migrate callers and remove the old API in the same refactor wave instead of preserving compatibility layers.

**Rule:**
- Do not keep legacy API paths only because internal callers still exist
- Inventory callers, migrate them, and delete the old API immediately
- Treat temporary adapters as exceptional and time-boxed, not default architecture
- Update tests to assert the new contract, and delete tests that only protect pre-refactor implementation details

**When this applies:**
- No external users depend on backward compatibility
- The project can absorb coordinated breaking changes
- The new API is part of a simplification or refactor initiative

来源与适配见 [说明](references/sources.md)，保留 [MIT 许可](LICENSE)。
