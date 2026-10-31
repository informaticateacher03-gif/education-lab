/*
 * logic-core.js — общее ядро для видео и интерактивной версии.
 * Логика вентилей, геометрия условных графических символов (ANSI/IEEE 91,
 * «distinctive shape»), отрисовка проводов, импульсов, ламп и текста.
 * Работает в браузере (window.LogicCore) и в Node (module.exports).
 */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------- цвета
  const C = {
    one: '#2bff6b',      // логическая 1 — зелёный
    zero: '#ff3546',     // логический 0 — красный
    name: '#ffd23a',     // названия операций — жёлтый
    nameSoft: '#ffe38a',
    label: '#ffffff',    // подписи A, B, OUT — белый
    idle: '#2c3350',     // провод без сигнала
    text: '#cfd6ff',
    bg: '#020308',
  };
  const THEMES = {
    blue:   { a: '#0b1a45', b: '#1d3b8f', stroke: '#6f9bff' },  // тёмно-синий
    purple: { a: '#240b55', b: '#4c22a6', stroke: '#b58cff' },  // фиолетовый
    indigo: { a: '#15125e', b: '#3130b0', stroke: '#9496ff' },  // сине-фиолетовый
  };
  const FONT = '"Inter","Segoe UI","DejaVu Sans","Helvetica Neue",Arial,sans-serif';
  const MONO = '"JetBrains Mono","DejaVu Sans Mono",Consolas,"Courier New",monospace';

  const valColor = (v) => (v === 1 ? C.one : v === 0 ? C.zero : C.idle);

  // ---------------------------------------------------------------- логика
  const GATES = [
    { id: 'AND', ru: 'И', inputs: 2, shape: 'and', inv: false, theme: 'blue',
      fn: (a, b) => (a && b ? 1 : 0), expr: 'A·B', gost: '&',
      caption: 'Оба условия должны выполняться',
      rule: 'Выход равен 1, только если оба входа равны 1' },
    { id: 'OR', ru: 'ИЛИ', inputs: 2, shape: 'or', inv: false, theme: 'purple',
      fn: (a, b) => (a || b ? 1 : 0), expr: 'A+B', gost: '1',
      caption: 'Достаточно одного условия',
      rule: 'Выход равен 1, если хотя бы один вход равен 1' },
    { id: 'NOT', ru: 'НЕ', inputs: 1, shape: 'not', inv: true, theme: 'blue',
      fn: (a) => (a ? 0 : 1), expr: 'A', gost: '1',
      caption: 'Меняет сигнал на противоположный',
      rule: 'Инвертирует входной сигнал: 0 → 1, 1 → 0' },
    { id: 'NAND', ru: 'И-НЕ', inputs: 2, shape: 'and', inv: true, theme: 'blue',
      fn: (a, b) => (a && b ? 0 : 1), expr: 'A·B', gost: '&',
      caption: 'Инверсия AND: 0 только когда оба входа равны 1',
      rule: 'Инверсия AND' },
    { id: 'NOR', ru: 'ИЛИ-НЕ', inputs: 2, shape: 'or', inv: true, theme: 'purple',
      fn: (a, b) => (a || b ? 0 : 1), expr: 'A+B', gost: '1',
      caption: 'Инверсия OR: 1 только когда оба входа равны 0',
      rule: 'Инверсия OR' },
    { id: 'XOR', ru: 'исключающее ИЛИ', inputs: 2, shape: 'xor', inv: false, theme: 'indigo',
      fn: (a, b) => (a !== b ? 1 : 0), expr: 'A⊕B', gost: '=1',
      caption: 'Выход равен 1, когда входы различаются',
      rule: 'Выход равен 1, когда входы различаются' },
    { id: 'XNOR', ru: 'равнозначность', inputs: 2, shape: 'xor', inv: true, theme: 'indigo',
      fn: (a, b) => (a === b ? 1 : 0), expr: 'A⊕B', gost: '=1',
      caption: 'Выход равен 1, когда входы одинаковые',
      rule: 'Выход равен 1, когда входы одинаковые' },
  ];
  const GATE = {};
  GATES.forEach((g) => { GATE[g.id] = g; });

  const combos = (g) => (g.inputs === 1 ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]]);
  const evalGate = (g, vals) => (g.inputs === 1 ? g.fn(vals[0]) : g.fn(vals[0], vals[1]));
  const truthTable = (g) => combos(g).map((v) => ({ in: v, out: evalGate(g, v) }));

  // ---------------------------------------------------------------- easing
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
  const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const easeBack = (t) => { t = clamp(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const bump = (t) => (t <= 0 || t >= 1 ? 0 : Math.sin(Math.PI * t));

  // Тайминги прохождения сигнала (сек): импульс по входному проводу,
  // затем по выходному. Выход переключается в момент IN + OUT.
  const TIMING = { IN: 0.36, OUT: 0.26 };
  TIMING.FLIP = TIMING.IN + TIMING.OUT;

  // ---------------------------------------------------------------- геометрия
  // Локальная система координат схемы: корпус примерно x∈[0..210], y∈[-80..80].
  const LAYOUT = { labelX: -250, nodeX: -172, nodeR: 24, lampX: 362, lampR: 28, bubbleR: 12 };

  function geom(g) {
    let tip, pinX, textX, len;
    switch (g.shape) {
      case 'and': tip = 180; pinX = 0; textX = 82; len = 620; break;
      case 'or':  tip = 190; pinX = 22.5; textX = 98; len = 600; break;
      case 'xor': tip = 210; pinX = 22.5; textX = 118; len = 620; break;
      case 'not': tip = 150; pinX = 0; textX = 50; len = 470; break;
    }
    const pins = g.inputs === 1 ? [{ x: pinX, y: 0 }] : [{ x: pinX, y: -40 }, { x: pinX, y: 40 }];
    const bubble = g.inv ? { x: tip + LAYOUT.bubbleR, r: LAYOUT.bubbleR } : null;
    const outStart = g.inv ? tip + 2 * LAYOUT.bubbleR : tip;
    return { tip, pinX, pins, bubble, outStart, textX, len };
  }

  function bodyPath(g) {
    const p = new Path2D();
    if (g.shape === 'and') {
      p.moveTo(0, -80); p.lineTo(100, -80);
      p.arc(100, 0, 80, -Math.PI / 2, Math.PI / 2);
      p.lineTo(0, 80); p.closePath();
    } else if (g.shape === 'or' || g.shape === 'xor') {
      const o = g.shape === 'xor' ? 20 : 0;
      p.moveTo(o, -80);
      p.quadraticCurveTo(o + 110, -80, o + 190, 0);
      p.quadraticCurveTo(o + 110, 80, o, 80);
      p.quadraticCurveTo(o + 60, 0, o, -80);
      p.closePath();
    } else if (g.shape === 'not') {
      p.moveTo(0, -70); p.lineTo(150, 0); p.lineTo(0, 70); p.closePath();
    }
    return p;
  }
  function xorExtraPath() {
    const p = new Path2D();
    p.moveTo(0, -80); p.quadraticCurveTo(60, 0, 0, 80);
    return p;
  }

  // ---------------------------------------------------------------- текст
  // Все надписи проходят через text(): шрифт подгоняется под maxWidth,
  // а при включённом трекинге экранные границы записываются для проверки.
  const tracker = { on: false, log: [], screenW: 1080, screenH: 1920 };

  function setFont(ctx, o) {
    ctx.font = `${o.weight || 700} ${o.size || 40}px ${o.mono ? MONO : FONT}`;
  }
  function track(ctx, x0, y0, x1, y1, str) {
    if (!tracker.on || ctx.globalAlpha < 0.02) return;
    const m = ctx.getTransform();
    const pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    tracker.log.push({ str, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) });
  }

  /** Рисует строку. opts: size, weight, color, align, glow, maxWidth, mono, spacing */
  function text(ctx, str, x, y, opts = {}) {
    const o = Object.assign({ size: 40, weight: 700, color: C.label, align: 'center', glow: 0 }, opts);
    setFont(ctx, o);
    let w = ctx.measureText(str).width;
    if (o.maxWidth && w > o.maxWidth) {
      o.size = Math.floor(o.size * o.maxWidth / w);
      setFont(ctx, o);
      w = ctx.measureText(str).width;
    }
    ctx.textAlign = o.align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = o.color;
    if (o.glow) { ctx.shadowColor = o.glowColor || o.color; ctx.shadowBlur = o.glow; }
    ctx.fillText(str, x, y);
    ctx.shadowBlur = 0;
    const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    track(ctx, x0, y - o.size * 0.6, x0 + w, y + o.size * 0.6, str);
    return w;
  }

  /** Строка из цветных сегментов [{t, color, over}] — over рисует черту инверсии. */
  function richText(ctx, segs, x, y, opts = {}) {
    const o = Object.assign({ size: 48, weight: 700, align: 'center', glow: 0 }, opts);
    setFont(ctx, o);
    let widths = segs.map((s) => ctx.measureText(s.t).width);
    let total = widths.reduce((a, b) => a + b, 0);
    if (o.maxWidth && total > o.maxWidth) {
      o.size = Math.floor(o.size * o.maxWidth / total);
      setFont(ctx, o);
      widths = segs.map((s) => ctx.measureText(s.t).width);
      total = widths.reduce((a, b) => a + b, 0);
    }
    let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
    const x0 = cx;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    segs.forEach((s, i) => {
      const col = s.color || o.color || C.label;
      ctx.fillStyle = col;
      if (o.glow || s.glow) { ctx.shadowColor = col; ctx.shadowBlur = s.glow || o.glow; }
      ctx.fillText(s.t, cx, y);
      if (s.over) {
        const pad = o.size * 0.06;
        ctx.fillRect(cx + pad, y - o.size * 0.66, widths[i] - 2 * pad, Math.max(3, o.size * 0.07));
      }
      ctx.shadowBlur = 0;
      cx += widths[i];
    });
    track(ctx, x0, y - o.size * 0.75, x0 + total, y + o.size * 0.6, segs.map((s) => s.t).join(''));
    return total;
  }

  /** Перенос строки по словам под ширину. */
  function wrap(ctx, str, maxW, o) {
    setFont(ctx, o);
    const words = str.split(' ');
    const lines = [];
    let cur = '';
    words.forEach((w) => {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  // ---------------------------------------------------------------- примитивы
  function line(ctx, x0, y0, x1, y1, color, width, glow) {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.shadowBlur = 0;
  }

  /** Провод: базовый цвет старого значения + новое значение, «втекающее» до доли f. */
  function wire(ctx, x0, y, x1, oldV, newV, f, glowK = 1) {
    const W = 7;
    const base = (v) => {
      const col = valColor(v);
      return { col, glow: v == null ? 0 : (v === 1 ? 16 : 9) * glowK };
    };
    const o = base(oldV);
    if (f < 1) line(ctx, x0, y, x1, y, o.col, W, o.glow);
    if (f > 0) {
      const n = base(newV);
      line(ctx, x0, y, lerp(x0, x1, f), y, n.col, W, n.glow);
    }
    // тонкая светлая жила внутри провода
    if (newV != null || oldV != null) {
      ctx.globalAlpha *= 0.5;
      const v = f >= 1 ? newV : oldV;
      if (v != null) line(ctx, x0, y, x1, y, v === 1 ? '#c9ffd8' : '#ffc2c8', 1.6, 0);
      ctx.globalAlpha /= 0.5;
    }
  }

  /** Светящийся импульс с хвостом. */
  function pulse(ctx, x, y, dir, v, k = 1) {
    const col = valColor(v);
    const tail = 80;
    const gr = ctx.createLinearGradient(x - dir * tail, y, x, y);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(1, col);
    ctx.strokeStyle = gr; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.shadowColor = col; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.moveTo(x - dir * tail, y); ctx.lineTo(x, y); ctx.stroke();
    const rg = ctx.createRadialGradient(x, y, 0, x, y, 30 * k);
    rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(0.25, col);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(x, y, 30 * k, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  /** Входной узел (переключатель). */
  function node(ctx, x, y, v, pop, r = LAYOUT.nodeR) {
    const s = 1 + 0.28 * pop;
    const col = valColor(v);
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    if (v != null) { ctx.shadowColor = col; ctx.shadowBlur = 26 + 20 * pop; }
    const rg = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
    rg.addColorStop(0, v == null ? '#4a5272' : '#ffffff');
    rg.addColorStop(0.35, col);
    rg.addColorStop(1, v == null ? '#1a1f33' : shade(col, 0.45));
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.stroke();
    ctx.restore();
  }

  /** Выходная лампочка с пульсацией. */
  function lamp(ctx, x, y, v, time, flipAge, r = LAYOUT.lampR) {
    const col = valColor(v);
    const pulseK = v === 1 ? 0.5 + 0.5 * Math.sin(time * 6.5) : 0.5 + 0.5 * Math.sin(time * 3);
    // ореол
    if (v != null) {
      const halo = r * (v === 1 ? 2.6 + 0.6 * pulseK : 1.9 + 0.2 * pulseK);
      const hg = ctx.createRadialGradient(x, y, r * 0.6, x, y, halo);
      hg.addColorStop(0, hexA(col, v === 1 ? 0.55 : 0.32));
      hg.addColorStop(1, hexA(col, 0));
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(x, y, halo, 0, Math.PI * 2); ctx.fill();
    }
    // кольцо-вспышка при переключении
    if (flipAge != null && flipAge >= 0 && flipAge < 0.6 && v != null) {
      const k = flipAge / 0.6;
      ctx.strokeStyle = hexA(col, 1 - k);
      ctx.lineWidth = 6 * (1 - k) + 1;
      ctx.beginPath(); ctx.arc(x, y, r + 70 * easeOut(k), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.lineWidth = 4; ctx.strokeStyle = '#9aa3c7';
    ctx.beginPath(); ctx.arc(x, y, r + 5, 0, Math.PI * 2); ctx.stroke();
    const rg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, 2, x, y, r);
    rg.addColorStop(0, v == null ? '#3b4260' : '#ffffff');
    rg.addColorStop(0.4, v == null ? '#252a40' : col);
    rg.addColorStop(1, v == null ? '#12152a' : shade(col, 0.5));
    if (v != null) { ctx.shadowColor = col; ctx.shadowBlur = v === 1 ? 30 + 25 * pulseK : 14; }
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
  }
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(a)})`;
  }

  // ---------------------------------------------------------------- корпус
  /**
   * Рисует корпус вентиля в локальных координатах.
   * reveal 0..1 — прорисовка контура; flash 0..1 — вспышка при входе сигнала.
   */
  function drawBody(ctx, g, reveal = 1, flash = 0) {
    const th = THEMES[g.theme];
    const G = geom(g);
    const path = bodyPath(g);
    const fillA = smooth(0.45, 1, reveal);
    // заливка
    if (fillA > 0) {
      ctx.save();
      ctx.globalAlpha *= fillA;
      const gr = ctx.createLinearGradient(0, -80, 0, 80);
      gr.addColorStop(0, th.b); gr.addColorStop(1, th.a);
      ctx.fillStyle = gr;
      ctx.shadowColor = th.stroke; ctx.shadowBlur = 20 + 30 * flash;
      ctx.fill(path);
      ctx.restore();
    }
    // контур
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = flash > 0 ? mixHex(th.stroke, '#ffffff', flash * 0.7) : th.stroke;
    ctx.lineWidth = 5;
    ctx.shadowColor = th.stroke; ctx.shadowBlur = 14 + 24 * flash;
    if (reveal < 1) ctx.setLineDash([G.len * reveal, G.len * 2]);
    ctx.stroke(path);
    if (g.shape === 'xor') ctx.stroke(xorExtraPath());
    ctx.setLineDash([]);
    // кружок инверсии
    if (G.bubble) {
      const bp = smooth(0.6, 1, reveal);
      if (bp > 0) {
        ctx.fillStyle = '#05060c';
        ctx.beginPath(); ctx.arc(G.bubble.x, 0, G.bubble.r, 0, Math.PI * 2 * bp); ctx.fill();
        ctx.beginPath(); ctx.arc(G.bubble.x, 0, G.bubble.r, 0, Math.PI * 2 * bp); ctx.stroke();
      }
    }
    ctx.restore();
    // формула внутри корпуса
    const ta = smooth(0.7, 1, reveal);
    if (ta > 0) {
      ctx.save(); ctx.globalAlpha *= ta;
      richText(ctx, [{ t: g.expr, over: g.inv }], G.textX, 4,
        { size: g.inputs === 1 ? 40 : 36, color: '#ffffff', glow: 8 });
      ctx.restore();
    }
  }

  function mixHex(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const m = (s) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, t));
    return `rgb(${m(16)},${m(8)},${m(0)})`;
  }

  // ---------------------------------------------------------------- схема целиком
  /**
   * Полная схема вентиля в локальных координатах.
   * st: {
   *   reveal  — прорисовка корпуса 0..1,
   *   io      — появление входов/выхода 0..1,
   *   vals    — текущие значения входов (массив) или null,
   *   prev    — предыдущие значения или null,
   *   tIn     — сек. с момента переключения входов,
   *   time    — глобальное время (для пульсации),
   *   digits  — показывать цифры значений
   * }
   * Возвращает {out, outShown} — фактически показанное значение выхода.
   */
  function drawCircuit(ctx, g, st) {
    const G = geom(g);
    const L = LAYOUT;
    const io = st.io == null ? 1 : st.io;
    const vals = st.vals, prev = st.prev;
    const tIn = st.tIn == null ? 99 : st.tIn;
    const fIn = clamp(tIn / TIMING.IN);
    const fOut = clamp((tIn - TIMING.IN) / TIMING.OUT);
    const newOut = vals ? evalGate(g, vals) : null;
    const oldOut = prev ? evalGate(g, prev) : null;
    const outShown = fOut >= 1 ? newOut : oldOut;
    const flash = vals ? bump((tIn - TIMING.IN + 0.06) / 0.34) : 0;

    // провода и узлы входов
    if (io > 0) {
      ctx.save(); ctx.globalAlpha *= io;
      G.pins.forEach((p, i) => {
        const nv = vals ? vals[i] : null;
        const ov = prev ? prev[i] : null;
        const x0 = L.nodeX + L.nodeR, x1 = p.x;
        line(ctx, L.labelX + 26, p.y, L.nodeX - L.nodeR, p.y, '#59607d', 5, 0);
        wire(ctx, x0, p.y, lerp(x0, x1, easeOut(io)), ov, nv, fIn);
        const pop = vals ? bump(tIn / 0.3) : 0;
        node(ctx, L.nodeX, p.y, nv, pop);
        text(ctx, i === 0 ? 'A' : 'B', L.labelX, p.y, { size: 42, color: C.label });
        if (st.digits !== false && nv != null) {
          const dy = g.inputs === 1 ? -54 : (i === 0 ? -54 : 54);
          text(ctx, String(nv), L.nodeX, p.y + dy, { size: 38, color: valColor(nv), glow: 14 });
        }
      });
      ctx.restore();
    }

    // корпус
    drawBody(ctx, g, st.reveal == null ? 1 : st.reveal, flash);

    // выход
    if (io > 0) {
      ctx.save(); ctx.globalAlpha *= io;
      const x0 = G.outStart, x1 = L.lampX - L.lampR - 5;
      wire(ctx, x0, 0, lerp(x0, x1, easeOut(io)), oldOut, newOut, fOut);
      lamp(ctx, L.lampX, 0, outShown, st.time || 0, vals ? tIn - TIMING.FLIP : null);
      text(ctx, 'OUT', L.lampX, 64, { size: 28, color: C.label });
      if (st.digits !== false && outShown != null) {
        text(ctx, String(outShown), L.lampX, -62, { size: 40, color: valColor(outShown), glow: 16 });
      }
      ctx.restore();
    }

    // импульсы поверх
    if (vals && io > 0) {
      if (fIn > 0 && fIn < 1) {
        G.pins.forEach((p, i) => {
          pulse(ctx, lerp(L.nodeX + L.nodeR, p.x, fIn), p.y, 1, vals[i]);
        });
      }
      if (fOut > 0 && fOut < 1) {
        pulse(ctx, lerp(G.outStart, L.lampX - L.lampR, fOut), 0, 1, newOut);
      }
    }
    return { out: newOut, outShown };
  }

  /** Габариты схемы в локальных координатах (для масштабирования). */
  const CIRCUIT_BOX = { x0: -280, x1: 400, y0: -110, y1: 110 };

  // ---------------------------------------------------------------- ГОСТ-значок
  function gostBadge(ctx, g, x, y, s = 1) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = '#8f98c8'; ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(20,26,60,0.6)';
    ctx.beginPath(); ctx.rect(-36, -48, 72, 96); ctx.fill(); ctx.stroke();
    const ys = g.inputs === 1 ? [0] : [-24, 24];
    ys.forEach((yy) => line(ctx, -58, yy, -36, yy, '#8f98c8', 3, 0));
    if (g.inv) {
      ctx.beginPath(); ctx.arc(44, 0, 8, 0, Math.PI * 2); ctx.stroke();
      line(ctx, 52, 0, 66, 0, '#8f98c8', 3, 0);
    } else line(ctx, 36, 0, 66, 0, '#8f98c8', 3, 0);
    text(ctx, g.gost, 0, -14, { size: 30, color: '#ffffff' });
    text(ctx, 'ГОСТ', 0, 70, { size: 18, weight: 600, color: '#8f98c8' });
    ctx.restore();
  }

  // ---------------------------------------------------------------- фон
  function background(ctx, W, H, time, k = 1) {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    // мягкие цветные пятна
    const spots = [
      [W * 0.15, H * 0.25, '#2a1170'], [W * 0.9, H * 0.55, '#0d2a7a'], [W * 0.3, H * 0.9, '#1e0c55'],
    ];
    spots.forEach(([x, y, c], i) => {
      const r = W * (0.7 + 0.05 * Math.sin(time * 0.5 + i));
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, hexA(c, 0.28 * k)); g.addColorStop(1, hexA(c, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    });
    // сетка лаборатории
    ctx.strokeStyle = 'rgba(90,120,255,0.07)'; ctx.lineWidth = 1;
    const step = 54;
    const off = (time * 12) % step;
    ctx.beginPath();
    for (let x = 0; x <= W; x += step) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
    for (let y = -step; y <= H; y += step) { ctx.moveTo(0, y + off + 0.5); ctx.lineTo(W, y + off + 0.5); }
    ctx.stroke();
    // виньетка
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }

  const api = {
    C, THEMES, FONT, MONO, GATES, GATE, TIMING, LAYOUT, CIRCUIT_BOX,
    combos, evalGate, truthTable, valColor,
    clamp, lerp, easeOut, easeInOut, easeBack, smooth, bump, hexA, shade,
    geom, drawBody, drawCircuit, gostBadge, background,
    text, richText, wrap, line, wire, pulse, node, lamp, tracker,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LogicCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
