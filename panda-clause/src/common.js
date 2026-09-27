// 판다 면제 조항 — 공통 부분: 화면 맞추기, 색, 글꼴, 소리, 픽셀 격자, 리라·갓파더 그림
// (sync_common.py 가 퇴근 불가 rira-shift/src/game.js 에서 그대로 옮겨 온다. 여기서 고치지 말 것)
const W = 320, H = 180;
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
let S = 4;

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const lerp = (a, b, t) => a + (b - a) * t;
const coarse = matchMedia('(pointer: coarse)').matches;

function fit() {
  const r = cv.getBoundingClientRect();
  let s = Math.ceil((r.width || 960) * (devicePixelRatio || 1) / W);
  s = clamp(s + (s % 2), 2, 12); // 짝수 배율이어야 0.5칸(고해상도 픽셀)이 기기 픽셀에 딱 맞는다
  if (s !== S || cv.width !== W * s) { S = s; cv.width = W * S; cv.height = H * S; }
}
if (window.ResizeObserver) new ResizeObserver(fit).observe(cv);
fit();

// ---------- 전체 화면
const screenEl = document.getElementById('screen') || cv;
const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
function toggleFS() {
  try {
    if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else {
      const req = screenEl.requestFullscreen || screenEl.webkitRequestFullscreen;
      if (!req) throw new Error('unsupported');
      const r = req.call(screenEl);
      if (r && r.catch) r.catch(() => toast('이 화면에서는 전체 화면을 쓸 수 없어요'));
    }
  } catch (e) { toast('이 화면에서는 전체 화면을 쓸 수 없어요'); }
  cv.focus({ preventScroll: true });
}
const fsBtn = document.getElementById('fs');
if (fsBtn) {
  fsBtn.addEventListener('click', toggleFS);
  const sync = () => { fsBtn.textContent = fsEl() ? '전체 화면 끝내기' : '전체 화면'; };
  document.addEventListener('fullscreenchange', sync); document.addEventListener('webkitfullscreenchange', sync);
}

// ---------- 색
const P = {
  ink: '#3b2a20', ink2: '#6b5444', paper: '#fffaf0', paperD: '#e8dcc4',
  // 리라: 크림색 몸, 갈색 털 코, 주황 눈, 분홍 발바닥
  ol: '#5b4232', cr: '#f6ead2', crS: '#e4d0ae', crL: '#fcf5e6', ear: '#f7c2c0',
  nose: '#5a3f30', noseL: '#86654f', eye: '#ff8a1c', pupil: '#3b1c0c', pad: '#ff9db4', blush: '#ffbfca',
  red: '#d63a3a', redD: '#a8272d', white: '#ffffff', ivory: '#f2e8d0', ivoryD: '#dccdae', ivoryL: '#fbf6ea',
  plum: '#6c5f82', plumD: '#524766', ame: '#a05ad6', pink: '#ff8fb0', pinkD: '#e0668d', green: '#2f9e6e', greenL: '#6fcf97',
  sleeve: '#9db8dc',
  // 갓파더(개미핥기)
  fur: '#9c8468', furL: '#c9b596', furD: '#76624c', furO: '#3b2f27', stripe: '#2a221e', stripeW: '#efe8da', claw: '#f1e9d6', snout: '#2e2622',
  // 방
  wall: '#f1dfc0', wallD: '#e4cda6', wood: '#b07a45', woodD: '#7d532c', woodL: '#cf9a62', floor: '#c48a52', floorD: '#a87142',
  cheese: '#ffd766', rind: '#e0a53a', dough: '#f6e1b5', doughD: '#e2c68e', salt: '#f7a8b8', saltD: '#e27d94', stone: '#a4a9ae', stoneD: '#7e848a',
  herbR: '#4f8a4a', herbL: '#8a6cc9', herbM: '#3fbf7f', herbC: '#fff1b0',
  gold: '#ffc857', goldD: '#e09a2b', navy: '#1b1f3b', navyL: '#2d3363',
};

// ---------- 글꼴 (갈무리)
const F = { s: '7.5px Galmuri14', m: '10px Galmuri9', l: '12px Galmuri11', b: 'bold 12px Galmuri11', sys: 'bold 18px Galmuri11', xl: 'bold 24px Galmuri11' };
let ASC = {};
function asc(f) {
  if (ASC[f] == null) {
    ctx.font = f;
    const m = ctx.measureText('가Ag');
    const px = parseFloat(f.match(/([\d.]+)px/)[1]);
    ASC[f] = Math.round((m.fontBoundingBoxAscent != null ? m.fontBoundingBoxAscent : px * .8) * 2) / 2;
  }
  return ASC[f];
}
const OUT8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
function tw(s, f = F.m) { ctx.font = f; return ctx.measureText(s).width; }
function text(s, x, y, o = {}) {
  s = String(s);
  const f = o.f || F.m;
  ctx.font = f; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  if (o.a === 'center') x -= ctx.measureText(s).width / 2;
  else if (o.a === 'right') x -= ctx.measureText(s).width;
  x = Math.round(x * 2) / 2;
  const by = Math.round(y * 2) / 2 + asc(f);
  if (o.o) {
    ctx.fillStyle = o.o; const k = o.ow || (f === F.s ? .5 : 1);
    for (const [dx, dy] of OUT8) ctx.fillText(s, x + dx * k, by + dy * k);
  }
  ctx.fillStyle = o.c || P.ink;
  ctx.fillText(s, x, by);
}
function wrapChars(s, f, w) {
  ctx.font = f;
  const out = []; let cur = '';
  for (const ch of s) {
    if (cur === '' && ch === ' ' && out.length) continue;
    if (ctx.measureText(cur + ch).width > w && cur) {
      // 낱말 중간에서 끊지 않도록 마지막 빈칸에서 자른다
      const sp = cur.lastIndexOf(' ');
      if (sp > 0 && ch !== ' ') { out.push(cur.slice(0, sp)); cur = cur.slice(sp + 1) + ch; }
      else { out.push(cur); cur = ch === ' ' ? '' : ch; }
    } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}
const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
function box(x, y, w, h, fill = P.paper, edge = P.ink) {
  R(x + 1, y, w - 2, h, edge); R(x, y + 1, w, h - 2, edge);
  R(x + 1, y + 1, w - 2, h - 2, fill);
}
function pline(x0, y0, x1, y1, c, w = .5) {
  ctx.fillStyle = c;
  const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) + 1;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    ctx.fillRect(Math.round((x0 + (x1 - x0) * t) * 2) / 2, Math.round((y0 + (y1 - y0) * t) * 2) / 2, w, w);
  }
}
function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = s => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, clamp(t, 0, 1)));
  return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
}
const won = n => '₩' + Math.round(n).toLocaleString('en-US');

