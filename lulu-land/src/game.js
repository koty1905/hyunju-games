'use strict';
// 룰루랜드 — 탕후루 먹방 테마파크 (픽셀 게임)
// 배치 좌표는 320x180칸, 그림은 그 두 배(640x360)의 고해상도 격자에 그린다.
// 모든 그림은 코드 안의 픽셀 문자열로 그린 뒤 Scale2x로 다듬고 세부를 덧그린다.
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
const ease = t => { t = clamp(t, 0, 1); return t < .5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2; };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
const C = {
  ink: '#3b1f3a', ink2: '#6a4a68', cream: '#fff7f0', pink: '#ff8fb3', pinkD: '#e0648f',
  pinkL: '#ffd0e0', red: '#ef3f5a', redD: '#b8233f', mint: '#8fe3c0', mintD: '#4fbf9a',
  gold: '#ffc857', goldD: '#e09a2b', lav: '#b9a3d9', lavD: '#8d74b8', white: '#ffffff',
  night: '#2b1838',
};

// ---------- 글꼴 (갈무리)
const F = { s: '7.5px Galmuri14', m: '10px Galmuri9', l: '12px Galmuri11', b: 'bold 12px Galmuri11', xl: 'bold 24px Galmuri11' };
const ASC = {};
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
  ctx.fillStyle = o.c || C.ink;
  ctx.fillText(s, x, by);
}
function wrapChars(s, f, w1, w) {
  ctx.font = f;
  const out = []; let cur = '', lim = w1;
  for (const ch of s) {
    if (cur === '' && ch === ' ' && out.length) continue;
    if (ctx.measureText(cur + ch).width > lim && cur) { out.push(cur); cur = ch === ' ' ? '' : ch; lim = w; }
    else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

// ---------- 저장
const KEY = 'lululand-save-v1';
const DEF = () => ({
  coins: 80, fans: 0,
  own: { outfit: ['apron'], hair: ['braids'], band: ['none'] },
  eq: { outfit: 'apron', hair: 'braids', band: 'none' },
  ice: {}, dropBest: 0, made: 0, music: true, sfx: true, crownGiven: false,
});
let G = DEF();
function load() {
  try {
    const s = localStorage.getItem(KEY);
    if (s) {
      const d = JSON.parse(s), df = DEF();
      G = Object.assign(df, d);
      G.own = Object.assign(DEF().own, d.own || {});
      G.eq = Object.assign(DEF().eq, d.eq || {});
      G.ice = d.ice || {};
      if (d.sound === false && d.music == null) { G.music = false; G.sfx = false; }
      return true;
    }
  } catch (e) { /* 저장소를 못 쓰면 새로 시작 */ }
  return false;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(G)); } catch (e) { /* 무시 */ } }
let hasSave = load();

// ---------- 소리: WebAudio 칩튠 (장소별 배경음악 + 효과음)
// 음악: 파트별 채널(좌우·잔향·메아리) → xf(곡 전환 크로스페이드) → duck(징글 때 낮춤) → mus(켜기/끄기) → out
// 효과음: fx(켜기/끄기) → out → 컴프레서 → 스피커. 징글은 fxBus 로 들어가 짧은 잔향을 얻는다
const AU = { ac: null, out: null, mus: null, xf: null, duck: null, fx: null, fxBus: null, revIn: null, dlyIn: null, dly: null, strips: {}, lite: matchMedia('(pointer: coarse)').matches, waves: {}, noise: null, track: null, want: null, step: 0, next: 0, switching: false };
function audio() {
  if (AU.ac) { if (AU.ac.state === 'suspended' && !document.hidden) AU.ac.resume(); return; }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ac = AU.ac = new AC();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(ac.destination);
    AU.out = ac.createGain(); AU.out.gain.value = .85; AU.out.connect(comp);
    AU.mus = ac.createGain(); AU.mus.gain.value = G.music ? .36 : 0; AU.mus.connect(AU.out);
    AU.duck = ac.createGain(); AU.duck.connect(AU.mus);
    AU.xf = ac.createGain(); AU.xf.gain.value = 0; AU.xf.connect(AU.duck);
    AU.fx = ac.createGain(); AU.fx.gain.value = G.sfx ? .9 : 0; AU.fx.connect(AU.out);
    // 음악 잔향 (합성한 1.9초 홀 잔향)
    AU.revIn = ac.createGain();
    const rv = ac.createConvolver(); rv.buffer = makeIR(ac, 1.9, 3, .3);
    AU.revIn.connect(rv); rv.connect(AU.xf);
    // 메아리 (곡 박자에 맞춘 점8분음표, 오른쪽에서 되돌아온다)
    AU.dlyIn = ac.createGain(); AU.dly = ac.createDelay(2); AU.dly.delayTime.value = .34;
    const fb = ac.createGain(); fb.gain.value = .32;
    const dlp = ac.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2600;
    AU.dlyIn.connect(AU.dly); AU.dly.connect(dlp); dlp.connect(fb); fb.connect(AU.dly);
    const dpan = ac.createStereoPanner ? ac.createStereoPanner() : ac.createGain();
    if (dpan.pan) dpan.pan.value = .35;
    dlp.connect(dpan); dpan.connect(AU.xf);
    // 징글용 효과음 버스와 짧은 잔향
    AU.fxBus = ac.createGain(); AU.fxBus.connect(AU.fx);
    const fr = ac.createConvolver(); fr.buffer = makeIR(ac, 1.3, 3.5, .4);
    const frs = ac.createGain(); frs.gain.value = .25;
    AU.fxBus.connect(frs); frs.connect(fr); fr.connect(AU.fx);
    // 8비트 펄스파 (듀티 12.5%, 25%)
    for (const [k, d] of [['p12', .125], ['p25', .25]]) {
      const N = 40, re = new Float32Array(N), im = new Float32Array(N);
      for (let n = 1; n < N; n++) re[n] = 2 / (n * Math.PI) * Math.sin(n * Math.PI * d);
      AU.waves[k] = ac.createPeriodicWave(re, im);
    }
    AU.noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const ch = AU.noise.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    AU.next = ac.currentTime + .1;
    setInterval(schedMusic, 50);
  } catch (e) { AU.ac = null; }
}
document.addEventListener('visibilitychange', () => {
  if (!AU.ac) return;
  if (document.hidden) AU.ac.suspend(); else AU.ac.resume();
});
function setMusic(on) { G.music = on; save(); if (AU.mus) AU.mus.gain.setTargetAtTime(on ? .36 : 0, AU.ac.currentTime, .05); }
function setSfx(on) { G.sfx = on; save(); if (AU.fx) AU.fx.gain.setTargetAtTime(on ? .9 : 0, AU.ac.currentTime, .03); }

const WAVE = { sq: 'square', tri: 'triangle', saw: 'sawtooth', sin: 'sine' };
// 음 하나: w 파형, v 음량, a 어택, r 릴리스, sus 지속 비율, slide 음높이 변화 배율, vib 비브라토 깊이, lp 로우패스
function note(f, t, d, o = {}) {
  const ac = AU.ac; if (!ac) return;
  const w = o.w || 'sq', v = o.v != null ? o.v : .08, a = o.a != null ? o.a : .004, r = o.r != null ? o.r : .06, sus = o.sus != null ? o.sus : .7;
  const osc = ac.createOscillator();
  if (AU.waves[w]) osc.setPeriodicWave(AU.waves[w]); else osc.type = WAVE[w] || w;
  osc.frequency.setValueAtTime(f, t);
  if (o.slide && o.slide !== 1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f * o.slide), t + d);
  const extra = [];
  if (o.vib) {
    const l = ac.createOscillator(), lg = ac.createGain();
    l.frequency.value = o.vibRate || 6; lg.gain.value = f * o.vib;
    l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + d + r + .05); extra.push(l);
  }
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + a);
  g.gain.linearRampToValueAtTime(v * sus, t + Math.max(a, d));
  g.gain.setTargetAtTime(0, t + Math.max(a, d), r / 3);
  let node = osc;
  if (o.lp) { const bf = ac.createBiquadFilter(); bf.type = 'lowpass'; bf.frequency.value = o.lp; osc.connect(bf); node = bf; }
  node.connect(g); g.connect(o.dest || AU.fx);
  osc.start(t); osc.stop(t + d + r + .05);
}
// 잡음 한 번: type 필터 종류, f 중심 주파수, f2 끝 주파수, q, v 음량
function nz(t, d, o = {}) {
  const ac = AU.ac; if (!ac) return;
  const s = ac.createBufferSource(); s.buffer = AU.noise;
  const bf = ac.createBiquadFilter(); bf.type = o.type || 'bandpass'; bf.frequency.setValueAtTime(o.f || 3000, t); bf.Q.value = o.q || 1;
  if (o.f2) bf.frequency.exponentialRampToValueAtTime(o.f2, t + d);
  const g = ac.createGain(); const v = o.v != null ? o.v : .2;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  s.connect(bf); bf.connect(g); g.connect(o.dest || AU.fx);
  s.start(t, Math.random() * 1.5); s.stop(t + d + .02);
}
// --- 악기: 발진기 여러 개 + FM + 필터 엔벌로프 + 비브라토로 만든 소리 모음
// osc: {w 파형, g 음량, det 센트, oct 옥타브, pan 좌우}, fm: {ratio, idx, decay}, lp: {f, env, decay, q}
const PATCH = {
  lead: { osc: [{ w: 'p25', g: .6 }, { w: 'p25', g: .45, det: 9 }], lp: { f: 3800 }, a: .006, dcy: .25, sus: .7, r: .09, vib: { rate: 5.6, depth: .005, delay: .18 } },
  chip: { osc: [{ w: 'p25', g: .7 }, { w: 'p12', g: .35, det: -6 }], a: .003, dcy: .12, sus: .6, r: .05, vib: { rate: 6, depth: .004, delay: .2 } },
  chip12: { osc: [{ w: 'p12' }], a: .002, dcy: .08, sus: .4, r: .03 },
  flute: { osc: [{ w: 'sin', g: .8 }, { w: 'tri', g: .22, oct: 1 }], a: .04, dcy: .3, sus: .8, r: .12, vib: { rate: 5, depth: .006, delay: .14 }, breath: .05 },
  bell: { osc: [{ w: 'sin' }], fm: { ratio: 3.5, idx: 2.5, decay: .25 }, a: .002, dcy: 1.4, sus: 0, r: .3 },
  musicbox: { osc: [{ w: 'sin' }, { w: 'sin', oct: 2, g: .1 }], fm: { ratio: 5, idx: 1.2, decay: .12 }, a: .002, dcy: 1.2, sus: 0, r: .4 },
  marimba: { osc: [{ w: 'sin' }], fm: { ratio: 4, idx: 1.8, decay: .04 }, a: .002, dcy: .45, sus: 0, r: .1 },
  epiano: { osc: [{ w: 'sin' }, { w: 'sin', det: 5, g: .5 }], fm: { ratio: 1, idx: 1.3, decay: .3, floor: .12 }, a: .004, dcy: 1.6, sus: .12, r: .25 },
  pluck: { osc: [{ w: 'saw', g: .55 }, { w: 'tri', g: .45 }], lp: { f: 500, env: 3500, decay: .12, q: 1 }, a: .002, dcy: .7, sus: 0, r: .2 },
  strings: { osc: [{ w: 'saw', det: -9, pan: -.5, g: .45 }, { w: 'saw', det: 9, pan: .5, g: .45 }, { w: 'tri', oct: -1, g: .3 }], lp: { f: 1500, q: .5 }, a: .35, dcy: .5, sus: .85, r: .6, vib: { rate: 4.5, depth: .003, delay: .3 } },
  pad: { osc: [{ w: 'tri', det: -7, pan: -.6 }, { w: 'tri', det: 7, pan: .6 }, { w: 'sin', oct: 1, g: .2 }], a: .5, dcy: .6, sus: .9, r: .8 },
  brass: { osc: [{ w: 'saw', g: .55 }, { w: 'saw', det: 7, g: .45 }], lp: { f: 900, env: 2400, decay: .25, q: 1.2 }, a: .03, dcy: .3, sus: .75, r: .12, vib: { rate: 5.5, depth: .004, delay: .2 } },
  sawlead: { osc: [{ w: 'saw', g: .5 }, { w: 'saw', det: 12, g: .42 }], lp: { f: 2400, env: 1800, decay: .15, q: 2 }, a: .005, dcy: .2, sus: .7, r: .08, vib: { rate: 6, depth: .006, delay: .15 } },
  bass: { osc: [{ w: 'tri' }, { w: 'sin', g: .6 }], lp: { f: 900 }, a: .004, dcy: .2, sus: .75, r: .06 },
  upright: { osc: [{ w: 'tri' }, { w: 'sin', g: .8 }], lp: { f: 700, env: 900, decay: .06 }, a: .003, dcy: .5, sus: .15, r: .08 },
  pbass: { osc: [{ w: 'p25', g: .7 }, { w: 'tri', g: .7 }], lp: { f: 700, env: 1400, decay: .08, q: 3 }, a: .003, dcy: .15, sus: .6, r: .05 },
  sawbass: { osc: [{ w: 'saw', g: .6 }, { w: 'sq', oct: -1, g: .35 }], lp: { f: 380, env: 1200, decay: .09, q: 4 }, a: .003, dcy: .15, sus: .6, r: .05 },
};
function synth(t, f, d, P, v, out) {
  const ac = AU.ac;
  const A = P.a || .005, D = P.dcy || .1, Sl = P.sus != null ? P.sus : .7, R = P.r || .08;
  const relAt = Sl === 0 ? t + A + D : t + Math.max(A, d), end = relAt + R * 2.5 + .02;
  const amp = ac.createGain(); amp.connect(out);
  let dest = amp;
  if (P.lp) {
    const bf = ac.createBiquadFilter(); bf.type = 'lowpass'; bf.Q.value = P.lp.q || .7;
    bf.frequency.setValueAtTime(P.lp.f + (P.lp.env || 0), t);
    if (P.lp.env) bf.frequency.setTargetAtTime(P.lp.f, t + .002, P.lp.decay || .1);
    bf.connect(amp); dest = bf;
  }
  let vib = null, mod = null;
  if (P.vib && d > .25) {
    const l = ac.createOscillator(); l.frequency.value = P.vib.rate;
    vib = ac.createGain(); vib.gain.setValueAtTime(0, t); vib.gain.linearRampToValueAtTime(P.vib.depth * f, t + P.vib.delay + .15);
    l.connect(vib); l.start(t); l.stop(end);
  }
  if (P.fm) {
    const m = ac.createOscillator(); m.frequency.value = f * P.fm.ratio;
    mod = ac.createGain(); mod.gain.setValueAtTime(f * P.fm.idx, t); mod.gain.setTargetAtTime(f * (P.fm.floor || 0), t, P.fm.decay);
    m.connect(mod); m.start(t); m.stop(end);
  }
  for (const o of P.osc) {
    const x = ac.createOscillator();
    if (AU.waves[o.w]) x.setPeriodicWave(AU.waves[o.w]); else x.type = WAVE[o.w];
    x.frequency.value = f * Math.pow(2, o.oct || 0);
    if (o.det) x.detune.value = o.det;
    if (vib) vib.connect(x.frequency);
    if (mod) mod.connect(x.frequency);
    const g = ac.createGain(); g.gain.value = o.g != null ? o.g : 1;
    x.connect(g);
    if (o.pan && ac.createStereoPanner) { const pn = ac.createStereoPanner(); pn.pan.value = o.pan; g.connect(pn); pn.connect(dest); }
    else g.connect(dest);
    x.start(t); x.stop(end);
  }
  const gg = amp.gain;
  gg.setValueAtTime(0, t); gg.linearRampToValueAtTime(v, t + A);
  gg.setTargetAtTime(v * Sl, t + A, D / 3);
  gg.setTargetAtTime(0, relAt, R / 3);
  if (P.breath) nz(t, .09, { type: 'highpass', f: 2600, v: v * P.breath * 4, dest: out });
}
// 드럼: k 킥, s 스네어, c 박수, h 닫힌 하이햇, o 열린 하이햇, x 셰이커, r 림, t/T 탐, C 심벌
function drum(c, t, v, out) {
  switch (c) {
    case 'k': note(155, t, .16, { w: 'sin', v: .9 * v, slide: .28, sus: .25, r: .1, dest: out }); nz(t, .012, { type: 'highpass', f: 3500, v: .18 * v, dest: out }); break;
    case 's': nz(t, .18, { f: 1800, q: .7, v: .42 * v, dest: out }); nz(t, .06, { type: 'highpass', f: 5000, v: .2 * v, dest: out }); note(210, t, .07, { w: 'tri', v: .28 * v, slide: .7, dest: out }); break;
    case 'c': for (let i = 0; i < 3; i++) nz(t + i * .011, .02, { f: 1400, q: 1.2, v: .35 * v, dest: out }); nz(t + .033, .16, { f: 1300, q: .9, v: .28 * v, dest: out }); break;
    case 'h': nz(t, .035, { type: 'highpass', f: 8000, v: .14 * v, dest: out }); break;
    case 'o': nz(t, .2, { type: 'highpass', f: 7000, v: .11 * v, dest: out }); break;
    case 'x': nz(t, .06, { type: 'highpass', f: 6000, v: .07 * v, dest: out }); break;
    case 'r': note(1800, t, .018, { w: 'tri', v: .12 * v, dest: out }); nz(t, .02, { f: 3200, q: 3, v: .18 * v, dest: out }); break;
    case 't': note(190, t, .22, { w: 'sin', v: .5 * v, slide: .6, sus: .3, dest: out }); break;
    case 'T': note(120, t, .26, { w: 'sin', v: .55 * v, slide: .6, sus: .3, dest: out }); break;
    case 'C': nz(t, 1.4, { type: 'highpass', f: 4500, v: .16 * v, dest: out }); nz(t, .5, { f: 9000, q: .8, v: .08 * v, dest: out }); break;
  }
}

