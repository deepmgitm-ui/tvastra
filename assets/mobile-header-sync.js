(function () {
  'use strict';

  var frameId = 0;
  var resizeObserver;
  var retryDelays = [0, 100, 350, 800, 1500];

  function getHeight(element) {
    if (!element) return 0;

    var rect = element.getBoundingClientRect();
    return Math.ceil(Math.max(rect.height, element.offsetHeight));
  }

  function syncHeaderPosition() {
    frameId = 0;

    var body = document.body;
    var miniHeader = document.getElementById('shopify-section-mini-header');
    var announcement = miniHeader && miniHeader.querySelector('.announcement-bar');
    var navbar = document.querySelector('#hongo-header .navbar');

    if (!body || !navbar) return;

    var miniHeaderHeight = Math.max(getHeight(miniHeader), getHeight(announcement));
    var navbarHeight = getHeight(navbar);

    body.style.setProperty('--miniheader-height', miniHeaderHeight + 'px');
    body.style.setProperty('--header-height', navbarHeight + 'px');
    body.style.setProperty('--top-space', miniHeaderHeight + navbarHeight + 'px');

    if (!body.classList.contains('sticky')) return;

    if (window.pageYOffset <= 30) {
      if (miniHeader) miniHeader.style.top = '0px';
      navbar.style.top = miniHeaderHeight + 'px';
    } else {
      if (miniHeader && miniHeaderHeight) miniHeader.style.top = -miniHeaderHeight + 'px';
      navbar.style.top = '0px';
    }
  }

  function requestSync() {
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = window.requestAnimationFrame(syncHeaderPosition);
  }

  function scheduleSync() {
    retryDelays.forEach(function (delay) {
      window.setTimeout(requestSync, delay);
    });
  }

  function observeHeader() {
    if (!('ResizeObserver' in window)) return;

    resizeObserver = new ResizeObserver(requestSync);
    var miniHeader = document.getElementById('shopify-section-mini-header');
    var navbar = document.querySelector('#hongo-header .navbar');

    if (miniHeader) resizeObserver.observe(miniHeader);
    if (navbar) resizeObserver.observe(navbar);
  }

  function init() {
    observeHeader();
    scheduleSync();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleSync);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.addEventListener('load', scheduleSync, { once: true });
  window.addEventListener('pageshow', scheduleSync);
  window.addEventListener('resize', requestSync, { passive: true });
  window.addEventListener('orientationchange', scheduleSync);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) scheduleSync();
  });
  document.addEventListener('shopify:section:load', scheduleSync);
})();
