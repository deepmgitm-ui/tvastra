(function () {
  'use strict';

  window.tvastra = window.tvastra || {};
  window.tvastra.lucentAutoPopup = true;

  var cadenceTimers = [];
  var lazyWakeupDone = false;

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
      document.querySelector('.simply-otp-modal')
    );
  }

  function wakeUpLazily() {
    if (lazyWakeupDone) return;
    lazyWakeupDone = true;
    try {
      var fakeMove = new MouseEvent('mousemove', { bubbles: true, cancelable: false, clientX: 100, clientY: 100 });
      document.dispatchEvent(fakeMove);
      window.dispatchEvent(new Event('scroll'));
    } catch (e) {}
  }

  function openLucentPopup(retries) {
    retries = retries || 0;
    if (window.simplyOtp) {
      if (typeof window.simplyOtp.openLoginOrAccountModal === 'function') {
        window.simplyOtp.openLoginOrAccountModal();
        return;
      }
      if (typeof window.simplyOtp.openPopup === 'function') {
        window.simplyOtp.openPopup();
        return;
      }
    }
    if (retries >= 60) return;
    window.setTimeout(function () { openLucentPopup(retries + 1); }, 500);
  }

  function stopCadence() {
    cadenceTimers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    cadenceTimers = [];
  }

  function triggerLucent() {
    if (!shouldShow()) return stopCadence();
    if (isAlreadyOpen()) return;
    wakeUpLazily();
    openLucentPopup(0);
  }

  function startCadence() {
    if (!shouldShow()) return;
    window.setTimeout(wakeUpLazily, 2000);
    var t1 = window.setTimeout(triggerLucent, 5000);
    var t2 = window.setTimeout(triggerLucent, 45000);
    var t3 = window.setInterval(triggerLucent, 120000);
    cadenceTimers.push(t1, t2, t3);
  }

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
