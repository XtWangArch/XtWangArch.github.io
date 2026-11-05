(function () {
  window.portfolioUI.revealDetails = function (selector) {
    const targets = Array.from(document.querySelectorAll(selector));
    if (!targets.length) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches || !('IntersectionObserver' in window)) return;
    targets.forEach(target => target.setAttribute('data-detail-reveal', ''));
    let queuedUntil = 0;
    const show = (target, delay = 0) => {
      target.style.setProperty('--detail-reveal-delay', `${delay}ms`);
      target.classList.add('is-visible');
      observer.unobserve(target);
    };
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) =>
        a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
      const now = performance.now();
      visible.forEach((entry, index) => {
        const delay = Math.max(0, queuedUntil - now) + index * 75;
        show(entry.target, delay);
      });
      if (visible.length) queuedUntil = Math.max(now, queuedUntil) + visible.length * 75;
    }, { rootMargin: '0px 0px -4% 0px', threshold: 0.01 });
    targets.forEach(target => observer.observe(target));
    document.addEventListener('focusin', event => {
      const target = event.target.closest('[data-detail-reveal]');
      if (target) show(target);
    });
    preference.addEventListener('change', event => {
      if (!event.matches) return;
      targets.forEach(target => show(target));
      observer.disconnect();
    });
  };
})();
