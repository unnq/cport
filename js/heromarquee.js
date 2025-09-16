/* heromarquee.js
   - Infinite marquee with seamless looping.
   - Each row fills 1/3 of .hero-top via flex.
   - SVGs optional; large fallback text shown if arrays empty.
*/

(() => {
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1) Put your SVG file paths here when ready:
const ROW_SVGS = {
  marq1: [
    'assets/svg/aeg.svg',
    'assets/svg/bjork.svg',
    'assets/svg/Asset15.svg',
    'assets/svg/cutla.svg',
    'assets/svg/cutla2.svg',
    'assets/svg/doron.svg',
    'assets/svg/ecco.svg',
    'assets/svg/golden eye.svg',
    'assets/svg/hga.svg',
    'assets/svg/kyoto.svg',
    'assets/svg/nike.svg',
    'assets/svg/rebel.svg',
    'assets/svg/silvia.svg',
    'assets/svg/traphaus.svg'
  ], // top row (original order)

  marq2: [
    'assets/svg/aeg.svg',
    'assets/svg/bjork.svg',
    'assets/svg/cutla.svg',
    'assets/svg/cutla2.svg',
    'assets/svg/doron.svg',
    'assets/svg/ecco.svg',
    'assets/svg/golden eye.svg',
    'assets/svg/hga.svg',
    'assets/svg/kyoto.svg',
    'assets/svg/nike.svg',
    'assets/svg/rebel.svg',
    'assets/svg/silvia.svg',
    'assets/svg/traphaus.svg'
  ], // middle row (original order)

  marq3: [
    'assets/svg/rebel.svg',
    'assets/svg/ecco.svg',
    'assets/svg/nike.svg',
    'assets/svg/cutla2.svg',
    'assets/svg/bjork.svg',
    'assets/svg/hga.svg',
    'assets/svg/aeg.svg',
    'assets/svg/silvia.svg',
    'assets/svg/doron.svg',
    'assets/svg/traphaus.svg',
    'assets/svg/kyoto.svg',
    'assets/svg/golden eye.svg',
    'assets/svg/cutla.svg'
  ]  // bottom row (mixed order)
};



  // 2) Fallback text (repeated to form a loop)
  const FALLBACK_TEXT = {
    marq1: ['CUTLASS', 'GRAPHIC DESIGN', 'TYPE', 'LAYOUTS'],
    marq2: ['BRANDING', 'POSTERS', 'ALBUM ART', 'EXPERIMENTAL'],
    marq3: ['3D RENDERS', 'MATERIALS', 'ENVIRONMENTS', 'CONCEPTS']
  };

  // --- helpers ---
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function makeImageItem(src) {
    const wrap = document.createElement('div');
    wrap.className = 'marquee-item';
    const img = document.createElement('img');
    img.decoding = 'async';
    img.loading = 'eager';
    img.src = src;
    img.alt = '';
    wrap.appendChild(img);
    return wrap;
  }

  function makeTextItem(txt) {
    const span = document.createElement('span');
    span.className = 'marquee-fallback';
    span.textContent = txt;
    return span;
  }

  function makeGroup(nodes) {
    const g = document.createElement('div');
    g.className = 'marquee-group';
    nodes.forEach(n => g.appendChild(n));
    return g;
  }

  function loadImages(root) {
    const imgs = $$('img', root);
    return Promise.allSettled(
      imgs.map(img => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()))
    );
  }

  // Build one row: create two identical groups for seamless loop
  async function buildRow(trackEl, sources, fallbackTexts) {
    trackEl.innerHTML = '';

    let nodes;
    if (sources && sources.length) {
      nodes = sources.map(makeImageItem);
    } else {
      // repeat fallback text to ensure enough width for looping
      const repeats = 4; // adjust if you want denser line
      nodes = Array.from({ length: repeats })
        .flatMap(() => fallbackTexts.map(makeTextItem));
    }

    const groupA = makeGroup(nodes);
    const groupB = groupA.cloneNode(true);
    groupB.setAttribute('aria-hidden', 'true');

    trackEl.appendChild(groupA);
    trackEl.appendChild(groupB);

    await loadImages(trackEl);

    // Width after layout (we need this for wrapping logic)
    const w = groupA.getBoundingClientRect().width;
    return { groupWidth: w };
  }

  // Animate one row with rAF
  function animateRow(trackEl, groupWidth, direction, speed) {
    if (prefersReduced || !groupWidth) return () => {};

    // speed = px/s → px/ms
    const vel = (Number(speed) || 80) / 1000;
    const dir = direction === 'right' ? 1 : -1;

    // For right-moving, start offset at -groupWidth so it slides in from left
    let offset = dir === 1 ? -groupWidth : 0;
    let last = performance.now();
    let rafId = 0;

    const tick = (now) => {
      const dt = now - last;
      last = now;

      offset += dir * vel * dt;

      if (dir === -1) {
        // moving left: wrap when scrolled past groupWidth
        if (Math.abs(offset) >= groupWidth) offset += groupWidth;
      } else {
        // moving right: wrap when offset reaches 0 from -groupWidth
        if (offset >= 0) offset -= groupWidth;
      }

      trackEl.style.transform = `translate3d(${offset}px,0,0)`;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }

  async function setupRow(trackId) {
    const trackEl = document.getElementById(trackId);
    if (!trackEl) return () => {};

    const rowEl = trackEl.closest('.marquee-row');
    const direction = rowEl?.dataset?.direction || 'left';
    const speed = rowEl?.dataset?.speed || '80';

    const { groupWidth } = await buildRow(
      trackEl,
      ROW_SVGS[trackId],
      FALLBACK_TEXT[trackId] || ['ADD', 'SVG', 'FILES']
    );

    return animateRow(trackEl, groupWidth, direction, speed);
  }

  const destroyers = [];
  function initAll() {
    // stop any previous animations before rebuilding
    while (destroyers.length) (destroyers.pop())?.();

    Promise.all([setupRow('marq1'), setupRow('marq2'), setupRow('marq3')])
      .then(stoppers => stoppers.forEach(stop => destroyers.push(stop)));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Rebuild on resize (debounced)
  let rAF = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(initAll);
  });
})();
