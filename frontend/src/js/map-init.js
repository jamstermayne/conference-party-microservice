export async function ensureMapsReady() {
  if (!window.__mapsReady) {
    window.__mapsReady = new Promise((resolve) => {
      const tick = () => (window.google && google.maps) ? resolve() : setTimeout(tick, 25);
      tick();
    });
  }
  return window.__mapsReady;
}

export async function initMap(el, opts = {}) {
  await ensureMapsReady();
  const map = new google.maps.Map(el, {
    center: { lat: 50.9413, lng: 6.9583 }, zoom: 13, ...opts
  });
  return map;
}

export function addMarker(map, position, options = {}) {
  const hasAdvanced = !!(google.maps.marker && google.maps.marker.AdvancedMarkerElement);
  if (hasAdvanced) {
    return new google.maps.marker.AdvancedMarkerElement({ map, position, ...options });
  }
  return new google.maps.Marker({ map, position, ...options });
}
