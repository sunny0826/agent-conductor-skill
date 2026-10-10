# 包内设计原则

逐项按当前任务适用，不扩大授权。

- [新结构没有明确先例时，比较结构不同的设计，不把改名当作探索。](../../principle-exhaust-the-design-space/SKILL.md)
- [设计时先确定数据形状、访问模式和归属，再设计逻辑与抽象。](../../principle-foundational-thinking/SKILL.md)
- [授权迁移以完整最终状态为目标，限定中间破坏范围并验证最终行为。](../../principle-outcome-oriented-execution/SKILL.md)
- [新约束使结构失效时，重新设计并同步类型、调用者、文档和例子。](../../principle-redesign-from-first-principles/SKILL.md)
- [修复问题时复现并追溯根因，避免用防御分支掩盖结构或持久状态问题。](../../principle-fix-root-causes/SKILL.md)
- [增加抽象或补丁前，先删除本轮替代的冗余与不必要状态。](../../principle-subtract-before-you-add/SKILL.md)
- [并行工作前划分写入归属，确需共享的状态使用真实并发机制。](../../principle-separate-before-serializing-shared-state/SKILL.md)
- [将反复出现的错误约束编码到类型、检查或单一实现中。](../../principle-encode-lessons-in-structure/SKILL.md)
- [在外部边界验证输入，内部依赖明确契约，隔离传输与领域逻辑。](../../principle-boundary-discipline/SKILL.md)
- [有重试、启动恢复或重复执行时，验证多次执行与部分失败能收敛。](../../principle-make-operations-idempotent/SKILL.md)
- [优先少代码、单一事实来源和隐藏复杂度的接口，减少无价值透传。](../../principle-laziness-protocol/SKILL.md)
- [减少理解任务必须追踪的层级、隐含状态与手工同步。](../../principle-minimize-reader-load/SKILL.md)
- [完成前核验真实产物与行为，不能以摘要、编译或时间戳替代效果证明。](../../principle-prove-it-works/SKILL.md)
- [大输出与长任务分阶段读取，保留必要证据并控制主上下文负担。](../../principle-guard-the-context-window/SKILL.md)
