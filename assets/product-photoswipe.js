jQuery( function( $ ) {
	var ProductPhotoswipe = function( $target ) {
		this.$target = $target;
		this.$media = $( '.product__media-item[data-media-type]', $target );

		// No images? Abort.
		if ( 0 === this.$media.length ) {
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
	};

	/**
	 * Get product gallery image items.
	 */
	ProductPhotoswipe.prototype.getGalleryItems = function() {
		var $slides = this.$media,
			items   = [];
		var escapeAttribute = function( value ) {
			return String( value || '' )
				.replace( /&/g, '&amp;' )
				.replace( /"/g, '&quot;' )
				.replace( /</g, '&lt;' )
				.replace( />/g, '&gt;' );
		};

		if ( $slides.length > 0 ) {
			$slides.each( function( i, el ) {
				var $slide = $( el ),
					mediaType = $slide.attr( 'data-media-type' ),
					img = $slide.find( 'img' ).first(),
					video = $slide.find( 'video' ).get( 0 );

				$slide.attr( 'data-pswp-index', '-1' );
				if ( 'image' === mediaType && img.length ) {
					var imageSrc = img.attr( 'data-master-image' ) || img.attr( 'src' ) || img.attr( 'data-src' );
					if ( ! imageSrc ) {
						return;
					}
					$slide.attr( 'data-pswp-index', items.length );
					items.push({
						src  : imageSrc,
						w    : img.attr( 'data-master-image-width' ) || img.attr( 'width' ) || 1,
						h    : img.attr( 'data-master-image-height' ) || img.attr( 'height' ) || 1,
						title: img.attr( 'data-caption' ) ? img.attr( 'data-caption' ) : ''
					});
				} else if ( 'video' === mediaType && video ) {
					var sourceElement = $( video ).find( 'source[src]' ).first(),
						source = sourceElement.attr( 'src' ) || video.getAttribute( 'src' ) || video.currentSrc,
						poster = video.getAttribute( 'poster' ),
						sourceType = sourceElement.attr( 'type' ),
						videoHtml;

					if ( ! source ) {
						return;
					}

					videoHtml = '<video class="tv-pswp-video" controls autoplay muted playsinline loop preload="metadata"';
					if ( poster ) {
						videoHtml += ' poster="' + escapeAttribute( poster ) + '"';
					}
					videoHtml += '><source src="' + escapeAttribute( source ) + '"';
					if ( sourceType ) {
						videoHtml += ' type="' + escapeAttribute( sourceType ) + '"';
					}
					videoHtml += '></video>';
					$slide.attr( 'data-pswp-index', items.length );
					items.push({ html: videoHtml });
				} else if ( 'external_video' === mediaType ) {
					var iframe = $slide.find( 'iframe' ).get( 0 ),
						iframeSrc = iframe && iframe.getAttribute( 'src' );

					if ( iframeSrc ) {
						$slide.attr( 'data-pswp-index', items.length );
						items.push({
							html: '<iframe class="tv-pswp-video-frame" src="' + escapeAttribute( iframeSrc ) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>'
						});
					}
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
			"bgOpacity": 0.92,
			"closeOnVerticalDrag": false
		};
		var index = parseInt( clicked.attr( 'data-pswp-index' ), 10 );
		if ($(this.$target).hasClass('product-style-2')) {
			var styleTwoGalleryIndex = parseInt($(eventTarget).closest(".gallary-item.product__media-item").attr("data-pswp-index"), 10);
			if ( ! isNaN( styleTwoGalleryIndex ) ) {
				index = styleTwoGalleryIndex;
			}
		}
		if ( isNaN( index ) || index < 0 ) {
			index = 0;
		}
		index = Math.min( index, Math.max( 0, items.length - 1 ) );
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
