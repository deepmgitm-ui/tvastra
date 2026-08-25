(function () {
  'use strict';

  // Tvastra Lucent login helper.
  // Keep the original automatic Lucent popup behavior on normal storefront pages.
  // Shopify App Proxy / Shipway-Ezy Returns pages are isolated so the return form
  // is never interrupted by the Tvastra login automation.
  var path = window.location && window.location.pathname ? window.location.pathname : '';
  var isEzyReturns = path === '/apps/ezy/returns' || path.indexOf('/apps/ezy/returns/') === 0;

  if (isEzyReturns) {
    console.log('TVASTRA LUCENT: skipped on Ezy Returns page.');
    return;
  }

  window.tvastra = window.tvastra || {};
  window.tvastra.lucentAutoPopup = true;

  console.log('TVASTRA LUCENT: Script running. readyState=' + document.readyState + ' customer=' + JSON.stringify(window.tvastra.customer) + ' pathname=' + window.location.pathname);

  var cadenceTimers = [];
  var woken = false;

  function shouldShow() {
    if (window.tvastra.customer) {
      console.log('TVASTRA LUCENT: shouldShow=false (customer logged in)');
      return false;
    }
    if (window.location.pathname.indexOf('/checkout') !== -1) {
      console.log('TVASTRA LUCENT: shouldShow=false (checkout page)');
      return false;
    }
    return true;
  }

  function isOpen() {
    if (document.querySelector('#sotp[open]')) return true;
    if (document.querySelector('dialog[open]')) return true;
    if (document.querySelector('lota-customer-account[open]')) return true;
    if (document.querySelector('[aria-controls="sotp"][aria-expanded="true"]')) return true;
    var sotp = document.querySelector('#sotp');
    if (sotp && sotp.offsetHeight > 0) return true;
    return false;
  }

  function wakeUp() {
    if (woken) return;
    woken = true;
    try {
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 200, clientY: 200 }));
      window.dispatchEvent(new Event('scroll'));
    } catch (e) {}
  }

  function tryOpen(attempt) {
    attempt = attempt || 0;
    if (!shouldShow()) return;
    if (isOpen()) return;

    var triggered = false;

    try {
      if (window.simplyOtp && !window.tvastra.lucentTriggered) {
        window.tvastra.lucentTriggered = true;
        window.tvastra.lucentLastTriggered = Date.now();
        triggered = true;
        if (typeof window.simplyOtp.initializeSimplyOtp === 'function') {
          window.simplyOtp.initializeSimplyOtp();
        }
        var fnNames = ['openPopup', 'openLoginOrAccountModal', 'open', 'show', 'openModal', 'init'];
        for (var i = 0; i < fnNames.length; i++) {
          if (typeof window.simplyOtp[fnNames[i]] === 'function') {
            window.simplyOtp[fnNames[i]]();
            break;
          }
        }
      }
    } catch (e) {
      console.error('TVASTRA LUCENT: Error in simplyOtp block:', e);
    }

    if (!triggered && !window.tvastra.lucentTriggered) {
      var lotaEl = document.querySelector('lota-customer-account');
      var dialog = document.querySelector('#sotp, dialog[aria-label*="login"], dialog[aria-label*="account"]');
      var btn = document.querySelector('[data-tvastra-lucent-login]') ||
                document.querySelector('[aria-controls="sotp"]') ||
                document.querySelector('a[href="#lucent-login"]');

      if (lotaEl || dialog || btn) {
        window.tvastra.lucentTriggered = true;
        if (lotaEl) {
          if (typeof lotaEl.open === 'function') { try { lotaEl.open(); } catch (e) {} }
          if (typeof lotaEl.show === 'function') { try { lotaEl.show(); } catch (e) {} }
          if (typeof lotaEl.openModal === 'function') { try { lotaEl.openModal(); } catch (e) {} }
          if (typeof lotaEl.openPopup === 'function') { try { lotaEl.openPopup(); } catch (e) {} }
        }
        if (dialog) {
          if (typeof dialog.showModal === 'function') { try { dialog.showModal(); } catch (e) {} }
          if (typeof dialog.show === 'function') { try { dialog.show(); } catch (e) {} }
        }
        if (btn) {
          try { btn.click(); } catch (e) {}
        }
        try {
          if (window.location.hash !== '#lucent-login') {
            window.location.hash = '#lucent-login';
          }
        } catch (e) {}
      }
    }

    if (attempt < 120 && !window.tvastra.lucentTriggered) {
      window.setTimeout(function () {
        if (shouldShow() && !isOpen()) {
          tryOpen(attempt + 1);
        }
      }, 500);
    }
  }

  function stopCadence() {
    cadenceTimers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    cadenceTimers = [];
  }

  function triggerLucent() {
    if (!shouldShow()) return stopCadence();
    if (isOpen()) return;

    var now = Date.now();
    if (window.tvastra.lucentLastTriggered && (now - window.tvastra.lucentLastTriggered) < 45000) {
      return;
    }
    window.tvastra.lucentTriggered = false;
    wakeUp();
    tryOpen(0);
  }

  function startCadence() {
    if (!shouldShow()) return;
    window.setTimeout(wakeUp, 2000);
    var t1 = window.setTimeout(triggerLucent, 8000);
    var t2 = window.setTimeout(triggerLucent, 50000);
    var t3 = window.setInterval(triggerLucent, 120000);
    cadenceTimers.push(t1, t2, t3);
  }

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f && f.action && f.action.indexOf('/account') !== -1) {
      stopCadence();
    }
  }, true);

  document.addEventListener('click', function (e) {
    var target = e.target.closest('[data-tvastra-lucent-login], [href="#lucent-login"], [aria-controls="sotp"]');
    if (!target) return;

    e.preventDefault();
    try {
      if (window.simplyOtp) {
        if (typeof window.simplyOtp.initializeSimplyOtp === 'function') {
          window.simplyOtp.initializeSimplyOtp();
        }
        var fnNames = ['openPopup', 'openLoginOrAccountModal', 'open', 'show', 'openModal'];
        for (var i = 0; i < fnNames.length; i++) {
          if (typeof window.simplyOtp[fnNames[i]] === 'function') {
            window.simplyOtp[fnNames[i]]();
            break;
          }
        }
      }
    } catch (ex) {
      console.error('TVASTRA LUCENT: Error opening popup manually:', ex);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startCadence);
  } else {
    startCadence();
  }
}());
