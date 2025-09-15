/* heromarquee.js
   - Builds 3 marquee rows from arrays of SVG paths.
   - Alternating directions (left/right) per row.
   - Seamless loop via duplicated groups.
   - Graceful fallback text when arrays are empty.
*/

(() => {
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // === 1) Provide your SVG filenames here when ready ===
  // Example: ['assets/svg/logo1.svg','assets/svg/logo2.svg', ...]
  const ROW_SVGS = {
    marq1: [], // row 1 paths
    marq2: [], // row 2 paths
    marq3: []  // row 3 paths
  };

  const FALLBACK = {
    marq1: 'Row 1 — add SVGs (update ROW_SVGS.marq1)',
    marq2: 'Row 2 — add SVGs (update ROW_SVGS.marq2)',
    marq3: 'Row 3 — add SVGs (update ROW_SVGS.marq3)'
  };

  // === 2) Utilities ===
  function makeItem(src) {
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

  function makeGroup(items) {
    const group = document.createElement('div');
    group.className = 'marquee-group';
    items.forEach(el => group.appendChild(el));
    return group;
  }

  function loadAllImages(root) {
    const imgs = Array.from(root.querySelectorAll('img'));
    return Promise.allSettled(
      imgs.map(img => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()))
    );
  }

  // Build a row: insert two identical groups for looping
  async function buildRow(trackEl, sources, fallbackText) {
    trackEl.innerHTML = '';

    if (!sources || sources.length === 0) {
      const fb = document.createElement('span');
      fb.className = 'marquee-fallback';
      fb.textContent = fallbackText || 'Add SVGs here';
      trackEl.appendChild(fb);
      return { groupWidth: 0 };
    }

    const items = sources.map(makeItem);
    const groupA = makeGroup(items);
    const groupB = groupA.cloneNode(true);
    groupB.setAttribute('aria-hidden', 'true');

    trackEl.appendChild(groupA);
    trackEl.appendChild(groupB);

    // Wait for images to layout so we can measure widths
    await loadAllImages(trackEl);

    const groupWidth = groupA.getBoundingClientRect().width;
    return { groupWidth, groupA, groupB };
  }

  // Animate a single row
  function animateRow(rowEl, trackEl, groupWidth, direction, speed) {
    if (prefersReduced || !groupWidth) return () => {};

    // px/s -> px/ms
    const vel = (Number(speed) || 70) / 1000;
    const dir = direction === 'right' ? 1 : -1;

    // For rightward motion, start at -groupWidth so it slides in
    let offset = dir === 1 ? -groupWidth : 0;
    let last = performance.now();

    let rafId = 0;
    const tick = (now) => {
      const dt = now - last;
      last = now;

      offset += dir * vel * dt;

      if (dir === -1) {
        // moving left: wrap when fully shifted left by groupWidth
        if (Math.abs(offset) >= groupWidth) offset += groupWidth;
      } else {
        // moving right: wrap when we reach 0 from -groupWidth
        if (offset >= 0) offset -= groupWidth;
      }

      trackEl.style.transform = `translate3d(${offset}px,0,0)`;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }

  // Rebuild and (re)start a row (useful on resize)
  async function setupRow(trackId) {
    const trackEl = document.getElementById(trackId);
    if (!trackEl) return () => {};

    const rowEl = trackEl.closest('.marquee-row');
    const dir = rowEl?.dataset?.direction || 'left';
    const speed = rowEl?.dataset?.speed || '70';

    const { groupWidth } = await buildRow(trackEl, ROW_SVGS[trackId] || [], FALLBACK[trackId]);
    return animateRow(rowEl, trackEl, groupWidth, dir, speed);
  }

  // === 3) Init all rows ===
  const destroyers = [];
  function init() {
    destroyers.splice(0).forEach(fn => fn()); // clean any existing rafs

    Promise.all([
      setupRow('marq1'),
      setupRow('marq2'),
      setupRow('marq3')
    ]).then(stoppers => {
      stoppers.forEach(stop => destroyers.push(stop));
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Reflow on resize (debounced)
  let rAF = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(() => init());
  });
})();
