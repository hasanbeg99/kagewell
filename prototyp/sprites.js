/* Kagewell prototyp — Kreativ pixel art (1 AP). No smoothing, no per-frame gradients. */
(function (root) {
  'use strict';
  const PAL = {
    out: '#120A1E', abyss: '#05070F', fog: '#0B1426', deep: '#122640',
    stone0: '#0E1724', stone1: '#273A50', stone2: '#6485A6', stone3: '#8FB0CC',
    moss0: '#142E25', moss1: '#367554', moss2: '#8FD188',
    wood0: '#3A1E10', wood1: '#8A5A2E', wood2: '#E0A868',
    steel0: '#2A2E38', steel1: '#7B8494', steel2: '#EEF4FF',
    rope0: '#6E522B', rope1: '#C9A66B', rope2: '#EAD19B',
    coin0: '#8C4B00', coin1: '#FFD84A', coin2: '#FFF8C4',
    suit0: '#10152B', suit1: '#2A3B73', suit2: '#7392D9',
    scarf0: '#7E1122', scarf1: '#E2283C', scarf2: '#FF6673',
    skin0: '#8C5A3C', skin1: '#E0A868', skin2: '#FFE2C4',
    tara0: '#231233', tara1: '#59307A', tara2: '#7E4AA6',
    sash0: '#1D6B5E', sash1: '#359E84', sash2: '#F0B43A',
    crawl0: '#6E2416', crawl1: '#EB752D', crawl2: '#FF5A2A',
    bat0: '#2A1E47', bat1: '#B9C3D6', bat2: '#FFC23A',
    cut0: '#4E7A3A', cut1: '#C7CED6',
    slash: '#4FF0FF', lantern: '#FFB347', lantern2: '#FFE2A8',
    joy: '#E2283C', joy2: '#FF7A85',
    sky0: '#122640', sky1: '#2A3B73', sky2: '#7E4AA6', sky3: '#E0A868'
  };
  function hex(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
  }
  function Pix(w, h) {
    this.w = w; this.h = h;
    this.d = new Uint8ClampedArray(w * h * 4);
  }
  Pix.prototype.set = function (x, y, col) {
    x = x | 0; y = y | 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !col) return;
    const c = typeof col === 'string' ? hex(col) : col;
    const i = (y * this.w + x) * 4;
    this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = c[3];
  };
  Pix.prototype.rect = function (x, y, w, h, col) {
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) this.set(x + xx, y + yy, col);
  };
  Pix.prototype.ellipse = function (cx, cy, rx, ry, col) {
    rx = Math.max(1, rx); ry = Math.max(1, ry);
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) this.set(cx + x, cy + y, col);
    }
  };
  Pix.prototype.outline = function () {
    const w = this.w, h = this.h, src = this.d, o = hex(PAL.out);
    const mark = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (src[i + 3]) continue;
      const n = (x > 0 && src[i - 4 + 3]) || (x < w - 1 && src[i + 4 + 3]) || (y > 0 && src[i - w * 4 + 3]) || (y < h - 1 && src[i + w * 4 + 3]);
      if (n) mark.push(i);
    }
    for (const i of mark) { src[i] = o[0]; src[i + 1] = o[1]; src[i + 2] = o[2]; src[i + 3] = 255; }
  };
  Pix.prototype.canvas = function () {
    const c = document.createElement('canvas');
    c.width = this.w; c.height = this.h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.putImageData(new ImageData(this.d, this.w, this.h), 0, 0);
    return c;
  };
  function done(p, ol) { if (ol !== false) p.outline(); return p.canvas(); }
  function flip(c) {
    const o = document.createElement('canvas');
    o.width = c.width; o.height = c.height;
    const g = o.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0);
    return o;
  }
  function both(c) { return [c, flip(c)]; }

  function kiroHeadFallback() {
    const p = new Pix(52, 72);
    p.ellipse(26, 16, 12, 11, PAL.suit1);
    p.rect(16, 8, 20, 6, PAL.suit0);
    p.rect(18, 10, 16, 3, PAL.steel2);
    p.set(22, 16, PAL.out); p.set(30, 16, PAL.out);
    p.rect(14, 22, 24, 8, PAL.scarf1);
    p.rect(8, 24, 10, 4, PAL.scarf2);
    p.rect(20, 30, 14, 28, PAL.suit1);
    p.rect(18, 32, 6, 20, PAL.suit2);
    return done(p);
  }
  function tara(lean) {
    const p = new Pix(56, 84);
    p.ellipse(26, 16, 11, 12, PAL.skin1);
    p.rect(16, 4, 22, 10, PAL.tara0);
    p.rect(34, 6, 8, 28, PAL.tara0);
    p.rect(38, 30, 6, 10, PAL.tara0);
    p.set(22, 16, PAL.out); p.set(30, 16, PAL.out);
    p.rect(21, 18, 6, 2, PAL.scarf1);
    p.rect(14, 26, 26, 32, PAL.tara1);
    p.rect(16, 28, 8, 22, PAL.tara2);
    p.rect(16, 42, 22, 6, PAL.sash1);
    p.rect(16, 46, 22, 3, PAL.sash2);
    p.rect(16, 58, 8, 20, PAL.tara0);
    p.rect(30, 58, 8, 20, PAL.tara0);
    if (lean) { p.rect(4, 32, 14, 6, PAL.tara1); p.rect(2, 36, 8, 5, PAL.skin1); }
    return done(p);
  }
  function creep(pose) {
    const p = new Pix(76, 52);
    const back = pose === 'wind' ? 6 : 0;
    p.ellipse(18 + back, 28, 10, 8, PAL.crawl0);
    p.ellipse(36 + back * 0.4, 26, 14, 10, PAL.crawl1);
    p.ellipse(54 - (pose === 'lunge' ? 4 : 0), 24, 12, 9, PAL.crawl1);
    p.ellipse(40, 32, 10, 5, PAL.wood2);
    for (let i = 0; i < 5; i++) p.rect(16 + i * 8, 12 - (pose === 'wind' ? 3 : 0), 3, 8, PAL.crawl0);
    p.rect(58, 20, 8, 6, pose === 'wind' ? PAL.crawl2 : PAL.crawl0);
    p.set(62, 22, PAL.lantern2); p.set(66, 22, PAL.lantern2);
    if (pose === 'wind') p.rect(64, 24, 8, 3, PAL.out);
    return done(p);
  }
  function bat(pose) {
    const p = new Pix(68, 56);
    const up = pose === 0 ? -6 : pose === 1 ? 0 : 6;
    p.ellipse(34, 30, 10, 8, PAL.bat0);
    p.ellipse(16, 28 + up, 14, 6, PAL.bat1);
    p.ellipse(52, 28 - up, 14, 6, PAL.bat1);
    p.ellipse(34, 22, 6, 5, PAL.bat0);
    p.set(31, 21, PAL.bat2); p.set(36, 21, PAL.bat2);
    p.rect(30, 26, 8, 2, PAL.steel2);
    return done(p);
  }
  function cutter() {
    const p = new Pix(56, 68);
    p.ellipse(28, 16, 10, 9, PAL.cut0);
    p.set(24, 15, PAL.lantern2); p.set(32, 15, PAL.lantern2);
    p.rect(20, 24, 16, 28, PAL.cut0);
    p.rect(22, 28, 6, 18, PAL.moss1);
    p.rect(8, 30, 14, 4, PAL.cut1);
    p.rect(34, 30, 16, 4, PAL.cut1);
    p.rect(6, 28, 4, 8, PAL.steel2);
    p.rect(46, 28, 4, 8, PAL.steel2);
    return done(p);
  }
  function rock() {
    const p = new Pix(64, 44);
    p.rect(0, 8, 40, 28, PAL.stone1);
    p.rect(0, 8, 40, 4, PAL.stone2);
    p.rect(28, 14, 18, 6, PAL.steel1);
    p.rect(32, 22, 20, 6, PAL.steel2);
    p.rect(30, 30, 16, 5, PAL.steel1);
    p.rect(4, 30, 20, 6, PAL.moss1);
    return done(p);
  }
  function vine() {
    const p = new Pix(48, 40);
    p.ellipse(16, 20, 12, 14, PAL.moss1);
    p.ellipse(18, 18, 6, 7, PAL.scarf1);
    p.rect(24, 16, 18, 6, PAL.moss0);
    p.rect(30, 10, 4, 8, PAL.moss2);
    p.set(16, 16, PAL.coin2);
    return done(p);
  }
  function coinFrame(ph) {
    const p = new Pix(32, 32);
    const rx = [14, 10, 5, 10][ph];
    p.ellipse(16, 16, Math.max(3, rx), 14, PAL.coin0);
    if (rx > 4) p.ellipse(16, 16, Math.max(2, rx - 3), 11, PAL.coin1);
    if (rx > 8) { p.rect(15, 8, 2, 16, PAL.coin2); p.set(12, 10, PAL.coin2); }
    return done(p);
  }
  function joyParts() {
    const ring = new Pix(64, 64);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const dx = x - 31.5, dy = y - 31.5, r = Math.hypot(dx, dy);
      if (r <= 31 && r >= 22) ring.set(x, y, r > 28 ? PAL.steel2 : PAL.steel0);
      else if (r < 22 && r > 18) ring.set(x, y, PAL.stone1);
    }
    const knob = new Pix(32, 32);
    knob.ellipse(16, 16, 13, 13, PAL.joy);
    knob.ellipse(12, 12, 5, 4, PAL.joy2);
    return { ring: ring.canvas(), knob: knob.canvas() };
  }
  function digits() {
    const g = '111101101101111 010010010010010 111001111100111 111001111001111 101101111001001 111100111001111 111100111101111 111001001001001 111101111101111 111101111001111'.split(' ');
    // 3x5 glyphs drawn larger below
    const map = {
      '0': ['111', '101', '101', '101', '111'],
      '1': ['010', '110', '010', '010', '111'],
      '2': ['111', '001', '111', '100', '111'],
      '3': ['111', '001', '111', '001', '111'],
      '4': ['101', '101', '111', '001', '001'],
      '5': ['111', '100', '111', '001', '111'],
      '6': ['111', '100', '111', '101', '111'],
      '7': ['111', '001', '010', '010', '010'],
      '8': ['111', '101', '111', '101', '111'],
      '9': ['111', '101', '111', '001', '111'],
      'm': ['10101', '11111', '10101', '10101', '10101'],
      'x': ['101', '010', '101', '101', '101']
    };
    const out = {};
    for (const ch in map) {
      const rows = map[ch];
      const p = new Pix(rows[0].length * 3 + 2, 17);
      rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) if (row[x] === '1') p.rect(1 + x * 3, 1 + y * 3, 3, 3, PAL.coin2);
      });
      out[ch] = p.canvas();
    }
    void g;
    return out;
  }
  function tile(biome) {
    const p = new Pix(128, 128);
    const sets = {
      moon: [PAL.stone0, PAL.stone1, PAL.stone2, PAL.fog],
      moss: [PAL.moss0, PAL.stone1, PAL.moss1, PAL.moss2],
      ember: ['#2A1418', '#5A3030', '#A06048', PAL.lantern],
      crystal: ['#14182E', '#303868', '#88A0E0', PAL.slash]
    };
    const s = sets[biome] || sets.moon;
    p.rect(0, 0, 128, 128, s[0]);
    for (let row = 0; row < 8; row++) {
      let x = (row & 1) ? 18 : 0;
      while (x < 128) {
        const bw = 22 + ((row * 5 + x) % 14);
        p.rect(x + 1, row * 16 + 1, Math.min(bw - 2, 127 - x), 14, s[2]);
        p.rect(x + 1, row * 16 + 1, Math.min(bw - 2, 127 - x), 3, s[3]);
        if ((x + row) % 5 === 0) p.rect(x + 4, row * 16 + 8, 6, 2, s[3]);
        x += bw;
      }
    }
    return p.canvas();
  }
  function sideTile() {
    const p = new Pix(30, 128);
    p.rect(0, 0, 30, 128, PAL.stone0);
    for (let row = 0; row < 4; row++) {
      p.rect(2, row * 32 + 2, 26, 28, PAL.stone1);
      p.rect(2, row * 32 + 2, 26, 3, PAL.stone2);
      p.rect(24, row * 32 + 2, 4, 28, PAL.stone3);
      if (row % 2 === 0) p.rect(6, row * 32 + 18, 10, 4, PAL.moss1);
    }
    return p.canvas();
  }
  function titleBg() {
    const p = new Pix(390, 844);
    for (let y = 0; y < 844; y++) {
      const col = y < 180 ? PAL.sky0 : y < 300 ? PAL.sky1 : y < 420 ? '#3A4878' : y < 520 ? PAL.sky2 : PAL.moss0;
      p.rect(0, y, 390, 1, col);
    }
    // stars
    for (let i = 0; i < 80; i++) p.set((i * 47) % 390, (i * 29) % 200, i % 4 ? PAL.coin2 : PAL.slash);
    // mountains
    for (let i = 0; i < 6; i++) {
      const cx = 40 + i * 70, base = 460, h = 80 + (i % 3) * 30;
      for (let y = 0; y < h; y++) {
        const half = ((h - y) / h) * (50 + (i % 2) * 16);
        p.rect(cx - half, base - y, half * 2, 1, i % 2 ? '#2A3B5A' : '#1A2844');
      }
    }
    // ground
    p.rect(0, 560, 390, 284, PAL.moss0);
    p.rect(0, 560, 390, 8, PAL.moss1);
    for (let i = 0; i < 40; i++) p.rect((i * 37) % 380, 600 + (i * 17) % 200, 3, 8, PAL.moss2);
    // house
    p.rect(36, 470, 110, 90, PAL.wood0);
    p.rect(28, 450, 126, 24, PAL.wood1);
    p.rect(70, 510, 28, 50, PAL.abyss);
    p.rect(48, 500, 22, 18, PAL.lantern);
    // well
    p.ellipse(210, 560, 54, 22, PAL.stone1);
    p.ellipse(210, 556, 40, 14, PAL.abyss);
    p.rect(168, 500, 10, 60, PAL.wood1);
    p.rect(242, 500, 10, 60, PAL.wood1);
    p.rect(160, 492, 100, 10, PAL.wood2);
    return p.canvas();
  }
  function meadowBg() {
    const p = new Pix(390, 844);
    for (let y = 0; y < 420; y++) p.rect(0, y, 390, 1, y < 200 ? '#8FB0CC' : '#C9A6D0');
    for (let y = 420; y < 844; y++) p.rect(0, y, 390, 1, PAL.moss1);
    p.rect(0, 430, 390, 10, PAL.moss2);
    for (let i = 0; i < 30; i++) {
      p.rect(20 + (i * 41) % 350, 500 + (i * 23) % 250, 4, 10, PAL.coin2);
      p.set(22 + (i * 41) % 350, 498 + (i * 23) % 250, PAL.scarf2);
    }
    p.ellipse(300, 620, 70, 18, PAL.moss2);
    return p.canvas();
  }
  function portalRing(phase) {
    const p = new Pix(96, 96);
    for (let a = 0; a < 90; a++) {
      const t = (a / 18 + phase) * Math.PI;
      const r = 8 + a * 0.38;
      const x = 48 + Math.cos(t) * r, y = 50 + Math.sin(t) * (r * 0.42);
      const col = a % 3 === 0 ? PAL.slash : a % 3 === 1 ? '#8B42F5' : PAL.coin1;
      p.rect(x - 1, y - 1, 3, 3, col);
    }
    p.rect(44, 46, 8, 6, '#FFFFFF');
    return p.canvas();
  }
  function build() {
    const joy = joyParts();
    const creeps = ['idle', 'wind', 'lunge'].map(creep);
    const bats = [0, 1, 2].map(bat);
    return {
      PAL: PAL,
      title: titleBg(),
      meadow: meadowBg(),
      tiles: { moon: tile('moon'), moss: tile('moss'), ember: tile('ember'), crystal: tile('crystal') },
      side: sideTile(),
      tara: tara(false),
      taraLean: tara(true),
      kiroHead: kiroHeadFallback(),
      creep: creeps.map(both),
      bat: bats.map(both),
      cutter: both(cutter()),
      rock: both(rock()),
      vine: both(vine()),
      coin: [0, 1, 2, 3].map(coinFrame),
      joyRing: joy.ring,
      joyKnob: joy.knob,
      digits: digits(),
      portal: [0, 1, 2].map(portalRing)
    };
  }
  root.KWArt = { build: build, PAL: PAL };
})(window);
