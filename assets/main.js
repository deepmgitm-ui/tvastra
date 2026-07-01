var Shopify = Shopify || {};
Shopify.HongoProductsObj = [];
window.currPlayingVid = window.currPlayingVid || undefined;
// ---------------------------------------------------------------------------
// Money format handler
// ---------------------------------------------------------------------------
Shopify.formatMoney = function(cents, format) { 
    if (typeof cents == 'string') { cents = cents.replace('.',''); }
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = (format || money_format);

    function defaultOption(opt, def) {
        return (typeof opt == 'undefined' ? def : opt);
    }

    function formatWithDelimiters(number, precision, thousands, decimal) {
        precision = defaultOption(precision, 2);
        thousands = defaultOption(thousands, ',');
        decimal   = defaultOption(decimal, '.');

        if (isNaN(number) || number == null) { return 0; }

        number = (number/100.0).toFixed(precision);

        var parts   = number.split('.'),
        dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
        cents   = parts[1] ? (decimal + parts[1]) : '';

        return dollars + cents;
    }

    switch(formatString.match(placeholderRegex)[1]) {
        case 'amount':
            value = formatWithDelimiters(cents, 2);
            break;
        case 'amount_no_decimals':
            value = formatWithDelimiters(cents, 0);
            break;
        case 'amount_with_comma_separator':
            value = formatWithDelimiters(cents, 2, '.', ',');
            break;
        case 'amount_no_decimals_with_comma_separator':
            value = formatWithDelimiters(cents, 0, '.', ',');
            break;
    }

    return formatString.replace(placeholderRegex, value);
};
Shopify.GiftWrap = Shopify.GiftWrap || {};
Shopify.GiftWrap.update = function(data) {
    var postData = {"updates": {}, "attributes": {}};
    postData["updates"][data.giftId] = data.giftQty;
    postData["attributes"]["gift-wrapping"] = data.giftWrap;
    jQuery.ajax({
        type: 'POST',
        url: '/cart/update.js',
        dataType: 'json',
        data: postData,
        beforeSend: function() {
            if( window.location.href.indexOf("cart") > -1){
                document.querySelector('body > .loading-box').classList.add('hidden');
            }
            else{

                document.getElementById('cart-notification').classList.add('loading');
            }
        },
        success: function(res) {
            if( window.location.href.indexOf("cart") > -1){
            window.location.reload();
                document.querySelector('body > .loading-box').classList.remove('hidden');
            }
            else{
                cartNotificationSectionRender(res);
                var cartNotification = document.querySelector('cart-notification');
                cartNotification.shippingCalcultor();
                cartNotification.cartAddonIcon();
                cartNotification.CartActionBtn();
                cartNotification.CartcancleBtn();
                document.getElementById('cart-notification').classList.remove('loading');
            }
        }
    });
}
function cartNotificationSectionRender(response){
    var cartNotification = document.querySelector('cart-notification');
    fetch(`${window.Shopify.routes.root}?sections=cart-notification-content`)
        .then((response) => response.json())
        .then((parsedState) => {
            const parsedStateSections = parsedState;
            cartNotification.updateContent(parsedStateSections);
            fetch(window.Shopify.routes.root + 'cart.js').then((response) => response.json()).then((parsedState) => {
                window.initFreeshippingGoal(parsedState);
                window.cartCount(parsedState);
            }).catch((e) => {
                console.error(e);
            });
            var load = false;
        })
        .catch((e) => {
            console.error(e);
        });
}

window.compareKey = Shopify.theme.id + '_compareItems';
var $lastWindowWidth = $(window).width();

