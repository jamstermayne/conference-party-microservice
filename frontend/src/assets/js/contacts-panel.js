/**
 * Contacts Panel - Modern Card-Based Design
 * Professional networking contacts with filtering and actions
 */

// Professional networking contacts with realistic Gamescom connections
const contactSamples = [
  { 
    name: "Alex Chen", 
    role: "Senior Producer", 
    org: "Ubisoft", 
    avatar: "AC",
    linkedin: "https://linkedin.com/in/alexchen-gamedev",
    email: "alex.chen@ubisoft.com",
    location: "Montreal, Canada",
    bio: "Leading AAA game production with 8+ years experience",
    tags: ["AAA", "Production", "Unity"]
  },
  { 
    name: "Marta Ruiz", 
    role: "Business Development", 
    org: "Indie Games Alliance", 
    avatar: "MR",
    linkedin: "https://linkedin.com/in/martaruiz-gamedev",
    email: "marta@indiegamesalliance.com",
    location: "Berlin, Germany",
    bio: "Connecting indie developers with publishers worldwide",
    tags: ["Publishing", "Indie", "Strategy"]
  },
  { 
    name: "Sam Patel", 
    role: "Lead Engineer", 
    org: "Epic Games", 
    avatar: "SP",
    linkedin: "https://linkedin.com/in/sampatel-gamedev",
    email: "s.patel@epicgames.com",
    location: "Cary, NC",
    bio: "Unreal Engine graphics programming and optimization",
    tags: ["Unreal", "Graphics", "C++"]
  },
  { 
    name: "Emma Schmidt", 
    role: "Art Director", 
    org: "Crytek", 
    avatar: "ES",
    linkedin: "https://linkedin.com/in/emmaschimdt-art",
    email: "emma.schmidt@crytek.com",
    location: "Frankfurt, Germany",
    bio: "Creating immersive worlds with next-gen visual fidelity",
    tags: ["Art Direction", "3D", "CryEngine"]
  },
  { 
    name: "Yuki Tanaka", 
    role: "Game Designer", 
    org: "Nintendo", 
    avatar: "YT",
    linkedin: "https://linkedin.com/in/yukitanaka-design",
    email: "y.tanaka@nintendo.co.jp",
    location: "Kyoto, Japan",
    bio: "Crafting innovative gameplay experiences for all ages",
    tags: ["Game Design", "Nintendo", "Innovation"]
  },
  { 
    name: "Lars Johansson", 
    role: "CEO & Founder", 
    org: "Nordic Indie Studio", 
    avatar: "LJ",
    linkedin: "https://linkedin.com/in/larsjohansson-ceo",
    email: "lars@nordicindie.com",
    location: "Stockholm, Sweden",
    bio: "Building sustainable indie game studios in Scandinavia",
    tags: ["Leadership", "Indie", "Business"]
  }
];

function getStoredContacts() {
  try {
    const stored = localStorage.getItem('user_contacts');
    return stored ? JSON.parse(stored) : contactSamples;
  } catch {
    return contactSamples;
  }
}

function saveContacts(contacts) {
  try {
    localStorage.setItem('user_contacts', JSON.stringify(contacts));
  } catch (e) {
    console.warn('Could not save contacts:', e);
  }
}

class ContactsPanel {
  constructor() {
    this.panel = null;
    this.contacts = [];
    this.isActive = false;
    this.currentFilter = 'all';
  }

  init() {
    this.createPanel();
    this.setupHashListener();
    this.contacts = getStoredContacts();
  }

  createPanel() {
    if (document.getElementById('panel-contacts')) return;

    this.panel = document.createElement('section');
    this.panel.id = 'panel-contacts';
    this.panel.className = 'panel panel--overlay';
    this.panel.innerHTML = `
      <div class="contacts-panel-header">
        <button class="btn-close-panel" data-action="close-panel" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
          </svg>
        </button>
        <h1>Contacts</h1>
        <button class="btn-add-contact" data-action="add-contact">+ Add</button>
      </div>
      <div class="contacts-panel-body">
        <div id="contacts-container"></div>
      </div>
    `;

    document.body.appendChild(this.panel);
    this.bindEvents();
  }

