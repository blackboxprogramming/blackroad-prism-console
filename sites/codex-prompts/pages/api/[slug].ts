import fs from 'fs'
import path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query
  const file = path.join(process.cwd(), '../../prompts', `${slug}.md`)
  const content = fs.readFileSync(file, 'utf-8')
  res.setHeader('Content-Type', 'text/plain')
  res.send(content)
}
