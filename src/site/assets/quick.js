// Quick search: Ctrl/⌘-K or / opens a dialog with a combobox. Without script the header's form goes to /search.
(function () {
  'use strict';
  var dialog = document.getElementById('quick');
  var input = document.getElementById('quick-input');
  var list = document.getElementById('quick-options');
  if (!dialog || !input || !list || typeof dialog.showModal !== 'function') return;
  var cache = new Map();
  var timer = 0;
  var controller = null;
  var options = [];
  var active = -1;

  function typing(el) {
    if (!el) return false;
    var tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  function open() {
    if (dialog.open) return;
    dialog.showModal();
    input.focus();
    input.select();
  }

  document.addEventListener('keydown', function (e) {
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      open();
    } else if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !typing(e.target)) {
      e.preventDefault();
      open();
    }
  });

  function setActive(i) {
    active = i;
    options.forEach(function (o, n) { o.setAttribute('aria-selected', n === i ? 'true' : 'false'); });
    if (i >= 0 && options[i]) {
      input.setAttribute('aria-activedescendant', options[i].id);
      options[i].scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function option(href, main, side) {
    var li = el('li');
    li.setAttribute('role', 'option');
    li.id = 'quick-opt-' + options.length;
    li.dataset.href = href;
    li.appendChild(el('span', 'main', main));
    li.appendChild(el('span', 'num', side));
    li.addEventListener('mousedown', function (e) { e.preventDefault(); location.href = href; });
    options.push(li);
    return li;
  }

  function group(title) {
    var li = el('li', 'group', title);
    li.setAttribute('role', 'presentation');
    return li;
  }

  function show(data) {
    list.textContent = '';
    options = [];
    if (data.lists.length) {
      list.appendChild(group('Lists'));
      data.lists.forEach(function (l) { list.appendChild(option('/lists/' + l.slug, l.name, l.items + ' items')); });
    }
    if (data.items.length) {
      list.appendChild(group('Items'));
      data.items.forEach(function (i) {
        list.appendChild(option('/' + i.key, i.name + ' · ' + i.sub + (i.status === 'archived' || i.status === 'gone' ? ' · ' + i.status : ''),
          i.lists + (i.lists === 1 ? ' list' : ' lists')));
      });
    }
    if (data.tags.length) {
      list.appendChild(group('Tags'));
      data.tags.forEach(function (t) { list.appendChild(option(t.href, t.label, String(t.count))); });
    }
    input.setAttribute('aria-expanded', options.length ? 'true' : 'false');
    setActive(-1);
  }

  function ask(q) {
    if (cache.has(q)) { show(cache.get(q)); return; }
    if (controller) controller.abort();
    controller = new AbortController();
    fetch('/api/quick?q=' + encodeURIComponent(q), { signal: controller.signal })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        cache.set(q, data);
        if (input.value.trim() === q) show(data);
      })
      .catch(function () { /* cancelled or offline: the form still works */ });
  }

  input.addEventListener('input', function () {
    clearTimeout(timer);
    var q = input.value.trim();
    if (q.length < 2 || q.length > 64) { show({ lists: [], items: [], tags: [] }); return; }
    timer = setTimeout(function () { ask(q); }, 120);
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (options.length) setActive((active + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (options.length) setActive(active <= 0 ? options.length - 1 : active - 1);
    } else if (e.key === 'Enter' && active >= 0 && options[active]) {
      e.preventDefault();
      location.href = options[active].dataset.href;
    }
  });

  dialog.addEventListener('close', function () {
    if (controller) controller.abort();
    setActive(-1);
  });
})();
