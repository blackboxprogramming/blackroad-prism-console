import fs from 'fs'
import path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const dir = path.join(process.cwd(), '../../prompts')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))
  const urls = files
    .map(f => f.replace(/\.md$/, ''))
    .map(slug => `<url><loc>/${slug}</loc></url>`)
    .join('')
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
  res.setHeader('Content-Type', 'text/xml')
  res.write(xml)
  res.end()
}
