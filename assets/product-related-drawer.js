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

      if (!this.openButton || !this.panel) return;

      this.openButton.addEventListener('click', () => this.open());
      this.closeButtons.forEach((button) => {
        button.addEventListener('click', () => this.close());
      });
      this.addEventListener('keydown', (event) => this.onKeydown(event));
    }

    open() {
      this.lastFocused = document.activeElement;
      if (this.backdrop) this.backdrop.hidden = false;
      this.classList.add('is-open');
      this.openButton.setAttribute('aria-expanded', 'true');
      this.panel.setAttribute('aria-hidden', 'false');
      document.body.classList.add('tvastra-related-drawer-open');
      window.requestAnimationFrame(() => this.panel.focus({ preventScroll: true }));
    }

    close() {
      this.classList.remove('is-open');
      this.openButton.setAttribute('aria-expanded', 'false');
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
