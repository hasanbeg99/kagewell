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
    g.beginPath(); g.arc(cx - r * 0.18, cy + r * 0.08, r * 0.045, 0, TAU); g.fill();
    g.beginPath(); g.arc(cx + r * 0.34, cy + r * 0.08, r * 0.045, 0, TAU); g.fill();
    }
    g.strokeStyle = 'rgba(255,255,255,0.32)';
    g.lineWidth = Math.max(2, r * 0.09);
    g.beginPath();
    g.arc(cx - r * 0.1, cy - r * 0.15, r * 0.92, Math.PI * 1.15, Math.PI * 1.9);
    g.stroke();
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
    hoop(g, left - 2, top + bh * 0.22, bw + 4, Math.max(7, bh * 0.1));
    hoop(g, left - 1, top + bh * 0.62, bw + 2, Math.max(7, bh * 0.1));
    g.strokeStyle = 'rgba(255,236,200,0.28)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(left + bw * 0.12, top + 16);
    g.quadraticCurveTo(left + 6, top + bh * 0.45, left + bw * 0.16, top + bh - 14);
    g.stroke();
  }
  function sleeve(g, x, y, rot, len) {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    const grd = g.createLinearGradient(-8, 0, 8, 0);
    grd.addColorStop(0, '#1A2748');
    grd.addColorStop(0.45, '#3E5694');
    grd.addColorStop(1, '#141C34');
    g.fillStyle = grd;
    pathRound(g, -8, 0, 16, len, 8);
    g.fill();
    g.fillStyle = '#F0C9A4';
    g.beginPath(); g.arc(0, len + 1, 7, 0, TAU); g.fill();
    g.restore();
  }
  function kiroBarrel(g, w, h) {
    const cx = w / 2;
    const top = 108;
    const bw = 132;
    g.fillStyle = 'rgba(0,0,0,0.38)';
    g.beginPath(); g.ellipse(cx, 208, 58, 10, 0, 0, TAU); g.fill();
    barrelBody(g, cx, top, bw, 96);
    g.fillStyle = '#101820';
    g.beginPath(); g.ellipse(cx, top + 14, bw * 0.36, 12, 0, 0, TAU); g.fill();
    g.fillStyle = '#24386A';
    g.beginPath(); g.ellipse(cx, top + 2, 58, 18, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(180,200,255,0.18)';
    g.beginPath(); g.ellipse(cx - 16, top - 2, 18, 7, -0.4, 0, TAU); g.fill();
    sleeve(g, cx - 46, top - 8, 0.85, 42);
    sleeve(g, cx + 46, top - 8, -0.85, 42);
    head(g, cx, top - 18, 30, 'open');
    rim(g, cx, top, bw);
    scarfKnot(g, cx + 28, top - 2, 7);
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
    g.fillStyle = 'rgba(0,0,0,0.32)';
    g.beginPath(); g.ellipse(cx, h * 0.94, w * 0.28, 8, 0, 0, TAU); g.fill();
    limb(g, cx - 12, h * 0.62, 12, h * 0.28, 0.08, '#24325E');
    limb(g, cx + 12, h * 0.62, 12, h * 0.28, -0.05, '#24325E');
    const body = g.createLinearGradient(cx - 20, h * 0.38, cx + 20, h * 0.7);
    body.addColorStop(0, '#4A62A0');
    body.addColorStop(0.5, '#2A3C72');
    body.addColorStop(1, '#151C36');
    g.fillStyle = body;
    pathRound(g, cx - 22, h * 0.40, 44, h * 0.28, 14);
    g.fill();
    sleeve(g, cx - 24, h * 0.42, 0.7, h * 0.2);
    sleeve(g, cx + 24, h * 0.40, -0.45, h * 0.18);
    head(g, cx, h * 0.28, w * 0.22, 'open');
    g.strokeStyle = '#E2283C';
    g.lineWidth = 6;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(cx + 10, h * 0.38);
    g.quadraticCurveTo(cx + w * 0.4, h * 0.46, cx + w * 0.28, h * 0.64);
    g.stroke();
    g.strokeStyle = '#FF9AA6';
    g.lineWidth = 2;
    g.stroke();
  }
  function kiroLie(g, w, h) {
    const y = h * 0.62;
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.beginPath(); g.ellipse(w * 0.48, h * 0.88, w * 0.4, 7, 0, 0, TAU); g.fill();
    g.fillStyle = '#1A2748';
    pathRound(g, w * 0.04, y - 2, w * 0.28, 9, 4); g.fill();
    pathRound(g, w * 0.06, y + 10, w * 0.26, 8, 4); g.fill();
    g.fillStyle = '#141C34';
    g.beginPath(); g.ellipse(w * 0.05, y + 2, 7, 5, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(w * 0.07, y + 14, 7, 5, 0, 0, TAU); g.fill();
    const body = g.createLinearGradient(w * 0.28, y - 24, w * 0.62, y + 16);
    body.addColorStop(0, '#4A62A0');
    body.addColorStop(1, '#1A2444');
    g.fillStyle = body;
    g.beginPath(); g.ellipse(w * 0.46, y + 2, w * 0.18, 18, 0, 0, TAU); g.fill();
    g.fillStyle = '#31457E';
    pathRound(g, w * 0.32, y + 12, w * 0.2, 8, 4); g.fill();
    g.fillStyle = '#F0C4A4';
    g.beginPath(); g.arc(w * 0.32, y + 16, 5, 0, TAU); g.fill();
    g.strokeStyle = '#E2283C';
    g.lineWidth = 6;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(w * 0.58, y);
    g.quadraticCurveTo(w * 0.66, y + 18, w * 0.52, y + 20);
    g.stroke();
    g.strokeStyle = '#FF9AA6';
    g.lineWidth = 2.2;
    g.stroke();
    head(g, w * 0.72, y - 8, 24, 'swirl');
  }
  function kiroSit(g, w, h) {
    const seat = h * 0.7;
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.beginPath(); g.ellipse(w * 0.5, h * 0.92, w * 0.4, 7, 0, 0, TAU); g.fill();
    g.fillStyle = '#3E558F';
    pathRound(g, w * 0.32, seat - 4, w * 0.58, 14, 7); g.fill();
    pathRound(g, w * 0.34, seat + 12, w * 0.52, 12, 6); g.fill();
    g.fillStyle = '#1A2748';
    g.beginPath(); g.ellipse(w * 0.9, seat + 3, 10, 7, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(w * 0.86, seat + 18, 10, 7, 0, 0, TAU); g.fill();
    const body = g.createLinearGradient(w * 0.16, h * 0.18, w * 0.5, seat);
    body.addColorStop(0, '#6E86C4');
    body.addColorStop(0.45, '#3A4E86');
    body.addColorStop(1, '#24325E');
    g.fillStyle = body;
    pathRound(g, w * 0.16, h * 0.28, 52, seat - h * 0.26, 16); g.fill();
    g.strokeStyle = 'rgba(220,230,255,0.55)';
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = '#3A4E86';
    pathRound(g, w * 0.32, h * 0.24, 18, h * 0.16, 8); g.fill();
    g.fillStyle = '#4A62A0';
    pathRound(g, w * 0.08, h * 0.48, 16, h * 0.2, 8); g.fill();
    g.fillStyle = '#F0C4A4';
    g.beginPath(); g.arc(w * 0.16, h * 0.68, 6, 0, TAU); g.fill();
    g.fillStyle = '#4A62A0';
    pathRound(g, w * 0.48, seat - 16, 16, 18, 8); g.fill();
    g.fillStyle = '#F0C4A4';
    g.beginPath(); g.arc(w * 0.56, seat, 6, 0, TAU); g.fill();
    head(g, w * 0.4, h * 0.22, 28, 'open');
    scarfKnot(g, w * 0.56, h * 0.36, 5);
    g.strokeStyle = '#E2283C';
    g.lineWidth = 5;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(w * 0.56, h * 0.38);
    g.quadraticCurveTo(w * 0.7, h * 0.5, w * 0.52, h * 0.6);
    g.stroke();
  }
  function tara(g, w, h, lean) {
    if (lean) { taraKneel(g, w, h); return; }
    const cx = w * 0.5;
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
    pathRound(g, cx + 8, cy + 18, 8, h * 0.16, 4);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.25)';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(cx - 2, cy - 4, w * 0.12, Math.PI * 1.2, Math.PI * 1.85);
    g.stroke();
  }
  function taraKneel(g, w, h) {
    g.fillStyle = 'rgba(0,0,0,0.26)';
    g.beginPath(); g.ellipse(w * 0.62, h * 0.9, w * 0.26, 7, 0, 0, TAU); g.fill();
    g.fillStyle = '#C47890';
    g.beginPath(); g.ellipse(w * 0.68, h * 0.82, 20, 11, 0.15, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(w * 0.52, h * 0.8, 16, 10, -0.1, 0, TAU); g.fill();
    const dress = g.createLinearGradient(w * 0.25, h * 0.32, w * 0.75, h * 0.82);
    dress.addColorStop(0, '#FFF4F6');
    dress.addColorStop(0.45, '#E7A0B4');
    dress.addColorStop(1, '#B85A78');
    g.fillStyle = dress;
    g.beginPath();
    g.moveTo(w * 0.38, h * 0.4);
    g.quadraticCurveTo(w * 0.72, h * 0.46, w * 0.66, h * 0.74);
    g.lineTo(w * 0.48, h * 0.78);
    g.quadraticCurveTo(w * 0.28, h * 0.58, w * 0.38, h * 0.4);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(w * 0.42, h * 0.46);
    g.quadraticCurveTo(w * 0.55, h * 0.6, w * 0.5, h * 0.72);
    g.stroke();
    g.strokeStyle = '#F0C4A4';
    g.lineWidth = 7;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(w * 0.55, h * 0.52);
    g.lineTo(w * 0.6, h * 0.72);
    g.stroke();
    g.beginPath();
    g.moveTo(w * 0.4, h * 0.46);
    g.quadraticCurveTo(w * 0.2, h * 0.56, w * 0.05, h * 0.6);
    g.stroke();
    g.fillStyle = '#F0C4A4';
    g.beginPath(); g.arc(w * 0.05, h * 0.61, 6, 0, TAU); g.fill();
    g.fillStyle = '#3A2218';
    g.beginPath();
    g.moveTo(w * 0.34, h * 0.3);
    g.quadraticCurveTo(w * 0.52, h * 0.36, w * 0.48, h * 0.58);
    g.quadraticCurveTo(w * 0.38, h * 0.46, w * 0.4, h * 0.32);
    g.fill();
    const skin = g.createRadialGradient(w * 0.3, h * 0.26, 2, w * 0.34, h * 0.32, 16);
    skin.addColorStop(0, '#FFE4C8');
    skin.addColorStop(1, '#E0B08A');
    g.fillStyle = skin;
    g.beginPath(); g.ellipse(w * 0.34, h * 0.3, 14, 13, 0, 0, TAU); g.fill();
    g.fillStyle = '#4A3024';
    g.beginPath(); g.ellipse(w * 0.34, h * 0.24, 14, 8, 0, Math.PI, 0, true); g.fill();
    g.fillStyle = '#3A2418';
    g.beginPath(); g.arc(w * 0.29, h * 0.3, 1.6, 0, TAU); g.arc(w * 0.36, h * 0.3, 1.6, 0, TAU); g.fill();
    g.strokeStyle = '#C46888';
    g.lineWidth = 1.4;
    g.beginPath(); g.arc(w * 0.32, h * 0.35, 3, 0.2, Math.PI - 0.25); g.stroke();
  }
  function stoneBlob(g, x, y, rw, rh, pal, alpha) {
    const grd = g.createRadialGradient(x - rw * 0.35, y - rh * 0.4, rw * 0.08, x + rw * 0.1, y + rh * 0.1, Math.max(rw, rh));
    grd.addColorStop(0, pal.stone);
    grd.addColorStop(0.55, pal.stoneDim);
    grd.addColorStop(1, pal.joint);
    g.globalAlpha = alpha;
    g.fillStyle = grd;
    g.beginPath();
    g.ellipse(x, y, rw, rh, 0, 0, TAU);
    g.fill();
    g.globalAlpha = alpha * 0.4;
    g.fillStyle = 'rgba(255,255,255,0.45)';
    g.beginPath();
    g.ellipse(x - rw * 0.28, y - rh * 0.28, rw * 0.28, rh * 0.18, -0.6, 0, TAU);
    g.fill();
  }
  function shaft(g, w, h, pal) {
    const rng = mulberry32(pal.sky.charCodeAt(1) * 97 + 13);
    const stones = [];
    for (let i = 0; i < 14; i++) {
      stones.push({
        x: 16 + rng() * (w - 32),
        y: rng() * h,
        rw: 28 + rng() * 36,
        rh: 14 + rng() * 14,
        a: 0.62 + rng() * 0.3
      });
    }
    for (const dy of [0, -h]) {
      for (const s of stones) stoneBlob(g, s.x, s.y + dy, s.rw, s.rh, pal, s.a);
    }
    g.globalAlpha = 1;
  }
  function wall(g, w, h, pal) {
    const base = g.createLinearGradient(0, 0, w, 0);
    base.addColorStop(0, pal.deep);
    base.addColorStop(0.4, pal.stoneDim);
    base.addColorStop(0.75, pal.stone);
    base.addColorStop(1, pal.joint);
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    const row = 36;
    const rows = Math.round(h / row);
    for (let r = 0; r < rows; r++) {
      const y = r * row;
      const shift = (r % 2) * 12;
      for (let x = -18 + shift; x < w; x += 26) {
        const face = g.createLinearGradient(x, y + 3, x + 20, y + row - 4);
        face.addColorStop(0, 'rgba(255,255,255,0.28)');
        face.addColorStop(0.4, pal.stone);
        face.addColorStop(1, 'rgba(0,0,0,0.4)');
        g.fillStyle = face;
        pathRound(g, x, y + 3, 22, row - 8, 5);
        g.fill();
      }
    }
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
      bg[name] = bake(330, 360, (g, w, h) => shaft(g, w, h, BIO[name]));
      walls[name] = bake(36, 180, (g, w, h) => wall(g, w, h, BIO[name]));
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
      kiro: bake(170, 220, kiroBarrel),
      kiroLoose: bake(112, 154, kiroLoose),
      kiroLie: bake(240, 110, kiroLie),
      kiroSit: bake(200, 160, kiroSit),
      tara: bake(100, 168, (g, w, h) => tara(g, w, h, false)),
      taraLean: bake(170, 200, (g, w, h) => tara(g, w, h, true)),
      katana: bake(40, 40, katana),
      barrelIcon: bake(36, 40, barrelIcon)
    };
  }
  root.KWBake = { build: build, BIO: BIO };
})(window);
