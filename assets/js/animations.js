document.addEventListener('DOMContentLoaded', function() {
  const nav = document.querySelector('nav');
  let navTicking = false;

  function updateNavState() {
    if (nav) {
      nav.classList.toggle('nav-scrolled', window.scrollY > 20);
    }

    navTicking = false;
  }

  if (nav) {
    updateNavState();

    window.addEventListener('scroll', function() {
      if (navTicking) return;

      navTicking = true;
      window.requestAnimationFrame(updateNavState);
    }, { passive: true });
  }
});
