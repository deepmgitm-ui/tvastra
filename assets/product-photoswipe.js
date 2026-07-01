jQuery( function( $ ) {
	var ProductPhotoswipe = function( $target ) {
		this.$target = $target;
		this.$images = $( '.product__media-item[data-media-type="image"]', $target );

		// No images? Abort.
		if ( 0 === this.$images.length ) {
			return;
		}

		// Pick functionality to initialize...
		this.photoswipe_enabled = typeof PhotoSwipe !== 'undefined';

		// Bind functions to this.
		this.getGalleryItems = this.getGalleryItems.bind( this );
		this.initPhotoswipe = this.initPhotoswipe.bind( this );
		this.openPhotoswipe = this.openPhotoswipe.bind( this );

		if ( this.photoswipe_enabled ) {
			this.initPhotoswipe();
		}
	};

	/**
	 * Init PhotoSwipe.
	 */
	ProductPhotoswipe.prototype.initPhotoswipe = function() {
		var $this = this;
		$(document).on( 'click', '.product-gallery-photoswipe__trigger', function (e) {
			$this.openPhotoswipe(e);
		});
		if (!window.ZOOM) {
			$(document).on( 'click', '.product-image-main .product-media.media-image > img', function (e) {
				$this.openPhotoswipe(e);
			});
		}
	};

	/**
	 * Get product gallery image items.
	 */
	ProductPhotoswipe.prototype.getGalleryItems = function() {
		var $slides = this.$images,
			items   = [];

		if ( $slides.length > 0 ) {
			$slides.each( function( i, el ) {
				var img = $( el ).find( 'img' );
				if ( img.length ) {
					items.push({
						src  : img.attr( 'data-master-image' ),
						w    : img.attr( 'data-master-image-width' ),
						h    : img.attr( 'data-master-image-height' ),
						title: img.attr( 'data-caption' ) ? img.attr( 'data-caption' ) : ''
					});
				}
			});
		}

		return items;
	};

	/**
	 * Open photoswipe modal.
	 */
	ProductPhotoswipe.prototype.openPhotoswipe = function( e ) {
		e.preventDefault();

		var pswpElement = document.querySelector('.pswp'),
			items       = this.getGalleryItems(),
			eventTarget = $( e.target ),
			clicked;
			if ($(this.$target).hasClass('swiper')) {
				clicked = this.$target.find( '.swiper-slide-active' );
			}
			else{
				clicked = $(eventTarget).closest(".gallary-item.product__media-item");
			}
		var photoswipe_additional_options = {
			"shareEl": false,
			"history": false,
			"closeOnScroll": false,
			"bgOpacity": 0.85,
			"closeOnVerticalDrag": false
		};
		if ($(this.$target).hasClass('product-style-2')) {
			var index = parseInt($(eventTarget).closest(".gallary-item.product__media-item").attr("data-swiper-slide-index"));
		}
		else{
			var index = $( clicked ).index()
		}
			var options = $.extend( {
				index: index,
				addCaptionHTMLFn: function( item, captionEl ) {
					return false;
					if ( ! item.title ) {
						captionEl.children[0].textContent = '';
						return false;
					}
					captionEl.children[0].textContent = item.title;
					return true;
				}
			}, photoswipe_additional_options);

		// Initializes and opens PhotoSwipe.
		var photoswipe = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options );
		photoswipe.init();
	};

	/*
	 * Initialize all galleries on page.
	 */
	$('.product-image-main, .product-style-2-main-img').each(function(){
		var psws = new ProductPhotoswipe($(this));
	});
});
