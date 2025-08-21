#!/usr/bin/env node
/**
 * Compare two built sites by screenshotting "/" route.
 * args: <distA> <distB> <outDir>
 */
const fs = require('fs'); const path = require('path');
const { PNG } = require('pngjs'); const pixelmatch = require('pixelmatch');
(async () => {
  const [ , , distPR, distBase, outDir ] = process.argv;
  if(!distPR || !distBase) { console.log('Usage: screenshot-diff <distPR> <distBase> <outDir>'); process.exit(0); }
  fs.mkdirSync(outDir, { recursive: true });
  const puppeteer = require('puppeteer');
  const httpServer = require('http-server');

  // serve PR and Base on two ports
  const srvPR = httpServer.createServer({ root: distPR, cache: -1, robots: true, gzip: true });
  const srvBase = httpServer.createServer({ root: distBase, cache: -1, robots: true, gzip: true });
  const portPR = 4175, portBase = 4176;
  await new Promise(r=> srvPR.listen(portPR, r));
  await new Promise(r=> srvBase.listen(portBase, r));

  const browser = await puppeteer.launch({ headless:'new', args:['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  async function snap(url, file){
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.screenshot({ path: file, fullPage: true });
  }
  const prPng = path.join(outDir,'pr.png');
  const basePng = path.join(outDir,'base.png');
  const diffPng = path.join(outDir,'diff.png');

  try{
    await snap(`http://127.0.0.1:${portPR}/`, prPng);
    await snap(`http://127.0.0.1:${portBase}/`, basePng);
    const img1 = PNG.sync.read(fs.readFileSync(prPng));
    const img2 = PNG.sync.read(fs.readFileSync(basePng));
    const { width, height } = img1;
    const diff = new PNG({ width, height });
    const mismatch = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
    fs.writeFileSync(diffPng, PNG.sync.write(diff));
    const mismatchPct = ((mismatch / (width*height)) * 100).toFixed(2);
    fs.writeFileSync(path.join(outDir,'summary.json'), JSON.stringify({ mismatch, mismatchPct, width, height }, null, 2));
    console.log('Mismatch %:', mismatchPct);
  } catch(e){ console.log('Screenshot diff failed (non-fatal):', e.message); }
  await browser.close(); srvPR.close(); srvBase.close();
})();
