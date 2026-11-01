#!/usr/bin/env node
/*
 * Программная проверка: таблицы истинности, символы, цвета, синхронизация
 * видео (состояние + пиксели лампы), границы текста, интерактивная версия, MP4.
 *   node verify.js
 */
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const LC = require('./src/logic-core.js');

const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass: !!pass, detail }); console.log(`${pass ? '✔' : '✘'} ${name}${detail ? ' — ' + detail : ''}`); };

// Эталон записан вручную (независимо от функций в ядре).
const EXPECTED = {
  AND:  { '00': 0, '01': 0, '10': 0, '11': 1 },
  OR:   { '00': 0, '01': 1, '10': 1, '11': 1 },
  NOT:  { '0': 1, '1': 0 },
  NAND: { '00': 1, '01': 1, '10': 1, '11': 0 },
  NOR:  { '00': 1, '01': 0, '10': 0, '11': 0 },
  XOR:  { '00': 0, '01': 1, '10': 1, '11': 0 },
  XNOR: { '00': 1, '01': 0, '10': 0, '11': 1 },
};
const SYMBOL = { // форма корпуса, кружок инверсии, число входов
  AND: ['and', false, 2], OR: ['or', false, 2], NOT: ['not', true, 1], NAND: ['and', true, 2],
  NOR: ['or', true, 2], XOR: ['xor', false, 2], XNOR: ['xor', true, 2],
};

function checkLogic() {
  ok('Семь элементов в ядре', LC.GATES.map((g) => g.id).join() === 'AND,OR,NOT,NAND,NOR,XOR,XNOR');
  for (const g of LC.GATES) {
    const tt = LC.truthTable(g);
    const order = tt.map((r) => r.in.join('')).join(',');
    const wantOrder = g.inputs === 1 ? '0,1' : '00,01,10,11';
    const bad = tt.filter((r) => EXPECTED[g.id][r.in.join('')] !== r.out);
    ok(`Таблица истинности ${g.id}`, bad.length === 0 && order === wantOrder && tt.length === Object.keys(EXPECTED[g.id]).length,
      tt.map((r) => `${r.in.join('')}→${r.out}`).join(' '));
    const [shape, inv, n] = SYMBOL[g.id];
    const G = LC.geom(g);
    ok(`Символ ${g.id}`, g.shape === shape && !!G.bubble === inv && g.inputs === n && G.pins.length === n,
      `форма=${g.shape}, инверсия=${!!G.bubble}, входов=${G.pins.length}`);
  }
  ok('Цвета: 1 — зелёный, 0 — красный', LC.valColor(1) === '#2bff6b' && LC.valColor(0) === '#ff3546' && LC.C.name === '#ffd23a' && LC.C.label === '#ffffff');
}

