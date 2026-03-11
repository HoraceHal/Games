
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const cfgPath = path.join(ROOT, 'tools', 'site.config.json');
if (!fs.existsSync(cfgPath)) { console.error('[ERROR] 缺少 tools/site.config.json'); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const base = cfg.siteBaseUrl.replace(/\/?$/, '/');

const games = JSON.parse(fs.readFileSync(path.join(ROOT, 'games.json'), 'utf8'));
const list = Array.isArray(games) ? games : (games.games || []);

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const urls = [];
urls.push({ loc: base });
for (const g of list) {
  const id = g.id || g.slug || g.title; if (!id) continue;
  urls.push({ loc: base + 'detail.html?id=' + encodeURIComponent(id) });
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
` +
`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
` +
urls.map(u=>`  <url><loc>${esc(u.loc)}</loc></url>`).join('
') +
`
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log('[OK] 已生成 sitemap.xml: ', urls.length, '条');
