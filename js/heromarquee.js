/* heromarquee.js
   - Infinite marquee with seamless looping.
   - Fills the row by repeating the "unit" until width >= container.
   - Inlines SVGs (fetch + DOMParser), falls back to <img> if needed.
*/

(() => {
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Use one wide "unit" SVG per row (your merged rows)
  const ROW_SVGS = {
    marq1: ['assets/svg/MARQUEE-4.svg'],
    'marq1-glow': ['assets/svg/MARQUEE-3.svg'],
    marq2: ['assets/svg/MARQUEE-2.svg'],
    marq3: ['assets/svg/MARQUEE-1.svg'],
  };

  const FALLBACK_TEXT = {
    marq1: ['CUTLASS', 'GRAPHIC DESIGN', 'TYPE', 'LAYOUTS'],
    marq2: ['BRANDING', 'POSTERS', 'ALBUM ART', 'EXPERIMENTAL'],
    marq3: ['3D RENDERS', 'MATERIALS', 'ENVIRONMENTS', 'CONCEPTS']
  };

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

 // Add this once (injects the keyframes so you don't have to edit CSS)
function ensureMarqueeCSS() {
  if (document.getElementById('marquee-anim-css')) return;
  const style = document.createElement('style');
  style.id = 'marquee-anim-css';
  style.textContent = `
    @keyframes marq {
      from { transform: translate3d(0,0,0); }
      to   { transform: translate3d(var(--marq-shift, -1000px), 0, 0); }
    }
    /* keep it on the compositor */
    .marquee-track { will-change: transform; backface-visibility: hidden; }
  `;
  document.head.appendChild(style);
}

  async function makeInlineSvgItem(src) {
    const wrap = document.createElement('div');
    wrap.className = 'marquee-item';
    try {
      const res = await fetch(src, { mode: 'same-origin' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
      const svg = doc.documentElement;
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.classList.add('marquee-svg');
      wrap.appendChild(svg);
      return wrap;
    } catch {
      return makeImageItem(src);
    }
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
    return Promise.allSettled(imgs.map(img => (img.decode ? img.decode().catch(() => {}) : Promise.resolve())));
  }

  function measureWidth(el) {
    const r = el.getBoundingClientRect();
    return Math.max(r.width || 0, el.scrollWidth || 0);
  }

  // Build one row:
  // - Build a "unit" (the content that tiles horizontally)
  // - Repeat that unit inside groupA until width >= container
  // - Clone groupA once (groupB) for seamless wrapping
  async function buildRow(trackEl, sources, fallbackTexts) {
    trackEl.innerHTML = '';

    // 1) Create the base "unit" nodes (usually one big SVG)
    let unitNodes;
    if (sources && sources.length) {
      unitNodes = await Promise.all(sources.map(makeInlineSvgItem));
    } else {
      const repeats = 4;
      unitNodes = Array.from({ length: repeats }).flatMap(() => fallbackTexts.map(makeTextItem));
    }

    // 2) Insert groupA with ONE copy of the unit
    const groupA = makeGroup(unitNodes.map(n => n.cloneNode(true)));
    trackEl.appendChild(groupA);

    // Wait a frame for layout
    await new Promise(r => requestAnimationFrame(r));
    await loadImages(trackEl); // if any <img> fallback exists

    const containerW = measureWidth(trackEl);
    let groupW = measureWidth(groupA);

    // 3) If the unit isn't wide enough, duplicate inside groupA until it fills
    // Target: at least container width + one unit (so groupA + groupB cover without gaps)
    const target = Math.max(containerW, 1) + groupW;
    while (groupW < target) {
      // append another copy of the unit
      unitNodes.forEach(n => groupA.appendChild(n.cloneNode(true)));
      await new Promise(r => requestAnimationFrame(r));
      groupW = measureWidth(groupA);
    }

    // 4) Clone groupA to create groupB (for seamless wrap)
    const groupB = groupA.cloneNode(true);
    groupB.setAttribute('aria-hidden', 'true');
    trackEl.appendChild(groupB);

    // one more measure (stable)
    await new Promise(r => requestAnimationFrame(r));
    const finalW = measureWidth(groupA);
    return { groupWidth: finalW };
  }

  // Replace your animateRow with this CSS-animated version
   function animateRow(trackEl, groupWidth, direction, speed) {
     ensureMarqueeCSS();
   
     // how far one cycle travels (px) and how long it takes (s)
     const shift = (direction === 'right' ? groupWidth : -groupWidth);
     const pxPerSec = Number(speed) || 80;
     const dur = Math.abs(groupWidth / pxPerSec); // seconds
   
     trackEl.style.setProperty('--marq-shift', `${shift}px`);
     trackEl.style.setProperty('--marq-dur', `${dur}s`);
   
     // Kick off CSS animation (doesn't pause during scroll)
     trackEl.style.animation = `marq var(--marq-dur) linear infinite`;
   
     // Return a stopper that clears inline props
     return () => {
       trackEl.style.animation = '';
       trackEl.style.removeProperty('--marq-shift');
       trackEl.style.removeProperty('--marq-dur');
     };
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
  // also build/animate the overlay track
   function initAll() {
     while (destroyers.length) (destroyers.pop())?.();
     Promise.all([
       setupRow('marq1'),
       setupRow('marq1-glow'),   // ← add this
       setupRow('marq2'),
       setupRow('marq3')
     ]).then(stoppers => stoppers.forEach(stop => destroyers.push(stop)));
   }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  let rAF = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(initAll);
  });
})();