async function checkVideo(browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.join(__dirname, 'render/video.html'));
  await page.waitForFunction(() => [...document.querySelectorAll('img')].every((im) => !im.src || (im.complete && im.naturalWidth > 0)));

  const meta = await page.evaluate(() => ({ D: LogicVideo.DURATION, FPS: LogicVideo.FPS, segs: LogicVideo.SEGMENTS, tl: LogicVideo.timeline() }));
  ok('Длительность 45–70 с, 30 FPS', meta.D >= 45 && meta.D <= 70 && meta.FPS === 30, `${meta.D} с`);
  const order = ['intro', 'AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'final'];
  ok('Сценарий: порядок сцен, сцены идут встык', meta.segs.every((s, i) => (s.id || s.type) === order[i] && (i === 0 ? s.start === 0 : s.start === meta.segs[i - 1].end) && s.end > s.start)
    && meta.segs[meta.segs.length - 1].end === meta.D, meta.segs.map((s) => `${s.id || s.type} ${s.start}–${s.end}`).join(', '));

  // озвучка: каждая фраза звучит внутри своей сцены, субтитры совпадают с репликами
  const vt = await page.evaluate(() => window.VOICE_TIMING || null);
  if (vt) {
    const script = JSON.parse(fs.readFileSync(path.join(__dirname, 'voice/script.json'), 'utf8'));
    const segOf = (id) => meta.segs.find((s) => (s.id || s.type) === id);
    const badPh = vt.phrases.filter((p) => { const sp = script.phrases.find((x) => x.id === p.id); const sg = segOf(sp.segment);
      return !(p.start >= sg.start && p.start + p.dur <= sg.end - 0.3); });
    ok('Озвучка: каждая реплика внутри своей сцены (голос синхронен со схемой)', badPh.length === 0 && vt.phrases.length === script.phrases.length,
      `${vt.phrases.length} реплик, движок: ${vt.engine}`);
    // эталон субтитров — то, что реально звучит (voice.json пишут make_voice.py или use_recording.py)
    const vjPath = path.join(__dirname, 'build/voice/voice.json');
    const wantSubs = fs.existsSync(vjPath)
      ? JSON.parse(fs.readFileSync(vjPath, 'utf8')).phrases.flatMap((p) => p.sentences.map((x) => x.sub))
      : script.phrases.flatMap((p) => p.sub);
    const subsText = vt.subs.map((s) => s.text);
    const overlap = vt.subs.some((s, i) => i && s.start < vt.subs[i - 1].end);
    ok('Субтитры: дословно сказанный текст, без наложений', JSON.stringify(subsText) === JSON.stringify(wantSubs) && !overlap, `${vt.subs.length} субтитров`);
    const subBad = await page.evaluate((subs) => {
      const bad = [];
      subs.forEach((s) => { const inf = renderAt((s.start + s.end) / 2); if (inf.subtitle !== s.text) bad.push(s.text); });
      const gaps = [0.05, LogicVideo.DURATION - 0.1].filter((t) => !LogicVideo.subtitleAt(t)).map((t) => renderAt(t).subtitle);
      if (gaps.some((x) => x)) bad.push('субтитр вне реплики');
      return bad;
    }, vt.subs);
    ok('Субтитры показываются в кадре синхронно с репликами', subBad.length === 0, subBad.join('; '));
  }
  // порядок комбинаций и значения в таймлайне
  let tlOk = true;
  for (const g of LC.GATES) {
    const st = meta.tl.filter((s) => s.gate === g.id);
    const ord = st.map((s) => s.vals.join('')).join(',');
    if (ord !== (g.inputs === 1 ? '0,1' : '00,01,10,11')) tlOk = false;
    st.forEach((s) => { if (EXPECTED[g.id][s.vals.join('')] !== s.out) tlOk = false; if (s.flip >= s.segEnd - 0.4) tlOk = false; });
  }
  ok('Таймлайн: порядок комбинаций и выходы', tlOk, `${meta.tl.length} шагов`);

  // синхронизация: состояние кадра + цвет пикселя лампы до и после переключения
  const sync = await page.evaluate((tl) => {
    const c = document.getElementById('c'), x2 = c.getContext('2d');
    const L = LogicVideo.lampScreen();
    const px = () => { const d = x2.getImageData(Math.round(L.x) - 3, Math.round(L.y) - 3, 7, 7).data; let r = 0, g = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; } return { r, g }; };
    const bad = [];
    tl.forEach((s, i) => {
      const after = Math.min(s.flip + 0.15, (tl[i + 1] && tl[i + 1].gate === s.gate ? tl[i + 1].t : s.segEnd - 0.45) - 0.02);
      let inf = renderAt(after); let p = px();
      const col = p.g > p.r ? 1 : 0;
      if (inf.outShown !== s.out || inf.vals.join('') !== s.vals.join('') || inf.step !== s.k || col !== s.out) bad.push({ s, inf, p, when: 'after' });
      inf = renderAt(s.flip - 0.08);
      const prevOut = i > 0 && tl[i - 1].gate === s.gate ? tl[i - 1].out : null;
      if (inf.outShown !== prevOut) bad.push({ s, inf, when: 'before' });
    });
    return bad;
  }, meta.tl);
  ok('Синхронизация входов, выхода, цвета лампы и таблицы', sync.length === 0, sync.length ? JSON.stringify(sync[0]).slice(0, 300) : `${meta.tl.length * 2} проверок`);

  const fin = await page.evaluate(() => {
    const bad = [];
    const fin = LogicVideo.SEGMENTS[LogicVideo.SEGMENTS.length - 1];
    for (let t = fin.start + 1.5; t < fin.end; t += 0.25) {
      const inf = renderAt(t);
      inf.rows.forEach((r) => { if (r.vals) { r.ex = LogicCore.evalGate(LogicCore.GATE[r.id], r.vals); if (r.out !== r.ex) bad.push(r); } });
    }
    return bad;
  });
  ok('Финальная композиция: выходы всех 7 схем', fin.length === 0);

  // границы текста по всем кадрам (каждый 2-й кадр)
  const bounds = await page.evaluate(() => {
    const T = LogicCore.tracker; T.on = true;
    const out = []; let minH = 1e9, minStr = '';
    for (let i = 0; i < LogicVideo.DURATION * 30; i += 2) {
      T.log = []; renderAt(i / 30);
      T.log.forEach((b) => {
        const h = b.y1 - b.y0;
        if (h < minH && b.str.trim()) { minH = h; minStr = b.str; }
        // бегущие цифры «бинарного дождя» и импульсы заставки уходят за край намеренно
        const decorative = i / 30 < LogicVideo.SEGMENTS[0].end && /^[01]$/.test(b.str) && b.y1 - b.y0 < 40;
        if (!decorative && (b.x0 < 16 || b.x1 > 1064 || b.y0 < 16 || b.y1 > 1904)) out.push({ t: i / 30, ...b });
      });
    }
    T.on = false;
    return { out, minH, minStr };
  });
  ok('Текст не выходит за границы кадра', bounds.out.length === 0, bounds.out.length ? JSON.stringify(bounds.out.slice(0, 3)) : 'все кадры');
  ok('Минимальная высота надписей ≥ 18 px (читаемость на смартфоне)', bounds.minH >= 18, `${bounds.minH.toFixed(1)} px («${bounds.minStr}»)`);
  ok('Видео-сцена без ошибок JS', errors.length === 0, errors.join('; '));
  await page.close();
}

