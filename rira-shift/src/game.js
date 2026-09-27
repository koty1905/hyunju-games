'use strict';
// 퇴근 불가 — 리라네 근무표 (픽셀 게임)
// 배치 좌표는 320x180칸, 그림은 그 두 배(640x360)의 고해상도 격자에 찍는다.
// 캐릭터와 소품은 모두 코드 안의 픽셀 격자 함수로 그리고(외부 이미지 없음), 소리는 WebAudio로 합성한다.
(() => {
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

// ---------- 저장 (근무 일수만)
const KEY = 'rira-shift-v1';
let G = { day: 1, music: true, sfx: true };
try { const s = localStorage.getItem(KEY); if (s) G = Object.assign(G, JSON.parse(s)); } catch (e) { /* 저장소를 못 쓰면 1일차부터 */ }
function save() { try { localStorage.setItem(KEY, JSON.stringify(G)); } catch (e) { /* 무시 */ } }

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

// ---------- 리라 (40x46 격자 = 20x23칸, 발바닥이 맨 아래)
// kind: rira · alps · sister · seraphina · rosemarira · rosie · clerk · clerk2
// mood: n 보통 · h 웃음 · st 엄격 · so 엄숙 / ear: -1~1 귀 펄럭 / step: 발 들기 / arm: d 내림 · u 듦 · b 둘 다 듦
function rira(kind, o = {}) {
  const mood = o.mood || 'n', ear = Math.round((o.ear || 0) * 3) / 3, step = o.step || 0, arm = o.arm || 'd', blink = o.blink ? 1 : 0;
  const key = `r|${kind}|${mood}|${ear}|${step}|${arm}|${blink}`;
  return spr(key, 40, 46, g => {
    const cr = P.cr, nun = kind === 'sister' || kind === 'seraphina';
    // 수녀 베일(뒤)
    if (nun) { gell(g, 20, 17, 14, 12.5, P.ivory); gpoly(g, [[6, 17], [34, 17], [36, 35], [4, 35]], P.ivoryD); gpoly(g, [[7, 17], [33, 17], [34, 34], [6, 34]], P.ivory); }
    // 귀: 펄럭일 때 위아래로 들썩이고, 내려가면 바깥으로 벌어진다
    const ey = 8.5 - ear * 2.6, spread = 11 + Math.max(0, -ear) * 1.6 + Math.abs(ear) * .4;
    for (const s of [-1, 1]) {
      const x = 20 + s * spread;
      gell(g, x, ey, 4.6, 5.4, cr); gell(g, x, ey + .8, 2.4, 3.2, P.ear);
    }
    // 팔(몸 뒤)
    const armC = kind === 'alps' ? P.white : kind === 'rosemarira' ? P.plum : nun ? P.ivory : kind === 'clerk2' ? P.sleeve : cr;
    const armAt = (s, up) => up ? gell(g, 20 + s * 11, 24, 2.8, 3.8, armC) : gell(g, 20 + s * 10.2, 31, 2.8, 4.2, armC);
    armAt(-1, arm === 'u' || arm === 'b'); armAt(1, arm === 'b');
    // 몸
    gell(g, 20, 33, 10, 8.5, nun ? P.ivoryD : P.crS); gell(g, 20, 32, 9.5, 7.8, nun ? P.ivory : cr);
    if (kind === 'alps') {
      gell(g, 20, 29, 9, 5, P.white);
      gpoly(g, [[11, 31], [29, 31], [32, 40], [8, 40]], P.red); grect(g, 8, 39, 24, 1, P.redD);
      grect(g, 15, 32, 10, 6, P.white); for (let i = 15; i < 25; i += 2) gset(g, i, 38, P.white);
      grect(g, 14, 24, 2, 8, P.red); grect(g, 24, 24, 2, 8, P.red);
    } else if (kind === 'rosemarira') {
      gell(g, 20, 32, 9.5, 7.8, P.plum);
      gpoly(g, [[11, 30], [29, 30], [31, 41], [9, 41]], P.plum); grect(g, 9, 40, 22, 1, P.plumD);
      for (let y = 32; y < 40; y += 3) grect(g, 13, y, 14, 1, P.plumD);
    } else if (nun) {
      grect(g, 16, 26, 8, 13, P.ivoryL);
    }
    // 발 (드레스 밑으로 꼭 보이게 맨 나중에)
    const foot = (x, lift) => {
      const y = 42.3 - lift;
      gell(g, x, y, 4.6, 2.9, cr);
      gell(g, x, y + .6, 3, lift ? 2.2 : 1.6, P.pad);
    };
    foot(14.5, step < 0 ? 1.5 : 0); foot(25.5, step > 0 ? 1.5 : 0);
    // 머리
    gell(g, 20, 18, 12.5, 10.5, cr);
    if (nun) { gell(g, 20, 12.5, 12, 4.6, P.ivory); grect(g, 9, 13, 22, 2, P.ivoryL); }
    if (!nun && kind !== 'clerk') for (const [x, y] of [[13, 8], [17, 7], [22, 7], [26, 8]]) gset(g, x, y, cr);
    if (kind === 'rosie') {
      const bx = 29, by = 7 - ear * 2.6;
      gpoly(g, [[bx, by + 2], [bx - 5, by - 2], [bx - 5, by + 5]], P.pink); gpoly(g, [[bx, by + 2], [bx + 5, by - 2], [bx + 5, by + 5]], P.pink);
      gline(g, bx - 1, by + 3, bx - 4, by + 8, P.pink); gline(g, bx + 1, by + 3, bx + 3, by + 8, P.pink);
    }
    if (kind === 'clerk') { grect(g, 8, 9, 24, 2, P.green); gpoly(g, [[11, 11], [29, 11], [31, 13], [9, 13]], P.greenL); }
    // 앞팔
    if (arm === 'b') armAt(1, true);
    if (kind === 'clerk' && arm !== 'b') { grect(g, 24, 27, 11, 13, P.woodD); grect(g, 25, 29, 9, 10, P.white); grect(g, 28, 26, 3, 2, P.stone); }
    gout(g, P.ol);
    // 곱슬 털결
    gtex(g, cr, '#ede0c6', null, 13);
    if (kind === 'rosie') { const bx = 29, by = Math.floor(7 - ear * 2.6); grect(g, bx - 1, by + 1, 2, 2, P.pinkD); gset(g, bx - 3, by + 1, P.pinkD); gset(g, bx + 3, by + 1, P.pinkD); }
    // 테두리 뒤 세부
    if (kind === 'rosemarira') { grect(g, 15, 24, 10, 2, P.white); grect(g, 19, 25, 2, 2, P.ame); gset(g, 19, 25, '#d7b0f5'); gline(g, 27, 26, 29, 23, P.herbR); gset(g, 28, 24, P.greenL); }
    if (nun) {
      // 손으로 놓은 삐뚤삐뚤한 자수
      const st = kind === 'seraphina'
        ? [[20, 28, P.goldD], [20, 29, P.goldD], [21, 30, P.goldD], [20, 31, P.goldD], [20, 32, P.goldD], [18, 30, P.goldD], [19, 29, P.goldD], [22, 30, P.goldD], [23, 31, P.goldD]]
        : [[18, 31, P.pinkD], [20, 30, P.pinkD], [21, 32, P.pinkD], [19, 33, P.pinkD], [17, 35, '#5b8fd6'], [23, 34, '#5b8fd6'], [22, 36, P.green]];
      for (const [x, y, c] of st) gset(g, x, y, c);
    }
    // 얼굴: 털 코와 주둥이
    gell(g, 20, 22.5, 5.6, 3.7, P.crL);
    grect(g, 18, 18, 4, 1, P.nose); grect(g, 17, 19, 6, 1, P.nose); grect(g, 18, 20, 4, 1, P.nose); grect(g, 19, 21, 2, 1, P.nose);
    gset(g, 17, 18, P.noseL); gset(g, 22, 18, P.noseL); gset(g, 18, 18, P.noseL);
    const D = P.pupil;
    grect(g, 19, 22, 1, 2, P.ol);
    if (mood === 'st') grect(g, 17, 24, 6, 1, P.ol);
    else if (mood === 'h') { gset(g, 16, 23, P.ol); gset(g, 17, 24, P.ol); gset(g, 18, 24, P.ol); gset(g, 20, 24, P.ol); gset(g, 21, 24, P.ol); gset(g, 22, 23, P.ol); }
    for (const ex of [14, 25]) {
      const x0 = ex < 20 ? 12 : 24;
      if (blink) grect(g, x0, 16, 4, 1, D);
      else if (mood === 'h') { gset(g, x0, 16, D); gset(g, x0 + 1, 15, D); gset(g, x0 + 2, 15, D); gset(g, x0 + 3, 16, D); }
      else if (mood === 'so') { grect(g, x0, 14, 4, 1, P.crS); grect(g, x0, 15, 4, 1, D); grect(g, x0, 16, 4, 2, P.eye); grect(g, x0 + 1, 16, 2, 1, D); }
      else { grect(g, x0 + 1, 14, 2, 1, P.eye); grect(g, x0, 15, 4, 2, P.eye); grect(g, x0 + 1, 17, 2, 1, P.eye); grect(g, x0 + 1, 15, 2, 2, D); gset(g, x0 + 1, 15, P.white); }
      if (mood === 'st' && !blink) {
        if (ex < 20) { gset(g, 12, 12, D); gset(g, 13, 12, D); gset(g, 14, 13, D); gset(g, 15, 13, D); }
        else { gset(g, 24, 13, D); gset(g, 25, 13, D); gset(g, 26, 12, D); gset(g, 27, 12, D); }
      }
      if (mood === 'h') grect(g, ex < 20 ? 11 : 26, 20, 3, 1, P.blush);
    }
    if (kind === 'clerk2') {
      // 행정 리라: 동그란 안경
      for (const x0 of [11, 23]) { grect(g, x0, 13, 6, 1, P.ink); grect(g, x0, 18, 6, 1, P.ink); grect(g, x0, 13, 1, 6, P.ink); grect(g, x0 + 5, 13, 1, 6, P.ink); }
      grect(g, 17, 14, 6, 1, P.ink);
    }
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
// 사람 모습의 갓파더 (48x140 격자 = 24x70칸)
function human(f, hold) {
  return spr('hum' + f + (hold ? 'h' : ''), 48, 140, g => {
    const skin = '#f1cfae', hair = '#2d2420', card = '#7f8f6a', cardD = '#65744f', pants = '#3c475e', shoe = '#262626', bag = '#d8c7a0';
    const a = [0, 3, 0, -3][f];
    gpoly(g, [[18, 92], [24, 92], [24 - a, 133], [18 - a, 133]], pants); gpoly(g, [[25, 92], [31, 92], [31 + a, 133], [25 + a, 133]], pants);
    grect(g, 16 - a, 133, 9, 5, shoe); grect(g, 24 + a, 133, 10, 5, shoe);
    grect(g, 6, 70, 14, 20, bag); gline(g, 12, 70, 20, 52, '#a8946a');
    gpoly(g, [[16, 50], [33, 50], [35, 96], [14, 96]], card); grect(g, 23, 51, 4, 40, '#ece4d2');
    if (hold) { gpoly(g, [[30, 54], [36, 55], [44, 66], [40, 70]], cardD); grect(g, 38, 60, 10, 12, P.goldD); grect(g, 39, 61, 8, 10, P.gold); gell(g, 42, 68, 3, 3, skin); }
    else { gpoly(g, [[30, 52], [36, 54], [37, 86], [31, 86]], cardD); gell(g, 34, 88, 3, 3.5, skin); }
    grect(g, 21, 44, 7, 7, skin);
    gell(g, 24, 32, 11, 13, skin);
    gell(g, 23, 26, 12, 9, hair); grect(g, 13, 24, 18, 5, hair); grect(g, 12, 26, 5, 14, hair);
    gout(g, '#2c2320');
    grect(g, 26, 29, 7, 1, '#3a3a3a'); grect(g, 26, 29, 1, 6, '#3a3a3a'); grect(g, 32, 29, 1, 6, '#3a3a3a'); grect(g, 26, 34, 7, 1, '#3a3a3a');
    grect(g, 28, 32, 3, 1, '#2c2320'); grect(g, 28, 36, 3, 1, '#d9ae8f'); grect(g, 29, 41, 3, 1, '#9c5b4a');
  });
}
// 미니게임에서 쓰는 커다란 앞발 (60x40 격자, 발톱이 왼쪽)
function claw() {
  return spr('claw', 60, 40, g => {
    gpoly(g, [[60, 6], [60, 32], [30, 32], [22, 22], [28, 8]], P.fur);
    gell(g, 26, 20, 10, 11, P.fur);
    for (let k = 0; k < 3; k++) { const y = 11 + k * 7; gpoly(g, [[20, y], [20, y + 4], [6, y + 9], [3, y + 7], [10, y + 1]], P.claw); }
    gout(g, P.furO);
    gtex(g, P.fur, P.furD, P.furL);
  });
}

// ---------- 소품 (역: 스테이션)
function churnSpr(p = 0, butter = 0) {
  return spr('churn' + p + '|' + butter, 44, 84, g => {
    grect(g, 20, 4 + p, 4, 30, P.woodL); grect(g, 13, 2 + p, 18, 3, P.woodL);
    gpoly(g, [[8, 30], [36, 30], [39, 83], [5, 83]], P.wood);
    for (const y of [38, 58, 76]) gpoly(g, [[5, y], [39, y], [39, y + 3], [5, y + 3]], P.woodD);
    gell(g, 22, 30, 15, 3.6, P.woodL);
    if (butter) gell(g, 22, 28, 4 + butter * 3, 1.6 + butter, '#ffe27a');
    gout(g, P.ink);
    for (const x of [14, 22, 30]) for (let y = 34; y < 82; y++) if (gget(g, x, y) === P.wood) gset(g, x, y, P.woodD);
  });
}
function laundrySpr(n = 0, habit = false) {
  return spr('laundry' + n + habit, 100, 80, g => {
    grect(g, 2, 4, 3, 76, P.woodD); grect(g, 95, 4, 3, 76, P.woodD);
    const cols = habit ? [P.ivory, P.ivoryL, P.ivory, P.ivoryL] : [P.white, '#9fc3e8', P.pink, '#fff1b0'];
    for (let i = 0; i < n; i++) { const x = 12 + i * 20; grect(g, x, 11 + (i % 2), 14, 18, cols[i % 4]); if (habit) grect(g, x + 5, 16, 4, 2, P.pinkD); }
    gell(g, 50, 72, 19, 8, P.woodL); gell(g, 50, 67, 15, 5, habit ? P.ivory : P.white); gell(g, 45, 65, 7, 3, '#9fc3e8');
    gout(g, P.ink);
    gline(g, 4, 8, 50, 13, '#8a7a6a'); gline(g, 50, 13, 96, 8, '#8a7a6a');
    for (let y = 66; y < 80; y += 3) for (let x = 32; x < 70; x++) if (gget(g, x, y) === P.woodL) gset(g, x, y, P.wood);
  });
}
function doughSpr() {
  return spr('dough', 72, 56, g => {
    grect(g, 6, 32, 5, 24, P.woodD); grect(g, 61, 32, 5, 24, P.woodD);
    grect(g, 2, 26, 68, 7, P.woodL); grect(g, 2, 31, 68, 2, P.wood);
    gell(g, 22, 20, 13, 7, '#dfe7ee'); gell(g, 22, 15, 9, 5, P.dough);
    gell(g, 50, 22, 11, 5, P.dough); grect(g, 38, 12, 22, 3, P.woodL);
    gout(g, P.ink);
    for (const [x, y] of [[44, 24], [53, 20], [58, 23], [30, 24]]) gset(g, x, y, P.white);
  });
}
function cheeseWheel(g, x, y, r, flip) {
  gell(g, x, y, r, r, P.rind); gell(g, x, y, r - 1.8, r - 1.8, flip ? P.rind : P.cheese);
  if (!flip) { gset(g, x - 2, y - 1, P.rind); gset(g, x + 2, y + 2, P.rind); }
  else grect(g, x - 2, y, 5, 1, P.goldD);
}
function cheeseSpr() {
  return spr('cheese', 72, 84, g => {
    grect(g, 2, 0, 4, 84, P.woodD); grect(g, 66, 0, 4, 84, P.woodD);
    for (const y of [22, 46, 70]) grect(g, 2, y, 68, 4, P.wood);
    for (const [x, y] of [[18, 13], [36, 13], [54, 13], [18, 37], [36, 37], [54, 37], [24, 61]]) cheeseWheel(g, x, y, 8.5);
    gell(g, 50, 74, 13, 9, P.rind); gell(g, 50, 72, 11, 6, P.cheese);
    gout(g, P.ink);
  });
}
function embSpr() {
  return spr('emb', 52, 84, g => {
    grect(g, 24, 40, 4, 40, P.woodD); grect(g, 14, 80, 24, 4, P.woodD);
    gell(g, 26, 24, 22, 22, P.woodL); gell(g, 26, 24, 19, 19, P.ivoryL);
    gout(g, P.ink);
    const pts = [[26, 14], [30, 18], [33, 23], [29, 28], [26, 33], [22, 28], [18, 22], [22, 17]];
    for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; gline(g, x0, y0, x1 + (i % 3 - 1), y1, P.pinkD); }
    gline(g, 26, 34, 25, 40, P.green); gline(g, 25, 38, 21, 36, P.green);
  });
}
function herbsSpr() {
  return spr('herbs', 92, 52, g => {
    const H = [[16, P.herbR, 'r'], [46, P.herbL, 'l'], [76, P.herbM, 'm']];
    for (const [x, c, k] of H) {
      for (let i = -6; i <= 6; i += 3) {
        if (k === 'm') gell(g, x + i, 28 - Math.abs(i) * .6, 3, 2.4, c);
        else gline(g, x + i, 38, x + i * 1.3, 18 - (i % 2 ? 2 : 0), c, 2);
      }
      gell(g, x, 42, 14, 9, P.woodL); grect(g, x - 14, 34, 28, 3, P.wood);
    }
    gout(g, P.ink);
    for (const [x] of H) for (let y = 38; y < 50; y += 3) for (let i = -12; i <= 12; i++) if (gget(g, x + i, y) === P.woodL) gset(g, x + i, y, P.wood);
  });
}
function saltSpr() {
  return spr('salt', 88, 60, g => {
    grect(g, 6, 36, 5, 24, P.woodD); grect(g, 77, 36, 5, 24, P.woodD); grect(g, 2, 30, 84, 7, P.woodL);
    gell(g, 18, 24, 10, 7, P.stone); gell(g, 18, 20, 8, 2.5, P.salt); gline(g, 20, 20, 28, 6, P.stoneD, 3);
    grect(g, 44, 24, 18, 6, P.stoneD); grect(g, 52, 12, 2, 12, P.stoneD); gell(g, 53, 12, 11, 2.6, '#c0c6cc'); gell(g, 53, 10, 6, 2, P.salt);
    grect(g, 68, 14, 7, 16, '#e3f2f6'); grect(g, 69, 20, 5, 9, P.salt); grect(g, 77, 18, 6, 12, '#e3f2f6'); grect(g, 78, 22, 4, 7, P.salt);
    gout(g, P.ink);
  });
}
function deskSpr() {
  return spr('desk', 92, 72, g => {
    grect(g, 4, 34, 84, 38, P.woodD); grect(g, 2, 30, 88, 6, P.wood);
    grect(g, 10, 42, 30, 12, P.wood); grect(g, 10, 56, 30, 12, P.wood); grect(g, 23, 47, 4, 2, P.gold); grect(g, 23, 61, 4, 2, P.gold);
    for (let i = 0; i < 6; i++) grect(g, 52 + (i % 2), 26 - i * 4, 22, 4, i % 2 ? P.paperD : P.white);
    grect(g, 12, 22, 12, 6, P.stoneD); grect(g, 14, 20, 8, 3, P.red); grect(g, 16, 10, 4, 10, P.redD); gell(g, 18, 9, 4, 3, P.red);
    grect(g, 30, 25, 14, 4, '#3b3b6a');
    gout(g, P.ink);
  });
}
function doorSpr(open = 0) {
  return spr('door' + open, 64, 156, g => {
    grect(g, 0, 0, 64, 156, P.woodD);
    grect(g, 6, 8, 52, 148, open ? '#ffe9a8' : P.wood);
    if (open) { grect(g, 6, 8, Math.round(52 * (1 - open)), 148, P.wood); }
    else {
      grect(g, 12, 20, 40, 50, P.woodL); grect(g, 12, 82, 40, 60, P.woodL);
      grect(g, 14, 22, 36, 46, P.wood); grect(g, 14, 84, 36, 56, P.wood);
      gell(g, 49, 80, 3, 3, P.gold);
    }
    gout(g, P.ink);
  });
}
const STS = {
  churn: { x: 48, w: 44, h: 84, draw: () => churnSpr() },
  laundry: { x: 106, w: 100, h: 80, draw: s => laundrySpr(s.hung || 0) },
  dough: { x: 168, w: 72, h: 56, draw: () => doughSpr() },
  cheese: { x: 226, w: 72, h: 84, draw: () => cheeseSpr() },
  embroidery: { x: 284, w: 52, h: 84, draw: () => embSpr() },
  herbs: { x: 344, w: 92, h: 52, draw: () => herbsSpr() },
  salt: { x: 408, w: 88, h: 60, draw: () => saltSpr() },
  desk: { x: 476, w: 92, h: 72, draw: () => deskSpr() },
  door: { x: 566, w: 64, h: 156, draw: s => doorSpr(s.open || 0) },
};
for (const id in STS) Object.assign(STS[id], { id, vis: false, pop: 1, newT: 0, hung: 0, open: 0 });
const ROOM_W = 600, FLOOR = 112, ST_Y = 128, RIRA_Y = 136, PL_Y = 174;

// ---------- 리라들
const NAMES = { alps: '알프스 리라', sister: '시스터 리라', seraphina: '세라피나', rosemarira: '로즈마리라', rosie: '로지', clerk: '문지기 리라', clerk2: '행정 리라' };
const MOOD0 = { rosemarira: 'st', seraphina: 'so' };
const RIRAS = {};
function mkRira(id, x) { RIRAS[id] = { id, kind: id, x, tx: x, home: x, face: -1, vis: false, bub: null, bubT: 0, hop: 0, hopV: 0, flap: 0, flapT: rnd(1, 5), blinkT: rnd(1, 4), blink: 0, mood: MOOD0[id] || 'n', moodT: 0, walkT: 0, arm: 'd', armT: 0, ph: rnd(0, 6), popT: 1 }; }
mkRira('alps', 190); mkRira('sister', 140); mkRira('seraphina', 304); mkRira('rosemarira', 374);
mkRira('rosie', 436); mkRira('clerk2', 506); mkRira('clerk', 538);
const ALPS_ST = ['churn', 'dough', 'cheese'];

// ---------- 업무
const TASKS = {
  churn: { st: 'churn', sup: 'alps', eng: 'mash', name: '버터 만들기', pay: 18000, o: { need: 20 },
    lines: ['더 빨리요!', '알프스에선 이 정도는 산책이에요.', '버터는 기다려 주지 않아요!'], ok: '좋아요! 한 덩이 18,000원에 팔 거예요.' },
  laundry: { st: 'laundry', sup: 'sister', eng: 'wring', name: '빨래 짜서 널기', pay: 9000, o: { n: 3 },
    lines: ['빨래도 수행입니다.', '너무 세게 짜면 찢어져요.', '초록 칸에서 손을 떼세요.'], ok: '깨끗하군요. 세탁비는 청구하겠습니다.' },
  dough: { st: 'dough', sup: 'alps', eng: 'beat', name: '빵 반죽', pay: 24000, o: { n: 8, bpm: 92 },
    lines: ['고리가 반죽에 닿을 때!', '둥, 둥, 둥!', '반죽은 박자를 기억해요.'], ok: '내일 아침 빵 예약은 이미 다 찼어요!' },
  cheese: { st: 'cheese', sup: 'alps', eng: 'stop', name: '치즈 휠 정리', pay: 96000, o: { n: 3, speed: 1 },
    lines: ['반짝이는 칸에 넣어요!', '숙성 날짜별로 정리해요.', '치즈는 줄 서는 걸 좋아해요.'], ok: '정리 끝! 치즈 한 휠에 96,000원이에요.' },
  embroidery: { st: 'embroidery', sup: 'seraphina', eng: 'stitch', name: '자수 놓기', pay: 45000, o: { n: 8 },
    lines: ['……바늘이 내려올 때.', '……정성.', '……비뚤어져도 괜찮습니다.'], ok: '……정통 수제. 합격.' },
  herbs: { st: 'herbs', sup: 'rosemarira', eng: 'sort', name: '허브 분류', pay: 15000, o: { n: 6, k: 3, speed: 1 },
    lines: ['허브를 그렇게 담는 게 아닙니다.', '로즈메리는 로즈메리끼리.', '쓸데없는 짓은 안 하는 게 좋아요.'], ok: '……이번만은 봐 드리죠.' },
  salt: { st: 'salt', sup: 'rosie', eng: 'salt', name: '핑크 소금 소분', pay: 39000, o: { jars: 1, g: 12 },
    lines: ['곱게 빻아요!', '12그램에 39,000원이에요!', '이문이 남아야 장사죠!'], ok: '12그램에 39,000원! 벌써 예약 완판이에요!' },
  logbook: { st: 'desk', sup: 'clerk2', eng: 'conveyor', name: '근무일지 도장 받기', pay: 5000, o: { n: 7 },
    lines: ['네모 칸에 정확히 찍으세요.', '도장이 칸을 벗어나면 무효예요.', '행정은 신뢰예요.'], ok: '근무일지 접수 완료. 처리 기한은 30일입니다.' },
  herbs2: { st: 'herbs', sup: 'rosemarira', eng: 'sort', name: '허브 재분류 (재검수)', pay: 15000, o: { n: 6, k: 4, speed: 1.3 },
    lines: ['재검수 결과, 전부 다시입니다.', '캐모마일이 섞였더군요.', '규칙은 규칙이에요.'], ok: '재분류 확인. 재재검수는 다음 주에 합니다.' },
  cheese2: { st: 'cheese', sup: 'alps', eng: 'stop', name: '치즈 휠 뒤집기', pay: 30000, o: { n: 4, speed: 1.4, flip: true },
    lines: ['숙성 3일차는 뒤집어야 해요!', '반짝이는 걸 뒤집어요!', '치즈도 돌아누워야 잠이 와요.'], ok: '뒤집기 완료! 숙성비는 따로 받아요.' },
  salt2: { st: 'salt', sup: 'rosie', eng: 'salt', name: '핑크 소금 선물 세트', pay: 256000, o: { jars: 2, g: 30 },
    lines: ['선물 세트는 30그램씩!', '포장비는 따로예요!', '리본은 제가 묶을게요. 유료로.'], ok: '선물 세트 두 개! 128,000원씩이에요!' },
  embroidery2: { st: 'embroidery', sup: 'seraphina', eng: 'stitch', name: '명찰 수놓기', pay: 20000, o: { n: 10, label: true },
    lines: ['……명찰이 없으면 근무자가 아닙니다.', '……이름을 수놓으세요.', '……비뚤어진 글씨도 이름입니다.'], ok: '……갓파더. 합격. 명찰 제작비는 급여에서 공제합니다.' },
  laundry2: { st: 'laundry', sup: 'sister', eng: 'wring', name: '수녀복 빨래', pay: 12000, o: { n: 4, speed: 1.25, habit: true },
    lines: ['수녀복은 아이보리색입니다. 검은색이 아니에요.', '손자수가 풀리지 않게 살살.', '이것도 수행입니다.'], ok: '정갈하군요. 다림질은 내일 하시죠.' },
  churn2: { st: 'churn', sup: 'alps', eng: 'mash', name: '무염 버터 (2차)', pay: 18000, o: { need: 28, decay: 1.4 },
    lines: ['2차는 무염이에요!', '소금은 로지가 따로 팔아요!', '팔을 더 크게!'], ok: '무염 버터 완성! 소금은 로지네서 사세요.' },
  dough2: { st: 'dough', sup: 'alps', eng: 'beat', name: '내일 아침 빵 반죽', pay: 24000, o: { n: 10, bpm: 112 },
    lines: ['내일 아침 빵이에요!', '누가 굽냐고요? 갓파더님이요.', '둥, 둥, 둥!'], ok: '내일 아침 여섯 시에 구워요. 갓파더님이.' },
  leaveForm: { st: 'desk', sup: 'clerk2', eng: 'approval', name: '퇴근 신청서 작성·결재', pay: 3000, o: {},
    lines: ['세 칸을 다 채우세요.', '결재는 다섯 단계예요.', '재촉하면 늦어집니다.'], ok: '결재 완료! 서명은 문에서 하세요.' },
  signOut: { st: 'door', sup: 'clerk', eng: 'sign', name: '퇴근 확인서 서명', pay: 0, o: {},
    lines: ['여기, 발도장이요.', '꾹 누르고 계세요.', '거의 다 왔어요!'], ok: '' },
};
const ROUNDS = [
  { tasks: ['churn', 'laundry', 'dough', 'cheese', 'embroidery', 'herbs', 'salt'] },
  { tasks: ['logbook'], pop: 'desk', notice: '근무일지 제출 필수',
    lines: [['clerk', '근무일지를 제출하셔야죠. 행정실은 저쪽이에요.'], ['clerk2', '도장 일곱 개. 규정입니다.']] },
  { tasks: ['herbs2', 'cheese2', 'salt2'], notice: '재검수 완료 후 퇴근',
    lines: [['rosemarira', '허브 재검수 결과가 나왔습니다. 재분류하세요.'], ['alps', '치즈는 매일 뒤집어 줘야 해요!'], ['rosie', '선물 세트 주문이 들어왔어요!']] },
  { tasks: ['embroidery2', 'laundry2', 'churn2', 'dough2'], notice: '2차 업무 안내 참조',
    lines: [['seraphina', '……명찰이 없으시더군요.'], ['sister', '수녀복도 빨아야지요.'], ['alps', '내일 아침 빵이랑 버터요!']] },
  { tasks: ['leaveForm'], notice: '퇴근 신청서 결재 필수',
    lines: [['clerk', '퇴근하려면 퇴근 신청서가 필요해요.'], ['clerk2', '결재까지 받아 오세요. 다섯 단계예요.']] },
  { tasks: ['signOut'], notice: '결재 완료자만 퇴근',
    lines: [['clerk', '결재가 났어요! 이제 서명만 하시면 돼요.']] },
];
const TOTAL = ROUNDS.reduce((n, r) => n + r.tasks.length, 0);

// ---------- 게임 상태
let MODE = 'title', ET = 0, T = 0;
let STAGE = 'intro'; // intro: 사람 모습으로 퇴근하려는 중 · work: 근무 중
let RD = 0; const DONE = new Set();
let money = 0, stamina = 100, clockMin = 18 * 60, roamT = 0, attempts = 0, notices = [];
const PL = { x: 360, face: 1, form: 'human', walkT: 0, moving: false, auto: null, tgt: null, tgtAct: false, hold: false, morph: -1, idleT: 0, bub: null, bubT: 0 };
const CAM = { x: 200, to: null };
let SYS = null, DLG = null, MG = null, PROMPT = null, SHAKE = 0, FLASH = 0;
let toastMsg = '', toastT = 0, tutT = 0, sel = 0, recShake = 0, leaveCD = 0;
const PARTS = [];
function toast(m) { toastMsg = m; toastT = 2.6; }
const pending = () => ROUNDS[RD].tasks.filter(t => !DONE.has(t));
const planned = () => { let n = 0; for (let i = 0; i <= RD; i++) n += ROUNDS[i].tasks.length; return n; };
const taskAt = st => pending().find(t => TASKS[t].st === st);
const half = () => PL.form === 'ant' ? 44 : 10;
function bubble(who, s, t = 2.4) {
  const a = who === 'pl' ? PL : RIRAS[who];
  a.bub = s; a.bubT = t;
  if (who !== 'pl') { SFX.rira(); a.flap = .6; }
}
function puff(x, y, n = 12, c = P.white) {
  for (let i = 0; i < n; i++) PARTS.push({ x, y, vx: rnd(-30, 30), vy: rnd(-40, -5), life: rnd(.4, .8), c, s: pick([1, 1.5, 2]) });
}
function floatText(x, y, s, c = P.green) { PARTS.push({ x, y, vx: 0, vy: -14, life: 1.6, txt: s, c }); }

function resetDay() {
  RD = 0; DONE.clear(); money = 0; stamina = 100; clockMin = 18 * 60; roamT = 0; attempts = 0; notices = [];
  STAGE = 'intro'; SYS = DLG = MG = PROMPT = null; PARTS.length = 0;
  Object.assign(PL, { x: 360, face: 1, form: 'human', auto: null, tgt: null, hold: false, morph: -1, bub: null });
  for (const id in STS) Object.assign(STS[id], { vis: id === 'door', pop: 1, newT: 0, hung: 0, open: 0 });
  for (const id in RIRAS) { const r = RIRAS[id]; Object.assign(r, { x: r.home, tx: r.home, vis: false, bub: null, mood: MOOD0[id] || 'n', hop: 0, hopV: 0 }); }
  CAM.x = 200; CAM.to = null;
}

// ---------- 연출 스크립트 (제너레이터가 기다림 함수를 내놓으면 끝날 때까지 기다린다)
let SCR = null;
function run(gen) { SCR = { it: gen, w: null }; }
function tickScript(dt) {
  let guard = 0;
  while (SCR && guard++ < 60) {
    if (SCR.w) { if (!SCR.w(dt)) return; SCR.w = null; dt = 0; }
    const r = SCR.it.next();
    if (r.done) { SCR = null; return; }
    SCR.w = r.value || null;
  }
}
const wait = t => { let e = 0; return dt => (e += dt) >= t; };
const walkTo = x => { PL.auto = x; return () => PL.auto === null; };
const pressW = () => () => { if (I.p) { I.p = false; return true; } return false; };
function* talk(who, s) { DLG = { who, s, n: 0 }; SFX.rira(); if (RIRAS[who]) RIRAS[who].flap = .8; yield () => !DLG; }
function* sysm(msg, kind) {
  SYS = { msg, kind, n: 0, t: 0 };
  if (kind === 'bad') { SFX.incomplete(); SHAKE = .4; } else if (kind === 'new') SFX.unlock(); else SFX.confirmed();
  yield () => !SYS;
}
function camFocus(x) { CAM.to = clamp(x - W / 2, 0, ROOM_W - W); }
function popSt(id) { const s = STS[id]; s.vis = true; s.pop = 0; puff(s.x, ST_Y - 10, 16); SFX.pop(); }
function popRira(id, x) { const r = RIRAS[id]; if (x != null) { r.x = r.tx = x; } r.vis = true; r.popT = 0; r.hopV = -60; puff(r.x, RIRA_Y - 8, 8, P.cr); r.flap = 1; }

function* scriptIntro() {
  resetDay(); MODE = 'play'; playTrack(null);
  PL.x = 330; CAM.x = clamp(PL.x - 160, 0, ROOM_W - W);
  yield wait(.8);
  SFX.bell(); bubble('pl', '18시 정각. 퇴근이다.', 2.2);
  yield wait(1.4);
  yield walkTo(400);
  yield wait(.3);
  const seq = [['churn', 'alps', 58, '버터 교반기'], ['laundry', 'sister', null, '빨래'], ['dough', null, null, '빵 반죽'], ['cheese', null, null, '치즈 휠'],
    ['embroidery', 'seraphina', null, '자수틀'], ['herbs', 'rosemarira', null, '허브 바구니'], ['salt', 'rosie', null, '핑크 소금 도구']];
  PL.face = -1; bubble('pl', '……?', 5);
  for (const [sid, rid, rx, label] of seq) {
    camFocus(STS[sid].x); yield wait(.45);
    popSt(sid); floatText(STS[sid].x, ST_Y - STS[sid].h / 2 - 8, label + ' 등장', P.ink);
    if (rid) { popRira(rid, rx); }
    yield wait(.6);
  }
  RIRAS.alps.tx = RIRAS.alps.home;
  camFocus(PL.x); yield wait(.9); CAM.to = null;
  bubble('pl', '……못 본 걸로 하자.', 2.4);
  yield wait(1.6);
  PL.face = 1; playTrack('room');
  toast('→ 문으로 가서 퇴근하기');
}
function* scriptFirstDoor() {
  PL.auto = PL.x - 14;
  yield* sysm('SHIFT INCOMPLETE.', 'bad');
  popRira('clerk'); RIRAS.clerk.face = -1;
  yield* talk('clerk', '갓파더님, 오늘 근무일지요. 받으세요.');
  PROMPT = '근무일지 받기';
  yield pressW();
  PROMPT = null; PL.hold = true; SFX.paper();
  yield wait(.6);
  PL.morph = 0; SFX.morph();
  yield wait(1.5);
  PL.form = 'ant'; PL.morph = -1; PL.hold = false; FLASH = .4; SFX.poof(); puff(PL.x, PL_Y - 24, 30);
  yield wait(.6);
  yield* sysm('CLASS CHANGE: ANTEATER.', 'new');
  bubble('pl', '……', 2);
  yield wait(1);
  yield* talk('clerk', '업무는 일곱 가지예요. 웃으면서 해요!');
  yield* talk('rosie', '잘 부탁해요, 갓파더님!');
  STAGE = 'work'; tutT = 7; roamT = 0;
}
function* scriptIncomplete() {
  attempts++;
  PL.auto = PL.x - 18;
  yield* sysm('SHIFT INCOMPLETE.', 'bad');
  const n = pending().length;
  bubble('clerk', pick([`남은 업무가 ${n}건 있어요.`, '규정입니다.', `${n}건 남았어요. 웃으면서 해요!`, '퇴근은 업무가 끝난 뒤에 하는 거예요.']), 2.6);
}
function* scriptUnlock() {
  attempts++;
  PL.auto = PL.x - 18;
  if (RD === ROUNDS.length - 2) {
    // 마지막 희망: 문이 조금 열린다
    STS.door.open = .35; SFX.hope(); bubble('pl', '문이……!', 1.6);
    yield wait(1.6);
    popRira('clerk'); RIRAS.clerk.x = RIRAS.clerk.tx = 538;
    STS.door.open = 0; SFX.paper();
  }
  yield* sysm('NEW TASK UNLOCKED.', 'new');
  RD++; const rd = ROUNDS[RD];
  notices.push(rd.notice);
  if (rd.pop) {
    camFocus(STS[rd.pop].x); yield wait(.5);
    popSt(rd.pop); popRira('clerk2'); yield wait(.9);
    CAM.to = null;
  }
  for (const [who, line] of rd.lines) yield* talk(who, line);
  for (const t of rd.tasks) STS[TASKS[t].st].newT = 6;
  toast(`새 업무 ${rd.tasks.length}건 · 전체 ${planned()}건`);
}
function* scriptEnding() {
  playTrack(null); clockMin = 24 * 60;
  for (let i = 0; i < 3; i++) { SFX.bell(); yield wait(.55); }
  yield* sysm("TOMORROW'S SHIFT CONFIRMED.", 'ok');
  const cheer = { alps: '수고하셨어요!', sister: '내일도 수행입니다.', seraphina: '……합격.', rosemarira: '지각은 규정 위반입니다.', rosie: '내일 봬요!', clerk: '출근 도장은 여섯 시예요!', clerk2: '서류 접수 완료.' };
  for (const id in RIRAS) { const r = RIRAS[id]; if (!r.vis) continue; r.mood = 'h'; r.moodT = 99; r.hopV = -70; bubble(id, cheer[id], 3); }
  yield wait(2.8);
  MODE = 'rosie'; ET = 0; SFX.rira();
  yield wait(3.8);
  MODE = 'stare'; ET = 0;
  yield wait(4.6);
  MODE = 'receipt'; ET = 0; sel = 0; playTrack('box');
}

function tryLeave() {
  PL.tgt = null; leaveCD = .8;
  if (STAGE === 'intro') return run(scriptFirstDoor());
  const p = pending();
  if (p.includes('signOut')) return beginTask('signOut');
  if (p.length) return run(scriptIncomplete());
  run(scriptUnlock());
}

// ---------- 미니게임
const PX = 30, PY = 14, PW = 260, PH = 152;
const A = { x: 118, y: 32, w: 164, h: 110 };
const ENG = {};
function beginTask(id) {
  const def = TASKS[id];
  MG = { id, def, eng: ENG[def.eng](def.o, def), t: 0, doneT: -1, line: 0, lineT: 3.2 };
  PL.tgt = null;
  playTrack(def.eng === 'approval' ? 'wait' : 'work');
}
function finishTask() {
  const id = MG.id, def = MG.def; MG = null;
  DONE.add(id); roamT = 0;
  if (id === 'signOut') { run(scriptEnding()); return; }
  money += def.pay; stamina = Math.max(1, stamina - 6);
  const st = STS[def.st];
  if (def.pay) floatText(st.x, ST_Y - st.h / 2 - 6, '+' + won(def.pay), P.green);
  if (def.st === 'laundry') st.hung = def.o.habit ? 4 : 3;
  const r = RIRAS[def.sup]; r.mood = 'h'; r.moodT = 3; r.hopV = -50;
  bubble(def.sup, def.ok, 3.4);
  playTrack('room');
  if (!pending().length) setTimeout(() => { if (RIRAS.clerk.vis && MODE === 'play') bubble('clerk', '다 끝났어요? 그럼 퇴근…… 해 보세요.', 3); }, 1800);
}
function updateMG(dt) {
  MG.t += dt; MG.overT = (MG.overT || 0) - dt;
  if (MG.doneT < 0) {
    MG.eng.update(dt);
    MG.lineT -= dt;
    if (MG.lineT <= 0) { MG.line = (MG.line + 1) % MG.def.lines.length; MG.lineT = 3.2; RIRAS[MG.def.sup].flap = .5; }
    if (MG.eng.done) { MG.doneT = 0; if (MG.def.eng !== 'sign') SFX.stamp(); }
  } else {
    MG.doneT += dt;
    if (MG.doneT > (MG.def.eng === 'sign' ? .2 : 1.5)) finishTask();
  }
  I.p = false;
}
const bar = (x, y, w, h, v, c = P.green) => { box(x, y, w, h, P.paperD); R(x + 1, y + 1, Math.round((w - 2) * clamp(v, 0, 1) * 2) / 2, h - 2, c); };

// 연타: 버터 교반기
ENG.mash = o => {
  const e = { v: 0, need: o.need, pl: 0, done: false, hint: 'Space 연타! (빠르게 여러 번 누르기)',
    update(dt) {
      if (I.p) { e.v += 1; e.pl = 1; SFX.churn(); if (e.v >= e.need) e.done = true; }
      e.v = Math.max(0, e.v - dt * 1.2 * (o.decay || 1)); e.pl = Math.max(0, e.pl - dt * 7);
    },
    draw() {
      const p = Math.round(e.pl * 8), b = Math.min(3, Math.floor(e.v / e.need * 4));
      const cx = A.x + 28, cy = A.y + 26;
      blit(churnSpr(p, b), cx, cy, false, 2);
      blit(claw(), cx + 26, cy + p - 6, false, 1);
      text('버터', A.x + A.w - 20, A.y + 2, { f: F.s, a: 'center' });
      box(A.x + A.w - 26, A.y + 12, 12, 88, P.paperD);
      const fh = Math.round(86 * clamp(e.v / e.need, 0, 1));
      R(A.x + A.w - 25, A.y + 99 - fh, 10, fh, '#ffe27a');
    } };
  return e;
};
// 누르고 있다가 떼기: 빨래 짜기
ENG.wring = o => {
  const cols = o.habit ? [P.ivory, P.ivoryL] : [P.white, '#9fc3e8', P.pink, '#fff1b0'];
  const e = { n: o.n, k: 0, tw: 0, msg: '', msgT: 0, drops: [], done: false, hint: 'Space 누르고 있기 → 초록 칸에서 떼기',
    update(dt) {
      e.msgT -= dt;
      if (I.h) {
        e.tw += dt * .55 * (o.speed || 1);
        if (Math.random() < dt * 8) SFX.twist();
        if (e.tw > .3 && Math.random() < dt * 10) e.drops.push({ x: A.x + rnd(30, 120), y: A.y + 64, v: 0 });
        if (e.tw >= 1) { e.tw = 0; e.msg = '찢어졌어요! 새것으로.'; e.msgT = 1.4; SFX.tear(); }
      }
      if (I.r) {
        if (e.tw >= .62 && e.tw <= .88) { e.k++; SFX.good(); e.msg = '탁!'; e.msgT = .8; if (e.k >= e.n) e.done = true; }
        else if (e.tw > .05) { SFX.buzz(); e.msg = '덜 짰어요.'; e.msgT = 1; }
        e.tw = 0;
      }
      for (const d of e.drops) { d.v += 200 * dt; d.y += d.v * dt; }
      e.drops = e.drops.filter(d => d.y < A.y + 100);
    },
    draw() {
      pline(A.x, A.y + 6, A.x + A.w / 2, A.y + 10, P.ink2); pline(A.x + A.w / 2, A.y + 10, A.x + A.w, A.y + 6, P.ink2);
      for (let i = 0; i < e.k; i++) { const x = A.x + 8 + i * 22; box(x, A.y + 8, 16, 18, cols[i % cols.length]); R(x + 6, A.y + 6, 3, 4, P.woodD); if (o.habit) R(x + 5, A.y + 14, 5, 2, P.pinkD); }
      if (!e.done) {
        const y = A.y + 50, x0 = A.x + 34, w = 92, stripes = 2 + Math.floor(e.tw * 12), c = cols[e.k % cols.length];
        box(x0, y, w, 14, c);
        for (let i = 0; i < stripes; i++) { const sx = x0 + 4 + i * (w - 8) / stripes; pline(sx, y + 2, sx + 5, y + 12, o.habit ? P.ivoryD : P.paperD, 1); }
        blit(claw(), x0 - 26, y - 13, true); blit(claw(), x0 + w - 4, y - 13, false);
      }
      for (const d of e.drops) R(d.x, d.y, 1, 2, '#6fb3e8');
      const mx = A.x + 22, my = A.y + 84, mw = 120;
      box(mx, my, mw, 9, P.paperD);
      R(mx + 1 + mw * .62, my + 1, mw * .26, 7, P.greenL); R(mx + mw * .9, my + 1, mw * .1 - 1, 7, '#f29a9a');
      R(mx + 1 + (mw - 3) * clamp(e.tw, 0, 1), my - 2, 2, 13, P.ink);
      text(`${e.k} / ${e.n}`, A.x + A.w - 4, my + 12, { f: F.s, a: 'right' });
      if (e.msgT > 0) text(e.msg, A.x + A.w / 2, A.y + 70, { f: F.b, a: 'center', c: P.redD, o: P.paper });
    } };
  return e;
};
// 박자: 빵 반죽
ENG.beat = o => {
  const e = { n: o.n, k: 0, ph: 0, sq: 0, side: 0, msg: '', msgT: 0, done: false, hint: 'Space: 고리가 반죽에 닿을 때!',
    update(dt) {
      e.msgT -= dt; e.sq = Math.max(0, e.sq - dt * 5);
      e.ph += dt * o.bpm / 60; if (e.ph >= 1) { e.ph -= 1; SFX.tick(); }
      if (I.p) {
        const off = Math.min(e.ph, 1 - e.ph);
        if (off < .17) { e.k++; e.sq = 1; e.side ^= 1; SFX.squish(); e.msg = pick(['좋아요!', '둥!', '쫀득!']); e.msgT = .6; if (e.k >= e.n) e.done = true; }
        else { SFX.buzz(); e.msg = '반죽이 삐졌어요.'; e.msgT = .9; }
      }
    },
    draw() {
      const cx = A.x + 78, cy = A.y + 60;
      R(A.x + 20, cy + 12, 116, 6, P.woodL); R(A.x + 20, cy + 18, 116, 2, P.wood);
      const rx = 18 + e.sq * 5, ry = 10 - e.sq * 3;
      const k = 'blob' + Math.round(rx) + '_' + Math.round(ry);
      blit(spr(k, 80, 44, g => { gell(g, 40, 44 - ry * 2, rx * 2, ry * 2, P.dough); gell(g, 40, 44 - ry * 2 - 3, rx * 1.6, ry * 1.2, '#fbecc9'); gout(g, P.doughD); }), cx - 20, cy + 13 - 22);
      if (!e.done) { const r = Math.round(20 + 26 * (1 - e.ph)); blit(ring(r, e.ph > .83 ? P.green : P.goldD), cx - r - .5, cy - r - .5); }
      blit(claw(), e.side ? cx + 6 : cx - 36, cy - 24 + e.sq * 6, !e.side);
      text(`${e.k} / ${e.n}`, A.x + A.w - 4, A.y + 100, { f: F.s, a: 'right' });
      if (e.msgT > 0) text(e.msg, cx, A.y + 2, { f: F.b, a: 'center', c: P.redD, o: P.paper });
    } };
  return e;
};
// 멈추기: 치즈 휠 정리 · 뒤집기
ENG.stop = o => {
  const e = { n: o.n, k: 0, x: 0, dir: 1, filled: [], target: ri(0, 4), msg: '', msgT: 0, flipT: 0, done: false, hint: 'Space: 반짝이는 칸 위에서 누르기',
    update(dt) {
      e.msgT -= dt; e.flipT = Math.max(0, e.flipT - dt);
      e.x += e.dir * dt * .9 * o.speed; if (e.x > 1) { e.x = 1; e.dir = -1; } if (e.x < 0) { e.x = 0; e.dir = 1; }
      if (I.p) {
        const slot = Math.round(e.x * 4);
        if (slot === e.target) {
          e.filled.push(slot); e.k++; SFX.place(); e.flipT = .4;
          if (e.k >= e.n) e.done = true;
          else { const free = [0, 1, 2, 3, 4].filter(s => !e.filled.includes(s)); e.target = pick(free.length ? free : [0, 1, 2, 3, 4]); }
        } else { SFX.buzz(); e.msg = pick(['거긴 숙성 3일차 칸이에요!', '반짝이는 칸이요!']); e.msgT = 1.1; }
      }
    },
    draw() {
      const x0 = A.x + 6, sw = 30, y = A.y + 84;
      R(A.x + 2, y, A.w - 4, 5, P.wood); R(A.x + 2, y + 5, A.w - 4, 2, P.woodD);
      for (let s = 0; s < 5; s++) {
        const sx = x0 + s * sw;
        if (s === e.target && !e.done && Math.floor(T * 5) % 2) R(sx + 2, y - 26, sw - 4, 26, '#fff3a8');
        const full = e.filled.includes(s) || o.flip;
        if (full) blit(spr('cw' + (o.flip && e.filled.includes(s) ? 1 : 0), 40, 40, g => { cheeseWheel(g, 20, 20, 18, o.flip && false); gout(g, P.ink); if (o.flip && e.filled.includes(s)) { grect(g, 12, 18, 16, 2, P.goldD); } }), sx + 5, y - 20);
      }
      if (!e.done) {
        const cx = x0 + e.x * 4 * sw + sw / 2;
        pline(cx, A.y + 26, cx, y - 22, P.ink2);
        if (!o.flip) blit(spr('cw0', 40, 40, g => { cheeseWheel(g, 20, 20, 18); gout(g, P.ink); }), cx - 10, A.y + 6);
        blit(claw(), cx + 4, A.y + 2);
      }
      text(o.flip ? `뒤집기 ${e.k} / ${e.n}` : `${e.k} / ${e.n}`, A.x + A.w - 4, A.y + 100, { f: F.s, a: 'right' });
      if (e.msgT > 0) text(e.msg, A.x + A.w / 2, A.y + 36, { f: F.b, a: 'center', c: P.redD, o: P.paper });
    } };
  return e;
};
// 타이밍: 자수 (결과는 늘 비뚤어지고, 늘 합격한다)
ENG.stitch = o => {
  const cx = A.x + 76, cy = A.y + 52, path = [];
  for (let i = 0; i < o.n; i++) {
    if (o.label) path.push([cx - 34 + i * 68 / (o.n - 1), cy + Math.sin(i * 1.3) * 3]);
    else { const a = i / o.n * Math.PI * 2 - Math.PI / 2, r = 20 + 9 * Math.cos(a * 4); path.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  }
  const e = { n: o.n, k: 0, ph: 0, sts: [], msg: '', msgT: 0, done: false, hint: 'Space: 바늘이 천에 닿을 때',
    update(dt) {
      e.msgT -= dt; e.ph = (e.ph + dt * 1.2) % 1;
      if (I.p) {
        const err = Math.abs(e.ph - .5) * 2, j = err * 7 + rnd(0, 1.5);
        const [px, py] = path[e.k];
        e.sts.push([px + rnd(-j, j), py + rnd(-j, j)]); e.k++; SFX.stitch();
        e.msg = err < .3 ? '……정성.' : '……비뚤어졌군요. 좋습니다.'; e.msgT = .9;
        if (e.k >= e.n) e.done = true;
      }
    },
    draw() {
      blit(disc(46, P.woodL), cx - 46.5, cy - 46.5); blit(disc(43, P.ivoryL), cx - 43.5, cy - 43.5);
      for (let i = e.k; i < e.n; i++) R(path[i][0], path[i][1], 1, 1, P.paperD);
      for (let i = 1; i < e.sts.length; i++) pline(e.sts[i - 1][0], e.sts[i - 1][1], e.sts[i][0], e.sts[i][1], P.pinkD, 1);
      if (!o.label && e.done && e.sts.length >= e.n) pline(e.sts[e.n - 1][0], e.sts[e.n - 1][1], e.sts[0][0], e.sts[0][1], P.pinkD, 1);
      if (o.label && e.done) {
        const s = '갓파더'; ctx.font = F.b;
        for (let i = 0; i < 3; i++) text(s[i], cx - 22 + i * 16 + (i === 1 ? 2 : 0), cy + 6 + (i - 1) * 3 * (i === 2 ? -1 : 1), { f: F.b, c: P.redD });
      }
      if (!e.done) {
        const [nx, ny] = path[e.k], dy = Math.cos(e.ph * Math.PI * 2) * 10;
        blit(ring(3, Math.abs(e.ph - .5) < .15 ? P.green : P.goldD, 1), nx - 3.5, ny - 3.5);
        R(nx, ny - 18 + dy, 1, 14, P.stoneD); R(nx, ny - 18 + dy, 1, 2, P.white);
        pline(nx + .5, ny - 17 + dy, nx + 12, ny - 30, P.pinkD);
      }
      text(`${e.k} / ${e.n}`, A.x + A.w - 4, A.y + 100, { f: F.s, a: 'right' });
      if (e.msgT > 0) text(e.msg, cx, A.y - 2, { f: F.m, a: 'center', c: P.ink2, o: P.paper });
    } };
  return e;
};
// 한 번 누르기: 허브 분류 (긴 주둥이로 옮긴다)
const HERB = [{ n: '로즈메리', c: P.herbR }, { n: '라벤더', c: P.herbL }, { n: '민트', c: P.herbM }, { n: '캐모마일', c: P.herbC }];
function herbIcon(i) {
  return spr('herb' + i, 20, 24, g => {
    const c = HERB[i].c;
    if (i === 3) { for (const [x, y] of [[6, 6], [14, 6], [10, 12]]) { gell(g, x, y, 4, 4, c); gell(g, x, y, 1.6, 1.6, P.gold); } gline(g, 10, 14, 10, 23, P.herbR); }
    else if (i === 2) { gline(g, 10, 4, 10, 23, P.herbR); for (let y = 5; y < 20; y += 5) { gell(g, 6, y, 3.4, 2.4, c); gell(g, 14, y, 3.4, 2.4, c); } }
    else { gline(g, 10, 2, 10, 23, P.herbR, 2); for (let y = 3; y < 20; y += 2) { gset(g, 7, y, c); gset(g, 13, y + 1, c); gset(g, 8, y, c); gset(g, 12, y + 1, c); } }
    gout(g, P.ink);
  });
}
ENG.sort = o => {
  const e = { n: o.n, k: 0, K: o.k, x: 0, dir: 1, cur: ri(0, o.k - 1), drop: null, msg: '', msgT: 0, done: false, counts: [0, 0, 0, 0], forms: 0, hint: 'Space: 맞는 바구니 위에서 내려놓기',
    update(dt) {
      e.msgT -= dt;
      if (e.drop) {
        e.drop.t += dt * 3;
        if (e.drop.t >= 1) {
          if (e.drop.b === e.cur) { e.k++; e.counts[e.cur]++; SFX.good(); e.cur = ri(0, e.K - 1); if (e.k >= e.n) e.done = true; }
          else { SFX.buzz(); e.forms++; e.msg = `재분류 신청서 ${e.forms}장 작성!`; e.msgT = 1.2; }
          e.drop = null;
        }
        return;
      }
      e.x += e.dir * dt * .8 * o.speed; if (e.x > 1) { e.x = 1; e.dir = -1; } if (e.x < 0) { e.x = 0; e.dir = 1; }
      if (I.p) { e.drop = { b: Math.round(e.x * (e.K - 1)), t: 0 }; SFX.drop(); }
    },
    draw() {
      const bx = i => A.x + 16 + i * (A.w - 32) / (e.K - 1);
      for (let i = 0; i < e.K; i++) {
        const x = bx(i);
        blit(spr('basket', 40, 26, g => { gell(g, 20, 14, 19, 11, P.woodL); grect(g, 1, 4, 38, 4, P.wood); gout(g, P.ink); for (let y = 12; y < 24; y += 3) for (let xx = 0; xx < 40; xx++) if (gget(g, xx, y) === P.woodL) gset(g, xx, y, P.wood); }), x - 10, A.y + 80);
        for (let j = 0; j < Math.min(3, e.counts[i]); j++) blit(herbIcon(i), x - 9 + j * 4, A.y + 70);
        text(HERB[i].n, x, A.y + 94, { f: F.s, a: 'center' });
      }
      const tipX = e.drop ? bx(e.drop.b) : bx(0) + e.x * (bx(e.K - 1) - bx(0)), sy = A.y + 18;
      R(tipX, sy, A.x + A.w + 6 - tipX, 7, P.fur); R(tipX, sy - 1, A.x + A.w + 6 - tipX, 1, P.furO); R(tipX, sy + 7, A.x + A.w + 6 - tipX, 1, P.furO);
      R(tipX - 3, sy + 1, 4, 5, P.snout);
      if (!e.done) {
        const hy = e.drop ? lerp(sy + 6, A.y + 70, e.drop.t) : sy + 6;
        blit(herbIcon(e.cur), tipX - 5, hy);
        text('이건: ' + HERB[e.cur].n, A.x + 4, A.y + 2, { f: F.b, c: HERB[e.cur].c === P.herbC ? P.goldD : HERB[e.cur].c, o: P.paper });
      }
      text(`${e.k} / ${e.n}`, A.x + A.w - 4, A.y + 2, { f: F.s, a: 'right' });
      if (e.msgT > 0) text(e.msg, A.x + A.w / 2, A.y + 44, { f: F.b, a: 'center', c: P.redD, o: P.paper });
    } };
  return e;
};
// 연타 + 누르고 있기: 핑크 소금 (빻고 → 무게 달기)
ENG.salt = o => {
  const e = { jars: o.jars, g: o.g, j: 0, phase: 'grind', gr: 0, w: 0, bob: 0, msg: '', msgT: 0, tagT: 0, done: false,
    get hint() { return e.phase === 'grind' ? 'Space 연타: 소금 빻기' : `Space 누르고 있기: ${e.g}g 에서 떼기`; },
    update(dt) {
      e.msgT -= dt; e.tagT -= dt; e.bob = Math.max(0, e.bob - dt * 6);
      if (e.phase === 'grind') { if (I.p) { e.gr++; e.bob = 1; SFX.grind(); if (e.gr >= 10) { e.phase = 'weigh'; e.w = 0; } } return; }
      if (I.h) { e.w += dt * e.g * .45; if (Math.random() < dt * 14) SFX.pour(); if (e.w > e.g * 1.7) { e.w = 0; e.msg = '넘쳤어요! 다시.'; e.msgT = 1; SFX.buzz(); } }
      if (I.r && e.w > .3) {
        if (Math.abs(e.w - e.g) <= e.g * .1) { e.j++; SFX.good(); e.tagT = 1.6; if (e.j >= e.jars) e.done = true; else { e.phase = 'grind'; e.gr = 0; } }
        else { SFX.buzz(); e.msg = e.w < e.g ? '모자라요! 상도덕 위반이에요.' : '너무 많아요! 이문이 줄어요.'; e.msgT = 1.3; }
        e.w = 0;
      }
    },
    draw() {
      if (e.phase === 'grind') {
        const cx = A.x + 70, cy = A.y + 70;
        blit(spr('mortar', 60, 40, g => { gpoly(g, [[2, 8], [58, 8], [48, 34], [12, 34]], P.stone); grect(g, 16, 34, 28, 5, P.stoneD); gell(g, 30, 8, 28, 5, P.stone); gell(g, 30, 8, 24, 3.5, P.stoneD); gout(g, P.ink); }), cx - 15, cy - 6);
        const pile = Math.min(10, e.gr);
        if (pile) blit(spr('pile' + pile, 44, 12, g => { gell(g, 22, 12, 4 + pile * 1.6, 2 + pile * .7, P.salt); }), cx - 11, cy - 4);
        blit(spr('pestle', 16, 60, g => { gline(g, 8, 4, 8, 54, P.stoneD, 5); gell(g, 8, 54, 5, 5, P.stoneD); gout(g, P.ink); }), cx + 4, cy - 34 + e.bob * 8);
        blit(claw(), cx + 8, cy - 40 + e.bob * 8);
        bar(A.x + 20, A.y + 100, 120, 7, e.gr / 10, P.salt);
      } else {
        const dx = A.x + 104, dy = A.y + 56;
        blit(disc(24, P.paper), dx - 24.5, dy - 24.5); blit(ring(24, P.ink, 2), dx - 24.5, dy - 24.5);
        const ang = v => Math.PI * .8 + v / (e.g * 1.5) * Math.PI * 1.4;
        for (let v = e.g * .9; v <= e.g * 1.1; v += e.g * .02) { const a = ang(v); R(dx + Math.cos(a) * 20, dy + Math.sin(a) * 20, 2, 2, P.greenL); }
        const a = ang(e.w); pline(dx, dy, dx + Math.cos(a) * 19, dy + Math.sin(a) * 19, P.redD, 1);
        text(`${e.w.toFixed(1)}g`, dx, dy + 8, { f: F.s, a: 'center' });
        blit(spr('pan', 50, 10, g => { gell(g, 25, 4, 24, 4, '#c0c6cc'); gout(g, P.ink); }), A.x + 18, A.y + 80);
        const pileN = Math.min(10, Math.round(e.w / e.g * 6));
        if (pileN) blit(spr('pile' + pileN, 44, 12, g => { gell(g, 22, 12, 4 + pileN * 1.6, 2 + pileN * .7, P.salt); }), A.x + 21, A.y + 76);
        blit(spr('jar', 20, 30, g => { grect(g, 2, 4, 16, 24, '#e3f2f6'); grect(g, 4, 10, 12, 16, P.salt); grect(g, 4, 0, 12, 4, P.wood); gout(g, P.ink); }), A.x + 34, A.y + 22, false);
        blit(claw(), A.x + 42, A.y + 18);
        if (I.h) for (let i = 0; i < 4; i++) R(A.x + 40 + rnd(-1, 1), A.y + 38 + rnd(0, 36), 1, 1, P.saltD);
      }
      text(`${e.j} / ${e.jars}병`, A.x + A.w - 4, A.y + 2, { f: F.s, a: 'right' });
      if (e.tagT > 0) { box(A.x + 20, A.y + 4, 72, 16, '#fff0f4', P.pinkD); text(e.g === 12 ? '₩39,000 / 12g' : '₩128,000 / 세트', A.x + 56, A.y + 8, { f: F.s, a: 'center', c: P.pinkD }); }
      if (e.msgT > 0) text(e.msg, A.x + A.w / 2, A.y + 30, { f: F.b, a: 'center', c: P.redD, o: P.paper });
    } };
  return e;
};
// 컨베이어 도장: 근무일지
ENG.conveyor = o => {
  const names = ['버터', '빨래', '반죽', '치즈', '자수', '허브', '소금'];
  const gap = 36, loop = gap * names.length;
  const e = { k: 0, off: 0, pages: names.map((n, i) => ({ n, x: i * gap, ok: false })), press: 0, msg: '', msgT: 0, done: false, hint: 'Space: 네모 칸이 도장 밑에 올 때',
    update(dt) {
      e.msgT -= dt; e.press = Math.max(0, e.press - dt * 5);
      for (const p of e.pages) { p.x -= dt * 34; if (p.x < -gap) p.x += loop; }
      if (I.p) {
        e.press = 1;
        const hit = e.pages.find(p => !p.ok && Math.abs(p.x + 12 - 80) < 6);
        if (hit) { hit.ok = true; e.k++; SFX.stamp(); if (e.k >= names.length) e.done = true; }
        else { SFX.buzz(); e.msg = '도장 낭비는 규정 위반이에요.'; e.msgT = 1; }
      }
    },
    draw() {
      const y = A.y + 60;
      R(A.x, y + 30, A.w, 8, P.stoneD); for (let x = -((T * 34) % 8); x < A.w; x += 8) R(A.x + x, y + 33, 4, 2, P.stone);
      ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
      for (const p of e.pages) {
        const x = A.x + p.x;
        box(x, y, 24, 30, P.paper); text(p.n, x + 12, y + 3, { f: F.s, a: 'center' });
        box(x + 7, y + 14, 10, 10, P.paper, P.ink2);
        if (p.ok) { box(x + 5, y + 13, 14, 12, '#ffe5e5', P.red); text('확인', x + 12, y + 15, { f: F.s, a: 'center', c: P.red }); }
      }
      ctx.restore();
      const sx = A.x + 80, sy = A.y + 10 + e.press * 22;
      R(sx - 3, sy - 8, 6, 14, P.redD); R(sx - 7, sy + 6, 14, 5, P.red); R(sx - 8, sy + 11, 16, 3, P.stoneD);
      text(`도장 ${e.k} / ${names.length}`, A.x + A.w - 4, A.y + 100, { f: F.s, a: 'right' });
      if (e.msgT > 0) text(e.msg, A.x + A.w / 2, A.y + 42, { f: F.m, a: 'center', c: P.redD, o: P.paper });
    } };
  return e;
};
// 기다리기: 퇴근 신청서 (재촉하면 늦어진다)
ENG.approval = () => {
  const who = ['alps', 'sister', 'seraphina', 'rosemarira', 'rosie'];
  const fields = ['성명: 갓파더', '사유: 퇴근', '희망 시각: 지금 당장'];
  const e = { phase: 'write', f: 0, prog: 0, nag: 0, msg: '', msgT: 0, stamped: 0, done: false,
    get hint() { return e.phase === 'write' ? 'Space: 칸 채우기' : '기다리기 (Space: 재촉하기)'; },
    update(dt) {
      e.msgT -= dt;
      if (e.phase === 'write') { if (I.p) { e.f++; SFX.paper(); if (e.f >= 3) { e.phase = 'wait'; e.prog = 0; } } return; }
      e.prog += dt / 11;
      if (I.p) { e.prog = Math.max(0, e.prog - .07); e.nag++; SFX.buzz(); e.msg = pick(['재촉하면 결재가 늦어집니다.', '결재는 순서가 있어요.', '재촉 1회 기록되었습니다.']); e.msgT = 1.2; }
      const s = Math.min(5, Math.floor(e.prog * 5.5)); if (s > e.stamped) { e.stamped = s; SFX.stamp(); }
      if (e.prog >= 1) e.done = true;
    },
    draw() {
      if (e.phase === 'write') {
        box(A.x + 20, A.y + 2, 120, 104, P.paper);
        text('퇴근 신청서', A.x + 80, A.y + 8, { f: F.b, a: 'center' });
        for (let i = 0; i < 3; i++) {
          const y = A.y + 32 + i * 22; R(A.x + 30, y + 12, 100, 1, P.ink2);
          if (i < e.f) text(fields[i], A.x + 32, y, { f: F.m, c: '#2d3a8c' });
        }
        if (e.f < 3) blit(claw(), A.x + 104, A.y + 26 + e.f * 22);
      } else {
        for (let i = 0; i < 5; i++) {
          const x = A.x + 8 + i * 31, ok = i < e.stamped;
          blit(rira(who[i], { mood: ok ? 'h' : MOOD0[who[i]] || 'n', ear: ok ? Math.sin(T * 10 + i) : 0 }), x, A.y + 30);
          box(x + 2, A.y + 14, 16, 14, ok ? '#ffe5e5' : P.paper, ok ? P.red : P.ink2);
          if (ok) text('결재', x + 10, A.y + 17, { f: F.s, a: 'center', c: P.red });
        }
        const px = A.x + 8 + Math.min(4, e.prog * 5) * 31;
        box(px + 4, A.y + 58 + Math.sin(T * 6) * 1.5, 12, 14, P.paper);
        bar(A.x + 10, A.y + 82, A.w - 20, 8, e.prog, P.gold);
        text(`결재 진행률 ${Math.floor(e.prog * 100)}%`, A.x + A.w / 2, A.y + 92, { f: F.s, a: 'center' });
        if (e.nag) text(`재촉 ${e.nag}회`, A.x + A.w - 4, A.y + 2, { f: F.s, a: 'right', c: P.redD });
        if (e.msgT > 0) text(e.msg, A.x + A.w / 2, A.y + 2, { f: F.m, a: 'center', c: P.redD, o: P.paper });
      }
    } };
  return e;
};
// 누르고 있기: 퇴근 확인서 서명 → 뒤집으면 내일 근무 확인서
ENG.sign = () => {
  const e = { phase: 'sign', h: 0, t: 0, flip: 0, done: false,
    get hint() { return e.phase === 'sign' ? 'Space 누르고 있기: 발도장 찍기' : '……'; },
    update(dt) {
      if (e.phase === 'sign') {
        if (I.h) { e.h += dt / 1.4; if (e.h >= 1) { e.phase = 'stamped'; e.t = 0; SFX.stamp(); } }
        else e.h = Math.max(0, e.h - dt * .6);
      } else if (e.phase === 'stamped') { e.t += dt; if (e.t > .9) { e.phase = 'flip'; SFX.paper(); } }
      else { e.flip += dt * 1.1; if (e.flip >= 1.4) e.done = true; }
    },
    draw() {
      const cx = A.x + 76, cy = A.y + 52, sx = e.phase === 'flip' ? Math.max(.04, Math.abs(Math.cos(Math.min(1, e.flip) * Math.PI))) : 1;
      const back = e.flip >= .5;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(sx, 1); ctx.translate(-cx, -cy);
      box(cx - 60, cy - 50, 120, 104, back ? '#fff6e0' : P.paper);
      text(back ? '내일 근무 확인서' : '퇴근 확인서', cx, cy - 44, { f: F.b, a: 'center', c: back ? P.redD : P.ink });
      const body = back ? ['본인은 내일(오늘) 근무에', '기쁘게 동의합니다.'] : ['본인은 금일 업무를 모두', '마쳤음을 확인합니다.'];
      body.forEach((l, i) => text(l, cx, cy - 24 + i * 12, { f: F.m, a: 'center' }));
      box(cx - 22, cy + 6, 44, 30, P.paper, P.ink2);
      if (e.h > 0 || e.phase !== 'sign') {
        const n = e.phase === 'sign' ? Math.floor(e.h * 5) : 5, c = '#6b4f3a';
        if (n > 0) blit(disc(6, c), cx - 6.5, cy + 16);
        [[-9, 11], [-3, 8], [3, 8], [9, 11]].slice(0, Math.max(0, n - 1)).forEach(([dx, dy]) => blit(disc(2, c), cx + dx - 2.5, cy + dy));
      }
      if (back) { text('※ 퇴근 확인서는 내일 근무 확인서로 갈음함', cx, cy + 38, { f: F.s, a: 'center', c: P.ink2 }); text('(리라 행정 규정 제12조)', cx, cy + 45, { f: F.s, a: 'center', c: P.ink2 }); }
      else text('서명 (발도장)', cx, cy + 40, { f: F.s, a: 'center', c: P.ink2 });
      ctx.restore();
      if (e.phase === 'sign') bar(A.x + 20, A.y + 104, 112, 6, e.h, '#6b4f3a');
    } };
  return e;
};

// ---------- 입력
const I = { p: false, h: false, r: false };
const K = { l: false, r: false };
function press() { audio(); if (!I.h) { I.p = true; I.h = true; } }
function release() { if (I.h) { I.h = false; I.r = true; } }
addEventListener('keydown', e => {
  const k = e.key;
  if (k === ' ' || k === 'Enter' || k === 'z' || k === 'Z' || k === 'x' || k === 'X') { e.preventDefault(); if (!e.repeat) press(); }
  else if (k === 'ArrowLeft' || k === 'a' || k === 'A') { e.preventDefault(); K.l = true; audio(); if (MODE === 'receipt') sel = 0; }
  else if (k === 'ArrowRight' || k === 'd' || k === 'D') { e.preventDefault(); K.r = true; audio(); if (MODE === 'receipt') sel = 1; }
  else if (k === 'm' || k === 'M') toggleMusic();
  else if (k === 'n' || k === 'N') toggleSfx();
  else if (k === 'f' || k === 'F') toggleFS();
  else if (k === 'Escape' && MG) { MG.over = '업무 중에는 나갈 수 없어요.'; MG.overT = 1.8; SFX.buzz(); SFX.rira(); }
});
addEventListener('keyup', e => {
  const k = e.key;
  if (k === ' ' || k === 'Enter' || k === 'z' || k === 'Z' || k === 'x' || k === 'X') release();
  else if (k === 'ArrowLeft' || k === 'a' || k === 'A') K.l = false;
  else if (k === 'ArrowRight' || k === 'd' || k === 'D') K.r = false;
});
addEventListener('blur', () => { K.l = K.r = false; release(); });
function toggleMusic() { G.music = !G.music; save(); audio(); if (AU.mus) AU.mus.gain.value = G.music ? .32 : 0; toast(G.music ? '배경음악 켬' : '배경음악 끔'); }
function toggleSfx() { G.sfx = !G.sfx; save(); audio(); if (AU.fx) AU.fx.gain.value = G.sfx ? .6 : 0; toast(G.sfx ? '효과음 켬' : '효과음 끔'); }
function lpos(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }
const ABTN = { x: W - 44, y: H - 44, r: 18 };
const REC_BTNS = [{ x: 74, y: 138, w: 88, h: 18 }, { x: 170, y: 138, w: 76, h: 18 }];
cv.addEventListener('pointerdown', e => {
  e.preventDefault(); cv.focus({ preventScroll: true }); audio();
  try { cv.setPointerCapture(e.pointerId); } catch (er) { /* 무시 */ }
  const [x, y] = lpos(e);
  if (x > W - 30 && y < 12 && MODE !== 'title') { x > W - 15 ? toggleSfx() : toggleMusic(); return; }
  if (MODE === 'receipt') {
    REC_BTNS.forEach((b, i) => { if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { sel = i; press(); } });
    return;
  }
  if (MODE !== 'play' || SYS || DLG || MG || SCR) { press(); return; }
  if (coarse && Math.hypot(x - ABTN.x, y - ABTN.y) < ABTN.r + 4) { press(); return; }
  // 방을 누르면 그쪽으로 걸어가고, 소품이나 문을 누르면 도착해서 일한다
  const wx = x + CAM.x;
  let hit = null;
  for (const id in STS) { const s = STS[id]; if (s.vis && Math.abs(wx - s.x) < s.w / 4 + 4 && y > ST_Y - s.h / 2 - 10 && y < ST_Y + 8) hit = s; }
  PL.tgt = hit ? (hit.id === 'door' ? ROOM_W : hit.x) : wx; PL.tgtAct = !!hit;
});
cv.addEventListener('pointerup', release);
cv.addEventListener('pointercancel', release);

// ---------- 갱신
function nearSt() {
  let best = null, bd = 30;
  for (const id in STS) {
    const s = STS[id]; if (!s.vis || id === 'door') continue;
    const d = Math.abs(PL.x - s.x); if (d < bd) { bd = d; best = s; }
  }
  if (PL.x + half() >= STS.door.x - 30) return STS.door;
  return best;
}
function interact() {
  const s = nearSt(); if (!s) return;
  if (s.id === 'door') return tryLeave();
  if (STAGE === 'intro') { bubble('pl', pick(['내 일 아니야.', '못 본 걸로 하자.', '……퇴근해야지.']), 1.6); return; }
  const t = taskAt(s.id);
  if (t) return beginTask(t);
  const sup = Object.values(TASKS).find(d => d.st === s.id);
  if (sup && RIRAS[sup.sup].vis) bubble(sup.sup, pick(['여긴 끝났어요. 지금은요.', '다음 업무를 기다리세요.', '잘했어요. 아직은.']), 1.8);
}
function updatePlayer(dt) {
  let dir = 0;
  const sp = PL.form === 'ant' ? 42 : 52;
  if (PL.auto !== null) {
    const d = PL.auto - PL.x;
    if (Math.abs(d) < 1) { PL.x = PL.auto; PL.auto = null; } else { dir = Math.sign(d); PL.face = dir; }
  } else if (!SCR && !SYS && !DLG && !MG && MODE === 'play') {
    if (K.l) dir = -1; else if (K.r) dir = 1;
    if (dir) PL.tgt = null;
    else if (PL.tgt !== null) {
      const d = PL.tgt - PL.x;
      if (Math.abs(d) < 2 || (PL.tgt >= ROOM_W && PL.x + half() >= STS.door.x - 15)) {
        const act = PL.tgtAct; PL.tgt = null;
        if (act) interact();
      } else dir = Math.sign(d);
    }
    if (dir) PL.face = dir;
  }
  PL.moving = !!dir;
  if (dir) {
    const prev = PL.walkT;
    PL.x += dir * sp * dt; PL.walkT += dt; PL.idleT = 0;
    if (Math.floor(prev * 3) !== Math.floor(PL.walkT * 3)) SFX.step();
  } else PL.idleT += dt;
  const maxX = STS.door.x - 15 - half();
  PL.x = clamp(PL.x, 30, maxX);
  // 문에 부딪히면 퇴근 시도
  if (dir > 0 && PL.auto === null && PL.x >= maxX - .1 && leaveCD <= 0 && !SCR && !SYS && !DLG && !MG && MODE === 'play') tryLeave();
  if (PL.form === 'ant' && PL.idleT > 7 && !MG && !SCR) { PL.idleT = 0; bubble('pl', pick(['……', '하아……', '(퇴근하고 싶다)']), 1.8); SFX.sigh(); }
  if (PL.morph >= 0) PL.morph += dt;
  PL.bubT -= dt; if (PL.bubT <= 0) PL.bub = null;
}
function updateRiras(dt) {
  for (const id in RIRAS) {
    const r = RIRAS[id]; if (!r.vis) continue;
    if (id === 'alps' && MODE === 'play' && !SCR) {
      // 알프스 리라는 갓파더가 다가간 자기 업무 쪽으로 따라간다
      for (const sid of ALPS_ST) if (Math.abs(PL.x - STS[sid].x) < 40) r.tx = STS[sid].x + 20;
    }
    const d = r.tx - r.x;
    if (Math.abs(d) > .8) { r.x += Math.sign(d) * 34 * dt; r.walkT += dt; r.face = Math.sign(d); }
    else { r.walkT = 0; r.face = PL.x > r.x ? 1 : -1; }
    r.hopV += 260 * dt; r.hop = Math.min(0, r.hop + r.hopV * dt); if (r.hop >= 0) { r.hop = 0; r.hopV = 0; }
    r.flapT -= dt; if (r.flapT <= 0) { r.flap = .5; r.flapT = rnd(2, 6); }
    r.flap = Math.max(0, r.flap - dt);
    r.blinkT -= dt; if (r.blinkT <= 0) { r.blink = .12; r.blinkT = rnd(2, 5); } r.blink = Math.max(0, r.blink - dt);
    r.moodT -= dt; if (r.moodT <= 0 && r.mood === 'h') r.mood = MOOD0[id] || 'n';
    r.bubT -= dt; if (r.bubT <= 0) r.bub = null;
    r.popT = Math.min(1, r.popT + dt * 3);
  }
}
function update(dt) {
  T += dt; ET += dt;
  SHAKE = Math.max(0, SHAKE - dt); FLASH = Math.max(0, FLASH - dt); toastT -= dt; tutT -= dt; recShake = Math.max(0, recShake - dt); if (!SCR) leaveCD -= dt;
  musicTick();
  if (MODE === 'title') { updateRiras(dt); if (I.p) { I.p = false; run(scriptIntro()); } }
  else if (MODE === 'receipt') {
    if (I.p) {
      I.p = false;
      if (sel === 1) { recShake = .4; SFX.incomplete(); toast('SHIFT INCOMPLETE.'); }
      else { G.day++; save(); run(scriptIntro()); }
    }
  } else if (MODE === 'play') {
    if (SYS) {
      SYS.t += dt; SYS.n = Math.min(SYS.msg.length, SYS.n + dt * 22);
      if (Math.floor(SYS.n) !== Math.floor(SYS.n - dt * 22) && SYS.n < SYS.msg.length) SFX.blip();
      if (I.p && SYS.t > .5) { I.p = false; if (SYS.n < SYS.msg.length) SYS.n = SYS.msg.length; else SYS = null; }
      else if (SYS.t > 3.2) SYS = null;
    } else if (DLG) {
      const prev = Math.floor(DLG.n); DLG.n = Math.min(DLG.s.length, DLG.n + dt * 30);
      if (Math.floor(DLG.n) !== prev && Math.floor(DLG.n) % 2) SFX.blip();
      if (I.p) { I.p = false; if (DLG.n < DLG.s.length) DLG.n = DLG.s.length; else DLG = null; }
    } else if (MG) updateMG(dt);
    else if (!SCR && I.p) { I.p = false; interact(); }
    if (STAGE === 'work' && !MG && !SCR) roamT += dt;
    for (const id in STS) { const s = STS[id]; s.pop = Math.min(1, s.pop + dt * 3); s.newT = Math.max(0, s.newT - dt); }
  }
  tickScript(dt);
  if (MODE === 'play' || MODE === 'title') {
    updatePlayer(dt); updateRiras(dt);
    const want = CAM.to !== null ? CAM.to : clamp(PL.x - W / 2 + PL.face * 20, 0, ROOM_W - W);
    CAM.x = lerp(CAM.x, want, 1 - Math.exp(-dt * 4));
  }
  for (const p of PARTS) { p.x += p.vx * dt; p.y += p.vy * dt; if (!p.txt) p.vy += 60 * dt; p.life -= dt; }
  for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].life <= 0) PARTS.splice(i, 1);
  // 시계: 업무 하나에 20분, 돌아다니면 4초에 1분 (다음 업무 몫을 넘지 않게)
  if (MODE === 'play' && clockMin < 24 * 60) clockMin = Math.min(23 * 60 + 59, 18 * 60 + Math.min(DONE.size * 20 + Math.floor(roamT / 4), DONE.size * 20 + 19));
  I.p = false; I.r = false;
}

// ---------- 그리기
function sky(t) {
  const top = t < .5 ? mixHex('#ff9e7a', '#3a3f7a', t * 2) : mixHex('#3a3f7a', '#141733', (t - .5) * 2);
  const bot = t < .5 ? mixHex('#ffd49a', '#6b5b9a', t * 2) : mixHex('#6b5b9a', '#232752', (t - .5) * 2);
  return [top, bot];
}
function drawWindow(x, y, w, h, t) {
  const [a, b] = sky(t);
  R(x - 3, y - 3, w + 6, h + 6, P.woodD);
  for (let i = 0; i < 6; i++) R(x, y + i * h / 6, w, h / 6 + .5, mixHex(a, b, i / 5));
  if (t > .45) for (const [sx, sy] of [[.2, .2], [.7, .15], [.5, .4], [.85, .5], [.1, .6]]) if ((Math.floor(T * 1.5 + sx * 10) % 5) !== 0) R(x + sx * w, y + sy * h, 1, 1, '#fff7d6');
  if (t > .3) { blit(disc(4, '#fff3c4'), x + w * .7 - 4, y + h * .3 - 4); if (t < .8) blit(disc(4, mixHex(a, b, .3)), x + w * .7 - 2, y + h * .3 - 5); }
  else blit(disc(5, '#ffdf8a'), x + w * .3 - 5, y + h * (.55 + t) - 5);
  R(x + w / 2 - 1, y, 2, h, P.woodD); R(x, y + h / 2 - 1, w, 2, P.woodD);
  R(x - 5, y + h + 3, w + 10, 4, P.wood);
  for (let i = 0; i < 4; i++) blit(disc(2, [P.pink, P.gold, P.red, P.pink][i]), x + 2 + i * (w - 4) / 3 - 2.5, y + h - 1);
}
function clockSpr(min) {
  const hh = Math.floor(min / 60) % 12, mm = Math.floor(min % 60 / 5) * 5;
  return spr('clock' + hh + '_' + mm, 36, 36, g => {
    gell(g, 18, 18, 17, 17, P.woodD); gell(g, 18, 18, 14.5, 14.5, P.paper);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; gset(g, 18 + Math.cos(a) * 12, 18 + Math.sin(a) * 12, P.ink2); }
    const am = mm / 60 * Math.PI * 2 - Math.PI / 2, ah = (hh + mm / 60) / 12 * Math.PI * 2 - Math.PI / 2;
    gline(g, 18, 18, Math.round(18 + Math.cos(am) * 11), Math.round(18 + Math.sin(am) * 11), P.ink);
    gline(g, 18, 18, Math.round(18 + Math.cos(ah) * 7), Math.round(18 + Math.sin(ah) * 7), P.red, 2);
    gout(g, P.ink);
  });
}
function drawRoom() {
  const cx = Math.round(CAM.x * 2) / 2;
  ctx.save(); ctx.translate(-cx, 0);
  const t = clamp((clockMin - 18 * 60) / 360, 0, 1);
  // 벽과 징두리 판자
  R(cx, 0, W, FLOOR, P.wall);
  for (let x = Math.floor(cx / 24) * 24; x < cx + W; x += 24) R(x, 12, 1, 68, P.wallD);
  R(cx, 80, W, 32, P.wood); for (let x = Math.floor(cx / 12) * 12; x < cx + W; x += 12) R(x, 82, 1, 30, P.woodD);
  R(cx, 80, W, 2, P.woodL); R(cx, 0, W, 7, P.woodD);
  // 가랜드
  for (let x = Math.floor(cx / 16) * 16; x < cx + W; x += 16) {
    const c = [P.red, P.cr, P.pink, P.gold][((x / 16) % 4 + 4) % 4];
    blit(spr('flag' + c, 12, 12, g => { gpoly(g, [[0, 0], [12, 0], [6, 11]], c); }), x + 2, 7);
  }
  // 벽 장식
  box(8, 22, 40, 44, P.paper); text('리라 근무', 28, 25, { f: F.s, a: 'center' }); text('규정', 28, 34, { f: F.s, a: 'center' });
  for (let i = 0; i < 5; i++) R(13, 45 + i * 4, 30 - (i % 3) * 5, 1, P.ink2);
  drawWindow(72, 22, 46, 40, t); drawWindow(258, 22, 46, 40, t); drawWindow(392, 22, 38, 40, t);
  blit(clockSpr(clockMin), 150, 22);
  box(194, 20, 46, 50, P.goldD, P.woodD); box(197, 23, 40, 36, '#fff3d6', P.woodD);
  blit(rira('rira', { mood: 'h' }), 207, 29);
  text('우수 사원', 217, 60, { f: F.s, a: 'center', c: P.paper });
  R(318, 46, 60, 3, P.woodD);
  for (let i = 0; i < 5; i++) { const jx = 322 + i * 11; R(jx, 36, 8, 10, '#e3f2f6'); R(jx + 1, 40, 6, 5, [P.salt, P.herbR, P.cheese, P.herbL, P.dough][i]); R(jx + 1, 34, 6, 2, P.wood); }
  // 퇴근 전 확인사항 게시판 (시도할 때마다 늘어난다)
  if (notices.length) {
    const nh = 13 + notices.length * 8;
    box(444, 44, 104, nh, '#fff8e0', P.woodD);
    R(494, 42, 4, 3, P.red);
    text('퇴근 전 확인사항', 496, 45, { f: F.s, a: 'center', c: P.redD });
    notices.forEach((n, i) => text(`${i + 1}. ${n}`, 448, 53 + i * 8, { f: F.s }));
  }
  // 바닥
  R(cx, FLOOR, W, H - FLOOR, P.floor);
  for (let y = FLOOR + 8; y < H; y += 10) R(cx, y, W, 1, P.floorD);
  for (let y = FLOOR; y < H; y += 10) for (let x = Math.floor(cx / 40) * 40 + ((y / 10) % 2) * 20; x < cx + W; x += 40) R(x, y, 1, 9, P.floorD);
  R(cx, FLOOR, W, 2, P.woodD);
  // 소품
  for (const id in STS) {
    const s = STS[id]; if (!s.vis) continue;
    const c = s.draw(s), w = s.w / 2, h = s.h / 2;
    const k = s.pop < 1 ? 1 + Math.sin(s.pop * Math.PI) * .25 : 1, ky = s.pop < 1 ? Math.min(1, s.pop * 1.6) : 1;
    if (k !== 1 || ky !== 1) { ctx.save(); ctx.translate(s.x, ST_Y); ctx.scale(k, ky); blit(c, -w / 2, -h); ctx.restore(); }
    else blit(c, s.x - w / 2, ST_Y - h);
    if (id === 'door') { box(s.x - 11, ST_Y - h + 12, 22, 11, P.red, P.ink); text('퇴근', s.x, ST_Y - h + 13, { f: F.s, a: 'center', c: P.paper }); }
    if (id === 'desk') { box(s.x + 1, ST_Y - 17, 21, 10, P.paper, P.ink); text('행정실', s.x + 11.5, ST_Y - 16, { f: F.s, a: 'center' }); }
    if (id === 'salt') { box(s.x + 8, ST_Y - h - 12, 34, 11, '#fff0f4', P.pinkD); text('₩39,000', s.x + 25, ST_Y - h - 11, { f: F.s, a: 'center', c: P.pinkD }); }
    // 업무 표시: 남은 업무는 느낌표, 끝난 업무는 확인 도장
    if (STAGE === 'work' && id !== 'door') {
      const tk = taskAt(id), anyDone = Object.keys(TASKS).some(t => TASKS[t].st === id && DONE.has(t));
      const by = ST_Y - h - 14 + (tk ? Math.sin(T * 6) * 1.5 : 0);
      if (tk) { box(s.x - 4, by, 8, 12, P.gold, P.ink); R(s.x - 1, by + 2, 2, 5, P.ink); R(s.x - 1, by + 8, 2, 2, P.ink); if (s.newT > 0 && Math.floor(T * 4) % 2) text('NEW', s.x, by - 9, { f: F.s, a: 'center', c: P.redD, o: P.paper }); }
      else if (anyDone) { box(s.x - 7, by + 2, 14, 9, '#e6f6ea', P.green); pline(s.x - 3, by + 6, s.x - 1, by + 8, P.green, 1); pline(s.x - 1, by + 8, s.x + 3, by + 4, P.green, 1); }
    }
  }
  if (STS.door.open) { ctx.globalAlpha = .35; R(STS.door.x - 40, ST_Y - 10, 60, 50, '#ffe9a8'); ctx.globalAlpha = 1; }
  // 리라들
  const rs = Object.values(RIRAS).filter(r => r.vis).sort((a, b) => a.x - b.x);
  for (const r of rs) drawRira(r);
  // 갓파더
  drawPlayer();
  // 입자
  for (const p of PARTS) {
    if (p.txt) text(p.txt, p.x, p.y, { f: F.s, a: 'center', c: p.c, o: P.paper });
    else R(p.x, p.y, p.s, p.s, p.c);
  }
  // 말풍선
  for (const r of rs) if (r.bub) speech(r.x, RIRA_Y - 26 + r.hop, r.bub);
  if (PL.bub) speech(PL.x + (PL.form === 'ant' ? PL.face * 26 : 0), PL_Y - (PL.form === 'ant' ? 50 : 74), PL.bub);
  ctx.restore();
}
function drawRira(r) {
  const moving = Math.abs(r.tx - r.x) > .8;
  const step = moving ? (Math.floor(r.walkT * 8) % 2 ? 1 : -1) : 0;
  const ear = r.flap > 0 ? Math.sin(r.flap * 30) : Math.sin(T * 2 + r.ph) * .34;
  const arm = r.bub && r.bubT > 0 && r.mood === 'h' ? 'b' : r.bub ? 'u' : 'd';
  const s = rira(r.kind, { mood: r.mood, ear, step, arm, blink: r.blink > 0 });
  const k = r.popT < 1 ? .4 + r.popT * .6 : 1;
  const bob = moving ? 0 : (Math.sin(T * 3 + r.ph) > .6 ? -.5 : 0);
  if (k !== 1) { ctx.save(); ctx.translate(r.x, RIRA_Y); ctx.scale(k, k); blit(s, -10, -23, r.face > 0); ctx.restore(); }
  else blit(s, r.x - 10, RIRA_Y - 23 + r.hop + bob, r.face > 0);
}
function drawPlayer() {
  const f = PL.moving ? Math.floor(PL.walkT * 6) % 4 : 0;
  let form = PL.form;
  if (PL.morph >= 0) form = Math.floor(PL.morph * (4 + PL.morph * 10)) % 2 ? 'ant' : 'human';
  if (form === 'ant') {
    const breathe = !PL.moving && Math.sin(T * 1.4) > .7 ? .5 : 0;
    blit(anteater(f), PL.x - 44, PL_Y - 50 + breathe, PL.face < 0);
  } else blit(human(f, PL.hold), PL.x - 12, PL_Y - 70, PL.face < 0);
  if (PL.morph >= 0) for (let i = 0; i < 10; i++) {
    const a = PL.morph * 6 + i * .63, rr = 30 - PL.morph * 12;
    R(PL.x + Math.cos(a) * rr, PL_Y - 34 + Math.sin(a) * rr * .8, 2, 2, i % 2 ? P.gold : P.white);
  }
}
function speech(x, y, s) {
  const lines = wrapChars(s, F.s, 96), w = Math.max(...lines.map(l => tw(l, F.s))) + 8, h = lines.length * 9 + 5;
  let bx = clamp(x - w / 2, CAM.x + 2, CAM.x + W - w - 2); const by = y - h - 4;
  box(bx, by, w, h, P.paper, P.ink);
  R(clamp(x - 1, bx + 3, bx + w - 5), by + h - 1, 3, 2, P.paper); R(clamp(x - 1, bx + 3, bx + w - 5), by + h + 1, 2, 2, P.ink);
  lines.forEach((l, i) => text(l, bx + 4, by + 3 + i * 9, { f: F.s }));
}
function drawHUD() {
  if (STAGE === 'work' && !MG) {
    const p = pending(), done = planned() - p.length;
    const h = 16 + Math.min(3, p.length) * 9 + (p.length > 3 ? 9 : 0);
    box(4, 4, 104, h, '#fff8e8', P.ink);
    text(`근무일지 ${done} / ${planned()}`, 8, 6, { f: F.s, c: P.redD });
    p.slice(0, 3).forEach((t, i) => { R(9, 17 + i * 9, 5, 5, P.ink2); R(10, 18 + i * 9, 3, 3, '#fff8e8'); text(TASKS[t].name, 17, 15 + i * 9, { f: F.s }); });
    if (p.length > 3) text(`…외 ${p.length - 3}건`, 17, 15 + 27, { f: F.s, c: P.ink2 });
    if (!p.length) text('→ 퇴근해 보기', 17, 15, { f: F.s, c: P.green });
  }
  if (MODE === 'play') {
    const hh = Math.floor(clockMin / 60) % 24, mm = clockMin % 60;
    box(W - 98, 13, 94, STAGE === 'work' ? 38 : 17, '#fff8e8', P.ink);
    text(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, W - 94, 15, { f: F.b });
    text(`근무 ${G.day}일차`, W - 8, 17, { f: F.s, a: 'right', c: P.ink2 });
    if (STAGE === 'work') {
      text('기력', W - 94, 31, { f: F.s }); bar(W - 76, 32, 34, 6, stamina / 100, stamina < 25 ? P.red : P.green);
      text(`${Math.round(stamina)}%`, W - 8, 31, { f: F.s, a: 'right' });
    }
    if (STAGE === 'work') text(`리라 매출 ${won(money)}`, W - 8, 40, { f: F.s, a: 'right', c: P.green });
  }
  // 소리 아이콘
  const ic = (x, on, c) => { R(x, 3, 10, 7, on ? c : P.stone); R(x + 1, 4, 8, 5, on ? P.paper : '#ddd'); };
  if (MODE !== 'title') { ic(W - 28, G.music, P.green); text('♪', W - 26.5, 2.5, { f: F.s }); ic(W - 14, G.sfx, P.green); R(W - 11, 5, 2, 3, P.ink); R(W - 9, 4, 1, 5, P.ink); }
  // 가까운 일 안내
  if (MODE === 'play' && !MG && !SCR && !SYS && !DLG) {
    const s = nearSt(); let lab = null;
    if (s) {
      if (s.id === 'door') lab = pending().includes('signOut') ? '퇴근 확인서 서명' : '퇴근하기';
      else if (STAGE === 'work') { const tk = taskAt(s.id); if (tk) lab = TASKS[tk].name; }
    }
    if (lab) {
      const t2 = (coarse ? '버튼' : 'Space') + '  ' + lab, w = tw(t2, F.m) + 14;
      box(W / 2 - w / 2, H - 20, w, 15, P.navy, P.ink); text(t2, W / 2, H - 18, { f: F.m, a: 'center', c: P.paper });
    }
    if (coarse) { blit(disc(ABTN.r, P.red), ABTN.x - ABTN.r - .5, ABTN.y - ABTN.r - .5); text('일', ABTN.x, ABTN.y - 6, { f: F.b, a: 'center', c: P.paper }); }
  }
  if (PROMPT) {
    const t2 = (coarse ? '화면 누르기' : 'Space') + '  ' + PROMPT, w = tw(t2, F.m) + 14;
    box(W / 2 - w / 2, H - 22, w, 15, P.gold, P.ink); text(t2, W / 2, H - 20, { f: F.m, a: 'center' });
  }
  if (tutT > 0 && !MG && !DLG && !SYS) {
    const t2 = coarse ? '방을 눌러 걷기 · 소품을 눌러 일하기 · 문을 누르면 퇴근 시도' : '← → 걷기 · Space 일하기 · 문으로 가면 퇴근 시도';
    const w = tw(t2, F.s) + 12; box(W / 2 - w / 2, 50, w, 13, P.paper, P.ink); text(t2, W / 2, 52, { f: F.s, a: 'center' });
  }
  if (toastT > 0) { const w = tw(toastMsg, F.m) + 14; box(W / 2 - w / 2, 64, w, 15, P.ink, P.ink); text(toastMsg, W / 2, 66, { f: F.m, a: 'center', c: P.paper }); }
}
function drawMG() {
  ctx.globalAlpha = .55; R(0, 0, W, H, '#1a120d'); ctx.globalAlpha = 1;
  box(PX, PY, PW, PH, P.paper, P.ink); R(PX + 1, PY + 1, PW - 2, 13, P.red);
  const idx = DONE.size + 1;
  text(`업무 ${idx} / ${planned()}  ·  ${MG.def.name}`, PX + 6, PY + 2, { f: F.m, c: P.paper });
  text(NAMES[MG.def.sup], PX + 44, PY + PH - 14, { f: F.s, a: 'center', c: P.ink2 });
  const r = RIRAS[MG.def.sup];
  const ear = r.flap > 0 ? Math.sin(r.flap * 30) : Math.sin(T * 2 + r.ph) * .34;
  blit(rira(MG.def.sup, { mood: MG.doneT >= 0 ? 'h' : r.mood, ear, step: Math.floor(T * 4) % 2 ? 1 : -1, arm: MG.doneT >= 0 ? 'b' : 'd', blink: r.blink > 0 }), PX + 24, PY + PH - 62, false, 2);
  const line = MG.overT > 0 ? MG.over : MG.def.lines[MG.line];
  const ls = wrapChars(line, F.s, 72);
  box(PX + 6, PY + 20, 80, ls.length * 9 + 6, '#fff8e8', P.ink2);
  ls.forEach((l, i) => text(l, PX + 10, PY + 23 + i * 9, { f: F.s }));
  ctx.save(); ctx.beginPath(); ctx.rect(A.x - 2, A.y - 4, A.w + 6, A.h + 12); ctx.clip();
  MG.eng.draw();
  ctx.restore();
  const hint = MG.eng.hint;
  R(PX + 1, PY + PH - 4, PW - 2, 3, P.paperD);
  text(hint, A.x + A.w / 2, PY + PH - 14, { f: F.s, a: 'center', c: P.navyL });
  if (MG.doneT >= 0 && MG.def.eng !== 'sign') {
    const k = Math.max(1, 2.2 - MG.doneT * 6);
    ctx.save(); ctx.translate(A.x + A.w / 2, A.y + 50); ctx.scale(k, k); ctx.rotate(-.18);
    box(-30, -14, 60, 28, '#ffe5e5', P.red); box(-27, -11, 54, 22, '#ffe5e5', P.red);
    text('완료', 0, -9, { f: F.b, a: 'center', c: P.red }); text('리라 행정실', 0, 3, { f: F.s, a: 'center', c: P.red });
    ctx.restore();
  }
}
function drawDLG() {
  const y = H - 44;
  box(6, y, W - 12, 38, P.paper, P.ink);
  const r = RIRAS[DLG.who];
  if (r) { box(10, y + 4, 28, 30, '#fff3d6', P.ink2); blit(rira(r.kind, { mood: r.mood, ear: Math.sin(T * 14) * (DLG.n < DLG.s.length ? 1 : .3), blink: r.blink > 0 }), 14, y + 8); }
  text(NAMES[DLG.who] || '', 44, y + 4, { f: F.s, c: P.redD });
  const lines = wrapChars(DLG.s.slice(0, Math.floor(DLG.n)), F.m, W - 64);
  lines.slice(0, 2).forEach((l, i) => text(l, 44, y + 13 + i * 11, { f: F.m }));
  if (DLG.n >= DLG.s.length && Math.floor(T * 3) % 2) text('▼', W - 16, y + 27, { f: F.s, c: P.ink2 });
}
function drawSYS() {
  let lines = [SYS.msg];
  if (tw(SYS.msg, F.sys) > 244) { const k = SYS.msg.lastIndexOf(' ', Math.floor(SYS.msg.length * .6)); lines = [SYS.msg.slice(0, k), SYS.msg.slice(k + 1)]; }
  const w = 260, h = 30 + lines.length * 20, x = (W - w) / 2, y = 56;
  const edge = SYS.kind === 'bad' ? '#ff6b6b' : SYS.kind === 'new' ? P.gold : P.pink;
  R(x - 2, y - 2, w + 4, h + 4, P.ink); R(x, y, w, h, P.navy); R(x + 2, y + 2, w - 4, h - 4, P.white); R(x + 3, y + 3, w - 6, h - 6, P.navy);
  R(x + 3, y + 3, w - 6, 1, edge);
  text('SYSTEM', x + 8, y + 6, { f: F.s, c: edge });
  let left = Math.floor(SYS.n);
  lines.forEach((l, i) => { text(l.slice(0, Math.max(0, left)), W / 2, y + 18 + i * 20, { f: F.sys, a: 'center', c: P.white }); left -= l.length + 1; });
}
function drawTitle() {
  CAM.x = 140; drawRoom();
  ctx.globalAlpha = .6; R(0, 0, W, H, '#1a120d'); ctx.globalAlpha = 1;
  text('퇴근 불가', W / 2, 26, { f: F.xl, a: 'center', c: P.cr, o: P.ink, ow: 2 });
  text('SHIFT INCOMPLETE', W / 2, 58, { f: F.b, a: 'center', c: '#ff8a8a' });
  text('리라네 근무표', W / 2, 74, { f: F.m, a: 'center', c: P.cr });
  const ids = ['alps', 'sister', 'seraphina', 'rosemarira', 'rosie', 'clerk', 'clerk2'];
  ids.forEach((id, i) => {
    const r = RIRAS[id], x = W / 2 - 84 + i * 28;
    blit(rira(id, { mood: r.mood === 'n' ? 'h' : r.mood, ear: Math.sin(T * 3 + i) * .7, blink: r.blink > 0 }), x - 10, 96 + (Math.sin(T * 4 + i) > .8 ? -1 : 0));
  });
  box(W / 2 - 34, 124, 68, 13, P.red, P.ink); text(`근무 ${G.day}일차`, W / 2, 125, { f: F.m, a: 'center', c: P.paper });
  if (Math.floor(T * 2) % 2) text(coarse ? '화면을 눌러 출근하기' : 'Space · 화면을 눌러 출근하기', W / 2, 146, { f: F.m, a: 'center', c: P.cr });
}
function drawRosie() {
  for (let i = 0; i < 9; i++) R(0, i * 20, W, 20, mixHex('#ffe3ea', '#fff6e6', i / 8));
  for (let i = 0; i < 14; i++) { const a = i * 2.4 + T, rr = 80 + (i % 3) * 20; if ((Math.floor(T * 4) + i) % 3) R(W / 2 + Math.cos(a) * rr, 90 + Math.sin(a) * rr * .6, 2, 2, [P.pink, P.gold, P.white][i % 3]); }
  const ear = Math.sin(ET * 20);
  blit(rira('rosie', { mood: 'h', ear, arm: 'b' }), W / 2 - 50, 46 + (Math.sin(ET * 8) > .5 ? -1 : 0), false, 5);
  if (ET > .6) { box(W / 2 + 40, 26, 96, 20, P.paper, P.ink); text('내일 봬요, 갓파더님!', W / 2 + 88, 31, { f: F.s, a: 'center' }); }
}
function drawStare() {
  R(0, 0, W, H, '#3b2f28');
  for (let i = 0; i < 8; i++) R(0, i * 22, W, 1, '#43362e');
  blit(anteaterFace(ET > 2.8 && ET < 2.95), W / 2 - 75, H - 138, false, 3);
}
function drawReceipt() {
  R(0, 0, W, H, '#2a1d17');
  const ox = recShake > 0 ? Math.sin(recShake * 60) * 3 : 0;
  box(60 + ox, 12, 200, 150, P.paper, P.ink);
  text(`근무 ${G.day}일차 정산서`, W / 2 + ox, 17, { f: F.b, a: 'center' });
  R(70 + ox, 33, 180, 1, P.ink2);
  const rows = [['수행 업무', `${TOTAL}건`], ['퇴근 시도', `${attempts + 1}회`], ['리라 매출', won(money)], ['갓파더 급여', '칭찬 도장 1개'], ['비고', '내일 근무 확정']];
  rows.forEach(([a, b], i) => { text(a, 74 + ox, 40 + i * 15, { f: F.m }); text(b, 246 + ox, 40 + i * 15, { f: F.m, a: 'right', c: i === 3 ? P.redD : P.ink }); });
  blit(disc(7, P.red), 226 + ox, 112); text('참', 233.5 + ox, 116, { f: F.s, a: 'center', c: P.paper });
  REC_BTNS.forEach((b, i) => {
    const on = sel === i, dis = i === 1;
    box(b.x + ox, b.y, b.w, b.h, dis ? '#d8d2c8' : on ? P.red : P.paper, on ? P.ink : P.ink2);
    text(dis ? '퇴근 (잠김)' : '내일 출근하기', b.x + b.w / 2 + ox, b.y + 4, { f: F.m, a: 'center', c: dis ? '#8f877c' : on ? P.paper : P.ink });
    if (on) text('▶', b.x - 8 + ox, b.y + 4, { f: F.s, c: P.cr });
  });
}
function draw() {
  ctx.setTransform(S, 0, 0, S, 0, 0); ctx.imageSmoothingEnabled = false;
  R(0, 0, W, H, P.wall);
  if (SHAKE > 0) ctx.translate(Math.round(Math.sin(T * 70) * 2 * SHAKE / .4), 0);
  if (MODE === 'title') drawTitle();
  else if (MODE === 'rosie') drawRosie();
  else if (MODE === 'stare') drawStare();
  else if (MODE === 'receipt') drawReceipt();
  else {
    drawRoom();
    drawHUD();
    if (MG) drawMG();
    if (DLG) drawDLG();
    if (SYS) drawSYS();
  }
  if (MODE !== 'play') drawHUDLite();
  if (FLASH > 0) { ctx.globalAlpha = FLASH / .4; R(0, 0, W, H, P.white); ctx.globalAlpha = 1; }
}
function drawHUDLite() {
  if (toastT > 0) { const w = tw(toastMsg, F.m) + 14; box(W / 2 - w / 2, 64, w, 15, P.ink, P.ink); text(toastMsg, W / 2, 66, { f: F.m, a: 'center', c: P.paper }); }
}

// ---------- 루프
let last = 0;
function frame(ts) {
  const dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts;
  fit(); update(dt); draw();
  requestAnimationFrame(frame);
}
// 자동 시험용 (주소에 ?test 가 있을 때만)
if (/[?&]test\b/.test(location.search)) window.__T = { I, K, PL, STS, RIRAS, DONE, TASKS, beginTask, tryLeave, run, scriptIntro, st: () => ({ MODE, STAGE, RD, MG: MG && MG.id, SYS: SYS && SYS.msg, DLG: DLG && DLG.s, SCR: !!SCR, pending: pending(), clockMin, money }), finish: () => { if (MG) MG.eng.done = true; }, set: o => { if ('MODE' in o) MODE = o.MODE; if ('ET' in o) ET = o.ET; } };
function boot() {
  ASC = {};
  for (const id in RIRAS) RIRAS[id].vis = true;
  for (const id in STS) STS[id].vis = true;
  requestAnimationFrame(frame);
}
const fams = ['7.5px Galmuri14', '10px Galmuri9', '12px Galmuri11', 'bold 12px Galmuri11', 'bold 18px Galmuri11', 'bold 24px Galmuri11'];
if (document.fonts && document.fonts.load) {
  Promise.race([
    Promise.all(fams.map(f => document.fonts.load(f, '가A'))),
    new Promise(r => setTimeout(r, 2000)),
  ]).then(boot, boot);
} else boot();
})();
