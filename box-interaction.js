(() => {
  'use strict';
  const stage = document.querySelector('.manifesto__sticky');
  const product = stage?.querySelector('.product');
  if (!product) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const clamp = value => Math.max(-1, Math.min(1, value));
  let x = 0, y = 0, strength = 0;
  let targetX = 0, targetY = 0;
  let tracking = false, frame = 0, lastTime = 0;
  let visible = true;

  function paint() {
    const values = {
      '--pointer-x': `${(x * 12).toFixed(3)}px`,
      '--pointer-y': `${(y * 8).toFixed(3)}px`,
      '--pointer-rx': `${(-y * 14).toFixed(3)}deg`,
      '--pointer-ry': `${(x * 22).toFixed(3)}deg`,
      '--light-x': `${(78 + (x * 36 - 28) * strength).toFixed(3)}%`,
      '--light-y': `${(15 + (y * 36 + 35) * strength).toFixed(3)}%`,
      '--light-alpha': (.06 + strength * .13).toFixed(3),
      '--floor-x': `${(-x * 22).toFixed(3)}px`
    };
    for (const [name, value] of Object.entries(values)) product.style.setProperty(name, value);
  }

  function render(time) {
    frame = 0;
    if (tracking) {
      // No easing queue under the cursor: use the latest coordinates each frame.
      x = targetX;
      y = targetY;
      strength = 1;
    } else {
      // Time-based damping only on exit, consistent at 60/120/144 Hz.
      const dt = Math.min(64, Math.max(0, time - lastTime));
      const decay = Math.exp(-dt / 100);
      x *= decay;
      y *= decay;
      strength *= decay;
      if (Math.max(Math.abs(x), Math.abs(y), strength) < .001) {
        x = y = strength = 0;
        stage.classList.remove('is-pointer-active');
      }
    }
    lastTime = time;
    paint();
    if (!tracking && strength > 0) schedule();
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  function reset(immediate = false) {
    tracking = false;
    targetX = targetY = 0;
    lastTime = performance.now();
    if (immediate) {
      cancelAnimationFrame(frame);
      frame = 0;
      x = y = strength = 0;
      stage.classList.remove('is-pointer-active');
      paint();
    } else if (strength > 0 || frame) schedule();
  }

  function move(event) {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    if (reducedMotion.matches || !finePointer.matches || document.hidden || !visible) return;
    // Measure the stationary stage, never the rotating card (avoids feedback jitter).
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    targetX = clamp((event.clientX - rect.left) / rect.width * 2 - 1);
    targetY = clamp((event.clientY - rect.top) / rect.height * 2 - 1);
    tracking = true;
    stage.classList.add('is-pointer-active');
    schedule();
  }

  stage.addEventListener('pointermove', move, { passive: true });
  stage.addEventListener('pointerleave', () => reset());
  stage.addEventListener('pointercancel', () => reset());
  addEventListener('blur', () => reset(true));
  addEventListener('resize', () => reset(true), { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(true); });
  reducedMotion.addEventListener('change', () => reset(true));
  finePointer.addEventListener('change', () => reset(true));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) reset(true);
    }).observe(stage);
  }
})();
