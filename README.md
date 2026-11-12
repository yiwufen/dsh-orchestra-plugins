# dsh-orchestra plugins

dsh-orchestra 的 agent 插件市场。本仓库是**自动发布的产物仓**（源在私有主仓，每次 sync 提交为当前文件快照，不含源仓历史）——可随时删除重建，请勿在此提交。

## 安装

```bash
# Claude Code（.claude-plugin/marketplace.json；Codex desktop 兼容同一份）
/plugin marketplace add yiwufen/dsh-orchestra-plugins

# Codex CLI（.agents/plugins/marketplace.json）
codex plugin marketplace add yiwufen/dsh-orchestra-plugins
# 浏览器：codex /plugins → 选择市场 → 安装

# ZCode
# Plugin Marketplace → Add → 粘贴本仓库地址
```

前置：`dsh-orchestra` CLI ≥ 0.7.0（`npm i -g @lihangcz/dsh-orchestra`；skill 发车前会探测版本，未装/过旧会征得同意后安装或升级）；真跑还需 `dsh` ≥ 0.2 在 PATH、模型凭据在 `~/.dsh` 原位——环境拿不准跑 `dsh-orchestra doctor` 体检指路（配置在别处时 `doctor --fix` 自动镜像同步）。

## ▶ 60s 看懂它

https://github.com/user-attachments/assets/6705a631-da9d-452d-9694-ab2cca2d0dcd

片里就是这条链路：issue 交给 agent → 调本插件发车 → 流水线交付 → PR 回来等你审。

## 什么时候用

一句话法则：**值得开一个 PR 的变更，才值得走流水线**。适合：功能+测试 / 修复 / 重构 / 页面改进等要独立验证证据的交付；大型可分解任务要并行推进；规模不确定的任务（composer 现场决策结构粒度）；无人值守的过夜交付（run 10min–1h+，验证红自动回炉，崩溃可 resume）。不适合：分钟级微变更（就地直接改更快）、问答 / 调研 / 代码审阅（不产出代码变更，agent 直接做）、非 git 仓库或任务依赖未提交内容。

## 装完第一步

对 agent 说一句话即可（任一形态都会触发）：

> 「把这个任务端到端交付掉，要独立验证」／「交给交付流水线」／直接点名 dsh-orchestra

或使用插件自带的 `dsh-orchestra` 斜杠命令。agent 按手册走发车单（任务书、图推荐、节点模型、成本量级）经你确认才发车；门禁放行、合并 / 开 PR、装机升级等关键动作永远逐次等你拍板。

## 插件内容

**dsh-orchestra**（v0.2.1）——端到端交付运行时的 agent 操作手册 skill：把代码任务委托给多节点流水线（需求 → 架构 → 并行编码 → 独立验证 → 部署），产出经独立验证、可审阅可回退的 mainline 分支。**仅显式委托触发**（点名产品或明确委托语义）；agent 按手册走发车单确认、通知驱动监控、门禁与集成授权全流程。红线：永不代用户确认门禁、永不自动重跑、外发动作逐次征得同意。
