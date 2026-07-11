(function () {
  function initializeCollectionLoadMore() {
    if (document.documentElement.dataset.collectionLoadMoreBound === 'true') return;

    document.documentElement.dataset.collectionLoadMoreBound = 'true';

    document.addEventListener(
      'click',
      function (event) {
        var source = event.target.nodeType === 1 ? event.target : event.target.parentElement;
        var trigger = source && source.closest('[data-collection-load-more]');
        if (!trigger) return;

        var grid = document.querySelector('#main-collection-product-grid');
        if (!grid || grid.dataset.loadingMore === 'true') return;

        event.preventDefault();
        event.stopImmediatePropagation();

        grid.dataset.loadingMore = 'true';
        trigger.setAttribute('aria-busy', 'true');
        trigger.classList.add('loading');

        fetch(trigger.href, { credentials: 'same-origin' })
          .then(function (response) {
            if (!response.ok) throw new Error('Unable to load more products');
            return response.text();
          })
          .then(function (markup) {
            var page = new DOMParser().parseFromString(markup, 'text/html');
            var nextGrid = page.querySelector('#main-collection-product-grid');
            if (!nextGrid) throw new Error('Product grid was not found');

            var cards = Array.prototype.filter.call(nextGrid.children, function (item) {
              return item.classList.contains('product-box');
            });
            if (!cards.length) throw new Error('No products were returned');

            grid.insertAdjacentHTML(
              'beforeend',
              cards
                .map(function (card) {
                  return card.outerHTML;
                })
                .join('')
            );

            var currentControl = document.querySelector('#load-more-btn');
            var nextControl = page.querySelector('#load-more-btn');
            if (currentControl && nextControl && nextControl.querySelector('[data-collection-load-more]')) {
              currentControl.replaceWith(nextControl.cloneNode(true));
            } else if (currentControl) {
              currentControl.remove();
            }

            var currentCount = document.querySelector('.pegi-product-count');
            var nextCount = page.querySelector('.pegi-product-count');
            if (currentCount && nextCount) {
              currentCount.innerHTML = nextCount.innerHTML;
              currentCount.setAttribute('current-item', nextCount.getAttribute('current-item') || '');
              currentCount.setAttribute('total-item', nextCount.getAttribute('total-item') || '');
            }

            var currentProgress = document.querySelector('.progress-percent');
            var shown = parseInt(nextCount && nextCount.getAttribute('current-item'), 10);
            var total = parseInt(nextCount && nextCount.getAttribute('total-item'), 10);
            if (currentProgress && shown && total) {
              var percent = Math.min(100, Math.round((shown * 100) / total));
              currentProgress.style.width = percent + '%';
              currentProgress.setAttribute('data-percent', percent);
            }

            if (window.initSwatchOptionImage) window.initSwatchOptionImage();
            if (window.initVariantChanger) window.initVariantChanger(grid);
            if (window.initTooltips) window.initTooltips(grid.querySelectorAll('[data-bs-toggle="tooltip"]'));
            document.dispatchEvent(new CustomEvent('initialize:wishlist-button'));
          })
          .catch(function () {
            trigger.removeAttribute('aria-busy');
            trigger.classList.remove('loading');
          })
          .finally(function () {
            delete grid.dataset.loadingMore;
          });
      },
      true
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCollectionLoadMore);
  } else {
    initializeCollectionLoadMore();
  }
})();
