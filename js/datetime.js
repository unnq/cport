// U.S. Mountain Time helper (America/Denver). Change to "America/Phoenix" for AZ (no DST).
(() => {
  const TZ = 'America/Denver';

  const dateFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });

  const timeFmt = (withSeconds) => new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hour: 'numeric', minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
    hour12: true
  });

  function zoneAbbr(d) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: TZ, hour: 'numeric', timeZoneName: 'short'
    }).formatToParts(d);
    return parts.find(p => p.type === 'timeZoneName')?.value || 'MT';
  }

  function fmtDate(d)      { return dateFmt.format(d); }
  function fmtTime(d, s)   { return `${timeFmt(s).format(d)} ${zoneAbbr(d)}`; }
  function fmtDateTime(d,s){ return `${fmtDate(d)} · ${fmtTime(d, s)}`; }

  function updateAll() {
    const now = new Date();

    document.querySelectorAll('[data-mt-date]').forEach(el => {
      el.textContent = fmtDate(now);
    });

    document.querySelectorAll('[data-mt-time]').forEach(el => {
      const withSeconds = el.hasAttribute('data-mt-seconds');
      el.textContent = fmtTime(now, withSeconds);
    });

    document.querySelectorAll('[data-mt-datetime]').forEach(el => {
      const withSeconds = el.hasAttribute('data-mt-seconds');
      el.textContent = fmtDateTime(now, withSeconds);
    });
  }

  // Align ticks to the next exact second for smooth updates
  function startTicker() {
    updateAll();
    const tick = () => { updateAll(); setTimeout(tick, 1000); };
    const ms = 1000 - (Date.now() % 1000) + 5;
    setTimeout(tick, ms);
  }

  // Expose a tiny API if you want to mount manually
  window.MT = {
    format({ kind = 'datetime', withSeconds = false } = {}) {
      const now = new Date();
      if (kind === 'date') return fmtDate(now);
      if (kind === 'time') return fmtTime(now, withSeconds);
      return fmtDateTime(now, withSeconds);
    },
    mount(selector, { kind = 'datetime', withSeconds = false } = {}) {
      const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (!el) return;
      const render = () => { el.textContent = window.MT.format({ kind, withSeconds }); };
      render();
      return setInterval(render, 1000);
    },
    setTimeZone(tz) { /* optional override */
      console.warn('Change TZ by editing TZ constant at top of script. (Kept simple on purpose.)', tz);
    }
  };

  document.addEventListener('DOMContentLoaded', startTicker);
})();