// --- 악보 도구: 'E5 G5 - . C6+E6' (- 늘임, . 쉼, + 화음, 숫자는 MIDI 번호)
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(s) {
  if (/^\d+$/.test(s)) return +s;
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(s);
  return m ? 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) : null;
}
const mf = n => 440 * Math.pow(2, (n - 69) / 12);
function seq(str, div = 2) {
  const at = {}; let step = 0, last = null;
  for (const tok of str.split(/\s+/)) {
    if (!tok || tok === '|') continue;
    if (tok === '-') { if (last) for (const e of last) e.l += div; }
    else if (tok === '.') last = null;
    else {
      last = tok.split('+').map(midi).filter(n => n != null).map(n => ({ n, l: div }));
      (at[step] = at[step] || []).push(...last);
    }
    step += div;
  }
  return { at, len: step };
}
const rest = n => Array(n).fill('.').join(' ');
// 화음 이름 → 근음과 음정 (C, Am, G7, Fmaj7, Dm7)
const CHQ = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10] };
function chord(name) {
  const m = /^([A-G])([#b]?)(maj7|m7|m|7)?$/.exec(name);
  return { root: (NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12, iv: CHQ[m[3] || ''] };
}
// lo 이상 한 옥타브 안에 모은 자리바꿈 (성부 진행이 매끄럽다)
function voicing(name, lo) {
  const c = chord(name);
  return c.iv.map(i => lo + (((c.root + i) % 12 - lo % 12) + 12) % 12).sort((a, b) => a - b);
}
// 화음 진행에서 반주 성부를 만든다: pad(화음), arp(분산화음), stab(끊어 치는 화음), tone(화음 한 음), bass(베이스 무늬)
function genPart(tr, g) {
  const spb = tr.beats * 4, bars = tr.chords.length, at = {};
  const add = (s, n, l) => (at[s] = at[s] || []).push({ n, l });
  const [kind, a1, a2, a3] = g, range = g.bars || [0, bars];
  tr.chords.forEach((cn, b) => {
    if (b < range[0] || b >= range[1]) return;
    const s0 = b * spb, c = chord(cn);
    if (kind === 'pad') voicing(cn, a1).forEach(n => add(s0, n, spb));
    else if (kind === 'tone') add(s0, voicing(cn, a1)[a2], spb);
    else if (kind === 'arp') {
      const v = voicing(cn, a1), tones = v.concat(v.map(n => n + 12)), div = a3 || 2;
      a2.forEach((p, i) => { if (p !== '.') add(s0 + i * div, tones[p % tones.length], div); });
    } else if (kind === 'stab') {
      const v = voicing(cn, a1);
      a2.forEach((p, i) => { if (p === 'x') v.forEach(n => add(s0 + i * 2, n, 2)); });
    } else if (kind === 'bass') {
      const R = 12 * (a1 + 1) + c.root, F5 = R + 7, O = R + 12, T3 = R + c.iv[1];
      let ap = 12 * (a1 + 1) + chord(tr.chords[(b + 1) % bars]).root - 1;
      if (ap < R - 5) ap += 12;
      const P = {
        root8: [0, 2, 4, 6, 8, 10, 12, 14].map(o => [o, R, 2]),
        octave: [0, 2, 4, 6, 8, 10, 12, 14].map((o, i) => [o, i % 2 ? O : R, 2]),
        rootfifth: [[0, R, 3], [4, F5, 2], [6, R, 2], [8, R, 3], [12, F5, 2], [14, T3, 2]],
        walk: [[0, R, 4], [4, T3, 4], [8, F5, 4], [12, ap, 4]],
        waltz: [[0, R, 6], [8, F5, 4]],
      }[a2];
      P.forEach(([o, n, l]) => add(s0 + o, n, l));
    }
  });
  return { at, len: bars * spb };
}

const TRACKS = {
  // 룰루랜드 거리·타이틀: 밝은 C장조 (A 8마디 + B 8마디, B에서 종소리가 겹친다)
  park: {
    bpm: 132, beats: 4, echo: .75,
    chords: 'C Am F G C Am F G F G Em Am Dm G7 C C',
    parts: [
      { inst: 'lead', v: .075, rev: .18, echo: .2, mel: ['E5 G5 C6 G5 E5 G5 A5 G5 | A5 - C6 A5 E5 - . . | F5 A5 C6 A5 G5 F5 E5 F5 | G5 - D5 - G5 A5 B5 - | C6 - B5 C6 D6 C6 A5 G5 | A5 C6 E6 - D6 C6 A5 - | F5 A5 G5 F5 E5 - D5 E5 | D5 - G5 - C5 - . . | A5 - C6 - F6 - E6 D6 | D6 - B5 - G5 - A5 B5 | G5 - E5 - B5 - G5 E5 | A5 - - - C6 - B5 A5 | F5 A5 D6 - C6 A5 F5 A5 | G5 B5 D6 - F6 - D6 B5 | C6 - G5 - E5 - G5 - | C6 - - - . . . .', 2] },
      { inst: 'bell', extra: 1, v: .035, pan: .3, rev: .35, mel: [rest(64) + ' A5 - C6 - F6 - E6 D6 | D6 - B5 - G5 - A5 B5 | G5 - E5 - B5 - G5 E5 | A5 - - - C6 - B5 A5 | F5 A5 D6 - C6 A5 F5 A5 | G5 B5 D6 - F6 - D6 B5 | C6 - G5 - E5 - G5 - | C6 - - - . . . .', 2] },
      { inst: 'strings', v: .028, rev: .3, gen: ['pad', 55] },
      { inst: 'chip12', extra: 1, v: .018, pan: -.4, gen: ['arp', 60, [0, 2, 1, 2, 0, 2, 1, 2]] },
      { inst: 'bass', v: .2, gen: ['bass', 2, 'rootfifth'] },
    ],
    drums: {
      v: .8, rev: .12, fillEvery: 8, crash: [0, 8],
      main: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', x: '..x...x...x...x.' },
      fill: { k: 'x.......x.......', s: '....x.......x.xx', t: '..........x.....', T: '...........x....', h: 'x.x.x.x.x.......' },
    },
  },
  // 탕후루 가게: 스윙하는 F장조 카페 음악 (플루트·일렉트릭 피아노·콘트라베이스)
  shop: {
    bpm: 100, beats: 4, swing: .6, echo: .5,
    chords: 'F Dm Bb C7 F Dm Gm C7 Bb C Am Dm Gm C7 F F',
    parts: [
      { inst: 'flute', v: .12, rev: .28, echo: .1, mel: ['A5 - C6 - A5 G5 F5 - | D5 F5 A5 - G5 - F5 . | D5 - F5 Bb5 A5 - G5 - | E5 G5 C6 - Bb5 A5 G5 . | A5 - C6 - F6 - E6 D6 | C6 - A5 - D6 C6 A5 . | Bb5 A5 G5 - D5 E5 F5 G5 | A5 - G5 - F5 - . . | D6 - C6 Bb5 A5 - F5 - | G5 - A5 Bb5 C6 - . . | C6 - A5 - E5 - A5 C6 | D6 - - - A5 - F5 - | Bb5 - A5 G5 D5 - G5 - | E5 G5 Bb5 - A5 G5 E5 - | F5 - A5 - C6 - A5 - | F5 - - - . . . .', 2] },
      { inst: 'epiano', v: .035, pan: -.2, rev: .2, gen: ['stab', 53, ['.', '.', 'x', '.', '.', '.', 'x', 'x']] },
      { inst: 'marimba', v: .045, pan: .35, rev: .2, gen: Object.assign(['arp', 65, [0, 1, 2, 3, 2, 1, 0, 1]], { bars: [8, 16] }) },
      { inst: 'pad', v: .02, rev: .3, gen: ['pad', 57] },
      { inst: 'upright', v: .26, gen: ['bass', 2, 'walk'] },
    ],
    drums: {
      v: .6, rev: .1, fillEvery: 8, crash: [],
      main: { k: 'x.........x.....', r: '....x.......x...', x: 'x.x.x.x.x.x.x.x.' },
      fill: { k: 'x.........x.....', r: '....x.......x...', x: 'x.x.x.x.x.x.x.x.', t: '............x...', T: '..............x.' },
    },
  },
  // 설탕 시럽 끓이기: 째깍거리는 A단조
  cook: {
    bpm: 148, beats: 4, echo: .75,
    chords: 'Am F G E Am F Dm E',
    parts: [
      { inst: 'pluck', v: .11, rev: .15, echo: .22, mel: ['A4 . C5 . E5 . C5 . | A4 . C5 . F5 . E5 . | G4 . B4 . D5 . B4 . | G#4 . B4 . E5 . D5 . | A4 . C5 . E5 . A5 . | F5 . E5 . C5 . A4 . | D5 . F5 . A5 . F5 . | G#4 . B4 . E5 . G#5 .', 2] },
      { inst: 'strings', v: .03, rev: .25, gen: ['pad', 57] },
      { inst: 'chip12', extra: 1, v: .014, pan: .35, gen: ['arp', 69, [0, 1, 2, 3, 2, 1, 0, 1, 0, 1, 2, 3, 2, 1, 0, 1], 1] },
      { inst: 'sawbass', v: .1, gen: ['bass', 2, 'root8'] },
    ],
    drums: {
      v: .7, rev: .08, fillEvery: 4, crash: [0],
      main: { k: 'x.......x.......', c: '....x.......x...', h: 'x.xxx.xxx.xxx.xx', r: '..x...x...x...x.' },
      fill: { k: 'x.......x.......', s: '....x...x.x.xxxx', h: 'x.xxx.xxx.......' },
    },
  },
  // 아이스크림 뽑기: 통통 튀는 오락실 D장조
  arcade: {
    bpm: 152, beats: 4, echo: .75,
    chords: 'D G A D D Em A D Bm G D A Bm G A D',
    parts: [
      { inst: 'chip', v: .065, rev: .12, echo: .2, mel: ['D5 F#5 A5 D6 A5 F#5 D5 F#5 | G5 B5 D6 G6 D6 B5 G5 B5 | A5 C#6 E6 A6 E6 C#6 A5 C#6 | D6 - A5 - F#5 - D5 . | F#5 A5 D6 F#6 D6 A5 F#5 A5 | E5 G5 B5 E6 B5 G5 E5 G5 | A5 C#6 E6 G6 E6 C#6 A5 G5 | F#5 - E5 - D5 - . . | F#5 - D5 - B4 - D5 F#5 | G5 - B5 - D6 - B5 G5 | A5 - F#5 - D5 - F#5 A5 | E5 - C#5 - A4 - C#5 E5 | F#5 A5 B5 D6 B5 A5 F#5 A5 | G5 B5 D6 G6 D6 B5 G5 B5 | A5 C#6 E6 A6 G6 E6 C#6 A5 | D6 - A5 - D6 . . .', 2] },
      { inst: 'bell', extra: 1, v: .03, pan: -.3, rev: .3, mel: [rest(64) + ' F#5 - D5 - B4 - D5 F#5 | G5 - B5 - D6 - B5 G5 | A5 - F#5 - D5 - F#5 A5 | E5 - C#5 - A4 - C#5 E5 | . . . . . . . . | . . . . . . . . | A5 - - - E6 - - - | D6 - - - . . . .', 2] },
      { inst: 'chip12', extra: 1, v: .016, pan: .35, gen: ['arp', 62, [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3], 1] },
      { inst: 'pad', v: .018, rev: .25, gen: ['pad', 57] },
      { inst: 'pbass', v: .13, gen: ['bass', 2, 'octave'] },
    ],
    drums: {
      v: .8, rev: .1, fillEvery: 8, crash: [0, 8],
      main: { k: 'x.......x.x.....', c: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', o: '..............x.' },
      fill: { k: 'x.......x.......', s: '........x.x.xxxx', h: 'x.x.x.x.........' },
    },
  },
  // 드롭타워 낙하: 질주하는 E단조 록
  fall: {
    bpm: 172, beats: 4, echo: .75,
    chords: 'Em D C B Em C Am B C D Bm Em C D B B',
    parts: [
      { inst: 'sawlead', v: .055, rev: .15, echo: .15, mel: ['E5 - G5 - B5 - A5 G5 | F#5 - A5 - D6 - C6 B5 | C6 - B5 - A5 - G5 A5 | B5 - - - D#5 - F#5 . | E5 - G5 - B5 - E6 D6 | C6 - B5 - A5 - G5 - | A5 - G5 - F#5 - E5 F#5 | G5 - F#5 - E5 - . . | G5 - E5 - G5 - C6 - | A5 - F#5 - A5 - D6 - | B5 - A5 - F#5 - D5 - | E5 - - - G5 - B5 - | C6 - B5 - G5 - E5 - | D6 - C6 - A5 - F#5 - | D#6 - B5 - F#5 - D#5 - | B5 - - - - - . .', 2] },
      { inst: 'strings', v: .032, rev: .25, gen: ['pad', 52] },
      { inst: 'brass', extra: 1, v: .03, pan: .25, rev: .2, gen: Object.assign(['stab', 55, ['x', '.', '.', 'x', '.', '.', 'x', '.']], { bars: [8, 16] }) },
      { inst: 'chip12', extra: 1, v: .014, pan: -.35, gen: ['arp', 64, [0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1], 1] },
      { inst: 'sawbass', v: .12, gen: ['bass', 2, 'octave'] },
    ],
    drums: {
      v: .85, rev: .1, fillEvery: 4, crash: [0, 4, 8, 12],
      main: { k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', o: '..............x.' },
      fill: { k: 'x.......x.......', s: '....x...xxxxxxxx', t: '..........x.x...', T: '...........x.x..' },
    },
  },
  // 룰루 옷장: 오르골과 하프의 G장조 왈츠 (3/4)
  boutique: {
    bpm: 96, beats: 3, echo: .5,
    chords: 'G Em Am D G C D D G Em D Am G D G G',
    parts: [
      { inst: 'musicbox', v: .22, rev: .38, echo: .12, mel: ['B5 - D6 | G5 - - | A5 B5 C6 | B5 - A5 | G5 - B5 | E5 - - | F#5 G5 A5 | D5 - - | B5 - D6 | G6 - - | F#6 E6 D6 | C6 - A5 | B5 - G5 | A5 - F#5 | G5 - - | . . .', 4] },
      { inst: 'flute', v: .06, pan: .25, rev: .35, gen: Object.assign(['tone', 64, 1], { bars: [8, 15] }) },
      { inst: 'pluck', v: .07, pan: -.3, rev: .3, gen: ['arp', 55, [0, 1, 2, 3, 2, 1]] },
      { inst: 'strings', v: .018, rev: .35, gen: ['pad', 55] },
      { inst: 'upright', v: .2, gen: ['bass', 2, 'waltz'] },
    ],
    drums: { v: .5, rev: .2, fillEvery: 0, crash: [], main: { x: '....x...x...' } },
  },
};
for (const k in TRACKS) {
  const tr = TRACKS[k];
  tr.chords = tr.chords.split(' ');
  tr.len = tr.chords.length * tr.beats * 4;
  for (const p of tr.parts) Object.assign(p, p.mel ? seq(p.mel[0], p.mel[1]) : genPart(tr, p.gen));
}
// 믹서 채널: 파트마다 좌우 위치와 잔향·메아리 보내기
function strip(key, pan = 0, rev = 0, echo = 0) {
  if (AU.strips[key]) return AU.strips[key];
  const ac = AU.ac, g = ac.createGain();
  let last = g;
  if (pan && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = pan; g.connect(p); last = p; }
  last.connect(AU.xf);
  if (rev) { const s = ac.createGain(); s.gain.value = rev; last.connect(s); s.connect(AU.revIn); }
  if (echo) { const s = ac.createGain(); s.gain.value = echo; last.connect(s); s.connect(AU.dlyIn); }
  return (AU.strips[key] = g);
}
function makeIR(ac, sec, decay, bright) {
  const len = Math.floor(ac.sampleRate * sec), pre = Math.floor(ac.sampleRate * .012);
  const b = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c); let lp = 0;
    for (let i = pre; i < len; i++) { lp += (Math.random() * 2 - 1 - lp) * bright; d[i] = lp * Math.pow(1 - i / len, decay); }
  }
  return b;
}
function setTrack(name) {
  AU.want = name;
  if (!AU.ac || AU.switching || name === AU.track) return;
  AU.switching = true;
  const t = AU.ac.currentTime, x = AU.xf.gain;
  x.cancelScheduledValues(t); x.setValueAtTime(x.value, t); x.linearRampToValueAtTime(0, t + .35);
  setTimeout(() => {
    AU.track = AU.want; AU.step = 0; AU.next = AU.ac.currentTime + .06;
    const t2 = AU.ac.currentTime, tr = TRACKS[AU.track];
    x.cancelScheduledValues(t2); x.setValueAtTime(0, t2);
    if (tr) { x.linearRampToValueAtTime(1, t2 + .5); AU.dly.delayTime.setValueAtTime(60 / tr.bpm * (tr.echo || .75), t2); }
    AU.switching = false;
    if (AU.want !== AU.track) setTrack(AU.want);
  }, AU.track ? 380 : 10);
}
function schedStep(name, tr, s, t) {
  const sd = 60 / tr.bpm / 4, spb = tr.beats * 4, pos = s % spb, bar = Math.floor(s / spb) % tr.chords.length;
  if (tr.swing && pos % 4 === 2) t += tr.swing * sd;
  const acc = pos === 0 ? 1.1 : pos % 4 === 0 ? 1 : .86;
  tr.parts.forEach((p, i) => {
    if (p.extra && AU.lite) return;
    const ev = p.at[s % p.len]; if (!ev) return;
    const out = strip(name + i, p.pan, p.rev, p.echo);
    for (const e of ev) synth(t, mf(e.n + (p.tr || 0)), e.l * sd * .92, PATCH[p.inst], p.v * acc, out);
  });
  const dr = tr.drums; if (!dr) return;
  const out = strip(name + 'dr', 0, dr.rev, 0);
  const pat = dr.fillEvery && bar % dr.fillEvery === dr.fillEvery - 1 ? dr.fill : dr.main;
  for (const lane in pat) { const c = pat[lane][pos]; if (c === 'x' || c === 'X') drum(lane, t, dr.v * (c === 'X' ? 1.2 : 1) * acc, out); }
  if (pos === 0 && dr.crash.includes(bar)) drum('C', t, dr.v, out);
}
function schedMusic() {
  const ac = AU.ac, tr = TRACKS[AU.track];
  if (!ac || !tr) return;
  const sd = 60 / tr.bpm / 4;
  if (AU.next < ac.currentTime - .1) AU.next = ac.currentTime + .05;
  while (AU.next < ac.currentTime + .22) {
    if (G.music) schedStep(AU.track, tr, AU.step % tr.len, AU.next);
    AU.next += sd; AU.step++;
  }
}
// 짧은 징글: 금관·종소리·베이스를 겹치고, 울리는 동안 배경음악을 낮춘다
const JINGLES = {
  start: { bpm: 160, lead: 'C5 E5 G5 C6 - - - .', bass: 'C3 - - - - - - .' },
  fanfare: { bpm: 150, lead: 'G5 . G5 G5 C6 - - E6 | D6 C6 D6 - E6 - - -', bass: 'C3 - - - G2 - - - | G2 - - - C3 - - -' },
  nice: { bpm: 160, lead: 'E5 G5 C6 - E6 - - .', bass: 'C3 - - - C3 - - .' },
  meh: { bpm: 120, lead: 'E5 D5 C5 - - .', bass: 'A2 - - - - .', inst: 'flute' },
  prize: { bpm: 180, lead: 'C6 E6 G6 C7 - - . .', bass: 'C3 - G3 - C4 - . .', inst: 'chip' },
  big: { bpm: 170, lead: 'C6 E6 G6 C7 - G6 C7 - E7 - - -', bass: 'C3 - - - G3 - - - C4 - - -' },
  unlock: { bpm: 180, lead: 'G5 C6 E6 G6 - C7 - - .', inst: 'bell' },
  coatPerfect: { bpm: 200, lead: 'C6 E6 G6 C7 E7 - - .', inst: 'bell' },
  coatGood: { bpm: 180, lead: 'E6 G6 C7 - - .', inst: 'bell' },
  coatBad: { bpm: 110, lead: 'G4 F#4 F4 - - -', inst: 'flute' },
  aww: { bpm: 110, lead: 'A4 G#4 G4 - - -', inst: 'flute' },
};
function jingle(name, delay = 0) {
  if (!AU.ac || !G.sfx) return;
  const j = JINGLES[name], sd = 60 / j.bpm / 2, t0 = AU.ac.currentTime + .02 + delay;
  const inst = j.inst || 'brass', L = seq(j.lead, 1);
  const v = { brass: .1, bell: .12, flute: .13, chip: .09 }[inst];
  for (const s in L.at) for (const e of L.at[s]) {
    const t = t0 + s * sd, d = e.l * sd * .9;
    synth(t, mf(e.n), d, PATCH[inst], v, AU.fxBus);
    if (inst === 'brass') synth(t, mf(e.n + 12), d, PATCH.bell, .025, AU.fxBus);
  }
  if (j.bass) { const B = seq(j.bass, 1); for (const s in B.at) for (const e of B.at[s]) synth(t0 + s * sd, mf(e.n), e.l * sd * .9, PATCH.bass, .2, AU.fxBus); }
  if (AU.duck) {
    const g = AU.duck.gain, t = AU.ac.currentTime + delay;
    g.setTargetAtTime(.18, t, .03); g.setTargetAtTime(1, t + L.len * sd + .15, .25);
  }
}
// 이어지는 소리 (끓는 시럽, 집게 모터, 바람, 분수)
const LOOPS = {};
function makeLoop(kind) {
  const ac = AU.ac;
  const g = ac.createGain(); g.gain.value = 0; g.connect(AU.fx);
  const f = ac.createBiquadFilter();
  const stops = [];
  let src;
  if (kind === 'motor') {
    src = ac.createOscillator(); src.type = 'sawtooth'; src.frequency.value = 70;
    f.type = 'lowpass'; f.frequency.value = 520;
    const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 11; lg.gain.value = 5;
    l.connect(lg); lg.connect(src.frequency); l.start(); stops.push(l);
    src.connect(f);
  } else {
    src = ac.createBufferSource(); src.buffer = AU.noise; src.loop = true;
    f.type = kind === 'wind' ? 'lowpass' : 'bandpass';
    f.frequency.value = kind === 'wind' ? 600 : kind === 'water' ? 2600 : 700;
    f.Q.value = kind === 'boil' ? 1.2 : .7;
    src.connect(f);
  }
  if (kind === 'boil' || kind === 'water') {
    // 보글보글: 불규칙한 떨림으로 음량을 흔든다
    const am = ac.createGain(); am.gain.value = .55;
    for (const [hz, dep] of [[kind === 'boil' ? 7.3 : 4.1, .3], [kind === 'boil' ? 3.1 : 2.3, .2]]) {
      const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = hz; lg.gain.value = dep;
      l.connect(lg); lg.connect(am.gain); l.start(); stops.push(l);
    }
    f.connect(am); am.connect(g);
  } else f.connect(g);
  src.start(); stops.push(src);
  return {
    set(vol, freq, pitch) {
      const t = ac.currentTime;
      if (vol != null) g.gain.setTargetAtTime(vol, t, .08);
      if (freq != null) f.frequency.setTargetAtTime(freq, t, .08);
      if (pitch != null && src.frequency) src.frequency.setTargetAtTime(pitch, t, .06);
    },
    stop() {
      g.gain.setTargetAtTime(0, ac.currentTime, .05);
      setTimeout(() => { for (const s of stops) { try { s.stop(); } catch (e) { /* 이미 멈춤 */ } } g.disconnect(); }, 400);
    },
  };
}
function loop(name, kind = name) {
  if (!AU.ac || !G.sfx) return null;
  return LOOPS[name] || (LOOPS[name] = makeLoop(kind));
}
function loopOff(name) { if (LOOPS[name]) { LOOPS[name].stop(); delete LOOPS[name]; } }
function loopsOff() { for (const k in LOOPS) loopOff(k); }

// 효과음: FX(fn) 은 오디오가 켜져 있을 때만 현재 시각 t 를 넘겨 실행한다
const FX = fn => (...a) => { if (AU.ac && G.sfx) fn(AU.ac.currentTime, ...a); };
const JUICY = ['berry', 'grape', 'mandarin', 'blue', 'kiwi'];
let stepAlt = false;
const sfx = {
  click: FX(t => note(1320, t, .025, { w: 'p25', v: .04, r: .02 })),
  swish: FX(t => nz(t, .22, { f: 700, f2: 3200, q: .8, v: .22 })),
  door: FX(t => { note(1568, t, .35, { w: 'tri', v: .09, sus: .3, r: .3 }); note(2093, t + .12, .45, { w: 'tri', v: .09, sus: .3, r: .4 }); }),
  step: FX(t => { stepAlt = !stepAlt; nz(t, .05, { type: 'lowpass', f: stepAlt ? 420 : 520, v: .22 }); }),
  bird: FX(t => { const b = rnd(2400, 3000); for (let i = 0; i < ri(2, 3); i++) note(b, t + i * .09, .05, { w: 'sin', v: .03, slide: 1.35 }); }),
  notify: FX(t => { note(1319, t, .05, { w: 'sin', v: .07 }); note(1760, t + .07, .09, { w: 'sin', v: .07 }); }),
  // 탕후루 가게
  skewer: FX((t, id) => {
    const soft = id === 'marsh', chewy = id === 'gummy';
    nz(t, .04, { type: 'highpass', f: soft ? 1500 : 3000, v: .12 });
    note(soft ? 260 : chewy ? 330 : 420, t, .09, { w: 'sin', v: .16, slide: soft ? 1.3 : 1.9, vib: chewy ? .08 : 0, vibRate: 18 });
  }),
  unpop: FX(t => note(640, t, .09, { w: 'sin', v: .12, slide: .45 })),
  ding: FX(t => { note(1568, t + .04, .12, { w: 'tri', v: .08, sus: .4, r: .15 }); note(2093, t + .1, .16, { w: 'tri', v: .07, sus: .3, r: .2 }); }),
  bloop: FX(t => note(300, t + .03, .1, { w: 'tri', v: .08, slide: .7 })),
  bubble: FX(t => note(rnd(260, 480), t, .06, { w: 'sin', v: .06, slide: 2.2 })),
  therm: FX((t, T) => note(600 + (T - 128) * 14, t, .04, { w: 'p25', v: .055 })),
  zone: FX(t => { note(1760, t, .045, { w: 'p12', v: .08 }); note(2349, t + .05, .06, { w: 'p12', v: .08 }); }),
  dip: FX(t => {
    nz(t, .4, { type: 'lowpass', f: 2600, f2: 300, v: .35 });
    note(160, t, .22, { w: 'sin', v: .15, slide: 2.4 });
    nz(t + .06, 1.1, { type: 'highpass', f: 4200, v: .12 });
  }),
  crackle: FX(t => { for (let i = 0; i < 9; i++) nz(t + rnd(0, .45), .012, { type: 'highpass', f: rnd(5000, 9000), v: rnd(.05, .14) }); }),
  bite: FX((t, id) => {
    nz(t, .03, { type: 'highpass', f: 6000, v: .3 });
    nz(t + .004, .05, { f: 3600, q: 1.5, v: .28 });
    if (id === 'marsh') { nz(t + .02, .2, { type: 'lowpass', f: 900, v: .3 }); note(190, t + .02, .12, { w: 'sin', v: .14, slide: .6 }); }
    else if (id === 'gummy') note(230, t + .03, .28, { w: 'sin', v: .16, vib: .09, vibRate: 14, slide: 1.4 });
    else {
      for (let i = 0; i < 4; i++) nz(t + .02 + i * .035, .045, { f: rnd(1700, 3300), q: 1.2, v: .26 * (1 - i * .15) });
      note(110, t, .08, { w: 'sin', v: .22, slide: .5 });
      if (JUICY.includes(id)) nz(t + .08, .1, { type: 'lowpass', f: 1200, v: .12 });
    }
    for (let i = 0; i < 3; i++) { nz(t + .3 + i * .16, .06, { type: 'lowpass', f: 700, v: .1 }); nz(t + .3 + i * .16, .03, { f: 2400, v: .04 }); }
  }),
  spicy: FX(t => { note(700, t, .5, { w: 'sin', v: .08, slide: 2.6 }); nz(t + .1, .7, { type: 'highpass', f: 3500, v: .12 }); note(900, t + .05, .3, { w: 'saw', v: .03, slide: .5, lp: 2000 }); }),
  coin: FX(t => { note(988, t, .05, { w: 'p25', v: .06 }); note(1319, t + .06, .14, { w: 'p25', v: .06 }); }),
  coinRoll: FX((t, n = 6) => { for (let i = 0; i < n; i++) note(1319 + i * 40, t + .25 + i * .06, .04, { w: 'p25', v: .045 }); }),
  meow: FX(t => { note(700, t, .25, { w: 'tri', v: .08, slide: 1.4 }); note(980, t + .12, .2, { w: 'tri', v: .05, slide: .7 }); }),
  // 뽑기
  insert: FX(t => { note(988, t, .05, { w: 'p25', v: .06 }); note(1319, t + .06, .1, { w: 'p25', v: .06 }); nz(t + .2, .08, { type: 'lowpass', f: 600, v: .25 }); note(140, t + .2, .06, { w: 'sq', v: .05, lp: 500 }); }),
  claw: FX(t => note(180, t, .12, { w: 'sq', v: .05, slide: 1.3, lp: 1200 })),
  clunk: FX(t => { nz(t, .06, { type: 'lowpass', f: 900, v: .3 }); note(160, t, .05, { w: 'sq', v: .06, lp: 700 }); note(520, t + .03, .03, { w: 'sq', v: .03 }); }),
  latch: FX(t => note(880, t, .06, { w: 'p12', v: .06, slide: 1.5 })),
  slip: FX(t => note(1200, t, .45, { w: 'sin', v: .08, slide: .3 })),
  thud: FX(t => { note(90, t, .18, { w: 'sin', v: .35, slide: .5 }); nz(t, .08, { type: 'lowpass', f: 500, v: .2 }); }),
  thunk: FX(t => { nz(t, .1, { type: 'lowpass', f: 800, v: .3 }); note(120, t, .12, { w: 'sin', v: .3, slide: .6 }); }),
  // 드롭타워
  beep: FX(t => note(880, t, .12, { w: 'p25', v: .06 })),
  go: FX(t => note(1760, t, .35, { w: 'p25', v: .06 })),
  clack: FX(t => { nz(t, .03, { f: 1300, q: 4, v: .45 }); note(300, t, .03, { w: 'sq', v: .05 }); }),
  whoosh: FX(t => nz(t, .8, { f: 400, f2: 2500, q: .6, v: .3 })),
  sparkle: FX(t => [2093, 2637, 3136, 4186].forEach((f, i) => note(f, t + i * .04, .08, { w: 'p12', v: .05 }))),
  combo: FX((t, n) => note(880 * Math.pow(2, Math.min(n, 12) / 12), t + .05, .08, { w: 'p12', v: .06 })),
  squawk: FX(t => { note(1400, t, .07, { w: 'sq', v: .05, slide: 1.5 }); note(1150, t + .09, .1, { w: 'sq', v: .05, slide: .7 }); }),
  brake: FX(t => nz(t, .9, { type: 'highpass', f: 3200, f2: 1400, v: .18 })),
  // 옷장
  bell: FX((t, i = 0) => note(mf(79 + [0, 2, 4, 7, 9, 12][i % 6]), t, .3, { w: 'tri', v: .08, sus: .2, r: .3 })),
  rustle: FX(t => { nz(t, .12, { f: 2600, q: .6, v: .1 }); nz(t + .1, .14, { f: 3000, q: .6, v: .08 }); }),
  chaching: FX(t => { nz(t, .08, { f: 3000, v: .25 }); note(2093, t + .05, .3, { w: 'tri', v: .1, sus: .3 }); note(2637, t + .11, .4, { w: 'tri', v: .1, sus: .3, r: .3 }); }),
  deny: FX(t => note(110, t, .2, { w: 'saw', v: .07, lp: 900 })),
};

// ---------- 스프라이트 도구
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const PAL0 = { O: C.ink, W: '#ffffff' };
function sprLo(rows, pal) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const c = mk(w, h), g = c.getContext('2d');
  const p = Object.assign({}, PAL0, pal);
  for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) {
    const col = p[rows[y][x]];
    if (col && rows[y][x] !== '.') { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
  }
  return c;
}
// Scale2x(EPX): 픽셀 그림을 두 배로 키우면서 대각선 계단을 부드럽게 잇는다. 결과는 hd 캔버스(한 픽셀 = 0.5칸).
function scale2x(src) {
  const w = src.width, h = src.height, w2 = w * 2;
  const s = new Uint32Array(src.getContext('2d').getImageData(0, 0, w, h).data.buffer);
  const out = mk(w2, h * 2), g = out.getContext('2d');
  const od = g.createImageData(w2, h * 2), o = new Uint32Array(od.data.buffer);
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : s[y * w + x];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P = s[y * w + x], A = at(x, y - 1), B = at(x + 1, y), L = at(x - 1, y), D = at(x, y + 1);
    const i = y * 2 * w2 + x * 2;
    o[i] = (L === A && L !== D && A !== B) ? A : P;
    o[i + 1] = (A === B && A !== L && B !== D) ? B : P;
    o[i + w2] = (D === L && D !== B && L !== A) ? L : P;
    o[i + w2 + 1] = (B === D && B !== A && D !== L) ? D : P;
  }
  g.putImageData(od, 0, 0);
  out.hd = true; out.lo = src;
  return out;
}
const spr = (rows, pal) => scale2x(sprLo(rows, pal));
// 처음부터 고해상도로 그린 그림 (Scale2x 없이)
const sprHD = (rows, pal) => { const c = sprLo(rows, pal); c.hd = true; return c; };
const R2 = v => Math.round(v * 2) / 2;
// k 는 저해상도 기준 배율 (hd 그림은 알아서 절반으로 그린다)
function blit(img, x, y, k = 1, flip = false) {
  x = R2(x); y = R2(y);
  const sc = img.hd ? k / 2 : k, w = img.width * sc, h = img.height * sc;
  if (flip) {
    ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, w, h); ctx.restore();
  } else ctx.drawImage(img, x, y, w, h);
}
function silhouette(img, col) {
  const c = mk(img.width, img.height), g = c.getContext('2d');
  g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-atop';
  g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
  c.hd = img.hd;
  return c;
}
function rect(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(R2(x), R2(y), w, h); }
function panel(x, y, w, h, fill, border = C.ink) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = border; ctx.fillRect(x + 1, y, w - 2, h); ctx.fillRect(x, y + 1, w, h - 2);
  ctx.fillRect(x + .5, y + .5, w - 1, h - 1);
  ctx.fillStyle = fill; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
}
// 원·타원·선·고리는 고해상도 격자(0.5칸)에서 그린다
function disc(cx, cy, r, col) {
  ctx.fillStyle = col;
  const X = Math.round(cx * 2), Y = Math.round(cy * 2), R = Math.round(r * 2);
  for (let dy = -R; dy <= R; dy++) {
    const w = Math.floor(Math.sqrt(R * R - dy * dy) + .5);
    ctx.fillRect((X - w) / 2, (Y + dy) / 2, (w * 2 + 1) / 2, .5);
  }
}
function ellipse(cx, cy, rx, ry, col, half = 0) {
  ctx.fillStyle = col;
  const X = Math.round(cx * 2), Y = Math.round(cy * 2), RX = rx * 2, RY = Math.round(ry * 2);
  for (let dy = -RY; dy <= RY; dy++) {
    if (half > 0 && dy < 0) continue;
    if (half < 0 && dy > 0) continue;
    const w = Math.round(RX * Math.sqrt(Math.max(0, 1 - (dy * dy) / (RY * RY + .01))));
    ctx.fillRect((X - w) / 2, (Y + dy) / 2, (w * 2 + 1) / 2, .5);
  }
}
function line(x0, y0, x1, y1, col, t = .5) {
  x0 = Math.round(x0 * 2); y0 = Math.round(y0 * 2); x1 = Math.round(x1 * 2); y1 = Math.round(y1 * 2);
  ctx.fillStyle = col;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy;
  for (let i = 0; i < 1200; i++) {
    ctx.fillRect(x0 / 2, y0 / 2, t, t);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * e;
    if (e2 >= dy) { e += dy; x0 += sx; }
    if (e2 <= dx) { e += dx; y0 += sy; }
  }
}
function ring(cx, cy, r, col) {
  ctx.fillStyle = col;
  const X = Math.round(cx * 2), Y = Math.round(cy * 2);
  let x = Math.round(r * 2), y = 0, e = 1 - x;
  while (x >= y) {
    for (const [a, b] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) ctx.fillRect((X + a) / 2, (Y + b) / 2, .5, .5);
    y++;
    if (e < 0) e += 2 * y + 1; else { x--; e += 2 * (y - x) + 1; }
  }
}
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function mixCol(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join('');
}
function gradCol(stops, t) {
  t = clamp(t, 0, 1) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(t));
  return mixCol(stops[i], stops[i + 1], t - i);
}

