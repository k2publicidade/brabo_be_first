(() => {
  'use strict';
  // Includes iPads and landscape phones; no UA sniffing or playback permission needed.
  if (!matchMedia('(max-width: 820px), (pointer: coarse)').matches) return;
  const section = document.querySelector('.hero');
  const stage = section?.querySelector('.hero__stage');
  const poster = section?.querySelector('.story-film__poster');
  if (!stage || !poster) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const originalPoster = poster.src;
  const cache = new Map(), failed = new Set();
  let target = 0, displayed = -1, active = 0, scheduled = 0;
  section.classList.add('uses-frame-sequence');

  function schedule() {
    if (!scheduled && !document.hidden) scheduled = requestAnimationFrame(render);
  }
  function load(index) {
    if (cache.has(index) || failed.has(index) || active >= 4) return;
    const img = new Image();
    const entry = { img, ready: false };
    cache.set(index, entry);
    active++;
    img.onload = () => { active--; entry.ready = true; schedule(); };
    img.onerror = () => { active--; cache.delete(index); failed.add(index); schedule(); };
    img.src = `assets/story/mobile-frames/frame-${String(index).padStart(3, '0')}.jpg`;
  }
  function render() {
    scheduled = 0;
    if (document.hidden || motion.matches) return;
    const rect = section.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, section.offsetHeight - stage.offsetHeight)));
    target = Math.round(progress * 117);
    const current = cache.get(target);
    if (current?.ready && displayed !== target) {
      poster.src = current.img.src;
      displayed = target;
    }
    // Latest frame first. Small neighboring window bounds decoded memory on iPhones.
    for (const offset of [0, 1, -1, 2, -2, 3, -3, 4, -4]) {
      const index = target + offset;
      if (index >= 0 && index <= 117) load(index);
    }
    for (const [index, entry] of cache) {
      if (cache.size <= 18) break;
      if (entry.ready && Math.abs(index - target) > 4 && index !== displayed) cache.delete(index);
    }
  }
  function measure() {
    section.style.setProperty('--launch-stage-height', `${stage.offsetHeight}px`);
    schedule();
  }
  addEventListener('scroll', schedule, { passive: true });
  section.addEventListener('touchmove', schedule, { passive: true });
  section.addEventListener('touchend', schedule, { passive: true });
  addEventListener('resize', measure, { passive: true });
  addEventListener('pageshow', measure);
  addEventListener('online', () => { failed.clear(); schedule(); });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => {
    if (motion.matches) { poster.src = originalPoster; displayed = -1; }
    measure();
  });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(stage);
  measure();
})();
