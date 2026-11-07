<!-- 生成自 docs/usage.md「命令参考」节（scripts/gen-skill-refs.mjs）——不要手改；改 usage.md 后运行 npm run skill:refs -->

## 命令参考

usage 行即源码原文；缺必填参数时 CLI 打印同一行并退出 2。

### init

```
usage: init <git-url|本地路径> [--name <slug>] [--home <dir>]
```

注册项目：把源仓克隆为 `<home>/projects/<slug>/repo.git`（bare）。源可以是本地路径或 git URL（`https://`、`git@`、`ssh://`、`file://`）；本地源必须是已有 git 仓库。`--name` 缺省取路径/URL 尾段去 `.git`。

- 输出 `project:` / `repo:` / `base:` 三行；base 是本次交付的起点 commit。
- 源仓未提交变更会列警告清单（默认不参与交付）。
- 基座仓自动写提交身份 `dsh-orchestra <orchestra@local>`，不依赖你的全局 git 配置。
- init 之后基座仓会在**每次 run 启动前自动从源同步**（`git fetch origin`，本地路径源零成本；URL 源失败诚实报错）——基线永远是源仓库当前状态，本地新提交/新分支无需手动 push 进基座仓。
- 不 `init` 也能直接 `run --source <本地路径>` 隐式注册（URL 源必须先 `init`）。

### projects

```
usage: projects [--home <dir>]
```

只读，列全部已注册项目，每项目一行，按最近活跃排序（最新 run id 降序；无 run 的排最后按 slug）：

```
demo    /home/user/proj            12 runs  latest rmtmgg0ou1kyp delivered
webapp  git@github.com:acme/w.git   3 runs  latest rmtxxxx1234 awaiting-confirm
old     /home/user/legacy           0 runs  —
```

- slug 来自 `<home>/projects/` 目录名；source = 镜像仓 `repo.git` 的 origin remote（init 时记录的本地路径或 git URL；empty 入口项目无 origin 显示 `—`，remote 不可读显示「未知」，不猜）；
- runs = `events/*.jsonl` 计数；latest = 最新 run 的 fold 状态（与 `status` 同一推导路径），无 run 显示 `—`。
- 用途：跨项目概览与 slug 找回的 CLI 读口（web 侧栏「进行中」组的对偶）——跨会话恢复时按 source 匹配工作目录即可定位项目。

### presets install

```
usage: presets install [--home <dir>] [--presets <src-dir>]
```

把随包 `presets/` 8 个模板整目录复制到 `<home>/presets/`（先清空旧副本，幂等），并写 dsh 运行资产：

- `<home>/dsh/settings.yaml`：冒烟档模型选择（凭据仍在 `~/.dsh` 原位）；
- `<home>/dsh/model.patch.yml`：把 dsh settings 文档指向 orchestra 自有副本的 patch；
- 顺带装配 orchestra-node profile 到 `$DSH_HOME/profiles/orchestra-node`（pnpm link 到随包插件，最多 180s）；失败仅警告，保持黑盒模式。

`--presets <src-dir>` 在这里是**安装源**目录覆盖（默认随包 `presets/`）。输出 `installed:` / `presets:` / `model patch:` / `node profile:` 四行。

### run

```
usage: run --project <slug> --task <text> [--source <path>] [--graph <name|path>] [--base <ref>] [--budget <tokens>] [--fake] [--inject <node>=<mode>[,...]] [--node-model <node>=<model>[,...]] [--node-effort <node>=<off|high|max>[,...]] [--node-budget <node>=<tokens>[,...]] [--node-time <node>=<seconds>[,...]] [--jobs N] [--no-plugin] [--home <dir>] [--presets <dir>]
```

