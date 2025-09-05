// noise.js — true static grain for any [data-noise] element
(() => {
  const SETTINGS = {
    dpr: 2,            // render scale
    fps: 16,           // cap the refresh rate
    opacity: 0.06,     // overall strength (0..1)
    scale: 1,          // 1 = fine, higher = chunkier
    tile: 160,         // base tile size (CSS px before DPR & scale)
    layers: 1,         // blend N independently reseeded layers
    monochrome: true,  // true = grayscale noise
    blend: "normal",   // "normal", "screen", "overlay", etc.
  };

  function makeNoiseTile(sizePx, monochrome) {
    const w = sizePx, h = sizePx;
    let c;
    if (typeof OffscreenCanvas !== "undefined") {
      c = new OffscreenCanvas(w, h);
    } else {
      c = document.createElement("canvas");
      c.width = w;
      c.height = h;
    }
    const g = c.getContext("2d", { willReadFrequently: true });
    const img = g.createImageData(w, h);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
      if (monochrome) {
        const v = (Math.random() * 255) | 0;
        data[i] = data[i + 1] = data[i + 2] = v;
      } else {
        data[i] = (Math.random() * 255) | 0;
        data[i + 1] = (Math.random() * 255) | 0;
        data[i + 2] = (Math.random() * 255) | 0;
      }
      data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  function setup(el) {
    const canvas = document.createElement("canvas");
    canvas.className = "noise-canvas";
    el.prepend(canvas);
    const ctx = canvas.getContext("2d", { alpha: true });
    let width = 1, height = 1;
    let last = performance.now(), acc = 0, raf = 0;
    const frame = 1000 / SETTINGS.fps;

    function resize() {
      const r = el.getBoundingClientRect();
      width = Math.max(1, r.width | 0);
      height = Math.max(1, r.height | 0);
      const d = SETTINGS.dpr;
      canvas.width = width * d;
      canvas.height = height * d;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }

    function redraw() {
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = SETTINGS.opacity;
      ctx.globalCompositeOperation = SETTINGS.blend;
      ctx.imageSmoothingEnabled = false;

      for (let i = 0; i < SETTINGS.layers; i++) {
        const tileCSS = Math.max(16, (SETTINGS.tile / SETTINGS.scale) | 0);
        const tile = makeNoiseTile(tileCSS * SETTINGS.dpr, SETTINGS.monochrome);
        const pat = ctx.createPattern(tile, "repeat");
        const jx = Math.random() * tileCSS;
        const jy = Math.random() * tileCSS;

        ctx.save();
        ctx.translate(jx, jy);
        ctx.fillStyle = pat;
        ctx.fillRect(-tileCSS, -tileCSS, width + tileCSS * 2, height + tileCSS * 2);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    function tick(now) {
      const dt = now - last; last = now; acc += dt;
      if (acc >= frame) {
        redraw();
        acc = 0;
      }
      raf = requestAnimationFrame(tick);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(el);

    el.noise = {
      setOpacity(v) { SETTINGS.opacity = v; },
      setFps(v) { SETTINGS.fps = Math.max(1, v|0); },
      setScale(v) { SETTINGS.scale = Math.max(0.5, v); },
      setLayers(n){ SETTINGS.layers = Math.max(1, n|0); },
      pause(){ cancelAnimationFrame(raf); },
      resume(){ last = performance.now(); raf = requestAnimationFrame(tick); },
      once(){ redraw(); },
    };

    resize();
    raf = requestAnimationFrame(tick);
  }

  document.querySelectorAll("[data-noise]").forEach(setup);
})();
