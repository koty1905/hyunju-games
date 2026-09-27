// ---------- 진행
let MODE = 'title', SI = 0, ST = 0, T = 0, playing = false;
let toastMsg = '', toastT = 0;
function toast(m) { toastMsg = m; toastT = 2.2; }
const ui = { play: document.getElementById('play'), label: document.getElementById('scene') };
function syncUI() {
  if (ui.play) ui.play.textContent = MODE === 'play' && playing ? '일시정지' : '▶ 재생';
  if (ui.label) ui.label.textContent = MODE === 'title' ? '처음 화면' : MODE === 'fin' ? '끝' : `${SI + 1} / ${SCENES.length} · ${SCENES[SI].name}`;
}
function go(i) { SI = clamp(i, 0, SCENES.length - 1); ST = 0; MODE = 'play'; playTrack(SCENES[SI].music); syncUI(); }
function start() { audio(); playing = true; go(0); }
function toggle() {
  audio();
  if (MODE === 'title' || MODE === 'fin') return start();
  playing = !playing;
  if (AU.ac) { if (playing) AU.ac.resume(); else AU.ac.suspend(); }
  syncUI();
}
function step(d) {
  audio();
  if (MODE === 'fin') { if (d < 0) { playing = true; go(SCENES.length - 1); } return; }
  if (MODE === 'title') return start();
  if (d > 0 && SI === SCENES.length - 1) return finish();
  go(SI + d);
}
function finish() { MODE = 'fin'; playing = false; playTrack('box'); syncUI(); }
function toggleSound() {
  G.music = G.sfx = !G.music; audio();
  try { localStorage.setItem('panda-clause-v1', JSON.stringify({ sound: G.music })); } catch (e) { /* 무시 */ }
  if (AU.mus) AU.mus.gain.value = G.music ? .32 : 0; if (AU.fx) AU.fx.gain.value = G.sfx ? .6 : 0;
  toast(G.music ? '소리 켬' : '소리 끔');
}
try { const s = JSON.parse(localStorage.getItem('panda-clause-v1') || '{}'); if (s.sound === false) G.music = G.sfx = false; } catch (e) { /* 무시 */ }