$(document).ready( function() {
    /****** Returns mini header height ******/
    function getMiniheaderHeight() {
        var miniHeaderHeight = 0;
        if ($('#shopify-section-mini-header').length) {
            miniHeaderHeight = $('#shopify-section-mini-header').outerHeight();
        }
        
        return miniHeaderHeight;
    }
    function onepagemenu(){
        const windowWidth = $(window).width() 
        if (windowWidth < 1200) {
            $(document).on('click', '.navbar-nav .nav-item > .nav-link', function (event) {
                const navLink = $(this).attr('href');
                if(navLink.includes("#")){
                    $('.navbar-toggler').trigger('click');
                }
            })
        }
    }
    onepagemenu();
    /****** Returns header height ******/
    function getHeaderHeight() {
        var headerHeight = 0;
        if ($('#hongo-header .navbar').length) {
            headerHeight = $('#hongo-header .navbar').outerHeight();
        }
        
        return headerHeight;
    }

    /****** Returns top space ******/
    function getTopSpaceHeaderHeight() {
        return getMiniheaderHeight() + getHeaderHeight();
    }
    /****** Touch device ******/
    var isTouchDevice = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
    if (isTouchDevice) {
        $('body').addClass('is-touchable');
    }
    $(document).on('click', '.slider-down-image > a[href^="#"]', function (event) {
        event.preventDefault();
        $('html, body').animate({
            scrollTop: $(this).offset().top - getTopSpaceHeaderHeight()
        }, 1000);
    });
    $(document).on('click', '.image-with-text > .content-wrap > a[href^="#"], .hero-banner .button-wrapper > a[href^="#"]', function (event) {
    event.preventDefault();
        $('html, body').animate({
            scrollTop: $($.attr(this, 'href')).offset().top - getTopSpaceHeaderHeight()
        }, 1000);
    });
    $(document).on('click', '.nav-item > a[href^="#"], .panel-group > a[href^="#"]', function (event) {
      event.preventDefault();
      if ($.attr(this, 'href') != '#') {
        $('html, body').animate({
            scrollTop: $($.attr(this, 'href')).offset().top - getTopSpaceHeaderHeight() + 2
        }, 1000);
      }
    });
    var addClassOnScroll = function () {
      $('section[id]').each(function (index, elem) {
        if($(window).scrollTop() >= $(elem).offset().top - getTopSpaceHeaderHeight() - 2) {
              const elemId = $(elem).attr('id');
              $(".navbar-nav .nav-item a.nav-item-active").removeClass('nav-item-active');
              if( window.location.href.indexOf("cart") < 1){
                $(".navbar-nav .nav-item a[href='#" + elemId + "']:not([href=#])").addClass('nav-item-active');
              }
            }
        });
    };
    var lastScroll = 0,
        windowScorll = $(window).scrollTop(),
        sliderBreakPoint = 991,
        totalStickyElementsHeight = getTopSpaceHeaderHeight();
        headerTransition = 500,
        isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    document.addEventListener('shopify:section:load', function (event){
        resetHeader();
        animateHeader();
        initSearchPopup();
        initMagnificPopupVideo();
        initSlideshow();
        initPlyr();
        initShopGrid();
        initWishlistButtons();
        initCountDownTimer();
        initMap();
        initTerms();
        accordionEvent();
        triggerAppearResize();
        SectionLoadFreeshippingGoal();
        SectionLoadProductReviews();
        SectionLoadGroupProduct();
        SectionLoadBoughtTogether();
        window.loadMore();
        window.infinitescroll();
        RecentViewProduct();
        CardBox();
        CollectionAjexTab();
        MenuCollectionImgWrap();
        TestimonialBanner();
        VerticalMenu();
        VerticalMenuMobile();
        ShopCategoryHoverEffect();
        Ajaxinate.prototype.loadMore();
    });
    CollectionAjexTab();
    MainMenuDataImport();
    /****** Move Nav Element *****/
    function SectionLoadGroupProduct() {
        // product grop  add subtotal 
        if ($(".group-product-main").length > 0) {
            const allselectedElementOnload = document.querySelectorAll(".group-product-variant-option");
            let subtotalOnload = 0
            allselectedElementOnload.forEach(function(selectItem, selectItemIndex){
              const sum = Number(selectItem.getAttribute('data-price').replace(",", ""));
              subtotalOnload +=  sum
            });
            $('.subtotal span').attr("data-subtotal", subtotalOnload)
            $('.subtotal span').text(Shopify.formatMoney(subtotalOnload*100));
        }
        // endd
    }

    SectionLoadGroupProduct();
    SectionLoadBoughtTogether();
    function SectionLoadBoughtTogether() {
        // bought together on load subtotal add
        if ($(".bought-together").length > 0) {
            const allselectedElementOnload = document.querySelectorAll(".bought-together-varinat-option"),
            discountRate = Number(document.querySelector(".product-total").getAttribute("data-discount"));
            let subtotalOnload = 0
            allselectedElementOnload.forEach(function(selectItem, selectItemIndex){
              const sum = Number(selectItem.getAttribute('data-price').replace(",", ""));
              subtotalOnload +=  sum
            });
            const finalPrice = subtotalOnload * ( (100-discountRate) / 100 )
            $('.final-price span').attr("data-subtotal", Shopify.formatMoney(finalPrice*100));
            $('.final-price span').text(Shopify.formatMoney(finalPrice*100));
            $('.different-price').text(Shopify.formatMoney(subtotalOnload / discountRate*100));
            $('.discount-price span > s').attr("data-discountTotal", Shopify.formatMoney(subtotalOnload*100));
            $('.discount-price span > s').text(Shopify.formatMoney(subtotalOnload*100));
        }

    }

    if (isSafari) {
        document.body.classList.add('isSafari');
    }
    function SectionLoadProductReviews() {
        setTimeout(function(){
            $.getScript(window.location.protocol + "//productreviews.shopifycdn.com/embed/loader.js");
        },500)
    }
    function SectionLoadFreeshippingGoal() {
        fetch(window.Shopify.routes.root + 'cart.js').then((response) => response.json()).then((parsedState) => {
            window.initFreeshippingGoal(parsedState);
        }).catch((e) => {
            console.error(e);
        });
    }
    function setCookie(key, value, expiry) {
        var expires = new Date();
        expires.setTime(expires.getTime() + (expiry * 24 * 60 * 60 * 1000));
        document.cookie = key + '=' + value + ';expires=' + expires.toUTCString() + ';path=/';
    }

    function getCookie(key) {
        var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
        return keyValue ? keyValue[2] : null;
    }

    function eraseCookie(key) {
        var keyValue = getCookie(key);
        setCookie(key, keyValue, '-1');
    }

    function validateCookie(key, value) {
        var keyValue = getCookie(key);
        return 0 !== value.length && keyValue == value;
    }

    function resetBodyVars() {
        document.body.style.setProperty('--top-space', getTopSpaceHeaderHeight() + 'px');
        document.body.style.setProperty('--miniheader-height', getMiniheaderHeight() + 'px');
        document.body.style.setProperty('--header-height', getHeaderHeight() + 'px');        
    }
    
    function resetHeader() {
        setTimeout(function(){
            resetBodyVars();
            if ($('#hongo-header .navbar').length) {
                if ($('#hongo-header .navbar').hasClass('disable-fixed')) {
                    $('body').addClass('disable-fixed');
                    $('body').removeClass('sticky');
                } else {
                    $('body').removeClass('disable-fixed');
                    $('body').addClass('sticky');
                }

                if ($('#hongo-header .navbar').hasClass('header-transparent')) {
                    $('body').addClass('transparent');

                    var minHeight = getWindowHeight(),
                    miniheaderHeight = getMiniheaderHeight();
                } else {
                    $('body').removeClass('transparent');
                }            
            }
        }, 300);
    }

    function animateHeader() {
        windowScorll = $(window).scrollTop();
        if (windowScorll >= 30) {
            $('body').addClass('sticky-active');
            if (!$('#shopify-section-mini-header').is(':hidden')) {
                $('#shopify-section-mini-header').css({'top': '-' + (getMiniheaderHeight()) + 'px'});
                $('#hongo-header .navbar').css({'top': '0px'});
            } else {
                $('#shopify-section-mini-header, #hongo-header .navbar').css({'top': ''});
            }
        } else if (windowScorll <= 30) {
            $('body').removeClass('sticky-active');
            if (!$('#shopify-section-mini-header').is(':hidden')) {
                $('#shopify-section-mini-header').css({'top': '0px'});
                $('#hongo-header .navbar').css({'top': (getMiniheaderHeight()) + 'px'}); 
            } else {
                $('#shopify-section-mini-header, #hongo-header .navbar').css({'top': ''});
            }
        }

        if (windowScorll > 30) {
            setTimeout(function () {
                $('body').addClass('sticky-animate');
            }, headerTransition);
        }

        if (windowScorll < 30) {
            setTimeout(function () {
                $('body').removeClass('sticky-animate');
            }, headerTransition);
        }
    }

    function hideAnnouncementbar() {
        $('.announcement-bar').remove();
        resetBodyVars();
        animateHeader();
    }

    /****** Check IE ******/
    function isIE() {
        var ua = window.navigator.userAgent,
            msie = ua.indexOf( 'MSIE ' );
        if ( msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./) ) {
            return true;
        }

        return false;
    }

    /****** Set parallax ******/
    function setParallax() {
      if( ! isIE() ) {
        $( '[data-parallax-background-ratio]' ).each( function() {
            var ratio = $( this ).attr( 'data-parallax-background-ratio' ) || 0.5;
            $( this ).parallax( '50%', ratio );
        });
        $( '[data-parallax-layout-ratio]' ).each( function() {
            var ratio = $( this ).attr( 'data-parallax-layout-ratio' ) || 1;
            $( this ).parallaxImg( ratio );
        });
      }
    }

    /****** Returns Window width ******/
    function getWindowWidth() {
        return $( window ).width();
    }

    /****** Returns window height ******/
    function getWindowHeight() {
        return $( window ).height();
    }
  


    function initPlyr() {
        $('.product-media.media-video [id^=video-]').each(function() {
            this.plyrInstance = new Plyr(`#${$(this).attr('id')}`);
            this.plyrInstance.on('play', (event) => {
                if (typeof window.currPlayingVid != typeof undefined && window.currPlayingVid != 'undefined' && window.currPlayingVid.plyrInstance.playing) {
                    if (window.currPlayingVid.plyrInstance != this.plyrInstance) window.currPlayingVid.plyrInstance.pause();
                }
                window.currPlayingVid = this;
            });
        });
    }

    /****** Swiper slide show ******/
    window.SlideshowObjs = window.SlideshowObjs || [];
    function initSlideshow(section) {
        section = (typeof section === typeof undefined || section == 'undefined') ? document : section;
        var swiperItems = section.querySelectorAll('.swiper');
        swiperItems.forEach(function(swiperItem, index) {
            if (swiperItem.classList.contains('product-media-gallery'))
                return false;
            var _this = $(swiperItem),
                sliderOptions = _this.attr('data-slider-options'),
                isNumberNavigation = _this.attr('data-swiper-number-navigation');
            var isNumberPaginationProgress = _this.attr('data-swiper-number-pagination-progress') || false;

            if (typeof(sliderOptions) !== 'undefined' && sliderOptions !== null ) {
                sliderOptions = $.parseJSON(sliderOptions);
                if (sliderOptions.hasOwnProperty('effect')) {
                    if (sliderOptions.effect == 'creative') {
                        sliderOptions['creativeEffect'] = {
                            prev: {
                                translate: [0, 0, -400],
                            },
                            next: {
                                translate: ["100%", 0, 0],
                            }
                        };
                    }
                    
                    if (sliderOptions.effect == 'fade') {
                        sliderOptions['fadeEffect'] = {
                            crossFade: true,
                        };
                    }
                }

                /* If user have provided "data-thumb-direction" attribute then below code will execute */
                if( sliderOptions['thumbs'] != '' && sliderOptions['thumbs'] != undefined ) {
                    var mdThumbDirection = _this.attr( 'data-thumb-direction' );
                    sliderBreakPoint = _this.attr( 'data-thumb-breakpoint' ) !== 'undefined' ? _this.attr( 'data-thumb-breakpoint' ) : sliderBreakPoint;

                    var viewportWidth = $(window).width();    
                    if(viewportWidth > 767) {
                        sliderOptions['thumbs']['autoScrollOffset'] = 1;
                    }
                    
                    if( mdThumbDirection != '' && mdThumbDirection != undefined ) {
                        var thumbDirection   = ( sliderOptions['thumbs']['swiper']['direction'] != '' && sliderOptions['thumbs']['swiper']['direction'] != undefined ) ? sliderOptions['thumbs']['swiper']['direction'] : mdThumbDirection;
                        sliderOptions['thumbs']['swiper']['on'] = {
                            init: function() {
                                if( getWindowWidth() <= sliderBreakPoint ) {
                                    this.changeDirection( mdThumbDirection );
                                } else {
                                    this.changeDirection( thumbDirection );
                                }
                                this.update();
                            },
                            resize: function () {
                                if( getWindowWidth() <= sliderBreakPoint ) {
                                    this.changeDirection( mdThumbDirection );
                                } else {
                                    this.changeDirection( thumbDirection );
                                }
                                this.update();
                            }
                        };
                    }
                }
                sliderOptions['on'] = {
                    init: function () {
                        var length = this.loopedSlides ? this.slides.length - 2 : this.slides.length;
                        /* For Number Navigation - On Swiper Initialize - Add Navigation Number */
                        if (isNumberNavigation == '1') {
                            _this.find('.swiper-button-next').text( '02' );
                            _this.find('.swiper-button-prev').text( '0' + length );
                        }
                        /* End */
                        /* Number pagination progress */
                        if (isNumberPaginationProgress) {
                            _this.parent().find('.number-next').text('0' + length);
                            _this.parent().find('.number-prev').text('01');
                            _this.parent().find('.swiper-pagination-progress')[0].style.setProperty('--swiper-progress', (100 / length).toFixed(2) + '%');
                        }
                        /* End */
                    },
                    slideChange: function(swiper) {
                        var length = this.loopedSlides ? this.slides.length - 2 : this.slides.length,
                            active = (this.realIndex) + 1,
                            next = active + 1,
                            prev = active - 1; 
                        if ( active == 1 ) { 
                            prev = length; 
                        }
                        if ( active == length ) { 
                            next = 1;
                        }
                        /* For Number Navigation - On Swiper Slide Change - Change Navigation Number */
                        if (isNumberNavigation == '1') {
                            _this.find('.swiper-button-next').text( next < 10 ? '0' + next : next ); 
                            _this.find('.swiper-button-prev').text( prev < 10 ? '0' + prev : prev ); 
                        }
                        /* End */
                        /* Number pagination progress */
                        if (isNumberPaginationProgress) {
                            _this.parent().find('.number-prev').each(function () {
                                $(this).text(active < 10 ? '0' + active : active);
                            });
                            _this.parent().find('.swiper-pagination-progress')[0].style.setProperty('--swiper-progress', ((100 / length) * active).toFixed(2) + '%');
                        }
                        /* End */
                        if (swiper.$el.hasClass('product-image-main')) {
                            const currSlide = swiper.slides[swiper.activeIndex];
                            const mediaType = currSlide.dataset.mediaType || false;
                            const mediaHost = currSlide.dataset.mediaHost || false;

                            // Pause all videos
                            if (typeof window.currPlayingVid != typeof undefined && window.currPlayingVid != 'undefined' && window.currPlayingVid.plyrInstance.playing) {
                                window.currPlayingVid.plyrInstance.pause();
                            }

                            if (mediaType == 'model') {
                                swiper.allowTouchMove = false;
                            } else {
                                swiper.allowTouchMove = true;
                            }
                        }
                    }
                };
                swiperItem.sliderOptions = sliderOptions;
                var swiperObj = new Swiper(swiperItem, sliderOptions);
                window.SlideshowObjs.push(swiperItem);
            }
        });
    }

    $(document).on('click', 'video.no-controls', function() {
        if (this.paused === false) { this.pause(); } else { this.play(); }
    });
    
    /****** Masonary shop grid ******/
    function initShopGrid(section) {
        section = (typeof section === typeof undefined || section == 'undefined') ? document : section;
        var $shop_grid = $(section.querySelectorAll('.grid-isotop'));
        $shop_grid.imagesLoaded(function() {
            $shop_grid.isotope({
                layoutMode: 'masonry',
                itemSelector: '.grid-item',
                percentPosition: true,
                transitionDuration: 0,
                stagger: 0,
                masonry: {
                    columnWidth: '.grid-sizer'
                }
            });
            $shop_grid.isotope();
        });
    }    

    function formatDate(date) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear(),
            hour = d.getHours() < 2 ? '0' + d.getHours() : '' + d.getHours(),
            minute = d.getMinutes() < 2 ? '0' + d.getMinutes() : '' + d.getMinutes(),
            second = d.getSeconds() < 2 ? '0' + d.getSeconds() : '' + d.getSeconds();

        if (month.length < 2) 
            month = '0' + month;
        if (day.length < 2) 
            day = '0' + day;

        return [year, month, day].join('-') + " " + [hour, minute, second].join(':');
    }
     
    /****** Countdown timer ******/
    function initCountDownTimer(section) {
        section = (typeof section === typeof undefined || section == 'undefined') ? document : section;
        $(section.querySelectorAll('.countdown')).each( function() {
            var _this = $( this );
            var days = $(this).attr('data-days');
            var hourslabel = $(this).attr('data-hours-label');
            var minutelabel = $(this).attr('data-minute-label');
            var secondlabel = $(this).attr('data-second-label');
            if (typeof hourslabel == typeof undefined || hourslabel == 'undefined') {
                hourslabel = 'Hours';  
            }
            if (typeof secondlabel == typeof undefined || secondlabel == 'undefined') {
                secondlabel = 'Seconds'; 
            }
            if (typeof minutelabel == typeof undefined || minutelabel == 'undefined') {
                minutelabel = 'Minutes';
            }
            var endDate = formatDate(new Date(_this.attr( "data-enddate" )));
            _this.countdown( endDate ).on( 'update.countdown', function ( event ) {
                _this.html( event.strftime( '' + '<div class="counter-container"><div class="counter-box first" data-number="%-D"><div class="number">%-D</div><span>'+days+'</span></div>' + '<div class="counter-box"><div class="number">%H</div><span>'+hourslabel+'</span></div>' + '<div class="counter-box"><div class="number">%M</div><span>'+minutelabel+'</span></div>' + '<div class="counter-box last"><div class="number">%S</div><span>'+secondlabel+'</span></div></div>' ) );
            }).on('finish.countdown', function(event) {
                _this.html( event.strftime( '' + '<div class="counter-container"><div class="counter-box first" data-number="00"><div class="number">00</div><span>Day%!d</span></div>' + '<div class="counter-box"><div class="number">00</div><span>'+hourslabel+'</span></div>' + '<div class="counter-box"><div class="number">00</div><span>'+minutelabel+'</span></div>' + '<div class="counter-box last"><div class="number">00</div><span>'+secondlabel+'</span></div></div>' ) );
                _this.closest('.product-deal-wrap, .product-deal').addClass('d-none');
            });
        }); 
    }

    /****** Instagram feed ******/
     class InstaramFeed extends HTMLElement {
      constructor() {
        super(); 
        const handleIntersection = (entries, observer) => {
          if (!entries[0].isIntersecting) return;
          observer.unobserve(this);
          var section = (typeof section === typeof undefined || section == 'undefined') ? document : section;
          $(section.querySelectorAll('[data-instagram-feed]')).each(function() {
              var _this = $(this);
              var instagramFeedWrapper = $(this).attr('id');
              var tokenScriptId = '#instagram-token-' + $(this).attr('data-section-id');
              var removeSection = $(this).attr('data-element-remove');
              var count = parseInt($(this).attr('data-count')) > 0 ? parseInt($(this).attr('data-count')) : 6;
              var IGToken = JSON.parse($(tokenScriptId)[0].textContent);
              if (IGToken != '' && count > 0) {
                  $(this).html('');
                  jQuery.ajax({
                      url: 'https://graph.instagram.com/me/media?fields=caption,id,media_type,media_url,permalink,thumbnail_url,timestamp,username',
                      dataType: 'jsonp',
                      type: 'GET',
                      data: {access_token: IGToken, limit: count},
                      success: function(response){
                          if (typeof response.data != typeof undefined && response.data != 'undefined' && response.data.length) {
                              var instagramItems = response.data;
                              instagramItems.forEach(function(item) { 
                                  var image = null;
                                  switch (item.media_type) {
                                      case "IMAGE":
                                          image = item.media_url;
                                      break;

                                      case "VIDEO":
                                          image = item.thumbnail_url;
                                      break;

                                      case "CAROUSEL_ALBUM":
                                          image = item.media_url;
                                      break;
                                  }
                                  var IsinstaSlider = $('#'+instagramFeedWrapper).hasClass("insta-type-slider");
                                  if (IsinstaSlider === true) {
                                    $('#'+instagramFeedWrapper).append('<div class="swiper-slide insta-items"><a href="'+item.permalink+'" target="_blank" class="position-relative d-block"><img title="'+item.caption+'" src="'+image+'" /><span class="insta-hover"><i class="bi bi-instagram"></i></span></a></div>');
                                  }
                                  else{
                                    $('#'+instagramFeedWrapper).append('<div class="col insta-items"><a href="'+item.permalink+'" target="_blank" class="position-relative d-block"><img title="'+item.caption+'" src="'+image+'" /><span class="insta-hover"><i class="bi bi-instagram"></i></span></a></div>');
                                  }
                              });
                              if ($('#'+instagramFeedWrapper).hasClass("insta-type-slider")) {

                                  const   swiperItems = section.querySelectorAll('.instagram-slider'),
                                          sliderOptions = $(swiperItems).attr('insta-slider-options'),
                                           slideroptionConfig = $.parseJSON(sliderOptions),
                                           instaSlider = new Swiper(".instagram-slider", slideroptionConfig);
                              }
                          } else {
                              $(removeSection).remove();
                          }
                      },
                      error: function(response){
                          $(removeSection).remove();
                      }
                  });
              }
          });
        }
        new IntersectionObserver(handleIntersection.bind(this), {rootMargin: '0px 0px 200px 0px'}).observe(this);
      }
    }
    customElements.define('instagram-feed', InstaramFeed);

    /****** Magnific popup video ******/
    function initMagnificPopupVideo() {
        $('.mfp-popup-youtube, .mfp-popup-vimeo, .mfp-popup-gmaps').magnificPopup({
            disableOn: 700,
            type: 'iframe',
            mainClass: 'mfp-fade',
            removalDelay: 160,
            preloader: false,
            fixedContentPos: false,
            callbacks: {
                open: function() {
                    $('body').addClass('overflow-hidden');
                },
                close: function() {
                    $('body').removeClass('overflow-hidden');
                },
            }
        });
    }

    function addItem(variant, qty, properties) {
        var qty = qty || 1;
        jQuery.ajax({
            type: 'POST',
            url: "/cart/add.js",
            data: "quantity=" + qty + "&id=" + variant + '&sections=cart-notification-content,cart-notification-crosssell-product',
            dataType: "json",
            beforeSend : function (){
                $('.loading-box').removeClass('hidden');
            },
            success: function(response) {
                onItemAdded(response);
                if( window.location.href.indexOf("cart") > -1){
                  sectionRender(response);
                }
            },
            error: function(response) {
                onError(response)
            },
            complete: function() {
                $('.loading-box').addClass('hidden');
            }
        });
    }
    function sectionRender(response) {
        fetch(`${window.Shopify.routes.root}?sections=main-cart-items`)
        .then((response) => response.json())
        .then((parsedState) => {
            const parsedStateSections = parsedState;
            const elToReplace = document.querySelector('#main-cart-items');
            getSectionsToRender().forEach((section => {
                document.getElementById(section.id).innerHTML = getSectionInnerHTML(parsedStateSections[section.id]);
            }));
            fetch(window.Shopify.routes.root + 'cart.js').then((response) => response.json()).then((parsedState) => {
                window.initFreeshippingGoal(parsedState);
                window.cartCount(parsedState);
            }).catch((e) => {
                console.error(e);
            });

            window.renderCrosssellProducts(parsedStateSections);
        })
        .catch((e) => {
            console.error(e);
        });
    }
    function  getSectionsToRender() {
        return [
            {
                id: 'main-cart-items',
               section: document.getElementById('main-cart-items').dataset.id,
            }
        ];
    }

    function  getSectionInnerHTML(html, selector='#main-cart-items') {
      return new DOMParser().parseFromString(html, 'text/html').querySelector(selector)?.innerHTML;
    }
    function onItemAdded(response) {
        var cartNotification = document.querySelector('cart-notification');
        cartNotification?.renderContents(response);
    }    

    function getShopGridColumn() {
        var col = 2;
        if (getWindowWidth() >= 1400) col = 4;
        else if(getWindowWidth() >= 768 && getWindowWidth() < 1400) col = 3;
        else if(getWindowWidth() >= 360 && getWindowWidth() < 992) col = 2;
        return col;
    }

    window.setProductThumbSliderHeight =  function() {
        var thumbBreakPoint = $('.swiper.product-image-main').attr( 'data-thumb-breakpoint' ) !== 'undefined' ? $('.swiper.product-image-main').attr( 'data-thumb-breakpoint' ) : sliderBreakPoint;
        if ($('.product-image-thumb.slider-vertical').length && $(window).width() > thumbBreakPoint) {
            var product_image_main_height = $('.swiper.product-image-main').outerHeight();
            $('.product-image-thumb.slider-vertical').css({'max-height': product_image_main_height});
        } else {
            $('.product-image-thumb.slider-vertical').css({'max-height': ''});
        }
    }
    setProductThumbSliderHeight();

    window.updateProductGrid = function updateProductGrid(column) {
        const $productGrid = $('#main-collection-product-grid');
        if (!$productGrid.length) return;
        var column = parseInt(column) > 0 ? parseInt(column) : getShopGridColumn();
        $('.hongo-column-switch a').removeClass('active');
        $('.hongo-column-switch a[data-col="'+column+'"]').addClass('active');
        const $productGridClasses = Array.from($productGrid[0].classList);
        $productGridClasses.map(function(className){
            if (className.indexOf('row-cols-') !== -1) {
                $productGrid.removeClass(className);
            }
        });
        $productGrid.addClass('row-cols-' + column);
        localStorage.setItem('productGridCols', column);
    }

    function updateProductInfo(html, addButton, _this) {
        const updateSections = ['price', 'sku', 'stock', 'pre-order', 'stock-label', 'cart-btn'];
        const sectionId = 'quickview';
        updateSections.forEach(function(updateSection) {
            const sectionSelector = `${updateSection}-${sectionId}`;
            const sourceElem = html.getElementById(sectionSelector);
            const destElem = document.getElementById(sectionSelector);
            if (sourceElem && destElem) {
                destElem.innerHTML = sourceElem.innerHTML;
            }
        });
        document.getElementById('price-quickview')?.classList.remove('visibility-hidden');

        if (!_this.currentVariant.available) {
            addButton.setAttribute('disabled', true);
            addButton.innerHTML = window.variantStrings.soldOut;
            document.querySelector('.product-summary .product-form-buttons')?.classList.add('disabled-btn');
        } else {
            addButton.removeAttribute('disabled', true);
            addButton.innerHTML = window.variantStrings.addToCart;
        }
    }

    window.initSwatchOptionImage = function initSwatchOptionImage() {
        var swatchImagesOptions = document.querySelectorAll('.product-filter:not(.color-filter):not(.size-filter) [data-option-type="image"]');
        swatchImagesOptions.forEach(function(swatchImagesOption) {
            const optionName = swatchImagesOption.dataset.optionName;
            if (window.variantOptionsImage.hasOwnProperty(optionName)) {
                const optionImage = window.variantOptionsImage[optionName];
                swatchImagesOption.classList.add('swatch-image');
                swatchImagesOption.querySelector('label').style.backgroundImage = 'url('+optionImage+')';
            }
        });
    }

    /****** Scroll to top progress ******/
    function scrollIndicator() {
        const scrollTop = document.documentElement.scrollTop;
        if (scrollTop > 200) {
            $('.scroll-progress').addClass('visible');
        } else {
            $('.scroll-progress').removeClass('visible');
        }
        const scrollHeight = document.documentElement.scrollHeight;
        const windowHeight = document.documentElement.clientHeight;
        const maxScrollTop = scrollHeight - windowHeight;
        const scrollPointBottom = $('.scroll-line').outerHeight();
        const scrollPointPos = (scrollTop * scrollPointBottom) / maxScrollTop;
        anime({
            targets: '.scroll-point',
            perspective: '500px',
            translateX: 0,
            translateY: scrollPointPos,
            translateZ: '0',
            easing: 'easeOutCirc'
        });
    }

    window.initTooltips = function initTooltips(elems) {
        var tooltipList = $.map(elems, function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl, {                
                trigger: 'hover'
            });
        });
    }
    resetHeader();
    initMagnificPopupVideo();
    initSlideshow();
    initPlyr();
    initShopGrid();
    initCountDownTimer();
    initSwatchOptionImage();
    scrollIndicator();

    /****** Close announcement bar ******/
    $(document).on('click', '.close-announcement-bar', function() {
        hideAnnouncementbar();
        setCookie('announcementbarclosed', 1, '30');
    });
    
    /****** Open minicart ******/
    $(document).on('click', '[cart-icon-bubble], .sticky-menu-item.sticky-cart', function(event) {
        event.preventDefault();
        const cartNotification = document.querySelector('cart-notification');
        cartNotification?.open();
    });
    
    /****** Close minicart ******/
    $(document).on('click', 'cart-notification', function(event) {
        const cartNotification = document.querySelector('cart-notification');
        const cartNotificationClose = cartNotification.querySelector('[data-cart-notification-close]');
        if (event.target === cartNotification || event.target == cartNotificationClose) {
            cartNotification.close();
        }
    });

    /****** Remove item from minicart ******/
    $(document).on('click', '[data-cart-notification-item-remove]', function(event) {
        event.preventDefault();
        if (!(document.querySelector('cart-notification'))) return;

        var _this = $(this);
        const id = _this.attr('data-id'),
              itemId = _this.attr('data-item-id'),
              giftId = localStorage.getItem("gift_id");
              if (giftId == itemId) {
                window.localStorage.removeItem('gift_wrap');
              }

        window.updateCartNotification(_this, id, 0, false);
    });
    var custom_selector= '';
    $(document).on('change', '.cart-notification-products .quantity-input', function(event) {
        event.preventDefault();
        if (!(document.querySelector('cart-notification'))) return;

        var _this = $(this);
        custom_selector = _this;
        const id = _this.attr('data-id');
        const quantity = _this.val();
        window.updateCartNotification(_this, id, quantity, true);
    });

    window.updateCartNotification = function updateCartNotification(elem, id, quantity, resetQty) {
        const cartNotification = document.querySelector('cart-notification');
        document.getElementById('cart-notification')?.classList.add('loading');
        const body = JSON.stringify({
            id, 
            quantity,
            sections: cartNotification.getSectionsToRender().map((section) => section.id),
            sections_url: window.location.pathname
        });
        fetch(`/cart/change.js`, {
            ...fetchConfig(), 
            ...{ body }
        }).then((response) => response.json()).then((response) => {
            setTimeout(function() {
                cartNotification.renderContents(response);
                document.getElementById('cart-notification').classList.remove('loading');
            }, 1000);
        }).catch((e) => {
            if (resetQty === true) {
                elem.val(elem.val() - 1);
            }
            document.getElementById('cart-notification').classList.remove('loading');
            console.error(e);
        });
    }
    window.CartRenderSection = function CartRenderSection(parsedState) {
        const cartElement = document.querySelector('[data-id]'),
        sectinElement = cartElement.closest('.shopify-section'),
        CartItem = document.querySelector('cart-items');
        SectionId = cartElement.getAttribute('data-id');
        fetch('/?section_id='+SectionId)
        .then(response => response.text())
        .then(data =>{
           sectinElement.innerHTML = data;
           window.initFreeshippingGoal(parsedState);
           window.cartCount(parsedState);
        });
    }
    window.cartCount = function cartCount(parsedState) {
        var count_bubble = parsedState.item_count;
        var cart_selectors = document.querySelectorAll('[data-cart-count]');
        var add_class = document.querySelectorAll("[cart-icon-bubble]");
        var cart_total = parsedState.original_total_price;
        if($('body').find('.cart-total-header').length > 0){
            $('.cart-total-header').html(Shopify.formatMoney(cart_total));
        }
        cart_selectors.forEach( function (cart_selector) {
            if ( cart_selector != null && cart_selector !== '' && count_bubble != undefined){
                if( count_bubble <= 0 ){
                    cart_selector.classList.add("d-none");
                    add_class.forEach( function (add_class) {
                        add_class.classList.add("no-count");
                    });
                }
                else{
                    cart_selector.classList.remove("d-none");
                    add_class.forEach( function (add_class) {
                        add_class.classList.remove("no-count");
                    });
                }
                cart_selector.innerHTML = count_bubble;
            }    
        })
        if (this.currentItemCount === count_bubble && custom_selector > 0) {
            const custom_qty = custom_selector.attr('value');
            $('.cart-item__error-text').empty();
            const mini_cartQty_error = window.cartStrings.quantityError.replace('[quantity]',custom_qty);
            const errorSelector = custom_selector.closest('.cart-notification-product').find('.cart-item__error-text');
            $(errorSelector).text(mini_cartQty_error);
            $(custom_selector).val(custom_qty);
        }
        this.currentItemCount = count_bubble ;
    }    

    /****** Free shipping goal ******/
    window.initFreeshippingGoal = function initFreeshippingGoal(parsedState) {
        const freeShippingConfig = window.freeShippingConfig || {};
        if (freeShippingConfig.enable) {
            var goal = freeShippingConfig.goal_amt;
            var ShopifyCurrency = Shopify.currency || {};
            var rate = Number(ShopifyCurrency ? ShopifyCurrency.rate || 1 : 1);
            var goalConverted = Number(goal || 1) * rate * 100;
            var subtotal = Number(parsedState.total_price);
            var msg1Text = freeShippingConfig.goal_amt_msg_1;
            var msg2Text = freeShippingConfig.goal_amt_msg_2;
            var progress = 0, msg = '';
            var freeShippingGoalHtml = '';

            var wrapperWidth = $('[data-free-shipping-goal-section]').outerWidth();
            if (subtotal > 0 && subtotal < goalConverted) {
                progress = parseInt((subtotal * 100) / goalConverted);
                msg = msg1Text.replace('{{amount}}', Shopify.formatMoney(((goalConverted-subtotal) / 100)*100));
            } else if (subtotal > 0 && subtotal >= goalConverted) {
                progress = 100;
                msg = msg2Text;
            } 
            
            if (progress >= 100 ) {     
               if("shipping_animated" in localStorage){}else{
                 (async () => {
                      await loadConfettiPreset(tsParticles);
                      tsParticles.load("tsparticles", { 
                      fullScreen: {
                        enable: false
                      },
                      particles: {
                        color: {
                          value: ['#EF2964', '#00C09D', '#2D87B0', '#48485E', '#EFFF1D'],
                        },
                        shape: {
                          type: ["circle", "square", "triangle"]
                        },
                         move: {
                          direction: "top",
                          enable: true,
                          outModes: {
                            top: "none",
                            default: "destroy"
                          },
                          gravity: {
                            enable: true
                          },
                          speed: 80
                        },
                        number: {
                          value: 0,
                          limit: 300
                        },
                        size: {
                          value: { min: 4, max: 6 },
                          animation: {
                            count: 5,
                            startValue: "min",
                            enable: true,
                            speed: 50,
                            sync: true
                          }
                        },
                        tilt: {
                          direction: "random",
                          enable: true,
                          value: {
                            min: 0,
                            max: 450
                          },
                          animation: {
                            enable: true,
                            speed: 300
                          }
                        }

                    },
                     emitters: [
                        {
                          life: {
                            duration: 3,
                            count: 1,
                          },
                          position: {
                            x: 50,
                            y: 0,
                          },
                          particles: {
                            move: {
                              direction: "top-bottom",
                            },
                          },
                          rate: {
                            quantity: 10,
                            delay: 0.1
                          },
                          size: {
                            width: 0,
                            height: 0
                          }
                        }
                      ],
                      preset: "confetti",
                    });
                    })();
                  }
                localStorage.setItem('shipping_animated', 'yes');
                $("#cart-notification").prepend("<div id='tsparticles'></div>");
                setTimeout(function(){
                    $("#tsparticles").remove()
                },7000)
            }
            else{
               $("#tsparticles").remove()
               localStorage.removeItem("shipping_animated");
            }
            if (progress > 0 & msg != '') {
                var freeShippingGoalHtml = `<div data-item="freeshipping-goal" class="cart-goal">
                    <div class="cart-goal-msg">${msg}</div>
                    <div class="cart-goal__inner">
                        <div class="cart-goal__bar">
                            <span><span class="goal-badge">${progress}</span></span>
                        </div>
                    </div>
                </div>`;
            }

            $('[data-free-shipping-goal-section]').each(function() {
                var _this = $(this);
                if (freeShippingGoalHtml == '') {
                    _this.html('');
                } else {
                    if (_this.find('[data-item="freeshipping-goal"]').length) {
                        var progressCounterStart = $('.cart-goal__bar span.goal-badge', _this).text();
                        _this.find('[data-item="freeshipping-goal"] .cart-goal-msg').html(msg);
                        $('.cart-goal__bar span.goal-badge', _this).text(progress);
                        var timeOut = 250;
                    } else {
                        _this.html(freeShippingGoalHtml);
                        $('.cart-goal__bar span.goal-badge', _this).text(progress);
                        var progressCounterStart = 0;
                        var timeOut = 0;
                    }

                    setTimeout(function() {
                        _this.prop('Counter', progressCounterStart).animate({
                            Counter: $('.cart-goal__bar span.goal-badge', _this).text()
                        }, {
                            duration: 1,
                            easing: 'linear',
                            step: function (now) {
                                $('.cart-goal__bar span:not(.goal-badge)', _this)[0].style.setProperty('--progress', Math.ceil(now) + '%')
                            }
                        });
                    }, timeOut);
                }
            });
        }
    }
    if (window.freeShippingConfig.template == 'cart') {
        fetch(window.Shopify.routes.root + 'cart.js').then((response) => response.json()).then((parsedState) => {
            initFreeshippingGoal(parsedState);
        }).catch((e) => {
            console.error(e);
        });
    }    
    

    $(document).on('mouseenter', '.megamenu-item', function() {
        $('body').addClass('menu-hover');
    }).on('mouseleave', '.megamenu-item', function () {
        $('body').removeClass('menu-hover');
    });

    $(document).on('mouseenter', '.nav-type-dropdown', function() {
        $('body').addClass('menu-hover simple-dropdown-hover');
    }).on('mouseleave', '.nav-type-dropdown', function () {
        $('body').removeClass('menu-hover simple-dropdown-hover');
    });    

    /****** Search popup ******/
    initSearchPopup();
    function initSearchPopup(argument) {
        $('[data-minisearch-trigger]').on('click',function(){
            $('body').toggleClass("active-search");
            setTimeout(function(){
            $('[data-search-input]').focus();
            },100);
        });
        $('.search-close').on('click',function(){
            $('body').removeClass("active-search");
        });
        if($('body').find('.search-type-2').length > 0){
            $('.search-type-2').on('click',function(){
                $('.search-results-wrapper').addClass('active');
                setTimeout(function(){
                    $('body').addClass('search-active');
                },50);
            });
        }
    }

    /****** Ajax search ******/
    $('[data-search-input]').each(function() {
        var _this = $(this),
            searchResult = _this.closest('#minisearch-popup').find('.search-result'),
            searchWrapper = _this.closest('#minisearch-popup').find('.search-result-wrapper'),
            notfoundtext = $(this).attr('data-no-result-text'),
            productImgWidth = $('.predictive-search img').width(),
            productImgHeight = $('.predictive-search img').height(),
            viewAllBtn = _this.closest('#minisearch-popup').find('.more-action');
            predictiveSearchHTMl = searchResult.html();
        _this.on('keyup change paste', debounce(function(){
            var query = _this.val();
            if (query.length > 2) {
                $('.predictive-wrapper').hide();
                $.getJSON(`${window.Shopify.routes.root}search/suggest.json`, {
                    "q": query,
                    "resources": {
                        "type": "product",
                        "limit": 6,
                        "options": {
                            "prefix": "last",
                            "unavailable_products": "last",
                            "fields": "title,product_type,vendor,variants.title,variants.sku,tag"
                        }
                    }
                }).done(function(response) {
                    var products = response.resources.results.products;
                    searchResult.empty();
                    if (products.length > 0) {
                        $.each(products, function(index, item) {
                            const imgHtml = (item.featured_image.url != null && item.featured_image.url != '') ? '<span class="img"><img src="' + item.featured_image.url + '" width="'+  productImgWidth +'" height="'+ productImgHeight +'"/></span>' : '';
                            var item = $('<div class="col"><a href="'+ item.url +'">'+imgHtml+'<span class="details">' + item.title + '<span class="price d-block">' + Shopify.formatMoney(item.price) + '</span></span></a></div>');
                            searchResult.append(item);
                        });
                        viewAllBtn.show();
                    } else {
                        viewAllBtn.hide();
                        searchResult.append($('<div class="no-result text-center">' + notfoundtext + '</div>'));
                    }
                    searchWrapper.fadeIn(500);
                });
            } else {
                searchResult.empty();
                viewAllBtn.hide();
                $('.predictive-wrapper').show();
            }
        }, 10));
    });

    /****** Ajax add to cart ******/
    $(document).on('click', '[data-trigger="addtocart"]', function(e) {
        e.preventDefault();
        var variantId = $(this).attr('data-variant'),
            variantQty = parseInt($(this).attr('data-qty'))
            addItem(variantId, variantQty);
    });

    /****** Add to wishlist ******/
    $(document).on('click', '[button-wishlist]', function(event) {
        var handle = $(this).attr('data-product-handle');
        var wishlistEvent = new CustomEvent("trigger:wishlist-button", {
            detail: { 
                handle: handle,
                selector: $(this)[0],
                addText: $(this).attr('data-text-add'),
                addedText: $(this).attr('data-text-added')
            }
        });
        document.dispatchEvent(wishlistEvent);
        if(window.location.href.indexOf("wishlist") > -1 ){
            window.destroyTooltip(this);
        }
    });

    window.destroyTooltip = function destroyTooltip(Element) {
        $(Element).tooltip('dispose');
    }

    /****** Product page review trigger ******/
    var hasReviews = window.hasReviewTab || false;
    if (hasReviews) {
        $(document).on('click', '[data-trigger="review-tab"]', function() {
            var isStickyEnable = $('body.sticky').length;
            var reviewSectionTopPos = $('.product-reviews-wrapper').parents().closest('.tabs-wrapper').offset().top;
            var offsetTop = isStickyEnable ? reviewSectionTopPos - getTopSpaceHeaderHeight() : reviewSectionTopPos;
            $('html, body').animate({
                scrollTop: offsetTop
            }, 500);
            $('.product-reviews-wrapper').parents().closest('.tabs-wrapper').find('[data-tab-type="reviews"]').trigger('click');
        });
    }

    /****** Product page image zoom ******/
    if (window.ZOOM && $('.product-image-main .product-media.media-image').length) {
        $('.product-image-main .product-media.media-image').each(function() {
            $(this).zoom({url: $(this).find('img').attr('data-master-image'), touch: false});
        });
    }

    $('.modal-popup').magnificPopup({
        type: 'inline',
        preloader: false,
        closeBtnInside: true,
        blackbg: true,
        callbacks: {
            open: function() {
                $('body').addClass('overflow-hidden');
            
      },
            close: function() {
                $('body').removeClass('overflow-hidden');
            },
        }
    });

    /****** Currency switcher ******/
    $('.switcher-dropdown .label').on('click', function() {
        if($(this).parent().hasClass('active')) {
            $(this).parent().removeClass('active');    
        }
        else {
            $('.switcher-dropdown.active').removeClass('active');
            $(this).parent().addClass('active');            
        }
    });
    $('[data-currency] .currency').on('click', function(event){
        event.preventDefault();
        var currency = $(this).attr("data-value");
        $('#country_code').val(currency);
        $('#currency-switcher').submit();
    });

    /****** Language switcher ******/
    $('[data-language] .language').on('click', function(event){
        event.preventDefault();
        var language = $(this).attr("data-value");
        $('#language_code').val(language);
        $('#language-switcher').submit();
    });    

    /****** Accordion using active/inactive icon params ******/
    window.accordionEvent = function accordionEvent() {
        $( '.accordion-event' ).each( function() {
            var _this               = $( this ),
                activeIconClass     = _this.attr( 'data-active-icon' ) || '',
                inactiveIconClass   = _this.attr( 'data-inactive-icon' ) || '';
            $( '.collapse', this ).on( 'show.bs.collapse', function () {
                var id = $( this ).attr( 'id' );
                $( 'a[href="#' + id + '"]' ).closest( '.panel-heading' ).addClass( 'active-accordion' );
                $( 'a[href="#' + id + '"] .panel-title i' ).removeClass( inactiveIconClass ).addClass( activeIconClass );
            }).on( 'hide.bs.collapse', function () {
                var id = $( this ).attr( 'id' );
                $( 'a[href="#' + id + '"]' ).closest( '.panel-heading' ).removeClass( 'active-accordion' );
                $( 'a[href="#' + id + '"] .panel-title i' ).removeClass( activeIconClass ).addClass( inactiveIconClass );
            });
        });
    }
    accordionEvent();

    /****** Shop column grid changer ******/
    updateProductGrid(getShopGridColumn());
    $( document ).on('click', '.hongo-column-switch a', function(event) {
        event.preventDefault();
        updateProductGrid($(this).attr('data-col'));
    });
    $(document).on('change', '#collection-filters__sort', function(event) {
        $('#collection-filters__sort-input').val($(this).val()).prop('checked', false).trigger('click');
    });
    $(document).on('click', '[data-dropdown] [data-trigger]', function(e){
        e.preventDefault();
        var dropdown = $(this).parent();
        var dropdown_target = dropdown.find('[data-target]');
        var dropdown_icon = dropdown.find('[data-icon]');
        $(dropdown_target, dropdown).stop(true).toggle();
        if (dropdown_target.is(':visible')) {
            $(dropdown_icon, dropdown).removeClass(dropdown_icon.attr('data-icon-down'));
            $(dropdown_icon, dropdown).addClass(dropdown_icon.attr('data-icon-up'));
        } else {
            $(dropdown_icon, dropdown).addClass(dropdown_icon.attr('data-icon-down'));
            $(dropdown_icon, dropdown).removeClass(dropdown_icon.attr('data-icon-up'));
        }
    });

    /****** Quick view ******/
    $(document).on('click', '[data-trigger="quickview"]', function(e){
        e.preventDefault();
        var handle = $(this).attr('data-handle');
        $('body > .loading-box').removeClass('hidden');
        jQuery.ajax({
            url: `${window.Shopify.routes.root}products/${handle}?view=quickview`,
            cache: false,
            success: function(response) {
                $.magnificPopup.open({
                    items: {
                        src: '<div class="position-relative quickview-wrapper"><div class="product-quickview-popup" id="product-quickview-content">' + response + '</div></div>',
                        type: 'inline'
                    },
                    callbacks: {
                        beforeOpen: function() {
                            $('body > .loading-box').addClass('hidden');
                            $('html, body').css({'overflowY':'hidden'});
                        },
                        open: function() {
                            initSwatchOptionImage();

                            var tooltipTriggerList = $('.product-quickview-popup .product-variants [data-bs-toggle="tooltip"]');
                            window.initTooltips(tooltipTriggerList);

                            // Init reviews
                            $.getScript(window.location.protocol + "//productreviews.shopifycdn.com/embed/loader.js");

                            // Init swiper
                            if ($('.product-quickview-popup .product-image-main').length) {
                                var swiperOptions = $('.product-quickview-popup .product-image-main').attr('data-slider-options');
                                if (typeof(swiperOptions) !== 'undefined' && swiperOptions !== null ) {
                                    swiperOptions = $.parseJSON(swiperOptions);
                                    delete swiperOptions['thumbs'];
                                    var quickviewSwiperObj = new Swiper(document.querySelector('.product-quickview-popup .product-image-main'), swiperOptions);
                                }
                            }

                            // Add to cart
                            $('#product-form-quickview').submit(function (e){
                                e.preventDefault();
                                var qvAddtocartForm = $('#product-form-quickview'),
                                    submitButton = qvAddtocartForm.find('[type="submit"]'),
                                    cartNotification = document.querySelector('cart-notification');
                                qvAddtocartForm.append('<input type="hidden" name="sections" value="cart-notification-content,cart-notification-crosssell-products" />');
                                jQuery.ajax({
                                    type: 'POST',
                                    url: `${window.Shopify.routes.root}cart/add.js`,
                                    dataType: 'json',
                                    data: qvAddtocartForm.serialize(),
                                    beforeSend : function (){
                                        submitButton.attr('disabled', true);
                                        submitButton.addClass('loading');
                                        submitButton.html(window.variantStrings.addingToCart);
                                    },
                                    success: function(response){
                                        if(cartNotification != '' &&  cartNotification != null){
                                            cartNotification.renderContents(response);
                                        } else{
                                            fetch(`${window.Shopify.routes.root}cart.js`).then((response) => response.json()).then((parsedState) => {
                                                window.initFreeshippingGoal(parsedState);
                                                window.cartCount(parsedState);
                                                window.CartRenderSection(parsedState);
                                            }).catch((e) => {
                                                console.error(e);
                                            });
                                            if (window.jQuery) {
                                                $.magnificPopup.close();
                                            }
                                        }                                        
                                    },
                                    error: function(response){
                                        var errormsg = JSON.parse(response.responseText).description;
                                        $('.errormsg-quickview').html(errormsg).show();
                                    },
                                    complete: function() {
                                        submitButton.removeAttr('disabled');
                                        submitButton.removeClass('loading');
                                        submitButton.html(window.variantStrings.addToCart);
                                    }
                                });
                            });

                            // Update variants on load
                                let selector = document.querySelector('.product-quickview-popup .product-variants [data-section="variants"]');
                                if (selector) {
                                    let variants = JSON.parse(selector.querySelector('[type="application/json"]').textContent);
                                    let options = [];  
                                    selector.querySelectorAll('fieldset').forEach(function(fieldset) {
                                      if (fieldset.classList.contains('dropdown')) {
                                        options.push(fieldset.querySelector('select').value);
                                      } else {
                                        options.push(fieldset.querySelector('input:checked').value);
                                      }
                                    });                            
                                    let Variant = variants.find((variant) => {
                                        return !variant.options.map((option, index) => {
                                            return options[index] === option;
                                        }).includes(false);
                                    });

                                    const optionNodes = document.querySelectorAll('[data-single-option]');
                                    const themeProducts = window._quickThemeProducts || {};
                                    const pickerFields = Array.from(selector.querySelectorAll("fieldset"));
                                    const productData = themeProducts[selector.dataset.productId];
                                    const quickSelectOption = pickerFields.map(field => {
                                      const type = field.dataset.pickerField;
                                      return Array.from(field.querySelectorAll("input")).find(radio => radio.checked)?.value;
                                    });
                                    quickGetVariantFromOptionArray(productData, quickSelectOption);
                                    optionNodes.forEach(optNode => {
                                        const {optionPosition,value } = optNode.dataset;
                                        const optPos = Number(optionPosition);
                                        let matchVariants = [];
                                        const maxOptions = 3;
                                        if (optPos === maxOptions) {
                                          const optionsArray = Array.from(Variant.options);
                                                optionsArray[maxOptions - 1] = value;
                                          matchVariants.push(quickGetVariantFromOptionArray(productData, optionsArray));
                                        }
                                        else{
                                          matchVariants = variants.filter(v => v.options[optPos - 1] === value && v.options[optPos - 2] === Variant[`option${optPos - 1}`]);
                                        }
                                        matchVariants = matchVariants.filter(Boolean);
                                        const unavailableOptClass = 'unavailable-opt';
                                        if (matchVariants.length) {
                                            optNode.classList.remove(unavailableOptClass);
                                            const isSoldout = matchVariants.every(v => v.available === false);
                                            const method = isSoldout ? 'add' : 'remove';
                                            optNode.classList[method]('soldout-opt');
                                              const nextEle = document.querySelector(".product-filter:not(:first-child)  .variant-option +  .variant-option input");
                                        } else {
                                            optNode.classList.add(unavailableOptClass);
                                        }
                                    });
                                }

                            // Init variants
                            if ($('.product-quickview-popup .product-variants [data-section="variants"]').length) {
                                document.querySelector('.product-quickview-popup .product-variants [data-section="variants"]').addEventListener('change', function(event) {
                                    var variantData = JSON.parse(this.querySelector('[type="application/json"]').textContent);
                                    var _this = $(this)[0];
                                    var addButton = document.getElementById('product-form-quickview')?.querySelector('[name="add"]');
                                    var options = [];
                                    _this.querySelectorAll('fieldset').forEach(function(fieldset) {
                                        if (fieldset.classList.contains('dropdown')) {
                                          options.push(fieldset.querySelector('select').value);
                                        } else {
                                          options.push(fieldset.querySelector('input:checked').value);
                                        }
                                    });

                                    _this.currentVariant = variantData.find((variant) => {
                                        return !variant.options.map((option, index) => {
                                            return options[index] === option;
                                        }).includes(false);
                                    });
                                    if (!_this.currentVariant) {
                                      const optionNodes = document.querySelectorAll('#variants-quickview .product-filter:not(:first-child) [data-single-option]:checked');
                                      const Allvariant = document.querySelectorAll('#variants-quickview .product-filter:not(:first-child) [data-single-option]');
                                            optionNodes.forEach(function(optionItem, optionItemIndex){
                                              optionItem.classList.add('unavailable-opt');
                                            })
                                            var OnchangeAvailableVariantClicked = '';
                                            Allvariant.forEach(function(optionItem, optionItemIndex){
                                              if(!optionItem.classList.contains("unavailable-opt")){
                                                 OnchangeAvailableVariantClicked = optionItem;
                                              }
                                            }) 
                                            $(OnchangeAvailableVariantClicked).trigger( "click" );
                                            const  varinatvalue = OnchangeAvailableVariantClicked.getAttribute('value') 
                                            setTimeout(function () {
                                                event.target.closest('.product-filter').querySelector('label.form-label span').innerHTML = varinatvalue;
                                            },50);
                                      }
                                    else{
                                      const optionNodes = document.querySelectorAll('[data-single-option]');
                                      const themeProducts = window._quickThemeProducts || {};
                                      const pickerFields = Array.from(_this.querySelectorAll("fieldset"));
                                      const productData = themeProducts[_this.dataset.productId];
                                      const quickSelectOption = pickerFields.map(field => {
                                        const type = field.dataset.pickerField;
                                        return Array.from(field.querySelectorAll("input")).find(radio => radio.checked)?.value;
                                      });
                                      quickGetVariantFromOptionArray(productData, quickSelectOption);
                                        const variants = variantData;
                                        optionNodes.forEach(optNode => {
                                          const {optionPosition,value } = optNode.dataset;
                                          const optPos = Number(optionPosition);
                                          const maxOptions = 3;
                                          let matchVariants = [];
                                          if (optPos === maxOptions) {
                                            const variant = _this.currentVariant;
                                            const optionsArray = Array.from(variant.options);
                                                  optionsArray[maxOptions - 1] = value;
                                            matchVariants.push(quickGetVariantFromOptionArray(productData, optionsArray));
                                          }
                                          else{
                                            matchVariants = variants.filter(v => v.options[optPos - 1] === value && v.options[optPos - 2] === _this.currentVariant[`option${optPos - 1}`]);
                                          }
                                          matchVariants = matchVariants.filter(Boolean);
                                          const unavailableOptClass = 'unavailable-opt';
                                          if (matchVariants.length) {
                                              optNode.classList.remove(unavailableOptClass);
                                              const isSoldout = matchVariants.every(v => v.available === false);
                                              const method = isSoldout ? 'add' : 'remove';
                                              optNode.classList[method]('soldout-opt');
                                                const nextEle = document.querySelector(".product-filter:not(:first-child)  .variant-option +  .variant-option input");
                                          } else {
                                              optNode.classList.add(unavailableOptClass);
                                          }
                                        });
                                        const selectedVariant = document.querySelectorAll('#variants-quickview .product-filter:not(:first-child) [data-single-option]:checked');
                                        const Allvariant = document.querySelectorAll('#variants-quickview .product-filter:not(:first-child) [data-single-option]');
                                        selectedVariant.forEach(function(selectItem, selectItemIndex){
                                          if (selectItem.classList.contains("soldout-opt") == true) {
                                            var availableItem = '';
                                            Allvariant.forEach(function(allItem, allItemIndex){
                                              if(!allItem.classList.contains("unavailable-opt") && !allItem.classList.contains("soldout-opt")){
                                                availableItem = allItem;
                                              }
                                            })
                                                $(availableItem).trigger( "click" ); 
                                          }
                                        })
                                    }
                                        event.target.closest('.product-filter').querySelector('label.form-label span').innerHTML = event.target.value;
                                        let sale = _this.currentVariant ? _this.currentVariant.compare_at_price/100 : 0;
                                        let curt_price = _this.currentVariant ? _this.currentVariant.price/100 : 0 ;
                                        let dis_per = (Math.round(((sale - curt_price)*100)/sale));
                                        setTimeout(function () {
                                          $('.sav-per').text(dis_per);
                                        }, 1000);
                                        if (!_this.currentVariant || typeof _this.currentVariant === undefined || _this.currentVariant == 'undefined') {
                                            if (addButton) {
                                                addButton.setAttribute('disabled', true);
                                                addButton.innerHTML = window.variantStrings.unavailable;
                                            }
                                            document.getElementById('price-quickview')?.classList.add('visibility-hidden');
                                            document.querySelector('.product-quickview-popup .product-summary .product-form-buttons')?.classList.add('disabled-btn');
                                        } else {
                                            if (_this.currentVariant?.featured_media) {
                                                var currentVariantMedia = document.querySelector('[data-media-id="quickview-'+_this.currentVariant.featured_media.id+'-main"]');
                                                if (currentVariantMedia) {
                                                    var mediaIndex = currentVariantMedia.getAttribute('data-index');
                                                    var mainSwiper = document.querySelector('.product-quickview-popup .product-image-main').swiper || false;
                                                    if (mainSwiper) {
                                                        mainSwiper.slideTo(mediaIndex - 1);
                                                    };
                                                }
                                            }
                                            var quickviewProductForm = document.querySelector('#product-form-quickview');
                                            var input = quickviewProductForm.querySelector('input[name="id"]');
                                            input.value = _this.currentVariant.id;
                                            input.dispatchEvent(new Event('change', { bubbles: true }));
                                            fetch(this.dataset.url + '?variant=' + _this.currentVariant.id + '&view=quickview')
                                                .then((response) => response.text())
                                                .then((responseText) => {
                                                    var html = new DOMParser().parseFromString(responseText, 'text/html');
                                                    updateProductInfo(html, addButton, _this);
                                                    if(_this.currentVariant.available) {
                                                    document.querySelector('.product-quickview-popup .product-summary .product-form-buttons')?.classList.remove('disabled-btn');
                                                  }
                                                }
                                            );
                                        }
                                });
                            }
                            function quickGetVariantFromOptionArray(product, options){
                               const result = product.variants.filter(function (variant) {
                                return options.every(function (option, index) {
                                  return variant.options[index] === option;
                                });
                              });
                              return result[0] || null;
                            }
                        },
                        close: function() {
                            $('html, body').css({'overflowY':''});
                            $('.magic-cursor-wrapper').removeClass('sliderhover');
                        }
                    }
                });
            },
            complete: function() {
                $('body > .loading-box').addClass('hidden');
            }
        });
    });
    /****** product page mobile filter ******/

    $(document).on('click', '.filter-btn', function () {
        $('body').addClass('active-filter');
    }).on('click', '.sidebar-filter-close, .product-sidebar-overlay', function (e) {
        e.preventDefault();
        $('body').removeClass('active-filter');
    });    
    $('#navbarNav').on('show.bs.collapse', function () {
        $('body').addClass('navbar-collapse-show');
        $('body').addClass('navbar-open');
    }).on('hide.bs.collapse', function () {
        $('#navbarNav .open').removeClass('open');
        $('body').removeClass('navbar-collapse-show');
        setTimeout(function() {
            $('body').removeClass('navbar-open');
        },500);
    });
    $('.menu-close, .menu-overlay').on('click', function() {
        $('.navbar-toggler').trigger('click');
    });
    $('.parent').on('click', function(e) {
            e.preventDefault();
        if ($(window).width() < 1200) {
            $(this).parent().next('.menu-lable').remove();
            $(this).parent().next('.sub-menu, .child-submenu').addClass('open');
            $(this).parents().closest('.open').parent().addClass('subopen');
            $(".mobile-language-currency").addClass("menu-open");
            $("#navbarNav .navbar-nav, #navbarNav .vertical-navbar-list").addClass("child-sub-open");
        }
    });
    $('.back-wrapper').on('click', function() {
        $(this).parents().closest('.subopen').removeClass('subopen');
        $(this).closest('.open').removeClass('open');
    });
    $('.navbar-nav > li > .dropdown-menu > .container-fluid > .back-wrapper, .vertical-navbar-list  .back-wrapper ').click(() => {
        $(".mobile-language-currency").removeClass("menu-open");
        
    })
    $('.navbar-nav > li > .dropdown-menu.megamenu > .container-fluid > .back-wrapper, .navbar-nav > li > .dropdown-menu.megamenu > .container > .back-wrapper, .vertical-navbar-list .block-menu-wrapper > .back-wrapper ').click(() => {
        $("#navbarNav .navbar-nav, #navbarNav .vertical-navbar-list").removeClass("child-sub-open");
    })

    $('.navbar-nav > li > .dropdown-menu > .container > .back-wrapper, .vertical-navbar-list  .back-wrapper').click(() => {
        $(".mobile-language-currency").removeClass("menu-open");
    })

 
    /****** Tool tips ******/
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    window.initTooltips(tooltipTriggerList);
    $(document).on('click', 'a.active-facet', function(event) {
        event.preventDefault();
        const form = $(this).closest('collection-filters-form')[0];
        form.onActiveFilterClick(event);
    });
    $(document).on('click', '.back-to-top, .scroll-top', function(e) {
        e.preventDefault();
        $('html, body').animate({scrollTop: 0}, 300);
    });
    $(document).on('click', '[data-scroll-to]', function(e) {
        e.preventDefault();
        var scrollTarget = $(this).attr('data-scroll-to');
        if ($(scrollTarget).length) {
            $('html, body').animate({scrollTop: $(scrollTarget).offset().top}, 300);
        }
    });

    /****** Custom cursor on swiper ******/
    function animeCursor(event) {
        anime({
            targets: '#ball-cursor',
            perspective: '500px',
            translateX: event.clientX,
            translateY: event.clientY,
            translateZ: '0',
            duration: 500,
            easing: 'easeOutCirc'
        });
    }
    $(document).on('mousemove', function(){
        animeCursor(event);
    }).on('mouseenter mousemove', '.magic-cursor', function(event) {
        $('.magic-cursor-wrapper').addClass('sliderhover');
        if ($(this).hasClass('magic-cursor-light')) {
            $('.magic-cursor-wrapper').removeClass('dark').addClass('light');
        } else if($(this).hasClass('magic-cursor-dark')) {
            $('.magic-cursor-wrapper').removeClass('light').addClass('dark');
        } else {
            $('.magic-cursor-wrapper').removeClass('light dark');
        }
    }).on('mouseleave', '.magic-cursor', function(event) {
        $('.magic-cursor-wrapper').removeClass('sliderhover');
    });
    $(document).on('mouseenter', '.magic-cursor a:not(.product-image, .slider-footer-inner span + a), .slideshow .slider-footer-inner,  .swiper-pagination, .swiper-button-prev, .swiper-button-next', function(event) {
        document.getElementById('drag-cursor').style.opacity = '0';
    }).on('mouseleave', '.magic-cursor a:not(.product-image, .slider-footer-inner span + a), .swiper-pagination, .slideshow .slider-footer-inner, .swiper-button-prev, .swiper-button-next', function(event) {
        document.getElementById('drag-cursor').style.opacity = '1';
    });

    /****** Purchase notification ******/
    const recentBoughtSelector = document.getElementById('recentBought') || false;
    var recentBoughtTimeout;
    function initRecentBought(){
        if (recentBoughtSelector && window?.RecentBoughtJsonConfig?.products && window.RecentBoughtJsonConfig.products.length) {
            recentBoughtTimeout = setTimeout(function() {
                var curproductIndex = Math.floor((Math.random() * window.RecentBoughtJsonConfig.products.length - 1) + 1);
                var recentBought = window.RecentBoughtJsonConfig.products[curproductIndex],
                productImg = recentBought.p_img,
                productName = recentBought.p_name,
                productUrl = recentBought.p_url,
                productLoc = recentBought.p_loc[Math.floor(Math.random() * recentBought.p_loc.length)].trim(),
                fromText = window.RecentBoughtJsonConfig.canShowTime == 'true' ? '<span>' + Math.floor((Math.random() * 60) + 1) + '</span> Minute ago from ' + productLoc : 'From ' + productLoc;
                var recentBoughtHtml = '<img src="'+productImg+'" width="'+recentBought.p_img_width+'" height="'+recentBought.p_img_height+'" alt="" /><div class="recent-bought-content d-flex flex-column"><span>'+window.RecentBoughtJsonConfig.mainText+'</span><a href="'+productUrl+'" class="recent-title">'+productName+'</a><div class="bought-time mt-auto">'+fromText+'</div></div>';
                var imgPreload = new Image();
                $(imgPreload).attr({src: productImg});
                $(imgPreload).load(function (response, status, xhr) {
                    recentBoughtSelector.querySelector('.recent-bought-inner').innerHTML = recentBoughtHtml;
                    recentBoughtSelector.classList.remove('slideDown')
                    recentBoughtSelector.classList.add('slideUp');
                    recentBoughtTimeout = setTimeout(function(){
                        recentBoughtSelector.classList.remove('slideUp');
                        recentBoughtSelector.classList.add('slideDown');
                        initRecentBought();
                    }, window.RecentBoughtJsonConfig.display_time);
                });
            }, window.RecentBoughtJsonConfig.delay_time);
        }
    }
    if (recentBoughtSelector) {
        document.querySelector('.recent-bought .close-icon').addEventListener('click', function() {
            clearTimeout(recentBoughtTimeout);
            recentBoughtSelector.parentNode.remove();
            window.RecentBoughtJsonConfig = {};
        });
        initRecentBought();
    }

    function setProductInstance(productVariant) {
        const productVariantHandle = productVariant.dataset.handle;
        if (Shopify.HongoProductsObj.hasOwnProperty(productVariantHandle)) {
            productVariant.productInstance = Shopify.HongoProductsObj[productVariantHandle];
            applyVariantChangeEvent(productVariant);
        } else {
            fetch(`${Shopify.routes.root}products/${productVariantHandle}.js`)
                .then(function(response) {
                    return response.status == 200 ? response.json() : false;
                }).then(function(response) {
                    Shopify.HongoProductsObj[productVariantHandle] = response;
                    productVariant.productInstance = response;
                    applyVariantChangeEvent(productVariant);
                }
            );
        }
    }

    function applyVariantChangeEvent(productVariant) {
        $('.variant-option', productVariant).on('click', function(event) {
            $(this).siblings().removeClass('selected');
            $(this).addClass('selected');
            var option_value = this.dataset.optionName,
            selectedVariant = productVariant.productInstance.variants.find((variant) => variant.options.indexOf(option_value) !== -1),
            productBox = $(this).closest('.product-box');
            priceBox = productBox[0].querySelector('.price-box') || false;
            if (!selectedVariant) {
                return;
            }
            if (!priceBox) {
                return;
            }
            priceBox.querySelectorAll('.price-item').forEach(function(priceitem) {
                priceitem.classList.add('d-none');
            });
            var price = selectedVariant.price > 0 ? Shopify.formatMoney(selectedVariant.price) : false,
            compare_price = selectedVariant.compare_at_price > 0 ? Shopify.formatMoney(selectedVariant.compare_at_price) : false,
            old_price = priceBox.querySelector('.price-item.old-price') || false,
            special_price = priceBox.querySelector('.price-item.special-price') || false,
            regular_price = priceBox.querySelector('.price-item.regular-price') || false;
            old_price.querySelector('span.price').innerHTML = '<s>' + compare_price + '</s>';
            special_price.querySelector('span.price').innerHTML = price;
            regular_price.querySelector('span.price').innerHTML = price;
            if (price && compare_price && selectedVariant.price < selectedVariant.compare_at_price) {
                old_price.classList.remove('d-none');
                special_price.classList.remove('d-none');
            } else {
                regular_price.classList.remove('d-none');
            }
            var product_slider = productBox.find('.product-image-slider');
            var variant_id = selectedVariant.featured_media.id;
            var newMedia = document.querySelector(
                `[data-meida-img-id="${variant_id}"]`
              );
            if (selectedVariant.featured_image != '') {
                var variantImage = getResizedImage(selectedVariant.featured_image.src, '535x');
                var is_slider = productBox.attr('slider'); 
                if ( typeof is_slider !== 'undefined' && is_slider !== false && is_slider !== 'false') { 
                    var mediaIndex = newMedia.getAttribute('image-index');
                    product_slider[0].swiper.slideTo(mediaIndex - 1,1000,false);   
                } 
                else{
                    productBox.find('.product-image img:not(.hongo-alternate-image)').removeAttr('srcset').attr('src', variantImage); 
                }                                
            }
        });
    }

    function getResizedImage(image, size) {
        if (size == null) { return image; }
        if (size === 'master') { return removeProtocol(image); }

        var match = image.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i);

        if (match != null) {
          var prefix = image.split(match[0]);
          var suffix = match[0];
          return removeProtocol(prefix[0] + '_' + size + suffix);
        }

        return null;
    }
    function removeProtocol(path) {
        return path.replace(/http(s)?:/, '');
    }
    window.initVariantChanger = function initVariantChanger(selector) {
        if (typeof selector == typeof undefined || selector == 'undefined') {
            selector = document;
        }
        var productVariants = selector.querySelectorAll('.product-variants[data-handle]') || false;
        if (productVariants) {
            productVariants.forEach(function(productVariant) {
                setProductInstance(productVariant);
            });
        }
    }
    window.initVariantChanger();

    /****** Sticky add to cart variant change ******/
    $(document).on('change', '[data-sticky-variant-dd]', function() {
        window.updateStickyAddtocartInfo($(this).val());
    });

    window.updateStickyAddtocartInfo = function updateStickyAddtocartInfo(selectedVariant) {
        const variantConfig = window.stickyVariantConfig;
        if (variantConfig.hasOwnProperty(selectedVariant)) {
            const variantData = variantConfig[selectedVariant];
            // Update sticky add to cart image
            $('.sticky-addtocart .product-img img').attr('src', variantData.image);

            // Update sticky add to cart price
            if ( variantData.wihtoutMoney_price < variantData.wihtoutMoney_compare_price) {
                $('.sticky-addtocart-price').addClass('price--on-sale');
                $('.sticky-addtocart-price .price-item--sale').html(variantData.price);
                $('.sticky-addtocart-price .price-item--regular').html(variantData.compare_price);
            } else {
                $('.sticky-addtocart-price').removeClass('price--on-sale');
                $('.sticky-addtocart-price .price-item--sale').html(variantData.price);
                $('.sticky-addtocart-price .price-item--regular').html(variantData.price);
            }

            // Update sticky add to cart button
            if (variantData.availability_text == 'in_stock') {
                $('.sticky-addtocart .cart-btn').attr('disabled', false);
                $('.sticky-addtocart .cart-btn').html(window.variantStrings.addToCart);
            } else if(variantData.availability_text == 'pre_order') {
                $('.sticky-addtocart .cart-btn').attr('disabled', false);
                $('.sticky-addtocart .cart-btn').html(window.variantStrings.preOrder);
            } else if(variantData.availability_text == 'out_of_stock') {
                $('.sticky-addtocart .cart-btn').html(window.variantStrings.soldOut);
                $('.sticky-addtocart .cart-btn').attr('disabled', true);
            }
        }
    }

    function showStickyAddtoCart() {
        var scrollTop = $(window).scrollTop();
        var $product_addtocart_form = $('.product-summary product-form');
        if ($product_addtocart_form.length) {
            var $product_addtocart_form_top_pos = $product_addtocart_form.offset().top + $product_addtocart_form.outerHeight();
            if (($product_addtocart_form_top_pos < scrollTop)) {
                $('.sticky-addtocart').addClass('show');
                $('body')[0].style.setProperty('--sticky-addtocart-space', $('.sticky-addtocart').outerHeight() + 'px');
            } else {
                $('.sticky-addtocart').removeClass('show');
                $('body')[0].style.setProperty('--sticky-addtocart-space', 0);
            }
        }
    }

    window.infinitescroll = function infinitescroll() {
      const onloadcountEle = document.querySelector('.pegi-product-count'),
          onloadCurrentItem= parseInt($(onloadcountEle).attr("current-item")),
          onloadTotalItem = parseInt($(onloadcountEle).attr("total-item")),
          onloadPercentage = (100*onloadCurrentItem)/onloadTotalItem ;
          $('.progress-percent').css("width",onloadPercentage + "%").attr("data-percent",onloadPercentage);
            if (window.location.href.indexOf("blogs") > -1) {
                var contianerElement = '#main-blog-grid';
            }else{
                var contianerElement = '#main-collection-product-grid';
            } 
      const endlessScroll = new Ajaxinate({
        container: contianerElement,
        pagination: '#infinite-scroll-btn',
        loadingText: '<svg class="spinner spinner-lodding" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="6"></circle></svg>'
      });
    }
    window.loadMore = function loadMore() {
      const onloadcountEle = document.querySelector('.pegi-product-count'),
          onloadCurrentItem= parseInt($(onloadcountEle).attr("current-item")),
          onloadTotalItem = parseInt($(onloadcountEle).attr("total-item")),
          onloadPercentage = (100*onloadCurrentItem)/onloadTotalItem ;
          if (window.location.href.indexOf("blogs") > -1) {
            var contianerElement = '#main-blog-grid';
          }else{
            var contianerElement = '#main-collection-product-grid';
          }  
          $('.progress-percent').css("width",onloadPercentage + "%").attr("data-percent",onloadPercentage);
      const endlessScroll = new Ajaxinate({
        container: contianerElement,
        pagination: '#load-more-btn',
        method: 'click',
        loadingText: '<svg class="spinner spinner-lodding" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="6"></circle></svg>',
      });
    }
    Ajaxinate.prototype.loadMore = function getTheHtmlOfTheNextPageWithAnAjaxRequest() {
      this.request = new XMLHttpRequest(); 
      this.request.onreadystatechange = function success() {
        if (this.request.readyState === 4 && this.request.status === 200) {
          var parser = new DOMParser();
          var htmlDoc = parser.parseFromString(this.request.responseText, "text/html");
          var newContainer = htmlDoc.querySelectorAll(this.settings.container)[0];
          var newPagination = htmlDoc.querySelectorAll(this.settings.pagination)[0];
          this.containerElement.insertAdjacentHTML('beforeend', newContainer.innerHTML);
          this.paginationElement.innerHTML = newPagination.innerHTML;
          if (this.settings.callback && typeof this.settings.callback === 'function') {
            this.settings.callback(this.request.responseXML);
          }

             /** Init Reviews **/
              setTimeout(function(){
                 $.getScript(window.location.protocol + "//productreviews.shopifycdn.com/embed/loader.js");
              },500)
              var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
              window.initTooltips(tooltipTriggerList);

              // Init variantchanger
              window.initVariantChanger();
              const countEle = htmlDoc.querySelector('.pegi-product-count'),
              CurrentItem = parseInt($(countEle).attr("current-item")),
              TotalItem = parseInt($(countEle).attr("total-item")),
              pagepretext = "Showing " + CurrentItem + " of " + TotalItem + " Product",
              Percentage = (100*CurrentItem)/TotalItem ;
              $('.pegi-product-count').text(pagepretext).attr("current-item",CurrentItem);
              $('.progress-percent').css("width",Percentage + "%").attr("data-percent",Percentage);
              if (CurrentItem == TotalItem) {
                $('.pegi-product-count, .pegi-product-count + div').hide();
                $('.blogs-pagination').hide();
              }
              else{
                $('.blogs-pagination').show();
              }
              CardBox()
          this.initialize();
        }
      }.bind(this);
      this.request.open('GET', this.nextPageUrl, true);
      this.request.send();
    };
    if ($("#load-more-btn").length > 0) {
        window.loadMore();
    }
    else if($("#infinite-scroll-btn").length > 0){
        window.infinitescroll();
    }
    window.updateTooltip = function updateTooltip(elem, showTooltip) {
        const oldTooltip = bootstrap.Tooltip.getInstance(elem);
        if (oldTooltip) oldTooltip.dispose();
        const newTooltip = new bootstrap.Tooltip(elem, {            
            trigger: 'hover'
        });
        if( showTooltip ) newTooltip.show();
    }

    window.initCompare = function initCompare() {
        const compareItems = getCompareItems();
        var compareButtons = document.querySelectorAll('[data-compare="add"]');
        compareButtons.forEach(function(compareButton) {
            const compareHanle = compareButton.dataset.handle;
            if (compareItems.indexOf(compareHanle) !== -1) {
                compareButton.setAttribute('data-compare', 'view');
                compareButton.setAttribute('data-bs-original-title', 'View compare');
            }
        });
    }

    function updateCompareItems(handle, remove) {
        var compareItems = getCompareItems();
        var compareItemIndex = compareItems.indexOf(handle);

        // Add item to compare
        if (!remove && compareItemIndex === -1) {
            compareItems.push(handle);
        }

        // Remove item from compare
        if (remove && compareItemIndex !== -1) {
            compareItems.splice(compareItemIndex, 1);
        }

        return setCompareItems(compareItems);
    }

    function updateCompareButton(method, handle) {
        document.querySelectorAll('[data-compare="'+method+'"][data-handle="'+handle+'"]').forEach(function(btn) {
            const data_compare = (method == 'add') ? 'view' : 'add';
            const data_bs_original_title = (method == 'add') ? 'View compare' : 'Add to compare';
            btn.setAttribute('data-compare', data_compare);
            const hasTooltip = btn.getAttribute('data-bs-toggle') || false;
            if (hasTooltip) {
                btn.setAttribute('data-bs-original-title', data_bs_original_title);
                if (method != 'add' ) {
                    const showTooltip = (method == 'add') ? true : false;
                    window.updateTooltip(btn, showTooltip);
                }
            }
        });
    }
    function setCompareItems(array) {
        var compareItems = array.join(',');
        if (array.length) {
            localStorage.setItem(window.compareKey, compareItems);
        } else {
            localStorage.setItem(window.compareKey, '');
        }
    }
    function getCompareItems() {
        var compareItems = localStorage.getItem(window.compareKey) || false;
        if (compareItems) return compareItems.split(',');
        return [];
    }
    function openComparePopup() {
        var tableHtml = '';
        var compareItems = getCompareItems();
        if (compareItems.length > 0) {
            var queryItems = [];
            compareItems.forEach(function(compareItem) {
                if ($.isNumeric(Number(compareItem))) {
                    queryItems.push("id:" + Number(compareItem));
                }
            })
            if (!queryItems.length) return;
            jQuery.ajax({
                url: "/search",
                data: {
                  view: "compare",
                  type: "product",
                  q: queryItems.join(' OR ')
                },
                dataType: "html",
                type: "GET",
                success: function(response) {
                    $.magnificPopup.open({
                        removalDelay: 1000,
                        mainClass: 'mfp-compare-popup',
                        items: {
                            src: '<div class="product-compare-popup" id="product-compare-popup" style="background:#fff">'+response+'</div>',
                            type: 'inline'
                        },
                        callbacks: {
                            open: function() {
                                $('body').addClass('overflow-hidden');
                                $.getScript(window.location.protocol + "//productreviews.shopifycdn.com/embed/loader.js");
                                const imagewrapper = $('.compare-table-wrapper .compare-table-right td.image');
                                imagewrapper.imagesLoaded(function() {
                                    var imageWrapperHeight = 0;                                
                                    $('.compare-table-wrapper .compare-table-right td.image').each(function() {
                                        if ($(this).outerHeight() > imageWrapperHeight) {
                                            imageWrapperHeight = $(this).outerHeight();
                                        }
                                    });
                                    $('.compare-table-wrapper .compare-table-left td.image').css({'height': imageWrapperHeight+'px'});
                                });
                            },
                            close: function(){
                                $('body').removeClass('overflow-hidden');
                            }
                        }
                    });
                }
            });
        }
    }
    $(document).on('click', '[data-compare="add"]', function(e) {
        e.preventDefault();
        updateCompareItems($(this).attr('data-handle'), false);
        updateCompareButton('add', $(this).attr('data-handle'));        
        openComparePopup();
    });
    $(document).on('click', '[data-compare="view"]', function(e) {
        e.preventDefault();
        window.destroyTooltip(this);
        openComparePopup();
    });
    $(document).on('click', '[data-compare="remove"]', function(e) {
        e.preventDefault();
        updateCompareItems($(this).attr('data-handle'), true);
        updateCompareButton('view', $(this).attr('data-handle'));
        $('.compare-table-right td[data-product="'+$(this).attr('data-handle')+'"]').remove();
        if (!getCompareItems().length) $.magnificPopup.close();
    });
    initCompare();

    /****** Cart terms and conditions ******/
    function initTerms() {
        $(document).on('change', '[data-terms-trigger]', function() {
            const action = $(this).attr('data-terms-trigger');
            const btn = $('[data-terms-action="'+action+'"]');
            if (btn) {
                if ($(this).is(':checked')) {
                    btn.removeAttr('disabled');
                } else {
                    btn.attr('disabled', true);
                }
            }
        });
    }

    /****** Crosssell product ******/
    window.renderCrosssellProducts = function renderCrosssellProducts(content = '', load) {
        if (!content.hasOwnProperty('cart-notification-crosssell-products')) return;
        const crosssell_products_wrapper = document.querySelector('#cart-notification-crosssell-products') || false
        const cart_first_item = document.querySelector('.cart-notification-products li') || document.querySelector('.cart__items .cart-item') || false;
        if (!crosssell_products_wrapper || !cart_first_item) return;
        const crosssell_products_type = crosssell_products_wrapper.dataset.crosssell_type;
        if (crosssell_products_type == 'api') {
            fetch(`${window.Shopify.routes.root}recommendations/products?section_id=cart-notification-crosssell-products&product_id=${cart_first_item.dataset.product}&limit=4`)
                .then((response) => response.text())
                .then((crosssell_content) => {
                    if (crosssell_content != '') {
                        const parsedHtml = new DOMParser().parseFromString(crosssell_content, 'text/html').querySelector('#shopify-section-cart-notification-crosssell-products').innerHTML;
                        crosssell_products_wrapper.innerHTML = parsedHtml;
                        var crosssell_products_wrapper_swiper = crosssell_products_wrapper.querySelector('.swiper') || false;
                        if (!crosssell_products_wrapper_swiper) return;
                        var sliderOptions = crosssell_products_wrapper_swiper.getAttribute('data-slider-options');
                        if (typeof(sliderOptions) !== 'undefined' && sliderOptions !== null ) {
                            window.initVariantChanger(document.getElementById('cart-notification-crosssell-products'));
                            sliderOptions = $.parseJSON(sliderOptions);
                            const swiperObj = new Swiper(crosssell_products_wrapper_swiper, sliderOptions);
                            if (load == true ) {
                              setTimeout(function(){
                               $.getScript(window.location.protocol + "//productreviews.shopifycdn.com/embed/loader.js");
                              },500)
                            }
                        }
                    }
                });
        } else {
            const parsedHtml = new DOMParser().parseFromString(content['cart-notification-crosssell-products'], 'text/html').querySelector('#shopify-section-cart-notification-crosssell-products').innerHTML;
            crosssell_products_wrapper.innerHTML = parsedHtml;
            var crosssell_products_wrapper_swiper = crosssell_products_wrapper.querySelector('.swiper') || false;
            if (!crosssell_products_wrapper_swiper) return;
            var sliderOptions = crosssell_products_wrapper_swiper.getAttribute('data-slider-options');
            if (typeof(sliderOptions) !== 'undefined' && sliderOptions !== null ) {
                window.initVariantChanger(document.getElementById('cart-notification-crosssell-products'));
                sliderOptions = $.parseJSON(sliderOptions);
                const swiperObj = new Swiper(crosssell_products_wrapper_swiper, sliderOptions);
                if (load == true) {
                  setTimeout(function(){
                    $.getScript(window.location.protocol + "//productreviews.shopifycdn.com/embed/loader.js");
                  },500)
                }
            }
        }
    }

    window.initCartNotificationScrollBar = function initCartNotificationScrollBar() {
        $('.cart-notification-products-wrapper').mCustomScrollbar({
            setHeight: 300,
            scrollInertia: 1000,
            scrollButtons:{
                enable:false
            },
            keyboard:{
                enable: true
            },
            mouseWheel:{
                enable:true,
                scrollAmount:200
            },
            advanced:{
                updateOnContentResize:true,
                autoExpandHorizontalScroll:true,
            }
        });
    }

    $(window).on('load', function () {
        showStickyAddtoCart();
        setParallax();
        animateHeader();
        initMap();
        initTerms(); 
        lookbookPopup();
        MenuCollectionImgWrap();
        RecentViewProduct();
        TestimonialBanner();
        VerticalMenu();
        CardBox();
        VerticalMenuMobile();
        ShopCategoryHoverEffect();
    });

    $(window).resize(function() {
        onepagemenu();
        resetHeader();
        animateHeader(); 
        VerticalMenuMobile();
        MenuCollectionImgWrap();
        setTimeout(function (argument) {
            setProductThumbSliderHeight();            
        }, 500);
        if ($lastWindowWidth != $(window).width()) {
            updateProductGrid(getShopGridColumn());
        }
        $lastWindowWidth = $(window).width();
    });

    $(window).scroll(function() {
        animateHeader();
        scrollIndicator(); 
        showStickyAddtoCart();
        initScrollNavigate();
        addClassOnScroll();
    });
    $('.forgot-link').on('click', function(){
        $('.forgot-pwd').addClass('active-form');
    });
    $('.cancel-btn').on('click', function(e){
        e.preventDefault();
        $('.forgot-pwd').removeClass('active-form');
    });

    /****** Recent viewed products ******/
    function RecentViewProduct(){
        if($('body').find('.recentView-main').length > 0){
          if(window.location.href.indexOf("products") > -1 || window.location.href.indexOf("cart") > -1){
            const ProductHandle =   productData.product_handle
            var productList,sameProduct;
            if (localStorage.getItem('recentlyViewedProduct') === null) {
                 productList = [];
                 if (ProductHandle != '/products/'){
                 productList.push(ProductHandle);
                }
            } 
            else{
                productList = JSON.parse(localStorage.getItem('recentlyViewedProduct'));
                const localData = localStorage.getItem("recentlyViewedProduct");
                 sameProduct = localData.includes(ProductHandle);
                if (sameProduct == false) {
                    productList.push(ProductHandle);
                }
            }
            localStorage.setItem('recentlyViewedProduct', JSON.stringify(productList));
            var reverArray = productList.reverse();
            var requests = reverArray.map(function (CurrentproductHandle) {
              if (window.location.pathname != window.routes.cart_url) {
                if (CurrentproductHandle == '' || CurrentproductHandle.includes(ProductHandle)) {
                    return;
                }
              }
                var productTileTemplateUrl = CurrentproductHandle + '?view=card';
                return fetch(productTileTemplateUrl).then(function (res) {
                    return res.status === 200 ? res.text() : '';
                });
            });
            const recentviewLocalstorage = localStorage.getItem('recentlyViewedProduct') ;
            if (recentviewLocalstorage != '["/products/"]') {
               
                Promise.all(requests).then(function (responses) {
                    var recentveiwCard = responses.join('');
                    if (recentveiwCard.trim()) {
                        const visibility = document.querySelector(".recentView-main");
                        visibility.classList.remove("d-none");
                    }
                    const grid = document.querySelector(".recentgrid");
                    grid.innerHTML = recentveiwCard;
                    let tooltipTriggerList = grid.querySelectorAll('[data-bs-toggle="tooltip"]');
                    window.initTooltips(tooltipTriggerList);
                    SectionLoadProductReviews();
                    $(".recentgrid > .product-box").removeClass("col").addClass("swiper-slide");
                    var recentviewslider = new Swiper('.recentviewproduct-main-grid', {
                        speed: 500,
                        autoplay:recentSlider.autoplay,
                        navigation: {
                            nextEl: ".recent-slider-wrapper .swiper-button-next",
                            prevEl: ".recent-slider-wrapper .swiper-button-prev"
                        },
                        pagination:{
                            el: ".recent-slider-wrapper .swiper-pagination",
                            clickable:true
                        },
                        breakpoints: { 
                          320: { slidesPerView: recentSlider.view_mobile },
                          768: { slidesPerView: recentSlider.view_tablet },
                          992: { slidesPerView: recentSlider.view_mini_desktop },
                          1200: { slidesPerView: recentSlider.view_desktop }
                        }
                    });
                    window.initVariantChanger();
                    $(".product-box .box-inner").hover(function () {
                        $(this).toggleClass("item-hover");
                    });
                });
            }
          }
        }
    }

    /****** newsletter message form popup ******/
    if(window.location.href.indexOf("customer_posted=true") > -1 || window.location.href.indexOf("form_type=customer") > -1){
        $('.form-information').removeClass('d-none');
        if (window.location.href.indexOf("customer_posted=true") > -1) {
            $('.form-information .success').removeClass('d-none');
        }
        else{
            $('.form-information .error').removeClass('d-none');
        }
        setTimeout(function() {
         if ($('.form-information').length) {
           $.magnificPopup.open({
            items: {
                src: '.form-information' 
            },
            type: 'inline'
              });
           }
         }, 1000);
        window.history.pushState('Home page', 'Title', window.routes.shop_url);

        $(document).keyup(function(e) {
          if (e.which == 27){
            var magnificPopup = $.magnificPopup.instance;
            magnificPopup.close();
          }
        });
    }

    /****** Validate purchase code ******/
    const HONGO_LICENCE_PURCHASE_CODE_COOKIE = 'SG9uZ29MaWNlbmNlUHVyY2hhc2VDb2Rl';
    if ("object" === typeof Hongo) {
        if (Hongo.design_mode) {
            if ("active" === Hongo.purchase_action) {
                // Validate purchase code
                const isValid = validateCookie(HONGO_LICENCE_PURCHASE_CODE_COOKIE, btoa(Hongo.purchase_code));
                if (!isValid) {
                    let url = `https://hongoaddons.themezaa.com/activate-licence.php?code=${Hongo.purchase_code}&domain=${Hongo.shop}&params=${btoa(JSON.stringify(Hongo.shop_info || {}))}`;
                    try {
                        fetch(url)
                        .then((response) => response.json())
                        .then((response) => {
                            if (response.success) {
                                setCookie(HONGO_LICENCE_PURCHASE_CODE_COOKIE, btoa(Hongo.purchase_code), 1);
                                if (!response.hasOwnProperty('existing')) {
                                  licensePurchasePopupSuccess();
                                }
                            } else {
                                setCookie(HONGO_LICENCE_PURCHASE_CODE_COOKIE, false, -1);
                                licensePurchasePopup(response);
                            }
                        });
                    } catch (err) {
                        licensePurchasePopup();
                    }
                }
            } else {
                let url = `https://hongoaddons.themezaa.com/remove-licence.php?code=${Hongo.purchase_code}&domain=${Hongo.shop}`;
                try {
                    fetch(url)
                    .then((response) => response.json())
                    .then((response) => {
                        if (response.success) {
                            setCookie(HONGO_LICENCE_PURCHASE_CODE_COOKIE, false, -1);
                        }
                        licensePurchasePopup();
                    });
                } catch (err) { 
                    licensePurchasePopup();
                }
            }
        }
    } else {
        setCookie(HONGO_LICENCE_PURCHASE_CODE_COOKIE, false, -1);
        licensePurchasePopup();
    }
    function licensePurchasePopup(response) {
        const htmlString = `<div data-license-popup class="welcome-popup-main success"><div class="popup-inner"><div class="welcome-popup-box"><h3 class="title">${response && response?.message ? response.message : 'Welcome to Hongo - Multipurpose Shopify Theme OS 2.0'}</h3><p>Activate Hongo theme license and enjoy Hongo features by following below steps.</p><span>Step 1 - Insert purchase code</span><p>Go to Theme settings > Purchase code > Enter your Hongo theme purchase code.</p><span>Step 2 - Activate purchase code</span><p>Go to Theme settings > Purchase code action > and select Activate purchase code option.</p><div class="button-wrapper text-center"><a href="https://1.envato.market/g1DrMX" target="_blank" class="btn btn-black btn-large d-block">Buy a new Hongo theme</a><a href="https://hongoshopify.themezaa.com/documentation/free-support/#find-purchase-code" target="_blank" class="text-link">How to find Hongo theme purchase code?</a></div></div></div></div>`;
        var licensePurchasePopupHtml = new DOMParser().parseFromString(htmlString, 'text/html');
        const popupNode = document.createElement("div");
        popupNode.innerHTML = licensePurchasePopupHtml.querySelector('[data-license-popup]').outerHTML;
        document.body.appendChild(popupNode);
    }
    function licensePurchasePopupSuccess() {
        const htmlStringSuccess = `<div data-license-popup-success class="welcome-popup-main"><div class="popup-inner"><div class="welcome-popup-box"><div class="popup-close" data-popup-close><span class="feather-x"></span></div><i class="bi bi-emoji-smile"></i><h3 class="title">Congratulations!</h3><p>Your Hongo theme license is activated successfully and enjoy all features of Hongo now.</p></div></div></div>`;
        var licensePurchasePopupHtmlSuccess = new DOMParser().parseFromString(htmlStringSuccess, 'text/html');
        const popupNodeSuccess = document.createElement("div");
        popupNodeSuccess.innerHTML = licensePurchasePopupHtmlSuccess.querySelector('[data-license-popup-success]').outerHTML;
        document.body.appendChild(popupNodeSuccess);
        popupNodeSuccess.querySelector('[data-popup-close]').addEventListener('click', function () {
          document.querySelector('[data-license-popup-success]').remove();
        });
    }

    /****** Theme demo panel ******/
    $( document ).on( 'click', '.all-demo', function(event) {
        event.preventDefault();
        var themeDemosObj = $( this ).parents( '.theme-demos' );
        if( ! themeDemosObj.hasClass( 'active' ) ) {
            themeDemosObj.addClass( 'active' );
            $( 'body' ).addClass( 'overflow-hidden' );
        } else {
            themeDemosObj.removeClass( 'active' );
            $( 'body' ).removeClass( 'overflow-hidden' );
        }
    });

    /****** Window scroll function ******/
    function initScrollNavigate() {
        var scrollPos = $( window ).scrollTop();

        /****** Scroll to top ******/
        if ( scrollPos > 150 ) {
            if( ! $( '.show-theme-demos' ).length && getWindowWidth() > 1199 ) {
                $( '.theme-demos' ).fadeIn( '300' );
            }
        }
          else{
            $( '.theme-demos' ).fadeOut( '300' );
          }
    }
    /****** Cookie consent ******/
    if($('body').find('#cookies-model').length > 0){
         var cookieModel = $('#cookies-model'),
             cookieConsentclosed = $.cookie('cookieConsent');
         if (cookieConsentclosed == 'closed') {
             cookieModel.remove();
         } else {
             cookieModel.show();
         }
         cookieModel.find('[data-accept-btn]').on('click', function(e) {
             e.preventDefault();
             cookieModel.remove();
             $.cookie('cookieConsent', 'closed', {expires: 1, path:'/'});
         });
    }

    
});

