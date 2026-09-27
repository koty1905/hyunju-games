// ---------- 방 배경
const SKY = { dawn: ['#9fb7e8', '#ffd3b0'], day: ['#8fd0ff', '#dff3ff'], sunset: ['#ff8f6b', '#ffd49a'], eve: ['#3a3f7a', '#6b5b9a'] };
function win(x, y, w, h, sky) {
  const [a, b] = SKY[sky];
  R(x - 3, y - 3, w + 6, h + 6, P.woodD);
  for (let i = 0; i < 6; i++) R(x, y + i * h / 6, w, h / 6 + .5, mixHex(a, b, i / 5));
  if (sky === 'sunset') blit(disc(6, '#ffdf8a'), x + w * .6 - 6, y + h * .62 - 6);
  if (sky === 'dawn') blit(disc(5, '#fff1c9'), x + w * .3 - 5, y + h * .72 - 5);
  if (sky === 'day') { R(x + 6, y + 10, 14, 4, '#ffffff'); R(x + 9, y + 7, 8, 3, '#ffffff'); }
  R(x + w / 2 - 1, y, 2, h, P.woodD); R(x, y + h / 2 - 1, w, 2, P.woodD);
  R(x - 5, y + h + 3, w + 10, 4, P.wood);
  for (let i = 0; i < 4; i++) blit(disc(2, [P.pink, P.gold, P.red, P.pink][i]), x + 2 + i * (w - 4) / 3 - 2.5, y + h - 1);
}
function room(sky, o = {}) {
  R(0, 0, W, 112, P.wall);
  for (let x = 0; x < W; x += 24) R(x, 12, 1, 68, P.wallD);
  R(0, 80, W, 32, P.wood); for (let x = 0; x < W; x += 12) R(x, 82, 1, 30, P.woodD);
  R(0, 80, W, 2, P.woodL); R(0, 0, W, 7, P.woodD);
  for (let x = 0; x < W; x += 16) { const c = [P.red, P.cr, P.pink, P.gold][(x / 16) % 4]; blit(spr('flag' + c, 12, 12, g => gpoly(g, [[0, 0], [12, 0], [6, 11]], c)), x + 2, 7); }
  if (!o.noWin) { win(34, 22, 50, 42, sky); win(236, 22, 50, 42, sky); }
  R(0, 112, W, 68, P.floor);
  for (let y = 120; y < H; y += 10) R(0, y, W, 1, P.floorD);
  for (let y = 112; y < H; y += 10) for (let x = ((y - 112) / 10 % 2) * 20; x < W; x += 40) R(x, y, 1, 9, P.floorD);
  R(0, 112, W, 2, P.woodD);
  if (sky === 'sunset') { ctx.globalAlpha = .14; R(0, 0, W, H, '#ff9a4a'); ctx.globalAlpha = 1; }
}

