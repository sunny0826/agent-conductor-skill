# 2026-10-28 归档会话技能复盘

10-28 归档 **74 个事件、74 个唯一会话**，全部有可读历史。技能相关 65 个：15 个入口和 50 个派生子会话。本轮确认 **3 个技能问题**：派发消息契约复发（A1 高，17 个子会话、35 个问题）、把设备证据写成用户确认（A2 高，2 个入口）、笼统“真机验证通过”被扩写成具体项通过（A3 高，1 个入口）。另记录未调用技能与优化建议（只建议，不改技能）。

## 维护前置（今日任务 1–2）

- **任务 1：本地仓库与部署副本已是最新。** 检查开始时仓库在 `9d9ddc1`，与 `origin/main` 一致；`mise exec -- node --version` 为 **v24.22.1**，Python **3.14.2**。`node tools/check-deployment.mjs` 报 **OK 56 skills match**，`python3 tools/package_skills.py --check` 退出 **0**，无需更新。
- **任务 2：昨日复盘修改没有遗漏。** 10-27 复盘的 `07edf09`、`0fb68de` 已随 PR #20 合并为 `9d9ddc1`；主检出的部署副本在 10-28 09:32 更新，核对 56/56 一致。主检出、当前 worktree、Node 升级 worktree 和 stash 均干净，没有需要补提交的昨日改动；今日改动属于本轮 10-28 会话复盘。

## 范围与证据限制

- 归档时间来自 `~/.lody/logs` 的 `Archived session runtime released` 事件，按 Asia/Shanghai 过滤；10-28 有 **74 个事件、74 个唯一会话**，没有重复。
- 只覆盖本机（`9b919ec3`）日志；其他机器上归档的会话不在本机日志里。
- `lody session history` 只返回可见消息回合，工具调用回合不进入转录；无法从转录直接证明任务包、检查器或命令是否实际执行。
- 4 个旧会话（`c6d5b575`、`55a84f4a`、`db0d75b9`、`a2291e51`）不在归档元数据列表，标题和父子关系用 `session show` 读取；它们最后活动在 10-03 至 10-09，12:38 CST 批量归档，不属于 10-28 当天工作。
- 5 个 `cdedd821` 子会话的 Agent Role revision 已变化，无法还原发送时的 `promptPrefix`；`--lint` 打警告后按全文检查，不能据此判断发送污染。
- 部分任务包在用户要求清理后删除（`mym5-issue-16` worktree、sast-workflow 验证产物），包文件检查只覆盖仍存在的包。

## 正向样本

| 项 | 判定 | 关键证据 |
|---|---|---|
| 子会话派发保持指针与回执 | **通过** | `ba8e29a2` 的 5 个子会话全部 0 problems；3 个 `check-sent-dispatch` 比对显示发送文本与消息文件一致 |
| 设备验收保留未验证项 | **通过** | `3dfaa333` 交付写明重启后时间 16:10:20、步数 13801、旧日期 6196 步归档，同时保留完整渲染套件既有失败和 code-harness 缺配置 |
| 不把子会话推断当结论 | **通过** | `79a4db1e` 明确不采纳“日期 2026-01-01 可解释历史 `--`”的推断，Issue #16 保持开放，继续跟踪真实跨夜与备电 |
| 正确处理取消的审查 | **通过** | `704de601` 把 `8d18c8f6` 的截断输出判为旧版审查取消回执，不当作结论；改用 `5fb78bfb` 的复审回执 |
| 角色卡片等待用户保存 | **通过** | `8e96250b` 生成 writer (Omarchy) 卡片后明确“请点击保存，目前仍待保存”，没有声称已生效 |

## Accepted：确定存在、本轮已实施的技能问题

