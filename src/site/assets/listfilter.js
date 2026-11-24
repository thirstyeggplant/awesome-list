// The filter of a list page: hides rows and empty sections that do not match, says "N of M", writes #q=.
(function () {
  'use strict';
  var input = document.getElementById('list-filter');
  var count = document.getElementById('list-count');
  var entries = document.getElementById('entries');
  var collapse = document.getElementById('collapse-all');
  if (!input || !entries) return;
  var rows = Array.prototype.slice.call(entries.querySelectorAll('li.row'));
  var texts = rows.map(function (r) { return r.textContent.toLowerCase(); });
  var blocks = Array.prototype.slice.call(entries.children);
  var total = rows.length;
  var timer = 0;

  function apply(q) {
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    var shown = 0;
    rows.forEach(function (r, i) {
      var ok = words.every(function (w) { return texts[i].indexOf(w) !== -1; });
      r.hidden = !ok;
      if (ok) shown++;
    });
    // A section is hidden when none of its rows is shown; a heading above sections when none below it is.
    blocks.forEach(function (b) {
      if (b.tagName === 'SECTION') b.hidden = words.length > 0 && b.querySelector('li.row:not([hidden])') === null;
    });
    blocks.forEach(function (b, i) {
      if (b.tagName === 'SECTION') return;
      var depth = Number(b.getAttribute('data-depth')) || 0;
      var visible = false;
      for (var j = i + 1; j < blocks.length; j++) {
        var n = blocks[j];
        if ((Number(n.getAttribute('data-depth')) || 0) <= depth) break;
        if (n.tagName === 'SECTION' && !n.hidden) { visible = true; break; }
      }
      b.hidden = !visible;
    });
    if (count) count.textContent = shown.toLocaleString('en-US') + ' of ' + total.toLocaleString('en-US');
    var hash = q ? '#q=' + encodeURIComponent(q) : '';
    if (location.hash !== hash && (q || location.hash.indexOf('#q=') === 0)) {
      history.replaceState(null, '', location.pathname + location.search + hash);
    }
  }

  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () { apply(input.value.trim()); }, 80);
  });

  if (location.hash.indexOf('#q=') === 0) {
    input.value = decodeURIComponent(location.hash.slice(3));
    apply(input.value.trim());
  }

  if (collapse) {
    collapse.addEventListener('click', function () {
      var on = document.body.classList.toggle('collapsed');
      collapse.textContent = on ? 'Expand all' : 'Collapse all';
    });
  }
})();
