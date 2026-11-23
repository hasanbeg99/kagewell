/* Kagewell prototyp — smooth vector bakes. Built once per resize, drawn with smoothing on. */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pathRound(g, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  const BIO = {
    moon: { sky: '#16385A', mid: '#102438', deep: '#070E18', stone: '#6E8EAE', stoneDim: '#3C5874', joint: '#1A2C40', moss: '#2F6A58', glow: 'rgba(180,220,255,0.55)' },
    moss: { sky: '#14382C', mid: '#0E241C', deep: '#07140E', stone: '#6E9A78', stoneDim: '#345844', joint: '#14281C', moss: '#3E8A52', glow: 'rgba(170,220,160,0.5)' },
    ember: { sky: '#4A2418', mid: '#2A1410', deep: '#120806', stone: '#C48460', stoneDim: '#6A4030', joint: '#2A1610', moss: '#8A4030', glow: 'rgba(255,180,90,0.55)' },
    crystal: { sky: '#2C2458', mid: '#181430', deep: '#0A0818', stone: '#B0A0E0', stoneDim: '#5A4A88', joint: '#221C3A', moss: '#6A78C8', glow: 'rgba(210,200,255,0.55)' }
  };

  function hoop(g, x, y, w, h) {
    const grd = g.createLinearGradient(x, y, x, y + h);
    grd.addColorStop(0, '#5A6572');
    grd.addColorStop(0.32, '#F4F7FB');
    grd.addColorStop(0.55, '#9AA6B4');
    grd.addColorStop(1, '#343C46');
    g.fillStyle = grd;
    pathRound(g, x, y, w, h, h / 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.75)';
    pathRound(g, x + w * 0.08, y + h * 0.18, w * 0.84, Math.max(1, h * 0.22), 2);
    g.fill();
  }
  function head(g, cx, cy, r, eyes) {
    g.fillStyle = '#1A2344';
    g.beginPath();
    g.arc(cx, cy + 1, r + 4, Math.PI * 1.02, Math.PI * 1.98);
    g.quadraticCurveTo(cx + r + 2, cy + r * 0.2, cx + r * 0.7, cy + r * 0.95);
    g.quadraticCurveTo(cx, cy + r * 1.25, cx - r * 0.7, cy + r * 0.95);
    g.quadraticCurveTo(cx - r - 2, cy + r * 0.2, cx - r - 3, cy);
    g.fill();
    const hood = g.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    hood.addColorStop(0, '#4A62A4');
    hood.addColorStop(0.45, '#2A3A72');
    hood.addColorStop(1, '#161E3A');
    g.fillStyle = hood;
    g.beginPath();
    g.arc(cx, cy, r + 1.5, Math.PI * 0.98, Math.PI * 0.02, true);
    g.quadraticCurveTo(cx, cy + r * 0.15, cx + r * 0.85, cy + r * 0.72);
    g.quadraticCurveTo(cx, cy + r * 1.05, cx - r * 0.85, cy + r * 0.72);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.beginPath();
    g.ellipse(cx - r * 0.35, cy - r * 0.42, r * 0.38, r * 0.22, -0.5, 0, TAU);
    g.fill();
    const skin = g.createRadialGradient(cx - r * 0.2, cy - r * 0.1, r * 0.1, cx, cy + 2, r * 0.75);
    skin.addColorStop(0, '#FFE0C2');
    skin.addColorStop(1, '#E0B08A');
    g.fillStyle = skin;
    g.beginPath();
    g.arc(cx, cy + r * 0.12, r * 0.70, 0, TAU);
    g.fill();
    g.fillStyle = '#141A2E';
    pathRound(g, cx - r * 0.62, cy - r * 0.02, r * 1.24, r * 0.42, r * 0.16);
    g.fill();
    if (eyes === 'closed') {
      g.strokeStyle = '#F4FBFF';
      g.lineWidth = Math.max(1.5, r * 0.09);
      g.lineCap = 'round';
      g.beginPath();
      g.arc(cx - r * 0.26, cy + r * 0.16, r * 0.13, 0.25, Math.PI - 0.25);
      g.stroke();
      g.beginPath();
      g.arc(cx + r * 0.26, cy + r * 0.16, r * 0.13, 0.25, Math.PI - 0.25);
      g.stroke();
    } else if (eyes === 'swirl') {
      g.strokeStyle = '#F4FBFF';
      g.lineWidth = Math.max(1.4, r * 0.08);
      g.beginPath();
      g.arc(cx - r * 0.26, cy + r * 0.12, r * 0.11, 0.4, 5.4);
      g.stroke();
      g.beginPath();
      g.arc(cx + r * 0.26, cy + r * 0.12, r * 0.11, 0.4, 5.4);
      g.stroke();
    } else {
      g.fillStyle = '#F7FBFF';
      g.beginPath(); g.ellipse(cx - r * 0.26, cy + r * 0.12, r * 0.15, r * 0.17, 0, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(cx + r * 0.26, cy + r * 0.12, r * 0.15, r * 0.17, 0, 0, TAU); g.fill();
      g.fillStyle = '#1A2033';
      g.beginPath(); g.arc(cx - r * 0.22, cy + r * 0.14, r * 0.07, 0, TAU); g.fill();
      g.beginPath(); g.arc(cx + r * 0.30, cy + r * 0.14, r * 0.07, 0, TAU); g.fill();
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(cx - r * 0.18, cy + r * 0.08, r * 0.035, 0, TAU); g.fill();
      g.beginPath(); g.arc(cx + r * 0.34, cy + r * 0.08, r * 0.035, 0, TAU); g.fill();
    }
  }
  function scarfKnot(g, x, y, s) {
    g.fillStyle = '#E2283C';
    g.beginPath(); g.ellipse(x, y, s * 1.1, s * 0.55, 0.5, 0, TAU); g.fill();
    g.fillStyle = '#FF6678';
    g.beginPath(); g.ellipse(x - s * 0.2, y - s * 0.15, s * 0.4, s * 0.22, 0.4, 0, TAU); g.fill();
  }
  function barrelBody(g, cx, top, bw, bh) {
    const left = cx - bw / 2;
    const bot = top + bh;
    g.beginPath();
    g.moveTo(left, top + 10);
    g.bezierCurveTo(left - bw * 0.08, top + bh * 0.35, left - bw * 0.06, top + bh * 0.7, left + 2, bot - 8);
    g.quadraticCurveTo(cx, bot + bh * 0.08, left + bw - 2, bot - 8);
    g.bezierCurveTo(left + bw + bw * 0.06, top + bh * 0.7, left + bw + bw * 0.08, top + bh * 0.35, left + bw, top + 10);
    g.quadraticCurveTo(cx, top - 4, left, top + 10);
    g.closePath();
    const wood = g.createLinearGradient(left, 0, left + bw, 0);
    wood.addColorStop(0, '#4E3014');
    wood.addColorStop(0.16, '#D29252');
    wood.addColorStop(0.34, '#8A5428');
    wood.addColorStop(0.5, '#F0C48A');
    wood.addColorStop(0.68, '#7A4A22');
    wood.addColorStop(0.86, '#C48448');
    wood.addColorStop(1, '#3E2610');
    g.fillStyle = wood;
    g.fill();
    g.save();
    g.clip();
    g.strokeStyle = 'rgba(50,24,8,0.28)';
    g.lineWidth = 1.4;
    for (let i = 1; i < 7; i++) {
      const x = left + (bw * i) / 7;
      g.beginPath();
      g.moveTo(x, top);
      g.quadraticCurveTo(x + (i % 2 ? 2 : -2), top + bh * 0.5, x, bot);
      g.stroke();
    }
    g.restore();
    hoop(g, left - 2, top + bh * 0.28, bw + 4, Math.max(6, bh * 0.09));
    hoop(g, left - 1, top + bh * 0.68, bw + 2, Math.max(6, bh * 0.09));
  }
  function kiroBarrel(g, w, h) {
    const cx = w / 2;
    const top = h * 0.46;
    const bw = w * 0.74;
    g.fillStyle = 'rgba(0,0,0,0.30)';
    g.beginPath(); g.ellipse(cx, h * 0.93, w * 0.32, h * 0.04, 0, 0, TAU); g.fill();
    barrelBody(g, cx, top, bw, h * 0.46);
    g.fillStyle = '#140E0A';
    g.beginPath();
    g.ellipse(cx, top + 12, bw * 0.34, 9, 0, 0, TAU);
    g.fill();
    head(g, cx, top + h * 0.02, w * 0.19, 'open');
    rim(g, cx, top, bw);
    scarfKnot(g, cx + w * 0.30, top + h * 0.06, w * 0.05);
  }
  function limb(g, x, y, w, h, rot, col) {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.fillStyle = col || '#31457E';
    pathRound(g, -w / 2, 0, w, h, w / 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.18)';
    pathRound(g, -w / 2 + 1, 1, Math.max(2, w * 0.35), h * 0.7, w / 3);
    g.fill();
    g.restore();
  }
  function rim(g, cx, top, bw) {
    const lip = g.createLinearGradient(cx - bw / 2, top, cx + bw / 2, top + 10);
    lip.addColorStop(0, '#6A4322');
    lip.addColorStop(0.5, '#F0C890');
    lip.addColorStop(1, '#5A3818');
    g.strokeStyle = lip;
    g.lineWidth = 4;
    g.beginPath();
    g.ellipse(cx, top + 10, bw * 0.42, Math.max(7, bw * 0.12), 0, 0, TAU);
    g.stroke();
  }
  function kiroLoose(g, w, h) {
    const cx = w * 0.5;
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.beginPath(); g.ellipse(cx, h * 0.94, w * 0.26, h * 0.035, 0, 0, TAU); g.fill();
    limb(g, cx - 9, h * 0.62, 10, h * 0.28, 0.08, '#24325E');
    limb(g, cx + 8, h * 0.62, 10, h * 0.28, -0.06, '#24325E');
    g.fillStyle = '#2A3C72';
    pathRound(g, cx - 16, h * 0.40, 32, h * 0.28, 12);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.14)';
    pathRound(g, cx - 12, h * 0.42, 10, h * 0.12, 5);
    g.fill();
    limb(g, cx - 18, h * 0.42, 8, h * 0.2, 0.55, '#31457E');
    limb(g, cx + 16, h * 0.42, 8, h * 0.18, -0.4, '#31457E');
    head(g, cx, h * 0.30, w * 0.24, 'open');
    g.strokeStyle = '#E2283C';
    g.lineWidth = 5;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(cx + 8, h * 0.40);
    g.quadraticCurveTo(cx + w * 0.42, h * 0.48, cx + w * 0.3, h * 0.66);
    g.stroke();
  }
  function kiroLie(g, w, h) {
    g.fillStyle = 'rgba(0,0,0,0.2)';
    g.beginPath(); g.ellipse(w * 0.5, h * 0.78, w * 0.4, h * 0.08, 0, 0, TAU); g.fill();
    g.strokeStyle = '#E2283C';
    g.lineWidth = 7;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(w * 0.34, h * 0.48);
    g.bezierCurveTo(w * 0.16, h * 0.22, w * 0.02, h * 0.55, w * 0.14, h * 0.72);
    g.stroke();
    g.strokeStyle = '#FF9AA6';
    g.lineWidth = 2.5;
    g.stroke();
    limb(g, w * 0.62, h * 0.52, 12, h * 0.22, 1.35, '#24325E');
    limb(g, w * 0.78, h * 0.50, 12, h * 0.2, 1.05, '#24325E');
    g.fillStyle = '#24325E';
    g.beginPath(); g.ellipse(w * 0.5, h * 0.55, w * 0.2, h * 0.2, -0.15, 0, TAU); g.fill();
    head(g, w * 0.26, h * 0.42, h * 0.30, 'swirl');
  }
  function kiroSit(g, w, h) {
    g.fillStyle = 'rgba(0,0,0,0.2)';
    g.beginPath(); g.ellipse(w * 0.48, h * 0.9, w * 0.34, h * 0.045, 0, 0, TAU); g.fill();
    g.strokeStyle = '#E2283C';
    g.lineWidth = 6;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(w * 0.62, h * 0.4);
    g.bezierCurveTo(w * 0.92, h * 0.28, w * 0.88, h * 0.7, w * 0.66, h * 0.78);
    g.stroke();
    limb(g, w * 0.3, h * 0.66, 12, h * 0.2, 1.45, '#24325E');
    limb(g, w * 0.52, h * 0.66, 12, h * 0.2, 0.4, '#24325E');
    g.fillStyle = '#2A3C72';
    pathRound(g, w * 0.32, h * 0.42, w * 0.34, h * 0.28, 12);
    g.fill();
    head(g, w * 0.48, h * 0.28, w * 0.22, 'open');
    scarfKnot(g, w * 0.66, h * 0.4, 5);
  }
  function tara(g, w, h, lean) {
    const cx = lean ? w * 0.58 : w * 0.5;
    const cy = lean ? h * 0.34 : h * 0.30;
    g.fillStyle = 'rgba(0,0,0,0.2)';
    g.beginPath(); g.ellipse(cx, h * 0.9, w * 0.28, 6, 0, 0, TAU); g.fill();
    const dress = g.createLinearGradient(cx - 20, cy, cx + 20, h * 0.88);
    dress.addColorStop(0, '#F7E2EA');
    dress.addColorStop(0.4, '#E7A0B4');
    dress.addColorStop(1, '#C46888');
    g.fillStyle = dress;
    g.beginPath();
    g.moveTo(cx - 8, cy + 16);
    g.quadraticCurveTo(cx - w * 0.28, h * (lean ? 0.7 : 0.78), cx - 6, h * 0.88);
    g.quadraticCurveTo(cx, h * 0.94, cx + w * 0.22, h * 0.86);
    g.quadraticCurveTo(cx + w * 0.16, cy + 20, cx + 6, cy + 14);
    g.fill();
    g.strokeStyle = '#FFF6F8';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(cx, cy + 18);
    g.quadraticCurveTo(cx + 4, h * 0.6, cx + 2, h * 0.82);
    g.stroke();
    const hair = g.createLinearGradient(cx, cy - 30, cx, h * 0.7);
    hair.addColorStop(0, '#5A3828');
    hair.addColorStop(0.4, '#3A2218');
    hair.addColorStop(1, '#2A160E');
    g.fillStyle = hair;
    g.beginPath();
    g.ellipse(cx, cy, w * 0.16, h * 0.11, 0, 0, TAU);
    g.fill();
    g.beginPath();
    g.moveTo(cx - w * 0.14, cy);
    g.quadraticCurveTo(cx - w * 0.22, h * 0.55, cx - w * 0.06, h * (lean ? 0.62 : 0.58));
    g.quadraticCurveTo(cx, cy + 10, cx + w * 0.02, cy);
    g.fill();
    g.beginPath();
    g.moveTo(cx + w * 0.1, cy - 2);
    g.quadraticCurveTo(cx + w * 0.24, h * 0.4, cx + w * 0.12, h * 0.62);
    g.quadraticCurveTo(cx + w * 0.02, cy + 8, cx + 4, cy);
    g.fill();
    g.fillStyle = 'rgba(255,220,180,0.35)';
    g.beginPath(); g.ellipse(cx - 6, cy - 8, 5, 8, -0.4, 0, TAU); g.fill();
    const skin = g.createRadialGradient(cx - 3, cy - 2, 2, cx, cy + 2, 16);
    skin.addColorStop(0, '#FFE4C8');
    skin.addColorStop(1, '#E8B892');
    g.fillStyle = skin;
    g.beginPath(); g.ellipse(cx, cy + 2, w * 0.11, h * 0.075, 0, 0, TAU); g.fill();
    g.fillStyle = '#3A2418';
    g.beginPath(); g.ellipse(cx - 5, cy + 1, 1.6, 2, 0, 0, TAU); g.ellipse(cx + 5, cy + 1, 1.6, 2, 0, 0, TAU); g.fill();
    g.strokeStyle = '#C46888';
    g.lineWidth = 1.4;
    g.beginPath(); g.arc(cx, cy + 7, 3.2, 0.15, Math.PI - 0.15); g.stroke();
    g.fillStyle = '#F0C4A4';
    pathRound(g, cx - w * 0.02, cy + 16, 8, h * 0.16, 4);
    g.fill();
  }
  function shaft(g, w, h, pal) {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, pal.sky);
    bg.addColorStop(0.45, pal.mid);
    bg.addColorStop(1, pal.deep);
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    const rng = mulberry32(pal.sky.charCodeAt(1) * 99 + 7);
    for (let i = 0; i < 18; i++) {
      const x = rng() * w, y = rng() * h, rw = 30 + rng() * 70, rh = 18 + rng() * 36;
      g.fillStyle = rng() < 0.5 ? pal.stoneDim : pal.joint;
      g.globalAlpha = 0.10 + rng() * 0.12;
      g.beginPath();
      g.ellipse(x, y, rw, rh, rng() * 0.4, 0, TAU);
      g.fill();
    }
    g.globalAlpha = 1;
    g.strokeStyle = pal.moss;
    g.lineWidth = 3;
    g.lineCap = 'round';
    g.globalAlpha = 0.45;
    for (let i = 0; i < 4; i++) {
      const x = 20 + rng() * (w - 40);
      g.beginPath();
      g.moveTo(x, rng() * h);
      g.bezierCurveTo(x + 20, 40, x - 16, h * 0.4, x + 8, h * 0.7);
      g.stroke();
    }
    g.globalAlpha = 1;
    const edge = g.createLinearGradient(0, 0, w, 0);
    edge.addColorStop(0, 'rgba(0,0,0,0.35)');
    edge.addColorStop(0.15, 'rgba(0,0,0,0)');
    edge.addColorStop(0.85, 'rgba(0,0,0,0)');
    edge.addColorStop(1, 'rgba(0,0,0,0.35)');
    g.fillStyle = edge;
    g.fillRect(0, 0, w, h);
  }
  function wall(g, w, h, pal) {
    const grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, pal.deep);
    grd.addColorStop(0.4, pal.stoneDim);
    grd.addColorStop(0.72, pal.stone);
    grd.addColorStop(1, pal.joint);
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    const rng = mulberry32(3);
    g.globalAlpha = 0.4;
    for (let y = 8; y < h; y += 36) {
      for (let x = -10; x < w; x += 28) {
        g.fillStyle = rng() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.18)';
        pathRound(g, x + (y % 72 === 8 ? 10 : 0), y, 22, 16, 5);
        g.fill();
      }
    }
    g.globalAlpha = 1;
  }
  function meadow(g, w, h) {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.62);
    sky.addColorStop(0, '#8ECBF8');
    sky.addColorStop(0.55, '#D7F0FF');
    sky.addColorStop(1, '#F7FBFF');
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);
    const sun = g.createRadialGradient(w * 0.78, h * 0.16, 8, w * 0.78, h * 0.16, w * 0.28);
    sun.addColorStop(0, 'rgba(255,244,200,0.95)');
    sun.addColorStop(1, 'rgba(255,244,200,0)');
    g.fillStyle = sun;
    g.fillRect(0, 0, w, h * 0.5);
    g.fillStyle = '#8FB8D8';
    g.beginPath();
    g.moveTo(0, h * 0.58);
    g.quadraticCurveTo(w * 0.25, h * 0.46, w * 0.48, h * 0.56);
    g.quadraticCurveTo(w * 0.72, h * 0.66, w, h * 0.5);
    g.lineTo(w, h); g.lineTo(0, h);
    g.fill();
    const grass = g.createLinearGradient(0, h * 0.52, 0, h);
    grass.addColorStop(0, '#B7E6A0');
    grass.addColorStop(0.25, '#67C36A');
    grass.addColorStop(1, '#2F8A45');
    g.fillStyle = grass;
    g.beginPath();
    g.moveTo(0, h * 0.64);
    g.quadraticCurveTo(w * 0.3, h * 0.56, w * 0.55, h * 0.66);
    g.quadraticCurveTo(w * 0.8, h * 0.74, w, h * 0.6);
    g.lineTo(w, h); g.lineTo(0, h);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.lineWidth = 2;
    g.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const x = 16 + (i * 47) % (w - 20);
      const y = h * 0.7 + (i % 5) * 18;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + 4, y - 10, x + 1, y - 16);
      g.stroke();
    }
  }
  function glow(g, w, h, inner, mid) {
    const grd = g.createRadialGradient(w / 2, h / 2, w * 0.05, w / 2, h / 2, w / 2);
    grd.addColorStop(0, inner);
    grd.addColorStop(0.45, mid);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  }
  function coin(g, w, h) {
    const cx = w / 2, cy = h / 2, r = w * 0.40;
    const grd = g.createRadialGradient(cx - r * 0.4, cy - r * 0.45, r * 0.1, cx + r * 0.1, cy + r * 0.1, r * 1.05);
    grd.addColorStop(0, '#FFF8D2');
    grd.addColorStop(0.35, '#FFE06A');
    grd.addColorStop(0.7, '#F0A820');
    grd.addColorStop(1, '#A66A08');
    g.fillStyle = grd;
    g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
    g.strokeStyle = '#FFF4C4';
    g.lineWidth = 2;
    g.beginPath(); g.arc(cx, cy, r * 0.72, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.beginPath(); g.ellipse(cx - r * 0.32, cy - r * 0.34, r * 0.24, r * 0.12, -0.7, 0, TAU); g.fill();
  }
  function lantern(g, w, h) {
    const x = w * 0.28, y = h * 0.18, bw = w * 0.44, bh = h * 0.62;
    g.fillStyle = '#3A2A18';
    pathRound(g, x - 2, y - 4, bw + 4, 6, 2); g.fill();
    const body = g.createLinearGradient(x, y, x + bw, y);
    body.addColorStop(0, '#C46A18');
    body.addColorStop(0.4, '#FFE08A');
    body.addColorStop(0.7, '#FFB347');
    body.addColorStop(1, '#A85010');
    g.fillStyle = body;
    pathRound(g, x, y, bw, bh, 6);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.55)';
    pathRound(g, x + 3, y + 4, bw * 0.28, bh * 0.55, 3);
    g.fill();
    g.fillStyle = '#4A3018';
    g.fillRect(x - 1, y + bh, bw + 2, 4);
    g.strokeStyle = '#6A5030';
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, y); g.stroke();
  }
  function portal(g, w, h) {
    const cx = w / 2, cy = h / 2;
    const hole = g.createRadialGradient(cx, cy, 4, cx, cy, w * 0.42);
    hole.addColorStop(0, '#F4FEFF');
    hole.addColorStop(0.22, '#7AEEF8');
    hole.addColorStop(0.5, '#2A6AD4');
    hole.addColorStop(0.78, '#12305A');
    hole.addColorStop(1, 'rgba(8,16,32,0)');
    g.fillStyle = hole;
    g.beginPath(); g.ellipse(cx, cy, w * 0.46, h * 0.40, 0, 0, TAU); g.fill();
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(255,255,255,0.85)';
    g.lineWidth = 4;
    g.beginPath(); g.arc(cx, cy, w * 0.30, 0.4, 2.4); g.stroke();
    g.strokeStyle = '#9AF7FF';
    g.lineWidth = 6;
    g.beginPath(); g.arc(cx, cy, w * 0.2, 2.6, 5.4); g.stroke();
    g.strokeStyle = '#E8FBFF';
    g.lineWidth = 3;
    g.beginPath(); g.arc(cx, cy, w * 0.1, 4.2, 6.6); g.stroke();
  }
  function cone(g, w, h) {
    const grd = g.createLinearGradient(w / 2, 0, w / 2, h);
    grd.addColorStop(0, 'rgba(210,230,255,0.45)');
    grd.addColorStop(1, 'rgba(210,230,255,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(w * 0.35, 0);
    g.lineTo(w * 0.65, 0);
    g.lineTo(w, h);
    g.lineTo(0, h);
    g.closePath();
    g.fill();
  }
  function katana(g, w, h) {
    g.translate(w / 2, h / 2);
    g.rotate(-0.7);
    const blade = g.createLinearGradient(-4, -h * 0.4, 6, h * 0.2);
    blade.addColorStop(0, '#FFFFFF');
    blade.addColorStop(0.5, '#D5E4F2');
    blade.addColorStop(1, '#8AA0B4');
    g.fillStyle = blade;
    g.beginPath();
    g.moveTo(0, -h * 0.42);
    g.quadraticCurveTo(8, -4, 2, h * 0.12);
    g.quadraticCurveTo(-2, -4, 0, -h * 0.42);
    g.fill();
    g.fillStyle = '#E0A868';
    pathRound(g, -7, h * 0.1, 14, 8, 2);
    g.fill();
    g.fillStyle = '#6A3A16';
    pathRound(g, -3, h * 0.18, 6, h * 0.16, 2);
    g.fill();
  }
  function barrelIcon(g, w, h) {
    barrelBody(g, w / 2, h * 0.22, w * 0.7, h * 0.68);
  }
  function build(scale) {
    scale = Math.max(0.75, scale || 1);
    function bake(lw, lh, fn) {
      const c = document.createElement('canvas');
      const pw = Math.max(1, Math.round(lw * scale));
      const ph = Math.max(1, Math.round(lh * scale));
      c.width = pw;
      c.height = ph;
      c.lw = lw;
      c.lh = lh;
      const g = c.getContext('2d');
      g.setTransform(pw / lw, 0, 0, ph / lh, 0, 0);
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = 'high';
      fn(g, lw, lh);
      return c;
    }
    const bg = {}, walls = {};
    Object.keys(BIO).forEach(name => {
      bg[name] = bake(330, 420, (g, w, h) => shaft(g, w, h, BIO[name]));
      walls[name] = bake(36, 280, (g, w, h) => wall(g, w, h, BIO[name]));
    });
    return {
      bg: bg,
      walls: walls,
      meadow: bake(390, 900, meadow),
      coin: bake(64, 64, coin),
      glowWarm: bake(128, 128, (g, w, h) => glow(g, w, h, 'rgba(255,220,160,0.95)', 'rgba(255,160,60,0.28)')),
      glowCool: bake(128, 128, (g, w, h) => glow(g, w, h, 'rgba(220,240,255,0.7)', 'rgba(120,180,255,0.15)')),
      glowGold: bake(96, 96, (g, w, h) => glow(g, w, h, 'rgba(255,230,140,0.9)', 'rgba(255,190,40,0.2)')),
      spark: bake(32, 32, (g, w, h) => glow(g, w, h, 'rgba(255,255,255,0.95)', 'rgba(255,255,255,0.2)')),
      lantern: bake(28, 44, lantern),
      portal: bake(180, 150, portal),
      cone: bake(220, 260, cone),
      kiro: bake(80, 96, kiroBarrel),
      kiroLoose: bake(52, 72, kiroLoose),
      kiroLie: bake(150, 90, kiroLie),
      kiroSit: bake(100, 120, kiroSit),
      tara: bake(90, 140, (g, w, h) => tara(g, w, h, false)),
      taraLean: bake(130, 170, (g, w, h) => tara(g, w, h, true)),
      katana: bake(40, 40, katana),
      barrelIcon: bake(36, 40, barrelIcon)
    };
  }
  root.KWBake = { build: build, BIO: BIO };
})(window);
