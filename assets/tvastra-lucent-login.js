(function () {
  'use strict';

  window.tvastra = window.tvastra || {};
  window.tvastra.lucentAutoPopup = true;

  var cadenceTimers = [];
  var woken = false;

  // ─── Guards ──────────────────────────────────────────────────────────────────

  function shouldShow() {
    if (window.tvastra.customer) return false;
    if (window.location.pathname.indexOf('/checkout') !== -1) return false;
    try {
      if (localStorage.getItem('tvastra_lucent_submitted') === 'yes') return false;
    } catch (e) {}
    return true;
  }

  // Check every known selector Lota/Lucent might use for the modal
  function isOpen() {
    return !!(
      document.querySelector('#sotp') ||
      document.querySelector('#sotp-modal') ||
      document.querySelector('.sotp-modal-container') ||
      document.querySelector('[data-sotp-modal]') ||
      document.querySelector('lota-customer-account[open]') ||
      document.querySelector('.sotp-overlay') ||
      document.querySelector('[aria-controls="sotp"][aria-expanded="true"]')
    );
  }

  // Wake up lazy-loaded Lota/Lucent
  function wakeUp() {
    if (woken) return;
    woken = true;
    try {
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 200, clientY: 200 }));
      document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 200, clientY: 200 }));
      window.dispatchEvent(new Event('scroll'));
    } catch (e) {}
  }

  // Find the login button
  function getBtn() {
    return document.querySelector('[data-tvastra-lucent-login]') ||
           document.querySelector('a[href="#lucent-login"]') ||
           document.querySelector('[aria-controls="sotp"]');
  }

  // Click the button, then verify popup opened; if not, retry
  function clickAndVerify(attempt) {
    attempt = attempt || 0;
    if (!shouldShow()) return;
    if (isOpen()) return; // already open

    var btn = getBtn();
    if (btn) {
      // Use native click (closest to real user interaction)
      btn.click();
    }

    // Check 600ms later if popup actually opened; if not, retry up to 25 times
    if (attempt < 25) {
      window.setTimeout(function () {
        if (shouldShow() && !isOpen()) {
          clickAndVerify(attempt + 1);
        }
      }, 600);
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
    clickAndVerify(0);
  }

  function startCadence() {
    if (!shouldShow()) return;
    // 2s: pre-warm Lota
    // 5s: first popup
    // 45s: second popup
    // 2min: loop
    window.setTimeout(wakeUp, 2000);
    var t1 = window.setTimeout(triggerLucent, 5000);
    var t2 = window.setTimeout(triggerLucent, 45000);
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