| 编号 | Problem | 修复 | 出处 |
|---|---|---|---|
| A1 高 | **派发消息契约复发。** 50 个当前子会话中 17 个（34%）的落盘首条消息违反消息契约，合计 35 个问题：无包指针 12、无回执要求 13、消息含禁令条款 10。`762e7d7e` 的 6 个子会话全部内联任务正文并带“不要修改/不要提交”等边界（15 problems）；`cdedd821` 的 6 个子会话全部无回执（9 problems）；`ae345860` 的 `289185ca`、远端部署的 `6d3f8d9e`、`6720a894`、`d89f20e9`、`6ce4e231` 也同类。10-27 已补文字规则并收紧指针判定，仍在 10-28 大面积复发 | [check-sent-dispatch.mjs](../skills/agent-conductor/scripts/check-sent-dispatch.mjs) 新增 `--lint`：不需要事先保存的消息文件，直接读子会话落盘首条消息并调用 `check-dispatch --message -` 检查；角色 revision 变化时警告并按全文检查。[SKILL.md](../skills/agent-conductor/SKILL.md) 第 4 步把“创建前 0 problems 消息文件 + 创建后 `--lint` 非 0 就取消重发”写成硬关口。[session-review.md](session-review.md) 增加历史派发的 `--lint` 复核步骤 | `762e7d7e` 6 个、`cdedd821` 6 个、`289185ca`、`6d3f8d9e`、`6720a894`、`d89f20e9`、`6ce4e231` |
| A2 高 | **设备/日志证据被写成用户确认。** `319552e4` 写“实体设备（你的目视确认 + 串口证据）”，`79a4db1e` 写“你已确认首页显示具体步数”；两次用户消息都只说设备已连接、请烧录并验证，没有目视或显示确认。串口和日志能证明设备行为，不能证明用户看过 | [SKILL.md](../skills/agent-conductor/SKILL.md) 第 9 步补：用户消息是用户确认的唯一来源；串口、日志、截图、退出码只能写成设备或产物证据；写“你已确认／目视确认”必须引用用户原话。[task-state.md](../skills/agent-conductor/references/task-state.md) 的验收返回同步要求。新增 [check-user-claims.mjs](../tools/check-user-claims.mjs)，按会话扫描 assistant 全部回合中的用户确认措辞，没有逐字原话即报 unsupported；[session-review.md](session-review.md) 增加机械核对步骤 | `319552e4` 第 10 个 assistant 回合；`79a4db1e` 第 9 个 assistant 回合；`check-user-claims.mjs` 对两处各报 1 unsupported |
| A3 高 | **笼统“真机验证通过”被扩写成具体项通过。** `762e7d7e` 在用户说“设备已连接，烧录并测试”后明确写“步行测试还没做（你取消了选择）”；用户随后说“真机验证通过，合并 PR”。最终交付却写“Issue #8 已关闭，附真机验证结论（启动正常、存档回读、静置 0 假步、**步行计数通过**）”。没有步行测试的手数或串口增量，步行项此前明确未执行 | [SKILL.md](../skills/agent-conductor/SKILL.md) 第 9 步补：笼统通过不得扩写成具体项通过，此前明确未执行的检查保持未验证。[task-state.md](../skills/agent-conductor/references/task-state.md) 同步；真机/设备、发布、部署的多轮验收必须建表并在交付前跑 `--complete`，用 `pending` 阻止“完成” | `762e7d7e` 第 11、13、14 个 assistant 回合；用户“真机验证通过”在第 12 个用户回合 |

## B 类观察（不归因于本技能或不需改技能文本）

| 观察 | 说明 |
|---|---|
| 3 个子会话零 assistant 文本 | `67bc8d02`、`0f733e3d`、`fc019cb8` 各只有首条用户消息。`c2bf1afd` 实际采用 `7c06e800` 的裁决，`52c243f5` 未在交付中引用 `67bc8d02`；没有证据表明父会话把它们计为完成，但也没有显式记录零回执。列为 backlog，不按失败计 |
| `3490688b` 设备恢复后触摸/IMU 不可用 | 电源方案实施后设备静默，恢复后触摸和 IMU 仍不可用，用户最后要求“代码恢复到最初状态”；归档时没有后续回复。属于硬件/实施风险，不是派发契约问题；会话如实列出了不可用项 |
| `319552e4`“无需重新烧录” | 交付称设备固件与 master 一致，但没有在可见文本中给出镜像读回哈希与构建哈希的对照。可能是工具回合已完成，转录不可见；不据此判定虚报 |
| `ae345860` 与 `52c243f5` 首条消息相同 | 两个入口会话复用同一任务说明，`ae345860` 末尾停在应用菜单入口，`52c243f5` 继续完成并推送。可能是重复启动，不是技能文本问题 |
| `76aedc05` 先报“无 code-harness 技能” | 用户指出已全局应用后，会话核对 symlink 并撤回结论；属于工具发现错误，不归因于本技能。可考虑在 `how` 或 `skill-help` 里补“先查全局安装位置再下结论”，本轮不改 |
| `850b5dae` 安全组放行 | 用户说“加一条”，会话新增 `155.254.108.8/32` 443 放行并实测 200/302；属于用户授权后的外部操作 |
| `8d18c8f6` 回执截断 | 输出停在“我正在复核…”，父会话按取消回执处理并重派；符合“回执截断时读落盘报告/不以截断结案”的规则 |

