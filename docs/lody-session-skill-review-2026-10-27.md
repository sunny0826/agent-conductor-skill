# 2026-10-27 归档会话技能复盘

后续状态：10-27 归档 **90 个事件、89 个唯一会话**；可读 83 个，`session show` 不可读 6 个（其中 `987c1f7c` 仍可读 2 条历史），其余 5 个没有历史。技能相关 72 个：8 个入口和 64 个派生子会话。本轮确认 **3 个技能问题**：MCP／工具派发绕过包与消息契约（A1 高）、包文件缺首行类型声明（A2 中）、笼统“验收通过”被当成清单逐项通过（A3 中）。另记录若干不归因于技能的观察。

## 维护前置（今日任务 1–2）

- **任务 1：本地仓库与部署副本已是最新。** 检查开始时仓库在 `65accd7`，与 `origin/main` 一致；`mise exec -- node --version` 为 **v24.22.1**，Python **3.14.2**。`node tools/check-deployment.mjs` 报 **OK 56 skills match**，`python3 tools/package_skills.py --check` 退出 **0**，无需更新。
- **任务 2：昨日复盘修改没有遗漏。** 10-26 复盘的 `32f4b45`、`f592c6a` 已随 PR #19 合并为 `65accd7`，部署副本在 10-27 09:28 更新，核对为 56/56 一致。主检出、当前 worktree、Node 升级 worktree 和 stash 均干净，没有需要补提交的昨日改动；今日改动属于本轮 10-27 会话复盘。

## 范围与证据限制

- 归档时间来自 `~/.lody/logs` 的 `Archived session runtime released` 事件，按 Asia/Shanghai 过滤；10-27 有 **90 个事件、89 个唯一会话**，`d042616b` 重复出现一次。
- 只覆盖本机（`9b919ec3`）日志；其他机器上归档的会话不在本机日志里。
- `lody session history` 只返回可见消息回合，工具调用回合不进入转录；无法从转录直接证明任务包、检查器或命令是否实际执行。
- Johto 子会话的任务包与证据目录在用户要求清理过程文档后删除；本轮只能核对首条消息和仍保留的 `writer-power-package.md`。

## 正向样本

| 项 | 判定 | 关键证据 |
|---|---|---|
| 未验证项在真机交付中保留 | **通过** | `d042616b` 最后交付明确写“真机计步精度、投球时延、断电恢复仍未系统实测”，并要求用户继续走 261 步确认遭遇触发；没有把单次 `target=261` 写成完整验收 |
| 子会话回执带复现与关闭判断 | **通过** | `717333e8` 的 reviewer／verifier 子会话分别写明修复前失败输出、修复后断言、exit 0 和未验证项；P2/P3 的关闭判断可追溯到具体测试 |
| 文档改动先核对代码事实 | **通过** | `84bdccab` 让 writer 逐条核对 `AGENTS.md`、schema4 数值和链接，再修改；父会话抽查 diff 后才提交 `85d470c` |
| 无更新时不制造 PR | **通过** | `b126ecae` 检查锁文件、Go 模块、mise 工具和 Actions 后报告无更新；Python 3.15.2 因 uv 与 mise 尚不支持托管解释器而保留，并给出原因 |
| 模型建议标注未实测 | **通过** | `e3ecea70` 给出协调者选型建议，同时写“尚未做同任务速度与成功率实测”，没有把目录枚举当成性能证明 |

## Accepted：确定存在、本轮已实施的技能问题

