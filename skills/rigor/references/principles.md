# 原则目录

只在当前判断确实需要时读完整叶技能，不因目录存在扩大范围。

<!-- generated:principles -->
- [principle-attack-the-premise](../../principle-attack-the-premise/SKILL.md)：多次修复在同一检查失败且共享同一前提时，先写下前提并直接检验，再决定下一修。
- [principle-boundary-discipline](../../principle-boundary-discipline/SKILL.md)：设计输入解析、错误处理或模块接口时，在外部边界验证输入，内部依赖明确契约，隔离传输与领域逻辑。
- [principle-build-the-lever](../../principle-build-the-lever/SKILL.md)：非平凡编辑、迁移、分析或验证时，将做法做成最小可复跑工具，而不是重复手工操作。
- [principle-encode-lessons-in-structure](../../principle-encode-lessons-in-structure/SKILL.md)：同类错误或纠正第二次出现时，把约束编码到类型、检查或单一实现中，而不是再写一条说明。
- [principle-exhaust-the-design-space](../../principle-exhaust-the-design-space/SKILL.md)：新结构没有明确先例时，比较结构不同的设计，不把改名当作探索。
- [principle-experience-first](../../principle-experience-first/SKILL.md)：产品、交互或功能取舍时，从实际使用者和维护者的体验选择目标，减少粗糙功能和无用选项。
- [principle-explain-the-number](../../principle-explain-the-number/SKILL.md)：相信、报告或据测量选型前，找到真实瓶颈，并排除错误、跳过工作、未调优和噪声。
- [principle-fix-root-causes](../../principle-fix-root-causes/SKILL.md)：修复问题时复现并追到系统第一次出错的地方。状态合法时，就地处理是修复；状态不该存在时，防御分支只是掩盖。
- [principle-foundational-thinking](../../principle-foundational-thinking/SKILL.md)：设计新系统或核心结构时，先确定数据形状、访问模式和归属，再设计逻辑与抽象。
- [principle-guard-the-context-window](../../principle-guard-the-context-window/SKILL.md)：处理大输出、长任务或大量文件时，分阶段读取，保留必要证据并控制主上下文负担。
- [principle-laziness-protocol](../../principle-laziness-protocol/SKILL.md)：写或重构代码时，优先少代码、单一事实来源和隐藏复杂度的接口，减少无价值透传。
- [principle-make-operations-idempotent](../../principle-make-operations-idempotent/SKILL.md)：有重试、启动恢复或重复执行时，从当前状态推导下一步，使部分失败后仍能收敛到同一终态。
- [principle-migrate-callers-then-delete-legacy-apis](../../principle-migrate-callers-then-delete-legacy-apis/SKILL.md)：没有外部兼容承诺且允许协调迁移时，同一轮迁移内部调用者并删除旧接口，避免双路径长期并存。
- [principle-minimize-reader-load](../../principle-minimize-reader-load/SKILL.md)：评估可维护性或新增分层、状态时，减少理解任务必须追踪的层级、隐含状态与手工同步。
- [principle-model-the-domain](../../principle-model-the-domain/SKILL.md)：写状态逻辑或重复分支时，用符合领域的数据结构表达状态、归属与约束，避免散落的布尔值和重复假设。
- [principle-never-block-on-the-human](../../principle-never-block-on-the-human/SKILL.md)：已授权的可逆工作可自主推进并交付可评审结果，保留用户指定关口，不把执行自主性当作外部操作授权。
- [principle-outcome-oriented-execution](../../principle-outcome-oriented-execution/SKILL.md)：执行已授权的计划性迁移或重写时，以完整最终状态为目标，限定中间破坏范围并验证最终行为。
- [principle-prove-it-works](../../principle-prove-it-works/SKILL.md)：声明完成前，核验真实产物与行为，不能以摘要、编译或时间戳替代效果证明。
- [principle-redesign-from-first-principles](../../principle-redesign-from-first-principles/SKILL.md)：新约束使结构失效时，重新设计并同步类型、调用者、文档和例子。
- [principle-separate-before-serializing-shared-state](../../principle-separate-before-serializing-shared-state/SKILL.md)：多个执行者可能共享可变状态时，先划分写入归属，确需共享的状态使用真实并发机制。
- [principle-sequence-verifiable-units](../../principle-sequence-verifiable-units/SKILL.md)：多步迁移、批量改动或交付时，每个单元以可检验状态结束，先验证当前单元再依赖它继续。
- [principle-subtract-before-you-add](../../principle-subtract-before-you-add/SKILL.md)：增加抽象或补丁前，先删除本轮替代的冗余与不必要状态。
- [principle-test-behavior-not-implementation](../../principle-test-behavior-not-implementation/SKILL.md)：编写或保留测试时，断言使用者能观察到的结果：行为坏了必须失败，只改内部实现必须仍通过。
- [principle-type-system-discipline](../../principle-type-system-discipline/SKILL.md)：设计类型或签名时，编码合法状态、语义标识与穷尽分支，在边界解析外部数据，并从权威模式派生类型。
<!-- /generated -->

## 容易混淆的取舍

- 有计划、已声明破坏范围的迁移或重写用 outcome-oriented-execution；其余批量改动用 sequence-verifiable-units，绿了才前进。
- laziness-protocol 决定写多少代码；subtract-before-you-add 决定先删什么；minimize-reader-load 衡量读者要追踪什么。
- foundational-thinking 定工作顺序；model-the-domain 选数据结构；type-system-discipline 让编译器执行约束。
