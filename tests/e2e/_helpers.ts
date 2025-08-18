import { Page } from '@playwright/test';

// Block external Maps loader & stub minimal google maps API
export async function stubGoogleMaps(page: Page) {
  await page.route('**/maps.googleapis.com/maps/api/js**', route => route.fulfill({ status: 200, body: '' }));
  await page.addInitScript(() => {
    // Minimal surface the app touches
    // @ts-ignore
    window.google = {
      maps: {
        version: 'stub',
        Map: function(el:any,opts:any){ this.el = el; this.opts = opts; },
        LatLngBounds: function(){ this.extend = () => {}; },
        marker: { AdvancedMarkerElement: function(opts:any){ this.opts = opts; } }
      }
    };
    // Provide whenMapsReady promise if code awaits it
    // @ts-ignore
    window.whenMapsReady = Promise.resolve(window.google.maps);
  });
}

export async function mockAPI(page: Page) {
  if (process.env.E2E_MOCK === '0') return; // live mode
  // Deterministic stub for parties Mon–Sat
  const today = new Date(Date.UTC(2025, 7, 18)); // Mon 2025-08-18
  const days = Array.from({length:6}, (_,i)=> {
    const d = new Date(today); d.setUTCDate(today.getUTCDate()+i);
    return d.toISOString().slice(0,10);
  });
  const stub = days.flatMap((iso, i) => ([
    { id:`p${i}a`, title:`Party A ${iso}`, date: iso, time:'20:00', venue:'Hall A', lat:50.94, lng:6.96 },
    { id:`p${i}b`, title:`Party B ${iso}`, date: iso, time:'22:00', venue:'Hall B', lat:50.95, lng:6.97 },
  ]));

  await page.route('**/api/parties**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: stub }),
    });
  });

  // Optional: ICS generate endpoint (return 200 so "Add to Calendar" click is testable)
  await page.route('**/api/calendar/ics**', route => {
    route.fulfill({ status: 200, body: 'BEGIN:VCALENDAR\nEND:VCALENDAR', headers: { 'content-type':'text/calendar' } });
  });
}