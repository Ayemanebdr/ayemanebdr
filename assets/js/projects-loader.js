/**
 * Projects Loader - Dynamically loads projects from CMS data
 * Fetches assets/data/projects.json and renders project cards
 */

(function() {
  'use strict';

  const PROJECTS_URL = 'assets/data/projects.json';
  const GRID_SELECTOR = '.port-grid';
  
  // Category icons and gradients
  const CATEGORY_STYLES = {
    illustration: {
      icon: '🎨',
      gradient: 'linear-gradient(135deg,#1e1018,#3a1528)',
      label: { fr: 'Illustration', en: 'Illustration' }
    },
    branding: {
      icon: '◈',
      gradient: 'linear-gradient(135deg,#0d1e30,#12304a)',
      label: { fr: 'Branding', en: 'Branding' }
    },
    web: {
      icon: '⬡',
      gradient: 'linear-gradient(135deg,#0d1a0d,#14310e)',
      label: { fr: 'Web Design', en: 'Web Design' }
    }
  };

  // Tools mapping for data-tools attribute
  const TOOLS_MAP = {
    illustrator: 'illustrator',
    photoshop: 'photoshop',
    figma: 'figma',
    procreate: 'procreate',
    affinity: 'affinity',
    canva: 'canva'
  };

  let projectsLoaded = false;

  function slugify(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function getProjectId(project) {
    return project.slug || slugify(project.title_fr || project.title_en || 'untitled');
  }

  function getCardWidthClass(index) {
    // Match existing pattern: c8 (large), c4 (small), c6 (medium)
    const pattern = [8, 4, 4, 4, 4, 4, 6, 6, 4, 4, 8];
    const width = pattern[index % pattern.length];
    return `c${width}`;
  }

  function getDelayClass(index) {
    const delays = ['', 'd1', 'd2', 'd1', 'd2', '', 'd1', 'd2'];
    return delays[index % delays.length];
  }

  function buildToolsString(tools) {
    if (!Array.isArray(tools)) return '';
    return tools.map(t => TOOLS_MAP[t] || t).join(',');
  }

  function getGalleryImages(project) {
    if (!project.gallery || !Array.isArray(project.gallery)) return '';
    return project.gallery
      .map(img => img.image || img)
      .filter(Boolean)
      .join(',');
  }

  function createProjectCard(project, index) {
    const id = getProjectId(project);
    const category = project.category || 'illustration';
    const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.illustration;
    
    const widthClass = getCardWidthClass(index);
    const delayClass = getDelayClass(index);
    const delayAttr = delayClass ? ` ${delayClass}` : '';
    
    const toolsStr = buildToolsString(project.tools);
    const imgsStr = getGalleryImages(project);
    
    // Determine if we have a real cover image or need a placeholder
    const hasCover = project.cover_image && project.cover_image.trim();
    const coverHtml = hasCover
      ? `<img src="${project.cover_image}" alt="${project.title_fr || ''}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0">`
      : `<div class="pcp" style="background:${style.gradient};width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;position:absolute;top:0;left:0">
          <span style="font-size:26px;opacity:.28">${style.icon}</span>
          <span data-lang="fr">${style.label.fr} · Votre visuel ici</span>
          <span data-lang="en">${style.label.en} · Your visual here</span>
        </div>`;

    const card = document.createElement('div');
    card.className = `pc ${widthClass} rv${delayAttr}`;
    card.dataset.cat = category;
    card.dataset.project = id;
    card.dataset.tfr = project.title_fr || '';
    card.dataset.ten = project.title_en || '';
    card.dataset.dfr = (project.tagline_fr || project.description_fr || '').substring(0, 200);
    card.dataset.den = (project.tagline_en || project.description_en || '').substring(0, 200);
    card.dataset.tools = toolsStr;
    card.dataset.imgs = imgsStr;
    
    card.innerHTML = `
      <div style="position:relative;width:100%;height:100%;overflow:hidden">
        ${coverHtml}
      </div>
      <div class="pco">
        <div class="pc-cat">${style.label.fr}</div>
        <div class="pc-title" data-lang="fr">${project.title_fr || ''}</div>
        <div class="pc-title" data-lang="en">${project.title_en || ''}</div>
        <div class="pc-arr">→</div>
      </div>
    `;
    
    return card;
  }

  function renderProjects(projects) {
    const grid = document.querySelector(GRID_SELECTOR);
    if (!grid) {
      console.error('Projects grid not found:', GRID_SELECTOR);
      return;
    }

    // Clear existing static projects (optional - can keep them as fallback)
    // For now, we'll append after existing ones or replace
    const existingCards = grid.querySelectorAll('.pc');
    
    // Only show published projects
    const publishedProjects = projects.filter(p => p.published !== false);
    
    if (publishedProjects.length === 0) {
      console.log('No published projects to display');
      return;
    }

    // Remove existing cards if we have CMS projects
    existingCards.forEach(card => card.remove());

    // Create and append project cards
    publishedProjects.forEach((project, index) => {
      const card = createProjectCard(project, index);
      grid.appendChild(card);
    });

    console.log(`✅ Rendered ${publishedProjects.length} projects from CMS`);
    
    // Trigger reveal animations for new cards
    if (window.IntersectionObserver) {
      const cardObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('on');
            }
          });
        },
        { threshold: 0.06, rootMargin: '0px 0px -30px 0px' }
      );
      
      grid.querySelectorAll('.pc').forEach((card) => cardObserver.observe(card));
    }

    // Re-initialize filters if they exist
    initDynamicFilters();
    
    // Re-initialize project page handlers
    if (window.initProjectPages) {
      window.initProjectPages();
    }
  }

  function initDynamicFilters() {
    const filterButtons = document.querySelectorAll('.fb');
    const cards = document.querySelectorAll('.pc');
    
    if (!filterButtons.length || !cards.length) return;

    // Remove old listeners and add new ones
    filterButtons.forEach((button) => {
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      newButton.addEventListener('click', () => {
        filterButtons.forEach((item) => item.classList.remove('on'));
        newButton.classList.add('on');

        const filter = newButton.dataset.filter || 'all';
        const allCards = document.querySelectorAll('.pc');
        allCards.forEach((card) => {
          const visible = filter === 'all' || card.dataset.cat === filter;
          card.style.display = visible ? '' : 'none';
        });
      });
    });
  }

  async function loadProjects() {
    if (projectsLoaded) return;
    
    try {
      const response = await fetch(PROJECTS_URL);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('📭 No projects.json yet (create a project in CMS first)');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const projects = await response.json();
      
      if (!Array.isArray(projects)) {
        console.error('Invalid projects data format');
        return;
      }
      
      projectsLoaded = true;
      renderProjects(projects);
      
    } catch (error) {
      console.error('❌ Failed to load projects:', error.message);
      // Keep existing static projects as fallback
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProjects);
  } else {
    loadProjects();
  }

  // Expose for manual refresh if needed
  window.refreshProjects = loadProjects;
})();