| 编号 | Problem | 修复 | 出处 |
|---|---|---|---|
| A1 高 | **MCP／工具派发绕过任务包与消息契约。** `84bdccab` 按用户要求用 Lody MCP 创建 writer 会话，两条首消息都是整段任务正文，没有包指针，也没有回执要求，还把“不要提交／不要推送／不要切分支”这类边界写进消息。`check-dispatch.mjs --message` 对 `b3c5f708`、`da113c7f` 各报 3 problems：缺包指针、缺回执、消息含边界条款。旧检查器还把任务正文里顺带出现的 `README.md`、`AGENTS.md` 当成包指针，掩盖了“没有指针”这一项 | [agent-conductor/SKILL.md](../skills/agent-conductor/SKILL.md) 第 4 步补：MCP／API／会话工具没有文件入参时，仍先落盘任务包并跑包检查，再把消息写成包指针加回执；工具只接收字符串时原样传入已检查的消息内容，不内联任务正文、边界或禁令；用户指定 MCP 不豁免。 [check-dispatch.mjs](../skills/agent-conductor/scripts/check-dispatch.mjs) 收紧指针判定：路径必须靠近消息开头，或在写明“任务包／package／请执行／读取并执行”的行上；顺带出现的 `.md` 文档路径不再算指针。新增两条消息检查测试，并更新 2026-10-21 内联包样本的期望问题数 | `84bdccab` 派发 `b3c5f708`、`da113c7f`；`check-dispatch.mjs --message` |
| A2 中 | **任务包缺首行类型声明。** `717333e8` 派发 writer 时使用 `.agent-conductor/issue-11/writer-power-package.md`，首行是 `# 任务：…`，不是 `任务包类型：…`。指向它的消息是合规指针，因此只检查消息不会发现；`check-dispatch.mjs` 对包文件报 `no package-type declaration` | [agent-conductor/SKILL.md](../skills/agent-conductor/SKILL.md) 第 4 步同步写明：消息检查通过不代表包文件合法，包首行类型声明必须单独检查。 [session-review.md](session-review.md) 增加包检查步骤 | `2e32a338` 首消息；`writer-power-package.md` |
| A3 中 | **笼统“验收通过”被当成清单逐项通过。** `a1e60b91` 给 PR #4 列出六项实机验收（线索、解谜、首领、捕捉、无奖励重打、重启保持），用户只回报森林／海边／洞窟／解锁和一次选择 bug，随后说“没有问题了，提交并合并 PR #4”；PR #5 同样给出四步清单，用户只回复“验收通过”。合并后的交付没有逐项记录哪些场景有用户原话、哪些仍未确认，也没有保留这些缺口 | [agent-conductor/SKILL.md](../skills/agent-conductor/SKILL.md) 第 9 步补：笼统“验收通过”“没有问题了”只证明用户认可当前状态，不替代验收清单逐项回报；未明确确认的项仍列为未验证。 [task-state.md](../skills/agent-conductor/references/task-state.md) 的“验收返回”补：没有对应原话或产物回执的 `acceptance` 项保持 `pending` | `a1e60b91` 第 167／170-180／187-189 条 |

## B 类观察（不归因于本技能或不需改技能文本）

| 观察 | 说明 |
|---|---|
| `d042616b` 两条中间回复以冒号结尾 | 第 5、6 条分别停在“查证上午烧录的固件来源：”和“把源文件补进 storage 测试脚本：”，没有后续正文。属于用户可见格式问题，technical-writing 已要求完整句子；本轮不加条款 |
| `d042616b` 的“随机遭遇 ✅ target=261” | 表格证明的是目标阈值已持久化且在 200–500 区间，不等于遭遇已触发；同一条交付随后要求用户走到 261 步确认。建议以后把该行写成“目标阈值已持久化”，现有 verification-surfaces 已覆盖测量与状态的区别 |
| `717333e8` 删除远程 `feat/power-key-sleep` 与旧证据 | 用户原话是“删除过期的旧方案”；会话保留最终证据并写明删除范围。属于用户授权后的清理，不归因于技能 |
| `84bdccab` 提交 17 个文件、删除 453 个过程文档 | 453 个文件在 `.pio` 下且被 Git 忽略；`git show --stat 85d470c` 与实际提交一致，17 个文件不是漏报 |
| `e3ecea70` 的 6 台机器／39 个配置／8 个角色 | 本轮未独立复核枚举完整性；会话把建议标为未实测，未把它写成基准结论 |
| `987c1f7c` 的 `hello world` | 旧会话，最后活动在 10-04；元数据不可读但历史可读，不属于技能相关 |

