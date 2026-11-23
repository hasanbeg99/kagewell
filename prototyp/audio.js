/* Kagewell prototyp — one mapping table. No sound before the first pointer. */
(function (root) {
  'use strict';
  const LOOP_END = {
    music_calm_loop: 76.8, music_mid_loop: 76.8, music_fast_loop: 71.111,
    ambience_well_loop: 24.0, meadow_ambience_loop: 24.0, rope_cutting_loop: 1.5
  };
  const AUDIO_MAP = {
    music_calm: { file: 'music_calm_loop', vol: 0.50, loop: true },
    music_mid: { file: 'music_mid_loop', vol: 0.50, loop: true },
    music_fast: { file: 'music_fast_loop', vol: 0.50, loop: true },
    ambience_well: { file: 'ambience_well_loop', vol: 0.60, loop: true },
    ambience_meadow: { file: 'meadow_ambience_loop', vol: 0.45, loop: true },
    ui_click: { file: 'ui_click', vol: 0.50 },
    ui_confirm: { file: 'ui_confirm', vol: 0.60 },
    portal_enter: { file: 'portal_enter', vol: 0.75 },
    score_pickup: { file: 'score_pickup', vol: 0.45 },
    sword_slash: { file: 'sword_slash', vol: 0.90, jitter: true },
    enemy_hit: { file: 'enemy_hit', vol: 0.85 },
    enemy_death: { file: 'enemy_death', vol: 0.80 },
    barrel_break: { file: 'barrel_break', vol: 0.88 },
    barrel_pickup: { file: 'barrel_pickup', vol: 0.70 },
    barrel_swing: { files: ['barrel_swing_1', 'barrel_swing_2', 'barrel_swing_3'], vol: 0.65 },
    barrel_land: { files: ['wall_landing_1', 'wall_landing_2'], vol: 0.80 },
    player_hit: { file: 'player_hit', vol: 0.90 },
    rope_snap: { file: 'rope_snap', vol: 0.85 },
    tara_wake: { file: 'tara_wake', vol: 0.75 },
    rope_creak: { file: 'rope_creak', vol: 0.40 },
    rope_retract: { file: 'rope_retract', vol: 0.50 },
    rope_extend: { file: 'rope_extend', vol: 0.50 },
    rope_cutting: { file: 'rope_cutting_loop', vol: 0.55, loop: true },
    warning: { file: 'warning', vol: 0.42 },
    swipe: { file: 'swipe', vol: 0.65 },
    new_highscore: { file: 'new_highscore', vol: 0.80 }
  };
  const exts = [];
  const A = {
    ctx: null, master: null, music: null, unlocked: false, muted: false,
    buf: {}, loops: {}, musicName: null, wantMusic: 'music_calm', musicVol: 0.5,
    last: {}, chainStep: 0, rng: Math.random
  };
  function pickExt() {
    if (exts.length) return;
    const a = document.createElement('audio');
    const can = t => { try { return !!a.canPlayType(t); } catch (e) { return false; } };
    if (can('audio/ogg; codecs="vorbis"') || can('audio/ogg')) exts.push('ogg');
    if (can('audio/mp4; codecs="mp4a.40.2"') || can('audio/mp4')) exts.push('m4a');
    if (can('audio/mpeg')) exts.push('mp3');
    if (!exts.length) exts.push('ogg', 'm4a');
  }
  function url(name) {
    pickExt();
    return exts.map(e => '../audio/' + name + '.' + e);
  }
  async function fetchBuf(name) {
    if (A.buf[name] || !A.ctx) return;
    for (const u of url(name)) {
      try {
        const r = await fetch(u);
        if (!r.ok) continue;
        const ab = await r.arrayBuffer();
        A.buf[name] = await A.ctx.decodeAudioData(ab.slice(0));
        return;
      } catch (e) { /* next format */ }
    }
  }
  function ensure() {
    if (A.ctx) return;
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return;
    A.ctx = new AC();
    A.master = A.ctx.createGain();
    A.master.gain.value = A.muted ? 0 : 1;
    A.master.connect(A.ctx.destination);
    A.music = A.ctx.createGain();
    A.music.gain.value = 1;
    A.music.connect(A.master);
  }
  function unlock() {
    ensure();
    if (!A.ctx) return;
    if (A.ctx.state !== 'running') A.ctx.resume().catch(() => {});
    A.unlocked = true;
    const first = ['ui_confirm', 'portal_enter', 'sword_slash', 'music_calm_loop', 'ambience_well_loop', 'score_pickup', 'barrel_break', 'player_hit', 'tara_wake', 'meadow_ambience_loop', 'barrel_swing_1', 'wall_landing_1'];
    (async () => { for (const name of first) await fetchBuf(name); })();
  }
  function fileOf(key) {
    const m = AUDIO_MAP[key];
    if (!m) return null;
    if (m.files) return m.files[(A.rng() * m.files.length) | 0];
    return m.file;
  }
  function rateFor(key, semi) {
    const m = AUDIO_MAP[key] || {};
    let r = 1;
    if (m.jitter) r *= 0.94 + A.rng() * 0.12;
    if (semi) r *= Math.pow(2, semi / 12);
    return r;
  }
  function play(key, opt) {
    opt = opt || {};
    if (!A.unlocked || !A.ctx || !AUDIO_MAP[key]) return;
    const file = opt.file || fileOf(key);
    const buf = A.buf[file];
    if (!buf) { fetchBuf(file); return; }
    const src = A.ctx.createBufferSource();
    const g = A.ctx.createGain();
    src.buffer = buf;
    src.playbackRate.value = opt.rate || rateFor(key, opt.semi || 0);
    g.gain.value = (opt.vol != null ? opt.vol : AUDIO_MAP[key].vol);
    src.connect(g).connect(opt.music ? A.music : A.master);
    src.start();
  }
  function loop(key, on, vol) {
    if (!A.ctx) return;
    const m = AUDIO_MAP[key];
    if (!m) return;
    const file = m.file;
    const cur = A.loops[key];
    if (!on) {
      if (!cur) return;
      const t = A.ctx.currentTime;
      cur.g.gain.cancelScheduledValues(t);
      cur.g.gain.setValueAtTime(cur.g.gain.value, t);
      cur.g.gain.linearRampToValueAtTime(0, t + 0.12);
      try { cur.s.stop(t + 0.15); } catch (e) {}
      delete A.loops[key];
      return;
    }
    if (cur || !A.buf[file]) { if (!A.buf[file]) fetchBuf(file); return; }
    const src = A.ctx.createBufferSource();
    const g = A.ctx.createGain();
    src.buffer = A.buf[file];
    src.loop = true; src.loopStart = 0;
    src.loopEnd = Math.min(LOOP_END[file] || A.buf[file].duration, A.buf[file].duration);
    g.gain.value = 0;
    src.connect(g).connect(key.indexOf('music') === 0 ? A.music : A.master);
    src.start();
    const t = A.ctx.currentTime;
    g.gain.linearRampToValueAtTime(vol != null ? vol : m.vol, t + 0.2);
    A.loops[key] = { s: src, g: g };
  }
  function setMusic(name) {
    A.wantMusic = name;
    if (!A.unlocked || !A.ctx) return;
    if (A.musicName === name) return;
    const m = AUDIO_MAP[name];
    if (!m) return;
    if (!A.buf[m.file]) { fetchBuf(m.file).then(() => { if (A.wantMusic === name) setMusic(name); }); return; }
    const t = A.ctx.currentTime, X = 1.8;
    const src = A.ctx.createBufferSource();
    const g = A.ctx.createGain();
    src.buffer = A.buf[m.file];
    src.loop = true; src.loopStart = 0;
    src.loopEnd = Math.min(LOOP_END[m.file] || A.buf[m.file].duration, A.buf[m.file].duration);
    g.gain.value = 0;
    src.connect(g).connect(A.music);
    src.start();
    g.gain.linearRampToValueAtTime(m.vol * A.musicVol, t + (A.musicName ? X : 0.6));
    if (A.loops.music) {
      A.loops.music.g.gain.cancelScheduledValues(t);
      A.loops.music.g.gain.setValueAtTime(A.loops.music.g.gain.value, t);
      A.loops.music.g.gain.linearRampToValueAtTime(0, t + X);
      try { A.loops.music.s.stop(t + X + 0.05); } catch (e) {}
    }
    A.loops.music = { s: src, g: g };
    A.musicName = name;
  }
  function duckMusic(mul, sec) {
    if (!A.music || !A.ctx) return;
    const t = A.ctx.currentTime;
    A.music.gain.cancelScheduledValues(t);
    A.music.gain.setValueAtTime(A.music.gain.value, t);
    A.music.gain.linearRampToValueAtTime(mul, t + (sec || 0.8));
  }
  function setMuted(m) {
    A.muted = !!m;
    if (!A.master || !A.ctx) return;
    const t = A.ctx.currentTime;
    A.master.gain.cancelScheduledValues(t);
    A.master.gain.setValueAtTime(A.master.gain.value, t);
    A.master.gain.linearRampToValueAtTime(A.muted ? 0 : 1, t + 0.05);
  }
  function creakOk() {
    const n = performance.now();
    if (n - (A.last.creak || 0) < 1400) return false;
    A.last.creak = n; return true;
  }
  root.KWAudio = {
    MAP: AUDIO_MAP, unlock: unlock, play: play, loop: loop, setMusic: setMusic,
    duckMusic: duckMusic, setMuted: setMuted, creakOk: creakOk,
    prefetch: function (names) { names.forEach(fetchBuf); },
    setRng: function (fn) { A.rng = fn; },
    get unlocked() { return A.unlocked; },
    get muted() { return A.muted; }
  };
})(window);
