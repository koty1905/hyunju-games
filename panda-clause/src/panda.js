// 러바오 편 공통: 러바오·누운 갓파더·판다 흉내 그림, 소품(오븐·상자·표지판·판매대·문), 더한 소리와 곡
// (애니메이션 판다 면제 조항과 게임 panda-shift 가 함께 쓴다)
// ---------- 러바오 (선 앞모습 84x80 격자 = 42x40칸, 몸 가운데 x=32). 참조: 러바오 사진과 스프라이트 시트
// 크기는 리라(키 23칸)와 갓파더(키 50칸)의 중간.
// 두 발로 서서 까만 팔을 몸 앞으로 늘어뜨린 모습. 둥글고 볼이 통통한 흰 얼굴, 아래 바깥으로 처진 타원 눈 패치,
// 까만 동그란 귀, 까만 코, 태연한 표정, 크고 둥근 흰 배, 팔로 이어지는 까만 어깨, 짧은 까만 다리. 턱 아래 털은 살짝 베이지.
const PB = { w: '#f6f2ea', w2: '#e9dfcd', k: '#221e24', k2: '#3a343f', ol: '#17141a', eye: '#6a4630', nose: '#141116', pad: '#4f4852', mouth: '#9a8d84', tongue: '#ec8c9a', lid: '#6d6570' };
function bamboo(g, x0, y0, x1, y1) {
  gline(g, x0, y0, x1, y1, '#6fae3f', 4);
  const n = Math.hypot(x1 - x0, y1 - y0);
  for (let d = 8; d < n; d += 10) { const t = d / n; gline(g, x0 + (x1 - x0) * t - 2, y0 + (y1 - y0) * t, x0 + (x1 - x0) * t + 2, y0 + (y1 - y0) * t, '#4e8a2c', 1); }
  const ux = (x1 - x0) / n, uy = (y1 - y0) / n;
  gaxis(g, x1 + ux * 3 - uy * 4, y1 + uy * 3 + ux * 4, 2.4, 6, ux - uy, uy + ux, '#9ccf5e');
  gaxis(g, x1 + ux * 3 + uy * 4, y1 + uy * 3 - ux * 4, 2.4, 6, ux + uy, uy - ux, '#8cc453');
}
// arm: idle 팔 늘어뜨림 · hold 두 앞발로 대나무 · chest 두 앞발 모으기(기다리기) · cross 팔짱(검토)
//      wave 손 흔들기 · up 두 팔 번쩍(점프) · offer 대나무 내밀기 / down: 고개 숙이기(실패)
function lebao(o = {}) {
  const arm = o.arm || 'idle', chew = o.chew ? 1 : 0, blink = o.blink ? 1 : 0, bam = o.bam == null ? 3 : o.bam, paper = o.paper || 0, down = o.down ? 1 : 0;
  return spr(`lb|${arm}|${chew}|${blink}|${bam}|${paper}|${down}`, 84, 80, g => {
    const W1 = PB.w, K = PB.k, hy = 22 + down * 3;
    // 짧은 까만 다리와 발
    for (const s of [-1, 1]) { gell(g, 32 + s * 9, 72.5, 7.5, 6, K); gell(g, 32 + s * 10, 77, 6.5, 2.2, K); }
    // 팔로 이어지는 까만 어깨, 크고 둥근 흰 배
    gell(g, 32, 40, 23, 8.5, K);
    gell(g, 32, 56, 18.5, 19, W1); gell(g, 32, 53, 15, 16, W1);
    // 팔
    const paw = (x, y) => gell(g, x, y, 4.3, 4, K);
    const hang = s => { gaxis(g, 32 + s * 16, 51, 5, 11, -s * 3, 16, K); paw(32 + s * 14, 61.5); };
    const bent = s => { gaxis(g, 32 + s * 10.5, 45.5, 4.8, 8, -s * 12, 6, K); paw(32 + s * 3.8, 48.5); };
    const raised = s => { gaxis(g, 32 + s * 21, 31, 4.5, 10, s * 6, -18, K); paw(32 + s * 24, 21); };
    if (arm === 'idle') { hang(-1); hang(1); }
    else if (arm === 'chest') { bent(-1); bent(1); }
    else if (arm === 'hold') { if (bam) bamboo(g, 32, 56, 32, 56 - [0, 9, 16, 22][bam]); bent(-1); bent(1); }
    else if (arm === 'cross') { gaxis(g, 32, 45.5, 4.8, 16.5, 1, .22, K); gaxis(g, 32, 50, 4.8, 16.5, 1, -.22, K); paw(16.5, 48.5); paw(47.5, 46.5); }
    else if (arm === 'wave') { hang(-1); raised(1); }
    else if (arm === 'up') { raised(-1); raised(1); }
    else if (arm === 'offer') { hang(-1); gaxis(g, 58, 43, 4.5, 10.5, 18, 2, K); paw(69, 44); bamboo(g, 70, 44, 82, 42); }
    // 머리: 까만 동그란 귀, 둥글고 통통한 얼굴
    for (const s of [-1, 1]) gell(g, 32 + s * 16.5, hy - 14 + down, 6.5, 6, K);
    gell(g, 32, hy, 19, 16, W1);
    for (const s of [-1, 1]) gell(g, 32 + s * 10, hy + 6, 10, 8, W1);
    for (const x of [26, 30, 34, 38]) { let ty = 0; while (ty < g.h && !gget(g, x, ty)) ty++; gset(g, x + (x < 32 ? -1 : 1), ty - 1, W1); }
    if (paper) { const w = paper * 2.5; grect(g, 32 - w, hy + 10, w * 2, 5, '#ffffff'); grect(g, 33 - w, hy + 12, w * 2 - 2, 1, '#b8b0a4'); }
    gout(g, PB.ol);
    // 턱 아래는 연한 베이지 (사진처럼)
    for (let y = hy + 6; y < hy + 22; y++) for (let x = 10; x < 56; x++) if (gget(g, x, y) === W1 && hash(x, y) % 4 < (y - hy - 6) / 4) gset(g, x, y, PB.w2);
    gtex(g, W1, '#ede7dc', null, 17);
    gtex(g, K, PB.k2, null, 29);
    // 아래 바깥으로 처진 타원 눈 패치와 갈색 눈
    gaxis(g, 23, hy + 1, 3.9, 5.7, -.45, 1, K); gaxis(g, 41, hy + 1, 3.9, 5.7, .45, 1, K);
    for (const x0 of [24, 38]) {
      const ey = hy - 1 + down;
      if (blink) grect(g, x0 - 1, ey + 1, 3, 1, PB.lid);
      else { grect(g, x0, ey, 2, 2, '#1a0f08'); gset(g, x0 + (x0 < 32 ? 1 : 0), ey, PB.eye); gset(g, x0 + (x0 < 32 ? 0 : 1), ey, '#ffffff'); }
    }
    // 까만 코와 작은 입
    const N = PB.nose, ny = hy + 6;
    grect(g, 30, ny, 4, 1, N); grect(g, 29, ny + 1, 6, 1, N); grect(g, 30, ny + 2, 4, 1, N); grect(g, 31, ny + 3, 2, 1, N);
    gset(g, 30, ny, '#4a4550');
    if (chew) { gell(g, 32, ny + 6, 2.2, 1.6, PB.ol); gset(g, 31, ny + 6, PB.tongue); gset(g, 32, ny + 6, PB.tongue); }
    else if (down) { gset(g, 30, ny + 6, PB.mouth); gset(g, 31, ny + 5, PB.mouth); gset(g, 32, ny + 5, PB.mouth); gset(g, 33, ny + 6, PB.mouth); }
    else { gset(g, 31, ny + 4, PB.mouth); gset(g, 32, ny + 4, PB.mouth); gset(g, 30, ny + 5, PB.mouth); gset(g, 33, ny + 5, PB.mouth); }
    grect(g, 19, hy + 7, 2, 1, '#f1d3d1'); grect(g, 43, hy + 7, 2, 1, '#f1d3d1');
  });
}
// 옆모습 달리기 (96x60 격자 = 48x30칸, 오른쪽을 본다, 4프레임): 흰 몸, 어깨의 까만 띠, 까만 네 다리
function lebaoRun(f) {
  return spr('lbrun' + f, 96, 60, g => {
    const W1 = PB.w, K = PB.k, a = [0, 1, 0, -1][f], bob = f % 2 ? -1 : 0;
    const leg = (x, sw, c) => { gaxis(g, x + sw * 3, 48, 4.4, 9, sw * 4, 16, c); gell(g, x + sw * 5.5, 56, 5.5, 3, c); };
    leg(31, -a, PB.k2); leg(64, a, PB.k2);
    gell(g, 45, 36 + bob, 27.5, 16.5, W1);
    gell(g, 61.5, 35 + bob, 9.5, 17, K);
    leg(35, a, K); leg(68, -a, K);
    gell(g, 70, 12 + bob, 5.5, 5.2, K);
    gell(g, 77, 24 + bob, 15, 13, W1); gell(g, 86, 29.5 + bob, 7, 6, W1);
    gout(g, PB.ol);
    gtex(g, W1, '#ede7dc', null, 17); gtex(g, K, PB.k2, null, 29);
    gaxis(g, 81, 23 + bob, 3.6, 5, .3, 1, K);
    grect(g, 81, 21 + bob, 2, 2, '#1a0f08'); gset(g, 81, 21 + bob, '#ffffff');
    grect(g, 89, 27 + bob, 3, 1, PB.nose); grect(g, 88, 28 + bob, 4, 1, PB.nose); grect(g, 89, 29 + bob, 2, 1, PB.nose);
    grect(g, 88, 32 + bob, 2, 1, PB.mouth);
  });
}
// 누워서 낮잠 자는 러바오 (100x46 격자 = 50x23칸, 머리가 오른쪽)
function lebaoLie(b) {
  return spr('lbl' + b, 100, 46, g => {
    const W1 = PB.w, K = PB.k;
    gaxis(g, 22, 19, 4.4, 8, -.4, -1, K); gell(g, 19, 12, 4, 3.3, K);
    gell(g, 16, 35, 9, 6, K);
    gell(g, 49, 31 - b, 33, 13 + b, W1);
    gell(g, 69, 29.5, 9.5, 15, K);
    gell(g, 82, 41, 12, 4.5, K);
    gell(g, 74, 14, 4.5, 4, K); gell(g, 93, 14, 4.5, 4, K);
    gell(g, 84, 25, 14, 12, W1); gell(g, 77, 30, 7, 5.5, W1); gell(g, 90, 30, 7, 5.5, W1);
    gout(g, PB.ol);
    gtex(g, W1, '#ede7dc', null, 17); gtex(g, K, PB.k2, null, 29);
    gaxis(g, 78, 25, 3, 4.6, -.55, 1, K); gaxis(g, 89, 25, 3, 4.6, .55, 1, K);
    grect(g, 77, 24, 3, 1, PB.lid); grect(g, 87, 24, 3, 1, PB.lid);
    grect(g, 82, 30, 5, 1, PB.nose); grect(g, 83, 31, 3, 1, PB.nose); gset(g, 84, 32, PB.nose);
    gset(g, 83, 34, PB.mouth); gset(g, 85, 34, PB.mouth);
  });
}
// 누운 갓파더 (176x60 격자 = 88x30칸)
function anteaterLie() {
  return spr('antlie', 176, 60, g => {
    gpoly(g, [[52, 30], [18, 27], [0, 35], [6, 46], [30, 50], [54, 46]], P.furD);
    for (let x = 4; x < 50; x += 3) gline(g, x, 46 + (x < 14 ? -3 : 0), x - 1, 52 + hash(x, 2) % 4, P.furD);
    gell(g, 92, 38, 50, 17, P.fur); gell(g, 94, 48, 38, 6, P.furL);
    gell(g, 126, 53, 14, 5, P.furL);
    for (let k = 0; k < 3; k++) gpoly(g, [[136, 50 + k * 2], [146 + k, 52 + k], [145 + k, 56], [138, 55]], P.claw);
    gell(g, 144, 44, 11, 8, P.furL);
    gpoly(g, [[150, 40], [175, 48], [175, 52], [150, 51]], P.furL);
    gell(g, 137, 36, 3.5, 3, P.furD);
    gout(g, P.furO);
    gtex(g, P.fur, P.furD, P.furL, 15, 21); gtex(g, P.furD, '#5e4e3e', null, 13);
    stripe(g, 126, 50, 84, 24, 4.5, 6.5);
    grect(g, 172, 48, 3, 4, P.snout);
    gline(g, 140, 41, 147, 42, P.furO); grect(g, 141, 43, 5, 1, '#8d7a64'); grect(g, 142, 44, 3, 1, '#1d1714'); grect(g, 140, 46, 7, 1, '#6d5c4b');
  });
}
// 판다 흉내: 눈 둘레에 서툴게 칠한 검은 패치
function anteaterPaint(f) {
  return spr('antpaint' + f, 176, 100, g => {
    const src = anteater(f), c2 = document.createElement('canvas'); c2.width = 176; c2.height = 100;
    const x2 = c2.getContext('2d'); x2.drawImage(src, 0, 0);
    const d = x2.getImageData(0, 0, 176, 100).data;
    for (let i = 0; i < 176 * 100; i++) if (d[i * 4 + 3]) g.p[i] = '#' + ((1 << 24) | (d[i * 4] << 16) | (d[i * 4 + 1] << 8) | d[i * 4 + 2]).toString(16).slice(1);
    const bob = f % 2;
    gaxis(g, 146, 47 + bob, 5.5, 7.5, .5, 1, '#1f1c1f');
    for (const [x, y] of [[143, 55], [143, 56], [149, 55], [147, 57], [147, 58]]) gset(g, x, y + bob, '#1f1c1f');
    grect(g, 144, 45 + bob, 4, 2, '#efe8da'); gset(g, 145, 46 + bob, '#1d1714'); gset(g, 146, 46 + bob, '#1d1714');
  });
}

