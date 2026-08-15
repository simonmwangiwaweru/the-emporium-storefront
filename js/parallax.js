// Lightweight scroll-parallax for the gallery tiles.
// Plain CSS transforms + requestAnimationFrame — no libraries, no build step.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initParallax() {
  if (prefersReducedMotion) return;

  const galleryImgs = Array.from(document.querySelectorAll('.gallery-tile img'));
  if (galleryImgs.length === 0) return;

  let ticking = false;

  function update() {
    ticking = false;
    const viewportH = window.innerHeight;

    galleryImgs.forEach((img) => {
      const rect = img.getBoundingClientRect();
      const centerDelta = rect.top + rect.height / 2 - viewportH / 2;
      // Small drift proportional to distance from viewport center.
      const offset = Math.max(-16, Math.min(16, centerDelta * 0.06));
      img.style.transform = `translateY(${offset}px) scale(1.15)`;
    });
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}
