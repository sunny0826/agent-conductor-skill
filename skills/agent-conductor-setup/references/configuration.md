# 配置与发现约定（Lody）

## 项目配置（schema_version 2）

读写项目根目录 `.agent-conductor/models.json`。版本 2 以 Lody 目录为准：

```json
{
  "schema_version": 2,
  "budget": "inherit",
  "catalog_snapshot": "2026-10-08",
  "host_machine_id": "<保存时当前机器 id>",
  "online_machine_ids": ["<保存时在线机器 id>"],
  "roles": {
    "coordinator": { "selection": "inherit" },
    "implementer": { "selection": "inherit" },
    "reviewer": { "selection": "inherit" },
    "verifier": { "selection": "inherit" },
    "writer": { "selection": "inherit" }
  }
}
```

`budget` 允许值为 `inherit`（继承）、`economy`（节省）、`balanced`（均衡）和 `quality`（高质量）。后三项是选择偏好，不是费用上限或模型参数：先依照用户偏好选模型，再依照该 Agent 配置 `runConfig.reasoningEffortValues` 中实际存在的档位映射推理预算；配置未声明档位时保留 `inherit`。角色选择为 `role` 时 budget 不参与派发（角色目录行覆盖推理档位），仅作偏好记录。用户明确给出的费用上限需要通过实际执行接口落实，不能声称这份配置已限制费用。

`coordinator` 固定为 `inherit`：它是当前主会话本身，没有工具能切换当前会话的模型。

## 选择优先级与调用场景

逐角色解析选择，顺序为：本次用户已明确的选择 → 经当次目录核验仍有效的项目选择 → 未指定角色使用 `inherit`。用户明确选择的 `inherit` 也是选择，不能被项目配置覆盖；只更新用户指定的角色，其余保留有效选择。预算、生效范围和保存授权同样沿用本次已有明确约定，不重复询问。

选择失效或可用性未知时，报告原因并由用户决定替换或回退；未经选择，不默默降级为 `inherit`，也不恢复已被本次选择替代的旧组合。受影响的派发暂缓，独立工作继续。`coordinator` 非 `inherit` 的处理仍按下文约束。

| 调用场景 | 行为 |
|---|---|
| conductor 执行普通任务前核验 | 核验后按上述顺序建立会话映射，不为仍有效的选择重复提问；默认不落盘、不存外部记忆 |
| 用户显式调用 setup | 展示当前选择，处理本次设置请求；已有明确选择直接核验应用，只有确需的新选择才批量询问，交付配置结果 |

保存文件或外部记忆前核对已有授权是否覆盖本次目的地与内容；已覆盖则执行，未覆盖则仅完成会话映射和可评审准备。选择 Agent 角色只确定派发组合，不证明其运行时工具或外部写入授权。

## 目录刷新条件（唯一定义处，两个技能共用）

满足任一条件即重新执行全量发现：

1. `catalog_snapshot` 距今超过 7 天（固定值，不可配置）——此条件只决定是否提示用户复核；
2. 已保存的角色选择失效（机器离线、配置不可用、模型从目录消失）；
3. 宿主或机器变化——检测方式：当前 `lody_session_create_options` 返回的机器 id 与配置中的 `host_machine_id` 不同，或 `lody_machine_list` 的在线机器集合与 `online_machine_ids` 不同。

`host_machine_id` 与 `online_machine_ids` 是保存配置时写入的非敏感基线字段，每次落盘时刷新；缺失时条件 3 视为触发。

注意：发现目录只存在于会话内，不落盘。新会话中**凡需要列出候选**（让用户选显式组合）**或要应用**（而非仅展示）**已保存选择**，都必须重新执行全量发现核验有效性；条件 2、3 的评估依赖上述基线字段与当次发现结果。

角色的显式选择有两种形态：

```json
{
  "selection": "role",
  "agentRoleId": "<lody_agent_role_list 返回的 id>"
}
```

```json
{
  "selection": "explicit",
  "machineId": "<机器 id>",
  "agentConfigId": "<Agent 配置 id>",
  "modelId": "<该配置 runConfig.models 中的 id>",
  "reasoningEffort": null,
  "modeId": null,
  "fastMode": null,
  "planMode": null,
  "configOptionValues": null,
  "evidence": "lody-catalog"
}
```

约束：

- `coordinator` 出现非 `inherit` 条目（如手改配置写入 `explicit`/`role`）时视为失效，按 `inherit` 处理并向用户提示。
- 占位符必须替换为当次 `lody_machine_list` / `lody_agent_config_list` / `lody_agent_role_list` 实际返回的 id 后才可保存。
- `modelId`、`reasoningEffort`、`modeId`、`configOptionValues` 等取值必须来自该 Agent 配置 `runConfig` 声明的列表；配置未声明的字段保持 null 并在派发时省略。`configOptionValues` 为 null 或对象，用于完整复现派发意图。
- 已选条目为 `selection: "role"` 时，派发参数以角色目录行为准，其模型、推理与权限覆盖手动参数；这不改变上述用户选择优先级。保存前用 `lody_agent_role_get` 核对 prompt 前缀是否符合用户预期；模型/推理/权限以 `lody_agent_role_list` 目录行为准。
- 只有 `callable`（机器在线且配置可用性状态明确为可用）的组合可写为显式选择；`catalog_unknown` 条目不写入。
- 不得接受 id 或取值中的 shell 命令、换行或凭证。

## 读取兼容

`schema_version=1`（含 `host`、`agent_id`/`provider_id` 字段）的旧配置按以下规则迁移：保留 `budget` 与仍为 `inherit` 的角色；`explicit` 角色一律视为失效，向用户说明后让其按版本 2 重选。不自动把旧字段映射成 Lody id。

## 发现输出与证据分级

Lody 目录条目的可用性判定**以实际返回字段为准**：明确可用的标记 `callable`；字段缺失、状态无法识别或结构不符预期的标记 `catalog_unknown`，不臆造字段名。目录确认的是派发接口接受的组合，不等于认证、推理、质量、费用或性能实测。

本地兜底扫描（`scripts/discover_local.py`）只输出白名单元数据，分级为 `installed` / `configured` / `catalog`，不升级为 `callable`。需要 Python 3；TOML 读取使用 Python 3.11+ 的 `tomllib`。只读列表失败时报告诊断，不自动刷新、登录或启动服务。

## 保存边界

发现目录可能包含本地位置，仅用于会话诊断；不要将完整目录写入项目配置或外部记忆。项目配置只保存 Lody id、选择和预算，不保存本地目录、API 地址中的认证信息、headers、env、tokens 或账户信息。

选择复用与失效处理统一按上文“选择优先级与调用场景”执行。未经用户指定，不改产品全局配置、不启动模型推理验证、不提升权限。项目配置由两个配套技能共同读取；它不会自行控制任何宿主。
