// Ensure channel names get '#' prefix without duplicating
document.querySelectorAll('.nav-channel').forEach(ch => {
  const text = ch.textContent.trim();
  if (!text.startsWith('#')) {
    ch.textContent = `#${text}`;
  }
});

// Remove duplicate "hotspots" or "venues" in both nav & main
const seenSections = new Set();
document.querySelectorAll('[data-section]').forEach(sec => {
  const sectionName = sec.dataset.section.toLowerCase();
  if (seenSections.has(sectionName)) {
    sec.remove();
  } else {
    seenSections.add(sectionName);
  }
});