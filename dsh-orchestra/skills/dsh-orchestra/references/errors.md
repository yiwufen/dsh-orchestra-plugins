<!-- 生成自 docs/usage.md「故障排查」节（scripts/gen-skill-refs.mjs）——不要手改；改 usage.md 后运行 npm run skill:refs -->

## 故障排查

所有运行时异常统一输出 `error: <原因>` 并退出 1。常见类别：

| 报错 | 含义与处置 |
|---|---|
| `dsh <版本> < 0.2：orchestra 仅支持 dsh ≥0.2…` | dsh 版本窗口拒载（ADR-025）——升级 dsh（`npm install -g @deepseek-ai/dsh@latest`）或降级 dsh-orchestra |
| `检测到 llm-pi-ai 配置在别处…` / `检测到 dsh 0.1.x 时代的 ~/.dsh/settings.yaml` | dsh ≥0.2 配置 per-profile：跑 `presets install` 或 `doctor --fix` 自动把 dsh web 等处的模型配置镜像进 orchestra-node patch（`doctor` 可复检） |
| `preset '<id>' missing node.patch.yml at …; run 'presets install' first` | 真跑前先 `presets install` |
| `preset '<id>' not installed (looked in <dir>)` | 图引用的 preset 不在注册表；`presets install` 或 `--presets` 指向正确目录 |
| `graph <名>@<版本> rejected (N errors): …` | 图静态验证失败，错误全量列出（节点/边定位）：类型流缺口（`type break — …`）、环（`cycle in edges …`）、路由缺 `max`、preset 版本未命中等；按清单修图 |
| `environment requires 'dsh' not found on PATH` | 真跑需要 dsh；或加 `--fake` 离线跑 |
| `environment daemons '<exe>' not alive ('<exe> info' failed) — 启动守护进程后重试` | 图声明的守护进程未运行 |
| `project '<slug>' not initialized at …; pass --source <git-url\|path> or run init first` | 先 `init`（或 run 带 `--source`） |
| `no event log for run '<id>' at <path>` | run id 不属于该项目（`status --project <slug>` 查全部 run id） |
| `run '<id>' used graph '…' which is neither registered nor builtin; …` | resume/confirm 找不到 run 用的自定义图——重传 `--graph`，或先 `graphs register` 注册（之后按 id 自动回查） |
| `project '<slug>' 没有 delivered run——无可拉取的 mainline` | fetch/merge/pr 只认 delivered run |
| `本地分支 run/<id>/mainline 已存在且 tip 不一致…不覆盖` | 你移动过该物化分支——确认废弃可 `git branch -f run/<id>/mainline <sha>` 重置后重试 |
| `镜像中解析不到 main…传 --base <ref> 显式指定起点` | 源仓无 main 分支（或空仓）而 `--base` 未显式指定（ADR-015 缺省 = main 不静默回退） |
| `目标分支 <branch> 在 … 不存在` | merge 的 `--branch` 写了不存在的分支——指定已有分支或先 `git branch <branch> <起点>` |
| `无法切换到 <branch>（本地未提交变更挡路）` | merge 要切到目标分支但工作区不干净——先提交或 stash，再重试或手工 `git checkout <branch> && git merge run/<id>/mainline` |
| `合并没有完成（<target> 与 run/<id>/mainline 冲突）——运行时不代决` | 在 `--into` 里手工 `git merge run/<id>/mainline`，就地解冲突提交 |
| `gh 不可用（不在 PATH…）——不推送、不开 PR` | 装 gh 或用输出里的手工等价命令（`git push` + `gh pr create`）；也可 `--gh <path>` 指定可执行 |
| `节点 '<node>' 第 N 次尝试失败（<kind>）… 按诚实地板判 run 终态失败` | 重试耗尽且图未声明升级路由——不静默降级；看 `report` 的失败归因，修任务或图后重跑 |
| `--inject requires --fake` / `--budget 须为正整数 token 数…` / `bad --inject spec …` | 参数错误，见 usage 行 |
| `--node-model/--node-effort/--node-budget/--node-time 需要显式 --graph…` | 节点级覆盖仅显式选图可用——缺省路径由 composer 现场构图，节点在发起时未定（ADR-016） |
| `未知模型 '<模型>'` / `未知思考深度 '<深度>'` | 模型值域 = `<provider>/<型号>`（dsh 环境聚合目录）；深度 = off/high/max，检查拼写 |
| `节点 '<node>' 声明的默认型号 '…' 不在模型清单…重跑 presets install` | 旧 home 的 preset 未刷新——重跑 `presets install` |
| `节点覆盖引用了图中不存在的节点 '<node>'` | 覆盖键 = 图内节点名，检查拼写（发起表单经图示点击选择不会触发） |
| `git <args> failed (exit N): …` | git 调用失败，附 stderr 尾部；多为源仓状态问题 |
