/* Cobalt Field: поведение компонентов. Чистый JS без зависимостей.
   window.TS.init(root) включает все эффекты на найденных элементах.
   Каждый эффект можно вызвать отдельно: TS.reveal(root), TS.field(el) и т.д.
   Никаких слушателей scroll: только IntersectionObserver, pointer-события и CSS scroll-driven animations. */
(function () {
  "use strict";
  var doc = document;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  function $all(root, sel) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* Появление блоков и построчные маски */
  function reveal(root) {
    $all(root, ".cf-lines").forEach(function (el) {
      $all(el, ".cf-line").forEach(function (l, i) { l.style.setProperty("--i", i); });
    });
    $all(root, "[data-reveal-group]").forEach(function (g) {
      $all(g, "[data-reveal]").forEach(function (el, i) { el.style.setProperty("--i", i % 6); });
    });
    var targets = $all(root, "[data-reveal], .cf-lines");
    if (!("IntersectionObserver" in window) || reduce) { targets.forEach(function (t) { t.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* Разбивка текста на слова для проявления по словам */
  function splitWords(root) {
    $all(root, "[data-split='words']").forEach(function (el) {
      if (el.dataset.splitDone) return;
      el.dataset.splitDone = "1";
      var i = 0;
      var walk = function (node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = doc.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(part)); return; }
              var s = doc.createElement("span");
              s.className = "w";
              s.style.setProperty("--i", i++);
              s.textContent = part;
              frag.appendChild(s);
            });
            node.replaceChild(frag, n);
          } else if (n.nodeType === 1) { walk(n); }
        });
      };
      walk(el);
    });
  }

  /* Поле: световой след за курсором и перетекание состояний */
  function field(root) {
    $all(root, ".cf-field").forEach(function (f) {
      if (f.dataset.fieldDone) return;
      f.dataset.fieldDone = "1";
      var lens = f.querySelector(".cf-lens");
      if (lens && finePointer && !reduce) {
        var host = f.classList.contains("cf-field--fixed") ? window : f.parentElement;
        var tx = 0, ty = 0, x = 0, y = 0, raf = 0;
        var tick = function () {
          x = lerp(x, tx, 0.08); y = lerp(y, ty, 0.08);
          f.style.setProperty("--lx", x.toFixed(1) + "px");
          f.style.setProperty("--ly", y.toFixed(1) + "px");
          raf = (Math.abs(x - tx) + Math.abs(y - ty) > 0.5) ? requestAnimationFrame(tick) : 0;
        };
        host.addEventListener("pointermove", function (e) {
          var r = f.getBoundingClientRect();
          tx = e.clientX - r.left; ty = e.clientY - r.top;
          f.classList.add("is-live");
          if (!raf) raf = requestAnimationFrame(tick);
        }, { passive: true });
        host.addEventListener("pointerleave", function () { f.classList.remove("is-live"); });
      }
      if (f.classList.contains("cf-field--fixed") && "IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { if (e.isIntersecting) f.setAttribute("data-show", e.target.getAttribute("data-mood") || "cobalt"); });
        }, { rootMargin: "-50% 0px -50% 0px" });
        $all(doc, "[data-mood-section]").forEach(function (s) { io.observe(s); });
      }
    });
  }

  /* Кинетическое имя: толщина букв зависит от близости курсора */
  function kinetic(root) {
    $all(root, "[data-kinetic]").forEach(function (el) {
      if (el.dataset.kinDone) return;
      el.dataset.kinDone = "1";
      var elBase = +el.dataset.kinBase || 380;
      $all(el, ".cf-kinword").forEach(function (w) {
        var txt = w.textContent, b = +w.dataset.base || elBase; w.textContent = "";
        txt.split("").forEach(function (ch) {
          var s = doc.createElement("span"); s.className = "cf-kin"; s.textContent = ch; s.dataset.b = b; s.style.setProperty("--w", b); w.appendChild(s);
        });
      });
      if (!finePointer || reduce) return;
      var letters = $all(el, ".cf-kin"), peak = +el.dataset.kinPeak || 700, raf = 0, px = 0, py = 0;
      var paint = function () {
        raf = 0;
        letters.forEach(function (l) {
          var r = l.getBoundingClientRect();
          var d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
          var k = Math.max(0, 1 - d / 320);
          var base = +l.dataset.b; l.style.setProperty("--w", Math.round(base + (peak - base) * k * k));
        });
      };
      (el.closest("section") || el).addEventListener("pointermove", function (e) { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
      (el.closest("section") || el).addEventListener("pointerleave", function () { letters.forEach(function (l) { l.style.setProperty("--w", l.dataset.b); }); });
    });
  }

  /* Счётчики 0 → N при появлении */
  function countUp(root) {
    var els = $all(root, "[data-count]");
    if (!els.length) return;
    var run = function (el) {
      var to = +el.dataset.count, t0 = performance.now(), dur = 1400;
      if (reduce) { el.textContent = to; return; }
      var step = function (t) {
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(to * e);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!("IntersectionObserver" in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }); }, { threshold: 0.6 });
    els.forEach(function (el) { el.textContent = "0"; io.observe(el); });
  }

  /* Барабан слов в контактах */
  function cycle(root) {
    $all(root, "[data-cycle]").forEach(function (el) {
      if (el.dataset.cycleDone) return;
      el.dataset.cycleDone = "1";
      var words; try { words = JSON.parse(el.dataset.cycle); } catch (e) { return; }
      var track = doc.createElement("span"); track.className = "cf-cycle__track";
      words.concat(words[0]).forEach(function (w) { var s = doc.createElement("span"); s.textContent = w; track.appendChild(s); });
      el.textContent = ""; el.appendChild(track);
      var spans = $all(track, "span");
      var widthAt = function (k) { var w = spans[k].getBoundingClientRect().width; return w ? Math.ceil(w) + "px" : ""; };
      el.style.width = widthAt(0);
      if (reduce) return;
      var i = 0, n = words.length;
      setInterval(function () {
        i++;
        track.style.transition = "";
        track.style.transform = "translateY(" + (-i * 1.24) + "em)";
        el.style.width = widthAt(i);
        if (i === n) {
          setTimeout(function () { track.style.transition = "none"; track.style.transform = "translateY(0)"; i = 0; }, 800);
        }
      }, 2200);
    });
  }

  /* Переключатель Сетка / Список */
  function worksToggle(root) {
    $all(root, ".cf-works").forEach(function (w) {
      var tg = w.querySelector(".cf-toggle");
      if (!tg || tg.dataset.done) return;
      tg.dataset.done = "1";
      $all(tg, "button").forEach(function (b) {
        b.addEventListener("click", function () {
          var v = b.dataset.view;
          w.setAttribute("data-view", v); tg.setAttribute("data-state", v);
          $all(tg, "button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          window.dispatchEvent(new Event("resize"));
        });
      });
    });
  }

  /* Лента проектов: закрепление и горизонтальный ход от вертикального скролла */
  function strip(root) {
    var canPin = window.CSS && CSS.supports && CSS.supports("animation-timeline: view()") && !reduce;
    $all(root, ".cf-strip").forEach(function (st) {
      if (st.dataset.stripDone) return;
      st.dataset.stripDone = "1";
      var track = st.querySelector(".cf-strip__track");
      var cards = $all(st, ".cf-card");
      var num = st.querySelector("[data-strip-num]");
      if (!track) return;
      var measure = function () {
        var pin = canPin && st.dataset.pin !== "off" && window.innerWidth >= 768 && !doc.documentElement.classList.contains("cf-noscroll");
        st.classList.toggle("is-pinned", pin);
        if (!pin) return;
        var dist = Math.max(0, track.scrollWidth - window.innerWidth);
        st.style.setProperty("--pan", (-dist) + "px");
        st.style.setProperty("--strip-h", (dist + window.innerHeight) + "px");
      };
      measure();
      if ("ResizeObserver" in window) new ResizeObserver(measure).observe(track);
      window.addEventListener("resize", measure);
      $all(st, "img").forEach(function (im) { if (!im.complete) im.addEventListener("load", measure, { once: true }); });
      /* счётчик текущего кадра */
      if (num && "IntersectionObserver" in window) {
        var seen = {};
        var io = new IntersectionObserver(function (en) {
          en.forEach(function (e) { seen[cards.indexOf(e.target)] = e.isIntersecting; });
          var cur = 0;
          Object.keys(seen).forEach(function (k) { if (seen[k]) cur = Math.max(cur, +k); });
          num.textContent = ("0" + (cur + 1)).slice(-2);
        }, { threshold: 0.55 });
        cards.forEach(function (c) { io.observe(c); });
      }
      /* прогресс в режиме обычной горизонтальной прокрутки */
      track.addEventListener("scroll", function () {
        var max = track.scrollWidth - track.clientWidth;
        st.style.setProperty("--prog", max > 0 ? (track.scrollLeft / max).toFixed(3) : 0);
      }, { passive: true });
    });
  }

  /* Копирование почты с подтверждением */
  function copy(root) {
    $all(root, "[data-copy]").forEach(function (el) {
      if (el.dataset.copyDone) return;
      el.dataset.copyDone = "1";
      el.addEventListener("click", function (e) {
        if (!navigator.clipboard) return;
        e.preventDefault();
        navigator.clipboard.writeText(el.dataset.copy).then(function () {
          el.classList.add("is-copied");
          setTimeout(function () { el.classList.remove("is-copied"); }, 1800);
        }, function () { window.location.href = el.getAttribute("href"); });
      });
    });
  }

  /* Шоурил: звук и круг, который ходит за курсором */
  function reel(root) {
    $all(root, ".cf-reel").forEach(function (r) {
      if (r.dataset.reelDone) return;
      r.dataset.reelDone = "1";
      var video = r.querySelector("video");
      var label = r.querySelector("[data-sound-label]");
      var btns = $all(r, "[data-sound]");
      var toggle = function () {
        var on = r.classList.toggle("is-sound");
        if (video) { video.muted = !on; if (on) video.play && video.play(); }
        btns.forEach(function (b) {
          b.setAttribute("aria-pressed", String(on));
          b.setAttribute("aria-label", on ? "Выключить звук" : "Включить звук");
          var ic = b.querySelector("i"); if (ic) ic.className = on ? "ph ph-speaker-high" : "ph ph-speaker-slash";
        });
        if (label) label.textContent = on ? "Звук выкл" : "Со звуком";
        r.dispatchEvent(new CustomEvent("cf:sound", { detail: { on: on }, bubbles: true }));
      };
      btns.forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); toggle(); }); });
      var media = r.querySelector(".cf-reel__media");
      if (media) media.addEventListener("click", toggle);
      var f = r.querySelector(".cf-reel__follow");
      if (f && finePointer && !reduce) {
        r.addEventListener("pointermove", function (e) {
          var b = r.getBoundingClientRect();
          f.style.setProperty("--fx", (e.clientX - b.left) + "px");
          f.style.setProperty("--fy", (e.clientY - b.top) + "px");
        }, { passive: true });
      }
    });
  }

  /* Шапка уезжает после первого экрана, появляется док; точки следят за разделами */
  function nav(root) {
    var head = (root || doc).querySelector(".cf-head:not(.cf-head--static)");
    var dock = (root || doc).querySelector(".cf-dock:not(.cf-dock--static)");
    var hero = (root || doc).querySelector(".cf-hero, .cf-case-hero");
    if (hero && "IntersectionObserver" in window && (head || dock)) {
      new IntersectionObserver(function (en) {
        var away = !en[0].isIntersecting;
        if (head) head.classList.toggle("is-away", away);
        if (dock) dock.classList.toggle("is-on", away);
      }, { threshold: 0.12 }).observe(hero);
    }
    $all(root, ".cf-dock").forEach(function (d) {
      var dots = $all(d, ".cf-dot"), num = d.querySelector("[data-dock-num]"), now = d.querySelector("[data-dock-now]");
      var setActive = function (id) {
        dots.forEach(function (dot, i) {
          var on = dot.getAttribute("href") === "#" + id;
          dot.classList.toggle("is-active", on);
          if (on) { if (num) num.textContent = ("0" + (i + 1)).slice(-2); if (now) now.textContent = dot.getAttribute("aria-label") || ""; }
        });
      };
      if (d.classList.contains("cf-dock--static")) {
        dots.forEach(function (dot) { dot.addEventListener("click", function (e) { e.preventDefault(); setActive(dot.getAttribute("href").slice(1)); }); });
        return;
      }
      if (!("IntersectionObserver" in window)) return;
      var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); }); }, { rootMargin: "-45% 0px -50% 0px" });
      dots.forEach(function (dot) { var t = doc.getElementById(dot.getAttribute("href").slice(1)); if (t) io.observe(t); });
    });
  }

  /* Магнитные круглые кнопки */
  function magnetic(root) {
    if (!finePointer || reduce) return;
    $all(root, "[data-magnetic]").forEach(function (el) {
      if (el.dataset.magDone) return;
      el.dataset.magDone = "1";
      var s = +el.dataset.magnetic || 0.3;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * s).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * s).toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* Наложение 12-колоночной сетки по клавише G */
  function gridOverlay() {
    if (doc.querySelector(".cf-gridlay")) return;
    var lay = doc.createElement("div"); lay.className = "cf-gridlay"; lay.setAttribute("aria-hidden", "true");
    var html = "";
    for (var i = 0; i < 12; i++) html += "<span></span>";
    lay.innerHTML = "<div class='cf-wrap'><div class='cf-grid'>" + html + "</div></div>";
    doc.body.appendChild(lay);
    doc.addEventListener("keydown", function (e) {
      var t = e.target && e.target.tagName;
      if (t === "INPUT" || t === "TEXTAREA" || e.metaKey || e.ctrlKey) return;
      if (e.key === "g" || e.key === "G" || e.key === "п" || e.key === "П") lay.classList.toggle("is-on");
    });
  }

  function init(root) {
    root = root || doc;
    doc.documentElement.classList.add("cf-js");
    if (doc.documentElement.scrollHeight <= window.innerHeight + 4) doc.documentElement.classList.add("cf-noscroll");
    splitWords(root); kinetic(root); reveal(root); field(root); countUp(root); cycle(root);
    worksToggle(root); strip(root); copy(root); reel(root); nav(root); magnetic(root); gridOverlay();
  }

  window.TS = { init: init, reveal: reveal, splitWords: splitWords, field: field, kinetic: kinetic, countUp: countUp, cycle: cycle, worksToggle: worksToggle, strip: strip, copy: copy, reel: reel, nav: nav, magnetic: magnetic, gridOverlay: gridOverlay };
})();
