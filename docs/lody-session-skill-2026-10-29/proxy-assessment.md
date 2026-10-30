# 活动代理任务适用性

适用候选与助手声明不是加载证明；执行结果仅为历史回执。

| 会话 | 实际任务 | 适用候选 | 采用线索 |
|---|---|---|---|
| 09bd1bf0 | 修复 R4：帮助输出测试漏检（只匹配参数行不查默认值行），改为完整 usage 块断言 | tdd、rigor | tdd：回执显式声明读取并执行 /home/guo/.agents/skills/tdd/SKILL.md（2026-10-29），动作映射=缺陷复现→最小修复→同一检查失败→通过→附近验证；并说明 rigor 未启用原因（单文件测试修复、已有明确回归入口） |
| 0cf41c70 | 10-server-go.yaml 注入 4 个 OAuth env（secretKeyRef）、b6c-run.py 渲染隔离、部署文档配置段 | rigor | 无显式线索；采用未知 |
| 0d626d1d | github.go（token 交换、/user、/user/orgs 分页短路）与 session.go（state 一次性表、会话表）+双测试文件 | rigor、principle-test-behavior-not-implementation | 无显式线索；采用未知 |
| 0d6c75ed | 只读审查 serve 两项修复（默认 auto、失败横幅）与文档同步 | rigor（审查流程） | 无显式线索；采用未知 |
| 16ed4e63 | 报告导出口径修正（settleExportState 降级）+README/验收文档同步 | rigor | 无显式线索；采用未知 |
| 2b02ddba | UI 默认资源模式改 auto、详情页失败原因横幅、门禁文档同步 | rigor | 无显式线索；采用未知 |
| 2cca2279 | 为 JS 门禁补齐文档记录（3 份 docs） | technical-writing | 无显式线索；采用未知 |
| 2ed2d634 | 图表尺寸 1:1（append 后测内容盒）+磁盘图「临时存储 · Pod」单序列+schema 采样链 | rigor、control-ui（浏览器截图验证） | 无显式线索；采用未知 |
| 328546b3 | 30 仓库画像 | rigor、why、ketchup、benchmark-checklist | $rigor（entry 0，用户）；$why（entry 2：JS 引擎授权阻塞溯源）；$ketchup（entry 12：进度追平） |
| 3690e763 | Omarchy 本机 agent-conductor 技能更新到 sunny0826/agent-conductor-skill main@f45eb3a（远端技能部署声明复核点） | rigor（部署验证）、show-me-your-work | 无显式线索；采用未知 |
| 3e318ad9 | 吸收审查建议：测试断言语义化+文档两处条件限定 | rigor、principle-test-behavior-not-implementation | 无显式线索；采用未知 |
| 3f7d75e6 | 四问调查：kubelet Summary 字段、ARMS 指标、采集端现状、设计草案开放项 | rigor（只读调查）、principle-explain-the-number | 无显式线索；采用未知 |
| 48e4c4d6 | 8 份文档对齐实现、9 断链修复、调查文档历史化、证据目录保护 | technical-writing | 无显式线索；采用未知 |
| 64d99498 | 只读审查 JS 门禁 5 文件改动 | rigor（审查流程） | 无显式线索；采用未知 |
| 68780690 | download_ready/export_status 与 SARIF 下载端点共用 exportedSARIF 门禁 | rigor、tdd | 无显式线索；采用未知 |
| 6ab18022 | UI 图表尺寸+磁盘口径全链路协调：调查 | rigor、agent-conductor | $rigor（entry 0，用户触发） |
| 71c52d49 | auth.go 路由、ServeHTTP 接线、flag/env 启动契约 | rigor、principle-type-system-discipline | 无显式线索；采用未知 |
| 74272695 | JS 门禁全链路：实施 | rigor、agent-conductor、bro、ketchup | $rigor（entry 0，用户）；$bro（entry 11：普通话重述交付）；$ketchup（entry 29：进度追平） |
| 7550a5dd | GitHub OAuth 全链路：A/B/C 方案 | rigor、agent-conductor | 无显式线索；采用未知 |
| 764517fe | 复审 R1-R4 修复与自报偏差 | rigor（审查流程） | 无显式线索；采用未知 |
| 7a7cae56 | C++ 语言识别缺陷修复+11 仓库画像+auto-c-1 设计/实施/部署/真实验收+分支清理 | rigor、benchmark-checklist | $rigor（entry 0，用户） |
| 7be43596 | 自动导出非阻塞化（后台 worker）+失败状态残留清理+重试上限 5 次+状态展示 | rigor、principle-make-operations-idempotent | 无显式线索；采用未知 |
| 7d7c6ce1 | 独立审查 OAuth 阶段 1-5 全部改动 | rigor（审查流程） | 无显式线索；采用未知 |
| 838c84a2 | 按内部草稿写早报 md+html（只读草稿、CST 换算、ADHD 友好） | unslop、technical-writing | 无显式线索；采用未知 |
| 8ccd6dd0 | secretFlag（String() 恒空）+ orgPage 校验 null/空白 login | rigor、tdd、principle-fix-root-causes | 无显式线索；采用未知 |
| 92632643 | 终审 P3 修复确认+全量快照审查 | rigor（审查流程） | 无显式线索；采用未知 |
| 9ab4ac2b | 自动导出（Reconcile 驱动）+sarif.json 下载端点+UI 收口+测试 | rigor | 无显式线索；采用未知 |
| aac53914 | tag 改 omitzero+两份 fixture 恢复 HEAD+序列化断言 | rigor、principle-type-system-discipline | 无显式线索；采用未知 |
| af275161 | 创建架构师/挑刺者/审核员角色配置卡（宿主产品操作） | agent-conductor-setup | 无显式线索；采用未知 |
| b3434c4a | 正式登录页+__USER__ 页面注入+401 跳转+登出交互 | rigor | 无显式线索；采用未知 |
| c5f4b029 | 独立会话复核图表改动：6 类 47 项断言 | control-ui | 无显式线索；采用未知 |
| c6c9a2a5 | 攻击设计方案：尺寸测量顺序、磁盘分级、schema 合并、范围裁剪 | interrogate（对抗审查候选，不证明实际加载） | 无显式线索；采用未知 |
| e02c31e3 | UI 收口 SARIF 全链路：worker1 | rigor、agent-conductor | 无显式线索；采用未知 |
| f124e295 | 审查 UI 图表改动（尺寸+磁盘指标扩展） | rigor（审查流程）、principle-test-behavior-not-implementation | 无显式线索；采用未知 |
| f1afd8d1 | 将定稿方案（A 底稿+B 反证裁决）写入 docs/design/github-oauth-login.md | technical-writing | 无显式线索；采用未知 |
| f7f7141b | 审查 worker1 改动 | rigor（审查流程） | 无显式线索；采用未知 |
| f8d62de7 | main 拉取更新 | 无强匹配 | 无显式线索；采用未知 |
| fc03f51e | ephemeral 时间戳接入采样门槛+真实入口回归测试+两处文档勘误 | rigor、tdd、principle-fix-root-causes | 无显式线索；采用未知 |
| fd0f0dc0 | JSPrimary 判定+scan_gate 临时门禁+completePreflight 拒绝点 | rigor | 无显式线索；采用未知 |
