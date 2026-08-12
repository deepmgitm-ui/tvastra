(function () {
  'use strict';

  var mobileQuery = window.matchMedia('(max-width: 1199px)');

  function isShopLink(link) {
    return link && link.closest('#navbarNav') && link.closest('.nav-type-megamenu') &&
      link.textContent.replace(/\s+/g, ' ').trim().toLowerCase().indexOf('shop') === 0;
  }

  function setMenuOpen(item, menu, isOpen) {
    var navList = document.querySelector('#navbarNav .navbar-nav');
    var mobileTools = document.querySelector('.mobile-language-currency');

    item.classList.toggle('active', isOpen);
    menu.classList.toggle('open', isOpen);
    if (navList) navList.classList.toggle('child-sub-open', isOpen);
    if (mobileTools) mobileTools.classList.toggle('menu-open', isOpen);
  }

  function loadAndOpen(item, link) {
    var menu = item.querySelector('.dropdown-menu.megamenu');
    var wrapper = menu && menu.querySelector('.sub-menu-wrapper');
    var loader = menu && menu.querySelector('.show-loader');
    var source = item.getAttribute('data-searchurl');

    if (!menu || !wrapper || !source) {
      window.location.assign(link.href);
      return;
    }

    setMenuOpen(item, menu, true);
    if (wrapper.children.length) return;
    if (item.dataset.tvastraShopLoading === 'true') return;

    item.dataset.tvastraShopLoading = 'true';
    if (loader) loader.style.display = '';

    fetch(source, { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) throw new Error('Shop menu request failed');
        return response.text();
      })
      .then(function (html) {
        wrapper.innerHTML = html;
        if (loader) loader.style.display = 'none';
      })
      .catch(function () {
        window.location.assign(link.href);
      })
      .finally(function () {
        item.dataset.tvastraShopLoading = 'false';
      });
  }

  document.addEventListener('click', function (event) {
    if (!mobileQuery.matches) return;

    var link = event.target.closest('#navbarNav .nav-type-megamenu > .nav-link');
    if (!isShopLink(link)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    loadAndOpen(link.closest('.nav-type-megamenu'), link);
  }, true);

  document.addEventListener('click', function (event) {
    var back = event.target.closest('.tvastra-shop-menu > .back-wrapper');
    if (!back || !mobileQuery.matches) return;

    var menu = back.closest('.dropdown-menu.megamenu');
    var item = menu && menu.closest('.nav-type-megamenu');
    if (!menu || !item) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    setMenuOpen(item, menu, false);
  }, true);
}());
