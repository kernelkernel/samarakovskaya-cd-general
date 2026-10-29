/* CD_GENERAL · поведение главной поверх Cobalt Field (bundle.js):
   курсор-лупа, замедленное видео первого экрана, звук шоурила Vimeo. */
(function () {
  "use strict";
  if (window.TS) TS.init(document);

  /* ── курсор-лупа ── */
  var cur = document.getElementById("cur"), ring = document.getElementById("curRing");
  if (cur && ring && window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      cur.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
    }, { passive: true });
    (function loop() {
      rx += (mx - rx) * 0.15; ry += (my - ry) * 0.15;
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll("a,button,summary,.cf-pcard,.cf-card,.cf-wrow,.cf-link").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cur.classList.add("hot"); ring.classList.add("hot"); });
      el.addEventListener("mouseleave", function () { cur.classList.remove("hot"); ring.classList.remove("hot"); });
    });
  }

  /* ── первый экран: замедленное видео в петле ── */
  var hv = document.getElementById("heroVideo");
  if (hv) {
    var RATE = 0.65;
    var rate = function () { try { if (hv.playbackRate !== RATE) hv.playbackRate = RATE; } catch (e) {} };
    var tryPlay = function () { rate(); if (!hv.paused) return; var p = hv.play(); if (p && p.catch) p.catch(function () {}); };
    ["loadedmetadata", "loadeddata", "canplay", "play", "playing", "seeked"].forEach(function (ev) { hv.addEventListener(ev, rate); });
    hv.addEventListener("ended", function () { hv.currentTime = 0; tryPlay(); });
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") tryPlay(); });
    ["pointerdown", "keydown", "touchstart"].forEach(function (ev) { addEventListener(ev, tryPlay, { once: true, passive: true }); });
    if (hv.readyState >= 2) tryPlay(); else hv.addEventListener("loadeddata", tryPlay, { once: true });
  }

  /* ── шоурил: Vimeo, звук из кнопки шоурила, дока и клика по кадру ── */
  var reel = document.getElementById("showreel");
  var iframe = document.getElementById("showreelVideo");
  var wrapV = reel && reel.querySelector(".cf-vimeo");
  var intro = reel && reel.querySelector(".showreel-intro");
  var dockBtn = document.getElementById("dockSound");
  var followLbl = reel && reel.querySelector("[data-follow-label]");
  var player = null;

  function reveal() {
    if (wrapV && !wrapV.classList.contains("is-ready")) {
      wrapV.classList.add("is-ready");
      if (intro) setTimeout(function () { try { intro.pause(); } catch (e) {} }, 600);
    }
  }
  (function initVimeo() {
    if (!iframe) return;
    if (typeof Vimeo === "undefined") { setTimeout(initVimeo, 200); return; }
    player = new Vimeo.Player(iframe);
    player.ready().then(function () { player.setMuted(true); }).catch(function () {});
    player.on("play", reveal); player.on("playing", reveal); player.on("timeupdate", reveal);
    setTimeout(reveal, 8000);
  })();

  function paintDock(on) {
    if (!dockBtn) return;
    dockBtn.setAttribute("aria-label", (document.documentElement.lang==="en") ? (on ? "Mute showreel" : "Unmute showreel") : (on ? "Выключить звук шоурила" : "Включить звук шоурила"));
    var ic = dockBtn.querySelector("i"); if (ic) ic.className = on ? "ph ph-speaker-high" : "ph ph-speaker-slash";
  }
  if (reel) {
    reel.addEventListener("cf:sound", function (e) {
      var on = e.detail && e.detail.on;
      if (intro) intro.muted = true;               /* звук только у Vimeo */
      if (player) {
        if (on) player.setVolume(0.7).then(function () { return player.setMuted(false); }).catch(function () {});
        else player.setMuted(true);
      }
      if (followLbl) followLbl.textContent = (document.documentElement.lang==="en") ? (on ? "Sound off" : "Sound on") : (on ? "Без звука" : "Со звуком");
      paintDock(on);
    });
    var reelBtn = reel.querySelector("[data-sound]");
    if (dockBtn && reelBtn) dockBtn.addEventListener("click", function () {
      if (!reel.classList.contains("is-sound")) reel.scrollIntoView({ behavior: "smooth" });
      reelBtn.click();
    });
    /* звук выключается, когда шоурил ушёл из вида */
    if ("IntersectionObserver" in window && reelBtn) {
      new IntersectionObserver(function (en) {
        en.forEach(function (x) { if (!x.isIntersecting && reel.classList.contains("is-sound")) reelBtn.click(); });
      }, { threshold: 0 }).observe(reel);
    }
  }
})();

