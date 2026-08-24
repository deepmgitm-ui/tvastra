(function () {
  'use strict';

  // Tvastra Lucent login helper.
  // The Lucent OTP popup remains unchanged on normal storefront pages.
  // Shopify/Shipway Ezy Returns is isolated because its own form must not be
  // covered or interrupted by the Lucent modal/app embed.
  var path = window.location && window.location.pathname ? window.location.pathname : '';
  var isEzyReturns = path === '/apps/ezy/returns' || path.indexOf('/apps/ezy/returns/') === 0;

  function suppressLucentOnEzy() {
    // Lucent/SimplyOTP can be injected independently by the app embed, so
    // suppress it at the DOM level on this route even when the app loads later.
    var selectors = [
      '#sotp',
      'lota-customer-account',
      '[data-simply-otp]',
      '[id*="simply-otp"]',
      '[class*="sotp-popup"]',
      '[class*="simply-otp"]'
    ];

    function hidePopup() {
      for (var i = 0; i < selectors.length; i++) {
        var nodes;
        try {
          nodes = document.querySelectorAll(selectors[i]);
        } catch (e) {
          continue;
        }

        for (var j = 0; j < nodes.length; j++) {
          var node = nodes[j];
          if (!node) continue;

          // Close native dialog states where possible.
          try {
            if (node.open === true && typeof node.close === 'function') {
              node.close();
            }
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
      }

      // Some versions render a standalone overlay/backdrop without putting it
      // inside #sotp. Hide only obvious OTP modal backdrops on Ezy Returns.
      var overlays = document.querySelectorAll(
        '.sotp-overlay, .sotp-backdrop, [class*="sotp-overlay"], [class*="sotp-backdrop"]'
      );
      for (var k = 0; k < overlays.length; k++) {
        try {
          overlays[k].style.setProperty('display', 'none', 'important');
          overlays[k].style.setProperty('pointer-events', 'none', 'important');
        } catch (e) {}
      }
    }

    hidePopup();

    if (window.MutationObserver && document.documentElement) {
      var observer = new MutationObserver(function () {
        hidePopup();
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['open', 'style', 'class', 'aria-hidden']
      });
    }

    // Also re-check after app/embed initialization delays.
    window.setTimeout(hidePopup, 500);
    window.setTimeout(hidePopup, 1500);
    window.setTimeout(hidePopup, 3000);
    console.log('TVASTRA LUCENT: suppressed on Ezy Returns page only.');
  }

  if (isEzyReturns) {
    suppressLucentOnEzy();
    return;
  }

  window.tvastra = window.tvastra || {};
  window.tvastra.lucentAutoPopup = false;

  function shouldShow() {
    if (window.tvastra.customer) return false;
    if (window.location.pathname.indexOf('/checkout') !== -1) return false;
    return true;
  }

  function openLogin() {
    if (!shouldShow()) return;

    try {
      if (window.simplyOtp) {
        if (typeof window.simplyOtp.initializeSimplyOtp === 'function') {
          window.simplyOtp.initializeSimplyOtp();
        }

        var fnNames = [
          'openPopup',
          'openLoginOrAccountModal',
          'open',
          'show',
          'openModal'
        ];

        for (var i = 0; i < fnNames.length; i++) {
          if (typeof window.simplyOtp[fnNames[i]] === 'function') {
            window.simplyOtp[fnNames[i]]();
            return;
          }
        }
      }

      var lotaEl = document.querySelector('lota-customer-account');
      var dialog = document.querySelector(
        '#sotp, dialog[aria-label*="login"], dialog[aria-label*="account"]'
      );

      if (lotaEl) {
        if (typeof lotaEl.open === 'function') {
          try { lotaEl.open(); } catch (e) {}
        }
        if (typeof lotaEl.show === 'function') {
          try { lotaEl.show(); } catch (e) {}
        }
        if (typeof lotaEl.openModal === 'function') {
          try { lotaEl.openModal(); } catch (e) {}
        }
        if (typeof lotaEl.openPopup === 'function') {
          try { lotaEl.openPopup(); } catch (e) {}
        }
        return;
      }

      if (dialog) {
        if (typeof dialog.showModal === 'function') {
          try { dialog.showModal(); } catch (e) {}
        } else if (typeof dialog.show === 'function') {
          try { dialog.show(); } catch (e) {}
        }
      }
    } catch (error) {
      console.error('TVASTRA LUCENT: Error opening login popup:', error);
    }
  }

  // Normal Tvastra pages: preserve manual login behaviour.
  document.addEventListener('click', function (e) {
    var target = e.target.closest(
      '[data-tvastra-lucent-login], [href="#lucent-login"], [aria-controls="sotp"]'
    );

    if (!target) return;

    e.preventDefault();
    openLogin();
  });

  console.log('TVASTRA LUCENT: normal storefront mode enabled.');
}());