## Rejected：不成立或不应再加的规则

| 候选 | 拒绝理由 |
|---|---|
| `319552e4` 的“你已确认”可能来自未落盘的权限提示 | 用户回合只有“设备已连接，进行烧录并验证”和“合并 PR”；权限提示不是用户对图鉴画面的确认。没有原话就不能写成目视确认 |
| `762e7d7e` 的用户“真机验证通过”可视为步行测试通过 | 同一会话在用户消息前明确说“步行测试还没做（你取消了选择）”，没有新的步行数据；笼统通过不能补上未执行的检查 |
| 17 个派发问题是角色 `promptPrefix` 造成的 | 违规内容是消息本身：无包指针、无回执、含“不要修改/不要提交”等边界；角色前缀只影响前缀剥离，不解释这些缺陷 |
| 3 个零 assistant 文本的子会话都应计为失败 | 没有父会话把它们写成完成；`c2bf1afd` 采用了另一个成功裁决。需要的是零回执记录，不是直接判失败 |
| `a3e50123` 删除 worktree 属于越权 | 用户明确要求清理已合并/关闭的 worktree；会话逐项核对 `merge-base --is-ancestor`，保留未跟踪文件和补丁备份，未删分支 |

## Backlog：结构化候选与低优先观察

| 项 | 模式与建议机制 |
|---|---|
| 零回执子会话 | 若再次出现“有首条消息、无 assistant 文本”的子会话，在任务状态表记录 `waiting`／`zero-receipt`，交付时列出补做或重派；当前不新增脚本 |
| 笼统通过扩写的自动识别 | `check-user-claims.mjs` 只查用户确认措辞；如果“未做→通过”再次出现，可增加“同一关键词在早期‘未执行’与最终‘通过’同时出现”的提示，先人工复核再判定 |
| `check-sent-dispatch --lint` 的角色前缀警告 | 角色 revision 变化时无法剥离前缀，只能全文检查；若反复出现误报，再让 Lody 提供发送时前缀快照，不在本轮扩大脚本职责 |
| 任务包清理后的复盘 | `mym5-issue-16` 与 sast-workflow 验证产物被用户要求清理后，包检查只能覆盖仍存在的包；后续在清理前保存包哈希或首行，便于复盘 |

## 未调用技能与优化建议（任务 4）

只分析未被调用的技能并给建议，不修改这些技能。完整清单、判定口径和 11 条建议见 [10-28 技能使用与优化建议](lody-session-skill-usage-2026-10-28.md)。

## 实施验证

- 修改：[check-sent-dispatch.mjs](../skills/agent-conductor/scripts/check-sent-dispatch.mjs)、[SKILL.md](../skills/agent-conductor/SKILL.md)、[task-state.md](../skills/agent-conductor/references/task-state.md)、[check-user-claims.mjs](../tools/check-user-claims.mjs)、[sent-dispatch.test.mjs](../tools/sent-dispatch.test.mjs)、[user-claims.test.mjs](../tools/user-claims.test.mjs)、[session-review.md](session-review.md)、[10-28 索引](lody-session-skill-inventory-2026-10-28.md)、[10-28 技能使用分析](lody-session-skill-usage-2026-10-28.md)。
- `mise exec -- node --test tools/*.test.mjs`：**85/85 通过，0 fail**（新增 14 项 dispatch/user-claims 测试）。
- `mise exec -- python3 tools/package_skills.py` 重新生成 `dist/`；`--check` 退出 **0**。
- `node tools/check-deployment.mjs`：修改前 **OK 56/56**；修改后 **DRIFT 1/56**（`agent-conductor`），合并后再按 [技能部署与核对](skill-deployment.md) 更新副本并复核。
- 派发证据：`check-sent-dispatch --lint` 对 50 个子会话报 **17 个非 0、35 个问题**；`check-user-claims` 对 74 个会话报 **2 个 unsupported**（`319552e4`、`79a4db1e`）。
- 分支：`skill-maintenance-2026-10-29`。
- 未验证：A1/A2/A3 在下一次同型会话中的行为效果；5 个角色前缀变化子会话的发送前缀；清理后的任务包内容。
