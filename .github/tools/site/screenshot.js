#!/usr/bin/env node
/* eslint-env node */
/* global process, console */
/**
 * Takes a full-page PNG screenshot of BLACKROAD_URL (or GH Pages fallback),
 * saves to artifacts/site-screenshots and copies the latest into the site public folder.
 */
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

(async () => {
  const base =
    process.env.BLACKROAD_URL ||
    (process.env.BLACKROAD_DOMAIN ? `https://${process.env.BLACKROAD_DOMAIN}` : '') ||
    `https://${(process.env.GITHUB_REPOSITORY || 'user/repo').split('/')[0]}.github.io`;
  const url = base.replace(/\/$/, '') + '/';
  const outDir = path.join(process.cwd(), 'artifacts', 'site-screenshots');
  fs.mkdirSync(outDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(outDir, `home-${ts}.png`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const fs = require('fs'); const path = require('path');
(async () => {
  const base =
    process.env.BLACKROAD_URL ||
    (process.env.BLACKROAD_DOMAIN ? `https://${process.env.BLACKROAD_DOMAIN}` : '') ||
    `https://${(process.env.GITHUB_REPOSITORY || 'user/repo').split('/')[0]}.github.io`;
  const url = base.replace(/\/$/, '') + '/';
  const outDir = path.join(process.cwd(), 'artifacts', 'site-screenshots');
  fs.mkdirSync(outDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(outDir, `home-${ts}.png`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.screenshot({ path: file, fullPage: true });
    // also copy into public snapshots
    const pubDir = path.join(process.cwd(), 'sites', 'blackroad', 'public', 'snapshots');
    fs.mkdirSync(pubDir, { recursive: true });
    const pubFile = path.join(pubDir, 'latest.png');
    fs.copyFileSync(file, pubFile);
    fs.writeFileSync(
      path.join(pubDir, 'latest.json'),
      JSON.stringify({ updatedAt: new Date().toISOString(), file: 'latest.png', source: url }, null, 2)
    );
    fs.writeFileSync(path.join(pubDir, 'latest.json'), JSON.stringify({ updatedAt: new Date().toISOString(), file: 'latest.png', source: url }, null, 2));
    console.log('Saved screenshot:', file);
  } catch (e) {
    console.log('Screenshot failed (non-fatal):', e.message);
  } finally {
    await browser.close();
  }
})();
