(function () {
  'use strict';
  var controls = document.querySelectorAll('[data-filter]');
  var items = document.querySelectorAll('.boutique-product[data-universe]');
  var counter = document.getElementById('boutique-count');
  controls.forEach(function (button) {
    button.addEventListener('click', function () {
      var hrpcOnly = button.dataset.filter === 'hrpc';
      var visible = 0;
      controls.forEach(function (control) {
        control.setAttribute('aria-pressed', String(control === button));
      });
      items.forEach(function (item) {
        item.hidden = hrpcOnly && item.dataset.universe.indexOf('HRPC') === -1;
        if (!item.hidden) visible++;
      });
      counter.textContent = visible + ' pièces' + (hrpcOnly ? ' avec le HRPC' : '');
    });
  });
})();
