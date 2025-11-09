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

// Fetch pinned repositories from a JSON file
async function fetchPinnedRepos() {
  try {
    const response = await fetch("/assets/js/pinned-repos.json");
    if (!response.ok) throw new Error("Could not load pinned repos list");
    const pinned = await response.json();
    const promises = pinned.map(({ owner, repo }) =>
      fetchExternalRepo(owner, repo)
    );
    const results = await Promise.all(promises);
    return results.filter((repo) => repo !== null);
  } catch (error) {
    console.error("Error loading pinned repos:", error);
    return [];
  }
}

/**
 * Fetch a single repository from another user
 */
async function fetchExternalRepo(owner, repoName) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch ${owner}/${repoName}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching external repo ${owner}/${repoName}:`, error);
    return null;
  }
}

/**
 * Fetch all external repositories
 */
async function fetchExternalRepos() {
  if (!EXTERNAL_REPOS || EXTERNAL_REPOS.length === 0) {
    return [];
  }

  const promises = EXTERNAL_REPOS.map(({ owner, repo }) =>
    fetchExternalRepo(owner, repo)
  );

  const results = await Promise.all(promises);
  return results.filter((repo) => repo !== null);
}

/**
 * Fetch user's own repositories from GitHub API
 */
async function fetchGitHubRepos() {
  try {
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch repositories");
    }

    const repos = await response.json();

    // Filter out excluded repos
    return repos.filter((repo) => !EXCLUDE_REPOS.includes(repo.name));
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return [];
  }
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

  // Social preview image (OpenGraph image) or custom image
  const socialImage =
    customImage || `https://opengraph.githubassets.com/1/${repo.full_name}`;

  // Star and fork counts
  const stars =
    repo.stargazers_count > 0
      ? `<span class="meta-item"><i class="fas fa-star"></i> ${repo.stargazers_count}</span>`
      : "";
  const forks =
    repo.forks_count > 0
      ? `<span class="meta-item"><i class="fas fa-code-branch"></i> ${repo.forks_count}</span>`
      : "";

  // Language tag
  const language = repo.language
    ? `<span class="tag">${repo.language}</span>`
    : "";

  // Topic tags - use custom tags if provided, otherwise use repo topics
  let topicTags = "";
  if (overrides.tags && overrides.tags.length > 0) {
    topicTags = overrides.tags
      .slice(0, 3)
      .map((tag) => `<span class="tag">${tag}</span>`)
      .join("");
  } else if (repo.topics && repo.topics.length > 0) {
    topicTags = repo.topics
      .slice(0, 3)
      .map((topic) => `<span class="tag">${topic}</span>`)
      .join("");
  }

  return `
    <div class="project-card" data-language="${repo.language || "other"}"
      onclick="window.open('${
        repo.html_url
      }', '_blank')" style="cursor:pointer;">
      <div class="project-image" style="background-image: url('${socialImage}'); background-size: cover; background-position: center; height: 200px; border-radius: var(--radius-md) var(--radius-md) 0 0; margin: calc(-1 * var(--spacing-md)) calc(-1 * var(--spacing-md)) var(--spacing-md) calc(-1 * var(--spacing-md));">
        <img src="${socialImage}" alt="${title} social preview" style="display:none;" onerror="this.parentNode.style.backgroundImage='url(${
    repo.owner && repo.owner.avatar_url ? repo.owner.avatar_url : ""
  })'">
      </div>
      <h3 style="word-break: break-word; overflow-wrap: anywhere;">${title}</h3>
      <p>${description}</p>
      <div class="project-meta">
        ${stars}
        ${forks}
      </div>
      <div class="project-tags">
        ${language}
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
    // Load project overrides first
    await loadProjectOverrides();

    let repos = [];
    if (containerId === "projects-grid") {
      // Home section: show only those in pinned-repos.json
      repos = await fetchPinnedRepos();
    } else {
      // Projects section: show all user repos and external repos
      const [ownRepos, externalRepos] = await Promise.all([
        fetchGitHubRepos(),
        fetchExternalRepos(),
      ]);
      repos = [...ownRepos, ...externalRepos];
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
  const projectCards = document.querySelectorAll(".project-card");

  if (!filterButtons.length) return;

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active button
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const filter = button.dataset.filter;

      // Filter projects
      projectCards.forEach((card) => {
        if (filter === "all") {
          card.style.display = "block";
        } else if (filter === "featured") {
          // You can add a data-featured attribute to featured projects
          card.style.display = card.dataset.featured ? "block" : "none";
        } else {
          const language = card.dataset.language?.toLowerCase() || "";
          card.style.display = language.includes(filter) ? "block" : "none";
        }
      });
    });
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

    // Initialize filters
    initProjectFilters();
  });
} else {
  // DOM already loaded
  if (document.getElementById("projects-grid")) {
    loadGitHubProjects("projects-grid", true);
  }

  if (document.getElementById("all-projects")) {
    loadGitHubProjects("all-projects", false);
  }

  initProjectFilters();
}