// ---------- 소품
function oven() {
  return spr('oven', 96, 100, g => {
    grect(g, 64, 0, 12, 30, '#9e4f36');
    gell(g, 48, 58, 44, 40, '#c46a4a'); grect(g, 4, 58, 88, 42, '#c46a4a');
    gell(g, 48, 74, 19, 16, '#3a1a12'); grect(g, 29, 74, 38, 20, '#3a1a12');
    gout(g, P.ink);
    for (let y = 30; y < 100; y += 7) for (let x = 0; x < 96; x++) if (gget(g, x, y) === '#c46a4a') gset(g, x, y, '#9e4f36');
    for (let y = 33; y < 100; y += 7) for (let x = ((y / 7) % 2) * 6; x < 96; x += 12) if (gget(g, x, y) === '#c46a4a') for (let j = 0; j < 6; j++) if (gget(g, x, y + j) === '#c46a4a') gset(g, x, y + j, '#9e4f36');
    gell(g, 48, 88, 14, 5, '#ff9a3c'); gell(g, 48, 90, 8, 3, '#ffd36b');
  });
}
const loaf = () => spr('loaf', 22, 14, g => { gell(g, 11, 8, 10, 6, '#c9803a'); gell(g, 11, 6, 8, 3.5, '#e8ad5c'); gout(g, P.ink); gline(g, 7, 6, 9, 4, '#c9803a'); gline(g, 12, 6, 14, 4, '#c9803a'); });
const bamSpr = () => spr('bamspr', 44, 16, g => { bamboo(g, 2, 8, 34, 8); gout(g, P.ink); });
// 나무 상자: open 0이면 닫힘, 1이면 앞판이 바닥으로 넘어감
function crateBack(cx, bot) {
  box(cx - 30, bot - 50, 60, 50, '#b98a55', P.woodD);
  R(cx - 27, bot - 47, 54, 45, '#4a3322'); R(cx - 27, bot - 47, 54, 3, '#3a271a');
}
function crateFront(cx, bot, open, t = 0) {
  const h = Math.round(50 * (1 - open));
  if (h > 2) {
    const y = bot - h;
    box(cx - 30, y, 60, h, '#c99a62', P.woodD);
    for (let yy = y + 8; yy < bot - 2; yy += 8) R(cx - 29, yy, 58, 1, '#a07542');
    if (h > 40) {
      pline(cx - 27, y + 3, cx + 27, bot - 3, '#a07542', 1.5); pline(cx + 27, y + 3, cx - 27, bot - 3, '#a07542', 1.5);
      box(cx - 26, y + 9, 52, 20, P.paper, P.ink);
      text('취급주의: 판다', cx, y + 10, { f: F.s, a: 'center', c: P.redD });
      text('위아래 없음 ↑↓', cx, y + 19, { f: F.s, a: 'center' });
    }
  }
  if (open > .5) { R(cx - 32, bot, 64, Math.round(5 * open), '#c99a62'); R(cx - 32, bot + Math.round(5 * open), 64, 1, P.woodD); }
}
function wallSign(x, y, t) {
  const k = t < .25 ? .6 + t * 1.6 : 1;
  ctx.save(); ctx.translate(x + 50, y + 18); ctx.scale(k, k); ctx.rotate(-.03);
  box(-50, -18, 100, 36, '#fff8e0', P.woodD); R(-3, -20, 6, 3, P.red);
  text('판다 면제 조항', 0, -15, { f: F.b, a: 'center', c: P.redD });
  text('제1조: 판다는 귀엽다.', 0, 1, { f: F.m, a: 'center' });
  ctx.restore();
}
function stall(x, bot) {
  R(x - 30, bot - 22, 60, 5, P.wood); R(x - 28, bot - 17, 4, 17, P.woodD); R(x + 24, bot - 17, 4, 17, P.woodD);
  for (let i = 0; i < 4; i++) { box(x - 26 + i * 13, bot - 30, 11, 9, P.paper, P.ink2); blit(disc(2, PB.k), x - 23 + i * 13, bot - 28); }
  R(x - 2, bot - 68, 3, 40, P.woodD);
  box(x - 34, bot - 84, 68, 20, '#fff0f4', P.pinkD);
  text('러바오 발바닥 사진', x, bot - 83, { f: F.s, a: 'center', c: P.pinkD });
  text('한 장 ₩24,000', x, bot - 74, { f: F.s, a: 'center', c: P.pinkD });
}
function door(x, bot) {
  box(x, bot - 80, 34, 80, P.woodD, P.ink); R(x + 4, bot - 76, 26, 76, P.wood);
  R(x + 7, bot - 70, 20, 26, P.woodL); R(x + 7, bot - 38, 20, 32, P.woodL); blit(disc(1, P.gold), x + 24, bot - 44);
  box(x + 6, bot - 92, 22, 11, P.red, P.ink); text('퇴근', x + 17, bot - 91, { f: F.s, a: 'center', c: P.paper });
}


