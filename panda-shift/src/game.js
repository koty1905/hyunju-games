// 판다 면제 조항 — 게임판 (리라네 근무표 · 토요일 VIP 편)
// 공통 그림·소리는 panda-clause/src/common.js (퇴근 불가에서 옮겨 옴)와 panda-clause/src/panda.js (러바오)를 함께 이어 붙여 쓴다.

// ---------- 저장 (토요일 주차와 소리 설정)
const KEY = 'panda-shift-v1';
Object.assign(G, { week: 1 });
try { const s = localStorage.getItem(KEY); if (s) Object.assign(G, JSON.parse(s)); } catch (e) { /* 저장소를 못 쓰면 1주차부터 */ }
function save() { try { localStorage.setItem(KEY, JSON.stringify(G)); } catch (e) { /* 무시 */ } }

// ---------- 소품 (역: 스테이션)
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
function doorSpr() {
  return spr('door', 64, 156, g => {
    grect(g, 0, 0, 64, 156, P.woodD); grect(g, 6, 8, 52, 148, P.wood);
    grect(g, 12, 20, 40, 50, P.woodL); grect(g, 12, 82, 40, 60, P.woodL);
    grect(g, 14, 22, 36, 46, P.wood); grect(g, 14, 84, 36, 56, P.wood);
    gell(g, 49, 80, 3, 3, P.gold);
    gout(g, P.ink);
  });
}
// 알프스 리라의 키재기 판과 줄자
function measureSpr() {
  return spr('measure', 44, 100, g => {
    grect(g, 8, 0, 26, 92, P.woodL); grect(g, 4, 92, 34, 8, P.woodD);
    gell(g, 34, 84, 9, 9, P.gold); gell(g, 34, 84, 4, 4, P.goldD);
    gout(g, P.ink);
    for (let y = 4; y < 90; y += 6) grect(g, 9, y, y % 12 === 4 ? 10 : 5, 1, P.ink2);
    grect(g, 28, 84, 1, 12, P.gold);
  });
}
// 대나무 더미와 수레
function bambooSpr(n = 5) {
  return spr('bamboopile' + n, 96, 56, g => {
    grect(g, 4, 30, 52, 16, P.wood); grect(g, 4, 30, 52, 3, P.woodL);
    gell(g, 14, 48, 7, 7, P.woodD); gell(g, 46, 48, 7, 7, P.woodD); gell(g, 14, 48, 3, 3, P.woodL); gell(g, 46, 48, 3, 3, P.woodL);
    gline(g, 56, 34, 70, 22, P.woodD, 2);
    for (let i = 0; i < n; i++) bamboo(g, 60 + i * 5, 54, 64 + i * 6, 8 + (i % 2) * 6);
    for (let i = 0; i < 3; i++) bamboo(g, 8 + i * 12, 30, 20 + i * 12, 14 + i * 2);
    gout(g, P.ink);
  });
}
// 사인회 줄: 기둥 두 개와 빨간 줄
function lineSpr() {
  return spr('line', 90, 64, g => {
    for (const x of [8, 80]) { grect(g, x, 22, 4, 38, P.gold); gell(g, x + 2, 60, 7, 3, P.goldD); gell(g, x + 2, 20, 4, 4, P.gold); }
    gout(g, P.ink);
    for (let x = 12; x < 80; x++) gset(g, x, 24 + Math.round(Math.sin((x - 12) / 68 * Math.PI) * 8), P.red);
    for (let x = 12; x < 80; x++) gset(g, x, 25 + Math.round(Math.sin((x - 12) / 68 * Math.PI) * 8), P.redD);
  });
}
// 낮잠 매트와 베개
function matSpr() {
  return spr('mat', 96, 26, g => {
    gpoly(g, [[8, 8], [88, 8], [94, 24], [2, 24]], '#8ec07a');
    for (let x = 10; x < 90; x += 6) gline(g, x, 9, x - 3, 23, '#6fa35c');
    gell(g, 80, 8, 12, 6, '#f3ead8'); gell(g, 80, 7, 9, 3, '#fbf6ea');
    gout(g, P.ink);
  });
}
// 포토존 판넬과 삼각대 사진기
function photoSpr() {
  return spr('photo', 76, 100, g => {
    grect(g, 2, 0, 56, 78, '#fff0f4'); grect(g, 2, 0, 56, 5, '#8ec07a'); grect(g, 2, 73, 56, 5, '#8ec07a');
    grect(g, 2, 0, 5, 78, '#8ec07a'); grect(g, 53, 0, 5, 78, '#8ec07a');
    for (const [x, y] of [[18, 30], [34, 24], [42, 44], [22, 52]]) gell(g, x, y, 3, 3, P.pink);
    gline(g, 66, 58, 58, 98, P.ink2, 2); gline(g, 66, 58, 74, 98, P.ink2, 2); gline(g, 66, 58, 66, 98, P.ink2, 2);
    grect(g, 60, 48, 14, 10, '#3b3b44'); gell(g, 62, 53, 3, 3, '#6fb3e8');
    gout(g, P.ink);
  });
}
const STS = {
  crate: { x: 52, w: 120, h: 100, paint: s => { crateBack(s.x, ST_Y); if (LB.state === 'crate' && s.open > .05) drawLB(s.x, ST_Y - 2); crateFront(s.x, ST_Y, s.open); } },
  desk: { x: 124, w: 92, h: 72, draw: () => deskSpr() },
  measure: { x: 192, w: 44, h: 100, draw: () => measureSpr() },
  bamboo: { x: 258, w: 96, h: 56, draw: () => bambooSpr(DONE.has('cart') ? 5 : DONE.has('peel') ? 1 : 3) },
  stall: { x: 332, w: 72, h: 100, paint: s => stall(s.x, ST_Y) },
  line: { x: 402, w: 90, h: 64, draw: () => lineSpr() },
  mat: { x: 468, w: 96, h: 26, draw: () => matSpr() },
  photo: { x: 534, w: 76, h: 100, draw: () => photoSpr() },
  door: { x: 606, w: 64, h: 156, draw: () => doorSpr() },
};
for (const id in STS) Object.assign(STS[id], { id, vis: true, pop: 1, newT: 0, open: 0, openT: 0 });
const ROOM_W = 640, FLOOR = 112, ST_Y = 128, RIRA_Y = 136, PL_Y = 174, LB_Y = 152;

// ---------- 리라들
const NAMES = { alps: '알프스 리라', sister: '시스터 리라', seraphina: '세라피나', rosemarira: '로즈마리라', rosie: '로지', clerk: '문지기 리라', clerk2: '행정 리라' };
const MOOD0 = { rosemarira: 'st', seraphina: 'so' };
const RIRAS = {};
function mkRira(id, x) { RIRAS[id] = { id, kind: id, x, tx: x, home: x, face: -1, vis: true, bub: null, bubT: 0, hop: 0, hopV: 0, flap: 0, flapT: rnd(1, 5), blinkT: rnd(1, 4), blink: 0, mood: MOOD0[id] || 'n', moodT: 0, walkT: 0, ph: rnd(0, 6), popT: 1 }; }
mkRira('clerk2', 150); mkRira('alps', 214); mkRira('rosemarira', 290); mkRira('rosie', 364);
mkRira('clerk', 436); mkRira('sister', 502); mkRira('seraphina', 574);

// ---------- 러바오 (방 안을 돌아다니는 VIP)
// state: crate 상자 안 · stand 서서 대나무 · walk 걸어가는 중 · nap 낮잠 · photo 포토존 · gone 퇴근
const LB = { x: 52, tx: 52, state: 'crate', next: 'stand', face: 1, idleT: 0, napT: 0, pin: null, done: 0, miniT: 0, bub: null, bubT: 0, wave: 0 };
const LB_SPOT = { stand: 296, nap: 468, photo: 534, share: 476, crate: 52 };
function lbGo(state) { LB.next = state; LB.tx = LB_SPOT[state]; LB.state = Math.abs(LB.tx - LB.x) > 1 ? 'walk' : state; if (LB.state === 'nap') lbNap(); }
function lbNap() { LB.napT = 0; LB.done++; LB.miniT = 3; SFX.good(); }
function lbSay(s, t = 2) { LB.bub = s; LB.bubT = t; }
function updateLB(dt) {
  LB.miniT -= dt; LB.bubT -= dt; if (LB.bubT <= 0) LB.bub = null; LB.wave = Math.max(0, LB.wave - dt);
  if (LB.state === 'walk') {
    const d = LB.tx - LB.x;
    if (Math.abs(d) < 1.5) { LB.x = LB.tx; LB.state = LB.next; if (LB.state === 'nap') lbNap(); }
    else { LB.x += Math.sign(d) * 48 * dt; LB.face = Math.sign(d); }
    return;
  }
  if (STAGE !== 'work' || SCR || MG) return;
  // 고정된 자리가 있으면 그리로, 없으면 대나무 곁과 낮잠 매트를 오간다
  if (LB.pin) { if (LB.state !== LB.pin || Math.abs(LB.x - LB_SPOT[LB.pin]) > 1.5) lbGo(LB.pin); return; }
  if (LB.state === 'nap') { LB.napT += dt; if (LB.napT > 9) lbGo('stand'); }
  else if (LB.state === 'stand' || LB.state === 'photo') {
    LB.idleT += dt;
    if (LB.idleT > 16) { LB.idleT = 0; lbGo('nap'); }
    else if (Math.random() < dt * .08) lbSay(pick(['(우물우물)', '(오독오독)', '……']), 1.6);
  }
}
function drawLB(x, fy) {
  const chew = Math.floor(T * 5) % 2, blink = ((T * .5) % 4) < .12;
  if (LB.state === 'walk') { blit(lebaoRun(Math.floor(T * 10) % 4), x - 24, fy - 30, LB.face < 0); return; }
  if (LB.state === 'nap') { blit(lebaoLie(Math.floor(T * 1.5) % 2), x - 25, fy - 23); zzz(x + 22, fy - 28); return; }
  const arm = LB.wave > 0 || LB.state === 'photo' && Math.sin(T * 2) > .3 ? 'wave' : LB.state === 'share' ? 'chest' : 'hold';
  blit(lebao({ arm, chew: arm === 'hold' ? chew : 0, blink, bam: 3 }), x - 16, fy - 40);
}
function zzz(x, y) { for (let i = 0; i < 3; i++) { const p = (T * .6 + i / 3) % 1; text('z', x + p * 10 + i * 2, y - p * 16, { f: p > .5 ? F.m : F.s, c: P.navyL }); } }

