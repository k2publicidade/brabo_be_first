(() => {
  'use strict';
  if (matchMedia('(max-width: 820px), (pointer: coarse)').matches) return;
  const section = document.querySelector('.hero');
  const stage = section?.querySelector('.hero__stage');
  const film = document.getElementById('story-film');
  if (!section || !film) return;
  const source = film.querySelector('source');
  source.src = source.dataset.src;
  film.load();
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const FPS = 24;
  let scheduled = 0, requestedFrame = -1;
  let available = true;
  const clamp = value => Math.max(0, Math.min(1, value));

  film.autoplay = false;
  film.loop = false;
  film.muted = true;
  film.pause();
  film.addEventListener('play', () => film.pause());

  function reveal() {
    section.classList.toggle('has-story-video', available && !motion.matches && film.readyState >= 2);
  }
  function render() {
    scheduled = 0;
    if (!available || motion.matches || document.hidden) return;
    const rect = section.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    // Native scroll includes touch and momentum; stable stage height avoids URL-bar jumps.
    const progress = clamp(-rect.top / Math.max(1, section.offsetHeight - stage.offsetHeight));
    if (film.readyState < 1 || !Number.isFinite(film.duration) || film.duration <= 0 || film.seeking) return;
    const lastFrame = Math.max(0, Math.round(film.duration * FPS) - 1);
    const frame = Math.round(progress * lastFrame);
    if (frame === requestedFrame) return;
    try {
      film.currentTime = Math.min(frame / FPS, Math.max(0, film.duration - .001));
      requestedFrame = frame;
    } catch { requestedFrame = -1; }
  }
  function schedule() {
    if (!scheduled && !document.hidden) scheduled = requestAnimationFrame(render);
  }
  film.addEventListener('loadedmetadata', schedule);
  film.addEventListener('loadeddata', () => { reveal(); schedule(); });
  film.addEventListener('canplay', () => { reveal(); schedule(); });
  // Coalesce fast input; seek to the latest scroll position once decoding completes.
  film.addEventListener('seeked', () => { reveal(); schedule(); });
  film.addEventListener('error', () => { available = false; reveal(); });
  motion.addEventListener('change', () => {
    film.pause(); requestedFrame = -1; reveal(); schedule();
  });
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('pageshow', schedule);
  section.addEventListener('touchstart', schedule, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(() => {
    section.style.setProperty('--launch-stage-height', `${stage.offsetHeight}px`);
    schedule();
  }).observe(stage);
  document.addEventListener('visibilitychange', schedule);
  // Warm up before arrival, without preloading both films at initial load.
  if ('IntersectionObserver' in window) {
    const preload = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        film.preload = 'auto'; schedule(); preload.disconnect();
      }
    }, { rootMargin: '100% 0px' });
    preload.observe(section);
  }
  schedule();
})();
