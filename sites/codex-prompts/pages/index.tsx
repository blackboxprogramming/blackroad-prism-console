import fs from 'fs'
import path from 'path'
import PromptList from '../components/PromptList'

export async function getStaticProps() {
  const dir = path.join(process.cwd(), '../../prompts')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))
  const prompts = files.map(f => ({ slug: f.replace(/\.md$/, '') }))
  return { props: { prompts } }
}

export default function Home({ prompts }: { prompts: { slug: string }[] }) {
  return (
    <div>
      <h1>Codex Prompts</h1>
      <PromptList prompts={prompts} />
    </div>
  )
}
