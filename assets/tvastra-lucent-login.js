(function () {
  'use strict';

  var selector = '[data-tvastra-lucent-login], a[href="#lucent-login"]';
  window.tvastra = window.tvastra || {};
  window.tvastra.lucentAutoPopup = true;
  var cadenceTimers = [];

  function stopAutoLucent() {
    cadenceTimers.forEach(function(timer) { clearTimeout(timer); clearInterval(timer); });
    cadenceTimers = [];
  }

  function shouldAutoOpenLucent() {
    if (window.tvastra.customer) return false;
    try {
      if (localStorage.getItem('tvastra_lucent_submitted') === 'yes') return false;
    } catch (e) {}
    return true;
  }
  
  function triggerLucent() {
    if (!shouldAutoOpenLucent()) return stopAutoLucent();
    if (window.location.pathname.indexOf('/checkout') !== -1) return;
    
    // Check if the popup is already visible by checking if simplyOtp modal is in DOM
    if (document.querySelector('.sotp-modal-container, #sotp-modal')) {
       return; // Already open
    }
    
    var trigger = document.querySelector(selector);
    if (trigger) {
      console.log('TVASTRA LUCENT: Simulating click on profile button...');
      // Simulate click so the official app handles it
      trigger.click();
      
      // Also try hash fallback if the app relies on hash change
      if (trigger.href && trigger.href.indexOf('#') !== -1) {
         window.location.hash = trigger.hash;
      }
    } else if (window.simplyOtp && typeof window.simplyOtp.openLoginOrAccountModal === 'function') {
      window.simplyOtp.openLoginOrAccountModal();
    } else if (window.simplyOtp && typeof window.simplyOtp.openPopup === 'function') {
      window.simplyOtp.openPopup();
    }
  }

  function startLucentCadence() {
    if (!shouldAutoOpenLucent()) return;

    var isLoginPage = window.location.pathname.indexOf('/account/login') !== -1;
    if (isLoginPage) {
      window.setTimeout(triggerLucent, 250);
    } else {
      var timer1 = window.setTimeout(triggerLucent, 5000);
      var timer2 = window.setTimeout(triggerLucent, 45000);
      var timer3 = window.setInterval(triggerLucent, 120000);
      cadenceTimers.push(timer1, timer2, timer3);
    }
  }
  
  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (form.action && form.action.indexOf('/account') !== -1) {
      try {
        localStorage.setItem('tvastra_lucent_submitted', 'yes');
      } catch (e) {}
      stopAutoLucent();
    }
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startLucentCadence);
  } else {
    startLucentCadence();
  }
}());
