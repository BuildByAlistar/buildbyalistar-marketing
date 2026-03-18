(function () {
  function initSiteChrome() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileToggle && mobileMenu) {
      mobileToggle.addEventListener('click', function () {
        mobileMenu.classList.toggle('hidden');
      });

      mobileMenu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          mobileMenu.classList.add('hidden');
        });
      });
    }

    const currentPage = document.body.dataset.page;
    if (currentPage) {
      document.querySelectorAll('[data-nav]').forEach(function (link) {
        if (link.dataset.nav === currentPage) {
          link.classList.add('active');
        }
      });
    }

    document.querySelectorAll('[data-current-year]').forEach(function (node) {
      node.textContent = new Date().getFullYear();
    });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSiteChrome);
  } else {
    initSiteChrome();
  }
})();
