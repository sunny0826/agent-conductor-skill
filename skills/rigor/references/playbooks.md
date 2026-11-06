# 执行流程目录

先匹配范围再读对应流程；原型、调查、计划、实施、PR 状态和落地是不同任务。

- [autonomous-run](../playbooks/autonomous-run.md)：持续推进一个可检查的完成条件，直到达成或确认受阻
- [autopilot-full](../playbooks/autopilot-full.md)：用户授权独立 PR 队列的全生命周期，owner 构建到合并
- [autopilot-stack](../playbooks/autopilot-stack.md)：同样建队列并验证，但 owner 不合并，由用户落地线性 stack
- [babysit](../playbooks/babysit.md)：跟进已有 PR 的状态、CI 和评审；选明确模式
- [bug-fix](../playbooks/bug-fix.md)：复现并修复一个错误
- [eval](../playbooks/eval.md)：盲测技能或结构变化，由独立评判比较行为
- [feature](../playbooks/feature.md)：实现一个新功能
- [hillclimb](../playbooks/hillclimb.md)：围绕一个指标反复改进并验证
- [investigation](../playbooks/investigation.md)：只读调查，交付发现，不修改产品
- [multi-phase-plan](../playbooks/multi-phase-plan.md)：只写多阶段实施计划，停在计划
- [opening-a-pr](../playbooks/opening-a-pr.md)：把已完成的改动开成 PR
- [orchestrate](../playbooks/orchestrate.md)：协调持续多日、多单元的项目
- [pause-safely](../playbooks/pause-safely.md)：安全暂停进行中的工作并留下恢复点
- [perf-issue](../playbooks/perf-issue.md)：定位并改善性能问题
- [prototype](../playbooks/prototype.md)：用一次性原型回答一个问题
- [refactoring](../playbooks/refactoring.md)：不改变行为地调整结构
- [runtime-forensics](../playbooks/runtime-forensics.md)：捕获活进程的 CPU、heap、trace 或日志并定位机制
- [session-pickup](../playbooks/session-pickup.md)：接手某个具体的既有会话
- [shipping](../playbooks/shipping.md)：用户明确要求合并或落地
- [trace-forensics](../playbooks/trace-forensics.md)：分析已有捕获产物，不重跑
- [visual-parity](../playbooks/visual-parity.md)：让界面与设计或参考实现视觉一致
- [worktree-cleanup](../playbooks/worktree-cleanup.md)：清理不再需要的 worktree 和分支

编写或修改技能用独立的 [authoring-a-skill](../../authoring-a-skill/SKILL.md)。
