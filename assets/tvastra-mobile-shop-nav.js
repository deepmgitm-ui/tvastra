(function () {
  'use strict';

  document.addEventListener('click', function (event) {
    var opener = event.target.closest('.tvastra-shop-nav > .nav-link .parent');
    if (opener) opener.setAttribute('aria-expanded', 'true');

    var back = event.target.closest('.tvastra-shop-mobile-menu > .back-wrapper');
    if (!back) return;

    var menu = back.closest('.tvastra-shop-mobile-menu');
    var shopItem = menu && menu.closest('.tvastra-shop-nav');
    var navList = document.querySelector('#navbarNav .navbar-nav');
    var mobileTools = document.querySelector('.mobile-language-currency');

    event.preventDefault();
    if (menu) menu.classList.remove('open');
    if (shopItem) shopItem.querySelector('.parent').setAttribute('aria-expanded', 'false');
    if (navList) navList.classList.remove('child-sub-open');
    if (mobileTools) mobileTools.classList.remove('menu-open');
  });

  document.addEventListener('keydown', function (event) {
    var opener = event.target.closest('.tvastra-shop-nav > .nav-link .parent');
    if (!opener || (event.key !== 'Enter' && event.key !== ' ')) return;

    event.preventDefault();
    opener.click();
  });
}());
