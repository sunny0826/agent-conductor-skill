# 2026-10-25 归档会话技能复盘

后续状态：10-25 归档 15 个事件、14 个唯一会话；13 个可读，`886d9ea8` 已删除不可读。技能相关入口 5 个，技能派发的 Lody 子会话 2 个。本轮确认 **3 个技能问题**：迁移时回改历史证据（A1 高）、交付未写验证主体（A2 中）、用户可见回复混入内部旁白（A3 中）。另记录 1 个跨会话恢复声明观察（B1），未加载本技能，不计入技能归因。

## 维护前置（今日任务 1–2）

- **任务 1：本地仓库与部署副本已是最新。** 检查开始时主检出在 `926ce46`，与 `origin/main` 一致；`mise exec -- node --version` 为 **v24.22.1**，Python **3.14.2**。`node tools/check-deployment.mjs` 报 **OK 56 skills match**，`python3 tools/package_skills.py --check` 通过，无需更新。
- **任务 2：昨日复盘修改没有遗漏。** 10-24 复盘的 `6e2eca5`、`3fb5346`、`9798393` 已随 PR #17 合并，并在 10-25 01:51 的「更新本地 SKILL」回合同步到部署副本；主检出、当前 worktree、Node 升级 worktree 和 stash 均干净，没有需要补提交的昨日改动。今日改动属于本轮 10-25 会话复盘。

## 范围与证据限制

- 归档时间来自 `~/.lody/logs` 的 `Archived session runtime released` 事件，按 Asia/Shanghai 过滤；10-25 有 **15 个事件、14 个唯一会话**。`886d9ea8` 在 10:18:42 与 10:19:06 各记一次，随后被删除，`lody session show` 返回 `Session not found`。
- 12:41:48 的 `fa17fa6f`、`87cb3690`、`b879cc06` 是一次批量归档；12:41:54 归档 `5a73e955`。
- 只覆盖本机日志；其他机器上归档的会话不在本机日志里。
- `lody_session_history` 只返回可见消息回合，工具调用回合不进入转录；无法从转录直接证明任务包、检查器或命令是否实际执行。

## 正向样本

| 项 | 判定 | 关键证据 |
|---|---|---|
| 派发包与消息通过契约 | **通过** | 两个验证目录内 8 个任务包（`exploration`、`review`、`visual`、`code-review`、`design-review`、`review-input`、`visual-review`、`visual-review-r2`）全部 **0 problems**；8 个对应消息也全部 **0 problems** |
| 实发文本与已检查消息一致 | **通过** | `check-sent-dispatch.mjs` 对 `b879cc06`、`87cb3690` 均返回 `sent message matches checked message` |
| 独立审查发现真实缺陷 | **通过** | `b879cc06` 审查 12 张图，指出白闪遮住「妙蛙种子」；主会话修复后 `87cb3690` 重验 20 张，白闪与名称已分离 |
| 审查不冒充目视 | **通过** | `87cb3690` 报告写明使用 `view_image`、20 张原尺寸逐张查看、Pillow 只读核对像素与哈希，并声明不代表实体设备或连续动画 |
| 故障切换有回执 | **通过** | 外部 Codex `gpt-5.4-mini` 返回 `model_not_found`，`visual-review-failed-receipt.md` 记录失败阶段与无结论；随后切换 Lody Codex `gpt-6.1-sol`，子会话完成 |
| 两轮根因修复 | **通过** | `aab2b007` 第一轮修复重启后的时钟锚点；用户仍显示「今日 --」后，第二轮定位到普通校时被更早日期拒绝，未把第一轮说成已彻底解决 |

## Accepted：确定存在、本轮已实施的技能问题

| 编号 | Problem | 修复 | 出处 |
|---|---|---|---|
| A1 高 | **迁移/改名时回改历史证据。** `877a006d` 先把 k3s 相关产品说明、安装代码和当前文档改成 Kubernetes；随后把历史测量记录中的「K3s 服务 cgroup / k3s-server」改成「本机 Kubernetes 服务 cgroup / 控制面进程」，把 2026-10-19 的历史验证「k3s 拉取」改成「本机 Kubernetes 拉取」，并把历史构建命令改成新入口。测量数字没变，但当时的环境名与命令已被替换，读者无法再知道这些数字量的是 k3s。助手在第 1 条消息已识别「历史测量记录会失去当时量的是 k3s 这个事实」，仍在第 4 条中静默回改 | [verification-surfaces.md](../skills/rigor/references/verification-surfaces.md) 补：迁移、改名或清理旧术语只改产品与当前文档；历史日志、测量记录、验收回执和提交说明里的原始环境名、命令与数字保留原值，需要时加注记；改写历史证据先说明取舍并取得同意。[session-review.md](session-review.md) 增加复盘检查项 | `877a006d` 第 1/4/6 条；`/Users/guoxudong/sectrend/sast-workflow` 提交 `26250a4` 的 `docs/implementation-artifacts/scan-resource-usage-20261020.md`、`rootless-image-build.md`、`spring-boot-jdk21-scan-20261020.md` 差异 |
| A2 中 | **交付未写验证主体。** `fa17fa6f` 的最终回复写「20 张真实 Runtime/M5GFX 截图已逐张目视核对」，但任务包明确写「主协调者无法通过当前 read 工具看到图片」，实际由 `87cb3690` 子会话完成。读者会把子会话的目视当成协调者自验 | [agent-conductor/SKILL.md](../skills/agent-conductor/SKILL.md) 第 9 步补：交付正文标明验证主体；子会话完成的检查写执行者与回执，不写成协调者自己核对；协调者只对自己的实测标注自验 | `fa17fa6f` 第 5 条；`visual-review-r2-task.md` 第 3 行；`87cb3690` 报告 |
| A3 中 | **用户可见回复混入内部旁白。** `5721bf04` 首条可见回复以「文件长度都在限制内。我标完成…」重复两次开头，随后是「更新 todo。然后给用户一段短结论。用中文。少术语。…开始 todo。」，最后才是用户要的结果。待办更新、计划复述和自检步骤进入了正文 | [rigor/SKILL.md](../skills/rigor/SKILL.md) 的「写清楚与证明结果」补：用户可见回复只写结果、证据和缺口；待办更新、工具步骤、计划复述和自检旁白留在任务状态或证据文件，不写进正文 | `5721bf04` 第 1 条 |

