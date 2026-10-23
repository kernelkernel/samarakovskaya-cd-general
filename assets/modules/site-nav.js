/* ═══════════════════════════════════════════════════════════════════
   SITE NAV · шапка и док страниц кейсов (Cobalt Field, 22.10.2026)
   Разметка кейса (единая):
   <header class="cf-head site-nav"><div class="cf-wrap"><div class="cf-grid">
     <a class="cf-head__brand cf-head__back" href="../index.html#works">…Все проекты…</a>
     <nav class="cf-head__links"><a class="cf-head__link" href="#id" data-section="id">Раздел<sup>01</sup></a> …</nav>
     <div class="cf-head__end">«Написать» → Telegram</div>
   </div></div></header>
   <div class="cf-dock site-dock">…счётчик, точки по разделам, «Все проекты», «Написать»…</div>
   Точки и счётчик дока ведёт TS.nav из bundle.js. Здесь: шапка уезжает,
   когда первый экран кейса (.hero) ушёл из вида, и появляется док;
   подсветка текущего раздела в шапке.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
  var head = document.querySelector('.cf-head.site-nav');
  var dock = document.querySelector('.cf-dock.site-dock');
  var hero = document.querySelector('section.hero');
  if(hero && 'IntersectionObserver' in window){
    new IntersectionObserver(function(en){
      var away = !en[0].isIntersecting;
      if(head) head.classList.toggle('is-away', away);
      if(dock) dock.classList.toggle('is-on', away);
    }, {threshold:0.12}).observe(hero);
  } else if(dock){ dock.classList.add('is-on'); }

  if(!head) return;
  var links = [].slice.call(head.querySelectorAll('.cf-head__link[data-section]'));
  if(!links.length || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function(en){
    en.forEach(function(e){
      if(!e.isIntersecting) return;
      links.forEach(function(a){ a.classList.toggle('on', a.dataset.section === e.target.id); });
    });
  }, {rootMargin:'-45% 0px -50% 0px'});
  links.forEach(function(a){ var t = document.getElementById(a.dataset.section); if(t) io.observe(t); });
})();
