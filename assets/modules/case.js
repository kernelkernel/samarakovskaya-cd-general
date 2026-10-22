/* CASE · поведение шаблона кейса: курсор, появление блоков, лайтбокс галереи, ленивое видео */
(function(){
  /* курсор */
  var cur=document.getElementById('cur'),ring=document.getElementById('ring');
  if(cur&&ring&&window.matchMedia('(hover:hover)').matches){
    var mx=0,my=0,rx=0,ry=0;
    document.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;cur.style.left=mx+'px';cur.style.top=my+'px';});
    (function loop(){rx+=(mx-rx)*.12;ry+=(my-ry)*.12;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(loop);})();
    document.querySelectorAll('a,button,.gi img').forEach(function(el){
      el.addEventListener('mouseenter',function(){cur.classList.add('hot');ring.classList.add('hot');});
      el.addEventListener('mouseleave',function(){cur.classList.remove('hot');ring.classList.remove('hot');});
    });
  }
  /* появление */
  var rv=[].slice.call(document.querySelectorAll('.reveal'));
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('shown');io.unobserve(e.target);}});},{threshold:.05});
    rv.forEach(function(el){io.observe(el);});
  } else rv.forEach(function(el){el.classList.add('shown');});
  /* лайтбокс: все картинки галереи .gi img */
  var imgs=[].slice.call(document.querySelectorAll('.gi img'));
  if(imgs.length){
    var lb=document.createElement('div');lb.className='lb';
    lb.innerHTML='<button class="lb-close" type="button">[ESC] закрыть</button><button class="lb-nav lb-prev" type="button">←</button><img alt=""><button class="lb-nav lb-next" type="button">→</button><div class="lb-counter"></div>';
    document.body.appendChild(lb);
    var big=lb.querySelector('img'),cnt=lb.querySelector('.lb-counter'),idx=0;
    function show(i,anim){idx=(i+imgs.length)%imgs.length;var src=imgs[idx].currentSrc||imgs[idx].src;
      if(anim){big.classList.add('fade');setTimeout(function(){big.src=src;big.classList.remove('fade');},160);}else big.src=src;
      cnt.textContent=(idx+1)+' / '+imgs.length;}
    function close(){lb.classList.remove('open');document.body.style.overflow='';big.src='';}
    imgs.forEach(function(im,i){im.addEventListener('click',function(){show(i,false);lb.classList.add('open');document.body.style.overflow='hidden';});});
    lb.querySelector('.lb-close').addEventListener('click',close);
    lb.querySelector('.lb-prev').addEventListener('click',function(e){e.stopPropagation();show(idx-1,true);});
    lb.querySelector('.lb-next').addEventListener('click',function(e){e.stopPropagation();show(idx+1,true);});
    lb.addEventListener('click',function(e){if(e.target===lb)close();});
    document.addEventListener('keydown',function(e){if(!lb.classList.contains('open'))return;
      if(e.key==='Escape')close();if(e.key==='ArrowLeft')show(idx-1,true);if(e.key==='ArrowRight')show(idx+1,true);});
    var tx=0;lb.addEventListener('touchstart',function(e){tx=e.touches[0].clientX;},{passive:true});
    lb.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>50)show(idx+(dx<0?1:-1),true);});
  }
  /* ленивое видео: грузится и играет только рядом с экраном */
  var vids=[].slice.call(document.querySelectorAll('video[data-lazyvideo]'));
  function load(v){if(!v.dataset.loaded){v.dataset.loaded='1';v.querySelectorAll('source[data-src]').forEach(function(s){s.src=s.dataset.src;});v.load();}
    var p=v.play();if(p&&p.catch)p.catch(function(){});}
  if(vids.length){
    if(!('IntersectionObserver' in window)){vids.forEach(load);}
    else{var vio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)load(e.target);else if(e.target.dataset.loaded)e.target.pause();});},{rootMargin:'250px'});
      vids.forEach(function(v){vio.observe(v);});}
  }
})();
/* видео YouTube по клику: <div class="video" data-yt="ID"> */
document.querySelectorAll('.video[data-yt]').forEach(function(el){
  el.addEventListener('click',function(){
    var i=document.createElement('iframe');
    i.src='https://www.youtube.com/embed/'+el.dataset.yt+'?autoplay=1&rel=0';
    i.allow='accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture';i.allowFullscreen=true;
    el.innerHTML='';el.appendChild(i);el.removeAttribute('data-yt');
  },{once:true});
});
