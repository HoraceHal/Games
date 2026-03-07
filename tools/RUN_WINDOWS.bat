
@echo off
REM 双击运行：在仓库根目录执行 WebP 转换（需要已安装 Python + Pillow）
python tools\webp_batch_convert.py --root . --quality 80 --keep-original
pause
