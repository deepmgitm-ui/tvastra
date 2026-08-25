(function () {
  'use strict';

  var root = document.documentElement;
  var delay = 220;

  function clearPageTransition() {
    root.classList.remove('tvastra-page-leaving');
  }

  function clearGlobalLoaders() {
    // Magic Checkout can close without causing a full page navigation.
    // The theme's global loader may have been shown before checkout opened;
    // always hide it again when the storefront regains focus/visibility.
    try {
      document.querySelectorAll('.loading-box').forEach(function (loader) {
        loader.classList.add('hidden');
        loader.classList.remove('show-loader');
      });
    } catch (error) {}
  }

  function restoreStorefront() {
    clearPageTransition();
    clearGlobalLoaders();
  }

  function isInternalPageLink(link) {
    if (!link || link.target || link.hasAttribute('download') || link.hasAttribute('data-no-page-transition') || link.hasAttribute('data-tvastra-lucent-login') || link.hasAttribute('data-collection-load-more')) return false;

    var href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(href)) return false;

    var destination;
    try {
      destination = new URL(link.href, window.location.href);
    } catch (error) {
      return false;
    }

    if (destination.origin !== window.location.origin) return false;
    if (destination.pathname === window.location.pathname && destination.search === window.location.search && destination.hash) return false;

    return true;
  }

  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.target.closest('.parent')) return;

    var link = event.target.closest('a[href]');
    if (!isInternalPageLink(link) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    event.preventDefault();
    root.classList.add('tvastra-page-leaving');

    window.setTimeout(function () {
      window.location.assign(link.href);
    }, delay);
  }, true);

  // Magic Checkout opens/closes outside the normal internal-link transition flow.
  // When the storefront becomes visible/focused again after Cancel/Back/dismissal,
  // restore the storefront and make sure the theme's global loader is hidden.
  window.addEventListener('pageshow', restoreStorefront);
  window.addEventListener('popstate', restoreStorefront);
  window.addEventListener('focus', restoreStorefront);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') restoreStorefront();
  });

  // Covers the modal case where the browser never loses focus/visibility.
  window.setTimeout(restoreStorefront, 0);
  window.setTimeout(restoreStorefront, 600);
  window.setTimeout(restoreStorefront, 1500);
  window.setInterval(function () {
    if (document.visibilityState === 'visible') {
      clearGlobalLoaders();
    }
  }, 2000);
}());
