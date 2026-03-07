
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""webp_batch_convert.py

用途：
- 批量把本地 images/ 下的 JPG/JPEG/PNG 转为 WebP（可选保留原图）。
- 自动更新 games.json：把 cover / shots 里指向本地 .jpg/.jpeg/.png 的路径替换成 .webp。

特点：
- 不处理网络图片（http/https）。
- 只处理你仓库里的本地路径（以 ./images 或 images 开头，或 /images）。

运行方式：
  python tools/webp_batch_convert.py --root . --quality 80 --keep-original

注意：
- 运行前请先备份或确保已提交（便于回滚）。
"""

import argparse
import json
import os
from pathlib import Path

from PIL import Image

IMG_EXTS = {'.jpg', '.jpeg', '.png'}


def is_remote(s: str) -> bool:
    s = (s or '').strip().lower()
    return s.startswith('http://') or s.startswith('https://')


def is_local_image_path(p: str) -> bool:
    if not p or is_remote(p):
        return False
    p2 = p.strip()
    return p2.startswith('./images/') or p2.startswith('images/') or p2.startswith('/images/')


def normalize_repo_path(p: str) -> str:
    # 输入可能是 ./images/x.jpg 或 /images/x.jpg 或 images/x.jpg
    p = p.strip()
    if p.startswith('./'):
        p = p[2:]
    if p.startswith('/'):
        p = p[1:]
    return p


def to_webp_path(path_str: str) -> str:
    # 保持目录不变，仅替换后缀
    p = Path(path_str)
    return str(p.with_suffix('.webp'))


def convert_one(src_fs: Path, dst_fs: Path, quality: int) -> bool:
    """转换单个文件到 webp。成功返回 True。"""
    try:
        dst_fs.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(src_fs) as im:
            # PNG 带透明时需转为 RGBA 才能正确输出
            if im.mode in ('P', 'LA'):
                im = im.convert('RGBA')
            elif im.mode == 'RGB':
                pass
            else:
                # 其它模式统一转 RGBA，兼容透明与颜色
                im = im.convert('RGBA')

            im.save(dst_fs, 'WEBP', quality=quality, method=6)
        return True
    except Exception as e:
        print(f'[WARN] 转换失败: {src_fs} -> {dst_fs} ({e})')
        return False


def walk_images(root: Path):
    images_dir = root / 'images'
    if not images_dir.exists():
        return []
    out = []
    for fp in images_dir.rglob('*'):
        if fp.is_file() and fp.suffix.lower() in IMG_EXTS:
            out.append(fp)
    return out


def update_games_json(root: Path, dry_run: bool = False):
    gj = root / 'games.json'
    if not gj.exists():
        print('[INFO] 未发现 games.json，跳过路径替换。')
        return 0

    data = json.loads(gj.read_text(encoding='utf-8'))
    if not isinstance(data, list):
        print('[WARN] games.json 不是数组，跳过。')
        return 0

    changed = 0

    def repl(v: str) -> str:
        nonlocal changed
        if not is_local_image_path(v):
            return v
        v_norm = normalize_repo_path(v)
        ext = Path(v_norm).suffix.lower()
        if ext not in IMG_EXTS:
            return v
        new_path = to_webp_path(v_norm)
        # 输出保持相对写法 ./images/...（与你现有结构一致）
        new_json_path = './' + new_path
        if new_json_path != v:
            changed += 1
        return new_json_path

    for g in data:
        if not isinstance(g, dict):
            continue
        if 'cover' in g and isinstance(g['cover'], str):
            g['cover'] = repl(g['cover'])
        if 'shots' in g and isinstance(g['shots'], list):
            g['shots'] = [repl(x) if isinstance(x, str) else x for x in g['shots']]

    if changed and not dry_run:
        gj.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'[OK] games.json 替换完成：{changed} 处')
    return changed


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', default='.', help='仓库根目录（默认当前目录）')
    ap.add_argument('--quality', type=int, default=80, help='WebP 质量 1-100（建议 75-85）')
    ap.add_argument('--keep-original', action='store_true', help='保留原图（默认不删）')
    ap.add_argument('--dry-run', action='store_true', help='仅演练，不写入文件')
    args = ap.parse_args()

    root = Path(args.root).resolve()
    quality = max(1, min(100, args.quality))

    files = walk_images(root)
    if not files:
        print('[INFO] images/ 下未发现可转换的 jpg/jpeg/png。')
    converted = 0
    skipped = 0

    for src in files:
        dst = src.with_suffix('.webp')
        if dst.exists():
            skipped += 1
            continue
        ok = convert_one(src, dst, quality)
        if ok:
            converted += 1
            if (not args.keep_original) and (not args.dry_run):
                # 默认不删原图，这里保持安全：只有用户显式不保留时才删
                try:
                    src.unlink(missing_ok=True)
                except Exception:
                    pass

    print(f'[OK] 转换完成：新生成 {converted} 个 WebP，已存在跳过 {skipped} 个。')

    # 更新 games.json
    update_games_json(root, dry_run=args.dry_run)

    print('
下一步建议：')
    print('1) 提交改动到 GitHub（或先本地检查）')
    print('2) 强制刷新页面（Ctrl+F5 / Cmd+Shift+R）')


if __name__ == '__main__':
    main()
