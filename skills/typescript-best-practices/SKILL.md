---
name: typescript-best-practices
description: "阅读或修改 .ts、.tsx 时，建模合法状态、校验外部输入并保持穷尽与可观察测试；不为一个检查新增框架或重构无关代码。"
---

# TypeScript 类型与边界

先读包内 [类型约束](../principle-type-system-discipline/SKILL.md)，输入位置由 [边界原则](../principle-boundary-discipline/SKILL.md) 决定。具体例子按需读 [patterns](references/patterns.md)，示意类型需补实际项目定义，不冒充完整可编译程序。

| 规则 | 应用 |
|---|---|
| 可辨别联合 | 用 kind／type／tag 字面量区分变体，不用 optional 字段袋表达互斥状态。 |
| 语义品牌 | id 等同底层类型而含义不同的值需现有 branded／opaque 约定，创建时校验，内部信任。 |
| 构造式模型 | 非空用头加尾、成对值用元组对；范围用 start 与经过非负校验的 duration，普通 number 本身不能证明非负。 |
| 最简单的全定义类型 | 操作对空数组有正确答案就用 T[]；head 等无答案时选择 NonEmpty 或返回可选值，不盲目加强。 |
| unknown 而非 any | 外部 payload、JSON、IPC、配置、文件和数据库输入先作为 unknown，解析后成为领域类型。 |
| 先用既有 schema | 复用项目现有运行时校验库和 schema，并从它派生类型；不要维护 schema、interface、guard 三份事实。 |
| 不欺骗编译器 | as 和 ! 不是验证，只有已证事实且现有表达确实不足时才用有依据的边界转换。 |
| 缩小类型顺序 | 判别字段分支优于 in，继而 typeof／instanceof、真实 guard，最后有证据的断言。 |
| 真正的 guard | 验证它声明的全部性质，isX／hasX 名称不能替代证明。 |
| 穷尽分支 | 未处理新变体时编译应失败，default 用 never 绑定，对值返回与 void 分支使用适合形式。 |
| satisfies | 要检查值而保留字面量类型时优先 satisfies，不用 as 强制伪装。 |
| 边界解析 | 验证一次后传具名领域类型，Record<string, unknown> 在解析边界止步；未知字段策略取决于真实协议。 |
| 权威 schema 派生 | proto、OpenAPI、GraphQL、数据库等已有形状就生成或用 Pick／Omit／Parameters／ReturnType／Awaited／typeof 派生。 |
| 对象参数 | 有误换位置风险的普通调用优先具名对象；每帧渲染、解析等热路径先考虑实际分配成本。 |
| 真实测试 | 运行能本地运行的真实代码，框架有泄漏／dispose 检查则使用；仅不可本地运行的边界才 mock，UI 须真实构建验证。 |
| 结构化诊断 | 产品使用项目已有结构化 logger 与可定位上下文，不为临时证明日志新建遥测系统。 |

按任务范围应用，用项目现有类型检查、测试或运行方式证明实际改动。工具缺失明确未验证，不能把读过模式或示例语法当作编译通过。

来源与适配见 [说明](references/sources.md)，保留 [MIT 许可](LICENSE)。
