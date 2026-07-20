(function () {
  var gallerySelector = '.main-product-page .product-gallery';
  var boundGalleries = new WeakSet();

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function getGallery(target) {
    return target && target.closest && target.closest(gallerySelector);
  }

  function getMainSwiperEl(gallery) {
    return gallery && gallery.querySelector('.product-image-main');
  }

  function getMainSwiper(gallery) {
    var el = getMainSwiperEl(gallery);
    return el && el.swiper;
  }

  function getActiveIndex(gallery) {
    var swiperEl = getMainSwiperEl(gallery);
    var activeSlide = swiperEl && swiperEl.querySelector('.swiper-slide-active[data-index]');
    var swiper = getMainSwiper(gallery);

    if (activeSlide) return activeSlide.getAttribute('data-index');
    if (swiper && typeof swiper.realIndex === 'number') return String(swiper.realIndex + 1);

    return null;
  }

  function setActiveThumb(gallery, index) {
    gallery.querySelectorAll('.product-thumb-wrap .swiper-slide[data-index]').forEach(function (thumb) {
      var active = thumb.getAttribute('data-index') === String(index);
      thumb.classList.toggle('swiper-slide-thumb-active', active);
      thumb.classList.toggle('is-active', active);
    });
  }

  function prepareVideo(video) {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.loop = true;
    video.preload = 'auto';
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');
  }

  function playActiveVideo(gallery, index) {
    var swiperEl = getMainSwiperEl(gallery);
    if (!swiperEl) return;

    swiperEl.querySelectorAll('video').forEach(function (video) {
      prepareVideo(video);

      if (video.closest('.swiper-slide[data-index="' + index + '"]')) {
        var promise = video.play && video.play();
        if (promise && promise.catch) promise.catch(function () {});
      } else {
        try { video.pause(); } catch (error) {}
      }
    });
  }

  function syncGallery(gallery) {
    var index = getActiveIndex(gallery);
    if (!index) return;

    setActiveThumb(gallery, index);
    playActiveVideo(gallery, index);
  }

  function slideToIndex(gallery, index) {
    var swiper = getMainSwiper(gallery);
    var swiperEl = getMainSwiperEl(gallery);
    var numericIndex = Math.max(Number(index) - 1, 0);

    if (swiper && typeof swiper.slideToLoop === 'function') {
      swiper.slideToLoop(numericIndex, 260);
    } else if (swiper && typeof swiper.slideTo === 'function') {
      swiper.slideTo(numericIndex, 260);
    } else if (swiperEl) {
      swiperEl.querySelectorAll('.swiper-slide').forEach(function (slide) {
        var active = slide.getAttribute('data-index') === String(index);
        slide.classList.toggle('swiper-slide-active', active);
        slide.style.display = active ? '' : 'none';
      });
    }

    setTimeout(function () {
      setActiveThumb(gallery, index);
      playActiveVideo(gallery, index);
    }, 280);
  }

  function bindSwiper(gallery, attempt) {
    var swiper = getMainSwiper(gallery);

    if (!swiper) {
      if (attempt < 12) {
        setTimeout(function () {
          bindSwiper(gallery, attempt + 1);
        }, 250);
      }
      return;
    }

    swiper.on('slideChange', function () {
      syncGallery(gallery);
    });
    swiper.on('transitionEnd', function () {
      syncGallery(gallery);
    });
    syncGallery(gallery);
  }

  function bindGallery(gallery) {
    if (!gallery || boundGalleries.has(gallery)) return;
    boundGalleries.add(gallery);

    gallery.addEventListener('click', function (event) {
      var thumb = event.target.closest('.product-thumb-wrap .swiper-slide[data-index]');
      if (!thumb) return;

      slideToIndex(gallery, thumb.getAttribute('data-index'));
    }, true);

    gallery.addEventListener('touchend', function () {
      setTimeout(function () {
        syncGallery(gallery);
      }, 280);
    }, { passive: true });

    bindSwiper(gallery, 0);
  }

  function start() {
    document.querySelectorAll(gallerySelector).forEach(bindGallery);

    var observer = new MutationObserver(function () {
      document.querySelectorAll(gallerySelector).forEach(bindGallery);
      document.querySelectorAll(gallerySelector).forEach(syncGallery);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  ready(start);
  window.addEventListener('load', function () {
    document.querySelectorAll(gallerySelector).forEach(syncGallery);
  });
})();
