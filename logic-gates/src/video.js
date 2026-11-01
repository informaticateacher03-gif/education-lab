/*
 * video.js — детерминированный таймлайн ролика 1080×1920.
 * renderFrame(ctx, t) рисует кадр для момента t (сек) без внутреннего состояния,
 * поэтому любой кадр можно отрендерить независимо (покадровый экспорт).
 */
(function (root) {
  'use strict';
  const LC = root.LogicCore;
  const { C, GATE, GATES, TIMING, clamp, lerp, easeOut, easeBack, smooth, bump, text, richText, wrap, valColor } = LC;

  const W = 1080, H = 1920, FPS = 30;

  // Тайминг берётся из src/voice-timing.js (сгенерирован под длительности озвучки).
  // Без него — исходная немая версия 56 с.
  const VT = root.VOICE_TIMING || null;
  const SEGMENTS = VT ? VT.segments : [
    { type: 'intro', start: 0, end: 4 },
    { type: 'gate', id: 'AND', start: 4, end: 11 },
    { type: 'gate', id: 'OR', start: 11, end: 18 },
    { type: 'gate', id: 'NOT', start: 18, end: 23 },
    { type: 'gate', id: 'NAND', start: 23, end: 29 },
    { type: 'gate', id: 'NOR', start: 29, end: 35 },
    { type: 'gate', id: 'XOR', start: 35, end: 42 },
    { type: 'gate', id: 'XNOR', start: 42, end: 49 },
    { type: 'final', start: 49, end: 56 },
  ];
  const DURATION = VT ? VT.duration : 56;
  const SUBS = VT ? VT.subs : [];
  const GATE_ORDER = SEGMENTS.filter((s) => s.type === 'gate').map((s) => s.id);

  // ------------------------------------------------ расписание шагов вентиля
  const STEP_START = 1.15, TAIL = 0.5;
  function gateSteps(seg) {
    const g = GATE[seg.id];
    const cs = LC.combos(g);
    const D = seg.end - seg.start;
    const dur = (D - STEP_START - TAIL) / cs.length;
    return cs.map((vals, k) => ({
      k, vals, out: LC.evalGate(g, vals),
      t: STEP_START + k * dur,            // локальное время переключения входов
      flip: STEP_START + k * dur + TIMING.FLIP, // локальное время смены выхода
    }));
  }

  // финальная композиция: общий цикл комбинаций для всех 7 схем
  const FINAL = Object.assign({ rowsIn: 0.12, comboStart: 1.3, comboDur: 1.1, textAt: 2.3, footAt: 3.1 }, VT ? VT.final : {});
  const BASE_COMBOS = [[0, 0], [0, 1], [1, 0], [1, 1]];
  function finalSteps() {
    const fin = SEGMENTS[SEGMENTS.length - 1];
    const n = Math.floor((fin.end - fin.start - FINAL.comboStart - 0.4) / FINAL.comboDur) + 1;
    return Array.from({ length: n }, (_, k) => ({ k, vals: BASE_COMBOS[k % 4], t: FINAL.comboStart + k * FINAL.comboDur }));
  }

  /** Список всех шагов в глобальном времени — для звука и проверки. */
  function timeline() {
    const out = [];
    SEGMENTS.forEach((s) => {
      if (s.type === 'gate') {
        gateSteps(s).forEach((st) => out.push({
          gate: s.id, k: st.k, vals: st.vals, out: st.out,
          t: s.start + st.t, flip: s.start + st.flip, segEnd: s.end,
        }));
      }
    });
    return out;
  }

  function audioEvents() {
    const ev = [];
    ev.push({ t: 0.25, type: 'power' });
    if (!VT) ev.push({ t: 1.9, type: 'chime' });
    SEGMENTS.forEach((s) => { if (s.type !== 'intro') ev.push({ t: s.start + 0.05, type: 'whoosh' }); });
    timeline().forEach((st) => {
      ev.push({ t: st.t, type: 'click' });
      ev.push({ t: st.flip, type: st.out ? 'hi' : 'lo' });
    });
    const fin = SEGMENTS[SEGMENTS.length - 1];
    finalSteps().forEach((st) => ev.push({ t: fin.start + st.t, type: 'click' }));
    ev.push({ t: fin.start + FINAL.textAt, type: 'chime' });
    if (VT) VT.phrases.forEach((p) => ev.push({ t: p.start, type: 'voice', file: p.file, dur: p.dur }));
    return ev.sort((a, b) => a.t - b.t);
  }

  // ------------------------------------------------ общие элементы
  function progressDots(ctx, idx, a) {
    ctx.save(); ctx.globalAlpha *= a;
    text(ctx, `ЭЛЕМЕНТ ${idx + 1} / 7`, W / 2, 112, { size: 26, weight: 600, color: '#8d96c4' });
    const n = 7, gap = 34, x0 = W / 2 - (gap * (n - 1)) / 2;
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.fillStyle = i === idx ? C.name : i < idx ? '#6b7299' : '#2c3150';
      if (i === idx) { ctx.shadowColor = C.name; ctx.shadowBlur = 14; }
      ctx.arc(x0 + i * gap, 152, i === idx ? 8 : 6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  /** Таблица истинности (горизонтальная: строки A, B, OUT; столбцы — комбинации). */
  function truthTable(ctx, g, o) {
    // o: x, y, colW, headW, rowH, size, filled(k) -> {in:bool,out:bool,popIn,popOut}, active, activeGlow
    const cs = LC.combos(g);
    const rows = g.inputs === 1 ? ['A', 'OUT'] : ['A', 'B', 'OUT'];
    const totalW = o.headW + o.colW * cs.length;
    const totalH = o.rowH * rows.length;
    const x = o.x, y = o.y;
    // подложка
    ctx.save();
    ctx.fillStyle = 'rgba(8,11,28,0.82)';
    roundRect(ctx, x, y, totalW, totalH, o.radius || 14); ctx.fill();
    // активный столбец
    if (o.active != null && o.active >= 0) {
      const ax = x + o.headW + o.active * o.colW;
      ctx.fillStyle = 'rgba(255,210,58,0.13)';
      ctx.fillRect(ax, y, o.colW, totalH);
      ctx.strokeStyle = LC.hexA(C.name, 0.55 + 0.45 * (o.activeGlow || 0));
      ctx.lineWidth = 3; ctx.shadowColor = C.name; ctx.shadowBlur = 12 + 14 * (o.activeGlow || 0);
      ctx.strokeRect(ax + 1.5, y + 1.5, o.colW - 3, totalH - 3);
      ctx.shadowBlur = 0;
    }
    // сетка
    ctx.strokeStyle = 'rgba(130,145,230,0.32)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let r = 1; r < rows.length; r++) { ctx.moveTo(x, y + r * o.rowH); ctx.lineTo(x + totalW, y + r * o.rowH); }
    for (let c = 0; c < cs.length; c++) { const cx = x + o.headW + c * o.colW; ctx.moveTo(cx, y); ctx.lineTo(cx, y + totalH); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(130,145,230,0.45)';
    roundRect(ctx, x, y, totalW, totalH, o.radius || 14); ctx.stroke();
    // OUT-строка выделена тонкой линией сверху
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.moveTo(x, y + (rows.length - 1) * o.rowH); ctx.lineTo(x + totalW, y + (rows.length - 1) * o.rowH); ctx.stroke();
    // заголовки
    rows.forEach((r, ri) => text(ctx, r, x + 22, y + (ri + 0.5) * o.rowH, { size: o.size * 0.82, color: C.label, align: 'left' }));
    // значения
    cs.forEach((vals, c) => {
      const f = o.filled(c);
      const cx = x + o.headW + (c + 0.5) * o.colW;
      rows.forEach((r, ri) => {
        const isOut = r === 'OUT';
        const show = isOut ? f.out : f.in;
        if (!show) return;
        const v = isOut ? LC.evalGate(g, vals) : vals[ri];
        const pop = isOut ? (f.popOut || 0) : (f.popIn || 0);
        const s = 1 + 0.45 * pop;
        ctx.save();
        ctx.translate(cx, y + (ri + 0.5) * o.rowH); ctx.scale(s, s);
        text(ctx, String(v), 0, 0, { size: o.size, color: valColor(v), glow: isOut ? 12 + 20 * pop : 6, mono: true });
        ctx.restore();
      });
    });
    ctx.restore();
    return { w: totalW, h: totalH };
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  function formulaSegs(g) {
    return [{ t: 'OUT = ', color: C.label }, { t: g.expr.replace('·', ' · ').replace('+', ' + ').replace('⊕', ' ⊕ '), color: C.nameSoft, over: g.inv }];
  }

  // ------------------------------------------------ сцены
  // Детерминированный «бинарный дождь» для заставки.
  function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function binaryRain(ctx, t, a) {
    ctx.save();
    const cols = 18;
    for (let c = 0; c < cols; c++) {
      const x = 30 + c * (W - 60) / (cols - 1);
      const speed = 140 + 160 * hash(c);
      const off = hash(c + 50) * H;
      for (let j = 0; j < 14; j++) {
        const y = ((off + t * speed + j * 150) % (H + 150)) - 75;
        const bit = hash(c * 31 + j + Math.floor(t * 2 + hash(j) * 5)) > 0.5 ? 1 : 0;
        ctx.globalAlpha = a * (0.08 + 0.14 * hash(c * 7 + j));
        text(ctx, String(bit), x, y, { size: 30, weight: 600, color: bit ? C.one : C.zero, mono: true });
      }
    }
    ctx.restore();
  }

  function drawIntro(ctx, t, seg) {
    const u = t - seg.start, D = seg.end - seg.start;
    const fade = Math.min(smooth(0, 0.4, u), 1 - smooth(D - 0.4, D, u));
    ctx.save(); ctx.globalAlpha = fade;
    binaryRain(ctx, t, smooth(0, 1.2, u));

    // заголовок «печатается» по буквам
    const l1 = 'КАК КОМПЬЮТЕР', l2 = 'ДУМАЕТ?';
    const total = l1.length + l2.length;
    const nShown = Math.floor(clamp((u - 0.3) / 1.3) * total);
    const s1 = l1.slice(0, Math.min(nShown, l1.length));
    const s2 = l2.slice(0, Math.max(0, nShown - l1.length));
    const titleY = 640;
    const flick = 0.85 + 0.15 * Math.sin(u * 30) * (u < 1.8 ? 1 : 0);
    ctx.save(); ctx.globalAlpha *= flick;
    // для стабильной центровки меряем полную строку и рисуем слева
    ctx.font = `800 104px ${LC.FONT}`;
    const w1 = ctx.measureText(l1).width, w2 = ctx.measureText(l2).width;
    if (s1) text(ctx, s1, W / 2 - w1 / 2, titleY, { size: 104, weight: 800, color: '#ffffff', glow: 34, glowColor: '#6f9bff', align: 'left' });
    if (s2) text(ctx, s2, W / 2 - w2 / 2, titleY + 125, { size: 104, weight: 800, color: C.name, glow: 34, align: 'left' });
    ctx.restore();

    // подзаголовок
    const sa = smooth(1.8, 2.3, u);
    if (sa > 0) {
      ctx.save(); ctx.globalAlpha *= sa;
      richText(ctx, [
        { t: 'ВСЕГО ДВА СИГНАЛА: ', color: C.text },
        { t: '0', color: C.zero, glow: 22 }, { t: ' И ', color: C.text }, { t: '1', color: C.one, glow: 22 },
      ], W / 2, 920 + (1 - easeOut(sa)) * 30, { size: 56, weight: 700, maxWidth: 980 });
      ctx.restore();
    }

    // поток битов по проводу
    const wa = smooth(2.2, 2.7, u);
    if (wa > 0) {
      ctx.save(); ctx.globalAlpha *= wa;
      const y = 1180;
      LC.line(ctx, 80, y, 80 + (W - 160) * easeOut(wa), y, '#39406a', 6, 0);
      const bits = [1, 0, 1, 1, 0, 1, 0, 0, 1];
      bits.forEach((b, i) => {
        const x = 80 + ((u - 2.2) * 420 + i * 120) % (W - 160);
        LC.pulse(ctx, x, y, 1, b, 0.7);
        text(ctx, String(b), x, y - 52, { size: 40, color: valColor(b), glow: 16, mono: true });
      });
      // две лампочки-легенды
      LC.lamp(ctx, W / 2 - 170, 1360, 0, t, null, 34);
      LC.lamp(ctx, W / 2 + 170, 1360, 1, t, null, 34);
      text(ctx, '0 — НЕТ ТОКА', W / 2 - 170, 1450, { size: 32, color: C.zero });
      text(ctx, '1 — ЕСТЬ ТОК', W / 2 + 170, 1450, { size: 32, color: C.one });
      ctx.restore();
    }
    ctx.restore();
  }

  // Положение схемы в режиме «фокус» (одна схема на экране)
  const FOCUS = { scale: 1.42, cy: 700 };
  // таблица истинности в сцене схемы
  const TABLE = { y: 1015, rowH: 96, colW: 180, headW: 210, size: 60 };
  function focusTransform(ctx) {
    const box = LC.CIRCUIT_BOX;
    const cx = (box.x0 + box.x1) / 2;
    ctx.translate(W / 2 - cx * FOCUS.scale, FOCUS.cy);
    ctx.scale(FOCUS.scale, FOCUS.scale);
  }
  function lampScreen() {
    const box = LC.CIRCUIT_BOX;
    const cx = (box.x0 + box.x1) / 2;
    return { x: W / 2 + (LC.LAYOUT.lampX - cx) * FOCUS.scale, y: FOCUS.cy };
  }

  /** Состояние вентиля в момент локального времени u. */
  function gateState(seg, u) {
    const steps = gateSteps(seg);
    let cur = -1;
    steps.forEach((s, i) => { if (u >= s.t) cur = i; });
    const st = cur >= 0 ? steps[cur] : null;
    return {
      steps, cur, vals: st ? st.vals : null,
      prev: cur > 0 ? steps[cur - 1].vals : null,
      tIn: st ? u - st.t : 99,
    };
  }

  const info = { last: null };

  function drawGateSeg(ctx, t, seg) {
    const g = GATE[seg.id];
    const idx = GATE_ORDER.indexOf(seg.id);
    const u = t - seg.start, D = seg.end - seg.start;
    const fadeOut = 1 - smooth(D - 0.38, D, u);
    const fadeIn = smooth(0, 0.25, u);
    const lift = (1 - fadeOut) * -40;
    ctx.save();
    ctx.globalAlpha = Math.min(fadeIn, fadeOut);
    ctx.translate(0, lift);

    progressDots(ctx, idx, smooth(0, 0.3, u));

    // 1) название
    const na = easeBack(clamp(u / 0.45));
    ctx.save();
    ctx.globalAlpha *= clamp(u / 0.25);
    ctx.translate(W / 2, 262); ctx.scale(0.6 + 0.4 * na, 0.6 + 0.4 * na);
    text(ctx, g.id, 0, 0, { size: 128, weight: 900, color: C.name, glow: 30 });
    ctx.restore();
    const ra = smooth(0.2, 0.55, u);
    ctx.save(); ctx.globalAlpha *= ra;
    text(ctx, `«${g.ru.toUpperCase()}»`, W / 2, 360 + (1 - ra) * 20, { size: 56, weight: 800, color: C.nameSoft, glow: 12, maxWidth: 900 });
    ctx.restore();
    // ГОСТ-значок
    const ga = smooth(0.6, 1.0, u);
    if (ga > 0) { ctx.save(); ctx.globalAlpha *= ga * 0.9; LC.gostBadge(ctx, g, 940, 250, 0.95); ctx.restore(); }

    // подпись
    const ca = smooth(0.45, 0.85, u);
    if (ca > 0) {
      ctx.save(); ctx.globalAlpha *= ca;
      const o = { size: 44, weight: 600 };
      const lines = wrap(ctx, g.caption, 940, o);
      lines.forEach((ln, i) => text(ctx, ln, W / 2, 452 + i * 56 + (1 - ca) * 16, { size: 44, weight: 600, color: C.text, maxWidth: 960 }));
      ctx.restore();
    }

    // 2–6) схема
    const st = gateState(seg, u);
    ctx.save();
    focusTransform(ctx);
    const res = LC.drawCircuit(ctx, g, {
      reveal: smooth(0.2, 0.95, u),
      io: smooth(0.6, 1.05, u),
      vals: st.vals, prev: st.prev, tIn: st.tIn, time: t,
    });
    ctx.restore();

    // строка состояния
    const ea = smooth(0.9, 1.2, u);
    if (ea > 0) {
      ctx.save(); ctx.globalAlpha *= ea;
      const segs = [];
      const v = st.vals;
      const vs = (x) => (x == null ? { t: '?', color: '#59607d' } : { t: String(x), color: valColor(x), glow: 14 });
      segs.push({ t: 'A = ', color: C.label }, vs(v ? v[0] : null));
      if (g.inputs === 2) segs.push({ t: '   B = ', color: C.label }, vs(v ? v[1] : null));
      segs.push({ t: '   →   OUT = ', color: C.label }, vs(res.outShown));
      richText(ctx, segs, W / 2, 962, { size: 50, weight: 700, mono: true, maxWidth: 980 });
      ctx.restore();
    }

    // 7–9) таблица истинности: «въезжает» справа, заполняется по шагам
    const tp = easeOut(smooth(0.7, 1.15, u));
    if (tp > 0) {
      const cs = LC.combos(g);
      const colW = TABLE.colW, headW = TABLE.headW;
      const tw = headW + colW * cs.length;
      ctx.save(); ctx.globalAlpha *= tp;
      truthTable(ctx, g, {
        x: (W - tw) / 2 + (1 - tp) * 520, y: TABLE.y, colW, headW, rowH: TABLE.rowH, size: TABLE.size,
        active: st.cur, activeGlow: st.vals ? bump(st.tIn / 0.5) : 0,
        filled: (k) => {
          const s = st.steps[k];
          return {
            in: u >= s.t, out: u >= s.flip,
            popIn: bump((u - s.t) / 0.3), popOut: bump((u - s.flip) / 0.35),
          };
        },
      });
      ctx.restore();
    }

    // формула
    const fa = smooth(1.2, 1.6, u);
    if (fa > 0) {
      ctx.save(); ctx.globalAlpha *= fa;
      const tableBottom = TABLE.y + TABLE.rowH * (g.inputs === 1 ? 2 : 3);
      richText(ctx, formulaSegs(g), W / 2, tableBottom + 78, { size: 60, weight: 800, glow: 10, maxWidth: 900 });
      if (!VT) text(ctx, g.rule, W / 2, tableBottom + 170, { size: 34, weight: 600, color: '#8d96c4', maxWidth: 960 });
      ctx.restore();
    }

    ctx.restore();
    info.last = { seg: seg.id, vals: st.vals, outShown: res.outShown, out: res.out, step: st.cur, tIn: st.tIn };
  }

  // ------------------------------------------------ финал: все 7 схем
  const ROWS = { y0: 196, h: 168, scale: 0.55, gateCx: 245, tableX: 488 };

  function finalState(u) {
    const steps = finalSteps();
    let cur = -1;
    steps.forEach((s, i) => { if (u >= s.t) cur = i; });
    return {
      cur, vals: cur >= 0 ? steps[cur].vals : null,
      prev: cur > 0 ? steps[cur - 1].vals : null, tIn: cur >= 0 ? u - steps[cur].t : 99,
    };
  }

  function drawFinal(ctx, t, seg, opts = {}) {
    const u = t - seg.start;
    const fs = finalState(u);
    ctx.save();
    ctx.globalAlpha = smooth(0, 0.3, u);
    text(ctx, opts.title || '7 ЛОГИЧЕСКИХ ЭЛЕМЕНТОВ', W / 2, 110, { size: opts.titleSize || 52, weight: 900, color: C.name, glow: 22, maxWidth: 1000 });
    ctx.restore();

    const ord = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR'];
    const rowInfo = [];
    ord.forEach((id, i) => {
      const g = GATE[id];
      const a = easeOut(clamp((u - i * FINAL.rowsIn) / 0.5));
      if (a <= 0) return;
      const yc = ROWS.y0 + ROWS.h * (i + 0.5);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(0, (1 - a) * 36);
      // разделитель
      if (i > 0) {
        const gr = ctx.createLinearGradient(40, 0, W - 40, 0);
        gr.addColorStop(0, 'rgba(110,130,255,0)'); gr.addColorStop(0.5, 'rgba(110,130,255,0.35)'); gr.addColorStop(1, 'rgba(110,130,255,0)');
        ctx.fillStyle = gr; ctx.fillRect(40, yc - ROWS.h / 2, W - 80, 2);
      }
      // схема
      const vals = fs.vals ? (g.inputs === 1 ? [fs.vals[0]] : fs.vals) : null;
      const prev = fs.prev ? (g.inputs === 1 ? [fs.prev[0]] : fs.prev) : null;
      // для NOT смена входа A происходит не на каждом шаге — тогда импульса нет
      const changed = !prev || prev.some((v, k) => v !== vals[k]);
      ctx.save();
      const box = LC.CIRCUIT_BOX;
      ctx.translate(ROWS.gateCx - ((box.x0 + box.x1) / 2) * ROWS.scale, yc + 8);
      ctx.scale(ROWS.scale, ROWS.scale);
      const r = LC.drawCircuit(ctx, g, { vals, prev: changed ? prev : vals, tIn: changed ? fs.tIn : 99, time: t + i * 0.3 });
      ctx.restore();
      // название и таблица
      const label = `${g.id} — ${g.ru.toUpperCase()}`;
      text(ctx, label, ROWS.tableX, yc - 58, { size: 32, weight: 800, color: C.name, align: 'left', glow: 8, maxWidth: 560 });
      const cs = LC.combos(g);
      const active = vals ? cs.findIndex((c) => c.every((v, k) => v === vals[k])) : -1;
      const colW = 112, headW = 92;
      truthTable(ctx, g, {
        x: ROWS.tableX, y: yc - 34, colW, headW, rowH: g.inputs === 1 ? 50 : 36, size: 30, radius: 8,
        active, activeGlow: changed ? bump(fs.tIn / 0.5) : 0,
        filled: () => ({ in: true, out: true }),
      });
      rowInfo.push({ id, vals, out: r.out, outShown: r.outShown, active });
      ctx.restore();
    });

    // финальный текст
    const ta = smooth(FINAL.textAt, FINAL.textAt + 0.6, u);
    if (ta > 0 && !opts.noText) {
      ctx.save(); ctx.globalAlpha = ta;
      const y = 1440 + (1 - easeOut(ta)) * 30;
      const s = 1 + 0.03 * Math.sin(t * 3);
      ctx.translate(W / 2, y); ctx.scale(s, s);
      richText(ctx, [
        { t: '0', color: C.zero, glow: 30 }, { t: ' И ', color: '#ffffff' }, { t: '1', color: C.one, glow: 30 },
        { t: ' —', color: '#ffffff' },
      ], 0, 0, { size: 76, weight: 900, glow: 16 });
      text(ctx, 'ОСНОВА ЦИФРОВОГО МИРА', 0, 88, { size: 64, weight: 900, color: '#ffffff', glow: 26, glowColor: '#6f9bff', maxWidth: 980 });
      ctx.restore();
    }
    const fa = smooth(FINAL.footAt, FINAL.footAt + 0.6, u);
    if (fa > 0 && !opts.noText) {
      ctx.save(); ctx.globalAlpha = fa;
      LC.line(ctx, W / 2 - 300 * fa, 1640, W / 2 + 300 * fa, 1640, C.name, 3, 12);
      text(ctx, 'ИНФОРМАТИКА С АННОЙ КОЛТУНОВОЙ', W / 2, 1690, { size: 40, weight: 800, color: C.nameSoft, glow: 10, maxWidth: 980 });
      ctx.restore();
    }
    info.last = { seg: 'FINAL', rows: rowInfo, step: fs.cur };
  }

  // ------------------------------------------------ главный вход
  function segmentAt(t) {
    for (const s of SEGMENTS) if (t >= s.start && t < s.end) return s;
    return SEGMENTS[SEGMENTS.length - 1];
  }

  // ------------------------------------------------ субтитры
  function subtitleAt(t) {
    for (const s of SUBS) if (t >= s.start && t < s.end) return s;
    return null;
  }
  function drawSubtitle(ctx, t, seg) {
    const s = subtitleAt(t);
    if (!s) return null;
    const a = Math.min(smooth(s.start, s.start + 0.12, t), 1 - smooth(s.end - 0.12, s.end, t));
    const o = { size: 46, weight: 700 };
    const side = seg.type === 'gate' && FIGURE_ON;
    const fs = side ? 42 : 46;
    o.size = fs;
    const lines = wrap(ctx, s.text, side ? 580 : 900, o);
    const lh = side ? 54 : 58;
    const cy = seg.type === 'final' ? 1475 : side ? 1590 : 1640;
    const cx = side ? 352 : W / 2;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = `700 ${fs}px ${LC.FONT}`;
    const bw = Math.min(side ? 640 : 1000, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 56);
    const bh = lines.length * lh + 26;
    ctx.fillStyle = 'rgba(2,3,10,0.72)';
    roundRect(ctx, cx - bw / 2, cy - bh / 2, bw, bh, 18); ctx.fill();
    ctx.strokeStyle = 'rgba(130,145,230,0.35)'; ctx.lineWidth = 2; ctx.stroke();
    lines.forEach((ln, i) => {
      const y = cy - ((lines.length - 1) * lh) / 2 + i * lh;
      // английские названия элементов — жёлтым, как на схемах
      const segs = ln.split(/(\b(?:XNOR|XOR|NAND|NOR|AND|OR|NOT)\b)/).filter(Boolean)
        .map((w) => (/^(XNOR|XOR|NAND|NOR|AND|OR|NOT)$/.test(w) ? { t: w, color: C.name, glow: 8 } : { t: w, color: '#ffffff' }));
      richText(ctx, segs, cx, y, { size: fs, weight: 700, maxWidth: side ? 600 : 960 });
    });
    ctx.restore();
    return s.text;
  }

  // ------------------------------------------------ аватар ведущей
  // Заставка: фигура по пояс крупно. Сцены схем: фигура в левом нижнем углу,
  // лазерная указка от стилуса показывает то, что происходит на схеме.
  // Финал: лицо в круге у заголовка. Свечение/эквалайзер — по громкости голоса.
  const AVATAR_IMG = (typeof document !== 'undefined' && document.getElementById('avatar')) || null;
  const AVATAR_HALF = (typeof document !== 'undefined' && document.getElementById('avatarHalf')) || null;
  const FIGURE_ON = !!(AVATAR_HALF && root.AVATAR_HALF_SRC);
  const ENV = root.VOICE_ENV || null;
  function voiceLevel(t) {
    if (!ENV) return 0;
    const i = t * ENV.fps, i0 = Math.floor(i), f = i - i0;
    const a = ENV.data[i0] || 0, b = ENV.data[i0 + 1] || 0;
    return (a + (b - a) * f) / 100;
  }
  // исходник обрезки «по пояс»: 680×720; кончик стилуса (213,242), центр лица (328,160)
  const SRC = { w: 680, h: 720, pen: { x: 213, y: 242 } };
  const FIG = {
    intro: { cx: W / 2, bottom: 582, h: 560 },
    gate: { cx: 868, bottom: 1925, h: 480 },
  };
  function figurePose(t) {
    const seg = segmentAt(t);
    if (seg.type === 'intro') return { ...FIG.intro, a: Math.min(smooth(0.05, 0.8, t), 1) };
    if (seg.type === 'gate') {
      const idx = SEGMENTS.indexOf(seg);
      if (SEGMENTS[idx - 1] && SEGMENTS[idx - 1].type === 'intro') {
        const k = LC.easeInOut((t - seg.start) / 0.9);
        return { cx: lerp(FIG.intro.cx, FIG.gate.cx, k), bottom: lerp(FIG.intro.bottom, FIG.gate.bottom, k),
          h: lerp(FIG.intro.h, FIG.gate.h, k), a: 1 };
      }
      return { ...FIG.gate, a: 1 };
    }
    return { ...FIG.gate, a: 1 - smooth(seg.start, seg.start + 0.45, t) };
  }
  function penTip(p) {
    const w = p.h * SRC.w / SRC.h;
    return { x: p.cx - w / 2 + SRC.pen.x / SRC.w * w, y: p.bottom - p.h + SRC.pen.y / SRC.h * p.h };
  }

  let halfCanvas = null;
  function figureCanvas() {
    if (halfCanvas) return halfCanvas;
    const h = 560, w = Math.round(h * SRC.w / SRC.h);
    halfCanvas = document.createElement('canvas');
    halfCanvas.width = w; halfCanvas.height = h;
    const hc = halfCanvas.getContext('2d');
    hc.drawImage(AVATAR_HALF, 0, 0, w, h);
    hc.globalCompositeOperation = 'destination-in';
    const gv = hc.createLinearGradient(0, 0, 0, h);
    gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.1, 'rgba(0,0,0,1)'); gv.addColorStop(0.72, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,0)');
    hc.fillStyle = gv; hc.fillRect(0, 0, w, h);
    const gh = hc.createLinearGradient(0, 0, w, 0);
    gh.addColorStop(0, 'rgba(0,0,0,0)'); gh.addColorStop(0.12, 'rgba(0,0,0,1)'); gh.addColorStop(0.88, 'rgba(0,0,0,1)'); gh.addColorStop(1, 'rgba(0,0,0,0)');
    hc.fillStyle = gh; hc.fillRect(0, 0, w, h);
    return halfCanvas;
  }

  function drawFigure(ctx, t, seg) {
    if (!FIGURE_ON || !AVATAR_HALF.naturalWidth) return null;
    const p = figurePose(t);
    let a = p.a;
    if (seg.type === 'intro') a = Math.min(a, 1); // заставка переходит в схему без затемнения фигуры
    if (a <= 0) return null;
    const lv = voiceLevel(t);
    const cv = figureCanvas();
    const w = p.h * SRC.w / SRC.h;
    ctx.save();
    ctx.globalAlpha = a;
    // свечение за фигурой — в такт голосу
    const cy = p.bottom - p.h * 0.55;
    const R = p.h * (0.6 + 0.1 * lv);
    const gr = ctx.createRadialGradient(p.cx, cy, 10, p.cx, cy, R);
    gr.addColorStop(0, LC.hexA('#3d6bff', 0.26 + 0.4 * lv)); gr.addColorStop(0.6, LC.hexA('#7a3dff', 0.1 + 0.2 * lv)); gr.addColorStop(1, LC.hexA('#7a3dff', 0));
    ctx.fillStyle = gr; ctx.fillRect(p.cx - R, cy - R, 2 * R, 2 * R);
    // лёгкое «дыхание» и покачивание при речи
    const z = 1 + 0.012 * Math.sin(t * 0.9) + 0.012 * lv;
    const rot = 0.006 * Math.sin(t * 1.3) * (0.4 + lv);
    const yIn = seg.type === 'intro' ? (1 - easeOut(smooth(0.05, 0.9, t))) * 40 : 0;
    ctx.translate(p.cx, p.bottom + yIn); ctx.rotate(rot); ctx.scale(z, z);
    ctx.drawImage(cv, -w / 2, -p.h, w, p.h);
    ctx.restore();
    if (seg.type === 'intro') {
      const la = Math.min(smooth(0.5, 1.0, t), 1 - smooth(seg.end - 0.5, seg.end, t));
      ctx.save(); ctx.globalAlpha = la;
      text(ctx, 'Анна Колтунова', W / 2, p.bottom - 22, { size: 34, weight: 800, color: C.nameSoft, glow: 10, glowColor: '#000000' });
      ctx.restore();
    }
    return p;
  }

  // ---- лазерная указка
  function focusPt(lx, ly) {
    const box = LC.CIRCUIT_BOX;
    const cxb = (box.x0 + box.x1) / 2;
    return { x: W / 2 + (lx - cxb) * FOCUS.scale, y: FOCUS.cy + ly * FOCUS.scale };
  }
  /** Ключевые точки указки в сцене схемы: корпус → входы → лампа → ячейка OUT, для каждого шага. */
  function pointerKeys(seg) {
    const g = GATE[seg.id];
    const G = LC.geom(g);
    const L = LC.LAYOUT;
    const n = LC.combos(g).length;
    const rows = g.inputs === 1 ? 2 : 3;
    const tw = TABLE.headW + TABLE.colW * n;
    const keys = [{ t: 0.55, p: focusPt(G.textX, 0), what: 'gate' }];
    gateSteps(seg).forEach((s, k) => {
      keys.push({ t: s.t - 0.12, p: focusPt(L.nodeX, 0), what: 'inputs', k });
      keys.push({ t: s.flip - 0.12, p: focusPt(L.lampX, 0), what: 'lamp', k });
      keys.push({ t: s.flip + 0.3, p: { x: (W - tw) / 2 + TABLE.headW + (k + 0.5) * TABLE.colW, y: TABLE.y + (rows - 0.5) * TABLE.rowH }, what: 'table', k });
    });
    return keys;
  }
  function pointerAt(seg, u) {
    const keys = pointerKeys(seg);
    let i = -1;
    keys.forEach((k, j) => { if (u >= k.t) i = j; });
    if (i < 0) return null;
    const cur = keys[i], prev = keys[Math.max(0, i - 1)];
    const k = LC.easeInOut((u - cur.t) / 0.22);
    return { x: lerp(prev.p.x, cur.p.x, k), y: lerp(prev.p.y, cur.p.y, k), what: cur.what, k: cur.k, settle: k };
  }
  function drawPointer(ctx, t, seg, fig) {
    if (!fig || seg.type !== 'gate') return null;
    const u = t - seg.start, D = seg.end - seg.start;
    const a = Math.min(smooth(0.45, 0.75, u), 1 - smooth(D - 0.45, D - 0.1, u));
    const tg = pointerAt(seg, u);
    if (!tg || a <= 0) return null;
    const P = penTip(fig);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.lineCap = 'round';
    // кольцо-мишень обводит объект снаружи и не закрывает его
    const pulse = 0.5 + 0.5 * Math.sin(t * 8);
    const base = { gate: 78, inputs: 40, lamp: 58, table: 46 }[tg.what] || 40;
    const rr = base + 5 * pulse + (1 - tg.settle) * 14;
    const dx = tg.x - P.x, dy = tg.y - P.y, dl = Math.hypot(dx, dy) || 1;
    const ex = tg.x - dx / dl * rr, ey = tg.y - dy / dl * rr;
    // луч — до края кольца
    const gr = ctx.createLinearGradient(P.x, P.y, ex, ey);
    gr.addColorStop(0, 'rgba(255,240,170,1)'); gr.addColorStop(1, 'rgba(255,210,58,0.75)');
    ctx.strokeStyle = gr; ctx.lineWidth = 5; ctx.shadowColor = C.name; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(ex, ey); ctx.stroke();
    // огонёк на кончике стилуса
    const pg = ctx.createRadialGradient(P.x, P.y, 0, P.x, P.y, 18);
    pg.addColorStop(0, 'rgba(255,255,255,1)'); pg.addColorStop(0.4, LC.hexA(C.name, 0.8)); pg.addColorStop(1, LC.hexA(C.name, 0));
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(P.x, P.y, 18, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = LC.hexA(C.name, 0.9); ctx.lineWidth = 4; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(tg.x, tg.y, rr, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    return tg;
  }

  // ---- лицо в круге (финал)
  const CIRCLE = { x: 68, y: 110, r: 50 };
  function drawCircleAvatar(ctx, t, seg) {
    if (!AVATAR_IMG || !AVATAR_IMG.complete || !AVATAR_IMG.naturalWidth) return;
    const appear = smooth(seg.start + 0.2, seg.start + 0.8, t);
    if (appear <= 0) return;
    const p = CIRCLE;
    const lv = voiceLevel(t);
    const r = p.r * (0.92 + 0.08 * easeBack(appear)) * (1 + 0.025 * lv);
    ctx.save();
    ctx.globalAlpha = appear;
    const bars = 40;
    for (let i = 0; i < bars; i++) {
      const ang = (i / bars) * Math.PI * 2 - Math.PI / 2;
      const wob = 0.45 + 0.55 * Math.abs(Math.sin(i * 1.7 + t * 9) * Math.cos(i * 0.6 - t * 5.3));
      const len = r * (0.04 + 0.26 * lv * wob);
      ctx.strokeStyle = LC.hexA(i % 2 ? C.one : C.name, 0.35 + 0.65 * lv);
      ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x + Math.cos(ang) * (r + 6), p.y + Math.sin(ang) * (r + 6));
      ctx.lineTo(p.x + Math.cos(ang) * (r + 6 + len), p.y + Math.sin(ang) * (r + 6 + len));
      ctx.stroke();
    }
    ctx.shadowColor = '#b58cff'; ctx.shadowBlur = 20 + 24 * lv;
    ctx.fillStyle = '#1a1040';
    ctx.beginPath(); ctx.arc(p.x, p.y, r + 3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.save();
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.clip();
    const d = 2 * r * (1.04 + 0.02 * Math.sin(t * 0.9));
    ctx.drawImage(AVATAR_IMG, p.x - d / 2, p.y - d / 2, d, d);
    ctx.restore();
    ctx.lineWidth = 3;
    ctx.strokeStyle = lv > 0.05 ? LC.hexA(C.one, 0.55 + 0.45 * lv) : 'rgba(181,140,255,0.9)';
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function drawAvatar(ctx, t) {
    const seg = segmentAt(t);
    const fig = drawFigure(ctx, t, seg);
    const ptr = drawPointer(ctx, t, seg, fig);
    if (seg.type === 'final') drawCircleAvatar(ctx, t, seg);
    return ptr;
  }


  function renderFrame(ctx, t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    LC.background(ctx, W, H, t);
    const seg = segmentAt(t);
    if (seg.type === 'intro') { drawIntro(ctx, t, seg); info.last = { seg: 'INTRO' }; }
    else if (seg.type === 'gate') drawGateSeg(ctx, t, seg);
    else drawFinal(ctx, t, seg);
    ctx.globalAlpha = 1;
    info.last.pointer = drawAvatar(ctx, t);
    info.last.subtitle = drawSubtitle(ctx, t, seg);
    return info.last;
  }

  /** Обложка: заголовок + все 7 схем + слоган. */
  function renderPoster(ctx) {
    const fin = SEGMENTS[SEGMENTS.length - 1];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    LC.background(ctx, W, H, 1.3, 1.3);
    // показываем комбинацию A=1, B=0
    const t = fin.start + FINAL.comboStart + 2 * FINAL.comboDur + 0.9;
    drawFinal(ctx, t, fin, { title: 'КАК КОМПЬЮТЕР ДУМАЕТ?', titleSize: 66, noText: true });
    richText(ctx, [
      { t: 'ВСЕГО ДВА СИГНАЛА: ', color: '#ffffff' },
      { t: '0', color: C.zero, glow: 26 }, { t: ' И ', color: '#ffffff' }, { t: '1', color: C.one, glow: 26 },
    ], W / 2, 1450, { size: 64, weight: 900, maxWidth: 990 });
    text(ctx, '7 логических элементов за 1 минуту', W / 2, 1535, { size: 42, weight: 700, color: C.name, glow: 10 });
    LC.line(ctx, W / 2 - 300, 1620, W / 2 + 300, 1620, C.name, 3, 12);
    text(ctx, 'ИНФОРМАТИКА С АННОЙ КОЛТУНОВОЙ', W / 2, 1670, { size: 40, weight: 800, color: C.nameSoft, glow: 10 });
  }

  root.LogicVideo = {
    W, H, FPS, DURATION, SEGMENTS, renderFrame, renderPoster, timeline, audioEvents,
    gateSteps, finalSteps, lampScreen, pointerKeys, TABLE, FOCUS, ROWS, info, SUBS, VT, subtitleAt,
  };
})(typeof window !== 'undefined' ? window : globalThis);
