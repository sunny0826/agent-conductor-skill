[返回分析报告](../lody-skill-usage-audit-2026-10-29.md)

## 哪些任务技能缺少明确采用证据

14 个：`automate-me`、`benchmark-checklist`、`blast-radius`、`correct`、`create-verification-skill`、`in-your-own-words`、`ketchup`、`maintain-verification-skill`、`make-bot-ui`、`recall`、`reflect`、`sharpen`、`teach`、`typescript-best-practices`。

另 3 个有间接证据：`control-ui`、`no-comments`、`swarm`。

下面的“原因”分为事实与待验证解释；未见名称不是未执行方法的证明。

| 技能 | 判断与原因 | 优化建议 | 证据 |
|---|---|---|---|
| [automate-me](../../skills/automate-me/SKILL.md) | 需要创建个人 mode 才适用；本期未发现明确的个人模式提取请求。普通任务技能创建不属于其触发范围。 | 保留专用入口，不因“写技能”就自动挖掘个人历史。 | 名称检索与逐项判读；未找到明确采用证据 |
| [benchmark-checklist](../../skills/benchmark-checklist/SKILL.md) | 资源档位、利用率和测量任务明确存在，但命中只有维护建议；rigor 和 perf-issue 已经链接它。原因更可能涉及选择未留痕或执行路由未落实，不能证明只是缺触发词。 | 在测量产物中记录技能选择与证据：工作量、完成边界、次数/波动、瓶颈；先核对现有路由是否实际采用。 | [7a7cae56 · 消息 30](lody://session/7a7cae56-6f27-4628-b866-b4a03c2bb532?workspace=jh731nqq74z6j0p3252qrjxryh8e707a) |
| [blast-radius](../../skills/blast-radius/SKILL.md) | 审查和跨模块改动很多；名称只见于技能维护讨论。独立 reviewer 可能完成了部分影响分析，不能据名称缺失断言流程没有发生。 | 有具体消费者或接口风险时，在既有审查任务包中指向 blast-radius，并返回已核对的消费方；普通审查不强制增加阶段。 | 名称检索与逐项判读；未找到明确采用证据 |
| [correct](../../skills/correct/SKILL.md) | 14 次例行复盘持续处理重复错误，但未见 correct 的采用声明。reflect 目前链接结构编码原则，没有直接路由到 correct。 | 同类错误至少有两个真实样本时，由复盘转入 correct 的“结构/检查/测试”选择；在已有授权内修执行机制，避免只追加文字。 | [660f7a5f · 消息 2](lody://session/660f7a5f-0aaa-8ca6-b23e-32f78412072d?workspace=jh731nqq74z6j0p3252qrjxryh8e707a) |
| [create-verification-skill](../../skills/create-verification-skill/SKILL.md) | 多轮设备烧录和验证需求明确存在，未见生成器采用声明。仅凭转录不能确认各项目是否已经存在 verify 技能。 | 先检查项目已有验收入口；确实缺少且需要复用时，选 PokeTrail 的一个重复验收场景建 verify-poketrail，并实际跑通后复用。 | [79a4db1e · 消息 13](lody://session/79a4db1e-a174-40f0-ba8b-0e42421c7919?workspace=jh731nqq74z6j0p3252qrjxryh8e707a) |
| [in-your-own-words](../../skills/in-your-own-words/SKILL.md) | 10-16 新加入；命中均为新增或修订讨论。需要“先复述”的明确请求，低频本身合理。 | 显示为“复述目标”，保持稳定技能名；保留“先复述再执行”与“只复述”的边界，不设每次开工必经步骤。 | 名称检索与逐项判读；未找到明确采用证据 |
| [ketchup](../../skills/ketchup/SKILL.md) | 进度询问确实存在，用户常用普通中文或 $how；未见 ketchup 调用。英文命名增加识别成本是推断，不是已证实原因。 | 使用中文展示名“进度简报（ketchup）”，与跨会话 recall 区分；沿现有规则简短答复后继续已授权任务。 | [850b5dae · 消息 3](lody://session/850b5dae-0468-4c95-999f-905132d728d1?workspace=jh731nqq74z6j0p3252qrjxryh8e707a) |
| [maintain-verification-skill](../../skills/maintain-verification-skill/SKILL.md) | 只有已有 verify 技能的全量审计才适用；是否有足够此类任务未获证实。create-verification-skill 已覆盖日常增量维护。 | 保留“全量验收流程审计”的清晰定位；不要与生成器的日常维护重复触发。暂无依据删除或强制调用。 | 名称检索与逐项判读；未找到明确采用证据 |
| `make-bot-ui`（已移除） | 本期只见适配维护提及；普通 webhook、消息收件箱或 SAST 任务并不自动等于“网页按钮唤醒 Agent”。 | 保留窄触发范围；出现明确的唤醒页面需求时再评估，不推广到所有 Bot 项目。 | 名称检索与逐项判读；未找到明确采用证据 |
| [recall](../../skills/recall/SKILL.md) | 跨会话恢复与历史分析已有需求，但名称只见于包清单和建议；行为可能被普通检索流程承担。 | 恢复跨会话状态时再使用 recall；无需把它和 reflect 强制串成每个定时任务的两个步骤。 | 名称检索与逐项判读；未找到明确采用证据 |
| [reflect](../../skills/reflect/SKILL.md) | 14 个例行复盘请求都使用“本 SKILL”而未明确点名 reflect；修改 reflect 文件本身不证明采用了该流程。 | 将例行复盘任务明确指向 reflect，保留当前已授权边界；重复错误再路由 correct，不额外叠加一套同义流程。 | [660f7a5f · 消息 1](lody://session/660f7a5f-0aaa-8ca6-b23e-32f78412072d?workspace=jh731nqq74z6j0p3252qrjxryh8e707a) |
| [sharpen](../../skills/sharpen/SKILL.md) | 10-16 新加入；命中均为维护与触发边界讨论。多数请求直接给目标并让 rigor 开工，未见专门收紧规格的调用。 | 显示为“收紧任务”，只在范围/完成条件需要对齐时采用；不在清晰任务前追加问答。 | 名称检索与逐项判读；未找到明确采用证据 |
| [teach](../../skills/teach/SKILL.md) | how、why、bro 有明确调用；teach 无名称证据。其教学需求可能被这三个更直接的入口承担，属于推断。 | 按“理解概念与取舍”展示 teach，源码机制仍用 how、历史动机用 why；暂不要求用户额外记一个默认入口。 | 名称检索与逐项判读；未找到明确采用证据 |
| [typescript-best-practices](../../skills/typescript-best-practices/SKILL.md) | 未见使用证据，但不能用所有 session 作分母判断 TS 技能失效；本次没有逐任务确认实际 TS/TSX 编辑范围。 | 先只统计读写 .ts/.tsx 的任务，再检查宿主选择；保持语言条件触发，不对 Go/C++/Python 任务增加该技能。 | 名称检索与逐项判读；未找到明确采用证据 |
| [control-ui](../../skills/control-ui/SKILL.md) | 有引入、安装和真实截图自测回执；没有找到业务任务中明确采用本技能的声明。它在 10-17 才加入，观察期短于两周。 | 保留。核对真实 UI 任务是否经过现有 verification-surfaces 路由，以及执行者拿到的本机技能路径；不再重复添加已有入口。 | [6845addc · 消息 10](lody://session/6845addc-731b-4885-b14c-49e940001db1?workspace=jh731nqq74z6j0p3252qrjxryh8e707a) |
| [no-comments](../../skills/no-comments/SKILL.md) | 有独立注释审查及 MUST KILL/例外/删除数回执，明显接近技能流程，但未点名技能文件；不能列为完全闲置。 | 先在既有注释审查回执标明技能来源，复用已有流程；不要再添一轮同样审查。 | [ba5f99b5 · 消息 1](lody://session/ba5f99b5-56c5-4d64-94ea-00ea0f8fc03e?workspace=jh731nqq74z6j0p3252qrjxryh8e707a) |
| [swarm](../../skills/swarm/SKILL.md) | 转录有“swarm 要重跑”和 swarm verdict，也有并行审核，但未找到明确读取/采用 swarm 技能的声明。 | 保留为待核实。记录分片/竞赛模式及最终覆盖矩阵；已有 conductor 的普通并行不必重复套完整 swarm。 | [ad26bdc1 · 消息 171](lody://session/ad26bdc1-f4a9-407a-a0fa-fd76ccbd859a?workspace=jh731nqq74z6j0p3252qrjxryh8e707a) |
