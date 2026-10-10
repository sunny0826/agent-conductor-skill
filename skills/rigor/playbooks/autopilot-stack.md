# 构建验证队列，交用户落地

与 [Autopilot-full](autopilot-full.md) 同样建立 owner、早期轨迹、children、真实 head、当前检查与 root 独立每轮验证，但任何 owner 都不能 merge、arm auto-merge 或 close。要求先展示计划时等明确 go，停止时立即零写入。

通过结果成为 STACK-READY 精确 head，只有 clean verdict 的项才能进入一个线性 parent-branch 链。owner 只写自己的代码分支，root 是唯一拓扑拥有者：获取精确 parent tip，在授权内变基／安全推送并 retarget，只有根 PR 指向 trunk。不能两个 Agent 同时 restack，也不需要外部堆栈工具。

root 从底到顶吸收 trunk 漂移，冲突由对应代码 owner 处理；每个改写后的 head 按 [Shipping](shipping.md) 的 patch-id 适用性和新 CI／mergeability 重验，失效返回独立验证。新 gate 提高沿用完整流程的复核关口。

真实能力下审计 owner 和孩子、收敛全部活动，不凭本地历史或 mtime 宣称 alive。最后交付可自底向上审核的一条线性链、每项 verifier 的真实版本／结论、根与顶链接、暂停／排除原因，由用户落地。没有 landing 授权也不在结尾悄悄合并。
