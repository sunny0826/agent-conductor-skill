# 2026-10-29 审计源文件

[阅读分析报告](../lody-skill-usage-audit-2026-10-29.md) · [打开可筛选页面](../lody-skill-usage-audit-2026-10-29.html)

`metadata.json` 保存时间窗、覆盖范围、统计及审计后的移除决定。
`task-*.json` 按任务类别保存逐技能判断，`principle-*.json` 按设计、执行和核验主题保存原则判断。
每条记录包含源文件哈希、原因、建议及可见会话证据。记录中的 `source` 相对导出的报告目录解析。

这些记录是移除前的 56 项历史快照。`removed_after_audit` 只标记后续移除的技能，不改写原始使用证据。
详细文字分析见 [待核查技能](candidates.md) 和 [已有采用证据](evidence.md)。

从仓库根目录生成或核对 CSV、JSON 和独立 HTML：

```bash
mise exec -- python3 tools/render_skill_audit.py docs/lody-skill-usage-audit-2026-10-29
mise exec -- python3 tools/render_skill_audit.py docs/lody-skill-usage-audit-2026-10-29 --check
```

HTML 的正文模板、样式和筛选逻辑分别位于 `report.template.html`、`report.css`、`report.js`。
脚本将它们与证据记录合成独立页面，因此下载 HTML 后仍可离线筛选。
修改源文件后重新生成三个导出文件，不单独改导出文件。
