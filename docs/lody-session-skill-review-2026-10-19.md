# 2026-10-19 归档会话技能复盘

后续状态：10-19 当日归档 23 个会话，14 个可读。技能相关 9 个，证据集中在 `$rigor` 开发环境线（c6afe9e8 → 4fbd9d1d）。本轮确认 **1 条消息侧复发**与 **1 次审查者零输出切换迟滞**；任务包、消息文件、任务状态与 Codex 复审本身均通过。修复见 Accepted（E3/E4）。

## 维护前置（今日任务 1–2）

- 本地部署副本已是最新：`main` 检出原停在 `6259820`，`origin/main` 已含 PR #10（`d634055`）；拉取后 56 个技能目录与部署副本逐文件 **0 差异**，`agent-conductor` / `agent-conductor-setup` 符号链接有效。
- 昨日复盘修改已全部提交：PR #10（`5c34689` + `4873a21`）已合并；主检出与 worktree 干净，无 stash、无未跟踪源码。本地分支 `fix/dispatch-message-lint` 上的 `0ab0b00` 只是审查任务包归档备份，未进入 main，本轮不改写。

## 范围与证据限制

- 日期按 Asia/Shanghai：2026-10-19 00:00 起，已归档会话 23 个；完整清单见 [会话索引](lody-session-skill-inventory-2026-10-19.md)。
- 14 个会话有可读转录；9 个返回 0 条。工具调用回合不进转录，派发前是否实跑自检不能直接证明。
- 6 个任务包、6 条消息文件、2 份任务状态全部实跑检查器：包与消息均 **0 problems**，任务状态均 **0 problems**。
- 真实派发消息从子会话转录读取；Kimi 零输出的进程退出原因只能从 Lody 日志确认到 `SIGKILL`，更深的模型侧原因未确认。

## 正向样本

| 项 | 判定 | 关键证据 |
|---|---|---|
| 任务包形态 | **通过** | `go-task.md`、`runner-review.md`、`final-review.md`、`codex-review-task.md`、`codex-review-resume-task.md`、`fix-f1-review-task.md` 全部 0 problems |
| 消息文件形态 | **通过** | `go-message.md`、`review-message.md`、`codex-review-message.md`、`codex-review-resume-message.md`、`fix-f1-review-message.md`、`final-review-message.md` 全部 0 problems |
| 部署后指针式派发 | **通过** | 6b5e2581（13:22 CST）、9b96051d（11:31）、9cb4dd22（11:52）实际消息均为“指针 + 回执”，无压制句 |
| Codex 续用 | **通过** | 6b5e2581 权限卡住后保留原审核上下文续跑，确认 P2 并落盘报告 |
| 任务状态 | **通过** | `task-state.json`（3 goals/10 tasks）与 `fix-f1-task-state.json`（1/2）`--complete` 均 0 problems |
| 技能自查复审 | **通过** | 90b4bb56 approve，无阻断；3 项建议已在 PR #10 处理 |

## Accepted：确定存在、本轮已实施的技能问题

| 编号 | Problem | 修复 | 出处 |
|---|---|---|---|
| E3 中高 | **已检查的消息文件不等于实际发送文本**：4fbd9d1d 在部署后（10:42 CST）派发 5305a8f1（11:19 CST），实际消息以“只执行任务，不要进行额外的思考，不要自作主张”开场；同一任务的 `go-message.md` 实跑 `--message` 为 **0 problems**，实际消息为 **3 problems**。该 fork 的父会话创建于部署前 5 分钟（10:37），是否继承旧技能文本无法从转录直接证明；可观测缺口是“检查的文件”与“发送的文本”不是同一份 | SKILL 第 4 步：已检查消息文件就是发送文本，宿主支持时用 `--prompt-file` 直接发送（Lody `lody session create\|chat --prompt-file`），不手工转抄；不支持时把最终文本再跑 `--message -`；不得前后追加开场白。长会话每次派发前比较部署副本 `SKILL.md` 哈希，变化则重读。检查器头注释补“message 模式只验证传入文件，不证明宿主实际发送内容”的限制。新增 10-19 真实消息回归测试 | 5305a8f1 实际消息原文；`go-message.md` 0 problems 实测；`actual-5305.txt` 3 problems 实测 |
| E4 中 | **审查者零输出后未按零回执切换**：9b96051d（Kimi，runner-review）11:31 CST 派发、11:36 重试，仍无 assistant 文本，11:52 被 SIGKILL；9cb4dd22（Kimi，final-review）11:52 派发，12:13 被 SIGKILL。协调者 12:10 已识别“3 份审查无正文”，但直到用户 13:20 说“审核改由 codex 进行审核”才切换，首次派发到切换约 **109 分钟**。4fbd9d1d 明确写“按角色配置规则‘不替用户决定’未替换审查模型”，与 conductor 的“零回执后更换配置”冲突 | conductor：审查/验证派发记录等待窗，超过等待窗无 assistant 文本或落盘产物即按零回执处理，先取消旧会话再切换，不等待宿主杀进程；故障切换沿用已核对目录中的同职责可用配置，不视为替用户新增模型选择，交付中标明原因。setup 的“不替用户决定”补同一例外；只有新预算/推理档位或用户指定角色才需确认 | 9b96051d / 9cb4dd22 转录；Lody 日志 `SIGKILL` 时间；4fbd9d1d 04:10/05:20 CST 条目 |

