import React, { useEffect, useRef, useState } from 'react'
import { fetchManifesto } from '../api'

export default function Manifesto(){
  const [content, setContent] = useState('')
  const [toc, setToc] = useState([])
  const contentRef = useRef(null)

  useEffect(()=>{
    (async()=>{
      const html = await fetchManifesto()
      setContent(html)
    })()
  }, [])

  useEffect(()=>{
    if(!contentRef.current) return
    const headers = contentRef.current.querySelectorAll('h1, h2, h3')
    const items = []
    headers.forEach(h=>{
      const id = h.id || h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$|/g, '')
      h.id = id
      items.push({ id, text: h.textContent, level: Number(h.tagName[1]) })
    })
    setToc(items)
  }, [content])

  return (
    <div className="relative">
      <button
        className="px-3 py-1.5 rounded-xl text-white"
        style={{ backgroundColor: 'var(--accent)' }}
        onClick={()=>{ window.open('/api/manifesto/download', '_blank') }}
      >
        Download PDF
      </button>
      <div className="flex mt-10">
        <nav className="w-48 mr-6 sticky top-4 self-start">
          <ul className="space-y-1 text-sm">
            {toc.map(item => (
              <li key={item.id} style={{ marginLeft: (item.level-1)*8 }}>
                <a href={`#${item.id}`} className="link">
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <article ref={contentRef} className="manifesto flex-1">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </article>
      </div>
    </div>
  )
}
