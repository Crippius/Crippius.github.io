/* ====================================================================
   GITHUB PROJECTS LOADER
   Automatically fetches and displays GitHub repositories
   ==================================================================== */

// Configuration - these will be replaced by Jekyll from _config.yml
// Note: The {{ }} syntax is Liquid templating, processed by Jekyll during build
const GITHUB_USERNAME = '{{ site.github.username }}';
const FEATURED_REPOS = {{ site.github.repos_to_feature | jsonify }};
const EXCLUDE_REPOS = {{ site.github.exclude_repos | jsonify }};

/**
 * Fetch repositories from GitHub API
 */
async function fetchGitHubRepos() {
  try {
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch repositories');
    }
    
    const repos = await response.json();
    return repos.filter(repo => !repo.fork && !EXCLUDE_REPOS.includes(repo.name));
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    return [];
  }
}

/**
 * Create HTML for a project card
 */
function createProjectCard(repo) {
  const stars = repo.stargazers_count > 0 ? `
    <span class="project-meta">
      <i class="fas fa-star"></i> ${repo.stargazers_count}
    </span>
  ` : '';
  
  const forks = repo.forks_count > 0 ? `
    <span class="project-meta">
      <i class="fas fa-code-branch"></i> ${repo.forks_count}
    </span>
  ` : '';
  
  const language = repo.language ? `
    <span class="tag">${repo.language}</span>
  ` : '';
  
  const topics = repo.topics ? repo.topics.slice(0, 3).map(topic => 
    `<span class="tag">${topic}</span>`
  ).join('') : '';
  
  return `
    <div class="project-card" data-language="${repo.language || 'other'}">
      <h3>${repo.name}</h3>
      <p>${repo.description || 'No description available'}</p>
      <div class="project-meta">
        ${stars}
        ${forks}
        ${repo.updated_at ? `<span><i class="fas fa-clock"></i> Updated ${formatDate(repo.updated_at)}</span>` : ''}
      </div>
      <div class="project-tags">
        ${language}
        ${topics}
      </div>
      <div class="project-links">
        <a href="${repo.html_url}" target="_blank" class="project-link">
          <i class="fab fa-github"></i> View on GitHub
        </a>
        ${repo.homepage ? `
          <a href="${repo.homepage}" target="_blank" class="project-link">
            <i class="fas fa-external-link-alt"></i> Live Demo
          </a>
        ` : ''}
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
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

/**
 * Load and display GitHub projects
 */
async function loadGitHubProjects(containerId, featuredOnly = true) {
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.error('Container not found:', containerId);
    return;
  }
  
  // Show loading state
  container.innerHTML = '<div class="loading">Loading projects from GitHub...</div>';
  
  try {
    let repos = await fetchGitHubRepos();
    
    // Filter for featured repos if needed
    if (featuredOnly && FEATURED_REPOS && FEATURED_REPOS.length > 0) {
      repos = repos.filter(repo => FEATURED_REPOS.includes(repo.name));
    }
    
    // Sort by stars and date
    repos.sort((a, b) => {
      if (b.stargazers_count !== a.stargazers_count) {
        return b.stargazers_count - a.stargazers_count;
      }
      return new Date(b.updated_at) - new Date(b.updated_at);
    });
    
    // Limit to top 6 for featured section
    if (featuredOnly) {
      repos = repos.slice(0, 6);
    }
    
    if (repos.length === 0) {
      container.innerHTML = '<div class="loading">No projects found.</div>';
      return;
    }
    
    // Render project cards
    container.innerHTML = repos.map(repo => createProjectCard(repo)).join('');
    
    // Add animation delay to cards
    const cards = container.querySelectorAll('.project-card');
    cards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`;
    });
    
  } catch (error) {
    console.error('Error loading projects:', error);
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
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  
  if (!filterButtons.length) return;
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      const filter = button.dataset.filter;
      
      // Filter projects
      projectCards.forEach(card => {
        if (filter === 'all') {
          card.style.display = 'block';
        } else if (filter === 'featured') {
          // You can add a data-featured attribute to featured projects
          card.style.display = card.dataset.featured ? 'block' : 'none';
        } else {
          const language = card.dataset.language?.toLowerCase() || '';
          card.style.display = language.includes(filter) ? 'block' : 'none';
        }
      });
    });
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Auto-load on homepage
    if (document.getElementById('projects-grid')) {
      loadGitHubProjects('projects-grid', true);
    }
    
    // Initialize filters
    initProjectFilters();
  });
} else {
  // DOM already loaded
  if (document.getElementById('projects-grid')) {
    loadGitHubProjects('projects-grid', true);
  }
  initProjectFilters();
}
