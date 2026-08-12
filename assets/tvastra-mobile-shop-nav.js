(function () {
  'use strict';

  function setShopMenuOpen(shopItem, open) {
    var opener = shopItem && shopItem.querySelector(':scope > .tvastra-shop-nav__toggle');
    var menu = shopItem && shopItem.querySelector(':scope > .tvastra-shop-mobile-menu');
    var navList = document.querySelector('#navbarNav .navbar-nav');
    var mobileTools = document.querySelector('.mobile-language-currency');

    if (opener) opener.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (menu) menu.classList.toggle('open', open);
    if (navList) navList.classList.toggle('child-sub-open', open);
    if (mobileTools) mobileTools.classList.toggle('menu-open', open);
  }

  document.addEventListener('click', function (event) {
    var opener = event.target.closest('.tvastra-shop-nav__toggle');
    if (opener && window.matchMedia('(max-width: 1199px)').matches) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setShopMenuOpen(opener.closest('.tvastra-shop-nav'), true);
      return;
    }

    var back = event.target.closest('.tvastra-shop-mobile-menu > .back-wrapper');
    if (!back) return;

    var menu = back.closest('.tvastra-shop-mobile-menu');
    var shopItem = menu && menu.closest('.tvastra-shop-nav');

    event.preventDefault();
    event.stopImmediatePropagation();
    setShopMenuOpen(shopItem, false);
  }, true);

  document.addEventListener('keydown', function (event) {
    var opener = event.target.closest('.tvastra-shop-nav__toggle');
    if (!opener || (event.key !== 'Enter' && event.key !== ' ')) return;

    event.preventDefault();
    setShopMenuOpen(opener.closest('.tvastra-shop-nav'), true);
  });
}());
