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
