  $(function(){
    var newsletter_model = $('[data-newsletter_model]'),
      delay = newsletter_model.data('delay'),
      expire = newsletter_model.data('expire')
      // set cookie
    var newsletter_modelclosed = $.cookie('newsletter_model');
        setTimeout(function() {
          if ( newsletter_modelclosed != "closed") {
            $('#dismiss_show').click(function(){
              var checked = $(this).prop('checked');
              if ( checked == true) {
                $.cookie('newsletter_model', 'closed', {expires: expire, path: '/'});
              }
              else{
                $.removeCookie('newsletter_model', { path: '/' });
              } 
            });
              $('body').addClass('newsletter-model-visibale');
            $('.newsletter-model').fadeIn(1000);
            $('.close').click(function(){
              $('body').removeClass('newsletter-model-visibale');
              $('.newsletter-model').hide();
            });
            $(document).keyup(function(e) {
              if (e.which == 27){
                $('body').removeClass('newsletter-model-visibale');
                $('.newsletter-model').hide();
              }
            });
          }
        },delay);

    if (window.location.href.indexOf("customer_posted=true") > -1) {
      delay = delay + 200;
      setTimeout(function() {
        $.cookie('newsletter_model', 'closed', {expires: expire, path: '/'});
        if (newsletter_modelclosed === 'closed') {
           $('body').addClass('newsletter-model-visibale');
          $('.newsletter-model').addClass('d-none');
        }
      },100);
      setTimeout(function() {
        $('body').removeClass('newsletter-model-visibale');
      },delay);
    }
    else{
      $('.newsletter-model').removeClass('d-none');
    }
  });