const G = { music: true, sfx: true };
// ---------- 소리: WebAudio 칩튠
const AU = { ac: null, out: null, mus: null, fx: null, noise: null, track: null, step: 0, next: 0 };
function audio() {
  if (AU.ac) { if (AU.ac.state === 'suspended' && !document.hidden) AU.ac.resume(); return; }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ac = AU.ac = new AC();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(ac.destination);
    AU.out = ac.createGain(); AU.out.gain.value = .85; AU.out.connect(comp);
    AU.mus = ac.createGain(); AU.mus.gain.value = G.music ? .32 : 0; AU.mus.connect(AU.out);
    AU.fx = ac.createGain(); AU.fx.gain.value = G.sfx ? .6 : 0; AU.fx.connect(AU.out);
    const len = ac.sampleRate, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    AU.noise = b;
    if (AU.track) { AU.step = 0; AU.next = ac.currentTime + .05; }
  } catch (e) { AU.ac = null; }
}
document.addEventListener('visibilitychange', () => {
  if (!AU.ac) return;
  if (document.hidden) AU.ac.suspend(); else AU.ac.resume();
});
function hz(n) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(n);
  const semi = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * 2 ** ((semi + (+m[3] + 1) * 12 - 69) / 12);
}
function tone(f, d, o = {}) {
  const ac = AU.ac; if (!ac) return;
  const t = o.at != null ? o.at : ac.currentTime + (o.dt || 0);
  const os = ac.createOscillator(); os.type = o.w || 'square';
  os.frequency.setValueAtTime(f, t);
  if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + d);
  const g = ac.createGain(), v = o.v != null ? o.v : .2;
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + (o.a || .005));
  g.gain.exponentialRampToValueAtTime(.0001, t + d);
  os.connect(g); g.connect(o.bus || AU.fx);
  os.start(t); os.stop(t + d + .03);
}
function noise(d, o = {}) {
  const ac = AU.ac; if (!ac || !AU.noise) return;
  const t = o.at != null ? o.at : ac.currentTime + (o.dt || 0);
  const src = ac.createBufferSource(); src.buffer = AU.noise;
  const fl = ac.createBiquadFilter(); fl.type = o.ft || 'bandpass'; fl.frequency.value = o.f || 1000; fl.Q.value = o.q || 1;
  if (o.to) fl.frequency.exponentialRampToValueAtTime(o.to, t + d);
  const g = ac.createGain(), v = o.v != null ? o.v : .2;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  src.connect(fl); fl.connect(g); g.connect(o.bus || AU.fx);
  src.start(t, Math.random() * .5); src.stop(t + d + .03);
}
const SFX = {
  pop() { tone(320, .12, { to: 960, v: .14 }); tone(1300, .06, { dt: .07, w: 'triangle', v: .1 }); },
  poof() { noise(.5, { f: 1800, to: 300, v: .25 }); },
  step() { noise(.04, { f: 240, ft: 'lowpass', v: .12 }); },
  blip() { tone(rnd(620, 760), .03, { v: .045 }); },
  rira() { for (let i = 0; i < 3; i++) tone(rnd(1000, 1500), .05, { dt: i * .065, w: 'triangle', v: .1, to: rnd(1100, 1700) }); },
  stamp() { tone(130, .16, { w: 'sine', to: 45, v: .55 }); noise(.09, { f: 700, ft: 'lowpass', v: .3 }); },
  good() { tone(880, .08, { w: 'triangle', v: .14 }); tone(1320, .12, { dt: .07, w: 'triangle', v: .12 }); },
  buzz() { tone(150, .22, { w: 'sawtooth', v: .09 }); },
  ding() { tone(1320, .3, { w: 'triangle', v: .16 }); tone(1760, .4, { dt: .1, w: 'triangle', v: .12 }); },
  churn() { noise(.07, { f: 500, v: .16 }); tone(170, .07, { w: 'sine', to: 110, v: .18 }); },
  twist() { noise(.06, { f: 2600, v: .05 }); },
  tear() { noise(.3, { f: 1600, q: 3, v: .3 }); },
  squish() { tone(210, .12, { w: 'sine', to: 110, v: .3 }); noise(.07, { f: 380, ft: 'lowpass', v: .14 }); },
  tick() { tone(1800, .02, { w: 'square', v: .03 }); },
  place() { tone(260, .09, { w: 'triangle', v: .2 }); noise(.05, { f: 900, v: .1 }); },
  stitch() { tone(2200, .03, { w: 'triangle', v: .07 }); tone(1600, .03, { dt: .04, w: 'triangle', v: .05 }); },
  drop() { tone(900, .15, { w: 'sine', to: 300, v: .12 }); },
  grind() { noise(.09, { f: 3000, q: 2, v: .12 }); },
  pour() { noise(.05, { f: 5000, ft: 'highpass', v: .05 }); },
  paper() { noise(.14, { f: 2600, ft: 'highpass', v: .12 }); },
  sigh() { noise(.8, { f: 700, to: 250, ft: 'lowpass', v: .16 }); tone(200, .7, { w: 'sine', to: 120, v: .06 }); },
  bell() { tone(784, 1.6, { w: 'sine', v: .28 }); tone(1568, 1, { w: 'sine', v: .08 }); tone(2350, .5, { w: 'sine', v: .04 }); },
  hope() { ['C5', 'E5', 'G5', 'B5'].forEach((n, i) => tone(hz(n), .9, { dt: i * .09, w: 'sine', v: .09, a: .05 })); },
  incomplete() { ['G4', 'E4', 'C4'].forEach((n, i) => tone(hz(n), .18, { dt: i * .13, v: .12 })); tone(98, .45, { dt: .39, w: 'sawtooth', v: .1 }); },
  unlock() { ['C5', 'E5', 'G5', 'C6', 'E6'].forEach((n, i) => tone(hz(n), .14, { dt: i * .07, v: .1 })); tone(hz('G6'), .5, { dt: .38, w: 'triangle', v: .12 }); },
  confirmed() {
    ['C4', 'E4', 'G4', 'C5'].forEach((n, i) => tone(hz(n), .16, { dt: i * .1, v: .12 }));
    ['E5', 'G5', 'C6'].forEach(n => tone(hz(n), 1.4, { dt: .45, w: 'triangle', v: .09, a: .02 }));
    SFX.bell();
  },
  morph() { ['C4', 'G4', 'C5', 'G5', 'C6'].forEach((n, i) => tone(hz(n), .12, { dt: i * .09, w: 'triangle', v: .1 })); },
};

