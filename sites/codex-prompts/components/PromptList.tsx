import Link from 'next/link'

export default function PromptList({ prompts }: { prompts: { slug: string }[] }) {
  return (
    <ul>
      {prompts.map(p => (
        <li key={p.slug}>
          <Link href={`/${p.slug}`}>{p.slug}</Link> | <Link href={`/api/${p.slug}`}>plain</Link>
        </li>
      ))}
    </ul>
  )
}
