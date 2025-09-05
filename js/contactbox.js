<!-- Place this AFTER the modal HTML and before </body> is fine when using defer -->
<script defer>
  (function () {
    function ready(fn){ 
      if (document.readyState !== 'loading') fn();
      else document.addEventListener('DOMContentLoaded', fn);
    }
    ready(() => {
      const openBtn   = document.getElementById('contactOpen');
      const modal     = document.getElementById('contactModal');
      if (!modal || !openBtn) return;
      const closeEls  = modal.querySelectorAll('[data-close]');
      const firstField= document.getElementById('cName');

      function openModal(e){ 
        if (e) e.preventDefault();
        modal.hidden = false;
        document.body.classList.add('modal-open');
        setTimeout(() => firstField?.focus(), 0);
      }
      function closeModal(){
        modal.hidden = true;
        document.body.classList.remove('modal-open');
        openBtn?.focus();
      }

      openBtn.addEventListener('click', openModal);
      closeEls.forEach(el => el.addEventListener('click', closeModal));
      document.addEventListener('keydown', (e) => {
        if (!modal.hidden && e.key === 'Escape') closeModal();
      });
      // If someone clicks the backdrop <div class="modal-backdrop" data-close>
      // it's already wired by [data-close], but keep this just in case:
      modal.addEventListener('click', (e) => {
        // if you ever change markup and want click-outside close:
        if (e.target === modal) closeModal();
      });

      // handy manual trigger for debugging on desktop:
      window.openContact = openModal;
    });
  })();
</script>
