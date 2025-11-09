/* ====================================================================
   GITHUB PROJECTS LOADER
   Automatically fetches and displays GitHub repositories
   ==================================================================== */

// Configuration - will be set from HTML page
let GITHUB_USERNAME = "Crippius";
let FEATURED_REPOS = [];
let EXCLUDE_REPOS = [];
let EXTERNAL_REPOS = []; // Format: [{ owner: "username", repo: "repo-name" }]
let PROJECT_OVERRIDES = {}; // Will be loaded from project-overrides.json

// Function to set configuration
function setGitHubConfig(
  username,
  featuredRepos = [],
  excludeRepos = [],
  externalRepos = []
) {
  GITHUB_USERNAME = username;
  FEATURED_REPOS = featuredRepos;
  EXCLUDE_REPOS = excludeRepos;
  EXTERNAL_REPOS = externalRepos;
}

/**
 * Load project overrides from JSON file
 */
async function loadProjectOverrides() {
  try {
    const response = await fetch("/assets/js/project-overrides.json");
    if (!response.ok) {
      console.warn("Project overrides file not found, using defaults");
      return {};
    }
    PROJECT_OVERRIDES = await response.json();
    return PROJECT_OVERRIDES;
  } catch (error) {
    console.warn("Error loading project overrides:", error);
    return {};
  }
}

/**
 * Fetch repositories from GitHub API
 */

// Fetch repositories from repos-config.json
async function fetchReposFromConfig() {
  try {
    const response = await fetch("/assets/js/repos-config.json");
    if (!response.ok) throw new Error("Could not load repos config");
    const reposConfig = await response.json();
    const promises = reposConfig.map(({ owner, repo }) =>
      fetchExternalRepo(owner, repo)
    );
    const results = await Promise.all(promises);
    const repos = results.filter((repo) => repo !== null);

    // Add the pinned property from config to each repo
    repos.forEach((repo, index) => {
      const config = reposConfig.find(
        (cfg) => cfg.owner === repo.owner.login && cfg.repo === repo.name
      );
      if (config) {
        repo.pinned = config.pinned !== undefined ? config.pinned : false;
      } else {
        repo.pinned = false;
      }
    });

    return repos;
  } catch (error) {
    console.error("Error loading repos config:", error);
    return [];
  }
}

/**
 * Cache configuration
 */
const CACHE_KEY_PREFIX = "gh_repo_";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get cached repository data
 */
function getCachedRepo(owner, repoName) {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${owner}/${repoName}`;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (now - timestamp < CACHE_DURATION) {
      console.log(`Using cached data for ${owner}/${repoName}`);
      return data;
    }

    // Cache expired, remove it
    localStorage.removeItem(cacheKey);
    return null;
  } catch (error) {
    console.warn("Error reading cache:", error);
    return null;
  }
}

/**
 * Save repository data to cache
 */
function setCachedRepo(owner, repoName, data) {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${owner}/${repoName}`;
    const cacheData = {
      data: data,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.warn("Error saving to cache:", error);
  }
}

/**
 * Create fallback repo object from overrides
 */
function createFallbackRepo(owner, repoName) {
  const repoKey = `${owner}/${repoName}`;
  const overrides = PROJECT_OVERRIDES[repoKey];

  if (!overrides) {
    console.warn(`No override data found for ${repoKey}`);
    return null;
  }

  // Create a minimal repo object with override data
  return {
    name: repoName,
    full_name: repoKey,
    owner: { login: owner },
    html_url: overrides.github_url || `https://github.com/${repoKey}`,
    description: overrides.description || "No description available",
    stargazers_count: 0,
    forks_count: 0,
    language: null,
    homepage: null,
    updated_at: new Date().toISOString(),
    _isFallback: true, // Flag to indicate this is fallback data
  };
}

/**
 * Fetch a single repository from GitHub with caching
 */
