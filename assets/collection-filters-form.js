var infinte = '';
var options = {
    rangeSliderMin: '.range-slider-min',
    rangeSliderMax: '.range-slider-max',
};
class CollectionFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.filterData = [];
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);
    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event);
    }, 800);
    this.initPriceRangeSlider();
    this.querySelector('form').addEventListener('input', this.debouncedOnSubmit.bind(this));
    window.addEventListener('popstate', this.onHistoryChange.bind(this));
    this.bindActiveFacetButtonEvents();
    infinte = $(".pegi-product-count").attr("infinite-scroll")
  }

  onSubmitHandler(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target.closest('form'));
    const searchParams = new URLSearchParams(formData).toString();
    this.renderPage(searchParams, event);
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    this.toggleActiveFacets();
    this.renderPage(new URL(event.target.href).searchParams.toString());
  }

  onHistoryChange(event) {
    const searchParams = event.state ? event.state.searchParams : CollectionFiltersForm.searchParamsInitial;
      if (searchParams === CollectionFiltersForm.searchParamsPrev) return;
    this.renderPage(searchParams, null, false);
  }

  toggleActiveFacets(disable = true) {
    document.querySelectorAll('.js-facet-remove').forEach((element) => {
      element.classList.toggle('disabled', disable);
    });
  }

  renderPage(searchParams, event, updateURLHash = true) {
    CollectionFiltersForm.searchParamsPrev = searchParams;
    this.toggleLoader();
    const sections = this.getSections();
    document.getElementById('CollectionProductGrid').querySelector('.collection').classList.add('loading');

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = element => element.url === url;
      this.filterData.some(filterDataUrl) ?
        this.renderSectionFromCache(filterDataUrl, section, event) :
        this.renderSectionFromFetch(url, section, event);
    });
    if (updateURLHash) this.updateURLHash(searchParams);
  }

  renderSectionFromFetch(url, section, event) {
    fetch(url)
      .then(response => response.text())
      .then((responseText) => {
        const html = responseText;
        this.filterData = [...this.filterData, { html, url }];
        this.renderFilters(html, event);
        this.renderProductGrid(html);
        this.destroyTooltips();
        this.initTooltips();
      });
  }

  renderSectionFromCache(filterDataUrl, section, event) {
    const html = this.filterData.find(filterDataUrl).html;
    this.renderFilters(html, event);
    this.renderProductGrid(html);
  }

  renderProductGrid(html) {
    const innerHTML = new DOMParser()
      .parseFromString(html, 'text/html')
      .getElementById('CollectionProductGrid').innerHTML;
    document.getElementById('CollectionProductGrid').innerHTML = innerHTML;
    this.toggleLoader();
    setTimeout(function(){
      var wishlistEvent = new CustomEvent("initialize:wishlist-button");
      document.dispatchEvent(wishlistEvent);
    }, 100);
    window.initSwatchOptionImage();
    $.getScript(window.location.protocol + "//productreviews.shopifycdn.com/embed/loader.js");
    if (infinte == "true") {
      window.infinitescroll();
    }
    else if (infinte == "false") {
      window.loadMore();
    }
    window.updateProductGrid(localStorage.getItem('productGridCols'));
    window.initVariantChanger(document.getElementById('main-collection-product-grid'));
  }

  initTooltips() {
    var productGridTooltips = document.querySelectorAll('#CollectionProductGrid [data-bs-toggle="tooltip"]');
    $.map(productGridTooltips, function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl, {
            trigger: 'hover'
        });
    });
    var collectionFilterTooltips = document.querySelectorAll('#main-collection-filters [data-bs-toggle="tooltip"]');
    $.map(collectionFilterTooltips, function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl, {
            trigger: 'hover'
        });
    });
  }
  destroyTooltips(){
    $('#main-collection-filters [data-bs-toggle="tooltip"]').tooltip('dispose')
  }

  renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');

    const facetDetailsElements = parsedHTML.querySelectorAll('#CollectionFiltersForm .js-filter, #CollectionFiltersFormSorting .js-filter');
    const matchesIndex = (element) => element.dataset.index === event?.target.closest('.js-filter')?.dataset.index
    const facetsToRender = Array.from(facetDetailsElements).filter(element => !matchesIndex(element));
    const countsToRender = Array.from(facetDetailsElements).find(matchesIndex);

    facetsToRender.forEach((element) => {
      document.querySelector(`.js-filter[data-index="${element.dataset.index}"]`).innerHTML = element.innerHTML;
    });

    this.renderActiveFacets(parsedHTML);

    if (countsToRender) this.renderCounts(countsToRender, event.target.closest('.js-filter'));
  }

  renderActiveFacets(html) {
    const activeFacetElementSelectors = ['.active-facets-desktop'];

    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
    })
    this.bindActiveFacetButtonEvents();
    this.initPriceRangeSlider();
    this.toggleActiveFacets(false);
  }

  renderCounts(source, target) {
    const countElementSelectors = ['.count-bubble','.facets__selected'];
    countElementSelectors.forEach((selector) => {
      const targetElement = target.querySelector(selector);
      const sourceElement = source.querySelector(selector);

      if (sourceElement && targetElement) {
        target.querySelector(selector).outerHTML = source.querySelector(selector).outerHTML;
      }
    });
  }

  bindActiveFacetButtonEvents() {
    document.querySelectorAll('.js-facet-remove').forEach((element) => {
      element.addEventListener('click', this.onActiveFilterClick, { once: true });
    });
  }

  updateURLHash(searchParams) {
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
  }

  getSections() {
    return [
      {
        id: 'main-collection-product-grid',
        section: document.getElementById('main-collection-product-grid').dataset.id,
      }
    ]
  }

  initPriceRangeSlider() {
    const price_range = document.querySelector('.price-range');
    const maxRange = document.querySelector(options.rangeSliderMax);
    const minRange = document.querySelector(options.rangeSliderMin);
    const minPrice = document.querySelector('.min-price-range');
    const maxPrice = document.querySelector('.max-price-range');
    var minElement = document.querySelector('.min');
    var maxElement = document.querySelector('.max');
      if (!price_range) return;
      //minprice  on drag
      document.querySelector(options.rangeSliderMin).addEventListener("change", event => {
          const target = event.currentTarget;
          if (Number(maxRange.value) - Number(target.value) >= 1) {
              minPrice.value = Number(target.value);
              minElement.innerHTML = Shopify.formatMoney(minPrice.value*100);
          } else {
              target.value = Number(maxRange.value) - 1;
              minElement.innerHTML = target.value;
          }
          
      document.getElementById('CollectionFiltersForm').dispatchEvent(new Event('input')) 
      }, false);
      // minprice on change
      document.querySelector(options.rangeSliderMin).addEventListener("input", event => {
        const target = event.currentTarget;
         if (Number(maxRange.value) - Number(target.value) >= 1) {
              minElement.innerHTML = Shopify.formatMoney(target.value*100);
          } 
        target.closest(".price-range").style.setProperty('--range-from', minRange.value / Number(target.getAttribute('max')) * 100 + '%');
        }, false);
      // maxprice on drag
      document.querySelector(options.rangeSliderMax).addEventListener("change", event => {
          const target = event.currentTarget;
          if (target.value - minRange.value >= 1) {
              maxPrice.value = target.value;
              maxElement.innerHTML = Shopify.formatMoney(maxPrice.value*100);
          } else {
              target.value = Number(minRange.value) + Number(1);
              maxElement.innerHTML = target.value;
          }
          document.getElementById('CollectionFiltersForm').dispatchEvent(new Event('input')) 

      }, false); 
      // maxprice on change    
      document.querySelector(options.rangeSliderMax).addEventListener("input", event => {
        const target = event.currentTarget;
         if (target.value - minRange.value >= 1) {
              maxElement.innerHTML = Shopify.formatMoney(target.value*100);
          }
        target.closest(".price-range").style.setProperty('--range-to', maxRange.value / Number(target.getAttribute('max')) * 100 + '%');
        }, false); 
  }

  toggleLoader() {
    document.querySelector('.loading-wrapper.loading-box').classList.toggle('hidden');
  }
}

customElements.define('collection-filters-form', CollectionFiltersForm);

CollectionFiltersForm.searchParamsInitial = window.location.search.slice(1);
CollectionFiltersForm.searchParamsPrev = window.location.search.slice(1);

class PriceRange extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll('input')
      .forEach(element => element.addEventListener('change', this.onRangeChange.bind(this)));

    this.setMinAndMaxValues();
  }

  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget);
    this.setMinAndMaxValues();
  }

  setMinAndMaxValues() {
    const inputs = this.querySelectorAll('input');
    const minInput = inputs[0];
    const maxInput = inputs[1];
    if (maxInput.value) minInput.setAttribute('max', maxInput.value);
    if (minInput.value) maxInput.setAttribute('min', minInput.value);
    if (minInput.value === '') maxInput.setAttribute('min', 0);
    if (maxInput.value === '') minInput.setAttribute('max', maxInput.getAttribute('max'));
  }

  adjustToValidValues(input) {
    const value = Number(input.value);
    const min = Number(input.getAttribute('min'));
    const max = Number(input.getAttribute('max'));

    if (value < min) input.value = min;
    if (value > max) input.value = max;
  }
}

customElements.define('price-range', PriceRange);
