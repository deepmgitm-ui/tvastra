/*
 * KwikPass login bridge.
 * Legacy asset filename retained for theme compatibility.
 * No Lucent / simplyOtp / sotp logic remains here.
 * KwikPass controls any configured marketing-popup timing.
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

  function isAccountTarget(target) {
    if (!target) return false;

    var anchor = target.closest ? target.closest('a,button,[role="button"]') : null;
    if (!anchor) return false;

    if (anchor.matches('a[aria-label="account"], a[aria-label="account-label"], [data-tvastra-account-login], [data-account-login], [data-login]')) {
      return true;
    }

    var aria = (anchor.getAttribute('aria-label') || '').toLowerCase();
    if (aria.indexOf('account') !== -1 || aria === 'login' || aria.indexOf('sign in') !== -1) {
      return true;
    }

    if (anchor.tagName === 'A') {
      var href = anchor.getAttribute('href') || '';
      if (href && !/^https?:\/\//i.test(href)) {
        var normalized = href.toLowerCase();
        if ((normalized === '/account' || normalized.indexOf('/account?') === 0 || normalized.indexOf('/account#') === 0) &&
            normalized.indexOf('/account/logout') !== 0) {
          return true;
        }
      }
    }

    return false;
  }

  // Every account/login entry point across the theme uses the same KwikPass opener.
  // If KwikPass is unavailable, allow the native Shopify account link to work.
  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!isAccountTarget(target)) return;
    if (!hasKwikPass()) return;

    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    runKwikPass();
  }, true);

}());
