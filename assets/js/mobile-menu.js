/* ====================================================================
   MOBILE MENU TOGGLE
   ==================================================================== */

(function () {
  /**
   * Toggle mobile menu visibility
   */
  function toggleMobileMenu() {
    const navMenu = document.querySelector(".nav-menu");
    const toggle = document.querySelector(".mobile-menu-toggle");

    if (navMenu && toggle) {
      navMenu.classList.toggle("active");
      toggle.classList.toggle("active");

      // Toggle aria-expanded for accessibility
      const isExpanded = navMenu.classList.contains("active");
      toggle.setAttribute("aria-expanded", isExpanded);

      // Prevent body scroll when menu is open
      if (isExpanded) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
  }

  /**
   * Close mobile menu when clicking outside
   */
  function handleClickOutside(event) {
    const navMenu = document.querySelector(".nav-menu");
    const toggle = document.querySelector(".mobile-menu-toggle");

    if (!navMenu || !toggle) return;

    if (
      navMenu.classList.contains("active") &&
      !navMenu.contains(event.target) &&
      !toggle.contains(event.target)
    ) {
      toggleMobileMenu();
    }
  }

  /**
   * Close mobile menu when clicking a link
   */
  function handleLinkClick() {
    const navMenu = document.querySelector(".nav-menu");
    if (navMenu && navMenu.classList.contains("active")) {
      toggleMobileMenu();
    }
  }

  /**
   * Initialize mobile menu
   */
  function initMobileMenu() {
    const toggle = document.querySelector(".mobile-menu-toggle");

    if (toggle) {
      toggle.addEventListener("click", toggleMobileMenu);
      toggle.setAttribute("aria-expanded", "false");
    }

    // Close menu when clicking outside
    document.addEventListener("click", handleClickOutside);

    // Close menu when clicking a nav link
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      link.addEventListener("click", handleLinkClick);
    });

    // Close menu on escape key
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        const navMenu = document.querySelector(".nav-menu");
        if (navMenu && navMenu.classList.contains("active")) {
          toggleMobileMenu();
        }
      }
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth > 768) {
          const navMenu = document.querySelector(".nav-menu");
          if (navMenu && navMenu.classList.contains("active")) {
            toggleMobileMenu();
          }
        }
      }, 250);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMobileMenu);
  } else {
    initMobileMenu();
  }
})();