// 배경음악: 한 곡의 선율(리라 근무가)을 장면마다 빠르기·악기를 바꿔 되풀이한다
const CH = {
  F: ['F2', 'C3', ['A3', 'C4']], C7: ['C3', 'G2', ['E3', 'Bb3']], Bb: ['Bb2', 'F2', ['Bb3', 'D4']],
  C: ['C3', 'G2', ['E3', 'G3']], Am: ['A2', 'E3', ['C4', 'E4']], G: ['G2', 'D3', ['B3', 'D4']],
};
const THEME = 'A4 C5 F5 C5 E5 D5 C5 Bb4 A4 C5 A4 F4 G4 . . . D5 F5 D5 Bb4 C5 A4 F4 A4 G4 Bb4 E5 G5 F5 . C5 .';
const SONG = {
  room: { bpm: 126, lead: THEME, bars: 'F C7 F C7 Bb F C7 F', lw: 'square', lv: .045, oompah: true },
  work: { bpm: 156, lead: 'F5 . A5 F5 C5 . A4 C5 Bb4 . G4 Bb4 E5 . C5 . F5 . A5 F5 C5 . F5 A5 G5 F5 E5 D5 C5 . . .', bars: 'F F C7 C7 F F C7 F', lw: 'triangle', lv: .08, oompah: true, hat: true },
  wait: { bpm: 80, lead: 'E5 . D5 . C5 . . . D5 . E5 . G5 . . . F5 . E5 . D5 . C5 . B4 . C5 . D5 . . .', bars: 'C Am G G F Am G C', lw: 'sine', lv: .09, pad: true },
  box: { bpm: 72, lead: THEME, bars: null, lw: 'sine', lv: .07, oct: 2 },
};
for (const k in SONG) { SONG[k].lead = SONG[k].lead.split(' '); if (SONG[k].bars) SONG[k].bars = SONG[k].bars.split(' '); }
function playTrack(name) {
  if (AU.track === name) return;
  AU.track = name; AU.step = 0;
  if (AU.ac) AU.next = AU.ac.currentTime + .08;
}
function musicTick() {
  const ac = AU.ac; if (!ac || !AU.track || !G.music) return;
  const sg = SONG[AU.track], st = 60 / sg.bpm / 2;
  if (AU.next < ac.currentTime - .5) AU.next = ac.currentTime + .05;
  while (AU.next < ac.currentTime + .15) {
    const s = AU.step % sg.lead.length, t = AU.next, pos = s & 3;
    const n = sg.lead[s];
    if (n !== '.') {
      let r = 1; while (sg.lead[(s + r) % sg.lead.length] === '.' && r < 4) r++;
      const f = hz(n) * (sg.oct || 1);
      tone(f, st * r * .9, { at: t, w: sg.lw, v: sg.lv, bus: AU.mus, a: sg.lw === 'sine' ? .02 : .005 });
      if (sg.oct) tone(f * 2, st * .8, { at: t, w: 'sine', v: sg.lv * .25, bus: AU.mus });
    }
    if (sg.bars) {
      const ch = CH[sg.bars[(s >> 2) % sg.bars.length]];
      if (sg.oompah) {
        if (pos === 0) tone(hz(ch[0]), st * .9, { at: t, w: 'triangle', v: .2, bus: AU.mus });
        if (pos === 2) tone(hz(ch[1]), st * .9, { at: t, w: 'triangle', v: .18, bus: AU.mus });
        if (pos === 1 || pos === 3) for (const c of ch[2]) tone(hz(c), st * .45, { at: t, w: 'square', v: .025, bus: AU.mus });
      } else if (sg.pad && pos === 0) {
        tone(hz(ch[0]), st * 3.6, { at: t, w: 'triangle', v: .16, bus: AU.mus, a: .03 });
        for (const c of ch[2]) tone(hz(c), st * 3.8, { at: t, w: 'sine', v: .05, bus: AU.mus, a: .15 });
      }
    }
    if (sg.block && (pos === 0 || pos === 2)) tone(pos ? 880 : 1320, .04, { at: t, w: 'square', v: .03, bus: AU.mus });
    if (sg.hat && (pos === 1 || pos === 3)) noise(.03, { at: t, f: 8000, ft: 'highpass', v: .05, bus: AU.mus });
    AU.step++; AU.next += st;
  }
}

