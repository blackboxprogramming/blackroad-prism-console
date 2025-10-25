#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const Ajv = require('ajv/dist/2020');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'content', 'codex');
const OUT = path.join(ROOT, 'public', 'codex');
const SCHEMA_PATH = path.join(ROOT, 'static', 'schemas', 'codex_prompt.schema.json');
const SITEMAP = path.join(ROOT, 'public', 'sitemap.xml');

const ajv = new Ajv({ allErrors: true });
ajv.addFormat('date', /^\d{4}-\d{2}-\d{2}$/);
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
const validate = ajv.compile(schema);

function ascii(str) {
  return /^[\x00-\x7F]*$/.test(str);
}

function build(validateOnly = false) {
  if (!fs.existsSync(SRC)) return;
  fs.mkdirSync(OUT, { recursive: true });
  const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.md'));
  const seenId = new Set();
  const seenSlug = new Set();
  const listing = [];
  for (const f of files) {
    const raw = fs.readFileSync(path.join(SRC, f), 'utf8');
    const { data, content } = matter(raw);
    if (!validate(data)) {
      throw new Error(`Invalid frontmatter in ${f}: ${ajv.errorsText(validate.errors)}`);
    }
    if (seenId.has(data.id) || seenSlug.has(data.slug)) {
      throw new Error(`Duplicate id or slug in ${f}`);
    }
    if (!ascii(data.copy_filename)) {
      throw new Error(`copy_filename must be ASCII in ${f}`);
    }
    seenId.add(data.id);
    seenSlug.add(data.slug);
    if (validateOnly) continue;
    const html = marked.parse(content);
    const out = { ...data, html };
    listing.push({ id: data.id, slug: data.slug, title: data.title, summary: data.summary });
    fs.writeFileSync(path.join(OUT, `${data.slug}.json`), JSON.stringify(out, null, 2));
    const htmlDoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="index,follow"><link rel="canonical" href="https://blackroad.io/codex/${data.slug}/"><meta property="og:title" content="${data.title}"><meta property="og:description" content="${data.summary}"><title>${data.title}</title></head><body>${html}</body></html>`;
    fs.writeFileSync(path.join(OUT, `${data.slug}.html`), htmlDoc);
  }
  if (validateOnly) return;
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ prompts: listing }, null, 2));
  updateSitemap(listing.map((p) => p.slug));
}

function updateSitemap(slugs) {
  if (!fs.existsSync(SITEMAP)) return;
  let xml = fs.readFileSync(SITEMAP, 'utf8');
  for (const slug of slugs) {
    const url = `https://blackroad.io/codex/${slug}/`;
    if (xml.includes(url)) continue;
    xml = xml.replace('</urlset>', `  <url><loc>${url}</loc></url>\n</urlset>`);
  }
  fs.writeFileSync(SITEMAP, xml);
}

const validateFlag = process.argv.includes('--validate');
try {
  build(validateFlag);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
