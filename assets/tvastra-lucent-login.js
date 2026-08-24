(function () {
  'use strict';

  // Tvastra Lucent login helper.
  // Ezy Returns must remain completely untouched so the Shipway form can
  // receive focus, typing, validation and submission normally.
  var path = window.location && window.location.pathname ? window.location.pathname : '';
  var isEzyReturns = path === '/apps/ezy/returns' || path.indexOf('/apps/ezy/returns/') === 0;

  if (isEzyReturns) {
    // Do not scan, hide, observe, or mutate anything on the Ezy page.
    // Returning here also prevents this custom helper from creating a login popup.
    return;
  }

  // Normal Tvastra storefront: keep Lucent's existing manual login behaviour.
  window.tvastra = window.tvastra || {};
  window.tvastra.lucentAutoPopup = false;

  function shouldShow() {
    if (window.tvastra.customer) return false;
    if (window.location.pathname.indexOf('/checkout') !== -1) return false;
    return true;
  }

  function openLogin() {
    if (!shouldShow()) return;
    try {
      if (window.simplyOtp) {
        if (typeof window.simplyOtp.initializeSimplyOtp === 'function') window.simplyOtp.initializeSimplyOtp();
        var fnNames = ['openPopup', 'openLoginOrAccountModal', 'open', 'show', 'openModal'];
        for (var i = 0; i < fnNames.length; i++) {
          if (typeof window.simplyOtp[fnNames[i]] === 'function') {
            window.simplyOtp[fnNames[i]]();
            return;
          }
        }
      }
      var lotaEl = document.querySelector('lota-customer-account');
      var dialog = document.querySelector('#sotp, dialog[aria-label*="login"], dialog[aria-label*="account"]');
      if (lotaEl) {
        if (typeof lotaEl.open === 'function') { try { lotaEl.open(); } catch (e) {} }
        if (typeof lotaEl.show === 'function') { try { lotaEl.show(); } catch (e) {} }
        if (typeof lotaEl.openModal === 'function') { try { lotaEl.openModal(); } catch (e) {} }
        if (typeof lotaEl.openPopup === 'function') { try { lotaEl.openPopup(); } catch (e) {} }
        return;
      }
      if (dialog) {
        if (typeof dialog.showModal === 'function') { try { dialog.showModal(); } catch (e) {} }
        else if (typeof dialog.show === 'function') { try { dialog.show(); } catch (e) {} }
      }
    } catch (error) {
      console.error('TVASTRA LUCENT: Error opening login popup:', error);
    }
  }

  document.addEventListener('click', function (e) {
    var target = e.target.closest('[data-tvastra-lucent-login], [href="#lucent-login"], [aria-controls="sotp"]');
    if (!target) return;
    e.preventDefault();
    openLogin();
  });

  console.log('TVASTRA LUCENT: normal storefront mode enabled.');
}());