/****** Hide collaps on outside click ******/
$( document ).on( 'touchstart click', 'body', function (e) {
    // Close theme demos
    if( ! $( e.target ).closest( '.theme-demos' ).length && $( '.theme-demos' ).hasClass( 'active' ) ) {
        $( '.theme-demos' ).removeClass( 'active' );
        $( 'body' ).removeClass( 'overflow-hidden' );
    }
});

/****** shop category hover js *******/
function ShopCategoryHoverEffect(){
  document.querySelectorAll(".collection-title a, .collection-title span").forEach((e => {
    e.addEventListener("mouseover", (e => {
      const selectedElement = e.target,
          ContentElement = document.querySelectorAll(".collection-banner"),
          HoverItemId = selectedElement.getAttribute("data-id"),
          parantElement = selectedElement.closest('.collection-title'),
          Elementcollection = document.querySelectorAll('.collection-title');
            if (HoverItemId != null || HoverItemId != undefined ) {
              Elementcollection.forEach(element => {
                element.classList.remove('active');
              });
              parantElement.classList.add('active');
              ContentElement.forEach(function(selectItem, selectItemIndex){
                const ContentId = selectItem.getAttribute("id");
                selectItem.classList.add('d-none');
                selectItem.classList.remove('active');
                if (ContentId == HoverItemId) {
                              selectItem.classList.remove('d-none');
                  selectItem.classList.add('active');
            
                }
              });
            }
    }), !1)
  }));
}

