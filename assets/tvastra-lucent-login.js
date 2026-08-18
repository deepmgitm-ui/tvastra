(function () {
  'use strict';

  var selector = '[data-tvastra-lucent-login]';
  var retryDelay = 100;
  var maxAttempts = 150;
  var autoOpened = false;

  function setBusy(trigger, busy) {
    if (!trigger) return;
    if (busy) trigger.setAttribute('aria-busy', 'true');
    else trigger.removeAttribute('aria-busy');
  }

  function announceUnavailable() {
    var status = document.getElementById('TvastraLucentLoginStatus');

    if (!status) {
      status = document.createElement('span');
      status.id = 'TvastraLucentLoginStatus';
      status.className = 'visually-hidden';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      document.body.appendChild(status);
    }

    status.textContent = 'Login is still loading. Please tap the account button again.';
  }

  function openLucent(trigger, attempt) {
    if (window.simplyOtp && typeof window.simplyOtp.openLoginOrAccountModal === 'function') {
      setBusy(trigger, false);
      window.simplyOtp.openLoginOrAccountModal();
      return;
    }

    if (window.simplyOtp && typeof window.simplyOtp.openPopup === 'function') {
      setBusy(trigger, false);
      window.simplyOtp.openPopup();
      return;
    }

    if (attempt >= maxAttempts) {
      setBusy(trigger, false);
      announceUnavailable();
      return;
    }

    window.setTimeout(function () {
      openLucent(trigger, attempt + 1);
    }, retryDelay);
  }

  window.tvastra = window.tvastra || {};
  window.tvastra.lucentAutoPopup = true;
  var cadenceTimers = [];

  function stopAutoLucent() {
    console.log('TVASTRA LUCENT: Stopping auto-popup timers.');
    cadenceTimers.forEach(function(timer) { clearTimeout(timer); clearInterval(timer); });
    cadenceTimers = [];
  }

  function shouldAutoOpenLucent() {
    if (window.tvastra.customer) {
      console.log('TVASTRA LUCENT: Blocked auto-popup (Customer is logged in).');
      return false;
    }
    if (localStorage.getItem('tvastra_lucent_submitted') === 'yes') {
      console.log('TVASTRA LUCENT: Blocked auto-popup (Form previously submitted in this browser).');
      return false;
    }
    return true;
  }
  
  function triggerLucent() {
    console.log('TVASTRA LUCENT: triggerLucent called.');
    if (!shouldAutoOpenLucent()) return stopAutoLucent();
    
    if (window.location.pathname.indexOf('/checkout') !== -1) {
      console.log('TVASTRA LUCENT: Blocked auto-popup (On checkout page).');
      return;
    }
    
    document.documentElement.classList.remove('tvastra-page-leaving');
    var trigger = document.querySelector(selector);
    
    console.log('TVASTRA LUCENT: Attempting to open popup. Trigger element:', trigger);
    openLucent(trigger, 0);
  }

  function isAccountEntryLink(link) {
    if (!link || link.target || link.hasAttribute('download')) return false;

    var destination;
    try {
      destination = new URL(link.href, window.location.href);
    } catch (error) {
      return false;
    }

    if (destination.origin !== window.location.origin) return false;
    return /^\/account\/?(login\/?)?$/i.test(destination.pathname);
  }

  function startLucentCadence() {
    console.log('TVASTRA LUCENT: Initializing startLucentCadence...');
    if (!shouldAutoOpenLucent()) return;

    var isLoginPage = !!document.querySelector('[data-tvastra-lucent-login-page]') || /\/account\/login\/?$/i.test(window.location.pathname);
    if (isLoginPage) {
      console.log('TVASTRA LUCENT: Login page detected. Popping immediately.');
      window.setTimeout(triggerLucent, 250);
    } else {
      console.log('TVASTRA LUCENT: Setting up timers (5s, 45s, 2m loop).');
      var timer1 = window.setTimeout(triggerLucent, 5000);
      var timer2 = window.setTimeout(triggerLucent, 45000);
      var timer3 = window.setInterval(triggerLucent, 120000);
      cadenceTimers.push(timer1, timer2, timer3);
    }
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest(selector);
    var accountLink = trigger ? null : event.target.closest('a[href]');
    if (!trigger && isAccountEntryLink(accountLink)) trigger = accountLink;
    if (!trigger) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    document.documentElement.classList.remove('tvastra-page-leaving');
    setBusy(trigger, true);
    openLucent(trigger, 0);
  }, true);
  
  // Stop popup on form submit
  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (form.action && form.action.indexOf('/account') !== -1) {
      localStorage.setItem('tvastra_lucent_submitted', 'yes');
      stopAutoLucent();
    }
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startLucentCadence);
  else startLucentCadence();
}());
