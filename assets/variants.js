class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('change', (event) => {
      this.setupData();
      this.onVariantChange(event);
      
    });
  }
  setupData() {
    const themeProducts = window._themeProducts || {};
    this.productData = themeProducts[this.dataset.productId];
    const pickerFields = Array.from(this.querySelectorAll("fieldset"));
    this.options = pickerFields.map(field => {
      const type = field.dataset.pickerField;
      return Array.from(field.querySelectorAll("input")).find(radio => radio.checked)?.value;
    });
    this.getVariantFromOptionArray(this.productData,this.options)
  }

  onVariantChange(event) {
    this.updateOptions();
    this.updateMasterId();
    this.updatePickupAvailability();
    this.updateOptionValue(event);
    if (!this.currentVariant) {
      this.toggleAddButton(false, '', true);
      this.setUnavailable();
    } else {
      this.updateVariantOptions();
      this.updateMedia();
      if(! $('body').find('.single-product').length > 0){
        this.updateURL();
      }
      this.updateVariantInput();
      this.renderProductInfo();
      if(this.currentVariant.available) {
        document.querySelector('.product-summary .product-form-buttons')?.classList.remove('disabled-btn');
      }
    }
  }
  updateVariantOptions(){ 
    const optionNodes = document.querySelectorAll('[data-single-option]');
    const variants = this.variantData;
    optionNodes.forEach(optNode => {
      const {optionPosition,value } = optNode.dataset;
      const optPos = Number(optionPosition);
      const maxOptions = 3;
      let matchVariants = [];
      if (optPos === maxOptions) {
        const variant = this.currentVariant;
        const optionsArray = Array.from(variant.options);
              optionsArray[maxOptions - 1] = value;
        matchVariants.push(this.getVariantFromOptionArray(this.productData, optionsArray));
      }
      else{
        matchVariants = variants.filter(v => v.options[optPos - 1] === value && v.options[optPos - 2] === this.currentVariant[`option${optPos - 1}`]);
      }
      matchVariants = matchVariants.filter(Boolean);
      const unavailableOptClass = 'unavailable-opt';
      if (matchVariants.length) {
          optNode.classList.remove(unavailableOptClass);
          const isSoldout = matchVariants.every(v => v.available === false);
          const method = isSoldout ? 'add' : 'remove';
          optNode.classList[method]('soldout-opt');
      } else {
          optNode.classList.add(unavailableOptClass);
      }
    });
  }
  getVariantFromOptionArray(product, options) {
    var result = product.variants.filter(function (variant) {
      return options.every(function (option, index) {
        return variant.options[index] === option;
      });
    });
    return result[0] || null;
  }


  updateOptions() {
    this.options = Array.from(this.querySelectorAll('select'), (select) => select.value);
  }

  updateOptionValue(event) {
    event.target.closest('.product-filter').querySelector('label.form-label span').innerHTML = event.target.value;
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options.map((option, index) => {
        return this.options[index] === option;
      }).includes(false);
    });
  }

  updateMedia(fromRenderProductInfo) {
    if (!this.currentVariant || !this.currentVariant?.featured_media) return;
    const newMedia = document.querySelector(
      `[data-media-id="${this.dataset.section}-${this.currentVariant.featured_media.id}-main"]`
    );
    let select_element = document.getElementById('product-swipe');
    if (!newMedia) return;
    const gallery = document.getElementById(`product-gallery-${this.dataset.section}`) || false;
    if (gallery) {
      const group_image = gallery.dataset.groupImage || false;
      if (group_image === 'true' && fromRenderProductInfo != true) return;
    }
    const isVariantImg = newMedia.getAttribute('variant_img_added');
    if ($(select_element).hasClass('grid-style')) {
      var viewportWidth = $(window).width();
      if(viewportWidth > 991) {
        $('html, body').animate({
            scrollTop: $(newMedia).offset().top - 80
        });
      }else {
        const parent = newMedia.parentElement;
        var mediaIndex = newMedia.getAttribute('data-index');
        var mainSwiper = document.querySelector('.mobille-media-slider')?.swiper || false;
        if (mainSwiper) {
          mainSwiper.slideTo(mediaIndex);
        }
      }
    } 
    else { 
    const parent = newMedia.parentElement;
    const mediaIndex = newMedia.getAttribute('data-index');
    const thumbSwiper = document.querySelector('.product-image-thumb')?.swiper || false;
    if (thumbSwiper)
      thumbSwiper.slideToLoop(mediaIndex - 1);                                                          
    const mainSwiper = document.querySelector('.product-image-main')?.swiper || false;
    if (mainSwiper)
      mainSwiper.slideTo(mediaIndex - 1);
    }
  }

  updateURL() {
    if (!this.currentVariant) return;
    window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment`);
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector('pickup-availability');
    if (!pickUpAvailability) return;

    if (this.currentVariant?.available) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute('available');
      pickUpAvailability.innerHTML = '';
    }
  }

  renderProductInfo() {
    var _this = this;
    fetch(`${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.dataset.section}`)
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html')
        const updateSections = ['product-gallery', 'price', 'sku', 'stock', 'pre-order', 'stock-label', 'cart-btn', 'badge'];
        const sectionId = this.dataset.section;
        let sale = this.currentVariant.compare_at_price/100 ;
        let curt_price = this.currentVariant.price/100;
        let dis_per =  (Math.round(((sale - curt_price)*100)/sale));
        setTimeout(function () {
          $('.sav-per').text(dis_per);
        }, 100);
        updateSections.forEach(function(updateSection) {
            const sectionSelector = `${updateSection}-${sectionId}`;
            const sourceElem = html.getElementById(sectionSelector);
            const destElem = document.getElementById(sectionSelector);
            if (sourceElem && destElem) {
              if (updateSection == 'product-gallery') {
                const group_image = destElem.dataset.groupImage || false;
                if (group_image === 'true') {
                  destElem.innerHTML = sourceElem.innerHTML;
                  const newMedia = destElem.querySelector(
                  `[data-media-id="${_this.dataset.section}-${_this.currentVariant.featured_media.id}-main"]`
                  );
                  const  isVariantImg = JSON.parse(newMedia.getAttribute('variant_img_added'));
                  const  slideCount = destElem.querySelectorAll('.product-style-2-main-img .swiper-slide').length;
                  let select_element = document.getElementById('product-swipe');
                  if ($(select_element).hasClass('grid-style')) {
                    const viewportWidth = $(window).width();
                    if(viewportWidth > 991) {
                      if (isVariantImg) {
                        $('html, body').animate({
                          scrollTop: 0
                        }, 0);
                      } else {
                        setTimeout(function(){
                          $('html, body').animate({
                            scrollTop: $(newMedia).offset().top - parseInt(document.body.style.getPropertyValue('--top-space').replace('px','')) + 15
                          }, 500);
                        }, 250);
                      }
                    }
                    else{
                      $('.product-media-grid-wrapper').addClass('swiper');
                      $('.product-media-grid-wrapper .product-gallery-slider').addClass('swiper-wrapper');
                      $('.product-media-grid-wrapper .product-gallery-slider').removeClass('row');
                      $('.product-media-grid-wrapper .product-gallery-slider .gallary-item').addClass('swiper-slide');
                      $('.product-media-grid-wrapper .product-gallery-slider .gallary-item').removeClass('col');
                      const myswiper = new Swiper ('.product-media-grid-wrapper', {
                          "slidesPerView": 1,
                          "loop": true,
                          "autoplay": {
                              "delay": 5000,
                              "disableOnInteraction": false
                          },
                          "pagination":{
                              "el":".product-swiper-pagination",
                              "clickable":true
                          },
                          "keyboard":{
                              "enabled":true,
                              "onlyInViewport":true
                          },
                          "speed": 500
                      });
                      const parent = newMedia.parentElement;
                      var mediaIndex = newMedia.getAttribute('data-index');
                      var mainSwiper = document.querySelector('.mobille-media-slider')?.swiper || false;
                      if (mainSwiper) {
                        mainSwiper.slideTo(mediaIndex);
                      }

                    }  
                  } else{
                    const mainSlider = destElem.querySelector('.product-image-main, .product-style-2-main-img');
                    if (mainSlider) {
                      window.SlideshowObjs.forEach(function(slideshowObj) {
                        if (slideshowObj.classList.contains('product-image-main') || slideshowObj.classList.contains('product-style-2-main-img')) {
                          const sliderOptions = slideshowObj.sliderOptions;
                          setProductThumbSliderHeight();
                          if (slideCount != undefined && slideCount === 1) {
                            sliderOptions["loop"] = false;
                          }
                          else{
                            sliderOptions["loop"] = true;
                          }
                          const swiperObj = new Swiper(mainSlider, sliderOptions);
                          if (!isVariantImg) {
                            _this.updateMedia(true);
                            const SectionId = _this.dataset.section,
                            featuredMediaID = _this.currentVariant.featured_media.id,
                            gallery = document.getElementById(`product-gallery-${SectionId}`) || false;
                            const unGroupMedia = document.querySelector(`[data-media-id="${SectionId}-${featuredMediaID}-main"]`),
                            parent = unGroupMedia.parentElement,
                            mediaIndex = unGroupMedia.getAttribute('data-index'),
                            thumbSwiper = document.querySelector('.product-image-thumb')?.swiper || false;
                            if (slideshowObj.classList.contains('product-image-main')) {
                                if (thumbSwiper)
                                  thumbSwiper.slideToLoop(mediaIndex);
                                const mainSwiper = document.querySelector('.product-image-main')?.swiper || false;
                                if (mainSwiper)
                                  mainSwiper.slideTo(mediaIndex);
                            }
                            else{
                                 if (thumbSwiper)
                                  thumbSwiper.slideToLoop(mediaIndex - 1);
                                const mainSwiper = document.querySelector('.product-image-main')?.swiper || false;
                                if (mainSwiper)
                                  mainSwiper.slideTo(mediaIndex - 1);
                            }
                          }
                          else{
                            _this.updateMedia(false);
                          }
                          if (window.ZOOM && $('.product-image-main .product-media.media-image').length) {
                            $('.product-image-main .product-media.media-image').each(function() {
                              $(this).zoom({url: $(this).find('img').attr('data-master-image')});
                            });
                          }
                        }
                      });
                    }
                  }
                }
              }
              else {
                destElem.innerHTML = sourceElem.innerHTML;
              }
            }
        });

        document.getElementById(`price-${this.dataset.section}`)?.classList.remove('visibility-hidden');
        this.toggleAddButton(!this.currentVariant.available, window.variantStrings.soldOut);

        const stickyVariantDropdown = document.querySelector('.product-variants-dd') || false;
        if (stickyVariantDropdown) {
          stickyVariantDropdown.value = this.currentVariant.id;
          window.updateStickyAddtocartInfo(this.currentVariant.id);
        }
      });
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const addButton = document.getElementById(`product-form-${this.dataset.section}`)?.querySelector('[name="add"]');
    if (!addButton) return;
    if (disable == true) {
      if (window.isBackInStock == true && this.currentVariant) {
        addButton.classList.add('notify-me');
        addButton.removeAttribute('disabled');
        if (text) addButton.innerHTML = 'Notify me when available';
        $('.shopify-payment-button').hide();
        const productImgSrc = this.currentVariant.featured_image.src,
              productVariantsTitle = this.currentVariant.title,
              productPrice = Shopify.formatMoney(this.currentVariant.price);
        $('.notify-me').on('click', function () {
          $(".product-img-item").attr('src', productImgSrc);
          $(".variant-title").text(productVariantsTitle);
          $(".variant-price").text(productPrice);
          $("[name='contact[variant]']").val(productVariantsTitle);
          $.magnificPopup.open({
              items: {
                  src: $('.back-in-stock-popup').html(),
                  type: 'inline'
              }
          });
        });
      }
      else{
        $('.notify-me').off('click')
        addButton.classList.remove('notify-me');
        addButton.setAttribute('disabled', true);
        document.querySelector('.product-summary .product-form-buttons')?.classList.add('disabled-btn');
        if (text) addButton.innerHTML = text;
      }
    } else {
      $('.product-form__error-message-wrapper').addClass("d-none");
      $('.notify-me').off('click')
      addButton.classList.remove('notify-me');
      $('.shopify-payment-button').show();
      addButton.removeAttribute('disabled');
      //addButton.innerHTML = window.variantStrings.addToCart;
    }
    const slected_variant = document.querySelectorAll('.product-filter:not(:first-child) [data-single-option]:checked');
      const Allvariant = document.querySelectorAll('.product-filter:not(:first-child) [data-single-option]');
      slected_variant.forEach(function(selectItem, selectItemIndex){
        if (selectItem.classList.contains("soldout-opt") == true && window.isBackInStock == false) {
          var productOnloadAvailableVariant = '';
          Allvariant.forEach(function(allItem, allItemIndex){
            if(!allItem.classList.contains("unavailable-opt") && !allItem.classList.contains("soldout-opt")){
              productOnloadAvailableVariant = allItem;
            }
          })
          $(productOnloadAvailableVariant).trigger( "click" );  
        }
      })
    if (!modifyClass) return;
  }

  setUnavailable() {
    const addButton = document.getElementById(`product-form-${this.dataset.section}`)?.querySelector('[name="add"]');
    if (!addButton) return;
    addButton.innerHTML = window.variantStrings.unavailable;
    document.getElementById(`price-${this.dataset.section}`)?.classList.add('visibility-hidden');
    document.querySelector('.product-summary .product-form-buttons')?.classList.add('disabled-btn');
    const optionNodes = document.querySelectorAll('.product-filter:not(:first-child) [data-single-option]:checked');
    const Allvariant = document.querySelectorAll('.product-filter:not(:first-child) [data-single-option]');
    optionNodes.forEach(function(optionItem, optionItemIndex){
      optionItem.classList.add('unavailable-opt');
    })
    var productOnChangeAvailableVariant = '';
    Allvariant.forEach(function(optionItem, optionItemIndex){
      if(!optionItem.classList.contains("unavailable-opt")){
        productOnChangeAvailableVariant = optionItem;
      }
    })
        $( productOnChangeAvailableVariant).trigger( "click" );  
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define('variant-selects', VariantSelects);

class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll('fieldset'));
    var options = [];
    fieldsets.forEach(function(fieldset) {
        if (fieldset.classList.contains('dropdown')) {
          options.push(fieldset.querySelector('select').value);
        } else {
          options.push(fieldset.querySelector('input:checked').value);
        }
    });
    
    this.options = options;
  }
}

customElements.define('variant-radios', VariantRadios);