## B1：跨会话恢复声明观察（非技能归因，已补通用规则）

`e4f5eb80` 写入 SmartRing Plus 固件后称「设备已经恢复」，同一回复又说触摸芯片、重力计仍读不到，屏幕同步每帧超时，无法从串口证明倾斜生效；下一轮用户报「设备还是无法正常启动」。烧录哈希与串口 `ready=1` 只证明写入和启动，不证明用户可观察的功能恢复。该会话没有 `$rigor` 标记，不能归因于本技能，但同型风险适用于所有恢复任务；本轮在 [verification-surfaces.md](../skills/rigor/references/verification-surfaces.md) 补一句：恢复/修复类任务以用户可观察的症状消失为完成条件，用户确认前写「待确认」，不写「已恢复」。

## Rejected：不成立或不应再加的规则

| 候选 | 拒绝理由 |
|---|---|
| `4d41870f`、`6e806ea6` 在用户消息后 1 秒内给出完整报告，说明未执行 | 两者都是带前序工作的续接/压缩会话；时间戳是回合可见文本的落盘时刻，不是工具执行起点。不能用它判断是否真的执行 |
| `87cb3690` 1 秒内完成 20 图目视，说明伪造 | 该会话同样是续接/压缩形态；报告含逐图清单、像素哈希、`view_image` 方法与范围限制，未发现与产物矛盾的证据 |
| 外部 Codex `model_not_found` 是技能缺陷 | setup 已写明 Lody 目录只证明派发接口接受组合，不等于账号已支持；本次失败被记录为无结论，随后切换 Lody Codex 并成功，符合现有故障切换规则 |
| `5c3a9b5b` 删除 28 个修改和 3 个未跟踪文件应归因于本技能 | 该会话没有 `$rigor` 标记；用户原话「切换回 main 分支，所有修改」存在歧义，但会话未加载本技能的 destructive-change 规则。保留为 Backlog，不据非技能会话改技能文本 |
| `fa17fa6f` 末轮只承诺不执行应升级为规则 | 回复后 61 秒发生批量归档，无法区分主动结束回合与被归档中断；10-24 已把同型放在 Backlog 观察，本轮不重复加文字规则 |

## Backlog：结构化候选与低优先观察

| 项 | 模式与建议机制 |
|---|---|
| 分支清理前的未提交改动 | `5c3a9b5b` 在「切换回 main 分支，所有修改」后删除 28 个修改和 3 个未跟踪文件。若后续 `$rigor` 会话复发，考虑把「切换/清理前保留未提交改动，丢弃需明确措辞」做成 conductor 的不可逆动作核对项，或提供 `stash`/worktree 默认保留 |
| 外部 Agent 的实发文本无法读回 | `agent` 工具的 `task_*` 会话没有 Lody 转录，`check-sent-dispatch` 只能覆盖 Lody 子会话。本轮只能核对任务包与消息文件；若后续出现外部 Agent 实发改写，再考虑要求记录发送文本哈希 |
| 回合收尾的「只承诺」 | `fa17fa6f` 末轮被归档中断，证据不足。若后续在未被中断的 `$rigor` 会话再次出现，再把「回合结束前完成可独立完成的工作」做成可检查收尾项 |
| 已删除会话 | `886d9ea8` 归档两次后删除，无法分类；若同型重复出现，可在复盘索引记录删除原因而不只记事件 |

## 实施验证

- 修改：[rigor/SKILL.md](../skills/rigor/SKILL.md)、[rigor/references/verification-surfaces.md](../skills/rigor/references/verification-surfaces.md)、[agent-conductor/SKILL.md](../skills/agent-conductor/SKILL.md)、[session-review.md](session-review.md)，新增 [10-25 索引](lody-session-skill-inventory-2026-10-25.md)。
- `mise exec -- node --test tools/*.test.mjs`：**69/69 通过，0 fail**。
- `mise exec -- python3 tools/package_skills.py` 已重新生成 `dist/`；`--check` 退出 **0**，11 个包含 `agent-conductor` 或 `rigor` 的 ZIP 更新，其余未改内容的 ZIP 保持原样。
- 真实会话核对：两个验证目录内 8 个任务包与 8 个消息文件均 **0 problems**；`b879cc06`、`87cb3690` 实发文本与已检查消息 **一致**。
- `node tools/check-deployment.mjs`：修改前 **OK 56 skills match**；修改后 **DRIFT 2/56**（`agent-conductor` 的 `SKILL.md`，`rigor` 的 `SKILL.md` 与 `references/verification-surfaces.md`），这是合并前未部署的预期状态，合并后再按 [技能部署与核对](skill-deployment.md) 更新副本并复核。
- 分支：`skill-maintenance-2026-10-26`。
- 本轮修复证明的是技能文本与检查器能识别上述模式；A1/A2/A3 在下一次同型会话中的行为效果仍需复核。
