// Little Fin Swim - minimal, restrained interaction only.

(function () {
  var tagMeta = document.querySelector('meta[name="amazon-associate-tag"]');
  var tag = tagMeta ? (tagMeta.getAttribute('content') || '').trim() : '';

  if (!/^[a-z0-9-]{1,64}$/i.test(tag)) return;

  var links = document.querySelectorAll('a[data-amazon-link]');
  Array.prototype.forEach.call(links, function (link) {
    try {
      var url = new URL(link.href);
      if (url.hostname !== 'www.amazon.com' && url.hostname !== 'amazon.com') return;

      url.searchParams.set('tag', tag);
      link.href = url.toString();
      link.relList.add('sponsored');
    } catch (error) {
      return;
    }
  });

  var disclosure = document.querySelector('[data-affiliate-disclosure]');
  if (disclosure) disclosure.hidden = false;
})();

(function () {
  var canMatchMedia = typeof window.matchMedia === 'function';
  var prefersReducedMotion = canMatchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  var entries = document.querySelectorAll('.entry');
  if (!entries || !entries.length) return;

  var forEach = Array.prototype.forEach;

  if (prefersReducedMotion || typeof window.IntersectionObserver !== 'function') {
    forEach.call(entries, function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.transition = 'none';
    });
    return;
  }

  forEach.call(entries, function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(14px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  });

  var observer = new IntersectionObserver(
    function (records) {
      forEach.call(records, function (record) {
        if (record && record.isIntersecting && record.target) {
          record.target.style.opacity = '1';
          record.target.style.transform = 'translateY(0)';
          observer.unobserve(record.target);
        }
      });
    },
    { threshold: 0, rootMargin: '0px 0px -40px 0px' }
  );

  forEach.call(entries, function (el) {
    observer.observe(el);
  });
})();
