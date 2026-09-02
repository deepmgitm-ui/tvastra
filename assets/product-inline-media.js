(function () {
  'use strict';

  var GALLERY_SELECTOR = '.main-product-page .product-gallery';
  var boundGalleries = new WeakSet();
  var boundSwipers = new WeakSet();
  var preparedVideos = new WeakSet();
  var preparedIframes = new WeakSet();

  function getMainElement(gallery) {
    return gallery && gallery.querySelector('.product-image-main');
  }

  function getThumbElement(gallery) {
    return gallery && gallery.querySelector('.product-image-thumb');
  }

  function getMainSwiper(gallery) {
    var main = getMainElement(gallery);
    return main && main.swiper;
  }

  function getSlides(gallery) {
    var main = getMainElement(gallery);
    if (!main) return [];

    return Array.prototype.slice.call(
      main.querySelectorAll('.swiper-wrapper > .swiper-slide')
    ).filter(function (slide) {
      return !slide.classList.contains('swiper-slide-duplicate');
    });
  }

  function getMediaKey(slide) {
    var id = slide && slide.getAttribute('data-media-id');
    return id ? id.replace(/-(?:main|thumb)$/, '') : '';
  }

  function getActiveSlide(gallery) {
    var main = getMainElement(gallery);
    var swiper = getMainSwiper(gallery);
    var slides = getSlides(gallery);
    var index = 0;

    if (!main || !slides.length) return null;

    if (swiper && typeof swiper.realIndex === 'number') {
      index = swiper.realIndex;
    } else if (swiper && typeof swiper.activeIndex === 'number') {
      index = swiper.activeIndex;
    }

    return main.querySelector('.swiper-wrapper > .swiper-slide-active') || slides[index] || slides[0];
  }

  function setActiveThumb(gallery, activeSlide) {
    var activeKey = getMediaKey(activeSlide);
    var thumbElement = getThumbElement(gallery);
    var thumbSwiper = thumbElement && thumbElement.swiper;
    var activeIndex = -1;

    if (!thumbElement || !activeKey) return;

    thumbElement.querySelectorAll('.swiper-wrapper > .swiper-slide').forEach(function (thumb, index) {
      var active = getMediaKey(thumb) === activeKey;
      thumb.classList.toggle('swiper-slide-thumb-active', active);
      thumb.classList.toggle('is-active', active);
      thumb.setAttribute('aria-current', active ? 'true' : 'false');
      if (active) activeIndex = index;
    });

    if (thumbSwiper && activeIndex >= 0) {
      try {
        if (typeof thumbSwiper.slideTo === 'function') thumbSwiper.slideTo(activeIndex, 180);
        if (typeof thumbSwiper.update === 'function') thumbSwiper.update();
      } catch (error) {}
    }
  }

  function prepareLocalVideo(video) {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = 'auto';
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('loop', '');
  }

  function tryPlayLocalVideo(video) {
    if (!video) return;

    prepareLocalVideo(video);

    var play = function () {
      try {
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {});
        }
      } catch (error) {}
    };

    if (video.readyState < 2) {
      var onReady = function () {
        video.removeEventListener('loadedmetadata', onReady);
        video.removeEventListener('canplay', onReady);
        window.requestAnimationFrame(play);
      };

      video.addEventListener('loadedmetadata', onReady, { once: true });
      video.addEventListener('canplay', onReady, { once: true });

      try {
        video.load();
      } catch (error) {}

      window.setTimeout(play, 500);
      return;
    }

    play();
  }

  function pauseLocalVideo(video) {
    if (!video) return;
    prepareLocalVideo(video);
    try {
      video.pause();
    } catch (error) {}
  }

  function prepareExternalIframe(iframe) {
    if (!iframe || preparedIframes.has(iframe)) return;

    preparedIframes.add(iframe);
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    iframe.setAttribute('playsinline', '');

    try {
      var source = new URL(iframe.src, window.location.href);

      if (/youtube(?:-nocookie)?\\.com$/i.test(source.hostname)) {
        source.searchParams.set('enablejsapi', '1');
        source.searchParams.set('playsinline', '1');
        source.searchParams.set('mute', '1');
      }

      if (/vimeo\\.com$/i.test(source.hostname)) {
        source.searchParams.set('api', '1');
        source.searchParams.set('muted', '1');
        source.searchParams.set('playsinline', '1');
      }

      if (source.toString() !== iframe.src) iframe.src = source.toString();
    } catch (error) {}
  }

  function postExternalCommand(iframe, shouldPlay) {
    if (!iframe || !iframe.contentWindow) return;

    if (/youtube/i.test(iframe.src)) {
      try {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: shouldPlay ? 'playVideo' : 'pauseVideo',
          args: []
        }), '*');
      } catch (error) {}
      return;
    }

    if (/vimeo/i.test(iframe.src)) {
      try {
        iframe.contentWindow.postMessage({
          method: shouldPlay ? 'play' : 'pause'
        }, '*');
      } catch (error) {}
    }
  }

  function setExternalVideoState(media, shouldPlay) {
    var iframe = media && media.querySelector('iframe');
    var host = media && media.querySelector('[id^="video-"]');
    var player = (host && (host.plyrInstance || host.plyr)) || (media && (media.plyrInstance || media.plyr));

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

    if (!iframe.__tvastraMediaBound) {
      iframe.__tvastraMediaBound = true;
      iframe.addEventListener('load', function () {
        var active = iframe.closest('.swiper-slide-active');
        postExternalCommand(iframe, !!active);
      });
    }

    postExternalCommand(iframe, shouldPlay);

    if (shouldPlay) {
      window.setTimeout(function () {
        if (iframe.closest('.swiper-slide-active')) postExternalCommand(iframe, true);
      }, 300);
      window.setTimeout(function () {
        if (iframe.closest('.swiper-slide-active')) postExternalCommand(iframe, true);
      }, 900);
    }
  }

  function setSwiperMediaSizing(swiper) {
    if (!swiper) return;

    try {
      if (swiper.params) swiper.params.autoHeight = false;
      if (typeof swiper.updateSize === 'function') swiper.updateSize();
      if (typeof swiper.updateSlides === 'function') swiper.updateSlides();
      if (typeof swiper.updateProgress === 'function') swiper.updateProgress();
      if (typeof swiper.updateSlidesClasses === 'function') swiper.updateSlidesClasses();
      if (typeof swiper.update === 'function') swiper.update();
    } catch (error) {}
  }

  function syncMedia(gallery, delay) {
    if (!gallery) return;

    window.setTimeout(function () {
      var main = getMainElement(gallery);
      var swiper = getMainSwiper(gallery);
      var activeSlide = getActiveSlide(gallery);

      if (!main || !activeSlide) return;

      main.querySelectorAll('.swiper-wrapper > .swiper-slide').forEach(function (slide) {
        var active = slide === activeSlide;

        slide.querySelectorAll('video').forEach(function (video) {
          if (active) tryPlayLocalVideo(video);
          else pauseLocalVideo(video);
        });

        slide.querySelectorAll('.media-video').forEach(function (media) {
          if (media.querySelector('iframe')) setExternalVideoState(media, active);
        });
      });

      setActiveThumb(gallery, activeSlide);
      setSwiperMediaSizing(swiper);
    }, delay || 0);
  }

  function createFallbackSwiper(gallery) {
    var main = getMainElement(gallery);
    var thumb = getThumbElement(gallery);

    if (!main || main.swiper || typeof window.Swiper !== 'function') {
      return getMainSwiper(gallery);
    }

    var thumbSwiper = null;

    if (thumb && !thumb.swiper) {
      try {
        thumbSwiper = new window.Swiper(thumb, {
          direction: 'vertical',
          slidesPerView: 'auto',
          spaceBetween: 8,
          watchSlidesProgress: true,
          observer: true,
          observeParents: true
        });
      } catch (error) {}
    } else if (thumb) {
      thumbSwiper = thumb.swiper;
    }

    try {
      var swiper = new window.Swiper(main, {
        slidesPerView: 1,
        spaceBetween: 10,
        speed: 300,
        loop: false,
        autoHeight: false,
        watchOverflow: true,
        observer: true,
        observeParents: true,
        observeSlideChildren: true,
        threshold: 5,
        resistanceRatio: 0.75,
        navigation: {
          nextEl: main.querySelector('.swiper-button-next'),
          prevEl: main.querySelector('.swiper-button-prev')
        },
        thumbs: thumbSwiper ? { swiper: thumbSwiper } : undefined
      });

      return swiper;
    } catch (error) {
      return null;
    }
  }

  function bindSwiper(gallery, swiper) {
    if (!swiper || boundSwipers.has(swiper)) return;
    boundSwipers.add(swiper);

    setSwiperMediaSizing(swiper);

    ['init', 'slideChange', 'slideChangeTransitionStart', 'slideChangeTransitionEnd', 'transitionEnd', 'resize', 'observerUpdate'].forEach(function (eventName) {
      swiper.on(eventName, function () {
        if (eventName === 'slideChangeTransitionStart') {
          var main = getMainElement(gallery);
          if (main) {
            main.querySelectorAll('video').forEach(function (video) {
              pauseLocalVideo(video);
            });
          }
        }

        syncMedia(gallery, eventName === 'slideChange' ? 60 : 0);
      });
    });

    syncMedia(gallery, 80);
  }

  function waitForSwiper(gallery, attempt) {
    var swiper = getMainSwiper(gallery);

    if (swiper) {
      bindSwiper(gallery, swiper);
      return;
    }

    if (attempt >= 20) {
      swiper = createFallbackSwiper(gallery);
      if (swiper) bindSwiper(gallery, swiper);
      else syncMedia(gallery, 100);
      return;
    }

    window.setTimeout(function () {
      waitForSwiper(gallery, attempt + 1);
    }, 100);
  }

  function slideToMedia(gallery, thumb) {
    var targetKey = getMediaKey(thumb);
    var slides = getSlides(gallery);
    var swiper = getMainSwiper(gallery) || createFallbackSwiper(gallery);
    var index = -1;

    if (!targetKey) return;

    slides.some(function (slide, slideIndex) {
      if (getMediaKey(slide) === targetKey) {
        index = slideIndex;
        return true;
      }
      return false;
    });

    if (index < 0) return;

    if (swiper) {
      bindSwiper(gallery, swiper);
      setSwiperMediaSizing(swiper);
      try {
        if (swiper.params && swiper.params.loop && typeof swiper.slideToLoop === 'function') {
          swiper.slideToLoop(index, 300);
        } else if (typeof swiper.slideTo === 'function') {
          swiper.slideTo(index, 300);
        }
      } catch (error) {}
      syncMedia(gallery, 320);
      return;
    }

    slides.forEach(function (slide, slideIndex) {
      var active = slideIndex === index;
      slide.classList.toggle('swiper-slide-active', active);
      slide.hidden = !active;
    });

    syncMedia(gallery);
  }

  function bindGallery(gallery) {
    if (!gallery || boundGalleries.has(gallery)) return;
    boundGalleries.add(gallery);

    gallery.addEventListener('click', function (event) {
      var thumb = event.target.closest('.product-thumb-wrap .swiper-slide');
      var video = event.target.closest('.product-image-main video');

      if (thumb && gallery.contains(thumb)) {
        event.preventDefault();
        slideToMedia(gallery, thumb);
        return;
      }

      if (video && gallery.contains(video)) {
        if (video.paused) tryPlayLocalVideo(video);
        else pauseLocalVideo(video);
      }
    });

    gallery.addEventListener('keydown', function (event) {
      var thumb = event.target.closest('.product-thumb-wrap .swiper-slide');
      if (!thumb || !gallery.contains(thumb)) return;

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        slideToMedia(gallery, thumb);
      }
    });

    gallery.querySelectorAll('.product-thumb-wrap .swiper-slide').forEach(function (thumb) {
      thumb.setAttribute('role', 'button');
      thumb.setAttribute('tabindex', '0');
    });

    waitForSwiper(gallery, 0);
    syncMedia(gallery, 150);
  }

  function start() {
    document.querySelectorAll(GALLERY_SELECTOR).forEach(bindGallery);

    if (window.MutationObserver && document.body) {
      var observer = new MutationObserver(function (mutations) {
        var changed = mutations.some(function (mutation) {
          return mutation.addedNodes && mutation.addedNodes.length;
        });

        if (!changed) return;

        document.querySelectorAll(GALLERY_SELECTOR).forEach(bindGallery);
        document.querySelectorAll(GALLERY_SELECTOR).forEach(function (gallery) {
          waitForSwiper(gallery, 0);
          syncMedia(gallery, 80);
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  window.addEventListener('load', function () {
    document.querySelectorAll(GALLERY_SELECTOR).forEach(function (gallery) {
      waitForSwiper(gallery, 0);
      syncMedia(gallery, 120);
    });
  });
})();
