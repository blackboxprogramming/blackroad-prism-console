import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { t } from '../lib/i18n.ts'

export default function Post(){
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  useEffect(()=>{
    fetch(`/blog/${slug}.json`).then(r=>r.json()).then(setPost).catch(()=>setPost(null))
  }, [slug])
  if (!post) return <p>{t('loading')}</p>
  return (
    <article className="card">
      <h2 className="text-xl font-semibold mb-3">{post.title}</h2>
      <div className="opacity-80">{post.description}</div>
    </article>
  )
}