async function checkInteractive(browser) {
  const file = path.join(__dirname, 'logic_gates_interactive.html');
  for (const vp of [{ width: 390, height: 844, name: 'смартфон' }, { width: 1280, height: 800, name: 'ПК' }]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('file://' + file);
    await page.waitForTimeout(300);
    const bad = [];
    for (const g of LC.GATES) {
      await page.click(`.chip[data-id="${g.id}"]`);
      const bHidden = await page.$eval('#tB', (b) => b.hidden);
      if (bHidden !== (g.inputs === 1)) bad.push(`${g.id}: кнопка B`);
      const rows = await page.$$eval('#tt tbody tr', (trs) => trs.map((tr) => [...tr.children].map((td) => td.textContent).join('')));
      const wantRows = LC.combos(g).map((c) => c.join('') + EXPECTED[g.id][c.join('')]);
      if (rows.join() !== wantRows.join()) bad.push(`${g.id}: таблица ${rows}`);
      for (const c of LC.combos(g)) {
        await page.evaluate((c) => LabAPI.setInputs(c), c);
        await page.waitForTimeout(800);
        const r = await page.evaluate(() => ({ out: document.getElementById('outLine').dataset.out, active: document.querySelector('#tt tr.active')?.dataset.key }));
        if (r.out !== String(EXPECTED[g.id][c.join('')]) || r.active !== c.join('')) bad.push(`${g.id} ${c.join('')}: ${JSON.stringify(r)}`);
      }
    }
    // реальные клики по кнопкам и демо
    await page.click('.chip[data-id="XOR"]');
    await page.click('#tA'); await page.waitForTimeout(800);
    const x1 = await page.$eval('#outLine', (e) => e.dataset.out);
    await page.click('#tB'); await page.waitForTimeout(800);
    const x2 = await page.$eval('#outLine', (e) => e.dataset.out);
    if (x1 !== '1' || x2 !== '0') bad.push(`клики XOR: ${x1},${x2}`);
    await page.click('#bRepeat'); await page.waitForTimeout(3300);
    const demo = await page.evaluate(() => ({ on: LabAPI.state().demo, idx: LabAPI.state().demoIdx }));
    await page.click('#bStop');
    const stopped = await page.evaluate(() => !LabAPI.state().demo);
    if (!demo.on || demo.idx < 1 || !stopped) bad.push(`демо ${JSON.stringify(demo)} stop=${stopped}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (overflow) bad.push('горизонтальная прокрутка');
    if (vp.width < 500) await page.screenshot({ path: path.join(__dirname, 'build/interactive_mobile.png'), fullPage: true });
    else await page.screenshot({ path: path.join(__dirname, 'build/interactive_desktop.png'), fullPage: true });
    ok(`Интерактивная версия (${vp.name} ${vp.width}px): все вентили, все комбинации, демо`, bad.length === 0 && errors.length === 0, [...bad, ...errors].join('; '));
    await page.close();
  }
}

function checkMp4() {
  const f = path.join(__dirname, 'logic_gates_reels.mp4');
  if (!fs.existsSync(f)) { ok('MP4 существует', false, 'сначала запустите node render/render.js'); return; }
  const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', f]).toString());
  const v = j.streams.find((s) => s.codec_type === 'video');
  const a = j.streams.find((s) => s.codec_type === 'audio');
  const dur = +j.format.duration;
  ok('MP4: H.264, 1080×1920, 30 FPS, yuv420p', v.codec_name === 'h264' && v.width === 1080 && v.height === 1920 && v.r_frame_rate === '30/1' && v.pix_fmt === 'yuv420p',
    `${v.codec_name} ${v.width}×${v.height} ${v.r_frame_rate} ${v.pix_fmt}`);
  ok('MP4: длительность 45–70 с, есть звук', dur >= 45 && dur <= 70 && a && a.codec_name === 'aac', `${dur.toFixed(2)} с, аудио ${a && a.codec_name}, ${(fs.statSync(f).size / 1e6).toFixed(1)} МБ`);
}

// Проверка голоса в готовом MP4: распознаём речь в каждом окне реплики (Whisper small, sherpa-onnx)
// и сравниваем со сценарием. Так подтверждается, что голос реально есть и разборчив поверх музыки.
function checkVoiceInMp4() {
  const f = path.join(__dirname, 'logic_gates_reels.mp4');
  const tf = path.join(__dirname, 'src/voice-timing.js');
  if (!fs.existsSync(f) || !fs.existsSync(tf)) return;
  let out;
  try {
    out = execFileSync('python3', [path.join(__dirname, 'voice/check_voice.py'), f], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e) { ok('Голос в MP4 распознаётся', false, 'check_voice.py: ' + (e.stdout || e.message).slice(0, 200)); return; }
  const r = JSON.parse(out);
  r.phrases.forEach((p) => ok(`Голос в MP4: «${p.id}» распознан (по предложениям, сходство ≥ 0.75)`, p.score >= 0.75, `${p.score.toFixed(2)} — «${p.heard}»`));
  ok('Голос громче музыки (стемы, окна реплик) ≥ 12 дБ', r.voice_over_music_db >= 12, `${r.voice_over_music_db.toFixed(1)} дБ`);
  ok('Вне реплик голосовая дорожка тихая (нет «фиктивного» голоса)', r.silence_ok, '');
}

(async () => {
  fs.mkdirSync(path.join(__dirname, 'build'), { recursive: true });
  checkLogic();
  const browser = await chromium.launch();
  await checkVideo(browser);
  await checkInteractive(browser);
  await browser.close();
  checkMp4();
  checkVoiceInMp4();
  const failed = results.filter((r) => !r.pass);
  const md = ['# Отчёт проверки', '', `Дата: ${new Date().toISOString()}`, '', '| Проверка | Результат | Детали |', '|---|---|---|',
    ...results.map((r) => `| ${r.name} | ${r.pass ? '✅' : '❌'} | ${r.detail.replace(/\|/g, '/')} |`), '',
    failed.length ? `**Провалено: ${failed.length}**` : `**Все ${results.length} проверок пройдены.**`, ''];
  fs.writeFileSync(path.join(__dirname, 'VERIFICATION.md'), md.join('\n'));
  console.log(failed.length ? `\n✘ Провалено: ${failed.length}` : `\n✔ Все ${results.length} проверок пройдены`);
  process.exit(failed.length ? 1 : 0);
})();
