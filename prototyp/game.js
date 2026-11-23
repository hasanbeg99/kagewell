/* Kagewell prototyp — smooth vector well. 120 Hz step, interpolated render. */
(function () {
  'use strict';
  const CFG = { step: 1 / 120, maxFrameDt: 0.05, dprMax: 3, dprMin: 1.25 };
  const qs = new URLSearchParams(location.search);
  const NO_SPAWN = qs.get('noSpawn') === '1';
  const DEBUG = qs.get('debug') === '1';
  const HITBOX = qs.get('hitbox') === '1';
  let seed0 = qs.has('seed') ? (Number(qs.get('seed')) >>> 0) : (Date.now() >>> 0);
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  let rng = mulberry32(seed0 || 1);
  const C = {
    logicalW: 390, logicalH: 844, wall: 30, barrelW: 86, barrelH: 97,
    barrelTopMin: 150, barrelTopMax: 700, pxPerMeter: 16, wallContactPx: 12,
    inputStart: 0.6, inputFullMs: 100, inputReleaseMs: 80, actionBufferMs: 120,
    hysteresisDeg: 15,
    speedDown: 520, speedUp: 340, speedSide: 360,
    scroll0: 60, scrollAcc: 1.5, scrollMax: 150,
    portalScroll: 40, portalLerpToScroll0Ms: 400,
    hitboxSwayMax: 4, sagPx: 4, sagMs: 60,
    swordR: 72, swordWindup: 40, swordActive: 100, swordRecover: 40, swordSweepMs: 90, swordCd: 260,
    duckMs: 120, swingWindup: 70, swingMs: 520, swingArc: 60, swingPad: 10, swingCd: 1500,
    hitStopSword: 50, hitStopSwing: 40, swingShake: 4,
    spareStart: 1, spareMax: 3, breakInvuln: 1200, breakSpeed: 1.15,
    equipMs: 400, equipInvuln: 1000, pickupGapM: 60, pickupEveryM: 10, pickupChance: 0.25,
    safeMs: 300, impactGapMs: 350, firstCoinAtMs: 1500, firstEnemyAtMs: 2000,
    faintButtonMs: 300, pointsPerMeter: 10,     coinPoints: 10, noBarrelScoreMult: 1.5, coinDropOnKillChance: 0.45
  };
  const W = 390, BH = C.barrelH, BW = C.barrelW, TAU = Math.PI * 2;
  const SPRITE_SCALE = 1 / 3;
  const PLAY_SCALE = SPRITE_SCALE * 1.35;
  const FAINT_SCALE = 0.66;
  const CHAR_PIV = {
    'kiro-barrel-idle': { c: [240, 288], p: [120, 206], rope: 176 },
    'kiro-barrel-title': { c: [240, 288], p: [120, 196], rope: 18 },
    'kiro-barrel-swing': { c: [240, 288], p: [120, 205], rope: 174 },
    'kiro-barrel-slash': { c: [240, 288], p: [120, 211], rope: 180 },
    'kiro-barrel-duck': { c: [240, 288], p: [120, 220], rope: 196 },
    'kiro-hang-nobarrel': { c: [156, 216], p: [78, 91], rope: 91 },
    'kiro-lying-faint': { c: [360, 180], p: [180, 98] },
    'kiro-situp-proud': { c: [216, 216], p: [108, 149] },
    'tara-winch-ready': { c: [210, 270], p: [105, 264] },
    'tara-bends-over-kiro': { c: [360, 270], p: [180, 148] }
  };
  const charImg = {};
  function loadCharImages() {
    return Promise.all(Object.keys(CHAR_PIV).map(name => new Promise(res => {
      const img = new Image();
      img.onload = () => { charImg[name] = img; res(); };
      img.onerror = () => res();
      img.src = 'assets/chars/game-3x/' + name + '.png';
    })));
  }
  const baked = {};
  let poseBakeKey = '';
  const NUDGE_X = { 'kiro-barrel-slash': 7, 'kiro-barrel-duck': 5.2 };
  const NUDGE_Y = { 'kiro-barrel-slash': 2.2, 'kiro-barrel-duck': 6.2, 'kiro-barrel-swing': -0.5 };
  let poseCur = 'kiro-barrel-idle', poseOld = '', poseMix = 1;
  const PIVOT_DY = 48.5;
  const hit = { x: 0, y: 0, w: 58, h: 48 };
  const swingBox = { x: 0, y: 0, w: 0, h: 0 };
  const coinR = { x: 0, y: 0, w: 24, h: 24 };
  function halfW() { return barrel === 'broken' ? 30 : 29; }
  function boxAt(x, y, out) {
    const pivY = y + PIVOT_DY;
    if (barrel === 'broken') {
      out.x = x - 30; out.y = pivY - 38; out.w = 60; out.h = 92;
    } else {
      out.x = x - 29; out.y = pivY - 13; out.w = 58; out.h = 48;
    }
    return out;
  }
  function bodyBox() { return boxAt(px, py, hit); }
  function scaleFor(name) {
    if (name === 'kiro-barrel-title' || name === 'tara-winch-ready') return SPRITE_SCALE;
    if (name === 'kiro-lying-faint' || name === 'kiro-situp-proud' || name === 'tara-bends-over-kiro') return FAINT_SCALE;
    return PLAY_SCALE;
  }
  function bakePoses() {
    const mul = viewScale * dpr;
    const key = mul.toFixed(3);
    if (!mul || key === poseBakeKey) return;
    const names = Object.keys(CHAR_PIV);
    let ready = 0;
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const img = charImg[name];
      const spec = CHAR_PIV[name];
      if (!img || !spec || !img.complete || !img.naturalWidth) continue;
      ready++;
      const sc = scaleFor(name);
      const pw = Math.max(1, Math.round(spec.c[0] * sc * mul));
      const ph = Math.max(1, Math.round(spec.c[1] * sc * mul));
      let slot = baked[name];
      if (!slot || slot.c.width !== pw || slot.c.height !== ph) {
        const c = document.createElement('canvas');
        c.width = pw; c.height = ph;
        slot = baked[name] = { c: c, cssW: 0, cssH: 0, px: 0, py: 0 };
      }
      const g = slot.c.getContext('2d', { alpha: true });
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, pw, ph);
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = 'low';
      g.drawImage(img, 0, 0, pw, ph);
      slot.cssW = pw / mul;
      slot.cssH = ph / mul;
      slot.px = spec.p[0] / spec.c[0] * slot.cssW;
      slot.py = spec.p[1] / spec.c[1] * slot.cssH;
    }
    if (ready === names.length) poseBakeKey = key;
  }
  function drawBaked(name, wx, wy) {
    const b = baked[name];
    if (!b) return;
    const mul = viewScale * dpr || 1;
    ctx.drawImage(b.c, Math.round((wx - b.px) * mul) / mul, Math.round((wy - b.py) * mul) / mul, b.cssW, b.cssH);
  }
  function drawChar(name, wx, wy, scale, alpha) {
    const b = baked[name];
    if (!b) return;
    const prevA = ctx.globalAlpha;
    if (alpha != null) ctx.globalAlpha = prevA * alpha;
    const base = scaleFor(name);
    if (scale && Math.abs(scale - base) > 0.02) {
      const k = scale / base;
      const mul = viewScale * dpr || 1;
      const cssW = b.cssW * k, cssH = b.cssH * k;
      ctx.drawImage(b.c, Math.round((wx - b.px * k) * mul) / mul, Math.round((wy - b.py * k) * mul) / mul, cssW, cssH);
    } else drawBaked(name, wx, wy);
    ctx.globalAlpha = prevA;
  }
  const KEY = { coins: 'kagewell.prototyp.coins', bestD: 'kagewell.prototyp.bestDepth', bestS: 'kagewell.prototyp.bestScore', seen: 'kagewell.prototyp.seen' };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  let art = null;
  let cssW = 390, cssH = 844, viewScale = 1, visH = 844, camX = 0, viewW = 390, viewH = 844, cssPer = 1;
  let rawDPR = 1, dpr = 1, dprLimit = CFG.dprMax, adaptN = 0;
  let state = 'title', playMs = 0, depthPx = 0, scrollV = 0, portalT = 0, portalLen = 2500, seenRun = false;
  let px = 195, py = 360, moveK = 0, holdMs = 0, coast = null, stickDir = null, axisLock = null, lastSide = 1;
  let sagMode = 'B', visSag = 0, duckT = 0, barrel = 'intact', spares = 1, invuln = 0, equipT = 0;
  let slashPhase = null, slashT = 0, slashCd = 0, slashDir = 1, slashSerial = 0, bufUntil = 0, actionLast = '';
  let swingPhase = null, swingT = 0, swingU = 0, swingCd = 0, swingFromX = 0, swingFromY = 0, swingToX = 0, swingDir = 1, swingKills = 0, swingHit = false;
  let recoil = 0, impact = 0, pressed = false, runCoins = 0, totalCoins = 0, score = 0, bestD = 0, bestS = 0;
  let combo = 1, comboAt = -1e9, playerMoved = 0, unfair = false, caused = false, firstCreep = false, knotLock = 0;
  let waveT = 0, waveN = 1, waveOn = true, attackAt = 0, lastImpact = -1e9, lastPickupM = 0, pickupRoll = -1, pickup = null;
  let coinChainAt = 0, nextCoinM = 0, creakSide = 0, ropeCd = 0, hitStop = 0, breakFlash = 0;
  let bits = [];
  let uiNoch = null, uiTitel = null;
  let shake = 0, pauseAt = 0, titleAt = 0, biomeShown = 'moon', biomeBlend = 1, breakPop = 0;
  const POOL = 120;
  const pool = [];
  for (let i = 0; i < POOL; i++) pool.push({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, r: 3, col: '#fff', grav: 0, px0: 0, py0: 0 });
  let poolI = 0;
  const prev = {
    px: 195, py: 360, depth: 0, rot: 0, impact: 0, sag: 0, slashU: 0,
    joyX: 300, joyY: 700, knobX: 0, knobY: 0, ropeX: null, ropeY: null
  };
  const scarf = [];
  for (let i = 0; i < 8; i++) scarf.push({ x: 0, y: 0, ox: 0, oy: 0 });
  const dust = [];
  let joyAnchor = null, joyKnob = { dx: 0, dy: 0 }, joyFrom = null, joyTo = null, joyBack = 0, joyId = null;
  let restX = 300, restY = 700, ringD = 128, knobD = 52, deadFrac = 0.12;
  let act = { x: 70, y: 760, d: 72, hit: 88 }, barrelBtn = { x: 160, y: 760, d: 58, show: false };
  let ents = [], coins = [], parts = [];
  const ghost = [{ x: 0, y: 0, t: 0 }, { x: 0, y: 0, t: 0 }, { x: 0, y: 0, t: 0 }];
  let ghostN = 0, hudCoinT = 0, hudSpareT = 0;
  const washGrad = {}, washKey = {};
  let bot = null, frameTimes = [], workTimes = [], inputLags = [], adaptDts = [], coinPop = 0;
  const ptrs = new Map();
  const SEG = 12;
  prev.ropeX = new Float64Array(SEG + 1);
  prev.ropeY = new Float64Array(SEG + 1);
  const rx = new Float64Array(SEG + 1), ry = new Float64Array(SEG + 1), ox = new Float64Array(SEG + 1), oy = new Float64Array(SEG + 1);
  let ropeAcc = 0, ropeAx = 195;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(p) { p = clamp(p, 0, 1); return 1 - Math.pow(1 - p, 3); }
  function ir(a, b) { return a + rng() * (b - a); }
  function iint(a, b) { return (ir(a, b + 1)) | 0; }
  function choice(w) { let t = 0; for (const k in w) t += w[k]; let r = rng() * t; for (const k in w) { r -= w[k]; if (r <= 0) return k; } return Object.keys(w)[0]; }
  function depthM() { return depthPx / C.pxPerMeter; }
  function minX() { return C.wall + halfW(); }
  function maxX() { return W - C.wall - halfW(); }
  function gapL(x) { return (x - halfW()) - C.wall; }
  function gapR(x) { return (W - C.wall) - (x + halfW()); }
  function atWall(x) { x = x == null ? px : x; return gapL(x) <= C.wallContactPx || gapR(x) <= C.wallContactPx; }
  function atLeft(x) { return gapL(x == null ? px : x) <= C.wallContactPx; }
  function playBottom() {
    const controlTop = Math.min(act.y - act.d / 2, restY - ringD / 2);
    return Math.min(C.barrelTopMax, visH - L(120), controlTop - 72);
  }
  function speedMul() { return barrel === 'intact' ? 1 : C.breakSpeed; }
  let insetCache = { t: 0, b: 0, l: 0, r: 0 }, insetAt = 0;
  function insets() {
    const now = performance.now();
    if (insetAt) return insetCache;
    const g = id => document.getElementById(id).getBoundingClientRect();
    insetCache = { t: g('sat').height, b: g('sab').height, l: g('sal').width, r: g('sar').width };
    insetAt = now;
    return insetCache;
  }
  function L(css) { return css / (viewScale || 1); }

  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    cssW = Math.max(1, Math.min(vw, 480));
    cssH = Math.max(1, vh);
    viewScale = cssW / W;
    visH = cssH / viewScale;
    viewW = W;
    viewH = visH;
    camX = 0;
    rawDPR = window.devicePixelRatio || 1;
    dpr = Math.min(rawDPR, dprLimit);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    const bw = Math.max(1, Math.round(cssW * dpr)), bh = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    cssPer = cssW / Math.max(1, viewW);
    const s = insets();
    const edgeX = (24 + s.l) / cssPer, edgeR = (24 + s.r) / cssPer, edgeB = (24 + s.b) / cssPer;
    const right = camX + viewW, bottom = viewH;
    ringD = 64 * Math.ceil(120 / (64 * cssPer));
    knobD = 32 * Math.ceil(48 / (32 * cssPer));
    restX = right - edgeR - ringD / 2;
    restY = bottom - edgeB - ringD / 2;
    act.d = Math.ceil(90 / cssPer);
    act.hit = Math.ceil(110 / cssPer);
    act.x = camX + edgeX + act.d / 2;
    act.y = bottom - edgeB - act.d / 2;
    barrelBtn.d = Math.ceil(72 / cssPer);
    barrelBtn.hit = Math.ceil(88 / cssPer);
    const gapBtn = Math.ceil(28 / cssPer);
    barrelBtn.x = act.x + act.d / 2 + gapBtn + barrelBtn.d / 2;
    barrelBtn.y = act.y;
    if (barrelBtn.x + barrelBtn.d / 2 > restX - ringD / 2 - 8 / cssPer) barrelBtn.y = act.y - act.d / 2 - gapBtn - barrelBtn.d / 2;
    if (joyId == null && joyBack <= 0) joyAnchor = { x: restX, y: restY };
    const bakeKey = (viewScale * dpr).toFixed(3);
    if (rootBake() && bakeKey !== resize.bakeKey) {
      resize.bakeKey = bakeKey;
      art = rootBake().build(viewScale * dpr);
    }
    bakePoses();
  }
  function rootBake() { return window.KWBake || null; }
  function burst(x, y, n, col, speed, life, grav) {
    for (let i = 0; i < n; i++) {
      const p = pool[poolI];
      poolI = (poolI + 1) % POOL;
      const a = rng() * TAU, sp = speed * (0.35 + rng() * 0.65);
      p.alive = true;
      p.x = p.px0 = x; p.y = p.py0 = y;
      p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - speed * 0.25;
      p.life = p.max = life * (0.65 + rng() * 0.35);
      p.r = 2.5 + rng() * 4.5; p.col = col; p.grav = grav == null ? 420 : grav;
    }
  }
  function stepParts(dtMs) {
    const dt = dtMs / 1000;
    for (let i = 0; i < POOL; i++) {
      const p = pool[i];
      if (!p.alive) continue;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.grav * dt;
      p.life -= dtMs;
      if (p.life <= 0) p.alive = false;
    }
    if (shake > 0) {
      shake *= Math.pow(0.05, dtMs / 180);
      if (shake < 0.08) shake = 0;
    }
  }
  function visualRot() {
    if (swingPhase === 'fly') return swingDir * swingU * TAU;
    if (duckT > 0 && barrel === 'intact') return (atLeft() ? 1 : -1) * (3 * Math.PI / 180) * (duckT / C.duckMs);
    return 0;
  }
  function slashVisual() {
    if (!slashPhase) return 0;
    const u = slashPhase === 'windup' ? 0.08 : slashPhase === 'active' ? clamp(slashT / C.swordSweepMs, 0, 1) : 1;
    return ease(u);
  }
  function snapshot() {
    prev.px = px; prev.py = py; prev.depth = depthPx;
    prev.rot = visualRot(); prev.impact = impact; prev.sag = visSag; prev.slashU = slashVisual();
    const j = joyAnchor || { x: restX, y: restY };
    prev.joyX = j.x; prev.joyY = j.y; prev.knobX = joyKnob.dx; prev.knobY = joyKnob.dy;
    prev.ropeX.set(rx); prev.ropeY.set(ry);
    for (let i = 0; i < scarf.length; i++) { scarf[i].px0 = scarf[i].x; scarf[i].py0 = scarf[i].y; }
    for (const e of ents) { e.px0 = e.x; e.py0 = e.y; e.pext = e.ext || 0; }
    for (const c of coins) { c.px0 = c.x; c.pfly = c.fly || 0; c.psy = c.sy; }
    for (const b of bits) { b.px0 = b.x; b.py0 = b.y; }
    for (let i = 0; i < POOL; i++) if (pool[i].alive) { pool[i].px0 = pool[i].x; pool[i].py0 = pool[i].y; }
  }

  function logical(e) {
    const r = canvas.getBoundingClientRect();
    const sx = viewW / r.width, sy = viewH / r.height;
    return { x: camX + (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  }
  function hitRect(p, x, y, w, h) { return p.x >= x && p.y >= y && p.x <= x + w && p.y <= y + h; }
  function hitCircle(p, c, rad) { return Math.hypot(p.x - c.x, p.y - c.y) <= rad; }

  let queuedAction = '';
  function predict() {
    if ((state !== 'play' && state !== 'portal') || swingPhase) return 'locked';
    if (barrel === 'intact' && atWall() && swingCd <= 0) return 'swing';
    if (slashCd > 0 || slashPhase) return 'locked';
    return 'sword';
  }
  function steer(dx, dy) {
    const ax = Math.abs(dx), ay = Math.abs(dy);
    const tan60 = Math.tan((45 + C.hysteresisDeg) * Math.PI / 180);
    const tan30 = Math.tan((45 - C.hysteresisDeg) * Math.PI / 180);
    if (!axisLock) {
      if (ay > ax * tan60) axisLock = 'v';
      else if (ay < ax * tan30) axisLock = 'h';
      else return null;
    } else if (axisLock === 'h' && ay > ax * tan60) axisLock = 'v';
    else if (axisLock === 'v' && ay < ax * tan30) axisLock = 'h';
    const d = axisLock === 'h' ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    if (d === 'left') lastSide = -1; else if (d === 'right') lastSide = 1;
    return d;
  }
  function readJoy() {
    if (joyId == null || !ptrs.has(joyId) || !joyAnchor) { joyKnob = { dx: 0, dy: 0 }; return; }
    const pr = ptrs.get(joyId);
    let dx = pr.x - joyAnchor.x, dy = pr.y - joyAnchor.y;
    const mag = Math.hypot(dx, dy), R = ringD / 2;
    if (mag > R && mag > 0) { dx *= R / mag; dy *= R / mag; }
    joyKnob = { dx: dx, dy: dy };
    const m = Math.min(mag, R);
    if (m < R * deadFrac) { axisLock = null; stickDir = null; return; }
    stickDir = steer(dx, dy);
  }

  function onDown(e) {
    e.preventDefault();
    const p = logical(e);
    const hudBottom = L(86);
    if (state === 'title' && hitRect(p, camX + viewW / 2 - 130, viewH * 0.70, 260, 64)) { beginRun(); return; }
    if (state === 'faint') {
      if (faintAge() >= C.faintButtonMs && uiNoch && hitRect(p, uiNoch.x, uiNoch.y, uiNoch.w, uiNoch.h)) { again(); return; }
      if (faintAge() >= C.faintButtonMs && uiTitel && hitRect(p, uiTitel.x, uiTitel.y, uiTitel.w, uiTitel.h)) { toTitle(); return; }
      return;
    }
    if (state === 'pause') {
      if (hitRect(p, W / 2 - L(90), visH * 0.42, L(180), L(44))) { state = 'play'; KWAudio.play('ui_click'); return; }
      if (hitRect(p, W / 2 - L(90), visH * 0.52, L(180), L(44))) { KWAudio.setMuted(!KWAudio.muted); KWAudio.play('ui_click'); return; }
      if (hitRect(p, W / 2 - L(90), visH * 0.62, L(180), L(44))) { sagMode = sagMode === 'B' ? 'A' : 'B'; KWAudio.play('ui_click'); return; }
      return;
    }
    if (state === 'portal') { portalT = portalLen; }
    if (state !== 'play' && state !== 'portal') return;
    if (hitCircle(p, { x: W - L(36), y: L(28) }, L(22))) { state = 'pause'; pauseAt = performance.now(); KWAudio.duckMusic(0.35, 0.2); KWAudio.play('ui_click'); return; }
    if (hitCircle(p, { x: W - L(78), y: L(28) }, L(18))) { KWAudio.setMuted(!KWAudio.muted); KWAudio.play('ui_click'); return; }
    let role = 'none';
    const right = p.x >= W / 2 && p.y > hudBottom;
    if (!right && barrelBtn.show && hitCircle(p, barrelBtn, (barrelBtn.hit || barrelBtn.d) / 2)) role = 'barrel';
    else if (!right && hitCircle(p, act, act.hit / 2)) role = 'action';
    else if (right && joyId == null) role = 'joy';
    ptrs.set(e.pointerId, { role: role, x: p.x, y: p.y });
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    if (role === 'joy') {
      joyId = e.pointerId;
      joyAnchor = { x: clamp(p.x, ringD / 2, W - ringD / 2), y: clamp(p.y, hudBottom + ringD / 2, visH - ringD / 2) };
      joyBack = 0; readJoy();
    } else if (role === 'action') {
      pressed = true;
      queuedAction = predict();
      bufUntil = queuedAction === 'locked' ? 0 : performance.now() + C.actionBufferMs;
      tryAction();
    }
    else if (role === 'barrel') tryEquip();
    pump();
  }
  function onMove(e) {
    const pr = ptrs.get(e.pointerId);
    if (!pr) return;
    e.preventDefault();
    const p = logical(e);
    pr.x = p.x; pr.y = p.y;
    if (pr.role === 'joy') {
      const beforeDir = stickDir, beforeX = px, t0 = performance.now();
      readJoy();
      pump();
      if (stickDir !== beforeDir || Math.abs(px - beforeX) > 0.4) {
        requestAnimationFrame(() => {
          inputLags.push(performance.now() - t0);
          if (inputLags.length > 240) inputLags.shift();
        });
      }
      return;
    }
    pump();
  }
  function onUp(e) {
    const pr = ptrs.get(e.pointerId);
    pressed = false;
    if (pr && pr.role === 'joy') {
      joyFrom = { x: joyAnchor.x, y: joyAnchor.y };
      joyTo = { x: restX, y: restY };
      joyBack = 140;
      joyId = null; joyKnob = { dx: 0, dy: 0 }; stickDir = null; axisLock = null;
    }
    ptrs.delete(e.pointerId);
  }

  function beginRun() {
    KWAudio.unlock();
    KWAudio.play('ui_confirm');
    KWAudio.play('portal_enter');
    KWAudio.setMusic('music_calm');
    KWAudio.loop('ambience_well', true, 0.6);
    seenRun = !!store.get(KEY.seen, false);
    portalLen = seenRun ? 600 : 2500;
    store.set(KEY.seen, true);
    seenRun = true;
    resetRun();
    state = 'portal';
    portalT = 0;
    scrollV = C.portalScroll;
  }
  function resetRun() {
    px = W / 2; py = Math.min(360, visH * 0.46); moveK = 0; holdMs = 0; coast = null; stickDir = null; axisLock = null;
    barrel = 'intact'; spares = C.spareStart; invuln = 0; equipT = 0; duckT = 0; visSag = 0;
    slashPhase = null; slashT = 0; slashCd = 0; slashSerial++; bufUntil = 0;
    swingPhase = null; swingT = 0; swingU = 0; swingCd = 0; swingKills = 0; ghostN = 0;
    depthPx = 0; playMs = 0; score = 0; runCoins = 0; combo = 1; comboAt = -1e9;
    playerMoved = 0; unfair = false; caused = false; firstCreep = false; knotLock = 0;
    waveT = 0; waveN = 1; waveOn = true; attackAt = 0; lastImpact = -1e9;
    lastPickupM = 0; pickupRoll = -1; pickup = null; coinChainAt = 0; nextCoinM = 0;
    ents = []; coins = []; parts = []; recoil = 0; impact = 0; hitStop = 0;
    ropeAx = px; initRope();
    for (let i = 0; i < POOL; i++) pool[i].alive = false;
    shake = 0;
    snapshot();
  }
  function again() {
    KWAudio.play('ui_confirm');
    KWAudio.loop('ambience_meadow', false);
    KWAudio.duckMusic(1, 0.3);
    KWAudio.setMusic('music_calm');
    KWAudio.loop('ambience_well', true, 0.6);
    resetRun();
    state = 'portal';
    portalLen = 600;
    portalT = 0;
    scrollV = C.portalScroll;
  }
  function toTitle() {
    KWAudio.play('ui_click');
    KWAudio.loop('ambience_meadow', false);
    KWAudio.duckMusic(1, 0.4);
    KWAudio.loop('ambience_well', true, 0.4);
    KWAudio.setMusic('music_calm');
    state = 'title';
    titleAt = performance.now();
  }
  function tryEquip() {
    if (barrel !== 'broken' || spares <= 0 || state !== 'play') return;
    spares--; barrel = 'equipping'; equipT = 0;
    KWAudio.play('barrel_pickup');
  }
  function slashSide() {
    if (atLeft()) return 1;
    if (atWall() && !atLeft()) return -1;
    if (stickDir === 'left') return -1;
    if (stickDir === 'right') return 1;
    if (stickDir === 'up' || stickDir === 'down') return lastSide || 1;
    let best = null, bd = 1e9;
    for (const e of ents) if (e.alive && e.hp > 0) {
      const d = Math.hypot(e.x - px, e.y - (py + BH / 2));
      if (d < bd && Math.abs(e.x - px) > 6) { bd = d; best = e.x < px ? -1 : 1; }
    }
    return best || lastSide || 1;
  }
  function tryAction() {
    if (!queuedAction || performance.now() > bufUntil) { queuedAction = ''; return; }
    if ((state !== 'play' && state !== 'portal') || swingPhase) return;
    if (queuedAction === 'swing') {
      if (!(barrel === 'intact' && atWall() && swingCd <= 0)) { queuedAction = ''; bufUntil = 0; return; }
      startSwing(); queuedAction = ''; bufUntil = 0; actionLast = 'swing'; return;
    }
    if (queuedAction === 'sword') {
      if (slashCd > 0 || slashPhase) { queuedAction = ''; bufUntil = 0; return; }
      startSlash(); queuedAction = ''; bufUntil = 0; actionLast = 'sword'; return;
    }
    queuedAction = ''; bufUntil = 0;
  }
  function startSlash() {
    slashPhase = 'windup'; slashT = 0; slashCd = C.swordCd; slashSerial++;
    slashDir = slashSide(); lastSide = slashDir;
    KWAudio.play('sword_slash');
  }
  function startSwing() {
    swingPhase = 'windup'; swingT = 0; swingU = 0; swingKills = 0; swingHit = false; ghostN = 0;
    swingFromX = px; swingFromY = py; swingDir = atLeft() ? 1 : -1;
    swingToX = swingDir > 0 ? (W - C.wall - halfW() - 4) : (C.wall + halfW() + 4);
    KWAudio.play('barrel_swing');
  }
  function swordHits() {
    const sweep = slashPhase === 'recover' ? 1 : ease(clamp(slashT / C.swordSweepMs, 0, 1));
    const pivotY = py + BH / 2 - 34;
    const rad = 76;
    const extra = Math.atan2(0.28 * BH, rad);
    const start = -Math.PI / 2;
    const end = slashDir > 0 ? start + (Math.PI / 2) * sweep : start - (Math.PI / 2) * sweep;
    for (const en of ents) {
      if (!en.alive || en.hp > 50 || en.slashId === slashSerial) continue;
    const dx = en.x - px, dy = en.y - pivotY;
    if (!Number.isFinite(dx) || !Number.isFinite(dy) || Math.hypot(dx, dy) > rad) continue;
    let a = Math.atan2(dy, dx);
      if (slashDir < 0 && a > 0) a -= TAU;
      const lo = Math.min(start, end) - (sweep > 0.92 && slashDir < 0 ? extra : 0);
      const hi = Math.max(start, end) + (sweep > 0.92 && slashDir > 0 ? extra : 0);
      if (a < lo - 0.06 || a > hi + 0.06) continue;
      en.slashId = slashSerial;
      kill(en, slashDir, false);
    }
  }
  function kill(en, dir, fromSwing) {
    if (!en.alive || en.hp <= 0 || en.kind === 'hazard') return;
    en.hp--; en.hitT = 90;
    if (en.hp > 0) { KWAudio.play('enemy_hit'); return; }
    en.alive = false; en.t = 0; en.vx = (dir || 1) * 80; en.vy = -40;
    const now = playMs;
    if (now - comboAt <= 2000) combo = Math.min(2, combo + 0.25); else combo = 1;
    comboAt = now;
    let pts = en.points || 10;
    if (fromSwing) { pts = Math.round(pts * Math.pow(1.5, swingKills)); swingKills++; swingHit = true; }
    if (barrel !== 'intact') pts = Math.round(pts * C.noBarrelScoreMult);
    pts = Math.round(pts * combo);
    score += pts;
    KWAudio.play('enemy_death');
    hitStop = Math.max(hitStop, fromSwing ? C.hitStopSwing : C.hitStopSword);
    burst(en.x, en.y, 12, en.kind === 'bat' ? '#D8C8FF' : '#FFB089', 110, 460, 220);
    shake = Math.max(shake, fromSwing ? 4 : 3);
    if (rng() < C.coinDropOnKillChance) coins.push({ x: en.x, worldY: depthPx + en.y, t: 0, chain: -1 });
    if (en.kind === 'cutter') knotLock = playMs + 1000;
  }
  function hurt(src) {
    if (invuln > 0 || swingPhase || barrel === 'equipping' || state !== 'play') return;
    if (playMs < 20000 && !caused && !(src && src.force)) return;
    if (src && src.harmless) return;
    if (barrel === 'intact' && !(src && src.force)) {
      barrel = 'broken'; invuln = C.breakInvuln;
      breakFlash = 70;
      breakPop = 1;
      bits = [];
      for (let i = 0; i < 10; i++) bits.push({ x: px, y: py + 30, vx: Math.cos(i) * (80 + i * 12), vy: -40 - i * 18, a: i, wood: true, life: 900 });
      bits.push({ x: px - 8, y: py + 24, vx: -90, vy: -80, a: 0, ring: true, life: 900 });
      bits.push({ x: px + 8, y: py + 24, vx: 90, vy: -60, a: 1, ring: true, life: 900 });
      burst(px, py + BH / 2, 14, '#E0A868', 150, 680, 480);
      burst(px, py + 8, 5, '#F4F1EA', 50, 240, 20);
      shake = Math.max(shake, 4);
      KWAudio.play('barrel_break');
      combo = 1;
      return;
    }
    faint(src && src.force ? 'rope' : 'hit');
  }
  let faintT = -1, faintKind = 'hit', faintShown = false, highPlayed = false;
  function faintAge() { return faintT; }
  function faint(kind) {
    if (state === 'faint') return;
    faintKind = kind || 'hit';
    faintT = 0; faintShown = false; highPlayed = false;
    state = 'faint';
    coinPop = 0;
    totalCoins += runCoins;
    store.set(KEY.coins, totalCoins);
    const d = Math.floor(depthM());
    if (d > bestD) { bestD = d; store.set(KEY.bestD, bestD); highPlayed = true; }
    if (score > bestS) { bestS = score; store.set(KEY.bestS, bestS); }
    KWAudio.play(faintKind === 'rope' ? 'rope_snap' : 'player_hit');
    KWAudio.loop('ambience_well', false);
    KWAudio.loop('rope_cutting', false);
    KWAudio.duckMusic(0.18, 0.8);
    KWAudio.loop('ambience_meadow', true, 0.45);
    setTimeout(() => { if (state === 'faint') KWAudio.play('tara_wake'); }, 280);
    if (highPlayed) setTimeout(() => { if (state === 'faint') KWAudio.play('new_highscore'); }, 500);
    if (playMs < 20000 && !caused) unfair = true;
  }

  function spawnCreep(screenY, side, harmless) {
    ents.push({
      kind: 'creep', side: side || (rng() < 0.5 ? -1 : 1), worldY: depthPx + screenY, x: 0, y: screenY,
      state: 'idle', t: 0, ext: 0, reach: 150, hp: 1, alive: true, points: 10,
      wind: 0, harmless: !!harmless, hitT: 0, slashId: -1, first: !!harmless
    });
  }
  function spawnBat(screenY) {
    const side = rng() < 0.5 ? -1 : 1;
    ents.push({
      kind: 'bat', side: side, x: side < 0 ? -20 : W + 20, y: screenY, worldY: depthPx + screenY,
      state: 'aim', t: 0, hp: 1, alive: true, points: 20, vx: 0, vy: 0, hitT: 0, slashId: -1, mode: 'cross'
    });
  }
  function spawnHazard(screenY, side) {
    const vine = rng() < 0.5;
    ents.push({
      kind: 'hazard', vine: vine, side: side || (rng() < 0.5 ? -1 : 1), worldY: depthPx + screenY, y: screenY,
      state: 'grow', t: 0, ext: 0, reach: depthM() > 180 && rng() < 0.3 ? 150 : 70,
      hp: 1e9, alive: true, points: 0, hitT: 0, slashId: -1
    });
  }
  function spawnCutter() {
    ents.push({
      kind: 'cutter', x: px + (rng() < 0.5 ? -28 : 28), y: 80, worldY: depthPx + 40,
      state: 'descend', t: 0, hp: 1, alive: true, points: 50, hitT: 0, slashId: -1, side: 1
    });
  }
  function aliveAttacks() {
    return ents.filter(e => e.alive && (e.state === 'windup' || e.state === 'lunge' || e.state === 'hold' || e.state === 'dive' || e.state === 'cut' || e.state === 'grow')).length;
  }
  function hasSafe(extra) {
    const boxes = ents.filter(e => e.alive && (e.state === 'lunge' || e.state === 'hold' || (e.kind === 'hazard' && e.ext > 20))).map(hazardBox).concat(extra || []);
    const side = 100, up = 90, down = 140;
    const spots = [[px - side, py], [px + side, py], [px, py - up], [px, py + down]];
    return spots.some(s => {
      const x = clamp(s[0], minX(), maxX()), y = clamp(s[1], C.barrelTopMin, playBottom());
      const b = boxAt(x, y, hit);
      return !boxes.some(h => overlap(b, h));
    });
  }
  function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function hazardBox(e) {
    if (e.kind === 'creep') {
      const inner = e.side < 0 ? C.wall : W - C.wall;
      const inset = 24 + e.ext;
      const x = e.side < 0 ? inner + inset : inner - inset;
      return { x: x - 22, y: e.y - 16, w: 44, h: 32 };
    }
    if (e.kind === 'hazard') {
      const inner = e.side < 0 ? C.wall : W - C.wall;
      const x = e.side < 0 ? inner : inner - e.ext;
      return { x: x, y: e.y - 16, w: e.ext, h: 32 };
    }
    return { x: e.x - 16, y: e.y - 14, w: 32, h: 28 };
  }
  function updateEnts(dt) {
    for (const e of ents) {
      e.t += dt; e.hitT = Math.max(0, (e.hitT || 0) - dt);
      if (e.kind !== 'bat' && e.kind !== 'cutter' && !e.pinned) e.y = e.worldY - depthPx;
      if (!e.alive) continue;
      const m = depthM();
      const wu = e.first ? 700 : Math.max(450, 600 - 0.5 * m);
      if (e.kind === 'creep') {
        const inner = e.side < 0 ? C.wall : W - C.wall;
        const inset = 36 + e.ext;
        e.x = e.side < 0 ? inner + inset : inner - inset;
        if (e.state === 'idle') {
          if (!e.idleWait) e.idleWait = e.first ? 180 : ir(400, 1200);
          if (e.t > e.idleWait && e.y > 40 && e.y < visH - 80) { e.state = 'windup'; e.t = 0; e.wind = wu; e.idleWait = 0; KWAudio.play('warning'); }
        }
        else if (e.state === 'windup' && e.t >= e.wind) {
          const reach = 140;
          if (hasSafe([{ x: (e.side < 0 ? C.wall : W - C.wall - reach), y: e.y - 16, w: reach, h: 32 }])) {
            e.state = 'lunge'; e.t = 0; e.reach = reach; KWAudio.play('swipe');
          } else e.t = e.wind - 300;
        } else if (e.state === 'lunge') {
          e.ext = e.reach * ease(clamp(e.t / 240, 0, 1));
          if (e.t >= 240) { e.state = 'hold'; e.t = 0; }
        } else if (e.state === 'hold') { if (e.t >= 180) { e.state = 'back'; e.t = 0; } }
        else if (e.state === 'back') {
          e.ext = e.reach * (1 - ease(clamp(e.t / 280, 0, 1)));
          if (e.t >= 280) { e.state = 'idle'; e.t = 0; e.ext = 0; e.harmless = false; e.first = false; }
        }
        if ((e.state === 'lunge' || e.state === 'hold') && !e.harmless && overlap(bodyBox(), hazardBox(e))) hurt(e);
      } else if (e.kind === 'bat') {
        if (e.state === 'aim') {
          e.y += (py - 20 - e.y) * Math.min(1, dt / 400);
          if (e.t > Math.max(450, 600 - depthM() * 0.5)) { e.state = 'dive'; e.t = 0; const a = Math.atan2((py + 30) - e.y, px - e.x); e.vx = Math.cos(a) * 220; e.vy = Math.sin(a) * 220; KWAudio.play('swipe'); }
        } else if (e.state === 'dive') {
          e.x += e.vx * dt / 1000; e.y += e.vy * dt / 1000;
          if (Math.hypot(e.x - px, e.y - (py + 30)) < 28) hurt(e);
          if (e.x < -40 || e.x > W + 40 || e.y < -40 || e.y > visH + 40) e.alive = false;
        }
      } else if (e.kind === 'hazard') {
        e.x = e.side < 0 ? C.wall + Math.max(12, e.ext) * 0.5 : W - C.wall - Math.max(12, e.ext) * 0.5;
        if (e.state === 'grow') { e.ext = e.reach * ease(clamp(e.t / 500, 0, 1)); if (e.t >= 500) e.state = 'out'; }
        if (e.ext > 16 && overlap(bodyBox(), hazardBox(e))) hurt(e);
      } else if (e.kind === 'cutter') {
        if (e.state === 'descend') {
          e.y += dt * 0.12; e.x = ropeAx + (e.x < px ? -28 : 28);
          if (Math.abs(e.y - (py - 10)) < 16) { e.state = 'perch'; e.t = 0; }
        } else if (e.state === 'perch' && e.t > 200) { e.state = 'cut'; e.t = 0; KWAudio.loop('rope_cutting', true); }
        else if (e.state === 'cut') {
          if (e.t > 700) { KWAudio.loop('rope_cutting', false); hurt({ force: true }); e.alive = false; }
        }
        if (Math.hypot(e.x - px, e.y - (py - 0.18 * BH)) < C.swordR) { /* vulnerable: swordHits handles it */ }
      }
    }
    ents = ents.filter(e => e.y > -160 && e.y < visH + 200 && (e.alive || e.t < 600));
  }
  function spawner(dt) {
    if (NO_SPAWN || state !== 'play') return;
    const m = depthM();
    if (!firstCreep && playMs >= C.firstEnemyAtMs) {
      firstCreep = true;
      spawnCreep(py + 10, px < W / 2 ? 1 : -1, true);
    }
    if (playMs >= C.firstCoinAtMs && coinChainAt === 0) { dropChain(W * 0.66, py - 10, 4, true); nextCoinM = Math.max(depthM() + 28, 28); }
    attackAt -= 0;
    const gap = Math.max(700, 1400 - 2 * m);
    const cap = (m >= 300 ? 4 : m >= 150 ? 3 : m >= 40 ? 2 : 1) + (waveN % 5 === 0 && waveOn ? 1 : 0);
    if (waveOn && playMs - attackAt >= gap && aliveAttacks() < Math.min(4, cap)) {
      const band = m >= 300 ? 5 : m >= 150 ? 4 : m >= 70 ? 3 : m >= 30 ? 2 : m >= 20 ? 1 : 0;
      const weights = [
        { krabbler: 100 },
        { krabbler: 70, fledermaus: 30 },
        { krabbler: 55, stacheln: 20, fledermaus: 25 },
        { krabbler: 42, stacheln: 18, fledermaus: 28, seilschneider: 12 },
        { krabbler: 38, stacheln: 20, fledermaus: 30, seilschneider: 12 },
        { krabbler: 34, stacheln: 22, fledermaus: 32, seilschneider: 12 }
      ][band];
      if (waveN === 1) { weights.fledermaus = 0; weights.stacheln = 0; weights.seilschneider = 0; }
      const k = choice(weights);
      const y = visH + 30;
      if (k === 'krabbler' && ents.filter(e => e.kind === 'creep' && e.alive).length < (m < 40 ? 2 : m < 150 ? 3 : 4)) spawnCreep(y);
      else if (k === 'fledermaus' && m >= 20) spawnBat(80 + rng() * 200);
      else if (k === 'stacheln' && m >= 30) spawnHazard(y);
      else if (k === 'seilschneider' && m >= 70 && !ents.some(e => e.kind === 'cutter' && e.alive) && playMs > knotLock) spawnCutter();
      attackAt = playMs;
    }
    if (m >= nextCoinM) {
      const n = 3 + ((rng() * 2) | 0);
      dropChain(C.wall + 80 + rng() * (W - 2 * C.wall - 160), visH * 0.55, n, false);
      nextCoinM = m + 28;
    }
    if (!pickup && m >= lastPickupM + C.pickupGapM) {
      const step = Math.floor((m - (lastPickupM + C.pickupGapM)) / C.pickupEveryM);
      if (step > pickupRoll) {
        pickupRoll = step;
        if (rng() < C.pickupChance && spares < C.spareMax) pickup = { x: C.wall + 40 + rng() * (W - 80 - C.wall), worldY: depthPx + visH + 20, t: 0 };
      }
    }
    waveT += dt;
    const lim = waveOn ? (waveN % 5 === 0 ? 14000 : 10000) : 2500;
    if (waveT >= lim) { waveOn = !waveOn; waveT = 0; if (waveOn) waveN++; }
  }
  function dropChain(x, screenY, n, teach) {
    coinChainAt++;
    for (let i = 0; i < n; i++) {
      const ox = Math.round((i - (n - 1) / 2) * 14);
      coins.push({ x: x + ox, worldY: depthPx + screenY + i * 12, t: 0, chain: coinChainAt, idx: i });
    }
    void teach;
  }
  function updateCoins(dt) {
    const body = bodyBox();
    for (let i = 0; i < coins.length; i++) {
      const c = coins[i];
      if (c.got) continue;
      c.t += dt;
      const sy = c.worldY - depthPx + Math.sin(c.t * 0.01) * 2;
      c.sy = sy;
      coinR.x = c.x - 12; coinR.y = sy - 12;
      if (overlap(body, coinR)) {
        c.got = true; c.fly = 0; runCoins++; score += C.coinPoints; hudCoinT = 1;
        KWAudio.play('score_pickup', { semi: c.chain ? c.idx : 0 });
      }
    }
    let cw = 0;
    for (let i = 0; i < coins.length; i++) {
      const c = coins[i];
      if (c.got) {
        if (c.fly == null || c.fly >= 360) continue;
        c.fly += dt;
      } else {
        const sy = c.worldY - depthPx;
        if (sy <= -60 || sy >= visH + 80) continue;
      }
      coins[cw++] = c;
    }
    coins.length = cw;
  }

  function barrelSway() {
    if (state !== 'play' && state !== 'portal') return 0;
    const t = playMs / 1000;
    const nearTop = Math.max(0, 1 - Math.min(1, depthM() / 14));
    return Math.sin(t * (1.5 + nearTop * 0.8)) * C.hitboxSwayMax;
  }
  function poseName() {
    if (barrel === 'broken') return 'kiro-hang-nobarrel';
    if (slashPhase) return 'kiro-barrel-slash';
    if (swingPhase) return 'kiro-barrel-swing';
    if (duckT > C.duckMs * 0.3 && atWall()) return 'kiro-barrel-duck';
    return 'kiro-barrel-idle';
  }
  function harnessOf(x, y, rot, bob) {
    const pose = poseName();
    const spec = CHAR_PIV[pose];
    const cy = y + BH / 2 + (bob || 0);
    const sx = x + barrelSway();
    if (!spec) return { x: sx, y: cy - 10 };
    const top = ((spec.rope != null ? spec.rope : spec.p[1]) - spec.p[1]) * PLAY_SCALE;
    return { x: sx, y: cy + top };
  }
  function initRope() {
    const h = harnessOf(px, py, 0, 0);
    for (let i = 0; i <= SEG; i++) {
      const k = i / SEG;
      rx[i] = ox[i] = lerp(px, h.x, k);
      ry[i] = oy[i] = lerp(8, h.y, k);
    }
  }
  function ropeStep(dt, bx, by) {
    const ax = ropeAx, ay = 8;
    ropeAx += (px - ropeAx) * Math.min(1, dt / 160);
    const dist = Math.max(40, Math.hypot(bx - ax, by - ay));
    const slack = (coast === 'up' && moveK > 0) ? 1.065 : 1;
    const rest = dist * slack / SEG;
    ropeAcc += dt;
    let n = 0;
    while (ropeAcc >= 8 && n < 5) {
      ropeAcc -= 8; n++;
      for (let i = 1; i < SEG; i++) {
        const vx = (rx[i] - ox[i]) * 0.98, vy = (ry[i] - oy[i]) * 0.98;
        ox[i] = rx[i]; oy[i] = ry[i]; rx[i] += vx; ry[i] += vy;
      }
      for (let it = 0; it < 3; it++) {
        rx[0] = ax; ry[0] = ay; rx[SEG] = bx; ry[SEG] = by;
        for (let i = 0; i < SEG; i++) {
          const dx = rx[i + 1] - rx[i], dy = ry[i + 1] - ry[i], d = Math.hypot(dx, dy) || 1, diff = (d - rest) / d;
          if (i) { rx[i] += dx * diff * 0.5; ry[i] += dy * diff * 0.5; }
          if (i + 1 < SEG) { rx[i + 1] -= dx * diff * 0.5; ry[i + 1] -= dy * diff * 0.5; }
        }
      }
    }
  }

  function updatePlay(dt) {
    if (hitStop > 0) { hitStop -= dt; return; }
    playMs += dt;
    const targetScroll = state === 'portal' ? C.portalScroll : C.scroll0;
    if (state === 'play') {
      if (portalT < C.portalLerpToScroll0Ms && scrollV < C.scroll0) scrollV = lerp(C.portalScroll, C.scroll0, portalT / C.portalLerpToScroll0Ms);
      else scrollV = Math.min(C.scrollMax, scrollV + C.scrollAcc * dt / 1000);
    }
    depthPx += scrollV * dt / 1000;
    const dir = stickDir;
    if (dir) {
      if (dir !== coast) { holdMs = 0; moveK = C.inputStart; if (dir === 'up' && sagMode === 'B') visSag = C.sagPx; }
      else { holdMs += dt; moveK = C.inputStart + (1 - C.inputStart) * clamp(holdMs / C.inputFullMs, 0, 1); }
      coast = dir;
    } else if (moveK > 0) { moveK = Math.max(0, moveK - dt / C.inputReleaseMs); if (moveK === 0) coast = null; }
    if (!swingPhase && (state === 'play' || state === 'portal')) {
      const d = dir || (moveK > 0 ? coast : null);
      const mul = speedMul();
      let vx = 0, vy = 0;
      if (d === 'left') vx = -C.speedSide * moveK * mul;
      else if (d === 'right') vx = C.speedSide * moveK * mul;
      else if (d === 'down') vy = C.speedDown * moveK * mul;
      else if (d === 'up') vy = -C.speedUp * moveK * mul;
      const oxp = px, oyp = py;
      px = clamp(px + vx * dt / 1000, minX(), maxX());
      py = clamp(py + vy * dt / 1000, C.barrelTopMin, playBottom());
      playerMoved += Math.hypot(px - oxp, py - oyp);
      if (playerMoved > 80) caused = true;
      if (d === 'up' && KWAudio.creakOk()) KWAudio.play('rope_retract');
      if (d === 'down' && playMs - creakSide > 500) { creakSide = playMs; KWAudio.play('rope_extend'); }
      if ((d === 'up' || Math.abs(px - ropeAx) > 20) && KWAudio.creakOk()) KWAudio.play('rope_creak');
    }
    visSag = Math.max(0, visSag - C.sagPx * (dt / C.sagMs));
    const wantDuck = barrel === 'intact' && atWall();
    if (wantDuck) duckT = Math.min(C.duckMs, duckT + dt); else duckT = Math.max(0, duckT - dt);
    if (swingPhase === 'windup') {
      swingT += dt;
      if (swingT >= C.swingWindup) { swingPhase = 'fly'; swingT = 0; }
    } else if (swingPhase === 'fly') {
      swingT += dt; swingU = clamp(swingT / C.swingMs, 0, 1);
      px = lerp(swingFromX, swingToX, swingU);
      py = swingFromY - Math.sin(swingU * Math.PI) * C.swingArc;
      if (ghostN < 3 && (ghostN === 0 || swingT - ghost[ghostN - 1].t >= 70)) {
        const g = ghost[ghostN++];
        g.x = px; g.y = py; g.t = swingT;
      }
      const hb = bodyBox();
      swingBox.x = hb.x - C.swingPad; swingBox.y = hb.y - C.swingPad;
      swingBox.w = hb.w + C.swingPad * 2; swingBox.h = hb.h + C.swingPad * 2;
      const box = swingBox;
      for (const e of ents) if (e.alive && e.hp < 1e8 && e.kind !== 'hazard' && overlap(box, { x: e.x - 20, y: e.y - 16, w: 40, h: 32 })) kill(e, swingDir, true);
      if (swingT >= C.swingMs) {
        px = swingToX; py = swingFromY; swingPhase = null; swingCd = C.swingCd; impact = 1; duckT = C.duckMs;
        ghostN = 0;
        KWAudio.play('barrel_land');
        shake = Math.max(shake, 3.5);
        if (swingHit) hitStop = Math.max(hitStop, C.hitStopSwing);
      }
    }
    if (slashPhase === 'windup') { slashT += dt; if (slashT >= C.swordWindup) { slashPhase = 'active'; slashT = 0; } }
    else if (slashPhase === 'active') { slashT += dt; swordHits(); if (slashT >= C.swordActive) { slashPhase = 'recover'; slashT = 0; } }
    else if (slashPhase === 'recover') { slashT += dt; if (slashT >= C.swordRecover) slashPhase = null; }
    slashCd = Math.max(0, slashCd - dt);
    swingCd = Math.max(0, swingCd - dt);
    invuln = Math.max(0, invuln - dt);
    impact = Math.max(0, impact - dt / 100);
    recoil *= Math.pow(0.02, dt / 180);
    if (barrel === 'equipping') { equipT += dt; if (equipT >= C.equipMs) { barrel = 'intact'; invuln = Math.max(invuln, C.equipInvuln); } }
    barrelBtn.show = barrel === 'broken' && spares > 0;
    if (state === 'play') { spawner(dt); updateEnts(dt); updateCoins(dt); }
    if (pickup) {
      pickup.t += dt; const sy = pickup.worldY - depthPx;
      if (overlap(bodyBox(), { x: pickup.x - 16, y: sy - 18, w: 32, h: 36 })) {
        if (spares < C.spareMax) { spares++; hudSpareT = 1; KWAudio.play('barrel_pickup'); }
        lastPickupM = depthM(); pickupRoll = -1; pickup = null;
      } else if (sy < -40) pickup = null;
    }
    const tier = depthM() >= 300 ? 'music_fast' : depthM() >= 120 ? 'music_mid' : 'music_calm';
    KWAudio.setMusic(tier);
    tryAction();
    breakFlash = Math.max(0, breakFlash - dt);
    if (breakPop > 0) breakPop = Math.max(0, breakPop - dt / 180);
    if (hudCoinT > 0) hudCoinT = Math.max(0, hudCoinT - dt / 160);
    if (hudSpareT > 0) hudSpareT = Math.max(0, hudSpareT - dt / 160);
    const nextPose = poseName();
    if (nextPose !== poseCur) { poseOld = poseCur; poseCur = nextPose; poseMix = 0; }
    if (poseMix < 1) poseMix = Math.min(1, poseMix + dt / 70);
    let bi = 0;
    for (let i = 0; i < bits.length; i++) {
      const b = bits[i];
      b.x += b.vx * dt / 1000; b.y += b.vy * dt / 1000; b.vy += 400 * dt / 1000; b.a += dt * 0.01; b.life -= dt;
      if (b.life > 0) bits[bi++] = b;
    }
    bits.length = bi;
    dustStep(dt);
    const grip = harnessOf(px, py, visualRot(), sagMode === 'B' ? visSag : 0);
    ropeStep(dt, grip.x, grip.y);
    if (joyBack > 0 && joyFrom) {
      joyBack -= dt;
      const k = 1 - Math.max(0, joyBack) / 140;
      joyAnchor = { x: lerp(joyFrom.x, joyTo.x, k), y: lerp(joyFrom.y, joyTo.y, k) };
      if (joyBack <= 0) joyAnchor = { x: restX, y: restY };
    }
  }

  function step(dtMs) {
    dtMs = Math.min(34, dtMs);
    if (dtMs <= 0) return;
    if (state === 'portal') {
      portalT += dtMs;
      updatePlay(dtMs);
      if (portalT >= portalLen) { state = 'play'; scrollV = Math.max(scrollV, C.portalScroll); }
      return;
    }
    if (state === 'play') updatePlay(dtMs);
    if (state === 'faint') faintT += dtMs;
    if (bot && state === 'play') botTick();
  }
  function botTick() {
    if (bot === 'passive') { stickDir = null; return; }
    if (bot === 'random') {
      if (rng() < 0.05) stickDir = ['left', 'right', 'up', 'down'][(rng() * 4) | 0];
      if (rng() < 0.02) { queuedAction = predict(); bufUntil = queuedAction === 'locked' ? 0 : performance.now() + C.actionBufferMs; tryAction(); }
      return;
    }
    let threat = null, bd = 1e9;
    for (const e of ents) if (e.alive && (e.state === 'windup' || e.state === 'lunge' || e.state === 'dive')) {
      const d = Math.abs(e.y - py); if (d < bd) { bd = d; threat = e; }
    }
    if (threat && bd < 110) stickDir = threat.y > py + 8 ? 'up' : 'down';
    else if (px < W * 0.38) stickDir = 'right';
    else if (px > W * 0.62) stickDir = 'left';
    else stickDir = (playMs / 700 | 0) % 2 ? 'up' : 'down';
    if (threat && Math.abs(threat.x - px) < C.swordR && Math.abs(threat.y - py) < 90) {
      queuedAction = predict();
      bufUntil = queuedAction === 'locked' ? 0 : performance.now() + 120;
      tryAction();
    }
  }

  function scarfStep(dt) {
    const side = lastSide || 1;
    const neck = harnessOf(px, py, 0, sagMode === 'B' ? visSag : 0);
    const ax = neck.x - side * 26, ay = neck.y - 16;
    if (!scarf[0].y) { for (let i = 0; i < scarf.length; i++) { scarf[i].x = scarf[i].ox = ax - side * i * 6; scarf[i].y = scarf[i].oy = ay + i * 2; } }
    const rest = 8;
    for (let n = 0; n < 2; n++) {
      for (let i = 1; i < scarf.length; i++) {
        const vx = (scarf[i].x - scarf[i].ox) * 0.9, vy = (scarf[i].y - scarf[i].oy) * 0.9;
        scarf[i].ox = scarf[i].x; scarf[i].oy = scarf[i].y;
        scarf[i].x += vx - side * 36 * dt / 1000;
        scarf[i].y += vy + 18 * dt / 1000;
      }
      scarf[0].x = ax; scarf[0].y = ay;
      for (let i = 0; i < scarf.length - 1; i++) {
        const dx = scarf[i + 1].x - scarf[i].x, dy = scarf[i + 1].y - scarf[i].y;
        const d = Math.hypot(dx, dy) || 1, diff = (d - rest) / d;
        if (i) { scarf[i].x += dx * diff * 0.5; scarf[i].y += dy * diff * 0.5; }
        scarf[i + 1].x -= dx * diff * 0.5; scarf[i + 1].y -= dy * diff * 0.5;
      }
    }
  }
  function dustStep(dt) {
    if (state !== 'play' && state !== 'portal') return;
    if (!dust.length) {
      for (let i = 0; i < 28; i++) dust.push({ x: 40 + rng() * 300, y: rng() * visH, s: rng() < 0.6 ? 1 : 2, v: 10 + rng() * 18 });
    }
    for (const d of dust) {
      d.y -= scrollV * 0.22 * dt / 1000;
      d.x += Math.sin(d.y * 0.02) * dt * 0.01;
      if (d.y < -6) { d.y = visH + 4; d.x = 50 + rng() * 280; }
    }
  }
  function lerpA(a, b, t) { return a + (b - a) * t; }
  function lerpAng(a, b, t) {
    let d = b - a;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    return a + d * t;
  }
  function biomeAt(depth) {
    const s = Math.floor((depth / C.pxPerMeter) / 100) % 4;
    return ['moon', 'moss', 'ember', 'crystal'][(s + 4) % 4];
  }
  function font(size) {
    ctx.font = '700 ' + size + 'px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
  }
  function traceRound(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function pill(x, y, w, h, fill, stroke) {
    traceRound(x, y, w, h, Math.min(18, h / 2));
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }
  function disc(x, y, r, fill, stroke) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) { ctx.lineWidth = 3; ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function label(str, x, y, size, col, align) {
    font(size);
    ctx.fillStyle = col;
    ctx.textAlign = align || 'left';
    ctx.fillText(str, x, y);
  }
  function tile(img, parallax, depth, x, dw) {
    if (!img) return;
    const h = img.lh || 420;
    let y0 = -((depth * parallax) % h);
    if (y0 > 0) y0 -= h;
    for (let y = y0; y < visH + 2; y += h) ctx.drawImage(img, x, y, dw, h);
  }
  function drawWell(depth) {
    if (!art) { ctx.fillStyle = '#102033'; ctx.fillRect(0, 0, W, visH); return; }
    const name = biomeAt(depth);
    if (name !== biomeShown) {
      const now = performance.now();
      biomeBlend = Math.max(0, biomeBlend - (now - (drawWell.at || now)) / 280);
      if (biomeBlend <= 0) { biomeShown = name; biomeBlend = 1; }
    }
    drawWell.at = performance.now();
    const palOf = (id) => (window.KWBake && KWBake.BIO && KWBake.BIO[id]) || { sky: '#16385A', mid: '#102438', deep: '#070E18' };
    const wash = (id, alpha) => {
      const key = id + (visH | 0);
      let g = washGrad[id];
      if (!g || washKey[id] !== key) {
        const pal = palOf(id);
        g = ctx.createLinearGradient(0, 0, 0, visH);
        g.addColorStop(0, pal.sky);
        g.addColorStop(0.55, pal.mid);
        g.addColorStop(1, pal.deep);
        washGrad[id] = g;
        washKey[id] = key;
      }
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = g;
      ctx.fillRect(C.wall, -2, W - C.wall * 2, visH + 8);
      ctx.restore();
    };
    wash(biomeShown, 1);
    if (name !== biomeShown && biomeBlend < 1) wash(name, 1 - biomeBlend);
    const far = art.bg[biomeShown] || art.bg.moon;
    const near = art.bg[name] || far;
    tile(far, 0.55, depth, C.wall, W - C.wall * 2);
    if (near !== far && biomeBlend < 1) {
      ctx.globalAlpha = 1 - biomeBlend;
      tile(near, 0.55, depth, C.wall, W - C.wall * 2);
      ctx.globalAlpha = 1;
    }
    const wallImg = (art.walls && (art.walls[name] || art.walls.moon)) || null;
    tile(wallImg, 1, depth, 0, C.wall);
    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    tile(wallImg, 1, depth, 0, C.wall);
    ctx.restore();
    ctx.strokeStyle = name === 'moss' ? 'rgba(150,190,120,0.55)' : name === 'ember' ? 'rgba(180,100,60,0.4)' : 'rgba(196,165,116,0.45)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    const stepV = 150;
    const i0 = Math.floor(depth * 0.72 / stepV) - 1;
    for (let i = i0; i < i0 + 12; i++) {
      const sy = i * stepV - depth * 0.72;
      if (sy < -30 || sy > visH) continue;
      const left = i % 2 === 0;
      const x = left ? C.wall + 4 : W - C.wall - 4;
      const dir = left ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(x, sy);
      ctx.bezierCurveTo(x + 22 * dir, sy + 24, x + 6 * dir, sy + 58, x + 16 * dir, sy + 92);
      ctx.stroke();
    }
    const beam0 = Math.floor(depth / 1600) * 1600;
    for (let b = beam0; b < depth + visH; b += 1600) {
      if (b <= 0) continue;
      const sy = b - depth;
      if (sy > -16 && sy < visH) {
        traceRound(C.wall + 4, sy, W - C.wall * 2 - 8, 12, 6);
        ctx.fillStyle = '#6E849C';
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(C.wall + 10, sy + 2, W - C.wall * 2 - 20, 2);
      }
    }
    if (art.cone && depth / C.pxPerMeter < 80) {
      ctx.globalAlpha = Math.max(0, 1 - (depth / C.pxPerMeter) / 80) * 0.9;
      ctx.drawImage(art.cone, W / 2 - 110, 0, 220, 240);
      ctx.globalAlpha = 1;
    }
    const stepL = 180;
    const L0 = Math.floor(depth / stepL) - 1;
    for (let i = L0; i < L0 + 8; i++) {
      const sy = i * stepL - depth;
      if (sy < 30 || sy > visH - 20) continue;
      const left = i % 2 === 0;
      const lx = left ? 8 : W - 36;
      const flick = 0.75 + 0.25 * Math.sin(performance.now() / 160 + i);
      if (art.glowWarm) {
        ctx.globalAlpha = 0.55 * flick;
        ctx.drawImage(art.glowWarm, lx - 34, sy - 28, 96, 96);
        ctx.globalAlpha = 1;
      }
      if (art.lantern) ctx.drawImage(art.lantern, lx, sy, 26, 40);
    }
    if (art.spark) {
      for (let i = 0; i < dust.length; i++) {
        const d = dust[i];
        ctx.globalAlpha = 0.45;
        ctx.drawImage(art.spark, d.x, d.y, d.s * 4, d.s * 4);
      }
      ctx.globalAlpha = 1;
    }
  }
  function drawRope(alpha) {
    ctx.beginPath();
    ctx.moveTo(lerpA(prev.ropeX[0], rx[0], alpha), lerpA(prev.ropeY[0], ry[0], alpha));
    for (let i = 1; i <= SEG; i++) ctx.lineTo(lerpA(prev.ropeX[i], rx[i], alpha), lerpA(prev.ropeY[i], ry[i], alpha));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#7A5A32';
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.strokeStyle = '#F0D7A4';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  function drawScarf(alpha) {
    const pts = [];
    for (let i = 0; i < scarf.length; i++) {
      const s = scarf[i];
      const x = lerpA(s.px0 == null ? s.x : s.px0, s.x, alpha);
      const y = lerpA(s.py0 == null ? s.y : s.py0, s.y, alpha);
      const flutter = Math.sin(performance.now() / 160 + i * 0.8) * (2 + i * 0.85);
      pts.push({ x: x, y: y + flutter });
    }
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], n = pts[Math.min(pts.length - 1, i + 1)];
      let dx = n.x - p.x, dy = n.y - p.y;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      const w = 7 * (1 - i / pts.length) + 2;
      if (i === 0) ctx.moveTo(p.x - dy * w, p.y + dx * w);
      else ctx.lineTo(p.x - dy * w, p.y + dx * w);
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i], n = pts[Math.max(0, i - 1)];
      let dx = p.x - n.x, dy = p.y - n.y;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      const w = 7 * (1 - i / pts.length) + 2;
      ctx.lineTo(p.x + dy * w, p.y - dx * w);
    }
    ctx.closePath();
    ctx.fillStyle = '#E2283C';
    ctx.fill();
    ctx.strokeStyle = '#FF9AA6';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  function drawPoseAt(name, x, y, alpha) {
    if (!baked[name]) return;
    const nx = NUDGE_X[name] || 0;
    const ny = NUDGE_Y[name] || 0;
    const prevA = ctx.globalAlpha;
    ctx.globalAlpha = prevA * alpha;
    drawBaked(name, x + nx, y + ny);
    ctx.globalAlpha = prevA;
  }
  function drawPlayer(alpha) {
    const x = lerpA(prev.px, px, alpha) + barrelSway();
    const y = lerpA(prev.py, py, alpha) + PIVOT_DY + lerpA(prev.sag, visSag, alpha);
    const hidden = barrel === 'broken' && invuln > 0 && ((invuln / 70) | 0) % 2 === 0;
    const pop = breakPop > 0 ? 1 + Math.sin(breakPop * Math.PI) * 0.16 : 1;
    ctx.save();
    ctx.beginPath();
    ctx.rect(C.wall - 1, -80, W - C.wall * 2 + 2, visH + 160);
    ctx.clip();
    if (pop !== 1) {
      ctx.translate(x, y);
      ctx.scale(pop, pop);
      ctx.translate(-x, -y);
    }
    if (hidden) ctx.globalAlpha *= 0.45;
    if (poseOld && poseMix < 1) drawPoseAt(poseOld, x, y, 1 - poseMix);
    drawPoseAt(poseCur, x, y, poseOld && poseMix < 1 ? poseMix : 1);
    if (breakFlash > 40) {
      ctx.globalAlpha = clamp((breakFlash - 40) / 50, 0, 0.45);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y - 8, 18, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    void alpha;
  }
  function drawSword(alpha) {
    if (!slashPhase && prev.slashU <= 0.02) return;
    const sweep = lerpA(prev.slashU, slashVisual(), alpha);
    if (sweep <= 0.02) return;
    const x = lerpA(prev.px, px, alpha);
    const y = lerpA(prev.py, py, alpha);
    const a0 = -Math.PI / 2;
    const a1 = slashDir > 0 ? a0 + (Math.PI / 2) * sweep : a0 - (Math.PI / 2) * sweep;
    const cx = x, cy = y + BH / 2 - 34;
    const rad = 48;
    ctx.save();
    ctx.beginPath();
    ctx.rect(C.wall - 1, -80, W - C.wall * 2 + 2, visH + 160);
    ctx.clip();
    ctx.translate(cx, cy);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(28,168,217,0.4)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(0, 0, rad, a0, a1, slashDir < 0);
    ctx.stroke();
    ctx.strokeStyle = '#4FF0FF';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, rad, a0, a1, slashDir < 0);
    ctx.stroke();
    ctx.restore();
  }
  function drawCreep(e, alpha) {
    const ext = lerpA(e.pext || 0, e.ext || 0, alpha);
    const y = lerpA(e.py0 == null ? e.y : e.py0, e.y, alpha);
    const side = e.side < 0 ? -1 : 1;
    const inner = side < 0 ? C.wall : W - C.wall;
    const reach = 58 + ext;
    const headX = inner + side * reach;
    const wind = e.state === 'windup' ? Math.sin(clamp(e.t / 320, 0, 1) * Math.PI) * 14 : 0;
    const segs = 6;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const x = lerpA(inner + side * 8, headX, t);
      const yy = y + Math.sin(t * Math.PI) * (-6 - wind * 0.4);
      const rad = 8 + t * 9;
      ctx.beginPath();
      ctx.arc(x, yy, rad, 0, TAU);
      ctx.fillStyle = i % 2 ? '#353B4E' : '#4C556C';
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.beginPath();
      ctx.ellipse(x - side * rad * 0.2, yy - rad * 0.35, rad * 0.45, rad * 0.22, 0, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = '#232833';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      const x = lerpA(inner + side * 8, headX, t);
      ctx.beginPath();
      ctx.moveTo(x, y + 8);
      ctx.lineTo(x - 7, y + 18);
      ctx.moveTo(x, y + 8);
      ctx.lineTo(x + 7, y + 18);
      ctx.stroke();
    }
    ctx.fillStyle = '#FFE7B0';
    ctx.beginPath(); ctx.arc(headX + side * 6, y - 12 - wind * 0.2, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = e.state === 'windup' ? '#FF5A2A' : '#E23B16';
    ctx.beginPath(); ctx.arc(headX + side * 7, y - 12 - wind * 0.2, 2.4, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#E6EDF5';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(headX + side * 14, y - 2);
    ctx.lineTo(headX + side * 26, y - 10);
    ctx.moveTo(headX + side * 14, y + 6);
    ctx.lineTo(headX + side * 26, y + 8);
    ctx.stroke();
    if (e.state === 'windup') {
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(performance.now() / 80);
      if (art && art.glowWarm) ctx.drawImage(art.glowWarm, headX - 28, y - 40, 56, 56);
      ctx.globalAlpha = 1;
    }
  }
  function drawBat(e, alpha) {
    const x = lerpA(e.px0 == null ? e.x : e.px0, e.x, alpha);
    const y = lerpA(e.py0 == null ? e.y : e.py0, e.y, alpha);
    const flap = Math.sin(performance.now() / 70 + x * 0.02);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#2A2144';
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.quadraticCurveTo(-28, -26 - flap * 16, -46, flap * 6);
    ctx.quadraticCurveTo(-20, 6, -4, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.quadraticCurveTo(28, -26 - flap * 16, 46, flap * 6);
    ctx.quadraticCurveTo(20, 6, 4, 2);
    ctx.fill();
    ctx.fillStyle = '#3C2E62';
    ctx.beginPath(); ctx.ellipse(0, 2, 10, 8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.ellipse(-3, -1, 4, 2, -0.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#FFC23A';
    ctx.beginPath(); ctx.arc(-3.5, 1, 2.1, 0, TAU); ctx.arc(3.5, 1, 2.1, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1A1208';
    ctx.beginPath(); ctx.arc(-3.2, 1.2, 0.9, 0, TAU); ctx.arc(3.8, 1.2, 0.9, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawHazard(e, alpha) {
    const ext = lerpA(e.pext || 0, e.ext || 0, alpha);
    const y = lerpA(e.py0 == null ? e.y : e.py0, e.y, alpha);
    const side = e.side < 0 ? -1 : 1;
    const inner = side < 0 ? C.wall : W - C.wall;
    const len = Math.max(18, ext);
    ctx.lineCap = 'round';
    if (e.vine) {
      ctx.strokeStyle = '#2F6A48';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(inner, y);
      ctx.quadraticCurveTo(inner + side * len * 0.5, y - 16, inner + side * len, y + 2);
      ctx.stroke();
      ctx.strokeStyle = '#8FBF7A';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#DDE8D4';
      for (let i = 1; i <= 4; i++) {
        const x = inner + side * (len * i / 4);
        ctx.beginPath();
        ctx.moveTo(x, y - 2);
        ctx.lineTo(x + side * 8, y - 12);
        ctx.lineTo(x + side * 4, y);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#8A93A2';
      for (let i = 0; i < 4; i++) {
        const x = inner + side * (10 + i * len / 4);
        ctx.beginPath();
        ctx.moveTo(x, y + 10);
        ctx.lineTo(x + side * 6, y - 16 - (i % 2) * 6);
        ctx.lineTo(x + side * 16, y + 10);
        ctx.fill();
      }
    }
  }
  function drawCutter(e, alpha) {
    const x = lerpA(e.px0 == null ? e.x : e.px0, e.x, alpha);
    const y = lerpA(e.py0 == null ? e.y : e.py0, e.y, alpha);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#3E7A3A';
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 12, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8FCB78';
    ctx.beginPath(); ctx.ellipse(-4, -4, 6, 3, -0.4, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#E6EDF2';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    const open = e.state === 'cut' ? 0.5 : 0.2;
    ctx.beginPath();
    ctx.moveTo(-6, 2); ctx.lineTo(-18, 2 - open * 16);
    ctx.moveTo(-6, 6); ctx.lineTo(-18, 6 + open * 16);
    ctx.stroke();
    ctx.fillStyle = '#F4F1C8';
    ctx.beginPath(); ctx.arc(6, -2, 2.2, 0, TAU); ctx.arc(6, 4, 2.2, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawEnt(e, alpha) {
    if (!e.alive) ctx.globalAlpha = clamp(1 - e.t / 600, 0, 1);
    if (e.kind === 'creep') drawCreep(e, alpha);
    else if (e.kind === 'bat') drawBat(e, alpha);
    else if (e.kind === 'hazard') drawHazard(e, alpha);
    else if (e.kind === 'cutter') drawCutter(e, alpha);
    ctx.globalAlpha = 1;
  }
  function drawCoinSprite(x, y, spin) {
    if (!art || !art.coin) return;
    const sx = Math.max(0.16, Math.abs(spin));
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, 1);
    ctx.drawImage(art.coin, -16, -16, 32, 32);
    ctx.restore();
  }
  function drawBits(alpha) {
    for (const b of bits) {
      const x = lerpA(b.px0 == null ? b.x : b.px0, b.x, alpha);
      const y = lerpA(b.py0 == null ? b.y : b.py0, b.y, alpha);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(b.a || 0);
      ctx.globalAlpha = clamp(b.life / 300, 0, 1);
      if (b.ring) {
        ctx.strokeStyle = '#D5DEEA';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0.2, Math.PI + 0.4);
        ctx.stroke();
      } else {
        traceRound(-5, -3, 10, 7, 2);
        ctx.fillStyle = '#C4844A';
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  function drawParts(alpha) {
    if (!art || !art.spark) return;
    for (let i = 0; i < POOL; i++) {
      const p = pool[i];
      if (!p.alive) continue;
      const x = lerpA(p.px0, p.x, alpha);
      const y = lerpA(p.py0, p.y, alpha);
      const a = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = a;
      const s = p.r * 2 * (0.55 + a * 0.4);
      ctx.drawImage(art.spark, x - s / 2, y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }
  function drawWorld(alpha) {
    const depth = lerpA(prev.depth, depthPx, alpha);
    drawWell(depth);
    drawRope(alpha);
    const now = performance.now();
    let shown = 0;
    for (const c of coins) {
      if (c.got && (c.fly || 0) > 360) continue;
      const fly = lerpA(c.pfly || 0, c.fly || 0, alpha);
      const sy = c.got ? lerpA(c.psy || c.sy || 0, L(28), clamp(fly / 360, 0, 1)) : (c.worldY - depth + Math.sin(now * 0.004 + (c.idx || 0)) * 3);
      const sx = c.got ? lerpA(c.x, W - L(48), clamp(fly / 360, 0, 1)) : c.x;
      if (!c.got && sx > restX - ringD / 2 - 8 && sy > restY - ringD / 2 - 8) continue;
      if (!c.got && Math.hypot(sx - act.x, sy - act.y) < act.d * 0.7) continue;
      const spin = Math.cos(now / 190 + (c.idx || 0) * 0.6);
      drawCoinSprite(sx, sy, spin);
      shown++;
      void shown;
    }
    if (pickup && art && art.barrelIcon) {
      const sy = pickup.worldY - depth;
      ctx.drawImage(art.barrelIcon, pickup.x - 16, sy - 20, 32, 36);
    }
    for (const e of ents) drawEnt(e, alpha);
    if (swingPhase === 'fly' && ghostN && baked['kiro-barrel-swing']) {
      for (let i = 0; i < ghostN; i++) {
        const g = ghost[i];
        ctx.save();
        ctx.globalAlpha = 0.14 + i * 0.05;
        drawBaked('kiro-barrel-swing', g.x, g.y + PIVOT_DY);
        ctx.restore();
      }
    }
    if (HITBOX) {
      const hb = bodyBox();
      ctx.save();
      ctx.strokeStyle = '#FF3355';
      ctx.lineWidth = 2;
      ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
      ctx.restore();
    }
    drawBits(alpha);
    drawPlayer(alpha);
    drawSword(alpha);
    drawParts(alpha);
  }
  function speaker(x, y, muted) {
    ctx.strokeStyle = muted ? '#8B93A6' : '#F4F1EA';
    ctx.fillStyle = muted ? '#8B93A6' : '#F4F1EA';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 3);
    ctx.lineTo(x - 2, y - 3);
    ctx.lineTo(x + 4, y - 8);
    ctx.lineTo(x + 4, y + 8);
    ctx.lineTo(x - 2, y + 3);
    ctx.lineTo(x - 6, y + 3);
    ctx.closePath();
    ctx.fill();
    if (muted) {
      ctx.beginPath();
      ctx.moveTo(x + 7, y - 5); ctx.lineTo(x + 14, y + 5);
      ctx.moveTo(x + 14, y - 5); ctx.lineTo(x + 7, y + 5);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x + 6, y, 5, -0.8, 0.8);
      ctx.stroke();
    }
  }
  function hudBoxes() {
    const top = (8 + insets().t) / cssPer;
    const gap = 8 / cssPer;
    const h = Math.max(28, 30 / cssPer);
    const coinW = 100 / cssPer;
    const depthW = 92 / cssPer;
    const coinX = 8 / cssPer;
    let depthX = (W - depthW) / 2;
    if (coinX + coinW + gap > depthX) depthX = coinX + coinW + gap;
    const rightX = W - 96 / cssPer;
    let dw = depthW;
    if (depthX + dw + gap > rightX) dw = Math.max(70 / cssPer, rightX - gap - depthX);
    return { top: top, h: h, coinX: coinX, coinW: coinW, depthX: depthX, depthW: dw, spareY: top + h + 6 / cssPer };
  }
  function hudPop(x, y, w, h, t) {
    if (t <= 0) return false;
    const s = 1 + Math.sin(t * Math.PI) * 0.14;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(s, s);
    ctx.translate(-(x + w / 2), -(y + h / 2));
    return true;
  }
  function drawHud() {
    const b = hudBoxes();
    const fs = Math.max(15, 15 / cssPer);
    const coinPopOn = hudPop(b.coinX, b.top, b.coinW, b.h, hudCoinT);
    pill(b.coinX, b.top, b.coinW, b.h, '#10182C', '#FFD84A');
    if (art && art.coin) ctx.drawImage(art.coin, b.coinX + 6, b.top + 4, b.h - 8, b.h - 8);
    label(String(runCoins), b.coinX + b.h + 4, b.top + b.h / 2, fs * 0.9, '#FFD84A', 'left');
    if (coinPopOn) ctx.restore();
    const spareW = Math.min(b.coinW, 96 / cssPer);
    const sparePop = hudPop(b.coinX, b.spareY, spareW, b.h - 2, hudSpareT);
    const spCol = spares > 0 ? '#E8C48A' : '#8B93A6';
    pill(b.coinX, b.spareY, spareW, b.h - 2, '#10182C', spCol);
    if (art && art.barrelIcon) ctx.drawImage(art.barrelIcon, b.coinX + 6, b.spareY + 2, 20, 22);
    label('x' + spares, b.coinX + 30, b.spareY + (b.h - 2) / 2, fs * 0.85, spCol, 'left');
    if (sparePop) ctx.restore();
    pill(b.depthX, b.top, b.depthW, b.h + 2, '#162033', '#EAD19B');
    label(Math.floor(depthM()) + ' m', b.depthX + b.depthW / 2, b.top + (b.h + 2) / 2, Math.max(16, 18 / cssPer), '#F7F4EC', 'center');
    const pr = camX + viewW - 46 / cssPer;
    pill(pr, top, 38 / cssPer, 38 / cssPer, '#10182C', '#F4F1EA');
    ctx.fillStyle = '#F4F1EA';
    traceRound(pr + 12 / cssPer, top + 8 / cssPer, 4 / cssPer, 22 / cssPer, 2);
    ctx.fill();
    traceRound(pr + 22 / cssPer, top + 8 / cssPer, 4 / cssPer, 22 / cssPer, 2);
    ctx.fill();
    pill(pr - 46 / cssPer, top, 38 / cssPer, 38 / cssPer, '#10182C', KWAudio.muted ? '#8B93A6' : '#F4F1EA');
    speaker(pr - 46 / cssPer + 12 / cssPer, top + 19 / cssPer, KWAudio.muted);
  }
  function drawControls(alpha) {
    if (state !== 'play' && state !== 'portal' && state !== 'pause') return;
    const live = joyAnchor || { x: restX, y: restY };
    const a = { x: lerpA(prev.joyX, live.x, alpha), y: lerpA(prev.joyY, live.y, alpha) };
    const kx = lerpA(prev.knobX, joyKnob.dx, alpha);
    const ky = lerpA(prev.knobY, joyKnob.dy, alpha);
    ctx.beginPath();
    ctx.arc(a.x, a.y, ringD / 2, 0, TAU);
    ctx.fillStyle = 'rgba(12,18,32,0.55)';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#D5E2F0';
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(a.x, a.y, ringD / 2 - 6, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    const Rnotch = ringD / 2 - 14;
    const chev = (dx, dy, on) => {
      ctx.fillStyle = on ? '#4FF0FF' : '#7E8CA8';
      ctx.beginPath();
      ctx.arc(a.x + dx, a.y + dy, on ? 5 : 3.5, 0, TAU);
      ctx.fill();
    };
    chev(0, -Rnotch, stickDir === 'up');
    chev(0, Rnotch, stickDir === 'down');
    chev(-Rnotch, 0, stickDir === 'left');
    chev(Rnotch, 0, stickDir === 'right');
    const icon = predict();
    const showSwing = icon === 'swing' || (icon === 'locked' && barrel === 'intact' && atWall() && !swingPhase);
    const press = pressed ? 3 : 0;
    disc(act.x, act.y + press, act.d / 2, pressed ? '#24304C' : (showSwing ? '#6A4424' : '#243456'), showSwing ? '#FFD84A' : '#E4EEF6');
    if (art) {
      const ic = showSwing ? art.barrelIcon : art.katana;
      if (ic) {
        if (icon === 'locked') ctx.globalAlpha = 0.45;
        ctx.drawImage(ic, act.x - 20, act.y - 20 + press, 40, 40);
        ctx.globalAlpha = 1;
      }
    }
    if (atWall() && swingCd > 0 && barrel === 'intact') {
      ctx.strokeStyle = '#4FF0FF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(act.x, act.y, act.d / 2 + 6, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - swingCd / C.swingCd));
      ctx.stroke();
    }
    if (barrelBtn.show) {
      const bg = ctx.createRadialGradient(barrelBtn.x - 8, barrelBtn.y - 10, 4, barrelBtn.x, barrelBtn.y, barrelBtn.d / 2);
      bg.addColorStop(0, '#A86A3A');
      bg.addColorStop(1, '#3A2214');
      disc(barrelBtn.x, barrelBtn.y, barrelBtn.d / 2, bg, '#FFD84A');
      if (art && art.barrelIcon) ctx.drawImage(art.barrelIcon, barrelBtn.x - 14, barrelBtn.y - 16, 28, 32);
    }
    disc(a.x + kx, a.y + ky, knobD / 2, '#F7FAFF', '#9FB0C6');
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.ellipse(a.x + kx - knobD * 0.16, a.y + ky - knobD * 0.18, knobD * 0.16, knobD * 0.1, -0.6, 0, TAU);
    ctx.fill();
  }
  function inkText(str, x, y, size, fill) {
    font(size);
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size * 0.14);
    ctx.strokeStyle = '#2A1204';
    ctx.strokeText(str, x, y);
    ctx.fillStyle = 'rgba(30,12,0,0.72)';
    ctx.fillText(str, x + 1.6, y + 2.4);
    ctx.fillStyle = fill;
    ctx.fillText(str, x, y);
  }
  function drawHut(x, ground) {
    const y = ground - 118;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(x + 36, ground + 4, 48, 8, 0, 0, TAU); ctx.fill();
    const wall = ctx.createLinearGradient(x, y, x + 72, y + 90);
    wall.addColorStop(0, '#C4B09A');
    wall.addColorStop(1, '#7A6856');
    ctx.fillStyle = wall;
    traceRound(x + 8, y + 28, 64, 78, 4);
    ctx.fill();
    ctx.fillStyle = '#6A4030';
    ctx.beginPath();
    ctx.moveTo(x, y + 36);
    ctx.lineTo(x + 40, y - 8);
    ctx.lineTo(x + 80, y + 36);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5A3020';
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 34);
    ctx.lineTo(x + 40, y);
    ctx.lineTo(x + 74, y + 34);
    ctx.closePath();
    ctx.fill();
    if (art && art.glowWarm) {
      ctx.globalAlpha = 0.55;
      ctx.drawImage(art.glowWarm, x + 18, y + 40, 44, 44);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#FFE2A0';
    traceRound(x + 26, y + 48, 22, 18, 3);
    ctx.fill();
    ctx.strokeStyle = '#4A3020';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 37, y + 48); ctx.lineTo(x + 37, y + 66);
    ctx.moveTo(x + 26, y + 57); ctx.lineTo(x + 48, y + 57);
    ctx.stroke();
    if (art && art.lantern) ctx.drawImage(art.lantern, x + 70, y + 24, 22, 34);
  }
  function drawWellRim(cx, mouthY) {
    const rx = 76, ry = 22;
    ctx.fillStyle = 'rgba(28,22,16,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, mouthY + 34, rx - 8, 9, 0, 0, TAU);
    ctx.fill();
    const body = ctx.createLinearGradient(cx - rx, mouthY, cx + rx, mouthY);
    body.addColorStop(0, '#4E4338');
    body.addColorStop(0.5, '#8A7966');
    body.addColorStop(1, '#3C342C');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(cx - rx + 6, mouthY + 4);
    ctx.quadraticCurveTo(cx, mouthY + 38, cx + rx - 6, mouthY + 4);
    ctx.lineTo(cx + rx - 12, mouthY + 24);
    ctx.quadraticCurveTo(cx, mouthY + 50, cx - rx + 12, mouthY + 24);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - rx + 6, mouthY + 4);
    ctx.quadraticCurveTo(cx, mouthY + 38, cx + rx - 6, mouthY + 4);
    ctx.lineTo(cx + rx - 12, mouthY + 24);
    ctx.quadraticCurveTo(cx, mouthY + 50, cx - rx + 12, mouthY + 24);
    ctx.closePath();
    ctx.clip();
    for (let row = 0; row < 3; row++) {
      const cols = 7;
      for (let i = 0; i < cols; i++) {
        const span = (rx * 2) / cols;
        const x = cx - rx + (row % 2) * span * 0.5 + i * span;
        ctx.fillStyle = (i + row) % 2 ? '#A89480' : '#6E6254';
        ctx.fillRect(x + 1, mouthY + 2 + row * 12, span - 2, 11);
      }
    }
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, mouthY, rx, ry + 5, 0, 0, TAU);
    ctx.clip();
    for (let i = 0; i < 14; i++) {
      const a0 = (i / 14) * TAU - Math.PI / 2;
      const a1 = ((i + 1) / 14) * TAU - Math.PI / 2;
      ctx.fillStyle = i % 2 ? '#C4B4A2' : '#7C6E5E';
      ctx.beginPath();
      ctx.moveTo(cx, mouthY);
      ctx.arc(cx, mouthY, rx + 4, a0, a1);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    const hole = ctx.createRadialGradient(cx, mouthY + 2, 6, cx, mouthY, rx - 16);
    hole.addColorStop(0, '#07090C');
    hole.addColorStop(0.72, '#1A2432');
    hole.addColorStop(1, '#314054');
    ctx.fillStyle = hole;
    ctx.beginPath();
    ctx.ellipse(cx, mouthY, rx - 18, ry - 3, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(24,18,14,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, mouthY + 1, rx - 16, ry - 2, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = '#4A4036';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, mouthY, rx, ry + 5, 0, 0, TAU);
    ctx.stroke();
  }
  function drawStoneWell(cx, ground, scale) {
    const s = scale || 1;
    if (s !== 1) {
      ctx.save();
      ctx.translate(cx, ground);
      ctx.scale(s, s);
      ctx.translate(-cx, -ground);
    }
    const mouthY = ground - 28;
    const beamTop = mouthY - 236;
    ctx.fillStyle = '#6B4A30';
    traceRound(cx - 96, beamTop, 14, mouthY + 10 - beamTop, 4); ctx.fill();
    traceRound(cx + 82, beamTop, 14, mouthY + 10 - beamTop, 4); ctx.fill();
    const beam = ctx.createLinearGradient(cx - 110, beamTop, cx + 110, beamTop + 16);
    beam.addColorStop(0, '#6A3E1C');
    beam.addColorStop(0.5, '#E2B56A');
    beam.addColorStop(1, '#5A3416');
    ctx.fillStyle = beam;
    traceRound(cx - 100, beamTop, 200, 16, 5);
    ctx.fill();
    const pulleyR = 15;
    const pulleyY = beamTop + 16 + 2 + pulleyR;
    ctx.save();
    ctx.translate(cx, pulleyY);
    ctx.strokeStyle = '#C9A36A';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, pulleyR, 0, TAU); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-11, 0); ctx.lineTo(11, 0);
    ctx.moveTo(0, -11); ctx.lineTo(0, 11);
    ctx.stroke();
    ctx.restore();
    drawWellRim(cx, mouthY);
    if (s !== 1) ctx.restore();
    const world = (y) => ground + (y - ground) * s;
    return { x: cx, y: world(mouthY), pulleyX: cx, pulleyY: world(pulleyY + pulleyR) };
  }
  function drawDuskSet(ground, opt) {
    opt = opt || {};
    const hutX = opt.hutX == null ? W - 108 : opt.hutX;
    const wellX = opt.wellX == null ? W * 0.5 : opt.wellX;
    const wellScale = opt.wellScale || 1;
    const sky = ctx.createLinearGradient(0, 0, 0, Math.max(ground, 1));
    sky.addColorStop(0, '#141E36');
    sky.addColorStop(0.42, '#3A3358');
    sky.addColorStop(0.72, '#C47858');
    sky.addColorStop(1, '#F0B56A');
    ctx.fillStyle = sky;
    ctx.fillRect(-4, -8, W + 8, visH + 16);
    if (art && art.glowWarm) {
      ctx.globalAlpha = 0.85;
      ctx.drawImage(art.glowWarm, W * 0.62, 18, 150, 150);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#F6E7C0';
    ctx.beginPath(); ctx.arc(W * 0.78, 86, 26, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1A2744';
    ctx.beginPath(); ctx.arc(W * 0.78 + 10, 80, 22, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2C3C5C';
    ctx.beginPath();
    ctx.moveTo(0, ground - 30);
    ctx.quadraticCurveTo(W * 0.28, ground - 260, W * 0.62, ground - 70);
    ctx.quadraticCurveTo(W * 0.82, ground + 20, W, ground - 90);
    ctx.lineTo(W, ground + 30);
    ctx.lineTo(0, ground + 30);
    ctx.fill();
    ctx.fillStyle = '#3E4E6E';
    ctx.beginPath();
    ctx.moveTo(0, ground - 10);
    ctx.quadraticCurveTo(W * 0.35, ground - 90, W, ground - 16);
    ctx.lineTo(W, ground + 20);
    ctx.lineTo(0, ground + 20);
    ctx.fill();
    const grass = ctx.createLinearGradient(0, ground - 80, 0, visH + 20);
    grass.addColorStop(0, '#4E9A52');
    grass.addColorStop(0.35, '#2F7A40');
    grass.addColorStop(1, '#1A4E2C');
    ctx.fillStyle = grass;
    ctx.beginPath();
    ctx.moveTo(0, ground - 8);
    ctx.quadraticCurveTo(W * 0.35, ground - 64, W * 0.7, ground - 6);
    ctx.quadraticCurveTo(W * 0.88, ground + 16, W, ground - 18);
    ctx.lineTo(W, visH + 30);
    ctx.lineTo(0, visH + 30);
    ctx.fill();
    drawHut(hutX, ground - 36);
    const mouth = drawStoneWell(wellX, ground, wellScale);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 14; i++) {
      const x = 12 + (i * 29) % (W - 16);
      const y = ground + 8 + (i % 4) * 16;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 3, y - 10, x + 1, y - 16);
      ctx.stroke();
    }
    if (art && art.spark) {
      const t = performance.now() / 1000;
      for (let i = 0; i < 8; i++) {
        const fx = (24 + i * 48 + Math.sin(t * 0.6 + i) * 14) % (W - 10);
        const fy = ground - 180 + (i * 22) % 150 + Math.sin(t + i) * 6;
        ctx.globalAlpha = 0.7;
        ctx.drawImage(art.spark, fx, fy, 8, 8);
      }
      ctx.globalAlpha = 1;
    }
    return mouth;
  }
  function drawTitle() {
    const t = performance.now() / 1000;
    const ground = viewH * 0.66;
    const mouth = drawDuskSet(ground);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(mouth.x, mouth.y, 52, 14, 0, 0, TAU);
    ctx.clip();
    ctx.translate(mouth.x, mouth.y);
    ctx.rotate(t * 1.2);
    if (art && art.portal) ctx.drawImage(art.portal, -74, -38, 148, 76);
    ctx.restore();
    const hang = CHAR_PIV['kiro-barrel-title'];
    const sway = Math.sin(t * 1.15) * 8;
    const ropeY = mouth.pulleyY + 54;
    const ropeDy = hang ? (hang.rope - hang.p[1]) * SPRITE_SCALE : -20;
    const barrelX = mouth.x + sway;
    const barrelY = ropeY - ropeDy;
    ctx.strokeStyle = '#E6C98A';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mouth.pulleyX, mouth.pulleyY);
    ctx.lineTo(barrelX, ropeY);
    ctx.stroke();
    drawChar('kiro-barrel-title', barrelX, barrelY, SPRITE_SCALE, 1);
    drawChar('tara-winch-ready', mouth.x + 122, ground, SPRITE_SCALE, 1);
    const pile = Math.min(12, totalCoins);
    for (let i = 0; i < pile; i++) drawCoinSprite(mouth.x - 150 + (i % 4) * 18, ground - 18 + ((i / 4) | 0) * 16, Math.cos(t * 3 + i));
    const appear = ease(clamp((performance.now() - titleAt) / 260, 0, 1));
    ctx.save();
    ctx.globalAlpha = appear;
    ctx.translate(W / 2, 48);
    ctx.scale(0.94 + 0.06 * appear, 0.94 + 0.06 * appear);
    inkText('KAGEWELL', 0, 0, 42, '#FFD56A');
    inkText('Barrel Ninja', 0, 34, 16, '#F4E2B0');
    inkText('Abstieg in den Brunnen', 0, 54, 13, '#F7E7C4');
    ctx.restore();
    inkText('Stick bewegt', W / 2, 128, 13, '#F7E7C4');
    inkText('Tippen schlägt  ·  Wand: Fass-Schwung', W / 2, 148, 13, '#F7E7C4');
    const by = viewH * 0.70;
    const bw = 260, bh = 64;
    const bx = camX + viewW / 2 - bw / 2;
    const pulse = 1 + Math.sin(t * 3) * 0.015 * appear;
    ctx.save();
    ctx.translate(bx + bw / 2, by + bh / 2);
    ctx.scale(pulse, pulse);
    pill(-bw / 2, -bh / 2, bw, bh, '#142033', '#4FF0FF');
    label('SPIELEN', 0, 0, 20, '#4FF0FF', 'center');
    ctx.restore();
    const yb = by + 74;
    pill(camX + 12, yb, 170, 40, '#10182C', '#FFD84A');
    if (art && art.coin) ctx.drawImage(art.coin, camX + 20, yb + 6, 28, 28);
    label('x ' + totalCoins, camX + 54, yb + 20, 16, '#FFD84A', 'left');
    pill(camX + viewW - 182, yb, 170, 40, '#10182C', '#EAD19B');
    label(bestD + ' m', camX + viewW - 97, yb + 20, 16, '#FFF8C4', 'center');
  }
  function drawFaint() {
    if (faintT < 240) {
      ctx.fillStyle = '#FFF8DC';
      ctx.globalAlpha = 1 - faintT / 240;
      ctx.fillRect(0, 0, W, visH + 40);
      ctx.globalAlpha = 1;
    }
    uiNoch = { x: camX + viewW / 2 - 110, y: viewH - 78, w: 220, h: 58 };
    uiTitel = { x: camX + viewW / 2 - 70, y: viewH - 132, w: 140, h: 40 };
    const ground = viewH * 0.58;
    const wellScale = 0.46;
    const mouth = drawDuskSet(ground, { wellX: 318, hutX: W - 52, wellScale: wellScale });
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(mouth.x, mouth.y, 64 * wellScale, 18 * wellScale, 0, 0, TAU);
    ctx.clip();
    ctx.globalAlpha = 0.45;
    if (art && art.portal) ctx.drawImage(art.portal, mouth.x - 36, mouth.y - 18, 72, 36);
    ctx.restore();
    const sit = faintT > 700;
    const poseIn = ease(clamp(faintT / 280, 0, 1));
    ctx.save();
    ctx.globalAlpha = 0.4 + 0.6 * poseIn;
    if (sit) {
      drawChar('kiro-situp-proud', 176, ground - 8, FAINT_SCALE, 1);
      drawChar('tara-winch-ready', 268, ground, 0.42, 1);
    } else if (faintT < 320) drawChar('kiro-lying-faint', 188, ground - 16, FAINT_SCALE, 1);
    else drawChar('tara-bends-over-kiro', 196, ground - 22, FAINT_SCALE, 1);
    ctx.restore();
    const shown = Math.min(runCoins, Math.ceil(clamp((faintT - 150) / 1050, 0, 1) * Math.max(0, runCoins)));
    if (shown > coinPop) { KWAudio.play('score_pickup', { semi: shown }); coinPop = shown; }
    const pile = Math.min(shown, 12);
    for (let i = 0; i < pile; i++) {
      const cx = 46 + (i % 3) * 14;
      const cy = ground + 6 - ((i / 3) | 0) * 12;
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.beginPath();
      ctx.ellipse(cx, ground + 16, 11, 4, 0, 0, TAU);
      ctx.fill();
      drawCoinSprite(cx, cy, Math.cos(performance.now() / 200 + i));
    }
    const word = shown === 1 ? 'Münze' : 'Münzen';
    const panel = { x: camX + 16, y: 16, w: viewW - 32, h: 92 };
    const panelIn = ease(clamp(faintT / 280, 0, 1));
    ctx.save();
    ctx.globalAlpha = panelIn;
    ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
    ctx.scale(0.94 + 0.06 * panelIn, 0.94 + 0.06 * panelIn);
    pill(-panel.w / 2, -panel.h / 2, panel.w, panel.h, '#10182C', '#EAD19B');
    label('Du behältst ' + shown + ' ' + word, 0, -26, 15, '#FFF8C4', 'center');
    label('Gesamt ' + totalCoins, 0, 0, 15, '#FFD84A', 'center');
    label(Math.floor(depthM()) + ' m    ' + score + ' Pkt', 0, 26, 15, '#EAD19B', 'center');
    ctx.restore();
    if (faintT >= C.faintButtonMs) {
      const bIn = ease(clamp((faintT - C.faintButtonMs) / 240, 0, 1));
      ctx.save();
      ctx.globalAlpha = bIn;
      pill(uiNoch.x, uiNoch.y, uiNoch.w, uiNoch.h, '#8E1830', '#FFF8C4');
      label('Nochmal', uiNoch.x + uiNoch.w / 2, uiNoch.y + uiNoch.h / 2, 18, '#FFF8C4', 'center');
      pill(uiTitel.x, uiTitel.y, uiTitel.w, uiTitel.h, '#10182C', '#FFF8C4');
      label('Titel', uiTitel.x + uiTitel.w / 2, uiTitel.y + uiTitel.h / 2, 16, '#FFF8C4', 'center');
      ctx.restore();
    }
  }
  function drawPause() {
    const u = ease(clamp((performance.now() - pauseAt) / 240, 0, 1));
    ctx.fillStyle = 'rgba(5,8,16,' + (0.62 * u) + ')';
    ctx.fillRect(-20, -20, W + 40, visH + 40);
    ctx.save();
    ctx.globalAlpha = u;
    const s = 0.94 + 0.06 * u;
    ctx.translate(W / 2, visH * 0.5);
    ctx.scale(s, s);
    ctx.translate(-W / 2, -visH * 0.5);
    label('Pause', W / 2, visH * 0.28 + L(10), L(20), '#FFF8C4', 'center');
    pill(W / 2 - L(90), visH * 0.42, L(180), L(44), '#10182C', '#FFD84A');
    label('Weiter', W / 2, visH * 0.42 + L(22), L(16), '#FFF8C4', 'center');
    pill(W / 2 - L(90), visH * 0.52, L(180), L(44), '#10182C', '#FFD84A');
    label(KWAudio.muted ? 'Ton an' : 'Ton aus', W / 2, visH * 0.52 + L(22), L(16), '#FFF8C4', 'center');
    pill(W / 2 - L(90), visH * 0.62, L(180), L(44), '#10182C', '#FFD84A');
    label('Sag ' + sagMode, W / 2, visH * 0.62 + L(22), L(16), '#FFF8C4', 'center');
    ctx.restore();
  }
  function render(alpha) {
    alpha = clamp(alpha, 0, 1);
    ctx.setTransform(viewScale * dpr, 0, 0, viewScale * dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'low';
    ctx.fillStyle = '#070B14';
    ctx.fillRect(-30, -30, W + 60, visH + 60);
    if (shake > 0.05) {
      const s = Math.sin(performance.now() * 0.045) * shake;
      const c = Math.cos(performance.now() * 0.06) * shake * 0.6;
      ctx.translate(s, c);
    }
    if (state === 'title') drawTitle();
    else if (state === 'faint') drawFaint();
    else {
      drawWorld(alpha);
      drawHud();
      drawControls(alpha);
      if (state === 'portal') {
        const u = clamp(1 - portalT / 280, 0, 1);
        if (u > 0) {
          ctx.globalAlpha = u * 0.85;
          ctx.fillStyle = '#E7F8FF';
          ctx.fillRect(-10, -10, W + 20, visH + 20);
          ctx.globalAlpha = 1;
        }
      }
      if (state === 'pause') drawPause();
    }
  }
  let last = -1, acc = 0;
  function integrate(dt) {
    if (dt < 0) dt = 0;
    if (dt > CFG.maxFrameDt) dt = CFG.maxFrameDt;
    acc += dt;
    let steps = 0;
    while (acc >= CFG.step && steps < 8) {
      snapshot();
      step(CFG.step * 1000);
      stepParts(CFG.step * 1000);
      acc -= CFG.step;
      steps++;
    }
    if (steps === 8) acc = 0;
  }
  function pump() {
    const now = performance.now();
    if (last < 0) { last = now; return; }
    const dt = (now - last) / 1000;
    last = now;
    integrate(dt);
  }
  function frame(now) {
    requestAnimationFrame(frame);
    const t0 = performance.now();
    if (last < 0) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt < 0) dt = 0;
    const clamped = dt > CFG.maxFrameDt ? CFG.maxFrameDt : dt;
    integrate(clamped);
    if (state !== 'play' && window.KWAudio && KWAudio.stepDecode) KWAudio.stepDecode();
    render(acc / CFG.step);
    if (state === 'play') {
      const wallMs = dt * 1000;
      frameTimes.push(wallMs);
      if (frameTimes.length > 12000) frameTimes.shift();
      workTimes.push(performance.now() - t0);
      if (workTimes.length > 4000) workTimes.shift();
      adaptDts.push(clamped);
      if (adaptDts.length > 120) adaptDts.shift();
      if (adaptDts.length >= 120 && adaptN < 2 && dprLimit > CFG.dprMin) {
        let sum = 0;
        for (let i = 0; i < adaptDts.length; i++) sum += adaptDts[i];
        if (sum / adaptDts.length > 1 / 40) {
          dprLimit = Math.max(CFG.dprMin, dprLimit - 0.5);
          adaptN++;
          adaptDts.length = 0;
          resize();
        }
      }
    }
  }
  function cssBox(lx, ly, lw, lh) {
    const r = canvas.getBoundingClientRect();
    const sx = r.width / viewW, sy = r.height / Math.max(1, viewH);
    return { x: r.left + (lx - camX) * sx, y: r.top + ly * sy, w: lw * sx, h: lh * sy };
  }
  function publish() {
    window.__BN = {
      get state() { return state; },
      get swingCd() { return swingCd; },
      get atWall() { return atWall(); },
      get actionIcon() { return predict(); },
      get actionLast() { return actionLast; },
      get spareBarrels() { return spares; },
      get joy() {
        const live = joyAnchor || { x: restX, y: restY };
        return {
          x: cssBox(live.x + joyKnob.dx, live.y + joyKnob.dy, 0, 0).x,
          y: cssBox(live.x + joyKnob.dx, live.y + joyKnob.dy, 0, 0).y,
          dir: stickDir, anchor: { x: cssBox(live.x, live.y, 0, 0).x, y: cssBox(live.x, live.y, 0, 0).y },
          rest: { x: cssBox(restX, restY, 0, 0).x, y: cssBox(restX, restY, 0, 0).y },
          radius: cssBox(0, 0, ringD / 2, 0).w, deadzone: cssBox(0, 0, ringD / 2 * deadFrac, 0).w
        };
      },
      get hudRects() {
        return {
          joy: cssBox(restX - ringD / 2, restY - ringD / 2, ringD, ringD),
          joyKnob: cssBox(restX - knobD / 2, restY - knobD / 2, knobD, knobD),
          action: cssBox(act.x - act.d / 2, act.y - act.d / 2, act.d, act.d),
          actionHit: cssBox(act.x - act.hit / 2, act.y - act.hit / 2, act.hit, act.hit),
          barrel: barrelBtn.show ? cssBox(barrelBtn.x - barrelBtn.d / 2, barrelBtn.y - barrelBtn.d / 2, barrelBtn.d, barrelBtn.d) : null,
          spare: cssBox(camX + 8 / cssPer, (8 + insets().t) / cssPer + 16 / cssPer + 14, 100 / cssPer, 16 / cssPer + 8),
          coins: (function () { const b = hudBoxes(); return cssBox(b.coinX, b.top, b.coinW, b.h); })(),
          depth: (function () { const b = hudBoxes(); return cssBox(b.depthX, b.top, b.depthW, b.h + 2); })(),
          pause: cssBox(camX + viewW - 48 / cssPer, (8 + insets().t) / cssPer, 40 / cssPer, 38 / cssPer),
          mute: cssBox(camX + viewW - 96 / cssPer, (8 + insets().t) / cssPer, 40 / cssPer, 38 / cssPer),
          spielen: cssBox(camX + viewW / 2 - 130, viewH * 0.70, 260, 64),
          nochmal: uiNoch ? cssBox(uiNoch.x, uiNoch.y, uiNoch.w, uiNoch.h) : cssBox(camX + 16, act.y - 26, 176, 52),
          titel: uiTitel ? cssBox(uiTitel.x, uiTitel.y, uiTitel.w, uiTitel.h) : null,
          player: cssBox(px - 40, py + BH / 2 - 62, 80, 96)
        };
      },
      get dpr() {
        return {
          raw: rawDPR, eff: dpr, dpr: dpr, dprInt: dpr, dprCap: dprLimit, dprLimit: dprLimit,
          dprMax: CFG.dprMax, dprMin: CFG.dprMin, backingW: canvas.width, backingH: canvas.height,
          cssW: cssW, cssH: cssH, smoothing: ctx.imageSmoothingEnabled !== false
        };
      },
      get frameTimes() { return frameTimes.slice(); },
      get workTimes() { return workTimes.slice(); },
      get runCoins() { return runCoins; },
      get coinsN() { return coins.length; },
      get totalCoins() { return totalCoins; },
      get depthM() { return depthM(); },
      get score() { return score; },
      get player() { return { x: px, y: py, barrel: barrel }; },
      get unfair() { return unfair; },
      get enemies() { return ents.filter(e => e.alive).map(e => ({ kind: e.kind, x: e.x || 0, y: e.y, state: e.state })); },
      get pressed() { return pressed; },
      get inputLag() { return inputLags.slice(); },
      clearMarks: function () { if (DEBUG) ents = ents.filter(e => e.kind !== 'mark'); },
      placeTarget: function (x, y) {
        if (!DEBUG) return -1;
        ents.push({ kind: 'mark', x: x, y: y, pinned: true, hp: 1, alive: true, t: 0, slashId: -1, points: 10, state: 'idle' });
        return ents.length;
      },
      targetAlive: function (x, y) { return ents.some(e => e.alive && e.kind === 'mark' && Math.hypot(e.x - x, e.y - y) < 6); },
      forceBreak: function () {
        if (!DEBUG || state !== 'play') return;
        caused = true; barrel = 'intact';
        hurt({});
        barrelBtn.show = barrel === 'broken' && spares > 0;
      },
      forceDown: function () {
        if (!DEBUG || state !== 'play') return;
        caused = true;
        hurt({});
        barrelBtn.show = barrel === 'broken' && spares > 0;
      },
      dropSpare: function () {
        if (!DEBUG) return;
        pickup = { x: px, worldY: depthPx + py + 4, t: 0 };
      },
      setBot: function (m) { bot = m; },
      paint: function () { render(1); },
      sim: function (ms) {
        let left = ms;
        const stepMs = CFG.step * 1000;
        while (left > 0.0001) {
          const dt = Math.min(stepMs, left);
          snapshot();
          step(dt);
          stepParts(dt);
          left -= dt;
        }
        return { state: state, unfair: unfair, depth: depthM(), playMs: playMs };
      }
    };
  }
  function onShow() { last = -1; acc = 0; poseBakeKey = ''; resize(); }
  async function boot() {
    titleAt = performance.now();
    await loadCharImages();
    if (window.KWAudio && KWAudio.prefetch) {
      KWAudio.prefetch(['ui_confirm', 'portal_enter', 'sword_slash', 'music_calm_loop', 'ambience_well_loop', 'score_pickup', 'barrel_break', 'player_hit', 'tara_wake', 'meadow_ambience_loop']);
    }
    totalCoins = store.get(KEY.coins, 0) || 0;
    bestD = store.get(KEY.bestD, 0) || 0;
    bestS = store.get(KEY.bestS, 0) || 0;
    KWAudio.setRng(rng);
    resize();
    joyAnchor = { x: restX, y: restY };
    prev.joyX = restX; prev.joyY = restY;
    snapshot();
    publish();
    window.addEventListener('resize', () => { insetAt = 0; resize(); });
    document.addEventListener('visibilitychange', onShow);
    window.addEventListener('pageshow', onShow);
    canvas.addEventListener('pointerdown', onDown, { passive: false });
    canvas.addEventListener('pointermove', onMove, { passive: false });
    canvas.addEventListener('pointerup', onUp, { passive: false });
    canvas.addEventListener('pointercancel', onUp, { passive: false });
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
    document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    document.addEventListener('gesturestart', e => e.preventDefault());
    if (navigator.serviceWorker && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
    }
    requestAnimationFrame(frame);
  }
  boot();
})();
