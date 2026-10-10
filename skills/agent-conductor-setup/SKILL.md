---
name: agent-conductor-setup
description: "基于 Lody 发现全部 Agent 和模型，配置角色模型与推理预算：分页枚举 Lody 的机器、Agent 配置（含推理档位）与 Agent 角色，让用户选择角色组合与预算，生成项目级角色配置。用于用户要求发现 Agent 或模型、首次配置、更新角色模型、调整预算或修复调用配置；也供 agent-conductor 在任务组织前调用。"
---

# Agent Conductor Setup · 基于 Lody 的 Agent 与模型配置

Lody 是 Agent 与模型的权威目录。发现必须**以 Lody 接口为主、分页到穷尽**，不允许只做本地文件扫描或只取稀疏候选就宣称"已发现"。本地 CLI 扫描只作为 Lody 不可用时的兜底（见附录）。

两条贯穿全程的原则：

1. **完整发现**：机器、Agent 配置、Agent 角色三类清单全部枚举——跟随响应中的 `nextCursor` 逐页请求，**直到响应不再返回 `nextCursor`（或其为空）**才算穷尽，中途不得截断。
2. **不替用户决定**：角色模型、预算、落点、是否落盘、是否存外部记忆，全部列选项让用户选；用户未选之前只在会话内建立临时映射。

## 0. 快速路径

先读项目 `.agent-conductor/models.json`：

- 存在且版本、字段有效：汇报当前各角色选择与预算，询问用户本次要改什么。**凡需要列出候选的修改，一律重新执行第 2 步全量发现**——目录只存在于会话内，新会话没有可列的候选；**要应用（而非仅展示）已保存选择时，同样必须先重新发现核验有效性**（触发条件统一定义在 [配置约定](references/configuration.md) 的"目录刷新条件"）。
- 不存在或已失效：继续第 1 步。

## 1. 确认宿主与当前上下文

调用 `lody_session_create_options`（不带筛选），确认当前会话的 Agent 配置、所在机器 id、当前项目——这是 `coordinator` 的继承来源和各角色 `inherit` 的含义。机器在线状态不在这里判断，由第 2 步的 `lody_machine_list` 给出。

Lody 工具不可用（非 Lody 宿主）时，走附录的本地扫描兜底路径，并在交付中明确说明发现范围不完整。

## 2. Lody 全量发现（分页到穷尽）

依次调用，每个都按第 1 条原则的终止信号翻页穷尽：

1. `lody_machine_list`（`limit=100`）：全部机器，记录在线状态。
2. `lody_agent_config_list`（`limit=100`，不加 `query` 筛选）：全部可读的 Agent 配置。每条提取 `id`、`name`、`agentType`、`machineId` 及 `runConfig` 中的模型列表、配置级 `reasoningEffortValues`、`modes`、`fastMode`、`planMode`。推理档位以配置级 `runConfig.reasoningEffortValues` 为准；某些返回可能在单个模型上附带档位，以实际返回为准，缺失时只用配置级。
3. `lody_agent_role_list`（`limit=100`）：全部 Agent 角色，记录可用角色与不可用角色的原因。角色的当前模型/推理/权限以其目录行为准；`lody_agent_role_get` 只用于查看 prompt 前缀。

汇总为目录（只存会话内，不落盘）：

- 按 **机器 → Agent 配置 → 模型** 分组。组合标识为 `machineId + agentConfigId + modelId`。
- 可用性判定**以实际返回字段为准**：机器在线且配置的可用性状态明确为可用，标记 `callable`；**字段缺失、状态无法识别或返回结构不符预期时，一律标记 `catalog_unknown`** 并在交付中注明条数，不臆造字段名、不把未知当作无模型。
- 角色标记 `role`：经 `agentRoleId` 派发，其模型与预算由角色目录行决定，会覆盖手动参数。
- Lody 目录确认的是**派发接口接受的组合**，不等于经过认证、推理、质量、费用或性能实测；不做推理验证。
- 快照时间记入目录；目录只在本次会话有效。

## 3. 让用户选择（必须）

发现完成后，把目录压缩成可读摘要呈现给用户，并用**一次批量询问**让用户决定。摘要按机器分组，每个 Agent 配置一行（名称、模型数、代表模型名），另列可用 Agent 角色及其预设模型；完整模型清单用户要求时才展开。

询问项：

