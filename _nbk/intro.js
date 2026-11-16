/*! NBK Projects — intro (bez zależności). Dołączenie:
 *  <link rel="stylesheet" href="_nbk/intro.css"><script src="_nbk/intro.js" defer></script>
 *  Raz na sesję (sessionStorage), ?intro=1 wymusza pokazanie.
 *  Po zakończeniu: element usunięty z DOM, na document zdarzenie "nbk:intro-koniec".
 *  Plik generowany z logo-v3/final/src/intro.template.js (node logo-v3/final/src/intro-build.js).
 */
(function () {
  'use strict';

  var KEY = 'nbk-intro-widziane';
  var d = document;
  var html = d.documentElement;

  var force = /[?&]intro=1(?:&|#|$)/.test(location.search);
  var store = null;
  try { store = window.sessionStorage; } catch (e) { /* tryb prywatny / zablokowane */ }
  if (!force) {
    try { if (store && store.getItem(KEY)) return; } catch (e) { /* pokaż */ }
  }

  var NBK = "<svg class=\"nbk-i__nbk\" viewBox=\"-2 -2 339 104\" focusable=\"false\"><g fill=\"#fff\" fill-rule=\"evenodd\"><g class=\"l l-n\" transform=\"translate(0,0)\"><path class=\"f-fill\" d=\"M0,100 V0 H36 L78,62 V0 H108 V100 H72 L30,38 V100 Z\"/><path class=\"d-line\" pathLength=\"1\" d=\"M0,100 V0 H36 L78,62 V0 H108 V100 H72 L30,38 V100 Z\"/></g><g class=\"l l-b\" transform=\"translate(121,0)\"><path class=\"f-fill\" d=\"M0,0 H66.5 A25.5,25.5 0 0 1 81.91,45.81 A28,28 0 0 1 72,100 H0 Z M30,21 H55 A9,9 0 0 1 55,39 H30 Z M30,57 H59.5 A10.5,10.5 0 0 1 59.5,78 H30 Z\"/><path class=\"d-line\" pathLength=\"1\" d=\"M0,0 H66.5 A25.5,25.5 0 0 1 81.91,45.81 A28,28 0 0 1 72,100 H0 Z\"/><path class=\"d-line\" pathLength=\"1\" d=\"M30,21 H55 A9,9 0 0 1 55,39 H30 Z\"/><path class=\"d-line\" pathLength=\"1\" d=\"M30,57 H59.5 A10.5,10.5 0 0 1 59.5,78 H30 Z\"/></g><g class=\"l l-k\" transform=\"translate(231,0)\"><path class=\"f-fill\" d=\"M0,0 H30 V100 H0 Z\"/><path class=\"d-line\" pathLength=\"1\" d=\"M0,0 H30 V100 H0 Z\"/><g class=\"k-chev\"><path class=\"f-fill\" d=\"M70,0 H104 L71,50 L104,100 H70 L37,50 Z\"/><path class=\"d-line\" pathLength=\"1\" d=\"M70,0 H104 L71,50 L104,100 H70 L37,50 Z\"/></g></g></g></svg>";
  var PROJ = "<svg class=\"nbk-i__proj\" viewBox=\"-2 -14 339 64\" focusable=\"false\"><g fill=\"none\" stroke=\"#fff\" stroke-width=\"4.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path transform=\"translate(2.3,0)\" d=\"M0,1.5 V45 M0,15 A13.5,13.5 0 1 1 27,15 A13.5,13.5 0 1 1 0,15\"/><path transform=\"translate(53.64,0)\" d=\"M0,1.5 V28.5 M0,13 C0,6 5,1.5 14,1.5\"/><path transform=\"translate(91.99,0)\" d=\"M0,15 A13.5,13.5 0 1 1 27,15 A13.5,13.5 0 1 1 0,15\"/><path transform=\"translate(143.33,0)\" d=\"M5,1.5 V40 C5,45 2,47 -3,47\"/><path transform=\"translate(172.67,0)\" d=\"M0.5,15 H26.5 A13.5,13.5 0 1 0 23.6,23.7\"/><path transform=\"translate(224.01,0)\" d=\"M23.6,6.3 A13.5,13.5 0 1 0 23.6,23.7\"/><path transform=\"translate(273.36,0)\" d=\"M4,-8 V23 C4,27 6.5,28.5 12,28.5 M-1,1.5 H13\"/><path transform=\"translate(311.7,0)\" d=\"M20,4.5 C17.5,2.4 14.5,1.5 11,1.5 C5.5,1.5 2,4 2,8 C2,12.5 6,13.7 10.5,14.8 C15.5,16 19.5,17.5 19.5,22 C19.5,26.3 15.6,28.5 10.5,28.5 C6.5,28.5 3,27.2 0.5,25\"/></g><circle cx=\"148.33\" cy=\"-9\" r=\"2.85\" fill=\"#fff\"/></svg>";

  function start() {
    if (d.getElementById('nbk-intro')) return;

    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    // oś czasu (ms): całość 2400, wyjście 500 / skrót: 1000 i 300
    var TOTAL = reduce ? 1000 : 2400;
    var OUT = reduce ? 300 : 500;
    var OUT_FAST = reduce ? 200 : 380;

    var el = d.createElement('div');
    el.id = 'nbk-intro';
    el.className = 'nbk-i' + (reduce ? ' is-reduce' : '');
    el.innerHTML =
      '<div class="nbk-i__stage" aria-hidden="true">' +
        '<p class="nbk-i__cap">Strona wykonana przez</p>' +
        '<div class="nbk-i__word">' + NBK + PROJ + '</div>' +
      '</div>' +
      '<p class="nbk-i__sr" role="status"></p>' +
      '<button type="button" class="nbk-i__skip">Pomiń<span class="nbk-i__sr"> intro</span></button>';

    // blokada przewijania tylko na czas intro — bez przeskoku układu (rezerwa na pasek przewijania)
    var prev = { o: html.style.overflow, g: html.style.scrollbarGutter };
    var sbw = window.innerWidth - html.clientWidth;
    if (sbw > 0) html.style.scrollbarGutter = 'stable';
    html.style.overflow = 'hidden';

    // na początek body: przycisk „Pomiń” jest pierwszym elementem w kolejności Tab
    d.body.insertBefore(el, d.body.firstChild);
    try { if (store) store.setItem(KEY, '1'); } catch (e) { /* bez zapamiętania */ }

    var sr = el.querySelector('[role="status"]');
    setTimeout(function () { sr.textContent = 'Strona wykonana przez NBK Projects.'; }, 60);

    var leaving = false;
    var timer = setTimeout(function () { leave(false); }, TOTAL - OUT);

    function leave(fast) {
      if (leaving) return;
      leaving = true;
      clearTimeout(timer);
      el.className += ' is-out' + (fast ? ' is-fast' : '');
      setTimeout(done, fast ? OUT_FAST : OUT);
    }

    function done() {
      var hadFocus = el.contains(d.activeElement);
      d.removeEventListener('keydown', onKey, true);
      if (el.parentNode) el.parentNode.removeChild(el);
      html.style.overflow = prev.o;
      html.style.scrollbarGutter = prev.g;
      if (hadFocus && d.activeElement && d.activeElement.blur) d.activeElement.blur();
      var ev;
      try { ev = new CustomEvent('nbk:intro-koniec'); } catch (e) { ev = d.createEvent('Event'); ev.initEvent('nbk:intro-koniec', false, false); }
      d.dispatchEvent(ev);
    }

    function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) { e.preventDefault(); leave(true); }
    }
    function stop(e) { e.preventDefault(); }

    d.addEventListener('keydown', onKey, true);
    el.addEventListener('click', function () { leave(true); });
    el.addEventListener('touchmove', stop, { passive: false });
    el.addEventListener('wheel', stop, { passive: false });
  }

  if (d.body) start();
  else d.addEventListener('DOMContentLoaded', start);
})();
