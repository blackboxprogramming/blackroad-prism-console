import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { localeFromPath, withPrefix } from '../lib/i18n.ts'
import { logToWorker } from '../lib/logger.ts'

export default function Home(){
  const lang = localeFromPath(useLocation().pathname)

  useEffect(() => {
    const url = import.meta.env.VITE_LOG_WRITE_URL
    if (url) logToWorker(url, 'info', 'home_view', { hint: 'home page mounted' })
  }, [])

  return (
    <>
      <section className="grid grid-2 gap-4">
        <div className="card">
          <h2 className="text-xl font-semibold mb-2">Studio</h2>
          <p>Multi-agent coding with files and canvas all in chat.</p>
          <Link className="btn mt-4" to={withPrefix('/studio', lang)}>Open Studio</Link>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-2">Animator</h2>
          <p>Drop assets, storyboard, and render directly to MP4.</p>
          <Link className="btn mt-4" to={withPrefix('/animator', lang)}>Try Animator</Link>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-2">Game Maker</h2>
          <p>Collect assets and export Unity/Unreal project templates.</p>
          <Link className="btn mt-4" to={withPrefix('/game', lang)}>Build a Game</Link>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-2">Homework</h2>
          <p>Research, draft, cite, and export from chat alone.</p>
          <Link className="btn mt-4" to={withPrefix('/homework', lang)}>Do Homework</Link>
        </div>
      </section>

      <section className="card mt-6">
        <h2 className="text-2xl font-bold mb-2">Pricing</h2>
        <ul className="list-disc ml-5">
          <li>Free: explore with local agents</li>
          <li>Pro $20/mo: cloud workers and priority builds</li>
          <li>Enterprise: contact us for custom agent graphs</li>
        </ul>
      </section>
    </>
  )
}
