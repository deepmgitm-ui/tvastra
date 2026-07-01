class CartRemoveButton extends HTMLElement { 
  constructor() {
    super();
    this.addEventListener('click', (event) => {
      const itemId = this.getAttribute('data-item-id');
      event.preventDefault();
      this.closest('cart-items').updateQuantity(this.dataset.index, 0, '', this.dataset.variantId, this.hasAttribute('data-gift-item'),itemId);
    });
  }
}

customElements.define('cart-remove-button', CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();

    this.currentItemCount = Array.from(this.querySelectorAll('[name="updates[]"]'))
      .reduce((total, quantityInput) => total + parseInt(quantityInput.value), 0);

    this.debouncedOnChange = debounce((event) => {
      if (event.target.getAttribute('name') == 'attributes[gift-wrapping]') {
        this.addGiftWrap(event);
      } else if (event.target.getAttribute('name') == 'updates[]') {
        this.onChange(event);
      }
    }, 300);

    this.addEventListener('change', this.debouncedOnChange.bind(this));
    this.checkGiftwrap();
  }

  onChange(event) {
    this.updateQuantity(event.target.dataset.index, event.target.value, document.activeElement.getAttribute('name'), event.target.dataset.variantId);
  }
  checkGiftwrap(){
    const GiftChecked = localStorage.getItem("gift_wrap"),
      EmptyCartBtn = document.querySelector('[title="Empty Cart"]'); 
      EmptyCartBtn.addEventListener('click', function(event) {
        window.localStorage.removeItem('gift_wrap');
      });
    if (GiftChecked == 'true') {
      $('#gift-wrapping').prop('checked', true);
    }
  }
  addGiftWrap(event) {
    if (event.target.checked == false) {
      window.localStorage.removeItem('gift_wrap');
    }
    Shopify.GiftWrap.update({
      'giftId': event.target.dataset.giftId,
      'giftQty': event.target.checked ? event.target.dataset.giftQty : 0,
      'giftWrap': event.target.checked ? true : '',
      'giftMsg': event.target.checked ? document.getElementById('gift-note')?.value : ''
    });
  }

  getSectionsToRender() {
    return [
      {
        id: 'main-cart-items',
        section: document.getElementById('main-cart-items').dataset.id,
        selector: ['.checkout-content-left','#main-cart-footer'],
      },
      {
        section: 'cart-icon-bubble',
        selector: ['.shopify-section']
      }
    ];
  }

  updateQuantity(line, quantity, name, variantId, giftItem,itemId) {
    this.enableLoading();
    const giftId = localStorage.getItem("gift_id");
    if (giftId == itemId) {
      window.localStorage.removeItem('gift_wrap');
    }
    let body = {
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname
    };

    if (giftItem) {
      body["attributes"] = {
        "gift-wrapping" : ""
      };
    }

    body = JSON.stringify(body);
    fetch(`${window.Shopify.routes.root}cart/change.js`, {...fetchConfig(), ...{ body }})
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);
        if (parsedState.hasOwnProperty('status') && parsedState['status'] != 200) {
                document.getElementById(`Line-item-error-${line}`)
                .querySelector('.cart-item__error-text')
                .innerHTML = parsedState.message;
          this.disableLoading();
          return;
        }
        document.querySelector('.checkout-sidebar')?.classList.toggle('hidden', parsedState.item_count === 0);
        document.querySelector('.checkout-content-left')?.classList.toggle('col-lg-12', parsedState.item_count === 0);
        document.querySelector('.checkout-content-left')?.classList.toggle('is-empty', parsedState.item_count === 0);
        document.querySelector('.checkout-content-left')?.classList.toggle('col-lg-8', parsedState.item_count !== 0);
                
        this.getSectionsToRender().forEach((section => {
          const _this = this;
          section.selector.forEach(function(sectionSelector) {
            const elToReplace = document.getElementById(section.id)?.querySelector(sectionSelector) || document.getElementById(section.id) || false;
            elToReplace ? elToReplace.innerHTML = _this.getSectionInnerHTML(parsedState.sections[section.section], sectionSelector) : '';
          });
        }));

        this.updateLiveRegions(line, parsedState.item_count);
        fetch(window.Shopify.routes.root + 'cart.js').then((response) => response.json()).then((parsedState) => {
          window.initFreeshippingGoal(parsedState);
          window.cartCount(parsedState);
        }).catch((e) => {
          console.error(e);
        });
        window.renderCrosssellProducts(parsedState.sections);
        this.disableLoading();
      }).catch((e) => {
        console.log(e);
        this.displayCartErrorMessage();
      });
  }

  displayCartErrorMessage() {
    document.getElementById('cart-errors').classList.remove('d-none');
    document.getElementById('cart-errors').textContent = window.cartStrings.error;
    this.disableLoading();
  }

  updateLiveRegions(line, itemCount) {
    if (this.currentItemCount === itemCount) {
      document.getElementById(`Line-item-error-${line}`)
        .querySelector('.cart-item__error-text')
        .innerHTML = window.cartStrings.quantityError.replace(
          '[quantity]',
          document.getElementById(`Quantity-${line}`).value
        );
    }

    this.currentItemCount = itemCount;
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector)?.innerHTML;
  }

  enableLoading() {
    document.querySelectorAll('.loading-wrapper.loading-box')[0].classList.remove('hidden');
  }

  disableLoading() {
    document.querySelectorAll('.loading-wrapper.loading-box')[0].classList.add('hidden');
  }
}

customElements.define('cart-items', CartItems);