| 选项 | 说明 |
|---|---|
| `--project` / `--task` | 必填。task 是任务原文，会作为节点任务文本送达各节点。 |
| `--source` | 项目不存在时的隐式注册源（仅本地路径）。 |
| `--graph` | 图选择（见下）。缺省 = 内置 `compose` 两段式。 |
| `--base` | 起点分支 / commit（rev-parse 可解析即可，含内部 `run/<id>/mainline`——叠加交付链）。**缺省 = main（ADR-015 显式缺省，不是隐形协议）**：解析结果随启动行 `base: <ref>@<sha10>` 打印，镜像无 main（源仓无 main / 仓库为空）且未显式指定时诚实拒绝。**每次 run 启动前先从源同步镜像**——本地路径源写你本地当前分支名即可拿到最新 tip；基线 commit 钉进 `run_started` 事件，resume/confirm 不受后续分支移动影响。 |
| `--budget` | 正整数 token 数。**只是 composer 决策的输入事实，运行时不执法**——真正的墙钟/token 上限在每个 preset 的 `budget:` 段。 |
| `--node-model` | **节点级模型覆盖（ADR-016 修订二）**：`<节点>=<provider>/<型号>[,...]`，直选具体型号，值域 = **dsh 环境聚合目录**（与 dsh web 模型列表同源：deepseek-official + 你 settings 里配置的 llm-pi-ai providers 等），如 `zai-coding-cn/glm-4.7`。未覆盖节点走「节点默认型号（preset `model:` 声明）或全局缺省档（flash）」；spawn 时生成实例 settings 文档（**你 dsh settings 的其余段全量透传**——llm-pi-ai 等插件配置随之生效）+ patch。型号选择自由，**唯一约束 = 能力拦截（ADR-016 修订四）**：preset 声明 `model_requires: [vision]` 的节点（如 ux-eval），有效型号（覆盖 ?? 节点默认 ?? 全局缺省）在目录内可解析且**无 image 输入声明**时发起即拒（dsh 运行时本就拒图，拦截只是把它提前到发起时刻）；型号不在目录内 = 无声明事实，放行并提示。想让某 vision 型号可选且被正确判定，在 dsh settings 里为它声明 `inputModalities`/`input`（dsh web 设置面同款）。**要求显式 `--graph`**；节点名须在图中、未知型号诚实拒绝。覆盖记入 `run_started`，resume/confirm 从日志回放。 |
| `--node-effort` | **节点级思考深度覆盖（ADR-016 修订）**：`<节点>=<off\|high\|max>[,...]`（dsh reasoningEffort 词汇，缺省 high）。约束同 `--node-model`。 |
| `--node-budget` | **节点级 token 上限覆盖（ADR-016）**：`<节点>=<正整数>[,...]`，替换该节点 `budget.max_tokens` 进入预算执法（软线 80% 收尾注入 / 硬限 cancel，机制不变）；max_attempts 不覆盖。约束同 `--node-model`（显式 `--graph`、节点名在图中）。 |
| `--node-time` | **节点级墙钟时限覆盖（ADR-016 修订三）**：`<节点>=<正整数秒>[,...]`，替换该节点 `budget.wall_clock_s`（到点 SIGTERM→宽限→SIGKILL 序列不变）。任务难时单独放宽某节点时限用，如 `dev=3600`。约束同 `--node-model`（显式 `--graph`、节点名在图中）；覆盖记入 `run_started`，resume/confirm 从日志回放。 |
| `--fake` | 桩执行（离线、不耗 token）。run 级身份：记入 `run_started` 事件，后续 `resume`/`confirm` 缺省跟随（见下）。 |
| `--inject` | 故障注入，必须伴随 `--fake`，见[高级](#高级故障注入-inject)。 |
| `--jobs` | 并发槽位。缺省 = `max(1, min(8, 总内存/2/300MB, CPU数-1))`。 |
| `--no-plugin` | 强制黑盒模式（不用节点代理插件）。 |
| `--presets` | preset 注册表目录（默认 `<home>/presets`）。 |

`--graph` 解析语义：**参数值是存在的文件路径就按路径加载，否则按图名解析（注册处 `<home>/graphs/` → 内置图，同一套语义）**——裸名取最高版本（`dev-flow`）、`@1.x` 区间内最高（`dev-flow@1.x`）、`@1.0.0` 精确。注册图与内置图走同一条加载与静态验证路径；同名同时出现在两处会以解析歧义如实报错（不静默择一）。自定义图用 `graphs register` 命名注册后即可按名引用。

结束时打印终态与 `mainline`、`run` id；`delivered` 退出 0，`failed` 退出 1，门禁暂停（`awaiting-confirm`）退出 0。

### resume

```
usage: resume --project <slug> --run <id> [--graph <name|path>] [--fake] [--jobs N] [--home <dir>] [--presets <dir>]
```

续跑未终态的 run（中断、崩溃、断电后）。图回查优先级：显式 `--graph` > 采纳图制品（compose 两段式冻结的现场图，从 run 登记树重载）> 日志里的 graph id 回查注册处/内置（已注册的自定义图免重传；未注册的临时路径图会要求重传 `--graph` 或先 `graphs register`）。

执行身份缺省跟随：`--fake` 启动的 run，resume 不带 `--fake` 也以桩续跑（会打一行「fake 身份跟随」提示，此态下 `--inject` 合法）；真跑 run 同理按真跑续跑。旧版本启动的 run（`run_started` 未记录身份）按真跑处理并提示——若原为 `--fake` run 请显式传 `--fake`。

中断时还在跑的实例（孤儿 attempt）统一按 crash 收敛——有 crash 重试额度的节点自动重试，无额度的按诚实地板判死。对已终态 run 幂等：直接返回既有终态。

### confirm

```
usage: confirm --project <slug> --run <id> [--abort] [--graph <name|path>] [--fake] [--jobs N] [--home <dir>] [--presets <dir>]
```

人工门禁的处置：

- 不带 `--abort`：放行并续跑（与 `resume` 同一条续跑路径——刻意动作即确认；执行身份同样缺省跟随 `run_started` 记录，`--fake` run 忘带旗标不会再以真节点收尾）。
- `--abort`：显式放弃，run 终态 `aborted`（主动放弃 ≠ 失败），退出码 0；下游节点不再执行。

对已终态 run 幂等。

### stop

```
usage: stop --project <slug> --run <id> [--home <dir>]
```

运行中 run 的停止入口——Ctrl+C 语义的命令化（design §6.12）：**生命周期信号转发，非写者**（不取写者锁、不改图与参数）。web 发起的 run 无终端可 Ctrl+C，stop 是运行中任务的合法中断入口。

- 读锁探活：supervisor 活着 → 发 SIGINT 优雅关闭（终止在跑进程组）→ 等退出后如实报告。run **驻留非终态**：后续 `resume` 续跑，或 `confirm --abort` 放弃（对非门禁的非终态 run 同样合法）。
- 无 supervisor：已终态幂等返回既有终态；崩溃遗留（锁残留 pid 已亡）诚实报告状态与下一步。
- 30 秒内未退出 → 提示稍后重试 `stop` 或手工处置（`kill <pid>`），退出码 1。

### status

```
usage: status --project <slug> [--run <id>] [--home <dir>]
```

不带 `--run`：列项目全部 run（新在前），行格式：

```
<run-id>  <图>  <状态>  <完成>/<总数> inst  [⏸门禁待确认][⚠N 在跑未收敛]  「任务截断24字」
```

带 `--run`：逐实例 `phase (attempt N) [分支] ⚡用量`，run 级 token 合计、路由记录（`routed …`）、门禁（`gate …`）、`terminal:` 与 `mainline:`。例：

```
run rmtmgg0ou1kyp graph single@1.0.0 — delivered
  compose-1: succeeded (attempt 1) [run/rmtmgg0ou1kyp/compose-1]
  deliver-1: succeeded (attempt 1) [run/rmtmgg0ou1kyp/deliver-1]
terminal: delivered — 图 single@1.0.0 全部 1 个节点成功交付
mainline: refs/heads/run/rmtmgg0ou1kyp/mainline@ba16ec0f8b…
```

### report

```
usage: report --project <slug> --run <id> [--home <dir>]
```

交付报告 / 失败归因的可读文案（纯读侧，不改任何状态）：头部（任务、图、状态、总时长、图采纳、**路由决策**——composer 决策记录的选中形态、三维理由、否决项，从 run 登记树制品读出）、节点时间线（每次尝试的 ✓交付 / ✗失败类别 / 制品清单）、制品树与逐件溯源、token 成本、路由记录、失败归因（composer 选中单节点图后诚实失败时附**重跑建议**：以显式图 `--graph code-loop` 重跑是误路由唯一补救）；未终态时提示可 `resume`。

### fetch

```
usage: fetch --project <slug> --into <本地仓库路径> [--run <id>] [--home <dir>]
```

**物化**（ADR-015）：把 run 的 mainline 写成你工作副本的**同名分支** `run/<id>/mainline`——只写运行时命名空间，你的当前分支与工作区零触碰；分支起点即 run 基线，分叉结构上不可能。同名分支已被你移动/改写时诚实拒绝不覆盖（重置：`git branch -f run/<id>/mainline <sha>`）。`--run` 缺省取最新 delivered run；只认 delivered（未交付的没有可集成的 mainline）。集成决策（合到哪、怎么合）完全归你——`merge` / `pr` 出口，或自行 git。**web 端 delivered run 页「同步到本地」按钮即此命令**（目标推导：本地源项目零输入直达源仓库；远程源界面填一次并按项目记忆）。

### merge

```
usage: merge --project <slug> --into <本地仓库路径> [--run <id>] [--branch main] [--home <dir>]
```

**本地集成出口**：物化 + 按你工作副本**有无 `origin` 分流**（ADR-018）：

- **无 `origin`（纯本地仓库）**：合入**目标分支（缺省 main，`--branch` 可选）**——缺省与 run 的 base 缺省同源对偶（run 从 main 起跑 → 交付合回 main），不借道你当前所在的分支；目标非当前检出分支时先 `git checkout <目标>`（检出成功后驻留目标分支），再 `git merge --no-ff`——合并提交即集成线（可整体 `git revert -m 1`）。目标分支不存在时诚实报错。纯本地只有一个 main，合入 main 本身就是集成的完成。
- **有 `origin`（维护远程、走 PR 工作流）**：方向反转——检出 `run/<id>/mainline`，把**本地 main 合进 run 分支**（合并提交 `orchestra: merge main into run <id>`，零网络），测试集成在 run 分支上进行；**本地 main 不再被此命令写入**——它从此只由「远程 PR 合入 + `git pull --ff-only`」更新（本地与远程两个 main 都可写 = 同一份内容合并两次、SHA 必不相同，分叉是结构性必然）。收尾提示：测试通过后走 `pr` 出口推送开 PR；本地 main 落后 `origin/main` 时提示先 `git pull --ff-only` 再集成。`main` 分支不存在时跳过合入步不挡路（run 分支即最新状态）。
- **逃逸口**：有 `origin` 时显式 `--branch` 尊重你的指令走上一条旧形态，但输出警示——此路径会产生不同 SHA 的双合并、本地 main 与 origin/main 分叉，对齐命令 = `git fetch origin && git reset --hard origin/main`（注意先处理未提交改动）。

两形态共同口径：检出被本地未提交变更挡路 = 诚实停摆给指引（退出码 1）；幂等（已在历史内 = 已是最新，退出 0）；冲突 = `merge --abort` 回滚 + 手工指引诚实停摆（不代决）。**web 端按钮随分流**：无 origin 形态为「合并进 main」钮（旁 `▾` 展开分支清单可改目标）；有 origin 形态为「检出测试分支」单钮（动作恒定：检出 run 分支并把 main 合进来，main 不会被写入——无可选项，动作详情在悬停与反馈条里，测试通过后推送并开 PR）。

### pr

```
usage: pr --project <slug> [--into <本地仓库路径>] [--run <id>] [--base main] [--gh <path>] [--home <dir>]
```

**托管集成出口，按项目源形态分流（ADR-022）**：

- **URL 源项目（镜像 origin 即托管仓）——镜像直推，免 `--into`**：`git push origin run/<id>/mainline` 直接从镜像仓发起（分支落托管仓即物化；`fetch` 同步到本地降为可选出口），随后 `gh pr create --repo <owner/name> --base <main> --head run/<id>/mainline`。显式传 `--into` 会被拒绝（该形态不需要也不接受副本）。
- **本地路径源项目——现形态**：物化 + 从 `--into` 副本 `git push origin` + 副本内 `gh pr create`。

推远程只发生在此显式命令内（「明示才推」）。两形态共同护栏：`gh` 前置检查**先于推送**（缺 gh 不推、不开 PR，避免悬置分支）；无 origin / 推送失败 / 建 PR 失败（如同 head 的 PR 已存在、凭据/网络）/ URL 源镜像 origin 非 GitHub 形态（自建 GitLab、file:// 等）= 诚实报错并给出等价手工命令，退出码 1。推送前刷新对基线的视角（副本形态 = fetch origin；直推形态 = 源同步镜像），run 基线落后 `<base>` 时给警示不阻断（冲突在 PR 层消化）。`--base` 缺省 main；`--gh` 覆盖 gh 可执行路径（或环境变量 `DSH_ORCHESTRA_GH`）。**web 端「推送并开 PR」按钮即此命令**（URL 源项目免路径直达；gh 可执行继承运行 `web` 的环境）。

与 merge 出口的分流（ADR-018）配套：有 origin 仓库的推荐闭环 = `merge`（测试集成在 run 分支）→ `pr`（推送并开 PR）→ GitHub 合入后 `git pull --ff-only` 更新本地 main——全程无分叉。

### gc

```
usage: gc --project <slug> [--dry-run] [--cache-limit <MiB>] [--home <dir>]
```

四层回收，逐项打印「将回收 / 保留（原因）」：

1. **worktree**：终态 run 的执行 worktree；
2. **ref**：成功 run 长期保留 `mainline` 与 `artifacts`（交付历史/证据），回收实例分支；失败/aborted run 的 ref 全量保留最近 5 个；
3. **缓存**：`<home>/caches/` LRU，默认限额 10 GiB（`--cache-limit` 单位 MiB）；
4. **镜像**：docker 镜像中只回收带 `org.dsh-orchestra.run` label 的（deploy 节点的构建产物按此契约登记）。

`--dry-run` 只报不动；实清后跑 `git gc --prune=now` 压实对象库。

### graphs

```
usage: graphs list [--home <dir>]
usage: graphs register <file.yml> [--home <dir>] [--presets <dir>]
usage: graphs save --project <slug> --run <id> [--home <dir>] [--presets <dir>]
```

图注册处 `<home>/graphs/` 的清单读口与写入口（删除 = 删文件）：

- `list`：只读，列注册图与内置图（**并列枚举**，同名多目录都列出、来源标签区分——与解析的「不遮蔽」纪律一致），每行 `name@version  来源  N 节点  [⏸门禁]  description`。节点数/门禁/description 从图文件 YAML 元数据读取（description 缺席则空；YAML 解析失败的行如实标注，合法性归 loader 单点裁决——list 不做静态验证）。
- `register`：把本地图文件注册为命名资产——过与运行时完全相同的静态验证 → 内置名保留（`compose`/`dev-flow` 等 name 级保留字，不论版本都拒）→ 同 id 拒重名（同内容重复注册幂等跳过；异内容拒绝，提示改版本或先删文件）→ 原样字节写入 `<home>/graphs/<名>@<版本>.yml`。注册后 `--graph <名>` 按名引用、resume/confirm 自动回查、web 图库可预览与一键发起。
- `save`：把 compose 两段式 run 采纳的图制品沉淀为命名资产（composer 现场构图的可复用化）——从 run 登记树读图制品，同样过验证与重名执法；幂等同 register。非 composer 路径或尚未采纳的 run 如实拒绝。web run 详情的「沉淀入图库」按钮即此命令。

### models

```
usage: models [--home <dir>]
```

只读，列 **dsh 环境聚合模型目录**（`--node-model` 的值域，与 dsh web 模型列表同源：deepseek-official 官方目录 + 你 settings 配置的 llm-pi-ai providers 等）。按 provider 分组，每行 `<provider>/<型号>` 复合 id（即 `--node-model` 取值形态），标注全局缺省档与 vision（image 输入声明）：

```
deepseek-official
  deepseek-official/deepseek-v4-flash   （全局缺省档）
  deepseek-official/deepseek-v4-pro
zai-coding-cn
  zai-coding-cn/glm-4.7
  zai-coding-cn/glm-4.7v                · vision
```

- 模型目录聚合自 orchestra-node profile patch（`~/.dsh/profiles/orchestra-node/cordis.patch.yml` 的 `llm-pi-ai`/`llm-deepseek` entry）+ dsh 包内 pi-ai 内置数据（ADR-025：dsh ≥0.2 配置 per-profile，无全局 settings.yaml——在 dsh web 里配的第三方模型属于 web profile，orchestra 读不到，`doctor` 会检测并指路）。
- 全局缺省档取同一 patch 的 `agent-default-model` entry（坏形/缺席回落冒烟档 `deepseek-official/deepseek-v4-flash`）——未被覆盖且无节点默认型号的节点用它。
- 能力 = 声明（ADR-016 修订四）：`· vision` 仅在 patch/目录数据显式声明 image 输入时标注；未声明一律按 text 对待。
- 想让某 vision 型号可选且被正确判定，在 profile patch 里为它声明 `inputModalities`/`input`（dsh web 设置面同款字段）。

### doctor

```
usage: doctor [--verify] [--fix] [--home <dir>]
```

dsh 集成面体检（ADR-025）：dsh 定位与版本窗口（≥0.2）、orchestra-node profile patch 与全局缺省档、模型目录聚合结果、配置矛盾清单（0.1.x 残留 settings / 第三方配置落在其他 profile）、凭据文件原位、pi-ai 数据源。发现红项退出码 1。

- `--verify`：追加换档 patch 生效核验（跑一次 `dsh --dump-config` 文本级比对注入值，秒级、零 token）。
- `--fix`：**配置同步**（ADR-025 修订）——把其他 profile（dsh web 为主阵地）的 llm-pi-ai 配置自动镜像进 orchestra-node patch：provider 字典合并（源覆盖同名、orchestra 特有保留、源删不跟删）、全局档只补缺不覆盖。`presets install` 也会自动做同一同步；在 dsh web 里改过模型配置后跑一次 `doctor --fix` 即可跟上。

### web

```
usage: web [--port <n>] [--home <dir>] [--presets <dir>]
```

起本机 web 界面（见[Web 界面](#web-界面)）：默认端口 8787，仅绑定 `127.0.0.1`。读侧从事件日志 fold（与 status/report 同源；交付报告、制品内容、分支清单为只读端点），节点会话视图另只读 `$DSH_HOME/sessions`（缺省 `~/.dsh`，只读不写）；发起 / 门禁 / resume / 同步到本地（fetch）动作 spawn CLI 子进程——CLI 是唯一写路径。Ctrl-C 优雅关闭——在跑 run 不受影响，重启 web 后可继续查看或 resume。
