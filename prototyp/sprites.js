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
    const p = new Pix(72, 96);
    const hy = lean ? 28 : 16;
    p.ellipse(40, hy, 11, 12, '#E8C9A6');
    p.rect(30, hy - 12, 20, 8, '#120F24');
    p.rect(46, hy - 8, 8, 28, '#222040');
    p.rect(50, hy + 16, 6, 14, '#3E3E6B');
    p.rect(52, hy + 28, 8, 6, '#6E74A8');
    p.rect(34, hy - 2, 4, 3, '#120A1E');
    p.rect(44, hy - 2, 4, 3, '#120A1E');
    p.rect(36, hy + 4, 8, 2, '#E2283C');
    const by = hy + 12;
    p.rect(lean ? 22 : 26, by, 28, 34, '#59307A');
    p.rect(lean ? 24 : 28, by + 2, 8, 22, '#7E4AA6');
    p.rect(lean ? 22 : 26, by + 16, 28, 5, '#359E84');
    p.rect(lean ? 22 : 26, by + 20, 28, 3, '#F0B43A');
    if (lean) {
      p.rect(4, by + 8, 22, 7, '#59307A');
      p.rect(0, by + 12, 10, 6, '#E8C9A6');
      p.rect(8, by + 28, 22, 8, '#231233');
      p.rect(28, by + 34, 16, 8, '#231233');
    } else {
      p.rect(28, by + 32, 8, 22, '#231233');
      p.rect(40, by + 32, 8, 22, '#231233');
      p.rect(26, 90, 10, 4, '#120A1E');
      p.rect(40, 90, 10, 4, '#120A1E');
    }
    return done(p);
  }
  function kiroBarrel() {
    const p = new Pix(80, 96);
    p.ellipse(40, 22, 16, 15, PAL.skin1);
    p.rect(26, 8, 28, 10, '#1A1028');
    p.rect(28, 12, 24, 5, PAL.steel2);
    p.rect(36, 10, 8, 8, '#B9C3D6');
    p.rect(32, 20, 5, 4, PAL.out); p.rect(44, 20, 5, 4, PAL.out);
    p.rect(34, 26, 12, 3, PAL.scarf1);
    p.rect(18, 30, 22, 8, PAL.suit1);
    p.rect(22, 32, 8, 4, PAL.suit2);
    p.rect(8, 32, 16, 6, PAL.scarf1);
    p.rect(4, 36, 10, 4, PAL.scarf2);
    for (let i = 0; i < 6; i++) {
      const x = 14 + i * 9;
      p.rect(x, 46, 8, 46, i % 2 ? PAL.wood1 : PAL.wood2);
      p.rect(x, 46, 2, 46, PAL.wood0);
    }
    p.rect(12, 52, 56, 5, PAL.steel1);
    p.rect(12, 66, 56, 5, PAL.steel1);
    p.rect(12, 80, 56, 5, PAL.steel1);
    p.rect(14, 53, 52, 1, PAL.steel2);
    p.rect(20, 58, 8, 6, PAL.skin1);
    p.rect(52, 58, 8, 6, PAL.skin1);
    return done(p);
  }
  function kiroLoose() {
    const p = new Pix(52, 72);
    p.ellipse(26, 14, 12, 11, PAL.skin1);
    p.rect(16, 4, 20, 8, '#1A1028');
    p.rect(18, 8, 16, 4, PAL.steel2);
    p.rect(20, 14, 4, 3, PAL.out); p.rect(30, 14, 4, 3, PAL.out);
    p.rect(14, 22, 24, 8, PAL.scarf1);
    p.rect(6, 24, 12, 4, PAL.scarf2);
    p.rect(18, 30, 16, 22, PAL.suit1);
    p.rect(20, 32, 6, 16, PAL.suit2);
    p.rect(16, 52, 8, 16, PAL.suit0);
    p.rect(28, 52, 8, 16, PAL.suit0);
    return done(p);
  }
  function kiroLie() {
    const p = new Pix(96, 40);
    p.ellipse(78, 14, 12, 11, PAL.skin1);
    p.rect(68, 4, 18, 6, '#1A1028');
    p.rect(74, 12, 4, 3, PAL.out);
    p.rect(40, 16, 36, 14, PAL.suit1);
    p.rect(44, 18, 10, 6, PAL.suit2);
    p.rect(28, 18, 16, 6, PAL.scarf1);
    p.rect(8, 22, 22, 8, PAL.suit0);
    p.rect(4, 28, 10, 6, PAL.skin0);
    return done(p);
  }
  function kiroSit() {
    const p = new Pix(64, 56);
    p.ellipse(40, 14, 13, 12, PAL.skin1);
    p.rect(30, 4, 20, 7, '#1A1028');
    p.rect(34, 12, 4, 3, PAL.out); p.rect(44, 12, 4, 3, PAL.out);
    p.rect(22, 18, 18, 6, PAL.scarf1);
    p.rect(28, 24, 22, 16, PAL.suit1);
    p.rect(18, 38, 16, 8, PAL.suit0);
    p.rect(36, 40, 18, 8, PAL.suit0);
    return done(p);
  }
  function katanaIcon() {
    const p = new Pix(36, 36);
    p.rect(6, 26, 8, 6, '#E0A868');
    p.rect(12, 24, 4, 4, '#B9C3D6');
    for (let i = 0; i < 22; i++) p.rect(14 + i, 22 - i, 3, 3, i > 16 ? '#FFFFFF' : '#EEF4FF');
    p.rect(16, 20, 14, 2, '#4FF0FF');
    return done(p, false);
  }
  function barrelIcon() {
    const p = new Pix(28, 32);
    p.ellipse(14, 8, 10, 4, '#E0A868');
    p.rect(4, 8, 20, 18, '#8A5A2E');
    p.rect(6, 10, 4, 14, '#5A3518');
    p.rect(12, 10, 4, 14, '#E0A868');
    p.rect(18, 10, 4, 14, '#5A3518');
    p.rect(4, 12, 20, 3, '#B9C3D6');
    p.rect(4, 20, 20, 3, '#7B8494');
    p.ellipse(14, 26, 10, 4, '#3A1E10');
    return done(p, false);
  }
  function speakerIcon(muted) {
    const p = new Pix(24, 24);
    p.rect(2, 8, 6, 8, PAL.steel2);
    p.rect(8, 6, 4, 12, PAL.steel1);
    p.rect(12, 4, 3, 16, '#B9C3D6');
    if (muted) {
      p.rect(16, 6, 2, 12, PAL.scarf1);
      p.rect(14, 10, 8, 2, PAL.scarf1);
    } else {
      p.rect(18, 6, 2, 2, PAL.steel2);
      p.rect(20, 10, 2, 2, PAL.steel2);
      p.rect(18, 14, 2, 2, PAL.steel2);
    }
    return done(p, false);
  }
  function creep(pose) {
    const p = new Pix(76, 52);
    const cols = ['#281D2B', '#6E2416', '#B8421C', '#EB752D', '#FFB45C'];
    const tuck = pose === 'wind' ? 4 : 0;
    const lunge = pose === 'lunge' ? 6 : 0;
    for (let i = 0; i < 5; i++) {
      const x = 2 + i * 14 - (i < 2 ? tuck : 0) + (i > 2 ? lunge : 0);
      p.rect(x, 14, 13, 24, cols[1 + (i % 3)]);
      p.rect(x, 14, 13, 4, cols[4]);
      p.rect(x + 2, 6 - (pose === 'wind' ? 4 : 0), 3, 10, '#C4C8D4');
      p.rect(x + 8, 8 - (pose === 'wind' ? 3 : 0), 3, 8, '#8C8F99');
      p.rect(x + 1, 38, 4, 10, cols[0]);
      p.rect(x + 8, 38, 4, 10, cols[0]);
    }
    p.rect(60 + lunge, 16, 14, 16, cols[3]);
    p.rect(66 + lunge, 20, 8, 4, pose === 'wind' ? '#FFF8C0' : '#FF5A2A');
    p.rect(68 + lunge, 21, 3, 2, '#120A1E');
    if (pose === 'wind') { p.rect(70, 28, 6, 3, cols[4]); p.rect(74, 26, 2, 7, cols[4]); }
    return done(p);
  }
  function bat(pose) {
    const p = new Pix(68, 56);
    const up = pose === 0 ? -8 : pose === 1 ? 0 : pose === 2 ? 8 : 0;
    const fold = pose === 3 ? 10 : 0;
    p.ellipse(34, 30, 10, 9, '#2A1E47');
    p.ellipse(34, 18, 6, 5, '#3E3E6B');
    p.rect(28, 8, 3, 6, '#2A1E47'); p.rect(38, 8, 3, 6, '#2A1E47');
    p.rect(30, 16, 3, 3, '#FFC23A'); p.rect(38, 16, 3, 3, '#FFC23A');
    p.ellipse(16 + fold, 26 + up, 14, 5, '#B9C3D6');
    p.ellipse(52 - fold, 26 - up, 14, 5, '#EEF4FF');
    p.rect(8 + fold, 24 + up, 10, 2, '#7B8494');
    p.rect(50 - fold, 24 - up, 10, 2, '#EEF4FF');
    return done(p);
  }
  function cutter() {
    const p = new Pix(56, 68);
    p.ellipse(28, 14, 11, 10, '#4E7A3A');
    p.rect(18, 6, 6, 8, '#78AD52'); p.rect(32, 6, 6, 8, '#78AD52');
    p.rect(22, 12, 4, 3, '#FF4040'); p.rect(32, 12, 4, 3, '#FF4040');
    p.rect(18, 22, 20, 28, '#3A1E10');
    p.rect(20, 24, 16, 22, '#5A3518');
    p.rect(6, 28, 14, 5, '#C7CED6');
    p.rect(36, 28, 14, 5, '#C7CED6');
    p.rect(2, 26, 6, 8, '#EEF4FF');
    p.rect(48, 26, 6, 8, '#EEF4FF');
    p.rect(20, 50, 6, 12, '#274524');
    p.rect(30, 50, 6, 12, '#274524');
    return done(p);
  }
  function rock() {
    const p = new Pix(64, 44);
    p.rect(0, 10, 36, 28, '#273A50');
    p.rect(0, 10, 36, 5, '#3D5875');
    p.rect(4, 28, 16, 4, '#2F5B4A');
    p.rect(30, 8, 28, 5, '#7B8494');
    p.rect(34, 16, 26, 5, '#B9C3D6');
    p.rect(32, 26, 24, 5, '#4A4F57');
    p.rect(48, 6, 4, 6, '#EEF4FF');
    return done(p);
  }
  function vine() {
    const p = new Pix(48, 40);
    p.ellipse(14, 20, 12, 14, '#2F5B4A');
    p.ellipse(14, 18, 7, 8, '#D62D50');
    p.rect(22, 16, 16, 6, '#163826');
    p.rect(34, 12, 8, 6, '#4E8F5B');
    p.rect(40, 14, 6, 4, '#B9C3D6');
    p.set(12, 16, '#FF7590');
    return done(p);
  }
  function coinFrame(ph) {
    const p = new Pix(32, 32);
    const rx = [13, 9, 3, 9][ph];
    p.ellipse(16, 16, Math.max(2, rx), 13, '#8C4B00');
    if (rx > 3) p.ellipse(16, 16, Math.max(2, rx - 3), 10, '#FFD84A');
    if (rx > 8) {
      p.rect(15, 8, 2, 16, '#FFF8C4');
      p.rect(12, 14, 8, 2, '#E0A868');
      const gx = 8 + ph * 3, gy = 8 + (ph % 2) * 4;
      p.rect(gx, gy, 2, 2, '#FFFFFF');
    }
    return done(p, false);
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
  const BIO = {
    moon: ['#0B121D', '#121D2D', '#1B2B40', '#283E59', '#3D5875'],
    moss: ['#0C1612', '#142E22', '#1E4030', '#2F5B4A', '#4E8F5B'],
    ember: ['#14080C', '#2A1218', '#4A2420', '#7A4030', '#C06030'],
    crystal: ['#100818', '#1A1030', '#2A2060', '#5850A0', '#9AF7FF']
  };
  function backStrip(biome) {
    const p = new Pix(330, 128);
    const s = BIO[biome] || BIO.moon;
    p.rect(0, 0, 330, 128, s[0]);
    for (let row = 0; row < 8; row++) {
      let x = (row & 1) ? 22 : 0;
      const bh = 14;
      while (x < 330) {
        const bw = 26 + ((row * 7 + x) % 18);
        const w = Math.min(bw - 2, 329 - x);
        const mid = Math.abs((x + bw / 2) - 165) / 165;
        const body = mid > 0.55 ? s[2] : mid > 0.28 ? s[1] : s[0];
        p.rect(x + 1, row * 16 + 1, w, bh, body);
        p.rect(x + 1, row * 16 + 1, w, 2, mid > 0.45 ? s[3] : s[2]);
        if ((x + row * 3) % 11 === 0) p.rect(x + 6, row * 16 + 8, 8, 2, s[2]);
        x += bw;
      }
    }
    if (biome === 'moon' || biome === 'crystal') {
      for (let a = 0; a < 3; a++) {
        const cx = 40 + a * 110, cy = 28 + (a % 2) * 48;
        for (let i = -18; i <= 18; i++) {
          const y = cy + Math.round(Math.sqrt(Math.max(0, 324 - i * i)) * 0.45);
          p.set(cx + i, y, s[3]);
          p.set(cx + i, y + 1, s[1]);
        }
      }
    }
    if (biome === 'moss') {
      for (let i = 0; i < 18; i++) p.rect(12 + (i * 37) % 300, 8 + (i * 19) % 110, 10, 3, s[4]);
    }
    if (biome === 'ember') {
      for (let i = 0; i < 10; i++) p.rect(20 + (i * 31) % 280, 10 + (i * 23) % 100, 4, 2, '#E0801A');
    }
    if (biome === 'crystal') {
      for (let i = 0; i < 8; i++) {
        const x = 30 + (i * 41) % 270, y = 16 + (i * 17) % 90;
        p.rect(x, y, 2, 10, s[4]); p.rect(x - 3, y + 3, 8, 2, s[4]);
      }
    }
    return p.canvas();
  }
  function sideVariant(kind, biome) {
    const p = new Pix(34, 96);
    const s = BIO[biome] || BIO.moon;
    p.rect(0, 0, 34, 96, s[0]);
    if (kind === 0) {
      p.rect(2, 4, 28, 40, s[2]); p.rect(2, 4, 28, 4, s[3]);
      p.rect(2, 50, 28, 40, s[2]); p.rect(2, 50, 28, 3, s[3]);
      p.rect(6, 22, 12, 4, PAL.moss1); p.rect(16, 68, 10, 3, PAL.moss2);
    } else if (kind === 1) {
      p.rect(2, 6, 26, 36, s[1]); p.rect(4, 48, 24, 40, s[2]);
      for (let i = 0; i < 20; i++) p.set(8 + (i % 5) * 2, 14 + i * 3, s[4]);
      p.rect(2, 40, 30, 2, s[0]);
    } else if (kind === 2) {
      p.rect(2, 4, 28, 88, s[2]);
      p.rect(8, 0, 3, 96, '#2B6994'); p.rect(18, 10, 2, 80, '#173D5C');
      p.rect(2, 80, 28, 6, PAL.moss0);
    } else {
      p.rect(2, 8, 28, 32, s[2]); p.rect(2, 48, 28, 36, s[1]);
      p.rect(6, 18, 18, 4, PAL.steel1); p.rect(10, 14, 4, 12, PAL.steel2);
      p.rect(4, 60, 22, 3, s[3]); p.rect(8, 66, 14, 2, s[4]);
    }
    p.rect(32, 0, 2, 96, '#6485A6');
    p.rect(30, 0, 1, 96, '#120A1E');
    return p.canvas();
  }
  function decoSprite(kind) {
    const p = new Pix(kind === 'drip' ? 6 : 14, kind === 'root' ? 72 : 64);
    if (kind === 'chain') {
      for (let y = 0; y < 64; y += 8) {
        p.rect(3, y, 8, 6, '#4A4F57');
        p.rect(4, y + 1, 6, 2, '#B9C3D6');
        p.rect(2, y + 5, 10, 2, '#2A2E38');
      }
    } else if (kind === 'root') {
      for (let y = 0; y < 72; y++) {
        const x = 4 + Math.round(Math.sin(y * 0.2) * 3);
        p.rect(x, y, 5, 1, y % 9 === 0 ? '#2F5B4A' : '#163826');
        if (y % 14 === 0) p.rect(x + 4, y, 6, 2, '#4E8F5B');
      }
    } else {
      p.rect(2, 0, 2, 64, '#59A9D9');
      for (let y = 8; y < 64; y += 16) p.rect(1, y, 4, 3, '#B8ECFF');
    }
    return p.canvas();
  }
  function lanternSprite() {
    const p = new Pix(16, 28);
    p.rect(6, 0, 4, 6, '#4A4F57');
    p.rect(3, 6, 10, 14, '#A84A14');
    p.rect(5, 8, 6, 8, '#FFB347');
    p.rect(7, 9, 2, 4, '#FFE2A8');
    p.rect(3, 20, 10, 3, '#2A2E38');
    return done(p, false);
  }
  function glowRing(step) {
    const p = new Pix(64, 64);
    const cols = ['#A84A14', '#FFB347', '#FFE2A8'];
    const c = cols[step % 3];
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const r = Math.hypot(x - 31.5, y - 31.5);
      if (r < 10) p.set(x, y, '#FFE2A8');
      else if (r < 18 && ((x + y) & 1) === 0) p.set(x, y, c);
      else if (r < 28 && ((x + y) & 3) === 0) p.set(x, y, '#A84A14');
    }
    return p.canvas();
  }
  function moonCone() {
    const p = new Pix(180, 220);
    for (let y = 0; y < 220; y++) {
      const half = 6 + y * 0.34;
      for (let x = -half; x <= half; x++) {
        const edge = Math.abs(x) / half;
        if (edge > 0.72 && ((x + y) & 1)) continue;
        const col = y < 24 ? '#FFFFFF' : y < 80 ? '#9FD8FF' : '#6485A6';
        p.set(90 + Math.round(x), y, col);
      }
    }
    return p.canvas();
  }
  function paintMeadow(p, night) {
    const sky = night
      ? ['#0B1026', '#1A2048', '#3A3878', '#5A4878']
      : ['#2A3B73', '#5A4878', '#C9A6D0', '#E0A868'];
    for (let y = 0; y < 520; y++) {
      const col = y < 140 ? sky[0] : y < 260 ? sky[1] : y < 400 ? sky[2] : sky[3];
      p.rect(0, y, 390, 1, col);
    }
    if (night) {
      for (let i = 0; i < 90; i++) p.set((i * 47) % 390, (i * 29) % 220, i % 5 ? '#FFF8C4' : '#4FF0FF');
    }
    for (let i = 0; i < 7; i++) {
      const cx = 20 + i * 58, base = 500, h = 70 + (i % 3) * 36;
      for (let y = 0; y < h; y++) {
        const half = ((h - y) / h) * (36 + (i % 2) * 14);
        p.rect(cx - half, base - y, half * 2, 1, i % 2 ? '#1A2844' : '#2A3B5A');
      }
    }
    p.rect(0, 500, 390, 344, '#142E22');
    p.rect(0, 500, 390, 10, '#214D34');
    for (let i = 0; i < 70; i++) {
      p.rect((i * 29) % 380, 530 + (i * 17) % 260, 2, 7, (i % 3) ? '#357845' : '#5DA856');
    }
    for (let i = 0; i < 16; i++) {
      const x = 20 + (i * 47) % 350, y = 560 + (i * 31) % 200;
      p.rect(x, y, 3, 3, i % 2 ? '#FF7590' : '#FFF8C4');
    }
    // house
    p.rect(28, 400, 118, 100, '#3A1E10');
    p.rect(36, 408, 102, 84, '#5A3518');
    for (let row = 0; row < 8; row++) p.rect(18 + row * 2, 360 + row * 6, 140 - row * 4, 6, row % 2 ? '#2F5B4A' : '#214D34');
    p.rect(70, 448, 28, 52, '#120A1E');
    p.rect(46, 430, 22, 16, '#FFB347');
    p.rect(48, 432, 8, 6, '#FFE2A8');
    p.rect(108, 424, 16, 22, '#8FB0CC');
    // stone well
    p.ellipse(214, 512, 62, 26, '#273A50');
    p.ellipse(214, 506, 54, 20, '#1B2B40');
    p.ellipse(214, 502, 40, 14, '#05070F');
    p.rect(168, 470, 8, 16, '#4E8F5B');
    p.rect(250, 474, 10, 14, '#2F5B4A');
    p.rect(162, 430, 12, 82, '#8A5A2E');
    p.rect(254, 430, 12, 82, '#8A5A2E');
    p.rect(150, 418, 128, 14, '#5A3518');
    p.rect(154, 422, 120, 4, '#E0A868');
    p.rect(200, 408, 28, 12, '#C9A66B');
  }
  function titleBg() {
    const p = new Pix(390, 844);
    paintMeadow(p, true);
    return p.canvas();
  }
  function meadowBg() {
    const p = new Pix(390, 844);
    paintMeadow(p, true);
    return p.canvas();
  }
  function portalRing(phase) {
    const p = new Pix(96, 96);
    const cols = ['#4FF0FF', '#8B42F5', '#FFD84A'];
    for (let arm = 0; arm < 3; arm++) {
      for (let i = 0; i < 26; i++) {
        const t = phase * 1.4 + arm * 2.094 + i * 0.24;
        const r = 8 + i * 1.2;
        const x = 48 + Math.cos(t) * r;
        const y = 48 + Math.sin(t) * r * 0.62;
        p.rect(x - 1, y - 1, 3, 3, cols[arm]);
      }
    }
    p.rect(44, 44, 8, 8, '#FFFFFF');
    return p.canvas();
  }
  function build() {
    const joy = joyParts();
    const names = ['moon', 'moss', 'ember', 'crystal'];
    const back = {}, sides = {};
    names.forEach(n => {
      back[n] = backStrip(n);
      sides[n] = [0, 1, 2, 3].map(k => sideVariant(k, n));
    });
    const creeps = ['idle', 'wind', 'lunge'].map(creep);
    const bats = [0, 1, 2, 3].map(bat);
    return {
      PAL: PAL,
      title: titleBg(),
      meadow: meadowBg(),
      back: back,
      sides: sides,
      chain: decoSprite('chain'),
      root: decoSprite('root'),
      drip: decoSprite('drip'),
      lantern: lanternSprite(),
      glow: [0, 1, 2].map(glowRing),
      cone: moonCone(),
      tara: tara(false),
      taraLean: tara(true),
      kiro: kiroBarrel(),
      kiroLoose: kiroLoose(),
      kiroLie: kiroLie(),
      kiroSit: kiroSit(),
      kiroHead: kiroHeadFallback(),
      katana: katanaIcon(),
      barrelIcon: barrelIcon(),
      speaker: speakerIcon(false),
      speakerOff: speakerIcon(true),
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
