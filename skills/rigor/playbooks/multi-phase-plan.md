# 多阶段与多 PR 计划

拥有计划，不写产品实现。一个或两个文件且做法显然可不建正式计划，说明原因；用户只要求计划则停在交付。开放的实证选择先用 [原型](prototype.md) 解决，保存 branch／SHA／产物，不能把事实问题交用户猜；真实偏好给选项。

用实际源码确定边界、约定、入口与命令。复杂范围可按已有授权与实际能力独立调查，不能假定固定的 Agent 名称或云模型。复制 [计划模板](../assets/plan-template.md)，填每个占位，默认项目约定 docs 路径，每 PR 一可验证单元；保留模板字段顺序。执行流程按独立队列选 [full](autopilot-full.md)、用户落地选 [stack](autopilot-stack.md)，跨会话 standing program 选 [Orchestrate](orchestrate.md)。

按 [technical-writing](../../technical-writing/SKILL.md) 写主体 how-to，解释／参考进附录，再用 [unslop](../../unslop/SKILL.md)。模板固定英文结构标签供确定性检查，字段内容可中文；不对中文强制英语标点规则。运行本技能 `scripts/check-plan.mjs <plan.md>`（Node），修每项诊断。结构通过不证明计划可执行、指标真实或产品已验证。

## 验证合同

每 verification block 以模板 RULE 开头；unit、live、perf 缺任何必需证据均不能通过。live 必有十个独立具体 scenario／artifact／pass predicate，按 [swarm](../../swarm/SKILL.md) 实际可用模型与容量执行，不硬编码模型，缺十项完整证据标缺口。至少一项 Regression lane against trunk，基线无功能记录事实并验证新增行为和用户等到的终态，不伪造 trunk 结果。

按包内 [真实表面](../references/verification-surfaces.md) 驱动实际 Browser／CLI／TUI／模拟器等，两个表面都覆盖；UI 保存截图，其他保存真实原始输出等适当产物，不是一律伪造 PNG。缺驱动条件记 Appendix C，但 lane 仍写如何执行。使用实际隔离环境，不假定 cloud VM。

perf 写两侧 metric、交错 probe、先测 trunk baseline、会失败的数值 rule，用 [benchmark-checklist](../../benchmark-checklist/SKILL.md) 核对工作与结果。trunk 缺功能，分别预算 diff-added work 和用户终态；不同场景不能 ratio。确不影响可测工作时写不适用的机制证据，不拿空数值假装性能获证。

交互变更保留用户 review gate，截图与 30–60 秒视频在已有聊天交付方式下供查看，merge-ready 后等待约定操作；明确无交互写 `None. <PR id> is not review-gated.`，无 boxes。每新 patch 独立 gates、live、perf 与至少两个源码 audit lane，原版有效结果仅按 [Shipping](shipping.md) patch-id 规则保留。宿主缺独立能力须说明而非降低合同。

只交付计划路径、PR 依赖／review-gated 集合、原型已证与未知、检查输出。计划请求不授权实施或 PR 操作，执行从用户 explicit go 开始；已明确给定的执行授权沿用，不重复索取。
