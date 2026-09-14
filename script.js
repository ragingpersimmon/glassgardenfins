// Little Fin Swim - minimal, restrained interaction only.
// Fades journal entries in as they enter view. No-ops entirely
// if the visitor has requested reduced motion.

(function () {
  var siteConfig =
    window.LITTLE_FIN_SWIM && window.LITTLE_FIN_SWIM.config
      ? window.LITTLE_FIN_SWIM.config
      : null;

  function injectSearchConsoleVerification() {
    if (
      !siteConfig ||
      !siteConfig.analytics ||
      !siteConfig.analytics.searchConsoleVerification
    ) {
      return;
    }

    if (
      document.querySelector('meta[name="google-site-verification"]')
    ) {
      return;
    }

    var verification = document.createElement('meta');
    verification.name = 'google-site-verification';
    verification.content = siteConfig.analytics.searchConsoleVerification;
    document.head.appendChild(verification);
  }

  function loadAnalytics() {
    if (!siteConfig || !siteConfig.analytics) return;

    if (siteConfig.analytics.googleAnalyticsId) {
      var gtagScript = document.createElement('script');
      gtagScript.async = true;
      gtagScript.src =
        'https://www.googletagmanager.com/gtag/js?id=' +
        encodeURIComponent(siteConfig.analytics.googleAnalyticsId);
      document.head.appendChild(gtagScript);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', siteConfig.analytics.googleAnalyticsId);
    }

    if (siteConfig.analytics.plausibleDomain) {
      var plausibleScript = document.createElement('script');
      plausibleScript.defer = true;
      plausibleScript.src = 'https://plausible.io/js/script.js';
      plausibleScript.setAttribute(
        'data-domain',
        siteConfig.analytics.plausibleDomain
      );
      document.head.appendChild(plausibleScript);
    }
  }

  function hydrateProductLinks() {
    if (!siteConfig || !siteConfig.products) return;

    var links = document.querySelectorAll('[data-product-link]');
    links.forEach(function (link) {
      var key = link.getAttribute('data-product-link');
      var product = siteConfig.products[key];
      if (!product) return;

      var href = product.affiliateUrl || product.url;
      if (!href) return;

      link.href = href;

      if (product.affiliateUrl) {
        link.rel = 'noopener noreferrer sponsored';
      }
    });
  }

  function hydrateDisclosureCopy() {
    if (!siteConfig || !siteConfig.monetization) return;

    var text = siteConfig.monetization.affiliateLinksActive
      ? siteConfig.monetization.affiliateDisclosure
      : siteConfig.monetization.directDisclosure;

    var targets = document.querySelectorAll('[data-disclosure-copy]');
    targets.forEach(function (target) {
      target.textContent = text;
    });
  }

  function focusHashTarget() {
    if (!window.location.hash) return;

    var target = document.getElementById(window.location.hash.slice(1));
    if (!target) return;

    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
    }

    window.requestAnimationFrame(function () {
      try {
        target.focus({ preventScroll: true });
      } catch (error) {
        target.focus();
      }
    });
  }

  var hasProductTargets = document.getElementById('shop');

  if (hasProductTargets) {
    focusHashTarget();
    window.addEventListener('hashchange', focusHashTarget);
  }

  injectSearchConsoleVerification();
  loadAnalytics();
  hydrateProductLinks();
  hydrateDisclosureCopy();

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