/* karuzele.js (NBK Projects): karty w poziomych paskach przewijanych palcem pokazują się od razu, bez animacji wejścia.
   Bez tego wystająca krawędź następnej karty bywa pusta, bo animacja czeka, aż karta „wejdzie” w ekran. */
(function () {
  var wzor = /reveal|anim|fade|appear|pokaz|wejscie/i;
  function napraw() {
    var wszystko = document.querySelectorAll('body *');
    for (var i = 0; i < wszystko.length; i++) {
      var el = wszystko[i];
      var cs = getComputedStyle(el);
      if (!/(auto|scroll)/.test(cs.overflowX) || el.scrollWidth <= el.clientWidth + 4) continue;
      var dzieci = el.querySelectorAll('*');
      for (var j = 0; j < dzieci.length; j++) {
        var d = dzieci[j];
        if (wzor.test(String(d.className && d.className.baseVal !== undefined ? d.className.baseVal : d.className))) {
          d.style.setProperty('opacity', '1', 'important');
          d.style.setProperty('transform', 'none', 'important');
          d.style.setProperty('transition', 'none', 'important');
        }
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(napraw, 50); });
  else setTimeout(napraw, 50);
  window.addEventListener('load', napraw);
  window.addEventListener('resize', napraw);
})();
