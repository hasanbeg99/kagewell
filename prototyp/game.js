/* Barrel Ninja — Steuerungsprototyp
   Eigene Seite (prototyp/). Das Live-Spiel unter / bleibt unberührt.
   Logik 390×844. Hitbox folgt der Eingabe; Seil, Schaukeln und Schal sind optisch.
   VFX: ../vfx/vfx.js (slash, hit, barrelBreak, splinters, shake) und ninja-anim.js (Schal). */
'use strict';

const CONFIG = {
  logicalW: 390,
  logicalH: 844,
  /* Eingabe */
  inputStart: 0.6,
  inputFullMs: 100,
  inputReleaseMs: 80,
  actionBufferMs: 120,
  deadzone: 12,
  hysteresisDeg: 15,
  joyMax: 55,
  joyZoneX: 195,
  joyZoneY: 360,
  /* Seil, px/s */
  speedDown: 520,
  speedUp: 340,
  speedSide: 360,
  /* Welt */
  wall: 30,
  barrelW: 64,
  barrelH: 72,
  barrelTopMin: 150,
  barrelTopMax: 700,
  scroll0: 60,
  scrollAcc: 1.5,
  scrollMax: 150,
  /* Spec nennt Meter, aber keine px/m. 16 entspricht dem Live-Spiel (T.M). */
  pxPerMeter: 16,
  /* Schaukeln, optisch; Hitbox höchstens ±4 px */
  hitboxSwayMax: 4,
  topSwingDeg: 6,
  topSwingPx: 12,
  topSwingPeriod: 900,
  topSwingHalf: 400,
  sideSwingDeg: 4,
  sideSwingPeriod: 1100,
  sideSwingHalf: 300,
  idleSwingDeg: 1.5,
  idleSwingPeriod: 1600,
  /* Schwert */
  swordR: 72,
  swordH: 40,
  swordWindup: 40,
  swordActive: 100,
  swordRecover: 40,
  swordSweepMs: 90,
  swordCd: 260,
  /* Barrel Swing */
  duckMs: 120,
  swingWindup: 70,
  swingMs: 520,
  swingArc: 60,
  swingPad: 10,
  swingCd: 1500,
  swingShake: 4,
  hitStopMs: 40,
  /* Fässer */
  spareStart: 1,
  spareMax: 3,
  breakInvuln: 1200,
  breakSpeed: 1.15,
  equipMs: 400,
  equipInvuln: 1000,
  pickupGapM: 60,
  pickupEveryM: 10,
  pickupChance: 0.25,
  /* Touch */
  actionSize: 68,
  actionHit: 86,
  barrelBtn: 56,
  barrelGap: 24,
  edgePad: 20,
  safeExtra: 16,
  /* Gegner */
  windupMs: 520,
  safeMs: 300,
  /* Seil-Verlet */
  ropeSegs: 12,
  ropeStep: 1000 / 120,
  ropeIter: 3,
  ropeTopSegs: 4,
  /* Absacken beim Hochsteuern. Default B. */
  sagPx: 4,
  sagMs: 60,
  sagMode: 'B',
  /* Punktebasis für den Swing-Zuschlag (+50 % je weiterem Kill) */
  killPoints: 100
};

const W = CONFIG.logicalW;
const H = CONFIG.logicalH;
const TAU = Math.PI * 2;
const BW = CONFIG.barrelW;
const BH = CONFIG.barrelH;
const OUTL = '#120a1e';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { alpha: false });
const vfx = BNVFX.create({ maxParticles: 280, reducedMotion: 'auto' });
const scarf = BNNinjaAnim.createScarf({ segments: 10, length: 28, width: 7, tipWidth: 1.6 });

let PX = 1;
let gameMs = 0;
let depthPx = 0;
let scrollV = CONFIG.scroll0;
let score = 0;
let fps = 60;
let fpsN = 0;
let fpsT = 0;

let px = W / 2;
let py = 380;
let moveK = 0;
let holdMs = 0;
let coastDir = null;
let stickHeld = null;
let stickDir = null;
let axisLock = null;
let lastSide = 1;

let sagMode = CONFIG.sagMode;
let sagPxLeft = 0;
let sagMsLeft = 0;
let visSag = 0;

let topAmp = 0;
let topPhase = 0;
let topHold = 0;
let sideAmp = 0;
let sidePhase = 0;
let sideWas = false;

let barrel = 'intact';
let spares = CONFIG.spareStart;
let invuln = 0;
let equipT = 0;
let duckK = 0;
let duckT = 0;
let wasDuck = false;
let recoil = 0;
let impact = 0;

let slashPhase = null;
let slashT = 0;
let slashCd = 0;
let slashDir = 1;
let slashAge = -1;
let slashSerial = 0;
let slashTrack = null;
let slashGhosts = [];
let bufUntil = -1;

let swingPhase = null;
let swingT = 0;
let swingFromX = 0;
let swingFromY = 0;
let swingToX = 0;
let swingDir = 1;
let swingKills = 0;
let swingCd = 0;
let swingU = 0;
let swingSerial = 0;
let ghosts = [];
let ghostAcc = 0;

let joyId = null;
let joyOrigin = null;
let joyVec = { dx: 0, dy: 0, mag: 0 };
const ptrs = new Map();

let btnAnim = 0;
let showHit = false;
let ui = {};
let lastPickupM = 0;
let pickupStep = -1;
let pickup = null;
let coins = [];
let nextCoinY = 900;
let runCoins = 0;
let totalCoins = 0;
let faintT = -1;
let coinHud = { x: 16, y: 10, w: 16, h: 16 };
const nochmal = { x: (W - 176) / 2, y: H / 2 + 62, w: 176, h: 52 };
let ents = [];
let spawnT = 900;
let birdT = 6500;
let ropeAx = px;

const SEG = CONFIG.ropeSegs;
const rx = new Float64Array(SEG + 1);
const ry = new Float64Array(SEG + 1);
const ox = new Float64Array(SEG + 1);
const oy = new Float64Array(SEG + 1);
const segRest = new Float64Array(SEG);
let ropeAcc = 0;
let botPrefer = 20;

const art = {};

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function easeOut(p) { p = clamp(p, 0, 1); return 1 - Math.pow(1 - p, 3); }
function minX() { return CONFIG.wall + BW / 2; }
function maxX() { return W - CONFIG.wall - BW / 2; }
function gapL(x) { return (x - BW / 2) - CONFIG.wall; }
function gapR(x) { return (W - CONFIG.wall) - (x + BW / 2); }
function atLeft(x) { return gapL(x) <= 12; }
function atRight(x) { return gapR(x) <= 12; }
function atWall(x) { return atLeft(x) || atRight(x); }
function speedMul() { return barrel === 'intact' ? 1 : CONFIG.breakSpeed; }
function landL() { return CONFIG.wall + BW / 2 + 4; }
function landR() { return W - CONFIG.wall - BW / 2 - 4; }

/* ------------------------------------------------------------------ Pixel-Art (gleicher Ninja wie das Live-Spiel) */
const NINJA_MAP = [
  '.........okkggkko.........',
  '.........oKkggkKo.........',
  '..........os..so..........',
  '.........ohs..sSo.........',
  '........oohsooSSoo........',
  '.......ohhsssssSSSo.......',
  '......ohhssssssssSSo......',
  '......ohsssssssssSSo......',
  '......oskkkkkkkkkkSo......',
  '......okkeepkkeepkKo......',
  '......oskkkkkkkkkKSo......',
  '......orrrrrrrrrrrRo.rr...',
  '.....orRRrrrrrrrrRRoorRr..',
  '...ooosssssssssssSSSooRR..',
  '..ooBBBBBBBBBBBBBBBBBBoo..',
  '..obmmmmmmmmmmmmmmmmmmbo..',
  '..odWWwwwdWWwwwdWWwwwddo..',
  '.odWWwwwwdWWwwwdWWwwwwddo.',
  '.odWWwwwwdWWwwwdWWwwwwddo.',
  'odWWWwwwwdWWwwwdWWwwwwdddo',
  'oBBBBBBBBBBBBBBBBBBBbbbbmo',
  'obmmmmmmmmmmmmmmmmmmmmmmDo',
  'odWWWwwwwdWWwwwdWWwwwwdddo',
  'odWWWwwwwdWWwwwdWWwwwwdddo',
  'odWWWwwwwdWWwwwdWWwwwwdddo',
  'odWWWwwwwdWWwwwdWWwwwwdddo',
  'odWWWwwwwdWWwwwdWWwwwwdddo',
  'oBBBBBBBBBBBBBBBBBBBbbbbmo',
  'obmmmmmmmmmmmmmmmmmmmmmmDo',
  'odWWWwwwwdWWwwwdWWwwwwdddo',
  '.odWWwwwwdWWwwwdWWwwwwddo.',
  '.odwwwwwwdwwwwwdwwwwwwDDo.',
  '..oddddddddddddddddddDDo..',
  '...oooooooooooooooooooo...'];
