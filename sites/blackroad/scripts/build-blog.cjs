#!/usr/bin/env node
// Minimal blog loader (placeholder)
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const SRC = path.join(process.cwd(), 'sites', 'blackroad', 'content', 'blog');
const OUT = path.join(process.cwd(), 'sites', 'blackroad', 'public', 'blog');
if (!fs.existsSync(SRC)) {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(
    path.join(OUT, 'index.json'),
    JSON.stringify({ posts: [] }, null, 2)
  );
  process.exit(0);
}
function walk(d) {
  const out = [];
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (/\.md$/i.test(f)) out.push(p);
  }
  return out;
}
const posts = [];
fs.mkdirSync(OUT, { recursive: true });
for (const fp of walk(SRC)) {
  const raw = fs.readFileSync(fp, 'utf8');
  const { data, content } = matter(raw);
  const title = data.title || path.basename(fp).replace(/\.md$/, '');
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'post';
  const html = marked.parse(content);
  const item = {
    slug,
    title,
    date: data.date || '',
    description: data.description || '',
  };
  posts.push(item);
  fs.writeFileSync(
    path.join(OUT, `${slug}.json`),
    JSON.stringify({ ...item, html }, null, 2)
  );
  fs.writeFileSync(
    path.join(OUT, `${slug}.html`),
    `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${html}</body></html>`
  );
}
posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
fs.writeFileSync(
  path.join(OUT, 'index.json'),
  JSON.stringify({ posts }, null, 2)
);
