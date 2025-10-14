import fs from 'fs'
import path from 'path'
import { GetStaticPaths, GetStaticProps } from 'next'

export const getStaticPaths: GetStaticPaths = async () => {
  const dir = path.join(process.cwd(), '../../prompts')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))
  const paths = files.map(f => ({ params: { slug: f.replace(/\.md$/, '') } }))
  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const file = path.join(process.cwd(), '../../prompts', `${params!.slug}.md`)
  const content = fs.readFileSync(file, 'utf-8')
  return { props: { content } }
}

export default function PromptPage({ content }: { content: string }) {
  return <pre>{content}</pre>
}