const NINJA_BLINK = NINJA_MAP.map((r, i) => i === 9 ? r.replace(/[ep]/g, 'k') : r);
const NINJA_PAL = {
  o: OUTL, k: '#ffd2a6', K: '#d08a5e', e: '#ffffff', p: '#120a1e', g: '#f2cf86', G: '#a8803e',
  W: '#ffc47a', w: '#dc8c48', d: '#9a5428', D: '#62301a', B: '#eef0ff', b: '#a4aac8', m: '#60648a',
  s: '#4a5cc4', S: '#2c3680', h: '#7c94f4', r: '#ff3a50', R: '#b01c38'
};
const CREEP_MAP = [
  '..........ooo...........',
  '.........oKKKo..........',
  '........oKyyKo..........',
  '.......oKyeyKo..........',
  '........oKyyKo..o.......',
  '...oooooooooooooo.......',
  '..oKyyyyyyyyyyKo........',
  '.oKyyyyyyyyyyyyKo..oo...',
  'oKyyyyyyyyyyyyyKo.oKKo..',
  'oKyyyyyyyyyyyyyKo.oKKo..',
  '.oKyyyyyyyyyyyyKo..oo...',
  '..oooooooooooooo........',
  '....oo......oo..........',
  '...o.o.....o.o..........',
  '..o...o...o...o.........',
  '........................'];
const COIN_MAP = [
  '..oooo..',
  '.oGGGGo.',
  'oGgyygGo',
  'oGyYYyGo',
  'oGyYYyGo',
  'oGgyygGo',
  '.oGGGGo.',
  '..oooo..'];
const COIN_PAL = { o: OUTL, G: '#a85a00', g: '#ffd84a', y: '#ffd84a', Y: '#fff8c0' };
const COIN_KEY = 'kagewell.prototyp.coins';
const FAINT_FADE = 480;
const BIRD_MAP = [
  '....oo......oo....',
  '...oBBo....oBBo...',
  '..oBBBBo..oBBBBo..',
  '.oBBBBBBooBBBBBBo.',
  '..oBBBBBBBBBBBBo..',
  '...ooBBBeBBBBBoo..',
  '.....oBBBBBBo.....',
  '......oBBBBo......',
  '.......oyyo.......',
  '........oo........'];