// ---------- 아이콘
const ICON = {
  coin: spr(['..OOO..', '.OYYYO.', 'OYWYYyO', 'OYYyYyO', 'OYYYYyO', '.OyyyO.', '..OOO..'], { Y: C.gold, y: C.goldD }),
  heart: spr(['.OO.OO.', 'OPPOPPO', 'OPWPPPO', 'OPPPPPO', '.OPPPO.', '..OPO..', '...O...'], { P: '#ff6f9c' }),
  spkOn: sprHD(['.....OO.........', '....OOO......O..', '...OOOO...O...O.', 'OOOOOOO....O..O.', 'OOOOOOO..O..O..O', 'OOOOOOO..O..O..O', 'OOOOOOO..O..O..O', 'OOOOOOO..O..O..O', 'OOOOOOO....O..O.', '...OOOO...O...O.', '....OOO......O..', '.....OO.........'], { O: '#ffd0e0' }),
  spkOff: sprHD(['.....OO.........', '....OOO.........', '...OOOO.........', 'OOOOOOO..O...O..', 'OOOOOOO...O.O...', 'OOOOOOO....O....', 'OOOOOOO...O.O...', 'OOOOOOO..O...O..', 'OOOOOOO.........', '...OOOO.........', '....OOO.........', '.....OO.........'], { O: '#9c8aa0' }),
  noteOn: sprHD(['.....OOOOO..', '.....OOOOOOO', '.....O....OO', '.....O......', '.....O......', '.....O......', '.....O......', '..OOOO......', '.OOOOO......', 'OOOOOO......', '.OOOO.......'], { O: '#ffd0e0' }),
  noteOff: sprHD(['O....OOOOO..', '.O...OOOOOOO', '..O..O....OO', '...O.O......', '....OO......', '.....O......', '.....OO.....', '..OOOO.O....', '.OOOOO..O...', 'OOOOOO...O..', '.OOOO.....O.'], { O: '#9c8aa0' }),
  lock: spr(['..OOO..', '.O...O.', '.O...O.', 'OOOOOOO', 'OYYYYYO', 'OYYOYYO', 'OYYYYYO', 'OOOOOOO'], { Y: C.gold }),
  check: spr(['......V', '.....VV', 'V...VV.', 'VV.VV..', '.VVV...', '..V....'], { V: '#2e9e5a' }),
  cross: spr(['V...V', '.V.V.', '..V..', '.V.V.', 'V...V'], { V: '#d23a55' }),
  star: spr(['...O...', '..OYO..', 'OOOYOOO', 'OYYWYYO', '.OYYYO.', 'OYYOYYO', 'OO...OO'], { Y: C.gold }),
};

// ---------- 재료
const ROUND = ['...OOOO...', '.OOXXXXOO.', '.OWXXXXXO.', 'OWWXXXXXxO', 'OXWXXXXXxO', 'OXXXXXXXxO', 'OXXXXXXxxO', '.OXXXXxxO.', '.OOxxxxOO.', '...OOOO...'];
const ING = [
  { id: 'berry', name: '딸기', v: 4, need: 0, bits: ['#ef3f5a', '#ffe28a'], rows: ['...gGGg...', '..OGGGGO..', '.ORRRRRRO.', 'ORWRRYRRRO', 'ORRRRRRYRO', 'ORYRRRRRrO', '.ORRRYRrO.', '..ORRRrO..', '...OrrO...', '....OO....'], pal: { R: '#ef3f5a', r: '#b8233f', Y: '#ffe28a', G: '#5cc97a', g: '#2e9e5a' } },
  { id: 'grape', name: '청포도', v: 4, need: 0, bits: ['#b6e36a', '#e8ffc0'], rows: ROUND, pal: { X: '#b6e36a', x: '#7cb342' } },
  { id: 'mandarin', name: '귤', v: 3, need: 0, bits: ['#ffa62b', '#ffd28a'], rows: ['...OGGO...'].concat(ROUND.slice(1)), pal: { X: '#ffa62b', x: '#e07a10', G: '#5cc97a' } },
  { id: 'blue', name: '블루베리', v: 5, need: 20, bits: ['#5a73e0', '#a8b8ff'], rows: ['..........', '...OOOO...', '..OXkkXO..', '.OWXXXXxO.', '.OXXXXXxO.', '.OXXXXxxO.', '..OxxxxO..', '...OOOO...', '..........', '..........'], pal: { X: '#5a73e0', x: '#3448a8', k: '#23306e' } },
  { id: 'kiwi', name: '키위', v: 6, need: 50, bits: ['#9ccc3c', '#2b2b2b'], rows: ['...OOOO...', '.OOnnnnOO.', '.OnKKKKnO.', 'OnKKkKkKnO', 'OnKkWWKKnO', 'OnKKWWkKnO', 'OnKkKKKKnO', '.OnKKkKnO.', '.OOnnnnOO.', '...OOOO...'], pal: { n: '#8d6e3f', K: '#9ccc3c', k: '#2b2b2b', W: '#f1f8d0' } },
  { id: 'marsh', name: '마시멜로', v: 5, need: 100, bits: ['#fff0f6', '#ffc2d8'], rows: ['..........', '..OOOOOO..', '.OppppppO.', '.OmmmmmmO.', '.OmmmmmmO.', '.OmmmmmmO.', '.OmmmmmwO.', '.OwwwwwwO.', '..OOOOOO..', '..........'], pal: { m: '#fff0f6', p: '#ffc2d8', w: '#f5b3cb' } },
  { id: 'gummy', name: '젤리곰', v: 6, need: 180, bits: ['#ff5a7a', '#ffb0c0'], hd: ['...OOO........OOO...', '..OuuuO......OuuuO..', '..OuUuOOOOOOOOuUuO..', '...OuuuuuuuuuuuuO...', '..OuuWWuuuuuuuuuuO..', '..OuWuuKuuuuKuuuuO..', '..OuuuuuuKKuuuuuuO..', '...OuuuuuuuuuuuuO...', '..OOOuuuuuuuuuuOOO..', '.OuuOuuuuuuuuuuOuuO.', '.OuuOuuWuuuuuuuOuUO.', '..OOOuuuuuuuuuuOOO..', '...OuuuuuuuuuuuUO...', '...OuuuuuuuuuuUUO...', '...OuuuuuuuuuUUUO...', '..OOuuuOOOOOOuUUOO..', '.OuuuuO......OuUUuO.', '.OuuuuO......OUUUuO.', '..OOOO........OOOO..', '....................'], pal: { u: '#ff5a7a', U: '#d93a5e', K: '#8a1f3a' } },
  { id: 'chili', name: '고추', v: 3, need: 300, bits: ['#e8364f', '#5cc97a'], rows: ['......gG..', '.....OGO..', '....ORRO..', '...ORWRO..', '...ORRRO..', '..ORRRrO..', '..ORRrO...', '.ORRrO....', '.OrrO.....', '..OO......'], pal: { R: '#e8364f', r: '#a91d36', G: '#5cc97a', g: '#2e9e5a' } },
];
const ING_BY = {};
for (const i of ING) { i.img = i.hd ? sprHD(i.hd, i.pal) : spr(i.rows, i.pal); ING_BY[i.id] = i; }

// 설탕 코팅 (시럽 온도에 따른 결과)
const QUAL = {
  perfect: { name: '유리알 코팅 완벽!', short: '유리알 코팅', mult: 2, tint: 'rgba(255,255,255,0.22)' },
  good: { name: '바삭한 코팅!', short: '바삭', mult: 1.3, tint: 'rgba(255,214,120,0.32)' },
  sticky: { name: '덜 굳어서 눅눅해요', short: '눅눅', mult: .6, tint: 'rgba(255,246,220,0.55)' },
  burnt: { name: '설탕이 탔어요…', short: '탐', mult: .3, tint: 'rgba(120,58,20,0.55)' },
};
function quality(T) {
  if (T < 140) return 'sticky';
  if (T < 150) return 'good';
  if (T <= 160) return 'perfect';
  if (T <= 170) return 'good';
  return 'burnt';
}
const coatCache = {};
function coated(id, q) {
  const k = id + q; if (coatCache[k]) return coatCache[k];
  const src = ING_BY[id].img, handHD = !src.lo;
  const base = handHD ? src : src.lo, w = base.width, h = base.height;
  const c = mk(w, h + 2), g = c.getContext('2d');
  g.drawImage(base, 0, 0);
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = QUAL[q].tint; g.fillRect(0, 0, w, h + 2);
  g.globalCompositeOperation = 'source-over';
  const bd = base.getContext('2d').getImageData(0, 0, w, h).data;
  const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && bd[(y * w + x) * 4 + 3] > 0;
  // 흘러내린 시럽
  if (q === 'sticky' || q === 'burnt') {
    const drip = q === 'sticky' ? 'rgba(255,236,190,0.95)' : 'rgba(140,70,25,0.9)';
    let bx = -1, by = -1;
    for (let y = h - 1; y >= 0 && bx < 0; y--) for (let x = 3; x < w - 2; x++) if (op(x, y)) { bx = x; by = y; break; }
    if (bx >= 0) { g.fillStyle = drip; g.fillRect(bx, by + 1, 1, 2); g.fillRect(bx + 1, by + 1, 1, 1); }
  }
  const hd = handHD ? Object.assign(c, { hd: true }) : scale2x(c), g2 = hd.getContext('2d'), sc = handHD ? 1 : 2;
  // 윤기: 왼쪽 위에 가느다란 곡선 하이라이트 (고해상도)
  const hl = q === 'burnt' ? 'rgba(255,220,180,0.6)' : q === 'sticky' ? 'rgba(255,255,255,0.6)' : '#ffffff';
  g2.fillStyle = hl;
  for (let y = 2; y < 4; y++) {
    let x = 0; while (x < w && !(op(x, y) && op(x + 1, y))) x++;
    if (x >= w) continue;
    const X = x * sc + 2, Y = y * sc;
    g2.fillRect(X, Y + 1, 1, 2); g2.fillRect(X + 1, Y, 2, 1);
    if (q === 'perfect' || q === 'good') g2.fillRect(X + 4, Y - 1, 1, 1);
    break;
  }
  if (q === 'perfect') {
    // 유리알 반짝임 (+ 모양)
    const X = w * sc - 6, Y = h * sc - 8;
    g2.fillStyle = '#ffffff'; g2.fillRect(X, Y - 1, 1, 3); g2.fillRect(X - 1, Y, 3, 1);
  }
  coatCache[k] = hd;
  return hd;
}

