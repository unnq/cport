// noise.js — reusable animated grain overlay for any [data-noise] element
(() => {
  const SETTINGS = {
    dpr: 2,          // render scale for crispness
    opacity: 0.06,   // overall grain strength (0..1)
    scale: 2,        // visual size of the noise tile (1 = fine, higher = chunkier)
    tile: 192,       // base tile size in CSS pixels before DPR
    fps: 30,         // cap for animation (saves CPU)
    speedX: 18,      // px/sec drift horizontally
    speedY: 10,      // px/sec drift vertically
    monochrome: true // grayscale noise (true) or RGB speckles (false)
  };

  // Create a single noise tile (OffscreenCanvas if available, else normal canvas)
  function makeNoiseTile(tileCssPx, dpr, monochrome) {
    const w = Math.max(16, Math.floor(tileCssPx * dpr));
    const h = w; // square tile
    const off = typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(w, h)
      : document.createElement("canvas");
    off.width = w;
    off.height = h;
    const ictx = off.getContext("2d", { alpha: true, willReadFrequently: true });
    const img = ictx.createImageData(w, h);
    const data = img.data;

    for (let i = 0; i < data.length; i += 4) {
      if (monochrome) {
        const v = Math.random() * 255 | 0;
        data[i + 0] = v; // R
        data[i + 1] = v; // G
        data[i + 2] = v; // B
      } else {
        data[i + 0] = Math.random() * 255 | 0;
        data[i + 1] = Math.random() * 255 | 0;
        data[i + 2] = Math.random() * 255 | 0;
      }
      data[i + 3] = 255; // full alpha; we control strength via globalAlpha
    }
    ictx.putImageData(img, 0, 0);
    return off;
  }

  function setupNoise(el) {
    const c = document.createElement("canvas");
    c.className = "noise-canvas";
    el.prepend(c);

    const ctx = c.getContext("2d", { alpha: true });
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let pattern = null;
    let tileCanvas = null;
    let lastTime = performance.now();
    let acc = 0;
    const frameTime = 1000 / SETTINGS.fps;

    // drift offsets
    let offX = 0, offY = 0;

    function resize() {
      const rect = el.getBoundingClientRect();
      const w = Math.max(1, rect.width | 0);
      const h = Math.max(1, rect.height | 0);
      const dpr = SETTINGS.dpr;

      c.width = w * dpr;
      c.height = h * dpr;
      c.style.width = w + "px";
      c.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // (Re)make noise tile & pattern at current DPR
      tileCanvas = makeNoiseTile(SETTINGS.tile / SETTINGS.scale, dpr, SETTINGS.monochrome);
      pattern = ctx.createPattern(tileCanvas, "repeat");

      // Reset drift so edges look clean on resize
      offX = offY = 0;
      draw(); // draw once immediately
    }

    function draw() {
      if (!pattern) return;
      const w = c.width / SETTINGS.dpr;
      const h = c.height / SETTINGS.dpr;

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.globalAlpha = SETTINGS.opacity;

      // Translate so the pattern scrolls
      ctx.translate(-offX, -offY);
      ctx.fillStyle = pattern;
      // Overfill slightly to avoid seams when drifting
      ctx.fillRect(offX - tileCanvas.width, offY - tileCanvas.height, w + tileCanvas.width * 2, h + tileCanvas.height * 2);
      ctx.restore();
    }

    function tick(now) {
      const dt = now - lastTime;
      lastTime = now;
      acc += dt;

      // advance drift continuously
      offX += (SETTINGS.speedX * dt) / 1000;
      offY += (SETTINGS.speedY * dt) / 1000;

      // wrap offsets to keep numbers small
      const wrapX = (tileCanvas?.width || 1) / SETTINGS.dpr;
      const wrapY = (tileCanvas?.height || 1) / SETTINGS.dpr;
      if (offX > wrapX) offX -= wrapX;
      if (offY > wrapY) offY -= wrapY;

      // cap draw rate
      if (acc >= frameTime) {
        draw();
        acc = 0;
      }
      raf = requestAnimationFrame(tick);
    }

    let raf = requestAnimationFrame(tick);

    // Public-ish controls for convenience
    el.noise = {
      setOpacity(v) { SETTINGS.opacity = v; },
      setSpeed(x, y) { SETTINGS.speedX = x; SETTINGS.speedY = y; },
      pause() { cancelAnimationFrame(raf); },
      resume() { lastTime = performance.now(); raf = requestAnimationFrame(tick); },
      remake() { resize(); },
    };

    // initial
    resize();
  }

  document.querySelectorAll("[data-noise]").forEach(setupNoise);
})();