  bindEvents() {
    // Close button
    this.panel.querySelector('[data-action="close-panel"]').addEventListener('click', () => {
      this.close();
      location.hash = '#/home';
    });

    // Add contact button
    this.panel.querySelector('[data-action="add-contact"]').addEventListener('click', () => {
      this.addContact();
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isActive) {
        this.close();
        location.hash = '#/home';
      }
    });
  }

  setupHashListener() {
    const checkHash = () => {
      const shouldShow = location.hash === '#/contacts';
      if (shouldShow && !this.isActive) {
        this.open();
      } else if (!shouldShow && this.isActive) {
        this.close();
      }
    };

    window.addEventListener('hashchange', checkHash);
    checkHash();
  }

  async open() {
    this.panel.classList.add('panel--active');
    this.isActive = true;
    this.renderContacts();
  }

  close() {
    this.panel.classList.remove('panel--active');
    this.isActive = false;
  }

  renderContacts() {
    const container = this.panel.querySelector('#contacts-container');
    if (!container) return;
    
    const contacts = getStoredContacts();
    
    container.innerHTML = `
      <div class="contacts-panel">
        <div class="panel__header">
          <h1 class="panel__title">Professional Network</h1>
          <div class="panel__subtitle">${contacts.length} connections from Gamescom 2025</div>
        </div>
        
        <div class="contacts-filters">
          <div class="filter-pills">
            <button class="filter-pill active" data-filter="all">All (${contacts.length})</button>
            <button class="filter-pill" data-filter="AAA">AAA Studios</button>
            <button class="filter-pill" data-filter="Indie">Indie</button>
            <button class="filter-pill" data-filter="Publishing">Publishing</button>
          </div>
        </div>
        
        <div class="card-modern-grid" id="contacts-grid"></div>
      </div>
    `;
    
    const grid = container.querySelector("#contacts-grid");
    const filterPills = container.querySelectorAll('.filter-pill');
    
    this.renderContactGrid(contacts);
    
    // Filter functionality
    filterPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        filterPills.forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        
        const filter = e.target.dataset.filter;
        let filtered = contacts;
        
        if (filter !== 'all') {
          filtered = contacts.filter(contact => 
            contact.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
          );
        }
        
        this.renderContactGrid(filtered);
      });
    });
  }

  renderContactGrid(filteredContacts) {
    const grid = this.panel.querySelector('#contacts-grid');
    if (!grid) return;
    
    if (filteredContacts.length === 0) {
      grid.innerHTML = `
        <div class="card-modern card-modern--empty">
          <div class="card-modern__body">
            <div class="empty-state">
              <div class="empty-icon">👥</div>
              <h3>No contacts found</h3>
              <p>Try adjusting your filters or add new contacts</p>
            </div>
          </div>
        </div>
      `;
      return;
    }
    
    grid.innerHTML = filteredContacts.map(contact => `
      <div class="card-modern card-modern--contact" data-contact-id="${contact.name}">
        <div class="card-modern__header">
          <div class="contact-avatar-row">
            <div class="contact-avatar">${contact.avatar}</div>
            <div class="contact-info">
              <h3 class="card-modern__title">${contact.name}</h3>
              <div class="card-modern__subtitle">${contact.role}</div>
            </div>
          </div>
        </div>
        
        <div class="card-modern__body">
          <div class="card-modern__details">
            <svg class="card-modern__icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
            </svg>
            <div class="card-modern__detail">${contact.org}</div>
            
            <svg class="card-modern__icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            <div class="card-modern__detail">${contact.location}</div>
          </div>
          
          <div class="card-modern__description">${contact.bio}</div>
          
          <div class="card-modern__meta">
            ${contact.tags.map(tag => `<span class="card-modern__pill">${tag}</span>`).join('')}
          </div>
        </div>
        
        <div class="card-modern__footer">
          <button class="card-modern__action card-modern__action--primary" data-action="linkedin" data-url="${contact.linkedin}">
            LinkedIn
          </button>
          <button class="card-modern__action card-modern__action--secondary" data-action="email" data-email="${contact.email}">
            Email
          </button>
        </div>
      </div>
    `).join('');
    
    // Add event listeners to contact cards
    grid.querySelectorAll('.card-modern--contact').forEach(card => {
      card.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        
        const action = btn.dataset.action;
        if (action === 'linkedin') {
          window.open(btn.dataset.url, '_blank');
        } else if (action === 'email') {
          window.open(`mailto:${btn.dataset.email}`, '_blank');
        }
      });
    });
  }

  addContact() {
    const name = prompt('Contact name:');
    if (!name) return;
    
    const role = prompt('Role:') || 'Professional';
    const org = prompt('Organization:') || 'Gaming Industry';
    const location = prompt('Location:') || 'Unknown';
    
    const newContact = {
      name,
      role,
      org,
      location,
      avatar: name.split(' ').map(n => n[0]).join('').toUpperCase(),
      linkedin: `https://linkedin.com/in/${name.toLowerCase().replace(/\s+/g, '-')}`,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@${org.toLowerCase().replace(/\s+/g, '')}.com`,
      bio: `${role} at ${org}`,
      tags: ['Professional']
    };
    
    const contacts = getStoredContacts();
    contacts.push(newContact);
    saveContacts(contacts);
    this.renderContacts();
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.contactsPanel = new ContactsPanel();
    window.contactsPanel.init();
  });
} else {
  window.contactsPanel = new ContactsPanel();
  window.contactsPanel.init();
}

export default ContactsPanel;

// Legacy export for compatibility
export async function renderContacts(mount) {
  if (!mount) return;
  
  const contacts = getStoredContacts();
  
  mount.innerHTML = `
    <div class="contacts-panel">
      <div class="panel__header">
        <h1 class="panel__title">Professional Network</h1>
        <div class="panel__subtitle">${contacts.length} connections from Gamescom 2025</div>
      </div>
      
      <div class="contacts-filters">
        <div class="filter-pills">
          <button class="filter-pill active" data-filter="all">All (${contacts.length})</button>
          <button class="filter-pill" data-filter="AAA">AAA Studios</button>
          <button class="filter-pill" data-filter="Indie">Indie</button>
          <button class="filter-pill" data-filter="Publishing">Publishing</button>
        </div>
        <button class="btn-add-contact">+ Add Contact</button>
      </div>
      
      <div class="card-modern-grid" id="contacts-grid"></div>
    </div>
  `;
  
  const grid = mount.querySelector("#contacts-grid");
  const filterPills = mount.querySelectorAll('.filter-pill');
  const addContactBtn = mount.querySelector('.btn-add-contact');
  
  function renderContactGrid(filteredContacts = contacts) {
    if (!grid) return;
    
    if (filteredContacts.length === 0) {
      grid.innerHTML = `
        <div class="card-modern card-modern--empty">
          <div class="card-modern__body">
            <div class="empty-state">
              <div class="empty-icon">👥</div>
              <h3>No contacts found</h3>
              <p>Try adjusting your filters or add new contacts</p>
            </div>
          </div>
        </div>
      `;
      return;
    }
    
    grid.innerHTML = filteredContacts.map(contact => `
      <div class="card-modern card-modern--contact" data-contact-id="${contact.name}">
        <div class="card-modern__header">
          <div class="contact-avatar-row">
            <div class="contact-avatar">${contact.avatar}</div>
            <div class="contact-info">
              <h3 class="card-modern__title">${contact.name}</h3>
              <div class="card-modern__subtitle">${contact.role}</div>
            </div>
          </div>
        </div>
        
        <div class="card-modern__body">
          <div class="card-modern__details">
            <svg class="card-modern__icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
            </svg>
            <div class="card-modern__detail">${contact.org}</div>
            
            <svg class="card-modern__icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            <div class="card-modern__detail">${contact.location}</div>
          </div>
          
          <div class="card-modern__description">${contact.bio}</div>
          
          <div class="card-modern__meta">
            ${contact.tags.map(tag => `<span class="card-modern__pill">${tag}</span>`).join('')}
          </div>
        </div>
        
        <div class="card-modern__footer">
          <button class="card-modern__action card-modern__action--primary" data-action="linkedin" data-url="${contact.linkedin}">
            LinkedIn
          </button>
          <button class="card-modern__action card-modern__action--secondary" data-action="email" data-email="${contact.email}">
            Email
          </button>
        </div>
      </div>
    `).join('');
    
    // Add event listeners to contact cards
    grid.querySelectorAll('.card-modern--contact').forEach(card => {
      card.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        
        const action = btn.dataset.action;
        if (action === 'linkedin') {
          window.open(btn.dataset.url, '_blank');
        } else if (action === 'email') {
          window.open(`mailto:${btn.dataset.email}`, '_blank');
        }
      });
    });
  }
  
  // Filter functionality
  filterPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      filterPills.forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      
      const filter = e.target.dataset.filter;
      let filtered = contacts;
      
      if (filter !== 'all') {
        filtered = contacts.filter(contact => 
          contact.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
        );
      }
      
      renderContactGrid(filtered);
    });
  });
  
  // Add contact functionality
  addContactBtn.addEventListener('click', () => {
    const name = prompt('Contact name:');
    if (!name) return;
    
    const role = prompt('Role:') || 'Professional';
    const org = prompt('Organization:') || 'Gaming Industry';
    const location = prompt('Location:') || 'Unknown';
    
    const newContact = {
      name,
      role,
      org,
      location,
      avatar: name.split(' ').map(n => n[0]).join('').toUpperCase(),
      linkedin: `https://linkedin.com/in/${name.toLowerCase().replace(/\s+/g, '-')}`,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@${org.toLowerCase().replace(/\s+/g, '')}.com`,
      bio: `${role} at ${org}`,
      tags: ['Professional']
    };
    
    contacts.push(newContact);
    saveContacts(contacts);
    renderContactGrid(contacts);
    
    // Update counts
    mount.querySelector('.panel__subtitle').textContent = `${contacts.length} connections from Gamescom 2025`;
    mount.querySelector('[data-filter="all"]').textContent = `All (${contacts.length})`;
  });
  
  // Initial render
  renderContactGrid();
}