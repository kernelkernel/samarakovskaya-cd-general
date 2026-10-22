/* ═══════════════════════════════════════════════════════════════════
   SITE NAV · поведение шапки (модуль, общий для всех страниц General)
   Разметка кейса (единая):
   <header class="top site-nav">
     <div class="nav-bar">
       <a class="back" href="../index.html#works">Все проекты</a>
       <nav class="mag-nav" id="magNav">
         <a class="mag-pill" href="#id" data-section="id">Раздел</a> …
       </nav>
       <div class="nav-end"><a class="nav-cta" href="https://t.me/samarakovskaya_tanya" target="_blank" rel="noopener">Написать</a></div>
     </div>
   </header>
   Главная: вместо .back — .brand, вместо .mag-nav — nav.top-nav с <a href="#id">.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
  var nav = document.querySelector('header.site-nav');
  if(!nav) return;
  var links = [].slice.call(nav.querySelectorAll('.mag-pill[data-section], .top-nav a[href^="#"]'));
  var fine = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  links.forEach(function(a){
    if(a.classList.contains('mag-pill')){
      if(fine){
        a.addEventListener('mousemove', function(e){
          var r = a.getBoundingClientRect();
          a.style.transform = 'translate(' + (e.clientX - r.left - r.width/2)*0.3 + 'px,' + (e.clientY - r.top - r.height/2)*0.35 + 'px)';
        });
        a.addEventListener('mouseleave', function(){ a.style.transform = ''; });
      }
      a.addEventListener('click', function(e){
        var t = document.getElementById(a.dataset.section);
        if(!t) return;
        e.preventDefault();
        t.scrollIntoView({behavior:'smooth', block:'start'});
      });
    }
  });

  var targets = links.map(function(a){
    var id = a.dataset.section || (a.getAttribute('href') || '').slice(1);
    return {a:a, el:id ? document.getElementById(id) : null};
  }).filter(function(t){ return t.el; });
  if(!targets.length) return;

  var queued = false;
  function apply(){
    queued = false;
    var line = window.scrollY + Math.max(140, window.innerHeight * 0.3);
    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    var active = null;
    for(var i = 0; i < targets.length; i++){
      if(targets[i].el.getBoundingClientRect().top + window.scrollY <= line) active = targets[i];
    }
    if(atBottom) active = targets[targets.length - 1];
    targets.forEach(function(t){ t.a.classList.toggle('on', !!active && t === active); });
  }
  function queue(){ if(!queued){ queued = true; requestAnimationFrame(apply); } }
  window.addEventListener('scroll', queue, {passive:true});
  window.addEventListener('resize', queue, {passive:true});
  window.addEventListener('load', queue);
  if(window.ResizeObserver) new ResizeObserver(queue).observe(document.body);
  apply();
})();
