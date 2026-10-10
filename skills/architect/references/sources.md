# 适配

| 文件 | 保留与适配 |
|---|---|
| [SKILL.md](../SKILL.md) | Ground、Sketch、Agree、Implement、Scrap 五阶段；调用者优先、结构替代方案、实施偏离与重建。 |
| [runner-prompt.md](runner-prompt.md) | 数据优先、接口深度、单一归属、边界、不变量、重复执行与失败。移除固定调用文件数门槛。 |
| [rationale-template.md](rationale-template.md) | 用法、结构、取舍、备选、合成决定与下一步；按规模精简，不要求固定栏目，原则叶技能已随包提供。 |
| [design-red-flags.md](design-red-flags.md) | 浅模块、信息泄漏、时间分层、透传、分裂归属、双入口、内部导入和手工清单。按证据与约束判断。 |
| [arena](../../arena/SKILL.md) | 相同问题、独立产物、选基础方案、吸收有用部分、记录失败与核验。六阶段及其原则依赖已在包内。 |

移除 Cursor 模型规则、固定模型、自动模型回退和强制多模型依赖。复用实际宿主能力与已有选择，单主会话比较明确标为非独立探索。setup v2 不扩展。

how、why、arena、interrogate 与相关原则均随 architect.zip 提供并通过相对路径调用，不依赖外部 SKILL。缺少工具时保留有界结论，不宣称完成独立探索。未复制自动提交或允许临时破坏产品的默认行为；只做设计不自动实施，已授权实施不增加默认审批关口，用户要求的关口保留。

移除 disable-model-invocation，保留默认自动选择；conductor 按任务需要连接，不成为普通修改的强制门。

沿用 [MIT 许可](../LICENSE)。
