(function () {
  var selector = '.product-form-buttons.product-cta-smart';

  function getForm(buttons) {
    return buttons && buttons.closest('form');
  }

  function getVariantId(form) {
    var input = form && form.querySelector('input[name="id"]');
    return input ? input.value : '';
  }

  function getQuantityInput(buttons) {
    return buttons && buttons.querySelector('.quantity-input');
  }

  function getVariantChoiceArea() {
    return document.querySelector('.main-product-page .product-filter.size-filter') ||
      document.querySelector('.main-product-page .product-variants');
  }

  function getPurchaseTrigger(target) {
    return target && target.closest('.cart-btn, .product-buy-now-inline button, .custom-payment-btn');
  }

  function openBackInStock(button, event) {
    var popup = document.querySelector('.back-in-stock-popup');
    var popupLibrary = window.jQuery && window.jQuery.magnificPopup;
    if (!popup || !popupLibrary) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    var selectedOptions = document.querySelectorAll('.main-product-page .product-variants input:checked');
    var selectedVariant = Array.prototype.map.call(selectedOptions, function (option) {
      return option.value;
    }).filter(Boolean).join(' / ');
    var variantField = popup.querySelector('[name="contact[variant]"]');
    if (variantField) variantField.value = selectedVariant;

    window.jQuery.magnificPopup.open({
      items: {
        src: popup.innerHTML,
        type: 'inline'
      }
    });
  }

  function shouldPromptVariantChoice(form) {
    var area = getVariantChoiceArea();
    if (!form || !area || form.dataset.tvastraVariantTouched === 'true') return false;
    var choices = area.querySelectorAll('input[type="radio"], select, [data-single-option]');
    return choices.length > 1;
  }

  function promptVariantChoice(form, event) {
    var area = getVariantChoiceArea();
    if (!area) return false;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    form.dataset.tvastraVariantTouched = 'true';
    area.classList.add('tvastra-option-focus');
    area.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(function () {
      area.classList.remove('tvastra-option-focus');
    }, 1600);
    return true;
  }

  // Keep the plus control available when Shopify clamps the line to inventory.
  function keepPlusControl(buttons) {
    if (!buttons) return;
    buttons.querySelectorAll('.quantity-button[name="plus"]').forEach(function (button) {
      button.hidden = false;
      button.removeAttribute('aria-hidden');
    });
  }

  function getCartItem(cart, variantId) {
    if (!cart || !cart.items || !variantId) return null;
    var numericVariantId = Number(variantId);
    return cart.items.find(function (item) {
      return Number(item.variant_id) === numericVariantId;
    }) || null;
  }

  function fetchCart() {
    return fetch((window.Shopify && window.Shopify.routes ? window.Shopify.routes.root : '/') + 'cart.js')
      .then(function (response) { return response.json(); });
  }

  function setButtonsState(buttons, item) {
    var input = getQuantityInput(buttons);
    buttons.classList.toggle('is-cart-active', !!item);
    if (!input) return;
    input.value = item ? item.quantity : 1;
    input.dataset.cartLineKey = item ? item.key : '';
    if (item) keepPlusControl(buttons);
  }

  function hideQuantity(buttons) {
    var input = getQuantityInput(buttons);
    buttons.classList.remove('is-cart-active');
    if (input) input.value = 1;
  }

  function renderCart(response) {
    var cartNotification = document.querySelector('cart-notification');
    if (cartNotification && response && response.sections) {
      cartNotification.updateContent(response.sections);
    }
    if (window.cartCount) {
      if (response && typeof response.item_count !== 'undefined') {
        window.cartCount(response);
      } else {
        fetchCart().then(window.cartCount).catch(function () {});
      }
    }
  }

  function syncButtons(buttons) {
    var form = getForm(buttons);
    var variantId = getVariantId(form);
    if (!variantId) {
      setButtonsState(buttons, null);
      return Promise.resolve();
    }
    buttons.classList.add('is-cart-syncing');
    return fetchCart()
      .then(function (cart) {
        setButtonsState(buttons, getCartItem(cart, variantId));
      })
      .catch(function () {
        setButtonsState(buttons, null);
      })
      .finally(function () {
        buttons.classList.remove('is-cart-syncing');
      });
  }

  function updateCartQuantity(buttons, quantity) {
    var input = getQuantityInput(buttons);
    var key = input && input.dataset.cartLineKey;
    if (!key) return syncButtons(buttons);
    quantity = Math.max(0, parseInt(quantity, 10) || 0);

    var cartNotification = document.querySelector('cart-notification');
    var body = {
      id: key,
      quantity: quantity,
      sections: cartNotification ? cartNotification.getSectionsToRender().map(function (section) { return section.id; }) : [],
      sections_url: window.location.pathname
    };

    buttons._smartCtaRequestId = (buttons._smartCtaRequestId || 0) + 1;
    var requestId = buttons._smartCtaRequestId;
    return fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    })
      .then(function (response) { return response.json(); })
      .then(function (response) {
        renderCart(response);
        if (requestId !== buttons._smartCtaRequestId) return;
        var item = getCartItem(response, getVariantId(getForm(buttons)));
        // A quantity-limit response can omit cart items; keep the control active and
        // sync the server-clamped quantity instead of hiding the whole quantity group.
        if (!item && response && response.status) {
          syncButtons(buttons);
          return;
        }
        setButtonsState(buttons, item);
      })
      .catch(function () {
        syncButtons(buttons);
      });
  }

  function scheduleCartQuantity(buttons, quantity, immediate) {
    window.clearTimeout(buttons._smartCtaTimer);
    if (quantity === 0) hideQuantity(buttons);
    buttons._smartCtaTimer = window.setTimeout(function () {
      updateCartQuantity(buttons, quantity);
    }, immediate ? 0 : 320);
  }

  function initButtons(buttons) {
    if (!buttons || buttons.dataset.smartCtaReady === 'true') return;
    buttons.dataset.smartCtaReady = 'true';

    var input = getQuantityInput(buttons);
    if (input) {
      buttons.querySelectorAll('.quantity-button').forEach(function (button) {
        button.addEventListener('click', function (event) {
          if (!buttons.classList.contains('is-cart-active')) return;
          if (button.name !== 'minus') return;
          var currentQuantity = parseInt(input.value, 10) || 0;
          if (currentQuantity > 1) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          input.value = 0;
          scheduleCartQuantity(buttons, 0, true);
        }, true);
      });

      input.addEventListener('change', function () {
        if (!buttons.classList.contains('is-cart-active')) return;
        var quantity = Math.max(0, parseInt(input.value, 10) || 0);
        input.value = quantity;
        scheduleCartQuantity(buttons, quantity, quantity === 0);
      });
    }

    var form = getForm(buttons);
    if (form) {
      buttons.addEventListener('click', function (event) {
        var purchaseTrigger = getPurchaseTrigger(event.target);
        if (!purchaseTrigger || purchaseTrigger.classList.contains('notify-me')) return;
        if (shouldPromptVariantChoice(form)) promptVariantChoice(form, event);
      }, true);

      form.addEventListener('change', function (event) {
        if (event.target && event.target.name && event.target.name !== 'quantity') {
          form.dataset.tvastraVariantTouched = 'true';
          window.setTimeout(function () { syncButtons(buttons); }, 80);
        }
      });
    }

    syncButtons(buttons);
  }

  function initAll(root) {
    var buttons = (root || document).querySelectorAll(selector);
    if (buttons.length) document.body.classList.add('tvastra-product-sticky-cta');
    buttons.forEach(initButtons);
  }

  document.addEventListener('click', function (event) {
    var notifyButton = event.target && event.target.closest('.main-product-page .cart-btn.notify-me');
    if (notifyButton) openBackInStock(notifyButton, event);
  }, true);

  document.addEventListener('tvastra:product-added', function (event) {
    var form = event.detail && event.detail.form;
    var buttons = form && form.querySelector(selector);
    if (!buttons) return;
    window.setTimeout(function () { syncButtons(buttons); }, 120);
  });

  document.addEventListener('DOMContentLoaded', function () { initAll(document); });
  document.addEventListener('shopify:section:load', function (event) { initAll(event.target); });
})();
