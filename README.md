# agent-conductor-skill

本仓库提供 19 个技能。核心工程原则统一收录在 [rigor 原则清单](skills/rigor/references/principles.md)，不再作为独立技能分发。

`docs/` 整个目录仅供本地使用，不纳入 Git 跟踪，不上传 GitHub，也不打包进发布产物。私人会话分析、索引和审计产物保存在仓库外，不随技能修改提交或附入公开 PR。

两套技能分开使用。

- [rigor](skills/rigor/SKILL.md) 是工程流程。它按任务匹配流程，需要时读取对应原则，用真实证据交付（闭包：14 个技能，118 个文件；含链接到的 `agent-conductor`）。
- [agent-conductor](skills/agent-conductor/SKILL.md) 组织 Agent：发现可调用的配置，分配角色，路由子任务，按真实结果决定继续、返工或交付。模型配置是 [agent-conductor-setup](skills/agent-conductor-setup/SKILL.md)（闭包：4 个技能，31 个文件；不含 `rigor`）。

其余技能按任务选用；每个技能的发布 ZIP 只带上 Markdown 链接的传递闭包，可直接克隆使用 `skills/`、从 GitHub Releases 下载 ZIP，或在本地运行 `tools/package_skills.py` 生成 `dist/*.zip`。解压后目录要并排放着，不能只留下入口文件。宿主能发现项目级技能时，把需要的目录放进那个位置；不能发现时，让 Agent 读取对应的 `SKILL.md`。

本仓库是这些技能的唯一源：修改先进本仓库再部署到宿主安装位置，不在部署副本上单边改动，否则副本会与源分叉且改动无法追溯。

生成本地 `dist/*.zip`（已忽略、不纳入 Git）、更新下方技能表和技能目录，并运行全部结构与合约检查：

```bash
mise exec -- python3 tools/package_skills.py
mise exec -- python3 tools/package_skills.py --check --verify-dist
mise exec -- node tools/lint-skills.mjs
mise exec -- node --test tools/*.test.mjs
mise exec -- python3 -B -m unittest discover -s tools -p "test_*.py"
```

## 工作流

