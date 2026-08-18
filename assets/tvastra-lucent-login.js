(function () {
  'use strict';

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
      document.querySelector('#sotp') ||
      document.querySelector('#sotp-modal') ||
      document.querySelector('.sotp-modal-container') ||
      document.querySelector('lota-customer-account[open]') ||
      document.querySelector('[aria-controls="sotp"][aria-expanded="true"]')
    );
  }

  function wakeUp() {
    if (woken) return;
    woken = true;
    try {
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 200, clientY: 200 }));
      document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 200, clientY: 200 }));
      window.dispatchEvent(new Event('scroll'));
    } catch (e) {}
  }

  function tryOpen(attempt) {
    attempt = attempt || 0;
    if (!shouldShow()) return;
    if (isOpen()) return;

    // Try all methods in order
    var opened = false;

    // Method 1: Dispatch real-looking click on every possible trigger element
    var btn = document.querySelector('[data-tvastra-lucent-login]') ||
              document.querySelector('[aria-controls="sotp"]') ||
              document.querySelector('a[href="#lucent-login"]');

    if (btn) {
      // Use both click() and dispatchEvent for maximum compatibility
      try { btn.click(); } catch(e) {}
      try {
        btn.dispatchEvent(new MouseEvent('click', {
          bubbles: true, cancelable: true, view: window,
          detail: 1, screenX: 0, screenY: 0, clientX: 0, clientY: 0
        }));
      } catch(e) {}
    }

    // Method 2: Hash change (Lota may listen for hashchange event)
    try {
      var prevHash = window.location.hash;
      if (prevHash !== '#lucent-login') {
        window.location.hash = '#lucent-login';
      }
    } catch(e) {}

    // Method 3: Direct API if available
    try {
      if (window.simplyOtp && typeof window.simplyOtp.openLoginOrAccountModal === 'function') {
        window.simplyOtp.openLoginOrAccountModal();
      } else if (window.simplyOtp && typeof window.simplyOtp.open === 'function') {
        window.simplyOtp.open();
      }
    } catch(e) {}

    // Retry if popup did not open
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
    // 8s first popup (give Lota more time to fully initialize)
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
