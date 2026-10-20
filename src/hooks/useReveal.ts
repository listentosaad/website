import { useEffect } from 'react';

const EASE = 'cubic-bezier(.2,.7,.2,1)';

/**
 * Children of every `[data-reveal]` box slide up once when they enter the
 * viewport, staggered 80ms apart, then stay visible.
 */
export function useReveal() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !window.IntersectionObserver) return;

    const show = (el: HTMLElement) => { el.style.opacity = '1'; el.style.transform = 'none'; };
    const kids: HTMLElement[] = [];
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(box => {
      [...box.children].forEach((child, j) => {
        const el = child as HTMLElement;
        el.style.opacity = '0';
        el.style.transform = 'translateY(28px)';
        el.style.transition = `opacity .8s ${EASE} ${j * 80}ms, transform .8s ${EASE} ${j * 80}ms`;
        kids.push(el);
      });
    });

    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { show(e.target as HTMLElement); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    kids.forEach(el => io.observe(el));

    const timer = window.setTimeout(() => kids.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) show(el);
    }), 100);

    return () => {
      clearTimeout(timer);
      io.disconnect();
      kids.forEach(el => { el.style.opacity = ''; el.style.transform = ''; el.style.transition = ''; });
    };
  }, []);
}