function mkCan(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function fromMap(rows, pal) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const c = mkCan(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) {
      const col = pal[r[x]];
      if (!col) continue;
      const i = (y * w + x) * 4, n = parseInt(col.slice(1), 16);
      d[i] = (n >> 16) & 255; d[i + 1] = (n >> 8) & 255; d[i + 2] = n & 255; d[i + 3] = 255;
    }
  });
  g.putImageData(img, 0, 0);
  return c;
}
function crop(src, y0, h) {
  const c = mkCan(src.width, h), g = c.getContext('2d');
  g.drawImage(src, 0, y0, src.width, h, 0, 0, src.width, h);
  return c;
}
function pixelBlit(src, dw, dh) {
  const sw = src.width, sh = src.height;
  const sctx = src.getContext('2d'), simg = sctx.getImageData(0, 0, sw, sh), sd = simg.data;
  const c = mkCan(dw, dh), g = c.getContext('2d'), dimg = g.createImageData(dw, dh), dd = dimg.data;
  for (let y = 0; y < dh; y++) {
    const sy = Math.min(sh - 1, (y * sh / dh) | 0);
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(sw - 1, (x * sw / dw) | 0);
      const si = (sy * sw + sx) * 4, di = (y * dw + x) * 4;
      dd[di] = sd[si]; dd[di + 1] = sd[si + 1]; dd[di + 2] = sd[si + 2]; dd[di + 3] = sd[si + 3];
    }
  }
  g.putImageData(dimg, 0, 0);
  return c;
}
function tintWhite(src) {
  const c = mkCan(src.width, src.height), g = c.getContext('2d');
  g.drawImage(src, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    if (d[i] < 30 && d[i + 1] < 20 && d[i + 2] < 40) continue;
    d[i] = 255; d[i + 1] = 255; d[i + 2] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}
function flipX(src) {
  const c = mkCan(src.width, src.height), g = c.getContext('2d');
  g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
  return c;
}
function scaleInt(src, m) { return pixelBlit(src, src.width * m, src.height * m); }
function buildArt() {
  const base = fromMap(NINJA_MAP, NINJA_PAL);
  const blink = fromMap(NINJA_BLINK, NINJA_PAL);
  const headH = 13, barY = 13, barH = base.height - barY;
  art.head = scaleInt(crop(base, 0, headH), 3);
  art.headBlink = scaleInt(crop(blink, 0, headH), 3);
  art.headHit = tintWhite(art.head);
  art.barrel = scaleInt(crop(base, barY, barH), 3);
  art.barrelHit = tintWhite(art.barrel);
  art.rim = scaleInt(crop(base, barY, 4), 3);
  const creepPal = { o: OUTL, K: '#7a2412', y: '#ff7a2c', e: '#fff6c0' };
  const birdPal = { o: OUTL, B: '#6a8ae0', e: '#ff3050', y: '#ffb020' };
  const creep = fromMap(CREEP_MAP, creepPal);
  const bird = fromMap(BIRD_MAP, birdPal);
  art.creep = [pixelBlit(creep, creep.width * 2, creep.height * 2)];
  art.creep.push(flipX(art.creep[0]));
  art.bird = [pixelBlit(bird, bird.width * 2, bird.height * 2)];
  art.bird.push(flipX(art.bird[0]));
  art.coin = scaleInt(fromMap(COIN_MAP, COIN_PAL), 2);
  art.back = buildBack();
  art.wall = buildWall();
}
function buildBack() {
  const w = 64, h = 64, c = mkCan(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  const mortar = [20, 16, 40], brick = [48, 42, 84], hi = [74, 66, 120];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const row = (y / 10) | 0, off = (row & 1) ? 16 : 0;
    const bx = (x + off) % 28, edge = bx < 2 || (y % 10) < 2;
    const col = edge ? mortar : ((x + y) % 17 === 0 ? hi : brick);
    const i = (y * w + x) * 4;
    d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}
function buildWall() {
  const w = CONFIG.wall, h = 80, c = mkCan(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  const mortar = [28, 24, 52], brick = [62, 54, 110], hi = [96, 86, 156], lo = [36, 30, 68];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const row = (y / 16) | 0, off = (row & 1) ? 10 : 0;
    const bx = (x + off) % w;
    const edge = (y % 16) === 0 || (y % 16) === 15;
    let col = edge ? mortar : brick;
    if (!edge && x === w - 1) col = hi;
    if (!edge && x === 0) col = lo;
    if (!edge && ((x * 3 + y * 5) % 29) === 0) col = [46, 120, 78];
    const i = (y * w + x) * 4;
    d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

/* ------------------------------------------------------------------ Layout / Eingabe */
function insets() {
  const h = id => document.getElementById(id).getBoundingClientRect().height;
  const w = id => document.getElementById(id).getBoundingClientRect().width;
  return { t: h('sat'), b: h('sab'), l: w('sal'), r: w('sar') };
}
function layoutUI() {
  const s = insets();
  // Buttons are drawn in logical px, then the canvas is CSS-scaled. Meet the minima in CSS px.
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H) || 1;
  const minL = (cssPx) => cssPx / scale;
  const a = Math.max(CONFIG.actionSize, minL(64));
  const b = Math.max(CONFIG.barrelBtn, minL(56));
  const gap = Math.max(CONFIG.barrelGap, minL(24));
  const edge = Math.max(CONFIG.edgePad, minL(20));
  const padL = edge + s.l / scale;
  const padR = edge + s.r / scale;
  const padB = edge + s.b / scale;
  const padT = Math.max(8, s.t + 6);
  const hitSize = Math.max(CONFIG.actionHit, a + (CONFIG.actionHit - CONFIG.actionSize));
  const extra = (hitSize - a) / 2;
  ui.action = { x: padL, y: H - padB - a, w: a, h: a, hit: extra };
  ui.barrel = {
    x: ui.action.x + a + gap,
    y: ui.action.y + (a - b) / 2,
    w: b, h: b
  };
  ui.padT = padT;
  ui.padR = padR;
  const debugL = Math.max(CONFIG.edgePad, s.l + CONFIG.safeExtra);
  ui.modeBtn = { x: debugL, y: padT, w: 36, h: 18 };
  ui.hbBtn = { x: debugL + 40, y: padT, w: 36, h: 18 };
}
function logical(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
}
function inRect(p, r) { return p.x >= r.x && p.y >= r.y && p.x <= r.x + r.w && p.y <= r.y + r.h; }
function inAction(p) {
  const a = ui.action, m = a.hit;
  return p.x >= a.x - m && p.y >= a.y - m && p.x <= a.x + a.w + m && p.y <= a.y + a.h + m;
}
function inBarrelBtn(p) {
  const b = ui.barrel;
  return btnAnim > 0.4 && p.x >= b.x - 6 && p.y >= b.y - 6 && p.x <= b.x + b.w + 6 && p.y <= b.y + b.h + 6;
}
function barrelBtnWanted() { return barrel === 'broken' && spares > 0; }

function readJoy() {
  if (joyId == null || !ptrs.has(joyId)) { joyVec = { dx: 0, dy: 0, mag: 0 }; return joyVec; }
  const pr = ptrs.get(joyId);
  let dx = pr.x - joyOrigin.x, dy = pr.y - joyOrigin.y;
  const m = Math.hypot(dx, dy);
  if (m > CONFIG.joyMax) { dx = dx / m * CONFIG.joyMax; dy = dy / m * CONFIG.joyMax; }
  joyVec = { dx, dy, mag: Math.min(m, CONFIG.joyMax) };
  return joyVec;
}
function steer() {
  const v = readJoy();
  if (v.mag < CONFIG.deadzone) { axisLock = null; stickDir = null; return null; }
  const ax = Math.abs(v.dx), ay = Math.abs(v.dy);
  const tan60 = Math.tan((45 + CONFIG.hysteresisDeg) * Math.PI / 180);
  const tan30 = Math.tan((45 - CONFIG.hysteresisDeg) * Math.PI / 180);
  // First lock uses the same ±15° band: exact 45°/225° (|dx|===|dy|) does not pick an axis.
  if (!axisLock) {
    if (ay > ax * tan60) axisLock = 'v';
    else if (ay < ax * tan30) axisLock = 'h';
    else { stickDir = null; return null; }
  } else if (axisLock === 'h' && ay > ax * tan60) axisLock = 'v';
  else if (axisLock === 'v' && ay < ax * tan30) axisLock = 'h';
  stickDir = axisLock === 'h' ? (v.dx < 0 ? 'left' : 'right') : (v.dy < 0 ? 'up' : 'down');
  if (stickDir === 'left') lastSide = -1;
  else if (stickDir === 'right') lastSide = 1;
  return stickDir;
}
function nearestSide() {
  let best = null, bd = 1e9;
  const cy = py + BH / 2;
  for (const e of ents) {
    if (!e.alive) continue;
    const p = eScreen(e);
    const d = Math.hypot(p.x - px, p.y - cy);
    if (d < bd && Math.abs(p.x - px) > 8) { bd = d; best = p.x < px ? -1 : 1; }
  }
  return best;
}
function chooseSlashDir() {
  if (stickDir === 'left') return -1;
  if (stickDir === 'right') return 1;
  if (!stickDir) return nearestSide() || lastSide || 1;
  return lastSide || 1;
}

function onDown(e) {
  e.preventDefault();
  const p = logical(e);
  if (faintT >= 0) {
    if (faintT >= FAINT_FADE && inRect(p, nochmal)) startRun();
    return;
  }
  const half = p.x < W / 2 ? 'L' : 'R';
  let role = 'none';
  if (half === 'L' && inRect(p, ui.modeBtn)) role = 'mode';
  else if (half === 'L' && inRect(p, ui.hbBtn)) role = 'hb';
  else if (half === 'L' && inBarrelBtn(p)) role = 'barrel';
  else if (half === 'L' && inAction(p)) role = 'action';
  else if (half === 'R' && p.x >= CONFIG.joyZoneX && p.y >= CONFIG.joyZoneY && joyId == null) role = 'joy';
  ptrs.set(e.pointerId, { role, half, x: p.x, y: p.y });
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* bereits weg */ }
  if (role === 'joy') { joyId = e.pointerId; joyOrigin = { x: p.x, y: p.y }; steer(); }
  else if (role === 'action') { steer(); bufUntil = gameMs + CONFIG.actionBufferMs; tryAction(); }
  else if (role === 'barrel') tryEquip();
  else if (role === 'mode') { sagMode = sagMode === 'B' ? 'A' : 'B'; }
  else if (role === 'hb') showHit = !showHit;
}
function onMove(e) {
  const pr = ptrs.get(e.pointerId);
  if (!pr) return;
  e.preventDefault();
  const p = logical(e);
  pr.x = p.x; pr.y = p.y;
  if (pr.role === 'joy') steer();
}
function onUp(e) {
  const pr = ptrs.get(e.pointerId);
  if (pr && pr.role === 'joy') { joyId = null; joyOrigin = null; joyVec = { dx: 0, dy: 0, mag: 0 }; stickDir = null; axisLock = null; }
  ptrs.delete(e.pointerId);
}

/* ------------------------------------------------------------------ Gegner (Mauerkriecher + Krähe, wie im Live-Spiel) */
function reachDist(ms, speed) {
  const ramp = Math.min(ms, CONFIG.inputFullMs);
  const rest = Math.max(0, ms - ramp);
  const rampPx = speed * (0.6 * ramp + 0.002 * ramp * ramp) / 1000;
  return rampPx + speed * rest / 1000;
}
const SAFE = {
  side: reachDist(CONFIG.safeMs, CONFIG.speedSide),
  up: reachDist(CONFIG.safeMs, CONFIG.speedUp),
  down: reachDist(CONFIG.safeMs, CONFIG.speedDown)
};
function barrelRect(x, y, pad) {
  pad = pad || 0;
  return { x: x - BW / 2 - pad, y: y - pad, w: BW + pad * 2, h: BH + pad * 2 };
}
function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function eScreen(e) {
  if (e.kind === 'creep') {
    const y = e.worldY - depthPx;
    const inner = e.side < 0 ? CONFIG.wall : W - CONFIG.wall;
    const inset = 22 + (e.ext || 0);
    return { x: e.side < 0 ? inner + inset : inner - inset, y };
  }
  return { x: e.x, y: e.worldY - depthPx };
}
function creepBox(e) {
  const p = eScreen(e);
  return { x: p.x - 20, y: p.y - 16, w: 40, h: 32 };
}
function activeHazards() {
  const boxes = [];
  for (const e of ents) {
    if (!e.alive) continue;
    if (e.kind === 'creep' && (e.state === 'lunge' || e.state === 'hold')) boxes.push(creepBox(e));
    if (e.kind === 'bird' && e.state === 'dive') {
      const p = eScreen(e);
      boxes.push({ x: p.x - 16, y: p.y - 14, w: 32, h: 28 });
    }
  }
  return boxes;
}
function spotSafe(x, y, boxes) {
  x = clamp(x, minX(), maxX());
  y = clamp(y, CONFIG.barrelTopMin, CONFIG.barrelTopMax);
  const b = barrelRect(x, y, 0);
  return !boxes.some(h => overlap(b, h));
}
function hasSafeDir(boxes) {
  return spotSafe(px - SAFE.side, py, boxes) || spotSafe(px + SAFE.side, py, boxes)
    || spotSafe(px, py - SAFE.up, boxes) || spotSafe(px, py + SAFE.down, boxes);
}
function creepBoxAt(e, ext) {
  const y = e.worldY - depthPx;
  const inner = e.side < 0 ? CONFIG.wall : W - CONFIG.wall;
  const inset = 22 + ext;
  const x = e.side < 0 ? inner + inset : inner - inset;
  return { x: x - 20, y: y - 16, w: 40, h: 32 };
}
function fairReach(e) {
  let reach = e.reachMax;
  const boxes = activeHazards();
  while (reach >= 40) {
    if (hasSafeDir(boxes.concat([creepBoxAt(e, reach)]))) return reach;
    reach -= 20;
  }
  return 0;
}

function spawnCreep(side, screenY) {
  ents.push({
    kind: 'creep', side, worldY: depthPx + screenY, ext: 0, state: 'windup', t: 0, seen: 0,
    reachMax: 150, reach: 150, alive: true, flash: 0, swingId: -1, vx: 0, vy: 0, rot: 0
  });
}
function spawnBird(screenX, screenY, aimMs, state) {
  ents.push({
    kind: 'bird', side: screenX < px ? -1 : 1, x: screenX, worldY: depthPx + screenY,
    state: state || 'enter', t: 0, aimMs: aimMs || CONFIG.windupMs, alive: true, flash: 0, swingId: -1,
    vx: 0, vy: 0, rot: 0, flap: 0
  });
}
function spawnPickup() {
  pickup = {
    x: CONFIG.wall + 50 + Math.random() * (W - CONFIG.wall * 2 - 100),
    worldY: depthPx + H + 30,
    t: 0
  };
}
function killEnemy(e, dir, fromSwing) {
  if (!e.alive) return;
  e.alive = false;
  e.flash = 90;
  e.vx = (dir || 1) * 140;
  e.vy = -80;
  e.rot = 0;
  const p = eScreen(e);
  vfx.hit(p.x, p.y, {
    type: e.kind === 'creep' ? 'krabbler' : 'fledermaus',
    dir: dir || 0,
    hitStop: CONFIG.hitStopMs,
    shake: false
  });
  if (fromSwing) {
    const pts = Math.round(CONFIG.killPoints * Math.pow(1.5, swingKills));
    swingKills++;
    score += pts;
  } else score += CONFIG.killPoints;
}
function hurt() {
  if (invuln > 0 || swingPhase || barrel === 'equipping') return;
  if (barrel === 'intact') {
    barrel = 'broken';
    invuln = CONFIG.breakInvuln;
    vfx.barrelBreak(px, py + BH / 2, { hitStop: CONFIG.hitStopMs, shake: CONFIG.swingShake });
  } else faint();
}
function loadTotal() {
  try { const n = parseInt(localStorage.getItem(COIN_KEY), 10); return n > 0 ? n : 0; } catch (e) { return 0; }
}
function saveTotal() {
  try { localStorage.setItem(COIN_KEY, String(totalCoins)); } catch (e) {}
}
function faint() {
  if (faintT >= 0) return;
  faintT = 0;
  totalCoins += runCoins;
  saveTotal();
  vfx.hit(px, py + 20, { type: 'fass', hitStop: CONFIG.hitStopMs, shake: 3 });
}
function spawnCoin(screenX, screenY) {
  coins.push({ x: screenX, worldY: depthPx + screenY, t: 0, got: false });
}
function seedCoins() {
  coins = [];
  spawnCoin(310, 420);
  spawnCoin(150, 620);
  spawnCoin(230, 760);
  nextCoinY = depthPx + 900;
}
function updateCoins(dtMs) {
  const horizon = depthPx + H + 50;
  while (nextCoinY < horizon) {
    const span = W - CONFIG.wall * 2 - 36;
    coins.push({ x: CONFIG.wall + 18 + ((nextCoinY * 13) % span), worldY: nextCoinY, t: 0, got: false });
    nextCoinY += 160;
  }
  const body = barrelRect(px, py, 0);
  for (const c of coins) {
    c.t += dtMs;
    if (c.got) continue;
    const sy = c.worldY - depthPx;
    const box = { x: c.x - 8, y: sy - 8, w: 16, h: 16 };
    if (sy < -24) c.got = true;
    else if (overlap(body, box)) { c.got = true; runCoins++; }
  }
  if (coins.length > 24) coins = coins.filter(c => !c.got && c.worldY - depthPx < H + 80);
}

function updateEnts(dtMs) {
  const dt = dtMs / 1000;
  for (const e of ents) {
    e.flash = Math.max(0, e.flash - dtMs);
    const sy = e.worldY - depthPx;
    if (!e.alive) {
      e.vy += 700 * dt;
      e.x = (e.x || 0) + e.vx * dt;
      e.worldY += e.vy * dt + scrollV * dt;
      e.rot += dt * 6;
      e.t = (e.t || 0) + dtMs;
      continue;
    }
    if (e.kind === 'creep') {
      const visible = sy > 30 && sy < H - 40;
      if (visible) e.seen += dtMs;
      if (e.state === 'windup') {
        e.t += visible ? dtMs : 0;
        if (e.seen >= CONFIG.windupMs && e.t >= CONFIG.windupMs) {
          const r = fairReach(e);
          if (r >= 40) { e.reach = r; e.state = 'lunge'; e.t = 0; }
          else { e.state = 'idle'; e.t = 0; }
        }
      } else if (e.state === 'lunge') {
        e.t += dtMs;
        e.ext = e.reach * easeOut(e.t / 240);
        if (e.t >= 240) { e.state = 'hold'; e.t = 0; e.ext = e.reach; }
      } else if (e.state === 'hold') {
        e.t += dtMs;
        if (e.t >= 180) { e.state = 'back'; e.t = 0; }
      } else if (e.state === 'back') {
        e.t += dtMs;
        e.ext = e.reach * (1 - easeOut(Math.min(1, e.t / 280)));
        if (e.t >= 280) { e.state = 'idle'; e.t = 0; e.ext = 0; }
      } else {
        e.t += dtMs;
        if (e.t >= 420 && visible) { e.state = 'windup'; e.t = 0; }
      }
      if ((e.state === 'lunge' || e.state === 'hold') && overlap(barrelRect(px, py, 0), creepBox(e))) hurt();
    } else {
      e.flap += dtMs * 0.02;
      e.worldY += scrollV * dt;
      if (e.state === 'enter') {
        const perch = 320;
        const sy2 = e.worldY - depthPx;
        if (sy2 > perch + 6) e.worldY -= 170 * dt;
        else { e.state = 'aim'; e.t = 0; }
      } else if (e.state === 'aim') {
        e.t += dtMs;
        if (e.t >= e.aimMs && e.aimMs >= CONFIG.windupMs) {
          const boxes = activeHazards();
          const tx = px, ty = py + BH / 2;
          const fake = { x: tx - 16, y: ty - 14, w: 32, h: 28 };
          if (hasSafeDir(boxes.concat([fake]))) {
            e.state = 'dive'; e.t = 0;
            const p = eScreen(e);
            const a = Math.atan2(ty - p.y, tx - p.x);
            e.vx = Math.cos(a) * 240; e.vy = Math.sin(a) * 240;
          } else e.t = e.aimMs - 80;
        }
      } else if (e.state === 'dive') {
        e.x += e.vx * dt;
        e.worldY += e.vy * dt;
        e.t += dtMs;
        const p = eScreen(e);
        const box = { x: p.x - 14, y: p.y - 12, w: 28, h: 24 };
        if (overlap(barrelRect(px, py, 0), box)) hurt();
        if (e.x < -40 || e.x > W + 40 || p.y < -40 || p.y > H + 40 || e.t > 1600) e.alive = false;
      }
    }
  }
  ents = ents.filter(e => {
    if (!e.alive && e.t > 700) return false;
    const sy = e.worldY - depthPx;
    if (e.kind === 'creep' && (sy < -120 || sy > H + 160)) return false;
    return true;
  });
  spawnT -= dtMs;
  if (spawnT <= 0) {
    spawnT = 1500;
    const aliveC = ents.filter(e => e.alive && e.kind === 'creep').length;
    if (aliveC < 3) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const y = H + 20 + Math.random() * 40;
      const tooClose = ents.some(e => e.alive && Math.abs((e.worldY - depthPx) - y) < 160);
      if (!tooClose) spawnCreep(side, y);
    }
  }
  birdT -= dtMs;
  if (birdT <= 0) {
    birdT = 3800;
    const aliveB = ents.filter(e => e.alive && e.kind === 'bird').length;
    if (aliveB < 2) spawnBird(CONFIG.wall + 80 + Math.random() * (W - 200), H + 30, CONFIG.windupMs, 'enter');
  }
}

/* ------------------------------------------------------------------ Kampf */
function canSwing() { return barrel === 'intact' && atWall(px) && !swingPhase; }
function tryAction() {
  if (gameMs > bufUntil) return;
  if (swingPhase) return;
  if (canSwing() && swingCd <= 0) {
    startSwing();
    bufUntil = -1;
    return;
  }
  if (slashCd > 0 || slashPhase) return;
  startSlash();
  bufUntil = -1;
}
function tryEquip() {
  if (barrel !== 'broken' || spares <= 0) return;
  spares--;
  barrel = 'equipping';
  equipT = 0;
}
function startSlash() {
  slashPhase = 'windup';
  slashT = 0;
  slashAge = 0;
  slashSerial++;
  slashCd = CONFIG.swordCd;
  slashDir = chooseSlashDir();
  lastSide = slashDir;
  slashGhosts = [];
  slashTrack = null;
  recoil = -slashDir * 3 * Math.PI / 180;
  scarf.impulse(slashDir * 240, -70);
}
function beginSlashFx() {
  const v = visuals();
  slashTrack = { x: v.hitX, y: v.hitY + BH / 2 };
  const s = vfx.slash(slashTrack.x, slashTrack.y, slashDir, {
    radius: CONFIG.swordR, ms: CONFIG.swordSweepMs, width: 11, color: 'trail', track: slashTrack
  });
  if (slashDir > 0) { s.a0 = -Math.PI / 2; s.sweep = Math.PI / 2; }
  else { s.a0 = -Math.PI / 2; s.sweep = -Math.PI / 2; }
}
function slashAngle(u) {
  const k = clamp(u, 0, 1);
  const e = 1 - Math.pow(1 - k, 3);
  return -Math.PI / 2 + slashDir * (Math.PI / 2) * e;
}
function swordHits() {
  const u = Math.min(1, slashT / CONFIG.swordSweepMs);
  const ang = slashAngle(u);
  const v = visuals();
  const cx = v.hitX, cy = v.hitY + BH / 2;
  for (const e of ents) {
    if (!e.alive || e.slashId === slashSerial) continue;
    const p = eScreen(e);
    const dx = p.x - cx, dy = p.y - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > CONFIG.swordR || dist < 1e-4) continue;
    let a = Math.atan2(dy, dx);
    if (slashDir < 0 && a > 0) a -= TAU;
    const up = -Math.PI / 2;
    const lo = Math.min(up, ang), hi = Math.max(up, ang);
    const eps = 0.02;
    if (a < lo - eps || a > hi + eps) continue;
    e.slashId = slashSerial;
    killEnemy(e, slashDir, false);
    vfx.emit(p.x, p.y, 5, {
      kind: 'spark', color: 'trail', speed: [180, 360], life: [100, 180], size: [1.1, 1.8], size2: [8, 14],
      g: 0, drag: 6, blend: 'add', angle: slashDir > 0 ? 0 : Math.PI, spread: 1.2
    });
  }
}
function startSwing() {
  swingSerial++;
  swingPhase = 'windup';
  swingT = 0;
  swingU = 0;
  swingFromX = px;
  swingFromY = py;
  swingDir = atLeft(px) ? 1 : -1;
  swingToX = swingDir > 0 ? landR() : landL();
  swingKills = 0;
  ghosts = [];
  ghostAcc = 0;
  scarf.impulse(swingDir * 300, -40);
}
function swingHits() {
  const box = barrelRect(px, py, CONFIG.swingPad);
  for (const e of ents) {
    if (!e.alive || e.swingId === swingSerial) continue;
    let eb;
    if (e.kind === 'creep') eb = creepBox(e);
    else { const p = eScreen(e); eb = { x: p.x - 16, y: p.y - 14, w: 32, h: 28 }; }
    if (!overlap(box, eb)) continue;
    e.swingId = swingSerial;
    killEnemy(e, swingDir, true);
  }
}
function landSwing() {
  px = swingToX;
  py = swingFromY;
  swingPhase = null;
  swingU = 1;
  swingCd = CONFIG.swingCd;
  impact = 1;
  duckT = CONFIG.duckMs;
  duckK = 1;
  const dir = swingDir;
  vfx.barrelHit(px, py + BH / 2, dir);
  vfx.shake(CONFIG.swingShake);
  vfx.emit(px, py + BH, 8, {
    kind: 'dust', colors: ['edge', 'stone'], speed: [20, 90], life: [280, 520], size: [4, 9], g: 40, alpha: 0.45, spread: 2.2
  });
  vfx.emit(px - dir * 10, py + 20, 6, {
    kind: 'chunk', colors: ['stone', 'edge', 'joint'], speed: [40, 140], life: [400, 700], size: [1.6, 3.2],
    g: 700, angle: dir > 0 ? 0 : Math.PI, spread: 1.4
  });
}

