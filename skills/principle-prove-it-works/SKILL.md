---
name: principle-prove-it-works
description: "完成前核验真实产物与行为，不能以摘要、编译或时间戳替代效果证明。"
---

# 完成前核验真实产物与行为，不能以摘要、编译或时间戳替代效果证明。

以下保留上游原则原文；只在当前任务与授权范围内应用，不因此扩大重构、修改用户状态或自动提交。固定文件数属于阅读成本启发式，不是验收硬门槛。

# Prove It Works

Verify every task output by checking the real thing directly. Do not infer from proxies, self-reports, or "it compiles."

**Why:** Unverified work has unknown correctness. Indirect verification (file mtimes, output freshness, agent self-reports, cached screenshots) feels cheaper than direct observation. Acting on a wrong inference costs far more than checking the source.

Check the real thing, not a proxy:
- Check process liveness directly, not indirectly through derived state
- Read the actual value, not a cached or derived representation
- When verification fails, suspect the observation method before suspecting the system

## Script the check when you can

The strongest proof is a deterministic script that re-runs the same comparison, not a one-time eyeball. Write the script, run it, and keep its output as an artifact a reviewer can re-run instead of trusting your word.

Keep the artifact visible for the human. Commit it only for large or complex work where the trail has to be auditable later, like a big port or migration (the **show-me-your-work** skill).

需要决策轨迹时使用包内 [show-me-your-work](../show-me-your-work/SKILL.md)。提交仍须已有授权。

来源见 [说明](references/sources.md)。
