(function () {
  'use strict';

  var selector = '[data-tvastra-lucent-login]';
  var retryDelay = 100;
  var maxAttempts = 50;
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

  function shouldAutoOpenLucent() {
    return !!document.querySelector('[data-tvastra-lucent-login-page]') || /\/account\/login\/?$/i.test(window.location.pathname);
  }

  function autoOpenLucent() {
    if (autoOpened || !shouldAutoOpenLucent()) return;
    autoOpened = true;
    document.documentElement.classList.remove('tvastra-page-leaving');
    window.setTimeout(function () {
      openLucent(document.querySelector(selector), 0);
    }, 250);
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest(selector);
    if (!trigger) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    document.documentElement.classList.remove('tvastra-page-leaving');
    setBusy(trigger, true);
    openLucent(trigger, 0);
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoOpenLucent);
  else autoOpenLucent();
}());
