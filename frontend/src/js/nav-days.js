/**
 * Navigation Day Pills Handler
 * Manages the map day filter subnav behavior
 */

(function() {
  // Day configuration
  const DAYS = [
    { label: 'Thu', date: '2025-08-21' },
    { label: 'Fri', date: '2025-08-22' },
    { label: 'Sat', date: '2025-08-23' },
    { label: 'Sun', date: '2025-08-24' }
  ];

  function initDayNav() {
    const sidebar = document.querySelector('.v-sidenav');
    const daySubnav = document.querySelector('.v-day-subnav');
    if (!sidebar || !daySubnav) return;

    // Handle route changes
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash || '#/parties';
      const isMapRoute = hash.startsWith('#/map');
      
      // Show/hide day subnav based on route
      sidebar.dataset.subnav = isMapRoute ? 'map' : '';
    });

    // Handle day pill clicks
    daySubnav.addEventListener('click', (e) => {
      const pill = e.target.closest('.day-pill');
      if (!pill) return;

      // Update aria-pressed states
      daySubnav.querySelectorAll('.day-pill').forEach(p => {
        p.setAttribute('aria-pressed', 'false');
      });
      pill.setAttribute('aria-pressed', 'true');

      // Get the day index and update route
      const dayIndex = Array.from(daySubnav.querySelectorAll('.day-pill')).indexOf(pill);
      if (dayIndex >= 0 && DAYS[dayIndex]) {
        window.location.hash = `#/map/${DAYS[dayIndex].date}`;
      }
    });

    // Set initial state
    const hash = window.location.hash || '#/parties';
    if (hash.startsWith('#/map')) {
      sidebar.dataset.subnav = 'map';
      
      // Set active day based on route
      const datePart = hash.split('/')[2];
      if (datePart) {
        const dayIndex = DAYS.findIndex(d => d.date === datePart);
        if (dayIndex >= 0) {
          const pills = daySubnav.querySelectorAll('.day-pill');
          pills.forEach((p, i) => {
            p.setAttribute('aria-pressed', i === dayIndex ? 'true' : 'false');
          });
        }
      }
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDayNav);
  } else {
    initDayNav();
  }
})();