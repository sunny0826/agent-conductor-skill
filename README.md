# agent-conductor-skill

本仓库提供 32 个任务技能和 24 个原则技能。按下方目录选择，或阅读[技能使用帮助](skills/skill-help/SKILL.md)。

`docs/` 整个目录仅供本地使用，不纳入 Git 跟踪，不上传 GitHub，也不打包进发布产物。私人会话分析、索引和审计产物保存在仓库外，不随技能修改提交或附入公开 PR。

[不依赖特定编辑器的提示模式](skills/skill-help/references/recipes.md#不依赖特定编辑器的提示模式)：代码审查、审查意见核实、PR 状态、持续执行和个人模式。

两套技能分开使用。

- [rigor](skills/rigor/SKILL.md) 是工程流程。它按任务匹配流程，需要时读取对应原则，用真实证据交付。[下载](dist/rigor.zip)（45 个技能，251 个文件）。这个 ZIP 含 rigor 链接到的 `agent-conductor`。
- [agent-conductor](skills/agent-conductor/SKILL.md) 组织 Agent：发现可调用的配置，分配角色，路由子任务，按真实结果决定继续、返工或交付。模型配置是 [agent-conductor-setup](skills/agent-conductor-setup/SKILL.md)。[下载](dist/agent-conductor.zip)（28 个技能，150 个文件）。这个 ZIP 不含 rigor。

其余技能按任务选用，各自的 ZIP 只带上 Markdown 链接的传递闭包。解压后目录要并排放着，不能只留下入口文件。宿主能发现项目级技能时，把需要的目录放进那个位置；不能发现时，让 Agent 读取对应的 `SKILL.md`。

本仓库是这些技能的唯一源：修改先进本仓库再部署到宿主安装位置，不在部署副本上单边改动，否则副本会与源分叉且改动无法追溯。

重新生成 `dist/`、下方技能表和技能目录，并运行结构检查：

```bash
mise exec -- python3 tools/package_skills.py
mise exec -- python3 tools/package_skills.py --check
mise exec -- node tools/lint-skills.mjs
```

## 工作流

<!-- generated:readme -->
| 技能 | 用途 | ZIP |
|---|---|---|
| [agent-conductor](skills/agent-conductor/SKILL.md) | 组织 Agent 协作完成任务：核对目标和授权，分配角色、拆解依赖、路由子任务、协调执行并以真实结果决定继续、返工或交付。用于用户要求组织多个 Agent、分配工作、协调执行、检查 AI 执行链路或验证任务结果。需要发现本地 Agent、配置角色模型或调整预算时，调用配套 agent-conductor-setup。 | [150 个文件](dist/agent-conductor.zip) |
| [agent-conductor-setup](skills/agent-conductor-setup/SKILL.md) | 基于 Lody 发现全部 Agent 和模型，配置角色模型与推理预算：分页枚举 Lody 的机器、Agent 配置（含推理档位）与 Agent 角色，让用户选择角色组合与预算，生成项目级角色配置。用于用户要求发现 Agent 或模型、首次配置、更新角色模型、调整预算或修复调用配置；也供 agent-conductor 在任务组织前调用。 | [7 个文件](dist/agent-conductor-setup.zip) |
| [architect](skills/architect/SKILL.md) | 先理解现有系统，再比较结构方案，从调用者用法推导类型、接口与模块归属，并在实施中复核设计。用于架构设计、模块边界或非平凡结构变更；只要求设计时不自动实施，普通小改动不强制启用。 | [113 个文件](dist/architect.zip) |
| [arena](skills/arena/SKILL.md) | 用户要求多个独立方案比较或需要探索不同解法时，对同一问题独立探索多个方案，由独立评判和协调者比较、选基础、吸收并验证；覆盖多个范围或竞赛用 swarm。 | [33 个文件](dist/arena.zip) |
| [authoring-a-skill](skills/authoring-a-skill/SKILL.md) | 用户要求创建或修改技能时，确定触发范围、产物和权限，写出精简正文并核对引用、依赖与归档；普通文档不启用。 | [8 个文件](dist/authoring-a-skill.zip) |
| [automate-me](skills/automate-me/SKILL.md) | 用户要求创建或更新个人 mode 技能、让 Agent 遵循其工作习惯时，结合明确偏好与范围内重复证据编写短技能；普通任务技能不挖历史。 | [12 个文件](dist/automate-me.zip) |
| [benchmark-checklist](skills/benchmark-checklist/SKILL.md) | 核验具体性能主张的瓶颈、公平性、资源上限、正确性、重复性、端到端意义与实际工作。用于执行性能测量、报告提速或退化、据数字选型；不作为普通任务的强制检查。 | [4 个文件](dist/benchmark-checklist.zip) |
| [blast-radius](skills/blast-radius/SKILL.md) | 分析指定改动可能破坏的间接消费方与跨边界行为，用真实代码检验关键安全假设。用于改动影响分析、排查 diff 外风险或回答‘这会影响哪里’；不代替完整功能验收，不自动修复产品。 | [4 个文件](dist/blast-radius.zip) |
| [bro](skills/bro/SKILL.md) | 用户要求再说简单一点、去掉术语或重述上一条回答时，用清楚简短的日常语言重述，不另起调查或丢掉关键事实。 | [4 个文件](dist/bro.zip) |
| [control-ui](skills/control-ui/SKILL.md) | 使用项目已有或宿主可用的浏览器、应用控制工具驱动真实 UI，截图并核对交互结果。用于 Web、Electron 与桌面界面的复现、验收和截图交付；不依赖特定编辑器，不生成模拟界面冒充证据。 | [5 个文件](dist/control-ui.zip) |
| [correct](skills/correct/SKILL.md) | 用户要求防止本仓库反复出现的 Agent 错误时，收集重复实例并优先用架构、类型、检查或测试消除错误，文档只保留判断规则。 | [12 个文件](dist/correct.zip) |
| [create-verification-skill](skills/create-verification-skill/SKILL.md) | 根据项目事实生成可复用的 verify-项目名 验收技能与功能地图，并实际跑通一个功能。用于用户要求建立验收技能，或已授权实施确需且缺少此能力时；执行已有验收请使用项目的 verify 技能，纯解释、只读审查与一次性小修改不触发生成。 | [17 个文件](dist/create-verification-skill.zip) |
| [figure-it-out](skills/figure-it-out/SKILL.md) | 复杂迁移或多部分变更没有匹配的窄流程时，先设计按风险缩放的阶段流程，再用假设、实证和决策轨迹推进；普通工程任务走 rigor 流程目录。 | [251 个文件](dist/figure-it-out.zip) |
| [how](skills/how/SKILL.md) | 从真实源码解释系统如何工作，追踪入口、调用链、数据流、状态归属与模块边界。用于代码导读、修改前理解子系统，或回答‘放在哪里、由谁负责、属于哪一层’；设计动机需要历史证据，不凭现状猜测。 | [13 个文件](dist/how.zip) |
| [in-your-own-words](skills/in-your-own-words/SKILL.md) | 用户要求用自己的话复述目标或问题时，先给出复述；单独的复述请求不启动工作，明确要求随后执行则继续。 | [4 个文件](dist/in-your-own-words.zip) |
| [interrogate](skills/interrogate/SKILL.md) | 多模型交叉审核：让不同模型独立检查同一证据包，由主审核实、去重并裁决。用于明确要求交叉审核、对抗审查或具体任务需要多模型排查盲点；普通 review 不强制启用，不替代影响分析或功能验收。 | [17 个文件](dist/interrogate.zip) |
| [ketchup](skills/ketchup/SKILL.md) | 用户要求 ketchup、追上进度或问上次发言后发生了什么时，用几句白话和已有的小图说明变化，并列出只有用户能做的决定。摘要阶段只读，不另起工作；已有任务按用户指令继续。 | [8 个文件](dist/ketchup.zip) |
| [maintain-verification-skill](skills/maintain-verification-skill/SKILL.md) | 用户要求审计或维护已有 verify 技能及功能地图时，逐功能读源码并实跑，修正说明或 harness；不修改产品代码。 | [21 个文件](dist/maintain-verification-skill.zip) |
| [no-comments](skills/no-comments/SKILL.md) | 用户要求清理指定范围的注释和 workaround 时，使用独立注释审查、核对例外及根因，并在授权范围处理；不无差别删除法律、契约和外部约束。 | [118 个文件](dist/no-comments.zip) |
| [recall](skills/recall/SKILL.md) | 用户要求回顾某主题最近工作或继续之前工作时，从范围内历史和当前状态恢复目标、决定、问题和下一步，不将旧记录当作实时事实。 | [45 个文件](dist/recall.zip) |
| [reflect](skills/reflect/SKILL.md) | 用户明确要求 reflect 或会话复盘时，从本次证据提炼持久改进，综合三种视角并提出技能修改；不自动应用或写外部工单。 | [20 个文件](dist/reflect.zip) |
| [rigor](skills/rigor/SKILL.md) | 用于需要跨文件修改、调查或证据交付的非平凡工程任务：匹配包内流程，按相关原则决策，以真实证据交付。闲聊与普通小改动不启用。发现和派发 Agent 用 agent-conductor。 | [251 个文件](dist/rigor.zip) |
| [sharpen](skills/sharpen/SKILL.md) | 用户要求 sharpen 或开工前收紧任务时，对齐做法、真实目标和规格松紧，再按已有授权执行；只问专家会怎么做时交付解释。 | [4 个文件](dist/sharpen.zip) |
| [show-me-your-work](skills/show-me-your-work/SKILL.md) | 长任务、异步工作或需要事后审计时，保留可复核的决策、证据与结果轨迹；普通短任务不启用。 | [6 个文件](dist/show-me-your-work.zip) |
| [skill-help](skills/skill-help/SKILL.md) | 用户询问技能如何配置、选择或使用时，读取对应说明并给一个适合的提示示例；帮助问题不自动启动工作。 | [302 个文件](dist/skill-help.zip) |
| [swarm](skills/swarm/SKILL.md) | 用户要求并行检查多个范围、竞赛或覆盖矩阵时，分配独立任务，等待实际终态并汇总；不把模型人数当作证据。 | [15 个文件](dist/swarm.zip) |
| [tdd](skills/tdd/SKILL.md) | 在修复错误或实现新行为前用最小检查证明失败，完成后用同一检查证明通过。用于用户要求 TDD、失败测试或回归测试，或错误存在明确且低成本的本地测试路径时；不为测试路径不清或代价过高的小改动强行搭建测试环境。 | [4 个文件](dist/tdd.zip) |
| [teach](skills/teach/SKILL.md) | 用户要求理解改动、子系统或设计选择时，结合机制与有证据的动机分层解释；只教学不自动修改产品。 | [37 个文件](dist/teach.zip) |
| [technical-writing](skills/technical-writing/SKILL.md) | 撰写或审阅技术文档、RFC、README、PR 描述与提交说明时，选择文档目的并写出清楚准确的句子；不替代产品文案规则。 | [8 个文件](dist/technical-writing.zip) |
| [typescript-best-practices](skills/typescript-best-practices/SKILL.md) | 修改 .ts、.tsx 的类型、接口或外部输入边界时，建模合法状态、校验外部输入并保持穷尽与可观察测试；纯阅读不启用，不为一个检查新增框架或重构无关代码。 | [17 个文件](dist/typescript-best-practices.zip) |
| [unslop](skills/unslop/SKILL.md) | 清理写作中的套话、虚假归因、术语堆积和机械表达，保留原意、事实、引用与证据强度。用于撰写或润色解释、文档、报告和评审文字；不为风格改动代码、逐字引用或用户指定格式。 | [4 个文件](dist/unslop.zip) |
| [why](skills/why/SKILL.md) | 用户问“为什么这样写”或“当时怎么决定的”时，从源码历史和实际可访问材料追溯设计动机，区分直接证据、支持、推导、假设和未知；解释当前运行机制用 how。 | [29 个文件](dist/why.zip) |
<!-- /generated -->

## 原则

24 个原则技能按需读取，完整清单见 [rigor 原则索引](skills/rigor/references/principles.md)。各技能的 ZIP 位于 `dist/`。