// ---------- 아이스크림 (뽑기 경품)
const CONE = ['.OcCcCcCO.', '.OCcCcCcO.', '..OcCcCO..', '..OCcCcO..', '...OcCO...', '...OCcO...', '....OO....'];
const SCOOP = ['...OOOO...', '..OXXXWO..', '.OXXXXXWO.', 'OXXXXXXXXO', 'OXXXXXXXxO', 'OxXxXXxXxO'];
const SOFT = ['....OO....', '...OXWO...', '..OXXXXO..', '..OxxxxO..', '.OXXXXXWO.', '.OxxxxxxO.', 'OXXXXXXXWO', 'OxxxxxxxxO'];
const CONEP = { c: '#f2c27a', C: '#d9964a' };
const ICE = [
  { id: 'straw', name: '딸기콘', w: 30, val: 15, rows: SCOOP.concat(CONE), pal: { X: '#ff9fbf', x: '#e06a95' } },
  { id: 'vanilla', name: '바닐라콘', w: 30, val: 15, rows: SCOOP.concat(CONE), pal: { X: '#fff4d6', x: '#e8d4a2' } },
  { id: 'mint', name: '민트초코', w: 18, val: 25, rows: ['...OOOO...', '..OXkXWO..', '.OXXXXkWO.', 'OXkXXXXXXO', 'OXXXXkXXxO', 'OxXxXXxXxO'].concat(CONE), pal: { X: '#9ff0d0', x: '#5cc9a4', k: '#5b3a29' } },
  { id: 'choco', name: '초코 소프트', w: 14, val: 25, rows: SOFT.concat(CONE), pal: { X: '#a8704c', x: '#6d4128' } },
  { id: 'rainbow', name: '무지개 소프트', w: 6, val: 50, rows: ['....OO....', '...O1WO...', '..O1111O..', '..O2222O..', '.O33333WO.', '.O444444O.', 'O55555555O', 'O55555555O'].concat(CONE), pal: { 1: '#ff9fbf', 2: '#ffd66b', 3: '#9ff0d0', 4: '#9fd3ff', 5: '#c9a8ff' } },
  { id: 'gold', name: '황금 탕후루콘', w: 2, val: 150, rows: ['...ORRO...', '..OXXXWO..', '.OXXXXXWO.', 'OXXXWXXXXO', 'OXXXXXXXxO', 'OxXxXXxXxO'].concat(CONE), pal: { X: '#ffd84d', x: '#e0a82b', R: '#ef3f5a' } },
];
const ICE_BY = {};
for (const i of ICE) { i.img = spr(i.rows, Object.assign({}, CONEP, i.pal)); i.sil = silhouette(i.img, 'rgba(59,31,58,0.35)'); ICE_BY[i.id] = i; }
function pickIce() {
  let r = Math.random() * ICE.reduce((s, i) => s + i.w, 0);
  for (const i of ICE) { r -= i.w; if (r <= 0) return i.id; }
  return ICE[0].id;
}

// ---------- 룰루 옷·머리·머리띠
const OUTFITS = [
  { id: 'apron', name: '기본 앞치마', price: 0, D: '#ff8fb3', d: '#e0648f', A: '#fff6f0', a: '#f2d7dd' },
  { id: 'berry', name: '딸기 원피스', price: 120, D: '#ef3f5a', d: '#b8233f', A: '#ef3f5a', a: '#b8233f', dots: [[8, 15], [11, 16], [9, 18], [6, 20], [13, 20], [10, 21], [7, 19], [12, 18]], dc: '#ffe28a' },
  { id: 'sailor', name: '민트 세일러', price: 150, D: '#4fb6c9', d: '#2f8aa0', A: '#ffffff', a: '#d6f1f6' },
  { id: 'grape', name: '청포도 멜빵', price: 180, D: '#9ccf55', d: '#6d9f33', A: '#fffbe6', a: '#e6edc7' },
  { id: 'choco', name: '초코 후드', price: 220, D: '#8d5a3b', d: '#5e3a24', A: '#f3c9a3', a: '#d9a57a' },
  { id: 'magic', name: '별빛 마법소녀', price: 350, D: '#a58bff', d: '#7a5fe0', A: '#ffe98a', a: '#f2c94c', dots: [[6, 20], [13, 19], [9, 21], [12, 20], [7, 18]], dc: '#fff7c2' },
];
const HAIRS = [
  { id: 'braids', name: '버블 땋은머리', price: 0 },
  { id: 'buns', name: '양갈래 경단', price: 100 },
  { id: 'bob', name: '단발', price: 80 },
  { id: 'long', name: '긴 생머리', price: 140 },
];
const BANDS = [
  { id: 'none', name: '없음', price: 0 },
  { id: 'berry', name: '딸기 핀', price: 60 },
  { id: 'bunny', name: '토끼 머리띠', price: 160 },
  { id: 'cat', name: '고양이 머리띠', price: 160 },
  { id: 'star', name: '별 머리띠', price: 200 },
  { id: 'crown', name: '사탕 왕관', price: -1 },
];

const LW = 20, LH = 34, LT = 6;
const BODY = [
  '....................',
  '....................',
  '....................',
  '....................',
  '....OSSSSSSSSSSO....',
  '....OSSSSSSSSSSO....',
  '....OSSSSSSSSSSO....',
  '....OSSSSSSSSSSO....',
  '....OSSSSSSSSSSO....',
  '....OSSSSSSSSSSO....',
  '....OSSSSSSSSSSO....',
  '.....OSSSSSSSSO.....',
  '......OOOSSOOO......',
  '.....OODDAADDOO.....',
  '....OSODDAADDOSO....',
  '....OSODAAAADOSO....',
  '....OSODAAAADOSO....',
  '....OSODAAAADOSO....',
  '...OSSDDAAAADDSSO...',
  '...OOdDDAAAADDdOO...',
  '...OdDDDAAAADDDdO...',
  '...OddddddddddddO...',
  '....OOOOOOOOOOOO....',
];
const CAP = [
  '.......OOOOOO.......',
  '.....OOHHHHHHOO.....',
  '....OHHLLHHHHHHO....',
  '...OHHLHHHHHHHHHO...',
  '...OHHHHHHHHHHHHO...',
  '...OHHHHHHHHHHHHO...',
  '...OHHHhHHHHhHHHO...',
  '...OHh..hHHh..hHO...',
  '...OH..........HO...',
  '...OH..........HO...',
  '...OH..........HO...',
  '....O..........O....',
];
const BUB = ['.OO.', 'OHLO', 'OHhO', '.OO.'];
const BTIP = ['.OO.', 'OhhO', '.OO.'];
const BUN = ['.OOOO.', 'OHHLHO', 'OHHHHO', 'OHHHhO', 'OhHhhO', '.OOOO.'];
const EAR_BUN = ['.O.', 'OWO', 'OPO', 'OPO', 'OPO', 'OWO', 'OWO'];
const EAR_CAT = ['O.....', 'OO....', 'OCO...', 'OPCO..', 'OPPCO.'];
const PIN = ['.gGg.', 'ORRRO', 'ORYRO', '.ORO.', '..O..'];
const STAR7 = ['...O...', '..OYO..', 'OOYYYOO', 'OYYYYYO', '.OYYYO.', 'OYYOYYO'];
const CROWN = ['Y...Y...Y', 'YY.YPY.YY', 'YYYYYYYYY', 'YPYYYYYPY', 'OOOOOOOOO'];
const rev = a => a.map(r => r.split('').reverse().join(''));

const luluCache = new Map();
// pose: idle | walk | fall, face: '눈/입[/red]'
function lulu(eq, pose = 'idle', fr = 0, face = 'n/smile') {
  const key = [eq.outfit, eq.hair, eq.band, pose, fr, face].join('|');
  let c = luluCache.get(key); if (c) return c;
  c = mk(LW, LH); const g = c.getContext('2d');
  const o = OUTFITS.find(v => v.id === eq.outfit) || OUTFITS[0];
  const [fe, fm, fx] = face.split('/');
  const red = fx === 'red';
  const pal = {
    O: C.ink, S: red ? '#ffb0a0' : '#ffe0cc', D: o.D, d: o.d, A: o.A, a: o.a,
    H: '#8fe3c0', h: '#4fbf9a', L: '#d2faea', P: '#ff7aa8', K: '#c0395a', Y: C.gold,
    W: '#ffffff', C: '#5a4a6a', R: '#ef3f5a', g: '#2e9e5a', G: '#5cc97a', B: '#ff94a8',
  };
  const bob = (pose === 'idle' && fr === 1) || (pose === 'walk' && (fr === 1 || fr === 3)) ? 1 : 0;
  const px = (x, y, col) => { if (col) { g.fillStyle = col; g.fillRect(x, y + LT, 1, 1); } };
  const rows = (R, x0, y0) => {
    for (let y = 0; y < R.length; y++) for (let x = 0; x < R[y].length; x++) {
      const ch = R[y][x]; if (ch !== '.') px(x0 + x, y0 + y, pal[ch]);
    }
  };
  const up = pose === 'fall';
  // 1) 뒷머리
  const hs = eq.hair;
  if (hs === 'braids') {
    const ys = up ? [4, 0, -3] : [8, 12, 16];
    for (const x0 of [0, 16]) {
      ys.forEach(y => { rows(BUB, x0, y + bob); const ty = y + bob + (up ? 3 : 0); px(x0 + 1, ty, pal.P); px(x0 + 2, ty, pal.P); });
      rows(BTIP, x0, (up ? -6 : 20) + bob);
    }
  } else if (hs === 'buns') {
    rows(BUN, 1, -3 + bob); rows(BUN, 13, -3 + bob);
    px(3, 2 + bob, pal.P); px(16, 2 + bob, pal.P);
  } else if (hs === 'bob') {
    for (let y = 6; y <= 13; y++) {
      px(2, y + bob, pal.O); px(3, y + bob, y > 10 ? pal.h : pal.H); px(4, y + bob, pal.H);
      px(17, y + bob, pal.O); px(16, y + bob, y > 10 ? pal.h : pal.H); px(15, y + bob, pal.H);
    }
    for (const x of [2, 3, 4, 15, 16, 17]) px(x, 14 + bob, pal.O);
  } else if (hs === 'long') {
    const y0 = up ? -4 : 6, y1 = up ? 12 : 22;
    for (let y = y0; y <= y1; y++) {
      px(2, y + bob, pal.O); px(3, y + bob, pal.H); px(4, y + bob, pal.h);
      px(17, y + bob, pal.O); px(16, y + bob, pal.H); px(15, y + bob, pal.h);
    }
    const ye = up ? y0 - 1 : y1 + 1;
    for (const x of [3, 4, 15, 16]) px(x, ye + bob, pal.O);
  }
  // 2) 다리
  let l = 0, r = 0;
  if (pose === 'walk') { if (fr === 1) l = -1; if (fr === 3) r = -1; }
  const shoes = [];
  const leg = (x, dy, sx) => {
    shoes.push([sx, dy]);
    for (const yy of [23, 24]) { px(x, yy + dy, pal.O); px(x + 1, yy + dy, yy === 24 ? pal.W : pal.S); px(x + 2, yy + dy, pal.O); }
    for (let i = 0; i < 4; i++) { px(sx + i, 25 + dy, i === 0 || i === 3 ? pal.O : pal.K); px(sx + i, 26 + dy, pal.O); }
  };
  if (up) { leg(5, 0, 4); leg(12, 0, 12); } else { leg(6, l, 5); leg(11, r, 11); }
  // 3) 몸
  rows(BODY, 0, bob);
  if (o.dots) for (const [x, y] of o.dots) px(x, y + bob, o.dc);
  if (o.id === 'sailor') { for (let x = 7; x <= 12; x++) px(x, 13 + bob, '#2b4a7a'); px(9, 14 + bob, C.red); px(10, 14 + bob, C.red); }
  if (o.id === 'grape') { px(8, 14 + bob, o.d); px(11, 14 + bob, o.d); }
  if (o.id === 'choco') { px(9, 13 + bob, '#f3c9a3'); px(10, 13 + bob, '#f3c9a3'); }
  // 4) 얼굴은 고해상도 단계에서 그린다
  // 5) 앞머리
  rows(CAP, 0, bob);
  // 6) 머리띠
  const b = eq.band;
  if (b === 'bunny') { rows(EAR_BUN, 5, -6 + bob); rows(EAR_BUN, 12, -6 + bob); for (let x = 5; x <= 14; x++) px(x, 2 + bob, pal.P); }
  if (b === 'cat') { rows(EAR_CAT, 3, -4 + bob); rows(rev(EAR_CAT), 11, -4 + bob); for (let x = 5; x <= 14; x++) px(x, 2 + bob, pal.C); }
  if (b === 'berry') rows(PIN, 13, 1 + bob);
  if (b === 'star') { for (let x = 5; x <= 14; x++) px(x, 2 + bob, pal.Y); rows(STAR7, 6, -5 + bob); }
  if (b === 'crown') rows(CROWN, 5, -4 + bob);
  // ---- 고해상도 단계: Scale2x 후 얼굴·머리결·소품을 0.5칸 단위로 덧그린다
  const hd = scale2x(c), h2 = hd.getContext('2d');
  const oy = LT * 2 + bob * 2;
  const hp = (x, yy, col) => { h2.fillStyle = col; h2.fillRect(x, yy + oy, 1, 1); };
  const HP = { K: C.ink, W: '#ffffff', I: '#6a3f86', i: '#b98bd9', M: '#c0395a', D: '#7a1f3d', T: '#ff9fb0', x: '#a0304f', B: '#ff94a8', L: pal.L, h: pal.h, a: o.a, w: '#ffffff', s: '#8fd3ff' };
  const stamp = (bm, x0, y0, mirror) => bm.forEach((row, yy) => {
    for (let xx = 0; xx < row.length; xx++) { const ch = row[xx]; if (ch !== '.') hp(mirror ? x0 + row.length - 1 - xx : x0 + xx, y0 + yy, HP[ch]); }
  });
  const EYES = {
    n: [16, ['KKKKK', '.KWIK', '.KIIK', '..ii.']],
    wow: [15, ['KKKKK', '.KWIK', '.KIIK', '.KIWK', '..ii.']],
    blink: [17, ['K....', '.KKKK']],
    happy: [16, ['..KK.', '.K..K']],
    x: [16, ['.K...', '..K..', '...K.', '..K..', '.K...']],
  };
  const eye = EYES[fe];
  if (eye) { stamp(eye[1], 11, eye[0], false); stamp(eye[1], 24, eye[0], true); }
  // 볼터치 (디더링)
  for (const [bx, by] of [[10, 21], [12, 21], [11, 22], [13, 22]]) { hp(bx, by, HP.B); hp(39 - bx, by, HP.B); }
  if (fe === 'happy') { hp(11, 21, HP.B); hp(28, 21, HP.B); }
  const MOUTH = {
    smile: [21, ['.M..M.', '..MM..']],
    open: [20, ['.DDDD.', '.DTTD.', '..DD..']],
    big: [20, ['DDDDDD', 'DDTTDD', '.DTTD.', '..DD..']],
    chew0: [21, ['M.M.M.', '.M.M.M']],
    chew1: [21, ['.M.M.M', 'M.M.M.']],
    wave: [21, ['.D.D.D', 'D.D.D.']],
    o: [20, ['..DD..', '.DxxD.', '..DD..']],
  };
  const mo = MOUTH[fm];
  if (mo) stamp(mo[1], 17, mo[0], false);
  if (red) stamp(['.s.', 'sss', '.s.'], 30, 12, false);
  // 머리결: 앞머리 가닥선과 정수리 윤기
  for (const [hx, hy] of [[9, 8], [9, 9], [10, 10], [10, 11], [16, 5], [16, 6], [17, 7]]) { hp(hx, hy, HP.h); hp(39 - hx, hy, HP.h); }
  for (const [hx, hy] of [[13, 3], [14, 3], [15, 2], [16, 2], [17, 2]]) hp(hx, hy, HP.L);
  if (hs === 'braids') for (const x0 of [0, 16]) (up ? [4, 0, -3] : [8, 12, 16]).forEach(yy => hp(x0 * 2 + 2, yy * 2 + 2, HP.L));
  // 앞치마 레이스
  if (o.id === 'apron') {
    for (let x = 17; x <= 22; x += 2) hp(x, 41, HP.w);
  }
  // 구두 광택 (다리는 몸의 들썩임과 따로 움직인다)
  h2.fillStyle = 'rgba(255,255,255,0.75)';
  for (const [sx, dy] of shoes) h2.fillRect(sx * 2 + 3, (25 + dy + LT) * 2, 2, 1);
  luluCache.set(key, hd);
  if (luluCache.size > 400) luluCache.delete(luluCache.keys().next().value);
  return hd;
}

// 고양이 탕이
const CAT = spr([
  '.O...O..........',
  'OcO.OcO.........',
  'OcccccOOOOOOO...',
  'OckcckcccccccO..',
  'OcccccccccccccO.',
  'OwwpwwcccccccccO',
  '.OwwwwccccccOccO',
  '..OOOOOOOOOOOOO.',
], { c: '#ffcf8a', k: C.ink, w: '#fff6ea', p: '#ff94a8' });
const BIRD = spr(['OO......OO..', 'OwO....OwO..', '.OwOOOOwO...', '..OwwwwwkOY.', '..OwwwwwwOYY', '...OOOOOO...'], { w: '#f4f4ff', k: C.ink, Y: C.gold });
const CLOUDS = [0, 1, 2].map(k => {
  const w = 34 + k * 8, h = 14, c = mk(w * 2, h * 2), g = c.getContext('2d');
  const blobs = [[8, 9, 6], [16, 6, 7], [25, 8, 6], [w - 8, 9, 5]];
  for (const [bx, by, r] of blobs) {
    const R = r * 2, X = bx * 2, Y = by * 2;
    for (let dy = -R; dy <= R; dy++) {
      const ww = Math.floor(Math.sqrt(R * R - dy * dy) + .5);
      g.fillStyle = dy > 5 ? '#e3f1ff' : dy > 3 ? '#f1f8ff' : '#ffffff';
      g.fillRect(X - ww, Y + dy, ww * 2 + 1, 1);
    }
  }
  g.clearRect(0, 26, w * 2, 2);
  c.hd = true;
  return c;
});
// 탕후루 꼬치 (작은 것)
const TANG = (() => {
  const c = mk(20, 64), g = c.getContext('2d');
  g.fillStyle = '#d9a066'; g.fillRect(8, 8, 4, 56); g.fillStyle = '#a8703f'; g.fillRect(11, 8, 1, 56);
  g.drawImage(coated('berry', 'perfect'), 0, 0);
  g.drawImage(coated('grape', 'perfect'), 0, 16);
  g.drawImage(coated('mandarin', 'perfect'), 0, 32);
  c.hd = true;
  return c;
})();

