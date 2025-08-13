/**
 * events-controller.js - Parties page controller
 * Build: b012
 */

import { createPartyCard } from './party-card.js';

export async function renderParties(mount) {
  if (!mount) return;
  
  // Show loading state
  mount.innerHTML = `
    <section class="section-card">
      <div class="left-accent"></div>
      <div style="padding: 24px; text-align: center; color: var(--muted);">
        Loading events...
      </div>
    </section>
  `;
  
  try {
    // Fetch events
    const events = await fetchEvents();
    
    // Create section
    const section = document.createElement('section');
    section.className = 'section-card';
    
    // Add accent
    const accent = document.createElement('div');
    accent.className = 'left-accent';
    section.appendChild(accent);
    
    // Add header
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding:0 22px';
    
    const title = document.createElement('h2');
    title.style.cssText = 'margin:0;font-size:18px;font-weight:600';
    title.textContent = 'Recommended Events';
    
    const subtitle = document.createElement('small');
    subtitle.style.cssText = 'color:var(--muted);font-size:13px';
    subtitle.textContent = `${events.length} events available`;
    
    header.appendChild(title);
    header.appendChild(subtitle);
    section.appendChild(header);
    
    // Create responsive grid
    const grid = document.createElement('div');
    grid.className = 'card-grid';
    grid.style.cssText = 'padding:0 22px 22px';
    
    // Add party cards
    events.forEach(event => {
      const card = createPartyCard(event);
      grid.appendChild(card);
    });
    
    section.appendChild(grid);
    
    // Replace mount content
    mount.replaceChildren(section);
    
  } catch (error) {
    console.error('[Events Controller] Error:', error);
    mount.innerHTML = `
      <section class="section-card">
        <div class="left-accent"></div>
        <div style="padding: 24px; text-align: center;">
          <h3 style="color: var(--danger); margin-bottom: 8px;">Failed to load events</h3>
          <p style="color: var(--muted); font-size: 14px;">Please check your connection and try again.</p>
          <button class="btn btn-primary" style="margin-top: 16px;" onclick="location.reload()">
            Retry
          </button>
        </div>
      </section>
    `;
  }
}

async function fetchEvents() {
  try {
    const response = await fetch('/api/parties?conference=gamescom2025');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('[fetchEvents] Error:', error);
    // Return sample data as fallback
    return getSampleEvents();
  }
}

function getSampleEvents() {
  return [
    {
      id: 'meettomatch-2025',
      title: 'MeetToMatch The Cologne Edition 2025',
      date: 'Fri Aug 22',
      time: '09:00 - 18:00',
      venue: 'Kölnmesse Confex',
      price: '£127.04',
      live: true
    },
    {
      id: 'marriott-mixer',
      title: 'Marriott Rooftop Mixer',
      date: 'Fri Aug 22',
      time: '20:00 - 23:30',
      venue: 'Marriott Hotel',
      free: true,
      live: true
    },
    {
      id: 'indie-showcase',
      title: 'Indie Arena Booth Showcase',
      date: 'Sat Aug 23',
      time: '10:00 - 18:00',
      venue: 'Hall 10.2',
      free: true
    },
    {
      id: 'devcom-party',
      title: 'Official Devcom Party',
      date: 'Sun Aug 24',
      time: '19:00 - 02:00',
      venue: 'Bootshaus',
      price: '€45'
    }
  ];
}

// Add CSS import
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = '/assets/css/cards.css?v=b012';
document.head.appendChild(link);

export default { renderParties };