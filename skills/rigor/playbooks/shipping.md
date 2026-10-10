# 独立验证后自底向上合并

前提是用户明确授权 merge／land／ship 或 merge-when-ready；Babysit 或绿 CI 不提供合并权。

1. 固定实际 forge、仓库、目标分支与自底向上 PR 列表，每 PR 独立验证 parent 与 head 的真实负载／用户路径。验证者不能是作者，记录实际身份和 PASS／PASS+NOTES／FAIL，缺独立能力不宣称安全。对外发布评语须已有授权。
2. 从最低未合并项只取连续获证段，遇第一缺口停；上层虽通过也不可跳过父项。
3. 固定验证的 base SHA、head SHA 和稳定 patch-id。合并前核对当前差异；不变 patch 也要刷新 CI 与 mergeability。patch 改变则重新验证受影响行为。只有文档／测试／lint 差异时，对依赖构建的 lane 在旧版构建两次、新版一次区分噪声或嵌入 SHA；无构建产物的 dev session 不复用。不能用提交消息相同替代证明。
4. 仅准备当前最低 PR：获取最新 trunk，必要时在已授权拥有者分支变基，先核远端再只用 force-with-lease，不改共享分支；只 retarget 当前底项，变基后重做版本／patch 适用性和当前检查。
5. 一次合并一个，允许 squash 依项目约定；用户明确要求 merge-when-ready 才 arm 当前底项，不预先 arm 子项。auto 请求不是已合并，也不证明整个链安全。
6. 每次真实 merged 确认后 fetch、核 merged commit、删除列表底项并复查新的 base／head／patch／checks；不要假定宿主自动 retarget。持续 watcher 是唤醒，最终判断用 forge mergedAt／state，不能把 READY 当 MERGED。
7. closed 但未 merged、确实阻塞的必需检查失败或不可合并状态才判失败；pending checks／已排队不是失败。队列卡住先诊断不变拓扑。
8. 连续验证段全部合并后停在下一缺口；延长段需新一轮独立验证。
交付段与上限、每 PR 当前验证身份／版本、arm 与确认方式、实际合并项及缺口。
