document.addEventListener('DOMContentLoaded', function() {
  // Hamburger menu toggle
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function() {
      const isOpen = hamburger.classList.toggle('nav-open');
      navLinks.classList.toggle('nav-open');
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when a nav link is clicked
    navLinks.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        hamburger.classList.remove('nav-open');
        navLinks.classList.remove('nav-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

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
