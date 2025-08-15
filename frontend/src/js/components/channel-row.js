/**
 * Creates a channel row button element
 * @param {Object} config - Row configuration
 * @param {string} config.route - The hash route to navigate to
 * @param {string} config.label - The text label for the row
 * @param {string} [config.ariaLabel] - Optional ARIA label for accessibility
 * @param {string} [config.icon] - Optional icon HTML or emoji
 * @returns {HTMLElement} The channel row button element
 */
export function createChannelRow(config) {
  const { route, label, ariaLabel, icon } = config;
  
  const button = document.createElement('button');
  button.className = 'v-row';
  button.setAttribute('data-route', route);
  button.setAttribute('aria-label', ariaLabel || `Open ${label}`);
  
  button.innerHTML = `
    <span class="v-row__icon" aria-hidden="true">${icon || ''}</span>
    <span class="v-row__label">${label}</span>
    <span class="v-row__chev" aria-hidden="true">›</span>
  `;
  
  // Handle navigation on click
  button.addEventListener('click', () => {
    window.location.hash = route;
  });
  
  return button;
}

/**
 * Creates multiple channel rows from data
 * @param {Array} items - Array of row configurations
 * @returns {DocumentFragment} Fragment containing all rows
 */
export function createChannelRows(items) {
  const fragment = document.createDocumentFragment();
  items.forEach(item => {
    fragment.appendChild(createChannelRow(item));
  });
  return fragment;
}