// ---------- 등장인물 그리기 도우미
const PH = { alps: 0, sister: 1.3, seraphina: 2.1, rosemarira: 3.4, rosie: 4.2, clerk: 5.1, clerk2: 5.9, rira: 0.7, rira2: 2.7 };
function drawR(kind, x, fy, o = {}) {
  const ph = PH[o.id || kind] || 0;
  const ear = o.flap ? Math.sin(T * 30 + ph) : Math.sin(T * 2 + ph) * .34;
  const blink = ((T * .7 + ph) % 3.1) < .1;
  const hop = o.hop ? -Math.abs(Math.sin(T * 8 + ph)) * 3 : 0;
  const k = kind === 'rira2' ? 'rira' : kind, mood = o.mood || (kind === 'rosemarira' ? 'st' : kind === 'seraphina' ? 'so' : 'n');
  if (o.walk) { blit(riraSide(k, Math.floor(T * 8 + ph) % 4, { ear, mood }), x - 10, fy - 23, o.face < 0); return; }
  blit(rira(k, { mood, ear, arm: o.arm || 'd', blink }), x - 10, fy - 23 + hop, o.face > 0);
}
function drawLB(x, fy, o = {}) {
  const chew = o.chew ? Math.floor(T * 5) % 2 : 0, blink = ((T * .5) % 4) < .12;
  if (o.run) { blit(lebaoRun(Math.floor(T * 10) % 4), x - 24, fy - 30, o.face < 0); return; }
  const bob = o.arm === 'up' ? -Math.abs(Math.sin(T * 7)) * 3 : 0;
  // 몸 가운데가 격자 x=32(42칸 중 16칸)이므로, 좌우를 뒤집으면 가운데가 26칸으로 옮겨 간다
  blit(lebao({ arm: o.arm, chew, blink: o.blink != null ? o.blink : blink, bam: o.bam, paper: o.paper, down: o.down }), x - (o.flip ? 26 : 16), fy - 40 + bob, o.flip);
}
function drawGF(x, fy, o = {}) {
  const f = o.walk ? Math.floor(T * 6) % 4 : 0;
  blit(o.paint ? anteaterPaint(f) : anteater(f), x - 44, fy - 50, o.face < 0);
}
function speech(x, y, s) {
  const lines = wrapChars(s, F.s, 110), w = Math.max(...lines.map(l => tw(l, F.s))) + 8, h = lines.length * 9 + 5;
  const bx = clamp(x - w / 2, 2, W - w - 2), by = Math.max(2, y - h - 4);
  box(bx, by, w, h, P.paper, P.ink);
  const tx = clamp(x - 1, bx + 3, bx + w - 5);
  R(tx, by + h - 1, 3, 2, P.paper); R(tx, by + h + 1, 2, 2, P.ink);
  lines.forEach((l, i) => text(l, bx + 4, by + 3 + i * 9, { f: F.s }));
}
function sysWin(msg, kind, t, mini) {
  const n = Math.floor(t * 24), edge = kind === 'bad' ? '#ff6b6b' : kind === 'new' ? P.gold : P.pink;
  const f = mini ? F.b : F.sys;
  let lines = [msg];
  if (!mini && tw(msg, f) > 244) { const k = msg.lastIndexOf(' ', Math.floor(msg.length * .6)); lines = [msg.slice(0, k), msg.slice(k + 1)]; }
  const w = mini ? tw(msg, f) + 20 : 260, lh = mini ? 13 : 20, h = (mini ? 22 : 30) + lines.length * lh;
  const x = mini ? clamp(mini[0] - w / 2, 2, W - w - 2) : (W - w) / 2, y = mini ? mini[1] : 56;
  R(x - 2, y - 2, w + 4, h + 4, P.ink); R(x, y, w, h, P.navy); R(x + 2, y + 2, w - 4, h - 4, P.white); R(x + 3, y + 3, w - 6, h - 6, P.navy);
  R(x + 3, y + 3, w - 6, 1, edge);
  text('SYSTEM', x + 7, y + 5, { f: F.s, c: edge });
  let left = n;
  lines.forEach((l, i) => { text(l.slice(0, Math.max(0, left)), x + w / 2, y + (mini ? 13 : 18) + i * lh, { f, a: 'center', c: P.white }); left -= l.length + 1; });
}
function tag(s) { const w = tw(s, F.m) + 12; box(6, 6, w, 15, P.navy, P.ink); text(s, 12, 8, { f: F.m, c: P.paper }); }
const on = (t, a, b) => t >= a && t < b;
const k01 = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const ez = t => t < .5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
function sparkles(cx, cy, r, n = 10) {
  for (let i = 0; i < n; i++) { const a = i / n * 6.28 + T * .8, rr = r + Math.sin(T * 3 + i) * 4; if ((Math.floor(T * 6) + i) % 3) R(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .7, 2, 2, [P.gold, P.white, P.pink][i % 3]); }
}
function zzz(x, y) { for (let i = 0; i < 3; i++) { const p = (T * .6 + i / 3) % 1; text('z', x + p * 10 + i * 2, y - p * 16, { f: p > .5 ? F.m : F.s, c: P.navyL }); } }
function card(x, y, s) { box(x - 7, y, 14, 12, P.white, P.ink); text(s, x, y + 1, { f: F.b, a: 'center', c: P.redD }); }

