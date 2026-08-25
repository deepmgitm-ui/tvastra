(function () {
  'use strict';

  var root = document.documentElement;
  var delay = 220;

  function clearPageTransition() {
    root.classList.remove('tvastra-page-leaving');

    try {
      document.body.classList.remove('tvastra-page-leaving');
      document.body.classList.remove('overflow-hidden');
      document.documentElement.classList.remove('overflow-hidden');

      document.querySelectorAll('.tvastra-page-transition').forEach(function (overlay) {
        overlay.classList.remove('active', 'show', 'visible', 'open', 'is-active', 'is-visible', 'loading');
        overlay.style.setProperty('display', 'none', 'important');
        overlay.style.setProperty('visibility', 'hidden', 'important');
        overlay.style.setProperty('opacity', '0', 'important');
        overlay.style.setProperty('pointer-events', 'none', 'important');
      });
    } catch (error) {}
  }

  function clearGlobalLoaders() {
    try {
      document.querySelectorAll('.loading-box').forEach(function (loader) {
        loader.classList.add('hidden');
        loader.classList.remove('show-loader', 'active', 'open', 'loading');
        loader.style.setProperty('display', 'none', 'important');
        loader.style.setProperty('visibility', 'hidden', 'important');
        loader.style.setProperty('opacity', '0', 'important');
        loader.style.setProperty('pointer-events', 'none', 'important');
      });
    } catch (error) {}
  }

  function restoreStorefront() {
    clearPageTransition();
    clearGlobalLoaders();
  }

  function isAccountLink(link) {
    if (!link) return false;
    var aria = (link.getAttribute('aria-label') || '').toLowerCase();
    var href = (link.getAttribute('href') || '').toLowerCase();
    var text = (link.textContent || '').trim().toLowerCase();
    return aria === 'account' || aria === 'account-label' || /(^|\/)account(?:\/?|[?#])/.test(href) || /(^|\/)account\/login(?:\/?|[?#])/.test(href) || /\b(sign in|login|log in|account)\b/.test(text);
  }

  function isInternalPageLink(link) {
    if (!link || isAccountLink(link) || link.target || link.hasAttribute('download') || link.hasAttribute('data-no-page-transition') || link.hasAttribute('data-tvastra-lucent-login') || link.hasAttribute('data-collection-load-more')) return false;

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

  function getKwikPassLogin() {
    return window.KP_LOGIN_SDK_INSTANCE && typeof window.KP_LOGIN_SDK_INSTANCE.handleKpLogin === 'function' ? window.KP_LOGIN_SDK_INSTANCE.handleKpLogin.bind(window.KP_LOGIN_SDK_INSTANCE) : null;
  }

  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    var link = event.target.closest('a[href]');
    if (!isAccountLink(link)) return;

    var openKwikPass = getKwikPassLogin();
    if (!openKwikPass) return;

    event.preventDefault();
    try {
      openKwikPass();
    } catch (error) {
      window.location.assign(link.href);
    }
  }, false);

  window.addEventListener('pageshow', restoreStorefront);
  window.addEventListener('popstate', restoreStorefront);
  window.addEventListener('focus', restoreStorefront);
  window.addEventListener('pageshow', function () {
    window.setTimeout(restoreStorefront, 0);
    window.setTimeout(restoreStorefront, 250);
    window.setTimeout(restoreStorefront, 750);
    window.setTimeout(restoreStorefront, 1500);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      restoreStorefront();
      window.setTimeout(restoreStorefront, 50);
      window.setTimeout(restoreStorefront, 300);
    }
  });

  if (window.MutationObserver) {
    new MutationObserver(function () {
      clearPageTransition();
      clearGlobalLoaders();
    }).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }

  restoreStorefront();
  window.setInterval(function () {
    if (document.visibilityState === 'visible') restoreStorefront();
  }, 1000);
}());
