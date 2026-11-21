> 以包内 `why/SKILL.md` 的实际能力、只读权限与证据规则为准；没有对应工具不得编造查询结果。

# Source playbooks

`why` 仅在仓库内直接保留源码历史与防御性事件线索两份参考；其余外部来源（工单、长文档、即时聊天、运行监控、错误追踪、产品分析仓库）须先查看当前宿主实际可用的 MCP/CLI 工具 schema，按只读有界查询取证，并准确区分“工具不可用 / 无访问权 / 未搜索 / 搜索无结果”。

| Category | Playbook / Guidance |
|---|---|
| Source control history (`git` / `gh`) | [`code-archaeology.md`](./sources/code-archaeology.md) |
| Issue / ticket tracker | 按实际工具 schema 检索提交/PR 关联的 ticket ID、状态与完整评论，不凭标题推断 |
| Long-form documents | 读完整 ADR、设计文档或事后报告正文（非摘要片段），保留日期与版本 |
| Real-time team chat | 按涉及人与代码引入日期窗口检索原始讨论线程，保留上下文回复 |
| Infrastructure observability / Error tracking | 核对改动窗口前后的真实指标、报错堆栈与首次出现时间，不将时间相关直接当作因果 |
| Product analytics warehouse | 先用只读描述确认实际表名与字段，不假设组织特定 schema，queries 限定范围 |

Cross-cutting:

- [`incident-postmortem.md`](./sources/incident-postmortem.md). Add this if the target code looks defensive (null checks, retry, timeout, rate limit, feature flag, egress guard, OOM handler).
