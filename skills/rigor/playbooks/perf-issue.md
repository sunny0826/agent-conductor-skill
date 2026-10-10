# 定位并改善一次性能问题

1. 捕获真实基线 trace，用 [benchmark-checklist](../../benchmark-checklist/SKILL.md) 核验基线和每次后续数字。
2. 用 [how](../../how/SKILL.md) 解释测得路径，按成本优先试：不做无人使用的工作、不重复做、少做、晚做、离开关键等待路径做、并发做、降低单次成本。前项达到目标即可停止。
3. 从 trace 定修复，结构问题先 [architect](../../architect/SKILL.md)，每次改变后验证再做下一次。
4. 对可比原始产物做解析和前后比较，不同负载、不同结果、不公平调优或噪声覆盖差异不能判赢。
5. 交付基线／改后指标、单位、差值、次数波动、瓶颈、真实工作与产物路径。需要持续优化用 [Hillclimb](hillclimb.md)；已有 PR 授权才 [Opening](opening-a-pr.md)。
