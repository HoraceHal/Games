
WebP 批量转换 + 自动替换 games.json 工具包
===========================================

你现在的现象：国内访问 GitHub Pages 时图片加载慢/延迟明显。
最有效的首访加速方式：把封面/截图从 JPG/PNG 转成 WebP（体积通常能减少 30%~70%）。

这个工具包做什么：
1) 批量把仓库 images/ 目录下的 .jpg/.jpeg/.png 转成 .webp。
2) 自动修改 games.json，把 cover/shots 里指向本地图片的路径替换为 .webp（网络图片不动）。

使用前准备：
- 建议先在 GitHub 上提交一次当前版本（方便回滚）。
- 需要在电脑本地运行（Windows / macOS 都可以）。

步骤（超详细）：

【Step 1】把仓库拉到本地
- 安装 GitHub Desktop（推荐）或使用 git clone。

【Step 2】安装 Python 和依赖
- 安装 Python 3.10+。
- 打开终端/命令行，进入仓库根目录，执行：

  pip install pillow

【Step 3】运行批量转换
在仓库根目录执行：

  python tools/webp_batch_convert.py --root . --quality 80 --keep-original

说明：
- quality 建议 75~85（越高越清晰，体积也更大）。
- --keep-original 表示保留原图（更安全）。
  如果你确定只要 webp，可去掉该参数（会删除原图）。

【Step 4】检查并提交
- 你会看到 images/ 下多了 .webp 文件。
- games.json 里的 cover/shots 会自动指向 .webp。
- 提交到 GitHub，等待 Pages 自动部署。

【Step 5】强制刷新验证
- 访问网站，按 Ctrl+F5（Windows）或 Cmd+Shift+R（Mac）强刷。

常见问题：

Q1：我有些图片是外链（http/https），会被改吗？
A：不会。工具只处理本地 images/ 路径。

Q2：我怕改坏了怎么办？
A：建议用 --keep-original；另外你可以用 git 回退提交。

Q3：转换后图片加载还是慢？
A：通常会明显改善首访。如果仍慢，建议再配合：
- Service Worker 缓存（我们已给你 ghpages-cn-speed-patch）
- 控制列表页一次渲染数量（分页/懒加载）