function update(dt) {
  T += dt; toastT -= dt;
  musicTick();
  if (MODE !== 'play' || !playing) return;
  const sc = SCENES[SI], prev = ST;
  ST += dt;
  for (const [ct, fn] of sc.cues) if (prev < ct && ct <= ST) fn();
  if (ST >= sc.dur) { if (SI < SCENES.length - 1) go(SI + 1); else finish(); }
}
function drawTitle() {
  room('day');
  ctx.globalAlpha = .3; R(0, 0, W, H, '#1a120d'); ctx.globalAlpha = 1;
  blit(lebao({ arm: 'hold', chew: Math.floor(T * 4) % 2, bam: 3, blink: (T % 4) < .12 }), 172, 34, false, 4);
  sparkles(236, 104, 70, 12);
  text('판다 면제 조항', 14, 16, { f: F.xl, c: P.cr, o: P.ink, ow: 2 });
  text('리라 에피소드 2 · 러바오 특별 출연', 16, 50, { f: F.m, c: P.cr, o: P.ink });
  // 인형 사진처럼 앉아서 분홍 발바닥을 보이는 리라와 친구들
  [['rira', 14], ['rira2', 58], ['rosie', 102]].forEach(([id, x], i) => blit(rira(id === 'rira2' ? 'rira' : id, { sit: true, mood: 'h', ear: (T % 3) < .6 ? Math.sin(T * 30 + i) : Math.sin(T * 2 + i) * .34, blink: ((T * .7 + i) % 3.1) < .1 }), x, 104 + (Math.sin(T * 3 + i * 2) > .85 ? -1 : 0), false, 2));
  if (Math.floor(T * 2) % 2) text(coarse ? '▶ 화면을 눌러 보기' : '▶ Space · 화면을 눌러 보기', 16, 162, { f: F.m, c: P.cr, o: P.ink });
}
function drawFin() {
  room('eve');
  ctx.globalAlpha = .55; R(0, 0, W, H, '#1a120d'); ctx.globalAlpha = 1;
  text('끝', W / 2, 22, { f: F.xl, a: 'center', c: P.cr, o: P.ink, ow: 2 });
  text('출연', W / 2, 60, { f: F.s, a: 'center', c: P.gold });
  text('러바오 · 갓파더 · 알프스 리라 · 시스터 리라 · 세라피나', W / 2, 72, { f: F.s, a: 'center', c: P.cr });
  text('로즈마리라 · 로지 · 문지기 리라 · 행정 리라', W / 2, 82, { f: F.s, a: 'center', c: P.cr });
  drawLB(W / 2, 160, { chew: true, bam: 2, arm: 'hold' });
  if (Math.floor(T * 2) % 2) text(coarse ? '화면을 눌러 다시 보기' : 'Space · 화면을 눌러 다시 보기', W / 2, 172 - 76, { f: F.m, a: 'center', c: P.cr, o: P.ink });
}
function draw() {
  ctx.setTransform(S, 0, 0, S, 0, 0); ctx.imageSmoothingEnabled = false;
  R(0, 0, W, H, P.wall);
  if (MODE === 'title') drawTitle();
  else if (MODE === 'fin') drawFin();
  else {
    const sc = SCENES[SI];
    sc.draw(ST);
    const a = Math.max(0, 1 - ST / .35, 1 - (sc.dur - ST) / .35);
    if (a > 0) { ctx.globalAlpha = Math.min(1, a); R(0, 0, W, H, '#1a120d'); ctx.globalAlpha = 1; }
    if (!playing) { box(W - 50, 6, 44, 15, P.navy, P.ink); text('일시정지', W - 26, 8, { f: F.m, a: 'center', c: P.paper }); }
  }
  if (toastT > 0) { const w = tw(toastMsg, F.m) + 14; box(W / 2 - w / 2, 64, w, 15, P.ink, P.ink); text(toastMsg, W / 2, 66, { f: F.m, a: 'center', c: P.paper }); }
}

// ---------- 입력
addEventListener('keydown', e => {
  const k = e.key;
  if (e.target && e.target.tagName === 'BUTTON' && (k === ' ' || k === 'Enter')) return;
  if (k === ' ' || k === 'Enter') { e.preventDefault(); if (!e.repeat) toggle(); }
  else if (k === 'ArrowLeft') { e.preventDefault(); step(-1); }
  else if (k === 'ArrowRight') { e.preventDefault(); step(1); }
  else if (k === 'r' || k === 'R') start();
  else if (k === 'm' || k === 'M') toggleSound();
  else if (k === 'f' || k === 'F') toggleFS();
});
cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.focus({ preventScroll: true }); toggle(); });
const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
bind('restart', start); bind('prev', () => step(-1)); bind('play', toggle); bind('next', () => step(1)); bind('mute', toggleSound);

// ---------- 루프
let last = 0;
function frame(ts) {
  const dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts;
  fit(); update(dt); draw();
  requestAnimationFrame(frame);
}
// 자동 시험용 (주소에 ?test 가 있을 때만)
if (/[?&]test\b/.test(location.search)) window.__A = { rira, riraSide, lebao, lebaoRun, go, start, st: () => ({ MODE, SI, ST, playing }), seek: (i, t) => { go(i); ST = t; playing = false; } };
function boot() { ASC = {}; syncUI(); requestAnimationFrame(frame); }
const fams = ['7.5px Galmuri14', '10px Galmuri9', '12px Galmuri11', 'bold 12px Galmuri11', 'bold 18px Galmuri11', 'bold 24px Galmuri11'];
if (document.fonts && document.fonts.load) {
  Promise.race([Promise.all(fams.map(f => document.fonts.load(f, '가A'))), new Promise(r => setTimeout(r, 2000))]).then(boot, boot);
} else boot();
