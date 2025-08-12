// Open venue in native maps w/ graceful web fallback
export function openVenue(venueName) {
  try {
    const q = encodeURIComponent(venueName);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      // Apple Maps preferred on iOS
      window.location.href = `http://maps.apple.com/?q=${q}`;
      return;
    }
    
    if (isAndroid) {
      // Let Android intent open native Maps
      window.location.href = `geo:0,0?q=${q}`;
      // Fallback to web if geo: protocol fails
      setTimeout(() => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank', 'noopener');
      }, 450);
      return;
    }
    
    // Desktop → Google Maps web
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank', 'noopener');
  } catch (e) {
    console.warn('Map open failed', e);
    // Fallback to Google Maps web
    try {
      const q = encodeURIComponent(venueName);
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank', 'noopener');
    } catch {}
  }
}

// Auto-wire navigation buttons
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="navigate"]');
  if (!btn) return;
  
  const v = btn.dataset.venue || btn.getAttribute('data-venue') || btn.textContent;
  if (v) openVenue(v);
});

export default { openVenue };