/* ------------------------------------------------------------------ Simulation */
function visuals() {
  const topPx = Math.sin(topPhase) * (topAmp / CONFIG.topSwingDeg) * CONFIG.topSwingPx;
  const sidePx = Math.sin(sidePhase) * (sideAmp / CONFIG.topSwingDeg) * CONFIG.topSwingPx;
  const idlePx = Math.sin(gameMs / CONFIG.idleSwingPeriod * TAU) * (CONFIG.idleSwingDeg / CONFIG.topSwingDeg) * CONFIG.topSwingPx;
  const movingSide = (coastDir === 'left' || coastDir === 'right') && moveK > 0.05 && !swingPhase;
  const moveSway = movingSide ? Math.sin(gameMs / 240) * 1.2 : 0;
  const sway = (swingPhase ? 0 : topPx + sidePx + idlePx);
  const hitX = px + (swingPhase ? 0 : clamp(sway, -CONFIG.hitboxSwayMax, CONFIG.hitboxSwayMax));
  let vx = px + sway + moveSway;
  let vy = py;
  if (!swingPhase && sagMode === 'B') vy += visSag;
  vx = clamp(vx, minX() - 8, maxX() + 8);
  return { x: vx, y: vy, hitX, hitY: py, sway };
}
function startUpSag() {
  if (sagMode === 'A') { sagPxLeft = CONFIG.sagPx; sagMsLeft = CONFIG.sagMs; }
  else visSag = CONFIG.sagPx;
}
function updateMotion(dtMs) {
  const dir = steer();
  if (dir) {
    const fresh = dir !== stickHeld;
    if (fresh) {
      holdMs = 0;
      moveK = CONFIG.inputStart;
      if (dir === 'up' && !swingPhase) startUpSag();
    } else {
      holdMs += dtMs;
      const t = clamp(holdMs / CONFIG.inputFullMs, 0, 1);
      moveK = CONFIG.inputStart + (1 - CONFIG.inputStart) * t;
    }
    stickHeld = dir;
    coastDir = dir;
  } else {
    stickHeld = null;
    if (moveK > 0) {
      moveK = Math.max(0, moveK - dtMs / CONFIG.inputReleaseMs);
      if (moveK <= 0) coastDir = null;
    }
  }
  const sideNow = stickDir === 'left' || stickDir === 'right';
  if (sideWas && !sideNow) sideAmp = CONFIG.sideSwingDeg;
  sideWas = sideNow;

  if (swingPhase) return;

  const d = dir || (moveK > 0 ? coastDir : null);
  const mul = speedMul();
  let vx = 0, vy = 0;
  if (d === 'left') vx = -CONFIG.speedSide * moveK * mul;
  else if (d === 'right') vx = CONFIG.speedSide * moveK * mul;
  else if (d === 'down') vy = CONFIG.speedDown * moveK * mul;
  else if (d === 'up') vy = -CONFIG.speedUp * moveK * mul;

  if (sagMode === 'A' && d === 'up' && sagPxLeft > 0 && sagMsLeft > 0) {
    const drop = Math.min(sagPxLeft, CONFIG.sagPx * (dtMs / CONFIG.sagMs));
    py += drop;
    sagPxLeft -= drop;
    sagMsLeft -= dtMs;
    if (sagMsLeft <= 0) sagPxLeft = 0;
    vy = 0;
  } else if (d !== 'up') { sagPxLeft = 0; sagMsLeft = 0; }

  px += vx * dtMs / 1000;
  py += vy * dtMs / 1000;
  px = clamp(px, minX(), maxX());
  const atTop = py <= CONFIG.barrelTopMin;
  if (py < CONFIG.barrelTopMin) py = CONFIG.barrelTopMin;
  if (py > CONFIG.barrelTopMax) py = CONFIG.barrelTopMax;
  if (atTop && d === 'up') {
    topHold += dtMs;
    const charged = CONFIG.topSwingDeg * Math.min(1, topHold / 200);
    topAmp = Math.max(topAmp * Math.pow(0.5, dtMs / CONFIG.topSwingHalf), charged);
  } else {
    topHold = 0;
    topAmp *= Math.pow(0.5, dtMs / CONFIG.topSwingHalf);
  }
}
function updateSwing(dtMs) {
  if (swingPhase === 'windup') {
    swingT += dtMs;
    const k = clamp(swingT / CONFIG.swingWindup, 0, 1);
    const pull = swingDir > 0 ? -8 : 8;
    px = clamp(swingFromX + pull * easeOut(k), minX(), maxX());
    py = swingFromY;
    if (swingT >= CONFIG.swingWindup) {
      swingPhase = 'fly';
      swingT = 0;
      swingFromX = px;
    }
  } else if (swingPhase === 'fly') {
    swingT += dtMs;
    swingU = clamp(swingT / CONFIG.swingMs, 0, 1);
    px = lerp(swingFromX, swingToX, swingU);
    py = swingFromY - Math.sin(swingU * Math.PI) * CONFIG.swingArc;
    swingHits();
    ghostAcc += dtMs;
    if (ghostAcc >= 36) {
      ghostAcc = 0;
      ghosts.push({ x: px, y: py, rot: swingDir * swingU * TAU });
      if (ghosts.length > 3) ghosts.shift();
    }
    if (swingT >= CONFIG.swingMs) landSwing();
  }
}
function updateSlash(dtMs) {
  if (slashAge >= 0) slashAge += dtMs;
  if (slashPhase === 'windup') {
    slashT += dtMs;
    if (slashT >= CONFIG.swordWindup) { slashPhase = 'active'; slashT = 0; beginSlashFx(); }
  } else if (slashPhase === 'active') {
    slashT += dtMs;
    const v = visuals();
    if (slashTrack) { slashTrack.x = v.hitX; slashTrack.y = v.hitY + BH / 2; }
    swordHits();
    if (slashGhosts.length < 4 && ((slashT / 16) | 0) !== ((((slashT - dtMs) / 16) | 0))) {
      slashGhosts.push(slashAngle(Math.min(1, slashT / CONFIG.swordSweepMs)));
    }
    if (slashT >= CONFIG.swordActive) { slashPhase = 'recover'; slashT = 0; }
  } else if (slashPhase === 'recover') {
    slashT += dtMs;
    if (slashT >= CONFIG.swordRecover) slashPhase = null;
  }
  slashCd = Math.max(0, slashCd - dtMs);
  if (Math.abs(recoil) > 0) {
    const step = (3 * Math.PI / 180) * dtMs / 180;
    if (Math.abs(recoil) <= step) recoil = 0;
    else recoil -= Math.sign(recoil) * step;
  }
}
function updateDuck(dtMs) {
  const want = barrel === 'intact' && (atWall(px) || !!swingPhase);
  if (want) duckT = Math.min(CONFIG.duckMs, duckT + dtMs);
  else duckT = Math.max(0, duckT - dtMs);
  duckK = easeOut(duckT / CONFIG.duckMs);
  if (want && !wasDuck) {
    const side = atLeft(px) ? -1 : 1;
    const x = side < 0 ? CONFIG.wall : W - CONFIG.wall;
    vfx.emit(x, py + BH - 6, 8, {
      kind: 'dust', colors: ['stone', 'edge'], speed: [15, 70], life: [250, 480], size: [3, 7],
      g: 30, alpha: 0.4, angle: side < 0 ? 0 : Math.PI, spread: 1.3
    });
    vfx.emit(x, py + 16, 5, {
      kind: 'chunk', colors: ['stone', 'joint', 'edge'], speed: [30, 110], life: [350, 640], size: [1.4, 2.8],
      g: 640, angle: side < 0 ? -0.4 : Math.PI + 0.4, spread: 1.1
    });
    scarf.impulse(side * -80, 40);
  }
  wasDuck = want;
}
function updateRope(dtMs, vis) {
  const ax = ropeAx, ay = 6;
  const bx = vis.x, by = vis.y + 16;
  if (!swingPhase) ropeAx += (px - ropeAx) * Math.min(1, dtMs / 140);
  const dist = Math.max(48, Math.hypot(bx - ax, by - ay));
  const topN = CONFIG.ropeTopSegs, botN = SEG - topN;
  const even = dist / SEG;
  botPrefer += (even - botPrefer) * 0.04;
  let bot = botPrefer, top = (dist - bot * botN) / topN;
  if (top < 5) { top = 5; bot = (dist - top * topN) / botN; }
  if (bot < 5) { const e = dist / SEG; for (let i = 0; i < SEG; i++) segRest[i] = e; }
  else { for (let i = 0; i < SEG; i++) segRest[i] = i < topN ? top : bot; }

  ropeAcc += dtMs;
  let n = 0;
  const step = CONFIG.ropeStep;
  while (ropeAcc >= step && n < 6) {
    ropeAcc -= step;
    n++;
    ropeSub(step / 1000, ax, ay, bx, by);
  }
  if (n >= 6) ropeAcc = 0;
  if (swingPhase === 'fly') {
    const amp = Math.sin(swingU * Math.PI) * 26;
    for (let i = 1; i < SEG; i++) {
      const k = i / SEG;
      rx[i] += Math.sin(k * Math.PI) * Math.sin(swingU * Math.PI * 3) * amp;
    }
  }
}
function ropeSub(h, ax, ay, bx, by) {
  const damp = 0.985;
  for (let i = 1; i < SEG; i++) {
    const vx = (rx[i] - ox[i]) * damp, vy = (ry[i] - oy[i]) * damp;
    ox[i] = rx[i]; oy[i] = ry[i];
    rx[i] += vx; ry[i] += vy + 30 * h * h;
  }
  for (let it = 0; it < CONFIG.ropeIter; it++) {
    rx[0] = ax; ry[0] = ay; rx[SEG] = bx; ry[SEG] = by;
    for (let i = 0; i < SEG; i++) {
      const rest = segRest[i];
      const dx = rx[i + 1] - rx[i], dy = ry[i + 1] - ry[i];
      const d = Math.hypot(dx, dy) || 0.0001;
      const diff = (d - rest) / d;
      const invA = i === 0 ? 0 : 0.5, invB = i + 1 === SEG ? 0 : 0.5;
      const share = invA + invB || 1;
      rx[i] += dx * diff * (invA / share); ry[i] += dy * diff * (invA / share);
      rx[i + 1] -= dx * diff * (invB / share); ry[i + 1] -= dy * diff * (invB / share);
    }
    rx[0] = ax; ry[0] = ay; rx[SEG] = bx; ry[SEG] = by;
  }
}
function initRope() {
  for (let i = 0; i <= SEG; i++) {
    rx[i] = ox[i] = px;
    ry[i] = oy[i] = 6 + (py + 16 - 6) * i / SEG;
  }
}

