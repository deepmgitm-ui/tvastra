(function () {
  var GALLERY_SELECTOR = ".main-product-page .product-gallery";

  function prepareVideo(video) {
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.controls = false;
    video.preload = "auto";
    video.setAttribute("muted", "");
    video.setAttribute("autoplay", "");
    video.setAttribute("loop", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.removeAttribute("controls");
  }

  function getSlide(media) {
    return media.closest(".swiper-slide, .gallary-item, .product__media-item");
  }

  function isActiveMedia(media) {
    var slide = getSlide(media);
    if (!slide || !slide.classList.contains("swiper-slide")) return true;
    return slide.classList.contains("swiper-slide-active");
  }

  function playVideo(video) {
    prepareVideo(video);

    if (!isActiveMedia(video)) {
      video.pause();
      return;
    }

    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {});
    }
  }

  function playActiveProductVideos() {
    document.querySelectorAll(GALLERY_SELECTOR + " video").forEach(playVideo);
  }

  function schedulePlay() {
    window.requestAnimationFrame(function () {
      window.setTimeout(playActiveProductVideos, 60);
    });
  }

  function observeGallery(gallery) {
    var observer = new MutationObserver(schedulePlay);
    observer.observe(gallery, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class"]
    });
  }

  function bindGallery(gallery) {
    if (gallery.dataset.tvVideoAutoplayReady === "true") return;

    gallery.dataset.tvVideoAutoplayReady = "true";
    observeGallery(gallery);
    gallery.addEventListener("transitionend", schedulePlay, true);
    gallery.addEventListener("touchend", schedulePlay, { passive: true });
  }

  function start() {
    document.querySelectorAll(GALLERY_SELECTOR).forEach(bindGallery);
    playActiveProductVideos();
    window.setTimeout(playActiveProductVideos, 500);
    window.setTimeout(playActiveProductVideos, 1400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  window.addEventListener("load", playActiveProductVideos);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) playActiveProductVideos();
  });
})();