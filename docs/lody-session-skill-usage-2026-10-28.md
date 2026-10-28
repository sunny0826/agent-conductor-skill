# 2026-10-28 技能使用与优化建议

本篇是 [10-28 归档会话复盘](lody-session-skill-review-2026-10-28.md) 的任务 4 产出：只分析未被调用的技能并给建议，不修改这些技能。

判定口径：转录只含可见消息，不含工具调用，所以**“没有出现名字”不等于没有加载**。下表按显式标记（`$rigor`、`$why`、`$bro`、`$how`）和技能名出现次数分层；原则技能通常由 rigor 按需读取，不会在正文里反复出现。

## 有显式标记或提及（7 个）

| 技能 | 证据 |
|---|---|
| rigor | `$rigor` 32 次；覆盖 mym5、sast-workflow、review-skill、grokbot |
| why | `$why` 3 次；都在 sast-workflow 的资源验证解释 |
| bro | `$bro` 2 次；sast-workflow 白话解释 |
| how | `$how` 1 次；`850b5dae` 任务进度表 |
| agent-conductor | 53 次提及；15 个入口中的协调者与子会话 |
| agent-conductor-setup | `8e96250b` 角色卡片、`c6d5b575` 角色映射 |
| unslop | 1 次提及；`704de601` 报告文字复核 |

## 零显式标记、零提及（49 个）

- 任务技能 25 个：`architect`、`arena`、`automate-me`、`benchmark-checklist`、`blast-radius`、`control-ui`、`correct`、`create-verification-skill`、`figure-it-out`、`in-your-own-words`、`interrogate`、`ketchup`、`maintain-verification-skill`、`make-bot-ui`、`no-comments`、`recall`、`reflect`、`sharpen`、`show-me-your-work`、`skill-help`、`swarm`、`tdd`、`teach`、`technical-writing`、`typescript-best-practices`。
- 原则技能 24 个：全部 `principle-*`。

## 建议（按预期收益排序）

1. **`create-verification-skill` / `maintain-verification-skill`：最高优先。** PokeTrail 在 10-28 做了 4 轮设备验收（issue-7/8/16/19），仍靠每次临时写串口脚本和报告；建议用 `create-verification-skill` 建一个 `verify-poketrail`，把设备入口、串口命令、存档槽校验、时间/步数读回写成可复用流程。这比继续在每次会话里复制命令更省。
2. **`interrogate`：多模型审查时改用共享证据包。** `cdedd821` 用 5 个角色独立审查 R0，但每条消息都是自包含正文；建议让 conductor 在 3 个以上独立审查时按 interrogate 的证据包 + 主审裁决组织，统一快照、范围和回执格式，减少重复提示词和不一致结论。
3. **`benchmark-checklist`：资源选型和测量任务应触发。** 10-28 有 50/50 预检、deadline cap、资源档位推导，但没有显式加载该技能；建议在 rigor 的测量 playbook 或技能描述里补“资源档位/性能选型/测量分母”触发词，避免把单次样本写成完整验收。
4. **`control-ui`：应用/Grafana 操作前先检查可用控制方式。** `ae345860` 在应用菜单入口反复尝试；conductor 第 5 步可以加一句“需要操作真实 UI 时先读 control-ui 的能力与限制”，减少在宿主菜单上试错。
5. **`tdd`：有低成本回归路径的 bug 修复应显式指向。** 10-28 的 issue-8/16/19 都写了失败基线或回归用例，但没有点名 tdd；建议 rigor 的修复 playbook 增加一行“有本地回归路径时按 tdd 先证明失败”，不强制所有改动。
6. **`technical-writing`：PR 正文和文档清理时使用。** 10-28 有大量 PR 描述、Issue 正文和 33 个文档修订，但没有显式加载；建议在交付 PR/文档时由 rigor 指向该技能，代码改动不强制。
7. **`recall` / `reflect`：例行维护可以显式串起来。** 本轮维护实际在做 recall（读前一日复盘）和 reflect（提炼规则），但没有显式调用；建议把定时任务提示词改成先 `$recall` 再 `$reflect`，让历史检索和复盘产出有固定入口。注意这只改调度提示词，不改技能。
8. **`architect` / `figure-it-out` / `blast-radius` / `arena`：没有匹配任务时不强行使用。** `cdedd821` 的架构审核用了“架构师”角色而非 architect 技能；`sast-workflow` 的接管属于复杂迁移，figure-it-out 可能适用，但没有证据表明缺它会漏步骤。建议保持按需，不为了覆盖率增加强制门。
9. **`swarm` / `show-me-your-work`：可选增强。** 6 个并行审查可以用 swarm 的覆盖矩阵；长异步任务可以用 show-me-your-work 记录决策轨迹。两者都不是必需，建议在对应任务里作为提示，不做默认步骤。
10. **`automate-me` / `correct` / `no-comments` / `make-bot-ui` / `typescript-best-practices` / `ketchup` / `sharpen` / `in-your-own-words` / `teach` / `skill-help`：本轮没有匹配请求，保持现状。** `skill-help` 可考虑在 README 的技能选择页里加一个“如何选技能”的三行入口，但当前 `docs/skill-usage.html` 已覆盖，不必改技能文本。
11. **24 个原则技能：不建议按“未出现”判断无效。** 它们由 rigor 的 playbook 按需读取；建议做一次映射审计，确认每个原则至少有一个具体 playbook 触发点，并合并语义重叠明显的条目（如 `principle-subtract-before-you-add` 与 `principle-laziness-protocol`、`principle-prove-it-works` 与 `principle-explain-the-number`）。这只影响维护成本，不影响本轮行为。
