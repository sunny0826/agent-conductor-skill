# 最近两周 Lody 归档 session 的技能使用分析

后续决定（2026-10-29）：用户确认移除 `make-bot-ui`，其余技能全部保留。下文及配套 CSV、JSON 保留移除前的审计快照和原建议；当前仓库为 55 个技能。

本仓库 32 个任务技能中，17 个缺少明确采用证据：14 个只见维护提及或没有命中，3 个有间接迹象。另有 14 个在时间窗内有明确证据，skill-help 在近期归档的旧会话中有 10-10 的使用声明。24 个原则技能中，只有 principle-fix-root-causes 有明确采用声明，其余 23 个无法从可见转录判定是否加载。

[可筛选报告](lody-skill-usage-audit-2026-10-29.html) · [56 项明细 CSV](lody-skill-usage-audit-2026-10-29.csv) · [证据索引 JSON](lody-skill-usage-audit-2026-10-29.json)

## 范围与证据口径

时间窗固定为北京时间 2026-10-15 11:18 至 2026-10-29 11:18。范围是本仓库技能在当前 Lody 工作区所有可访问归档 session 中的使用，而非仅分析本仓库内开的会话。技能清单基于 f45eb3a，共 56 个。

- 主样本：576 个最近两周有活动、查询时已归档的 session，来自 5 台机器，全部读取完整可见历史。MCP 前 4 页得到 400 个；后续同步失败，使用官方 CLI 补齐，400 个 ID 全部包含在 CLI 清单中。
- 归档补查：本机现存日志找到 269 次归档事件、267 个唯一 session，其中 14 个在主样本外。补充读取成功 7 个，另 7 个在 CLI 和 MCP 均返回 SESSION_NOT_FOUND；不是零使用样本。
- 共尝试 590 个、读到 583 个，3399 条可见消息；时间窗内 3335 条，按角色、时间戳、正文去重后 3260 条。fork 继承和子会话回传不能重复当作新调用。
- Lody 列表不提供完整 archivedAt。本机日志最早保留到 10-22，其他机器的真实归档日期未核验。因此这是“近期活动且已归档 + 可核验本机归档补查”，不能宣称跨机器严格按归档日全覆盖。此前每日 inventory 只作为线索，未替代本轮原转录读取。
- 统计完整档案，并单独标出时间窗前的使用。明确证据包括用户点名调用、助手采用声明、带明确技能来源的决策或派发；这些不等于工具已加载成功，更不等于每个步骤执行成功。
- 名称出现在目录、安装、更新、ZIP 清单、维护讨论、角色名、引用的建议中，不算采用。仅行为相似列为间接证据；原则技能缺名不推断为没用。当前审计会话不计入。
- 本机 `node tools/check-deployment.mjs` 实跑结果为 `OK 56 skills match`。它只证明当前本机内容一致，不证明历史时点或其他机器都加载成功；某个 ~/.codex 路径缺失也不足以证明宿主不能从 ~/.agents 发现技能。

## 哪些任务技能缺少明确采用证据

[17 个任务技能的原因与优化建议](lody-skill-usage-audit-2026-10-29/candidates.md)。

## 建议顺序

1. **先让采用可见。** 在已有任务状态或回执里只增加必要记录：技能名、触发原因、实际证据。需要区分选择、读取与应用；不要求在每条用户回复里刷技能名。下次复盘统计“适用任务 → 采用 → 产物”，而不是名称命中率。
2. **把重复验收变成可复用能力。** 优先核对 PokeTrail 是否已有 verify 技能；没有且确需复用时，用 create-verification-skill 跑通一个稳定设备场景。后续任务复用同一入口，保留烧录、启动、UI/传感器、用户确认各自的证据边界。
3. **把反复犯错导向 correct。** 14 个例行复盘请求都有“本 SKILL”歧义；明确复盘入口为 reflect。已有两次以上同类错误时，按 correct 检查架构、类型、lint 或测试能否阻止复发，再决定是否补文档。不是再加一套强制复盘。
4. **检查已有路由，不重复添加。** benchmark-checklist、tdd、technical-writing、control-ui 已经有上游链接。性能任务先核查是否采用现有核验步骤；注释审查已有对应产物时，先标清来源，不再派一轮重复审查。
5. **低频入口按需保留。** ketchup 可显示为“进度简报”，teach 明确为概念与取舍教学；automate-me、make-bot-ui、maintain-verification-skill 等专用技能暂不因两周低频删除。TS 技能要用实际 TS/TSX 任务作适用分母。

原因归纳：一是主入口和子角色承担了工作，却没有叶子技能的采用记录；二是部分重复场景没有形成明确、可复用的入口；三是专用技能本来低频，且三个沟通技能在 10-16、control-ui 在 10-17 才加入。本次没有证明某一种原因可以解释所有技能。

