// Glass Garden Fins - minimal, restrained interaction only.

(function () {
  if (window.top === window.self) return;

  try {
    window.top.location = window.self.location;
  } catch (error) {
    document.documentElement.style.display = 'none';
  }
})();

(function () {
  var tagMeta = document.querySelector('meta[name="amazon-associate-tag"]');
  var tag = tagMeta ? (tagMeta.getAttribute('content') || '').trim() : '';

  if (!/^[a-z0-9-]{1,64}$/i.test(tag)) return;

  var links = document.querySelectorAll('a[data-amazon-link]');
  Array.prototype.forEach.call(links, function (link) {
    try {
      var url = new URL(link.href);
      var allowedHosts = ['www.amazon.com', 'amazon.com', 'www.amazon.ca', 'amazon.ca'];
      if (allowedHosts.indexOf(url.hostname) === -1) return;

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

(function () {
  var montage = document.querySelector('[data-hero-montage]');
  if (!montage) return;

  var clips = montage.querySelectorAll('[data-hero-clip]');
  var toggle = montage.matches('[data-hero-toggle]')
    ? montage
    : montage.querySelector('[data-hero-toggle]');
  var prefersReducedMotion = typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var activeIndex = 0;
  var timer = null;
  var userPaused = false;

  function pauseClips() {
    Array.prototype.forEach.call(clips, function (clip) {
      clip.pause();
    });
  }

  function playClip(clip, restart) {
    if (restart) clip.currentTime = 0;
    var attempt = clip.play();
    return attempt && typeof attempt.catch === 'function'
      ? attempt.then(function () { return true; }).catch(function () { return false; })
      : Promise.resolve(true);
  }

  function showClip(index) {
    var previousClip = clips[activeIndex];
    var nextClip = clips[index];
    playClip(nextClip, true);
    Array.prototype.forEach.call(clips, function (clip, clipIndex) {
      var active = clipIndex === index;
      clip.classList.toggle('is-active', active);
      clip.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    activeIndex = index;
    window.setTimeout(function () {
      if (!previousClip.classList.contains('is-active')) previousClip.pause();
    }, 1600);
  }

  function startTimer() {
    window.clearInterval(timer);
    if (clips.length < 2) return;
    timer = window.setInterval(function () {
      showClip((activeIndex + 1) % clips.length);
    }, 8000);
  }

  function setPaused(paused) {
    userPaused = paused;
    toggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
    toggle.setAttribute(
      'aria-label',
      paused ? 'Play tank video montage' : 'Pause tank video montage'
    );
    if (paused) {
      window.clearInterval(timer);
      pauseClips();
      return;
    }
    playClip(clips[activeIndex], false).then(function (playing) {
      if (playing) startTimer();
    });
  }

  if (!clips.length || !toggle) {
    pauseClips();
    return;
  }

  toggle.addEventListener('click', function () {
    setPaused(!userPaused);
  });
  toggle.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setPaused(!userPaused);
  });

  if (prefersReducedMotion) {
    setPaused(true);
    return;
  }

  playClip(clips[activeIndex], false).then(function (playing) {
    toggle.hidden = false;
    if (playing) {
      startTimer();
    } else {
      setPaused(true);
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      window.clearInterval(timer);
      pauseClips();
    } else if (!userPaused) {
      playClip(clips[activeIndex], false).then(function (playing) {
        if (playing) startTimer();
      });
    }
  });
})();