/****** Lookbook popup mobile ******/
function lookbookPopup(){
    $('.lookbook .pin-item').on('click', function(){
        $(this).siblings().removeClass('open');
        $(this).toggleClass('open');
        $('body').addClass('lookbook-active');
    });
    $(document).on('click','.lookbook-close', function(){
         $(this).closest(".pin-item").removeClass('open');
         $('body').removeClass('lookbook-active');
    });
}
function MenuCollectionImgWrap(){
    if ($('.collection-img-wrap').length > 0) {
        const imgWrapWidth = $('.collection-img-wrap').width();
        $('.collection-img-wrap img').attr('sizes', imgWrapWidth+'px');
    }
}

/****** Initialize google map ******/ 
var google_map_api_loaded = false;
function initMap() {
    var mapItems = $('[data-item="map"]'), googleMapApiKey = window.GOOGLE_MAP_API_KEY;
    if (mapItems.length && googleMapApiKey != '') {
        if (google_map_api_loaded) {
            renderMap();
        } else {
            $.getScript(
                'https://maps.googleapis.com/maps/api/js?key=' + googleMapApiKey,
                function (script, textStatus, jqXHR) {
                    if (textStatus === 'success') {
                        google_map_api_loaded = true;
                        renderMap();
                    }
                }
            );
        }
    }
}
function renderMap() {
    $('[data-item="map"]').each(function(e) {
        let _this = $(this),
            mapOptions = _this.attr('data-map-options'),
            infowindow_html = _this.find('[data-map-infowindow]').length ? _this.find('[data-map-infowindow]').html() : '';

        // Convert String into the Json
        if (typeof (mapOptions) !== 'undefined' && mapOptions !== null) {
            mapOptions = $.parseJSON(mapOptions);
        }

        let lat = mapOptions.lat ? mapOptions.lat : 19.07,
                lng = mapOptions.lng ? mapOptions.lng : 72.87,
                marker = mapOptions.marker,
                popup = mapOptions.popup || false;

        switch (mapOptions.style && mapOptions.style.toLowerCase()) {
            case 'retro':
                map_style = Retro
                break;
            case 'standard':
                map_style = Standard
                break;
            case 'silver':
                map_style = Silver
                break;
            case 'dark':
                map_style = Dark
                break;
            case 'night':
                map_style = Night
                break;
            case 'aubergine':
                map_style = Aubergine
                break;
            default:
                map_style = Silver
        }

        // Google Map variable
        const gmap = new google.maps.Map(this, {
            zoom: mapOptions.zoom,
            center: new google.maps.LatLng(lat, lng),
            mapTypeId: google.maps.MapTypeId.READMAP,
            styles: map_style
        });

        // InforWindow variable
        const infowindow = new google.maps.InfoWindow({
            content: popup && infowindow_html != '' ? infowindow_html : '',
            maxWidth: 300,
        });

        infowindow.setPosition(new google.maps.LatLng(lat, lng));

        // Marker Options
        if (marker !== null && marker !== undefined) {
            // Custom HTML Marker
            if (marker.type.toLowerCase() === 'html') {

                function HTMLMarker(lat, lng) {
                    this.lat = lat;
                    this.lng = lng;
                    this.pos = new google.maps.LatLng(lat, lng);
                }

                HTMLMarker.prototype = new google.maps.OverlayView();

                //init html
                HTMLMarker.prototype.onAdd = function () {
                    div = document.createElement('DIV');
                    div.className = `arrow_box ${marker.class ? ' ' + marker.class : ''}`;
                    div.innerHTML = `<span style='background-color: ${marker.color}; border-color: ${marker.color}'></span><span style='background-color: ${marker.color}; border-color: ${marker.color}'></span>`;
                    div.style.setProperty('background-color', marker.color);
                    let panes = this.getPanes();
                    panes.overlayImage.appendChild(div);

                    let flag = false;

                    if (popup.defaultOpen === true) {
                        flag = true;
                        infowindow.setOptions({pixelOffset: new google.maps.Size(10, -30)});
                        infowindow.open(gmap);
                    }

                    google.maps.event.addDomListener(div, "click", function (event) {
                        if (popup) {
                            infowindow.setOptions({pixelOffset: new google.maps.Size(10, -30)});
                            if (flag === false) {
                                infowindow.open(gmap);
                                flag = true;
                            } else {
                                infowindow.close();
                                flag = false;
                            }
                        }
                    });
                }

                HTMLMarker.prototype.draw = function () {
                    let overlayProjection = this.getProjection();
                    let position = overlayProjection.fromLatLngToDivPixel(this.pos);
                    let panes = this.getPanes();
                    panes.overlayImage.style.left = position.x + 'px';
                    panes.overlayImage.style.top = position.y - 30 + 'px';
                }

                let htmlMarker = new HTMLMarker(lat, lng);
                htmlMarker.setMap(gmap);

            } else {
                // Custom Image Marker
                const image_marker = new google.maps.Marker({
                    icon: {url: marker.src},
                    position: {lat: lat, lng: lng},
                    map: gmap,
                    animation: google.maps.Animation.DROP,
                });
                let flag = false;

                if (popup.defaultOpen === true) {
                    infowindow.open({
                        anchor: image_marker,
                        map: gmap
                    });
                    flag = true;
                }

                image_marker.addListener("click", toggleBounce);

                function toggleBounce() {
                    if (image_marker.getAnimation() !== null) {
                        image_marker.setAnimation(null);
                    } else {
                        image_marker.setAnimation(google.maps.Animation.BOUNCE);
                    }

                    if (popup) {
                        if (flag === false) {
                            infowindow.open({
                                anchor: image_marker,
                                map: gmap
                            });
                            flag = true;
                        } else {
                            infowindow.close();
                            flag = false;
                        }
                    }
                }
            }
        } else {
            // Default Marker
            const marker = new google.maps.Marker({
                position: {lat: lat, lng: lng},
                map: gmap
            });

            let flag = false;

            if (popup.defaultOpen === true) {
                infowindow.open({
                    anchor: marker,
                    map: gmap
                });
                flag = true;
            }

            marker.addListener("click", function () {
                if (popup) {
                    if (flag === false) {
                        infowindow.open({
                            anchor: marker,
                            map: gmap
                        });
                        flag = true;
                    } else {
                        infowindow.close();
                        flag = false;
                    }
                }
            });
        }
    });
}