// ---------- 입력·UI
const ui = { btns: [], hover: null };
const ptr = { x: 0, y: 0, down: false };
const keys = {};
function button(id, x, y, w, h, label, fn, o = {}) {
  const dis = !!o.disabled, hov = ui.hover === id, dn = hov && ptr.down && !dis;
  const base = dis ? '#cbbfca' : (o.col || C.pink), dark = dis ? '#a494a3' : (o.dark || C.pinkD);
  const yy = y + (dn ? 1 : 0), hh = h - (dn ? 1 : 0);
  panel(x, yy, w, hh, base);
  rect(x + 1, yy + hh - 3, w - 2, 2, dark);
  if (hov && !dis) rect(x + 1, yy + 1, w - 2, 2, 'rgba(255,255,255,0.35)');
  const f = o.f || F.m, fs = parseFloat(f.match(/([\d.]+)px/)[1]);
  text(label, x + w / 2, yy + Math.floor((hh - 2 - fs) / 2), { f, a: 'center', c: dis ? '#f6f0f6' : (o.tc || '#ffffff'), o: dis ? null : dark });
  ui.btns.push({ id, x, y, w, h, fn, key: o.key, dis, deny: o.deny });
}
function hit(id, x, y, w, h, fn, key, deny, dis) { ui.btns.push({ id, x, y, w, h, fn, key, deny, dis }); }
function findBtn(x, y) {
  for (let i = ui.btns.length - 1; i >= 0; i--) {
    const b = ui.btns[i];
    if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return b;
  }
  return null;
}
function press(b) {
  if (b.dis) { if (b.deny) b.deny(); else sfx.deny(); return; }
  sfx.click(); b.fn();
}
function toL(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
cv.addEventListener('pointerdown', e => {
  audio(); cv.focus({ preventScroll: true }); const p = toL(e); ptr.x = p.x; ptr.y = p.y; ptr.down = true;
  try { cv.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
  e.preventDefault();
  if (fadeDir) return;
  const b = findBtn(p.x, p.y);
  ui.hover = b ? b.id : null;
  if (b) press(b); else if (scene.down) scene.down(p.x, p.y);
});
cv.addEventListener('pointermove', e => {
  const p = toL(e); ptr.x = p.x; ptr.y = p.y;
  const b = findBtn(p.x, p.y); ui.hover = b ? b.id : null;
  cv.style.cursor = b && !b.dis ? 'pointer' : 'default';
});
const up = () => { ptr.down = false; };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') ui.hover = null; });
addEventListener('keydown', e => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Backspace'].includes(e.key)) e.preventDefault();
  audio();
  const was = keys[k]; keys[k] = true;
  if (was || e.repeat || fadeDir) return;
  if (k === 'm') { setMusic(!G.music); toast(G.music ? '배경음악을 켰어요' : '배경음악을 껐어요'); return; }
  if (k === 'f') { toggleFS(); return; }
  if (k === 'n') { setSfx(!G.sfx); toast(G.sfx ? '효과음을 켰어요' : '효과음을 껐어요'); sfx.click(); return; }
  const b = ui.btns.find(b => b.key === k);
  if (b) { press(b); return; }
  if (scene.key) scene.key(k);
});
addEventListener('keyup', e => { keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

// ---------- 효과
const P = [];
function burst(x, y, cols, n = 10, sp = 70, grav = 160, life = .6, size = 1) {
  if (reduceMotion) n = Math.ceil(n / 3);
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), v = rnd(sp * .3, sp);
    P.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * .3, g: grav, life: rnd(life * .6, life), t: 0, col: pick(cols), s: size });
  }
}
function pop(s, x, y, col = '#ffffff', f = F.b) { P.push({ x, y, vx: 0, vy: -26, g: 0, life: 1.1, t: 0, text: s, col, f }); }
function heart(x, y) { P.push({ x, y, vx: rnd(-10, 10), vy: rnd(-34, -20), g: 0, life: 1.4, t: 0, heart: true }); }
function updP(dt) {
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i]; p.t += dt;
    if (p.t >= p.life) { P.splice(i, 1); continue; }
    p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.text) p.vy *= .95;
  }
}
function drawP() {
  for (const p of P) {
    ctx.globalAlpha = 1 - Math.max(0, (p.t / p.life - .7) / .3);
    if (p.text) text(p.text, p.x, p.y, { f: p.f, c: p.col, o: C.ink, a: 'center' });
    else if (p.heart) blit(ICON.heart, p.x - 3, p.y - 3);
    else rect(p.x, p.y, p.s, p.s, p.col);
  }
  ctx.globalAlpha = 1;
}
let toastMsg = '', toastT = 0;
function toast(m) { toastMsg = m; toastT = 2.4; }

// ---------- 공통 배경 (하늘, 먼 풍경)
const SKY = ['#8fd3ff', '#9edaff', '#afe1fc', '#c3e8f8', '#d8eef3', '#ffe3ee'];
const skyImg = (() => {
  // 고해상도 하늘: 띠 사이를 1픽셀 체크 무늬로 섞는다
  const c = mk(W * 2, 300), g = c.getContext('2d'), bh = 300 / SKY.length;
  for (let i = 0; i < SKY.length; i++) {
    const y = Math.round(i * bh);
    g.fillStyle = SKY[i]; g.fillRect(0, y, W * 2, Math.ceil(bh) + 1);
    if (i > 0) {
      g.fillStyle = SKY[i - 1];
      for (let r = 0; r < 4; r++) {
        const step = [2, 2, 4, 8][r];
        for (let x = (r % 2); x < W * 2; x += step) g.fillRect(x, y + r, 1, 1);
      }
    }
  }
  return c;
})();
let T = 0;
function sky(cam) {
  ctx.drawImage(skyImg, 0, 0, W, 150);
  disc(282, 26, 9, '#fff6c2'); disc(280, 24, 4, '#fffbe0'); ring(282, 26, 11, '#fff0a6'); ring(282, 26, 12.5, 'rgba(255,240,166,0.5)');
  const cl = [[20, 18, 0], [150, 32, 1], [262, 12, 2], [410, 26, 1], [530, 16, 0]];
  for (const [x, y, k] of cl) {
    const span = W + 140;
    let sx = ((x + T * (3 + k) - cam * .1) % span + span) % span - 60;
    blit(CLOUDS[k], sx, y);
  }
}
function tri(cx, top, h, col) { for (let i = 0; i < h * 2; i++) { const hw = R2(i * .35); rect(cx - hw, top + i / 2, hw * 2 + 1, .5, col); } }
function castle(x) {
  const c1 = '#dccbf7', c2 = '#c8b3f0', roof = '#f5a3c7';
  rect(x, 84, 64, 46, c1); rect(x - 14, 72, 14, 58, c2); rect(x + 64, 72, 14, 58, c2); rect(x + 24, 62, 16, 68, c2);
  tri(x - 7, 60, 12, roof); tri(x + 71, 60, 12, roof); tri(x + 32, 46, 16, roof);
  for (let i = 0; i < 4; i++) rect(x + 6 + i * 16, 80, 6, 4, c1);
  rect(x + 27, 70, 4, 6, '#a58bd8'); rect(x + 33, 70, 4, 6, '#a58bd8');
  rect(x + 26, 110, 12, 20, '#a58bd8'); rect(x + 8, 96, 4, 6, '#a58bd8'); rect(x + 52, 96, 4, 6, '#a58bd8');
  rect(x + 32, 38, 1, 8, C.ink2); rect(x + 33, 38, 5, 3, C.pink);
}
function ferris(cx, cy, r, t) {
  line(cx, cy, cx - 20, 130, '#e39ac0', 1.5); line(cx, cy, cx + 20, 130, '#e39ac0', 1.5);
  line(cx - 10, 103, cx + 10, 103, '#e39ac0', 1);
  ring(cx, cy, r, '#ff9ec4'); ring(cx, cy, r - 3, '#ffc2da');
  const cols = ['#ff8fb3', '#ffd166', '#7ee0c3', '#a58bff', '#8fd3ff', '#ffb38a', '#ff8fb3', '#7ee0c3'];
  for (let i = 0; i < 8; i++) {
    const a = t * .25 + i * Math.PI / 4;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    line(cx, cy, x, y, '#ffe6f0');
  }
  for (let i = 0; i < 8; i++) {
    const a = t * .25 + i * Math.PI / 4;
    const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r);
    rect(x, y, .5, 2, C.ink2); panel(x - 3, y + 2, 7, 6, cols[i]); rect(x - 2, y + 3, 5, 2, '#e8f7ff'); rect(x - .5, y + 3, .5, 2, cols[i]); rect(x - 2.5, y + 6.5, 6, .5, 'rgba(0,0,0,0.12)');
  }
  disc(cx, cy, 3, '#ffffff'); ring(cx, cy, 3, '#ff9ec4');
}
function hills(off, base, amp, col, per) {
  ctx.fillStyle = col;
  for (let i = 0; i < W * 2; i++) {
    const x = i / 2;
    const y = R2(base + amp * Math.sin((x + off) / per) + amp * .5 * Math.sin((x + off) / (per * .37)));
    ctx.fillRect(x, y, .5, 150 - y);
  }
}
function tree(x) {
  rect(x - 1.5, 122, 3, 28, '#a8703f'); rect(x + .5, 122, 1, 28, '#8a5a31'); rect(x - 1, 130, .5, 4, '#c48a55');
  disc(x, 118, 10, '#5cb877'); disc(x - 1, 117, 9, '#6cc285'); disc(x - 3.5, 114.5, 6, '#8fd9a0');
  for (const [dx, dy] of [[-6, 112], [-2, 110], [3, 114], [5, 120], [-4, 121], [1, 124], [-7, 117]]) rect(x + dx, dy, .5, .5, '#c6f0cf');
  for (const [dx, dy] of [[4, 124], [7, 118], [-8, 123], [0, 127]]) rect(x + dx, dy, 1, .5, '#4fa56a');
}
function ground(cam, gy = 150) {
  rect(0, gy, W, 3, '#86d49a'); rect(0, gy + 1.5, W, .5, '#6cc285'); rect(0, gy + 2.5, W, .5, '#5cb877');
  ctx.fillStyle = '#a5e2b1';
  for (let x = (((-cam) % 6) + 6) % 6; x < W; x += 6) ctx.fillRect(R2(x), gy - .5, .5, .5);
  rect(0, gy + 3, W, H - gy - 3, '#ffd9b8');
  for (let r = 0; gy + 3 + r * 7 < H; r++) {
    const y = gy + 3 + r * 7;
    ctx.fillStyle = '#f2b98f'; ctx.fillRect(0, y + 6, W, .5);
    ctx.fillStyle = '#ffe8d2'; ctx.fillRect(0, y, W, .5);
    const off = (((-cam + (r % 2) * 7) % 14) + 14) % 14;
    for (let x = off; x < W; x += 14) { ctx.fillStyle = '#f2b98f'; ctx.fillRect(R2(x), y, .5, 6); ctx.fillStyle = '#ffe8d2'; ctx.fillRect(R2(x) + .5, y, .5, 6); }
  }
}
function world(cam) {
  sky(cam);
  const fo = cam * .25;
  hills(cam * .12, 116, 5, '#cdeed8', 30);
  castle(Math.round(110 - fo));
  ferris(Math.round(262 - fo), 76, 38, T);
  hills(cam * .4, 128, 4, '#aee3c0', 22);
  const mo = cam * .6;
  for (let i = 0; i < 12; i++) { const x = Math.round(i * 90 + 40 - mo); if (x > -20 && x < W + 20) tree(x); }
  ground(cam);
}

// ---------- 장면 전환
const SC = {};
let scene = null, nextScene = null, fade = 0, fadeDir = 0;
function go(name, arg) {
  if (fadeDir) return;
  nextScene = { name, arg }; fadeDir = 1;
  if (scene === SC.park && name !== 'park') sfx.door(); else sfx.swish();
}

// ================= 타이틀 =================
SC.title = {
  t: 0, confirm: 0,
  music() { return 'park'; },
  enter() { this.t = 0; this.confirm = 0; },
  update(dt) { this.t += dt; if (this.confirm > 0) this.confirm -= dt; },
  draw() {
    world(Math.round(40 + Math.sin(this.t * .15) * 40));
    const bobY = Math.round(Math.sin(this.t * 2) * 2);
    text('룰루랜드', W / 2, 16 + bobY, { f: F.xl, c: '#ff8fb3', o: C.ink, ow: 2, a: 'center' });
    text('탕후루 먹방 테마파크', W / 2, 48, { f: F.m, c: '#ffffff', o: C.ink, a: 'center' });
    for (let i = 0; i < 4; i++) {
      const a = this.t * .8 + i * Math.PI / 2;
      blit(TANG, W / 2 - 5 + Math.cos(a) * 60, 92 + Math.sin(a) * 14 - 16);
    }
    const blink = (this.t % 3.4) < .12;
    blit(lulu(G.eq, 'idle', Math.floor(this.t * 2) % 2, blink ? 'blink/smile' : 'happy/open'), W / 2 - 20, 84, 2);
    button('start', 116, 149, 88, 18, hasSave ? '이어하기' : '시작하기', () => { jingle('start'); go('park'); if (!hasSave) { hasSave = true; save(); } }, { key: 'Enter', f: F.l });
    soundToggles(W - 40, 4);
    if (!AU.ac) text('화면을 누르면 소리가 나요', W - 44, 6, { f: F.s, c: '#ffffff', o: C.ink, a: 'right' });
    if (hasSave) button('reset', 4, 167, 70, 12, this.confirm > 0 ? '정말 지울까요?' : '기록 지우기', () => {
      if (this.confirm > 0) { G = DEF(); save(); hasSave = false; this.confirm = 0; toast('기록을 지웠어요'); }
      else this.confirm = 3;
    }, { f: F.s, col: C.lav, dark: C.lavD });
    text('팬 창작 게임 · 콘셉트: 탕후루의 달인', W - 4, 170, { f: F.s, c: C.ink2, a: 'right' });
  },
};

// ================= 룰루랜드 거리 =================
const WORLD = 900, GROUND = 150;
const BOOTHS = [
  { id: 'kitchen', name: '룰루네 탕후루', x: 30, w: 150, door: 133, scene: 'kitchen' },
  { id: 'claw', name: '아이스크림 뽑기', x: 240, w: 100, door: 290, scene: 'claw' },
  { id: 'drop', name: '드롭타워', x: 420, w: 100, door: 470, scene: 'drop' },
  { id: 'closet', name: '룰루 옷장', x: 600, w: 140, door: 703, scene: 'closet' },
];
const LAMPS = [205, 380, 560, 770];
const NPC = ['..OOOO..', '.OHHHHO.', 'OHHHHHHO', 'OHSSSSHO', 'OSESSESO', '.OSSSSO.', '..OccO..', '.OccccO.', 'OSccccSO', 'OSccccSO', '.OccccO.', '.OppppO.'];
function mkNPC() {
  const pal = {
    H: pick(['#6b4f3a', '#3b2a4a', '#f2c14e', '#e07a5f', '#9b7fd1', '#2f2f2f']), S: pick(['#ffe0cc', '#f1c7a5', '#d9a27c']),
    c: pick(['#7ec8e3', '#ffb4a2', '#b5e48c', '#cdb4db', '#ffd166', '#90dbf4']), p: pick(['#4a4e69', '#6d597a', '#355070']), E: C.ink,
  };
  return { x: rnd(20, WORLD - 20), dir: Math.random() < .5 ? -1 : 1, sp: rnd(12, 24), t: rnd(0, 5), pause: 0, img: spr(NPC, pal), pal, bal: Math.random() < .45 ? pick(['#ff6f9c', '#ffd166', '#7ee0c3', '#a58bff']) : null };
}
function lamp(x) {
  for (let y = 64; y < GROUND; y++) rect(x - 1, y, 3, 1, ((y >> 2) % 2) ? '#ff8fb3' : '#ffffff');
  rect(x - 2, GROUND - 3, 5, 3, C.ink2);
  disc(x, 60, 4, C.ink); disc(x, 60, 3, '#fff3b0'); rect(x - 1, 58, 1, 1, '#ffffff');
  tri(x, 52, 5, C.pink);
}
function bunting(x1, x2) {
  const cols = [C.pink, C.mint, C.gold, '#a58bff'];
  let k = 0;
  const yAt = x => 60 + 12 * (1 - (2 * (x - x1) / (x2 - x1) - 1) ** 2);
  for (let x = x1; x <= x2; x += .5) rect(x, yAt(x), .5, .5, C.ink2);
  for (let x = x1 + 5; x < x2 - 3; x += 10) {
    const c = cols[k++ % 4], y = R2(yAt(x));
    for (let i = 0; i < 9; i++) { const hw = R2((8 - i) * .3); rect(x - hw, y + .5 + i / 2, hw * 2 + .5, .5, c); }
    rect(x - 2.5, y + .5, 5.5, .5, 'rgba(255,255,255,0.45)');
  }
}
function awning(x, y, w, a, b) {
  for (let i = 0; i < w; i += 10) {
    const c = (i / 10) % 2 ? b : a;
    rect(x + i, y, Math.min(10, w - i), 12, c);
    ellipse(x + i + 5, y + 12, 4, 2, c, 1);
  }
  rect(x, y, w, 1, C.ink);
}
function boothKitchen(x) {
  panel(x, 70, 150, 81, '#fff0f5'); rect(x + 1, 144, 148, 6, '#f6b6cc');
  awning(x + 1, 70, 148, C.red, '#ffffff');
  // 간판
  panel(x + 26, 50, 104, 20, '#b8744a'); rect(x + 27, 51, 102, 1, '#d99a6c');
  text('룰루네 탕후루', x + 78, 55, { f: F.m, c: '#fff4dc', a: 'center' });
  // 지붕 위 큰 탕후루
  rect(x + 13, 22, 3, 50, '#d9a066'); rect(x + 15, 22, 1, 50, '#a8703f');
  blit(coated('berry', 'perfect'), x + 4, 12, 2); blit(coated('berry', 'perfect'), x + 4, 28, 2); blit(coated('grape', 'perfect'), x + 4, 44, 2);
  // 창문
  panel(x + 10, 92, 62, 42, '#b8744a'); rect(x + 12, 94, 58, 38, '#cfefff');
  line(x + 16, 96, x + 26, 106, '#ffffff'); line(x + 20, 96, x + 30, 106, '#ffffff');
  rect(x + 12, 120, 58, 3, '#d99a6c');
  for (let i = 0; i < 4; i++) blit(TANG, x + 16 + i * 13, 90 + (i % 2) * 2, 1);
  rect(x + 12, 123, 58, 9, '#fff0f5');
  // 문
  panel(x + 90, 100, 28, 51, C.pink); rect(x + 95, 105, 18, 14, '#cfefff'); rect(x + 112, 125, 2, 2, C.gold);
  panel(x + 92, 90, 24, 9, '#ffffff'); text('OPEN', x + 104, 90, { f: F.s, c: C.red, a: 'center' });
  // 화분
  rect(x + 124, 138, 12, 12, '#d9964a'); disc(x + 130, 133, 6, '#6cc285'); rect(x + 128, 130, 2, 2, C.pink);
}
function boothClaw(x) {
  panel(x + 5, 64, 90, 22, C.pink);
  for (let i = 0; i < 11; i++) rect(x + 10 + i * 8, 66, 2, 2, (Math.floor(T * 4) + i) % 2 ? C.gold : '#ffffff');
  text('아이스크림 뽑기', x + 50, 72, { f: F.s, c: '#ffffff', o: C.pinkD, a: 'center' });
  panel(x + 5, 85, 90, 45, '#dff4ff');
  line(x + 12, 88, x + 22, 98, '#ffffff');
  for (let i = 0; i < 5; i++) blit(ICE[i].img, x + 18 + i * 14, 128 - ICE[i].img.height);
  const cx = x + 50 + Math.round(Math.sin(T * 1.3) * 26);
  rect(x + 8, 88, 84, 2, '#9aa0bb'); rect(cx - 3, 88, 7, 3, '#7c82a0'); rect(cx, 91, 1, 10, '#7c82a0');
  rect(cx - 3, 101, 7, 2, '#7c82a0'); rect(cx - 3, 103, 1, 3, '#7c82a0'); rect(cx + 3, 103, 1, 3, '#7c82a0');
  panel(x + 5, 129, 90, 22, '#ff9fbf'); disc(x + 70, 139, 4, C.red); rect(x + 30, 137, 2, 8, C.ink2); disc(x + 31, 136, 2, C.ink);
  rect(x + 12, 140, 10, 7, C.ink2);
}
function dropGondolaY(t) {
  const c = t % 9;
  if (c < 4) return 128 - 104 * ease(c / 4);
  if (c < 5) return 24;
  if (c < 5.5) { const k = (c - 5) / .5; return 24 + 104 * k * k; }
  return 128;
}
function boothDrop(x) {
  for (let y = -2; y < GROUND; y += 1) rect(x + 44, y, 12, 1, (Math.floor(y / 8) % 2) ? '#ffffff' : '#ff8fb3');
  rect(x + 43, 0, 1, GROUND, C.ink); rect(x + 56, 0, 1, GROUND, C.ink);
  const gy = Math.round(dropGondolaY(T));
  panel(x + 26, gy, 48, 7, C.gold); rect(x + 27, gy + 5, 46, 1, C.goldD);
  for (let i = 0; i < 5; i++) { disc(x + 31 + i * 9, gy - 2, 2, ['#6b4f3a', '#8fe3c0', '#f2c14e', '#3b2a4a', '#e07a5f'][i]); }
  panel(x, 140, 100, 11, '#e9d8ff');
  panel(x + 64, 112, 36, 16, '#ffffff'); text('드롭타워', x + 82, 115, { f: F.s, c: C.pinkD, a: 'center' });
  rect(x + 81, 128, 2, 12, C.ink2);
}
function boothCloset(x) {
  panel(x, 72, 140, 79, '#efe4ff'); rect(x + 1, 144, 138, 6, '#d6c4f5');
  awning(x + 1, 72, 138, C.mint, '#ffffff');
  panel(x + 30, 52, 80, 20, C.mintD); text('룰루 옷장', x + 70, 56, { f: F.m, c: '#ffffff', a: 'center' });
  panel(x + 10, 94, 62, 42, '#b8a0e0'); rect(x + 12, 96, 58, 38, '#f7f1ff');
  // 마네킹
  const cx = x + 30;
  disc(cx, 104, 3, '#f5e6d8'); rect(cx - 1, 107, 3, 3, '#f5e6d8');
  for (let i = 0; i < 12; i++) rect(cx - 3 - Math.floor(i / 3), 110 + i, 7 + Math.floor(i / 3) * 2, 1, i > 6 ? C.pinkD : C.pink);
  rect(cx, 122, 1, 10, C.ink2); rect(cx - 4, 132, 9, 1, C.ink2);
  // 옷걸이
  rect(x + 44, 102, 22, 1, C.ink2);
  [[46, C.gold], [52, C.mint], [58, '#a58bff']].forEach(([dx, c]) => { rect(x + dx, 103, 5, 12, c); rect(x + dx + 2, 101, 1, 2, C.ink2); });
  if (Math.floor(T * 2) % 2) rect(x + 64, 98, 1, 1, '#ffffff');
  panel(x + 90, 100, 28, 51, '#b69cff'); rect(x + 95, 105, 18, 14, '#f7f1ff'); rect(x + 112, 125, 2, 2, C.gold);
}
function fountain(x) {
  ellipse(x + 30, 144, 30, 6, '#b8a0e0'); ellipse(x + 30, 142, 26, 4, '#9fd3ff');
  rect(x + 27, 124, 6, 18, '#d6c4f5');
  for (let i = 0; i < 10; i++) {
    const a = (T * 1.6 + i / 10) % 1, s = i % 2 ? 1 : -1;
    rect(x + 30 + s * a * 18, 122 - Math.sin(a * Math.PI) * 14 + a * 16, 1, 2, '#e6f6ff');
  }
}
function drawNPC(n, sx) {
  const f = Math.floor(n.t * 6) % 2, moving = n.pause <= 0;
  const y = GROUND - 15;
  if (n.bal) { rect(sx + 7, y - 6, 1, 13, C.ink2); disc(sx + 8, y - 11, 4, n.bal); rect(sx + 6, y - 13, 1, 1, '#ffffff'); }
  blit(n.img, sx, y, 1, n.dir < 0);
  const lh = moving && f ? 2 : 3, rh = moving && !f ? 2 : 3;
  rect(sx + 2, y + 12, 2, lh, n.pal.p); rect(sx + 4, y + 12, 2, rh, n.pal.p);
}
SC.park = {
  x: 133, tx: null, want: null, cam: 0, walkT: 0, moving: false, npcs: [], birdT: 2,
  music() { return 'park'; },
  enter(from) {
    const b = BOOTHS.find(b => b.scene === from);
    if (b) this.x = b.door;
    this.tx = null; this.want = null;
    if (!this.npcs.length) for (let i = 0; i < 7; i++) this.npcs.push(mkNPC());
    this.cam = clamp(Math.round(this.x - W / 2), 0, WORLD - W);
  },
  near() { return BOOTHS.find(b => Math.abs(this.x - b.door) < 20); },
  update(dt) {
    let dir = 0;
    if (keys.ArrowLeft || keys.a) dir = -1;
    if (keys.ArrowRight || keys.d) dir = 1;
    if (dir) { this.tx = null; this.want = null; }
    else if (this.tx != null) {
      const d = this.tx - this.x;
      if (Math.abs(d) < 2) { this.tx = null; if (this.want) { const b = this.want; this.want = null; go(b.scene); } }
      else dir = Math.sign(d);
    }
    if (dir) {
      this.x = clamp(this.x + dir * 72 * dt, 12, WORLD - 12);
      const before = Math.floor(this.walkT * 8); this.walkT += dt;
      if (Math.floor(this.walkT * 8) !== before && Math.floor(this.walkT * 8) % 2 === 0) sfx.step();
    } else this.walkT = 0;
    this.moving = !!dir;
    this.cam = clamp(Math.round(this.x - W / 2), 0, WORLD - W);
    this.birdT -= dt;
    if (this.birdT <= 0) { this.birdT = rnd(3, 8); sfx.bird(); }
    const wl = loop('water');
    if (wl) wl.set(Math.max(0, 1 - Math.abs(this.x - 830) / 220) * .12);
    for (const n of this.npcs) {
      n.t += dt;
      if (n.pause > 0) { n.pause -= dt; continue; }
      n.x += n.dir * n.sp * dt;
      if (n.x < 10 || n.x > WORLD - 10) n.dir *= -1;
      if (Math.random() < dt * .08) n.pause = rnd(1, 3);
    }
  },
  key(k) {
    if (k === 'ArrowUp' || k === 'w' || k === 'Enter' || k === ' ') { const b = this.near(); if (b) go(b.scene); }
  },
  down(x, y) {
    if (y < 16) return;
    const wx = x + this.cam;
    const b = BOOTHS.find(b => wx >= b.x && wx <= b.x + b.w && y >= 40 && y <= GROUND);
    if (b) { this.tx = b.door; this.want = b; }
    else { this.tx = clamp(wx, 12, WORLD - 12); this.want = null; }
  },
  draw() {
    const cam = this.cam;
    world(cam);
    for (let i = 0; i < LAMPS.length - 1; i++) { const a = LAMPS[i] - cam, b = LAMPS[i + 1] - cam; if (b > -10 && a < W + 10) bunting(a, b); }
    const vis = (x, w) => x + w > -20 && x < W + 20;
    const bx = b => b.x - cam;
    if (vis(bx(BOOTHS[0]), 150)) boothKitchen(bx(BOOTHS[0]));
    if (vis(bx(BOOTHS[1]), 100)) boothClaw(bx(BOOTHS[1]));
    if (vis(bx(BOOTHS[2]), 100)) boothDrop(bx(BOOTHS[2]));
    if (vis(bx(BOOTHS[3]), 140)) boothCloset(bx(BOOTHS[3]));
    if (vis(800 - cam, 60)) fountain(800 - cam);
    for (const l of LAMPS) if (vis(l - cam, 4)) lamp(l - cam);
    for (const n of this.npcs) { const sx = Math.round(n.x - cam - 4); if (sx > -12 && sx < W + 4) drawNPC(n, sx); }
    const sx = Math.round(this.x - cam);
    rect(sx - 7, GROUND - 1, 14, 2, 'rgba(59,31,58,0.18)');
    const fr = this.moving ? Math.floor(this.walkT * 8) % 4 : Math.floor(T * 2) % 2;
    const blink = (T % 3.2) < .12;
    blit(lulu(G.eq, this.moving ? 'walk' : 'idle', fr, blink ? 'blink/smile' : 'n/smile'), sx - 10, GROUND - 33);
    const nb = this.near();
    if (nb) {
      const label = '↑ ' + nb.name;
      const w = Math.ceil(tw(label, F.s)) + 10, px = clamp(sx - w / 2, 2, W - w - 2);
      panel(px, GROUND - 50, w, 13, '#ffffff'); text(label, px + 5, GROUND - 48, { f: F.s, c: C.ink });
      button('enter', 250, 160, 66, 16, '들어가기', () => go(nb.scene), { f: F.m });
    }
    text('←→ 이동 · ↑ 들어가기 · 가게를 눌러도 가요', 6, 166, { f: F.s, c: C.ink2 });
  },
};

