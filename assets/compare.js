  window.initCompareTable = function() {
    var tableRows = [
      {'key': 'image', 'label': ''},
      {'key': 'price', 'label': 'Price'},
      {'key': 'rating', 'label': 'Rating'},
      {'key': 'vendor', 'label': 'Brand'},
      {'key': 'availability', 'label': 'Availability'},
      {'key': 'type', 'label': 'Type'},
      {'key': 'options', 'label': ''},
      {'key': 'addtocart_btn', 'label': ''},
    ];

    var tableHtml = '';
    var compareTable = document.querySelector('[data-table="compare-items"]') || false;
    var compareItems = localStorage.getItem('hongoCompareItems') || false;
    if (compareItems && compareTable) {
      compareItems = compareItems.split(',');
      var requests = compareItems.map(function (handle) {
        if (handle == '') return;
        var fetchUrl = '/products/' + handle + '?view=compare';
        return fetch(fetchUrl).then(function (res) {
            return res.status === 200 ? res.json() : '';
        });
      });
      var options = [];
      Promise.all(requests).then(function (responses) {
        const filteredResponse = responses.filter(function (el) {
          return el != "";
        });
        if (filteredResponse.length) {
          filteredResponse.forEach(function(filteredResponseItem) {
            const productOptions = filteredResponseItem['product_options'];
            for (const key in productOptions) {
              if (options.indexOf(key) === -1) {
                options.push(key);
              }
            }
          });
          tableHtml += '<div class="compare-table-left">';
            tableHtml += '<table class="table compare-table text-center">';
              tableHtml += '<tbody>';
                tableRows.forEach(function(tableRow) {
                  if (tableRow.key == 'options') {
                    if (options.length) {
                      options.forEach(function(option) {
                        tableHtml += '<tr>';
                          tableHtml += '<td><label>'+option+'</label></td>';
                        tableHtml += '</tr>';
                      });
                    }
                  } else {
                    tableHtml += '<tr>';
                      if (tableRow.key != 'image') {
                        tableHtml += '<td><label>'+tableRow.label+'</label></td>';
                      } else {
                        tableHtml += '<td></td>';
                      }
                    tableHtml += '</tr>';
                  }
                });
              tableHtml += '</tbody>';
            tableHtml += '</table>';
          tableHtml += '</div>';
          tableHtml += '<div class="compare-table-right">';
            tableHtml += '<table class="table compare-table text-center">';
              tableHtml += '<tbody>';
                tableRows.forEach(function(tableRow) {
                  if (tableRow.key == 'options') {
                    if (options.length) {
                      options.forEach(function(option) {
                        tableHtml += '<tr>';
                          filteredResponse.forEach(function (filteredResponseItem) {
                            tableHtml += '<td>';
                            const productOptions = filteredResponseItem['product_options'];
                            if (productOptions.hasOwnProperty(option)){
                              tableHtml += productOptions[option];
                            } else {
                              tableHtml += '<i class="bi bi-dash-lg"></i>';
                            }
                            tableHtml += '</td>';
                          });
                        tableHtml += '</tr>';
                      });
                    }
                  } else {
                    tableHtml += '<tr>';
                      filteredResponse.forEach(function (filteredResponseItem) {
                        tableHtml += '<td>';
                        if (tableRow.key == 'rating') {
                          tableHtml += '<span class="shopify-product-reviews-badge" data-id="'+filteredResponseItem['id']+'">';
                        } else {
                          tableHtml += filteredResponseItem[tableRow.key]
                        }
                        tableHtml += '</td>';
                      });
                    tableHtml += '</tr>';
                  }
                });
              tableHtml += '</tbody>';
            tableHtml += '</table>';
          tableHtml += '</div>';
          compareTable.innerHTML = tableHtml;
          jQuery.getScript(window.location.protocol + "//productreviews.shopifycdn.com/assets/v4/spr.js");
        } else {
          tableHtml = '<table class="table compare-table text-center compare-empty"><tr><td><div class="w-100 alert alert-warning">You have no items to compare. <a href="/collections/all">Back to shopping</a></div></td><tr></table>';
          compareTable.innerHTML = tableHtml;
        }
      });
    } else {
      tableHtml = '<table class="table compare-table text-center compare-empty"><tr><td><div class="w-100 alert alert-warning">You have no items to compare. <a href="/collections/all">Back to shopping</a></div></td><tr></table>';
      compareTable.innerHTML = tableHtml;
    }
  }
  window.initCompareTable();