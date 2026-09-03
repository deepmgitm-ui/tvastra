(function () {
  'use strict';

  var root = document.documentElement;
  var delay = 220;
  var safetyTimer = null;

  function clearLeavingState() {
    root.classList.remove('tvastra-page-leaving');
    if (safetyTimer) {
      window.clearTimeout(safetyTimer);
      safetyTimer = null;
    }
  }

  function isProductPage() {
    return !!document.querySelector('.main-product-page');
  }

  function isAccountLink(link) {
    if (!link) return false;
    var aria = (link.getAttribute('aria-label') || '').toLowerCase();
    var href = (link.getAttribute('href') || '').toLowerCase();
    var text = (link.textContent || '').trim().toLowerCase();
    return aria === 'account' ||
           aria === 'account-label' ||
           /(^|\/)account(?:\/?|[?#])/.test(href) ||
           /(^|\/)account\/login(?:\/?|[?#])/.test(href) ||
           /\b(sign in|login|log in|account)\b/.test(text);
  }

  function isInternalPageLink(link) {
    if (!link ||
        isAccountLink(link) ||
        link.target ||
        link.hasAttribute('download') ||
        link.hasAttribute('data-no-page-transition') ||
        link.hasAttribute('data-collection-load-more')) return false;

    var href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(href)) return false;

    var destination;
    try {
      destination = new URL(link.href, window.location.href);
    } catch (error) {
      return false;
    }

    if (destination.origin !== window.location.origin) return false;
    if (destination.pathname === window.location.pathname &&
        destination.search === window.location.search &&
        destination.hash) return false;

    return true;
  }

  function init() {
    clearLeavingState();

    // Never put a full-page transition over the PDP. This prevents a stale
    // transition class from making the product page appear blank after navigation.
    if (isProductPage()) return;

    document.addEventListener('click', function (event) {
      if (event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey) return;

      if (event.target.closest('.parent')) return;

      var link = event.target.closest('a[href]');
      if (!isInternalPageLink(link) ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      event.preventDefault();
      clearLeavingState();
      root.classList.add('tvastra-page-leaving');

      safetyTimer = window.setTimeout(clearLeavingState, 1200);
      window.setTimeout(function () {
        window.location.assign(link.href);
      }, delay);
    }, true);
  }

  window.addEventListener('pageshow', clearLeavingState);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
