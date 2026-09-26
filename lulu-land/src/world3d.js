'use strict';
// 룰루랜드 3D 무대 — three.js(r128)로 그리는 HD-2D 배경.
// 규칙·UI·픽셀 캐릭터 그림은 2D 캔버스(game.js)가 맡고, 이 파일은 그 아래 깔리는 3D 장면만 그린다.
// 픽셀 캐릭터는 3D 공간에 세운 판(빌보드)이 되어 빛과 그림자를 받는다.
(() => {
  const T = window.THREE;
  const W3 = window.W3 = { ok: false, view: null };
  if (!T) return;

  const LW = 320, LH = 180;
  const K = .05, wx2X = wx => (wx - 450) * K;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const col = h => new T.Color(h).convertSRGBToLinear();
  let R = null, glCanvas = null, pr = 1, time = 0, lastT = 0;
  let env = null;

  // ---------- 공용 도구
  function ctex(w, h, draw, o = {}) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); draw(g, w, h);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding;
    if (o.nearest) { t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter; t.generateMipmaps = false; }
    else t.anisotropy = Math.min(8, R.capabilities.getMaxAnisotropy());
    if (o.repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
    return t;
  }
  const stdM = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: col(c), roughness: .8, metalness: 0 }, o || {}));
  const glowM = (c, k = 2.2) => new T.MeshBasicMaterial({ color: col(c).multiplyScalar(k) });
  function mesh(geo, mat, x = 0, y = 0, z = 0, shadow = true) {
    const m = new T.Mesh(geo, mat); m.position.set(x, y, z);
    if (shadow) { m.castShadow = true; m.receiveShadow = true; }
    return m;
  }
  const box = (w, h, d, m, x, y, z) => mesh(new T.BoxGeometry(w, h, d), m, x, y, z);
  const cyl = (rt, rb, h, m, x, y, z, seg = 18) => mesh(new T.CylinderGeometry(rt, rb, h, seg), m, x, y, z);
  const sph = (r, m, x, y, z, ws = 18, hs = 12) => mesh(new T.SphereGeometry(r, ws, hs), m, x, y, z);
  const cone = (r, h, m, x, y, z, seg = 14) => mesh(new T.ConeGeometry(r, h, seg), m, x, y, z);
  function stripesTex(a, b, n, vertical, o) {
    return ctex(256, 256, (g, w, h) => {
      for (let i = 0; i < n; i++) {
        g.fillStyle = i % 2 ? b : a;
        if (vertical) g.fillRect(i * w / n, 0, w / n + 1, h); else g.fillRect(0, i * h / n, w, h / n + 1);
      }
    }, o);
  }
  // 픽셀 글꼴 간판 (갈무리 굵은체를 정수배로 키워 또렷하게)
  function signTex(text, bg, fg, w = 512, h = 128, px = 48) {
    return ctex(w, h, (g) => {
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 0, w, 8);
      g.font = 'bold ' + px + 'px Galmuri11, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillText(text, w / 2 + 4, h / 2 + 6);
      g.fillStyle = fg; g.fillText(text, w / 2, h / 2 + 2);
    }, { nearest: true });
  }
  function signBox(text, w, h, d, bg, fg, x, y, z) {
    const side = stdM(bg);
    const front = new T.MeshStandardMaterial({ map: signTex(text, bg, fg, 512, Math.round(512 * h / w), Math.round(512 * h / w * .5)), roughness: .7 });
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), [side, side, side, side, front, side]);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  const glowTex = () => ctex(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  });

  // ---------- 픽셀 스프라이트 → 3D 세운 판
  const texCache = new WeakMap();
  function texOf(cnv) {
    let t = texCache.get(cnv);
    if (!t) {
      t = new T.CanvasTexture(cnv); t.encoding = T.sRGBEncoding;
      t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter; t.generateMipmaps = false;
      texCache.set(cnv, t);
    }
    return t;
  }
  function billboard(cnv, anchorBottom) {
    const geo = new T.PlaneGeometry(1, 1);
    if (anchorBottom) geo.translate(0, .5, 0);
    const t = texOf(cnv);
    const m = new T.MeshLambertMaterial({ map: t, alphaTest: .5, side: T.DoubleSide, emissive: new T.Color(1, 1, 1), emissiveMap: t, emissiveIntensity: .3 });
    const b = new T.Mesh(geo, m);
    b.castShadow = true; b.receiveShadow = false;
    b.customDepthMaterial = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: t, alphaTest: .5 });
    b.setCanvas = c => {
      const tt = texOf(c);
      if (m.map !== tt) { m.map = tt; m.emissiveMap = tt; b.customDepthMaterial.map = tt; }
      b.cw = c.width; b.ch = c.height;
    };
    b.setCanvas(cnv);
    return b;
  }

  // ---------- 후처리: 빛 번짐 + 틸트시프트 피사계 심도 + 색 보정
  const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
  const FS = {
    copy: 'uniform sampler2D tSrc; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tSrc, vUv); }',
    bright: 'uniform sampler2D tSrc; uniform float thr; varying vec2 vUv; void main(){ vec3 c = texture2D(tSrc, vUv).rgb; float l = dot(c, vec3(.2126,.7152,.0722)); gl_FragColor = vec4(c * smoothstep(thr, thr + .6, l), 1.); }',
    blur: 'uniform sampler2D tSrc; uniform vec2 dir; varying vec2 vUv; void main(){ vec3 c = texture2D(tSrc, vUv).rgb * .2270270; c += (texture2D(tSrc, vUv + dir * 1.3846154).rgb + texture2D(tSrc, vUv - dir * 1.3846154).rgb) * .3162162; c += (texture2D(tSrc, vUv + dir * 3.2307692).rgb + texture2D(tSrc, vUv - dir * 3.2307692).rgb) * .0702703; gl_FragColor = vec4(c, 1.); }',
    comp: `uniform sampler2D tSharp; uniform sampler2D tBlur; uniform sampler2D tBloom;
      uniform float focusY, band, ramp, maxBlur, bloomStr, exposure, sat, vig; uniform vec3 tint;
      varying vec2 vUv;
      vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14), 0., 1.); }
      void main(){
        vec3 s = texture2D(tSharp, vUv).rgb, b = texture2D(tBlur, vUv).rgb;
        float coc = smoothstep(band, band + ramp, abs(vUv.y - focusY)) * maxBlur;
        vec3 c = mix(s, b, coc) + texture2D(tBloom, vUv).rgb * bloomStr;
        c = aces(c * exposure) * tint;
        c = mix(c, c * c * (3. - 2. * c), .3);
        float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat);
        vec2 q = vUv - .5; c *= 1. - vig * dot(q, q) * 1.8;
        gl_FragColor = vec4(pow(max(c, 0.), vec3(1. / 2.2)), 1.);
      }`,
  };
  const P = {};
  let post = null;
  function shader(fs, uniforms) { return new T.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, uniforms, depthTest: false, depthWrite: false }); }
  function buildPost() {
    const hdr = R.capabilities.isWebGL2 && !!R.extensions.get('EXT_color_buffer_float');
    post = {
      type: hdr ? T.HalfFloatType : T.UnsignedByteType, hdr,
      scene: new T.Scene(), cam: new T.OrthographicCamera(-1, 1, 1, -1, 0, 1),
      quad: new T.Mesh(new T.PlaneGeometry(2, 2)), w: 0, h: 0,
    };
    post.scene.add(post.quad);
    P.copy = shader(FS.copy, { tSrc: { value: null } });
    P.bright = shader(FS.bright, { tSrc: { value: null }, thr: { value: hdr ? 1.05 : .85 } });
    P.blur = shader(FS.blur, { tSrc: { value: null }, dir: { value: new T.Vector2() } });
    P.comp = shader(FS.comp, {
      tSharp: { value: null }, tBlur: { value: null }, tBloom: { value: null },
      focusY: { value: .4 }, band: { value: .12 }, ramp: { value: .25 }, maxBlur: { value: 1 },
      bloomStr: { value: .55 }, exposure: { value: 1.1 }, sat: { value: 1.08 }, vig: { value: .5 },
      tint: { value: new T.Vector3(1.02, 1, .98) },
    });
  }
  function makeRT(w, h, ms) {
    const o = { type: post.type, minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: !!ms, stencilBuffer: false };
    if (ms && R.capabilities.isWebGL2 && T.WebGLMultisampleRenderTarget) { const r = new T.WebGLMultisampleRenderTarget(w, h, o); r.samples = 4; return r; }
    return new T.WebGLRenderTarget(w, h, o);
  }
  function sizePost(w, h) {
    if (post.w === w && post.h === h) return;
    for (const k of ['sc', 'hA', 'hB', 'qA', 'qB']) if (post[k]) post[k].dispose();
    post.w = w; post.h = h;
    post.sc = makeRT(w, h, true);
    const hw = Math.max(2, w >> 1), hh = Math.max(2, h >> 1), qw = Math.max(2, w >> 2), qh = Math.max(2, h >> 2);
    post.hA = makeRT(hw, hh); post.hB = makeRT(hw, hh);
    post.qA = makeRT(qw, qh); post.qB = makeRT(qw, qh);
  }
  function pass(mat, target) { post.quad.material = mat; R.setRenderTarget(target); R.render(post.scene, post.cam); }
  function blur2(a, b, spread) {
    P.blur.uniforms.tSrc.value = a.texture; P.blur.uniforms.dir.value.set(spread / a.width, 0); pass(P.blur, b);
    P.blur.uniforms.tSrc.value = b.texture; P.blur.uniforms.dir.value.set(0, spread / a.height); pass(P.blur, a);
  }
  function renderPost(scene, cam, look) {
    if (W3.noPost) { R.setRenderTarget(null); R.render(scene, cam); return; }
    R.setRenderTarget(post.sc); R.clear(); R.render(scene, cam);
    P.copy.uniforms.tSrc.value = post.sc.texture; pass(P.copy, post.hA);
    blur2(post.hA, post.hB, 1); blur2(post.hA, post.hB, 2);
    P.bright.uniforms.tSrc.value = post.sc.texture; pass(P.bright, post.qA);
    blur2(post.qA, post.qB, 1); blur2(post.qA, post.qB, 2.5);
    const u = P.comp.uniforms;
    u.tSharp.value = post.sc.texture; u.tBlur.value = post.hA.texture; u.tBloom.value = post.qA.texture;
    for (const k in look) if (u[k]) u[k].value = look[k];
    pass(P.comp, null);
  }

  // ---------- 반사용 환경 (그라데이션 하늘 + 스튜디오 조명판)
  function buildEnv() {
    const s = new T.Scene();
    s.add(new T.Mesh(new T.SphereGeometry(10, 32, 16), new T.ShaderMaterial({
      side: T.BackSide,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 top = vec3(.6,.75,1.); vec3 mid = vec3(1.,.86,.9); vec3 bot = vec3(.45,.35,.4); gl_FragColor = vec4(h > 0. ? mix(mid, top, h) : mix(mid, bot, -h), 1.); }',
    })));
    const panel = (x, y, z, w, h, k) => { const p = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(k, k * .97, k * .92), side: T.DoubleSide })); p.position.set(x, y, z); p.lookAt(0, 0, 0); s.add(p); };
    panel(5, 6, 6, 4, 2.5, 7); panel(-7, 3, 3, 3, 5, 3); panel(0, 8, -5, 7, 2, 2.5); panel(-3, 1, 8, 2, 2, 3);
    const pm = new T.PMREMGenerator(R);
    env = pm.fromScene(s, .02).texture;
    pm.dispose();
  }

  // ---------- 과일 모형과 설탕 유리 코팅
  const FRUIT = {};
  let GLASS = null, SHELL = null;
  function buildFruits() {
    const berryTex = ctex(256, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ff6a7c'); gr.addColorStop(.6, '#ef2f4c'); gr.addColorStop(1, '#b8233f');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let r = 0; r < 9; r++) for (let i = 0; i < 12; i++) {
        const x = (i + (r % 2) * .5) / 12 * w, y = 22 + r * 25;
        g.fillStyle = '#ffe28a'; g.beginPath(); g.ellipse(x, y, 3.2, 5, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(120,20,40,0.35)'; g.beginPath(); g.ellipse(x, y + 3, 4.5, 3, 0, 0, Math.PI * 2); g.fill();
      }
    });
    const bumpTex = ctex(256, 256, (g, w, h) => {
      g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { const v = 90 + Math.random() * 90 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 1.2 + Math.random() * 2, 0, 7); g.fill(); }
    });
    bumpTex.encoding = T.LinearEncoding;
    const kiwiTex = ctex(256, 256, (g, w, h) => {
      const c = w / 2, r = g.createRadialGradient(c, c, 0, c, c, c);
      r.addColorStop(0, '#fbffe9'); r.addColorStop(.28, '#f1f8d0'); r.addColorStop(.34, '#c4e36a'); r.addColorStop(.9, '#8fc43a'); r.addColorStop(1, '#6e5a2e');
      g.fillStyle = r; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2;
      for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; g.beginPath(); g.moveTo(c + Math.cos(a) * 30, c + Math.sin(a) * 30); g.lineTo(c + Math.cos(a) * 110, c + Math.sin(a) * 110); g.stroke(); }
      g.fillStyle = '#231d17';
      for (let i = 0; i < 34; i++) { const a = i / 34 * Math.PI * 2 + (i % 2) * .08, rr = 44 + (i % 3) * 5; g.beginPath(); g.ellipse(c + Math.cos(a) * rr, c + Math.sin(a) * rr, 2.6, 5, a, 0, Math.PI * 2); g.fill(); }
    });
    const leafM = stdM('#4fbf6a', { roughness: .6 });
    const phys = (c, o) => new T.MeshPhysicalMaterial(Object.assign({ color: col(c), roughness: .35, metalness: 0, clearcoat: .6, clearcoatRoughness: .2, envMapIntensity: 1.2 }, o || {}));
    const lathe = (pts, seg = 28) => new T.LatheGeometry(pts.map(p => new T.Vector2(p[0], p[1])), seg);
    FRUIT.berry = () => {
      const g = new T.Group();
      g.add(mesh(lathe([[0, -.5], [.16, -.44], [.3, -.3], [.4, -.12], [.44, .06], [.42, .22], [.34, .36], [.2, .44], [0, .46]]), phys('#ffffff', { map: berryTex, roughness: .4 }), 0, 0, 0, false));
      for (let i = 0; i < 6; i++) {
        const l = cone(.09, .34, leafM, 0, .44, 0, 4); l.castShadow = false;
        const a = i / 6 * Math.PI * 2; l.position.set(Math.cos(a) * .12, .44, Math.sin(a) * .12);
        l.rotation.set(Math.sin(a) * 1.9, 0, -Math.cos(a) * 1.9); g.add(l);
      }
      return g;
    };
    FRUIT.grape = () => { const g = new T.Group(); g.add(sph(.46, phys('#b8e86a', { roughness: .22, clearcoat: .8 }), 0, 0, 0, 28, 20)); g.add(cyl(.03, .04, .14, stdM('#8a9a4a'), 0, .5, 0, 6)); return g; };
    FRUIT.mandarin = () => {
      const g = new T.Group();
      const b = sph(.49, phys('#ffa62b', { bumpMap: bumpTex, bumpScale: .012, roughness: .5, clearcoat: .3 }), 0, 0, 0, 32, 24); b.scale.set(1, .86, 1); g.add(b);
      const l = sph(.12, leafM, .1, .42, 0, 8, 6); l.scale.set(1.4, .35, .8); l.rotation.z = -.4; g.add(l);
      return g;
    };
    FRUIT.blue = () => {
      const g = new T.Group(); g.add(sph(.36, phys('#4a5fd0', { roughness: .55, clearcoat: .2 }), 0, 0, 0, 24, 16));
      const cr = mesh(new T.TorusGeometry(.08, .03, 6, 10), stdM('#1f2a60'), 0, .34, 0, false); cr.rotation.x = Math.PI / 2; g.add(cr);
      return g;
    };
    FRUIT.kiwi = () => {
      const side = stdM('#7a5a32', { roughness: .95 }), face = phys('#ffffff', { map: kiwiTex, roughness: .3, clearcoat: .5 });
      const m = mesh(new T.CylinderGeometry(.48, .48, .2, 36), [side, face, face], 0, 0, 0, false);
      m.rotation.x = Math.PI / 2; const g = new T.Group(); g.add(m); return g;
    };
    FRUIT.marsh = () => {
      const g = new T.Group();
      g.add(mesh(lathe([[0, -.34], [.3, -.33], [.37, -.28], [.39, -.1], [.39, .2], [.37, .3], [.3, .34], [0, .35]]), phys('#fff3f8', { roughness: .85, clearcoat: 0 }), 0, 0, 0, false));
      const top = mesh(new T.CircleGeometry(.3, 24), stdM('#ffc6dc', { roughness: .9 }), 0, .352, 0, false); top.rotation.x = -Math.PI / 2; g.add(top);
      return g;
    };
    FRUIT.gummy = () => {
      const m = new T.MeshPhysicalMaterial({ color: col('#ff3d66'), roughness: .12, transmission: .45, transparent: true, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.5 });
      const g = new T.Group();
      const add = (r, x, y, sx = 1, sy = 1, sz = .8) => { const s = sph(r, m, x, y, 0, 20, 14); s.castShadow = false; s.scale.set(sx, sy, sz); g.add(s); };
      add(.3, 0, -.1, 1, 1.12); add(.24, 0, .26); add(.085, -.17, .44); add(.085, .17, .44);
      add(.1, -.3, -.02); add(.1, .3, -.02); add(.12, -.16, -.4); add(.12, .16, -.4);
      const eye = stdM('#6a1428', { roughness: .3 });
      for (const x of [-.08, .08]) { const e = sph(.025, eye, x, .3, .19, 8, 6); e.castShadow = false; g.add(e); }
      return g;
    };
    FRUIT.chili = () => {
      const geo = lathe([[0, -.55], [.05, -.46], [.1, -.28], [.14, -.05], [.16, .2], [.15, .36], [.1, .44], [0, .46]], 22);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = (.46 - y) / 1.0; p.setX(i, p.getX(i) + .32 * k * k); }
      geo.computeVertexNormals();
      const g = new T.Group();
      g.add(mesh(geo, phys('#e8233f', { roughness: .15, clearcoat: 1 }), 0, 0, 0, false));
      g.add(cyl(.035, .05, .16, leafM, 0, .52, 0, 8));
      const cap = sph(.1, leafM, 0, .44, 0, 10, 6); cap.scale.set(1, .4, 1); g.add(cap);
      return g;
    };
    const glass = (c, rough, trans, opa = 1) => new T.MeshPhysicalMaterial({ color: col(c), roughness: rough, metalness: 0, transmission: trans, transparent: true, opacity: opa, clearcoat: 1, clearcoatRoughness: .03, envMapIntensity: 2.4, depthWrite: false });
    GLASS = { perfect: glass('#ffffff', .02, .92), good: glass('#ffd27a', .06, .82), sticky: glass('#fff2dc', .38, .5, .92), burnt: glass('#7a3e16', .15, .45, .95) };
    SHELL = new T.SphereGeometry(.5, 40, 28);
  }
  const SHELL_SCALE = { berry: [1.02, 1.08, 1.02], grape: [1.06, 1.06, 1.06], mandarin: [1.08, .98, 1.08], blue: [.84, .84, .84], kiwi: [1.08, 1.08, .52], marsh: [.9, 1.5, .9], gummy: [.9, 1.28, .72], chili: [.62, 1.2, .5] };
  function makePiece(id) {
    const g = new T.Group();
    g.add(FRUIT[id]());
    const sh = new T.Mesh(SHELL, GLASS.perfect); sh.scale.set(...SHELL_SCALE[id]); sh.visible = false; sh.renderOrder = 2;
    g.add(sh); g.shell = sh;
    // 유리알 반짝임
    const sp = new T.Sprite(new T.SpriteMaterial({ map: sparkleTex, color: 0xffffff, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
    sp.scale.set(.5, .5, 1); sp.position.set(.2, .25, .45); sp.visible = false; g.add(sp); g.spark = sp;
    return g;
  }
  let sparkleTex = null;
  function coatPiece(g, q) {
    g.shell.visible = !!q;
    if (q) g.shell.material = GLASS[q];
    g.spark.visible = q === 'perfect';
  }
  function tanghuluModel() {
    const g = new T.Group();
    g.add(cyl(.045, .045, 3.2, stdM('#e0b27a', { roughness: .7 }), 0, -.6, 0, 8));
    ['berry', 'grape', 'mandarin'].forEach((id, i) => { const p = makePiece(id); coatPiece(p, 'perfect'); p.position.y = .9 - i * .95; g.add(p); });
    return g;
  }

  // ---------- 하늘과 먼 풍경
  function skyDome(top, mid, bot) {
    return new T.Mesh(new T.SphereGeometry(250, 32, 16), new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false,
      uniforms: { top: { value: col(top) }, mid: { value: col(mid) }, bot: { value: col(bot) } },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'uniform vec3 top, mid, bot; varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 c = h > 0. ? mix(mid, top, pow(clamp(h * 2.2, 0., 1.), .8)) : mix(mid, bot, clamp(-h * 4., 0., 1.)); gl_FragColor = vec4(c, 1.); }',
    }));
  }

  // ================= 룰루랜드 거리 =================
  const PK = { scene: null, cam: null, sun: null, lulu: null, npcs: [], balloons: [], camX: 0, anim: [], booths: [], ground: null, orbit: null };
  function buildPark() {
    const S = PK.scene = new T.Scene();
    S.fog = new T.Fog(col('#ffe6ef'), 60, 180);
    PK.cam = new T.PerspectiveCamera(32, 16 / 9, .3, 400);
    S.add(skyDome('#6fbef7', '#ffe3ee', '#ffe3ee'));
    S.add(new T.HemisphereLight(col('#d6ecff'), col('#ffd6e2'), .6));
    const sun = PK.sun = new T.DirectionalLight(col('#fff0d8'), 1.35);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 12, bottom: -8, near: 1, far: 70 });
    sun.shadow.bias = -.0006; sun.shadow.normalBias = .02;
    S.add(sun, sun.target);
    const fill = new T.DirectionalLight(col('#ffe6f2'), .22); fill.position.set(-8, 6, 10); S.add(fill);
    // 해와 구름
    const gt = glowTex();
    const sunGlow = new T.Sprite(new T.SpriteMaterial({ map: gt, color: col('#fff4c8').multiplyScalar(2.2), transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
    sunGlow.scale.set(60, 60, 1); sunGlow.position.set(70, 70, -200); S.add(sunGlow);
    const sunDisc = new T.Mesh(new T.CircleGeometry(7, 32), new T.MeshBasicMaterial({ color: new T.Color(3.2, 3, 2.4), fog: false }));
    sunDisc.position.set(70, 70, -205); S.add(sunDisc);
    const cloudM = stdM('#ffffff', { roughness: 1, emissive: col('#ffffff'), emissiveIntensity: .35 });
    const clouds = [];
    for (let i = 0; i < 9; i++) {
      const c = new T.Group();
      for (let j = 0; j < 6; j++) { const s = sph(2 + Math.random() * 2.5, cloudM, j * 2.4 - 6, Math.random() * 1.5, Math.random() * 2, 12, 8); s.castShadow = s.receiveShadow = false; s.scale.y = .7; c.add(s); }
      c.position.set(-90 + i * 24 + Math.random() * 10, 26 + Math.random() * 14, -110 - Math.random() * 40);
      S.add(c); clouds.push(c);
    }
    PK.anim.push(dt => { for (const c of clouds) { c.position.x += dt * .8; if (c.position.x > 120) c.position.x = -120; } });
    // 먼 언덕
    const hillCols = ['#b9ecc6', '#a6e2b6', '#c7f0d2', '#9fd9ae'];
    for (let i = 0; i < 12; i++) {
      const h = mesh(new T.SphereGeometry(1, 12, 8), stdM(hillCols[i % 4], { flatShading: true, roughness: 1 }), -110 + i * 20, -2, -70 - (i % 3) * 18, false);
      h.scale.set(22 + (i % 4) * 5, 9 + (i % 3) * 4, 16); h.receiveShadow = false; S.add(h);
    }
    // 잔디와 길
    const grass = mesh(new T.PlaneGeometry(400, 400), stdM('#aee6b8', { roughness: 1 }), 0, 0, 0); grass.rotation.x = -Math.PI / 2; grass.castShadow = false; S.add(grass);
    const brick = ctex(256, 128, (g, w, h) => {
      g.fillStyle = '#ffdcbf'; g.fillRect(0, 0, w, h);
      for (let r = 0; r < 4; r++) for (let i = -1; i < 5; i++) {
        const x = i * 64 + (r % 2) * 32, y = r * 32;
        const v = 245 + (Math.random() * 10 | 0); g.fillStyle = `rgb(255,${v - 25},${v - 55})`; g.fillRect(x + 2, y + 2, 60, 28);
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 2, y + 2, 60, 2);
      }
    }, { repeat: [40, 2.5] });
    const street = mesh(new T.PlaneGeometry(80, 5.6), stdM('#ffffff', { map: brick, roughness: .9 }), 0, .01, .5); street.rotation.x = -Math.PI / 2; street.castShadow = false; S.add(street);
    for (const z of [-2.25, 3.3]) { const c = box(80, .12, .18, stdM('#e9dcff'), 0, .06, z); c.castShadow = false; S.add(c); }
    // 성과 관람차
    buildCastle(S, -10, -52);
    buildFerris(S, 16, -34);
    // 나무
    const rnd = mulberry(7);
    for (let i = 0; i < 30; i++) tree(S, -30 + i * 2.4 + rnd() * 1.5, -8.5 - rnd() * 6, .8 + rnd() * .6, rnd);
    for (const [x, z] of [[-24, -4], [-12.5, -4.5], [-2.5, -4.2], [5.5, -4.6], [15, -4.3], [22.5, -4.4], [31.5, -4]]) tree(S, x, z, .75, rnd);
    // 가게들
    buildShop(S); buildClaw(S); buildDrop(S); buildCloset(S); buildFountain(S); buildMart(S);
    for (const wx of [205, 380, 560, 770, 875, 1075]) buildLamp(S, wx2X(wx));
    const LX = [205, 380, 560, 770, 875, 1075].map(wx2X);
    for (let i = 0; i < LX.length - 1; i++) buildBunting(S, LX[i], LX[i + 1]);
    // 룰루와 손님
    PK.lulu = null;
    // 타이틀의 떠다니는 탕후루
    PK.orbit = new T.Group();
    for (let i = 0; i < 4; i++) { const t = tanghuluModel(); t.scale.setScalar(.42); PK.orbit.add(t); }
    PK.orbit.visible = false; S.add(PK.orbit);
  }
  function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function tree(S, x, z, s, rnd) {
    const g = new T.Group();
    g.add(cyl(.1 * s, .15 * s, 1.4 * s, stdM('#a8703f'), 0, .7 * s, 0, 8));
    const greens = ['#6cc285', '#7fd394', '#8fd9a0', '#5cb877'];
    for (let j = 0; j < 3; j++) {
      const c = mesh(new T.IcosahedronGeometry(1, 0), stdM(greens[(j + (rnd() * 4 | 0)) % 4], { flatShading: true, roughness: .9 }), (j - 1) * .35 * s, (1.8 + j % 2 * .35) * s, (rnd() - .5) * .3);
      c.scale.setScalar((.75 - j * .08) * s * 1.2); c.rotation.set(rnd() * 3, rnd() * 3, 0); g.add(c);
    }
    g.position.set(x, 0, z); S.add(g);
  }
  function buildCastle(S, x, z) {
    const w1 = stdM('#e2d3fa', { roughness: .9 }), w2 = stdM('#d2bff5', { roughness: .9 }), roof = stdM('#f7a8cb', { roughness: .7 });
    const g = new T.Group();
    g.add(box(14, 9, 7, w1, 0, 4.5, 0));
    for (const [tx, h] of [[-7.5, 13], [7.5, 13], [0, 18]]) {
      g.add(cyl(tx === 0 ? 2 : 1.6, tx === 0 ? 2 : 1.6, h, w2, tx, h / 2, tx === 0 ? -1 : 1));
      g.add(cone(tx === 0 ? 2.6 : 2.1, 4.5, roof, tx, h + 2.25, tx === 0 ? -1 : 1));
    }
    for (let i = 0; i < 5; i++) g.add(box(1, 1.2, .2, stdM('#a58bd8'), -5 + i * 2.5, 6.5, 3.55));
    g.add(box(2.6, 4, .2, stdM('#a58bd8'), 0, 2, 3.55));
    const flag = mesh(new T.PlaneGeometry(1.6, 1), new T.MeshStandardMaterial({ color: col('#ff8fb3'), side: T.DoubleSide }), .8, 23.6, -1); g.add(flag); g.add(cyl(.05, .05, 3, stdM('#6a4a68'), 0, 22.5, -1, 6));
    PK.anim.push(() => { flag.rotation.y = Math.sin(time * 2) * .3; });
    g.position.set(x, 0, z); S.add(g);
  }
  function buildFerris(S, x, z) {
    const g = new T.Group(); g.position.set(x, 0, z); S.add(g);
    const R0 = 7.5, cy = 9.5, legM = stdM('#e7a6c8', { roughness: .6 });
    for (const dz of [-1, 1]) for (const dx of [-4.2, 4.2]) {
      const l = cyl(.16, .2, Math.hypot(dx, cy) + .3, legM, dx / 2, cy / 2, dz); l.rotation.z = Math.atan2(dx, cy); g.add(l);
    }
    const wheel = new T.Group(); wheel.position.set(0, cy, 0); g.add(wheel);
    const rimM = stdM('#ff9ec4', { roughness: .45, metalness: .1 });
    for (const dz of [-.5, .5]) { const r = mesh(new T.TorusGeometry(R0, .14, 8, 72), rimM, 0, 0, dz); wheel.add(r); const r2 = mesh(new T.TorusGeometry(R0 - .8, .07, 6, 64), stdM('#ffd0e2'), 0, 0, dz); wheel.add(r2); }
    const spokeM = stdM('#ffffff', { roughness: .5 });
    for (let i = 0; i < 12; i++) { const s = cyl(.05, .05, R0, spokeM, 0, 0, 0, 6); const a = i / 12 * Math.PI * 2; s.position.set(Math.cos(a) * R0 / 2, Math.sin(a) * R0 / 2, 0); s.rotation.z = a - Math.PI / 2; wheel.add(s); }
    const hub = cyl(.6, .6, 1.4, stdM('#ffffff'), 0, 0, 0, 16); hub.rotation.x = Math.PI / 2; wheel.add(hub);
    const bulbCols = ['#fff3b0', '#ffc2da', '#c9f7e6'];
    const bulbs = [];
    for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; const b = sph(.12, glowM(bulbCols[i % 3], 2.6), Math.cos(a) * R0, Math.sin(a) * R0, .62, 8, 6); b.castShadow = false; wheel.add(b); bulbs.push(b); }
    const cabCols = ['#ff8fb3', '#ffd166', '#7ee0c3', '#a58bff', '#8fd3ff', '#ffb38a'];
    const cabins = [];
    for (let i = 0; i < 12; i++) {
      const c = new T.Group();
      c.add(box(1.1, .95, .9, stdM(cabCols[i % 6], { roughness: .5 }), 0, -.75, 0));
      c.add(box(.8, .4, .92, glowM('#fff6dc', 1.4), 0, -.7, 0));
      c.add(cyl(.03, .03, .4, stdM('#6a4a68'), 0, -.15, 0, 6));
      g.add(c); cabins.push(c);
    }
    PK.anim.push(() => {
      const r = time * .12; wheel.rotation.z = r;
      cabins.forEach((c, i) => { const a = r + i / 12 * Math.PI * 2; c.position.set(Math.cos(a) * R0, cy + Math.sin(a) * R0, .9); });
      bulbs.forEach((b, i) => { b.visible = ((i + Math.floor(time * 3)) % 3) !== 0; });
    });
  }
  function boothGroup(id, X) { const g = new T.Group(); g.position.set(X, 0, 0); g.userData.booth = id; PK.booths.push(g); PK.scene.add(g); return g; }
  function awningTex(a, b) {
    return ctex(512, 256, (g, w, h) => {
      const n = 10, sw = w / n;
      for (let i = 0; i < n; i++) {
        g.fillStyle = i % 2 ? b : a; g.fillRect(i * sw, 0, sw + 1, h * .78);
        g.beginPath(); g.arc(i * sw + sw / 2, h * .78, sw / 2, 0, Math.PI); g.fill();
      }
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 0, w, 10);
    });
  }
  function awning(g, w, a, b, y, z) {
    const m = new T.MeshStandardMaterial({ map: awningTex(a, b), alphaTest: .5, side: T.DoubleSide, roughness: .6 });
    const p = mesh(new T.PlaneGeometry(w, 1.6), m, 0, y, z); p.rotation.x = -.95; p.customDepthMaterial = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: m.map, alphaTest: .5 }); g.add(p);
  }
  function windowBox(g, x, y, z, w, h, glow) {
    g.add(box(w + .3, h + .3, .2, stdM('#b8744a', { roughness: .7 }), x, y, z));
    const gl = box(w, h, .1, new T.MeshStandardMaterial({ color: col('#fff6e0'), emissive: col(glow), emissiveIntensity: .9, roughness: .15 }), x, y, z + .06); gl.castShadow = false; g.add(gl);
  }
  function buildShop(S) {
    const g = boothGroup('kitchen', wx2X(105));
    const wall = stdM('#fff1f6', { roughness: .95 });
    g.add(box(7.5, 4.2, 3.5, wall, 0, 2.1, -4.2));
    g.add(box(7.6, .45, 3.6, stdM('#f6b6cc'), 0, .22, -4.2));
    g.add(box(7.9, .3, 3.9, stdM('#e0648f', { roughness: .6 }), 0, 4.35, -4.2));
    awning(g, 7.4, '#ef3f5a', '#ffffff', 3.55, -1.9);
    g.add(signBox('룰루네 탕후루', 5.4, 1.1, .25, '#b8744a', '#fff4dc', .4, 5.05, -3.4));
    // 지붕 위 큰 탕후루
    const t = tanghuluModel(); t.scale.setScalar(.9); t.position.set(-3, 6.3, -3.3); g.add(t);
    PK.anim.push(() => { t.rotation.y = Math.sin(time * .8) * .5; });
    windowBox(g, -1.6, 2.1, -2.42, 3, 1.9, '#ffe2a8');
    for (let i = 0; i < 4; i++) { const s = tanghuluModel(); s.scale.setScalar(.28); s.position.set(-2.7 + i * .72, 2.2, -2.2); g.add(s); }
    const door = box(1.3, 2.5, .15, stdM('#ff8fb3', { roughness: .5 }), 1.9, 1.25, -2.4); g.add(door);
    const dw = box(.8, .7, .05, new T.MeshStandardMaterial({ color: col('#dff4ff'), emissive: col('#ffe8b0'), emissiveIntensity: .6 }), 1.9, 1.85, -2.3); dw.castShadow = false; g.add(dw);
    g.add(sph(.07, stdM('#ffc857', { metalness: .6, roughness: .3 }), 2.4, 1.2, -2.28, 8, 6));
    g.add(signBox('OPEN', 1.1, .4, .06, '#ffffff', '#ef3f5a', 1.9, 2.75, -2.28));
    g.add(cyl(.35, .28, .6, stdM('#d9964a'), 3.2, .3, -2.1)); const bush = sph(.45, stdM('#6cc285', { flatShading: true }), 3.2, .95, -2.1, 8, 6); g.add(bush);
  }
  function buildClaw(S) {
    const g = boothGroup('claw', wx2X(290));
    const pink = stdM('#ff9fbf', { roughness: .5 });
    g.add(box(4.6, 1.7, 2.2, pink, 0, .85, -3.3));
    const glass = new T.Mesh(new T.BoxGeometry(4.4, 2.3, 2), new T.MeshPhysicalMaterial({ color: col('#dff4ff'), roughness: .05, transmission: .85, transparent: true, clearcoat: 1, envMapIntensity: 2, depthWrite: false }));
    glass.position.set(0, 2.85, -3.3); glass.renderOrder = 3; g.add(glass);
    g.add(box(4.4, .1, 2, stdM('#c7e9fb'), 0, 1.75, -3.3));
    g.add(signBox('아이스크림 뽑기', 4.8, 1, 2.3, '#ff8fb3', '#ffffff', 0, 4.5, -3.3));
    const bulbs = [];
    for (let i = 0; i < 12; i++) { const b = sph(.07, glowM(i % 2 ? '#ffc857' : '#ffffff', 2.5), -2.2 + i * .4, 5.06, -2.12, 8, 6); b.castShadow = false; g.add(b); bulbs.push(b); }
    const iceCols = ['#ff9fbf', '#fff4d6', '#9ff0d0', '#a8704c', '#c9a8ff'];
    for (let i = 0; i < 5; i++) {
      const c = cone(.14, .42, stdM('#f2c27a', { roughness: .8 }), -1.5 + i * .75, 2.05, -3.2, 12); c.rotation.x = Math.PI; g.add(c);
      g.add(sph(.18, stdM(iceCols[i], { roughness: .6 }), -1.5 + i * .75, 2.35, -3.2, 14, 10));
    }
    const claw = new T.Group(); claw.add(cyl(.02, .02, .8, stdM('#7c82a0', { metalness: .6, roughness: .3 }), 0, -.4, 0, 6)); claw.add(box(.3, .15, .3, stdM('#9aa0bb', { metalness: .6, roughness: .3 }), 0, -.85, 0));
    for (const s of [-1, 1]) { const p = cyl(.02, .02, .3, stdM('#7c82a0', { metalness: .6 }), s * .12, -1.02, 0, 6); p.rotation.z = s * .4; claw.add(p); }
    claw.position.set(0, 3.95, -3.3); g.add(claw);
    g.add(box(4.2, .08, .08, stdM('#9aa0bb', { metalness: .5 }), 0, 3.95, -3.3));
    g.add(sph(.16, stdM('#ef3f5a', { roughness: .3 }), 1.2, 1.72, -2.3, 12, 8));
    PK.anim.push(() => { claw.position.x = Math.sin(time * 1.3) * 1.6; bulbs.forEach((b, i) => { b.visible = ((i + Math.floor(time * 4)) % 2) === 0; }); });
  }
  function buildDrop(S) {
    const g = boothGroup('drop', wx2X(470));
    g.add(cyl(2.6, 2.8, .35, stdM('#e9d8ff'), 0, .17, -3.6, 32));
    const tex = stripesTex('#ff8fb3', '#ffffff', 2, false, { repeat: [1, 16] });
    g.add(cyl(.42, .42, 22, stdM('#ffffff', { map: tex, roughness: .5 }), 0, 11, -3.6, 20));
    g.add(cone(.8, 1.4, stdM('#e0648f'), 0, 22.7, -3.6));
    const top = sph(.28, glowM('#fff3b0', 3), 0, 23.6, -3.6, 10, 8); top.castShadow = false; g.add(top);
    const gon = new T.Group();
    const ring = mesh(new T.TorusGeometry(1.35, .16, 10, 36), stdM('#ffc857', { metalness: .3, roughness: .35 }), 0, 0, 0); ring.rotation.x = Math.PI / 2; gon.add(ring);
    gon.add(cyl(1.35, 1.35, .3, stdM('#ffd98a', { roughness: .5 }), 0, -.1, 0, 36));
    const heads = ['#6b4f3a', '#8fe3c0', '#f2c14e', '#3b2a4a', '#e07a5f', '#9b7fd1'];
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; gon.add(sph(.16, stdM(heads[i]), Math.cos(a) * 1.35, .32, Math.sin(a) * 1.35, 10, 8)); }
    gon.position.set(0, 1, -3.6); g.add(gon);
    g.add(signBox('드롭타워', 2.2, .7, .12, '#ffffff', '#e0648f', 2.4, 1.8, -1.6));
    g.add(cyl(.05, .05, 1.5, stdM('#6a4a68'), 2.4, .75, -1.7, 6));
    PK.anim.push(() => {
      const c = time % 9; let y;
      if (c < 4) y = 1 + 17 * (c / 4 < .5 ? 2 * (c / 4) ** 2 : 1 - ((-2 * c / 4 + 2) ** 2) / 2);
      else if (c < 5) y = 18; else if (c < 5.5) { const k = (c - 5) / .5; y = 18 - 17 * k * k; } else y = 1;
      gon.position.y = y;
    });
  }
  function buildCloset(S) {
    const g = boothGroup('closet', wx2X(670));
    g.add(box(7, 4, 3.5, stdM('#efe4ff', { roughness: .95 }), 0, 2, -4.2));
    g.add(box(7.1, .4, 3.6, stdM('#d6c4f5'), 0, .2, -4.2));
    g.add(box(7.4, .3, 3.9, stdM('#4fbf9a', { roughness: .6 }), 0, 4.15, -4.2));
    awning(g, 6.9, '#8fe3c0', '#ffffff', 3.4, -1.9);
    g.add(signBox('룰루 옷장', 4.2, 1.05, .25, '#4fbf9a', '#ffffff', 0, 4.85, -3.4));
    windowBox(g, -1.4, 2, -2.42, 3.1, 2, '#ffe9f6');
    const dress = cone(.5, 1.1, stdM('#ff8fb3', { roughness: .6 }), -2.1, 1.7, -2.15); g.add(dress);
    g.add(sph(.18, stdM('#f5e6d8'), -2.1, 2.45, -2.15, 12, 8)); g.add(cyl(.03, .03, .8, stdM('#6a4a68'), -2.1, .95, -2.15, 6));
    ['#ffc857', '#8fe3c0', '#a58bff'].forEach((c, i) => g.add(cone(.22, .6, stdM(c, { roughness: .6 }), -.9 + i * .5, 2.2, -2.2)));
    g.add(box(1.6, .05, .05, stdM('#6a4a68'), -.4, 2.6, -2.2));
    g.add(box(1.3, 2.5, .15, stdM('#b69cff', { roughness: .5 }), 2, 1.25, -2.4));
    g.add(sph(.07, stdM('#ffc857', { metalness: .6, roughness: .3 }), 2.45, 1.2, -2.28, 8, 6));
  }
  function buildMart(S) {
    const g = boothGroup('mart', wx2X(975));
    g.add(box(7.6, 4.2, 3.6, stdM('#f4fff7', { roughness: .95 }), 0, 2.1, -4.2));
    g.add(box(7.7, .45, 3.7, stdM('#bfe9cb'), 0, .22, -4.2));
    g.add(box(8, .3, 4, stdM('#2e9e5a', { roughness: .6 }), 0, 4.35, -4.2));
    awning(g, 7.5, '#5cc97a', '#ffffff', 3.55, -1.9);
    g.add(signBox('신선 마트', 4.6, 1.1, .25, '#2e9e5a', '#ffffff', 0, 5.05, -3.4));
    // 유리 진열창과 선반
    const glass = new T.Mesh(new T.BoxGeometry(4.2, 2.3, .06), new T.MeshPhysicalMaterial({ color: col('#e8fff4'), roughness: .05, transmission: .8, transparent: true, clearcoat: 1, depthWrite: false }));
    glass.position.set(-1.3, 1.75, -2.35); glass.renderOrder = 3; g.add(glass);
    g.add(box(4.4, 2.5, .15, stdM('#ffffff', { roughness: .6 }), -1.3, 1.75, -2.55));
    const shelfCols = ['#e8233f', '#ff7a1a', '#ffe066', '#8fd3ff', '#a58bff', '#7fd15f', '#ff8fb3'];
    for (let r = 0; r < 3; r++) {
      g.add(box(4, .06, .5, stdM('#d99a6c'), -1.3, .9 + r * .7, -2.75));
      for (let i = 0; i < 8; i++) g.add(box(.32, .38, .3, stdM(shelfCols[(i + r * 3) % 7], { roughness: .5 }), -3 + i * .48, 1.12 + r * .7, -2.75));
    }
    const lit = box(4, .06, .3, glowM('#ffffff', 1.8), -1.3, 2.85, -2.45); lit.castShadow = false; g.add(lit);
    g.add(box(1.4, 2.5, .15, new T.MeshPhysicalMaterial({ color: col('#e8fff4'), roughness: .05, transmission: .6, transparent: true, clearcoat: 1 }), 2.3, 1.25, -2.4));
    g.add(box(.08, 2.5, .2, stdM('#2e9e5a'), 1.6, 1.25, -2.35)); g.add(box(.08, 2.5, .2, stdM('#2e9e5a'), 3, 1.25, -2.35));
    // 과일 상자와 장바구니 수레
    const crate = (x, c) => { g.add(box(.9, .45, .6, stdM('#c98a4f', { roughness: .8 }), x, .45, -1.6)); for (let i = 0; i < 6; i++) g.add(sph(.13, stdM(c, { roughness: .4 }), x - .3 + (i % 3) * .3, .75, -1.75 + Math.floor(i / 3) * .28, 10, 8)); g.add(box(.2, .5, .05, stdM('#8a5a31'), x, .25, -1.28)); };
    crate(-3.1, '#ef3f5a'); crate(-2.1, '#ffa62b'); crate(-1.1, '#b6e36a');
    const cart = new T.Group(); const wire = stdM('#9aa0bb', { metalness: .6, roughness: .3 });
    cart.add(box(.9, .6, .6, new T.MeshStandardMaterial({ color: col('#9aa0bb'), metalness: .6, roughness: .3, wireframe: true }), 0, .75, 0));
    cart.add(cyl(.02, .02, .8, wire, .5, .9, 0, 6)).children; cart.add(box(.05, .05, .7, stdM('#e8233f'), .55, 1.2, 0));
    for (const [x, z] of [[-.35, -.25], [.35, -.25], [-.35, .25], [.35, .25]]) cart.add(sph(.07, stdM('#3b1f3a'), x, .08, z, 8, 6));
    cart.position.set(3.4, 0, -1.4); cart.rotation.y = -.4; g.add(cart);
  }
  function buildFountain(S) {
    const g = boothGroup('fountain', wx2X(830));
    g.userData.booth = null;
    const stone = stdM('#dccbf7', { roughness: .8 });
    g.add(cyl(2, 2.1, .55, stone, 0, .27, -3.4, 36));
    const water = mesh(new T.CircleGeometry(1.85, 36), new T.MeshPhysicalMaterial({ color: col('#9fd3ff'), roughness: .05, clearcoat: 1, envMapIntensity: 2, transmission: .3, transparent: true }), 0, .5, -3.4, false);
    water.rotation.x = -Math.PI / 2; g.add(water);
    g.add(cyl(.22, .3, 1.6, stone, 0, 1.2, -3.4));
    g.add(cyl(.8, .5, .22, stone, 0, 2.05, -3.4, 24));
    const N = 160, pos = new Float32Array(N * 3), seeds = [];
    for (let i = 0; i < N; i++) seeds.push({ a: Math.random() * Math.PI * 2, t: Math.random(), v: .8 + Math.random() * .4 });
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    const pts = new T.Points(geo, new T.PointsMaterial({ size: .09, color: col('#e8f6ff').multiplyScalar(1.6), transparent: true, opacity: .9, depthWrite: false, blending: T.AdditiveBlending }));
    pts.position.set(0, 0, -3.4); g.add(pts);
    PK.anim.push(dt => {
      for (let i = 0; i < N; i++) {
        const s = seeds[i]; s.t += dt * .7 * s.v; if (s.t > 1) { s.t -= 1; s.a = Math.random() * Math.PI * 2; }
        const r = .2 + s.t * 1.5, y = 2.2 + Math.sin(s.t * Math.PI) * 1.3 - s.t * 1.6;
        pos[i * 3] = Math.cos(s.a) * r; pos[i * 3 + 1] = Math.max(.5, y); pos[i * 3 + 2] = Math.sin(s.a) * r;
      }
      geo.attributes.position.needsUpdate = true;
    });
  }
  function buildLamp(S, X) {
    const tex = stripesTex('#ff8fb3', '#ffffff', 2, false, { repeat: [1, 10] });
    S.add(cyl(.08, .08, 4.3, stdM('#ffffff', { map: tex, roughness: .5 }), X, 2.15, -1.9, 10));
    S.add(cyl(.2, .26, .2, stdM('#6a4a68'), X, .1, -1.9, 12));
    const head = sph(.24, glowM('#fff1b0', 2.8), X, 4.45, -1.9, 14, 10); head.castShadow = false; S.add(head);
    S.add(cone(.3, .3, stdM('#ff8fb3'), X, 4.8, -1.9));
    const halo = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color: col('#ffe9a8'), transparent: true, opacity: .55, blending: T.AdditiveBlending, depthWrite: false }));
    halo.scale.set(1.6, 1.6, 1); halo.position.set(X, 4.45, -1.85); S.add(halo);
  }
  function buildBunting(S, x1, x2) {
    const pts = [], N = 40, y0 = 4.25, z = -1.9, sag = .7;
    for (let i = 0; i <= N; i++) { const t = i / N; pts.push(new T.Vector3(x1 + (x2 - x1) * t, y0 - sag * (1 - (2 * t - 1) ** 2), z)); }
    S.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: col('#6a4a68') })));
    const cols = ['#ff8fb3', '#8fe3c0', '#ffc857', '#a58bff'];
    const tri = new T.BufferGeometry(); tri.setAttribute('position', new T.BufferAttribute(new Float32Array([-.22, 0, 0, .22, 0, 0, 0, -.42, 0]), 3)); tri.computeVertexNormals();
    const flags = [];
    for (let i = 1; i < N; i += 2) {
      const f = new T.Mesh(tri, new T.MeshStandardMaterial({ color: col(cols[(i >> 1) % 4]), side: T.DoubleSide, roughness: .7 }));
      f.position.copy(pts[i]); f.castShadow = true; S.add(f); flags.push(f);
    }
    PK.anim.push(() => { flags.forEach((f, i) => { f.rotation.x = Math.sin(time * 2.2 + i * .7) * .25; }); });
  }
  // 손님 세운 판 (걸음 두 동작)
  function npcSprite(i) {
    if (!PK.npcs[i]) {
      const b = billboard(document.createElement('canvas'), true);
      const bal = new T.Group();
      bal.add(cyl(.008, .008, 1.1, stdM('#6a4a68'), 0, .55, 0, 4));
      const s = sph(.22, new T.MeshPhysicalMaterial({ color: col('#ff6f9c'), roughness: .2, clearcoat: 1, envMapIntensity: 1.5 }), 0, 1.25, 0, 16, 12); s.scale.y = 1.15; bal.add(s); bal.ball = s;
      bal.visible = false; b.add(bal);
      PK.scene.add(b); PK.npcs[i] = b; b.bal = bal;
    }
    return PK.npcs[i];
  }

  // ================= 탕후루 가게 =================
  const KT = { scene: null, cam: null, pitch: 0, pitchT: 0, fixedPitch: {}, pools: {}, used: {}, pieces: {}, stickPool: [], stickUsed: 0, spritePool: [], spriteUsed: 0, pot: null, potOn: false, board: null, boardOn: false, steam: [], look: {}, foodPools: {}, foodUsed: {}, steamSrc: null, stream: null };
  function buildKitchen() {
    const S = KT.scene = new T.Scene();
    const cam = KT.cam = new T.PerspectiveCamera(30, 16 / 9, .1, 80);
    cam.position.set(0, 2.2, 7.6); cam.rotation.order = 'YXZ';
    S.add(new T.HemisphereLight(col('#fff4f8'), col('#ffd0dc'), .55));
    const key = new T.DirectionalLight(col('#fff0dc'), 1.1);
    key.position.set(4.5, 6, 6); key.target.position.set(0, 1, -1); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -8, right: 8, top: 6, bottom: -3, near: 1, far: 25 }); key.shadow.bias = -.0005; key.shadow.normalBias = .02;
    S.add(key, key.target);
    const warm = new T.PointLight(col('#ffd9a0'), .7, 12, 2); warm.position.set(-3, 3.4, 1.5); S.add(warm);
    const glint = new T.PointLight(col('#ffffff'), .9, 10, 2); glint.position.set(1.5, 3.2, 4.5); S.add(glint);
    // 벽지
    const paper = ctex(512, 512, (g, w, h) => {
      g.fillStyle = '#ffe4ee'; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 48) { g.fillStyle = '#ffd6e5'; g.fillRect(x, 0, 24, h); }
      g.fillStyle = 'rgba(255,255,255,0.55)';
      for (let y = 24; y < h; y += 64) for (let x = 36; x < w; x += 48) { g.beginPath(); g.arc(x - 3, y, 4, 0, 7); g.arc(x + 3, y, 4, 0, 7); g.fill(); g.beginPath(); g.moveTo(x - 7, y + 1); g.lineTo(x, y + 9); g.lineTo(x + 7, y + 1); g.fill(); }
    }, { repeat: [5, 2.2] });
    const wall = mesh(new T.PlaneGeometry(30, 12), stdM('#ffffff', { map: paper, roughness: .95 }), 0, 5, -3); wall.castShadow = false; S.add(wall);
    // 카운터
    const front = ctex(256, 256, (g, w, h) => { g.fillStyle = '#f596b4'; g.fillRect(0, 0, w, h); g.fillStyle = '#e87ea0'; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 6, h); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 0, w, 10); }, { repeat: [10, 1] });
    const cp = stdM('#f596b4'), ctr = box(30, 1.1, 1.8, [cp, cp, cp, cp, stdM('#ffffff', { map: front, roughness: .7 }), cp], 0, .55, .3);
    S.add(ctr);
    S.add(box(30.2, .1, 1.95, stdM('#ffc6d7', { roughness: .35 }), 0, 1.15, .3));
    KT.counterTop = new T.Vector3(0, 1.2, 1.25);
    // 도마 (재료 꽂을 때)
    KT.board = box(3.9, .12, 1, stdM('#e8b184', { roughness: .6 }), 0, 1.26, .55); S.add(KT.board);
    // 냄비
    KT.pot = buildPot(); S.add(KT.pot);
    // 카메라 기울기 (카운터 윗선이 2D 배치와 맞도록)
    for (const y of [96, 108, 170]) KT.fixedPitch[y] = solvePitch(y);
    KT.pitch = KT.fixedPitch[96]; cam.rotation.x = KT.pitch; cam.updateMatrixWorld();
    // 창문·선반·전구 줄은 재료 꽂기 화면 기준 2D 위치에 붙박는다
    const onWall = (lx, ly) => onPlaneZ(cam, lx, ly, -2.95);
    const a = onWall(254, 20), b = onWall(316, 66);
    const wW = b.x - a.x, wH = a.y - b.y, wc = a.clone().add(b).multiplyScalar(.5);
    const view = ctex(256, 192, (g, w, h) => {
      const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#9fd8ff'); sky.addColorStop(.7, '#e3f4ff'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
      g.fillStyle = '#9fe0b0'; g.beginPath(); g.ellipse(60, h, 110, 60, 0, 0, 7); g.fill(); g.fillStyle = '#7fd394'; g.beginPath(); g.ellipse(200, h + 10, 120, 70, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; for (const [x, y] of [[60, 40], [80, 34], [100, 42]]) { g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill(); }
    });
    const win = mesh(new T.PlaneGeometry(wW, wH), new T.MeshBasicMaterial({ map: view, color: new T.Color(1.35, 1.3, 1.25) }), wc.x, wc.y, -2.94, false); S.add(win);
    const fm = stdM('#d99a6c', { roughness: .6 });
    for (const [x, y, w, h] of [[wc.x, a.y, wW + .2, .12], [wc.x, b.y, wW + .2, .12], [a.x, wc.y, .12, wH], [b.x, wc.y, .12, wH], [wc.x, wc.y, .08, wH], [wc.x, wc.y + wH * .15, wW, .08]]) S.add(box(w, h, .12, fm, x, y, -2.9));
    const sill = box(wW + .5, .1, .35, fm, wc.x, b.y - .06, -2.8); S.add(sill);
    const sunPatch = new T.SpotLight(col('#fff3d6'), .9, 14, .5, .6, 1.5); sunPatch.position.set(wc.x + 1, wc.y + 3, 3); sunPatch.target.position.set(wc.x - 1, 1.2, -1); S.add(sunPatch, sunPatch.target);
    // 선반과 사탕 병
    const s1 = onWall(118, 60), s2 = onWall(246, 60);
    S.add(box(s2.x - s1.x, .1, .5, fm, (s1.x + s2.x) / 2, s1.y, -2.72));
    const jarG = new T.MeshPhysicalMaterial({ color: col('#ffffff'), roughness: .05, transmission: .9, transparent: true, clearcoat: 1, envMapIntensity: 2.2, depthWrite: false });
    const candy = ['#ff8fb3', '#ffc857', '#8fe3c0', '#a58bff', '#ef3f5a'];
    for (let i = 0; i < 5; i++) {
      const x = s1.x + (i + .5) * (s2.x - s1.x) / 5, hgt = .5 + (i % 2) * .15;
      const j = cyl(.2, .2, hgt, jarG, x, s1.y + .05 + hgt / 2, -2.7, 20); j.renderOrder = 2; j.castShadow = false; S.add(j);
      S.add(cyl(.21, .21, .07, stdM('#e0648f'), x, s1.y + .08 + hgt, -2.7, 20));
      for (let k = 0; k < 7; k++) { const c = sph(.06, stdM(candy[(i + k) % 5], { roughness: .25 }), x + (Math.random() - .5) * .22, s1.y + .12 + Math.random() * hgt * .6, -2.7 + (Math.random() - .5) * .2, 8, 6); c.castShadow = false; S.add(c); }
    }
    // 전구 줄
    const bulbs = [];
    for (let i = 0; i <= 34; i++) {
      const p = onWall(4 + i * 9.3, 17 + 2 * Math.sin(i * .9));
      const b = sph(.045, glowM(i % 3 ? '#fff3b0' : '#ffc857', 3), p.x, p.y, -2.85, 8, 6); b.castShadow = false; S.add(b); bulbs.push(b);
    }
    KT.anim = () => bulbs.forEach((b, i) => { b.material.color.setScalar(((i + Math.floor(time * 2)) % 3 === 0) ? 1.2 : 3); b.material.color.multiply(col(i % 3 ? '#fff3b0' : '#ffc857')); });
    // 김
    const st = glowTex();
    for (let i = 0; i < 26; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: st, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); s.visible = false; s.life = Math.random(); S.add(s); KT.steam.push(s); }
  }
  function buildPot() {
    const g = new T.Group();
    const metal = stdM('#a9b0cc', { metalness: .45, roughness: .22 });
    const prof = [[0, -1], [.98, -1], [1, -.95], [1, 0], [1.06, .02], [1.06, .06], [.97, .06], [.97, -.9], [0, -.9]].map(p => new T.Vector2(p[0], p[1]));
    const body = mesh(new T.LatheGeometry(prof, 48), metal, 0, 0, 0); body.material.side = T.DoubleSide; g.add(body);
    for (const s of [-1, 1]) { const h = box(.34, .09, .16, stdM('#7c82a0', { metalness: .6, roughness: .35 }), s * 1.2, -.18, 0); g.add(h); }
    const syrup = mesh(new T.CircleGeometry(.96, 48), new T.MeshPhysicalMaterial({ color: col('#ffe08a'), roughness: .08, clearcoat: 1, envMapIntensity: 1.6, emissive: col('#ff9a2e'), emissiveIntensity: .15 }), 0, -.05, 0, false);
    syrup.rotation.x = -Math.PI / 2; syrup.receiveShadow = true; g.add(syrup); g.syrup = syrup;
    const bubbles = [];
    for (let i = 0; i < 14; i++) { const b = sph(.06, new T.MeshPhysicalMaterial({ color: col('#fff0c0'), roughness: .05, clearcoat: 1, transparent: true, opacity: .9 }), 0, -.05, 0, 10, 6); b.castShadow = false; b.scale.y = .5; b.t = Math.random(); g.add(b); bubbles.push(b); }
    g.bubbles = bubbles;
    const stove = cyl(1.25, 1.35, .12, stdM('#4a3a55', { metalness: .4, roughness: .5 }), 0, -1.12, 0, 36); g.add(stove);
    const flames = [];
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const f = cone(.07, .28, new T.MeshBasicMaterial({ color: new T.Color(2.6, 1.1, .3), transparent: true, opacity: .9, blending: T.AdditiveBlending, depthWrite: false }), Math.cos(a) * .78, -1.02, Math.sin(a) * .78, 8); f.castShadow = false; g.add(f); flames.push(f); }
    g.flames = flames;
    g.visible = false;
    return g;
  }
  // 2D 배치 좌표 → 카메라 광선이 z 평면과 만나는 점
  const _v = new T.Vector3(), _d = new T.Vector3(), _f = new T.Vector3();
  function onPlaneZ(cam, lx, ly, z) {
    _v.set(lx / LW * 2 - 1, -(ly / LH * 2 - 1), .5).unproject(cam);
    _d.copy(_v).sub(cam.position).normalize();
    const t = (z - cam.position.z) / _d.z;
    return new T.Vector3().copy(cam.position).addScaledVector(_d, t);
  }
  function upp(cam, p) { cam.getWorldDirection(_f); const dist = _v.copy(p).sub(cam.position).dot(_f); return 2 * dist * Math.tan(cam.fov * Math.PI / 360) / LH; }
  function projY(cam, p) { _v.copy(p).project(cam); return (1 - (_v.y + 1) / 2) * LH; }
  function solvePitch(targetY) {
    const cam = KT.cam; let lo = -.9, hi = .5;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2; cam.rotation.x = mid; cam.updateMatrixWorld();
      if (projY(cam, KT.counterTop) < targetY) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }
  function poolGet(id) {
    const pool = KT.pools[id] || (KT.pools[id] = []);
    const n = KT.used[id] = (KT.used[id] || 0) + 1;
    if (!pool[n - 1]) { const p = makePiece(id); KT.scene.add(p); pool.push(p); }
    return pool[n - 1];
  }

  // ================= 신선 마트 즉석 요리 모형 =================
  // 모든 모형은 폭 2(반지름 1) 기준으로 만들고, 2D 배치 크기에 맞춰 키운다.
  function cupLabelTex(main, band, text) {
    return ctex(512, 256, (g, w, h) => {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      g.fillStyle = band; g.fillRect(0, h * .16, w, h * .66);
      g.fillStyle = main; g.fillRect(0, h * .22, w, h * .54);
      g.font = 'bold 48px Galmuri11, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (const x of [w * .25, w * .75]) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillText(text, x + 3, h * .5 + 3); g.fillStyle = '#ffffff'; g.fillText(text, x, h * .5); }
      g.fillStyle = 'rgba(255,255,255,.4)'; for (let x = 8; x < w; x += 24) g.fillRect(x, h * .86, 8, 8);
    }, { nearest: true });
  }
  function lidTex(main, text) {
    return ctex(256, 256, (g, w, h) => {
      const r = g.createLinearGradient(0, 0, w, h); r.addColorStop(0, '#f4f6fb'); r.addColorStop(.5, '#c9cede'); r.addColorStop(1, '#eef0f6');
      g.fillStyle = r; g.fillRect(0, 0, w, h);
      g.fillStyle = main; g.beginPath(); g.arc(w / 2, h / 2, 78, 0, 7); g.fill();
      g.font = 'bold 36px Galmuri11, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(text, w / 2, h / 2 + 2);
    });
  }
  let noodleTexC = null;
  function noodleTex() {
    if (noodleTexC) return noodleTexC;
    return (noodleTexC = ctex(256, 256, (g, w, h) => {
      g.fillStyle = '#e9b95a'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) {
        g.strokeStyle = i % 3 ? '#ffe7a3' : '#f7cf73'; g.lineWidth = 3; g.beginPath();
        const y0 = Math.random() * h, ph = Math.random() * 6;
        for (let x = 0; x <= w; x += 6) { const y = y0 + Math.sin(x / 9 + ph) * 5; x ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke();
      }
    }));
  }
  function makeCup(kind) {
    const g = new T.Group();
    const ramen = kind === 'ramen';
    const wallPts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; wallPts.push(new T.Vector2(.72 + .28 * t, -.86 + .86 * t)); }
    g.add(mesh(new T.LatheGeometry(wallPts, 44), new T.MeshStandardMaterial({ map: ramen ? cupLabelTex('#e8233f', '#ffc857', '사발면') : cupLabelTex('#ff7a1a', '#ffe28a', '떡볶이'), roughness: .5 })));
    const inner = mesh(new T.LatheGeometry(wallPts.map(p => new T.Vector2(p.x * .965, p.y)), 44), stdM('#fff6ea', { side: T.BackSide, roughness: .9 }), 0, 0, 0, false); inner.receiveShadow = true; g.add(inner);
    const bottom = mesh(new T.CircleGeometry(.72, 32), stdM('#fff6ea'), 0, -.85, 0, false); bottom.rotation.x = -Math.PI / 2; g.add(bottom);
    const rim = mesh(new T.TorusGeometry(1, .035, 6, 48), stdM('#ffffff', { roughness: .4 })); rim.rotation.x = Math.PI / 2; g.add(rim);
    const broth = mesh(new T.CircleGeometry(1, 40), new T.MeshPhysicalMaterial({ color: col('#cfeeff'), roughness: .06, clearcoat: 1, transparent: true, opacity: .82 }), 0, -.8, 0, false);
    broth.rotation.x = -Math.PI / 2; broth.receiveShadow = true; g.add(broth); g.broth = broth;
    const nt = noodleTex();
    const dry = cyl(.62, .62, .32, new T.MeshStandardMaterial({ map: nt, color: col('#f5d27a'), roughness: .8 }), 0, -.66, 0, 24); g.add(dry); g.dry = dry;
    const wetTop = new T.MeshStandardMaterial({ map: nt, color: col('#fff0b8'), roughness: .45 });
    const wet = mesh(new T.CylinderGeometry(.9, .9, .12, 36), [stdM('#f4d58a'), wetTop, stdM('#f4d58a')], 0, -.2, 0, false); wet.receiveShadow = true; g.add(wet); g.wet = wet;
    const tt = new T.Group(); g.add(tt); g.tteok = tt;
    for (let i = 0; i < 11; i++) { const p = cyl(.085, .085, .42, stdM('#fff7ec', { roughness: .6 }), (Math.random() - .5) * 1.1, 0, (Math.random() - .5) * 1.1, 10); p.rotation.set(Math.PI / 2, Math.random() * 3, 0); p.castShadow = false; tt.add(p); }
    // 토핑
    const tg = new T.Group(); g.add(tg); g.tg = tg; g.tops = {};
    const add = (id, obj) => { tg.add(obj); g.tops[id] = obj; };
    const egg = new T.Group(); const ew = sph(.3, stdM('#fffdf6', { roughness: .5 }), 0, 0, 0, 16, 10); ew.scale.set(1, .32, 1); egg.add(ew); egg.add(sph(.13, new T.MeshPhysicalMaterial({ color: col('#ffb020'), roughness: .2, clearcoat: 1 }), .02, .08, .02, 14, 10)); egg.position.set(-.38, 0, .22); add('egg', egg);
    const cheese = box(.72, .025, .72, stdM('#ffd23f', { roughness: .45 }), .22, .03, -.1); cheese.rotation.set(.12, .5, .08); add('cheese', cheese);
    const kim = new T.Group(); for (let i = 0; i < 6; i++) { const b = box(.16, .04, .1, stdM(i % 2 ? '#e8472e' : '#d6362a', { roughness: .4 }), .3 + (Math.random() - .5) * .3, .02, .35 + (Math.random() - .5) * .3); b.rotation.y = Math.random() * 3; kim.add(b); } add('kimchi', kim);
    const oni = new T.Group(); for (let i = 0; i < 10; i++) { const r = mesh(new T.TorusGeometry(.05, .018, 6, 12), stdM(i % 3 ? '#7fd15f' : '#e9ffd8'), (Math.random() - .5) * 1.2, .03, (Math.random() - .5) * 1.2, false); r.rotation.x = Math.PI / 2; oni.add(r); } add('onion', oni);
    const sau = new T.Group(); for (let i = 0; i < 5; i++) { const s = cyl(.12, .12, .05, stdM('#f08a8a', { roughness: .45 }), -.1 + (i % 3) * .25 - .2, .03, -.35 + Math.floor(i / 3) * .3, 16); sau.add(s); } add('sausage', sau);
    // 뚜껑: 뒤쪽 가장자리를 축으로 벗겨진다
    const pivot = new T.Group(); pivot.position.set(0, .035, -1); g.add(pivot);
    const lid = mesh(new T.CircleGeometry(1.04, 40), new T.MeshStandardMaterial({ map: ramen ? lidTex('#e8233f', '사발면') : lidTex('#ff7a1a', '떡볶이'), roughness: .3, metalness: .35, side: T.DoubleSide }), 0, 0, 1);
    lid.rotation.x = -Math.PI / 2; pivot.add(lid); g.lid = pivot;
    g.update = (st, c, u) => {
      g.lid.rotation.x = -(st.lid || 0) * 2.3;
      g.lid.visible = (st.lid || 0) < .99;
      const lv = clamp(st.level || 0, 0, 1.05), y = -.84 + lv * .82, r = .72 + .28 * ((y + .86) / .86);
      g.broth.visible = lv > .02; g.broth.position.y = y; g.broth.scale.setScalar(r * .97);
      const soupCol = ramen ? '#e7873d' : '#d9262a';
      g.broth.material.color.copy(col(st.soup && lv > .05 ? (st.cooked || !ramen ? soupCol : '#f2b57a') : '#cfeeff'));
      g.broth.material.opacity = st.soup ? .95 : .78;
      const left = st.left != null ? st.left : 1;
      g.dry.visible = ramen && !st.cooked;
      g.wet.visible = ramen && !!st.cooked && left > .05;
      g.wet.position.y = Math.min(y - .02, -.1) - (1 - left) * .35; g.wet.scale.set(.6 + .4 * left, 1, .6 + .4 * left);
      g.tteok.visible = !ramen && left > .05; g.tteok.position.y = Math.max(-.7, Math.min(y, -.3)) - .05;
      g.tteok.rotation.y = st.stir || 0; g.tteok.children.forEach((p, i) => { p.visible = i / g.tteok.children.length < left; });
      const surf = ramen ? g.wet.position.y + .07 : g.tteok.position.y + .1;
      tg.position.y = surf; tg.rotation.y = !ramen ? (st.stir || 0) : 0;
      for (const id in g.tops) g.tops[id].visible = !!(st.tops && st.tops.includes(id)) && left > .3;
      if (st.tops && st.tops.includes('cheese') && st.cooked) g.tops.cheese.scale.set(1.15, .6, 1.15);
      else g.tops.cheese.scale.set(1, 1, 1);
      if (st.steam) KT.steamSrc = { pos: new T.Vector3(c.x, c.y + .05 * u * 50, c.z), s: u * 50, heat: st.steam };
    };
    return g;
  }
  function makeKimbap() {
    const g = new T.Group();
    const sh = new T.Shape();
    sh.moveTo(0, .78); sh.quadraticCurveTo(.08, .86, .16, .74); sh.lineTo(.8, -.46); sh.quadraticCurveTo(.86, -.6, .7, -.6);
    sh.lineTo(-.7, -.6); sh.quadraticCurveTo(-.86, -.6, -.8, -.46); sh.lineTo(-.16, .74); sh.quadraticCurveTo(-.08, .86, 0, .78);
    const geo = new T.ExtrudeGeometry(sh, { depth: .5, bevelEnabled: true, bevelSize: .08, bevelThickness: .08, bevelSegments: 3, curveSegments: 8 });
    geo.translate(0, 0, -.25);
    const riceTex = ctex(128, 128, (g2, w, h) => { g2.fillStyle = '#fbfaf2'; g2.fillRect(0, 0, w, h); for (let i = 0; i < 380; i++) { g2.fillStyle = Math.random() < .5 ? '#ffffff' : '#ece8da'; g2.beginPath(); g2.ellipse(Math.random() * w, Math.random() * h, 2.4, 1.3, Math.random() * 3, 0, 7); g2.fill(); } }, { repeat: [3, 3] });
    const rice = mesh(geo, stdM('#ffffff', { map: riceTex, roughness: .95 })); g.add(rice); g.rice = rice;
    const nori = box(1.9, .55, .74, stdM('#1f3a2a', { roughness: .55 }), 0, -.36, 0); g.add(nori); g.nori = nori;
    const fill = sph(.18, stdM('#ff8a5c', { roughness: .6 }), 0, .02, .27, 12, 8); fill.scale.z = .3; g.add(fill);
    const planeL = new T.Plane(new T.Vector3(-1, 0, 0), 0), planeR = new T.Plane(new T.Vector3(1, 0, 0), 0);
    const wrapMat = pl => new T.MeshPhysicalMaterial({ color: col('#f7fbff'), roughness: .15, transparent: true, opacity: .5, clearcoat: 1, depthWrite: false, clippingPlanes: [pl], side: T.DoubleSide });
    const L = mesh(geo, wrapMat(planeL), 0, 0, 0, false), Rm = mesh(geo, wrapMat(planeR), 0, 0, 0, false);
    L.scale.set(1.08, 1.08, 1.25); Rm.scale.set(1.08, 1.08, 1.25); L.renderOrder = Rm.renderOrder = 3; g.add(L, Rm);
    const strip = box(.12, 1.5, .66, stdM('#e8233f', { roughness: .4 }), 0, .05, 0); g.add(strip);
    const lab = box(.9, .32, .02, new T.MeshStandardMaterial({ map: signTex('참치마요', '#ffffff', '#e8233f', 256, 96, 36), roughness: .5 }), 0, -.05, .41); g.add(lab);
    g.update = (st) => {
      const s = st.wrap || 0, left = st.left != null ? st.left : 1;
      strip.visible = s < 1; lab.visible = s < 2; L.visible = s < 2; Rm.visible = s < 3;
      const wp = new T.Vector3(); g.getWorldPosition(wp); planeL.constant = wp.x; planeR.constant = -wp.x;
      nori.scale.x = st.torn ? .45 : 1; nori.position.x = st.torn ? .45 : 0;
      rice.scale.set(1, .35 + .65 * left, 1); rice.position.y = -(1 - left) * .4; fill.visible = left > .4 && left < .99;
      nori.visible = left > .1;
    };
    return g;
  }
  function makeKettle() {
    const g = new T.Group();
    const body = mesh(new T.LatheGeometry([[0, -.6], [.6, -.6], [.7, -.45], [.72, 0], [.58, .35], [.3, .5], [0, .52]].map(p => new T.Vector2(p[0], p[1])), 36), stdM('#8fe3c0', { roughness: .3, metalness: .25 }));
    g.add(body);
    g.add(sph(.1, stdM('#3b1f3a'), 0, .58, 0, 10, 8));
    const handle = mesh(new T.TorusGeometry(.42, .06, 8, 20, Math.PI), stdM('#3b1f3a', { roughness: .5 }), .05, .45, 0); handle.rotation.z = .1; g.add(handle);
    const spout = cyl(.07, .13, .7, stdM('#8fe3c0', { roughness: .3, metalness: .25 }), -.85, .05, 0, 12); spout.rotation.z = .95; g.add(spout);
    g.tip = new T.Vector3(-1.13, .27, 0);
    g.update = () => {};
    return g;
  }
  function makeMicrowave() {
    const g = new T.Group();
    g.add(box(2, 1.2, 1.2, stdM('#fff0f5', { roughness: .45 }), 0, 0, 0));
    const win = box(1.2, .8, .02, new T.MeshStandardMaterial({ color: col('#2b2336'), emissive: col('#ffcf7a'), emissiveIntensity: 0, roughness: .1 }), -.3, 0, .61); g.add(win); g.win = win;
    g.add(box(.36, .9, .03, stdM('#ffd0e0'), .7, 0, .61));
    for (let i = 0; i < 3; i++) g.add(box(.2, .08, .03, stdM('#e0648f'), .7, .25 - i * .18, .63));
    const disp = box(.26, .12, .03, new T.MeshBasicMaterial({ color: col('#7ee0c3').multiplyScalar(1.6) }), .7, .38, .63); g.add(disp); g.disp = disp;
    const plate = cyl(.45, .45, .04, new T.MeshStandardMaterial({ color: col('#ffffff'), emissive: col('#ffcf7a'), emissiveIntensity: 0, transparent: true, opacity: .9 }), -.3, -.3, .2, 24); g.add(plate); g.plate = plate;
    g.update = (st) => {
      g.win.material.emissiveIntensity = st.on ? .9 + Math.sin(time * 8) * .05 : .05;
      g.plate.material.emissiveIntensity = st.on ? .6 : 0; g.plate.rotation.y += st.on ? .05 : 0;
      g.disp.visible = !st.on || Math.floor(time * 2) % 2 === 0;
    };
    return g;
  }
  function makeMilk() {
    const g = new T.Group();
    g.add(mesh(new T.LatheGeometry([[0, -.9], [.42, -.9], [.5, -.75], [.6, -.3], [.58, .1], [.38, .45], [.26, .62], [0, .63]].map(p => new T.Vector2(p[0], p[1])), 32), new T.MeshPhysicalMaterial({ color: col('#ffe066'), roughness: .25, clearcoat: .8 })));
    g.add(cyl(.27, .27, .1, stdM('#ffffff'), 0, .66, 0, 20));
    const lab = mesh(new T.CylinderGeometry(.61, .61, .34, 32, 1, true), new T.MeshStandardMaterial({ map: signTex('바나나우유', '#ffffff', '#e0a82b', 512, 96, 40), roughness: .5 }), 0, -.35, 0, false); g.add(lab);
    const straw = cyl(.04, .04, 1.1, stdM('#ff8fb3', { roughness: .4 }), .08, 1.05, 0, 8); straw.rotation.z = -.15; g.add(straw); g.straw = straw;
    g.update = (st) => { g.straw.visible = !!st.straw; };
    return g;
  }
  const FOOD_MAKE = { ramen: makeCup, tteok: makeCup, kimbap: makeKimbap, kettle: makeKettle, micro: makeMicrowave, milk: makeMilk };

  // ---------- 크기 맞추기와 적응형 해상도
  let frameMs = 16, slowT = 0;
  function resize() {
    const w = glCanvas.clientWidth | 0, h = glCanvas.clientHeight | 0;
    if (!w || !h) return false;
    const want = Math.min(window.devicePixelRatio || 1, 1.75) * pr;
    const W = Math.round(w * want), H = Math.round(h * want);
    if (glCanvas.width !== W || glCanvas.height !== H) R.setSize(W, H, false);
    sizePost(W, H);
    return true;
  }

  // ================= 공개 API =================
  W3.init = (cv) => {
    try {
      glCanvas = cv;
      R = new T.WebGLRenderer({ canvas: cv, antialias: false, alpha: false, powerPreference: 'high-performance' });
      R.setClearColor(0xffe4ee, 1);
      R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap; R.localClippingEnabled = true;
      R.outputEncoding = T.LinearEncoding; R.toneMapping = T.NoToneMapping;
      R.autoClear = true;
      buildPost();
      sparkleTex = ctex(64, 64, (g) => {
        const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.2, 'rgba(255,255,255,.6)'); r.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = r; g.fillRect(0, 0, 64, 64); g.fillStyle = '#fff'; g.fillRect(31, 4, 2, 56); g.fillRect(4, 31, 56, 2);
      });
      buildFruits(); buildPark(); buildKitchen();
      cv.addEventListener('webglcontextlost', e => { e.preventDefault(); W3.ok = false; cv.style.visibility = 'hidden'; });
      W3.ok = true;
    } catch (e) { console.warn('3D 무대를 켜지 못해 2D로 그립니다', e); W3.ok = false; }
    return W3.ok;
  };
  W3.begin = (view) => {
    if (!W3.ok) return;
    if (view !== W3.view) { W3.view = view; glCanvas.style.visibility = view ? 'visible' : 'hidden'; W3.snap = true; }
    if (view === 'kitchen') { KT.used = {}; KT.stickUsed = 0; KT.spriteUsed = 0; KT.potOn = false; KT.boardOn = false; KT.foodUsed = {}; KT.steamSrc = null; KT.streamOn = false; }
  };
  // --- 거리·타이틀
  W3.park = (st) => {
    PK.st = st;
    const lx = wx2X(st.x);
    if (!PK.lulu) { PK.lulu = billboard(st.lulu, true); PK.scene.add(PK.lulu); }
    PK.lulu.setCanvas(st.lulu);
    PK.lulu.scale.set(2.4 * st.lulu.width / st.lulu.height, 2.4, 1);
    PK.lulu.position.set(lx, 0, .7);
    st.npcs.forEach((n, i) => {
      const b = npcSprite(i); b.visible = true; b.setCanvas(n.canvas);
      const hgt = 2.4 * n.canvas.height / 68;
      b.scale.set(hgt * n.canvas.width / n.canvas.height * (n.flip ? -1 : 1), hgt, 1);
      b.position.set(wx2X(n.x), 0, n.lane);
      b.bal.visible = !!n.bal;
      if (n.bal) { b.bal.ball.material.color.copy(col(n.bal)); b.bal.position.set(.25, .75, 0); b.bal.scale.set(1 / Math.abs(b.scale.x), 1 / b.scale.y, 1); }
    });
    for (let i = st.npcs.length; i < PK.npcs.length; i++) PK.npcs[i].visible = false;
  };
  W3.projectPark = (wx, y, z = .7) => { _v.set(wx2X(wx), y, z).project(PK.cam); return { x: (_v.x + 1) / 2 * LW, y: (1 - _v.y) / 2 * LH }; };
  const ray = new T.Raycaster(), ndc = new T.Vector2(), groundPlane = new T.Plane(new T.Vector3(0, 1, 0), 0);
  W3.pick = (lx, ly) => {
    ndc.set(lx / LW * 2 - 1, -(ly / LH * 2 - 1)); ray.setFromCamera(ndc, PK.cam);
    const hits = ray.intersectObjects(PK.booths, true);
    for (const h of hits) { let o = h.object; while (o && !o.userData.booth && o.parent) o = o.parent; if (o && o.userData.booth) return { booth: o.userData.booth }; }
    const p = new T.Vector3();
    if (ray.ray.intersectPlane(groundPlane, p)) return { wx: p.x / K + 450 };
    return null;
  };
  // --- 탕후루 가게: 2D 배치대로 넘겨받아 3D로 세운다
  const Z = { lulu: -.7, cat: .5, stick: .95, piece: .95, pot: .75 };
  W3.kitchen = (counterY) => { KT.targetPitch = KT.fixedPitch[counterY] != null ? KT.fixedPitch[counterY] : solvePitch(counterY); };
  W3.piece = (id, lx, ly, sizePx, q, z = Z.piece) => {
    const p = poolGet(id), c = onPlaneZ(KT.cam, lx, ly, z), s = sizePx * upp(KT.cam, c);
    p.visible = true; p.position.copy(c); p.scale.setScalar(s); coatPiece(p, q);
    p.rotation.y = q ? Math.sin(time * .9 + lx) * .5 : 0;
    if (p.spark.visible) { const k = (Math.sin(time * 3 + lx) + 1) / 2; p.spark.material.opacity = k; p.spark.scale.setScalar(.35 + k * .35); }
  };
  W3.stick = (x0, y0, x1, y1, z = Z.stick) => {
    let s = KT.stickPool[KT.stickUsed];
    if (!s) { s = cyl(1, 1, 1, stdM('#d9a066', { roughness: .55 }), 0, 0, 0, 10); KT.scene.add(s); KT.stickPool.push(s); }
    KT.stickUsed++;
    const a = onPlaneZ(KT.cam, x0, y0, z), b = onPlaneZ(KT.cam, x1, y1, z), r = 1.7 * upp(KT.cam, a);
    s.visible = true; s.position.copy(a).add(b).multiplyScalar(.5);
    s.scale.set(r, a.distanceTo(b), r);
    s.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  };
  W3.sprite = (cnv, lx, ly, lw, lh, z) => {
    let b = KT.spritePool[KT.spriteUsed];
    if (!b) { b = billboard(cnv, false); KT.scene.add(b); KT.spritePool.push(b); }
    KT.spriteUsed++;
    b.setCanvas(cnv);
    const c = onPlaneZ(KT.cam, lx + lw / 2, ly + lh / 2, z), u = upp(KT.cam, c);
    b.visible = true; b.position.copy(c); b.scale.set(lw * u, lh * u, 1); b.quaternion.copy(KT.cam.quaternion);
  };
  W3.board = (lx, ly, lw) => {
    const c = onPlaneZ(KT.cam, lx + lw / 2, ly, .55), u = upp(KT.cam, c);
    KT.boardOn = true; KT.board.position.set(c.x, 1.26, .55); KT.board.scale.set(lw * u / 3.9, 1, 1);
  };
  W3.pot = (cx, sy, syrupHex, heat) => {
    KT.potOn = true;
    const p = KT.pot, c = onPlaneZ(KT.cam, cx, sy, Z.pot), u = upp(KT.cam, c);
    p.visible = true; p.position.copy(c); p.scale.setScalar(46 * u); p.rotation.x = .34;
    p.syrup.material.color.copy(col(syrupHex)); p.syrup.material.emissiveIntensity = .1 + heat * .5;
    p.heat = heat;
  };
  // --- 즉석 요리: 2D 배치(가운데 좌표·폭)대로 모형을 세운다
  W3.food = (kind, lx, ly, sizePx, st = {}) => {
    const pool = KT.foodPools[kind] || (KT.foodPools[kind] = []);
    const n = KT.foodUsed[kind] = (KT.foodUsed[kind] || 0) + 1;
    if (!pool[n - 1]) { const m = FOOD_MAKE[kind](kind); KT.scene.add(m); pool.push(m); }
    const m = pool[n - 1], c = onPlaneZ(KT.cam, lx, ly, st.z != null ? st.z : .8), u = upp(KT.cam, c);
    m.visible = true; m.position.copy(c); m.scale.setScalar(sizePx * u / 2);
    m.rotation.set(st.tiltX || 0, st.rotY || 0, st.rotZ || 0);
    m.updateMatrixWorld(true);
    m.update(st, c, u);
    // 주전자 물줄기
    if (kind === 'kettle' && st.pour) {
      if (!KT.stream) { KT.stream = cyl(1, 1, 1, new T.MeshPhysicalMaterial({ color: col('#d8f1ff'), roughness: .05, transparent: true, opacity: .75, clearcoat: 1 }), 0, 0, 0, 10); KT.stream.castShadow = false; KT.scene.add(KT.stream); }
      const a = m.localToWorld(m.tip.clone()), b = onPlaneZ(KT.cam, st.tx, st.ty, .8), r = 1.2 * u;
      KT.streamOn = true; const sm = KT.stream; sm.visible = true;
      sm.position.copy(a).add(b).multiplyScalar(.5); sm.scale.set(r * (1 + Math.sin(time * 30) * .1), a.distanceTo(b), r);
      sm.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    }
  };
  // --- 프레임 마무리: 애니메이션과 렌더링
  W3.end = () => {
    if (!W3.ok) return;
    const now = performance.now(), dt = Math.min(.05, lastT ? (now - lastT) / 1000 : .016); lastT = now; time += dt;
    if (!W3.view) return;
    try {
      if (!resize()) return;
      if (W3.view === 'park' || W3.view === 'title') renderPark(dt);
      else if (W3.view === 'kitchen') renderKitchen(dt);
      W3.snap = false;
      // 느리면 해상도를 낮춘다
      const ft = performance.now() - now;
      frameMs = frameMs * .95 + (dt * 1000) * .05;
      if (frameMs > 26) { slowT += dt; if (slowT > 1.5 && pr > .55) { pr *= .8; slowT = 0; frameMs = 16; } } else slowT = 0;
      void ft;
    } catch (e) { console.warn('3D 렌더링 실패, 2D로 돌아갑니다', e); W3.ok = false; glCanvas.style.visibility = 'hidden'; }
  };
  function renderPark(dt) {
    const st = PK.st || { x: 450, npcs: [] }, title = W3.view === 'title';
    for (const f of PK.anim) f(dt);
    const cam = PK.cam;
    let tx, look;
    if (title) {
      const X = 1.2 * Math.sin(time * .15);
      cam.position.set(X, 2.9, 10.2); cam.lookAt(X * .5, 2.3, -3);
      PK.orbit.visible = true; PK.orbit.position.set(wx2X(st.x), 2.4, .7);
      PK.orbit.children.forEach((t, i) => { const a = time * .8 + i * Math.PI / 2; t.position.set(Math.cos(a) * 2.1, Math.sin(a * 1.3) * .25, Math.sin(a) * 1.2); t.rotation.y = -a; });
      tx = X;
    } else {
      PK.orbit.visible = false;
      tx = clamp(wx2X(st.x), -14, 24.5);
      PK.camX = W3.snap ? tx : PK.camX + (tx - PK.camX) * Math.min(1, dt * 4);
      cam.position.set(PK.camX, 5.4, 16.8); cam.lookAt(PK.camX, 2.1, -2.2);
      tx = PK.camX;
    }
    PK.sun.position.set(tx + 9, 18, 11); PK.sun.target.position.set(tx, 0, -2); PK.sun.target.updateMatrixWorld();
    _v.set(wx2X(st.x), 1.1, .7).project(cam);
    renderPost(PK.scene, cam, { focusY: (_v.y + 1) / 2, band: title ? .24 : .2, ramp: .36, maxBlur: .7, bloomStr: .28, exposure: .98, sat: 1.22, vig: .42 });
  }
  function renderKitchen(dt) {
    const cam = KT.cam;
    KT.pitch = W3.snap ? KT.targetPitch : KT.pitch + (KT.targetPitch - KT.pitch) * Math.min(1, dt * 5);
    cam.rotation.x = KT.pitch + Math.sin(time * .5) * .003; cam.rotation.y = Math.sin(time * .37) * .004; cam.updateMatrixWorld();
    for (const id in KT.pools) KT.pools[id].forEach((p, i) => { if (i >= (KT.used[id] || 0)) p.visible = false; });
    KT.stickPool.forEach((s, i) => { s.visible = i < KT.stickUsed; });
    KT.spritePool.forEach((s, i) => { s.visible = i < KT.spriteUsed; });
    KT.board.visible = KT.boardOn;
    for (const k in KT.foodPools) KT.foodPools[k].forEach((m, i) => { if (i >= (KT.foodUsed[k] || 0)) m.visible = false; });
    if (KT.stream) KT.stream.visible = !!KT.streamOn;
    const pot = KT.pot; pot.visible = KT.potOn;
    if (KT.potOn) {
      const heat = pot.heat || 0;
      pot.flames.forEach((f, i) => { f.scale.y = .7 + Math.abs(Math.sin(time * 13 + i * 1.7)) * .6; });
      pot.bubbles.forEach((b, i) => {
        b.t += dt * (.6 + heat * 1.6);
        if (b.t > 1) { b.t -= 1; const a = Math.random() * 6.28, r = Math.random() * .8; b.position.set(Math.cos(a) * r, -.04, Math.sin(a) * r); }
        const k = b.t; b.visible = heat > .15 && k < .9; b.scale.setScalar(.4 + k * 1.2); b.scale.y *= .5;
      });
      const wp = new T.Vector3(); pot.getWorldPosition(wp); const s = pot.scale.x;
      KT.steam.forEach((m, i) => {
        m.life += dt * (.25 + heat * .35); if (m.life > 1) { m.life -= 1; m.ox = (Math.random() - .5) * 1.2; }
        m.visible = heat > .1; m.position.set(wp.x + (m.ox || 0) * s + Math.sin(m.life * 4 + i) * .08 * s, wp.y + s * (.1 + m.life * 2.2), wp.z - .1);
        m.scale.setScalar(s * (.4 + m.life * 1.2)); m.material.opacity = Math.sin(m.life * Math.PI) * .22 * Math.min(1, heat * 1.5);
      });
    } else if (KT.steamSrc) {
      const src = KT.steamSrc, heat = src.heat, s = src.s;
      KT.steam.forEach((m, i) => {
        m.life += dt * (.22 + heat * .3); if (m.life > 1) { m.life -= 1; m.ox = (Math.random() - .5) * 1.2; }
        m.visible = true; m.position.set(src.pos.x + (m.ox || 0) * s * .8 + Math.sin(m.life * 4 + i) * .06 * s, src.pos.y + s * m.life * 1.8, src.pos.z - .1);
        m.scale.setScalar(s * (.3 + m.life)); m.material.opacity = Math.sin(m.life * Math.PI) * .2 * Math.min(1, heat);
      });
    } else KT.steam.forEach(m => { m.visible = false; });
    if (KT.anim) KT.anim();
    renderPost(KT.scene, cam, { focusY: .5, band: .36, ramp: .3, maxBlur: .38, bloomStr: .28, exposure: .98, sat: 1.18, vig: .38 });
  }
})();
