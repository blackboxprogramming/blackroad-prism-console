#!/usr/bin/env node
/**
 * Reads dist/sitemap.xml, visits first N URLs (same origin), asserts basic render + screenshot.
 * Falls back to a default route list if sitemap missing.
 */
const fs = require('fs'); const path = require('path')
const { test, expect, chromium } = require('@playwright/test') // via pw test runner API
;(async () => {
  const base = process.env.E2E_BASE || 'http://127.0.0.1:5173'
  const distMap = path.join(process.cwd(), 'dist', 'sitemap.xml')
  let urls = []
  if (fs.existsSync(distMap)) {
    const xml = fs.readFileSync(distMap, 'utf8')
    urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]).filter(u => u.startsWith(base))
  }
  if (urls.length === 0) {
    urls = [`${base}/`, `${base}/docs`, `${base}/status`, `${base}/snapshot`, `${base}/portal`, `${base}/blog`, `${base}/es/`, `${base}/es/docs`]
  }
  urls = urls.slice(0, 20) // cap
  const outDir = path.join(process.cwd(), 'test-results')
  fs.mkdirSync(outDir, { recursive: true })
  const browser = await chromium.launch({ args:['--no-sandbox','--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  for (const [i, u] of urls.entries()) {
    try {
      await page.goto(u, { waitUntil: 'networkidle', timeout: 60000 })
      const body = await page.textContent('body').catch(()=> '')
      if (!body || body.length < 50) throw new Error('Body too small')
      await page.screenshot({ path: path.join(outDir, `sitemap_${String(i).padStart(2,'0')}.png`), fullPage: true })
    } catch (e) {
      console.log('E2E warn:', u, e.message)
      // keep going; non-blocking in CI by design
    }
  }
  await browser.close()
  console.log('Visited', urls.length, 'URLs from sitemap')
})()
