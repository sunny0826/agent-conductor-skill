# 组织可评审提交与 PR

只有既有提交／推送／开 PR 授权才执行外部动作；否则交付可评审本地结果。项目模板与用户交付方式优先。

核对实际基线、工作树和用户改动，隔离可用 worktree；不 reset --hard 或覆盖 unrelated 工作来清树。提交只 stage 本轮具体路径，按可验证单元组织，不自动修改共享历史。

先用包内 [代码检查](../references/code-review.md) 检查冗余与实际契约，范围内注释按 [注释与补丁约束](../references/code-review.md#注释与补丁约束)；标题、说明和提交正文用 [unslop](../../unslop/SKILL.md)，不调用其他插件的清理技能。

采用项目标题约定，适合时 Conventional Commits type(scope): subject。说明先讲具体问题和结果，再写变化、范围、值得评审的取舍、真实影响和验证；空项省略，证据链接到真实产物，不贴整段日志／SHA 列表。性能一项主要数字带单位，其他方法与数据留证据。

优先宿主明确提供的 PR 工具，核对身份、仓库、base、head、实际权限；缺工具 CLI 仅已存在且适用才用，body 用结构参数或文件不插 shell 文本。独立工作从 trunk，依赖子项明确 parent branch，按项目约定选择 ready／draft，不无视用户草稿要求。在已获全链路或并行审查授权的场景下，本地纯净快照门通过后优先推 **Draft PR**，并行启动远端 CI（轨 A）与零历史污染的独立审查（轨 B）；独立审查包未绑定当前 Head SHA 完成前不转 `Ready`。

创建后读回真实 URL 与状态，不能伪造。创建 PR 不等于启动 babysit，更不授权 merge；继续本来阶段，用户要求处理状态才 [Babysit](babysit.md)。已授权全链路或 autopilot owner 才按其 brief 进入后续双轨收敛流程。