// ================= 탕후루 가게 =================
const NICKS = ['설탕요정', '와삭와삭', '딸기공주', '먹방보는곰', '룰루팬1호', '바삭장인', '시럽마스터', '꼬치러버', '귤까먹는중', '포도알', '달콤곰젤리', '하트뿅', '냥냥펀치', '코팅장인'];
const NCOL = ['#ff8fb3', '#7ee0c3', '#ffd166', '#b9a3ff', '#8fd3ff', '#ffb38a'];
const CHAT = {
  idle: ['룰루 안녕~', '오늘은 뭐 먹어요?', '탕후루 소리 최고', '설탕 코팅 기대된다', 'ㅋㅋㅋㅋ', '첫 방송부터 봤어요', '오늘 옷 예쁘다', '탕이 자는 거 봐'],
  eat: ['와삭!!', '소리 미쳤다', 'ASMR 최고', '나도 먹고 싶다', '바삭바삭', '침 고인다', '하트 뿅뿅', '이 소리 들으러 옴'],
  spicy: ['ㅋㅋㅋ 매워하는 거 봐', '물 마셔요!!', '고추를 왜 꽂았어요ㅋㅋ', '매운맛 챌린지 성공?'],
  perfect: ['유리알 코팅이다', '완벽한 광택', '이거 장인이네', '반짝반짝해'],
  good: ['바삭해 보여요', '맛있겠다', '코팅 좋은데?'],
  sticky: ['이 사이에 붙겠다', '눅눅해 보여요ㅠ', '조금 더 끓였어야 해'],
  burnt: ['좀 탔다ㅠ', '쓴맛 날 듯', '다음엔 잘할 수 있어요'],
  order: ['이 순서로 부탁해요!', '이렇게 먹어 주세요~', '오늘은 이 조합!', '이거 먹는 소리 듣고 싶어요'],
};
const K = { phase: 'build', order: [], nick: '', sk: [], chat: [], chatT: 0, temp: 110, q: null, t: 0, coated: false, revealed: false, eatI: 0, bit: false, spicy: 0, fast: false, res: null, face: 'n/smile', faceT: 0 };
function chat(pool, nick, col) {
  K.chat.push({ n: nick || pick(NICKS), c: col || pick(NCOL), t: CHAT[pool] ? pick(CHAT[pool]) : pool });
  if (K.chat.length > 14) K.chat.shift();
}
const unlockedIng = () => ING.filter(i => G.fans >= i.need);
function newOrder() {
  const u = unlockedIng().filter(i => i.id !== 'chili');
  const n = G.fans < 30 ? 3 : G.fans < 150 ? 4 : 5;
  const o = [];
  for (let i = 0; i < n; i++) o.push(pick(u).id);
  if (G.fans >= 300 && Math.random() < .35) o[ri(0, n - 1)] = 'chili';
  K.order = o; K.nick = pick(NICKS);
  chat('order', K.nick); sfx.notify();
}
function drawChat(x, y, w, h) {
  panel(x, y, w, h, 'rgba(43,24,56,0.82)');
  rect(x + 4, y + 4, 4, 4, Math.floor(T * 2) % 2 ? C.red : '#ff8a9a');
  text('LIVE', x + 10, y + 2, { f: F.s, c: '#ffffff' });
  const viewers = G.fans * 3 + 12 + Math.round(Math.sin(T * .7) * 3);
  text('시청자 ' + viewers, x + w - 4, y + 2, { f: F.s, c: '#ffc2d8', a: 'right' });
  rect(x + 2, y + 12, w - 4, 1, 'rgba(255,255,255,0.15)');
  const LHh = 10, maxL = Math.floor((h - 16) / LHh), inner = w - 8;
  const lines = [];
  for (let i = K.chat.length - 1; i >= 0 && lines.length < maxL; i--) {
    const m = K.chat[i];
    const nw = tw(m.n, F.s) + 4;
    const parts = wrapChars(m.t, F.s, inner - nw, inner);
    const L = parts.map((s, j) => ({ nick: j === 0 ? m.n : null, c: m.c, s, nw }));
    for (let j = L.length - 1; j >= 0; j--) lines.unshift(L[j]);
  }
  const vis = lines.slice(-maxL);
  vis.forEach((l, i) => {
    const ly = y + 15 + i * LHh;
    if (l.nick) { text(l.nick, x + 4, ly, { f: F.s, c: l.c }); text(l.s, x + 4 + l.nw, ly, { f: F.s, c: '#ffffff' }); }
    else text(l.s, x + 4, ly, { f: F.s, c: '#ffffff' });
  });
}
function kitchenBG(counterY, win = true) {
  rect(0, 15, W, H - 15, '#ffe4ee');
  ctx.fillStyle = '#ffd6e5'; for (let x = 0; x < W; x += 12) ctx.fillRect(x, 15, 6, H);
  // 창문
  if (win) {
    panel(254, 20, 62, 46, '#d99a6c'); rect(256, 22, 58, 42, '#bfe6ff');
    rect(256, 50, 58, 14, '#aee3c0'); disc(270, 50, 8, '#8fd9a0'); disc(300, 52, 10, '#6cc285');
    rect(284, 22, 2, 42, '#d99a6c'); rect(256, 42, 58, 2, '#d99a6c');
  }
  // 전구 줄
  for (let x = 4; x < W; x += 10) { const y = 17 + Math.round(2 * Math.sin(x / 20)); rect(x, y, 1, 1, C.ink2); rect(x, y + 1, 2, 2, (Math.floor(T * 2) + x / 10) % 3 < 1 ? C.gold : '#fff3b0'); }
  if (counterY != null) counter(counterY);
}
function counter(counterY) {
  rect(0, counterY, W, 1, C.ink); rect(0, counterY + 1, W, 4, '#ffc2d4'); rect(0, counterY + 5, W, 1, C.ink);
  rect(0, counterY + 6, W, H - counterY - 6, '#f596b4');
  ctx.fillStyle = '#e87ea0'; for (let x = 20; x < W; x += 40) ctx.fillRect(x, counterY + 8, 1, H);
}
function stick(x0, y0, x1, y1) {
  if (y0 === y1) { rect(x0, y0 - 1, x1 - x0, 2, '#e0b27a'); rect(x0, y0 + 1, x1 - x0, 1, '#b98550'); rect(x0 - 3, y0, 3, 1, '#e0b27a'); }
  else { rect(x0 - 1, y0, 2, y1 - y0, '#e0b27a'); rect(x0 + 1, y0, 1, y1 - y0, '#b98550'); rect(x0, y0 - 3, 1, 3, '#e0b27a'); }
}
function pieceImg(id) { return K.coated && K.q ? coated(id, K.q) : ING_BY[id].img; }
function kitchenLulu(x, y, k) {
  const blink = (T % 3) < .12;
  let face = K.faceT > 0 ? K.face : (blink ? 'blink/smile' : 'n/smile');
  blit(lulu(G.eq, 'idle', Math.floor(T * 2) % 2, face), x, y, k);
}
function addPiece(i) {
  const ing = ING[i];
  if (G.fans < ing.need) { sfx.deny(); toast('구독자 ' + ing.need + '명부터 쓸 수 있어요'); return; }
  if (K.sk.length >= 5) { sfx.deny(); toast('꼬치에는 5개까지 꽂을 수 있어요'); return; }
  const idx = K.sk.length;
  K.sk.push(ing.id); sfx.skewer(ing.id);
  burst(124 + idx * 24, 80, ing.bits, 6, 40, 120, .4);
  if (K.order[idx] === ing.id) { K.face = 'happy/open'; K.faceT = .5; sfx.ding(); }
  else if (idx < K.order.length) { K.face = 'wow/o'; K.faceT = .5; sfx.bloop(); }
}
function goSyrup() {
  K.phase = 'syrup'; K.temp = 108; K.t = 0; K.q = null; K.coated = false; K.revealed = false; K.beepT = 0;
  chat('설탕 코팅 들어갑니다~', '룰루', C.mint);
}
function dipNow() {
  if (K.phase !== 'syrup') return;
  K.q = quality(K.temp); K.phase = 'dip'; K.t = 0; sfx.dip();
}
function startEat() {
  K.phase = 'eat'; K.eatI = 0; K.t = 0; K.bit = false; K.spicy = 0; K.fast = false; K.eatenChili = false;
  loopOff('boil');
  chat('먹방 시작할게요!', '룰루', C.mint);
}
function finishEat() {
  const n = K.order.length;
  let matched = 0;
  for (let i = 0; i < n; i++) if (K.sk[i] === K.order[i]) matched++;
  const full = matched === n && K.sk.length === n;
  const qm = QUAL[K.q].mult;
  const base = K.sk.reduce((s, id) => s + ING_BY[id].v, 0);
  const coins = Math.max(1, Math.round((base + matched * 4 + (full ? 15 : 0)) * qm));
  const fans = Math.max(0, Math.round((matched * 2 + (full ? 5 : 0)) * qm) + (K.eatenChili && !K.order.includes('chili') ? 2 : 0));
  const before = unlockedIng().map(i => i.id);
  G.coins += coins; G.fans += fans; G.made++;
  const unlocked = unlockedIng().filter(i => !before.includes(i.id)).map(i => i.name);
  save();
  K.res = { matched, n, full, coins, fans, unlocked };
  K.phase = 'result'; K.t = 0;
  jingle(full && K.q === 'perfect' ? 'fanfare' : matched > 0 && K.q !== 'burnt' ? 'nice' : 'meh');
  sfx.coinRoll(Math.min(10, Math.ceil(coins / 8)));
  if (unlocked.length) jingle('unlock', 1.4);
  for (let i = 0; i < 6; i++) heart(rnd(200, 260), rnd(60, 90));
  if (full) chat('주문 그대로다!! 최고', K.nick);
}
SC.kitchen = {
  music() { return K.phase === 'syrup' || K.phase === 'dip' ? 'cook' : 'shop'; },
  enter() {
    K.phase = 'build'; K.sk = []; K.q = null; K.coated = false; K.res = null; K.faceT = 0;
    if (!K.chat.length) chat('룰루 방송 켜졌다!!');
    newOrder();
  },
  update(dt) {
    K.t += dt; K.faceT -= dt;
    K.chatT -= dt;
    const rate = K.phase === 'eat' ? .9 : 2.6;
    if (K.chatT <= 0) { K.chatT = rnd(rate, rate * 1.8); chat(K.phase === 'eat' ? 'eat' : 'idle'); }
    if (K.phase === 'syrup') {
      const r = 11 + Math.min(5, G.fans / 60) + 2.5 * Math.sin(K.t * 2.7);
      K.temp += r * dt;
      const bl = loop('boil'), hk = clamp((K.temp - 100) / 90, 0, 1);
      if (bl) bl.set(.04 + .22 * hk, 450 + 1300 * hk);
      K.beepT -= dt;
      if (K.temp >= 128 && K.beepT <= 0) {
        K.beepT = clamp(.55 - (K.temp - 128) * .012, .14, .55);
        if (K.temp >= 150 && K.temp <= 160) sfx.zone(); else sfx.therm(K.temp);
      }
      if (Math.random() < dt * (K.temp - 100) / 10) { burst(rnd(140, 210), 118, ['#fff4d6', '#ffffff'], 2, 20, -10, .5); if (Math.random() < .3) sfx.bubble(); }
      if (K.temp >= 188) dipNow();
    } else if (K.phase === 'dip') {
      const bl = loop('boil'); if (bl) bl.set(K.t < .9 ? .3 : .08, 1600);
      if (K.t >= .9 && !K.coated) { K.coated = true; sfx.crackle(); }
      if (K.t >= 1.3 && !K.revealed) {
        K.revealed = true;
        const q = K.q;
        jingle(q === 'perfect' ? 'coatPerfect' : q === 'good' ? 'coatGood' : 'coatBad');
        if (q === 'perfect' || q === 'good') burst(175, 60, ['#ffffff', '#fff3b0', C.gold], 18, 90, 40, .9);
        chat(q); chat(q);
        K.face = q === 'perfect' ? 'happy/open' : q === 'good' ? 'happy/smile' : 'x/wave'; K.faceT = 1.2;
      }
      if (K.t >= 2.6) startEat();
    } else if (K.phase === 'eat') {
      K.spicy -= dt;
      if (K.spicy > 0 && Math.random() < dt * 12) burst(rnd(205, 240), 34, ['#ffffff', '#e6e6f5'], 1, 20, -30, .7, 2);
      const sp = K.fast ? 2.2 : 1;
      K.t += dt * (sp - 1);
      const n = K.sk.length;
      if (K.eatI >= n) { if (K.t > 1.1) finishEat(); return; }
      if (K.t >= .35 && !K.bit) {
        K.bit = true;
        const id = K.sk[K.eatI];
        sfx.bite(id);
        burst(218, 78, ING_BY[id].bits.concat(['#ffffff', '#fff3b0']), 14, 70, 180, .6);
        pop(pick(['와삭!', '바삭!', '아삭!', '와그작!']), 246 + rnd(-6, 6), 60);
        if (Math.random() < .6) chat('eat');
        if (id === 'chili') { K.spicy = 2.2; K.eatenChili = true; sfx.spicy(); pop('매워!!', 250, 44, '#ff6a6a'); chat('spicy'); chat('spicy'); }
        else heart(rnd(200, 250), 70);
      }
      if (K.t >= 1.1) { K.eatI++; K.t = 0; K.bit = false; }
    }
  },
  key(k) {
    if (K.phase === 'build' && k >= '1' && k <= '8') addPiece(+k - 1);
    if (K.phase === 'eat' && (k === ' ' || k === 'Enter')) K.fast = true;
  },
  down(x, y) {
    if (K.phase === 'eat') K.fast = true;
    if (K.phase === 'build' && x >= 298 && y >= 84 && y < 98) { sfx.meow(); heart(308, 80); chat('탕이 너무 귀여워'); }
  },
  draw() {
    if (K.phase === 'build') this.drawBuild();
    else if (K.phase === 'syrup' || K.phase === 'dip') this.drawSyrup();
    else this.drawEat();
  },
  drawBuild() {
    kitchenBG(null);
    kitchenLulu(258, 38, 2);
    counter(96);
    drawChat(4, 20, 100, 74);
    // 주문 말풍선
    panel(110, 20, 140, 32, '#fff7f0');
    text(K.nick + '님의 주문', 115, 23, { f: F.s, c: C.ink2 });
    K.order.forEach((id, i) => {
      const ix = 115 + i * 14;
      blit(ING_BY[id].img, ix, 35);
      if (K.sk[i] != null) blit(K.sk[i] === id ? ICON.check : ICON.cross, ix + (K.sk[i] === id ? 5 : 7), 41);
    });
    text('순서대로!', 245, 38, { f: F.s, c: C.pinkD, a: 'right' });
    // 꼬치
    rect(106, 90, 150, 6, '#e8b184'); rect(106, 90, 150, 1, C.ink);
    stick(111, 80, 252, 80);
    for (let i = 0; i < 5; i++) {
      const cx = 124 + i * 24;
      if (K.sk[i]) blit(ING_BY[K.sk[i]].img, cx - 10, 70, 2);
      else { ctx.fillStyle = 'rgba(59,31,58,0.28)'; for (let a = 0; a < 12; a++) ctx.fillRect(Math.round(cx + Math.cos(a / 12 * Math.PI * 2) * 7), Math.round(80 + Math.sin(a / 12 * Math.PI * 2) * 7), 1, 1); }
    }
    blit(CAT, 300, 88);
    if (Math.floor(T) % 3 === 0) text('z', 306 + (T % 1) * 4, 80 - (T % 1) * 6, { f: F.s, c: C.ink2 });
    // 재료 쟁반
    ING.forEach((ing, i) => {
      const x = 4 + i * 39, y = 104, locked = G.fans < ing.need, hov = ui.hover === 'ing' + i;
      panel(x, y, 36, 34, hov && !locked ? '#ffffff' : '#fff4ec');
      ellipse(x + 18, y + 22, 13, 3, '#ffd0de');
      blit(ing.img, x + 8, y + 2, 2);
      text(ing.name, x + 18, y + 24, { f: F.s, c: C.ink, a: 'center' });
      text(String(i + 1), x + 3, y + 2, { f: F.s, c: C.ink2 });
      if (locked) {
        rect(x + 1, y + 1, 34, 32, 'rgba(59,31,58,0.62)');
        blit(ICON.lock, x + 15, y + 6);
        text('♥' + ing.need, x + 18, y + 18, { f: F.s, c: '#ffffff', a: 'center' });
      }
      hit('ing' + i, x, y, 36, 34, () => addPiece(i), null, () => addPiece(i), locked);
    });
    button('undo', 4, 144, 70, 16, '하나 빼기', () => { K.sk.pop(); sfx.unpop(); }, { key: 'Backspace', disabled: !K.sk.length, col: C.lav, dark: C.lavD });
    text('숫자키 1~8로도 꽂아요', 140, 148, { f: F.s, c: C.ink2, a: 'center' });
    button('go', 206, 144, 110, 16, '설탕 코팅하기 ▶', goSyrup, { key: 'Enter', disabled: !K.sk.length, col: C.red, dark: C.redD });
    text('주문 순서대로 꽂고 설탕 코팅을 하면 룰루가 먹방을 해요', W / 2, 166, { f: F.s, c: '#ffffff', a: 'center' });
  },
  drawSyrup() {
    kitchenBG(170, false);
    drawChat(4, 20, 100, 102);
    const cx = 175, sy = 118;
    const tcol = gradCol(['#fff4d6', '#ffe08a', '#ffc04d', '#e8892c', '#8a4a1c'], (K.temp - 100) / 90);
    // 냄비 뒤
    ellipse(cx, sy, 47, 8, '#7c82a0');
    ellipse(cx, sy, 43, 6, tcol);
    for (let i = 0; i < 5; i++) { const bx = cx - 30 + ((i * 17 + Math.floor(T * 7) * 5) % 60); rect(bx, sy - 2 + (i % 3), 2, 1, '#ffffff'); }
    // 꼬치
    let dy = 0;
    if (K.phase === 'dip') {
      const t = K.t;
      dy = t < .35 ? 44 * ease(t / .35) : t < .9 ? 44 + Math.sin(t * 30) : t < 1.3 ? 44 * (1 - ease((t - .9) / .4)) : 0;
    }
    const tipY = 100 + Math.round(dy), n = K.sk.length;
    stick(cx, tipY - 12 - (n - 1) * 18 - 14, cx, tipY + 10);
    for (let i = 0; i < n; i++) blit(pieceImg(K.sk[i]), cx - 10, tipY - 10 - i * 18, 2);
    // 앞쪽 시럽과 냄비
    ctx.globalAlpha = .7; ellipse(cx, sy, 43, 6, tcol, 1); ctx.globalAlpha = 1;
    rect(cx - 46, sy + 1, 93, 42, '#b8bdd6'); rect(cx - 46, sy + 1, 1, 42, C.ink); rect(cx + 46, sy + 1, 1, 42, C.ink);
    rect(cx - 46, sy + 43, 93, 1, C.ink); rect(cx - 40, sy + 4, 4, 36, '#e3e6f5'); rect(cx + 30, sy + 4, 8, 36, '#9aa0bb');
    ellipse(cx, sy, 47, 8, '#7c82a0', 1); ellipse(cx, sy + 1, 45, 6, '#b8bdd6', 1);
    rect(cx - 54, sy + 8, 8, 4, '#7c82a0'); rect(cx + 47, sy + 8, 8, 4, '#7c82a0');
    // 불꽃
    for (let i = 0; i < 7; i++) {
      const fx = cx - 33 + i * 11, fh = 4 + Math.round(Math.abs(Math.sin(T * 13 + i * 1.7)) * 4);
      rect(fx, sy + 46 - fh, 4, fh, '#ff8a3d'); rect(fx + 1, sy + 47 - fh + 1, 2, fh - 2, '#ffd166');
    }
    rect(cx - 50, sy + 46, 101, 2, C.ink2);
    // 온도계
    const x = 262, y0 = 22, y1 = 150;
    const ty = t => Math.round(y1 - 10 - (t - 100) * (y1 - 10 - y0 - 4) / 100);
    panel(x, y0, 11, y1 - y0 - 6, '#ffffff');
    rect(x + 2, ty(170), 7, ty(160) - ty(170), '#ffe9a8');
    rect(x + 2, ty(150), 7, ty(140) - ty(150), '#ffe9a8');
    rect(x + 2, ty(160), 7, ty(150) - ty(160), C.gold);
    rect(x + 2, ty(200), 7, ty(175) - ty(200), '#ffc4c4');
    const T0 = Math.min(K.temp, 199);
    rect(x + 4, ty(T0), 3, y1 - 5 - ty(T0), C.red);
    disc(x + 5, y1 - 5, 6, C.ink); disc(x + 5, y1 - 5, 5, C.red); rect(x + 3, y1 - 8, 1, 2, '#ffb0b0');
    for (const t of [100, 140, 150, 160, 170, 200]) { rect(x - 3, ty(t), 3, 1, C.ink); text(t, x - 5, ty(t) - 4, { f: F.s, c: C.ink2, a: 'right' }); }
    text('하드', x + 14, ty(160) - 4, { f: F.s, c: C.goldD });
    text('크랙', x + 14, ty(160) + 5, { f: F.s, c: C.goldD });
    text(Math.floor(K.temp) + '℃', x + 5, 156, { f: F.b, c: C.ink, a: 'center' });
    if (K.phase === 'syrup') {
      button('dip', 8, 127, 92, 22, '담그기!', dipNow, { key: ' ', f: F.b, col: C.red, dark: C.redD });
      text('150~160℃에 담가요', 54, 152, { f: F.s, c: C.ink, a: 'center' });
      text('스페이스 키도 돼요', 54, 161, { f: F.s, c: C.ink2, a: 'center' });
    }
    if (K.phase === 'dip' && K.revealed) {
      const q = QUAL[K.q];
      const good = K.q === 'perfect' || K.q === 'good';
      text(q.name, cx, 24, { f: F.b, c: good ? '#fff3b0' : '#ffd0d0', o: C.ink, a: 'center' });
      if (K.q === 'perfect') { blit(ICON.star, cx - 64, 26); blit(ICON.star, cx + 57, 26); }
    }
  },
  drawEat() {
    kitchenBG(null);
    let face = 'n/smile';
    const n = K.sk.length, t = K.t;
    const eating = K.eatI < n;
    if (eating) {
      if (t > .18 && t < .38) face = 'n/big';
      else if (t >= .38 && t < .95) face = (Math.floor(t * 10) % 2 ? 'happy/chew0' : 'happy/chew1');
    } else face = 'happy/open';
    if (K.spicy > 0) face = 'x/wave/red';
    blit(lulu(G.eq, 'idle', Math.floor(T * 2) % 2, face), 192, 26, 3);
    counter(108);
    drawChat(4, 20, 100, 104);
    if (K.phase === 'eat' || K.phase === 'result') {
      // 꼬치
      let off = 0, slide = 0;
      if (eating) {
        off = t < .35 ? ease(t / .35) : t < .6 ? 1 - ease((t - .35) / .25) : 0;
        if (K.bit) slide = t < .6 ? 18 : 18 * (1 - ease((t - .6) / .5));
      }
      const sx = Math.round(lerp(160, 214, off)), topY = Math.round(lerp(88, 78, off) + slide);
      const first = K.eatI + (K.bit ? 1 : 0);
      if (first < n || eating) {
        stick(sx, topY - 12, sx, H);
        for (let i = first; i < n; i++) blit(pieceImg(K.sk[i]), sx - 10, topY - 10 + (i - first) * 18, 2);
      }
    }
    rect(260, 20, 56, 13, 'rgba(43,24,56,0.82)');
    rect(264, 24, 4, 4, Math.floor(T * 2) % 2 ? C.red : '#ff8a9a');
    text('먹방 중', 272, 22, { f: F.s, c: '#ffffff' });
    if (K.phase === 'eat') text(K.fast ? '빨리 감기 ▶▶' : '화면을 누르면 빨리 먹어요', 214, 166, { f: F.s, c: '#ffffff', a: 'center' });
    if (K.phase === 'result') this.drawResult();
  },
  drawResult() {
    const r = K.res;
    rect(0, 15, W, H - 15, 'rgba(43,24,56,0.45)');
    panel(70, 24, 180, 132, C.cream);
    text('먹방 결과', 160, 30, { f: F.b, c: C.pinkD, a: 'center' });
    const row = (y, k, v, icon, col) => {
      text(k, 84, y, { f: F.m, c: C.ink2 });
      if (icon) blit(icon, 236 - Math.ceil(tw(v, F.m)) - 10, y + 1);
      text(v, 236, y, { f: F.m, c: col || C.ink, a: 'right' });
    };
    row(50, '주문 일치', r.matched + ' / ' + r.n + (r.full ? '  완벽!' : ''), null, r.full ? C.pinkD : C.ink);
    row(64, '설탕 코팅', QUAL[K.q].short, null, K.q === 'perfect' ? C.goldD : K.q === 'burnt' || K.q === 'sticky' ? C.redD : C.ink);
    row(78, '코인', '+' + r.coins, ICON.coin);
    row(92, '구독자', '+' + r.fans, ICON.heart);
    if (r.unlocked.length) text('새 재료 해금: ' + r.unlocked.join(', ') + '!', 160, 108, { f: F.m, c: C.red, a: 'center' });
    else text('지금까지 만든 탕후루 ' + G.made + '개', 160, 108, { f: F.s, c: C.ink2, a: 'center' });
    button('again', 82, 130, 76, 18, '한 개 더!', () => SC.kitchen.enter(), { key: 'Enter' });
    button('out', 164, 130, 76, 18, '랜드로', () => go('park'), { col: C.lav, dark: C.lavD });
  },
};

