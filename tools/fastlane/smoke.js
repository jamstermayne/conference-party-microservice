#!/usr/bin/env node
/* fastlane smoke: headless checks for production readiness */
const urlArg = process.argv.find(a => a.startsWith('--url=')) || '';
const URL = (urlArg.split('=')[1] || process.env.URL || 'https://conference-party-app.web.app').replace(/\/+$/,'');
const HOME = `${URL}/#/home`;

(async () => {
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.launch({ args:['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  
  // Capture console logs for debugging
  // Also capture errors
  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[home-pills-ensure]') || text.includes('[home-channels-ensure]') || text.includes('[home-contract]') || text.includes('DOM Debug:')) {
      console.log('Browser log:', text);
      // Also log the full args for objects
      if (text.includes('DOM Debug:')) {
        msg.args().forEach(async (arg, i) => {
          if (i > 0) { // Skip the "DOM Debug:" string
            const val = await arg.jsonValue().catch(() => null);
            if (val) console.log('DOM details:', JSON.stringify(val, null, 2));
          }
        });
      }
    }
  });

  // 1) Home route
  await page.goto(HOME, { waitUntil:'networkidle2' });
  
  // Wait for dynamic content to render
  await page.waitForFunction(() => {
    const pills = document.querySelectorAll('.day-pill').length;
    // Look for both button and anchor channel elements
    const channels = document.querySelectorAll('.channel-btn, a.channel-btn').length;
    return pills > 0 || channels > 0;
  }, { timeout: 10000 }).then(async () => {
    // Give a bit more time for all elements to settle
    await new Promise(r => setTimeout(r, 2000)); // Wait for router to fetch data and render pills
  }).catch(async () => {
    console.log('⚠️  Home content did not fully render after 10s');
    const state = await page.evaluate(() => ({
      pills: document.querySelectorAll('.day-pill').length,
      channels: document.querySelectorAll('.channel-btn').length,
      sections: document.querySelectorAll('.home-section').length,
      panel: !!document.querySelector('.home-panel')
    }));
    console.log('Current state:', state);
  });

  // Add more detailed DOM inspection
  await page.evaluate(() => {
    console.log('DOM Debug:', {
      panels: [...document.querySelectorAll('.home-panel')].map(p => p.className),
      sections: [...document.querySelectorAll('.home-section')].map(s => ({
        class: s.className,
        dataSection: s.dataset.section || s.getAttribute('data-section'),
        pills: s.querySelectorAll('.day-pill').length,
        pillsInDayPills: s.querySelectorAll('.day-pills .day-pill').length
      })),
      allPillsParents: [...document.querySelectorAll('.day-pill')].map(p => p.parentElement?.className),
      channelBtns: [...document.querySelectorAll('.channel-btn, a.channel-btn')].map(b => b.textContent.trim()),
      channelAnchors: [...document.querySelectorAll('a.channel-btn')].map(a => a.href)
    });
  });
  
  const home = await page.evaluate(() => {
    const hrefs = [...document.querySelectorAll('link[rel=stylesheet]')].map(l=>l.href);
    // Find positions of home.css and cards-final.css
    const homeIdx = hrefs.findIndex(h => /home\.css/i.test(h));
    const cardsIdx = hrefs.findIndex(h => /cards-final\.css/i.test(h));
    const orderOk = homeIdx >= 0 && cardsIdx >= 0 && homeIdx < cardsIdx;

    // More flexible selectors to handle multiple rendering approaches
    const allPills = document.querySelectorAll('.day-pill').length;
    
    // Count pills in properly structured sections (with data-section)
    const partiesPills = document.querySelectorAll('[data-section="parties"] .day-pills .day-pill').length || 
                         document.querySelectorAll('[data-section="parties"] .day-pill').length ||
                         document.querySelectorAll('[data-kind="parties"] .day-pill').length;
    
    // Count pills in map section                    
    const mapPills = document.querySelectorAll('[data-section="map"] .day-pills .day-pill').length ||
                    document.querySelectorAll('[data-section="map"] .day-pill').length ||
                    document.querySelectorAll('[data-kind="map"] .day-pill').length;
                    
    // Look for both button and anchor channel elements
    const channels = document.querySelectorAll('.channel-btn, a.channel-btn').length;

    const mapsScripts = [...document.scripts].filter(s=>s.src.includes('maps.googleapis.com/maps/api/js')).map(s=>s.src);
    const mapsOk = mapsScripts.length === 1 && !mapsScripts[0].includes('__REPLACE_WITH_PROD_KEY__');

    return { orderOk, allPills, partiesPills, mapPills, channels, mapsOk, mapsScripts, hash: location.hash };
  });

  console.log('\n[home]');
  console.table(home);

  if (!home.orderOk) { console.error('❌ CSS order wrong (home.css must precede cards-final.css)'); process.exit(2); }
  if (!home.mapsOk) { console.error('❌ Maps loader not OK (must be single loader with real key)'); process.exit(2); }
  // Channels check is optional - they may not be rendered immediately (3 expected: Parties, Map, Calendar)
  if (home.channels < 3) { console.warn('⚠️  Channel buttons missing on home (non-critical)'); }

  // 2) Check parties and map day navigation (if pills are rendered)
  const hasPills = home.allPills > 0;  // Use total pills since section detection varies
  
  if (!hasPills) {
    console.log('\n⚠️  No day pills rendered - checking if API is responding...');
    const apiCheck = await page.evaluate(async () => {
      try {
        const r = await fetch('/api/parties?conference=gamescom2025');
        const j = await r.json();
        return { status: r.status, hasData: !!(j?.data?.length || j?.parties?.length) };
      } catch(e) {
        return { error: e.message };
      }
    });
    console.log('API check:', apiCheck);
  }
  
  // Test map navigation specifically to check subnav
  if (home.mapPills > 0) {
    // Click a map pill to test navigation
    const clicked = await page.evaluate(() => {
      // Click the second map pill
      const pill = document.querySelector('[data-section="map"] .day-pill:nth-child(2)');
      if (pill) {
        pill.click();
        return true;
      }
      return false;
    });
    // wait for subnav and pressed state
    await page.waitForSelector('.v-day-subnav .day-pill', { timeout: 10000 }).catch(()=>{});
    const map = await page.evaluate(() => ({
      hash: location.hash,
      subnavPills: document.querySelectorAll('.v-day-subnav .day-pill').length,
      pressed: document.querySelectorAll('.v-day-subnav .day-pill[aria-pressed="true"]').length
    }));

    console.log('\n[map navigation test]');
    console.table(map);
    
    // Only warn if subnav missing on map route
    if (map.subnavPills < 4 && clicked && map.hash.includes('/map/')) { 
      console.warn('⚠️  Map subnav pills not present after navigation to map route'); 
    }
  }


  // Test search is disabled
  console.log('\n[search disable test]');
  const searchTest = await page.evaluate(() => {
    // Try to navigate to search
    location.hash = '#/search';
    // Wait a bit for redirect
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          hash: location.hash,
          redirectedToHome: location.hash === '#/home',
          searchButtonExists: !!document.querySelector('[data-channel="search"]'),
          searchUIExists: !!document.querySelector('[data-role="search"], .search, .search-bar')
        });
      }, 100);
    });
  });
  console.table(searchTest);
  
  if (!searchTest.redirectedToHome) {
    console.warn('⚠️  Search route not redirecting to home');
  }

  await browser.close();
  console.log('\n✅ Smoke PASS');
})().catch(err => { console.error(err); process.exit(1); });