#!/usr/bin/env node
/**
 * Build-time docs loader:
 * - Reads Markdown from sites/blackroad/content/docs
 * - Writes public/docs/<slug>.json & index.json
 */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const SRC = path.join(process.cwd(), 'sites', 'blackroad', 'content', 'docs');
const OUT = path.join(process.cwd(), 'sites', 'blackroad', 'public', 'docs');
const ensure = (d) => fs.mkdirSync(d, { recursive: true });
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'doc';
function walk(d) {
  if (!fs.existsSync(d)) return [];
  const out = [];
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (/\.md$/i.test(f)) out.push(p);
  }
  return out;
}
function main() {
  ensure(OUT);
  const posts = [];
  for (const fp of walk(SRC)) {
    const raw = fs.readFileSync(fp, 'utf8');
    const { data, content } = matter(raw);
    const title = data.title || path.basename(fp).replace(/\.md$/, '');
    const s = slug(data.slug || title);
    const html = marked.parse(content);
    const item = { slug: s, title, section: data.section || 'General' };
    posts.push(item);
    fs.writeFileSync(path.join(OUT, `${s}.json`), JSON.stringify({ ...item, html }, null, 2));
  }
  posts.sort((a, b) => a.section.localeCompare(b.section) || a.title.localeCompare(b.title));
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ docs: posts }, null, 2));
}
main();
