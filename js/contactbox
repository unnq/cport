
  (function () {
    const openBtn = document.getElementById('contactOpen');
    const modal   = document.getElementById('contactModal');
    const closeEls = modal.querySelectorAll('[data-close]');
    const firstField = document.getElementById('cName');

    function openModal(e) {
      if (e) e.preventDefault();
      modal.hidden = false;
      document.body.classList.add('modal-open');
      // slight delay lets it render before focusing
      setTimeout(() => firstField?.focus(), 0);
    }

    function closeModal() {
      modal.hidden = true;
      document.body.classList.remove('modal-open');
      openBtn?.focus();
    }

    openBtn?.addEventListener('click', openModal);
    closeEls.forEach(el => el.addEventListener('click', closeModal));

    // Click outside (backdrop) closes (handled via data-close on backdrop)
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // ESC to close
    document.addEventListener('keydown', (e) => {
      if (!modal.hidden && e.key === 'Escape') closeModal();
    });
  })();

