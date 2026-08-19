(function () {
  'use strict';

  window.tvastra = window.tvastra || {};
  window.tvastra.lucentAutoPopup = true;

  console.log('TVASTRA LUCENT v16: Script running. readyState=' + document.readyState + ' customer=' + JSON.stringify(window.tvastra.customer) + ' pathname=' + window.location.pathname);

  var cadenceTimers = [];
  var woken = false;

  function shouldShow() {
    if (window.tvastra.customer) {
      console.log('TVASTRA LUCENT v16: shouldShow=false (customer logged in)');
      return false;
    }
    if (window.location.pathname.indexOf('/checkout') !== -1) {
      console.log('TVASTRA LUCENT v16: shouldShow=false (checkout page)');
      return false;
    }
    return true;
  }

  function isVisible(selector) {
    var el = document.querySelector(selector);
    if (!el) return false;
    // Must have actual height — offsetWidth alone is not enough (#sotp spans full width even when closed)
    return el.offsetHeight > 0;
  }

  function isOpen() {
    return !!(
      document.querySelector('#sotp[open]') ||
      document.querySelector('dialog[open]') ||
      document.querySelector('lota-customer-account[open]') ||
      (document.querySelector('.sotp-modal-container') && isVisible('.sotp-modal-container')) ||
      (document.querySelector('.sotp-popup-container') && isVisible('.sotp-popup-container')) ||
      (document.querySelector('.sotp-popup-content') && isVisible('.sotp-popup-content')) ||
      (document.querySelector('#sotp') && isVisible('#sotp')) ||
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

    var triggered = false;

    // Method 1: simplyOtp API (primary — most reliable)
    try {
      if (window.simplyOtp && !window.tvastra.lucentTriggered) {
        window.tvastra.lucentTriggered = true;
        triggered = true;
        console.log('TVASTRA LUCENT v16: simplyOtp found! Calling initializeSimplyOtp + openPopup...');
        if (typeof window.simplyOtp.initializeSimplyOtp === 'function') {
          window.simplyOtp.initializeSimplyOtp();
        }
        var fnNames = ['openPopup', 'openLoginOrAccountModal', 'open', 'show', 'openModal', 'init'];
        for (var i = 0; i < fnNames.length; i++) {
          if (typeof window.simplyOtp[fnNames[i]] === 'function') {
            console.log('TVASTRA LUCENT v16: Calling simplyOtp.' + fnNames[i] + '()');
            window.simplyOtp[fnNames[i]]();
            break;
          }
        }
      }
    } catch(e) {
      console.error('TVASTRA LUCENT v16: Error in simplyOtp block:', e);
    }

    // Method 2: fallback DOM methods (only once)
    if (!triggered && !window.tvastra.lucentTriggered) {
      var lotaEl = document.querySelector('lota-customer-account');
      var dialog = document.querySelector('#sotp, dialog[aria-label*="login"], dialog[aria-label*="account"]');
      var btn = document.querySelector('[data-tvastra-lucent-login]') ||
                document.querySelector('[aria-controls="sotp"]') ||
                document.querySelector('a[href="#lucent-login"]');

      if (lotaEl || dialog || btn) {
        window.tvastra.lucentTriggered = true;
        console.log('TVASTRA LUCENT v16: Fallback DOM methods triggered');
        if (lotaEl) {
          if (typeof lotaEl.open === 'function') { try { lotaEl.open(); } catch(e) {} }
          if (typeof lotaEl.show === 'function') { try { lotaEl.show(); } catch(e) {} }
          if (typeof lotaEl.openModal === 'function') { try { lotaEl.openModal(); } catch(e) {} }
          if (typeof lotaEl.openPopup === 'function') { try { lotaEl.openPopup(); } catch(e) {} }
        }
        if (dialog) {
          if (typeof dialog.showModal === 'function') { try { dialog.showModal(); } catch(e) {} }
          if (typeof dialog.show === 'function') { try { dialog.show(); } catch(e) {} }
        }
        if (btn) {
          try { btn.click(); } catch(e) {}
        }
        try {
          if (window.location.hash !== '#lucent-login') {
            window.location.hash = '#lucent-login';
          }
        } catch(e) {}
      } else {
        console.log('TVASTRA LUCENT v16: attempt ' + attempt + ' — simplyOtp and DOM elements not ready yet');
      }
    }

    // Retry loop — waits for popup to become visible
    if (attempt < 120) {
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
    console.log('TVASTRA LUCENT v16: triggerLucent fired. isOpen=' + isOpen() + ' shouldShow=' + shouldShow());
    if (!shouldShow()) return stopCadence();
    if (isOpen()) return;
    window.tvastra.lucentTriggered = false; // Reset for this interval
    wakeUp();
    tryOpen(0);
  }

  function startCadence() {
    console.log('TVASTRA LUCENT v16: startCadence called. shouldShow=' + shouldShow());
    if (!shouldShow()) return;
    console.log('TVASTRA LUCENT v16: Scheduling timers (8s, 50s, 120s interval)...');
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

  console.log('TVASTRA LUCENT v16: Registering DOMContentLoaded / calling startCadence...');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startCadence);
  } else {
    startCadence();
  }

}());