function updatePick(dtMs) {
  const m = depthPx / CONFIG.pxPerMeter;
  if (!pickup && spares < CONFIG.spareMax && m >= lastPickupM + CONFIG.pickupGapM) {
    const step = Math.floor((m - (lastPickupM + CONFIG.pickupGapM)) / CONFIG.pickupEveryM);
    if (step > pickupStep) {
      pickupStep = step;
      if (Math.random() < CONFIG.pickupChance) spawnPickup();
    }
  }
  if (!pickup) return;
  pickup.t += dtMs;
  const sy = pickup.worldY - depthPx;
  if (sy < -40) { pickup = null; return; }
  const box = { x: pickup.x - 16, y: sy - 18, w: 32, h: 36 };
  if (spares < CONFIG.spareMax && overlap(barrelRect(px, py, 0), box)) {
    spares++;
    lastPickupM = m;
    pickupStep = -1;
    pickup = null;
    vfx.emit(px, py, 6, { kind: 'spark', color: 'lanternCore', speed: [40, 120], life: [180, 320], size: [1, 2], size2: [6, 10], g: -20, blend: 'add' });
  }
}

function startRun() {
  px = W / 2;
  py = 380;
  moveK = 0; holdMs = 0; coastDir = null; stickHeld = null; stickDir = null; axisLock = null;
  sagPxLeft = 0; sagMsLeft = 0; visSag = 0;
  topAmp = 0; topHold = 0; sideAmp = 0; sideWas = false;
  barrel = 'intact';
  spares = CONFIG.spareStart;
  invuln = 0; equipT = 0; duckK = 0; duckT = 0; wasDuck = false;
  recoil = 0; impact = 0;
  slashPhase = null; slashT = 0; slashCd = 0; slashAge = -1; slashTrack = null; slashGhosts = [];
  bufUntil = -1;
  swingPhase = null; swingT = 0; swingU = 0; swingCd = 0; swingKills = 0; ghosts = []; ghostAcc = 0;
  depthPx = 0; scrollV = CONFIG.scroll0;
  score = 0;
  runCoins = 0;
  faintT = -1;
  pickup = null; pickupStep = -1; lastPickupM = 0;
  btnAnim = 0;
  ropeAx = px;
  ents = [];
  vfx.clear();
  scarf.reset();
  initRope();
  spawnBird(255, py + BH / 2 - 16, 8000, 'aim');
  spawnBird(135, py + BH / 2 - 16, 8000, 'aim');
  spawnCreep(-1, 1020);
  spawnCreep(1, 1120);
  seedCoins();
}
function step(dtMs) {
  dtMs = Math.min(dtMs, 1000 / 30);
  if (dtMs <= 0) return;
  if (faintT >= 0) {
    vfx.update(dtMs);
    faintT += dtMs;
    return;
  }
  const world = vfx.update(dtMs);
  if (world <= 0) return;
  const dt = world;
  gameMs += dt;
  scrollV = Math.min(CONFIG.scrollMax, scrollV + CONFIG.scrollAcc * dt / 1000);
  depthPx += scrollV * dt / 1000;
  updateMotion(dt);
  updateSwing(dt);
  updateSlash(dt);
  updateDuck(dt);
  if (sagMode === 'B') visSag = Math.max(0, visSag - CONFIG.sagPx * (dt / CONFIG.sagMs));
  else visSag = 0;
  topPhase += dt / CONFIG.topSwingPeriod * TAU;
  sideAmp *= Math.pow(0.5, dt / CONFIG.sideSwingHalf);
  sidePhase += dt / CONFIG.sideSwingPeriod * TAU;
  swingCd = Math.max(0, swingCd - dt);
  invuln = Math.max(0, invuln - dt);
  impact = Math.max(0, impact - dt / 90);
  if (barrel === 'equipping') {
    equipT += dt;
    if (equipT >= CONFIG.equipMs) { barrel = 'intact'; invuln = Math.max(invuln, CONFIG.equipInvuln); }
  }
  const wantBtn = barrelBtnWanted();
  btnAnim = clamp(btnAnim + (wantBtn ? 1 : -1) * dt / 140, 0, 1);
  updateEnts(dt);
  updatePick(dt);
  updateCoins(dt);
  tryAction();
  const vis = visuals();
  updateRope(dt, vis);
}