// ---------- 업무
const TASKS = {
  form: { st: 'desk', sup: 'clerk2', eng: 'form', name: '신입 등록 서류 받기', pay: 3000, o: { n: 3 },
    lines: ['VIP 신입 등록입니다. 서명만 받으세요.', '……또 드셨습니까?', '서류는 음식이 아닙니다.'], ok: '방금 조항이 생겼습니다. 판다는 귀엽다. 이상.' },
  tape: { st: 'measure', sup: 'alps', eng: 'tape', name: 'VIP 치수 재기', pay: 8000, o: {},
    lines: ['멜빵바지를 맞춰 드릴 거예요!', '꾹 누르고 끝까지 감아요!', '둘레가…… 어디까지죠?'], ok: '측정 불가! 귀여움이 줄자보다 커요.' },
  peel: { st: 'bamboo', sup: 'rosemarira', eng: 'peel', name: '대나무 껍질 벗기기', pay: 15000, o: { goal: 5 },
    lines: ['결을 따라 벗기세요.', '벗기는 속도가 먹는 속도보다 느리군요.', '다섯 줄기를 쌓아 두는 게 목표입니다.'], ok: '다섯 줄기 확보. ……방금 네 줄기가 됐군요.' },
  cart: { st: 'bamboo', sup: 'rosemarira', eng: 'cart', name: '대나무 재고 보충', pay: 20000, o: { need: 26 },
    lines: ['VIP께서 수레에 타셨습니다.', '밀어요. 규정입니다.', '멈추면 뒤로 굴러갑니다.'], ok: '재고 보충 완료. 운임은 청구하지 않겠습니다. 이번만.' },
  paw: { st: 'stall', sup: 'rosie', eng: 'paw', name: '굿즈 발도장 받기', pay: 120000, o: { n: 5 },
    lines: ['발을 들 때 찍어요!', '한 장에 24,000원이에요!', '갓파더님 얼굴 도장은 안 팔려요.'], ok: '발도장 다섯 장! 벌써 완판이에요!' },
  queue: { st: 'line', sup: 'clerk', eng: 'queue', name: '사인회 줄 관리', pay: 30000, o: { n: 5 },
    lines: ['번호표 순서대로요!', '새치기는 규정 위반이에요.', '사인은 발도장으로 대신해요.'], ok: '줄 정리 끝! 사인회 대기 시간은 세 시간이에요.' },
  sweep: { st: 'mat', sup: 'sister', eng: 'sweep', name: '낮잠 자리 청소', pay: 9000, o: { n: 8, bpm: 92 },
    lines: ['빗자루는 박자에 맞춰서.', '청결도 수행입니다.', '대나무 부스러기가 많군요.'], ok: '정갈하군요. ……벌써 누우셨네요.' },
  roll: { st: 'photo', sup: 'rosie', eng: 'roll', name: '자는 러바오 포토존으로 모시기', pay: 48000, o: {},
    lines: ['깨우면 안 돼요! 살살 밀어요.', '자는 모습이 제일 잘 팔려요!', '뒤척이면 다시 밀어요.'], ok: '포토존 도착! 사진 한 장에 24,000원!' },
  exempt: { st: 'desk', sup: 'clerk2', eng: 'exempt', name: '판다 면제 신청', pay: 5000, o: {},
    lines: ['면제 요건 1: 판다처럼 눕기.', '면제 요건 2: 판다처럼 보이기.', '심사는 공정합니다.'], ok: '신청서 반려. 수수료는 환불되지 않습니다.' },
  share: { st: 'mat', sup: 'rosie', eng: 'share', name: '노을과 대나무 한 줄기', pay: 12000, o: {},
    lines: ['러바오가 뭘 주려나 봐요.', '받으세요, 갓파더님.', '……'], ok: '대나무 1줄기 ₩12,000 (VIP 공급가). 급여에서 뺄게요!' },
};
const ROUNDS = [
  { tasks: ['form', 'tape', 'peel'] },
  { tasks: ['cart', 'paw', 'queue'], notice: 'VIP 굿즈 행사 참여 필수',
    lines: [['rosemarira', '대나무 재고가 바닥났습니다. 누가 다 드셨는지는 묻지 않겠습니다.'], ['rosie', '발도장 굿즈 예약이 들어왔어요!'], ['clerk', '사인회 줄이 문밖까지예요.']] },
  { tasks: ['sweep', 'roll'], notice: 'VIP 낮잠 시간 엄수', lb: 'nap',
    lines: [['sister', '낮잠 자리는 늘 깨끗해야 합니다.'], ['rosie', '자는 모습을 포토존에서 찍어야 잘 팔려요!']] },
  { tasks: ['exempt'], notice: '판다 면제 신청은 행정실로',
    lines: [['clerk2', '그렇게 퇴근하고 싶으시면, 판다 면제를 신청하시죠.'], ['seraphina', '……심사는 엄정합니다.']] },
  { tasks: ['share'], notice: '노을 뒤 VIP 배웅 필수', lb: 'share',
    lines: [['seraphina', '……해가 집니다.'], ['rosie', '러바오가 갓파더님을 찾아요!']] },
];
const TOTAL = ROUNDS.reduce((n, r) => n + r.tasks.length, 0);

// ---------- 게임 상태
let MODE = 'title', ET = 0, T = 0;
let STAGE = 'intro'; // intro: 상자가 도착하는 중 · work: 근무 중
let RD = 0; const DONE = new Set();
let money = 0, stamina = 100, clockMin = 7 * 60, roamT = 0, attempts = 0, notices = [], clause = false;
const PL = { x: 170, face: -1, walkT: 0, moving: false, auto: null, tgt: null, tgtAct: false, idleT: 0, bub: null, bubT: 0 };
const CAM = { x: 0, to: null };
let SYS = null, DLG = null, MG = null, PROMPT = null, SHAKE = 0, FLASH = 0;
let toastMsg = '', toastT = 0, tutT = 0, sel = 0, recShake = 0, leaveCD = 0;
const PARTS = [];
function toast(m) { toastMsg = m; toastT = 2.6; }
const pending = () => ROUNDS[RD].tasks.filter(t => !DONE.has(t));
const planned = () => { let n = 0; for (let i = 0; i <= RD; i++) n += ROUNDS[i].tasks.length; return n; };
const taskAt = st => pending().find(t => TASKS[t].st === st);
const half = () => 44;
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
  RD = 0; DONE.clear(); money = 0; stamina = 100; clockMin = 7 * 60; roamT = 0; attempts = 0; notices = []; clause = false;
  STAGE = 'intro'; SYS = DLG = MG = PROMPT = null; PARTS.length = 0;
  Object.assign(PL, { x: 170, face: -1, auto: null, tgt: null, bub: null });
  for (const id in STS) Object.assign(STS[id], { vis: id !== 'crate', pop: 1, newT: 0, open: 0, openT: 0 });
  for (const id in RIRAS) { const r = RIRAS[id]; Object.assign(r, { x: r.home, tx: r.home, vis: true, bub: null, mood: MOOD0[id] || 'n', hop: 0, hopV: 0 }); }
  Object.assign(LB, { x: 52, tx: 52, state: 'crate', next: 'stand', idleT: 0, napT: 0, pin: null, done: 0, miniT: 0, bub: null, wave: 0 });
  CAM.x = 0; CAM.to = null;
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
const pressW = () => () => { if (I.p) { I.p = false; return true; } return false; };
function* talk(who, s) { DLG = { who, s, n: 0 }; SFX.rira(); if (RIRAS[who]) RIRAS[who].flap = .8; yield () => !DLG; }
function* sysm(msg, kind) {
  SYS = { msg, kind, n: 0, t: 0 };
  if (kind === 'bad') { SFX.incomplete(); SHAKE = .4; } else if (kind === 'new') SFX.unlock(); else SFX.confirmed();
  yield () => !SYS;
}
function camFocus(x) { CAM.to = clamp(x - W / 2, 0, ROOM_W - W); }

