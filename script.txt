// Little Fin Swim - minimal, restrained interaction only.
// Fades journal entries in as they enter view. No-ops entirely
// if the visitor has requested reduced motion.

(function () {
  var prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  var entries = document.querySelectorAll('.entry');
  if (!entries.length) return;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    entries.forEach(function (el) {
      el.style.opacity = '1';
    });
    return;
  }

  entries.forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(14px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  });

  var observer = new IntersectionObserver(
    function (records) {
      records.forEach(function (record) {
        if (record.isIntersecting) {
          record.target.style.opacity = '1';
          record.target.style.transform = 'translateY(0)';
          observer.unobserve(record.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  entries.forEach(function (el) {
    observer.observe(el);
  });
})();