(function () {
  'use strict';

  function updateCount(viewer) {
    var countElement = viewer.querySelector('.live-visitors-count');
    if (!countElement) return;

    var maximum = Math.max(1, parseInt(viewer.dataset.max, 10) || 50);
    var count = Math.max(1, Math.floor(Math.random() * maximum) + 1);
    countElement.textContent = count;
  }

  function placeViewer(viewer) {
    var productInfo = viewer.closest('.product-info, .product-summary');
    var titleRow = productInfo && productInfo.querySelector('.product-title-share-row');
    if (!titleRow || viewer.dataset.positioned === 'true') return;

    var actions = titleRow.querySelector('.product-title-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'product-title-actions';
      titleRow.appendChild(actions);
    }

    var share = titleRow.querySelector('#smart-share-block');
    if (share && share.parentNode === titleRow) actions.appendChild(share);
    actions.appendChild(viewer);
    viewer.dataset.positioned = 'true';
  }

  function initViewer(viewer) {
    if (viewer.dataset.liveViewerReady === 'true') return;
    viewer.dataset.liveViewerReady = 'true';
    updateCount(viewer);

    var interval = Math.max(5000, parseInt(viewer.dataset.interval, 10) || 10000);
    window.setInterval(function () { updateCount(viewer); }, interval);
    placeViewer(viewer);
  }

  function initAll(root) {
    (root || document).querySelectorAll('[data-live-viewers]').forEach(initViewer);
    (root || document).querySelectorAll('[data-live-viewers]').forEach(placeViewer);
  }

  function observePlacement() {
    var productInfo = document.querySelector('.product-info, .product-summary');
    if (!productInfo || !window.MutationObserver) return;
    var observer = new MutationObserver(function () {
      productInfo.querySelectorAll('[data-live-viewers]').forEach(placeViewer);
    });
    observer.observe(productInfo, { childList: true, subtree: true });
  }

  function start() {
    initAll(document);
    observePlacement();
    window.setTimeout(function () { initAll(document); }, 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  document.addEventListener('shopify:section:load', function (event) {
    initAll(event.target);
  });
})();