function* scriptIntro() {
  resetDay(); MODE = 'play'; playTrack('room');
  yield wait(.8);
  SFX.bell(); bubble('pl', '……토요일인데.', 2.4);
  yield wait(2);
  // 취급주의 상자 도착
  STS.crate.vis = true; STS.crate.pop = 0; SFX.thud(); SHAKE = .3; puff(STS.crate.x, ST_Y - 8, 18);
  bubble('clerk2', '취급주의 화물입니다. 위아래 없음.', 2.4);
  yield wait(1.6);
  SFX.knock(); yield wait(.35); SFX.knock(); yield wait(.6);
  STS.crate.openT = 1; SFX.creak();
  yield wait(.9);
  SFX.thud(); SFX.sparkle(); puff(STS.crate.x, ST_Y - 30, 24, P.gold);
  for (const id in RIRAS) { const r = RIRAS[id]; r.flap = 1.2; r.hopV = -60; r.face = -1; }
  playTrack('bao');
  yield* sysm('VIP GUEST ARRIVED.', 'new');
  yield* talk('clerk2', '갓파더님, 오늘은 VIP 전담 매니저로 임명되셨습니다.');
  PROMPT = '임명장 받기';
  yield pressW();
  PROMPT = null; SFX.paper();
  yield* sysm('ROLE ASSIGNED: VIP MANAGER.', 'new');
  yield* talk('rosie', '러바오예요! 오늘 하루 잘 부탁해요!');
  LB.x = STS.crate.x; lbGo('stand');
  STAGE = 'work'; tutT = 7; roamT = 0;
}
function* scriptIncomplete() {
  attempts++;
  PL.auto = PL.x - 18;
  yield* sysm('SHIFT INCOMPLETE.', 'bad');
  const n = pending().length;
  bubble('clerk', pick([`남은 업무가 ${n}건 있어요.`, '규정입니다.', 'VIP는 면제, 갓파더님은 해당 없음.', '판다 면제 조항 참고하세요.']), 2.6);
  // 같은 순간, 러바오는 근무 완료
  yield wait(.4);
  LB.miniT = 2.6; SFX.good();
}
function* scriptUnlock() {
  attempts++;
  PL.auto = PL.x - 18;
  yield* sysm('NEW TASK UNLOCKED.', 'new');
  RD++; const rd = ROUNDS[RD];
  notices.push(rd.notice);
  LB.pin = rd.lb || null;
  for (const [who, line] of rd.lines) yield* talk(who, line);
  for (const t of rd.tasks) STS[TASKS[t].st].newT = 6;
  toast(`새 업무 ${rd.tasks.length}건 · 전체 ${planned()}건`);
}
function* scriptEnding() {
  playTrack(null); clockMin = 17 * 60;
  SFX.bell(); yield wait(.6); SFX.bell();
  bubble('clerk', '17시예요! VIP 퇴근 시간!', 2.4);
  yield wait(1);
  // 러바오는 정각에 스스로 뛰어서 상자로 퇴근한다
  camFocus(STS.crate.x + 60);
  LB.pin = 'crate'; STS.crate.openT = 1; lbGo('crate');
  yield () => LB.state === 'crate';
  LB.wave = 1.6; lbSay('(흔들흔들)', 1.6);
  yield wait(1.6);
  STS.crate.openT = 0; SFX.creak(); yield wait(.9); SFX.thud();
  playTrack('bao');
  yield* sysm('LE BAO: DAY OFF CONFIRMED.', 'ok');
  for (const id of ['alps', 'rosie', 'clerk2']) { RIRAS[id].mood = 'h'; RIRAS[id].moodT = 4; RIRAS[id].hopV = -60; bubble(id, pick(['또 오세요!', '다음 주 토요일!', '안녕히 가세요!']), 2.6); }
  yield wait(2);
  CAM.to = null; playTrack(null);
  yield wait(1);
  yield* sysm("TOMORROW'S SHIFT CONFIRMED.", 'ok');
  yield* talk('clerk', '다음 주 토요일에도 러바오 전담이세요! 정기 방문 확인서 여기요.');
  notices.push('러바오 정기 방문: 매주 토요일');
  yield wait(1);
  MODE = 'rosie'; ET = 0; SFX.rira();
  yield wait(3.8);
  MODE = 'stare'; ET = 0;
  yield wait(4.6);
  MODE = 'receipt'; ET = 0; sel = 0; playTrack('box');
}
function tryLeave() {
  PL.tgt = null; leaveCD = .8;
  if (STAGE !== 'work') return;
  if (pending().length) return run(scriptIncomplete());
  if (RD === ROUNDS.length - 1) return run(scriptEnding());
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
  playTrack(def.eng === 'share' ? 'dusk' : 'work');
}
function finishTask() {
  const id = MG.id, def = MG.def; MG = null;
  DONE.add(id); roamT = 0;
  money += def.pay; stamina = Math.max(1, stamina - 8);
  const st = STS[def.st];
  if (def.pay) floatText(st.x, ST_Y - st.h / 2 - 6, '+' + won(def.pay), P.green);
  const r = RIRAS[def.sup]; r.mood = 'h'; r.moodT = 3; r.hopV = -50;
  bubble(def.sup, def.ok, 3.4);
  if (id === 'form') { clause = true; SFX.stamp(); notices.push('판다 면제 조항 제1조: 판다는 귀엽다'); }
  if (id === 'roll') LB.pin = 'photo';
  if (id === 'sweep' && !DONE.has('roll')) LB.pin = 'nap';
  playTrack(RD === ROUNDS.length - 1 ? 'dusk' : 'bao');
  if (!pending().length) setTimeout(() => { if (MODE === 'play') bubble('clerk', RD === ROUNDS.length - 1 ? '곧 17시예요. 문으로 가 보세요.' : '다 끝났어요? 그럼 퇴근…… 해 보세요.', 3); }, 1800);
}
function updateMG(dt) {
  MG.t += dt; MG.overT = (MG.overT || 0) - dt;
  if (MG.doneT < 0) {
    MG.eng.update(dt);
    MG.lineT -= dt;
    if (MG.lineT <= 0) { MG.line = (MG.line + 1) % MG.def.lines.length; MG.lineT = 3.2; RIRAS[MG.def.sup].flap = .5; }
    if (MG.eng.done) { MG.doneT = 0; SFX.stamp(); }
  } else {
    MG.doneT += dt;
    if (MG.doneT > 1.5) finishTask();
  }
  I.p = false;
}
const bar = (x, y, w, h, v, c = P.green) => { box(x, y, w, h, P.paperD); R(x + 1, y + 1, Math.round((w - 2) * clamp(v, 0, 1) * 2) / 2, h - 2, c); };
const LBX = () => A.x + 70, LBY = () => A.y + 26; // 창 안의 러바오 (2배)
function lbPanel(o, flip) { blit(lebao(Object.assign({ blink: ((T * .5) % 4) < .12 }, o)), flip ? LBX() - 20 : LBX(), LBY(), flip, 2); }

