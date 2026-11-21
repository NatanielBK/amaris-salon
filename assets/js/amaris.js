/* Amaris – zachowania strony (bez zależności) */
(function () {
  'use strict';
  var d = document, root = d.documentElement, body = d.body;
  var ruchOk = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll zawsze od góry (bez hasha) ----------
     Problem: po kliknięciu w link prowadzący do strony, która jest już w historii sesji
     (np. logo "Amaris" → index.html), WebKit/Safari dociąga dokument do wcześniej zapamiętanej
     pozycji scrolla tej samej strony – w kilku ratach, w miarę jak rośnie wysokość dokumentu
     (obrazki/fonty się dociągają) – mimo ustawienia scrollRestoration='manual' i mimo że to nie
     jest powrót z bfcache (pageshow.persisted=false). Dlatego oprócz wyłączenia automatycznego
     przywracania wymuszamy 0 w pętli rAF, aż dokument przestanie rosnąć i restoracja ustanie. */
  function wymusGore() {
    if (location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    var bezZmian = 0, poprzedniaWysokosc = 0, koniec = Date.now() + 1200;
    (function pilnujGory() {
      if (window.scrollY > 0) { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); bezZmian = 0; }
      var wysokosc = d.documentElement.scrollHeight;
      if (wysokosc === poprzedniaWysokosc) bezZmian++; else { bezZmian = 0; poprzedniaWysokosc = wysokosc; }
      if (Date.now() < koniec && bezZmian < 6) window.requestAnimationFrame(pilnujGory);
    })();
  }
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  wymusGore();
  window.addEventListener('pageshow', function (e) { if (e.persisted) wymusGore(); });

  /* ---------- Nagłówek: tło i cień po przewinięciu ---------- */
  var naglowek = d.querySelector('.naglowek');
  function naScroll() {
    if (naglowek) naglowek.classList.toggle('przewiniety', window.scrollY > 8);
  }
  window.addEventListener('scroll', naScroll, { passive: true });
  naScroll();

  /* ---------- Menu mobilne: Esc, pułapka fokusu, blokada przewijania ---------- */
  var menu = d.getElementById('menu');
  var otworz = d.querySelector('[data-menu-otworz]');
  var ostatniFokus = null;
  function fokusowalne() {
    return Array.prototype.filter.call(
      menu.querySelectorAll('a[href], button:not([disabled])'),
      function (el) { return el.offsetParent !== null || el === d.activeElement; }
    );
  }
  function zamknijMenu(oddajFokus) {
    if (!menu.classList.contains('otwarte')) return;
    menu.classList.remove('otwarte');
    menu.setAttribute('aria-hidden', 'true');
    menu.inert = true;
    body.classList.remove('menu-otwarte');
    otworz.setAttribute('aria-expanded', 'false');
    if (oddajFokus !== false && ostatniFokus) ostatniFokus.focus();
  }
  function otworzMenu() {
    ostatniFokus = d.activeElement;
    menu.inert = false;
    menu.classList.add('otwarte');
    menu.setAttribute('aria-hidden', 'false');
    body.classList.add('menu-otwarte');
    otworz.setAttribute('aria-expanded', 'true');
    var zam = menu.querySelector('[data-menu-zamknij]');
    if (zam) zam.focus();
  }
  if (menu && otworz) {
    menu.inert = true;
    otworz.addEventListener('click', otworzMenu);
    menu.querySelectorAll('[data-menu-zamknij]').forEach(function (b) {
      b.addEventListener('click', function () { zamknijMenu(); });
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { zamknijMenu(false); });
    });
    d.addEventListener('keydown', function (e) {
      if (!menu.classList.contains('otwarte')) return;
      if (e.key === 'Escape') { e.preventDefault(); zamknijMenu(); return; }
      if (e.key !== 'Tab') return;
      var el = fokusowalne();
      if (!el.length) return;
      var pierwszy = el[0], ostatni = el[el.length - 1];
      if (e.shiftKey && d.activeElement === pierwszy) { e.preventDefault(); ostatni.focus(); }
      else if (!e.shiftKey && d.activeElement === ostatni) { e.preventDefault(); pierwszy.focus(); }
    });
    window.matchMedia('(min-width: 980px)').addEventListener('change', function (m) {
      if (m.matches) zamknijMenu(false);
    });
  }

  /* ---------- Logo: na stronie głównej płynny scroll na górę zamiast przeładowania ---------- */
  function znormalizuj(sciezka) { return sciezka.replace(/index\.html$/, '').replace(/\/+$/, '/'); }
  d.querySelectorAll('a.logo').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var tu = new URL(a.href, location.href);
      if (znormalizuj(tu.pathname) === znormalizuj(location.pathname) && !tu.hash) {
        e.preventDefault();
        if (menu && otworz) zamknijMenu(false);
        window.scrollTo({ top: 0, behavior: ruchOk ? 'smooth' : 'auto' });
      }
    });
  });

  /* ---------- Status otwarcia (czas w Polsce) ---------- */
  // pn–pt 10:00–18:00; sobota (wybrane) i niedziela mają własne, stałe komunikaty –
  // nigdy nie twierdzimy, że w sobotę jest na pewno otwarte.
  var OTWIERA = 600, ZAMYKA = 1080; // 10:00 / 18:00 w minutach
  function hhmm(m) { return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); }
  function teraz() {
    try {
      var cz = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      var o = {}; cz.forEach(function (p) { o[p.type] = p.value; });
      var dni = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { dzien: dni[o.weekday], min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
    } catch (e) {
      var n = new Date(); return { dzien: n.getDay(), min: n.getHours() * 60 + n.getMinutes() };
    }
  }
  function status() {
    var t = teraz();
    if (t.dzien === 6) {
      if (t.min < 840) return { stan: 'sobota', tekst: 'Wybrane soboty 9:00–14:00 · zadzwoń, by potwierdzić' };
      return { stan: 'zamkniete', tekst: 'Zamknięte · otwieramy w poniedziałek o 10:00' };
    }
    if (t.dzien === 0) return { stan: 'zamkniete', tekst: 'Zamknięte · otwieramy w poniedziałek o 10:00' };
    if (t.min >= OTWIERA && t.min < ZAMYKA) return { stan: 'otwarte', tekst: 'Otwarte do ' + hhmm(ZAMYKA) };
    if (t.min < OTWIERA) return { stan: 'zamkniete', tekst: 'Zamknięte · otwieramy dziś o ' + hhmm(OTWIERA) };
    if (t.dzien === 5) return { stan: 'zamkniete', tekst: 'Zamknięte · jutro wybrane soboty 9:00–14:00, zadzwoń' };
    return { stan: 'zamkniete', tekst: 'Zamknięte · otwieramy jutro o 10:00' };
  }
  function odswiezStatus() {
    var s = status();
    d.querySelectorAll('[data-status]').forEach(function (el) {
      el.setAttribute('data-stan', s.stan);
      var t = el.querySelector('.status__tekst');
      if (t) t.textContent = s.tekst;
    });
    var dzis = teraz().dzien;
    d.querySelectorAll('.godziny tr[data-dzien]').forEach(function (tr) {
      tr.classList.toggle('dzis', +tr.getAttribute('data-dzien') === dzis);
    });
  }
  odswiezStatus();
  setInterval(odswiezStatus, 60000);

  /* ---------- Dolny pasek z telefonem (tylko telefon/tablet) ---------- */
  var pasek = d.querySelector('.pasek');
  if (pasek) {
    var start = d.querySelector('[data-start-cta]');
    var stopka = d.querySelector('.stopka');
    var startWidoczny = !!start, stopkaWidoczna = false;
    var ustaw = function () {
      var pokaz = !startWidoczny && !stopkaWidoczna && (start || window.scrollY > 240);
      pasek.classList.toggle('widoczny', !!pokaz);
    };
    if ('IntersectionObserver' in window) {
      if (start) new IntersectionObserver(function (w) { startWidoczny = w[0].isIntersecting; ustaw(); }).observe(start);
      if (stopka) new IntersectionObserver(function (w) { stopkaWidoczna = w[0].isIntersecting; ustaw(); }, { rootMargin: '0px 0px -40% 0px' }).observe(stopka);
    }
    if (!start) window.addEventListener('scroll', ustaw, { passive: true });
    ustaw();
  }

  /* ---------- Pojawianie się sekcji (tylko opacity, jednorazowo) ---------- */
  var reveal = d.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && ruchOk) {
    var io = new IntersectionObserver(function (wpisy) {
      wpisy.forEach(function (w) {
        if (w.isIntersecting) { w.target.classList.add('widoczne'); io.unobserve(w.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    reveal.forEach(function (el) { io.observe(el); });
  } else {
    reveal.forEach(function (el) { el.classList.add('widoczne'); });
  }

  /* ---------- Slider opinii ----------
     Aktywna (licząca się w liczniku) jest karta, której środek jest najbliżej środka toru. Skrajne
     karty da się dośrodkować dzięki niewidocznym elementom-wypełniaczom na początku i końcu listy
     (.slider__wypelniacz w CSS/HTML) – dzięki temu tu nie trzeba liczyć żadnego paddingu w JS. */
  d.querySelectorAll('[data-slider]').forEach(function (s) {
    var tor = s.querySelector('.slider__tor');
    var karty = Array.prototype.slice.call(tor.querySelectorAll('.opinia'));
    var wstecz = s.querySelector('[data-wstecz]');
    var dalej = s.querySelector('[data-dalej]');
    var licznik = s.querySelector('.slider__licznik');
    function aktywnaKarta() {
      var srodek = tor.getBoundingClientRect().left + tor.clientWidth / 2;
      var nr = 0, min = Infinity;
      karty.forEach(function (k, i) {
        var r = k.getBoundingClientRect();
        var odleglosc = Math.abs((r.left + r.width / 2) - srodek);
        if (odleglosc < min) { min = odleglosc; nr = i; }
      });
      return nr;
    }
    function aktualizuj() {
      var max = tor.scrollWidth - tor.clientWidth;
      s.classList.toggle('bez-przewijania', max < 4);
      var nr = aktywnaKarta();
      wstecz.disabled = nr <= 0;
      dalej.disabled = nr >= karty.length - 1;
      karty.forEach(function (k, i) { k.classList.toggle('opinia--aktywna', i === nr); });
      if (licznik) licznik.textContent = (nr + 1) + ' / ' + karty.length;
    }
    function przesunDo(indeks) {
      indeks = Math.max(0, Math.min(karty.length - 1, indeks));
      karty[indeks].scrollIntoView({ inline: 'center', block: 'nearest', behavior: ruchOk ? 'smooth' : 'auto' });
    }
    wstecz.addEventListener('click', function () { przesunDo(aktywnaKarta() - 1); });
    dalej.addEventListener('click', function () { przesunDo(aktywnaKarta() + 1); });
    tor.addEventListener('scroll', function () { window.requestAnimationFrame(aktualizuj); }, { passive: true });
    window.addEventListener('resize', aktualizuj);
    if (karty.length > 1) przesunDo(1); /* start od karty 2, na środku */
    aktualizuj();
    window.addEventListener('load', aktualizuj);
  });

  /* ---------- Zakładki zabiegów ---------- */
  var lista = d.querySelector('[role="tablist"]');
  if (lista) {
    var zakladki = Array.prototype.slice.call(lista.querySelectorAll('[role="tab"]'));
    var pokaz = function (z, fokus, zapiszHash) {
      zakladki.forEach(function (x) {
        var wyb = x === z;
        x.setAttribute('aria-selected', wyb ? 'true' : 'false');
        x.tabIndex = wyb ? 0 : -1;
        d.getElementById(x.getAttribute('aria-controls')).hidden = !wyb;
      });
      if (fokus) z.focus();
      if (zapiszHash && history.replaceState) history.replaceState(null, '', '#' + z.getAttribute('data-hash'));
    };
    zakladki.forEach(function (z, i) {
      z.addEventListener('click', function () { pokaz(z, false, true); });
      z.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = zakladki[(i + 1) % zakladki.length];
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = zakladki[(i - 1 + zakladki.length) % zakladki.length];
        if (e.key === 'Home') n = zakladki[0];
        if (e.key === 'End') n = zakladki[zakladki.length - 1];
        if (n) { e.preventDefault(); pokaz(n, true, true); }
      });
    });
    var zHasha = function () {
      var h = location.hash.slice(1);
      var z = zakladki.filter(function (x) { return x.getAttribute('data-hash') === h; })[0];
      pokaz(z || zakladki[0], false, false);
      if (z) {
        var cel = d.getElementById('cennik');
        if (cel) cel.scrollIntoView({ block: 'start' });
      }
    };
    zHasha();
    window.addEventListener('hashchange', zHasha);
  }

  /* ---------- Kopiuj adres ---------- */
  d.querySelectorAll('[data-kopiuj]').forEach(function (b) {
    b.addEventListener('click', function () {
      var tekst = b.getAttribute('data-kopiuj');
      var info = d.getElementById(b.getAttribute('aria-describedby') || '') || b.parentNode.parentNode.querySelector('.kopiuj-info');
      var gotowe = function () {
        if (info) { info.textContent = 'Adres skopiowany do schowka.'; setTimeout(function () { info.textContent = ''; }, 3500); }
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(tekst).then(gotowe, function () { reczne(tekst); gotowe(); });
      } else { reczne(tekst); gotowe(); }
    });
  });
  function reczne(t) {
    var ta = d.createElement('textarea');
    ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    body.appendChild(ta); ta.select();
    try { d.execCommand('copy'); } catch (e) { /* brak */ }
    body.removeChild(ta);
  }

  /* ---------- Fokus klawiatury w mapie ----------
     Iframe Google (inna domena) nie dostaje :focus w naszym dokumencie, więc po wejściu Tabem
     dokładamy klasę – obwódka jak przy innych elementach. Kliknięcie myszą jej nie pokazuje. */
  var mapy = d.querySelectorAll('.mapa iframe');
  if (mapy.length) {
    var klawiatura = false;
    d.addEventListener('keydown', function (e) { if (e.key === 'Tab') klawiatura = true; }, true);
    d.addEventListener('pointerdown', function () { klawiatura = false; }, true);
    var sprawdz = function () {
      var a = d.activeElement;
      if (klawiatura && a && a.tagName === 'IFRAME' && a.closest('.mapa')) a.classList.add('fokus');
    };
    window.addEventListener('blur', function () { sprawdz(); setTimeout(sprawdz, 0); });
    window.addEventListener('focus', function () {
      mapy.forEach(function (m) { m.classList.remove('fokus'); });
    });
  }
})();