- **各角色组合**：`inherit`（沿用当前会话）/ 某个 Agent 角色（`agentRoleId`）/ 显式组合（`agentConfigId + modelId`，可加 `reasoningEffort`、`modeId`、`fastMode`、`planMode`、`configOptionValues`）。显式候选只从 `callable` 组合中列。**coordinator 固定 `inherit`**——它是当前主会话本身，没有工具能切换当前会话的模型，不列入候选。
- **落点**（凡派发需要在本地项目内工作就问，角色或显式组合、同机或跨机均可）：落点机器不由本询问项决定——显式组合的机器随组合选定，Agent 角色的机器由其目录行决定；本项只询问**该落点机器上的项目**。落点机器是当前机器时默认项为"当前项目"；跨机器时默认纯 chat（或列出该机器上的项目供选择）。项目 id 一律用 `lody_session_create_options` 的 `machineId=<实际落点机器> + localProjectQuery` 解析。不指定落点时以纯 chat 启动。
- **预算**：继承 / 节省 / 均衡 / 高质量。映射到该 Agent 配置实际声明的 `reasoningEffortValues`；未声明档位时保持 `inherit`，不臆造档位。选择 Agent 角色时预算不参与派发（角色目录行覆盖），仅作偏好记录。
- **生效范围**：仅本次会话 / 写入项目 `.agent-conductor/models.json`。
- **外部记忆**：是否把结果存入 Nowledge Mem。默认不存。

已有配置中的组合失效（机器离线、配置不可用、模型从目录消失）时，列出失效原因让用户决定替换还是回退继承。缺少价格或质量证据时不根据模型名字臆测成本和能力。

角色职责供用户参考：

| 角色 | 职责 | 选择依据 |
|---|---|---|
| coordinator | 分流、拆解、汇总与授权判断 | 固定为当前主会话（`inherit`） |
| implementer | 实现代码与机械改动 | `callable` 组合中符合用户预算的模型 |
| reviewer | 结构和差异审查 | 适合判断的可调用模型，允许与实现模型相同但独立会话 |
| verifier | 驱动真实应用并核对证据 | 工具权限匹配的 Agent 配置或角色 |
| writer | 文档与交付说明 | 用户偏好及任务所需的表达能力 |

由 `agent-conductor` 在普通任务中调用时，自动完成第 1–2 步并在会话内建立 `inherit` 映射，不向用户追问，不落盘、不存外部记忆。

## 4. 校验并保存（仅经用户确认后）

按 [配置约定](references/configuration.md) 生成 `schema_version=2` 配置。只有 `callable` 组合可写为显式选择；`catalog_unknown` 条目不写入显式选择。保留必要诊断（失效项、unknown 条目数）。

用户选择落盘时写入项目 `.agent-conductor/models.json`，保留无关字段，原子替换，写入后做一次 JSON 校验。只写角色、Lody ID（`machineId`/`agentConfigId`/`agentRoleId`/`modelId`）、推理档位、模式开关、配置选项值（`configOptionValues`）、机器基线字段和非敏感标签，不写凭证或本地绝对路径。

用户选择存外部记忆时，只存能力快照摘要（机器数、配置数、组合数、各角色选择）与时间，不存完整目录。

## 5. 应用并交付

派发使用 `lody_session_create` / `lody_session_create_many`：

- 显式组合传 `machineId + agentConfigId + modelId`，该配置声明了 `reasoningEffortValues` 才传 `reasoningEffort`；按需传 `modeId`、`fastMode`、`planMode`、`configOptionValues`（取值必须来自该配置 `runConfig` 的选项列表）。
- 角色派发传 `agentRoleId`；**`machineId`/`agentConfigId`/模型/推理参数会被角色目录行覆盖，一律不传**。
- 需要在本地项目内工作时传 `workContext`：项目 id 用 `lody_session_create_options` 的 `machineId + localProjectQuery` 解析，其中 `machineId` 必须是**实际落点机器**（显式组合即所选 `machineId`；角色派发即角色目录行的机器）；不传则以纯 chat 启动。
- `inherit` 省略所有模型覆盖参数。
- 权限与模式选择不得超出用户授予调用方的授权范围。

交付：机器数（在线/离线）、Agent 配置数、Agent 角色数、组合总数、`catalog_unknown` 条目数、各角色选择（标明用户所选还是会话默认）、预算、生效范围。保存过文件时链接它；仅会话映射时明确说明。不得宣称已切换主会话模型或完成未经执行的模型验证。

## 附录：非 Lody 宿主的本地扫描兜底

Lody 工具不可用时，使用本技能目录的扫描脚本做本地发现（范围明显更窄，必须在交付中注明）：

```sh
python3 <本技能目录>/scripts/discover_local.py --project <项目绝对路径>
```

默认只读扫描已知位置和经过核对的列表接口，不执行推理、不启动代理。用 `--no-cli` 限定为本地文件扫描；隔离测试用 `--home <测试目录> --no-cli`。扫描失败保留诊断继续处理，不打印配置原文、认证文件或环境变量值。证据分级：`installed`（PATH 存在）/ `configured`（配置声明）/ `catalog`（列表接口），均不等于 `callable`；没有宿主派发接口时不执行 `exec`、`-p` 等命令验证。

符号链接拒绝范围仅为扫描 root 自身及其以下组件；root 的祖先由调用者信任，允许 `/tmp → /private/tmp` 等系统别名。
