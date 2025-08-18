#!/usr/bin/env node
/* smoke-2panel.js - Test 2-panel system */
const urlArg = process.argv.find(a => a.startsWith('--url=')) || '';
const URL = (urlArg.split('=')[1] || process.env.URL || 'https://conference-party-app.web.app').replace(/\/+$/,'');

(async () => {
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.launch({ args:['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  
  // Capture console for debugging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[router-2panel]')) {
      console.log('Router:', text);
    }
  });
  
  console.log('Testing URL:', URL);
  
  // 1. Load home page
  await page.goto(URL, { waitUntil: 'networkidle2' });
  
  // Wait for router to initialize
  await page.waitForFunction(() => 
    document.querySelector('.home-panel') && 
    document.querySelectorAll('.day-pill').length > 0,
    { timeout: 10000 }
  );
  
  // 2. Check home structure
  const homeStructure = await page.evaluate(() => {
    const homePanel = document.querySelector('.home-panel');
    const detailPanel = document.querySelector('.detail-panel');
    const channels = document.querySelectorAll('.channel-btn');
    const partiesPills = document.querySelectorAll('[data-section="parties"] .day-pill');
    const mapPills = document.querySelectorAll('[data-section="map"] .day-pill');
    
    // Check all pills are buttons
    const allPillsAreButtons = [...document.querySelectorAll('.day-pill')].every(p => 
      p.tagName === 'BUTTON' && p.type === 'button'
    );
    
    // Check channel buttons
    const channelLabels = [...channels].map(c => 
      c.querySelector('.channel-label')?.textContent
    );
    
    return {
      hash: location.hash,
      hasHomePanel: !!homePanel,
      hasDetailPanel: !!detailPanel,
      detailPanelActive: detailPanel?.classList.contains('active'),
      channelCount: channels.length,
      channelLabels,
      partiesPillsCount: partiesPills.length,
      mapPillsCount: mapPills.length,
      allPillsAreButtons
    };
  });
  
  console.log('\n[Home Structure]');
  console.table(homeStructure);
  
  // Verify requirements
  if (!homeStructure.hasHomePanel) {
    console.error('❌ No home panel found');
    process.exit(1);
  }
  
  if (!homeStructure.hasDetailPanel) {
    console.error('❌ No detail panel found');
    process.exit(1);
  }
  
  if (homeStructure.channelCount !== 6) {
    console.error(`❌ Expected 6 channel buttons, found ${homeStructure.channelCount}`);
    process.exit(1);
  }
  
  if (homeStructure.partiesPillsCount !== 6) {
    console.error(`❌ Expected 6 parties pills (Mon-Sat), found ${homeStructure.partiesPillsCount}`);
    process.exit(1);
  }
  
  if (homeStructure.mapPillsCount !== 6) {
    console.error(`❌ Expected 6 map pills (Mon-Sat), found ${homeStructure.mapPillsCount}`);
    process.exit(1);
  }
  
  if (!homeStructure.allPillsAreButtons) {
    console.error('❌ Not all pills are buttons');
    process.exit(1);
  }
  
  // 3. Test parties navigation
  await page.evaluate(() => {
    const pill = document.querySelector('[data-section="parties"] .day-pill');
    if (pill) pill.click();
  });
  
  await page.waitForTimeout(500);
  
  const partiesView = await page.evaluate(() => {
    const detailPanel = document.querySelector('.detail-panel');
    const title = document.querySelector('.panel-title');
    const cards = document.querySelectorAll('.party-card');
    
    return {
      hash: location.hash,
      detailPanelActive: detailPanel?.classList.contains('active'),
      title: title?.textContent,
      hasBackButton: !!document.querySelector('.back-btn'),
      cardCount: cards.length
    };
  });
  
  console.log('\n[Parties View]');
  console.table(partiesView);
  
  if (!partiesView.detailPanelActive) {
    console.error('❌ Detail panel not active after clicking parties pill');
    process.exit(1);
  }
  
  if (!partiesView.hash.includes('/parties/')) {
    console.error('❌ URL not updated to parties route');
    process.exit(1);
  }
  
  // 4. Test back button
  await page.evaluate(() => {
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) backBtn.click();
  });
  
  await page.waitForTimeout(500);
  
  const backToHome = await page.evaluate(() => ({
    hash: location.hash,
    detailPanelActive: document.querySelector('.detail-panel')?.classList.contains('active')
  }));
  
  console.log('\n[Back Navigation]');
  console.table(backToHome);
  
  if (backToHome.hash !== '#/home') {
    console.error('❌ Back button did not return to home');
    process.exit(1);
  }
  
  if (backToHome.detailPanelActive) {
    console.error('❌ Detail panel still active after back');
    process.exit(1);
  }
  
  // 5. Test map navigation
  await page.evaluate(() => {
    const pill = document.querySelector('[data-section="map"] .day-pill:nth-child(2)');
    if (pill) pill.click();
  });
  
  await page.waitForTimeout(1000);
  
  const mapView = await page.evaluate(() => {
    const detailPanel = document.querySelector('.detail-panel');
    const title = document.querySelector('.panel-title');
    const mapContainer = document.querySelector('#map-container');
    
    return {
      hash: location.hash,
      detailPanelActive: detailPanel?.classList.contains('active'),
      title: title?.textContent,
      hasMapContainer: !!mapContainer
    };
  });
  
  console.log('\n[Map View]');
  console.table(mapView);
  
  if (!mapView.hash.includes('/map/')) {
    console.error('❌ URL not updated to map route');
    process.exit(1);
  }
  
  // 6. Test channel navigation
  await page.evaluate(() => {
    location.hash = '#/home';
  });
  
  await page.waitForTimeout(500);
  
  await page.evaluate(() => {
    const channelBtn = document.querySelector('[data-channel="calendar"]');
    if (channelBtn) channelBtn.click();
  });
  
  await page.waitForTimeout(500);
  
  const channelView = await page.evaluate(() => ({
    hash: location.hash,
    detailPanelActive: document.querySelector('.detail-panel')?.classList.contains('active'),
    title: document.querySelector('.panel-title')?.textContent
  }));
  
  console.log('\n[Channel View]');
  console.table(channelView);
  
  if (channelView.hash !== '#/calendar') {
    console.error('❌ Channel button did not navigate correctly');
    process.exit(1);
  }
  
  // 7. Test search is disabled
  await page.evaluate(() => {
    location.hash = '#/search';
  });
  
  await page.waitForTimeout(500);
  
  const searchRedirect = await page.evaluate(() => ({
    hash: location.hash
  }));
  
  if (searchRedirect.hash !== '#/home') {
    console.error('❌ Search route not redirecting to home');
    process.exit(1);
  }
  
  // 8. Test CSS order
  const cssOrder = await page.evaluate(() => {
    const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
    const hrefs = links.map(l => l.href);
    const homeIdx = hrefs.findIndex(h => h.includes('home.css'));
    const cardsIdx = hrefs.findIndex(h => h.includes('cards-final.css'));
    const panelsIdx = hrefs.findIndex(h => h.includes('panels-2panel.css'));
    
    return {
      totalCSS: links.length,
      homeIdx,
      cardsIdx,
      panelsIdx,
      correctOrder: homeIdx < cardsIdx && cardsIdx < panelsIdx
    };
  });
  
  console.log('\n[CSS Order]');
  console.table(cssOrder);
  
  if (!cssOrder.correctOrder) {
    console.error('❌ CSS files not in correct order');
    process.exit(1);
  }
  
  if (cssOrder.totalCSS !== 3) {
    console.warn(`⚠️ Expected exactly 3 CSS files, found ${cssOrder.totalCSS}`);
  }
  
  await browser.close();
  console.log('\n✅ 2-Panel System Test PASSED');
})().catch(err => { 
  console.error('Test failed:', err); 
  process.exit(1); 
});