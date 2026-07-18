(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function getGallery(target) {
    return target && target.closest && target.closest('.main-product-page .product-gallery');
  }

  function getMainSlider(gallery) {
    return gallery && gallery.querySelector('.product-main-slider');
  }

  function getMainSwiper(gallery) {
    return gallery && gallery.querySelector('.product-image-main');
  }

  function getOrCreatePreview(gallery) {
    var mainSlider = getMainSlider(gallery);
    var preview = mainSlider && mainSlider.querySelector('.tv-inline-product-preview');

    if (!mainSlider) return null;

    if (!preview) {
      preview = document.createElement('div');
      preview.className = 'tv-inline-product-preview';
      preview.setAttribute('aria-label', 'Selected product image');
      preview.innerHTML = '<img alt="">';
      mainSlider.insertBefore(preview, mainSlider.firstChild);
    }

    return preview;
  }

  function showImage(gallery, src, alt) {
    var mainSlider = getMainSlider(gallery);
    var preview = getOrCreatePreview(gallery);
    var image = preview && preview.querySelector('img');

    if (!mainSlider || !preview || !image || !src) return;

    image.src = src;
    image.alt = alt || '';
    mainSlider.classList.add('has-inline-image-preview');
  }

  function showNativeMedia(gallery) {
    var mainSlider = getMainSlider(gallery);
    if (mainSlider) mainSlider.classList.remove('has-inline-image-preview');
  }

  function slideNativeMedia(gallery, index) {
    var mainSwiper = getMainSwiper(gallery);
    var targetSlide = mainSwiper && mainSwiper.querySelector('.swiper-slide[data-index="' + index + '"]');
    var swiper = mainSwiper && mainSwiper.swiper;

    if (!mainSwiper || !targetSlide) return;

    if (swiper && typeof swiper.slideTo === 'function') {
      swiper.slideTo(Array.prototype.indexOf.call(mainSwiper.querySelectorAll('.swiper-slide'), targetSlide), 0);
      return;
    }

    mainSwiper.querySelectorAll('.swiper-slide').forEach(function (slide) {
      slide.classList.remove('swiper-slide-active');
      slide.style.display = 'none';
    });
    targetSlide.classList.add('swiper-slide-active');
    targetSlide.style.display = '';
  }

  function activateThumb(thumb) {
    var gallery = getGallery(thumb);
    var mediaType = thumb.getAttribute('data-media-type');
    var index = thumb.getAttribute('data-index');

    if (!gallery || !index) return;

    slideNativeMedia(gallery, index);

    if (mediaType === 'image') {
      showImage(gallery, thumb.getAttribute('data-preview-src'), thumb.getAttribute('data-preview-alt'));
    } else {
      showNativeMedia(gallery);
    }
  }

  function syncInitialGallery(gallery) {
    var mainSlider = getMainSlider(gallery);
    var activeSlide = gallery.querySelector('.product-image-main .swiper-slide-active[data-media-type]');
    var firstSlide = gallery.querySelector('.product-image-main .swiper-slide[data-media-type]');
    var slide = activeSlide || firstSlide;
    var thumb;

    if (!mainSlider || mainSlider.classList.contains('has-inline-image-preview')) return;
    if (!slide || slide.getAttribute('data-media-type') !== 'image') return;

    thumb = gallery.querySelector('.product-thumb-wrap .swiper-slide[data-index="' + slide.getAttribute('data-index') + '"]');
    if (thumb) activateThumb(thumb);
  }

  ready(function () {
    var lastThumb;
    var lastRun = 0;
    var onThumbEvent = function (event) {
      var thumb = event.target.closest('.product-thumb-wrap .swiper-slide[data-index]');
      var now = Date.now();

      if (!thumb) return;
      if (thumb === lastThumb && now - lastRun < 120) return;

      lastThumb = thumb;
      lastRun = now;
      setTimeout(function () {
        activateThumb(thumb);
      }, 0);
    };

    ['touchstart', 'pointerup', 'click'].forEach(function (eventName) {
      document.addEventListener(eventName, onThumbEvent, true);
    });

    document.addEventListener('click', function (event) {
      var preview = event.target.closest('.tv-inline-product-preview');
      if (preview) {
        event.preventDefault();
      }
    });

    setTimeout(function () {
      document.querySelectorAll('.main-product-page .product-gallery').forEach(syncInitialGallery);
    }, 500);
  });
})();
