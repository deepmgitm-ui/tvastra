$(document).ready( function() {
  var promotion_model = $('[data-promotion_model]'),
      promotion_delay = promotion_model.data('delay'),
      promotion_expire = promotion_model.data('expire'),
      promotion_modelclosed = $.cookie('promotion_model');
      setTimeout(function() {
          promotion_model.fadeIn(1000);
          if (promotion_modelclosed == 'closed') {
             promotion_model.remove();
         }else{
             $('body').addClass('promotion-visibale');
         }
       },promotion_delay);
      promotion_model.find('[data-model-close]').on('click', function(e) {
          e.preventDefault();
          $('body').removeClass('promotion-visibale');
          promotion_model.hide();
          $.cookie('promotion_model', 'closed', {expires: promotion_expire, path: '/'});
      });
      $(document).keyup(function(e) {
        if (e.which == 27){
          $('body').removeClass('promotion-visibale');
          promotion_model.hide();
          $.cookie('promotion_model', 'closed', {expires: promotion_expire, path: '/'});
        }
      });
});