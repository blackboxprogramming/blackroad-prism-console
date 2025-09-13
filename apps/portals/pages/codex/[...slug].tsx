import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import Head from 'next/head';
import CodexPrompt from '../../components/CodexPrompt';

export async function getStaticPaths(){
  const baseDir = path.join(process.cwd(),'content','codex');
  const paths: { params: { slug: string[] } }[] = [];
  try{
    const files = (await fs.readdir(baseDir)).filter(f=>f.endsWith('.md'));
    for(const f of files){
      const slug = f.replace(/\.md$/, '');
      paths.push({ params: { slug: [slug] } });
    }
  }catch{}
  try{
    const privDir = path.join(baseDir,'private');
    const files = (await fs.readdir(privDir)).filter(f=>f.endsWith('.md'));
    for(const f of files){
      const slug = f.replace(/\.md$/, '');
      paths.push({ params: { slug: ['private', slug] } });
    }
  }catch{}
  return { paths, fallback: false };
}

export async function getStaticProps({ params }: any){
  const segments: string[] = Array.isArray(params.slug) ? params.slug : [params.slug];
  const baseDir = path.join(process.cwd(),'content','codex');
  const filePath = segments[0]==='private'
    ? path.join(baseDir,'private',`${segments[1]}.md`)
    : path.join(baseDir,`${segments[0]}.md`);
  const raw = await fs.readFile(filePath,'utf8');
  const { data, content } = matter(raw);
  const html = marked(content);
  const slugPath = segments.join('/');
  return { props: { fm: { ...data, slug: slugPath }, html } };
}

export default function Page({ fm, html }: any){
  const url = `https://blackroadinc.us/codex/${fm.slug || 'phase-37'}`;
  const title = fm.title || 'Codex Prompt';
  const desc = fm.summary || 'Blackroad Codex prompt';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description: desc,
    author: { '@type': 'Organization', name: 'Blackroad' },
    dateModified: fm.updated,
    mainEntityOfPage: url,
  };
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={url} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={desc} />
        <link rel="canonical" href={url} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>
      <CodexPrompt title={title} html={html} downloadName={fm.copy_filename || 'codex_prompt.txt'} />
      <p className="mx-auto max-w-3xl p-6 text-sm opacity-70">Need outputs? See <a className="underline" href="/artifacts">Artifacts</a>.</p>
    </>
  );
}
