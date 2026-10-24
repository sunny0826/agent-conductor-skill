# agent-conductor-skill

[按任务选技能：可搜索的使用指南](docs/skill-usage.html)（32 个任务技能、24 个原则技能）。下载或在本地浏览器打开 HTML 查看。

[不依赖特定编辑器的提示模式](skills/skill-help/references/recipes.md#不依赖特定编辑器的提示模式)：代码审查、审查意见核实、PR 状态、持续执行、个人模式和 webhook 页面。

两套技能分开使用。

- [rigor](skills/rigor/SKILL.md) 是工程流程。它匹配 23 项流程，需要时读取对应原则，用真实证据交付。[下载](dist/rigor.zip)（44 个技能，228 个文件）。这个 ZIP 含 rigor 链接到的 `agent-conductor`。
- [agent-conductor](skills/agent-conductor/SKILL.md) 组织 Agent：发现可调用的配置，分配角色，路由子任务，按真实结果决定继续、返工或交付。模型配置是 [agent-conductor-setup](skills/agent-conductor-setup/SKILL.md)。[下载](dist/agent-conductor.zip)（28 个技能，130 个文件）。这个 ZIP 不含 rigor。

其余技能按任务选用，各自的 ZIP 只带上 Markdown 链接的传递闭包。解压后目录要并排放着，不能只留下入口文件。宿主能发现项目级技能时，把需要的目录放进那个位置；不能发现时，让 Agent 读取对应的 `SKILL.md`。

本仓库是这些技能的唯一源：修改先进本仓库再部署到宿主安装位置，不在部署副本上单边改动，否则副本会与源分叉且改动无法追溯。

重新生成 `dist/`：

```bash
mise exec -- python3 tools/package_skills.py
mise exec -- python3 tools/package_skills.py --check
```

## 工作流

| 技能 | 用途 | ZIP |
|---|---|---|
| [agent-conductor](skills/agent-conductor/SKILL.md) | 组织 Agent 协作完成任务：核对目标和授权，分配角色、拆解依赖、路由子任务、协调执行并以真实结果决定继续、返工或交付。 | [130 个文件](dist/agent-conductor.zip) |
| [agent-conductor-setup](skills/agent-conductor-setup/SKILL.md) | 基于 Lody 发现全部 Agent 和模型，配置角色模型与推理预算：分页枚举 Lody 的机器、Agent 配置（含推理档位）与 Agent 角色，让用户选择角色组合与预算，生成项目级角色配置。 | [7 个文件](dist/agent-conductor-setup.zip) |
| [architect](skills/architect/SKILL.md) | 先理解现有系统，再比较结构方案，从调用者用法推导类型、接口与模块归属，并在实施中复核设计。 | [130 个文件](dist/architect.zip) |
| [arena](skills/arena/SKILL.md) | 对同一问题独立探索多个方案，由独立评判和协调者比较、选基础、吸收并验证。 | [29 个文件](dist/arena.zip) |
| [automate-me](skills/automate-me/SKILL.md) | 用户要求创建或更新个人 mode 技能、让 Agent 遵循其工作习惯时，结合明确偏好与范围内重复证据编写短技能；普通任务技能不挖历史。 | [232 个文件](dist/automate-me.zip) |
| [benchmark-checklist](skills/benchmark-checklist/SKILL.md) | 核验具体性能主张的瓶颈、公平性、资源上限、正确性、重复性、端到端意义与实际工作。 | [4 个文件](dist/benchmark-checklist.zip) |
| [blast-radius](skills/blast-radius/SKILL.md) | 分析指定改动可能破坏的间接消费方与跨边界行为，用真实代码检验关键安全假设。 | [130 个文件](dist/blast-radius.zip) |
| [bro](skills/bro/SKILL.md) | 用户要求再说简单一点、去掉术语或重述上一条回答时，用清楚简短的日常语言重述，不另起调查或丢掉关键事实。 | [4 个文件](dist/bro.zip) |
| [control-ui](skills/control-ui/SKILL.md) | 使用已有浏览器或应用控制工具操作真实界面，捕获、核对并交付截图。 | [5 个文件](dist/control-ui.zip) |
| [correct](skills/correct/SKILL.md) | 用户要求防止本仓库反复出现的 Agent 错误时，收集重复实例并优先用架构、类型、检查或测试消除错误，文档只保留判断规则。 | [11 个文件](dist/correct.zip) |
| [create-verification-skill](skills/create-verification-skill/SKILL.md) | 根据项目事实生成可复用的 verify-项目名 验收技能与功能地图，并实际跑通一个功能。 | [17 个文件](dist/create-verification-skill.zip) |
| [figure-it-out](skills/figure-it-out/SKILL.md) | 复杂迁移、多部分变更或没有更窄流程可用时，先设计按风险缩放的阶段流程，再用假设、实证和决策轨迹推进。 | [228 个文件](dist/figure-it-out.zip) |
| [how](skills/how/SKILL.md) | 从真实源码解释系统如何工作，追踪入口、调用链、数据流、状态归属与模块边界。 | [13 个文件](dist/how.zip) |
| [in-your-own-words](skills/in-your-own-words/SKILL.md) | 用户要求用自己的话复述目标或问题时，先给出复述；单独的复述请求不启动工作，明确要求随后执行则继续。 | [4 个文件](dist/in-your-own-words.zip) |
| [ketchup](skills/ketchup/SKILL.md) | 用户要求 ketchup、追上进度或问上次发言后发生了什么时，用几句白话和已有的小图说明变化，并列出只有用户能做的决定。摘要阶段只读，不另起工作；已有任务按用户指令继续。 | [8 个文件](dist/ketchup.zip) |
| [interrogate](skills/interrogate/SKILL.md) | 多模型交叉审核：让不同模型独立检查同一证据包，由主审核实、去重并裁决。 | [130 个文件](dist/interrogate.zip) |
| [maintain-verification-skill](skills/maintain-verification-skill/SKILL.md) | 用户要求审计或维护已有 verify 技能及功能地图时，逐功能读源码并实跑，修正说明或 harness；不修改产品代码。 | [21 个文件](dist/maintain-verification-skill.zip) |
| [make-bot-ui](skills/make-bot-ui/SKILL.md) | 用户要求构建按钮或页面唤醒 webhook Agent 时，使用服务器保管发送密钥、明确 payload 契约，并验证访问与唤醒边界；不假定 webhook 提供方或访问网络已配置。 | [4 个文件](dist/make-bot-ui.zip) |
| [no-comments](skills/no-comments/SKILL.md) | 用户要求清理指定范围的注释和 workaround 时，使用独立注释审查、核对例外及根因，并在授权范围处理；不无差别删除法律、契约和外部约束。 | [135 个文件](dist/no-comments.zip) |
| [recall](skills/recall/SKILL.md) | 用户要求回顾某主题最近工作或继续之前工作时，从范围内历史和当前状态恢复目标、决定、问题和下一步，不将旧记录当作实时事实。 | [236 个文件](dist/recall.zip) |
| [reflect](skills/reflect/SKILL.md) | 用户明确要求 reflect 或会话复盘时，从本次证据提炼持久改进，综合三种视角并提出技能修改；不自动应用或写外部工单。 | [236 个文件](dist/reflect.zip) |
| [rigor](skills/rigor/SKILL.md) | 非平凡任务按工程流程执行：匹配包内流程，按相关原则决策，以真实证据交付。 | [228 个文件](dist/rigor.zip) |
| [sharpen](skills/sharpen/SKILL.md) | 用户要求 sharpen 或开工前收紧任务时，对齐做法、真实目标和规格松紧，再按已有授权执行；只问专家会怎么做时交付解释。 | [4 个文件](dist/sharpen.zip) |
| [show-me-your-work](skills/show-me-your-work/SKILL.md) | 为长任务或异步工作保留可复核的决策、证据与结果轨迹。 | [6 个文件](dist/show-me-your-work.zip) |
| [skill-help](skills/skill-help/SKILL.md) | 用户询问技能如何配置、选择或使用时，读取对应说明并给一个适合的提示示例；帮助问题不自动启动工作。 | [283 个文件](dist/skill-help.zip) |
| [swarm](skills/swarm/SKILL.md) | 用户要求并行检查多个范围、竞赛或覆盖矩阵时，分配独立任务，等待实际终态并汇总；不把模型人数当作证据。 | [14 个文件](dist/swarm.zip) |
| [tdd](skills/tdd/SKILL.md) | 在修复错误前用最小回归检查证明失败，修复后用同一检查证明通过。 | [4 个文件](dist/tdd.zip) |
| [teach](skills/teach/SKILL.md) | 用户要求理解改动、子系统或设计选择时，结合机制与有证据的动机分层解释；只教学不自动修改产品。 | [37 个文件](dist/teach.zip) |
| [technical-writing](skills/technical-writing/SKILL.md) | 撰写或审阅技术文档、RFC、README、PR 描述与提交说明时，选择文档目的并写出清楚准确的句子；不替代产品文案规则。 | [8 个文件](dist/technical-writing.zip) |
| [typescript-best-practices](skills/typescript-best-practices/SKILL.md) | 阅读或修改 .ts、.tsx 时，建模合法状态、校验外部输入并保持穷尽与可观察测试；不为一个检查新增框架或重构无关代码。 | [15 个文件](dist/typescript-best-practices.zip) |
| [unslop](skills/unslop/SKILL.md) | 清理写作中的套话、虚假归因、术语堆积和机械表达，保留原意、事实、引用与证据强度。 | [4 个文件](dist/unslop.zip) |
| [why](skills/why/SKILL.md) | 从源码历史和实际可访问材料追溯设计动机，区分直接证据、支持、推导、假设和未知。 | [29 个文件](dist/why.zip) |

## 原则

24 个原则技能按需读取，完整清单与 ZIP 见 [原则技能目录](docs/principles-catalog.md)。
