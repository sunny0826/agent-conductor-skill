# 独立队列构建并获证后合并

适用于用户明确授权独立 PR 队列全生命周期；请求“先说协议／计划”只展示等待 go，指定用户亲自处理项保留关口。与 Orchestrate 协调者落地不同，这里 owner 持有每个 PR 的构建到合并，root 负责验证和审计。

1. 一 PR 一个实际独立 owner，互不依赖项并行各自分支，耦合项合并后再分支或短私有 stack。开头建立 decisions 与 children 表、具体接受标准、写范围和真实版本。早提交快照／开 PR 仅在已有授权且达到项目声明的状态，不为 15 分钟指标伪称 ready。
2. owner 捕获自证、代码检查／注释检查、当前基线、CI 与 [Babysit](babysit.md)，代码定稿报告 code-ready head，每次 patch 改变报告新 head。repo 要求的提交前检查在实际提交头执行，hook 绿不自动证明行为。
3. root 在精确 head 启动独立 [swarm](../../swarm/SKILL.md)：gate lane、真实表面 lane、相同场景 trunk 对照和至少两个有不同重点的源码审查 lane；新功能 trunk 不存在明确记录，不伪造 trunk 结果。主审核实际 receipts，不以 PR 文案替代。
4. 所有可证明发现一次返回 owner，包括被写成 note 的缺陷。行为缺陷要求有效 red 证明或真实复现，下一轮 brief 带齐。新 patch 重新独立验收，只有 [Shipping](shipping.md) patch-id 规则允许保留确实有效 lane。
5. root 当前轮 clean 且 owner 当前 merge-ready head 的 CI／patch／基线检查适用，用户合并授权才允许 owner merge。合并准备最后核 trunk overlap 和实际冲突，变化使 verdict 失效则重新验证。用户指定项仍等其操作；下一项使用新 owner。
6. 新提高固定 gate／预算要有已授权 root 的具体复核记录，不能旁路 forge 的强制批准，已落地主干值只是漂移。按真实定时能力审计 owner／children、远端／检查变化、trail 和工作句柄；mtime／单次沉默／观察超时不证明死亡，确认失效或停滞后收回写入权再替换，迟到结果对当前 head 重新核。
7. 对所有子工作收敛终态、收集轨迹、合并后回退／CI／评语扫尾。用户 stop 立即传播零写入，release 后才继续。
交付队列、owner、head、每轮验证、实际合并、复核记录、人关口与 trail。未具备真实独立或持续能力时报告缺口，不宣称全自动完成。
