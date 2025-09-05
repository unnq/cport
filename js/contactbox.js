// js/contactbox.js
(() => {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn, { once: true });
  }

  ready(() => {
    const openBtn    = document.getElementById('contactOpen');
    const modal      = document.getElementById('contactModal');
    if (!openBtn || !modal) return;

    const closeEls   = modal.querySelectorAll('[data-close]');
    const firstField = document.getElementById('cName');

    // Safety: make sure canvases never steal clicks above us
    document.querySelectorAll('.halftone-canvas, .noise-canvas')
      .forEach(el => (el.style.pointerEvents = 'none'));

    function openModal(e) {
      if (e) e.preventDefault();
      modal.hidden = false;
      document.body.classList.add('modal-open');
      setTimeout(() => firstField && firstField.focus(), 0);
    }

    function closeModal() {
      modal.hidden = true;
      document.body.classList.remove('modal-open');
      openBtn && openBtn.focus();
    }

    openBtn.addEventListener('click', openModal);
    closeEls.forEach(el => el.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => {
      if (!modal.hidden && e.key === 'Escape') closeModal();
    });

    // Optional: click outside window (backdrop has data-close already)
    modal.addEventListener('click', (e) => {
      // If you ever change markup to have the backdrop NOT carry data-close,
      // uncomment this to detect outside clicks:
      // if (e.target === modal) closeModal();
    });

    // Handy for debugging in console:
    window.openContact = openModal;
    window.closeContact = closeModal;

    // Log to confirm the file loaded (helps catch desktop-only 404/caching)
    // console.log('[contactbox] loaded');
  });
})();
