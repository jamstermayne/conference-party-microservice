/**
 * Duration Slots Utility
 * Calculate and apply CSS custom properties for duration-based heights
 * Build: b018
 */

// When rendering a card or event, set a --duration-slots CSS variable
function calcDurationSlots(start, end) {
  const mins = (new Date(end) - new Date(start)) / (1000 * 60);
  return Math.max(1, mins / 30); // number of 30-min slots, minimum 1
}

function applyDurationSlots(el, start, end) {
  const slots = calcDurationSlots(start, end);
  el.style.setProperty('--duration-slots', slots);
  
  // Also add a duration class for easier styling
  const hours = slots * 0.5;
  if (hours <= 0.5) el.classList.add('duration-30min');
  else if (hours <= 1) el.classList.add('duration-1hr');
  else if (hours <= 1.5) el.classList.add('duration-90min');
  else if (hours <= 2) el.classList.add('duration-2hr');
  else if (hours <= 3) el.classList.add('duration-3hr');
  else if (hours <= 4) el.classList.add('duration-4hr');
  else el.classList.add('duration-all-day');
  
  return slots;
}

// Helper to parse various date formats
function parseDateTime(dateTime) {
  if (!dateTime) return null;
  
  // Handle ISO strings
  if (typeof dateTime === 'string') {
    // Handle time-only format (e.g., "09:00")
    if (/^\d{1,2}:\d{2}$/.test(dateTime)) {
      const today = new Date();
      const [hours, minutes] = dateTime.split(':').map(Number);
      today.setHours(hours, minutes, 0, 0);
      return today;
    }
    return new Date(dateTime);
  }
  
  // Already a Date object
  if (dateTime instanceof Date) return dateTime;
  
  // Timestamp
  if (typeof dateTime === 'number') return new Date(dateTime);
  
  return null;
}

// Apply to multiple elements with data attributes
function applyDurationSlotsFromData(elements) {
  elements.forEach(el => {
    const start = el.dataset.start || el.dataset.startTime;
    const end = el.dataset.end || el.dataset.endTime;
    
    if (start && end) {
      const startDate = parseDateTime(start);
      const endDate = parseDateTime(end);
      
      if (startDate && endDate) {
        applyDurationSlots(el, startDate, endDate);
      }
    }
  });
}

// Calculate pixel height based on slots
function getSlotHeight(slots, baseHeight = 40) {
  return slots * baseHeight;
}

// Format duration for display
function formatDuration(start, end) {
  const mins = (new Date(end) - new Date(start)) / (1000 * 60);
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}hr`;
  return `${hours}hr ${minutes}min`;
}

export {
  calcDurationSlots,
  applyDurationSlots,
  applyDurationSlotsFromData,
  parseDateTime,
  getSlotHeight,
  formatDuration
};

export default {
  calcDurationSlots,
  applyDurationSlots,
  applyDurationSlotsFromData,
  parseDateTime,
  getSlotHeight,
  formatDuration
};