/* ------------------------------------------------------------------ Zeichnen */
function resize() {
  const dpr = Math.max(1, Math.min(3, Math.round(window.devicePixelRatio || 1)));
  PX = dpr;
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = (W * scale) + 'px';
  canvas.style.height = (H * scale) + 'px';
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  vfx.setPixelRatio(dpr);
  layoutUI();
}
function drawTiled(img, x, y, w, h, scroll) {
  const ih = img.height, iw = img.width;
  const off = ((scroll % ih) + ih) % ih;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  for (let yy = y - off; yy < y + h; yy += ih) {
    for (let xx = x; xx < x + w; xx += iw) ctx.drawImage(img, xx, yy);
  }
  ctx.restore();
}
function ropePts() {
  const pts = [];
  const P = i => ({ x: rx[clamp(i, 0, SEG)], y: ry[clamp(i, 0, SEG)] });
  for (let i = 0; i < SEG; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let s = 0; s < 4; s++) {
      const t = s / 4, t2 = t * t, t3 = t2 * t;
      pts.push({
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
      });
    }
  }
  pts.push(P(SEG));
  return pts;
}
function drawRope() {
  const pts = ropePts();
  ctx.save();
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'bevel';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.strokeStyle = '#8C6E3F';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = '#C9A66B';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = '#5A3518';
  ctx.lineWidth = 1;
  let acc = 0;
  ctx.beginPath();
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y;
    const len = Math.hypot(dx, dy) || 0.0001;
    let travelled = 0;
    while (acc + (len - travelled) >= 6) {
      const need = 6 - acc;
      travelled += need;
      acc = 0;
      const t = travelled / len;
      const x = pts[i - 1].x + dx * t, y = pts[i - 1].y + dy * t;
      const nx = -dy / len, ny = dx / len;
      ctx.moveTo(x - nx * 2.5, y - ny * 2.5);
      ctx.lineTo(x + nx * 2.2, y + ny * 2.2);
    }
    acc += len - travelled;
  }
  ctx.stroke();
  ctx.restore();
}
function drawPlayer(vis) {
  const tucked = duckK;
  const spin = swingPhase === 'fly' ? swingDir * swingU * TAU
    : swingPhase === 'windup' ? -swingDir * 0.4 * clamp(swingT / CONFIG.swingWindup, 0, 1)
    : 0;
  const wallTilt = (atLeft(px) ? 1 : atRight(px) ? -1 : 0) * (3 * Math.PI / 180) * tucked * (swingPhase ? 0 : 1);
  const blink = barrel !== 'broken' && ((gameMs / 2600) | 0) % 7 === 3 && (gameMs % 2600) < 140;
  const flash = invuln > 0 && ((gameMs / 70) | 0) % 2 === 0;
  const head = flash ? art.headHit : blink ? art.headBlink : art.head;
  const bar = flash ? art.barrelHit : art.barrel;
  const cx = vis.x, cy = vis.y + BH / 2;
  const sy = (1 - 0.1 * tucked) * (1 - 0.18 * impact);
  const sx = (1 + 0.12 * impact);

  if (swingPhase === 'fly') {
    for (let i = 0; i < ghosts.length; i++) {
      const g = ghosts[i];
      ctx.save();
      ctx.globalAlpha = 0.16 + i * 0.08;
      ctx.translate(g.x, g.y + BH / 2);
      ctx.rotate(g.rot);
      ctx.drawImage(art.barrel, -art.barrel.width / 2, -art.barrel.height / 2);
      ctx.restore();
    }
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(wallTilt + spin + (swingPhase ? 0 : recoil));
  ctx.scale(sx, sy);
  ctx.translate(-cx, -cy);
  if (barrel === 'broken') {
    ctx.drawImage(head, cx - head.width / 2, vis.y + 6);
  } else {
    const equip = barrel === 'equipping' ? easeOut(equipT / CONFIG.equipMs) : 1;
    const sink = (swingPhase ? 0 : (1 - equip) * 18 + tucked * 22);
    const headY = vis.y - head.height + 8 + sink;
    const drawBar = () => {
      ctx.save();
      ctx.translate(cx, vis.y + bar.height / 2);
      ctx.scale(1, Math.max(0.05, equip));
      ctx.translate(-cx, -(vis.y + bar.height / 2));
      ctx.drawImage(bar, cx - bar.width / 2, vis.y);
      ctx.restore();
    };
    // Am Mauer-Duck liegt der Fassrand über dem Ninja. Im Schwung bleibt das Gesicht lesbar.
    if (tucked > 0.35 && !swingPhase) {
      ctx.drawImage(head, cx - head.width / 2, headY);
      drawBar();
    } else {
      drawBar();
      ctx.drawImage(head, cx - head.width / 2, headY);
    }
  }
  ctx.restore();

  const neckX = cx + 14;
  const neckY = vis.y + (barrel === 'broken' ? 14 : 2) + tucked * 4;
  scarf.drawWorld(ctx, neckX, neckY, {
    time: gameMs,
    boost: 0.55 + tucked * 1.5 + (barrel === 'broken' ? 0.4 : 0),
    length: barrel === 'broken' ? 34 : 26,
    fall: scrollV
  });
}
function drawSword(vis) {
  if (slashAge < 0 || slashAge > CONFIG.swordWindup + CONFIG.swordActive + CONFIG.swordRecover + 80) return;
  const cx = slashTrack ? slashTrack.x : vis.hitX;
  const cy = slashTrack ? slashTrack.y : vis.hitY + BH / 2;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const drawWedge = (a0, a1, alpha) => {
    if (alpha <= 0) return;
    const inner = 16, outer = CONFIG.swordR;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a0) * inner, cy + Math.sin(a0) * inner);
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const a = lerp(a0, a1, i / steps);
      ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    }
    ctx.lineTo(cx + Math.cos(a1) * inner, cy + Math.sin(a1) * inner);
    ctx.closePath();
    ctx.fillStyle = '#4FF0FF';
    ctx.fill();
  };
  if (slashPhase === 'windup') {
    const f = slashT < 20 ? 0 : 1;
    const a = -Math.PI / 2 - slashDir * (0.35 - f * 0.15);
    drawWedge(a - slashDir * 0.25, a, 0.45);
  } else {
    const u = slashPhase === 'active' ? Math.min(1, slashT / CONFIG.swordSweepMs) : 1;
    const lead = slashAngle(u);
    const tail = slashAngle(Math.max(0, u - 0.22));
    for (let i = 0; i < slashGhosts.length; i++) {
      const a = slashGhosts[i];
      drawWedge(a - slashDir * 0.18, a, 0.16 + i * 0.06);
    }
    drawWedge(tail, lead, slashPhase === 'recover' ? 0.35 : 0.9);
  }
  ctx.restore();
}
function drawEnt(e) {
  const p = eScreen(e);
  ctx.save();
  if (!e.alive) {
    ctx.globalAlpha = clamp(1 - (e.t || 0) / 650, 0, 1);
    ctx.translate(p.x, p.y);
    ctx.rotate(e.rot || 0);
    ctx.translate(-p.x, -p.y);
  }
  if (e.kind === 'creep') {
    const spr = art.creep[e.side < 0 ? 0 : 1];
    const wind = e.state === 'windup' ? Math.sin(e.t * 0.05) * 1.5 : 0;
    ctx.drawImage(spr, p.x - spr.width / 2 + wind, p.y - spr.height / 2);
  } else {
    const spr = art.bird[p.x < px ? 0 : 1];
    const bob = e.state === 'aim' ? Math.sin(e.flap) * 2 : 0;
    ctx.drawImage(spr, p.x - spr.width / 2, p.y - spr.height / 2 + bob);
  }
  ctx.restore();
}
function drawCoins() {
  if (!art.coin) return;
  for (const c of coins) {
    if (c.got) continue;
    const sy = c.worldY - depthPx + Math.sin(c.t * 0.006) * 2;
    if (sy < -20 || sy > H + 20) continue;
    ctx.drawImage(art.coin, Math.round(c.x - art.coin.width / 2), Math.round(sy - art.coin.height / 2));
  }
}
function drawHud() {
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H) || 1;
  const top = Math.max(8, insets().t / scale + 6);
  const y = top + 16 > 148 ? 8 : top;
  const x = W - Math.max(CONFIG.edgePad, 20 / scale) - 70;
  coinHud = { x, y, w: 70, h: 16 };
  if (!art.coin) return;
  ctx.drawImage(art.coin, x, y);
  ctx.save();
  ctx.font = "8px 'PS2P', monospace";
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd84a';
  ctx.fillText(String(runCoins), x + 20, y + 4);
  ctx.restore();
}
function drawFaint() {
  if (faintT < 0) return;
  const k = clamp(faintT / FAINT_FADE, 0, 1);
  ctx.save();
  ctx.fillStyle = 'rgba(5,7,15,' + (0.78 * easeOut(k)) + ')';
  ctx.fillRect(0, 0, W, H);
  if (k < 1) { ctx.restore(); return; }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f0d8a0';
  ctx.font = "10px 'PS2P', monospace";
  ctx.fillText('Kiro ist ohnmächtig', W / 2, H / 2 - 48);
  ctx.font = "8px 'PS2P', monospace";
  ctx.fillStyle = '#fff0b0';
  ctx.fillText('Du behältst ' + runCoins + ' Münzen', W / 2, H / 2 - 8);
  ctx.fillStyle = '#ffd84a';
  ctx.fillText('Gesamt ' + totalCoins + ' Münzen', W / 2, H / 2 + 22);
  pixelRect(nochmal.x, nochmal.y, nochmal.w, nochmal.h, '#a01a28', '#f0d8a0');
  ctx.fillStyle = '#fff0b0';
  ctx.font = "8px 'PS2P', monospace";
  ctx.fillText('Nochmal', nochmal.x + nochmal.w / 2, nochmal.y + nochmal.h / 2 + 1);
  ctx.restore();
}
function drawPickup() {
  if (!pickup) return;
  const sy = pickup.worldY - depthPx + Math.sin(pickup.t * 0.008) * 2;
  ctx.drawImage(art.barrel, pickup.x - 16, sy - 18, 32, 36);
  ctx.drawImage(art.rim, pickup.x - 16, sy - 18, 32, 8);
}
function pixelRect(x, y, w, h, fill, stroke) {
  ctx.fillStyle = fill;
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect((x | 0) + 1, (y | 0) + 1, (w | 0) - 2, (h | 0) - 2);
  }
}
function drawUI(vis) {
  const ducked = barrel === 'intact' && (atWall(px) || !!swingPhase);
  const a = ui.action;
  pixelRect(a.x, a.y, a.w, a.h, ducked ? '#5A3518' : '#1a1638', ducked ? '#ffd040' : '#f0d8a0');
  ctx.save();
  ctx.translate(a.x + a.w / 2, a.y + a.h / 2);
  if (ducked) {
    ctx.fillStyle = '#dc8c48';
    ctx.fillRect(-12, -14, 24, 28);
    ctx.fillStyle = '#eef0ff';
    ctx.fillRect(-12, -14, 24, 4);
    ctx.fillRect(-12, -2, 24, 3);
    ctx.fillRect(-12, 10, 24, 4);
    ctx.fillStyle = OUTL;
    ctx.fillRect(-12, -14, 24, 1);
  } else {
    ctx.strokeStyle = '#4FF0FF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-4, 8);
    ctx.lineTo(10, -10);
    ctx.stroke();
    ctx.fillStyle = '#eef0ff';
    ctx.fillRect(8, -16, 8, 8);
  }
  ctx.restore();
  if (swingCd > 0) {
    const k = 1 - swingCd / CONFIG.swingCd;
    ctx.save();
    ctx.strokeStyle = '#30e0f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2 + 5, -Math.PI / 2, -Math.PI / 2 + TAU * k);
    ctx.stroke();
    ctx.restore();
  }
  if (btnAnim > 0.02) {
    const b = ui.barrel;
    const s = 0.4 + 0.6 * easeOut(btnAnim);
    ctx.save();
    ctx.globalAlpha = clamp(btnAnim, 0, 1);
    ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
    ctx.scale(s, s);
    pixelRect(-b.w / 2, -b.h / 2, b.w, b.h, '#3a2418', '#ffd040');
    ctx.fillStyle = '#dc8c48';
    ctx.fillRect(-12, -14, 24, 28);
    ctx.fillStyle = '#eef0ff';
    ctx.fillRect(-12, -14, 24, 3);
    ctx.fillRect(-12, 8, 24, 3);
    ctx.restore();
  }
  if (joyId != null && joyOrigin) {
    const v = joyVec;
    pixelRect(joyOrigin.x - 28, joyOrigin.y - 28, 56, 56, 'rgba(12,10,28,0.55)', '#f0d8a0');
    const kx = joyOrigin.x + v.dx, ky = joyOrigin.y + v.dy;
    pixelRect(kx - 14, ky - 14, 28, 28, '#e83040', '#fff0b0');
  }
  ctx.save();
  ctx.font = "8px 'PS2P', monospace";
  ctx.textBaseline = 'top';
  ctx.fillStyle = showHit ? '#30e0f0' : '#8ab8f0';
  ctx.fillText(sagMode, ui.modeBtn.x + 12, ui.modeBtn.y + 5);
  ctx.fillStyle = '#8ab8f0';
  ctx.fillText(showHit ? 'HB+' : 'HB', ui.hbBtn.x + 4, ui.hbBtn.y + 5);
  ctx.restore();
  void vis;
}
function drawHitboxes(vis) {
  ctx.save();
  ctx.strokeStyle = '#30e0f0';
  ctx.lineWidth = 1;
  const r = barrelRect(vis.hitX, vis.hitY, swingPhase === 'fly' ? CONFIG.swingPad : 0);
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  if (slashPhase === 'active' || slashPhase === 'recover') {
    ctx.beginPath();
    ctx.arc(vis.hitX, vis.hitY + BH / 2, CONFIG.swordR, slashDir > 0 ? -Math.PI / 2 : -Math.PI, slashDir > 0 ? 0 : -Math.PI / 2);
    ctx.stroke();
  }
  ctx.strokeStyle = '#ff3050';
  for (const e of ents) {
    if (!e.alive) continue;
    const b = e.kind === 'creep' ? creepBox(e) : (() => { const p = eScreen(e); return { x: p.x - 16, y: p.y - 14, w: 32, h: 28 }; })();
    ctx.strokeRect(b.x, b.y, b.w, b.h);
  }
  ctx.restore();
}
function draw(realDt) {
  const vis = visuals();
  ctx.setTransform(PX, 0, 0, PX, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#0c0a1c';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  vfx.applyShake(ctx);
  drawTiled(art.back, CONFIG.wall, 0, W - CONFIG.wall * 2, H, depthPx * 0.5);
  drawRope();
  for (const e of ents) drawEnt(e);
  drawCoins();
  drawPickup();
  drawTiled(art.wall, 0, 0, CONFIG.wall, H, depthPx);
  ctx.save();
  ctx.translate(W, 0); ctx.scale(-1, 1);
  drawTiled(art.wall, 0, 0, CONFIG.wall, H, depthPx);
  ctx.restore();
  drawPlayer(vis);
  drawSword(vis);
  vfx.draw(ctx);
  ctx.restore();
  vfx.drawScreen(ctx, W, H);
  ctx.imageSmoothingEnabled = false;
  drawUI(vis);
  drawHud();
  if (showHit) drawHitboxes(vis);
  drawFaint();
  fpsN++;
  fpsT += realDt;
  if (fpsT >= 500) { fps = fpsN / (fpsT / 1000); fpsN = 0; fpsT = 0; }
}

/* ------------------------------------------------------------------ Schleife */
let last = performance.now();
function frame(now) {
  const dt = now - last;
  last = now;
  step(Math.min(34, dt));
  draw(dt);
  requestAnimationFrame(frame);
}
function boot() {
  buildArt();
  totalCoins = loadTotal();
  resize();
  startRun();
  window.addEventListener('resize', resize);
  canvas.addEventListener('pointerdown', onDown, { passive: false });
  canvas.addEventListener('pointermove', onMove, { passive: false });
  canvas.addEventListener('pointerup', onUp, { passive: false });
  canvas.addEventListener('pointercancel', onUp, { passive: false });
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
  document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  document.addEventListener('gesturestart', e => e.preventDefault());
  window.addEventListener('wheel', e => e.preventDefault(), { passive: false });
  requestAnimationFrame(t => { last = t; fpsT = 0; requestAnimationFrame(frame); });
}

window.__BN = {
  get x() { return px; },
  get y() { return py; },
  get ducked() { return barrel === 'intact' && atWall(px) && duckK > 0.85; },
  get duckK() { return duckK; },
  get swinging() { return swingPhase === 'fly'; },
  get swingPhase() { return swingPhase; },
  get swingU() { return swingU; },
  get slashPhase() { return slashPhase; },
  get slashDir() { return slashDir; },
  get slashAge() { return slashAge; },
  get barrel() { return barrel; },
  get spares() { return spares; },
  get barrelBtn() { return barrelBtnWanted() && btnAnim > 0.85; },
  get btnAnim() { return btnAnim; },
  get sagMode() { return sagMode; },
  get showHit() { return showHit; },
  get fps() { return fps; },
  get score() { return score; },
  get stick() { return stickDir; },
  get enemies() {
    return ents.filter(e => e.alive).map(e => {
      const p = eScreen(e);
      return { kind: e.kind, x: p.x, y: p.y, state: e.state, side: e.side };
    });
  },
  get action() {
    const a = ui.action;
    return { x: a.x + a.w / 2, y: a.y + a.h / 2, hit: CONFIG.actionHit / 2 };
  },
  get barrelButton() {
    const b = ui.barrel;
    return { x: b.x + b.w / 2, y: b.y + b.h / 2, r: b.w / 2, visible: barrelBtnWanted() };
  },
  get modeBtn() { return ui.modeBtn; },
  get hbBtn() { return ui.hbBtn; },
  get runCoins() { return runCoins; },
  get totalCoins() { return totalCoins; },
  get faint() { return faintT >= FAINT_FADE; },
  get coins() {
    return coins.filter(c => !c.got).map(c => ({ x: c.x, y: c.worldY - depthPx }));
  },
  get hud() { return coinHud; },
  get nochmal() { return nochmal; },
  CONFIG
};

boot();
