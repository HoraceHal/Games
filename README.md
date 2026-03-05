# 性能增强版（本地浏览量 + 骨架屏 + 分页 + 健壮性）
- 本地浏览量：点击卡片或进入详情，会对该 `id` 的 `localStorage` 计数 +1，并与 `games.json` 的 `views` 相加展示；不修改源数据。
- 骨架屏：加载数据时显示 9 张卡片骨架，加载后自动隐藏。
- 分页：每页 12/24/48 可切换；分页按钮 Prev/Next；保存在 localStorage。
- 健壮性：容错解析 `games.json`（去注释/尾逗号）；图片错误自动替换为占位图。
- 流畅度：CSS `content-visibility:auto`、`will-change:transform`、轻量 hover 动效、稳定排序、搜索防抖。