async function fetchExternalRepo(owner, repoName) {
  // Try cache first
  const cached = getCachedRepo(owner, repoName);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}`
    );

    if (!response.ok) {
      // Check if it's a rate limit error
      if (response.status === 403 || response.status === 429) {
        console.warn(
          `GitHub API rate limit hit for ${owner}/${repoName}, using fallback data`
        );
        return createFallbackRepo(owner, repoName);
      }
      throw new Error(
        `Failed to fetch ${owner}/${repoName} (${response.status})`
      );
    }

    const data = await response.json();

    // Save to cache
    setCachedRepo(owner, repoName, data);

    return data;
  } catch (error) {
    console.error(`Error fetching external repo ${owner}/${repoName}:`, error);

    // Try to use fallback data from overrides
    const fallback = createFallbackRepo(owner, repoName);
    if (fallback) {
      console.log(`Using fallback data for ${owner}/${repoName}`);
      return fallback;
    }

    return null;
  }
}

/**
 * Get color for a skill/tag based on category
 */
function getTagColor(tag) {
  if (!window.SKILLS_CONFIG || !window.SKILLS_CONFIG.categories) {
    return "#95a5a6"; // default gray
  }

  // Search for the tag in all categories
  for (const [categoryKey, categoryData] of Object.entries(
    window.SKILLS_CONFIG.categories
  )) {
    if (categoryData.skills && categoryData.skills.includes(tag)) {
      return categoryData.color;
    }
  }

  return "#95a5a6"; // default gray for unknown skills
}

/**
 * Get categories that a project belongs to based on its tags
 */
function getProjectCategories(tags) {
  const categories = new Set();

  if (!tags || !window.SKILLS_CONFIG || !window.SKILLS_CONFIG.categories) {
    return categories;
  }

  // Check each tag against all categories
  tags.forEach((tag) => {
    for (const [categoryKey, categoryData] of Object.entries(
      window.SKILLS_CONFIG.categories
    )) {
      if (categoryData.skills && categoryData.skills.includes(tag)) {
        categories.add(categoryKey);
      }
    }
  });

  return categories;
}

/**
 * Create HTML for a project card
 */
function createProjectCard(repo) {
  // Check for overrides
  const repoKey = repo.full_name;
  const overrides = PROJECT_OVERRIDES[repoKey] || {};

  // Apply overrides or use defaults
  const title = overrides.title || repo.name;
  const description =
    overrides.description || repo.description || "No description available";
  const customImage = overrides.image;

  // Determine the GitHub URL
  const githubUrl =
    overrides.github_url || repo.html_url || `https://github.com/${repoKey}`;

  // Social preview image (OpenGraph image), custom image, or default placeholder
  let socialImage;
  if (customImage) {
    socialImage = customImage;
  } else if (repo._isFallback) {
    // Use a default placeholder for fallback repos
    socialImage =
      "https://via.placeholder.com/1200x630/2c3e50/ecf0f1?text=" +
      encodeURIComponent(title);
  } else {
    socialImage = `https://opengraph.githubassets.com/1/${repo.full_name}`;
  }

  // Star and fork counts (hide if using fallback data or zero)
  const stars =
    !repo._isFallback && repo.stargazers_count > 0
      ? `<span class="meta-item"><i class="fas fa-star"></i> ${repo.stargazers_count}</span>`
      : "";
  const forks =
    !repo._isFallback && repo.forks_count > 0
      ? `<span class="meta-item"><i class="fas fa-code-branch"></i> ${repo.forks_count}</span>`
      : "";

  // Topic tags - use custom tags if provided with color-coding
  let topicTags = "";
  if (overrides.tags && overrides.tags.length > 0) {
    topicTags = overrides.tags
      .slice(0, 3)
      .map((tag) => {
        const color = getTagColor(tag);
        return `<span class="tag" style="background-color: ${color}; color: white; border-color: ${color};">${tag}</span>`;
      })
      .join("");
  }

  // Determine which categories this project belongs to
  const projectCategories = getProjectCategories(overrides.tags || []);
  const categoriesAttr = Array.from(projectCategories).join(",");

  return `
    <div class="project-card" 
      data-language="${repo.language || "other"}" 
      data-categories="${categoriesAttr}"
      onclick="window.open('${githubUrl}', '_blank')" style="cursor:pointer;">
      <div class="project-image" style="background-image: url('${socialImage}'); background-size: cover; background-position: center; height: 200px; border-radius: var(--radius-md) var(--radius-md) 0 0; margin: calc(-1 * var(--spacing-md)) calc(-1 * var(--spacing-md)) var(--spacing-md) calc(-1 * var(--spacing-md));">
        <img src="${socialImage}" alt="${title} social preview" style="display:none;" onerror="this.parentNode.style.backgroundImage='url(${
    repo.owner && repo.owner.avatar_url
      ? repo.owner.avatar_url
      : "https://via.placeholder.com/1200x630/2c3e50/ecf0f1?text=" +
        encodeURIComponent(title)
  })'">
      </div>
      <h3 style="word-break: break-word; overflow-wrap: anywhere;">${title}</h3>
      <p>${description}</p>
      <div class="project-meta">
        ${stars}
        ${forks}
      </div>
      <div class="project-tags">
        ${topicTags}
      </div>
      <div class="project-links">
        ${
          repo.homepage
            ? `<a href="${repo.homepage}" target="_blank" class="project-link" title="Live Demo" onclick="event.stopPropagation();">
              <i class="fas fa-external-link-alt"></i>
            </a>`
            : ""
        }
      </div>
    </div>
  `;
}

