# 技能部署与核对

本仓库是这些技能的唯一源：修改先进本仓库再部署到宿主安装位置，不在部署副本上单边改动，否则副本会与源分叉且改动无法追溯。

合并技能改动后更新部署副本并核对差异：

```bash
magpie library skill update <name>
mise exec -- node tools/check-deployment.mjs
mise exec -- node --test tools/*.test.mjs
```

`check-deployment.mjs` 默认核对 `~/.config/magpie/library/skills`；用 `--deploy-root` 或 `SKILL_DEPLOY_ROOT` 指定其他位置，`--skills` 可只查若干技能。magpie 提示副本被本地改动时，先确认差异确实来自本仓库，再用 `--replace-edits` 更新。不要手工覆盖单个文件，否则副本会与源分叉并使后续自动更新被拒绝。

2026-10-20 的实际事故：PR #11 同时改了 `agent-conductor` 与 `agent-conductor-setup`，合并后只同步了前者；后者停在 10-10 旧文本，magpie 因副本曾被单文件覆盖而拒绝自动更新。用 `--replace-edits` 恢复后 56/56 技能 0 差异。此后每次合并都跑一次核对，不只比较入口技能。
