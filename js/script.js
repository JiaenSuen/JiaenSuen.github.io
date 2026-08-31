(() => {
  "use strict";

  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  const navItems = document.querySelectorAll(".nav-links a");
  const sections = document.querySelectorAll(".section-anchor[id]");
  const year = document.querySelector("#year");

  if (year) year.textContent = new Date().getFullYear();

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });
  }

  navItems.forEach((link) => {
    link.addEventListener("click", () => {
      navLinks?.classList.remove("open");
      navToggle?.setAttribute("aria-expanded", "false");
      navToggle?.setAttribute("aria-label", "Open navigation");
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      navLinks?.classList.remove("open");
      navToggle?.setAttribute("aria-expanded", "false");
      navToggle?.setAttribute("aria-label", "Open navigation");
    }
  });

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;

      navItems.forEach((link) => link.classList.remove("active"));
      document.querySelector(`.nav-links a[href="#${visible.target.id}"]`)?.classList.add("active");
    },
    { rootMargin: "-28% 0px -60% 0px", threshold: [0, 0.05, 0.2] }
  );

  sections.forEach((section) => observer.observe(section));
})();
