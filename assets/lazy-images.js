// Lazy Image
(function() {
class ImageSrcSet extends HTMLElement {
  get intersecting() {
    return this.hasAttribute('intersecting');
  }  
  constructor() {
    super();
    this.img = this.querySelectorAll('img');
    this.observerCallback = this.observerCallback.bind(this);
    this.loadImage = this.loadImage.bind(this);
    this.img.forEach(item => item.onload = this.onLoad.bind(this))
  }
  connectedCallback() {
    if ('IntersectionObserver' in window) this.initIntersectionObserver();else this.loadImage();
  }
  disconnectedCallback() {
    this.disconnectObserver();
  }
  loadImage() {
    this.setAttribute('intersecting', 'true');
    this.img.forEach(item => {
        item.width = this.clientWidth;
        item.height = this.clientHeight;
        item.sizes = this.clientWidth + 'px';
    })
    this.img.forEach(item => {
        item.classList.add('res-img-loaded');
    })
  }
  onLoad() {
    this.removeAttribute('data-image-loading');
  }
  observerCallback(entries, observer) {
    if (!entries[0].isIntersecting) return;
    observer.unobserve(this);
    this.loadImage();
  }
  initIntersectionObserver() {
    if (this.observer) return;
    const rootMargin = '10px';
    this.observer = new IntersectionObserver(this.observerCallback, {
      rootMargin
    });
    this.observer.observe(this);
  }
  disconnectObserver() {
    if (!this.observer) return;
    this.observer.disconnect();
    this.observer = null;
    delete this.observer;
  }
}
customElements.define('image-srcset', ImageSrcSet);
})();