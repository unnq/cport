(() => {
  const SETTINGS = {
    grid: 24,         // spacing between dots (px)
    radius: 3,        // base dot radius
    swell: 0.7,       // how much radius swells in middle (0–1)
    edgeSoft: 0.6,    // 0 = hard edge, 1 = soft falloff
    opacity: 0.08,    // darkness of dots
    dpr: 2            // device pixel ratio multiplier
  };

  function drawHalftone(canvas, ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = `rgba(255,255,255,${SETTINGS.opacity})`; // white dots, subtle
    const cols = Math.ceil(w / SETTINGS.grid);
    const rows = Math.ceil(h / SETTINGS.grid);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cx = x * SETTINGS.grid + SETTINGS.grid / 2;
        const cy = y * SETTINGS.grid + SETTINGS.grid / 2;

        // normalized distance from center (0 middle → 1 edge)
        const dx = (cx - w / 2) / (w / 2);
        const dy = (cy - h / 2) / (h / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        // shrink dots near edges, swell near center
        const falloff = Math.max(0, 1 - dist / SETTINGS.edgeSoft);
        const r = SETTINGS.radius * (1 + SETTINGS.swell * falloff);

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function setupHalftone(el) {
    const canvas = document.createElement("canvas");
    canvas.className = "halftone-canvas";
    el.prepend(canvas);
    const ctx = canvas.getContext("2d");

    function resize() {
      const rect = el.getBoundingClientRect();
      canvas.width = rect.width * SETTINGS.dpr;
      canvas.height = rect.height * SETTINGS.dpr;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(SETTINGS.dpr, 0, 0, SETTINGS.dpr, 0, 0);
      drawHalftone(canvas, ctx, rect.width, rect.height);
    }

    window.addEventListener("resize", resize);
    resize();
  }

  document.querySelectorAll("[data-halftone]").forEach(setupHalftone);
})();