<!-- generated:readme -->
| 技能 | 用途 | 闭包规模 |
|---|---|---|
| [agent-conductor](skills/agent-conductor/SKILL.md) | 组织 Agent 协作完成任务：核对目标和授权，分配角色、拆解依赖、路由子任务、协调执行并以真实结果决定继续、返工或交付。用于用户要求组织多个 Agent、分配工作、协调执行、检查 AI 执行链路或验证任务结果。需要发现本地 Agent、配置角色模型或调整预算时，调用配套 agent-conductor-setup。 | 4 个技能 / 31 个文件 |
| [agent-conductor-setup](skills/agent-conductor-setup/SKILL.md) | 基于 Lody 发现全部 Agent 和模型，配置角色模型与推理预算：分页枚举 Lody 的机器、Agent 配置（含推理档位）与 Agent 角色，让用户选择角色组合与预算，生成项目级角色配置。用于用户要求发现 Agent 或模型、首次配置、更新角色模型、调整预算或修复调用配置；也供 agent-conductor 在任务组织前调用。 | 1 个技能 / 6 个文件 |
| [architect](skills/architect/SKILL.md) | 先理解现有系统，再比较结构方案，从调用者用法推导类型、接口与模块归属，并在实施中复核设计。用于架构设计、模块边界或非平凡结构变更；只要求设计时不自动实施，普通小改动不强制启用。 | 4 个技能 / 31 个文件 |
| [authoring-a-skill](skills/authoring-a-skill/SKILL.md) | 用户要求创建或修改技能时，确定触发范围、产物和权限，写出精简正文并核对引用、依赖与归档；普通文档不启用。 | 2 个技能 / 8 个文件 |
| [benchmark-checklist](skills/benchmark-checklist/SKILL.md) | 核验具体性能主张的瓶颈、公平性、资源上限、正确性、重复性、端到端意义与实际工作。用于执行性能测量、报告提速或退化、据数字选型；不作为普通任务的强制检查。 | 1 个技能 / 4 个文件 |
| [blast-radius](skills/blast-radius/SKILL.md) | 分析指定改动可能破坏的间接消费方与跨边界行为，用真实代码检验关键安全假设。用于改动影响分析、排查 diff 外风险或回答‘这会影响哪里’；不代替完整功能验收，不自动修复产品。 | 1 个技能 / 4 个文件 |
| [clean-ui-copy](skills/clean-ui-copy/SKILL.md) | 用户要求排查或清理界面中的防御性免责文案、冗余解释文本、实现边界泄漏或装饰性眉题时，先按页面与展示层级全量盘点、按删除/折叠/短标签/保留四级裁决并确认，再实施清理、松绑脆测试并复核无误删；长文润色用 unslop，工程门禁与仓库减负用 fkgpt6。 | 1 个技能 / 4 个文件 |
| [control-ui](skills/control-ui/SKILL.md) | 使用项目已有或宿主可用的浏览器、应用控制工具驱动真实 UI，截图并核对交互结果。用于 Web、Electron 与桌面界面的复现、验收和截图交付；不依赖特定编辑器，不生成模拟界面冒充证据。 | 1 个技能 / 5 个文件 |
| [correct](skills/correct/SKILL.md) | 用户要求防止本仓库反复出现的 Agent 错误时，收集重复实例并优先用架构、类型、检查或测试消除错误，文档只保留判断规则。 | 1 个技能 / 4 个文件 |
| [create-verification-skill](skills/create-verification-skill/SKILL.md) | 根据项目事实生成或全面审计维护可复用的 verify-项目名 验收技能与功能地图，并实际跑通验证。用于用户要求建立或审计维护验收技能，或已授权实施确需且缺少此能力时；执行已有验收请使用项目的 verify 技能，纯解释、只读审查与一次性小修改不触发生成。 | 2 个技能 / 10 个文件 |
| [fkgpt6](skills/fkgpt6/SKILL.md) | 用户要求排查项目冗余门禁、慢测、强行哈希、重型 CI、打包膨胀、仓库卫生或文档隐形锁并减负清理时，先实测盘点、按保留/后移/拆除分级确认，再分波清理并做防误删复核；局部代码与注释清理用 rigor 代码检查，防御性 UI 文案清理用 clean-ui-copy。 | 1 个技能 / 4 个文件 |
| [how](skills/how/SKILL.md) | 从真实源码解释系统如何工作，追踪入口、调用链、数据流、状态归属与模块边界。用于代码导读、修改前理解子系统，或回答‘放在哪里、由谁负责、属于哪一层’；设计动机需要历史证据，不凭现状猜测。 | 1 个技能 / 6 个文件 |
| [interrogate](skills/interrogate/SKILL.md) | 多模型交叉审核：让不同模型独立检查同一证据包，由主审核实、去重并裁决。用于明确要求交叉审核、对抗审查或具体任务需要多模型排查盲点；普通 review 不强制启用，不替代影响分析或功能验收。 | 3 个技能 / 16 个文件 |
| [reflect](skills/reflect/SKILL.md) | 用户明确要求 reflect 或会话复盘时，从本次证据提炼持久改进，综合三种视角并提出技能修改；不自动应用或写外部工单。 | 3 个技能 / 16 个文件 |
| [rigor](skills/rigor/SKILL.md) | 用于需要跨文件修改、调查或证据交付的非平凡工程任务：匹配包内流程，按相关原则决策，以真实证据交付。闲聊与普通小改动不启用。发现和派发 Agent 用 agent-conductor。 | 14 个技能 / 118 个文件 |
| [tdd](skills/tdd/SKILL.md) | 在修复错误或实现新行为前用最小检查证明失败，完成后用同一检查证明通过。用于用户要求 TDD、失败测试或回归测试，或错误存在明确且低成本的本地测试路径时；不为测试路径不清或代价过高的小改动强行搭建测试环境。 | 1 个技能 / 4 个文件 |
| [typescript-best-practices](skills/typescript-best-practices/SKILL.md) | 修改 .ts、.tsx 的类型、接口或外部输入边界时，建模合法状态、校验外部输入并保持穷尽与可观察测试；纯阅读不启用，不为一个检查新增框架或重构无关代码。 | 1 个技能 / 5 个文件 |
| [unslop](skills/unslop/SKILL.md) | 撰写或润色技术文档、RFC、README、PR 描述、提交说明、解释和评审文字时，明确文档目的并用真实符号写清楚，同时清理套话、虚假归因、术语堆积和机械表达；不替代产品 UI 文案规则，不为风格改动代码或逐字引用。 | 1 个技能 / 4 个文件 |
| [why](skills/why/SKILL.md) | 用户问“为什么这样写”或“当时怎么决定的”时，从源码历史和实际可访问材料追溯设计动机，区分直接证据、支持、推导、假设和未知；解释当前运行机制用 how。 | 2 个技能 / 16 个文件 |
<!-- /generated -->
