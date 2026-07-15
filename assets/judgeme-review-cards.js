(function () {
  var CARD_SELECTOR = ".jdgm-carousel-item";
  var CONTAINER_SELECTOR = ".jdgm-carousel__item-container";
  var WIDGET_SELECTOR = ".jdgm-widget.jdgm-carousel";
  var PRODUCT_LINK_SELECTOR = ".jdgm-carousel-item__product[href*='/products/']";
  var IMAGE_SELECTOR = ".jdgm-carousel-item__product-image";
  var dragState = {
    active: false,
    moved: false,
    container: null,
    startX: 0,
    startY: 0,
    startScrollLeft: 0
  };
  var productCache = new Map();

  function getProductUrl(card) {
    var link = card.querySelector(PRODUCT_LINK_SELECTOR);
    if (!link) return null;

    try {
      var url = new URL(link.getAttribute("href"), window.location.origin);
      if (url.pathname.indexOf("/products/") !== 0) return null;
      return url;
    } catch (error) {
      return null;
    }
  }

  function getProductHandle(url) {
    var parts = url.pathname.split("/").filter(Boolean);
    var productIndex = parts.indexOf("products");
    return productIndex > -1 ? parts[productIndex + 1] : "";
  }

  function getProductPageUrl(url) {
    return url.pathname + url.search;
  }

  function hasUsableImage(card) {
    var image = card.querySelector(IMAGE_SELECTOR);
    if (!image || image.tagName !== "IMG") return false;
    return Boolean(image.getAttribute("src") || image.getAttribute("data-src"));
  }

  function getProductImage(product) {
    if (!product) return "";
    if (product.featured_image) return product.featured_image;
    if (product.image && product.image.src) return product.image.src;
    if (product.images && product.images.length) {
      return typeof product.images[0] === "string" ? product.images[0] : product.images[0].src;
    }
    return "";
  }

  function normalizeImageUrl(src) {
    if (!src) return "";
    if (src.indexOf("//") === 0) return window.location.protocol + src;
    return src;
  }

  function fetchProduct(handle) {
    if (!handle) return Promise.resolve(null);
    if (!productCache.has(handle)) {
      productCache.set(
        handle,
        fetch("/products/" + encodeURIComponent(handle) + ".js", {
          credentials: "same-origin"
        })
          .then(function (response) {
            return response.ok ? response.json() : null;
          })
          .catch(function () {
            return null;
          })
      );
    }
    return productCache.get(handle);
  }

  function addProductImage(card, productUrl) {
    if (hasUsableImage(card) || card.dataset.tvProductImageLoading === "true") return;

    var handle = getProductHandle(productUrl);
    if (!handle) return;

    card.dataset.tvProductImageLoading = "true";

    fetchProduct(handle).then(function (product) {
      var src = normalizeImageUrl(getProductImage(product));
      if (!src || hasUsableImage(card)) return;

      var existingImage = card.querySelector(IMAGE_SELECTOR);
      var image = document.createElement("img");
      image.className = "jdgm-carousel-item__product-image";
      var titleEl = card.querySelector(".jdgm-carousel-item__product-title");
      image.alt = (titleEl && titleEl.textContent.trim()) || product.title || "Product image";
      image.loading = "lazy";
      image.decoding = "async";
      image.src = src;

      if (existingImage) {
        existingImage.replaceWith(image);
      } else {
        var reviewWrapper = card.querySelector(".jdgm-carousel-item__review-wrapper");
        card.insertBefore(image, reviewWrapper || card.firstChild);
      }
    });
  }

  function makeCardClickable(card, productUrl) {
    if (card.dataset.tvCardLinkReady === "true") return;

    var link = card.querySelector(PRODUCT_LINK_SELECTOR);
    var cleanProductUrl = getProductPageUrl(productUrl);
    var productTitle = card.querySelector(".jdgm-carousel-item__product-title");
    card.dataset.tvCardLinkReady = "true";
    card.classList.add("tv-jdgm-card-link-ready");
    card.dataset.tvProductUrl = cleanProductUrl;
    card.setAttribute("role", "link");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", "View " + ((productTitle && productTitle.textContent.trim()) || "product"));

    if (link) {
      link.setAttribute("href", cleanProductUrl);
    }
  }

  function getLinkedCard(target) {
    return target && target.closest ? target.closest(CARD_SELECTOR + ".tv-jdgm-card-link-ready") : null;
  }

  function getSlideContainer(target) {
    return target && target.closest ? target.closest(CONTAINER_SELECTOR) : null;
  }

  function openCard(card) {
    if (!card || !card.dataset.tvProductUrl) return;
    window.location.href = card.dataset.tvProductUrl;
  }

  function getCardScrollLeft(container, card) {
    var containerRect = container.getBoundingClientRect();
    var cardRect = card.getBoundingClientRect();
    return cardRect.left - containerRect.left + container.scrollLeft;
  }

  function snapToNearestCard(container) {
    var cards = Array.prototype.slice.call(container.querySelectorAll(CARD_SELECTOR));
    if (!cards.length) return;

    var currentLeft = container.scrollLeft;
    var nearestCard = cards.reduce(function (nearest, card) {
      var cardLeft = getCardScrollLeft(container, card);
      var nearestLeft = getCardScrollLeft(container, nearest);
      return Math.abs(cardLeft - currentLeft) < Math.abs(nearestLeft - currentLeft) ? card : nearest;
    }, cards[0]);

    var targetLeft = getCardScrollLeft(container, nearestCard);

    try {
      container.scrollTo({ left: targetLeft, behavior: "smooth" });
    } catch (error) {
      container.scrollLeft = targetLeft;
    }
  }

  function getVisibleCard(container, direction) {
    var cards = Array.prototype.slice.call(container.querySelectorAll(CARD_SELECTOR));
    if (!cards.length) return null;

    var currentLeft = container.scrollLeft;
    var currentIndex = cards.reduce(function (nearestIndex, card, index) {
      var cardLeft = getCardScrollLeft(container, card);
      var nearestLeft = getCardScrollLeft(container, cards[nearestIndex]);
      return Math.abs(cardLeft - currentLeft) < Math.abs(nearestLeft - currentLeft) ? index : nearestIndex;
    }, 0);

    var nextIndex = Math.max(0, Math.min(cards.length - 1, currentIndex + direction));
    return cards[nextIndex];
  }

  function slideContainer(container, direction) {
    var targetCard = getVisibleCard(container, direction);
    if (!targetCard) return;

    var targetLeft = getCardScrollLeft(container, targetCard);

    try {
      container.scrollTo({ left: targetLeft, behavior: "smooth" });
    } catch (error) {
      container.scrollLeft = targetLeft;
    }
  }

  function createNavButton(direction) {
    var button = document.createElement("button");
    button.className = "tv-jdgm-nav tv-jdgm-nav--" + (direction < 0 ? "prev" : "next");
    button.type = "button";
    button.setAttribute("aria-label", direction < 0 ? "Previous reviews" : "Next reviews");
    button.innerHTML = direction < 0 ? "&#8249;" : "&#8250;";
    return button;
  }

  function enhanceSliderControls(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var widgets = Array.prototype.slice.call(scope.querySelectorAll(WIDGET_SELECTOR));

    if (scope.matches && scope.matches(WIDGET_SELECTOR)) {
      widgets.unshift(scope);
    }

    widgets.forEach(function (widget) {
      if (widget.dataset.tvJdgmControlsReady === "true") return;

      var container = widget.querySelector(CONTAINER_SELECTOR);
      if (!container) return;

      var prevButton = createNavButton(-1);
      var nextButton = createNavButton(1);

      widget.dataset.tvJdgmControlsReady = "true";
      widget.classList.add("tv-jdgm-slider-ready");
      widget.appendChild(prevButton);
      widget.appendChild(nextButton);

      prevButton.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        slideContainer(container, -1);
      });

      nextButton.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        slideContainer(container, 1);
      });
    });
  }

  function bindCardNavigation() {
    document.addEventListener(
      "pointerdown",
      function (event) {
        var container = getSlideContainer(event.target);
        if (!container || (event.pointerType === "mouse" && event.button !== 0)) return;

        dragState.active = true;
        dragState.moved = false;
        dragState.container = container;
        dragState.startX = event.clientX;
        dragState.startY = event.clientY;
        dragState.startScrollLeft = container.scrollLeft;
        container.classList.add("tv-jdgm-sliding");
      },
      { passive: true }
    );

    document.addEventListener(
      "pointermove",
      function (event) {
        if (!dragState.active) return;

        var deltaX = event.clientX - dragState.startX;
        var deltaY = event.clientY - dragState.startY;
        var absX = Math.abs(deltaX);
        var absY = Math.abs(deltaY);

        if (absX > 8 || absY > 8) {
          dragState.moved = true;
        }

        if (dragState.container && absX > absY && absX > 4) {
          dragState.container.scrollLeft = dragState.startScrollLeft - deltaX;
          if (event.pointerType === "mouse") {
            event.preventDefault();
          }
        }
      },
      { passive: false }
    );

    document.addEventListener(
      "pointerup",
      function () {
        var container = dragState.container;
        var moved = dragState.moved;

        if (container && moved) {
          snapToNearestCard(container);
        }

        if (dragState.container) {
          dragState.container.classList.remove("tv-jdgm-sliding");
        }

        window.setTimeout(function () {
          dragState.active = false;
          dragState.moved = false;
          dragState.container = null;
        }, 180);
      },
      { passive: true }
    );

    document.addEventListener(
      "pointercancel",
      function () {
        if (dragState.container) {
          dragState.container.classList.remove("tv-jdgm-sliding");
        }
        dragState.active = false;
        dragState.moved = false;
        dragState.container = null;
      },
      { passive: true }
    );

    document.addEventListener("click", function (event) {
      var card = getLinkedCard(event.target);
      if (!card) return;
      if (dragState.moved) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (window.getSelection && window.getSelection().toString()) return;
      event.preventDefault();
      openCard(card);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      var card = getLinkedCard(event.target);
      if (!card) return;
      event.preventDefault();
      openCard(card);
    });
  }

  function enhanceCard(card) {
    var productUrl = getProductUrl(card);
    if (!productUrl) return;

    addProductImage(card, productUrl);
    makeCardClickable(card, productUrl);
  }

  function enhanceCards(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(CARD_SELECTOR).forEach(enhanceCard);
  }

  function start() {
    bindCardNavigation();
    enhanceCards(document);
    enhanceSliderControls(document);

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches(CARD_SELECTOR)) enhanceCard(node);
          enhanceCards(node);
          enhanceSliderControls(node);
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
