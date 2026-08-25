/*
 * KwikPass login bridge.
 * The legacy asset filename is retained because theme.liquid already loads it.
 * No Lucent / simplyOtp / sotp logic remains here.
 */
(function () {
  'use strict';

  var path = window.location && window.location.pathname ? window.location.pathname : '';
  var isExcluded = path === '/apps/ezy/returns' ||
                   path.indexOf('/apps/ezy/returns/') === 0 ||
                   path.indexOf('/checkout') !== -1;

  if (isExcluded) return;

  function hasKwikPass() {
    return !!(
      window.KP_LOGIN_SDK_INSTANCE &&
      typeof window.KP_LOGIN_SDK_INSTANCE.handleKpLogin === 'function'
    );
  }

  function runKwikPass() {
    if (hasKwikPass()) {
      try {
        window.KP_LOGIN_SDK_INSTANCE.handleKpLogin();
      } catch (e) {}
      return true;
    }

    var attempts = 0;
    var maxAttempts = 80;
    var timer = window.setInterval(function () {
      attempts += 1;

      if (hasKwikPass()) {
        window.clearInterval(timer);
        try {
          window.KP_LOGIN_SDK_INSTANCE.handleKpLogin();
        } catch (e) {}
        return;
      }

      if (attempts >= maxAttempts) {
        window.clearInterval(timer);
      }
    }, 250);

    return true;
  }

  // Account/profile icon: use KwikPass instead of navigating away to Shopify login.
  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest
      ? event.target.closest('a[aria-label="account"], a[aria-label="account-label"]')
      : null;

    if (!target) return;

    if (!hasKwikPass()) {
      // Let the native Shopify account link work if KwikPass has not loaded at all.
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    runKwikPass();
  }, true);

  // Trigger KwikPass's configured popup using its official SDK entrypoint.
  window.setTimeout(function () {
    runKwikPass();
  }, 8000);
}());