/**
 * Format date to relative time
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return `${diffDays} days ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? "s" : ""} ago`;
  }
}

/**
 * Load and display GitHub projects
 */

async function loadGitHubProjects(containerId, featuredOnly = true) {
  const container = document.getElementById(containerId);

  if (!container) {
    console.error("Container not found:", containerId);
    return;
  }

  // Show loading state
  container.innerHTML =
    '<div class="loading">Loading projects from GitHub...</div>';

  try {
    // Load configurations first
    await loadProjectOverrides();

    // Fetch all repos from config
    const allRepos = await fetchReposFromConfig();

    let repos = [];
    if (containerId === "projects-grid") {
      // Home section: show only pinned repos
      repos = allRepos.filter((repo) => repo.pinned === true);
    } else {
      // Projects section: show all repos from config (pinned or not)
      repos = allRepos;
    }

    // Sort by stars and date
    repos.sort((a, b) => {
      if (b.stargazers_count !== a.stargazers_count) {
        return b.stargazers_count - a.stargazers_count;
      }
      return new Date(b.updated_at) - new Date(a.updated_at);
    });

    if (repos.length === 0) {
      container.innerHTML = '<div class="loading">No projects found.</div>';
      return;
    }

    // Render project cards
    container.innerHTML = repos.map((repo) => createProjectCard(repo)).join("");

    // Add animation delay to cards
    const cards = container.querySelectorAll(".project-card");
    cards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`;
    });

    // Initialize filters after projects are loaded (for projects page only)
    if (containerId === "all-projects") {
      initProjectFilters();
    }
  } catch (error) {
    console.error("Error loading projects:", error);
    container.innerHTML = `
      <div class="loading">
        Failed to load projects. Please visit my 
        <a href="https://github.com/${GITHUB_USERNAME}" target="_blank">GitHub profile</a> 
        directly.
      </div>
    `;
  }
}

/**
 * Project filtering functionality
 */
function initProjectFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const container = document.getElementById("all-projects");

  if (!filterButtons.length || !container) return;

  // Update button labels with counts
  updateFilterCounts(container);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active button
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const filter = button.dataset.filter;
      const projectCards = container.querySelectorAll(".project-card");

      // Filter projects based on category
      projectCards.forEach((card) => {
        if (filter === "all") {
          card.style.display = "block";
        } else {
          // Check if card has the selected category
          const categories = card.dataset.categories || "";
          const categoryList = categories
            .split(",")
            .filter((c) => c.length > 0);

          if (categoryList.includes(filter)) {
            card.style.display = "block";
          } else {
            card.style.display = "none";
          }
        }
      });
    });
  });
}

/**
 * Update filter button labels with project counts
 */
function updateFilterCounts(container) {
  const projectCards = container.querySelectorAll(".project-card");
  const filterButtons = document.querySelectorAll(".filter-btn");

  filterButtons.forEach((button) => {
    const filter = button.dataset.filter;
    let count = 0;

    if (filter === "all") {
      count = projectCards.length;
    } else {
      projectCards.forEach((card) => {
        const categories = card.dataset.categories || "";
        const categoryList = categories.split(",").filter((c) => c.length > 0);
        if (categoryList.includes(filter)) {
          count++;
        }
      });
    }

    // Update button text to include count
    const baseText = button.textContent.split(" (")[0]; // Remove existing count if any
    button.textContent = `${baseText} (${count})`;
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    // Auto-load on homepage
    if (document.getElementById("projects-grid")) {
      loadGitHubProjects("projects-grid", true);
    }

    // Auto-load on projects page
    if (document.getElementById("all-projects")) {
      loadGitHubProjects("all-projects", false);
    }
  });
} else {
  // DOM already loaded
  if (document.getElementById("projects-grid")) {
    loadGitHubProjects("projects-grid", true);
  }

  if (document.getElementById("all-projects")) {
    loadGitHubProjects("all-projects", false);
  }
}
