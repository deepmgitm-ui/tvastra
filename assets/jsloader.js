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

  /*
   * Ezy Returns isolation.
   *
   * The custom Lucent script is loaded earlier by theme.liquid and may be
   * cached at an older asset version. We therefore add a second, independent
   * safety layer here. This layer exists ONLY on the Ezy Returns route and
   * does not change normal Tvastra pages.
   */
  if (isEzyReturns) {
    var lucentSelectors = [
      '#sotp',
      'lota-customer-account',
      '[data-simply-otp]',
      '[id*="simply-otp"]',
      '[id*="simplyOtp"]',
      '[class*="sotp"]',
      '[class*="simply-otp"]',
      '[class*="simplyOtp"]',
      '[class*="otp-login"]',
      '[class*="otpLogin"]'
    ];

    function hideLucent(node) {
      if (!node || node === document.documentElement || node === document.body) return;
      try {
        if (node.open === true && typeof node.close === 'function') node.close();
      } catch (e) {}
      try { node.removeAttribute('open'); } catch (e) {}
      try { node.setAttribute('aria-hidden', 'true'); } catch (e) {}
      try {
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('visibility', 'hidden', 'important');
        node.style.setProperty('opacity', '0', 'important');
        node.style.setProperty('pointer-events', 'none', 'important');
      } catch (e) {}
    }

    function isLucentText(text) {
      var t = String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();
      return (
        t.indexOf('we are thrilled to have you here') !== -1 ||
        (t.indexOf('login with otp') !== -1 && t.length < 1000) ||
        (t.indexOf('enter your phone number') !== -1 && t.indexOf('otp') !== -1 && t.length < 1500)
      );
    }

    function scanLucent(root) {
      if (!root || !root.querySelectorAll) return;

      for (var i = 0; i < lucentSelectors.length; i++) {
        try {
          var known = root.querySelectorAll(lucentSelectors[i]);
          for (var j = 0; j < known.length; j++) hideLucent(known[j]);
        } catch (e) {}
      }

      try {
        var nodes = root.querySelectorAll('body *');
        for (var k = 0; k < nodes.length; k++) {
          var node = nodes[k];
          if (!isLucentText(node.innerText || node.textContent || '')) continue;

          var candidate = node;
          for (var depth = 0; depth < 8 && candidate && candidate.parentElement; depth++) {
            var role = candidate.getAttribute ? (candidate.getAttribute('role') || '') : '';
            var cls = typeof candidate.className === 'string' ? candidate.className : '';
            var id = candidate.id || '';
            var style = window.getComputedStyle(candidate);

            if (
              role === 'dialog' ||
              candidate.tagName === 'DIALOG' ||
              /modal|popup|drawer|overlay|dialog|otp|login/i.test(cls + ' ' + id) ||
              (style && style.position === 'fixed')
            ) {
              hideLucent(candidate);
              break;
            }
            candidate = candidate.parentElement;
          }
        }
      } catch (e) {}

      try {
        var overlays = root.querySelectorAll(
          '.sotp-overlay, .sotp-backdrop, [class*="sotp-overlay"], [class*="sotp-backdrop"], [class*="otp-overlay"], [class*="otp-backdrop"]'
        );
        for (var m = 0; m < overlays.length; m++) hideLucent(overlays[m]);
      } catch (e) {}
    }

    function suppressLucent() {
      scanLucent(document);
    }

    /* Hide immediately, then keep watching because the popup can be injected later. */
    suppressLucent();

    if (window.MutationObserver && document.documentElement) {
      new MutationObserver(function () {
        suppressLucent();
      }).observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['open', 'style', 'class', 'aria-hidden']
      });
    }

    window.setTimeout(suppressLucent, 50);
    window.setTimeout(suppressLucent, 250);
    window.setTimeout(suppressLucent, 750);
    window.setTimeout(suppressLucent, 1500);
    window.setTimeout(suppressLucent, 3000);
    window.setTimeout(suppressLucent, 6000);
    window.setTimeout(suppressLucent, 10000);

    console.log('TVASTRA JSLOADER: Ezy Returns isolation active.');
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