// 서류 내밀기: 몇 번을 내밀어도 러바오가 먹는다. 세 장째에 조항이 생긴다
ENG.form = o => {
  const e = { k: 0, ph: 'give', t: 0, msg: '', msgT: 0, done: false,
    get hint() { return e.ph === 'give' ? 'Space: 서류 내밀기' : '(우물우물……)'; },
    update(dt) {
      e.msgT -= dt; e.t += dt;
      if (e.ph === 'give') { if (I.p) { e.ph = 'fly'; e.t = 0; SFX.paper(); } }
      else if (e.ph === 'fly') { if (e.t > .35) { e.ph = 'eat'; e.t = 0; } }
      else if (Math.floor(e.t * 4) !== Math.floor((e.t - dt) * 4)) SFX.munch();
      if (e.ph === 'eat' && e.t > 1.5) {
        e.k++; e.msg = ['……드셨습니다.', '또 드셨습니다.', '세 장째입니다.'][e.k - 1]; e.msgT = 1.4; e.t = 0;
        if (e.k >= o.n) e.done = true; else e.ph = 'give';
      }
    },
    draw() {
      const eating = e.ph === 'eat';
      lbPanel({ arm: e.ph === 'give' ? 'cross' : 'chest', chew: eating && Math.floor(T * 6) % 2, paper: eating ? Math.max(1, 3 - Math.floor(e.t / .5)) : 0, bam: 0 });
      const mx = LBX() + 32, my = LBY() + 33;
      if (e.ph === 'give') { box(A.x + 14, A.y + 62, 16, 20, P.white, P.ink2); for (let i = 0; i < 4; i++) R(A.x + 17, A.y + 67 + i * 3, 10, 1, P.ink2); blit(claw(), A.x + 24, A.y + 60); }
      else if (e.ph === 'fly') { const k = e.t / .35; box(lerp(A.x + 14, mx - 8, k), lerp(A.y + 62, my - 10, k), 16, 20, P.white, P.ink2); }
      text(`먹힌 서류 ${e.k} / ${o.n}`, A.x + 4, A.y + 14, { f: F.m, c: P.redD });
      if (e.msgT > 0) text(e.msg, A.x + A.w / 2, A.y + 2, { f: F.b, a: 'center', c: P.redD, o: P.paper });
    } };
  return e;
};
// 줄자 감기: 누르고 있으면 감기지만 둘레를 다 두르지 못한다
ENG.tape = () => {
  const MAX = .86;
  const e = { v: 0, msg: '', msgT: 0, done: false, hint: 'Space 누르고 있기 → 끝까지 감으면 떼기',
    update(dt) {
      e.msgT -= dt;
      if (I.h) { e.v = Math.min(MAX, e.v + dt * .45); if (Math.random() < dt * 10) SFX.twist(); }
      if (I.r) {
        if (e.v >= MAX - .001) { e.done = true; e.msg = '측정 불가!'; e.msgT = 2; }
        else { SFX.buzz(); e.msg = '더 감아요! 끝까지!'; e.msgT = 1.1; e.v = 0; }
      }
    },
    draw() {
      lbPanel({ arm: 'idle', chew: Math.floor(T * 5) % 2, bam: 0 });
      const cx = LBX() + 32, cy = LBY() + 60, rx = 22, ry = 6;
      for (let a = 0; a < e.v * Math.PI * 2; a += .09) {
        const x = cx + Math.cos(Math.PI + a) * rx, y = cy + Math.sin(Math.PI + a) * ry * (Math.sin(Math.PI + a) > 0 ? 1 : -.4) + 4;
        R(x, y, 2, 1.5, Math.floor(a * 6) % 2 ? P.gold : P.goldD);
      }
      if (e.v >= MAX - .001) text('?', cx + 26, cy - 16, { f: F.xl, c: P.redD, o: P.paper });
      bar(A.x + 6, A.y + 2, 90, 7, e.v, P.gold); text('둘레', A.x + 100, A.y + 1, { f: F.s });
      if (e.msgT > 0) text(e.msg, A.x + A.w / 2, A.y + 12, { f: F.b, a: 'center', c: P.redD, o: P.paper });
    } };
  return e;
};
// 연타로 껍질 벗기기: 세 번에 한 줄기, 러바오는 1.6초마다 한 줄기씩 먹는다
ENG.peel = o => {
  const e = { p: 0, stock: 0, eaten: 0, et: 0, bob: 0, done: false, hint: 'Space 연타: 껍질 벗기기',
    update(dt) {
      e.bob = Math.max(0, e.bob - dt * 6);
      if (I.p) { e.p++; e.bob = 1; SFX.twist(); if (e.p % 3 === 0) { e.stock++; SFX.crunch(); if (e.stock >= o.goal) e.done = true; } }
      e.et += dt;
      if (e.et > 1.6 && e.stock > 0 && !e.done) { e.et = 0; e.stock--; e.eaten++; SFX.munch(); }
    },
    draw() {
      lbPanel({ arm: 'hold', chew: Math.floor(T * 6) % 2, bam: 1 + Math.floor(e.et / .55) % 3 });
      for (let i = 0; i < e.stock; i++) blit(bamSpr(), A.x + 16, A.y + 88 - i * 6);
      blit(bamSpr(), A.x + 10, A.y + 30 - e.bob * 3); blit(claw(), A.x + 26, A.y + 26 - e.bob * 3);
      for (let i = 0; i < e.p % 3; i++) R(A.x + 12 + i * 5, A.y + 44 + (T * 20 + i * 5) % 12, 3, 1, '#b7d98a');
      text(`쌓인 대나무 ${e.stock} / ${o.goal}`, A.x + 4, A.y + 2, { f: F.b });
      text(`먹힌 대나무 ${e.eaten}`, A.x + 4, A.y + 14, { f: F.m, c: P.redD });
    } };
  return e;
};
// 연타로 수레 밀기: 러바오가 수레에 타 있어 무겁고, 멈추면 뒤로 굴러간다
ENG.cart = o => {
  const e = { v: 0, bob: 0, done: false, hint: 'Space 연타: 수레 밀기',
    update(dt) {
      e.bob = Math.max(0, e.bob - dt * 7);
      if (I.p) { e.v += 1; e.bob = 1; SFX.step(); if (e.v >= o.need) e.done = true; }
      e.v = Math.max(0, e.v - dt * 1.7);
    },
    draw() {
      const k = clamp(e.v / o.need, 0, 1), gx = A.x + 150, x = A.x + 10 + k * 96, y = A.y + 92;
      R(A.x, y + 8, A.w, 2, P.woodD);
      R(gx, y - 30, 2, 38, P.ink2); gpolyFlag(gx + 2, y - 30);
      blit(lebao({ arm: 'hold', chew: Math.floor(T * 5) % 2, bam: 3 }), x + 8, y - 44);
      R(x, y - 8, 52, 10, P.wood); R(x, y - 8, 52, 2, P.woodL);
      blit(disc(4, P.woodD), x + 4, y - 1); blit(disc(4, P.woodD), x + 38, y - 1);
      for (let i = 0; i < 3; i++) R(x + 30 + i * 5, y - 16 - i, 3, 10, '#6fae3f');
      blit(claw(), x - 30 + e.bob * 2, y - 20, true);
      bar(A.x + 6, A.y + 2, 100, 7, k, P.green); text('재고 창고까지', A.x + 110, A.y + 1, { f: F.s });
    } };
  return e;
};
function gpolyFlag(x, y) { R(x, y, 18, 9, P.red); text('창고', x + 1.5, y, { f: F.s, c: P.paper }); }
// 발을 들 때 도장 찍기: 헛치면 갓파더 얼굴에 찍힌다
ENG.paw = o => {
  const e = { k: 0, face: 0, up: 0, next: rnd(.6, 1.4), stamp: 0, msg: '', msgT: 0, done: false, hint: 'Space: 러바오가 발을 들 때',
    update(dt) {
      e.msgT -= dt; e.stamp = Math.max(0, e.stamp - dt * 4);
      if (e.up > 0) e.up -= dt; else { e.next -= dt; if (e.next <= 0) { e.up = .55; e.next = rnd(.7, 1.6); } }
      if (I.p) {
        e.stamp = 1;
        if (e.up > 0) { e.k++; e.up = 0; SFX.stamp(); if (e.k >= o.n) e.done = true; }
        else { e.face++; SFX.squish(); e.msg = '갓파더님 얼굴에 찍혔어요!'; e.msgT = 1.1; }
      }
    },
    draw() {
      lbPanel({ arm: e.up > 0 ? 'wave' : 'idle', chew: 0, bam: 0 });
      for (let i = 0; i < o.n; i++) {
        const x = A.x + 2 + i * 13, y = A.y + 88;
        box(x, y, 12, 16, P.paper, i < e.k ? P.pinkD : P.ink2);
        if (i < e.k) { blit(disc(2, PB.k), x + 3.5, y + 7); for (let j = 0; j < 3; j++) R(x + 2.5 + j * 2.5, y + 4, 1.5, 1.5, PB.k); }
      }
      blit(claw(), A.x + 8, A.y + 40 + e.stamp * 8);
      if (e.face) text(`얼굴 도장 ${e.face}`, A.x + A.w - 4, A.y + 2, { f: F.s, a: 'right', c: P.redD });
      if (e.msgT > 0) text(e.msg, A.x + A.w / 2, A.y + 14, { f: F.b, a: 'center', c: P.redD, o: P.paper });
    } };
  return e;
};
// 번호표 순서대로 들여보내기: 새치기를 막는다
ENG.queue = o => {
  const nums = [1, 2, 3, 4, 5].sort(() => Math.random() - .5), kinds = ['rira', 'alps', 'sister', 'rosemarira', 'clerk2'];
  const e = { x: 0, dir: 1, want: 1, gone: [], msg: '', msgT: 0, done: false, hint: 'Space: 다음 번호표 위에서 누르기',
    update(dt) {
      e.msgT -= dt;
      e.x += e.dir * dt * .8; if (e.x > 1) { e.x = 1; e.dir = -1; } if (e.x < 0) { e.x = 0; e.dir = 1; }
      if (I.p) {
        const i = Math.round(e.x * 4);
        if (e.gone.includes(i)) { SFX.buzz(); e.msg = '빈자리예요.'; e.msgT = .9; }
        else if (nums[i] === e.want) { e.gone.push(i); e.want++; SFX.good(); if (e.want > o.n) e.done = true; }
        else { SFX.buzz(); e.msg = '새치기 적발!'; e.msgT = 1; }
      }
    },
    draw() {
      blit(lebao({ arm: 'hold', chew: Math.floor(T * 5) % 2, bam: 2 }), A.x + A.w - 44, A.y + 2);
      text('사인석', A.x + A.w - 24, A.y + 44, { f: F.s, a: 'center', c: P.ink2 });
      for (let i = 0; i < 5; i++) {
        const x = A.x + 10 + i * 26, y = A.y + 96;
        if (e.gone.includes(i)) continue;
        blit(rira(kinds[i], { mood: 'n', ear: Math.sin(T * 3 + i) * .4 }), x - 10, y - 23);
        box(x - 5, y - 36, 10, 11, P.paper, P.ink2); text(String(nums[i]), x, y - 35, { f: F.m, a: 'center' });
      }
      const cx = A.x + 10 + e.x * 104;
      R(cx - 1, A.y + 50, 2, 6, P.redD); R(cx - 3, A.y + 50, 6, 2, P.redD);
      text(`다음 번호 ${Math.min(e.want, o.n)}`, A.x + 4, A.y + 2, { f: F.b, c: P.navyL });
      if (e.msgT > 0) text(e.msg, A.x + A.w / 2 - 20, A.y + 20, { f: F.b, a: 'center', c: P.redD, o: P.paper });
    } };
  return e;
};
// 빗자루 박자: 고리가 먼지 더미에 닿을 때
ENG.sweep = o => {
  const e = { k: 0, ph: 0, sw: 0, side: 0, msg: '', msgT: 0, done: false, hint: 'Space: 고리가 먼지에 닿을 때',
    update(dt) {
      e.msgT -= dt; e.sw = Math.max(0, e.sw - dt * 5);
      e.ph += dt * o.bpm / 60; if (e.ph >= 1) { e.ph -= 1; SFX.tick(); }
      if (I.p) {
        if (Math.min(e.ph, 1 - e.ph) < .17) { e.k++; e.sw = 1; e.side ^= 1; SFX.pour(); SFX.twist(); if (e.k >= o.n) e.done = true; }
        else { SFX.buzz(); e.msg = '먼지가 날려요.'; e.msgT = .9; }
      }
    },
    draw() {
      blit(matSpr(), A.x + 10, A.y + 84);
      const cx = A.x + 60, cy = A.y + 80, left = o.n - e.k;
      for (let i = 0; i < left; i++) R(cx - 12 + (i * 7) % 24, cy - 2 - (i % 3) * 2, 3, 2, i % 2 ? '#b7d98a' : P.woodL);
      if (!e.done) { const r = Math.round(14 + 24 * (1 - e.ph)); blit(ring(r, e.ph > .83 ? P.green : P.goldD), cx - r - .5, cy - r - .5); }
      const bx = cx + (e.side ? 8 : -24) + e.sw * (e.side ? -6 : 6);
      R(bx + 8, cy - 34, 2, 30, P.woodD); R(bx, cy - 6, 18, 5, P.gold);
      blit(lebao({ arm: 'chest', chew: 0, bam: 0 }), A.x + A.w - 46, A.y + 50);
      text(`${e.k} / ${o.n}`, A.x + A.w - 4, A.y + 100, { f: F.s, a: 'right' });
      if (e.msgT > 0) text(e.msg, cx, A.y + 2, { f: F.b, a: 'center', c: P.redD, o: P.paper });
    } };
  return e;
};
// 자는 러바오 밀기: 연타로 조금씩, 가끔 뒤척이면 밀려난다
ENG.roll = () => {
  const e = { v: 0, turn: rnd(2.5, 4), bob: 0, msg: '', msgT: 0, done: false, hint: 'Space 연타: 살살 밀기',
    update(dt) {
      e.msgT -= dt; e.bob = Math.max(0, e.bob - dt * 7);
      if (I.p) { e.v += .03; e.bob = 1; SFX.step(); if (e.v >= 1) e.done = true; }
      e.turn -= dt;
      if (e.turn <= 0) { e.turn = rnd(2.5, 4); e.v = Math.max(0, e.v - .09); e.msg = '뒤척! 다시 밀려났어요.'; e.msgT = 1.1; SFX.zzz(); }
    },
    draw() {
      const y = A.y + 92, x = A.x + 22 + e.v * 70;
      R(A.x, y + 1, A.w, 2, P.woodD);
      blit(photoSpr(), A.x + A.w - 36, y - 50);
      blit(lebaoLie(Math.floor(T * 1.5) % 2), x, y - 22); zzz(x + 44, y - 26);
      blit(claw(), x - 30 + e.bob * 2, y - 18, true);
      bar(A.x + 6, A.y + 2, 100, 7, e.v, P.pink); text('포토존까지', A.x + 110, A.y + 1, { f: F.s });
      if (e.msgT > 0) text(e.msg, A.x + A.w / 2 - 20, A.y + 16, { f: F.b, a: 'center', c: P.redD, o: P.paper });
    } };
  return e;
};
// 판다 면제 신청: 눕기 → SHIFT INCOMPLETE → 판다 분장 → 심사 0점 → 반려
ENG.exempt = () => {
  const pts = [];
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; pts.push([Math.cos(a) * 7, Math.sin(a) * 6]); }
  const e = { ph: 'lie', h: 0, t: 0, k: 0, bp: 0, blobs: [], done: false,
    get hint() { return { lie: 'Space 누르고 있기: 판다처럼 눕기', no: '……', paint: 'Space: 붓이 내려올 때 칠하기', judge: '심사 중……' }[e.ph]; },
    update(dt) {
      e.t += dt;
      if (e.ph === 'lie') { if (I.h) { e.h += dt / 1.4; if (e.h >= 1) { e.ph = 'no'; e.t = 0; SFX.incomplete(); SHAKE = .3; } } else e.h = Math.max(0, e.h - dt); }
      else if (e.ph === 'no') { if (e.t > 1.8) { e.ph = 'paint'; e.t = 0; } }
      else if (e.ph === 'paint') {
        e.bp = (e.bp + dt * 1.3) % 1;
        if (I.p) {
          const err = Math.abs(e.bp - .5) * 2, j = err * 5 + rnd(0, 1.2), [px, py] = pts[e.k];
          e.blobs.push([px + rnd(-j, j), py + rnd(-j, j), pick([2, 3])]); e.k++; SFX.squish();
          if (e.k >= pts.length) { e.ph = 'judge'; e.t = 0; }
        }
      } else if (e.ph === 'judge') {
        if ([.6, 1.1, 1.6].some(s => e.t - dt < s && e.t >= s)) SFX.stamp();
        if (e.t > 2.6) e.done = true;
      }
    },
    draw() {
      if (e.ph === 'lie' || e.ph === 'no') {
        blit(anteaterLie(), A.x + 30, A.y + 70);
        bar(A.x + 6, A.y + 102, 100, 6, e.h, P.navyL);
        if (e.ph === 'no') { box(A.x + 20, A.y + 20, 124, 28, P.navy, P.ink); text('SHIFT INCOMPLETE.', A.x + 82, A.y + 28, { f: F.b, a: 'center', c: P.white }); }
        else text('면제 요건 1: 판다처럼 눕기', A.x + 4, A.y + 2, { f: F.b, c: P.navyL });
        return;
      }
      const fx = A.x + 32, fy = A.y + 14;
      blit(anteaterFace(false), fx, fy, false, 2);
      const ex = fx + 36, ey = fy + 40;
      for (const [x, y, r] of e.blobs) blit(disc(r, PB.k), ex + x - r - .5, ey + y - r - .5);
      if (e.ph === 'paint') {
        const [px, py] = pts[e.k], dy = Math.cos(e.bp * Math.PI * 2) * 8;
        R(ex + px, ey + py - 22 + dy, 2, 16, P.woodD); R(ex + px - 1, ey + py - 8 + dy, 4, 4, PB.k);
        text('면제 요건 2: 판다처럼 보이기', A.x + 4, A.y + 2, { f: F.b, c: P.navyL });
      } else {
        ['sister', 'seraphina', 'rosemarira'].forEach((id, i) => {
          const x = A.x + 146 + (i % 2) * 10, y = A.y + 22 + i * 28;
          blit(rira(id, { mood: MOOD0[id] || 'n', arm: 'u' }), x - 10, y);
          if (e.t > .6 + i * .5) { box(x + 2, y - 2, 12, 11, P.white, P.ink); text('0', x + 8, y - 1, { f: F.b, a: 'center', c: P.redD }); }
        });
        if (e.t > 2) text('불량 개미핥기', fx + 50, fy + 88, { f: F.b, a: 'center', c: P.redD, o: P.paper });
      }
    } };
  return e;
};
// 노을과 대나무 한 줄기: 받으면 영수증이 따라온다
ENG.share = () => {
  const e = { ph: 'offer', t: 0, done: false,
    get hint() { return e.ph === 'offer' ? 'Space: 받기' : '……'; },
    update(dt) {
      e.t += dt;
      if (e.ph === 'offer' && I.p) { e.ph = 'got'; e.t = 0; SFX.hope(); }
      else if (e.ph === 'got' && e.t > 1.4) { e.ph = 'bill'; e.t = 0; SFX.cash(); }
      else if (e.ph === 'bill' && e.t > 1.6) e.done = true;
    },
    draw() {
      ctx.globalAlpha = .18; R(A.x - 2, A.y - 4, A.w + 6, A.h + 12, '#ff9a4a'); ctx.globalAlpha = 1;
      blit(lebao({ arm: e.ph === 'offer' ? 'offer' : 'idle', chew: 0, bam: 0, blink: ((T * .5) % 4) < .12 }), LBX() - 4, LBY() + 4, true, 2);
      blit(claw(), A.x + 2, A.y + 54, true);
      if (e.ph !== 'offer') blit(bamSpr(), A.x + 16, A.y + 62);
      if (e.ph === 'bill') {
        box(A.x, A.y + 2, 104, 32, P.paper, P.ink);
        text('영수증', A.x + 52, A.y + 4, { f: F.s, a: 'center', c: P.pinkD });
        text('대나무 1줄기 ₩12,000', A.x + 52, A.y + 13, { f: F.s, a: 'center' });
        text('(VIP 공급가 · 급여에서 공제)', A.x + 52, A.y + 22, { f: F.s, a: 'center', c: P.ink2 });
      }
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
const REC_BTNS = [{ x: 70, y: 144, w: 110, h: 16 }, { x: 186, y: 144, w: 64, h: 16 }];
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
  if (PL.x + half() >= STS.door.x - 24) return STS.door;
  return best;
}
function interact() {
  const s = nearSt(); if (!s) return;
  if (s.id === 'door') return tryLeave();
  if (STAGE !== 'work') return;
  const t = taskAt(s.id);
  if (t) return beginTask(t);
  if (s.id === 'crate') { lbSay('(우물우물)', 1.4); return; }
  const sup = Object.values(TASKS).find(d => d.st === s.id);
  if (sup && RIRAS[sup.sup].vis) bubble(sup.sup, pick(['여긴 끝났어요. 지금은요.', '다음 업무를 기다리세요.', 'VIP께서 쉬고 계세요.']), 1.8);
}
function updatePlayer(dt) {
  let dir = 0;
  if (PL.auto !== null) {
    const d = PL.auto - PL.x;
    if (Math.abs(d) < 1) { PL.x = PL.auto; PL.auto = null; } else { dir = Math.sign(d); PL.face = dir; }
  } else if (!SCR && !SYS && !DLG && !MG && MODE === 'play' && STAGE === 'work') {
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
    PL.x += dir * 42 * dt; PL.walkT += dt; PL.idleT = 0;
    if (Math.floor(prev * 3) !== Math.floor(PL.walkT * 3)) SFX.step();
  } else PL.idleT += dt;
  const maxX = STS.door.x - 15 - half();
  PL.x = clamp(PL.x, 30, maxX);
  // 문에 부딪히면 퇴근 시도
  if (dir > 0 && PL.auto === null && PL.x >= maxX - .1 && leaveCD <= 0 && !SCR && !SYS && !DLG && !MG && MODE === 'play') tryLeave();
  if (STAGE === 'work' && PL.idleT > 7 && !MG && !SCR) { PL.idleT = 0; bubble('pl', pick(['……', '하아……', '(판다는 좋겠다)', '(토요일인데)']), 1.8); SFX.sigh(); }
  PL.bubT -= dt; if (PL.bubT <= 0) PL.bub = null;
}
function updateRiras(dt) {
  for (const id in RIRAS) {
    const r = RIRAS[id]; if (!r.vis) continue;
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
      else { G.week++; save(); run(scriptIntro()); }
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
    for (const id in STS) { const s = STS[id]; s.pop = Math.min(1, s.pop + dt * 3); s.newT = Math.max(0, s.newT - dt); s.open += clamp(s.openT - s.open, -dt * 1.4, dt * 1.4); }
  }
  tickScript(dt);
  if (MODE === 'play' || MODE === 'title') {
    updatePlayer(dt); updateRiras(dt); updateLB(dt);
    const want = CAM.to !== null ? CAM.to : clamp(PL.x - W / 2 + PL.face * 20, 0, ROOM_W - W);
    CAM.x = lerp(CAM.x, want, 1 - Math.exp(-dt * 4));
  }
  for (const p of PARTS) { p.x += p.vx * dt; p.y += p.vy * dt; if (!p.txt) p.vy += 60 * dt; p.life -= dt; }
  for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].life <= 0) PARTS.splice(i, 1);
  // 시계: 07시에 시작해 업무 하나에 55분, 돌아다니면 4초에 1분 (다음 업무 몫을 넘지 않게, 16:59까지)
  if (MODE === 'play' && clockMin < 17 * 60) clockMin = Math.min(16 * 60 + 59, 7 * 60 + DONE.size * 55 + Math.min(Math.floor(roamT / 4), 54));
  I.p = false; I.r = false;
}

