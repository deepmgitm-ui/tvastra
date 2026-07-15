(function () {
  var CARD_SELECTOR = ".jdgm-carousel-item";
  var PRODUCT_LINK_SELECTOR = ".jdgm-carousel-item__product[href*='/products/']";
  var IMAGE_SELECTOR = ".jdgm-carousel-item__product-image";
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

    var productTitle = card.querySelector(".jdgm-carousel-item__product-title");
    card.dataset.tvCardLinkReady = "true";
    card.classList.add("tv-jdgm-card-link-ready");
    card.setAttribute("role", "link");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", "View " + ((productTitle && productTitle.textContent.trim()) || "product"));

    card.addEventListener("click", function (event) {
      if (event.target.closest("a, button")) return;
      if (window.getSelection && window.getSelection().toString()) return;
      window.location.href = productUrl.pathname + productUrl.search + productUrl.hash;
    });

    card.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      window.location.href = productUrl.pathname + productUrl.search + productUrl.hash;
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
    enhanceCards(document);

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches(CARD_SELECTOR)) enhanceCard(node);
          enhanceCards(node);
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
