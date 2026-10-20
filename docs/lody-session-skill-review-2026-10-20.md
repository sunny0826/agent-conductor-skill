# 2026-10-20 归档会话技能复盘

后续状态：10-20 归档 11 个会话，全部可读。技能相关 5 个，证据集中在 `$rigor` 直接工作线与本仓库例行维护（`bf9aa52c`）。本轮确认 **1 次部署同步遗漏**：PR #11 合并后只更新了 `agent-conductor` 部署副本，`agent-conductor-setup` 仍停在 10-10 旧文本；已恢复并新增逐技能部署核对工具。其余观察到 1 次缺测需求误读和 1 次原生交互自验偏差，现有原则已覆盖，记录为执行观察。

## 维护前置（今日任务 1–2）

- **任务 1：本地部署不是最新。** 主检出 `5c7304f` 与 `origin/main` 一致；逐文件比对发现 `agent-conductor` 已同步，`agent-conductor-setup/SKILL.md` 仍缺 PR #11 的“零回执故障切换”例外（部署副本 mtime 10-10 16:43，仓库版本 10-21 01:00）。`magpie library skill update agent-conductor-setup` 拒绝更新，提示副本“was changed here since it was fetched from GitHub”——此前单文件覆盖破坏了副本来源，自动更新因此会静默跳过。确认差异只来自本仓库后，用 `--replace-edits` 恢复；随后 `node tools/check-deployment.mjs` 报 **56/56 技能 0 差异**。
- **任务 2：昨日复盘修改已全部提交。** `bf9aa52c` 的产出在 `666c284`，已随 PR #11（`5c7304f`）合并；主检出与 worktree 干净，无 stash、无未跟踪源码。没有需要补提交的复盘改动。

## 范围与证据限制

- 日期按 Asia/Shanghai：2026-10-20 00:00 起，已归档且有当日活动 **11 个**；完整清单见 [会话索引](lody-session-skill-inventory-2026-10-20.md)。
- 11/11 有可读转录，未出现 10-19 的 9 个空历史。
- 工具调用回合不进转录，派发前是否实跑检查器不能直接证明。本轮 5 个技能相关会话均为单代理直接工作，**没有出现任务包或派发消息**，`check-dispatch` 的包侧与消息侧规则没有新样本。
- 会话读取使用 `lody_session_history`；正文只记录结论，不提交原始转录。

## 正向样本

| 项 | 判定 | 关键证据 |
|---|---|---|
| 直接工作不强行多代理 | **通过** | 92b0fdc7（引擎调研）、597181b9（启动说明 + 标题修复）、a124b658（Studio UX）均为单代理直接完成，没有为普通任务构造派发 |
| 提交与 PR 授权边界 | **通过** | a124b658 连续本地提交 `bfbfd47`/`73f49fb`/`5aac80b` 均声明未推送，用户说“提交PR”后才创建 #73；597181b9 同样在用户要求后才开 #72 |
| 只规划不实施 | **通过** | 87de4530 首轮只写规划文档，未改产品源码；用户撤销后删除两份文档、文档入口、4 条记忆和临时文件 |
| 交付附带真实证据 | **通过** | a124b658 原生 UI 11/11 通过后才回报，CI 失败后按实际失败修复并推送；597181b9 先复现再修复并附截图；92b0fdc7 明确“未安装引擎、未下载模型、未执行推理” |
| 例行维护闭环 | 部分通过 | bf9aa52c 完成三项任务并合并 PR #11，但漏掉合并后的全量部署核对（P1） |

## Accepted：确定存在、本轮已实施的技能问题