// ---------- 그리기
// 창밖: 07시 아침 → 한낮 → 17시 노을 (노을 라운드부터는 노을)
function skyCols() {
  const t = RD === ROUNDS.length - 1 || clockMin >= 17 * 60 ? 1 : clamp((clockMin - 7 * 60) / 600, 0, 1);
  if (t < .15) return [mixHex('#9fb7e8', '#8fd0ff', t / .15), mixHex('#ffd3b0', '#dff3ff', t / .15), t];
  if (t < .8) return ['#8fd0ff', '#dff3ff', t];
  const k = (t - .8) / .2; return [mixHex('#8fd0ff', '#ff8f6b', k), mixHex('#dff3ff', '#ffd49a', k), t];
}
function drawWindow(x, y, w, h) {
  const [a, b, t] = skyCols();
  R(x - 3, y - 3, w + 6, h + 6, P.woodD);
  for (let i = 0; i < 6; i++) R(x, y + i * h / 6, w, h / 6 + .5, mixHex(a, b, i / 5));
  blit(disc(5, t > .8 ? '#ffdf8a' : '#fff1c9'), x + w * (.25 + t * .5) - 5, y + h * (.75 - Math.sin(t * Math.PI) * .5) - 5);
  if (t > .1 && t < .85) { R(x + 6, y + 10, 14, 4, '#ffffff'); R(x + 9, y + 7, 8, 3, '#ffffff'); }
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
  // 벽과 징두리 판자
  R(cx, 0, W, FLOOR, P.wall);
  for (let x = Math.floor(cx / 24) * 24; x < cx + W; x += 24) R(x, 12, 1, 68, P.wallD);
  R(cx, 80, W, 32, P.wood); for (let x = Math.floor(cx / 12) * 12; x < cx + W; x += 12) R(x, 82, 1, 30, P.woodD);
  R(cx, 80, W, 2, P.woodL); R(cx, 0, W, 7, P.woodD);
  // 가랜드 (대나무 잎과 번갈아)
  for (let x = Math.floor(cx / 16) * 16; x < cx + W; x += 16) {
    const c = ['#8ec07a', P.cr, P.pink, P.gold][((x / 16) % 4 + 4) % 4];
    blit(spr('flag' + c, 12, 12, g => { gpoly(g, [[0, 0], [12, 0], [6, 11]], c); }), x + 2, 7);
  }
  // 벽 장식
  box(8, 22, 40, 44, P.paper); text('VIP 응대', 28, 25, { f: F.s, a: 'center' }); text('수칙', 28, 34, { f: F.s, a: 'center' });
  for (let i = 0; i < 5; i++) R(13, 45 + i * 4, 30 - (i % 3) * 5, 1, P.ink2);
  drawWindow(72, 22, 46, 40); drawWindow(258, 22, 46, 40);
  blit(clockSpr(clockMin), 150, 22);
  box(194, 20, 46, 50, P.goldD, P.woodD); box(197, 23, 40, 36, '#fff3d6', P.woodD);
  blit(spr('vipface', 84, 42, g => { const s = lebao({}); const c2 = s.getContext('2d').getImageData(0, 0, 84, 42).data; for (let i = 0; i < 84 * 42; i++) if (c2[i * 4 + 3]) g.p[i] = '#' + ((1 << 24) | (c2[i * 4] << 16) | (c2[i * 4 + 1] << 8) | c2[i * 4 + 2]).toString(16).slice(1); }), 201, 29);
  text('오늘의 VIP', 217, 60, { f: F.s, a: 'center', c: P.paper });
  if (clause) wallSign(310, 14, 1);
  // 퇴근 전 확인사항 게시판 (늘어난다)
  if (notices.length) {
    const nh = 13 + notices.length * 8;
    box(424, 30, 124, nh, '#fff8e0', P.woodD);
    R(484, 28, 4, 3, P.red);
    text('퇴근 전 확인사항', 486, 31, { f: F.s, a: 'center', c: P.redD });
    notices.forEach((n, i) => text(`${i + 1}. ${n}`, 428, 39 + i * 8, { f: F.s }));
  }
  // 바닥
  R(cx, FLOOR, W, H - FLOOR, P.floor);
  for (let y = FLOOR + 8; y < H; y += 10) R(cx, y, W, 1, P.floorD);
  for (let y = FLOOR; y < H; y += 10) for (let x = Math.floor(cx / 40) * 40 + ((y / 10) % 2) * 20; x < cx + W; x += 40) R(x, y, 1, 9, P.floorD);
  R(cx, FLOOR, W, 2, P.woodD);
  // 소품
  for (const id in STS) {
    const s = STS[id]; if (!s.vis) continue;
    const w = s.w / 2, h = s.h / 2;
    const k = s.pop < 1 ? 1 + Math.sin(s.pop * Math.PI) * .25 : 1, ky = s.pop < 1 ? Math.min(1, s.pop * 1.6) : 1;
    ctx.save(); ctx.translate(s.x, ST_Y); ctx.scale(k, ky); ctx.translate(-s.x, -ST_Y);
    if (s.paint) s.paint(s); else blit(s.draw(s), s.x - w / 2, ST_Y - h);
    ctx.restore();
    if (id === 'door') { box(s.x - 11, ST_Y - h + 12, 22, 11, P.red, P.ink); text('퇴근', s.x, ST_Y - h + 13, { f: F.s, a: 'center', c: P.paper }); }
    if (id === 'desk') { box(s.x + 1, ST_Y - 17, 21, 10, P.paper, P.ink); text('행정실', s.x + 11.5, ST_Y - 16, { f: F.s, a: 'center' }); }
    if (id === 'photo') text('러바오 포토존', s.x - 5, ST_Y - h + 6, { f: F.s, a: 'center', c: P.pinkD });
    if (id === 'line') text('사인회 줄', s.x, ST_Y - h - 2, { f: F.s, a: 'center', c: P.redD, o: P.paper });
    if (id === 'mat') text('VIP 낮잠 자리', s.x, ST_Y - 14, { f: F.s, a: 'center', c: '#3d6b31', o: P.paper });
    // 업무 표시: 남은 업무는 느낌표, 끝난 업무는 확인 도장
    if (STAGE === 'work' && id !== 'door' && id !== 'crate') {
      const tk = taskAt(id), anyDone = Object.keys(TASKS).some(t => TASKS[t].st === id && DONE.has(t));
      const top = id === 'stall' ? ST_Y - 92 : ST_Y - h - 14;
      const by = top + (tk ? Math.sin(T * 6) * 1.5 : 0);
      if (tk) { box(s.x - 4, by, 8, 12, P.gold, P.ink); R(s.x - 1, by + 2, 2, 5, P.ink); R(s.x - 1, by + 8, 2, 2, P.ink); if (s.newT > 0 && Math.floor(T * 4) % 2) text('NEW', s.x, by - 9, { f: F.s, a: 'center', c: P.redD, o: P.paper }); }
      else if (anyDone) { box(s.x - 7, by + 2, 14, 9, '#e6f6ea', P.green); pline(s.x - 3, by + 6, s.x - 1, by + 8, P.green, 1); pline(s.x - 1, by + 8, s.x + 3, by + 4, P.green, 1); }
    }
  }
  // 리라들
  const rs = Object.values(RIRAS).filter(r => r.vis).sort((a, b) => a.x - b.x);
  for (const r of rs) drawRira(r);
  // 러바오 (상자 밖에 있을 때)
  if (LB.state !== 'crate' && LB.state !== 'gone') drawLB(LB.x, LB_Y);
  // 갓파더
  drawPlayer();
  // 입자
  for (const p of PARTS) {
    if (p.txt) text(p.txt, p.x, p.y, { f: F.s, a: 'center', c: p.c, o: P.paper });
    else R(p.x, p.y, p.s, p.s, p.c);
  }
  // 말풍선
  for (const r of rs) if (r.bub) speech(r.x, RIRA_Y - 26 + r.hop, r.bub);
  const lbTop = LB.state === 'nap' ? LB_Y - 26 : LB.state === 'crate' ? ST_Y - 44 : LB_Y - 42;
  if (LB.bub) speech(LB.x, lbTop, LB.bub);
  if (LB.miniT > 0 && lbOnScreen()) {
    const s = 'LE BAO: SHIFT COMPLETE.', w = tw(s, F.s) + 10, x = clamp(LB.x - w / 2, CAM.x + 2, CAM.x + W - w - 2), y = lbTop - (LB.bub ? 30 : 14);
    box(x, y, w, 12, P.navy, P.ink); R(x + 1, y + 1, w - 2, 1, P.pink); text(s, x + 5, y + 2.5, { f: F.s, c: P.white });
  }
  if (PL.bub) speech(PL.x + PL.face * 26, PL_Y - 50, PL.bub);
  ctx.restore();
}
const lbOnScreen = () => LB.state !== 'gone' && LB.x > CAM.x - 10 && LB.x < CAM.x + W + 10;
function drawRira(r) {
  const moving = Math.abs(r.tx - r.x) > .8;
  const ear = r.flap > 0 ? Math.sin(r.flap * 30) : Math.sin(T * 2 + r.ph) * .34;
  const arm = r.bub && r.bubT > 0 && r.mood === 'h' ? 'b' : r.bub ? 'u' : 'd';
  const s = moving ? riraSide(r.kind, Math.floor(r.walkT * 8) % 4, { ear, mood: r.mood }) : rira(r.kind, { mood: r.mood, ear, arm, blink: r.blink > 0 });
  const bob = moving ? 0 : (Math.sin(T * 3 + r.ph) > .6 ? -.5 : 0);
  blit(s, r.x - 10, RIRA_Y - 23 + r.hop + bob, moving ? r.face < 0 : r.face > 0);
}
function drawPlayer() {
  const f = PL.moving ? Math.floor(PL.walkT * 6) % 4 : 0;
  const breathe = !PL.moving && Math.sin(T * 1.4) > .7 ? .5 : 0;
  blit(anteater(f), PL.x - 44, PL_Y - 50 + breathe, PL.face < 0);
}
function speech(x, y, s) {
  const lines = wrapChars(s, F.s, 96), w = Math.max(...lines.map(l => tw(l, F.s))) + 8, h = lines.length * 9 + 5;
  const bx = clamp(x - w / 2, CAM.x + 2, CAM.x + W - w - 2), by = y - h - 4;
  box(bx, by, w, h, P.paper, P.ink);
  R(clamp(x - 1, bx + 3, bx + w - 5), by + h - 1, 3, 2, P.paper); R(clamp(x - 1, bx + 3, bx + w - 5), by + h + 1, 2, 2, P.ink);
  lines.forEach((l, i) => text(l, bx + 4, by + 3 + i * 9, { f: F.s }));
}
function drawHUD() {
  if (STAGE === 'work' && !MG) {
    const p = pending(), done = planned() - p.length;
    const h = 16 + Math.min(3, p.length) * 9 + (p.length > 3 ? 9 : 0);
    box(4, 4, 112, h, '#fff8e8', P.ink);
    text(`근무일지 ${done} / ${planned()}`, 8, 6, { f: F.s, c: P.redD });
    p.slice(0, 3).forEach((t, i) => { R(9, 17 + i * 9, 5, 5, P.ink2); R(10, 18 + i * 9, 3, 3, '#fff8e8'); text(TASKS[t].name, 17, 15 + i * 9, { f: F.s }); });
    if (!p.length) text(RD === ROUNDS.length - 1 ? '→ 문으로 (17시)' : '→ 퇴근해 보기', 17, 15, { f: F.s, c: P.green });
  }
  if (MODE === 'play') {
    const hh = Math.floor(clockMin / 60) % 24, mm = clockMin % 60;
    box(W - 98, 13, 94, STAGE === 'work' ? 47 : 17, '#fff8e8', P.ink);
    text(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, W - 94, 15, { f: F.b });
    text(`토요일 ${G.week}주차`, W - 8, 17, { f: F.s, a: 'right', c: P.ink2 });
    if (STAGE === 'work') {
      text('기력', W - 94, 31, { f: F.s }); bar(W - 76, 32, 34, 6, stamina / 100, stamina < 25 ? P.red : P.green);
      text(`${Math.round(stamina)}%`, W - 8, 31, { f: F.s, a: 'right' });
      text(`리라 매출 ${won(money)}`, W - 8, 40, { f: F.s, a: 'right', c: P.green });
      text(`러바오 근무 완료 ${LB.done}회`, W - 8, 49, { f: F.s, a: 'right', c: P.navyL });
    }
  }
  // 소리 아이콘
  const ic = (x, on, c) => { R(x, 3, 10, 7, on ? c : P.stone); R(x + 1, 4, 8, 5, on ? P.paper : '#ddd'); };
  if (MODE !== 'title') { ic(W - 28, G.music, P.green); text('♪', W - 26.5, 2.5, { f: F.s }); ic(W - 14, G.sfx, P.green); R(W - 11, 5, 2, 3, P.ink); R(W - 9, 4, 1, 5, P.ink); }
  // 가까운 일 안내
  if (MODE === 'play' && !MG && !SCR && !SYS && !DLG && STAGE === 'work') {
    const s = nearSt(); let lab = null;
    if (s) { if (s.id === 'door') lab = '퇴근하기'; else { const tk = taskAt(s.id); if (tk) lab = TASKS[tk].name; } }
    if (lab) {
      const t2 = (coarse ? '버튼' : 'Space') + '  ' + lab, w = tw(t2, F.m) + 14;
      box(W / 2 - w / 2, H - 20, w, 15, P.navy, P.ink); text(t2, W / 2, H - 18, { f: F.m, a: 'center', c: P.paper });
    }
    if (coarse) { blit(disc(ABTN.r, P.red), ABTN.x - ABTN.r - .5, ABTN.y - ABTN.r - .5); text('일', ABTN.x, ABTN.y - 6, { f: F.b, a: 'center', c: P.paper }); }
  }
  if (MODE === 'play' && LB.miniT > 0 && !lbOnScreen() && !MG) {
    const s = 'LE BAO: SHIFT COMPLETE.', w = tw(s, F.s) + 30, x = W / 2 - w / 2, y = 48;
    box(x, y, w, 13, P.navy, P.ink); R(x + 1, y + 1, w - 2, 1, P.pink);
    blit(disc(3, PB.w), x + 3, y + 2.5); blit(disc(1, PB.k), x + 3, y + 2); blit(disc(1, PB.k), x + 7, y + 2);
    text(s, x + 14, y + 3, { f: F.s, c: P.white }); text('(화면 밖)', x + w - 4, y + 3, { f: F.s, a: 'right', c: P.pink });
  }
  if (PROMPT) {
    const t2 = (coarse ? '화면 누르기' : 'Space') + '  ' + PROMPT, w = tw(t2, F.m) + 14;
    box(W / 2 - w / 2, H - 22, w, 15, P.gold, P.ink); text(t2, W / 2, H - 20, { f: F.m, a: 'center' });
  }
  if (tutT > 0 && !MG && !DLG && !SYS) {
    const t2 = coarse ? '방을 눌러 걷기 · 소품을 눌러 일하기 · 문을 누르면 퇴근 시도' : '← → 걷기 · Space 일하기 · 문으로 가면 퇴근 시도';
    const w = tw(t2, F.s) + 12; box(W / 2 - w / 2, 62, w, 13, P.paper, P.ink); text(t2, W / 2, 64, { f: F.s, a: 'center' });
  }
  if (toastT > 0) { const w = tw(toastMsg, F.m) + 14; box(W / 2 - w / 2, 76, w, 15, P.ink, P.ink); text(toastMsg, W / 2, 78, { f: F.m, a: 'center', c: P.paper }); }
}
function drawMG() {
  ctx.globalAlpha = .55; R(0, 0, W, H, '#1a120d'); ctx.globalAlpha = 1;
  box(PX, PY, PW, PH, P.paper, P.ink); R(PX + 1, PY + 1, PW - 2, 13, '#3d6b31');
  text(`업무 ${DONE.size + 1} / ${planned()}  ·  ${MG.def.name}`, PX + 6, PY + 2, { f: F.m, c: P.paper });
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
  R(PX + 1, PY + PH - 4, PW - 2, 3, P.paperD);
  text(MG.eng.hint, A.x + A.w / 2, PY + PH - 14, { f: F.s, a: 'center', c: P.navyL });
  if (MG.doneT >= 0) {
    const k = Math.max(1, 2.2 - MG.doneT * 6), rej = MG.id === 'exempt';
    ctx.save(); ctx.translate(A.x + A.w / 2, A.y + 50); ctx.scale(k, k); ctx.rotate(-.18);
    box(-30, -14, 60, 28, '#ffe5e5', P.red); box(-27, -11, 54, 22, '#ffe5e5', P.red);
    text(rej ? '반려' : '완료', 0, -9, { f: F.b, a: 'center', c: P.red }); text('리라 행정실', 0, 3, { f: F.s, a: 'center', c: P.red });
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
  CAM.x = 120; drawRoom();
  ctx.globalAlpha = .55; R(0, 0, W, H, '#1a120d'); ctx.globalAlpha = 1;
  blit(lebao({ arm: 'hold', chew: Math.floor(T * 4) % 2, bam: 3, blink: (T % 4) < .12 }), 176, 36, false, 4);
  text('판다 면제 조항', 14, 16, { f: F.xl, c: P.cr, o: P.ink, ow: 2 });
  text('SHIFT INCOMPLETE · 토요일 VIP 편', 16, 50, { f: F.b, c: '#ff8a8a', o: P.ink });
  [['rira', 14], ['alps', 58], ['rosie', 102]].forEach(([id, x], i) => blit(rira(id, { mood: 'h', ear: (T % 3) < .6 ? Math.sin(T * 30 + i) : Math.sin(T * 2 + i) * .34 }), x, 96 + (Math.sin(T * 3 + i * 2) > .85 ? -1 : 0), false, 2));
  box(16, 70, 76, 13, '#3d6b31', P.ink); text(`토요일 ${G.week}주차`, 54, 71, { f: F.m, a: 'center', c: P.paper });
  if (Math.floor(T * 2) % 2) text(coarse ? '▶ 화면을 눌러 출근하기' : '▶ Space · 화면을 눌러 출근하기', 16, 162, { f: F.m, c: P.cr, o: P.ink });
}
function drawRosie() {
  for (let i = 0; i < 9; i++) R(0, i * 20, W, 20, mixHex('#ffe3ea', '#fff6e6', i / 8));
  for (let i = 0; i < 14; i++) { const a = i * 2.4 + T, rr = 80 + (i % 3) * 20; if ((Math.floor(T * 4) + i) % 3) R(W / 2 + Math.cos(a) * rr, 90 + Math.sin(a) * rr * .6, 2, 2, [P.pink, P.gold, P.white][i % 3]); }
  blit(rira('rosie', { mood: 'h', ear: Math.sin(ET * 20), arm: 'b' }), W / 2 - 50, 46 + (Math.sin(ET * 8) > .5 ? -1 : 0), false, 5);
  if (ET > .6) { box(W / 2 + 36, 22, 104, 28, P.paper, P.ink); text('다음 주 토요일에 봬요,', W / 2 + 88, 26, { f: F.s, a: 'center' }); text('갓파더님!', W / 2 + 88, 35, { f: F.s, a: 'center' }); }
}
function drawStare() {
  R(0, 0, W, H, '#3b2f28');
  for (let i = 0; i < 8; i++) R(0, i * 22, W, 1, '#43362e');
  blit(anteaterFace(ET > 2.8 && ET < 2.95), W / 2 - 75, H - 138, false, 3);
}
function drawReceipt() {
  R(0, 0, W, H, '#2a1d17');
  const ox = recShake > 0 ? Math.sin(recShake * 60) * 3 : 0;
  box(56 + ox, 8, 208, 160, P.paper, P.ink);
  text(`토요일 ${G.week}주차 정산서`, W / 2 + ox, 13, { f: F.b, a: 'center' });
  R(66 + ox, 29, 188, 1, P.ink2);
  const rows = [['수행 업무', `${TOTAL}건`], ['퇴근 시도', `${attempts + 1}회`], ['러바오 근무 완료', `${LB.done}회 (낮잠)`], ['리라 매출', won(money)], ['갓파더 급여', '칭찬 도장 1개 − ₩12,000'], ['비고', '매주 토요일 러바오 전담']];
  rows.forEach(([a, b], i) => { text(a, 70 + ox, 35 + i * 16, { f: F.m }); text(b, 250 + ox, 35 + i * 16, { f: F.m, a: 'right', c: i === 4 ? P.redD : P.ink }); });
  REC_BTNS.forEach((b, i) => {
    const on = sel === i, dis = i === 1;
    box(b.x + ox, b.y, b.w, b.h, dis ? '#d8d2c8' : on ? P.red : P.paper, on ? P.ink : P.ink2);
    text(dis ? '퇴근 (잠김)' : '다음 주 토요일 출근', b.x + b.w / 2 + ox, b.y + 3, { f: F.m, a: 'center', c: dis ? '#8f877c' : on ? P.paper : P.ink });
    if (on) text('▶', b.x - 8 + ox, b.y + 3, { f: F.s, c: P.cr });
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
  if (MODE !== 'play' && toastT > 0) { const w = tw(toastMsg, F.m) + 14; box(W / 2 - w / 2, 64, w, 15, P.ink, P.ink); text(toastMsg, W / 2, 66, { f: F.m, a: 'center', c: P.paper }); }
  if (FLASH > 0) { ctx.globalAlpha = FLASH / .4; R(0, 0, W, H, P.white); ctx.globalAlpha = 1; }
}

// ---------- 루프
let last = 0;
function frame(ts) {
  const dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts;
  fit(); update(dt); draw();
  requestAnimationFrame(frame);
}
// 자동 시험용 (주소에 ?test 가 있을 때만)
if (/[?&]test\b/.test(location.search)) window.__T = { I, K, PL, LB, STS, RIRAS, DONE, TASKS, beginTask, tryLeave, run, st: () => ({ MODE, STAGE, RD, MG: MG && MG.id, SYS: SYS && SYS.msg, DLG: DLG && DLG.s, SCR: !!SCR, pending: pending(), clockMin, money, lb: LB.state }), finish: () => { if (MG) MG.eng.done = true; } };
function boot() {
  ASC = {};
  STS.crate.vis = false;
  requestAnimationFrame(frame);
}
const fams = ['7.5px Galmuri14', '10px Galmuri9', '12px Galmuri11', 'bold 12px Galmuri11', 'bold 18px Galmuri11', 'bold 24px Galmuri11'];
if (document.fonts && document.fonts.load) {
  Promise.race([
    Promise.all(fams.map(f => document.fonts.load(f, '가A'))),
    new Promise(r => setTimeout(r, 2000)),
  ]).then(boot, boot);
} else boot();
