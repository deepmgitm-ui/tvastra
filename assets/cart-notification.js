class CartNotification extends HTMLElement {
    constructor() {
        super();
        this.notification = document.getElementById('cart-notification');
        this.renderContentsOnLoad();
        this.closeTimeoutID = null;
    }
    renderContentsOnLoad() {
        var _this = this;
        fetch(`${window.Shopify.routes.root}?sections=cart-notification-content,cart-notification-crosssell-products`)
        .then((response) => response.json())
        .then((parsedState) => {
            const parsedStateSections = parsedState;
            _this.updateContent(parsedStateSections);
            fetch(window.Shopify.routes.root + 'cart.js').then((response) => response.json()).then((parsedState) => {
                window.initFreeshippingGoal(parsedState);
                window.cartCount(parsedState);
            }).catch((e) => {
                console.error(e);
            });
            if (typeof window.renderCrosssellProducts === 'function') {
                window.renderCrosssellProducts(parsedStateSections, false);
            }
        })
        .catch((e) => {
            console.error(e);
        });
    }
    open(autoClose) {
        var _this = this;
        this.notification.classList.add('active');
        document.body.classList.add('minicart-active');
        document.body.style.marginRight = (window.innerWidth - $(window).width())  + 'px';
    }
    close() {
        $('.cart-item__error-text').empty();
        this.notification.classList.remove('active');
        setTimeout(function(){
            document.body.classList.remove('minicart-active');
            document.body.style.marginRight = '0px';
        },300);
        clearTimeout(this.closeTimeoutID);
    }
    renderContents(parsedState) {
      var _this = this;
      const parsedStateSections = parsedState.sections;
      if (parsedStateSections != undefined) {
        _this.updateContent(parsedStateSections);  
      }
      var autoClose = true ;
      if (parsedState.hasOwnProperty('items')) {
          fetch(window.Shopify.routes.root + 'cart.js').then((response) => response.json()).then((parsedState) => {
              autoClose = false;
              window.initFreeshippingGoal(parsedState);
              window.cartCount(parsedState);
          }).catch((e) => {
              console.error(e);
          });
      } else {
          fetch(window.Shopify.routes.root + 'cart.js').then((response) => response.json()).then((parsedState) => {
               autoClose = true;
              window.initFreeshippingGoal(parsedState);
              window.cartCount(parsedState);
          }).catch((e) => {
              console.error(e);
          });
      } 
      const load = true;
      if (typeof window.renderCrosssellProducts === 'function') {
          window.renderCrosssellProducts(parsedStateSections, load);
      }
      if (window.jQuery) {
      }
      this.open(autoClose);
    }
    updateContent(parsedStateSections) {
      var _this = this;
      this.getSectionsToRender().forEach((section => {
          const parsedStateHtml = new DOMParser().parseFromString(parsedStateSections[section.id], 'text/html');
          if (section.id == 'cart-notification-content' && section.hasOwnProperty('elements') && document.getElementById(section.id).querySelector('[data-mini-cart-wrapper]') && parsedStateHtml.querySelector('[data-mini-cart-wrapper]')) {
              section['elements'].forEach(function(elem) {
                  const content = _this.getSectionInnerHTML(parsedStateSections[section.id], elem);
                  if (content != '') {
			document.getElementById(section.id).querySelector(elem).classList.remove('d-none');
                      document.getElementById(section.id).querySelector(elem).innerHTML = content;
                  } else {
                      document.getElementById(section.id).querySelector(elem).classList.add('d-none');
                  }
              });
          } else {
              document.getElementById(section.id).innerHTML = this.getSectionInnerHTML(parsedStateSections[section.id]);
          }
      }));
      if($('body').find('.estimate-shipping').length > 0){
        this.shippingCalcultor();
      }
      this.cartAddonIcon();
      this.CartActionBtn();
      this.CartcancleBtn();
      this.checkedgiftWrap();
    }
    checkedgiftWrap(){
      const GiftChecked = localStorage.getItem("gift_wrap"),
      giftIcon = document.querySelector('[data-action="gift"]'),
      overlayElement = document.querySelector('.mini-cart-overlay');
      if (GiftChecked == 'true' && giftIcon) {
        giftIcon.remove();
        overlayElement.classList.remove("open");
      }
    }
    getSectionsToRender() {
      return [
        {
            id: 'cart-notification-content',
            elements: ['[data-cart-title]', '[data-mini-cart-wrapper]', '[data-cart-bottom]']
        },
        {
            id: 'cart-notification-crosssell-products'
        }
      ];
    }
    getSectionInnerHTML(html, selector = '.shopify-section') {
        const parsedHtml = new DOMParser().parseFromString(html, 'text/html');
        return parsedHtml.querySelector(selector) ? parsedHtml.querySelector(selector).innerHTML : ''; 
    }
    setActiveElement(element) {
        this.activeElement = element;
    }
    cartAddonIcon(event) {
        const addonBtn = document.querySelectorAll('.addon-icon a'),
        overlayElement = document.querySelector('.mini-cart-overlay');
        addonBtn.forEach((e => {
          e.addEventListener("click", (e => {
          e.preventDefault();
            overlayElement.classList.add("open");
            const selectedElement = e.target,
              buttonElement = selectedElement.closest('.addon-btn'),
              contentElement = document.querySelectorAll('.addon-content'),
              action = buttonElement.getAttribute("data-action");
              contentElement.forEach((Element) => {
                const addontContent = Element.getAttribute("data-content");
                if (addontContent == action ) {
                  Element.classList.add("open");
                }
                else{
                  Element.classList.remove("open");
                }
              });
          }), !1)
        }));
    }
    CartcancleBtn(event) {
        const addonBtn = document.querySelectorAll('.addon-action .btn-cancel'),
        overlayElement = document.querySelector('.mini-cart-overlay');
        addonBtn.forEach((e => {
          e.addEventListener("click", (e => {
            e.preventDefault();
            overlayElement.classList.remove("open");
            const selectedElement = e.target,
              contentElement = document.querySelectorAll('.addon-content'),
              action = selectedElement.getAttribute("data-cancel");
              contentElement.forEach((Element) => {
                const addontContent = Element.getAttribute("data-content");
                if (addontContent == action ) {
                  Element.classList.remove("open");
                }
              });
          }), !1)
        }));
    }
    CartActionBtn() {
        const actionBtn = document.querySelectorAll('.btn-save'),
        overlayElement = document.querySelector('.mini-cart-overlay');
        actionBtn.forEach((e => {
          e.addEventListener("click", (e => {
            e.preventDefault();
            const selectedElement = e.target,
            contentElement = document.querySelectorAll('.addon-content'),
              action = selectedElement.getAttribute("data-action");
              if (action == 'shipping') {
                  var e = {};
                  (e.zip = document.querySelector("#address_zip").value || ""),
                    (e.country = document.querySelector("#address_country").value || ""),
                    (e.province = document.querySelector("#address_province").value || ""),
                    this.getCartShippingRatesForDestination(e);
              }
              else if(action == 'note') {
                 overlayElement.classList.remove("open");
                contentElement.forEach((Element) => {
                const addontContent = Element.getAttribute("data-content");
                if (addontContent == action ) {
                  Element.classList.remove("open");
                }
              });
                const body = JSON.stringify({
                  note: document.querySelector("#Cart-note").value,
                });
                fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } });
              }
              else{
                Shopify.GiftWrap.update({
                  'giftId': selectedElement.dataset.giftId,
                  'giftQty': selectedElement.dataset.giftQty,
                  'giftWrap': '',
                  'giftMsg': ''
                });
                localStorage.setItem("gift_wrap", true);
                localStorage.setItem("gift_id", selectedElement.dataset.giftId);
              }
          }), !1)
        }));
    }
    getCartShippingRatesForDestination(event) {
      fetch(
        `${window.Shopify.routes.root}cart/shipping_rates.json?shipping_address%5Bzip%5D=${event.zip}&shipping_address%5Bcountry%5D=${event.country}&shipping_address%5Bprovince%5D=${event.province}`
      )
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const message = document.querySelector(".wrapper-response");
        for (var item of document.querySelectorAll(".wrapper-response p")) {
          item.remove();
        }
        const parsedState = JSON.parse(state);
        if (parsedState && parsedState.shipping_rates) {
          if (parsedState.shipping_rates.length > 0) {
            message.classList.remove("error", "warning");
            message.classList.add("success");
            const p = document.createElement("p");
            p.innerHTML = `<strong>` + 'We found '+parsedState.shipping_rates.length+' shipping rate(s) for your Postal/ZIP code:' + `<strong>`;
            message.appendChild(p);
            parsedState.shipping_rates.map((rate) => {
              const rateNode = document.createElement("p");
              rateNode.classList.add( "shipping-rates" );
              rateNode.innerHTML =
                rate.name +
                ": " +'<span>'+
                Shopify.formatMoney(rate.price, cartStrings.money_format) + '</span>';
              message.appendChild(rateNode);
            });
          } else {
            const p = document.createElement("p");
            p.innerText = 'No shipping options were found';
            message.appendChild(p);
          }
        } else {
          message.classList.remove("success", "warning");
          message.classList.add("error");
          Object.entries(parsedState).map((error) => {
            const message_error = `${error[1][0]}`;
            const p = document.createElement("p");
            p.innerText = message_error;
            message.appendChild(p);
          });
        }
      })
      .catch((error) => {
        throw error;
      });
    }
    shippingCalcultor(){
      Shopify.CountryProvinceSelector = function (
        country_domid,
        province_domid,
        options
      ) {
        this.countryEl = document.querySelector('#address_country');
        this.provinceEl = document.querySelector('#address_province');
        this.provinceContainer = document.getElementById(
          options["hideElement"] || province_domid
        );
        this.initCountry();
        this.initProvince();
        this.onchange();
      };
      Shopify.CountryProvinceSelector.prototype = {
        onchange:function(){
          var changeElement = document.querySelector("#address_country")
          changeElement.addEventListener("change", (e => {
            var opt = this.countryEl.options[this.countryEl.selectedIndex];
            var raw = opt.getAttribute("data-provinces");
            var provinces = JSON.parse(raw);
            var selector = document.querySelector('#address_province');
            while (selector.firstChild) {
              selector.removeChild(selector.firstChild);
            }
            if (provinces && provinces.length == 0) {
              this.provinceContainer.style.display = "none";
            } else {
              for (var i = 0; i < provinces.length; i++) {
                var opt = document.createElement("option");
                opt.value = provinces[i][0];
                opt.innerHTML = provinces[i][1];
                this.provinceEl.appendChild(opt);
              }
              this.provinceContainer.style.display = "";
            }
          }), !1)
        },
        initCountry: function () {
            var value = this.countryEl.getAttribute("data-default");
            Shopify.setSelectorByValue(this.countryEl, value);
            this.countryHandler();
        },

        initProvince: function () {
          var value = this.provinceEl.getAttribute("data-default");
          if (value && this.provinceEl.options.length > 0) {
            Shopify.setSelectorByValue(this.provinceEl, value);
          }
        },
        countryHandler: function (e) {
          var opt = this.countryEl.options[this.countryEl.selectedIndex];
          var raw = opt.getAttribute("data-provinces");
          var provinces = JSON.parse(raw);
          var selector = document.querySelector('#address_province');
          while (selector.firstChild) {
            selector.removeChild(selector.firstChild);
          }
          if (provinces && provinces.length == 0) {
            this.provinceContainer.style.display = "none";
          } else {
            for (var i = 0; i < provinces.length; i++) {
              var opt = document.createElement("option");
              opt.value = provinces[i][0];
              opt.innerHTML = provinces[i][1];
              this.provinceEl.appendChild(opt);
            }

            this.provinceContainer.style.display = "";
          }
        },
      };
      Shopify.setSelectorByValue = function (selector, value) {
        for (var i = 0, count = selector.options.length; i < count; i++) {
          var option = selector.options[i];
          if (value == option.value || value == option.innerHTML) {
            selector.selectedIndex = i;
            return i;
          }
        }
      };
      new Shopify.CountryProvinceSelector(
        "address_country",
        "address_province",
        { hideElement: "address_province_container" }
      );
    }
}
customElements.define('cart-notification', CartNotification);
(function () {
  if (window.tvastraCartTriggerReady) return;
  window.tvastraCartTriggerReady = true;

  document.addEventListener('click', function (event) {
    const target = event.target;
    const trigger = target && target.closest
      ? target.closest('[data-tvastra-cart-trigger], [cart-icon-bubble]')
      : null;
    const drawer = document.querySelector('cart-notification');

    if (!trigger || !drawer || typeof drawer.open !== 'function') return;

    event.preventDefault();
    event.stopPropagation();
    drawer.open(false);
  }, true);
})();
(function () {
  if (window.tvastraCartOfferActionsReady) return;
  window.tvastraCartOfferActionsReady = true;

  function normalizePromoRemoveControls(root) {
    (root || document).querySelectorAll('[data-tvastra-promo]').forEach(function (promo) {
      const appliedState = promo.querySelector('.tvastra-cart-offer__state');
      if (!appliedState || promo.querySelector('[data-tvastra-remove-code]')) return;

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'tvastra-cart-offer__remove';
      removeButton.dataset.tvastraRemoveCode = 'TVFIT10';
      removeButton.setAttribute('aria-label', 'Remove discount code TVFIT10');
      removeButton.textContent = 'Remove';
      appliedState.replaceWith(removeButton);
    });
  }

  function refreshCartAfterDiscountChange() {
    const root = window.Shopify.routes.root;

    return Promise.all([
      fetch(root + '?sections=cart-notification-content,cart-notification-crosssell-products').then(function (response) {
        if (!response.ok) throw new Error('Unable to refresh cart sections');
        return response.json();
      }),
      fetch(root + 'cart.js').then(function (response) {
        if (!response.ok) throw new Error('Unable to refresh cart data');
        return response.json();
      })
    ]).then(function (results) {
      const sections = results[0];
      const cart = results[1];
      const cartNotification = document.querySelector('cart-notification');

      if (!cartNotification || typeof cartNotification.updateContent !== 'function') {
        window.location.assign(root + 'cart');
        return cart;
      }

      cartNotification.updateContent(sections);
      normalizePromoRemoveControls(document);
      if (typeof window.initFreeshippingGoal === 'function') window.initFreeshippingGoal(cart);
      if (typeof window.cartCount === 'function') window.cartCount(cart);
      if (typeof window.renderCrosssellProducts === 'function') window.renderCrosssellProducts(sections, true);
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
      return cart;
    });
  }

  function refreshMainCartFromState(state) {
    const mainCart = document.getElementById('main-cart-items');
    const sectionId = mainCart && mainCart.dataset.id;
    const sectionMarkup = state.sections && sectionId && state.sections[sectionId];

    if (!mainCart || !sectionMarkup) {
      window.location.reload();
      return;
    }

    const parsedSection = new DOMParser().parseFromString(sectionMarkup, 'text/html');
    ['.checkout-content-left', '#main-cart-footer'].forEach(function (selector) {
      const currentElement = mainCart.querySelector(selector);
      const updatedElement = parsedSection.querySelector(selector);
      if (currentElement && updatedElement) currentElement.innerHTML = updatedElement.innerHTML;
    });

    normalizePromoRemoveControls(mainCart);
    if (typeof window.initFreeshippingGoal === 'function') window.initFreeshippingGoal(state);
    if (typeof window.cartCount === 'function') window.cartCount(state);
    if (typeof window.renderCrosssellProducts === 'function') window.renderCrosssellProducts(state.sections, true);
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: state }));
  }

  function updateCartDiscount(discount) {
    const root = window.Shopify.routes.root;
    const mainCart = document.getElementById('main-cart-items');
    const sectionId = mainCart && mainCart.dataset.id;
    const body = { discount: discount };

    if (sectionId) {
      body.sections = [sectionId, 'cart-icon-bubble'];
      body.sections_url = window.location.pathname;
    }

    return fetch(root + 'cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    }).then(function (response) {
      if (!response.ok) throw new Error('Unable to update discount');
      return response.json();
    });
  }

  document.addEventListener('click', function (event) {
    const applyButton = event.target.closest('[data-tvastra-apply-code]');
    const removeButton = event.target.closest('[data-tvastra-remove-code]');
    if (!applyButton && !removeButton) return;

    event.preventDefault();

    if (removeButton) {
      if (removeButton.dataset.removing === 'true') return;

      const previousText = removeButton.textContent;
      removeButton.dataset.removing = 'true';
      removeButton.setAttribute('aria-busy', 'true');
      removeButton.textContent = 'Removing...';

      updateCartDiscount('').then(function (state) {
        const isCartPage = /\/cart(?:\/|$)/.test(window.location.pathname);
        if (isCartPage) {
          refreshMainCartFromState(state);
          return null;
        }
        return refreshCartAfterDiscountChange();
      }).catch(function (error) {
        console.error(error);
        removeButton.dataset.removing = 'false';
        removeButton.removeAttribute('aria-busy');
        removeButton.textContent = 'Try again';
        window.setTimeout(function () {
          if (removeButton.isConnected) removeButton.textContent = previousText;
        }, 1800);
      });
      return;
    }

    if (applyButton.dataset.applying === 'true') return;
    applyButton.dataset.applying = 'true';
    applyButton.textContent = 'Applying...';
    updateCartDiscount('TVFIT10').then(function (state) {
      const isCartPage = /\/cart(?:\/|$)/.test(window.location.pathname);
      if (isCartPage) {
        refreshMainCartFromState(state);
        return null;
      }
      return refreshCartAfterDiscountChange();
    }).catch(function (error) {
      console.error(error);
      applyButton.dataset.applying = 'false';
      applyButton.removeAttribute('aria-busy');
      applyButton.textContent = 'Try again';
      window.setTimeout(function () {
        if (applyButton.isConnected) applyButton.textContent = 'Apply';
      }, 1800);
    });
  });

  normalizePromoRemoveControls(document);
})();
