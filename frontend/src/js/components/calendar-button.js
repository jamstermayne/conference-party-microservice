/**
 * Standardized Calendar Button Component
 * Single button for Add to Calendar functionality
 */

export function createCalendarButton(partyData) {
  const { id, title, venue, start, end } = partyData;
  
  return `<button class="btn add-to-calendar" 
          data-party-id="${id || ''}"
          data-action="addCalendar"
          data-title="${title || ''}"
          data-venue="${venue || ''}"
          data-start="${start || ''}"
          data-end="${end || ''}">Add to Calendar</button>`;
}

// For existing implementations that use different attributes
export function normalizeCalendarButton(buttonHTML) {
  // Remove any btn-group wrapper
  const cleaned = buttonHTML.replace(/<div class="btn-group">|<\/div>/g, '');
  
  // Remove any secondary/menu buttons
  const singleButton = cleaned.replace(/<button[^>]*btn-menu[^>]*>.*?<\/button>/g, '');
  
  // Ensure proper class
  return singleButton.replace(/class="[^"]*"/, 'class="btn add-to-calendar"');
}