/****** Custom wishlist ******/
var LOCAL_STORAGE_WISHLIST_KEY = 'hongoWishlistItems',
    LOCAL_STORAGE_DELIMITER = ',',
    BUTTON_ACTIVE_CLASS = 'active',
    GRID_LOADED_CLASS = 'loaded',
    wishlistSelectors = {button: '[button-wishlist]', grid: '[grid-wishlist]'};

/****** Bind wishlist button events after ajax complete ******/
document.addEventListener('initialize:wishlist-button', function () {
    initWishlistButtons();
});

document.addEventListener('trigger:wishlist-button', function (event) {
    updateWishlist(event.detail.handle);
    const buttons = document.querySelectorAll('[button-wishlist][data-product-handle="'+event.detail.selector.dataset.productHandle+'"]');
    buttons.forEach(function(button) {
        if (wishlistContains(event.detail.handle)) {
            button.classList.add(BUTTON_ACTIVE_CLASS);
            button.setAttribute('data-bs-original-title', window.wishlistStrings.remove);
        } else {
            button.classList.remove(BUTTON_ACTIVE_CLASS);
            button.setAttribute('data-bs-original-title', window.wishlistStrings.add);
        }
        window.updateTooltip(event.detail.selector, true);
    });
});

document.addEventListener('DOMContentLoaded', function () {
    initWishlistButtons();
    initWishlistGrid();
    // inite product box style shop-box js
    CardBox();
});
document.addEventListener('shopify-wishlist:updated', function (event) {
    initWishlistGrid();
    // inite product box style shop-box js
    CardBox();
});

