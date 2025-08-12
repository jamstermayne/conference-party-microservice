// http.js - Simple HTTP utilities
export async function getJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch:', url, error);
    // Try offline fallback for parties
    if (url.includes('/api/parties')) {
      try {
        const fallback = await fetch('/offline-data/events.json');
        if (fallback.ok) {
          const data = await fallback.json();
          return { data: data.events || data.data || [] };
        }
      } catch {}
    }
    throw error;
  }
}

export async function postJSON(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}