## Rejected：不成立或不应再加的规则

| 候选 | 拒绝理由 |
|---|---|
| 5305a8f1 的压制句直接判定为“新规则完全失效” | 同线部署后的 6b5e2581、9b96051d、9cb4dd22 实际消息均合规；该例是 fork/长会话的文本一致性问题，不是全员复发 |
| 把 Kimi 零输出归为技能缺陷 | 进程由宿主 `SIGKILL`，模型侧原因未确认；技能侧能修的是等待窗与故障切换，不是伪造模型可用性 |
| 701fd13a 10-19 两次推送确认 | 仓库 AGENTS.md 要求推送前明确批准；协调者先本地提交、获“推送”原话后推送，符合授权边界 |
| d4dbac56 / 3cea83f0 / e123eeb9 未显式调用技能 | 转录无 agent-conductor / rigor / 任务包证据；按普通直聊或调度任务处理，不强行归因 |

## Backlog：结构化候选与低优先观察

| 项 | 模式与建议机制 |
|---|---|
| Lody `Workspace cleanup failed` | c6afe9e8 10:46 CST 报错，机器/项目列表不可用；重启 MCP 子进程后恢复。本轮 `lody_session_status_many` 再次复现同一错误。平台问题，技能侧只保留“重启恢复、底层未修复”记录 |
| Kimi 审查进程 21 分钟无输出后被 SIGKILL | 两次同型；技能侧已加等待窗与切换规则，模型侧根因待平台排查 |
| 9 个归档会话历史为空 | 含 SAST 报告线与 ping 测试；不影响技能结论，后续如需可扩大读取通道 |
| 任务包归档位置 | `review-e1e2-task.md` 以本地提交 `0ab0b00` 备份在仓库根，未并入 main；任务包长期保存位置仍建议放本轮证据目录，不放仓库根 |

## 实施验证

- 修改：[agent-conductor SKILL.md](../skills/agent-conductor/SKILL.md)（消息文件直发、长会话哈希核对、审查等待窗、故障切换边界）、[agent-conductor-setup SKILL.md](../skills/agent-conductor-setup/SKILL.md)（故障切换例外）、[check-dispatch.mjs](../skills/agent-conductor/scripts/check-dispatch.mjs)（限制说明）、[dispatch-message.test.mjs](../tools/dispatch-message.test.mjs)（10-19 真实消息回归）。
- `mise exec -- node --test tools/*.test.mjs`：**43/43 通过，0 fail**（基准 42 → 43）。
- `mise exec -- python3 tools/package_skills.py --check`：**56 包全过**；只保留成员内容实际变化的 19 个 zip，37 个仅时间戳变化的 zip 已还原，避免噪声。
- 10-19 真实样本回归：6 个任务包、6 条消息文件全部 0 problems；实际 5305a8f1 消息 3 problems（正确拦截）；2 份任务状态 0 problems。
- 本轮修复证明的是“检查文本与发送文本一致”的规则与回归样本；行为级生效需下一次真实派发检验。长会话哈希核对与等待窗属于流程约束，检查器无法代替执行。
