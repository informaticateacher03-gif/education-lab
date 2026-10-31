#!/usr/bin/env node
/*
 * Покадровый экспорт видео: Chromium (Playwright) рисует каждый кадр на canvas,
 * PNG-кадры передаются в ffmpeg (H.264, yuv420p, 30 FPS), затем добавляется звук.
 *
 *   node render/render.js            — полный рендер
 *   node render/render.js --poster   — только обложка
 * Требования: node, playwright (с Chromium), ffmpeg (libx264, aac), python3 + numpy.
 */
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const OUT_MP4 = path.join(ROOT, 'logic_gates_reels.mp4');
const OUT_POSTER = path.join(ROOT, 'logic_gates_poster.png');
fs.mkdirSync(BUILD, { recursive: true });

async function main() {
  const posterOnly = process.argv.includes('--poster');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.join(ROOT, 'render', 'video.html'));
  await page.evaluate(() => document.fonts.ready);

  // обложка
  const poster = await page.evaluate(() => { renderPosterNow(); return document.getElementById('c').toDataURL('image/png'); });
  fs.writeFileSync(OUT_POSTER, Buffer.from(poster.split(',')[1], 'base64'));
  console.log('✔ обложка:', OUT_POSTER);
  if (posterOnly) { await browser.close(); return; }

  const { FPS, DURATION } = await page.evaluate(() => ({ FPS: LogicVideo.FPS, DURATION: LogicVideo.DURATION }));
  const N = Math.round(FPS * DURATION);

  // события звука → JSON → WAV
  const events = await page.evaluate(() => LogicVideo.audioEvents());
  const evPath = path.join(BUILD, 'audio_events.json');
  fs.writeFileSync(evPath, JSON.stringify({ duration: DURATION, events }, null, 1));
  const wavPath = path.join(BUILD, 'sfx.wav');
  execFileSync('python3', [path.join(__dirname, 'make_sfx.py'), evPath, wavPath], { stdio: 'inherit' });

  // видео без звука
  const silent = path.join(BUILD, 'video_silent.mp4');
  const ff = spawn('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-profile:v', 'high', '-r', String(FPS), '-movflags', '+faststart', silent,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffDone = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));

  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const data = await page.evaluate((t) => { renderAt(t); return document.getElementById('c').toDataURL('image/png'); }, i / FPS);
    const buf = Buffer.from(data.split(',')[1], 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`  кадр ${i}/${N}  (${((Date.now() - t0) / 1000).toFixed(0)} c)`);
  }
  ff.stdin.end();
  await ffDone;
  await browser.close();
  if (errors.length) { console.error('Ошибки страницы:', errors); process.exit(1); }

  // склейка со звуком
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', wavPath,
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', OUT_MP4], { stdio: 'inherit' });
  console.log('✔ видео:', OUT_MP4, `(${N} кадров, ${((Date.now() - t0) / 1000).toFixed(0)} c)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
