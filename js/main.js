/* Brothers Auto Smash Repairs — interactions */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- split headings into words ---------- */
  $$('[data-split]').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--i', i++);
            w.appendChild(inner); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          // wrap element (e.g. .accent span) as a single word unit
          if (n.classList.contains('keep')) {
            const w = document.createElement('span'); w.className = 'w';
            n.replaceWith(w); w.appendChild(n); n.style.setProperty('--i', i++);
            n.style.display = 'inline-block'; n.style.transform = '';
            n.classList.add('kw');
          } else walk(n);
        }
      });
    };
    walk(el);
    el.classList.add('split');
  });
  // elements wrapped with .keep get animated as a whole
  const style = document.createElement('style');
  style.textContent = '.split .w > .kw{transform:translateY(105%);transition:transform 1s var(--ease);transition-delay:calc(var(--i) * 55ms + var(--d,0s))}.split.in .w > .kw{transform:none}';
  document.head.appendChild(style);

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal], .split, .bar .track i').forEach(el => io.observe(el));
  // auto-stagger children
  $$('[data-stagger]').forEach(p => {
    const step = parseFloat(p.dataset.stagger) || 0.08;
    [...p.children].forEach((c, i) => { if (!c.hasAttribute('data-reveal')) c.setAttribute('data-reveal', ''); c.style.setProperty('--d', (i * step).toFixed(2) + 's'); io.observe(c); });
  });

  /* ---------- header: hide on scroll down, progress bar ---------- */
  const header = $('.header'), prog = $('.progress');
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY;
    if (header && !document.body.classList.contains('menu-open')) header.classList.toggle('is-hidden', y > lastY && y > 300);
    lastY = y;
    if (prog) { const h = document.documentElement.scrollHeight - innerHeight; prog.style.transform = `scaleX(${h > 0 ? y / h : 0})`; }
    const fab = $('.fab'); if (fab) fab.classList.toggle('show', y > 500);
    processLine(); ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });

  /* ---------- mobile menu ---------- */
  const burger = $('.burger');
  if (burger) burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open);
    $('.mobile-menu').setAttribute('aria-hidden', !open);
  });
  $$('.mobile-menu a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));
  addEventListener('keydown', e => { if (e.key === 'Escape') document.body.classList.remove('menu-open'); });

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduce) {
    $$('.btn, .to-top').forEach(b => {
      b.addEventListener('mousemove', e => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18, y = (e.clientY - r.top - r.height / 2) * 0.28;
        b.style.transform = `translate(${x}px,${y}px)`;
      });
      b.addEventListener('mouseleave', () => { b.style.transform = ''; });
    });
    // cursor ring
    const c = document.createElement('div'); c.className = 'cursor'; document.body.appendChild(c);
    let mx = 0, my = 0, cx = 0, cy = 0;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; c.classList.add('on'); });
    document.addEventListener('mouseleave', () => c.classList.remove('on'));
    const loop = () => { cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2; c.style.left = cx + 'px'; c.style.top = cy + 'px'; requestAnimationFrame(loop); };
    loop();
    $$('a, button, .ba-stage, summary, .swatch, .review').forEach(el => {
      el.addEventListener('mouseenter', () => c.classList.add('big'));
      el.addEventListener('mouseleave', () => c.classList.remove('big'));
    });
  }

  /* ---------- tilt on cards ---------- */
  if (fine && !reduce) {
    $$('[data-tilt]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- counters ---------- */
  const cio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, to = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
      const dur = 1600, t0 = performance.now();
      const tick = t => {
        const p = Math.min((t - t0) / dur, 1), v = to * (1 - Math.pow(1 - p, 4));
        el.textContent = v.toFixed(dec);
        if (p < 1) requestAnimationFrame(tick);
      };
      reduce ? (el.textContent = to.toFixed(dec)) : requestAnimationFrame(tick);
      cio.unobserve(el);
    });
  }, { threshold: .5 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- before / after slider ---------- */
  $$('.ba').forEach(ba => {
    const stage = $('.ba-stage', ba), range = $('.ba-range', ba);
    let touched = false;
    const set = v => { stage.style.setProperty('--pos', v + '%'); if (range) range.value = v; };
    const fromEvent = e => { const r = stage.getBoundingClientRect(); return Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)); };
    let drag = false;
    stage.addEventListener('pointerdown', e => { drag = true; touched = true; set(fromEvent(e)); });
    addEventListener('pointermove', e => { if (drag) set(fromEvent(e)); });
    addEventListener('pointerup', () => { drag = false; });
    if (range) range.addEventListener('input', () => { touched = true; set(range.value); });
    // intro sweep hint
    if (!reduce) {
      const sio = new IntersectionObserver(en => {
        if (!en[0].isIntersecting) return; sio.disconnect();
        const t0 = performance.now();
        const anim = t => {
          if (touched) return;
          const p = (t - t0) / 2600; if (p > 1) { set(50); return; }
          set(50 + Math.sin(p * Math.PI * 2) * 32 * (1 - p));
          requestAnimationFrame(anim);
        };
        setTimeout(() => requestAnimationFrame(anim), 700);
      }, { threshold: .5 });
      sio.observe(stage);
    }
  });

  /* ---------- process line progress ---------- */
  function processLine() {
    const p = $('.process'); if (!p) return;
    const r = p.getBoundingClientRect();
    const v = Math.max(0, Math.min(1, (innerHeight * 0.75 - r.top) / (r.height + innerHeight * 0.2)));
    const line = $('.process-line i', p); if (line) line.style.setProperty('--p', v);
    $$('.step', p).forEach((s, i, arr) => s.classList.toggle('lit', v >= (i + 0.2) / arr.length || (innerWidth < 980 && s.getBoundingClientRect().top < innerHeight * 0.7)));
  }

  /* ---------- services sticky nav highlight ---------- */
  const svcLinks = $$('.svc-nav a');
  if (svcLinks.length) {
    const map = new Map(svcLinks.map(a => [a.getAttribute('href').slice(1), a]));
    const sio = new IntersectionObserver(en => {
      en.forEach(e => {
        if (e.isIntersecting) {
          svcLinks.forEach(a => a.classList.remove('active'));
          const a = map.get(e.target.id); if (a) { a.classList.add('active'); a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' }); }
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('.svc[id]').forEach(s => sio.observe(s));
  }

  /* ---------- reviews filter ---------- */
  const filters = $$('.filter');
  if (filters.length) {
    const cards = $$('.masonry .review');
    filters.forEach(f => {
      const tag = f.dataset.filter;
      const n = tag === 'all' ? cards.length : cards.filter(c => c.dataset.tags.split(' ').includes(tag)).length;
      const cnt = f.querySelector('.cnt'); if (cnt) cnt.textContent = n;
      f.addEventListener('click', () => {
        filters.forEach(x => { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
        f.classList.add('active'); f.setAttribute('aria-pressed', 'true');
        let k = 0;
        cards.forEach(c => {
          const show = tag === 'all' || c.dataset.tags.split(' ').includes(tag);
          c.classList.toggle('hide', !show);
          c.classList.remove('pop', 'in');
          if (show) { c.style.animationDelay = (k++ * 0.04) + 's'; void c.offsetWidth; c.classList.add('pop', 'in'); }
        });
      });
    });
  }

  /* ---------- opening hours: live status (Sydney time) ---------- */
  const HOURS = { 1: [570, 1110], 2: [570, 1110], 3: [570, 1110], 4: [570, 1110], 5: null, 6: [570, 900], 0: null };
  const syd = () => {
    const parts = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day, min: (+get('hour')) * 60 + (+get('minute')) };
  };
  try {
    const { day, min } = syd();
    const h = HOURS[day];
    const open = !!h && min >= h[0] && min < h[1];
    $$('[data-status]').forEach(el => {
      el.classList.toggle('open', open);
      el.querySelector('span').textContent = open ? 'Open now' : 'Closed now';
    });
    $$('.hours tr[data-day]').forEach(tr => { if (+tr.dataset.day === day) tr.classList.add('today'); });
  } catch (e) { /* ignore */ }

  /* ---------- contact form ---------- */
  const form = $('#quoteForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      $$('[required]', form).forEach(inp => {
        const f = inp.closest('.field');
        let valid = inp.value.trim() !== '';
        if (inp.type === 'tel') valid = /^[+()\d\s-]{8,}$/.test(inp.value.trim());
        f.classList.toggle('err', !valid); if (!valid) ok = false;
      });
      if (!ok) { const first = $('.field.err input, .field.err textarea, .field.err select', form); if (first) first.focus(); return; }
      const d = Object.fromEntries(new FormData(form));
      const body = `Hi Brothers Auto, I'd like a quote.\nName: ${d.name}\nPhone: ${d.phone}\nCar: ${d.car || '-'}\nService: ${d.service}\n${d.message ? 'Details: ' + d.message : ''}`;
      const sms = 'sms:+61450366899?&body=' + encodeURIComponent(body);
      $('.form-success').classList.add('show');
      form.style.display = 'none';
      const smsBtn = $('#smsBtn'); if (smsBtn) smsBtn.href = sms;
      if (matchMedia('(pointer:coarse)').matches) location.href = sms;
    });
    $$('input, textarea, select', form).forEach(i => i.addEventListener('input', () => i.closest('.field').classList.remove('err')));
  }

  /* ---------- to top ---------- */
  $$('.to-top').forEach(b => b.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })));

  /* ---------- year ---------- */
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  onScroll();
})();