// ---------- 소리 더하기
Object.assign(SFX, {
  munch() { noise(.06, { f: 1800, q: 2, v: .14 }); noise(.05, { dt: .09, f: 1400, q: 2, v: .1 }); },
  crunch() { noise(.08, { f: 2600, q: 4, v: .22 }); tone(320, .05, { v: .06 }); },
  thud() { tone(90, .28, { w: 'sine', to: 40, v: .6 }); noise(.16, { f: 300, ft: 'lowpass', v: .3 }); },
  creak() { tone(190, .5, { w: 'sawtooth', to: 120, v: .05 }); },
  rumble(d) { noise(d, { f: 160, ft: 'lowpass', v: .2 }); },
  knock() { tone(170, .08, { w: 'sine', v: .45 }); noise(.05, { f: 600, v: .16 }); },
  cash() { tone(1568, .08, { v: .08 }); tone(2093, .25, { dt: .08, w: 'triangle', v: .1 }); },
  zzz() { tone(300, .5, { w: 'sine', to: 200, v: .05 }); },
  sparkle() { ['E6', 'G6', 'B6', 'E7'].forEach((n, i) => tone(hz(n), .15, { dt: i * .06, w: 'triangle', v: .06 })); },
});
Object.assign(CH, { D: ['D3', 'A2', ['F#3', 'A3']], Em: ['E3', 'B2', ['G3', 'B3']] });
function addSong(k, s) { s.lead = s.lead.split(' '); if (s.bars) s.bars = s.bars.split(' '); SONG[k] = s; }
// 러바오 테마: G장조 5음 음계, 목탁 같은 똑딱
addSong('bao', { bpm: 104, lead: 'G4 A4 B4 D5 E5 . D5 B4 A4 . G4 A4 B4 . . . D5 E5 G5 E5 D5 B4 A4 . G4 A4 B4 D5 A4 . G4 .', bars: 'G G Em Em C C D G', lw: 'triangle', lv: .08, pad: true, block: true });
addSong('dusk', { bpm: 66, lead: 'E5 . . D5 B4 . . . A4 . B4 . G4 . . . E5 . . G5 A5 . . . G5 . E5 . D5 . . .', bars: 'C C G G Am Am F G', lw: 'sine', lv: .08, pad: true });

