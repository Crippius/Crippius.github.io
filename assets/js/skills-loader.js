/* ====================================================================
   SKILLS LOADER
   Dynamically loads skills from skills-config.json
   ==================================================================== */

let SKILLS_CONFIG = {};

/**
 * Load skills configuration from JSON file
 */
async function loadSkillsConfig() {
  try {
    const response = await fetch("/assets/js/skills-config.json");
    if (!response.ok) {
      console.error("Skills config file not found");
      return;
    }
    SKILLS_CONFIG = await response.json();
    renderSkills();
  } catch (error) {
    console.error("Error loading skills config:", error);
  }
}

/**
 * Icon mapping for programming languages
 */
const LANGUAGE_ICONS = {
  Python: "fab fa-python",
  C: "fas fa-code",
  "C++": "fas fa-code",
  SQL: "fas fa-database",
  JavaScript: "fab fa-js",
  Java: "fab fa-java",
  MATLAB: "fas fa-chart-line",
  Bash: "fab fa-linux",
  HTML: "fab fa-html5",
  CSS: "fab fa-css3-alt",
};

/**
 * Icon mapping for other tools
 */
const TOOL_ICONS = {
  Git: "fab fa-git-alt",
  Linux: "fab fa-linux",
  Docker: "fab fa-docker",
};

/**
 * Render skills sections dynamically
 */
function renderSkills() {
  renderProgrammingLanguages();
  renderCategorySkills("data_science", "Data Science");
  renderCategorySkills("ai", "AI / Machine Learning");
  renderCategorySkills("hpc", "HPC");
  renderOtherTools();
}

/**
 * Render programming languages section
 */
function renderProgrammingLanguages() {
  const container = document.querySelector("#programming-languages-section");
  if (!container || !SKILLS_CONFIG.programming_languages) return;

  let html = "";
  SKILLS_CONFIG.programming_languages.forEach((lang) => {
    const icon = LANGUAGE_ICONS[lang] || "fas fa-code";
    html += `<span class="tech-tag"><i class="${icon}"></i> ${lang}</span>\n  `;
  });

  container.innerHTML = html;
}

/**
 * Render skills for a specific category
 */
function renderCategorySkills(categoryKey, sectionName) {
  const container = document.querySelector(`#${categoryKey}-section`);
  if (!container || !SKILLS_CONFIG.categories[categoryKey]) return;

  const skills = SKILLS_CONFIG.categories[categoryKey].skills;
  let html = "";

  skills.forEach((skill) => {
    html += `<span class="tech-tag">${skill}</span>\n  `;
  });

  container.innerHTML = html;
}

/**
 * Render other tools section (excluding programming languages)
 */
function renderOtherTools() {
  const container = document.querySelector("#other-tools-section");
  if (!container || !SKILLS_CONFIG.categories.other) return;

  const otherSkills = SKILLS_CONFIG.categories.other.skills;
  // Filter out programming languages (they're already in the programming languages section)
  const tools = otherSkills.filter(
    (skill) => !SKILLS_CONFIG.programming_languages.includes(skill)
  );

  let html = "";
  tools.forEach((tool) => {
    const icon = TOOL_ICONS[tool];
    if (icon) {
      html += `<span class="tech-tag"><i class="${icon}"></i> ${tool}</span>\n  `;
    } else {
      html += `<span class="tech-tag">${tool}</span>\n  `;
    }
  });

  container.innerHTML = html;
}

// Load skills when page loads
document.addEventListener("DOMContentLoaded", loadSkillsConfig);