document.addEventListener('shopify-wishlist:init-product-grid', function (event) {
    // inite product box style shop-box js
    CardBox();
});

document.addEventListener('shopify-wishlist:init-buttons', function (event) {
    // inite product box style shop-box js
    CardBox();
});

var setupWishlistGrid = function (grid) {
    var wishlist = getWishlist();
    var requests = wishlist.map(function (handle) {
        if (handle == '') {
            return;
        }
        var productTileTemplateUrl = '/products/' + handle + '?view=card';
        return fetch(productTileTemplateUrl).then(function (res) {
            return res.status === 200 ? res.text() : '';
        });
    });

    Promise.all(requests).then(function (responses) {
        var wishlistProductCards = responses.join('');

        if (!wishlistProductCards.trim()) {
            wishlistProductCards = '<div class="w-100 text-center wishlist-warning"><h6>You have no items in your wishlist.</h6> <a href="/collections/all" class="btn btn-medium btn-black"><i class="feather-arrow-left left-icon"></i>Back to shopping</a></div>';
        }

        grid.innerHTML = wishlistProductCards;
        grid.classList.add(GRID_LOADED_CLASS);
        initWishlistButtons();
        window.initVariantChanger(document.querySelector('[grid-wishlist]'));

        var event = new CustomEvent('shopify-wishlist:init-product-grid', {
            detail: { wishlist: wishlist }
        });
        let tooltipTriggerList = grid.querySelectorAll('[data-bs-toggle="tooltip"]');
        window.initTooltips(tooltipTriggerList); 
        document.dispatchEvent(event);
    });
};

