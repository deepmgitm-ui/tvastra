(function () {
  'use strict';

  var root = document.documentElement;
  var delay = 130;

  function isInternalPageLink(link) {
    if (!link || link.target || link.hasAttribute('download') || link.hasAttribute('data-no-page-transition')) return false;

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

    var link = event.target.closest('a[href]');
    if (!isInternalPageLink(link) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    event.preventDefault();
    root.classList.add('tvastra-page-leaving');

    window.setTimeout(function () {
      window.location.assign(link.href);
    }, delay);
  }, true);

  window.addEventListener('pageshow', function () {
    root.classList.remove('tvastra-page-leaving');
  });
}());
