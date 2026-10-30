# Lody 会话索引：2026-10-29

2026-10-30 采集。真实本机归档 27 次、26 个唯一会话；39 条活动代理和 7 条旧缺口单独列出。72 候选中 65 条可读、354 条消息。重复事件仅 `b8c7499c`；7 个旧缺口经 CLI 重试和 MCP 复查均未恢复（MCP：SESSION_NOT_FOUND）。

CLI 归档目录 1194 条；MCP 活动目录 63 条、无 nextCursor，全部包含在本次集合。代理时间窗为 2026-10-28T16:00:00Z 至 2026-10-29T16:00:00Z，lastMessageAt/lastActivityAt 不是 archivedAt。

机器缩写：9b919ec3 为本机 San3an.local，d0ca4e65 为 Omarchy；完整机器 ID、父会话、角色修订、快照哈希与检查结果见 [证据 JSON](lody-session-skill-evidence-2026-10-29.json)。

## 分组清单

- [本机真实归档索引](lody-session-skill-2026-10-29/local-index.md)：26 个会话。
- [活动代理索引](lody-session-skill-2026-10-29/proxy-index.md)：39 个会话。
- [本机任务适用性](lody-session-skill-2026-10-29/local-assessment.md)与[代理任务适用性](lody-session-skill-2026-10-29/proxy-assessment.md)：按可见任务逐条判断。

## 旧缺口补查

| 会话 | 任务标题 | 机器／消息数 | 归档时间 CST |
|---|---|---|---|
| [0fae397e](lody://session/0fae397e-6a3e-49fd-8a9a-7ff17f5b3d15?workspace=jh731nqq74z6j0p3252qrjxryh8e707a) | 不可读旧记录 | 未知／不可读 | 未验证 |
| [38cf769b](lody://session/38cf769b-60d5-47e4-847f-da24489a8533?workspace=jh731nqq74z6j0p3252qrjxryh8e707a) | 不可读旧记录 | 未知／不可读 | 未验证 |
| [516ab573](lody://session/516ab573-1505-480e-a2f3-ef3d66e18c28?workspace=jh731nqq74z6j0p3252qrjxryh8e707a) | 不可读旧记录 | 未知／不可读 | 未验证 |
| [7737b132](lody://session/7737b132-4764-47a0-92e7-4701ca8fb9d4?workspace=jh731nqq74z6j0p3252qrjxryh8e707a) | 不可读旧记录 | 未知／不可读 | 未验证 |
| [886d9ea8](lody://session/886d9ea8-89bf-4c0e-a8b0-ab22b693657c?workspace=jh731nqq74z6j0p3252qrjxryh8e707a) | 不可读旧记录 | 未知／不可读 | 未验证 |
| [a52cf278](lody://session/a52cf278-6dec-4342-9e48-b9bd99c08ea4?workspace=jh731nqq74z6j0p3252qrjxryh8e707a) | 不可读旧记录 | 未知／不可读 | 未验证 |
| [e8d8a9bb](lody://session/e8d8a9bb-6edb-459c-b9cb-bef9a82b0d16?workspace=jh731nqq74z6j0p3252qrjxryh8e707a) | 不可读旧记录 | 未知／不可读 | 未验证 |

## 证据边界

两组复核分别报告完整读取 26/158 与 39/196（会话/可见消息）；协调者核对 ID 集合无遗漏，并复核重点争议原文。所有加载证据均未知；09bd1bf0 的 tdd 路径记录仍是助手声明。索引序号跳号只证明返回的是可见消息投影，不能据此推算丢失了多少用户轮次。7a7cae56 在复核启动后恢复，最终 index 与原文件均为 35 条。

[证据总览](lody-session-skill-evidence-2026-10-29.json)指向按任务主题拆分的数据文件；各分组共 72 个唯一记录。