## Rejected：不成立或不应再加的规则

| 候选 | 拒绝理由 |
|---|---|
| `a1e60b91` 多次在用户消息后约 0.4 秒给出完整报告，说明未执行 | 时间戳是回合可见文本的落盘时刻，不是工具执行起点；10-25 复盘已拒绝同型判断 |
| `84bdccab` 删除 453 个过程文档属于越权 | 用户明确要求删除所有过程文档，并说明这是对“保留验收证据”约定的显式覆盖；会话保留了用户要求归档的设备资料 |
| `717333e8` 写“11 个异步任务全部 succeeded”是虚报 | 12 个子会话都有实质回执，未找到失败或缺失的反例；11 与 12 的差异可能是重派或计数口径，现有证据不足以判定虚报 |
| `d042616b` 只测了一次 `target=261` 却声称随机性通过 | 交付没有把单次目标当成随机分布验收；它明确要求用户继续走到 261 步确认触发 |
| `e3ecea70` 没有基准测试就不应给模型建议 | 它明确标注“尚未做同任务速度与成功率实测”，属于配置建议而不是性能结论 |
| 任务包删除后无法复盘，应禁止清理 | 用户要求清理过程文档；首条消息和仍保留的包已经足以核对派发形态，包内容不是本轮问题的唯一证据 |

## Backlog：结构化候选与低优先观察

| 项 | 模式与建议机制 |
|---|---|
| MCP 派发的捆绑检查 | 本轮收紧消息指针判定，并保留“包文件单独检查”的人工步骤。若再次出现“消息合规但包缺类型”，可让 `check-sent-dispatch` 在指针指向存在的包时自动跑包检查；当前不扩大脚本职责，避免把消息形态检查与包内容检查混在一起 |
| 笼统验收的自动识别 | 若“验收通过／没有问题了”再次被当成清单通过，可在任务状态模板中要求每个 `acceptance` 记录用户原话引用；当前先补文字规则 |
| 不可读会话 | 5 个会话没有历史、1 个只有元数据不可读；若同型重复出现，在索引记录不可读原因而不只记事件 |
| 中间回复截断 | `d042616b` 的悬空冒号若重复出现，再检查宿主回合截断或工具输出拼接，不在技能文本里加格式条款 |

## 实施验证

- 修改：[agent-conductor/SKILL.md](../skills/agent-conductor/SKILL.md)、[task-state.md](../skills/agent-conductor/references/task-state.md)、[check-dispatch.mjs](../skills/agent-conductor/scripts/check-dispatch.mjs)、[session-review.md](session-review.md)、[10-27 索引](lody-session-skill-inventory-2026-10-27.md)、[dispatch-message.test.mjs](../tools/dispatch-message.test.mjs)。
- `mise exec -- node --test tools/*.test.mjs`：**71/71 通过，0 fail**。
- `mise exec -- python3 tools/package_skills.py` 重新生成 `dist/`；`--check` 退出 **0**。
- `node tools/check-deployment.mjs`：修改前 **OK 56/56**；修改后 **DRIFT 1/56**（`agent-conductor` 的 `SKILL.md` 与 `references/task-state.md`），合并后再按 [技能部署与核对](skill-deployment.md) 更新副本并复核。
- `dist/` 只有包含 `agent-conductor` 的 ZIP 更新，其余保持原样。
- 证据命令：`check-dispatch.mjs --message` 对 `b3c5f708`、`da113c7f` 各 **3 problems**；`check-dispatch.mjs` 对 `writer-power-package.md` 报 **1 problem**（缺类型声明）；Johto 50 条与 Issue #11 12 条首消息均为 **0 problems**。
- 分支：`skill-maintenance-2026-10-28`。
- 本轮改了技能文本、检查器指针判定和复盘检查项；A1/A2/A3 在下一次同型会话中的行为效果仍需复核。
