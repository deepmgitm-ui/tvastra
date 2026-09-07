(function () {
  'use strict';

  var GALLERY_SELECTOR = '.main-product-page .product-gallery';
  var boundGalleries = new WeakSet();
  var boundSwipers = new WeakSet();
  var preparedIframes = new WeakSet();
  var swipeGuardInstalled = false;
  var swipeGesture = null;

  function getMainElement(gallery) {
    return gallery && gallery.querySelector('.product-image-main');
  }

  function getThumbElement(gallery) {
    return gallery && gallery.querySelector('.product-image-thumb');
  }

  function getMainSwiper(gallery) {
    var element = getMainElement(gallery);
    return element && element.swiper;
  }

  function getMediaKey(slide) {
    var mediaId = slide && slide.getAttribute('data-media-id');
    return mediaId ? mediaId.replace(/-(?:main|thumb)$/, '') : '';
  }

  function getSlides(gallery) {
    var main = getMainElement(gallery);
    return main
      ? Array.prototype.slice.call(main.querySelectorAll('.swiper-wrapper > .swiper-slide')).filter(function (slide) {
          return !slide.classList.contains('swiper-slide-duplicate');
        })
      : [];
  }

  function getActiveSlide(gallery) {
    var main = getMainElement(gallery);
    var swiper = getMainSwiper(gallery);
    var slides = getSlides(gallery);

    if (!main || !slides.length) return null;

    return main.querySelector('.swiper-wrapper > .swiper-slide-active') ||
      slides[(swiper && typeof swiper.activeIndex === 'number') ? swiper.activeIndex : 0] ||
      slides[0];
  }

  function setActiveThumb(gallery, activeSlide) {
    var activeKey = getMediaKey(activeSlide);
    var thumbElement = getThumbElement(gallery);
    var thumbSwiper = thumbElement && thumbElement.swiper;
    var activeThumbIndex = -1;

    if (!thumbElement || !activeKey) return;

    thumbElement.querySelectorAll('.swiper-wrapper > .swiper-slide').forEach(function (thumb, index) {
      var isActive = getMediaKey(thumb) === activeKey;
      thumb.classList.toggle('swiper-slide-thumb-active', isActive);
      thumb.classList.toggle('is-active', isActive);
      thumb.setAttribute('aria-current', isActive ? 'true' : 'false');
      if (isActive) activeThumbIndex = index;
    });

    if (thumbSwiper && activeThumbIndex >= 0) {
      if (typeof thumbSwiper.slideTo === 'function') thumbSwiper.slideTo(activeThumbIndex, 180);
      if (typeof thumbSwiper.update === 'function') thumbSwiper.update();
    }
  }

  function prepareLocalVideo(video) {
    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('muted', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
  }

  function setLocalVideoState(video, shouldPlay) {
    prepareLocalVideo(video);

    if (!shouldPlay) {
      try { video.pause(); } catch (error) {}
      return;
    }

    var promise;
    try { promise = video.play(); } catch (error) { return; }
    if (promise && typeof promise.catch === 'function') promise.catch(function () {});
  }

  function getExternalPlayer(media) {
    var playerHost = media && media.querySelector('[id^="video-"]');
    return (playerHost && playerHost.plyrInstance) || (media && media.plyrInstance) || null;
  }

  function prepareExternalIframe(iframe) {
    var source;

    if (!iframe || preparedIframes.has(iframe)) return;
    preparedIframes.add(iframe);
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    iframe.setAttribute('playsinline', '');

    try {
      source = new URL(iframe.src, window.location.href);
      if (/youtube(?:-nocookie)?\.com$/i.test(source.hostname)) {
        source.searchParams.set('enablejsapi', '1');
        source.searchParams.set('playsinline', '1');
      }
      if (/vimeo\.com$/i.test(source.hostname)) {
        source.searchParams.set('api', '1');
        source.searchParams.set('muted', '1');
      }
      if (source.toString() !== iframe.src) iframe.src = source.toString();
    } catch (error) {}
  }

  function postExternalCommand(iframe, shouldPlay) {
    if (!iframe || !iframe.contentWindow) return;

    if (/youtube/i.test(iframe.src)) {
      iframe.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: shouldPlay ? 'playVideo' : 'pauseVideo',
        args: []
      }), '*');
    } else if (/vimeo/i.test(iframe.src)) {
      iframe.contentWindow.postMessage({ method: shouldPlay ? 'play' : 'pause' }, '*');
    }
  }

  function setExternalVideoState(media, shouldPlay) {
    var player = getExternalPlayer(media);
    var iframe = media.querySelector('iframe');

    if (player) {
      try {
        player.muted = true;
        player.volume = 0;
        if (shouldPlay) {
          var promise = player.play();
          if (promise && typeof promise.catch === 'function') promise.catch(function () {});
        } else {
          player.pause();
        }
      } catch (error) {}
      return;
    }

    if (!iframe) return;
    prepareExternalIframe(iframe);
    postExternalCommand(iframe, shouldPlay);
    if (shouldPlay) {
      window.setTimeout(function () {
        postExternalCommand(iframe, true);
      }, 350);
    }
  }

  function syncMedia(gallery) {
    var activeSlide = getActiveSlide(gallery);
    var main = getMainElement(gallery);

    if (!activeSlide || !main) return;

    main.querySelectorAll('.swiper-wrapper > .swiper-slide').forEach(function (slide) {
      var isActive = slide === activeSlide;
      slide.querySelectorAll('video').forEach(function (video) {
        setLocalVideoState(video, isActive);
      });
      slide.querySelectorAll('.media-video').forEach(function (media) {
        if (media.querySelector('iframe')) setExternalVideoState(media, isActive);
      });
    });

    setActiveThumb(gallery, activeSlide);
  }

  function scheduleSync(gallery, delay) {
    window.setTimeout(function () {
      syncMedia(gallery);
    }, delay || 0);
  }

  function createFallbackSwiper(gallery) {
    var mainElement = getMainElement(gallery);
    var thumbElement = getThumbElement(gallery);
    var thumbSwiper;
    var options;

    if (!mainElement || mainElement.swiper || typeof window.Swiper !== 'function') {
      return getMainSwiper(gallery);
    }

    if (thumbElement) {
      thumbSwiper = thumbElement.swiper || new window.Swiper(thumbElement, {
        slidesPerView: 'auto',
        spaceBetween: 10,
        freeMode: { enabled: true, sticky: false },
        watchSlidesProgress: true,
        resistanceRatio: 0.7
      });
    }

    options = {
      slidesPerView: 1,
      spaceBetween: 10,
      speed: 260,
      loop: false,
      autoHeight: false,
      watchOverflow: true,
      observer: true,
      observeParents: true,
      threshold: 5,
      resistanceRatio: 0.7,
      navigation: {
        nextEl: mainElement.querySelector('.swiper-button-next'),
        prevEl: mainElement.querySelector('.swiper-button-prev')
      }
    };

    if (thumbSwiper) options.thumbs = { swiper: thumbSwiper };
    return new window.Swiper(mainElement, options);
  }

  function bindSwiper(gallery, swiper) {
    if (!swiper || boundSwipers.has(swiper)) return;
    boundSwipers.add(swiper);

    ['slideChange', 'slideChangeTransitionEnd', 'transitionEnd', 'resize', 'observerUpdate'].forEach(function (eventName) {
      swiper.on(eventName, function () {
        scheduleSync(gallery, eventName === 'slideChange' ? 20 : 0);
      });
    });

    if (typeof swiper.update === 'function') swiper.update();
    syncMedia(gallery);
  }

  function waitForSwiper(gallery, attempt) {
    var swiper = getMainSwiper(gallery);

    if (!swiper && attempt >= 12) {
      swiper = createFallbackSwiper(gallery);
    }

    if (swiper) {
      bindSwiper(gallery, swiper);
      return;
    }

    if (attempt < 30) {
      window.setTimeout(function () {
        waitForSwiper(gallery, attempt + 1);
      }, 100);
    }
  }

  function slideToMedia(gallery, thumb) {
    var mediaKey = getMediaKey(thumb);
    var slides = getSlides(gallery);
    var targetIndex = slides.findIndex(function (slide) {
      return getMediaKey(slide) === mediaKey;
    });
    var swiper = getMainSwiper(gallery) || createFallbackSwiper(gallery);

    if (targetIndex < 0) return;

    if (swiper) {
      if (typeof swiper.update === 'function') swiper.update();
      if (swiper.params && swiper.params.loop && typeof swiper.slideToLoop === 'function') {
        swiper.slideToLoop(targetIndex, 260);
      } else {
        swiper.slideTo(targetIndex, 260);
      }
      scheduleSync(gallery, 280);
      return;
    }

    slides.forEach(function (slide, index) {
      var isActive = index === targetIndex;
      slide.classList.toggle('swiper-slide-active', isActive);
      slide.hidden = !isActive;
    });
    syncMedia(gallery);
  }

  function moveWithoutSwiper(gallery, direction) {
    var slides = getSlides(gallery);
    var active = getActiveSlide(gallery);
    var currentIndex = Math.max(slides.indexOf(active), 0);
    var nextIndex = Math.min(Math.max(currentIndex + direction, 0), slides.length - 1);
    var targetKey = getMediaKey(slides[nextIndex]);
    var thumb = getThumbElement(gallery) &&
      Array.prototype.find.call(getThumbElement(gallery).querySelectorAll('.swiper-slide'), function (item) {
        return getMediaKey(item) === targetKey;
      });

    if (thumb) slideToMedia(gallery, thumb);
  }

  function getGestureGallery(event) {
    var path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    var main = path.find(function (node) {
      return node && node.classList && node.classList.contains('product-image-main');
    });

    if (!main && event.target && event.target.closest) {
      main = event.target.closest(GALLERY_SELECTOR + ' .product-image-main');
    }

    return main && main.closest ? main.closest(GALLERY_SELECTOR) : null;
  }

  function getSwiperIndex(swiper, gallery) {
    if (swiper) {
      return typeof swiper.realIndex === 'number' ? swiper.realIndex : swiper.activeIndex;
    }
    return getSlides(gallery).indexOf(getActiveSlide(gallery));
  }

  function installSwipeGuard() {
    if (swipeGuardInstalled) return;
    swipeGuardInstalled = true;

    window.addEventListener('touchstart', function (event) {
      var gallery;
      var point;
      var swiper;

      if (event.touches.length !== 1) {
        swipeGesture = null;
        return;
      }

      gallery = getGestureGallery(event);
      if (!gallery) {
        swipeGesture = null;
        return;
      }

      point = event.touches[0];
      swiper = getMainSwiper(gallery);
      swipeGesture = {
        gallery: gallery,
        startX: point.clientX,
        startY: point.clientY,
        startIndex: getSwiperIndex(swiper, gallery)
      };
    }, { passive: true, capture: true });

    window.addEventListener('touchend', function (event) {
      var gesture = swipeGesture;
      var point;
      var distanceX;
      var distanceY;
      var direction;

      swipeGesture = null;
      if (!gesture || !event.changedTouches.length) return;

      point = event.changedTouches[0];
      distanceX = point.clientX - gesture.startX;
      distanceY = point.clientY - gesture.startY;

      if (Math.abs(distanceX) <= 36 || Math.abs(distanceX) <= Math.abs(distanceY) * 1.15) return;
      direction = distanceX < 0 ? 1 : -1;

      window.setTimeout(function () {
        var swiper;
        var currentIndex;
        var targetIndex;
        var slides;

        if (!document.documentElement.contains(gesture.gallery)) return;

        swiper = getMainSwiper(gesture.gallery);
        if (!swiper) {
          moveWithoutSwiper(gesture.gallery, direction);
          return;
        }

        currentIndex = getSwiperIndex(swiper, gesture.gallery);
        slides = getSlides(gesture.gallery);

        // Native Swiper already handled the gesture, so the guard must not move twice.
        if (currentIndex !== gesture.startIndex || slides.length < 2) return;

        targetIndex = Math.min(Math.max(currentIndex + direction, 0), slides.length - 1);
        if (targetIndex === currentIndex) return;

        if (swiper.params && swiper.params.loop && typeof swiper.slideToLoop === 'function') {
          swiper.slideToLoop(targetIndex, 260);
        } else if (typeof swiper.slideTo === 'function') {
          swiper.slideTo(targetIndex, 260);
        }
        scheduleSync(gesture.gallery, 280);
      }, 80);
    }, { passive: true, capture: true });

    window.addEventListener('touchcancel', function () {
      swipeGesture = null;
    }, { passive: true, capture: true });
  }

  function bindGallery(gallery) {
    if (!gallery || boundGalleries.has(gallery)) return;
    boundGalleries.add(gallery);

    gallery.addEventListener('click', function (event) {
      var thumb = event.target.closest('.product-thumb-wrap .swiper-slide');
      var localVideo = event.target.closest('.product-image-main video');

      if (thumb && gallery.contains(thumb)) {
        event.preventDefault();
        slideToMedia(gallery, thumb);
        return;
      }

      if (localVideo && !event.target.closest('.product-media-fullscreen-trigger')) {
        if (localVideo.paused) setLocalVideoState(localVideo, true);
        else localVideo.pause();
      }
    });

    gallery.addEventListener('keydown', function (event) {
      var thumb = event.target.closest('.product-thumb-wrap .swiper-slide');
      if (thumb && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        slideToMedia(gallery, thumb);
      }
    });

    installSwipeGuard();

    gallery.querySelectorAll('.product-thumb-wrap .swiper-slide').forEach(function (thumb) {
      thumb.setAttribute('role', 'button');
      thumb.setAttribute('tabindex', '0');
    });

    waitForSwiper(gallery, 0);
  }

  function start() {
    document.querySelectorAll(GALLERY_SELECTOR).forEach(bindGallery);

    var observer = new MutationObserver(function (mutations) {
      var hasNewNodes = mutations.some(function (mutation) {
        return mutation.addedNodes.length > 0;
      });
      if (!hasNewNodes) return;

      document.querySelectorAll(GALLERY_SELECTOR).forEach(bindGallery);
      document.querySelectorAll(GALLERY_SELECTOR).forEach(function (gallery) {
        waitForSwiper(gallery, 0);
        scheduleSync(gallery, 50);
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  window.addEventListener('load', function () {
    document.querySelectorAll(GALLERY_SELECTOR).forEach(function (gallery) {
      waitForSwiper(gallery, 0);
      scheduleSync(gallery, 100);
    });
  });

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      document.querySelectorAll(GALLERY_SELECTOR).forEach(syncMedia);
    }
  });
})();