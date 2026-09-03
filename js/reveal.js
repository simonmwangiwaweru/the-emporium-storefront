// Scroll-triggered entrance animation ("fly in as it enters view").
// IntersectionObserver + a CSS class toggle — no libraries, no build step.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initScrollReveal(selector, { stagger = 40 } = {}) {
  const els = Array.from(document.querySelectorAll(selector));
  if (els.length === 0) return;

  // Content must never depend on a motion API to be readable. Without an
  // observer (or with reduced motion), leave elements in their normal,
  // visible state rather than adding the class that starts them transparent.
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const index = els.indexOf(el);
        window.setTimeout(() => el.classList.add('is-visible'), (index % 12) * stagger);
        observer.unobserve(el);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  els.forEach((el) => {
    // Observe first. If setup ever fails, the element has not been hidden.
    observer.observe(el);
    el.classList.add('reveal');
  });
}
