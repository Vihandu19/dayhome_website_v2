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

  const sections = document.querySelectorAll('.fade-in-section');

  if (!sections.length) return;

  if (!('IntersectionObserver' in window)) {
    sections.forEach(function(section) {
      section.classList.add('is-visible');
    });
    return;
  }

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;

      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.15
  });

  sections.forEach(function(section) {
    observer.observe(section);
  });
});
