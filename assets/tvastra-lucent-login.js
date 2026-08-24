(function () {
  'use strict';

  // Tvastra Lucent login helper.
  // Normal storefront behaviour is preserved. Only the Shipway/Ezy Returns
  // route gets an isolation layer so Lucent cannot cover/intercept the Ezy form.
  var path = window.location && window.location.pathname ? window.location.pathname : '';
  var isEzyReturns = path === '/apps/ezy/returns' || path.indexOf('/apps/ezy/returns/') === 0;

  function suppressLucentOnEzy() {
    var selectors = [
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

    function hide(node) {
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

    function looksLikeLucentText(text) {
      if (!text) return false;
      var t = String(text).replace(/\s+/g, ' ').trim().toLowerCase();
      return (
        t.indexOf('we are thrilled to have you here') !== -1 ||
        (t.indexOf('login with otp') !== -1 && t.length < 800) ||
        (t.indexOf('enter your phone number') !== -1 && t.indexOf('otp') !== -1 && t.length < 1200)
      );
    }

    function scan(root) {
      if (!root) return;

      // Known Lucent/SimplyOTP selectors.
      for (var i = 0; i < selectors.length; i++) {
        try {
          var nodes = root.querySelectorAll ? root.querySelectorAll(selectors[i]) : [];
          for (var j = 0; j < nodes.length; j++) hide(nodes[j]);
        } catch (e) {}
      }

      // The app can use generated class names. Identify the popup by its
      // visible Lucent copy, then hide the nearest modal/dialog/container.
      try {
        var all = root.querySelectorAll ? root.querySelectorAll('body *') : [];
        for (var k = 0; k < all.length; k++) {
          var el = all[k];
          if (!looksLikeLucentText(el.innerText || el.textContent || '')) continue;

          var candidate = el;
          for (var depth = 0; depth < 6 && candidate && candidate.parentElement; depth++) {
            var cs = window.getComputedStyle(candidate);
            var role = (candidate.getAttribute && candidate.getAttribute('role')) || '';
            var cls = (candidate.className && typeof candidate.className === 'string') ? candidate.className : '';
            var id = candidate.id || '';
            if (
              role === 'dialog' ||
              role === 'presentation' ||
              candidate.tagName === 'DIALOG' ||
              /modal|popup|drawer|overlay|dialog|otp|login/i.test(cls + ' ' + id) ||
              (cs && (cs.position === 'fixed' || cs.position === 'sticky'))
            ) {
              hide(candidate);
              break;
            }
            candidate = candidate.parentElement;
          }
        }
      } catch (e) {}

      // Some app versions render into shadow DOM. Walk open shadow roots too.
      try {
        var elements = root.querySelectorAll ? root.querySelectorAll('*') : [];
        for (var s = 0; s < elements.length; s++) {
          if (elements[s].shadowRoot) scan(elements[s].shadowRoot);
        }
      } catch (e) {}
    }

    function hidePopup() {
      scan(document);
      try {
        var overlays = document.querySelectorAll(
          '.sotp-overlay, .sotp-backdrop, [class*="sotp-overlay"], [class*="sotp-backdrop"], [class*="otp-overlay"], [class*="otp-backdrop"]'
        );
        for (var i = 0; i < overlays.length; i++) hide(overlays[i]);
      } catch (e) {}
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

    // Cover delayed app-embed initialization and cached/late-injected markup.
    window.setTimeout(hidePopup, 100);
    window.setTimeout(hidePopup, 500);
    window.setTimeout(hidePopup, 1500);
    window.setTimeout(hidePopup, 3000);
    window.setTimeout(hidePopup, 6000);
    console.log('TVASTRA LUCENT: suppressed on Ezy Returns page only.');
  }

  if (isEzyReturns) {
    suppressLucentOnEzy();
    return;
  }

  // Normal Tvastra storefront: keep Lucent's existing manual login behaviour.
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
        if (typeof window.simplyOtp.initializeSimplyOtp === 'function') window.simplyOtp.initializeSimplyOtp();
        var fnNames = ['openPopup', 'openLoginOrAccountModal', 'open', 'show', 'openModal'];
        for (var i = 0; i < fnNames.length; i++) {
          if (typeof window.simplyOtp[fnNames[i]] === 'function') {
            window.simplyOtp[fnNames[i]]();
            return;
          }
        }
      }
      var lotaEl = document.querySelector('lota-customer-account');
      var dialog = document.querySelector('#sotp, dialog[aria-label*="login"], dialog[aria-label*="account"]');
      if (lotaEl) {
        if (typeof lotaEl.open === 'function') { try { lotaEl.open(); } catch (e) {} }
        if (typeof lotaEl.show === 'function') { try { lotaEl.show(); } catch (e) {} }
        if (typeof lotaEl.openModal === 'function') { try { lotaEl.openModal(); } catch (e) {} }
        if (typeof lotaEl.openPopup === 'function') { try { lotaEl.openPopup(); } catch (e) {} }
        return;
      }
      if (dialog) {
        if (typeof dialog.showModal === 'function') { try { dialog.showModal(); } catch (e) {} }
        else if (typeof dialog.show === 'function') { try { dialog.show(); } catch (e) {} }
      }
    } catch (error) {
      console.error('TVASTRA LUCENT: Error opening login popup:', error);
    }
  }

  document.addEventListener('click', function (e) {
    var target = e.target.closest('[data-tvastra-lucent-login], [href="#lucent-login"], [aria-controls="sotp"]');
    if (!target) return;
    e.preventDefault();
    openLogin();
  });

  console.log('TVASTRA LUCENT: normal storefront mode enabled.');
}());
