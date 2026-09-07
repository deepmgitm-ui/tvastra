(function () {
  var shareRootSelector = '[data-tvastra-product-share]';

  function getCurrentUrl() {
    var url = new URL(window.location.href);
    url.hash = '';
    return url.toString();
  }

  function getShareTitle(root) {
    return root.dataset.shareTitle || document.title;
  }

  function setShareHref(link, channel, title, url, image) {
    var encodedTitle = encodeURIComponent(title);
    var encodedUrl = encodeURIComponent(url);
    var encodedMessage = encodeURIComponent(title + ' ' + url);
    var href = '';

    if (channel === 'whatsapp') href = 'https://wa.me/?text=' + encodedMessage;
    if (channel === 'facebook') href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl;
    if (channel === 'x') href = 'https://twitter.com/intent/tweet?text=' + encodedTitle + '&url=' + encodedUrl;
    if (channel === 'pinterest') href = 'https://pinterest.com/pin/create/button/?url=' + encodedUrl + '&media=' + encodeURIComponent(image || '') + '&description=' + encodedTitle;
    if (channel === 'telegram') href = 'https://t.me/share/url?url=' + encodedUrl + '&text=' + encodedTitle;
    if (channel === 'email') href = 'mailto:?subject=' + encodedTitle + '&body=' + encodedMessage;

    if (href) link.href = href;
  }

  function syncShareRoot(root) {
    if (!root) return;

    var currentUrl = getCurrentUrl();
    var title = getShareTitle(root);
    var image = root.dataset.shareImage || '';
    var urlInput = root.querySelector('[data-tvastra-share-url]');
    var nativeButton = root.querySelector('[data-tvastra-native-share]');

    if (urlInput) urlInput.value = currentUrl;
    root.querySelectorAll('[data-tvastra-share-channel]').forEach(function (link) {
      setShareHref(link, link.dataset.tvastraShareChannel, title, currentUrl, image);
    });

    if (nativeButton) nativeButton.hidden = typeof navigator.share !== 'function';
  }

  function syncAllShareRoots() {
    document.querySelectorAll(shareRootSelector).forEach(syncShareRoot);
  }

  function fallbackCopy(value) {
    var textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    var copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  }

  function copyShareUrl(button) {
    var root = button.closest(shareRootSelector);
    if (!root) return;

    var input = root.querySelector('[data-tvastra-share-url]');
    var status = root.querySelector('[data-tvastra-share-status]');
    var value = getCurrentUrl();
    if (input) input.value = value;

    var copyPromise = navigator.clipboard && window.isSecureContext
      ? navigator.clipboard.writeText(value)
      : Promise.resolve(fallbackCopy(value));

    copyPromise.then(function () {
      var label = button.querySelector('span');
      if (label) label.textContent = 'Copied';
      if (status) status.textContent = 'Product link copied';
      window.setTimeout(function () {
        if (label) label.textContent = 'Copy';
        if (status) status.textContent = '';
      }, 1800);
    }).catch(function () {
      if (status) status.textContent = fallbackCopy(value) ? 'Product link copied' : 'Unable to copy link';
    });
  }

  function nativeShare(button) {
    var root = button.closest(shareRootSelector);
    if (!root || typeof navigator.share !== 'function') return;

    navigator.share({
      title: getShareTitle(root),
      text: getShareTitle(root),
      url: getCurrentUrl()
    }).catch(function (error) {
      if (error && error.name !== 'AbortError') console.error(error);
    });
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-tvastra-gallery-share] .tvastra-gallery-share__trigger');
    if (trigger) syncAllShareRoots();

    var copyButton = event.target.closest('[data-tvastra-copy-share]');
    if (copyButton) {
      event.preventDefault();
      copyShareUrl(copyButton);
      return;
    }

    var nativeButton = event.target.closest('[data-tvastra-native-share]');
    if (nativeButton) {
      event.preventDefault();
      nativeShare(nativeButton);
    }
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncAllShareRoots);
  } else {
    syncAllShareRoots();
  }

  document.addEventListener('shopify:section:load', syncAllShareRoots);
  window.addEventListener('popstate', syncAllShareRoots);
})();
