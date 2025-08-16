#!/usr/bin/env node
/**
 * Build-time blog generator (skip-safe).
 * - Reads Markdown from sites/blackroad/content/blog/ (recursive .md files)
 * - Writes JSON + HTML to sites/blackroad/public/blog/
 * - Emits index.json sorted by date desc
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const CONTENT_DIR = path.join(process.cwd(), 'sites','blackroad','content','blog');
const OUT_DIR = path.join(process.cwd(), 'sites','blackroad','public','blog');

function slugify(s){
  return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || 'post';
}

function walk(dir){
  if(!fs.existsSync(dir)) return [];
  const out=[];
  for(const f of fs.readdirSync(dir)){
    const p=path.join(dir,f); const st=fs.statSync(p);
    if(st.isDirectory()) out.push(...walk(p));
    else if(/\.md$/i.test(f)) out.push(p);
  }
  return out;
}

function ensureDir(d){ fs.mkdirSync(d,{recursive:true}); }

function main(){
  ensureDir(OUT_DIR);
  const files = walk(CONTENT_DIR);
  const posts = [];
  for(const fp of files){
    const raw = fs.readFileSync(fp,'utf8');
    const { data, content } = matter(raw);
    const title = data.title || path.basename(fp).replace(/\.md$/,'');
    const date = data.date || new Date().toISOString();
    const tags = Array.isArray(data.tags) ? data.tags : (data.tags? String(data.tags).split(',').map(s=>s.trim()) : []);
    const firstLine = content.split('\n').find(l => l.trim()) || '';
    const description = data.description || firstLine.slice(0,160);
    const slug = data.slug || slugify(title);
    const html = marked.parse(content);
    const item = { slug, title, date, tags, description };
    posts.push(item);
    // JSON (for SPA route)
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.json`), JSON.stringify({ ...item, html }, null, 2));
    // HTML (for crawlers/direct links)
    const htmlDoc = `<!doctype html><meta charset="utf-8"><title>${title}</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/blog.css"><article class="post"><h1>${title}</h1><p class="meta">${new Date(date).toDateString()}${tags.length?` • ${tags.join(', ')}`:''}</p>${html}</article>`;
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.html`), htmlDoc, 'utf8');
  }
  posts.sort((a,b)=> new Date(b.date)-new Date(a.date));
  fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify({ posts }, null, 2));
  // minimal CSS
  fs.writeFileSync(path.join(path.dirname(OUT_DIR), 'blog.css'),
    `.post{max-width:760px;margin:2rem auto;padding:1rem;color:#e5e7eb;background:#0b1220;border:1px solid #1f2937;border-radius:12px;font:16px/1.6 ui-sans-serif,system-ui,Segoe UI,Roboto} .post h1{font-size:2rem;margin:0 0 .5rem} .post .meta{opacity:.7;margin-bottom:1rem} .post a{color:#93c5fd}`);
  console.log(`Built ${posts.length} blog posts → ${OUT_DIR}`);
}
main();
