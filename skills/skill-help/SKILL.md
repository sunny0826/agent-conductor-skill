---
name: skill-help
description: "用户询问提取版技能如何配置、选择或使用时，读取对应说明并给一个适合的提示示例；帮助问题不自动启动工作。"
---

# 技能选择与使用帮助

先回答用户具体问题，再给至多一个可直接发出的提示及真实包内来源链接。用户明确要求执行就按任务执行，不能把“能帮我做吗”误当纯帮助。模糊时仅问一个会改变路由的问题，不重复已有配置选择。

## 配置与开始

提取版目录解压后并排保留，按宿主实际项目级技能发现约定放置；无自动发现就用文件路径调用，不声称安装插件会自动注册。模型选择使用包内 [setup](../agent-conductor-setup/SKILL.md)，调度使用 [conductor](../agent-conductor/SKILL.md)。现有配置有效则复用；缺配置不假定特定模型或默认预算。只在任务确需模型发现时执行，不为解释先扫描机器。

工程流程与匹配步骤由 [rigor](../rigor/SKILL.md) 提供。流程是否持续、能否用斜杠或定时唤醒，由宿主决定。

## 按真实需求路由

阅读被推荐技能后再解释，用 [目录](references/catalog.md) 选择：机制 how、动机 why、理解 teach、恢复上下文 recall、追上这次对话 ketchup；间接影响 blast-radius、结构 architect、候选合成 arena、分片／竞赛 swarm；界面操作与截图用 [control-ui](../control-ui/SKILL.md)、多模型审查 interrogate、便宜回归 tdd、TS 类型 typescript-best-practices、注释 no-comments；措辞 unslop、技术文档 technical-writing、重述 bro；开工前复述 in-your-own-words、收紧后直接做 sharpen；验收生成 create-verification-skill、全地图维护 maintain-verification-skill、数字 benchmark-checklist；复杂执行 figure-it-out、决策轨迹 show-me-your-work；个人模式 automate-me、复盘 reflect、重复错误 correct。

技能有边界：设计问题只设计，已授权实施才继续；调查不修产品；审核不代替实跑；主会话自查不是独立／跨模型；失败候选不是零发现。不要给用户不存在的命令或外部插件依赖。

## 写提示和纠偏

按 [提示指引](references/prompting.md) 说明目标、能判定的完成条件、已知事实、证据和真实限制。步骤由适合流程提供，不强制列所有技能。

成本来自真实委派数量、模型和重复测量，预算继承用户／宿主；配置可以明确要求更新，不擅换更贵模型。未覆盖功能不能算验收；并行写者隔离；绿构建不是用户路径证明；持续运行须有完成条件和实际句柄。需要多阶段计划、接手、暂停、PR 就读 [rigor 流程目录](../rigor/references/playbooks.md)。只要求计划时停在计划。合并和发布要另有明确授权。

帮助输出通过 [unslop](../unslop/SKILL.md) 清理，保留限制与未知。来源链接使用包内已读文件。

来源与适配见 [说明](references/sources.md)，保留 [MIT 许可](LICENSE)。