/* ═══ Правки 23.10.2026 ═══ */
(function () {
  "use strict";
  /* Круговой текст: размер шрифта подбирается так, чтобы фраза ровно замыкала кольцо */
  var curve = document.querySelector(".hero-curve");
  var path = document.getElementById("curveA"), txt = curve && curve.querySelector("text");
  if (curve && path && txt) {
    var fit = function () {
      txt.style.fontSize = "30px";
      try {
        var pl = path.getTotalLength(), tl = txt.getComputedTextLength();
        if (pl && tl) txt.style.fontSize = Math.max(15, Math.min(30, 30 * pl * 0.995 / tl)).toFixed(2) + "px";
      } catch (e) {}
    };
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    addEventListener("load", fit); setTimeout(fit, 300); setTimeout(fit, 1500);
    var t; addEventListener("resize", function () { clearTimeout(t); t = setTimeout(fit, 150); });
  }

  /* Vimeo заполняет кадр без лишнего увеличения: cover по пропорции 16:9 */
  var box = document.querySelector(".cf-reel__media .cf-vimeo"), fr = box && box.querySelector("iframe");
  if (box && fr) {
    var cover = function () {
      var w = box.clientWidth, h = box.clientHeight, fw = Math.max(w, h * 16 / 9);
      fr.style.width = fw + "px"; fr.style.height = (fw * 9 / 16) + "px"; fr.style.minWidth = "0";
    };
    cover(); addEventListener("resize", cover);
  }

  /* Док прячется, пока шоурил занимает экран: не перекрывает видео и не дублирует кнопку звука */
  var reel = document.getElementById("showreel"), dock = document.querySelector(".cf-dock");
  if (reel && dock && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en) {
      en.forEach(function (x) { dock.classList.toggle("is-reel", x.intersectionRatio > 0.45); });
    }, { threshold: [0, 0.45, 0.6, 1] }).observe(reel);
  }
})();

/* ═══ Телефон: свёрнутые тексты и раскрытие опыта (23.10.2026) ═══
   Кнопки создаются всегда, но видны и работают только до 767px (см. site.css). */
(function () {
  "use strict";
  var mq = window.matchMedia("(max-width: 767px)");
  function moreBtn(target, label, cls) {
    target.classList.add(cls);
    var b = document.createElement("button");
    b.type = "button"; b.className = "m-more"; b.setAttribute("aria-expanded", "false");
    b.innerHTML = "<span>" + label + "</span><i class=\"ph ph-caret-down\"></i>";
    b.addEventListener("click", function () {
      var on = !target.classList.contains("is-open");
      target.classList.toggle("is-open", on); b.classList.toggle("is-open", on);
      b.setAttribute("aria-expanded", on ? "true" : "false");
      b.querySelector("span").textContent = on ? ((document.documentElement.lang==="en") ? "Show less" : "Свернуть") : label;
    });
    target.insertAdjacentElement("afterend", b);
  }
  /* «Обо мне»: длинный абзац до трёх строк */
  var about = document.querySelectorAll(".cf-about__text");
  if (about[1]) moreBtn(about[1], (document.documentElement.lang==="en") ? "Read more" : "Подробнее", "m-clamp");
  /* «Опыт»: список инструментов под кнопкой */
  var stack = document.querySelector(".cf-career__aside .cf-stack");
  if (stack) moreBtn(stack, (document.documentElement.lang==="en") ? "Tools" : "Инструменты", "m-fold");
  /* «Опыт»: описание места работы по нажатию */
  document.querySelectorAll(".cf-titem").forEach(function (li) {
    var ico = document.createElement("span");
    ico.className = "cf-circle m-acc-ico"; ico.setAttribute("aria-hidden", "true");
    ico.innerHTML = "<i class=\"ph ph-plus\"></i>";
    li.appendChild(ico);
    li.addEventListener("click", function () { if (mq.matches) li.classList.toggle("is-open"); });
  });
})();
