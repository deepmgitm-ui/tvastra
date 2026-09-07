(function () {
  var STAR_SELECTOR = ".jdgm-star";
  var SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  var STAR_PATH = "m12 2.2 2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.27l-5.9 3.11 1.13-6.58-4.78-4.66 6.6-.96L12 2.2Z";

  function createStar(isEmpty) {
    var wrapper = document.createElement("span");
    var svg = document.createElementNS(SVG_NAMESPACE, "svg");
    var path = document.createElementNS(SVG_NAMESPACE, "path");

    wrapper.className = "tv-review-star";
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.style.cssText = "display:inline-flex;width:16px;height:16px;margin:0 1px;vertical-align:middle;flex:0 0 16px;";

    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("focusable", "false");
    svg.style.display = "block";

    path.setAttribute("d", STAR_PATH);
    if (isEmpty) {
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#d3a941");
      path.setAttribute("stroke-width", "1.8");
    } else {
      path.setAttribute("fill", "#d3a941");
    }

    svg.appendChild(path);
    wrapper.appendChild(svg);
    return wrapper;
  }

  function replaceStar(star) {
    if (!star || !star.parentNode || star.dataset.tvStarReplaced === "true") return;

    var replacement = createStar(star.classList.contains("jdgm--off"));
    star.dataset.tvStarReplaced = "true";
    star.parentNode.replaceChild(replacement, star);
  }

  function replaceStars(root) {
    if (!root) return;

    if (root.matches && root.matches(STAR_SELECTOR)) {
      replaceStar(root);
    }

    if (root.querySelectorAll) {
      root.querySelectorAll(STAR_SELECTOR).forEach(replaceStar);
    }
  }

  function start() {
    replaceStars(document);

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            replaceStars(node);
          }
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