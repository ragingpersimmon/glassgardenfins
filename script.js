// Glass Garden Fins - minimal, restrained interaction only.

(function () {
  var videos = document.querySelectorAll('video[data-lazy-video]');
  if (!videos.length) return;

  var reducedMotion = typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function load(video) {
    var source = video.querySelector('source[data-src]');
    if (!source) return;
    source.src = source.getAttribute('data-src');
    source.removeAttribute('data-src');
    video.load();
  }

  function play(video) {
    var attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(function () {});
    }
  }

  if (reducedMotion) {
    Array.prototype.forEach.call(videos, function (video) {
      video.autoplay = false;
      video.pause();
    });
    return;
  }

  if (typeof window.IntersectionObserver !== 'function') {
    Array.prototype.forEach.call(videos, function (video) {
      load(video);
      play(video);
    });
    return;
  }

  var observer = new IntersectionObserver(function (records) {
    Array.prototype.forEach.call(records, function (record) {
      var video = record.target;
      if (record.isIntersecting) {
        load(video);
        play(video);
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.05 });

  Array.prototype.forEach.call(videos, function (video) {
    observer.observe(video);
  });
})();

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
    var source = clip.querySelector('source[data-src]');
    if (source) {
      source.src = source.getAttribute('data-src');
      source.removeAttribute('data-src');
      clip.load();
    }
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
  toggle.hidden = false;

  if (prefersReducedMotion) {
    setPaused(true);
    return;
  }

  playClip(clips[activeIndex], false).then(function (playing) {
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

(function () {
  var timestamps = document.querySelectorAll('[data-site-updated]');
  if (!timestamps.length) return;

  function renderTimestamp(updated) {
    if (Number.isNaN(updated.getTime())) return;

    var parts = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZoneName: 'short'
    }).formatToParts(updated).reduce(function (values, part) {
      values[part.type] = part.value;
      return values;
    }, {});
    var label = parts.year + '-' + parts.month + '-' + parts.day +
      ' ' + parts.hour + ':' + parts.minute + ' ' + parts.timeZoneName;

    Array.prototype.forEach.call(timestamps, function (timestamp) {
      timestamp.dateTime = updated.toISOString();
      timestamp.textContent = 'Updated ' + label;
    });
  }

  renderTimestamp(new Date(document.lastModified));

  if (!window.fetch || window.location.protocol === 'file:') return;
  window.fetch(window.location.href, { method: 'HEAD' }).then(function (response) {
    var lastModified = response.headers.get('Last-Modified');
    if (lastModified) renderTimestamp(new Date(lastModified));
  }).catch(function (error) {
    console.warn('Unable to refresh the site update timestamp.', error);
  });
})();
