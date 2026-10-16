---
name: principle-type-system-discipline
description: "设计类型或签名时编码合法状态、语义标识与穷尽分支，在边界解析外部数据，并从权威模式派生类型。"
---

# 用类型表达约束

以下保留上游原则原文；在当前任务与既有授权内应用，不自动提交、变基、删除用户数据或修改外部系统。

# Type System Discipline

Make the compiler reject impossible states, mismatched primitives, and unhandled variants. Prefer defining errors and special cases out of existence over proliferating handlers. For TypeScript syntax, see [typescript-best-practices](../typescript-best-practices/SKILL.md).

- **Brand semantic primitives.** `UserId` and `OrderId` are strings underneath but should not be interchangeable. Give each its own type, such as a branded intersection in TypeScript or a newtype elsewhere. Validate once at creation, trust the type downstream. If two arguments share a primitive type but mean different things, brand them.
- **External data is untyped until parsed.** RPC payloads, JSON, IPC messages, CLI args, config files, environment variables, database rows. Have a parse function at every boundary that turns unstructured input into the typed model. The [boundary-discipline](../principle-boundary-discipline/SKILL.md) principle says where to put validation.
- **Derive types from authoritative schemas.** When a protocol buffer, OpenAPI spec, GraphQL schema, database migration, design-token file, or another file owns a shape, derive from it instead of hand-rolling a parallel type. See [encode-lessons-in-structure](../principle-encode-lessons-in-structure/SKILL.md).

来源与适配见 [说明](references/sources.md)，保留 [MIT 许可](LICENSE)。
