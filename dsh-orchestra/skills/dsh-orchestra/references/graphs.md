<!-- 生成自 docs/usage.md「内置图 + 内置 preset 一览」节（scripts/gen-skill-refs.mjs）——不要手改；改 usage.md 后运行 npm run skill:refs -->

## 内置图

| 名字 | 版本 | 形态 |
|---|---|---|
| `compose` | 1.0.0 | [机制图] 默认路径第一跳：composer 做结构粒度经济决策——不选图时自动走它，无需手动选择 |
| `code-loop` | 1.0.0 | **旗舰**·通用代码交付环：需求 → 实现 ⇄ 独立验证红回环；惰性补丁交付，fetch/merge 即人审点（ADR-024） |
| `dev-flow` | 1.3.0 | [重型] 完整流水线：需求 → 架构 → 并行编码（fanout）→ 独立验证 → 部署 + 门禁 + 冲突路由——适合大型可分解、需接口先行冻结的任务；常规交付用 code-loop 更经济 |
| `ux-loop` | 1.0.0 | 视觉迭代环：页面改进 ⇄ 模拟用户体验（视觉验收）红回环 + `.dsh/skills/` 经验沉淀 |

### code-loop@1.0.0 细读（旗舰）

```
requirement(req-analyst) → dev(implementer) ⇄ verify(tester)
                              ↑ verdict:red 反馈环(max 3，证据回带 test-report)
```

- **交付环**（ADR-024，M31 实测 gate 通过）：一次轻规格翻译（requirement 产 spec 作为验证判据锚定物）+ 实现 ⇄ 独立验证的红回环——每轮验证即一次计划修正机会，不要求前置完美计划；
- **红回环**：verify 交付 red 时，test-report 证据回带 dev 重修，最多 3 轮；
- **无门禁**：无外部不可逆动作则无门禁位——人审点 = 集成出口（fetch 物化后 merge/pr，PR 形态人审 diff 为闸门）；
- **retry**：dev/verify 各 crash 1 次。

### dev-flow@1.3.0 细读

```
requirement(req-analyst) → architecture(arch) → coding(coder, fanout=工作包数) → testing(tester) → deploy(deployer)
                                                    ↑ verdict:red 反馈环(max 2) | conflict → resolve(conflict-resolver)
门禁：testing->deploy on manual-confirm
```

- **fanout**：`coding` 按 `architecture` 产出的 `work_packages` 清单展开为并行轨（每轨独立实例、独立分支，合并由流水线负责）；
- **verdict 反馈环**：`testing` 交付 red 时，test-report 证据回带 `coding` 全轨修复，最多 2 轮；
- **conflict 路由**：fan-in 试合并冲突时现场直送 `resolve` 节点解决；
- **人工门禁**：部署前暂停等 `confirm`；
- **retry**：`coding` 2 次（crash/contract），其余节点 crash 1 次。

### ux-loop@1.0.0 细读（视觉迭代环）

```
dev(ux-dev) → ux(ux-eval)
   ↑ verdict:red 反馈环(max 3) · with 回带 screenshot + ux-report
```

- **形态** = 终端验证者 + verdict 红回路由（v1 dev-flow@1.0 原始骨架换预言机）；无人工门禁——交付是惰性补丁分支，`fetch` 时人审页面 diff 与技能 diff；
- **ux-eval**：vision 模型档 + mcp-playwright（浏览器截图看图，模拟用户操作验收）；报告 `ux-report.json` 出 green/red，截图集伴随（`.dsh-outputs/screenshots/` 目录，多张按视图语义命名，至少一张）；服务起不来等 blocked = 非零退出 + stderr 死因（不冒充 red）；
- **经验沉淀**：项目仓库 `.dsh/skills/` 下的技能文件（dsh 原生项目级技能发现，每个节点会话开工自动广告）——ux-eval 是唯一执笔者，沉淀 = **归纳维护**：把实测中可复用的知识融入现有技能（合并去重、按读者的任务组织，不追加「本轮实测」式轮次日志）、失效当场修正、**没有可写的就零提交（稳态安静合法）**；fetch 合入后下个 run 的所有节点自动携带；
- 首条技能建议手写 bootstrap（如「如何构建并启动本项目页面」），之后由环维护。

## 内置 preset 一览

| preset | 版本 | 角色 | 消耗 → 产出 | 预算（墙钟 / token） |
|---|---|---|---|---|
| `req-analyst` | 1.1.0 | 需求分析师：通读工作区产需求规格（验收标准 = 逐条可机检清单，ADR-024） | — → `spec`（file） | 900s / 600k |
| `implementer` | 1.0.0 | 交付工程师：交付环实现节点（ADR-024），按规格实现，git 提交交付 + test-report 伴随，红回环按报告修复 | `spec` → `patch`（git）+ test-report | 1800s / 1.2M，2 attempts |
| `arch` | 1.1.0 | 架构师：冻结共享接口 + 工作包分解（并行分工唯一依据） | `spec` → `arch`（file） | 900s / 600k |
| `coder` | 2.1.0 | 编码工程师：按规格实现，git 提交交付，伴随内环测试报告 | `spec`,`arch` → `patch`（git）+ test-report | 1800s / 1.2M，2 attempts |
| `tester` | 1.1.0 | 测试工程师：独立验证，按 spec 验收清单逐条对验，green/red 结论（red 是路由事实不是失败） | `spec`,`patch` → `test-report` + `verify-code`（file，验证代码随制品收集——人审可复核） | 1200s / 800k |
| `conflict-resolver` | 1.0.0 | 冲突解决者：在冲突现场解决合并并提交剩余分支 | `patch` → `patch`（git） | 1800s / 1M |
| `deployer` | 1.0.0 | 部署工程师：构建打包 + 部署记录，test-report 非 green 拒部署 | `patch`,`test-report` → `deploy-record`（file） | 1800s / 1M |
| `composer` | 1.0.0 | 组合节点：结构粒度经济决策，产图 + 决策记录 | — → `graph`,`routing-decision`（file） | 1800s / 1M |
| `generalist` | 1.0.0 | 通用交付工程师：单节点图一杆到底 | — → `patch`（git） | 1800s / 1.2M |
| `ux-dev` | 1.0.0 | 前端体验开发：按视觉验收报告改进页面 | — → `page`（git） | 1800s / 60M |
| `ux-eval` | 1.1.0 | 视觉体验验收（vision 档）：模拟用户操作看图验收 + `.dsh/skills/` 唯一执笔 | `page` → `page`（git 传递）+ `ux-report`,`screenshot`（目录集） | 1800s / 60M |

全部 preset `requires: [dsh]`（`--fake` 模式不消费该检查）。

token 预算口径（ADR-017）：**未命中输入 + 输出 + 缓存写 + 缓存读 × 0.1**——缓存读的边际成本远低于未命中输入，按 0.1 折算使预算贴近真实成本（全额计入曾使长上下文会话的名义用量远超真实消耗）。status/report/web 显示的用量总量同口径（分项中缓存读标注 ×0.1，仍为原始读数）；预算软着陆（80% 注入收尾 / 硬限取消）与显示用同一数字。
