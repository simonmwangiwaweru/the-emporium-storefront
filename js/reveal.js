// Scroll-triggered entrance animation ("fly in as it enters view").
// IntersectionObserver + a CSS class toggle — no libraries, no build step.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initScrollReveal(selector, { stagger = 40 } = {}) {
  const els = Array.from(document.querySelectorAll(selector));
  if (els.length === 0) return;

  if (prefersReducedMotion) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const index = els.indexOf(el);
        setTimeout(() => el.classList.add('is-visible'), (index % 12) * stagger);
        observer.unobserve(el);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  els.forEach((el) => {
    el.classList.add('reveal');
    observer.observe(el);
  });
}