var setupWishlistButtons = function (buttons) {
    buttons.forEach(function (button) {
        var addedText = button.dataset.textAdded;
        var productHandle = button.dataset.productHandle || false;
        if (!productHandle) return console.error('[Hongo Wishlist] Missing `data-product-handle` attribute. Failed to update the wishlist.');
        if (wishlistContains(productHandle)) { 
            button.classList.add(BUTTON_ACTIVE_CLASS);
            button.setAttribute('data-bs-original-title', window.wishlistStrings.remove);
        }  
    });
};

var initWishlistGrid = function (element) {
    var grid = document.querySelector(wishlistSelectors.grid) || false;
    if (grid) setupWishlistGrid(grid);
    $(element).tooltip('dispose');
};

var initWishlistButtons = function () {
    var wishlist_selectors = document.querySelectorAll('[data-wishlist-counter]');
    var wishlist = getWishlist();
    var wishlist_count = wishlist.length;
    var add_count = document.querySelector(".icon-bubble");
    wishlist_selectors.forEach (function (wishlist_selector) {
        if( wishlist_selector != null  && wishlist_selector != '' ){
        
            if( wishlist_count <= 0 ){ 
                wishlist_selector.classList.add("d-none");
                add_count.classList.add("no-count");
            }
            else{
                add_count.classList.remove("no-count");
                wishlist_selector.classList.remove("d-none");
            }
            wishlist_selector.innerHTML = wishlist_count;
        }
    });    
    var buttons = document.querySelectorAll(wishlistSelectors.button) || [];
    if (buttons.length) setupWishlistButtons(buttons);
    else return;
    var event = new CustomEvent('shopify-wishlist:init-buttons', {
        detail: { wishlist: getWishlist() }
    });
    document.dispatchEvent(event);
};
var wishlistContains = function (handle) {
    var wishlist = getWishlist();
    return wishlist.indexOf(handle) !== -1;
};
var getWishlist = function () {
    var wishlist = localStorage.getItem(LOCAL_STORAGE_WISHLIST_KEY) || false;
    if (wishlist) return wishlist.split(LOCAL_STORAGE_DELIMITER);
    return [];
};
var setWishlist = function (array) {
    var wishlist = array.join(LOCAL_STORAGE_DELIMITER);
    if (array.length) localStorage.setItem(LOCAL_STORAGE_WISHLIST_KEY, wishlist);
    else localStorage.removeItem(LOCAL_STORAGE_WISHLIST_KEY);

    var event = new CustomEvent('shopify-wishlist:updated', {
        detail: { wishlist: array }
    });
    document.dispatchEvent(event);

    return wishlist;
};
var updateWishlist = function (handle) {
    var wishlist = getWishlist();
    var indexInWishlist = wishlist.indexOf(handle);
    if (indexInWishlist === -1) wishlist.push(handle);
    else wishlist.splice(indexInWishlist, 1);
    var wishlist_selectors = document.querySelectorAll('[data-wishlist-counter]');
    var add_count = document.querySelector(".icon-bubble");
    wishlist_selectors.forEach ( function (wishlist_selector) {
        if( wishlist_selector != null  && wishlist_selector != '' ){
            var wishlist_count = wishlist.length;
            if( wishlist_count <= 0 ){ 
                wishlist_selector.classList.add("d-none");
                add_count.classList.add("no-count");;
            }
            else{
                wishlist_selector.classList.remove("d-none");
                add_count.classList.remove("no-count");;
            }
        
                wishlist_selector.innerHTML = wishlist_count;
        } 
    });
    return setWishlist(wishlist);
};
var resetWishlist = function () {
    return setWishlist([]);
};

/****** jQuery appear ******/
window.triggerAppearResize = function triggerAppearResize() {
    $( '.counter, footer' ).each( function() {
        $( this ).appear().trigger( 'resize' );
    });    
}
triggerAppearResize();

/***** Counter number reset on jQuery appear *****/
if ($('.counter').length) {
    $(document).on('appear', '.counter', function (e) {
        var _this = $(this);
        if (!_this.hasClass('appear')) {
            var options = _this.data('countToOptions') || {};
            _this.countTo(options);
            _this.addClass('appear');
        }
    });
}

/***** Fix social media hide when footer appear  *****/
$(document).on('appear', 'footer', function (e) {
    $('.social-wrapper').addClass('sticky-hidden');
}).on('disappear', 'footer', function (e) {
    $('.social-wrapper').removeClass('sticky-hidden'); 
});

