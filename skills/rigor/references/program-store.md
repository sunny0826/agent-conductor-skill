# 持久项目存储

这是原 Bun orch CLI 的可读表格替代，只管状态；宿主实际接口才派发、等待和唤醒。协调者拥有根文件，track 只写自己的子目录，rollup 由根吸收。每次操作先读实际版本，原子替换表格，不能多协调者同时更新同文件。进程／锁状态需宿主证据，不自动抢锁。

| 路径 | 权威内容与写入规则 |
|---|---|
| preferences.md | 编号 standing orders，一条约束一行；每次新增约束先落盘再派发 |
| overview.md | PR／issue durable DB，追加变化，不整篇覆盖事件历史 |
| units.tsv | UTF-8 TSV，表头 `id track state branch pr head brief`（用 tab 分列），每单元一行，原位更新；state 由实际事件决定 |
| frontier.json | `generation`、`ordered`（每项 pr／branch／head／base）、`lowest_unmerged`，Git／forge 重算，generation 单调递增 |
| ledger.tsv | TSV 表头 `pr head verdict origin evidence`；origin 为 self 或 verifier，追加一行每结论；同键 verifier 优先，双方各取最后记录 |
| inbox/ | 一完成指针一文件，包含 agent／unit／status／report；drain 原子移入一批再处理，新到不入该批 |
| gates.md | `- [ ]` 表示 open；问题、选项、默认及授权条件；已解决改 `- [x]` 并记录理由 |
| decisions.tsv | [决策日志](../../show-me-your-work/SKILL.md) 的六列契约，不自行另造 |
| status.md | 以下脚本只从表格和 gates 生成，不能手改事实 |

使用项目实际路径运行 `python3 scripts/program-status.py <store>`（脚本路径相对本技能）。它校验必需表头、单元唯一键与 verdict，拒绝坏表而不覆盖已有 status，输出当前计数、未获当前 head 证明项、open gates。它不能证明 ledger 声称的行为，协调者仍须读证据；旧 head、blocked、failed 和 type-check-only 不计行为完成。没有 ledger 行不意味着成功。变更列表写 decisions／overview，不能由两个快照猜作者行为。

标准 state 为 planned、active、needs-verify、done、failed、abandoned、zombie-reconciled；done 是拥有者报告状态，只有与当前 ledger 对照才获证。PR 尚未创建可留空，不能捏造 PR/head。脚本只写指定 store/status.md，既不执行产品命令也不读取环境秘密。
