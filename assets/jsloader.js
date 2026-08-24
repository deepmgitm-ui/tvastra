/*
 * Tvastra script lazy-loader.
 *
 * IMPORTANT:
 * Shopify app-proxy pages (for example Shipway/Ezy Returns) can contain
 * third-party application scripts. This theme-wide lazy-loader must not
 * rewrite those scripts because doing so can break the app's own runtime.
 */
(function () {
  'use strict';

  var path = window.location && window.location.pathname ? window.location.pathname : '';
  var isEzyReturns = path === '/apps/ezy/returns' || path.indexOf('/apps/ezy/returns/') === 0;

  if (isEzyReturns) {
    return;
  }

  var domainUrl = window.location.hostname;
  var domainAdminUrl = 'Shopify.shop';
  var currentUrl = window.location.href;

  if (
    currentUrl.indexOf(domainUrl) < 0 &&
    currentUrl.indexOf(domainAdminUrl) < 0 &&
    currentUrl.indexOf('shopifypreview.com') < 0 &&
    currentUrl.indexOf('shopify.com') < 0
  ) {
    console.log('authorization failed.');
    return;
  }

  var scriptLoaded = false;

  function loadAsync() {
    if (scriptLoaded) return;
    scriptLoaded = true;

    var scripts = document.getElementsByTagName('script');

    for (var i = 0; i < scripts.length; i++) {
      var script = scripts[i];

      if (script.getAttribute('data-src') !== null) {
        script.setAttribute('src', script.getAttribute('data-src'));
        script.removeAttribute('data-src');
      }

      if (script.getAttribute('type') === 'text/javascript') {
        var replacement = document.createElement('script');

        for (var j = 0; j < script.attributes.length; j++) {
          var attribute = script.attributes[j];
          replacement.setAttribute(attribute.name, attribute.value);
        }

        replacement.type = 'text/javascript';
        replacement.innerHTML = script.innerHTML;
        script.parentNode.insertBefore(replacement, script);
        script.parentNode.removeChild(script);
      }
    }

    setTimeout(function () {
      document.dispatchEvent(new CustomEvent('StartAsyncLoading'));
      document.dispatchEvent(new CustomEvent('StartAsyncLoadingDone'));
    }, 900);
  }

  window.addEventListener('scroll', loadAsync);
  window.addEventListener('mousemove', loadAsync);
  window.addEventListener('touchstart', loadAsync);

  if (window.onscroll) {
    window.addEventListener('load', function () {
      setTimeout(loadAsync, 9000);
    }, false);
  } else if (window.onload) {
    window.onload = function () {
      setTimeout(loadAsync, 9000);
    };
  } else {
    window.onload = loadAsync;
  }
}());
