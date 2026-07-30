(function () {
  if (customElements.get('related-products-drawer')) return;

  class RelatedProductsDrawer extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready === 'true') return;
      this.dataset.ready = 'true';
      this.openButton = this.querySelector('[data-related-products-open]');
      this.panel = this.querySelector('.tvastra-related-drawer__panel');
      this.closeButtons = this.querySelectorAll('[data-related-products-close]');
      this.backdrop = this.querySelector('.tvastra-related-drawer__backdrop');
      this.lastFocused = null;
      this.galleryButton = null;

      if (!this.openButton || !this.panel) return;

      this.openButton.addEventListener('click', () => this.open());
      this.closeButtons.forEach((button) => {
        button.addEventListener('click', () => this.close());
      });
      this.addEventListener('keydown', (event) => this.onKeydown(event));
      this.mountGalleryButton();
    }

    disconnectedCallback() {
      if (this.galleryButton) this.galleryButton.remove();
      document.body.classList.remove('tvastra-related-drawer-open');
    }

    mountGalleryButton() {
      if (this.galleryButton && this.galleryButton.isConnected) return;
      const galleryTarget = document.querySelector('.main-product-page .product-main-slider')
        || document.querySelector('.main-product-page .product-media-grid-wrapper')
        || document.querySelector('.main-product-page .product-gallery');
      if (!galleryTarget) return;

      const galleryButton = this.openButton.cloneNode(true);
      galleryButton.hidden = false;
      galleryButton.classList.add('is-gallery-mounted');
      if (document.querySelector('[data-tvastra-gallery-share]')) {
        galleryButton.classList.add('has-share-control');
      }
      galleryButton.addEventListener('click', () => this.open());
      galleryTarget.appendChild(galleryButton);
      this.galleryButton = galleryButton;
    }

    setExpanded(expanded) {
      this.openButton.setAttribute('aria-expanded', String(expanded));
      if (this.galleryButton) {
        this.galleryButton.setAttribute('aria-expanded', String(expanded));
      }
    }

    open() {
      this.lastFocused = document.activeElement;
      if (this.backdrop) this.backdrop.hidden = false;
      this.classList.add('is-open');
      this.setExpanded(true);
      this.panel.setAttribute('aria-hidden', 'false');
      document.body.classList.add('tvastra-related-drawer-open');
      window.requestAnimationFrame(() => this.panel.focus({ preventScroll: true }));
    }

    close() {
      this.classList.remove('is-open');
      this.setExpanded(false);
      this.panel.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('tvastra-related-drawer-open');

      window.setTimeout(() => {
        if (this.backdrop && !this.classList.contains('is-open')) this.backdrop.hidden = true;
      }, 280);

      if (this.lastFocused && typeof this.lastFocused.focus === 'function') {
        this.lastFocused.focus({ preventScroll: true });
      }
    }

    onKeydown(event) {
      if (event.key === 'Escape' && this.classList.contains('is-open')) {
        event.preventDefault();
        this.close();
        return;
      }

      if (event.key !== 'Tab' || !this.classList.contains('is-open')) return;
      const focusable = Array.from(
        this.panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      ).filter((element) => !element.hidden);
      if (!focusable.length) {
        event.preventDefault();
        this.panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  customElements.define('related-products-drawer', RelatedProductsDrawer);
})();