// ================= 아이스크림 뽑기 =================
const CW = { st: 'idle', x: 160, y: 50, dir: 1, prizes: [], held: null, t: 0, msg: '', slipAt: 0 };
const CLAW_COST = 20, FLOOR = 132, CHUTE = 110;
function fillPrizes() {
  while (CW.prizes.length < 8) {
    let x, tries = 0;
    do { x = rnd(120, 228); tries++; } while (tries < 30 && CW.prizes.some(p => Math.abs(p.x - x) < 12));
    CW.prizes.push({ id: pickIce(), x, y: FLOOR, vy: 0, st: 'rest' });
  }
}
function clawWin(p) {
  const ice = ICE_BY[p.id];
  const first = !G.ice[p.id];
  G.ice[p.id] = (G.ice[p.id] || 0) + 1;
  G.coins += ice.val;
  CW.msg = ice.name + ' 획득! +' + ice.val + '코인';
  sfx.thunk(); jingle(ice.val >= 50 ? 'big' : 'prize'); burst(98, 140, [C.gold, '#ffffff', C.pink], 20, 80, 120, .8);
  pop('+' + ice.val, 98, 120, C.gold);
  if (first) toast('새 아이스크림: ' + ice.name);
  if (ICE.every(i => G.ice[i.id]) && !G.own.band.includes('crown')) {
    G.own.band.push('crown'); G.crownGiven = true;
    setTimeout(() => toast('도감 완성! 사탕 왕관을 받았어요'), 900);
  }
  save();
}
SC.claw = {
  music() { return 'arcade'; },
  enter() { CW.st = 'idle'; CW.x = 160; CW.y = 50; CW.held = null; CW.msg = ''; fillPrizes(); },
  play() {
    if (CW.st === 'idle') {
      if (G.coins < CLAW_COST) { sfx.deny(); toast('코인이 부족해요. 탕후루를 팔아 모아요'); return; }
      G.coins -= CLAW_COST; save(); sfx.insert(); CW.st = 'move'; CW.msg = '';
    } else if (CW.st === 'move') { CW.st = 'drop'; sfx.claw(); }
  },
  update(dt) {
    CW.t += dt;
    for (const p of CW.prizes) if (p.st === 'fall') {
      p.vy += 320 * dt; p.y += p.vy * dt;
      if (p.x < CHUTE && p.y > FLOOR + 20) { p.st = 'won'; clawWin(p); }
      else if (p.x >= CHUTE && p.y >= FLOOR) { p.y = FLOOR; p.vy = 0; p.st = 'rest'; sfx.thud(); }
    }
    CW.prizes = CW.prizes.filter(p => p.st !== 'won');
    const MOTOR = { move: 72, drop: 52, lift: 90, carry: 78, back: 70 };
    if (MOTOR[CW.st]) { const m = loop('motor'); if (m) m.set(.07, 520, MOTOR[CW.st]); } else loopOff('motor');
    switch (CW.st) {
      case 'move':
        CW.x += CW.dir * 70 * dt;
        if (CW.x > 228) { CW.x = 228; CW.dir = -1; }
        if (CW.x < 118) { CW.x = 118; CW.dir = 1; }
        break;
      case 'drop':
        CW.y += 80 * dt;
        if (CW.y >= 112) { CW.y = 112; CW.st = 'grab'; CW.t = 0; sfx.clunk(); }
        break;
      case 'grab':
        if (CW.t > .45) {
          let best = null, bd = 99;
          for (const p of CW.prizes) if (p.st === 'rest') { const d = Math.abs(p.x - CW.x); if (d < bd) { bd = d; best = p; } }
          let ch = bd <= 3 ? .85 : bd <= 6 ? .55 : bd <= 9 ? .25 : 0;
          if (best && best.id === 'gold') ch *= .6;
          if (best && Math.random() < ch) { CW.held = best; best.st = 'held'; sfx.latch(); CW.slipAt = bd > 3 ? (Math.random() < .25 ? rnd(.2, .8) : -1) : (Math.random() < .06 ? rnd(.2, .8) : -1); }
          else CW.held = null;
          CW.st = 'lift';
        }
        break;
      case 'lift':
        CW.y -= 60 * dt;
        if (CW.held) { CW.held.x = CW.x; CW.held.y = CW.y + 20; }
        if (CW.y <= 50) { CW.y = 50; CW.st = 'carry'; CW.startX = CW.x; if (!CW.held) { CW.msg = '아깝다! 다시 해 봐요'; jingle('aww'); } }
        break;
      case 'carry': {
        CW.x -= 60 * dt;
        if (CW.held) {
          CW.held.x = CW.x; CW.held.y = CW.y + 20;
          const prog = (CW.startX - CW.x) / Math.max(1, CW.startX - 98);
          if (CW.slipAt > 0 && prog >= CW.slipAt) { CW.held.st = 'fall'; CW.held.vy = 0; CW.held = null; CW.msg = '앗, 떨어졌어요!'; sfx.slip(); }
        }
        if (CW.x <= 98) { CW.x = 98; CW.st = 'release'; CW.t = 0; sfx.clunk(); if (CW.held) { CW.held.st = 'fall'; CW.held.vy = 0; CW.held = null; } }
        break;
      }
      case 'release':
        if (CW.t > .6) CW.st = 'back';
        break;
      case 'back':
        CW.x += 70 * dt;
        if (CW.x >= 160) { CW.x = 160; CW.st = 'idle'; fillPrizes(); }
        break;
    }
  },
  key(k) { if (k === ' ') this.play(); },
  draw() {
    rect(0, 15, W, H - 15, '#ffe6f2');
    ctx.fillStyle = '#ffd6ea';
    for (let y = 20; y < 160; y += 12) for (let x = ((y / 12) % 2) * 6; x < W; x += 12) ctx.fillRect(x, y, 2, 2);
    for (let x = 0; x < W; x += 16) for (let y = 160; y < H; y += 8) rect(x + ((y / 8) % 2) * 8, y, 8, 8, '#f7c6dc');
    rect(0, 160, W, 1, C.ink);
    // 기계
    panel(76, 16, 168, 24, C.pink);
    for (let i = 0; i < 20; i++) { const on = (Math.floor(T * 5) + i) % 2; rect(81 + i * 8, 18, 2, 2, on ? C.gold : '#ffffff'); rect(81 + i * 8, 36, 2, 2, on ? '#ffffff' : C.gold); }
    text('아이스크림 뽑기', 160, 22, { f: F.b, c: '#ffffff', o: C.pinkD, a: 'center' });
    panel(76, 39, 168, 95, '#c7e9fb');
    rect(78, 41, 164, 91, '#dff4ff');
    line(90, 44, 116, 70, '#ffffff'); line(95, 44, 121, 70, '#ffffff');
    // 출구
    rect(84, FLOOR - 26, 26, 26, '#b7d9ea'); rect(CHUTE, FLOOR - 28, 3, 28, C.pinkD); rect(84, FLOOR - 1, 26, 1, C.ink2);
    text('출구', 97, FLOOR - 24, { f: F.s, c: C.ink2, a: 'center' });
    rect(CHUTE + 3, FLOOR, 126, 2, '#b7d9ea');
    // 경품
    for (const p of CW.prizes) if (p.st !== 'held') { const im = ICE_BY[p.id].img; blit(im, p.x - 5, p.y - im.height); }
    // 집게
    rect(80, 42, 160, 3, '#9aa0bb'); rect(80, 45, 160, 1, '#7c82a0');
    const cx = Math.round(CW.x), cy = Math.round(CW.y);
    rect(cx - 5, 42, 11, 6, '#7c82a0'); rect(cx - 4, 43, 9, 1, '#b8bdd6');
    rect(cx, 48, 1, cy - 48, C.ink2);
    if (CW.held) { const im = ICE_BY[CW.held.id].img; blit(im, cx - 5, cy + 6); }
    const open = CW.st === 'drop' || CW.st === 'release' || CW.st === 'idle' || CW.st === 'move' || CW.st === 'back';
    rect(cx - 3, cy, 7, 4, '#7c82a0'); rect(cx - 2, cy + 1, 5, 1, '#b8bdd6');
    if (open) { line(cx - 3, cy + 4, cx - 6, cy + 9, C.ink2, 1); line(cx + 3, cy + 4, cx + 6, cy + 9, C.ink2, 1); line(cx - 6, cy + 9, cx - 5, cy + 11, C.ink2, 1); line(cx + 6, cy + 9, cx + 5, cy + 11, C.ink2, 1); }
    else { line(cx - 3, cy + 4, cx - 4, cy + 9, C.ink2, 1); line(cx + 3, cy + 4, cx + 4, cy + 9, C.ink2, 1); line(cx - 4, cy + 9, cx - 2, cy + 11, C.ink2, 1); line(cx + 4, cy + 9, cx + 2, cy + 11, C.ink2, 1); }
    // 받침
    panel(76, 133, 168, 27, '#ff9fbf');
    rect(84, 138, 26, 16, C.ink2); rect(86, 140, 22, 12, '#5a3558');
    rect(126, 146, 2, 10, C.ink2); disc(127, 144, 3, C.red);
    const busy = CW.st !== 'idle' && CW.st !== 'move';
    button('play', 164, 137, 72, 18, CW.st === 'move' ? '내려라!' : '뽑기 ' + CLAW_COST, () => this.play(), { key: ' ', disabled: busy || (CW.st === 'idle' && G.coins < CLAW_COST), deny: () => { if (!busy) { sfx.deny(); toast('코인이 부족해요. 탕후루를 팔아 모아요'); } }, col: C.red, dark: C.redD });
    // 왼쪽 안내
    panel(4, 20, 68, 110, C.cream);
    text('한 판', 38, 25, { f: F.s, c: C.ink2, a: 'center' });
    blit(ICON.coin, 22, 37); text(String(CLAW_COST), 32, 36, { f: F.b, c: C.goldD });
    const tips = wrapChars('집게가 움직일 때 버튼을 누르면 내려가요. 아이스크림 한가운데를 노려요!', F.s, 60, 60);
    tips.forEach((l, i) => text(l, 8, 54 + i * 10, { f: F.s, c: C.ink }));
    if (CW.msg) wrapChars(CW.msg, F.s, 60, 60).forEach((l, i) => text(l, 8, 104 + i * 10, { f: F.s, c: C.red }));
    // 오른쪽 도감
    panel(248, 20, 68, 136, C.cream);
    const got = ICE.filter(i => G.ice[i.id]).length;
    text('도감 ' + got + '/' + ICE.length, 282, 25, { f: F.s, c: C.pinkD, a: 'center' });
    ICE.forEach((ice, i) => {
      const x = 252 + (i % 2) * 32, y = 38 + Math.floor(i / 2) * 34;
      rect(x, y, 28, 30, '#fff0f5');
      blit(G.ice[ice.id] ? ice.img : ice.sil, x + 9, y + 2);
      text('+' + ice.val, x + 14, y + 20, { f: F.s, c: G.ice[ice.id] ? C.ink : C.ink2, a: 'center' });
    });
    text('모두 모으면', 282, 136, { f: F.s, c: C.ink2, a: 'center' });
    text('사탕 왕관!', 282, 145, { f: F.s, c: C.pinkD, a: 'center' });
  },
};