// ---------- 픽셀 격자: 고해상도(0.5칸) 격자에 도형을 찍고 바깥 테두리를 둘러 캔버스로 굳힌다
const SPR = new Map();
function grid(w, h) { return { w, h, p: new Array(w * h).fill(0) }; }
function gset(g, x, y, c) { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < g.w && y < g.h) g.p[y * g.w + x] = c; }
function gget(g, x, y) { return x >= 0 && y >= 0 && x < g.w && y < g.h ? g.p[y * g.w + x] : 0; }
function grect(g, x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) gset(g, x + i, y + j, c); }
function gell(g, cx, cy, rx, ry, c) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) gset(g, x, y, c);
    }
}
function gaxis(g, cx, cy, rx, ry, ux, uy, c) {
  const L = Math.hypot(ux, uy); ux /= L; uy /= L;
  const m = Math.max(rx, ry) + 1;
  for (let y = Math.floor(cy - m); y <= Math.ceil(cy + m); y++)
    for (let x = Math.floor(cx - m); x <= Math.ceil(cx + m); x++) {
      const dx = x + .5 - cx, dy = y + .5 - cy, p = (dx * ux + dy * uy) / ry, q = (-dx * uy + dy * ux) / rx;
      if (p * p + q * q <= 1) gset(g, x, y, c);
    }
}
function gring(g, cx, cy, r0, r1, c) {
  for (let y = Math.floor(cy - r0); y <= Math.ceil(cy + r0); y++)
    for (let x = Math.floor(cx - r0); x <= Math.ceil(cx + r0); x++) {
      const d = Math.hypot(x + .5 - cx, y + .5 - cy);
      if (d <= r0 && d >= r1) gset(g, x, y, c);
    }
}
function gpoly(g, pts, c) {
  let y0 = Infinity, y1 = -Infinity;
  for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const yc = y + .5, xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) gset(g, x, y, c);
  }
}
function gline(g, x0, y0, x1, y1, c, w = 1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) + 1;
  for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
    if (w === 1) gset(g, Math.round(x), Math.round(y), c);
    else grect(g, Math.round(x - (w - 1) / 2), Math.round(y - (w - 1) / 2), w, w, c);
  }
}
function gout(g, c) {
  const q = g.p.slice(), w = g.w, h = g.h;
  const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && q[y * w + x];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (q[y * w + x]) continue;
    if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) g.p[y * w + x] = c;
  }
}
function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}
// 털결: 한 색의 픽셀 가운데 일부를 어둡게·밝게 바꾼다
function gtex(g, from, dark, light, dm = 9, lm = 13) {
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    if (g.p[y * g.w + x] !== from) continue;
    const hv = hash(x, y);
    if (hv % dm === 0) g.p[y * g.w + x] = dark;
    else if (light && hv % lm === 0) g.p[y * g.w + x] = light;
  }
}
function bake(g) {
  const c = document.createElement('canvas'); c.width = g.w; c.height = g.h;
  const x2 = c.getContext('2d');
  for (let y = 0; y < g.h; y++) {
    let x = 0;
    while (x < g.w) {
      const col = g.p[y * g.w + x]; let e = x + 1;
      while (e < g.w && g.p[y * g.w + e] === col) e++;
      if (col) { x2.fillStyle = col; x2.fillRect(x, y, e - x, 1); }
      x = e;
    }
  }
  return c;
}
function spr(key, w, h, fn) {
  let c = SPR.get(key);
  if (!c) { const g = grid(w, h); fn(g); c = bake(g); SPR.set(key, c); }
  return c;
}
function blit(c, x, y, flip, sc = 1) {
  const w = c.width / 2 * sc, h = c.height / 2 * sc;
  x = Math.round(x * 2) / 2; y = Math.round(y * 2) / 2;
  if (flip) { ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0, w, h); ctx.restore(); }
  else ctx.drawImage(c, x, y, w, h);
}
const disc = (r, c) => spr('disc' + r + c, r * 4 + 2, r * 4 + 2, g => gell(g, r * 2 + 1, r * 2 + 1, r * 2, r * 2, c));
const ring = (r, c, th = 2) => spr('ring' + r + c + th, r * 4 + 2, r * 4 + 2, g => gring(g, r * 2 + 1, r * 2 + 1, r * 2, r * 2 - th, c));

