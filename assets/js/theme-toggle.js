/* ====================================================================
   DARK/LIGHT MODE TOGGLE
   ==================================================================== */

(function () {
  const THEME_KEY = "theme-preference";

  /**
   * Get the current theme from localStorage or system preference
   */
  function getThemePreference() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) {
      return stored;
    }

    // Check system preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }

    return "light";
  }

  /**
   * Apply the theme to the document
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);

    // Update icon
    const themeToggle = document.querySelector(".theme-toggle");
    if (themeToggle) {
      const icon = themeToggle.querySelector("i");
      if (icon) {
        icon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
      }
    }
  }

  /**
   * Toggle between light and dark themes
   */
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
  }

  /**
   * Initialize theme on page load
   */
  function initTheme() {
    const theme = getThemePreference();
    applyTheme(theme);

    // Add click listener to toggle button
    const themeToggle = document.querySelector(".theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", toggleTheme);
    }
  }

  // Apply theme immediately to prevent flash
  const theme = getThemePreference();
  document.documentElement.setAttribute("data-theme", theme);

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTheme);
  } else {
    initTheme();
  }

  // Listen for system theme changes
  if (window.matchMedia) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (!localStorage.getItem(THEME_KEY)) {
          applyTheme(e.matches ? "dark" : "light");
        }
      });
  }
})();
