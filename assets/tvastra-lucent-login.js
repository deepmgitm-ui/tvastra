(function () {
  'use strict';

  window.tvastra = window.tvastra || {};
  window.tvastra.lucentAutoPopup = true;

  var cadenceTimers = [];
  var lazyWakeupDone = false;

  // Only show to logged-out users, not on checkout
  function shouldShow() {
    if (window.tvastra.customer) return false;
    if (window.location.pathname.indexOf('/checkout') !== -1) return false;
    try {
      if (localStorage.getItem('tvastra_lucent_submitted') === 'yes') return false;
    } catch (e) {}
    return true;
  }

  function isAlreadyOpen() {
    return !!(
      document.querySelector('#sotp-modal') ||
      document.querySelector('.sotp-modal-container') ||
      document.querySelector('[data-sotp-modal]') ||
      document.querySelector('.simply-otp-modal') ||
      document.querySelector('.sotp-overlay')
    );
  }

  // Fire fake interaction events to wake up lazy-loaded scripts
  function wakeUpLazily() {
    if (lazyWakeupDone) return;
    lazyWakeupDone = true;
    try {
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 200, clientY: 200 }));
      document.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('touchstart', { bubbles: true }));
    } catch (e) {}
  }

  function openPopup() {
    // Method 1: Direct API call (if Lucent exposes it)
    if (window.simplyOtp) {
      if (typeof window.simplyOtp.openLoginOrAccountModal === 'function') {
        window.simplyOtp.openLoginOrAccountModal();
        return true;
      }
      if (typeof window.simplyOtp.openPopup === 'function') {
        window.simplyOtp.openPopup();
        return true;
      }
    }

    // Method 2: Dispatch a trusted synthetic click on the login button
    // Safe because shouldShow() already confirmed user is NOT logged in
    var btn = document.querySelector('[data-tvastra-lucent-login]') ||
              document.querySelector('a[href="#lucent-login"]') ||
              document.querySelector('[aria-controls="sotp"]');
    if (btn) {
      var evt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
      btn.dispatchEvent(evt);
      return true;
    }

    return false;
  }

  function stopCadence() {
    cadenceTimers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    cadenceTimers = [];
  }

  function triggerLucent(retries) {
    if (!shouldShow()) return stopCadence();
    if (isAlreadyOpen()) return;

    var opened = openPopup();
    if (!opened && (retries || 0) < 30) {
      // Retry in 500ms if nothing found yet (lazy load still pending)
      window.setTimeout(function () { triggerLucent((retries || 0) + 1); }, 500);
    }
  }

  function startCadence() {
    if (!shouldShow()) return;
    // 2s: pre-warm lazy loader
    // 5s: first popup
    // 45s: second popup
    // every 2min: repeat
    window.setTimeout(wakeUpLazily, 2000);
    var t1 = window.setTimeout(function () { triggerLucent(0); }, 5000);
    var t2 = window.setTimeout(function () { triggerLucent(0); }, 45000);
    var t3 = window.setInterval(function () { triggerLucent(0); }, 120000);
    cadenceTimers.push(t1, t2, t3);
  }

  // Stop cadence permanently once user submits any account form
  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (form && form.action && form.action.indexOf('/account') !== -1) {
      try { localStorage.setItem('tvastra_lucent_submitted', 'yes'); } catch (e) {}
      stopCadence();
    }
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startCadence);
  } else {
    startCadence();
  }

}());
