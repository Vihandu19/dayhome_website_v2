document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('privacy-modal');
  const openLinks = document.querySelectorAll('[data-privacy-open]');
  const closeButton = document.querySelector('[data-privacy-close]');
  let lastFocusedElement = null;

  if (!modal || !openLinks.length || !closeButton) return;

  function openModal(event) {
    event.preventDefault();
    lastFocusedElement = document.activeElement;
    modal.classList.add('modal-open');
    modal.setAttribute('aria-hidden', 'false');
    closeButton.focus();
  }

  function closeModal() {
    modal.classList.remove('modal-open');
    modal.setAttribute('aria-hidden', 'true');

    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  }

  openLinks.forEach(function(link) {
    link.addEventListener('click', openModal);
  });

  closeButton.addEventListener('click', closeModal);

  modal.addEventListener('click', function(event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.classList.contains('modal-open')) {
      closeModal();
    }
  });
});
