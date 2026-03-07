
#!/usr/bin/env bash
set -e
python3 tools/webp_batch_convert.py --root . --quality 80 --keep-original