| 编号 | Problem | 修复 | 出处 |
|---|---|---|---|
| P1 中高 | **技能合并后部署副本只同步入口文件，且再次自动更新会被静默拒绝**：PR #11 同时改了 `agent-conductor` 与 `agent-conductor-setup`，10-20 11:45 的部署只更新了前者；后者停在 10-10 版本，缺少故障切换例外。`magpie library skill update` 因副本曾被单文件覆盖而提示“changed here”，不会自动拉取。维护会话在最终回复里写了“合并后还需同步一次部署副本”，但没有任何可执行核对入口，遗漏无从发现 | 新增 [check-deployment.mjs](../tools/check-deployment.mjs)：逐技能逐文件比对仓库与部署副本，支持 `--deploy-root`、`--skills`、`--json`，忽略 `.DS_Store`/`__pycache__`；新增 7 项契约测试。新增 [技能部署与核对](skill-deployment.md)，写明合并后“更新副本 → 核对差异 → 跑测试”的固定流程，以及分叉时用 `--replace-edits`、不要手工覆盖单个文件。本轮已恢复副本并实测 56/56 | 部署副本 mtime 与 `diff`；magpie 拒绝原文；修复后 `check-deployment` 输出；`bf9aa52c` 最终回复 |

## Rejected：不成立或不应再加的规则

| 候选 | 拒绝理由 |
|---|---|
| a124b658 把“补充 CPU/温度采集”做成删除图表，应新增 UI 诊断规则 | 根因是执行时没有按既有 [fix-root-causes](../skills/principle-fix-root-causes/SKILL.md) 区分采集缺失、状态映射和展示缺失；现有原则已覆盖，且用户当场纠正后一轮修好。记录为执行失效，不新增重复条款 |
| a124b658 的 CI 失败说明本地验证规则不足 | 本地检查通过、CI 对测试目录与窗口定位的假设不同；修复仅涉及测试预期，PR 说明也写明了未验证范围。[opening-a-pr](../skills/rigor/playbooks/opening-a-pr.md) 已要求写明验证与范围，属正常 PR 闭环 |
| 87de4530 写规划文档本身违规 | 用户只说“只规划”，没有说“不得落盘”；`multi-phase-plan` 默认项目约定 `docs` 路径，文档不是产品源码。用户随后撤销规划并清理，是方向变更，不立“规划不得写文档”的规则 |
| 5 个 `$rigor` 会话没有任务包，应强制派发 | 这些是单代理直接工作，没有委派对象；conductor 只在“宿主支持子任务时再委派”，为普通任务强行派发会增加无效成本 |
| 原生 hover/click 自验与用户观察不一致，应新增控制规则 | [control-ui](../skills/control-ui/SKILL.md) 已要求操作前后截图、读回并交付实际路径；本轮属于执行时证据不足，不是文本缺口，列入 Backlog 观察 |

## Backlog：结构化候选与低优先观察

| 项 | 模式与建议机制 |
|---|---|
| 规划任务的长期记忆边界 | 87de4530 自动写入 4 条 Nowledge 记忆，用户随后要求全部删除。当前 `rigor` 没有“规划记忆只在用户要求或项目约定时保存”的条款；单次样本，待再次出现再定 |
| 任务包与派发消息检查无新样本 | 10-20 的 5 个技能会话均为直接工作，`check-dispatch` 的 `--message` 与包侧规则未被执行；下一次真实派发线应回归双检 |
| 原生交互自验 | a124b658 首次回报“悬停/点击通过”，用户实际未看到效果；补测后通过。`control-ui` 已覆盖，后续观察是否复发 |
| 部署副本来源分叉 | 本轮用 `--replace-edits` 恢复。若再次出现“changed here”，先核对差异是否来自本仓库，不直接覆盖用户改动 |

## 实施验证

- 修改：[tools/check-deployment.mjs](../tools/check-deployment.mjs)、[tools/check-deployment.test.mjs](../tools/check-deployment.test.mjs)、[技能部署与核对](skill-deployment.md)。
- 部署恢复：`magpie library skill update agent-conductor-setup --replace-edits`；`node tools/check-deployment.mjs` → **OK 56 skills match**。
- `mise exec -- node --test tools/*.test.mjs`：**50/50 通过，0 fail**（基准 43 → 50）。
- `mise exec -- python3 tools/package_skills.py --check`：**56 包全过**；本轮未改技能正文，`dist/` 无需重新生成。
- 本轮修复证明的是“部署副本与仓库逐文件一致”可被重复核对；不证明 magpie 自动更新在分叉副本上的行为已修复，后续仍以 `--replace-edits` 或重新安装恢复。
