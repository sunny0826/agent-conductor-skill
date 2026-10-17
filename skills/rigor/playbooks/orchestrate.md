# 跨会话持续协调项目

协调者拥有计划与 brief，不写产品代码。适用多日、多个堆叠 PR、工作比单个代理长的项目；一会话能完成的任务直接推进并验证，用 [Autonomous](autonomous-run.md)，不要引入以下仪式。规模小的相似单元折叠角色和 brief。

三条规则：完成通知进入队列而非打断；每次派发和续接完整传递 standing orders；brief 是协调者的主要产物。

## 角色与存储

协调者确定范围、写 brief、排队、维护 frontier 与用户报告。冲突、restack 与代码变更交代码拥有者。已授权且本地便宜时，协调者可机械落地已获证的无冲突提交。所有启动、等待和唤醒都走宿主实际派发接口，不用 shell CLI 冒充 Agent。

单协调者处理不过来才每 track 一个持久子协调者，最多 coordinator → track → worker 三层，滚动窗口按一次 drain 的容量控制，约十个是起点而非固定批次。子协调者上报汇总而非原始报告。优先少而广的 worker；一写者一分支／worktree。需要本机模拟器、真实表面、认证或私有转录的任务留本机；其他位置按实际宿主能力选择，不假定云接口存在。昂贵或有判断的验证者应独立且不同模型家族，身份未知须标明。

使用项目约定的 agent store 或用户给定位置，创建 `orchestrate/<project-slug>/`，先读 [持久存储契约](../references/program-store.md)。每文件唯一写者；表格是事实，status 由表格计算。没有本地存储访问的 worker 必须收到完整上下文，不只给不可达路径。

## Brief 契约

每次派发填齐 GOAL（可执行目标）、SCOPE（允许／禁止路径与独占分支）、CONTEXT（文件／PR 与上游完整报告）、ACCEPTANCE（逐项可检查）、VERIFY（真实命令／表面与 gotcha）、TIMEBOX（到期交部分结果）、FORBIDDEN（拓扑／范围等禁项）、REPORT（状态、head、产物、实际执行、偏离、后续）、STANDING（逐字 orders）。一命令单元可折叠成保留这些关键事实的段落。

本地首次派发可指向确认可读的 orders；远程与每次 resume 都完整粘贴。子协调者还需 track 边界、单元列表、派发预算、落点例外、drain 协议与逐孩子状态／PR／head／verdict 汇总。缺字段拒绝派发。每 wave 抽查一个实际 brief，与 wave 并行；失败停止下一次 refill，修 track 指令。新任务、重试或新范围新会话，不链式 resume 含糊 brief。依赖是上下文接力，不能只有排序。

## 七阶段

1. Frame：固定可计数完成条件、单元、工作量、stack 与预算；有争议的分解或单向决策用包内 [arena](../../arena/SKILL.md)。可逆准备继续。预算约 70% 时停止新派发、收敛已获证工作；未达原目标明确报告剩余，不能把预算当完成。少量工作直接做。
2. 建存储：先 orders、再 [决策日志](../../show-me-your-work/SKILL.md)，从真实 Git／forge 固定初始 frontier。
3. Pilot：一单元跑 brief、实施、验证、入链、ledger、落地，先证伪契约再放大。廉价相似单元的第一个正常获证项即可；昂贵新形状才完整独立 pilot，不把所有工作串行等待。
4. Scale：滚动窗口补位，在 drain 后重算 ready；报告传下游，兄弟只向上沟通；抽样 audit 不阻挡当前 wave。
5. Drain：按下面固定点冻结并处理一批，不在通知内深入 review diff。
6. Land：从第一项获证就持续集成，与后续 wave 并行。重仓库从 wave one 配独立 stacker，便宜时协调者机械落地；frontier 红时优先修底部。任何 push／merge 均须已有授权。
7. Close：最终 drain，每个真实派发孩子收敛为 done、abandoned 或 zombie-reconciled；核真实产物的原完成条件，每个已落地 PR 对应当前获证 head，审计 trail 及实际独立审核。保留存储供复盘，重复纠正写 orders／brief 模板。

## Queue 与四个 drain 点

收到完成仅在 inbox 写 agent／unit／status／report 指针，返回手头原子工作；需要 review 则排成验证单元。四个点：原子段结束、track rollup、真实 frontier watcher 唤醒、用户报告前。原子段包括写 brief、stack 操作、冲突决定、gate、ledger／frontier 更新。

冻结现有 inbox 为一批，处理中新增事件留下一批。每项分类 landed、needs-verify、failed、zombie、noise，更新 units、ledger，再运行 [status 生成器](../scripts/program-status.py)。缺失孩子须 arrived／respawned／明确吸收范围，不默默重做遮住缺口。drain 只报三项：状态计数、变化、open gates；细节在 status 和 trail。没有真实 watcher 使用已有事件或有界观察，不声称定时运行。

## Stack 与验证

frontier 从真实 forge 的 base refs、Git parent/head 和明确 branch 链计算：有序 PR、branch、head、generation、最低未合并项。每次 merge 或拓扑变化重算；缺实际链信息不能猜。每 stack 一个拓扑写者，登记 orders。worker 不 restack；Babysit 只读固定 generation 的链，冲突交 stacker；关闭／retarget 只能该拥有者处理。底项关闭可能孤立全链。一个真实 retro watcher 追 revert、合并后 CI 与遗留问题。

便宜的单一 VERIFY 可由 worker 执行，协调者核原输出；昂贵、主观或大影响才独立不同家族验证。ledger 按 PR＋head 键存 verdict（live-ui-verified、unit-test-verified、type-check-only、verifier-blocked、verifier-failed）与证据，verifier 覆盖同键 self-report。CI 仅输入；行为工作 type-check-only 不够；blocked 非通过，环境恢复重新派发；failed 要修复单元。新 head 旧 verdict 失效，restack 后重新验证。

获证产物落地即持久外化，不能最后才收集远程 VM 唯一副本；分支 push 仍沿用授权，缺发布权则保存已授权可达的本地产物并说明缺口。

## 活动、失败与关口

只读查实际句柄、产物、forge 与宿主状态，不 resume 试探活性，不用 mtime 或一次超时判死。确认静默死亡写 synthetic postmortem inbox（失败、最后证据、选项），不等全体停机才重排。cap／OOM 缩范围；network retry 原任务；tool-error 仅实际可用且预算允许的已选能力替代；unknown 一次诊断重试，总计最多两次，随后 abandon 并重排。不自动付费换模型。

迟到 zombie 对当前 frontier／ledger 重核，独特发现转新单元，不盲合并。上游错误、验收契约或基础设施会污染全树时写 STOP，停新派发，收敛在途后修根因；用户 stop 立即零写入。协调者自身连续 abort 同样有界重试，真实无法继续写可恢复 handoff，不虚称完成。重启先读 orders／units、重算 frontier、查实际宿主活动，再 attach／fresh spawn；分别核实本地进程与远程会话是否存活，不从一方状态推断另一方，不盲删除锁。

真正不可逆或缺授权动作、实验不能解决的产品偏好、orders 与事实冲突、重排仍死路进入 gates，带选项与可用默认；等待不是批准。常规已授权前沿修复与重试自己处理并记轨迹，无关发现留 follow-up。检查点／结束交付原条件与表格计数、tracks、精确 frontier、verdict、abandon 理由、用户 gates、store／trail 与真实 PR 链接。