// ---------- 리라 (40x46 격자 = 20x23칸, 발바닥이 맨 아래). 참조: 리라 인형 스프라이트 시트
// 회색빛 도는 베이지 곱슬 털, 키의 절반쯤 되는 큰 머리, 안쪽이 넓게 분홍인 둥근 귀,
// 얼굴 가운데 아래의 크고 짙은 갈색 코, 코 양옆 위에 붙은 작은 주황 테두리 눈, 코 밑 바느질 세로 입선,
// 짧은 팔, 앉으면 앞으로 내민 크고 둥근 분홍 발바닥. 꼬리 없음.
const RC = { cr: '#ebe3d2', sh: '#d6c9b1', hi: '#f5efe3', ol: '#6e5a49', pink: '#f2b7ae', pinkD: '#e39a92', nose: '#4a3226', noseL: '#7d5b48', mouth: '#6b4a3a', eye: '#f08a24', pupil: '#1f140e' };
const RIRA_ARM = { alps: P.white, rosemarira: P.plum, sister: P.ivory, seraphina: P.ivory, clerk2: P.sleeve };
// 옷: 몸 위에 겹치는 부분 (앞모습 cx=20, 옆모습은 cx를 옮겨 쓴다)
function riraOutfit(g, kind, cx, cy) {
  const nun = kind === 'sister' || kind === 'seraphina';
  if (kind === 'alps') {
    gell(g, cx, cy - 3.5, 9.5, 5, P.white);
    gpoly(g, [[cx - 10, cy - 1.5], [cx + 10, cy - 1.5], [cx + 13, cy + 7.5], [cx - 13, cy + 7.5]], P.red); grect(g, cx - 13, cy + 6.5, 26, 1, P.redD);
    grect(g, cx - 5, cy - .5, 10, 6, P.white);
    grect(g, cx - 6, cy - 8.5, 2, 8, P.red); grect(g, cx + 4, cy - 8.5, 2, 8, P.red);
  } else if (kind === 'rosemarira') {
    gpoly(g, [[cx - 10, cy - 2.5], [cx + 10, cy - 2.5], [cx + 12, cy + 8.5], [cx - 12, cy + 8.5]], P.plum);
    for (let y = cy; y < cy + 8; y += 3) grect(g, cx - 7, y, 14, 1, P.plumD);
  } else if (nun) grect(g, cx - 4, cy - 6.5, 8, 13, P.ivoryL);
}
function limb(g, cx, cy, rx, ry, ux, uy, c) { gaxis(g, cx, cy, rx + 1, ry + 1, ux, uy, RC.ol); gaxis(g, cx, cy, rx, ry, ux, uy, c); }
function blob(g, cx, cy, rx, ry, c) { gell(g, cx, cy, rx + 1, ry + 1, RC.ol); gell(g, cx, cy, rx, ry, c); }
function riraEye(g, x, y, mood, blink) {
  const D = RC.pupil;
  if (blink) { gset(g, x - 1, y, D); gset(g, x, y + 1, D); gset(g, x + 1, y, D); }
  else if (mood === 'h') { gset(g, x - 1, y + 1, D); gset(g, x, y, D); gset(g, x + 1, y + 1, D); }
  else if (mood === 'so') { grect(g, x - 1, y, 3, 1, D); gset(g, x, y + 1, RC.eye); }
  else { grect(g, x - 1, y - 1, 3, 3, RC.eye); gset(g, x - 1, y - 1, RC.cr); gset(g, x + 1, y - 1, RC.cr); gset(g, x - 1, y + 1, RC.cr); gset(g, x + 1, y + 1, RC.cr); gset(g, x, y, D); }
}
// 앞모습 (앉음). mood: n · h 웃음 · st 엄격 · so 엄숙 / ear: -1~1 귀 펄럭 / step: 발 하나 들기(-1·1)
// arm: d 내림 · u 한 팔 흔들기 · b 두 팔 번쩍 · m 두 앞발로 입 가리기
function rira(kind, o = {}) {
  const mood = o.mood || 'n', ear = Math.round((o.ear || 0) * 3) / 3, step = o.step || 0, arm = o.arm || 'd', blink = o.blink ? 1 : 0;
  return spr(`r|${kind}|${mood}|${ear}|${step}|${arm}|${blink}`, 40, 46, g => {
    const cr = RC.cr, nun = kind === 'sister' || kind === 'seraphina', armC = RIRA_ARM[kind] || cr;
    if (nun) { gell(g, 20, 17, 15, 13, P.ivory); gpoly(g, [[5, 18], [35, 18], [37, 36], [3, 36]], P.ivoryD); gpoly(g, [[6, 18], [34, 18], [35.5, 35], [4.5, 35]], P.ivory); }
    // 귀: 펄럭이면 위아래로 들썩이고, 내려가면 바깥으로 벌어진다
    const ey = 7.5 - ear * 2.6, spread = 12 + Math.max(0, -ear) * 1.6 + Math.abs(ear) * .4;
    for (const s of [-1, 1]) { const x = 20 + s * spread; gell(g, x, ey, 5.4, 5.4, cr); gell(g, x - s * .6, ey + .6, 3.5, 3.5, RC.pink); }
    // 올린 팔 (몸 뒤)
    const up = s => { gaxis(g, 20 + s * 12.5, 22.5, 3.3, 7, s * 7, -11, armC); gell(g, 20 + s * 16.3, 16.8, 3.1, 3.1, cr); };
    if (arm === 'u') up(1);
    if (arm === 'b') { up(-1); up(1); }
    // 몸
    gell(g, 20, 33.5, 11, 9, nun ? P.ivoryD : RC.sh);
    gell(g, 20, 32.5, 10.4, 8.3, nun ? P.ivory : kind === 'rosemarira' ? P.plum : cr);
    riraOutfit(g, kind, 20, 32.5);
    // 발 자리 (테두리용 바탕)
    for (const s of [-1, 1]) gell(g, 20 + s * 8.5, 40.5, 6.2, 5.3, cr);
    // 큰 머리
    gell(g, 20, 16, 13.6, 11.6, cr);
    for (const [x, y] of [[13, 4], [18, 3], [23, 3], [27, 4]]) gset(g, x, y + 1, cr);
    if (nun) { gell(g, 20, 11.5, 12.6, 5, P.ivory); grect(g, 8, 13, 24, 2, P.ivoryL); }
    if (kind === 'clerk') { grect(g, 7, 8, 26, 2, P.green); gpoly(g, [[10, 10], [30, 10], [32, 12], [8, 12]], P.greenL); }
    if (kind === 'rosie') {
      const bx = 32, by = 3.5 - ear * 2.6;
      gpoly(g, [[bx, by + 2], [bx - 5, by - 2], [bx - 5, by + 5]], P.pink); gpoly(g, [[bx, by + 2], [bx + 5, by - 2], [bx + 5, by + 5]], P.pink);
      gline(g, bx - 1, by + 3, bx - 3, by + 8, P.pink); gline(g, bx + 1, by + 3, bx + 3, by + 8, P.pink);
    }
    gout(g, RC.ol);
    // 턱 아래 그늘: 큰 머리가 몸 위에 얹힌 느낌
    for (let x = 11; x < 29; x++) { const y = Math.abs(x - 19.5) > 6 ? 26 : 27; if (gget(g, x, y + 1) && gget(g, x, y + 1) !== RC.ol) gset(g, x, y + 1, '#d3c5ad'); }
    // 앉아서 앞으로 내민 발: 크고 둥근 분홍 발바닥
    for (const s of [-1, 1]) {
      const x = 20 + s * 8.5, lift = step === s ? 1.5 : 0;
      blob(g, x, 40.5 - lift, 6.2, 5.3, cr); gell(g, x, 41 - lift, 4.5, 3.9, RC.pink);
    }
    // 내린 팔과 앞발 (윤곽선을 둘러 몸 위에서도 보이게)
    const down = s => { limb(g, 20 + s * 9.4, 30.5, 3, 5.4, -s * 2, 6, armC); blob(g, 20 + s * 8.2, 35.2, 2.7, 2.5, cr); };
    if (arm === 'd') { down(-1); down(1); }
    else if (arm === 'u') down(-1);
    else if (arm === 'm') for (const s of [-1, 1]) limb(g, 20 + s * 8.2, 28.5, 3, 5, -s * 4, -5, armC);
    if (kind === 'clerk' && arm === 'd') { grect(g, 23, 26, 13, 15, RC.ol); grect(g, 24, 27, 11, 13, P.woodD); grect(g, 25, 29, 9, 10, P.white); grect(g, 28, 26, 3, 2, P.stone); }
    gtex(g, cr, '#ddd1bc', RC.hi, 19, 23);
    if (kind === 'rosie') { const bx = 32, by = Math.floor(3.5 - ear * 2.6); grect(g, bx - 1, by + 1, 2, 2, P.pinkD); gset(g, bx - 3, by + 1, P.pinkD); gset(g, bx + 3, by + 1, P.pinkD); }
    if (kind === 'rosemarira') { grect(g, 15, 24, 10, 2, P.white); grect(g, 19, 25, 2, 2, P.ame); gset(g, 19, 25, '#d7b0f5'); gline(g, 27, 26, 29, 23, P.herbR); gset(g, 28, 24, P.greenL); }
    if (nun) {
      // 손으로 놓은 삐뚤삐뚤한 자수
      const st = kind === 'seraphina'
        ? [[20, 28], [20, 29], [21, 30], [20, 31], [20, 32], [18, 30], [19, 29], [22, 30], [23, 31]].map(p => [...p, P.goldD])
        : [[18, 31, P.pinkD], [20, 30, P.pinkD], [21, 32, P.pinkD], [19, 33, P.pinkD], [17, 35, '#5b8fd6'], [23, 34, '#5b8fd6'], [22, 36, P.green]];
      for (const [x, y, c] of st) gset(g, x, y, c);
    }
    // 얼굴: 코 둘레가 살짝 밝고, 크고 짙은 갈색 코, 바느질 세로 입선
    gell(g, 20, 21, 5.6, 4, RC.hi);
    grect(g, 17, 17, 6, 1, RC.nose); grect(g, 16, 18, 8, 2, RC.nose); grect(g, 17, 20, 6, 1, RC.nose); grect(g, 18, 21, 4, 1, RC.nose);
    gset(g, 18, 17, RC.noseL); gset(g, 17, 18, RC.noseL);
    grect(g, 19, 22, 1, 3, RC.mouth);
    if (mood === 'st') { grect(g, 17, 25, 5, 1, RC.mouth); }
    riraEye(g, 13, 17, mood, blink); riraEye(g, 26, 17, mood, blink);
    if (mood === 'st' && !blink) { gset(g, 11, 14, RC.pupil); gset(g, 12, 14, RC.pupil); gset(g, 13, 15, RC.pupil); gset(g, 26, 15, RC.pupil); gset(g, 27, 14, RC.pupil); gset(g, 28, 14, RC.pupil); }
    if (mood === 'h') { grect(g, 9, 20, 3, 1, RC.pink); grect(g, 28, 20, 3, 1, RC.pink); }
    if (kind === 'clerk2') {
      for (const x0 of [10, 23]) { grect(g, x0, 14, 7, 1, P.ink); grect(g, x0, 20, 7, 1, P.ink); grect(g, x0, 14, 1, 7, P.ink); grect(g, x0 + 6, 14, 1, 7, P.ink); }
      grect(g, 17, 15, 6, 1, P.ink);
    }
    // 두 앞발로 입 가리기 (얼굴 위에 테두리를 따로 둘러 그린다)
    if (arm === 'm') for (const x of [16, 23]) { gell(g, x, 23.5, 3.6, 3.3, RC.ol); gell(g, x, 23.5, 2.8, 2.5, cr); }
  });
}
// 옆모습 걷기 (오른쪽을 본다, 4프레임). 뒤로 찬 발의 분홍 발바닥이 보인다
function riraSide(kind, f, o = {}) {
  const ear = Math.round((o.ear || 0) * 3) / 3, mood = o.mood || 'n';
  return spr(`rs|${kind}|${f}|${ear}|${mood}`, 40, 46, g => {
    const cr = RC.cr, nun = kind === 'sister' || kind === 'seraphina', armC = RIRA_ARM[kind] || cr;
    const s = [1, 0, -1, 0][f], bob = f % 2 ? -1 : 0;
    if (nun) { gell(g, 17, 17 + bob, 13, 12, P.ivory); gpoly(g, [[5, 18 + bob], [20, 18 + bob], [19, 36], [4, 34]], P.ivory); }
    const leg = (x, back) => {
      gell(g, x, 41, 5.2, 4.3, cr);
      if (back) gell(g, x - 2.4, 41, 2.4, 3.4, RC.pink); else gell(g, x + 1, 43.6, 3.4, 1.3, RC.pink);
    };
    // 뒤쪽 팔과 다리
    gaxis(g, 19 + s * 3, 30 + bob, 3, 5.5, s * 3, 6, RC.sh);
    const la = 19 + s * 5, lb = 19 - s * 5;
    leg(Math.min(la, lb), s !== 0);
    // 몸
    gell(g, 19, 33 + bob, 9.6, 8.6, nun ? P.ivory : kind === 'rosemarira' ? P.plum : cr);
    riraOutfit(g, kind, 19, 33 + bob);
    // 큰 머리, 앞으로 나온 주둥이, 머리 위의 귀 (안쪽 분홍이 앞을 본다)
    gell(g, 20, 16 + bob, 12.6, 11.4, cr);
    gell(g, 30.5, 19.5 + bob, 5.4, 4.4, cr);
    gell(g, 14, 5 + bob - ear * 2, 5.2, 5.2, cr); gell(g, 15.2, 5.6 + bob - ear * 2, 3.3, 3.3, RC.pink);
    if (nun) { gell(g, 17, 11 + bob, 12, 5, P.ivory); }
    if (kind === 'clerk') { grect(g, 9, 7 + bob, 20, 2, P.green); gpoly(g, [[26, 9 + bob], [34, 9 + bob], [36, 11 + bob], [26, 11 + bob]], P.greenL); grect(g, 26, 26 + bob, 4, 12, P.woodD); grect(g, 27, 27 + bob, 3, 10, P.white); }
    if (kind === 'rosie') { const by = 3 + bob - ear * 2; gpoly(g, [[16, by + 2], [11, by - 2], [11, by + 5]], P.pink); gpoly(g, [[16, by + 2], [21, by - 2], [21, by + 5]], P.pink); }
    gout(g, RC.ol);
    // 앞쪽 다리와 팔 (윤곽선을 둘러 몸 위에서도 보이게)
    const fx = s !== 0 ? Math.max(la, lb) : 19;
    blob(g, fx, 41, 5.2, 4.3, cr); gell(g, fx + 1, 43.6, 3.4, 1.3, RC.pink);
    limb(g, 20 - s * 3, 31 + bob, 3, 5.5, -s * 3, 6, armC); blob(g, 20 - s * 5, 35.5 + bob, 2.6, 2.4, cr);
    gtex(g, cr, '#ddd1bc', RC.hi, 19, 23);
    if (kind === 'rosemarira') { grect(g, 20, 25 + bob, 5, 2, P.white); gset(g, 23, 26 + bob, P.ame); }
    // 얼굴: 주둥이 끝의 짙은 갈색 코, 작은 주황 테두리 눈
    gell(g, 34.6, 18.6 + bob, 2.9, 2.5, RC.nose); gset(g, 34, 17 + bob, RC.noseL);
    grect(g, 32, 22 + bob, 1, 2, RC.mouth);
    riraEye(g, 26, 16 + bob, mood, false);
    if (mood === 'h') grect(g, 24, 20 + bob, 3, 1, RC.pink);
    if (kind === 'clerk2') { grect(g, 23, 13 + bob, 7, 1, P.ink); grect(g, 23, 19 + bob, 7, 1, P.ink); grect(g, 23, 13 + bob, 1, 7, P.ink); grect(g, 29, 13 + bob, 1, 7, P.ink); }
  });
}
// ---------- 갓파더 (개미핥기, 176x100 격자 = 88x50칸, 오른쪽을 본다)
// 거대 개미핥기: 늘어진 깃발 꼬리, 가늘고 긴 주둥이, 목에서 등으로 가늘어지는 흰 테두리 검은 띠, 밝은 앞다리의 검은 손목 띠와 큰 발톱
function anteater(f) {
  return spr('ant' + f, 176, 100, g => {
    const a = [0, 1, 0, -1][f], bob = f % 2;
    const leg = (x, sw, c, front) => {
      gpoly(g, [[x - 8, 60], [x + 8, 60], [x + 7 + sw * 4, 93], [x - 6 + sw * 4, 93]], c);
      const fx = x + sw * 4;
      gell(g, fx + (front ? 2 : 0), 94.5, front ? 10 : 9, 3.6, c);
      if (front) {
        grect(g, fx - 7, 84, 15, 4, P.stripe);
        for (let k = 0; k < 3; k++) gpoly(g, [[fx + 5, 90 + k * 2], [fx + 15 + k, 92 + k], [fx + 14 + k, 97], [fx + 7, 95]], P.claw);
      } else for (let k = 0; k < 3; k++) gset(g, fx + 7 + k, 97, P.claw);
    };
    // 뒤쪽 다리
    leg(64, -a, P.furD, false); leg(122, a, '#b09c7e', true);
    // 늘어진 깃발 꼬리
    gpoly(g, [[56, 40 + bob], [30, 36], [6, 38], [0, 46], [4, 58], [22, 66], [50, 62]], P.furD);
    for (let x = 2; x < 52; x += 2) {
      let by = 0; for (let y = 99; y > 0; y--) if (gget(g, x, y) === P.furD) { by = y; break; }
      if (by) gline(g, x, by, x - 1, by + 6 + (hash(x, 1) % 5), P.furD);
    }
    // 몸
    gell(g, 92, 56 + bob, 48, 24, P.fur);
    gell(g, 96, 72 + bob, 36, 8, P.furL);
    // 목과 작은 머리, 가늘고 긴 주둥이
    gpoly(g, [[120, 40 + bob], [142, 39 + bob], [152, 50 + bob], [138, 70 + bob], [118, 66 + bob]], P.fur);
    gell(g, 144, 48 + bob, 11, 9, P.furL);
    gpoly(g, [[148, 42 + bob], [175, 53 + bob], [175, 57 + bob], [148, 56 + bob]], P.furL);
    gell(g, 137, 40 + bob, 3.5, 3.2, P.furD);
    // 앞쪽 다리
    leg(68, a, P.fur, false); leg(126, -a, P.furL, true);
    // 등 갈기 (짧게)
    for (let x = 50; x < 132; x += 6) {
      let ty = 0; while (ty < g.h && !gget(g, x, ty)) ty++;
      if (ty < g.h) gline(g, x, ty, x - 2, ty - 2, P.fur);
    }
    gout(g, P.furO);
    gtex(g, P.fur, P.furD, P.furL, 15, 21);
    gtex(g, P.furD, '#5e4e3e', null, 13);
    // 목에서 등으로 가늘어지는 띠
    const x1 = 132, y1 = 74 + bob, x2 = 84, y2 = 33 + bob, L = Math.hypot(x2 - x1, y2 - y1);
    for (let y = 0; y < g.h; y++) for (let x = 60; x < 150; x++) {
      const c = gget(g, x, y);
      if (c !== P.fur && c !== P.furD && c !== P.furL) continue;
      const t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / L / L;
      if (t < 0 || t > 1) continue;
      const d = Math.abs((x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)) / L, r = 6 * (1 - t * .8);
      if (d < r) gset(g, x, y, P.stripe); else if (d < r + 2.2) gset(g, x, y, P.stripeW);
    }
    grect(g, 172, 53 + bob, 3, 4, P.snout);
    // 지친 눈: 처진 눈꺼풀, 다크서클, 빛 없는 눈동자
    gline(g, 141, 43 + bob, 148, 44 + bob, P.furO);
    grect(g, 142, 45 + bob, 5, 1, '#8d7a64'); grect(g, 143, 46 + bob, 3, 1, '#1d1714');
    grect(g, 141, 48 + bob, 7, 1, '#6d5c4b'); grect(g, 142, 49 + bob, 5, 1, '#8d7a64');
  });
}
// 개미핥기의 흰 테두리 검은 띠: 털 픽셀 위에만 칠한다
function stripe(g, x1, y1, x2, y2, r0, r1) {
  const L = Math.hypot(x2 - x1, y2 - y1);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const c = gget(g, x, y);
    if (c !== P.fur && c !== P.furD && c !== P.furL) continue;
    const t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / L / L;
    if (t < 0 || t > 1) continue;
    const d = Math.abs((x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)) / L;
    if (d < r0) gset(g, x, y, P.stripe); else if (d < r1) gset(g, x, y, P.stripeW);
  }
}
// 정면 얼굴 (카메라를 보는 죽은 눈), 100x92 격자: 주둥이가 카메라 쪽으로 길게 내려온다
function anteaterFace(blink) {
  return spr('antface' + (blink ? 1 : 0), 100, 92, g => {
    gell(g, 50, 100, 50, 26, P.fur);
    gell(g, 50, 40, 25, 21, P.furL);
    for (const s of [-1, 1]) { gell(g, 50 + s * 21, 22, 5, 4.6, P.furL); gell(g, 50 + s * 21, 23, 2.6, 2.3, P.furD); }
    gpoly(g, [[37, 44], [63, 44], [56, 86], [44, 86]], P.furL);
    gell(g, 50, 86, 6.5, 4, P.furL);
    for (const x of [34, 42, 58, 66]) { let ty = 0; while (ty < g.h && !gget(g, x, ty)) ty++; gline(g, x, ty, x + (x < 50 ? -1 : 1), ty - 2, P.furL); }
    gout(g, P.furO);
    gtex(g, P.fur, P.furD, P.furL, 15, 21);
    gtex(g, P.furL, '#b6a283', null, 17);
    // 주둥이 옆 그늘
    for (let y = 46; y < 84; y++) { const t = (y - 44) / 42, l = Math.round(37 + 7 * t), r = Math.round(62 - 7 * t); gset(g, l, y, '#b6a283'); gset(g, r, y, '#b6a283'); }
    stripe(g, 2, 74, 26, 94, 3.4, 5); stripe(g, 97, 74, 73, 94, 3.4, 5);
    gell(g, 50, 87, 4.5, 2.8, P.snout); grect(g, 48, 86, 1, 1, '#5a4c43');
    for (const ex of [37, 63]) {
      if (blink) grect(g, ex - 4, 35, 8, 1, P.furO);
      else {
        grect(g, ex - 4, 31, 8, 1, P.furO); grect(g, ex - 4, 32, 8, 2, '#a8937a');
        grect(g, ex - 3, 34, 6, 2, '#1d1714');
      }
      grect(g, ex - 4, 37, 8, 1, '#8d7a64'); grect(g, ex - 3, 38, 6, 1, '#a08b72');
    }
  });
}
