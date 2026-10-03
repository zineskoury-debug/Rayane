/* ==========================================================
   YOU & ME — Beauty Center · animations
   Vanilla JS, aucune dépendance.
   ========================================================== */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  let scrollY = window.scrollY;
  let lastScrollY = scrollY;
  let velocity = 0;

  /* ---------- Monogrammes : tracés en ligne pour pouvoir les animer ---------- */
  const monoSource = $('#mono-paths');
  $$('svg.mono').forEach(svg => { svg.innerHTML = monoSource.innerHTML; });

  /* ---------- Découpage des titres en mots ---------- */
  $$('.split').forEach(el => {
    let i = 0;
    $$('.line', el).forEach(line => {
      const nodes = [...line.childNodes];
      line.textContent = '';
      nodes.forEach(node => {
        if (node.nodeType === 3) {
          node.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { line.append(' '); return; }
            const w = document.createElement('span');
            w.className = 'word';
            w.textContent = part;
            w.style.transitionDelay = `${i++ * 0.06}s`;
            line.append(w);
          });
        } else {
          const w = document.createElement('span');
          w.className = 'word';
          w.style.transitionDelay = `${i++ * 0.06}s`;
          w.append(node);
          line.append(w);
        }
      });
    });
  });

  /* ---------- Manifeste : mots qui s'allument au scroll ---------- */
  const manifesto = $('#manifesto');
  const manifestoWords = [];
  if (manifesto) {
    const text = manifesto.textContent.trim();
    manifesto.textContent = '';
    text.split(/\s+/).forEach((word, idx, arr) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = word;
      manifesto.append(s);
      if (idx < arr.length - 1) manifesto.append(' ');
      manifestoWords.push(s);
    });
  }

  /* ---------- Loader ---------- */
  const loader = $('#loader');
  const loaderCount = $('#loaderCount');
  document.body.classList.add('is-loading');
  const LOAD_TIME = reduced ? 200 : 2000;
  const t0 = performance.now();
  (function count(now) {
    const p = clamp((now - t0) / LOAD_TIME);
    loaderCount.textContent = Math.round((1 - Math.pow(1 - p, 3)) * 100);
    if (p < 1) requestAnimationFrame(count);
    else {
      loader.classList.add('is-done');
      document.body.classList.remove('is-loading');
      document.body.classList.add('is-ready');
      $$('#hero .split, #hero .reveal-up').forEach((el, i) => setTimeout(() => el.classList.add('is-in'), 350 + i * 120));
      setTimeout(() => loader.remove(), 1600);
    }
  })(t0);

  /* ---------- Apparitions au scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      if (el.closest('#hero') && !document.body.classList.contains('is-ready')) return;
      el.classList.add('is-in');
      // clip-path masque l'élément pour l'observer : on observe son parent
      $$('.clip-reveal', el).forEach(c => c.classList.add('is-in'));
      if (el.dataset.count) countUp(el);
      io.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });

  $$('.reveal-up, .split, .house__media, .footer__giant, [data-count]').forEach(el => {
    if (!el.closest('#hero')) io.observe(el);
  });
  $$('.service').forEach((el, i) => { el.style.transitionDelay = `${(i % 6) * 0.08}s`; io.observe(el); });
  $$('.footer__giant span').forEach((s, i) => { s.style.transitionDelay = `${i * 0.07}s`; });
  // Retirer le délai après l'entrée pour que le survol reste vif
  $$('.service, .footer__giant span').forEach(el => el.addEventListener('transitionend', () => { el.style.transitionDelay = ''; }, { once: true }));

  function countUp(el) {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    const dur = 1800;
    const start = performance.now();
    const fmt = n => n.toLocaleString('fr-FR');
    (function step(now) {
      const p = clamp((now - start) / dur);
      el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 4)))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }

  /* ---------- Curseur personnalisé ---------- */
  const cursor = $('#cursor');
  const cursorDot = $('#cursorDot');
  const cursorLabel = $('#cursorLabel');
  const cur = { x: mouse.x, y: mouse.y };
  if (finePointer) document.body.classList.add('has-cursor');

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    cursorDot.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`;
  }, { passive: true });
  document.addEventListener('mousedown', () => cursor.classList.add('is-down'));
  document.addEventListener('mouseup', () => cursor.classList.remove('is-down'));
  document.addEventListener('mouseleave', () => { cursor.classList.add('is-hidden'); cursorDot.classList.add('is-hidden'); });
  document.addEventListener('mouseenter', () => { cursor.classList.remove('is-hidden'); cursorDot.classList.remove('is-hidden'); });

  document.addEventListener('mouseover', e => {
    const labelled = e.target.closest('[data-cursor]');
    const link = e.target.closest('a, button, label, input');
    cursor.classList.toggle('is-hover', !!labelled);
    cursor.classList.toggle('is-link', !labelled && !!link);
    cursorLabel.textContent = labelled ? labelled.dataset.cursor : '';
  });

  /* ---------- Boutons magnétiques ---------- */
  if (finePointer && !reduced) {
    $$('.magnetic').forEach(el => {
      const strength = 0.35;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
        const inner = el.firstElementChild;
        if (inner) inner.style.transform = `translate(${x * strength * 0.4}px, ${y * strength * 0.4}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        const inner = el.firstElementChild;
        if (inner) inner.style.transform = '';
      });
    });
  }

  /* ---------- Inclinaison 3D + lumière des cartes ---------- */
  if (finePointer && !reduced) {
    $$('.tilt').forEach(el => {
      el.addEventListener('mousemove', e => {
        if (el.classList.contains('reveal-up') && !el.classList.contains('is-in')) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
        el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 8}deg) rotateY(${(px - 0.5) * 10}deg) translateY(-4px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Header + navigation ---------- */
  const header = $('#header');
  const nav = $('#nav');
  const burger = $('#burger');
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open);
    nav.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('a', nav).forEach(a => a.addEventListener('click', () => {
    burger.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    document.body.style.overflow = '';
  }));

  const navLinks = $$('.nav__link');
  const sectionIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === `#${e.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach(l => { const s = $(l.getAttribute('href')); if (s) sectionIO.observe(s); });

  /* ---------- Vignette flottante des soins ---------- */
  const floatVisual = $('#floatVisual');
  const floatInner = floatVisual.firstElementChild;
  const fv = { x: mouse.x, y: mouse.y, rot: 0 };
  $$('.service').forEach(row => {
    row.addEventListener('mouseenter', () => {
      floatVisual.classList.add('is-on');
      $$('.visual', floatVisual).forEach(v => v.classList.toggle('is-active', v.classList.contains(row.dataset.visual)));
    });
    row.addEventListener('mouseleave', () => floatVisual.classList.remove('is-on'));
  });

  /* ---------- Marquee ---------- */
  const marquee = $('#marquee');
  let mqX = 0;
  let mqDir = -1;

  /* ---------- Rituel horizontal ---------- */
  const ritual = $('#rituel');
  const ritualTrack = $('#ritualTrack');
  const ritualBar = $('#ritualBar');
  let ritualDistance = 0;
  function sizeRitual() {
    ritualDistance = Math.max(0, ritualTrack.scrollWidth - innerWidth);
    ritual.style.height = `${innerHeight + ritualDistance}px`;
  }

  /* ---------- Signature ---------- */
  const signature = $('#signature');
  const scrollMono = $('#scrollMono');
  const sigPaths = $$('path', scrollMono);
  const sigYou = $('#sigYou'), sigMe = $('#sigMe'), sigAmp = $('#sigAmp'), sigCaption = $('#sigCaption');

  /* ---------- Parallax ---------- */
  const parallaxEls = $$('[data-speed]').map(el => ({ el, speed: +el.dataset.speed, y: 0 }));
  const depthEls = $$('#heroVisual [data-depth]').map(el => ({ el, depth: +el.dataset.depth, x: 0, y: 0 }));
  const heroMono = $('#heroMono');
  const progress = $('#progress');

  const sectionProgress = (el) => {
    const r = el.getBoundingClientRect();
    const total = r.height - innerHeight;
    return total > 0 ? clamp(-r.top / total) : 0;
  };

  /* ---------- Boucle principale ---------- */
  let headerHidden = false;
  function tick() {
    scrollY = window.scrollY;
    const delta = scrollY - lastScrollY;
    lastScrollY = scrollY;
    velocity = lerp(velocity, delta, 0.15);

    // Barre de progression
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;

    // Header
    header.classList.toggle('is-scrolled', scrollY > 40);
    if (Math.abs(delta) > 4 && !nav.classList.contains('is-open')) {
      const hide = delta > 0 && scrollY > innerHeight * 0.6;
      if (hide !== headerHidden) { headerHidden = hide; header.classList.toggle('is-hidden', hide); }
    }

    // Curseur
    cur.x = lerp(cur.x, mouse.x, 0.18);
    cur.y = lerp(cur.y, mouse.y, 0.18);
    cursor.style.transform = `translate(${cur.x}px, ${cur.y}px)`;

    if (!reduced) {
      // Parallax vertical
      parallaxEls.forEach(p => {
        const r = p.el.getBoundingClientRect();
        const center = r.top + r.height / 2 - innerHeight / 2;
        p.y = lerp(p.y, center * p.speed, 0.1);
        p.el.style.translate = `0 ${p.y.toFixed(2)}px`;
      });

      // Hero : profondeur à la souris + rotation au scroll
      const mx = (mouse.x / innerWidth - 0.5) * 2;
      const my = (mouse.y / innerHeight - 0.5) * 2;
      depthEls.forEach(d => {
        d.x = lerp(d.x, mx * d.depth * 14, 0.08);
        d.y = lerp(d.y, my * d.depth * 14, 0.08);
        const rot = d.el === heroMono ? ` rotate(${scrollY * 0.08}deg)` : '';
        d.el.style.transform = `translate(${d.x.toFixed(2)}px, ${d.y.toFixed(2)}px)${rot}`;
      });

      // Marquee : vitesse et sens suivent le scroll
      if (Math.abs(delta) > 0.5) mqDir = delta > 0 ? -1 : 1;
      mqX += mqDir * (0.6 + Math.min(Math.abs(velocity) * 0.25, 12));
      const half = marquee.scrollWidth / 2;
      if (mqX <= -half) mqX += half;
      if (mqX > 0) mqX -= half;
      marquee.style.transform = `translate3d(${mqX}px,0,0) skewX(${clamp(velocity * -0.15, -8, 8)}deg)`;

      // Vignette des soins
      fv.x = lerp(fv.x, mouse.x, 0.12);
      fv.y = lerp(fv.y, mouse.y, 0.12);
      fv.rot = lerp(fv.rot, (mouse.x - fv.x) * 0.08, 0.1);
      floatVisual.style.transform = `translate(${fv.x}px, ${fv.y}px)`;
      floatInner.style.transform = `rotate(${clamp(fv.rot, -12, 12)}deg)`;
    }

    // Manifeste
    if (manifestoWords.length) {
      const r = manifesto.getBoundingClientRect();
      const p = reduced ? 1 : clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35));
      const lit = Math.floor(p * manifestoWords.length);
      manifestoWords.forEach((w, i) => w.classList.toggle('on', i < lit));
    }

    // Rituel horizontal
    const rp = sectionProgress(ritual);
    ritualTrack.style.transform = `translate3d(${-rp * ritualDistance}px,0,0)`;
    ritualBar.style.transform = `scaleX(${rp})`;

    // Signature : le monogramme se dessine
    const sp = sectionProgress(signature);
    const segs = [[0, .45], [.05, .5], [.35, .7], [.5, .8]];
    sigPaths.forEach((path, i) => {
      const [a, b] = segs[i] || [0, 1];
      path.style.strokeDashoffset = 1 - clamp((sp - a) / (b - a));
    });
    scrollMono.style.transform = `rotate(${(1 - sp) * -40}deg) scale(${0.85 + sp * 0.15})`;
    const wp = clamp((sp - 0.1) / 0.5);
    const ease = 1 - Math.pow(1 - wp, 3);
    sigYou.style.transform = `translateX(${(1 - ease) * -40}vw)`;
    sigMe.style.transform = `translateX(${(1 - ease) * 40}vw)`;
    sigYou.style.opacity = sigMe.style.opacity = ease;
    sigAmp.style.transform = `scale(${0.2 + ease * 0.8}) rotate(${(1 - ease) * 180}deg)`;
    sigAmp.style.opacity = ease;
    sigCaption.style.opacity = clamp((sp - 0.75) / 0.15);

    requestAnimationFrame(tick);
  }

  /* ---------- Avis : carrousel ---------- */
  const slider = $('#slider');
  const sliderTrack = $('#sliderTrack');
  const slides = $$('.review', sliderTrack);
  const dotsWrap = $('#sliderDots');
  let current = 0;
  let autoTimer;
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Avis ${i + 1}`);
    b.addEventListener('click', () => goTo(i));
    dotsWrap.append(b);
  });
  const dots = $$('button', dotsWrap);
  function goTo(i) {
    current = (i + slides.length) % slides.length;
    sliderTrack.style.transform = `translateX(${-current * 100}%)`;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === current));
    dots.forEach((d, k) => {
      d.classList.remove('is-active');
      if (k === current) { void d.offsetWidth; d.classList.add('is-active'); }
    });
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 6000);
  }
  $('#prevBtn').addEventListener('click', () => goTo(current - 1));
  $('#nextBtn').addEventListener('click', () => goTo(current + 1));
  goTo(0);

  let dragStart = null;
  slider.addEventListener('pointerdown', e => { dragStart = e.clientX; slider.classList.add('is-dragging'); slider.setPointerCapture(e.pointerId); });
  slider.addEventListener('pointermove', e => {
    if (dragStart === null) return;
    const dx = e.clientX - dragStart;
    sliderTrack.style.transform = `translateX(calc(${-current * 100}% + ${dx}px))`;
  });
  const endDrag = e => {
    if (dragStart === null) return;
    const dx = e.clientX - dragStart;
    dragStart = null;
    slider.classList.remove('is-dragging');
    if (Math.abs(dx) > 60) goTo(current + (dx < 0 ? 1 : -1)); else goTo(current);
  };
  slider.addEventListener('pointerup', endDrag);
  slider.addEventListener('pointercancel', endDrag);

  /* ---------- Formulaires ---------- */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn--pill');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const rip = document.createElement('span');
    rip.className = 'ripple';
    rip.style.width = rip.style.height = `${size}px`;
    rip.style.left = `${e.clientX - r.left - size / 2}px`;
    rip.style.top = `${e.clientY - r.top - size / 2}px`;
    btn.append(rip);
    setTimeout(() => rip.remove(), 800);
  });

  const form = $('#bookingForm');
  const formMsg = $('#formMsg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('input[required]', form).forEach(input => {
      const field = input.closest('.field');
      field.classList.remove('is-error');
      if (!input.value.trim()) {
        ok = false;
        void field.offsetWidth;
        field.classList.add('is-error');
      }
    });
    if (!ok) { formMsg.textContent = 'Merci de compléter votre nom et votre téléphone.'; return; }
    const name = $('#fName').value.trim().split(' ')[0];
    formMsg.textContent = `Merci ${name} ! Nous vous rappelons très vite pour confirmer votre rendez-vous.`;
    form.reset();
  });
  $$('input', form).forEach(i => i.addEventListener('input', () => i.closest('.field')?.classList.remove('is-error')));

  $('#newsForm').addEventListener('submit', e => {
    e.preventDefault();
    const input = e.target.querySelector('input');
    input.value = '';
    input.placeholder = 'Merci, à très vite ✦';
  });

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Démarrage ---------- */
  sizeRitual();
  window.addEventListener('resize', sizeRitual);
  window.addEventListener('load', sizeRitual);
  requestAnimationFrame(tick);
})();
