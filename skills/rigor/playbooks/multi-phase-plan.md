# 多阶段与多 PR 计划

拥有计划，不写产品实现。一个或两个文件且做法显然可不建正式计划，说明原因；用户只要求计划则停在交付。开放的实证选择先用 [原型](prototype.md) 解决，保存 branch／SHA／产物，不能把事实问题交用户猜；真实偏好给选项。

用实际源码确定边界、约定、入口与命令。复杂范围可按已有授权与实际能力独立调查，不能假定固定的 Agent 名称或云模型。复制 [计划模板](../assets/plan-template.md)，填每个占位，默认项目约定 docs 路径，每 PR 一可验证单元；保留模板字段顺序。执行流程按独立队列选 [full](autopilot-full.md)、用户落地选 [stack](autopilot-stack.md)，跨会话 standing program 选 [Orchestrate](orchestrate.md)。

按 [technical-writing](../../technical-writing/SKILL.md) 写主体 how-to，解释／参考进附录，再用 [unslop](../../unslop/SKILL.md)。模板固定英文结构标签供确定性检查，字段内容可中文；不对中文强制英语标点规则。运行本技能 `scripts/check-plan.mjs <plan.md>`（Node），修每项诊断。结构通过不证明计划可执行、指标真实或产品已验证。

## 验证合同

每 verification block 以模板 RULE 开头；unit、live、perf 缺任何必需证据均不能通过。live 的 lane 数由该 PR 的用户可见风险决定，不设固定十项：覆盖受影响的主要分支、拒绝路径和回归，每项有独立 scenario／artifact／pass predicate。按模板声明 `N lanes on`、`Risk: low|high`、`Coverage:` 和 `Audit lanes:`；Coverage 写场景选择、缩放理由与未覆盖范围。只读或低风险标 low；写路径、并发或安全敏感标 high。缺证据的 lane 标缺口，不凑数补齐。按 [swarm](../../swarm/SKILL.md) 实际可用模型与容量执行，不硬编码模型。至少一项 Regression lane against trunk，基线无功能记录事实并验证新增行为和用户等到的终态，不伪造 trunk 结果。

按包内 [真实表面](../references/verification-surfaces.md) 驱动实际 Browser／CLI／TUI／模拟器等；有多个受影响表面时分别覆盖，不为纯 CLI 任务构造 UI 验收。UI 保存截图，其他保存真实原始输出等适当产物，不是一律伪造 PNG。缺驱动条件记 Appendix C，但 lane 仍写如何执行。使用实际隔离环境，不假定 cloud VM。

perf 写两侧 metric、交错 probe、先测 trunk baseline、会失败的数值 rule，用 [benchmark-checklist](../../benchmark-checklist/SKILL.md) 核对工作与结果。trunk 缺功能，分别预算 diff-added work 和用户终态；不同场景不能 ratio。确不影响可测工作时写不适用的机制证据，不拿空数值假装性能获证。

交互变更保留用户 review gate，截图与 30–60 秒视频在已有聊天交付方式下供查看，merge-ready 后等待约定操作；明确无交互写 `None. <PR id> is not review-gated.`，无 boxes。纯 CLI/JSON 输出无交互时以真实回执为证据，不设截图或视频 lane。每新 patch 独立 gates、live、perf 与源码 audit lane（只读或低风险改动至少一个，写路径、并发或安全敏感至少两个），原版有效结果仅按 [Shipping](shipping.md) patch-id 规则保留。宿主缺独立能力须说明而非降低合同。模板和执行流程沿用本节风险规则与计划声明的数量；检查器只能核对结构，风险判定与覆盖是否充分仍须读实际改动。

只交付计划路径、PR 依赖／review-gated 集合、原型已证与未知、检查输出。计划与审查包含必要性维度：存在数量级更便宜的替代方案（如仅归档搬运对比格式迁移）时，连同代价差异作为选项提交用户，不默认选择更重的方案；验收深度按上文风险缩放，不因模板存在而全量套用。计划请求不授权实施或 PR 操作，执行从用户 explicit go 开始；已明确给定的执行授权沿用，不重复索取。规划过程中收到的新授权、决定或补充输入默认并入计划范围并记录来源，不因此转入实施；该输入是授权计划内容还是授权立即执行语义不明时，先确认归属再动产品文件，不自行选择更重的解读。