// ================= 드롭타워 =================
const D = { ph: 'ready', t: 0, x: 160, items: [], spawn: 0, eaten: 0, combo: 0, best: 0, coins: 0, spicy: 0, stun: 0, speed: 0, dist: 0, face: 0, res: null, lines: [] };
const DROP_DUR = 18;
SC.drop = {
  music() { return D.ph === 'fall' ? 'fall' : D.ph === 'ready' || D.ph === 'result' ? 'park' : null; },
  enter() { Object.assign(D, { landed: false, clack: 0, ph: 'ready', t: 0, x: 160, items: [], spawn: .5, eaten: 0, combo: 0, best: 0, coins: 0, spicy: 0, stun: 0, speed: 0, dist: 0, face: 0, res: null, lines: [] }); },
  start() { if (D.ph === 'ready' || D.ph === 'result') { this.enter(); D.ph = 'rise'; sfx.click(); } },
  alt() {
    if (D.ph === 'rise') return 80 * ease(D.t / 2.2);
    if (D.ph === 'count') return 80;
    if (D.ph === 'fall') return 80 * (1 - D.t / DROP_DUR);
    return 0;
  },
  update(dt) {
    D.t += dt;
    D.face -= dt; D.spicy -= dt; D.stun -= dt;
    const wind = D.ph === 'rise' || D.ph === 'count' || D.ph === 'fall' || D.ph === 'land';
    if (wind) { const wl = loop('wind'), a = this.alt() / 80; if (wl) wl.set(D.ph === 'fall' ? .16 + .1 * (D.t / DROP_DUR) : D.ph === 'land' ? .16 * D.speed / 190 : .03 + .1 * a, D.ph === 'fall' ? 900 + D.speed * 6 : 500 + a * 500); }
    else loopOff('wind');
    if (D.ph === 'rise') {
      D.dist += dt * 40; D.clack = (D.clack || 0) - dt;
      if (D.clack <= 0) { D.clack = .16; sfx.clack(); }
      if (D.t >= 2.2) { D.ph = 'count'; D.t = 0; sfx.beep(); }
    }
    else if (D.ph === 'count') {
      if (Math.floor(D.t / .8) !== Math.floor((D.t - dt) / .8) && D.t < 2.4) sfx.beep();
      if (D.t >= 2.4) { D.ph = 'fall'; D.t = 0; sfx.whoosh(); sfx.go(); }
    } else if (D.ph === 'fall') {
      const prog = D.t / DROP_DUR;
      D.speed = 120 + 70 * prog;
      D.dist += D.speed * dt;
      let dir = 0;
      if (keys.ArrowLeft || keys.a) dir = -1;
      if (keys.ArrowRight || keys.d) dir = 1;
      const vmax = D.stun > 0 ? 0 : D.spicy > 0 ? 70 : 160;
      if (dir) D.x += dir * vmax * dt;
      else if (ptr.down && ptr.y > 16) { const d = ptr.x - D.x; D.x += clamp(d, -vmax * dt, vmax * dt); }
      D.x = clamp(D.x, 44, 278);
      D.spawn -= dt;
      if (D.spawn <= 0) {
        D.spawn = rnd(.26, .48);
        const r = Math.random();
        const type = r < .6 ? 'tang' : r < .74 ? 'star' : r < .88 ? 'chili' : 'bird';
        D.items.push({ type, x: rnd(48, 280), y: 196, ph: rnd(0, 6) });
      }
      for (const it of D.items) {
        it.y -= D.speed * dt * (it.type === 'bird' ? .75 : 1);
        if (it.type === 'bird') it.x += Math.sin(D.t * 3 + it.ph) * 40 * dt;
        const cx = it.x, cy = it.y + (it.type === 'tang' ? 12 : 7);
        if (!it.gone && Math.abs(cx - D.x) < 15 && Math.abs(cy - 60) < 14) {
          it.gone = true;
          if (it.type === 'tang') {
            D.eaten++; D.combo++; const c = 4 + Math.min(D.combo, 8); D.coins += c; D.face = .4;
            sfx.bite(pick(['berry', 'grape', 'mandarin'])); if (D.combo >= 2) sfx.combo(D.combo); burst(D.x, 60, ['#ef3f5a', '#ffffff', '#b6e36a', '#ffa62b'], 10, 60, 60, .5);
            pop(D.combo >= 3 ? '콤보 ' + D.combo : '와삭!', D.x, 38);
          } else if (it.type === 'star') { D.coins += 15; sfx.sparkle(); pop('+15', D.x, 38, C.gold); burst(D.x, 60, [C.gold, '#ffffff'], 12, 70, 40, .6); }
          else if (it.type === 'chili') { D.spicy = 1.8; D.combo = 0; sfx.spicy(); pop('매워!!', D.x, 38, '#ff6a6a'); }
          else { D.stun = .6; D.combo = 0; sfx.squawk(); pop('꺄악!', D.x, 38, '#ffffff'); }
        }
      }
      D.items = D.items.filter(it => it.y > -40 && !it.gone);
      if (!reduceMotion && Math.random() < dt * 30) D.lines.push({ x: rnd(0, W), y: H + 10, l: rnd(10, 26) });
      if (D.t >= DROP_DUR) { D.ph = 'land'; D.t = 0; D.items = []; sfx.brake(); }
    } else if (D.ph === 'land') {
      D.speed = Math.max(0, 190 * (1 - D.t / 1.1));
      if (D.t >= 1.1 && !D.landed) { D.landed = true; sfx.thud(); }
      if (D.t >= 1.8) this.finish();
    }
    for (const l of D.lines) l.y -= (D.speed * 2.2 + 40) * dt;
    D.lines = D.lines.filter(l => l.y > -30);
  },
  finish() {
    const newBest = D.eaten > G.dropBest;
    const fans = Math.round(D.eaten * 1.2) + (newBest && D.eaten > 0 ? 5 : 0);
    if (newBest) G.dropBest = D.eaten;
    G.coins += D.coins; G.fans += fans; save();
    D.res = { fans, newBest }; D.ph = 'result'; D.t = 0;
    jingle(newBest && D.eaten > 0 ? 'fanfare' : 'nice'); sfx.coinRoll(Math.min(10, Math.ceil(D.coins / 10)));
  },
  key(k) { if ((k === ' ' || k === 'Enter') && (D.ph === 'ready')) this.start(); },
  draw() {
    const alt = this.alt();
    const hi = alt / 80;
    // 하늘 (높을수록 짙은 파랑)
    const top = gradCol(['#9fd8ff', '#6fb8ff', '#5a9cf0'], hi), bot = gradCol(['#ffe3ee', '#bfe6ff', '#9fd0ff'], hi);
    for (let i = 0; i < 6; i++) rect(0, 15 + i * 28, W, 28, mixCol(top, bot, i / 5));
    // 구름
    for (let i = 0; i < 6; i++) {
      const k = i % 3, span = H + 60;
      const y = ((i * 47 - D.dist * .5 * (k + 1) / 2) % span + span) % span - 30;
      blit(CLOUDS[k], (i * 83) % (W + 20) - 20, D.ph === 'rise' ? H - y : y);
    }
    if (D.ph === 'ready' || D.ph === 'result') { this.drawGroundView(); return; }
    for (const l of D.lines) rect(l.x, l.y, 1, l.l, 'rgba(255,255,255,0.55)');
    if (D.ph === 'rise' || D.ph === 'count') {
      // 탑을 올라가는 장면
      const off = Math.floor(D.dist) % 16;
      for (let y = 15 - 16; y < H; y++) rect(150, y, 20, 1, (Math.floor((y + off) / 8) % 2) ? '#ffffff' : '#ff8fb3');
      rect(149, 15, 1, H, C.ink); rect(170, 15, 1, H, C.ink);
      const gy = D.ph === 'rise' ? 150 + Math.round(ease(D.t / 2.2) * 60) : 999;
      if (gy < H) ground(0, gy);
      blit(lulu(G.eq, 'idle', 0, D.ph === 'count' ? 'wow/o' : 'n/smile'), 140, 44, 2);
      panel(112, 96, 96, 9, C.gold); rect(113, 103, 94, 1, C.goldD);
      text(Math.round(alt) + 'm', 250, 30, { f: F.b, c: '#ffffff', o: C.ink });
      if (D.ph === 'count') {
        const n = 3 - Math.floor(D.t / .8);
        text(n > 0 ? String(n) : '출발!', 76, 60, { f: F.xl, c: C.gold, o: C.ink, ow: 2, a: 'center' });
      } else text('올라가는 중…', W / 2, 24, { f: F.m, c: '#ffffff', o: C.ink, a: 'center' });
      return;
    }
    // 낙하
    const off = Math.floor(D.dist) % 16;
    for (let y = 15; y < H; y++) rect(14, y, 14, 1, (Math.floor((y + off) / 8) % 2) ? '#ffffff' : '#ff8fb3');
    rect(13, 15, 1, H, C.ink); rect(28, 15, 1, H, C.ink);
    if (D.ph === 'land') { const gy = Math.round(H + 20 - ease(D.t / 1.1) * 72); ground(0, gy); }
    for (const it of D.items) {
      if (it.type === 'tang') blit(TANG, it.x - 5, it.y);
      else if (it.type === 'star') blit(ICON.star, it.x - 7, it.y, 2);
      else if (it.type === 'chili') blit(ING_BY.chili.img, it.x - 10, it.y - 3, 2);
      else blit(BIRD, it.x - 12, it.y, 2, Math.sin(D.t * 3 + it.ph) < 0);
    }
    let face = 'wow/o';
    if (D.face > 0) face = 'happy/chew0';
    if (D.spicy > 0) face = 'x/wave/red';
    if (D.stun > 0) face = 'x/o';
    const landed = D.ph === 'land' && D.t > 1.1;
    const ly = D.ph === 'land' ? Math.round(26 + ease(clamp((D.t - .4) / .7, 0, 1)) * (H + 20 - 72 - 65 - 26)) : 26;
    blit(lulu(G.eq, landed ? 'idle' : 'fall', 0, landed ? 'happy/open' : face), D.x - 20, ly, 2);
    // HUD
    panel(300, 22, 14, 140, 'rgba(255,255,255,0.7)');
    const my = Math.round(26 + (1 - alt / 80) * 128);
    rect(302, my, 10, 3, C.red);
    text(Math.max(0, Math.round(alt)) + 'm', 296, my - 3, { f: F.s, c: '#ffffff', o: C.ink, a: 'right' });
    text('탕후루 ' + D.eaten + '개', 36, 20, { f: F.m, c: '#ffffff', o: C.ink });
    blit(ICON.coin, 36, 34); text('+' + D.coins, 46, 33, { f: F.m, c: C.gold, o: C.ink });
    if (D.combo >= 2) text('콤보 x' + D.combo, 36, 46, { f: F.s, c: '#ffd0e0', o: C.ink });
  },
  drawGroundView() {
    ground(0, 150);
    for (let y = -4; y < 150; y++) rect(150, y, 20, 1, (Math.floor(y / 8) % 2) ? '#ffffff' : '#ff8fb3');
    rect(149, 15, 1, 135, C.ink); rect(170, 15, 1, 135, C.ink);
    const fr = Math.floor(T * 2) % 2;
    blit(lulu(G.eq, 'idle', fr, D.ph === 'result' ? 'happy/open' : 'n/smile'), 140, 84, 2);
    panel(112, 136, 96, 9, C.gold);
    if (D.ph === 'ready') {
      panel(8, 22, 128, 118, C.cream);
      text('드롭타워 먹방', 72, 27, { f: F.b, c: C.pinkD, a: 'center' });
      const lines = ['80m에서 떨어지며', '탕후루를 받아 먹어요.', '', '←→ 또는 누른 채 움직이기', '별: +15코인', '고추: 매워서 느려져요', '새: 콤보가 끊겨요'];
      lines.forEach((l, i) => text(l, 14, 44 + i * 11, { f: F.s, c: C.ink }));
      text('최고 기록 ' + G.dropBest + '개', 72, 124, { f: F.s, c: C.ink2, a: 'center' });
      button('start', 196, 150, 108, 20, '타러 가기!', () => this.start(), { key: 'Enter', f: F.l, col: C.red, dark: C.redD });
    } else {
      panel(186, 24, 128, 104, C.cream);
      text('드롭타워 결과', 250, 29, { f: F.b, c: C.pinkD, a: 'center' });
      const r = D.res;
      const row = (y, k, v, icon) => { text(k, 196, y, { f: F.m, c: C.ink2 }); if (icon) blit(icon, 302 - Math.ceil(tw(v, F.m)) - 10, y + 1); text(v, 302, y, { f: F.m, c: C.ink, a: 'right' }); };
      row(48, '먹은 탕후루', D.eaten + '개');
      row(62, '코인', '+' + D.coins, ICON.coin);
      row(76, '구독자', '+' + r.fans, ICON.heart);
      text(r.newBest && D.eaten > 0 ? '최고 기록 경신!' : '최고 기록 ' + G.dropBest + '개', 250, 96, { f: F.m, c: r.newBest ? C.red : C.ink2, a: 'center' });
      button('again', 196, 150, 56, 20, '한 번 더', () => this.start(), { key: 'Enter' });
      button('out', 258, 150, 56, 20, '랜드로', () => go('park'), { col: C.lav, dark: C.lavD });
    }
  },
};

// ================= 룰루 옷장 =================
const CL = { tab: 'outfit', sel: 'apron' };
const LISTS = { outfit: OUTFITS, hair: HAIRS, band: BANDS };
function buy(tab, item) {
  if (G.own[tab].includes(item.id)) { G.eq[tab] = item.id; save(); sfx.rustle(); sfx.sparkle(); return; }
  if (item.price < 0) { sfx.deny(); toast('뽑기 도감을 완성하면 받아요'); return; }
  if (G.coins < item.price) { sfx.deny(); toast('코인이 ' + (item.price - G.coins) + '개 부족해요'); return; }
  G.coins -= item.price; G.own[tab].push(item.id); G.eq[tab] = item.id; save();
  sfx.chaching(); sfx.rustle(); burst(69, 90, [C.gold, '#ffffff', C.pink], 20, 80, 60, .8);
  toast(item.name + '을(를) 샀어요');
}
SC.closet = {
  music() { return 'boutique'; },
  enter() { CL.tab = 'outfit'; CL.sel = G.eq.outfit; },
  key(k) {
    const tabs = ['outfit', 'hair', 'band'];
    if (k === 'ArrowLeft' || k === 'ArrowRight') { const i = (tabs.indexOf(CL.tab) + (k === 'ArrowLeft' ? 2 : 1)) % 3; CL.tab = tabs[i]; CL.sel = G.eq[CL.tab]; sfx.swish(); }
    if (k === 'ArrowUp' || k === 'ArrowDown') {
      const L = LISTS[CL.tab], i = L.findIndex(v => v.id === CL.sel);
      const ni = (i + (k === 'ArrowUp' ? L.length - 1 : 1)) % L.length;
      CL.sel = L[ni].id; sfx.bell(ni);
    }
  },
  draw() {
    rect(0, 15, W, H - 15, '#efe4ff');
    ctx.fillStyle = '#e2d3ff';
    for (let y = 20; y < 150; y += 10) for (let x = ((y / 10) % 2) * 5; x < W; x += 10) ctx.fillRect(x, y, 1, 1);
    rect(0, 150, W, 30, '#d9c6f5'); rect(0, 150, W, 1, C.ink);
    for (let x = 0; x < W; x += 24) rect(x, 151, 1, 29, '#c7b0ee');
    // 거울
    panel(14, 20, 110, 132, C.gold); rect(16, 22, 106, 128, C.goldD); panel(19, 25, 100, 122, '#e8f6ff', C.goldD);
    line(26, 30, 46, 50, '#ffffff'); line(30, 30, 50, 50, '#ffffff');
    const eqp = Object.assign({}, G.eq, { [CL.tab]: CL.sel });
    const blink = (T % 3) < .12;
    blit(lulu(eqp, 'idle', Math.floor(T * 2) % 2, blink ? 'blink/smile' : 'happy/smile'), 39, 38, 3);
    const owned = G.own[CL.tab].includes(CL.sel);
    text(owned ? (G.eq[CL.tab] === CL.sel ? '입고 있어요' : '가지고 있어요') : '미리보기', 69, 156, { f: F.s, c: C.ink2, a: 'center' });
    // 탭
    [['outfit', '옷'], ['hair', '머리'], ['band', '머리띠']].forEach(([id, name], i) => {
      const x = 132 + i * 62, on = CL.tab === id;
      button('tab' + id, x, 20, 58, 15, name, () => { CL.tab = id; CL.sel = G.eq[id]; sfx.swish(); }, { col: on ? C.pink : C.lav, dark: on ? C.pinkD : C.lavD });
    });
    // 목록
    LISTS[CL.tab].forEach((it, i) => {
      const x = 132 + (i % 2) * 92, y = 40 + Math.floor(i / 2) * 34;
      const sel = CL.sel === it.id, hov = ui.hover === 'it' + it.id;
      panel(x, y, 88, 30, sel ? '#ffffff' : hov ? '#fbf7ff' : '#f4ecff', sel ? C.pinkD : C.ink);
      if (sel) { rect(x + 1, y + 1, 86, 1, C.pink); }
      const prev = lulu(Object.assign({}, G.eq, { [CL.tab]: it.id }), 'idle', 0, 'n/smile');
      if (CL.tab === 'outfit') ctx.drawImage(prev, 0, 36, 40, 28, x + 3, y + 8, 20, 14);
      else ctx.drawImage(prev, 0, 0, 40, 38, x + 3, y + 6, 20, 19);
      text(it.name, x + 26, y + 5, { f: tw(it.name, F.m) > 58 ? F.s : F.m, c: C.ink });
      const own = G.own[CL.tab].includes(it.id), on = G.eq[CL.tab] === it.id;
      if (on) text('입는 중', x + 26, y + 18, { f: F.s, c: C.pinkD });
      else if (own) text('보유', x + 26, y + 18, { f: F.s, c: C.ink2 });
      else if (it.price < 0) text('도감 보상', x + 26, y + 18, { f: F.s, c: C.lavD });
      else { blit(ICON.coin, x + 26, y + 18); text(String(it.price), x + 35, y + 18, { f: F.s, c: G.coins >= it.price ? C.goldD : C.redD }); }
      hit('it' + it.id, x, y, 88, 30, () => { CL.sel = it.id; sfx.bell(i); });
    });
    const item = LISTS[CL.tab].find(v => v.id === CL.sel);
    const own = G.own[CL.tab].includes(item.id), on = G.eq[CL.tab] === item.id;
    let label, dis = false;
    if (on) { label = '입고 있어요'; dis = true; }
    else if (own) label = '입기';
    else if (item.price < 0) { label = '뽑기 도감을 완성하면 받아요'; dis = true; }
    else label = '사기 · ' + item.price + '코인';
    button('buy', 132, 146, 180, 18, label, () => buy(CL.tab, item), {
      key: 'Enter', disabled: dis || (!own && G.coins < item.price),
      deny: () => { if (!dis) buy(CL.tab, item); else sfx.deny(); },
      col: own ? C.mintD : C.red, dark: own ? '#2f8f70' : C.redD,
    });
    text('←→ 분류 · ↑↓ 고르기 · Enter 사기/입기', 222, 168, { f: F.s, c: C.ink2, a: 'center' });
  },
};

// ---------- HUD
function soundToggles(x, y) {
  blit(G.music ? ICON.noteOn : ICON.noteOff, x + 1, y);
  hit('mus', x - 3, y - 4, 17, 15, () => { audio(); setMusic(!G.music); toast(G.music ? '배경음악을 켰어요' : '배경음악을 껐어요'); });
  blit(G.sfx ? ICON.spkOn : ICON.spkOff, x + 21, y);
  hit('sfx', x + 17, y - 4, 19, 15, () => { audio(); setSfx(!G.sfx); toast(G.sfx ? '효과음을 켰어요' : '효과음을 껐어요'); });
}
function hud() {
  rect(0, 0, W, 15, C.night); rect(0, 15, W, 1, C.ink);
  if (scene === SC.park) text('룰루랜드', 6, 3, { f: F.m, c: '#ffd0e0' });
  else button('back', 2, 1, 50, 13, '◀ 랜드로', () => go('park'), { key: 'Escape', f: F.s, col: C.lav, dark: C.lavD });
  blit(ICON.coin, 190, 4); text(String(G.coins), 199, 3, { f: F.m, c: '#ffe28a' });
  blit(ICON.heart, 236, 4); text(String(G.fans), 245, 3, { f: F.m, c: '#ffc2d8' });
  soundToggles(284, 4);
}

// ---------- 루프
function update(dt) {
  T += dt;
  if (fadeDir === 1) {
    fade += dt * 5;
    if (fade >= 1) {
      fade = 1; fadeDir = -1;
      const prev = scene; scene = SC[nextScene.name];
      P.length = 0; loopsOff();
      scene.enter && scene.enter(prev === SC.park ? null : Object.keys(SC).find(k => SC[k] === prev));
    }
  } else if (fadeDir === -1) { fade -= dt * 5; if (fade <= 0) { fade = 0; fadeDir = 0; } }
  scene.update && scene.update(dt);
  setTrack(scene.music ? scene.music() : null);
  updP(dt);
  if (toastT > 0) toastT -= dt;
}
function render() {
  ctx.setTransform(S, 0, 0, S, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ui.btns = [];
  scene.draw();
  drawP();
  if (scene !== SC.title) hud();
  if (toastT > 0 && toastMsg) {
    const w = Math.ceil(tw(toastMsg, F.m)) + 14;
    ctx.globalAlpha = Math.min(1, toastT * 3);
    panel(W / 2 - w / 2, 20, w, 16, '#ffffff'); text(toastMsg, W / 2, 23, { f: F.m, c: C.ink, a: 'center' });
    ctx.globalAlpha = 1;
  }
  if (fade > 0) { ctx.fillStyle = 'rgba(43,24,56,' + fade.toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
}
let last = 0;
function frame(now) {
  const dt = last ? Math.min(.05, (now - last) / 1000) : .016; last = now;
  update(dt); render();
  requestAnimationFrame(frame);
}

function boot() {
  scene = SC.title; scene.enter();
  requestAnimationFrame(frame);
}
const fams = ['7.5px Galmuri14', '10px Galmuri9', '12px Galmuri11', 'bold 12px Galmuri11'];
if (document.fonts && document.fonts.load) {
  Promise.race([
    Promise.all(fams.map(f => document.fonts.load(f, '가A'))),
    new Promise(r => setTimeout(r, 2000)),
  ]).then(boot, boot);
} else boot();

})();