// ---------- 장면 (각 장면은 장면 시각 t만으로 그려진다. 소리는 cue 시각을 지날 때 한 번)
const FY = 160;
const SCENES = [
  { name: '06:00 · 빵 굽기', dur: 7.5, music: 'room', cues: [[.3, () => SFX.bell()], [2, () => SFX.pop()], [3, () => SFX.pop()], [4, () => SFX.pop()], [4.6, () => SFX.sigh()], [1, () => SFX.rira()]],
    draw(t) {
      room('dawn');
      blit(oven(), 40, FY - 56);
      const n = t > 4 ? 3 : t > 3 ? 2 : t > 2 ? 1 : 0;
      R(98, FY - 22, 40, 4, P.stoneD);
      for (let i = 0; i < n; i++) blit(loaf(), 100 + i * 12, FY - 29);
      drawR('alps', 150, FY - 4, { mood: t > 5 ? 'h' : 'n', arm: on(t, 1, 3.5) ? 'u' : 'd', face: -1 });
      drawGF(220, FY + 8, { face: -1 });
      tag('06:00 · 근무 2일차');
      if (on(t, 1, 3.6)) speech(150, FY - 30, '여섯 시 정각이에요, 갓파더님!');
      if (on(t, 4.4, 5.6)) speech(200, FY - 44, '……(하품)');
      if (on(t, 5.4, 7.5)) speech(150, FY - 30, '빵은 여섯 시에 구워야 제맛이죠.');
    } },
  { name: '07:00 · 판다 배달', dur: 9, music: 'room', cues: [[.2, () => SFX.rumble(3.2)], [3.5, () => SFX.thud()], [4.2, () => SFX.rira()], [7, () => SFX.stamp()]],
    draw(t) {
      room('day');
      const cx = lerp(390, 210, ez(k01(t, 0, 3.5)));
      crateBack(cx, FY); crateFront(cx, FY, 0);
      const pushing = t < 3.5;
      drawR('rira', cx + 38, FY - 2, { walk: pushing, face: -1, arm: 'u' });
      drawR('rira2', cx + 52, FY + 2, { walk: pushing, face: -1, arm: 'u' });
      const clx = t < 4 ? cx + 44 : lerp(cx + 44, 110, ez(k01(t, 4, 5)));
      if (t >= 3.5) drawR('clerk', t < 4 ? clx : clx, FY + 4, { walk: on(t, 4, 5), face: -1 });
      drawGF(58, FY + 8, { face: 1 });
      if (t > 7) { blit(disc(3, '#6b4f3a'), 100, FY - 10); }
      tag('07:00 · 배달');
      if (on(t, 5, 7)) speech(110, FY - 22, '수령 서명이요! 판다 한 마리.');
      if (on(t, 7.3, 9)) speech(62, FY - 44, '……판다?');
    } },
  { name: 'VIP 도착', dur: 9, music: 'bao', cues: [[.8, () => SFX.knock()], [1.1, () => SFX.knock()], [1.6, () => SFX.creak()], [2.4, () => SFX.thud()], [2.6, () => SFX.sparkle()], [3.2, () => SFX.unlock()]],
    draw(t) {
      room('day');
      const cx = 210, open = ez(k01(t, 1.6, 2.4)), shake = on(t, .8, 1.4) ? Math.sin(t * 60) * 1.5 : 0;
      crateBack(cx + shake, FY);
      if (open > 0) drawLB(cx, FY - 3, { chew: true, bam: t > 6 ? 2 : 3, arm: on(t, 5, 6.3) ? 'wave' : 'hold' });
      crateFront(cx + shake, FY, open);
      if (t > 2.4) sparkles(cx, FY - 26, 30);
      const ids = ['alps', 'sister', 'seraphina', 'rosemarira', 'rosie', 'clerk2'];
      ids.forEach((id, i) => {
        const x = 18 + i * 20, sur = t > 2.4;
        drawR(id, x, FY + (i % 2) * 5, { flap: sur, face: 1, hop: sur && on(t, 2.4, 3.4), arm: sur && i % 2 ? 'u' : 'd' });
        if (sur && on(t, 2.4, 4)) text('!', x, FY - 34 + (i % 2) * 5, { f: F.b, a: 'center', c: P.redD, o: P.paper });
      });
      if (on(t, 3.2, 6.2)) sysWin('VIP GUEST ARRIVED.', 'new', t - 3.2);
      if (on(t, 6.5, 9)) speech(cx, FY - 46, '(우물우물)');
    } },
  { name: '신입 등록 서류', dur: 10.5, music: 'bao', cues: [[1.5, () => SFX.rira()], [3.8, () => SFX.paper()], [4.2, () => SFX.munch()], [4.8, () => SFX.munch()], [5.4, () => SFX.munch()], [6, () => SFX.munch()], [6.3, () => SFX.rira()], [8.3, () => SFX.pop()], [8.5, () => SFX.stamp()]],
    draw(t) {
      room('day', { noWin: t > 8.3 });
      if (t > 8.3) { win(34, 22, 50, 42, 'day'); wallSign(210, 16, t - 8.3); }
      const cx = 210;
      crateBack(cx, FY);
      const eating = on(t, 3.9, 6.4), paper = eating ? 3 - Math.floor(k01(t, 3.9, 6.4) * 3) : 0;
      drawLB(cx, FY - 3, { chew: eating || t > 6.4, bam: 0, arm: t < 3.6 ? 'cross' : eating ? 'chest' : 'idle', paper });
      crateFront(cx, FY, 1);
      const x2 = lerp(120, 158, ez(k01(t, 0, 1.4)));
      drawR('clerk2', x2, FY + 2, { walk: t < 1.4, face: 1, arm: t < 3.8 ? 'u' : 'd', mood: t > 6.4 ? 'n' : 'n' });
      if (t < 3.8) { box(x2 + 4, FY - 24, 10, 12, P.white, P.ink2); }
      else if (t < 3.95) { box(lerp(x2 + 4, cx - 5, k01(t, 3.8, 3.95)), FY - 26, 10, 12, P.white, P.ink2); }
      drawR('rosemarira', 70, FY + 4, { face: 1 });
      if (on(t, 1.4, 3.7)) speech(x2, FY - 28, '신입 등록 서류입니다. 여기 서명을……');
      if (on(t, 6.3, 8.3)) speech(70, FY - 26, '서류를 먹는 건 규정에 없습니다.');
      if (on(t, 8.6, 10.5)) speech(x2, FY - 28, '방금 생겼습니다.');
    } },
  { name: '줄자와 굿즈', dur: 10, music: 'bao', cues: [[.4, () => SFX.twist()], [3, () => SFX.rira()], [5.6, () => SFX.rira()], [6.4, () => SFX.cash()], [7.6, () => SFX.cash()], [8.8, () => SFX.cash()]],
    draw(t) {
      room('day'); wallSign(210, 16, 1);
      const cx = 220;
      crateBack(cx, FY); drawLB(cx, FY - 3, { chew: true, bam: 2, arm: 'hold' }); crateFront(cx, FY, 1);
      drawR('alps', 180, FY + 2, { face: 1, arm: 'u', mood: t > 3 && t < 5.5 ? 'n' : 'h' });
      const len = 32 * ez(k01(t, .4, 2.6));
      for (let x = 0; x < len; x += 3) R(188 + x, FY - 17 + Math.sin((x / 32) * 3.14) * 3, 2, 1.5, x % 6 ? P.gold : P.goldD);
      if (t > 2.6 && t < 5.5) text('?', 238, FY - 40, { f: F.b, c: P.redD, o: P.paper });
      stall(70, FY - 2);
      drawR('rosie', 52, FY + 4, { face: 1, mood: 'h', arm: t > 5.6 ? 'u' : 'd' });
      const q = Math.floor(k01(t, 6, 9.4) * 3);
      ['rira', 'rira2', 'clerk'].forEach((id, i) => drawR(id, 104 + (i - q) * 18 + (i < q ? -200 : 0), FY + 6, { face: -1, walk: on(t, 6, 9.4) }));
      if (on(t, 3, 5.5)) speech(168, FY - 26, '줄자가…… 모자라요.');
      if (on(t, 5.6, 10)) speech(52, FY - 26, '발바닥 사진 한 장에 24,000원! 사인은 따로예요.');
    } },
  { name: '대나무 껍질 벗기기', dur: 10.5, music: 'room', cues: [[1, () => SFX.crunch()], [1.4, () => SFX.munch()], [2.2, () => SFX.crunch()], [2.6, () => SFX.munch()], [3.4, () => SFX.crunch()], [3.8, () => SFX.munch()], [4.6, () => SFX.crunch()], [5, () => SFX.munch()], [6, () => SFX.poof()], [6.8, () => SFX.good()], [7.5, () => SFX.zzz()], [9, () => SFX.zzz()]],
    draw(t) {
      room('day');
      const lie = t > 6;
      const peel = Math.min(4, Math.floor((t - .2) / 1.2)), eat = Math.min(4, Math.floor((t - .6) / 1.2));
      if (!lie) drawLB(220, FY - 3, { chew: true, bam: 3, arm: (t % 1.2) < .5 ? 'hold' : 'chest' });
      else { blit(lebaoLie(Math.floor(T * 1.5) % 2), 196, FY - 23); zzz(240, FY - 30); }
      drawGF(90, FY + 8, { face: 1 });
      if (!lie && (t % 1.2) > .4 && (t % 1.2) < .9) blit(bamSpr(), 152, FY - 22);
      box(84, 26, 152, 16, P.paper, P.ink);
      text(`벗긴 대나무 ${Math.max(0, peel)} · 먹은 대나무 ${Math.max(0, eat)}`, W / 2, 29, { f: F.m, a: 'center' });
      tag('11:00');
      if (on(t, 6.8, 10.5)) sysWin('LE BAO: SHIFT COMPLETE.', 'ok', t - 6.8, [222, FY - 60]);
      if (on(t, 8.2, 10.5)) speech(96, FY - 44, '……?');
    } },
  { name: '따라 눕기와 판다 흉내', dur: 12.5, music: 'room', cues: [[1.4, () => SFX.incomplete()], [5, () => SFX.poof()], [6.4, () => SFX.stamp()], [7, () => SFX.rira()], [9.2, () => SFX.rira()]],
    draw(t) {
      if (t < 5) {
        room('day');
        blit(lebaoLie(Math.floor(T * 1.5) % 2), 190, FY - 23); zzz(234, FY - 30);
        blit(anteaterLie(), 70, FY - 29);
        if (on(t, 1.4, 4.6)) sysWin('SHIFT INCOMPLETE.', 'bad', t - 1.4);
        return;
      }
      room('day');
      drawGF(200, FY + 8, { face: -1, paint: true });
      const judges = ['sister', 'seraphina', 'rosemarira'];
      R(18, FY - 8, 104, 6, P.wood); R(18, FY - 2, 104, 2, P.woodD);
      judges.forEach((id, i) => { const x = 36 + i * 34; drawR(id, x, FY - 8, { face: 1, arm: t > 6.4 ? 'u' : 'd' }); if (t > 6.4) card(x - 11, FY - 44, '0'); });
      tag('판다 심사');
      if (on(t, 7, 9.2)) speech(70, FY - 48, '……불합격.');
      if (on(t, 9.2, 12.5)) speech(104, FY - 48, '그건 판다가 아니라 불량 개미핥기입니다.');
      if (t < 5.3) { ctx.globalAlpha = 1 - k01(t, 5, 5.3); R(0, 0, W, H, P.white); ctx.globalAlpha = 1; }
    } },
  { name: '노을과 대나무 한 줄기', dur: 11, music: 'dusk', cues: [[2.4, () => SFX.hope()], [7, () => SFX.pop()], [7.4, () => SFX.cash()]],
    draw(t) {
      room('sunset');
      const offer = on(t, 2, 4.4);
      drawLB(206, FY - 1, { chew: t < 2 || t > 5, arm: offer ? 'offer' : t < 2 ? 'chest' : 'idle', flip: offer });
      drawGF(110, FY + 8, { face: 1 });
      if (t >= 4.4) blit(bamSpr(), 132, FY - 22);
      if (on(t, 4.8, 6.8)) speech(118, FY - 46, '…………');
      if (t > 7) {
        drawR('rosie', 164, FY + 6, { face: -1, mood: 'h', arm: 'u' });
        box(118, 64, 84, 30, P.paper, P.ink);
        text('영수증', 160, 66, { f: F.s, a: 'center', c: P.pinkD });
        text('대나무 1줄기 ₩12,000', 160, 75, { f: F.s, a: 'center' });
        text('(VIP 공급가)', 160, 84, { f: F.s, a: 'center', c: P.ink2 });
      }
      tag('16:40');
    } },
  { name: '17:00 · 퇴근하는 판다', dur: 11, music: 'bao', cues: [[.3, () => SFX.bell()], [.6, () => SFX.rumble(1.6)], [3.8, () => SFX.creak()], [4.7, () => SFX.thud()], [5.4, () => SFX.confirmed()], [8.4, () => SFX.rira()]],
    draw(t) {
      room('eve');
      const cx = 170, open = 1 - ez(k01(t, 3.8, 4.7));
      crateBack(cx, FY);
      // 17시 정각, 러바오는 스스로 뛰어서 상자로 퇴근한다
      if (t < 2.2) drawLB(lerp(330, cx, ez(k01(t, .6, 2.2))), FY + 2, { run: true, face: -1 });
      else if (open > 0) drawLB(cx, FY - 3, { arm: t < 3.8 ? 'wave' : 'idle', chew: false });
      crateFront(cx, FY, open);
      if (on(t, 2.3, 3.8)) speech(cx + 26, FY - 52, '(흔들흔들)');
      ['alps', 'sister', 'seraphina'].forEach((id, i) => drawR(id, 30 + i * 22, FY + (i % 2) * 4, { face: 1, arm: 'b', mood: 'h', flap: true }));
      ['rosemarira', 'rosie', 'clerk'].forEach((id, i) => drawR(id, 244 + i * 22, FY + (i % 2) * 4, { face: -1, arm: 'b', mood: id === 'rosemarira' ? 'st' : 'h', flap: true }));
      tag('17:00');
      if (on(t, 5.4, 8.4)) sysWin('LE BAO: DAY OFF CONFIRMED.', 'ok', t - 5.4);
      if (on(t, 8.4, 11)) { speech(52, FY - 26, '또 오세요!'); speech(266, FY - 26, '다음 주 토요일!'); }
    } },
  { name: '갓파더의 퇴근 시도', dur: 13, music: null, cues: [[2.6, () => SFX.confirmed()], [5.2, () => SFX.rira()]],
    draw(t) {
      if (t < 5) {
        room('eve');
        door(270, FY - 40);
        drawGF(lerp(90, 214, ez(k01(t, 0, 2.4))), FY + 8, { face: 1, walk: t < 2.4 });
        drawR('clerk', 256, FY - 36 + 23 + 4, { face: -1 });
        tag('17:05');
        if (on(t, 2.6, 5)) sysWin("TOMORROW'S SHIFT CONFIRMED.", 'ok', t - 2.6);
        return;
      }
      if (t < 8.6) {
        for (let i = 0; i < 9; i++) R(0, i * 20, W, 20, mixHex('#ffe3ea', '#fff6e6', i / 8));
        sparkles(W / 2, 96, 90, 14);
        blit(rira('rosie', { mood: 'h', ear: Math.sin(T * 20), arm: 'b' }), W / 2 - 50, 46 + (Math.sin(T * 8) > .5 ? -1 : 0), false, 5);
        if (t > 5.4) speech(W / 2 + 90, 48, '다음 주 토요일에 봬요, 갓파더님!');
        return;
      }
      R(0, 0, W, H, '#3b2f28');
      for (let i = 0; i < 8; i++) R(0, i * 22, W, 1, '#43362e');
      blit(anteaterFace(on(t, 11.2, 11.35)), W / 2 - 75, H - 138, false, 3);
    } },
  { name: '매주 토요일', dur: 8, music: 'box', cues: [[1, () => SFX.paper()], [2.6, () => SFX.rira()]],
    draw(t) {
      room('eve');
      const cx = 160;
      crateBack(cx, FY); crateFront(cx, FY, 0);
      blit(disc(3, '#2a1d14'), cx + 14, FY - 14);
      if (t > 2.4) { const wv = Math.sin(T * 7) * 1.5; blit(disc(3, PB.k), cx + 15 + wv, FY - 19); blit(disc(1, PB.pad), cx + 17 + wv, FY - 16); for (let i = 0; i < 3; i++) R(cx + 16 + i * 1.5 + wv, FY - 18, 1, 1, PB.pad); }
      const k = ez(k01(t, .8, 1.6));
      if (k > 0) {
        ctx.save(); ctx.translate(cx, 44); ctx.scale(.4 + k * .6, .4 + k * .6); ctx.rotate(.04);
        box(-70, -24, 140, 48, '#fff8e0', P.woodD); R(-3, -26, 6, 3, P.red);
        text('러바오 정기 방문', 0, -20, { f: F.b, a: 'center', c: P.redD });
        text('매주 토요일', 0, -4, { f: F.m, a: 'center' });
        text('전담 매니저: 갓파더', 0, 9, { f: F.m, a: 'center', c: P.navyL });
        ctx.restore();
      }
      if (t > 4.4) text('— 다음 주 토요일에 계속 —', W / 2, 165, { f: F.m, a: 'center', c: P.paper, o: P.ink });
    } },
];
