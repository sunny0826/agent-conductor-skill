# 原则技能目录

24 个原则技能按需读取；每个 ZIP 只带上该原则 Markdown 链接的传递闭包。入口与工作流技能见 [README](../README.md)。

| 技能 | 用途 | ZIP |
|---|---|---|
| [principle-attack-the-premise](../skills/principle-attack-the-premise/SKILL.md) | 多次修复在同一检查失败且共享同一前提时，先写下前提并直接检验，再决定下一修。 | [29 个文件](../dist/principle-attack-the-premise.zip) |
| [principle-boundary-discipline](../skills/principle-boundary-discipline/SKILL.md) | 在外部边界验证输入，内部依赖明确契约，隔离传输与领域逻辑。 | [3 个文件](../dist/principle-boundary-discipline.zip) |
| [principle-build-the-lever](../skills/principle-build-the-lever/SKILL.md) | 非平凡编辑、迁移、分析或验证时，将做法做成最小可复跑工具，而不是重复手工操作。 | [19 个文件](../dist/principle-build-the-lever.zip) |
| [principle-encode-lessons-in-structure](../skills/principle-encode-lessons-in-structure/SKILL.md) | 将反复出现的错误约束编码到类型、检查或单一实现中。 | [3 个文件](../dist/principle-encode-lessons-in-structure.zip) |
| [principle-exhaust-the-design-space](../skills/principle-exhaust-the-design-space/SKILL.md) | 新结构没有明确先例时，比较结构不同的设计，不把改名当作探索。 | [3 个文件](../dist/principle-exhaust-the-design-space.zip) |
| [principle-experience-first](../skills/principle-experience-first/SKILL.md) | 产品、交互或功能取舍时，从实际使用者和维护者的体验选择目标，减少粗糙功能和无用选项。 | [4 个文件](../dist/principle-experience-first.zip) |
| [principle-explain-the-number](../skills/principle-explain-the-number/SKILL.md) | 相信、报告或据测量选型前，找到真实瓶颈，并排除错误、跳过工作、未调优和噪声。 | [17 个文件](../dist/principle-explain-the-number.zip) |
| [principle-fix-root-causes](../skills/principle-fix-root-causes/SKILL.md) | 修复问题时复现并追到系统第一次出错的地方。状态合法时，就地处理是修复；状态不该存在时，防御分支只是掩盖。 | [3 个文件](../dist/principle-fix-root-causes.zip) |
| [principle-foundational-thinking](../skills/principle-foundational-thinking/SKILL.md) | 设计时先确定数据形状、访问模式和归属，再设计逻辑与抽象。 | [3 个文件](../dist/principle-foundational-thinking.zip) |
| [principle-guard-the-context-window](../skills/principle-guard-the-context-window/SKILL.md) | 大输出与长任务分阶段读取，保留必要证据并控制主上下文负担。 | [3 个文件](../dist/principle-guard-the-context-window.zip) |
| [principle-laziness-protocol](../skills/principle-laziness-protocol/SKILL.md) | 优先少代码、单一事实来源和隐藏复杂度的接口，减少无价值透传。 | [3 个文件](../dist/principle-laziness-protocol.zip) |
| [principle-make-operations-idempotent](../skills/principle-make-operations-idempotent/SKILL.md) | 有重试、启动恢复或重复执行时，从当前状态推导下一步，使部分失败后仍能收敛到同一终态。 | [3 个文件](../dist/principle-make-operations-idempotent.zip) |
| [principle-migrate-callers-then-delete-legacy-apis](../skills/principle-migrate-callers-then-delete-legacy-apis/SKILL.md) | 没有外部兼容承诺且允许协调迁移时，同一轮迁移内部调用者并删除旧接口，避免双路径长期并存。 | [4 个文件](../dist/principle-migrate-callers-then-delete-legacy-apis.zip) |
| [principle-minimize-reader-load](../skills/principle-minimize-reader-load/SKILL.md) | 减少理解任务必须追踪的层级、隐含状态与手工同步。 | [6 个文件](../dist/principle-minimize-reader-load.zip) |
| [principle-model-the-domain](../skills/principle-model-the-domain/SKILL.md) | 写状态逻辑或重复分支时，用符合领域的数据结构表达状态、归属与约束，避免散落的布尔值和重复假设。 | [4 个文件](../dist/principle-model-the-domain.zip) |
| [principle-never-block-on-the-human](../skills/principle-never-block-on-the-human/SKILL.md) | 已授权的可逆工作可自主推进并交付可评审结果，保留用户指定关口，不把执行自主性当作外部操作授权。 | [4 个文件](../dist/principle-never-block-on-the-human.zip) |
| [principle-outcome-oriented-execution](../skills/principle-outcome-oriented-execution/SKILL.md) | 授权迁移以完整最终状态为目标，限定中间破坏范围并验证最终行为。 | [3 个文件](../dist/principle-outcome-oriented-execution.zip) |
| [principle-prove-it-works](../skills/principle-prove-it-works/SKILL.md) | 完成前核验真实产物与行为，不能以摘要、编译或时间戳替代效果证明。 | [9 个文件](../dist/principle-prove-it-works.zip) |
| [principle-redesign-from-first-principles](../skills/principle-redesign-from-first-principles/SKILL.md) | 新约束使结构失效时，重新设计并同步类型、调用者、文档和例子。 | [3 个文件](../dist/principle-redesign-from-first-principles.zip) |
| [principle-separate-before-serializing-shared-state](../skills/principle-separate-before-serializing-shared-state/SKILL.md) | 并行工作前划分写入归属，确需共享的状态使用真实并发机制。 | [3 个文件](../dist/principle-separate-before-serializing-shared-state.zip) |
| [principle-sequence-verifiable-units](../skills/principle-sequence-verifiable-units/SKILL.md) | 多步迁移、批量改动或交付时，每个单元以可检验状态结束，先验证当前单元再依赖它继续。 | [23 个文件](../dist/principle-sequence-verifiable-units.zip) |
| [principle-subtract-before-you-add](../skills/principle-subtract-before-you-add/SKILL.md) | 增加抽象或补丁前，先删除本轮替代的冗余与不必要状态。 | [3 个文件](../dist/principle-subtract-before-you-add.zip) |
| [principle-test-behavior-not-implementation](../skills/principle-test-behavior-not-implementation/SKILL.md) | 编写或保留测试时，断言使用者能观察到的结果：行为坏了必须失败，只改内部实现必须仍通过。 | [4 个文件](../dist/principle-test-behavior-not-implementation.zip) |
| [principle-type-system-discipline](../skills/principle-type-system-discipline/SKILL.md) | 设计类型或签名时编码合法状态、语义标识与穷尽分支，在边界解析外部数据，并从权威模式派生类型。 | [15 个文件](../dist/principle-type-system-discipline.zip) |
