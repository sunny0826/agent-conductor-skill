# 2026-10-24 归档会话技能复盘

后续状态：10-24 归档 34 个会话，全部可读。技能相关入口 9 个，23 个任务包子会话。本轮确认 **2 个技能问题**：角色 `promptPrefix` 被误判为发送污染（A1 高），以及用户给出具体环境入口后仍沿用旧入口（A2 中）。A1 同时更正 [10-23 复盘](lody-session-skill-review-2026-10-23.md) 的 A2 归因。

## 维护前置（今日任务 1–2）

- **任务 1：本地仓库与部署副本已是最新。** 检查开始时主检出在 `337a02c`，与 `origin/main` 一致；`mise exec -- node --version` 为 **v24.22.1**，Python **3.14.2**。`node tools/check-deployment.mjs` 报 **OK 56 skills match**，`python3 tools/package_skills.py --check` 通过，无需更新。
- **任务 2：昨日复盘修改没有遗漏。** 10-23 复盘的 `df84b2c`（含 `docs/lody-session-skill-review-2026-10-23.md`、`check-sent-dispatch.mjs`）已随 PR #16 合并并部署。主检出、当前 worktree、Node 升级 worktree 和 stash 均干净，没有需要补提交的昨日改动；今日改动属于本轮 10-24 会话复盘。

## 范围与证据限制

- 归档时间来自 `~/.lody/logs` 的归档事件，按 Asia/Shanghai 过滤；本机 10-24 可证明 34 个归档，全部可读。15:51:59–15:52:00 的 20 个是一次批量归档，22:32:26 的 6 个是第二次批量归档。
- 只覆盖本机日志；其他机器上归档的会话不在本机日志里。
- 角色前缀证据来自 `lody session show <id> --json --offline` 的 `agentRoleId`，以及 `lody agent-role get <roleId> --json --offline` 的 `promptPrefix`；两条记录逐字对上。
- `lody_session_history` 只返回可见消息回合，工具调用回合不进入转录；无法从转录直接证明任务包、检查器或命令是否实际执行。

## 正向样本

| 项 | 判定 | 关键证据 |
|---|---|---|
| 角色前缀不是发送改写 | **通过** | `945cb3da` 的 15 个 `worker+` 与 3 个 `Reviewer` 子会话，首条用户消息都以对应角色的 `promptPrefix` 开头；`架构师` 子会话无前缀 |
| 去除角色前缀后消息一致 | **通过** | 9 个 `*-dispatch.md` 可比对，8 个在去掉角色前缀后与落盘文件逐字一致 |
| 真实发送改写仍可发现 | **通过** | `8a9266b7` 去掉角色前缀后仍比落盘文件多出一句依赖/类型规则修复说明，检查器在字符 109 失败 |
| 生产切换有真实证据 | **通过** | `945cb3da` 完成 B0–B7；`fbab9bcb` 部署级 E2E 7/7，321 个受保护文件哈希一致；`232fb7b` 已推送 |
| 长任务中断后可恢复 | **通过** | `5a081691` 用磁盘 manifest 和实际 Workflow 核对，跳过已完成项继续；没有把未完成项报成完成 |
| 独立审查不吸收协调者自述 | **通过** | `52ee55ce`、`3e579888`、`98fdb839` 都先跑 code-harness 再给分级问题；`79bdcff8` 在角色拒绝命令时明确降级为引用协调者实测 |

## Accepted：确定存在、本轮已实施的技能问题

| 编号 | Problem | 修复 | 出处 |
|---|---|---|---|
| A1 高 | **角色 `promptPrefix` 被误判为发送污染。** 10-23 新增的 `check-sent-dispatch` 要求发送文本与落盘消息逐字一致，但 Lody 会在带 `promptPrefix` 的 Agent Role 正文前注入该前缀。`worker+`（`f96d8f99` rev 4）前缀是「只执行任务，不要进行额外的思考，不要自作主张」，`Reviewer`（`5909b2e4` rev 2）前缀是「需要先使用本机 code-harness 来审计代码，审计通过后再开始 review 代码内容」。`945cb3da` 的 18/19 个子会话首条消息带角色前缀，旧检查只要拿到落盘文件就会把它们判为污染；10-23 归因的 11 次「发送时污染」也是这两个角色前缀，不是协调者改写。若按旧规则取消重发，宿主会再次注入同一前缀，无法收敛 | [check-sent-dispatch.mjs](../skills/agent-conductor/scripts/check-sent-dispatch.mjs) 改为从子会话 `agentRoleId` 读取角色 `promptPrefix`，只在「前缀 + 正文」整体匹配时通过；正文改写、未配置前缀仍失败；角色读取不到或会话记录的 revision 与当前角色不一致时退出码 2，不据此取消会话。新增 `--role-prefix` 显式入口。conductor 第 4 步同步更正，并注明 10-22/23 的 11 次归因错误。10-23 索引与复盘加更正注记 | `0710ca11`（worker+）、`3e579888`（Reviewer）、`6b43ff44`（worker+）、`79bdcff8`（架构师）；`8a9266b7` 为真实正文改写反例；`lody agent-role get f96d8f99…` / `5909b2e4…` |
| A2 中 | **用户给出具体环境入口后仍沿用旧入口。** `5a081691` 在 17:44、17:58 两次被告知用本机 `~/.kube/sast-scanner.yaml` 连接 ACK，仍继续尝试 omarchy 环境；18:07 用户第三次纠正并明确表达不满后才切换。此前该会话还把 `Session tool requires an active Turn` 当作环境不可用，反复尝试派发 | [rigor](../skills/rigor/SKILL.md) 开头补一句：用户给出具体环境入口（本地配置文件、集群上下文、命令）时先用该入口验证；被纠正后停止沿用旧入口，不反复探测其他机器 | `5a081691` 17:44:55、17:58:27、18:07:56 CST 三个用户回合及其回复 |

