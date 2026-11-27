// Quick search: Ctrl/⌘-K or / (on a phone, a tap on the header's search field) opens a dialog with a combobox. Without script the header's form goes to /search.
// The words come from data-* attributes the server wrote in the page's language; numbers follow <html lang>;
// links keep the page's language prefix (data-prefix on <html>). Below: the suggestion of a better language.
(function () {
  'use strict';
  var root = document.documentElement;
  var prefix = root.getAttribute('data-prefix') || '';
  var lang = root.lang || 'en';

  function num(n) {
    try { return n.toLocaleString(lang); } catch { return String(n); }
  }

  /** A plural from a data attribute holding {"one": "{n} list", "other": "{n} lists", …}. */
  function plural(json, n) {
    var forms = {};
    try { forms = JSON.parse(json || '{}'); } catch { /* the English below */ }
    var cat = 'other';
    try { cat = new Intl.PluralRules(lang).select(n); } catch { /* other */ }
    return (forms[cat] || forms.other || '{n}').replace('{n}', num(n));
  }

  function local(href) {
    return href.charAt(0) === '/' && href.charAt(1) !== '/' ? prefix + href : href;
  }

  suggest();

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

  // On a phone there is no key to press: the header's search field opens the dialog when it is tapped.
  var field = document.querySelector('.top-search input');
  if (field && window.matchMedia) {
    field.addEventListener('focus', function () {
      if (!window.matchMedia('(max-width: 40rem)').matches) return;
      field.blur();
      input.value = field.value;
      open();
    });
  }

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
    var d = dialog.dataset;
    if (data.lists.length) {
      list.appendChild(group(d.lists || 'Lists'));
      data.lists.forEach(function (l) { list.appendChild(option(local('/lists/' + l.slug), l.name, plural(d.nItems, l.items))); });
    }
    if (data.items.length) {
      list.appendChild(group(d.items || 'Items'));
      data.items.forEach(function (i) {
        list.appendChild(option(local('/' + i.key), i.name + ' · ' + i.sub + (i.status === 'archived' || i.status === 'gone' ? ' · ' + i.status : ''),
          plural(d.nLists, i.lists)));
      });
    }
    if (data.tags.length) {
      list.appendChild(group(d.tags || 'Tags'));
      data.tags.forEach(function (t) { list.appendChild(option(local(t.href), t.label, num(t.count))); });
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

  // A tap beside the dialog closes it: on a phone there is no Esc. The form fills the dialog, so only its
  // backdrop is the dialog itself.
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', function () {
    if (controller) controller.abort();
    setActive(-1);
  });

  /**
   * When the browser prefers a language the page is not in, a one-line bar offers the same page in it, until it
   * is closed (remembered in localStorage). The sentence is on the switcher's link (data-suggest); without script
   * or storage there is no bar, and the switcher in the footer is always there.
   */
  function suggest() {
    var links = Array.prototype.slice.call(document.querySelectorAll('nav.langs a[hreflang]'));
    var key = 'lang-suggest-closed';
    var closed;
    try { closed = localStorage.getItem(key); } catch { return; }
    if (closed || !navigator.languages) return;
    var here = (lang.split('-')[0] || '').toLowerCase();
    var best = null;
    for (var i = 0; i < navigator.languages.length && !best; i++) {
      var want = String(navigator.languages[i]).split('-')[0].toLowerCase();
      if (want === here) return;
      for (var j = 0; j < links.length; j++) {
        if ((links[j].getAttribute('hreflang') || '').split('-')[0].toLowerCase() === want) { best = links[j]; break; }
      }
    }
    if (!best || !best.dataset.suggest) return;
    var bar = document.createElement('p');
    bar.className = 'lang-bar';
    bar.lang = best.lang;
    var a = document.createElement('a');
    a.href = best.getAttribute('href');
    a.hreflang = best.getAttribute('hreflang');
    a.textContent = best.dataset.suggest;
    var close = document.createElement('button');
    close.type = 'button';
    close.textContent = '×';
    close.setAttribute('aria-label', best.dataset.close || 'Close');
    close.addEventListener('click', function () {
      try { localStorage.setItem(key, '1'); } catch { /* the bar still goes */ }
      bar.remove();
    });
    bar.appendChild(a);
    bar.appendChild(close);
    var header = document.querySelector('header.top');
    if (header && header.parentNode) header.parentNode.insertBefore(bar, header.nextSibling);
  }
})();
