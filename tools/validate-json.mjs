
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const jsonPath = path.join(ROOT, 'games.json');
if (!fs.existsSync(jsonPath)) {
  console.error('[ERROR] 找不到 games.json 于仓库根目录');
  process.exit(1);
}

/** 基础读取与解析 */
let raw = fs.readFileSync(jsonPath, 'utf8');
let data;
try { data = JSON.parse(raw); }
catch (e) { console.error('[ERROR] games.json 不是合法 JSON:', e.message); process.exit(1); }

const list = Array.isArray(data) ? data : (Array.isArray(data.games) ? data.games : null);
if (!list) { console.error('[ERROR] games.json 顶层应为数组，或 {"games": [...]} 结构'); process.exit(1); }

let ok = true;
const seen = new Set();

function err(id, msg) { ok = false; console.error(`[ERROR] ${id||'(no-id)'}: ${msg}`); }
function warn(id, msg) { console.warn(`[WARN ] ${id||'(no-id)'}: ${msg}`); }

for (const [i, item] of list.entries()) {
  const id = item.id || item.slug || item.title || `index:${i}`;
  if (!item.title && !item.name) err(id, '缺少 title/name');
  if (!item.cover) warn(id, '缺少 cover');
  if (item.id && seen.has(item.id)) err(id, '重复的 id');
  if (item.id) seen.add(item.id);

  // 路径存在性校验（仅对相对路径进行）
  const rels = [];
  if (typeof item.cover === 'string' && item.cover.startsWith('./')) rels.push(item.cover);
  const shots = item.shots || item.screenshots || [];
  for (const s of shots) if (typeof s === 'string' && s.startsWith('./')) rels.push(s);

  for (const p of rels) {
    const filePath = path.join(ROOT, p.replace(/^\.\//, ''));
    if (!fs.existsSync(filePath)) warn(id, `引用的文件不存在: ${p}`);
  }
}

if (!ok) { process.exit(2); }
console.log('[OK] games.json 校验通过，共', list.length, '条');