## 已有证据，不能继续列入未使用

[已有采用证据的技能](lody-skill-usage-audit-2026-10-29/evidence.md)。

## 原则技能：23 个不可判定

`principle-attack-the-premise`、`principle-boundary-discipline`、`principle-build-the-lever`、`principle-encode-lessons-in-structure`、`principle-exhaust-the-design-space`、`principle-experience-first`、`principle-explain-the-number`、`principle-foundational-thinking`、`principle-guard-the-context-window`、`principle-laziness-protocol`、`principle-make-operations-idempotent`、`principle-migrate-callers-then-delete-legacy-apis`、`principle-minimize-reader-load`、`principle-model-the-domain`、`principle-never-block-on-the-human`、`principle-outcome-oriented-execution`、`principle-prove-it-works`、`principle-redesign-from-first-principles`、`principle-separate-before-serializing-shared-state`、`principle-sequence-verifiable-units`、`principle-subtract-before-you-add`、`principle-test-behavior-not-implementation`、`principle-type-system-discipline`。

24 个原则都已在 [rigor 原则目录](../skills/rigor/references/principles.md) 中出现，因此没有发现“完全没入口”的原则。建议保持按需读取，记录其改变了哪项具体决定，再评估维护价值。不要仅凭低频合并：explain-the-number 检查数字意味着什么，prove-it-works 检查产物/行为是否真实，两者当前文本明确区分职责。

## 对既有建议的源码复核

| 常见建议 | 当前源码事实 | 本轮结论 |
|---|---|---|
| 给性能任务增加 benchmark-checklist 入口 | [rigor](../skills/rigor/SKILL.md) 和 [perf-issue](../skills/rigor/playbooks/perf-issue.md) 已链接 | 先查实际选择和证据，不重复加链接 |
| 给修复流程加 tdd | [bug-fix](../skills/rigor/playbooks/bug-fix.md) 已链接；本期有采用声明 | 不列入未使用 |
| PR/文档阶段接 technical-writing | rigor 和 opening-a-pr 已链接；本期有采用声明 | 不列入未使用 |
| UI 验证加 control-ui | [verification-surfaces](../skills/rigor/references/verification-surfaces.md) 已要求先读 | 查执行者路径和调用痕迹 |
| 维护验收时一定再用 maintain-verification-skill | create-verification-skill 已覆盖增量维护；maintain 要求全功能审计 | 保留不同任务边界，避免双重流程 |
| 把全部原则合并/删除 | 所有原则已有 rigor 入口，且观测不完整 | 现有证据不足以支持批量删除 |

## 可复核方法与缺口

本轮通过 Lody MCP `lody_session_list(archive="archived", updatedAfter="2026-10-15T03:18:00Z", limit=100)` 翻页，遇到同步失败后使用 `lody session list --archived --json` 补齐；按 lastMessageAt 和固定截止时间筛选。对每个 ID 使用 `lody session history <id> --all --offline --json`，检查 returned 与 total 一致；失败项再通过 MCP 复查。归档事件来自项目已有 `tools/archived-sessions.mjs` 的读取函数。

先用 56 个规范名称进行边界匹配并抽取上下文，再逐项排除维护、安装、普通英文单词、角色名与引用。调用标记和采用声明逐项回读。命中数仅辅助找证据，不作为调用次数。报告 JSON 提供源文件哈希、56 项判断及关键 session/消息索引；CSV/HTML 不包含完整私人转录。

7 个归档补查失败项（主样本 576 个全部可读）：

- `886d9ea8-89bf-4c0e-a8b0-ab22b693657c`：CLI 与 MCP 均返回 SESSION_NOT_FOUND。
- `a52cf278-6dec-4342-9e48-b9bd99c08ea4`：CLI 与 MCP 均返回 SESSION_NOT_FOUND。
- `7737b132-4764-47a0-92e7-4701ca8fb9d4`：CLI 与 MCP 均返回 SESSION_NOT_FOUND。
- `0fae397e-6a3e-49fd-8a9a-7ff17f5b3d15`：CLI 与 MCP 均返回 SESSION_NOT_FOUND。
- `38cf769b-60d5-47e4-847f-da24489a8533`：CLI 与 MCP 均返回 SESSION_NOT_FOUND。
- `e8d8a9bb-6edb-459c-b9cb-bef9a82b0d16`：CLI 与 MCP 均返回 SESSION_NOT_FOUND。
- `516ab573-1505-480e-a2f3-ef3d66e18c28`：CLI 与 MCP 均返回 SESSION_NOT_FOUND。

尚未核验：历史宿主技能目录与加载事件、每项技能是否完整执行、其他机器的精确归档日期、适用任务的完整分母。所有原因推断和建议均受这些缺口限制。

本次只新增分析报告和证据索引；未修改技能、调度、角色配置或部署，也未提交或推送。
