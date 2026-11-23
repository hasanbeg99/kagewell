/* Kagewell prototyp — rebuild 2026-11-23. Pixel well, title, Tara faint. */
(function () {
  'use strict';
  const qs = new URLSearchParams(location.search);
  const NO_SPAWN = qs.get('noSpawn') === '1';
  const DEBUG = qs.get('debug') === '1';
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
    logicalW: 390, logicalH: 844, wall: 30, barrelW: 64, barrelH: 72,
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
  const KEY = { coins: 'kagewell.prototyp.coins', bestD: 'kagewell.prototyp.bestDepth', bestS: 'kagewell.prototyp.bestScore', seen: 'kagewell.prototyp.seen' };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  let art = null, kiroImg = null, vfx = null;
  let cssW = 390, cssH = 844, viewScale = 1, visH = 844, camX = 0, viewW = 390, viewH = 844, cssPer = 1;
  let rawDPR = 1, effDPR = 1, dprInt = 1, dprCap = 4;
  let state = 'title', playMs = 0, depthPx = 0, scrollV = 0, portalT = 0, portalLen = 2500, seenRun = false;
  let px = 195, py = 360, moveK = 0, holdMs = 0, coast = null, stickDir = null, axisLock = null, lastSide = 1;
  let sagMode = 'B', visSag = 0, duckT = 0, barrel = 'intact', spares = 1, invuln = 0, equipT = 0;
  let slashPhase = null, slashT = 0, slashCd = 0, slashDir = 1, slashSerial = 0, bufUntil = 0, actionLast = '';
  let swingPhase = null, swingT = 0, swingU = 0, swingCd = 0, swingFromX = 0, swingFromY = 0, swingToX = 0, swingDir = 1, swingKills = 0, swingHit = false;
  let recoil = 0, impact = 0, pressed = false, runCoins = 0, totalCoins = 0, score = 0, bestD = 0, bestS = 0;
  let combo = 1, comboAt = -1e9, playerMoved = 0, unfair = false, caused = false, firstCreep = false, knotLock = 0;
  let waveT = 0, waveN = 1, waveOn = true, attackAt = 0, lastImpact = -1e9, lastPickupM = 0, pickupRoll = -1, pickup = null;
  let coinChainAt = 0, nextCoinM = 0, creakSide = 0, ropeCd = 0, hitStop = 0;
  let joyAnchor = null, joyKnob = { dx: 0, dy: 0 }, joyFrom = null, joyTo = null, joyBack = 0, joyId = null;
  let restX = 300, restY = 700, ringD = 128, knobD = 52, deadFrac = 0.12;
  let act = { x: 70, y: 760, d: 72, hit: 88 }, barrelBtn = { x: 160, y: 760, d: 58, show: false };
  let ents = [], coins = [], parts = [], ghosts = [];
  let bot = null, frameTimes = [], inputLags = [], p90s = [], slowStreak = 0, stage = 0, capCool = 0, particleScale = 1, coinPop = 0;
  const ptrs = new Map();
  const SEG = 12;
  const rx = new Float64Array(SEG + 1), ry = new Float64Array(SEG + 1), ox = new Float64Array(SEG + 1), oy = new Float64Array(SEG + 1);
  let ropeAcc = 0, ropeAx = 195;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(p) { p = clamp(p, 0, 1); return 1 - Math.pow(1 - p, 3); }
  function ir(a, b) { return a + rng() * (b - a); }
  function iint(a, b) { return (ir(a, b + 1)) | 0; }
  function choice(w) { let t = 0; for (const k in w) t += w[k]; let r = rng() * t; for (const k in w) { r -= w[k]; if (r <= 0) return k; } return Object.keys(w)[0]; }
  function depthM() { return depthPx / C.pxPerMeter; }
  function minX() { return C.wall + BW / 2; }
  function maxX() { return W - C.wall - BW / 2; }
  function gapL(x) { return (x - BW / 2) - C.wall; }
  function gapR(x) { return (W - C.wall) - (x + BW / 2); }
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

  function layout() {
    const vw = window.innerWidth, vh = window.innerHeight;
    cssW = Math.min(vw, 480);
    cssH = vh;
    viewScale = cssW / W;
    visH = cssH / viewScale;
    rawDPR = window.devicePixelRatio || 1;
    effDPR = Math.min(rawDPR, dprCap);
    dprInt = Math.max(1, Math.min(dprCap, Math.round(effDPR)));
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    const bw = Math.max(1, Math.round(cssW * effDPR)), bh = Math.max(1, Math.round(cssH * effDPR));
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    viewW = Math.min(W, Math.floor(canvas.width / dprInt));
    viewH = Math.min(Math.ceil(visH), Math.floor(canvas.height / dprInt));
    camX = Math.max(0, (W - viewW) / 2);
    cssPer = cssW / Math.max(1, viewW);
    const s = insets();
    const edgeX = (24 + s.l) / cssPer, edgeR = (24 + s.r) / cssPer, edgeB = (24 + s.b) / cssPer;
    const right = camX + viewW, bottom = viewH;
    ringD = 64 * Math.ceil(120 / (64 * cssPer));
    knobD = 32 * Math.ceil(48 / (32 * cssPer));
    restX = right - edgeR - ringD / 2;
    restY = bottom - edgeB - ringD / 2;
    act.d = Math.ceil(72 / cssPer);
    act.hit = Math.ceil(88 / cssPer);
    act.x = camX + edgeX + act.d / 2;
    act.y = bottom - edgeB - act.d / 2;
    barrelBtn.d = Math.ceil(58 / cssPer);
    barrelBtn.x = act.x + act.hit / 2 + Math.ceil(8 / cssPer) + barrelBtn.d / 2;
    barrelBtn.y = act.y;
    if (joyId == null && joyBack <= 0) joyAnchor = { x: restX, y: restY };
  }

  function logical(e) {
    const r = canvas.getBoundingClientRect();
    const sx = viewW / r.width, sy = viewH / r.height;
    return { x: camX + (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  }
  function hitRect(p, x, y, w, h) { return p.x >= x && p.y >= y && p.x <= x + w && p.y <= y + h; }
  function hitCircle(p, c, rad) { return Math.hypot(p.x - c.x, p.y - c.y) <= rad; }

  function predict() {
    if (state !== 'play' && state !== 'portal') return 'locked';
    if (swingPhase) return 'locked';
    if (barrel === 'intact' && atWall() && swingCd <= 0) return 'swing';
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
    if (state === 'title' && hitRect(p, camX + viewW / 2 - 130, viewH * 0.68, 260, 70)) { beginRun(); return; }
    if (state === 'faint') {
      if (playMs >= 0 && faintAge() >= C.faintButtonMs && hitCircle(p, { x: act.x, y: act.y }, act.hit / 2)) { again(); return; }
      if (faintAge() >= C.faintButtonMs && hitRect(p, W / 2 - L(70), viewH * 0.62, L(140), L(44))) { toTitle(); return; }
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
    if (hitCircle(p, { x: W - L(36), y: L(28) }, L(22))) { state = 'pause'; KWAudio.duckMusic(0.35, 0.2); KWAudio.play('ui_click'); return; }
    if (hitCircle(p, { x: W - L(78), y: L(28) }, L(18))) { KWAudio.setMuted(!KWAudio.muted); KWAudio.play('ui_click'); return; }
    let role = 'none';
    const right = p.x >= W / 2 && p.y > hudBottom;
    if (!right && barrelBtn.show && hitCircle(p, barrelBtn, barrelBtn.d / 2 + 2)) role = 'barrel';
    else if (!right && hitCircle(p, act, act.hit / 2)) role = 'action';
    else if (right && joyId == null) role = 'joy';
    ptrs.set(e.pointerId, { role: role, x: p.x, y: p.y });
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    if (role === 'joy') {
      joyId = e.pointerId;
      joyAnchor = { x: clamp(p.x, ringD / 2, W - ringD / 2), y: clamp(p.y, hudBottom + ringD / 2, visH - ringD / 2) };
      joyBack = 0; readJoy();
    } else if (role === 'action') { pressed = true; bufUntil = performance.now() + C.actionBufferMs; tryAction(); }
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
    swingPhase = null; swingT = 0; swingU = 0; swingCd = 0; swingKills = 0; ghosts = [];
    depthPx = 0; playMs = 0; score = 0; runCoins = 0; combo = 1; comboAt = -1e9;
    playerMoved = 0; unfair = false; caused = false; firstCreep = false; knotLock = 0;
    waveT = 0; waveN = 1; waveOn = true; attackAt = 0; lastImpact = -1e9;
    lastPickupM = 0; pickupRoll = -1; pickup = null; coinChainAt = 0; nextCoinM = 0;
    ents = []; coins = []; parts = []; recoil = 0; impact = 0; hitStop = 0;
    ropeAx = px; initRope();
    if (vfx) vfx.clear();
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
    if (performance.now() > bufUntil) return;
    if ((state !== 'play' && state !== 'portal') || swingPhase) return;
    const want = predict();
    if (want === 'locked') return;
    if (want === 'swing') { startSwing(); bufUntil = 0; actionLast = 'swing'; return; }
    if (slashCd > 0 || slashPhase) return;
    startSlash(); bufUntil = 0; actionLast = 'sword';
  }
  function startSlash() {
    slashPhase = 'windup'; slashT = 0; slashCd = C.swordCd; slashSerial++;
    slashDir = slashSide(); lastSide = slashDir;
    KWAudio.play('sword_slash');
  }
  function startSwing() {
    swingPhase = 'windup'; swingT = 0; swingU = 0; swingKills = 0; swingHit = false; ghosts = [];
    swingFromX = px; swingFromY = py; swingDir = atLeft() ? 1 : -1;
    swingToX = swingDir > 0 ? (W - C.wall - BW / 2 - 4) : (C.wall + BW / 2 + 4);
    KWAudio.play('barrel_swing');
  }
  function swordHits() {
    const sweep = slashPhase === 'recover' ? 1 : ease(clamp(slashT / C.swordSweepMs, 0, 1));
    const pivotY = py - 0.18 * BH;
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
    if (vfx) vfx.hit(en.x, en.y, { type: en.kind === 'bat' ? 'fledermaus' : 'krabbler', dir: dir || 0, hitStop: fromSwing ? 40 : 50, shake: 4 });
    if (rng() < C.coinDropOnKillChance) coins.push({ x: en.x, worldY: depthPx + en.y, t: 0, chain: -1 });
    if (en.kind === 'cutter') knotLock = playMs + 1000;
  }
  function hurt(src) {
    if (invuln > 0 || swingPhase || barrel === 'equipping' || state !== 'play') return;
    if (playMs < 20000 && !caused && !(src && src.force)) return;
    if (src && src.harmless) return;
    if (barrel === 'intact' && !(src && src.force)) {
      barrel = 'broken'; invuln = C.breakInvuln;
      if (vfx) vfx.barrelBreak(px, py + BH / 2, { hitStop: 60, shake: 6 });
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
      const b = { x: x - BW / 2, y: y, w: BW, h: BH };
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
        if ((e.state === 'lunge' || e.state === 'hold') && !e.harmless && overlap({ x: px - BW / 2, y: py, w: BW, h: BH }, hazardBox(e))) hurt(e);
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
        if (e.ext > 16 && overlap({ x: px - BW / 2, y: py, w: BW, h: BH }, hazardBox(e))) hurt(e);
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
    if (playMs >= C.firstCoinAtMs && coinChainAt === 0) dropChain(px, py + 90, 4, true);
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
    if (m >= nextCoinM) { dropChain(C.wall + 50 + rng() * (W - 2 * C.wall - 100), visH + 20, 3 + (rng() * 3 | 0), false); nextCoinM = m + 4; }
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
    for (let i = 0; i < n; i++) coins.push({ x: x, worldY: depthPx + screenY + i * 28, t: 0, chain: coinChainAt, idx: i });
    void teach;
  }
  function updateCoins(dt) {
    const body = { x: px - BW / 2, y: py, w: BW, h: BH };
    for (const c of coins) {
      if (c.got) continue;
      c.t += dt;
      const sy = c.worldY - depthPx + Math.sin(c.t * 0.01) * 2;
      c.sy = sy;
      if (overlap(body, { x: c.x - 12, y: sy - 12, w: 24, h: 24 })) {
        c.got = true; c.fly = 0; runCoins++; score += C.coinPoints;
        const semi = c.chain ? c.idx : 0;
        KWAudio.play('score_pickup', { semi: semi });
      }
    }
    coins = coins.filter(c => {
      if (c.got) return c.fly != null && c.fly < 360;
      const sy = c.worldY - depthPx;
      return sy > -60 && sy < visH + 80;
    });
    for (const c of coins) if (c.got) c.fly += dt;
  }

  function initRope() {
    for (let i = 0; i <= SEG; i++) { rx[i] = ox[i] = px; ry[i] = oy[i] = (py * i) / SEG; }
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
      if (ghosts.length < 3 && (ghosts.length === 0 || swingT - ghosts[ghosts.length - 1].t >= 70)) ghosts.push({ x: px, y: py, t: swingT });
      const box = { x: px - BW / 2 - C.swingPad, y: py - C.swingPad, w: BW + C.swingPad * 2, h: BH + C.swingPad * 2 };
      for (const e of ents) if (e.alive && e.hp < 1e8 && e.kind !== 'hazard' && overlap(box, { x: e.x - 20, y: e.y - 16, w: 40, h: 32 })) kill(e, swingDir, true);
      if (swingT >= C.swingMs) {
        px = swingToX; py = swingFromY; swingPhase = null; swingCd = C.swingCd; impact = 1; duckT = C.duckMs;
        KWAudio.play('barrel_land');
        if (vfx) vfx.shake(4);
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
      if (overlap({ x: px - BW / 2, y: py, w: BW, h: BH }, { x: pickup.x - 16, y: sy - 18, w: 32, h: 36 })) {
        if (spares < C.spareMax) { spares++; KWAudio.play('barrel_pickup'); }
        lastPickupM = depthM(); pickupRoll = -1; pickup = null;
      } else if (sy < -40) pickup = null;
    }
    const tier = depthM() >= 300 ? 'music_fast' : depthM() >= 120 ? 'music_mid' : 'music_calm';
    KWAudio.setMusic(tier);
    tryAction();
    ropeStep(dt, px, py + (sagMode === 'B' ? visSag : 0) + 10);
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
    capCool = Math.max(0, capCool - dtMs);
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
      if (rng() < 0.02) { bufUntil = performance.now() + C.actionBufferMs; tryAction(); }
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
    if (threat && Math.abs(threat.x - px) < C.swordR && Math.abs(threat.y - py) < 90) { bufUntil = performance.now() + 120; tryAction(); }
  }

  function blit(img, x, y, w, h) {
    if (!img) return;
    ctx.drawImage(img, Math.round(x), Math.round(y), w || img.width, h || img.height);
  }
  function biomeName() {
    const s = Math.floor(depthM() / 100) % 4;
    return ['moon', 'moss', 'ember', 'crystal'][s];
  }
  function drawWorld() {
    const tile = art.tiles[biomeName()] || art.tiles.moon;
    const y0 = -((depthPx * 0.5) % tile.height);
    for (let y = y0; y < visH; y += tile.height) for (let x = 0; x < W; x += tile.width) blit(tile, x, y);
    const side = art.side;
    const ys = -((depthPx) % side.height);
    for (let y = ys; y < visH; y += side.height) { blit(side, 0, y); blit(side, W - side.width, y); }
    ctx.strokeStyle = '#C9A66B'; ctx.lineWidth = 4; ctx.lineCap = 'butt';
    ctx.beginPath();
    for (let i = 0; i <= SEG; i++) { const x = rx[i], y = ry[i]; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke();
    ctx.strokeStyle = '#EAD19B'; ctx.lineWidth = 2; ctx.stroke();
    for (const c of coins) {
      if (c.got && c.fly > 360) continue;
      const sy = c.got ? lerp(c.sy || 0, L(20), clamp(c.fly / 360, 0, 1)) : (c.worldY - depthPx);
      const sx = c.got ? lerp(c.x, W - L(50), clamp(c.fly / 360, 0, 1)) : c.x;
      blit(art.coin[(c.t / 120 | 0) % 4], sx - 16, sy - 16, 32, 32);
    }
    if (pickup) blit(art.coin[0], pickup.x - 14, pickup.worldY - depthPx - 18, 28, 28);
    for (const e of ents) drawEnt(e);
    if (ghosts.length && kiroImg) {
      ctx.save(); ctx.globalAlpha = 0.4;
      for (const g of ghosts) ctx.drawImage(kiroImg, Math.round(g.x - 40), Math.round(g.y - 70), 80, 96);
      ctx.restore();
    }
    drawPlayer();
    drawSword();
    if (vfx) vfx.draw(ctx);
  }
  function drawEnt(e) {
    if (e.kind === 'creep') {
      const pose = e.state === 'windup' ? 1 : (e.state === 'lunge' || e.state === 'hold') ? 2 : 0;
      const spr = art.creep[pose][e.side < 0 ? 0 : 1];
      const x = e.side < 0 ? C.wall - 4 : W - C.wall - spr.width + 4;
      blit(spr, e.alive ? x - e.side * e.ext * 0.2 : e.x, e.y - spr.height / 2);
    } else if (e.kind === 'bat') {
      const spr = art.bat[(e.t / 120 | 0) % 3][e.x < px ? 0 : 1];
      blit(spr, e.x - spr.width / 2, e.y - spr.height / 2);
    } else if (e.kind === 'hazard') {
      const spr = e.vine ? art.vine[e.side < 0 ? 0 : 1] : art.rock[e.side < 0 ? 0 : 1];
      const x = e.side < 0 ? C.wall : W - C.wall - Math.max(spr.width, e.ext);
      blit(spr, x, e.y - spr.height / 2, Math.max(spr.width, e.ext), spr.height);
    } else if (e.kind === 'cutter') {
      const spr = art.cutter[e.x < px ? 0 : 1];
      blit(spr, e.x - spr.width / 2, e.y - spr.height / 2);
    }
  }
  function drawPlayer() {
    const bob = sagMode === 'B' ? visSag : 0;
    const img = kiroImg || art.kiroHead;
    ctx.save();
    ctx.translate(Math.round(px), Math.round(py + BH / 2 + bob));
    if (impact > 0) ctx.scale(1 + impact * 0.1, 1 - impact * 0.15);
    if (swingPhase === 'fly') ctx.rotate(swingDir * swingU * TAU);
    else if (duckT > 0 && barrel === 'intact') ctx.rotate((atLeft() ? 1 : -1) * (3 * Math.PI / 180) * (duckT / C.duckMs));
    if (barrel === 'broken') {
      ctx.drawImage(img, 0, 0, img.width, Math.round(img.height * 0.48), -26, -56, 52, 50);
    } else {
      ctx.drawImage(img, -40, -70, 80, 96);
    }
    ctx.restore();
  }
  function drawSword() {
    if (!slashPhase && slashCd > 200) return;
    if (!slashPhase) return;
    const u = slashPhase === 'windup' ? 0 : slashPhase === 'active' ? clamp(slashT / C.swordSweepMs, 0, 1) : 1;
    const ang = (slashPhase === 'windup' ? -105 : -90 + 90 * ease(u)) * Math.PI / 180 * slashDir - (slashDir < 0 ? Math.PI : 0);
    const a0 = slashDir > 0 ? -Math.PI / 2 : -Math.PI;
    const a1 = slashDir > 0 ? (-Math.PI / 2 + (Math.PI / 2) * ease(u)) : (-Math.PI / 2 - (Math.PI / 2) * ease(u));
    const cx = px, cy = py - 0.18 * BH;
    ctx.save();
    ctx.strokeStyle = '#4FF0FF'; ctx.lineWidth = 8; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.arc(cx, cy, 76, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke();
    ctx.strokeStyle = '#EEF4FF'; ctx.lineWidth = 3; ctx.stroke();
    const tip = slashPhase === 'windup' ? a0 : a1;
    ctx.fillStyle = '#E0A868';
    ctx.fillRect(cx + Math.cos(tip) * 16 - 3, cy + Math.sin(tip) * 16 - 3, 8, 8);
    ctx.restore();
    void ang;
  }
  function roundRect(x, y, w, h, fill, stroke) {
    ctx.fillStyle = fill; ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.strokeRect((x | 0) + 1, (y | 0) + 1, (w | 0) - 2, (h | 0) - 2); }
  }
  function text(str, x, y, size, col, align) {
    ctx.fillStyle = col || '#FFF8C4';
    ctx.font = Math.round(size) + "px 'PS2P', monospace";
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(str, x | 0, y | 0);
  }
  function drawHud() {
    const top = (8 + insets().t) / cssPer;
    const left = camX + 8 / cssPer;
    const fs = Math.max(16 / cssPer, 16);
    roundRect(left, top, 120 / cssPer, fs + 8, '#0B1426', '#FFD84A');
    blit(art.coin[0], left + 4, top + 2, fs, fs);
    text(String(runCoins), left + fs + 8, top + 4, fs * 0.8, '#FFD84A');
    const spCol = spares > 0 ? '#E0A868' : '#7B8494';
    roundRect(left, top + fs + 14, 100 / cssPer, fs + 8, '#0B1426', spCol);
    text('F ' + spares, left + 6, top + fs + 18, fs * 0.8, spCol);
    text(Math.floor(depthM()) + ' m', camX + viewW / 2, top + 4, fs * 0.85, '#FFF8C4', 'center');
    const pr = camX + viewW - 48 / cssPer;
    roundRect(pr, top, 40 / cssPer, 32 / cssPer, '#0B1426', '#FFF8C4');
    text('II', pr + 8 / cssPer, top + 6, fs * 0.7, '#FFF8C4');
    roundRect(pr - 48 / cssPer, top, 40 / cssPer, 32 / cssPer, '#0B1426', KWAudio.muted ? '#7B8494' : '#FFF8C4');
    text(KWAudio.muted ? 'x' : 'T', pr - 36 / cssPer, top + 6, fs * 0.7, '#FFF8C4');
  }
  function drawControls() {
    if (state !== 'play' && state !== 'portal' && state !== 'pause') return;
    const a = joyAnchor || { x: restX, y: restY };
    blit(art.joyRing, a.x - ringD / 2, a.y - ringD / 2, ringD, ringD);
    blit(art.joyKnob, a.x + joyKnob.dx - knobD / 2, a.y + joyKnob.dy - knobD / 2, knobD, knobD);
    const icon = predict();
    roundRect(act.x - act.d / 2, act.y - act.d / 2, act.d, act.d, pressed ? '#243056' : '#10152B', '#EAD19B');
    ctx.save();
    ctx.translate(act.x, act.y);
    if (icon === 'swing') {
      ctx.fillStyle = '#8A5A2E'; ctx.fillRect(-12, -16, 24, 32);
      ctx.fillStyle = '#EEF4FF'; ctx.fillRect(-12, -16, 24, 4); ctx.fillRect(-12, 8, 24, 4);
    } else {
      ctx.strokeStyle = '#4FF0FF'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-8, 10); ctx.lineTo(12, -12); ctx.stroke();
      ctx.fillStyle = '#E0A868'; ctx.fillRect(-14, 6, 10, 8);
    }
    ctx.restore();
    if (atWall() && swingCd > 0 && barrel === 'intact') {
      ctx.strokeStyle = '#4FF0FF'; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(act.x, act.y, act.d / 2 + 6, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - swingCd / C.swingCd));
      ctx.stroke();
    }
    if (barrelBtn.show) {
      roundRect(barrelBtn.x - barrelBtn.d / 2, barrelBtn.y - barrelBtn.d / 2, barrelBtn.d, barrelBtn.d, '#3A1E10', '#FFD84A');
      ctx.fillStyle = '#E0A868';
      ctx.fillRect(barrelBtn.x - 12, barrelBtn.y - 14, 24, 28);
    }
  }
  function drawTitle() {
    blit(art.title, 0, 0, W, Math.max(visH, 844));
    const t = performance.now() / 1000;
    blit(art.portal[(t * 8 | 0) % 3], 156, 488, 110, 78);
    if (art.tara) blit(art.tara, 248, 455, 90, 135);
    if (kiroImg) blit(kiroImg, 118, 470, 110, 132);
    const pile = Math.min(16, totalCoins);
    for (let i = 0; i < pile; i++) blit(art.coin[(t * 4 + i | 0) % 4], 300 + (i % 4) * 16, 560 + ((i / 4) | 0) * 14, 20, 20);
    ctx.fillStyle = '#FFE2A8';
    for (let i = 0; i < 14; i++) {
      const fx = (30 + i * 27 + Math.sin(t * 0.6 + i) * 16) % 380;
      const fy = 400 + (i * 19) % 160 + Math.sin(t * 1.3 + i) * 8;
      const s = i % 2 ? 4 : 2;
      ctx.fillRect(fx | 0, fy | 0, s, s);
    }
    text('KAGEWELL', W / 2, L(28), 28, '#FFF8C4', 'center');
    text('Barrel Ninja', W / 2, L(64), 12, '#FFD84A', 'center');
    const by = viewH * 0.68;
    roundRect(camX + viewW / 2 - 120, by, 240, 56, '#10152B', '#4FF0FF');
    text('SPIELEN', camX + viewW / 2, by + 18, 16, '#4FF0FF', 'center');
    const fs = Math.max(16 / cssPer, 16);
    text(String(totalCoins), camX + 16, viewH - 36, fs, '#FFD84A');
    text(bestD + ' m', camX + viewW - 16, viewH - 36, fs, '#FFF8C4', 'right');
  }
  function drawFaint() {
    const k = clamp(faintT / 500, 0, 1);
    ctx.fillStyle = 'rgba(255,248,220,' + (0.85 * ease(Math.min(1, faintT / 280))) + ')';
    ctx.fillRect(0, 0, W, visH + 40);
    if (k > 0.35) blit(art.meadow, 0, 0, W, Math.max(visH, 844));
    const sit = faintT > 600 ? 1 : 0;
    if (art.taraLean) blit(art.taraLean, 200, viewH * 0.36, 96, 140);
    if (kiroImg) blit(kiroImg, 100, viewH * (sit ? 0.42 : 0.46), 100, 120);
    const shown = Math.min(runCoins, Math.floor(clamp((faintT - 200) / 1200, 0, 1) * Math.max(runCoins, 0)));
    if (shown > coinPop) { KWAudio.play('score_pickup', { semi: shown }); coinPop = shown; }
    for (let i = 0; i < Math.min(shown, 16); i++) blit(art.coin[i % 4], 250 + (i % 6) * 18, viewH * 0.52 + ((i / 6) | 0) * 16, 18, 18);
    const fs = Math.max(L(13), 13);
    text('Du behältst ' + shown + ' Münzen', W / 2, viewH * 0.22, fs, '#10152B', 'center');
    text('Gesamt ' + totalCoins, W / 2, viewH * 0.22 + fs + 6, fs, '#3A1E10', 'center');
    text(Math.floor(depthM()) + ' m', W / 2, viewH * 0.22 + fs * 2 + 12, fs, '#10152B', 'center');
    text(score + ' Pkt', W / 2, viewH * 0.22 + fs * 3 + 18, fs, '#10152B', 'center');
    if (faintT >= C.faintButtonMs) {
      roundRect(act.x - act.d / 2, act.y - act.d / 2, act.d, act.d, '#7E1122', '#FFF8C4');
      text('Nochmal', act.x, act.y - fs / 2, Math.max(10, fs * 0.7), '#FFF8C4', 'center');
      roundRect(W / 2 - L(70), viewH * 0.62, L(140), L(40), '#10152B', '#FFF8C4');
      text('Titel', W / 2, viewH * 0.62 + L(10), fs, '#FFF8C4', 'center');
    }
  }
  function drawPause() {
    ctx.fillStyle = 'rgba(5,7,15,0.72)'; ctx.fillRect(0, 0, W, visH);
    text('Pause', W / 2, visH * 0.28, L(18), '#FFF8C4', 'center');
    roundRect(W / 2 - L(90), visH * 0.42, L(180), L(44), '#10152B', '#FFD84A');
    text('Weiter', W / 2, visH * 0.42 + L(12), L(14), '#FFF8C4', 'center');
    roundRect(W / 2 - L(90), visH * 0.52, L(180), L(44), '#10152B', '#FFD84A');
    text(KWAudio.muted ? 'Ton an' : 'Ton aus', W / 2, visH * 0.52 + L(12), L(12), '#FFF8C4', 'center');
    roundRect(W / 2 - L(90), visH * 0.62, L(180), L(44), '#10152B', '#FFD84A');
    text('Sag ' + sagMode, W / 2, visH * 0.62 + L(12), L(14), '#FFF8C4', 'center');
  }
  function draw() {
    layout();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#05070F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const offX = Math.floor((canvas.width - viewW * dprInt) / 2);
    const offY = Math.floor((canvas.height - viewH * dprInt) / 2);
    ctx.setTransform(dprInt, 0, 0, dprInt, offX - camX * dprInt, offY);
    ctx.imageSmoothingEnabled = false;
    if (state === 'title') drawTitle();
    else if (state === 'faint') { drawWorld(); drawFaint(); }
    else { drawWorld(); drawHud(); drawControls(); if (state === 'pause') drawPause(); }
    if (DEBUG) {
      ctx.strokeStyle = '#4FF0FF'; ctx.strokeRect(px - BW / 2, py, BW, BH);
      text(sagMode, 8, visH - 30, 12, '#4FF0FF');
    }
    if (vfx && vfx.drawScreen) vfx.drawScreen(ctx, W, visH);
  }

  let last = performance.now(), rafLast = last, pumping = false, workTimes = [];
  function pump() {
    if (pumping) return;
    pumping = true;
    const now = performance.now();
    let dt = now - last;
    if (dt < 0) dt = 0;
    if (dt > 0) { last = now; step(Math.min(34, dt)); }
    pumping = false;
  }
  function watchPerf(dt) {
    if (dt > 80) return;
    p90s.push(dt); if (p90s.length > 60) p90s.shift();
    if (dt > 22) slowStreak++; else slowStreak = 0;
    if (dt > 28 && capCool <= 0 && dprCap > 1) {
      dprCap--; stage = 2; particleScale = 0.6; capCool = 350; p90s.length = 0; slowStreak = 0; return;
    }
    if (p90s.length < 30) return;
    const s = p90s.slice().sort((a, b) => a - b);
    const p90 = s[(s.length * 0.9) | 0];
    if ((p90 > 18.5 || slowStreak > 8) && stage === 0) { stage = 1; particleScale = 0.6; }
    else if (stage >= 1 && p90 > 20.5 && capCool <= 0 && dprCap > 2) { dprCap--; stage = 2; capCool = 4000; p90s.length = 0; }
    else if (p90 < 14.5 && capCool <= 0 && dprCap < 4 && stage > 0 && p90s.length >= 60) { dprCap++; capCool = 8000; }
  }
  function frame(now) {
    const t0 = performance.now();
    const wall = now - rafLast;
    rafLast = now;
    const sim = Math.min(34, Math.max(0, now - last));
    last = now;
    if (sim) step(sim);
    if (state === 'play') {
      frameTimes.push(wall);
      if (frameTimes.length > 12000) frameTimes.shift();
    }
    watchPerf(wall);
    draw();
    if (state === 'play') {
      workTimes.push(performance.now() - t0);
      if (workTimes.length > 4000) workTimes.shift();
    }
    requestAnimationFrame(frame);
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
          depth: cssBox(camX + viewW / 2 - 40, (8 + insets().t) / cssPer, 80, 20),
          coins: cssBox(camX + 8 / cssPer, (8 + insets().t) / cssPer, 120 / cssPer, 24 / cssPer),
          pause: cssBox(camX + viewW - 48 / cssPer, (8 + insets().t) / cssPer, 40 / cssPer, 32 / cssPer),
          mute: cssBox(camX + viewW - 96 / cssPer, (8 + insets().t) / cssPer, 40 / cssPer, 32 / cssPer),
          spielen: cssBox(camX + viewW / 2 - 120, viewH * 0.68, 240, 56),
          nochmal: cssBox(act.x - act.d / 2, act.y - act.d / 2, act.d, act.d),
          player: cssBox(px - 40, py + BH / 2 - 70, 80, 96)
        };
      },
      get dpr() {
        return { raw: rawDPR, eff: effDPR, dprInt: dprInt, dprCap: dprCap, backingW: canvas.width, backingH: canvas.height, cssW: cssW, cssH: cssH };
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
      sim: function (ms) {
        const n = Math.ceil(ms / 16.67);
        for (let i = 0; i < n; i++) { if (bot) botTick(); step(16.67); }
        return { state: state, unfair: unfair, depth: depthM(), playMs: playMs };
      }
    };
  }

  async function boot() {
    try { await document.fonts.load("16px 'PS2P'"); } catch (e) {}
    art = KWArt.build();
    kiroImg = new Image();
    kiroImg.src = 'art/kiro-barrel.png';
    try { await kiroImg.decode(); } catch (e) { kiroImg = null; }
    try { vfx = BNVFX.create({ maxParticles: 200 }); } catch (e) { vfx = null; }
    totalCoins = store.get(KEY.coins, 0) || 0;
    bestD = store.get(KEY.bestD, 0) || 0;
    bestS = store.get(KEY.bestS, 0) || 0;
    KWAudio.setRng(rng);
    layout();
    joyAnchor = { x: restX, y: restY };
    publish();
    window.addEventListener('resize', () => { insetAt = 0; layout(); });
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
    requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
  }
  boot();
})();
