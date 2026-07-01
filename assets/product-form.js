class ProductForm extends HTMLElement {
  constructor() {
    super();   
    this.form = this.querySelector('form');
    this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
    this.cartNotification = document.querySelector('cart-notification');
  }
  onSubmitHandler(evt) {
    evt.preventDefault();
    const submitButton = this.querySelector('[type="submit"]');
    submitButton.setAttribute('disabled', true);
    submitButton.classList.add('loading');
    this.cartNotification?.setActiveElement(document.activeElement);
    const fetchData = {
      method: 'POST',
      headers: {  
          "Accept": "application/javascript",
          "X-Requested-With": "XMLHttpRequest"
      }
    };
    var  formData = new FormData(this.form);
    formData.append("sections", this.cartNotification ? this.cartNotification.getSectionsToRender().map((section) => section.id) : []);
    formData.append("sections_url", window.location.pathname);
    fetchData.body = formData;
       var body = JSON.stringify({
        ...JSON.parse(serializeForm(this.form)),
        sections: this.cartNotification ? this.cartNotification.getSectionsToRender().map((section) => section.id) : [],
        sections_url: window.location.pathname
      });
    
    fetch(`${routes.cart_add_url}`, fetchData)
      .then((response) => {
        return response.status == '200' || response.status == '422' ? response.json() : false;
      })
      .then((parsedState) => {
        if (parsedState.status == 422 ) {
           const quntyError = parsedState.description;
           $('.product-form__error-message-wrapper').removeClass('d-none');
           $('.product-form__error-message').text(quntyError);
        }
        else{
          $('.product-form__error-message-wrapper').addClass('d-none');
          (parsedState && this.cartNotification) && this.cartNotification.renderContents(parsedState);
        }
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        submitButton.classList.remove('loading');
        submitButton.removeAttribute('disabled');
      });
  }
  oncustomPaymentBtn() {
      this.cartNotification?.setActiveElement(document.activeElement);
    const fetchData = {
      method: 'POST',
      headers: {  
          "Accept": "application/javascript",
          "X-Requested-With": "XMLHttpRequest"
      }
    };
    var  formData = new FormData(this.form);
    formData.append("sections", this.cartNotification ? this.cartNotification.getSectionsToRender().map((section) => section.id) : []);
    formData.append("sections_url", window.location.pathname);
    fetchData.body = formData;
       var body = JSON.stringify({
        ...JSON.parse(serializeForm(this.form)),
        sections: this.cartNotification ? this.cartNotification.getSectionsToRender().map((section) => section.id) : [],
        sections_url: window.location.pathname
      });
           fetch(`${routes.cart_add_url}`, fetchData)
      .then((response) => {
        
        return response.status == '200' || response.status == '422' ? response.json() : false;
      })
      .then((parsedState) => {
        if (parsedState.status == 422 ) {
           const quntyError = parsedState.description;
           $('.product-form__error-message-wrapper').removeClass('d-none');
           $('.product-form__error-message').text(quntyError);
        }
        else{
          $('.product-form__error-message-wrapper').addClass('d-none');
          
        }
      })
      .catch((e) => {
        console.error(e);
      })
       .finally(() => {
        window.location.href = "/checkout";
      });
    }
  addBundleItem() {
    const submitButton = this.querySelector('[type="submit"]');
    submitButton.setAttribute('disabled', true);
    submitButton.classList.add('loading');
    this.cartNotification?.setActiveElement(document.activeElement);
    const fetchData = {
      method: 'POST',
      headers: {  
          "Accept": "application/javascript",
          "X-Requested-With": "XMLHttpRequest"
      }
    };
    var budaleForm = document.querySelector('#bought-together-form');
    var  formData = new FormData(budaleForm);
    formData.append("sections", this.cartNotification ? this.cartNotification.getSectionsToRender().map((section) => section.id) : []);
    formData.append("sections_url", window.location.pathname);
    fetchData.body = formData;
       var body = JSON.stringify({
        ...JSON.parse(serializeForm(budaleForm)),
        sections: this.cartNotification ? this.cartNotification.getSectionsToRender().map((section) => section.id) : [],
        sections_url: window.location.pathname
      });
    
    fetch(`${routes.cart_add_url}`, fetchData)
      .then((response) => {
        return response.status == '200' || response.status == '422' ? response.json() : false;
      })
      .then((parsedState) => {
        if (parsedState.status == 422 ) {
           const quntyError = parsedState.description;
           $('.product-form__error-message-wrapper').removeClass('d-none');
           $('.product-form__error-message').text(quntyError);
        }
        else{
          $('.product-form__error-message-wrapper').addClass('d-none');
          (parsedState && this.cartNotification) && this.cartNotification.renderContents(parsedState);
        }
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        submitButton.classList.remove('loading');
        submitButton.removeAttribute('disabled');
      });
  }
}
customElements.define('product-form', ProductForm);
// bought together js
if ($(".bought-together").length > 0) {
  document.querySelectorAll(".bought-together-varinat-option").forEach((e => {
    e.addEventListener("change", (e => {
        const selectedElement = e.target,
        varinatImageUrl = selectedElement.options[selectedElement.selectedIndex].getAttribute("data-image"),
        varinatId = selectedElement.options[selectedElement.selectedIndex].getAttribute("value"),
        variantParice = selectedElement.options[selectedElement.selectedIndex].getAttribute("data-price"),
        discountRate = Number(document.querySelector(".product-total").getAttribute("data-discount")),
        pricSelector = selectedElement.closest(".product-item").querySelector(".bundel-price-wrapper").querySelectorAll(".special-price .price, .regular-price .price"),
        allselectedElement = document.querySelectorAll(".bought-together-varinat-option"),
        varinatImag = selectedElement.closest(".product-item").querySelector(".image").querySelector("img");
        varinatImag.setAttribute("src", varinatImageUrl)
        selectedElement.setAttribute("data-id", varinatId)
        selectedElement.setAttribute("data-final-price", variantParice)
        selectedElement.setAttribute("data-price", variantParice)
        $(pricSelector).text(Shopify.formatMoney(variantParice));
        let subtotal = 0
        allselectedElement.forEach(function(selectItem, selectItemIndex){
          const sum = Number(selectItem.getAttribute('data-price').replace(",", ""));
            subtotal +=  sum
        });
        const finalPrice = subtotal * ( (100-discountRate) / 100 )
        $('.final-price span').attr("data-subtotal", finalPrice*100);
        $('.final-price span').text(Shopify.formatMoney(finalPrice*100));
        $('.different-price').text(Shopify.formatMoney(subtotal / discountRate * 100));
        $('.discount-price span > s').attr("data-discountTotal", subtotal*100)
        $('.discount-price span > s').text(Shopify.formatMoney(subtotal*100));
    }), !1)

  }));
  // add item js
  $(document).ready( function() {
    $('.bought-submit-btn').on('click',function() {
      const boutTogetherProductFrom = document.querySelector('product-form');
          boutTogetherProductFrom.addBundleItem();
    })
    // on change js
  document.querySelectorAll(".product-option .itemcheckbox").forEach((e => {
    e.addEventListener("change", (e => {
      const selectedElement = e.target,
            checkedItem = document.querySelectorAll('.bought-together .product-option label input:checked  ~ .checkmark'),
            discountRate = Number(document.querySelector(".product-total").getAttribute("data-discount")),
            uncheckedItem = document.querySelectorAll('.bought-together .product-option label input:not(:checked)  ~ .checkmark');
            uncheckedItem.forEach(function(unselectItem, unselectItemIndex){
              const  itemOption = unselectItem.closest(".product-item").querySelector(".bought-together-varinat-option");
                 itemOption.setAttribute("name", null)
             });
            var subtotal = 0
            checkedItem.forEach(function(selectItem, selectItemIndex){
              const  productPrice = Number(selectItem.closest(".product-item").querySelector(".bought-together-varinat-option").getAttribute('data-price').replace(",", "")),
                     selectoption = selectItem.closest(".product-item").querySelector(".bought-together-varinat-option");
                  selectoption.setAttribute("name", 'items[][id]')                 
                 subtotal +=  productPrice
             });
              const finalPrice = subtotal * ( (100-discountRate) / 100 )
              $('.final-price span').attr("data-subtotal", finalPrice*100)
              $('.final-price span').text(Shopify.formatMoney(finalPrice*100));
              $('.different-price').text(Shopify.formatMoney(subtotal / discountRate*100));
              $('.discount-price span > s').attr("data-discountTotal", subtotal)
              $('.discount-price span > s').text(Shopify.formatMoney(subtotal*100));
      }), !1)

  }));
    
  });
}
// group product js 
if ($(".group-product-main").length > 0) {
  document.querySelectorAll(".group-product-variant-option").forEach((e => {
    e.addEventListener("change", (e => {
        const selectedElement = e.target,
        varinatImageUrl = selectedElement.options[selectedElement.selectedIndex].getAttribute("data-image"),
        varinatId = selectedElement.options[selectedElement.selectedIndex].getAttribute("value"),
        variantParice = selectedElement.options[selectedElement.selectedIndex].getAttribute("data-price"),
        pricSelector = selectedElement.closest(".group-item").querySelector(".group-product-price").querySelectorAll(".special-price .price, .regular-price .price"),
        allselectedElement = document.querySelectorAll(".group-product-variant-option"),
        qtyElement =  selectedElement.closest(".group-item").querySelector(".quantity-input"),
        qty = Number(qtyElement.value),
        varinatImag = selectedElement.closest(".group-item").querySelector(".product-image").querySelector("img");
        varinatImag.setAttribute("src", varinatImageUrl)
        selectedElement.setAttribute("data-id", varinatId)
        selectedElement.setAttribute("data-final-price", variantParice)
        selectedElement.setAttribute("data-price", variantParice)
        $(pricSelector).text(Shopify.formatMoney(variantParice*100));
        let subtotal = 0
        allselectedElement.forEach(function(selectItem, selectItemIndex){
          const sum = Number(selectItem.getAttribute('data-price').replace(",", ""));
            subtotal +=  sum
        });
        if (qty != 0) {
          $('.subtotal span').attr("data-subtotal", subtotal)
          $('.subtotal span').text(Shopify.formatMoney(subtotal*100));
        }
    }), !1)

  }));
  // QuantityInput button click 
  document.querySelectorAll("quantity-input").forEach((e => {
    e.addEventListener("click", (event => {
      const quantityBtn = event.target,
      productItem = quantityBtn.closest(".group-item");
      getsubtotal(productItem);
    }), !1)
  }));
  function getsubtotal(item){
     const inputQtyElement = item.querySelector(".quantity-input"),
        allselectedElement = document.querySelectorAll(".group-product-variant-option"),
        selectedElement = item.querySelector(".group-product-variant-option"),
        price = Number(selectedElement.getAttribute('data-price')),
        previousPrice = Number(selectedElement.getAttribute('data-final-price')),
        inputQty = Number(inputQtyElement.value);
        var finalPrice = inputQty * price;
        selectedElement.setAttribute("data-final-price", finalPrice)
        let subtotal = 0;
        allselectedElement.forEach(function(selectItem, selectItemIndex){
          const sum = Number(selectItem.getAttribute('data-final-price').replace(",", ""));
            subtotal +=  sum
        });
        $('.subtotal span').attr("data-subtotal", subtotal)
        $('.subtotal span').text(Shopify.formatMoney(subtotal*100));
  }
  // 
        document.querySelectorAll("custom-btn").forEach((e => {
        e.addEventListener("click", (event => {
          var groupProductFrom = document.querySelector('product-form');
          groupProductFrom.oncustomPaymentBtn();
        }), !1)
      }));
}