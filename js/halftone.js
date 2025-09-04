// halftone.js
(() => {
  const SETTINGS = {
    grid: 7,            // spacing between dots (px)
    minRadius: 0.25,    // minimum dot radius (px)
    maxRadius: 1.5,     // maximum dot radius (px)
    swell: 0.2,         // intensity of center swell (0..1)
    edgeSoft: 0.2,      // edge falloff softness (smaller = tighter vignette)
    opacity: 0.22,      // dot darkness; higher = darker (on near-black bg)
    dpr: 2,             // render scale for crispness
    dotRGB: [0, 0, 0]   // dark dots; use [255,255,255] for light dots
  };

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function drawHalftone(ctx, width, height) {
    const {
      grid, minRadius, maxRadius, swell, edgeSoft, opacity, dotRGB
    } = SETTINGS;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = `rgba(${dotRGB[0]}, ${dotRGB[1]}, ${dotRGB[2]}, ${opacity})`;

    const cols = Math.ceil(width / grid);
    const rows = Math.ceil(height / grid);
    const cx0 = width * 0.5;
    const cy0 = height * 0.5;
    const invW = 1 / (width * 0.5 || 1);
    const invH = 1 / (height * 0.5 || 1);
    const edge = Math.max(1e-4, edgeSoft); // avoid divide-by-zero

    for (let iy = 0; iy < rows; iy++) {
      const cy = iy * grid + grid * 0.5;
      const dy = (cy - cy0) * invH;

      for (let ix = 0; ix < cols; ix++) {
        const cx = ix * grid + grid * 0.5;
        const dx = (cx - cx0) * invW;

        // normalized distance from center (0 center → ~1 edge corners)
        const dist = Math.hypot(dx, dy);

        // falloff: 1 at center → 0 toward edges (controlled by edgeSoft)
        const falloff = clamp(1 - dist / edge, 0, 1);

        // radius mapped by swell, then clamped to min..max
        let r = minRadius + (maxRadius - minRadius) * (falloff * swell);
        r = clamp(r, minRadius, maxRadius);

        // draw
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function setupHost(el) {
    // create canvas
    const canvas = document.createElement("canvas");
    canvas.className = "halftone-canvas";
    el.prepend(canvas);
    const ctx = canvas.getContext("2d", { alpha: true });

    const ro = new ResizeObserver(() => resizeAndDraw());
    ro.observe(el);

    function resizeAndDraw() {
      const rect = el.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      const dpr = SETTINGS.dpr;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";

      // scale for DPR
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawHalftone(ctx, w, h);
    }

    // also redraw on orientation/zoom-ish changes
    window.addEventListener("resize", resizeAndDraw, { passive: true });
    resizeAndDraw();
  }

  // Initialize on all hosts
  document.querySelectorAll("[data-halftone]").forEach(setupHost);
})();
