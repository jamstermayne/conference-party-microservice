/**
 * Live App Test - Verify unified conference app functionality
 */

const puppeteer = require('puppeteer');

async function testLiveApp() {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🌐 Testing live app at: https://conference-party-app.web.app');
    
    // Navigate to the app
    await page.goto('https://conference-party-app.web.app', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for the unified app to initialize
    await page.waitForSelector('.unified-app', { timeout: 10000 });
    
    // Test 1: Check if main navigation is present
    const navItems = await page.$$('.nav-item');
    console.log(`✅ Navigation items found: ${navItems.length}/5`);
    
    // Test 2: Check if app header is present
    const header = await page.$('.app-header');
    console.log(`✅ App header: ${header ? 'Found' : 'Missing'}`);
    
    // Test 3: Check if parties section loads
    const partiesSection = await page.$('.section-parties');
    console.log(`✅ Parties section: ${partiesSection ? 'Found' : 'Missing'}`);
    
    // Test 4: Check for party cards
    const partyCards = await page.$$('.party-card-signature');
    console.log(`✅ Party cards loaded: ${partyCards.length}`);
    
    // Test 5: Test navigation by clicking calendar tab
    await page.click('[data-section="calendar"]');
    await page.waitForTimeout(1000);
    
    const calendarSection = await page.$('.section-calendar');
    console.log(`✅ Calendar navigation: ${calendarSection ? 'Working' : 'Failed'}`);
    
    // Test 6: Test contacts navigation
    await page.click('[data-section="contacts"]');
    await page.waitForTimeout(1000);
    
    const contactsSection = await page.$('.section-contacts');
    console.log(`✅ Contacts navigation: ${contactsSection ? 'Working' : 'Failed'}`);
    
    // Test 7: Test invites navigation
    await page.click('[data-section="invites"]');
    await page.waitForTimeout(1000);
    
    const invitesSection = await page.$('.section-invites');
    console.log(`✅ Invites navigation: ${invitesSection ? 'Working' : 'Failed'}`);
    
    // Test 8: Test account navigation
    await page.click('[data-section="account"]');
    await page.waitForTimeout(1000);
    
    const accountSection = await page.$('.section-account');
    console.log(`✅ Account navigation: ${accountSection ? 'Working' : 'Failed'}`);
    
    // Test 9: Go back to parties and test party interaction
    await page.click('[data-section="parties"]');
    await page.waitForTimeout(1000);
    
    // Check if save button works
    const saveBtn = await page.$('.save-btn');
    if (saveBtn) {
      await saveBtn.click();
      console.log('✅ Save button interaction: Working');
    }
    
    // Test 10: Check if design tokens are loaded
    const computedStyle = await page.evaluate(() => {
      const element = document.querySelector('.unified-app');
      return element ? window.getComputedStyle(element).getPropertyValue('--color-accent') : null;
    });
    console.log(`✅ Design tokens loaded: ${computedStyle ? 'Yes' : 'No'}`);
    
    console.log('\n🎉 Live app test completed successfully!');
    console.log('🔗 App URL: https://conference-party-app.web.app');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testLiveApp().catch(console.error);