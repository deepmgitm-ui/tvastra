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

  var cadenceTimers = [];
  var woken = false;

  function shouldShow() {
    if (window.tvastra.customer) return false;
    if (window.location.pathname.indexOf('/checkout') !== -1) return false;
    return true;
  }

  function isOpen() {
    if (document.querySelector('#sotp[open]')) return true;
    if (document.querySelector('dialog[open]')) return true;
    if (document.querySelector('lota-customer-account[open]')) return true;
    if (document.querySelector('[aria-controls="sotp"][aria-expanded="true"]')) return true;
    var sotp = document.querySelector('#sotp');
    return !!(sotp && sotp.offsetHeight > 0);
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
    if (!shouldShow() || isOpen()) return false;

    var opened = false;

    // Primary Lucent/SimplyOTP API.
    try {
      if (window.simplyOtp) {
        if (typeof window.simplyOtp.initializeSimplyOtp === 'function') {
          try { window.simplyOtp.initializeSimplyOtp(); } catch (e) {}
        }

        var fnNames = ['openPopup', 'openLoginOrAccountModal', 'open', 'show', 'openModal', 'init'];
        for (var i = 0; i < fnNames.length; i++) {
          if (typeof window.simplyOtp[fnNames[i]] === 'function') {
            window.simplyOtp[fnNames[i]]();
            opened = true;
            break;
          }
        }
      }
    } catch (e) {
      console.error('TVASTRA LUCENT: simplyOtp error:', e);
    }

    // DOM fallback if the app exposes the modal directly.
    if (!opened) {
      try {
        var lotaEl = document.querySelector('lota-customer-account');
        var dialog = document.querySelector('#sotp, dialog[aria-label*="login"], dialog[aria-label*="account"]');
        var btn = document.querySelector('[data-tvastra-lucent-login]') ||
                  document.querySelector('[aria-controls="sotp"]') ||
                  document.querySelector('a[href="#lucent-login"]');

        if (lotaEl) {
          if (typeof lotaEl.open === 'function') { try { lotaEl.open(); opened = true; } catch (e) {} }
          if (!opened && typeof lotaEl.show === 'function') { try { lotaEl.show(); opened = true; } catch (e) {} }
          if (!opened && typeof lotaEl.openModal === 'function') { try { lotaEl.openModal(); opened = true; } catch (e) {} }
          if (!opened && typeof lotaEl.openPopup === 'function') { try { lotaEl.openPopup(); opened = true; } catch (e) {} }
        }

        if (!opened && dialog) {
          if (typeof dialog.showModal === 'function') { try { dialog.showModal(); opened = true; } catch (e) {} }
          if (!opened && typeof dialog.show === 'function') { try { dialog.show(); opened = true; } catch (e) {} }
        }

        if (!opened && btn) {
          try {
            btn.click();
            opened = true;
          } catch (e) {}
        }
      } catch (e) {
        console.error('TVASTRA LUCENT: DOM fallback error:', e);
      }
    }

    if (opened) {
      window.tvastra.lucentTriggered = true;
      window.tvastra.lucentLastTriggered = Date.now();
      return true;
    }

    // Critical: do NOT mark the trigger as complete until a real opener exists.
    // The Lucent library may create window.simplyOtp before its methods are ready.
    if (attempt < 120 && shouldShow() && !isOpen()) {
      window.setTimeout(function () { tryOpen(attempt + 1); }, 500);
    }
    return false;
  }

  function stopCadence() {
    cadenceTimers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    cadenceTimers = [];
  }

  function triggerLucent() {
    if (!shouldShow()) return stopCadence();
    if (isOpen()) return;

    var now = Date.now();
    if (window.tvastra.lucentLastTriggered && (now - window.tvastra.lucentLastTriggered) < 45000) return;

    window.tvastra.lucentTriggered = false;
    wakeUp();
    tryOpen(0);
  }

  function startCadence() {
    if (!shouldShow()) return;
    window.setTimeout(wakeUp, 2000);
    cadenceTimers.push(window.setTimeout(triggerLucent, 8000));
    cadenceTimers.push(window.setTimeout(triggerLucent, 50000));
    cadenceTimers.push(window.setInterval(triggerLucent, 120000));

    // Library can be lazy-loaded well after DOMContentLoaded.
    window.setTimeout(triggerLucent, 1500);
    window.setTimeout(triggerLucent, 4000);
  }

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f && f.action && f.action.indexOf('/account') !== -1) stopCadence();
  }, true);

  document.addEventListener('click', function (e) {
    var target = e.target.closest('[data-tvastra-lucent-login], [href="#lucent-login"], [aria-controls="sotp"]');
    if (!target) return;

    e.preventDefault();
    window.tvastra.lucentTriggered = false;
    tryOpen(0);
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startCadence);
  } else {
    startCadence();
  }
}());