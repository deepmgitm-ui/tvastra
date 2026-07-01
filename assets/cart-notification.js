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
            var load = false;
            window.renderCrosssellProducts(parsedStateSections,load );

            window.renderCrosssellProducts(parsedStateSections);
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
	     window.renderCrosssellProducts(parsedStateSections,load);
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
