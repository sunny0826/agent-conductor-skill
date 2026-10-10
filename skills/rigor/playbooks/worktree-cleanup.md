# 核实归属后清理空间

先只读记录磁盘、git worktree list --porcelain、真实路径、大小、时间、dirty／untracked、分支／PR 状态与活动归属；不手打猜路径、不扫描推算的私人聊天目录。来源未更新标 stale，工具标 safe 只是建议。

对每个候选核实用户保留／pin、活动会话、子工作、未提交与未跟踪／忽略文件，无名字出现在 UI 也不代表无人使用。不可恢复内容或归属不清先保留并说明；删除需要用户具体授权，scratch／缓存名称不是授权。

仅对已确认无人使用且授权删除的路径操作，优先 git worktree remove，不强制 rm -rf 未知残留；ignored 构建残留也要核归属。branch refs／远端状态实际确认，结束重列 worktree、磁盘并记录实际收益。

模拟器、runtime、DerivedData、包缓存等单独核当前工具与使用状态；不执行默认 delete all，不自动 sudo。交付前后空间、实际清理路径、保留项和理由，缺权限／证据时交可评审候选表，不称已回收。
