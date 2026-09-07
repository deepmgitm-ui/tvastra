document.addEventListener('DOMContentLoaded', function () {
  var body = document.body;

  function syncHeaderTopState() {
    if (window.scrollY <= 60) {
      body.classList.add('hongo-header-at-top');
      body.classList.remove('hongo-header-scrolled');
    } else {
      body.classList.remove('hongo-header-at-top');
      body.classList.add('hongo-header-scrolled');
    }
  }

  syncHeaderTopState();
  window.addEventListener('scroll', syncHeaderTopState, { passive: true });
});

// Render Judge.me rating icons without relying on its icon font, which can fail on mobile browsers.
(function () {
  var selector = '.jdgm-star';
  var ns = 'http://www.w3.org/2000/svg';
  var pathData = 'm12 2.2 2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.27l-5.9 3.11 1.13-6.58-4.78-4.66 6.6-.96L12 2.2Z';

  function createStar(empty) {
    var icon = document.createElement('span');
    var svg = document.createElementNS(ns, 'svg');
    var path = document.createElementNS(ns, 'path');
    icon.className = 'tv-review-star';
    icon.setAttribute('aria-hidden', 'true');
    icon.style.cssText = 'display:inline-flex!important;width:16px!important;height:16px!important;margin:0 1px!important;vertical-align:middle!important;flex:0 0 16px!important;';
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('focusable', 'false');
    svg.style.display = 'block';
    path.setAttribute('d', pathData);
    if (empty) {
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#d3a941');
      path.setAttribute('stroke-width', '1.8');
    } else {
      path.setAttribute('fill', '#d3a941');
    }
    svg.appendChild(path);
    icon.appendChild(svg);
    return icon;
  }

  function replaceStar(star) {
    if (!star || !star.parentNode || star.dataset.tvReviewStar === 'done') return;
    var icon = createStar(star.classList.contains('jdgm--off'));
    star.dataset.tvReviewStar = 'done';
    star.parentNode.replaceChild(icon, star);
  }

  function replaceAll(root) {
    if (!root) return;
    if (root.matches && root.matches(selector)) replaceStar(root);
    if (root.querySelectorAll) root.querySelectorAll(selector).forEach(replaceStar);
  }

  function startReviewStars() {
    replaceAll(document);
    new MutationObserver(function (changes) {
      changes.forEach(function (change) {
        change.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) replaceAll(node);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startReviewStars);
  else startReviewStars();
})();


// Judge.me's revamp can render its review cards in open shadow roots.
(function () {
  var selector = '.jdgm-star';
  var ns = 'http://www.w3.org/2000/svg';
  var pathData = 'm12 2.2 2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.27l-5.9 3.11 1.13-6.58-4.78-4.66 6.6-.96L12 2.2Z';
  var watchedRoots = new WeakSet();

  function makeStar(empty) {
    var icon = document.createElement('span');
    var svg = document.createElementNS(ns, 'svg');
    var path = document.createElementNS(ns, 'path');
    icon.className = 'tv-review-star';
    icon.setAttribute('aria-hidden', 'true');
    icon.style.cssText = 'display:inline-flex!important;width:16px!important;height:16px!important;margin:0 1px!important;vertical-align:middle!important;flex:0 0 16px!important;';
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('focusable', 'false');
    svg.style.display = 'block';
    path.setAttribute('d', pathData);
    if (empty) {
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#d3a941');
      path.setAttribute('stroke-width', '1.8');
    } else {
      path.setAttribute('fill', '#d3a941');
    }
    svg.appendChild(path);
    icon.appendChild(svg);
    return icon;
  }

  function replaceStar(star) {
    if (!star || !star.parentNode || star.dataset.tvShadowStar === 'done') return;
    var icon = makeStar(star.classList.contains('jdgm--off'));
    star.dataset.tvShadowStar = 'done';
    star.parentNode.replaceChild(icon, star);
  }

  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    if (root.matches && root.matches(selector)) replaceStar(root);
    root.querySelectorAll(selector).forEach(replaceStar);
    root.querySelectorAll('*').forEach(function (element) {
      if (element.shadowRoot) watch(element.shadowRoot);
    });
  }

  function watch(root) {
    if (!root || watchedRoots.has(root)) {
      scan(root);
      return;
    }
    watchedRoots.add(root);
    scan(root);
    new MutationObserver(function (changes) {
      changes.forEach(function (change) {
        change.addedNodes.forEach(function (node) {
          if (node.nodeType === 1 || node.nodeType === 11) scan(node);
        });
      });
    }).observe(root, { childList: true, subtree: true });
  }

  function start() {
    watch(document);
    var attempts = 0;
    var timer = window.setInterval(function () {
      scan(document);
      attempts += 1;
      if (attempts >= 120) window.clearInterval(timer);
    }, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
