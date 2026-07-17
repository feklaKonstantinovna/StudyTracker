export function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[523,0],[659,.15],[784,.3],[1047,.45]].forEach(([f,d]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = f; o.type = 'sine';
      g.gain.setValueAtTime(.3, ctx.currentTime + d);
      g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + d + .3);
      o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + .35);
    });
  } catch {}
}