## Rejected：不成立或不应再加的规则

| 候选 | 拒绝理由 |
|---|---|
| 11 次前缀是协调者手工追加 | 角色配置、子会话 `agentRoleId`、首条消息三者逐字一致；同一角色在 `945cb3da` 的 15/15 个 `worker+` 子会话都出现，符合宿主注入而非手工复制 |
| 角色前缀也应视为污染并取消会话 | 前缀来自用户配置的 Agent Role；取消重发会再次注入，浪费会话且无法收敛。检查器应剥离已配置前缀，只校验正文 |
| `8a9266b7` 的多余句子也是角色前缀 | 该句在角色 `promptPrefix` 之后，且不在任何角色配置中；去掉前缀后仍与落盘文件不同，属真实发送改写，保留为失败样本 |
| `6b43ff44` 只承诺未执行应算技能缺陷 | 本地子 Agent 在定时轮次中被中断，父会话随后接管并补做；已有「被中断不计完成、先核对产物再补做」规则覆盖 |
| `fa5be5a2` 是技能导致的重复派发 | 它是 `5a081691` 前 37 条的会话副本，没有独立工作；按宿主副本处理，不据此新增派发规则 |
| `ba365851` 接管失败应加规则 | 只有 2 条可见消息，转录无法区分模型无输出、轮次中断和用户中止；没有可复现的技能文本缺口 |
| `134e8d72` / `9fda8346` 首轮只承诺未执行应加文本规则 | 行为确实发生（`134e8d72` 无交付，`9fda8346` 用户 7 分钟后重发才完成），但现有「回合结束前完成可独立完成的工作」已覆盖；先保留为 Backlog 观察，避免继续堆文字规则 |

## Backlog：结构化候选与低优先观察

| 项 | 模式与建议机制 |
|---|---|
| 角色前缀在发送接口层校验 | 当前靠派发后读回。宿主若在 `session create` 返回实际首条文本或文本哈希，可把核对前移，避免多一次 CLI 往返 |
| 未落盘消息 | 19 个 `945cb3da` 子会话中有 10 个没有 `*-dispatch.md`，无法逐字核对。后续可要求每次派发都把最终正文落盘，与任务包同目录保留 |
| 定时轮次中断后的接管 | `5a081691` 的本地子 Agent 和 `ba365851` 都在定时轮次中失去执行句柄。可沉淀「轮次结束前写状态文件 + 可接管命令 + 下次恢复步骤」，不只靠协调者临时判断 |
| 首轮只承诺未执行 | `134e8d72`、`9fda8346`、`6b43ff44` 都出现「我会先…」后结束。若后续复盘继续出现，再考虑把「回合结束前完成可独立完成的工作」做成可检查的回合收尾项 |

## 实施验证

- 修改：[check-sent-dispatch.mjs](../skills/agent-conductor/scripts/check-sent-dispatch.mjs)、[sent-dispatch.test.mjs](../tools/sent-dispatch.test.mjs)、[agent-conductor SKILL.md](../skills/agent-conductor/SKILL.md)、[rigor SKILL.md](../skills/rigor/SKILL.md)、[10-24 索引](lody-session-skill-inventory-2026-10-24.md)，并给 10-23 索引与复盘加更正注记。
- `mise exec -- node --test tools/*.test.mjs`：**69/69 通过，0 fail**（基准 63 → 新增 6）。
- 真实会话验证：
  - `0710ca11` + `b2-kube-dispatch.md`：**通过**，提示已去掉 `worker+` 角色前缀。
  - `3e579888` + `b5a-review-dispatch.md`：**通过**，提示已去掉 `Reviewer` 角色前缀。
  - `8a9266b7` + `b2-kube-dispatch.md`：**失败于字符 109**，角色前缀已去掉，多余句子仍被识别为改写。
- 角色 revision 与当前配置不一致时退出 2，并提示用 `--role-prefix` 提供派发时的前缀；不把配置漂移误判为发送污染。
- `mise exec -- python3 tools/package_skills.py` 重新生成 `dist/`；`--check` 通过后再提交。
- `node tools/check-deployment.mjs`：修改前 **OK 56 skills match**；修改后 `agent-conductor` 与 `rigor` 会显示 drift，这是合并前未部署的预期状态，合并后再按 [技能部署与核对](skill-deployment.md) 更新副本并复核。
- 本轮修复证明的是检查器能区分角色前缀与正文改写；宿主侧是否继续注入前缀需在下次多角色派发中复核。
