---
name: figure-it-out
description: "复杂迁移、多部分变更或没有更窄流程可用时，先设计按风险缩放的阶段流程，再用假设、实证和决策轨迹推进。"
---

# 设计可审计的执行流程

首先建立待办，读取本次适用的包内 [rigor 原则](../rigor/references/principles.md)。先交付能被评审的流程，用阶段门和产物推进。

A. 定义可证伪的完成条件，量化单元与粗略工作量，核对阻塞。按单向决策与影响范围提高证明强度，可逆小步骤简化。先说明长任务的范围与取舍，保留用户指定关口；既有持续授权内可自主推进。

B. 分成可独立验证的单元，最不确定风险先做，捕获改动前基线，先建立必要验证和结构。非机械结构决策使用 [architect](../architect/SKILL.md)，已定方案不重复举办比较。并行只跨清晰边界，写者各有隔离位置，按 [状态归属](../principle-separate-before-serializing-shared-state/SKILL.md) 执行。把阶段和每步验证写成具体待办。

C. 每个单元写假设、做最小改变、核验真实产物。推进完成条件的保留，没有收益的仅撤回本轮拥有的改动。使用 [逐单元验证](../principle-sequence-verifiable-units/SKILL.md)；委派结果由协调者核对，检查被迎合则收紧契约，检查本身错了先独立修检查。结果记 VERIFIED、NOT VERIFIED 或 INCONCLUSIVE，后两者不是通过。

D. 全程用 [show-me-your-work](../show-me-your-work/SKILL.md) 记录决定，不在最后补造历史。只有已有提交授权才提交轨迹。

E. 最后对真实产品重新核对最初完成条件，检查组合后的整体行为；重复纠正优先编码成结构。交付阶段设计、强度理由、轨迹路径、已证明与未完成范围。持续唤醒只用实际存在的宿主能力，不用一次执行冒充长期流程。

来源与适配见 [说明](references/sources.md)，保留 [MIT 许可](LICENSE)。
