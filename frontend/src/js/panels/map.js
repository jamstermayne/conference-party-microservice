export async function openMapPanel(dayISO, activator) {
  const wrap = document.createElement('div');
  const mapId = `map-${Date.now()}`;
  wrap.innerHTML = `<div id="${mapId}" style="block-size:calc(100dvh - 64px); inline-size:100%"></div>`;
  Stack.push('map', { title: 'Map', content: wrap }, activator);

  // Lazy load Maps
  if (!('google' in window) || !google.maps?.importLibrary) await loadMaps();
  const { Map } = await google.maps.importLibrary('maps');
  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');

  const map = new Map(wrap.querySelector(`#${mapId}`), {
    center: { lat: 50.938, lng: 6.96 }, zoom: 12, mapId: window.MAP_ID || undefined
  });

  // Fetch parties for selected day
  const url = new URL('/api/parties', window.location.origin);
  url.searchParams.set('conference','gamescom2025');
  if (dayISO) url.searchParams.set('day', dayISO);
  const res = await fetch(url); const json = await res.json();
  (json.data || json.parties || []).forEach(p => {
    if (!p.lat || !p.lon) return;
    new AdvancedMarkerElement({
      map, position: { lat: +p.lat, lng: +p.lon },
      title: p.title
    });
  });
}

async function loadMaps() {
  // Check if Maps is already loading or loaded via index.html
  if (document.querySelector('script[src*="maps.googleapis.com"]')) {
    // Wait for it to load
    await new Promise(resolve => {
      const checkMaps = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkMaps);
          resolve();
        }
      }, 100);
    });
    return;
  }
  
  // Use the production API key from index.html
  const s = document.createElement('script');
  s.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyD5Zj_Hj31Vda3bcybxX6W4zmDlg8cotgc&v=weekly&loading=async&libraries=marker`;
  s.async = true; document.head.appendChild(s);
  await new Promise(res => s.onload = res);
}