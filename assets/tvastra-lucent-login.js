(function () {
  'use strict';

  // Keep Shipway / Ezy Returns completely isolated from Lucent automation.
  var path = window.location && window.location.pathname ? window.location.pathname : '';
  var isEzyReturns = path === '/apps/ezy/returns' || path.indexOf('/apps/ezy/returns/') === 0;
  if (isEzyReturns) return;

  window.tvastra = window.tvastra || {};
  window.tvastra.lucentAutoPopup = true;

  var cadenceTimers = [];
  var woken = false;

  function shouldShow() {
    if (window.tvastra.customer) return false;
    if (window.location.pathname.indexOf('/checkout') !== -1) return false;
    try {
      if (localStorage.getItem('tvastra_lucent_submitted') === 'yes') return false;
    } catch (e) {}
    return true;
  }

  function isOpen() {
    return !!(
      document.querySelector('#sotp[open]') ||
      document.querySelector('dialog[open]') ||
      document.querySelector('lota-customer-account[open]') ||
      document.querySelector('.sotp-modal-container') ||
      document.querySelector('[aria-controls="sotp"][aria-expanded="true"]')
    );
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

    // Method 1: Direct call on lota-customer-account custom element
    var lotaEl = document.querySelector('lota-customer-account');
    if (lotaEl) {
      if (typeof lotaEl.open === 'function') { try { lotaEl.open(); } catch(e) {} }
      if (typeof lotaEl.show === 'function') { try { lotaEl.show(); } catch(e) {} }
      if (typeof lotaEl.openModal === 'function') { try { lotaEl.openModal(); } catch(e) {} }
      if (typeof lotaEl.openPopup === 'function') { try { lotaEl.openPopup(); } catch(e) {} }
    }

    // Method 2: The sotp dialog element directly
    var dialog = document.querySelector('#sotp, dialog[aria-label*="login"], dialog[aria-label*="account"]');
    if (dialog) {
      if (typeof dialog.showModal === 'function') { try { dialog.showModal(); } catch(e) {} }
      if (typeof dialog.show === 'function') { try { dialog.show(); } catch(e) {} }
    }

    // Method 3: Button click (both methods)
    var btn = document.querySelector('[data-tvastra-lucent-login]') ||
              document.querySelector('[aria-controls="sotp"]') ||
              document.querySelector('a[href="#lucent-login"]');
    if (btn) {
      try { btn.click(); } catch(e) {}
    }

    // Method 4: Hash change — Lota may listen for hashchange
    try {
      if (window.location.hash !== '#lucent-login') {
        window.location.hash = '#lucent-login';
      }
    } catch(e) {}

    // Method 5: simplyOtp API
    try {
      if (window.simplyOtp) {
        var fnNames = ['openLoginOrAccountModal','openPopup','open','show','openModal','init'];
        for (var i = 0; i < fnNames.length; i++) {
          if (typeof window.simplyOtp[fnNames[i]] === 'function') {
            window.simplyOtp[fnNames[i]]();
            break;
          }
        }
      }
    } catch(e) {}

    // Retry if popup still not open
    if (attempt < 30) {
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
      try { localStorage.setItem('tvastra_lucent_submitted', 'yes'); } catch (ex) {}
      stopCadence();
    }
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startCadence);
  } else {
    startCadence();
  }

}());