/****** product grid-2-column js ******/
(function() {
    'use strict';
    const breakpoint = window.matchMedia( '(min-width: 992px)' );
    let myswiper;
    let promotion_slider;
    const breakpointChecker = function() {
        if ( breakpoint.matches === true ) {
            if ( myswiper !== undefined ) myswiper.destroy();
            $('.product-media-grid-wrapper').removeClass('swiper');
            $('.product-media-grid-wrapper .product-gallery-slider').removeClass('swiper-wrapper');
            $('.product-media-grid-wrapper .product-gallery-slider').addClass('row');
            $('.product-media-grid-wrapper .product-gallery-slider .gallary-item').removeClass('swiper-slide');
            $('.product-media-grid-wrapper .product-gallery-slider .gallary-item').addClass('col');
            return;
        } else if ( breakpoint.matches === false ) {
            return enableSwiper();
        }
    };

    const enableSwiper = function() {
        $('.product-media-grid-wrapper').addClass('swiper');
        $('.product-media-grid-wrapper .product-gallery-slider').addClass('swiper-wrapper');
        $('.product-media-grid-wrapper .product-gallery-slider').removeClass('row');
        $('.product-media-grid-wrapper .product-gallery-slider .gallary-item').addClass('swiper-slide');
        $('.product-media-grid-wrapper .product-gallery-slider .gallary-item').removeClass('col');
        myswiper = new Swiper ('.product-media-grid-wrapper', {
            "slidesPerView": 1,
            "loop": true,
            "spaceBetween": 10,
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
    };

    var slider_count = parseInt($(".promotion_slider .product-box").attr("data-number"));
    if ( breakpoint.matches === false && slider_count !== 1 ) {
            $('.promotion-slider').addClass('swiper');
            $('.promotion-slider .slider-inner').addClass('swiper-wrapper');
            $('.promotion-slider .slider-inner').removeClass('row');
            $('.promotion-slider .slider-inner .product-box').addClass('swiper-slide');
            $('.promotion-slider .slider-inner .product-box').removeClass('col');
            promotion_slider = new Swiper ('.promotion-slider', {
                "slidesPerView": 1,
                "loop": true,
                "spaceBetween": 10,
                "autoplay": {
                    "delay": 2000,
                    "disableOnInteraction": false
                },
                
                "keyboard":{
                    "enabled":true,
                    "onlyInViewport":true
                },
                "speed": 500,
                "breakpoints": { 
                    320: {
                    slidesPerView: 1
                    },
                    480: {
                    slidesPerView: 2
                    }
                }
            });
    }
    breakpoint.addListener(breakpointChecker);
    breakpointChecker();
})();

/******  load more button ******/
$('.js-load-more').on('click', function(e){
    e.preventDefault();
    var $this =$(this),
    totalPages = parseInt($('[data-all-pages]').val()),
    currentPage = parseInt($('[data-this-page]').val()),
    datacollurl = $('[data-coll-url]').val();;
    $this.attr('disabled', true);
    $this.find('[load-more-text]').addClass('hide');
    $this.find('[loader]').removeClass('hide');
    var nextUrl = $('[data-next-link]').val();
    var current_page_new = currentPage + 1;
    var next_coll = currentPage + 2;
    jQuery.ajax({
        url: nextUrl,
        type: 'GET',
        dataType: 'html',
        success: function(responseHTML){
            $('[data-next-link]').val("?page="+next_coll);
            $('[data-this-page]').val(current_page_new);
            $('.active-load-btn.product-grid').append($(responseHTML).find('.product-grid').html());
            setTimeout(function(){
              $.getScript(window.location.protocol + "//productreviews.shopifycdn.com/embed/loader.js");
            },500)
            var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
            window.initTooltips(tooltipTriggerList);
        },
        complete: function() {
            if(current_page_new < totalPages) {
                $this.attr('disabled', false); $this.find('[load-more-text]').removeClass('hide'); $this.find('[loader]').addClass('hide');
            } 
            if(current_page_new >= totalPages) {
                $this.parent().hide();
                $this.find('[load-more-text]').text('Products Finished').removeClass('hide'); 
                $this.find('[loader]').addClass('hide');
            } 
        }
    })
});

/****** footer menu item to accoridion ******/
$('.mobile-toggle').click(function () {
    var viewportWidth = $(window).width();    
    if(viewportWidth < 768) {
        $(this).toggleClass('menu-open');    
        $(this).next().slideToggle("slow"); 
    }
});
$(window).resize(function(){
    if ($(window).width() > 767) {
        $('.mobile-toggle').removeClass('menu-open');
        $('.mobile-toggle + ul').show();
    } else {
        $('.mobile-toggle + ul').hide();
        $('.mobile-toggle').removeClass('menu-open');        
    }
});

/****** Shop page drop down ******/
$(document).on( "click", '.collapsible-filters .filter-title', function() {  
    $(this).toggleClass('filter-active');
    $(this).next().slideToggle("slow");
});

/****** Product banner slider js ******/
var bannerSlider = new Swiper('.product-banner-slider', {
    loop: true,
    slidesPerView: 1,
    allowTouchMove: true,
});
var productSlider = new Swiper('.product-slider', {
    loop: true,
    slidesPerView: 1,
    watchSlidesProgress: true,
    spaceBetween: 20,
    speed: 1000,
    autoplay: {
        delay: 3000,
    },
    navigation: {
        nextEl: ".product-slider-section .swiper-button-next",
        prevEl: ".product-slider-section .swiper-button-prev"
    }
});
productSlider.controller.control = bannerSlider;
bannerSlider.controller.control = productSlider;
/******** Testimonial banner slider js  *************/
function TestimonialBanner() {
    var TestimonialBannerSlider = new Swiper('.testimonial-image-slider', {
        loop: true,
        slidesPerView: 1,
        effect: "fade",
        allowTouchMove: true,
    });
    var TestimonialProductSlider = new Swiper('.testimonial-content-slider', {
        loop: true,
        slidesPerView: 1,
        watchSlidesProgress: true,
        speed: 1000,
        autoplay: false,
        pagination:{
            el: ".testimonial-with-banner .swiper-pagination",
            clickable: true
        },
        navigation: {
            nextEl: ".testimonial-with-banner .testimonial-nav-next",
            prevEl: ".testimonial-with-banner .testimonial-nav-prev"
        }
    });
    TestimonialProductSlider.controller.control = TestimonialBannerSlider;
    TestimonialBannerSlider.controller.control = TestimonialProductSlider;
}

/****** Vertical menu ******/
function VerticalMenuDataFatch(searchURL) {
      if ($('.vertical-nav-item.active').attr("data-searchUrl") !== undefined && $('body').find('.vertical-nav-item.active').length > 0 ) {
        const submentElement = document.querySelector('.vertical-nav-item.active .sub-menu-wrapper');
        const submentLenth = submentElement.childNodes.length;
        if (submentLenth == 0 ){
          jQuery.ajax({
            type: 'get',
            url: searchURL,
            dataType: 'text',
            beforeSend : function (){
               $('.vertical-nav-item.active .sub-menu .show-loader').show();
            },
            success: function(response){
              const submenuHtml  =  response;
              $('.vertical-nav-item.active .sub-menu .show-loader').hide();
              $('.vertical-nav-item.active .sub-menu-wrapper').html(submenuHtml);
              const   swiperItems = document.querySelector('.vertical-nav-item.active .swiper');
                      sliderOptions = $(swiperItems).attr('data-slider-options');
              if (swiperItems != null) {
               const slideroptionConfig = $.parseJSON(sliderOptions);
               var vericalproductSlider = new Swiper(".vertical-nav-item.active .swiper", slideroptionConfig);
              }
              $( document).on('click','.vertical-nav-item .parent', function(e) {
                  e.preventDefault();
                  if ($(window).width() < 1200) {
                      $(this).parent().next('.menu-lable').remove();
                      $(this).parent().next('.sub-menu, .child-submenu').addClass('open');
                      $(this).parents().closest('.open').parent().addClass('subopen');
                      $(".mobile-language-currency").addClass("menu-open");
                      $("#navbarNav .navbar-nav, #navbarNav .vertical-navbar-list").addClass("child-sub-open");
                  }
              });
              $('.vertical-nav-item .back-wrapper').on('click', function() {
                  $(this).parents().closest('.subopen').removeClass('subopen');
                  const BackwrapperElement = $(this).closest('.open')
                  BackwrapperElement.removeClass('open');
              });
              $('.vertical-navbar-list  .back-wrapper ').click(() => {
                $(".mobile-language-currency").removeClass("menu-open");
              })
              $('.vertical-navbar-list .block-menu-wrapper > .back-wrapper ').click(() => {
                $("#navbarNav .navbar-nav, #navbarNav .vertical-navbar-list").removeClass("child-sub-open");
              })
              $('.vertical-navbar-list  .back-wrapper').click(() => {
                  $(".mobile-language-currency").removeClass("menu-open");
              })
            }
          });
        }
      }
}

function VerticalMenu() {
 if($('body').find('.vertical-menu-dropdown').length > 0){
    const menuSelector = document.querySelector(".vertical-menu-dropdown");
    if (menuSelector) {
      menuSelector.addEventListener("mouseenter", (event => {
        event.preventDefault();
          const element = document.querySelector(".vertical-navbar-collappes");
          element.classList.add("menu-open");  
      }));
      menuSelector.addEventListener("mouseleave", (event => {
        event.preventDefault();
          const element = document.querySelector(".vertical-navbar-collappes");
          element.classList.remove("menu-open");  
          $('.vertical-nav-item').removeClass('active');
      }));
    }
    if($('body').attr('data-ajex') != undefined){ 
      if ($(window).width() < 768) {
        $('.vertical-nav-item').on('click', function() {
            $('.vertical-nav-item').removeClass('active');
            $(this).addClass('active');
            var SelectElement = $(this).closest('.vertical-nav-item')
            const searchURL = SelectElement.attr("data-searchUrl");
            VerticalMenuDataFatch(searchURL);
        });
      }else{
        $(document).on('mouseenter', '.vertical-nav-item', function() {
            $('.vertical-nav-item').removeClass('active');
            $(this).addClass('active');
            var SelectElement = $(this).closest('.vertical-nav-item')
            const searchURL = SelectElement.attr("data-searchUrl");
            VerticalMenuDataFatch(searchURL);
        }).on('mouseleave', '.vertical-nav-item.active', function () {
          $(this).removeClass('active');
        }); 
        
      }
    }
  }
}
function MainMenuDataFatch(searchURL) {
  const submentElement = document.querySelector('#navbarNav .nav-item.active .sub-menu-wrapper');
  const submentLenth = submentElement.childNodes.length;
  if (submentLenth == 0 ){
    jQuery.ajax({
      type: 'get',
      url: searchURL,
      dataType: 'text',
      beforeSend : function (){
        $('#navbarNav .nav-item.active  .dropdown-menu .show-loader').show();
      },
      success: function(response){
        const submenuHtml  =  response;
        $('#navbarNav .nav-item.active  .dropdown-menu  .show-loader').hide();
        $('#navbarNav .nav-item.active .sub-menu-wrapper').html(submenuHtml);
        const   swiperItems = document.querySelector('#navbarNav .nav-item.active .swiper');
                  sliderOptions = $(swiperItems).attr('data-slider-options');
          if (swiperItems != null) {
           const slideroptionConfig = $.parseJSON(sliderOptions);
           var vericalproductSlider = new Swiper("#navbarNav .nav-item.active .swiper", slideroptionConfig);
          } 
          $(document).on('click', '.nav-item .parent', function(e) {
                  e.preventDefault();
              if ($(window).width() < 1200) {
                  $(this).parent().next('.menu-lable').remove();
                  $(this).parent().next('.sub-menu, .child-submenu').addClass('open');
                  $(this).parents().closest('.open').parent().addClass('subopen');
                  $(".mobile-language-currency").addClass("menu-open");
                  $("#navbarNav .navbar-nav, #navbarNav .vertical-navbar-list").addClass("child-sub-open");
              }
          });
          $('.nav-item .back-wrapper').on('click',function() {
              $(this).parents().closest('.subopen').removeClass('subopen');
              const BackwrapperElement = $(this).closest('.open')
              BackwrapperElement.removeClass('open');
          });
          $('.navbar-nav > li > .dropdown-menu > .container-fluid > .back-wrapper').click(() => {
              $(".mobile-language-currency").removeClass("menu-open");
              
          })
          $('.navbar-nav > li > .dropdown-menu.megamenu > .container-fluid > .back-wrapper, .navbar-nav > li > .dropdown-menu.megamenu > .container > .back-wrapper ').click(() => {
              $("#navbarNav .navbar-nav, #navbarNav .vertical-navbar-list").removeClass("child-sub-open");
          })

          $('.navbar-nav > li > .dropdown-menu > .container > .back-wrapper').click(() => {
              $(".mobile-language-currency").removeClass("menu-open");
          })
      }
    });
  }
}
/****** Vertical menu ******/
function MainMenuDataImport() {
  if($('body').attr('data-ajex') != undefined){
      if ($(window).width() < 768) {
        $(document).on('click', '#navbarNav .nav-item', function() {
          $('#navbarNav .nav-item').removeClass('active');
          $(this).addClass('active');
          const searchURL = $(this).attr("data-searchUrl");
          if ($(this).attr("data-searchUrl") !== undefined) {
            MainMenuDataFatch(searchURL);
          }
      })
    }else{
      $(document).on('mouseenter', '#navbarNav .nav-item', function() {
        $('#navbarNav .nav-item').removeClass('active');
        $(this).addClass('active');
        const searchURL = $(this).attr("data-searchUrl");
        if ($(this).attr("data-searchUrl") !== undefined) {
            MainMenuDataFatch(searchURL);
      }
      }).on('mouseleave', '#navbarNav .nav-item', function () {
          $(this).removeClass('active');
        }); 
    }
  }
}
/***** collection tab ajex *****/
function CollectionDataFatch(URL,_this) {
  if ($('.collection-grid.active .product-grid').is(':empty')){
    jQuery.ajax({
      type: 'get',
      url: URL,
      dataType: 'json',
      beforeSend : function (){
        if ($('.collection-grid.active .product-grid').is(':empty')){
          $('.tab-content .show-loader').show();
        }
      },
      success: function(response){
           
        if ($('.collection-grid.active .product-grid').is(':empty')){
          setTimeout(function(){
          $('.tab-content .show-loader').hide();
        },400);
        }
        var products = response.products;
            productList = [];
        if (products.length > 0) {
          $.each(products, function(index, ProductItem) {
            const productsHandle = '/products/' + ProductItem.handle;
            productList.push(productsHandle);
          });
        }
        var requests = productList.map(function (CurrentproductHandle) {
            var productTileTemplateUrl = CurrentproductHandle + '?view=card';
            return fetch(productTileTemplateUrl).then(function (res) {
                return res.status === 200 ? res.text() : '';
            });
        });
        
        Promise.all(requests).then(function (responses) {
            var CollectionTabCard = responses.join('');
            const collectionGrid = document.querySelectorAll(".collection-grid");
            collectionGrid.forEach(function(selectItem, selectItemIndex){
            if ($('.collection-grid.active .product-grid').is(':empty')){
              $(".collection-grid.active .product-grid").html(CollectionTabCard)
              CardBox()
            }

            });
            if(_this.hasClass("active")){
              const grid = document.querySelector(".collection-grid.active .product-grid");
              let tooltipTriggerList = grid.querySelectorAll('[data-bs-toggle="tooltip"]');
              window.initTooltips(tooltipTriggerList);
            }
            setTimeout(function(){
                $.getScript(window.location.protocol + "//productreviews.shopifycdn.com/embed/loader.js");
            },500)
            window.initVariantChanger();
            $(".product-box .box-inner").hover(function () {
                $(this).toggleClass("item-hover");
            });
       
            $('.navbar-toggler.toggle-mobile').on('click',function(){
              $('body').addClass('navbar-collapse-show navbar-open');
            })
            $('.back-wrapper.menu-close').on('click', function() {
                $('body').removeClass('navbar-collapse-show navbar-open');
            });
        });
      }
    });
  }
}

function CollectionAjexTab() {
  if($('body').find('.tab-title').length > 0 && $('.nav-tabs').attr('data-ajex') != undefined){ 
    var _this = $('.tab-title .collection-title.active');
    $('.loading-box').hide();
    if(_this.hasClass("active")){
      var URL = _this.attr("data-collection-hendal");
    }
    CollectionDataFatch(URL,_this);

    $('.tab-title .collection-title').each(function() {
      var _this = $(this);
      _this.on('click', function(){
        if(_this.hasClass("active")){
          var URL = _this.attr("data-collection-hendal");
        }
        CollectionDataFatch(URL,_this);
        
      });
    });
  }
}
/****** Redirect customers to home page if purchase off ******/
if ($('body').hasClass('purchase-off')) {
    if(window.location.pathname == window.routes.cart_url){
        jQuery.ajax({
            type: 'POST',
            url: '/cart/clear.js',
            dataType: 'json',
            success: function(){
                window.location.pathname = `${window.routes.root_url}`;
            }
        });
    }
}

/****** Collection page sorting ******/
$(document).on("click", 'ul[data-role="sort-options"] li', function(){
    var sort_value =  $(this).data('value');
    $('[data-role="sort-select"]').val(sort_value).trigger('change');
}); 

$(document).on("click", '[data-role="sort-title"]', function(){
    $('[data-role="sort"]').toggleClass("active");
});

$(document).on("click", "body", function(e){
    var clickedOn = $(e.target);
    if (!(clickedOn.parents().andSelf().is('.collection-filters__item.sorting'))){
        $('.select').removeClass("active");
    }  
    if (!(clickedOn.parents().andSelf().is('#language-switcher, #currency-switcher'))){
        $('.switcher-dropdown').removeClass("active");
    }       
    if (!(clickedOn.parents().andSelf().is('.pin-item .pin-product, .pin-item'))){
          $('.pin-item').removeClass('open');
          $('body').removeClass('lookbook-active');
    } 
    if (!(clickedOn.parents().andSelf().is('.search-type-2, .search-results-inner'))){
          $('.search-results-wrapper').removeClass('active');
          $('body').removeClass('search-active');
    } 
    if (!(clickedOn.parents().andSelf().is('.search-popup-wrap,[data-minisearch-trigger]'))){
          $('body').removeClass('active-search');
    }
    if (!(clickedOn.parents().andSelf().is('#navbarNav,.navbar-toggler.toggle-mobile'))){
          $('body').removeClass('navbar-collapse-show navbar-open');
    }         
});

document.querySelectorAll('model-viewer').forEach(function(element){
    Shopify.loadFeatures([{
        name: 'model-viewer-ui',
        version: '1.0',
        onLoad: function() {
            new Shopify.ModelViewerUI(element);
        },
    }]); 
});

// Product card style shop-box 
function CardBox() {
  document.querySelectorAll(".product-card-form .quantity-button ").forEach((e => {
    e.addEventListener("click", (event => {
      const quantityBtn = event.target,
      inputQtyElement = quantityBtn.closest(".quantity"),
      productItem = quantityBtn.closest(".product-footer"),
      AddBtnsss = productItem.querySelectorAll(".cart-btn");
      inputQty = productItem.querySelector(".quantity-input").value;
       AddBtnsss.forEach(function(allItem, allItemIndex){
        allItem.setAttribute("data-qty", inputQty)
      });
    }), !1)
  }));
  document.querySelectorAll(".product-card-variant-option").forEach((e => {
    e.addEventListener("change", (e => {
      const selectedElement = e.target,
       productItem = selectedElement.closest(".box-inner"),
       varinatImageUrl = selectedElement.options[selectedElement.selectedIndex].getAttribute("data-image"),
      AddBtn = productItem.querySelectorAll(".cart-btn"),
      variantParice = selectedElement.options[selectedElement.selectedIndex].getAttribute("data-price"),
      varinatImag = productItem.querySelector("image-srcset").querySelector("img:first-child"),
      SpecialPriceElement = productItem.querySelector(".price-item.special-price"),
      RegularPriceElement = productItem.querySelector(".price-item.regular-price"),
      varinatId = selectedElement.options[selectedElement.selectedIndex].getAttribute("value");
      AddBtn.forEach(function(allItem, allItemIndex){
        allItem.setAttribute("data-variant", varinatId);
      });
      SpecialPriceElement.innerHTML = variantParice;
      RegularPriceElement.innerHTML = variantParice;
      varinatImag.removeAttribute("srcset");
      varinatImag.setAttribute("src", varinatImageUrl);
    }), !1)
  }));
}
/***** verticalmenumobile *****/

  function VerticalMenuMobile() {
    const windowWidth = window.innerWidth; 
    if (windowWidth < 1200) {
      $("#navbarNav").append($(".vertical-navbar-list"));
      // $('.vertical-navbar-list').hide();
      $(document).on( "click", '.vertical-menu-list', function() { 
        $(".horizontal-menu-list").removeClass('active');
        $(this).addClass("active");
        $('.navbar-nav').hide();
        $('.vertical-navbar-list').show();
      });
      $(document).on( "click", '.horizontal-menu-list', function() {
        $(".vertical-menu-list").removeClass('active');
        $(this).addClass("active");
        $('.vertical-navbar-list').hide();
        $('.navbar-nav').show();
      });
    }
    else{
        $('#navbarNav .vertical-navbar-list').hide();
        $('#navbarNav .navbar-nav').show();
        $(".vertical-navbar-collappes").append($(".vertical-navbar-list"));
        $(document).on('mouseenter', '.vertical-menu-dropdown', function() {
            $('.vertical-navbar-list').show();
        })
    }
  }
/****** Product tab to accordion *****/
$('.mobile-tab-title').click(function () {
    $('.tab-pane').removeClass('show');
    $('.tab-pane').removeClass('active');
    $('.product-tabs .nav-tabs .nav-item .nav-link').removeClass('active');
    $(this).parent().addClass('show');  
    $(this).next().slideToggle();
    $(this).toggleClass('active');
    $(`.product-tabs .nav-tabs .nav-item .nav-link[data-bs-target="#${$(this).attr('data-bs-item')}"]`).addClass('active');
    $(`.product-tabs .tab-content .tab-pane[id="${$(this).attr('data-bs-item')}"]`).addClass('active');
});