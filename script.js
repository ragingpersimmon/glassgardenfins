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
    if (video.dataset.userPaused === 'true') return;
    var attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(function () {});
    }
  }

  function updateToggle(video) {
    if (!video._playbackToggle) return;
    var paused = video.paused;
    var label = video.getAttribute('aria-label') || 'video';
    video._playbackToggle.textContent = paused ? 'Play video' : 'Pause video';
    video._playbackToggle.setAttribute(
      'aria-label',
      (paused ? 'Play ' : 'Pause ') + label
    );
    video._playbackToggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
  }

  Array.prototype.forEach.call(videos, function (video) {
    if (video.hasAttribute('data-hero-clip')) return;
    var button = document.createElement('button');
    var host = document.createElement('div');
    button.type = 'button';
    button.className = 'video-playback-toggle';
    host.className = 'video-control-host';
    video.parentElement.insertBefore(host, video);
    host.appendChild(video);
    host.appendChild(button);
    video._playbackToggle = button;
    button.addEventListener('click', function () {
      if (video.paused) {
        video.dataset.userPaused = 'false';
        load(video);
        play(video);
      } else {
        video.dataset.userPaused = 'true';
        video.pause();
      }
    });
    video.addEventListener('play', function () { updateToggle(video); });
    video.addEventListener('pause', function () { updateToggle(video); });
    updateToggle(video);
  });

  if (reducedMotion) {
    Array.prototype.forEach.call(videos, function (video) {
      video.autoplay = false;
      video.pause();
      updateToggle(video);
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
      updateToggle(video);
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
