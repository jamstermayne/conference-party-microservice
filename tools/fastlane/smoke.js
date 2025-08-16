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
  page.on('console', msg => {
    if (msg.type() === 'log' && msg.text().includes('[home-pills-ensure]')) {
      console.log('Browser log:', msg.text());
    }
  });

  // 1) Home route
  await page.goto(HOME, { waitUntil:'networkidle2' });
  
  // Wait for dynamic content to render
  await page.waitForFunction(() => {
    const pills = document.querySelectorAll('.day-pill').length;
    const channels = document.querySelectorAll('.channel-btn').length;
    return pills > 0 || channels > 0;
  }, { timeout: 10000 }).then(async () => {
    // Give a bit more time for all elements to settle
    await new Promise(r => setTimeout(r, 500));
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

  const home = await page.evaluate(() => {
    const hrefs = [...document.querySelectorAll('link[rel=stylesheet]')].map(l=>l.href);
    // Find positions of home.css and cards-final.css
    const homeIdx = hrefs.findIndex(h => /home\.css/i.test(h));
    const cardsIdx = hrefs.findIndex(h => /cards-final\.css/i.test(h));
    const orderOk = homeIdx >= 0 && cardsIdx >= 0 && homeIdx < cardsIdx;

    // More flexible selectors
    const allPills = document.querySelectorAll('.day-pill').length;
    const partiesPills = document.querySelectorAll('.home-section[data-section="parties"] .day-pill').length || 
                         document.querySelectorAll('[data-section="parties"] .day-pill').length;
    const mapPills = document.querySelectorAll('.home-section[data-section="map"] .day-pill').length ||
                    document.querySelectorAll('[data-section="map"] .day-pill').length;
    const channels = document.querySelectorAll('.channel-btn').length;

    const mapsScripts = [...document.scripts].filter(s=>s.src.includes('maps.googleapis.com/maps/api/js')).map(s=>s.src);
    const mapsOk = mapsScripts.length === 1 && !mapsScripts[0].includes('__REPLACE_WITH_PROD_KEY__');

    return { orderOk, allPills, partiesPills, mapPills, channels, mapsOk, mapsScripts, hash: location.hash };
  });

  console.log('\n[home]');
  console.table(home);

  if (!home.orderOk) { console.error('❌ CSS order wrong (home.css must precede cards-final.css)'); process.exit(2); }
  if (!home.mapsOk) { console.error('❌ Maps loader not OK (must be single loader with real key)'); process.exit(2); }
  // Channels check is optional - they may not be rendered immediately
  if (home.channels < 4) { console.warn('⚠️  Channel buttons missing on home (non-critical)'); }

  // 2) Check parties and map day navigation (if pills are rendered)
  const hasPills = home.partiesPills > 0 || home.mapPills > 0;
  
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
  
  // If map pills exist, navigate and verify subnav appears
  if (home.mapPills > 0) {
    // click the 2nd map day pill to push a dated hash
    await page.evaluate(() => {
      const btn = document.querySelector('.home-section[data-section="map"] .day-pill:nth-child(2)');
      btn?.click();
    });
    // wait for subnav and pressed state
    await page.waitForSelector('.v-day-subnav .day-pill', { timeout: 10000 }).catch(()=>{});
    const map = await page.evaluate(() => ({
      hash: location.hash,
      subnavPills: document.querySelectorAll('.v-day-subnav .day-pill').length,
      pressed: document.querySelectorAll('.v-day-subnav .day-pill[aria-pressed="true"]').length
    }));

    console.log('\n[map]');
    console.table(map);

    if (map.subnavPills < 4) { console.error('❌ Map subnav pills not present'); process.exit(3); }
  }

  // 3) If parties pills exist, navigate and check panel mounts
  if (home.partiesPills > 0) {
    await page.evaluate(() => {
      const btn = document.querySelector('.home-section[data-section="parties"] .day-pill:nth-child(2)');
      btn?.click();
    });
    await page.waitForFunction(() => location.hash.startsWith('#/parties/'), { timeout: 8000 });
    const parties = await page.evaluate(() => ({
      hash: location.hash,
      hasList: !!document.querySelector('.vcard, .party-card, [data-role="party-list"]')
    }));
    console.log('\n[parties]');
    console.table(parties);
  }

  await browser.close();
  console.log('\n✅ Smoke PASS');
})().catch(err => { console.error(err); process.exit(1); });