import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function Blog(){
  const [posts, setPosts] = useState(null)
  useEffect(()=>{
    fetch('/blog/index.json', { cache: 'no-cache' })
      .then(r=>r.json())
      .then(d=> setPosts(d.posts || []))
      .catch(()=> setPosts([]))
  },[])
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-3">Blog</h2>
      {!posts ? <p>Loading…</p> :
        posts.length === 0 ? <p>No posts yet.</p> :
        <ul className="list-disc ml-5">
          {posts.map(p=>(
            <li key={p.slug} className="mb-2">
              <Link to={`/blog/${p.slug}`} className="underline">{p.title}</Link>
              <span className="opacity-70"> — {new Date(p.date).toDateString()}</span>
              <div className="opacity-80">{p.description}</div>
            </li>
          ))}
        </ul>
      }
    </div>
  )
}
