var BackInStock = $('product-form').data("backinstock");
  var isBackInStock = BackInStock;
  const variantDataselector = document.querySelector(".product-info .product-variants, .product-info-right .product-variants");
  if (variantDataselector != undefined  && $('.product-variants').is(':empty') === false) {
    const themeProducts = window._themeProducts || {};
    const veariantSeletore = document.querySelector("variant-radios");
    const productData = themeProducts[veariantSeletore.dataset.productId];
    const optSelectoronload = document.querySelector("variant-radios");
    const variantDataProductload = JSON.parse(variantDataselector.querySelector('[type="application/json"]').textContent);
    const onloadOptions = [];
    optSelectoronload.querySelectorAll('fieldset').forEach(function(fieldset) {
        if (fieldset.classList.contains('dropdown')) {
          onloadOptions.push(fieldset.querySelector('select').value);
        } else {
          onloadOptions.push(fieldset.querySelector('input:checked').value); 
        }
    });
    OnloadGetVariantFromOptionArray(productData, onloadOptions);
     const selectvariant = variantDataProductload.find((variant) => {
      return !variant.options.map((option, index) => {
        return variant.options[index] === onloadOptions[index];
      }).includes(false);
    });
    const optionNodes = document.querySelectorAll('[data-single-option]');
    optionNodes.forEach(optNode => {
      const {optionPosition,value } = optNode.dataset;
      const optPos = Number(optionPosition);
      const maxOptions = 3;
      let matchVariants = [];
      if (optPos === maxOptions) {
        const optionsArray = Array.from(selectvariant.options);
              optionsArray[maxOptions - 1] = value;
        matchVariants.push(OnloadGetVariantFromOptionArray(productData, optionsArray));
      }
      else{
        matchVariants = variantDataProductload.filter(v => v.options[optPos - 1] === value && v.options[optPos - 2] === selectvariant[`option${optPos - 1}`]);
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
    // back in stock btn
    const addButton = document.querySelector('[name="add"]');
    if ($(addButton).hasClass('notify-me') == true) {
        $('.shopify-payment-button').hide();
        $('[name="add"] > i').hide();
        const productImgSrc = selectvariant.featured_image.src,
        productVariantsTitle = selectvariant.title;
        
        $('.notify-me').on('click', function () {
          $(".product-img-item").attr('src', productImgSrc);
          $(".variant-title").text(productVariantsTitle);
          $(".variant-price").text(window.productPrice);
          $("[name='contact[variant]']").val(productVariantsTitle);
          $.magnificPopup.open({
              items: {
                  src: $('.back-in-stock-popup').html(),
                  type: 'inline'
              }
          });
        });
    }
  }
  else{
   const addButton = document.querySelector('[name="add"]');
      if ($(addButton).hasClass('notify-me') == true) {
        $('.shopify-payment-button').hide();
        $('[name="add"] > i').hide();
        $('.notify-me').on('click', function () {
          $.magnificPopup.open({
              items: {
                  src: $('.back-in-stock-popup').html(),
                  type: 'inline'
              }
          });
        });
    }
}
function OnloadGetVariantFromOptionArray(product, options){
  const result = product.variants.filter(function (variant) {
  return options.every(function (option, index) {
  return variant.options[index] === option;
  });
  });
  return result[0] || null;
}