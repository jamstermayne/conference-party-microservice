/**
 * E2E Tests for Spontaneous Gathering Creation
 * Tests the full user flow of creating and managing gatherings
 */

const { test, expect } = require('@playwright/test');

// Test utilities
const setupTestUser = async (page, userType = 'senior-cto') => {
  // Set up test user in localStorage
  await page.addInitScript((type) => {
    const users = {
      'senior-cto': {
        id: 'test_cto_001',
        name: 'Alice Chen',
        title: 'CTO',
        company: 'TechStartup Inc',
        interests: ['AI', 'Scaling', 'Leadership'],
        goals: ['hiring', 'networking']
      },
      'senior-engineer': {
        id: 'test_eng_001',
        name: 'John Engineer',
        title: 'Senior Engineer',
        company: 'GameDev Studio',
        interests: ['Architecture', 'Gaming', 'Performance'],
        goals: ['learning', 'networking']
      },
      'product-manager': {
        id: 'test_pm_001',
        name: 'Sarah PM',
        title: 'Product Manager',
        company: 'BigTech Corp',
        interests: ['Product Strategy', 'Analytics'],
        goals: ['partnership', 'networking']
      }
    };
    
    const user = users[type];
    localStorage.setItem('userId', user.id);
    localStorage.setItem(`profile_${user.id}`, JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');
  }, userType);
};

const cleanupTestData = async () => {
  // Clean up test data after tests
  // In real implementation, this would clear test data from database
  console.log('Cleaning up test data...');
};

const simulateAcceptInvitation = async (page, gatheringUrl) => {
  // Extract gathering ID from URL
  const gatheringId = gatheringUrl.split('/').pop();
  
  // Navigate to invitation page
  await page.goto(`/invitations/${gatheringId}/accept`);
  await page.click('[data-testid="accept-invitation"]');
  await page.waitForSelector('[data-testid="invitation-accepted"]');
};

test.describe('Spontaneous Gathering Creation', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestUser(page, 'senior-cto');
    await page.goto('http://localhost:3000/gatherings.html');
  });
  
  test.afterEach(async () => {
    await cleanupTestData();
  });
  
  test('should create coffee gathering with smart targeting', async ({ page }) => {
    // Click create gathering button
    await page.click('[data-testid="create-gathering-btn"]');
    
    // Wait for modal to appear
    await page.waitForSelector('[data-testid="gathering-modal"]');
    
    // Step 1: Choose gathering type
    await page.click('[data-testid="gathering-type-coffee"]');
    
    // Step 2: Fill details
    await page.fill('[data-testid="gathering-title"]', 'Coffee with Fellow CTOs');
    await page.fill('[data-testid="gathering-description"]', 
      'Let\'s discuss scaling engineering teams and technical leadership challenges over coffee.'
    );
    
    // Select venue
    await page.selectOption('[data-testid="gathering-venue"]', 'starbucks-hall-6');
    
    // Set time (30 minutes from now)
    const futureTime = new Date(Date.now() + 30 * 60000);
    const timeString = futureTime.toTimeString().slice(0, 5);
    await page.fill('[data-testid="gathering-time"]', timeString);
    
    // Set capacity
    await page.fill('[data-testid="gathering-capacity"]', '8');
    
    // Wait for AI targeting preview to load
    await page.waitForSelector('[data-testid="targeting-preview"]', { timeout: 5000 });
    
    // Verify targeting preview shows estimated attendees
    const estimatedText = await page.textContent('[data-testid="estimated-attendees"]');
    expect(estimatedText).toMatch(/\d+-\d+ people match your criteria/);
    
    // Check targeting criteria are shown
    const targetingCriteria = await page.textContent('[data-testid="targeting-criteria"]');
    expect(targetingCriteria).toContain('Leadership');
    
    // Move to next step
    await page.click('[data-testid="next-button"]');
    
    // Step 3: Review and create
    await page.waitForSelector('[data-testid="gathering-review"]');
    
    // Verify summary is correct
    const summaryTitle = await page.textContent('[data-testid="review-title"]');
    expect(summaryTitle).toBe('Coffee with Fellow CTOs');
    
    const summaryVenue = await page.textContent('[data-testid="review-venue"]');
    expect(summaryVenue).toContain('Starbucks');
    
    // Create gathering
    await page.click('[data-testid="create-gathering-button"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="gathering-created-success"]');
    
    // Should show gathering details
    await expect(page.locator('[data-testid="gathering-status"]')).toContainText('Sending invitations');
    
    // Wait for invitations to be processed
    await page.waitForSelector('[data-testid="invitation-count"]', { timeout: 10000 });
    const invitationCount = await page.textContent('[data-testid="invitation-count"]');
    expect(invitationCount).toMatch(/Sent \d+ invitations/);
  });
  
  test('should show real-time updates as people join', async ({ page, context }) => {
    // Create a gathering first
    await page.click('[data-testid="create-gathering-btn"]');
    await page.waitForSelector('[data-testid="gathering-modal"]');
    
    // Quick create with minimal details
    await page.click('[data-testid="gathering-type-coffee"]');
    await page.fill('[data-testid="gathering-title"]', 'Test Coffee Chat');
    await page.fill('[data-testid="gathering-description"]', 'Quick test gathering');
    await page.selectOption('[data-testid="gathering-venue"]', 'starbucks-hall-6');
    await page.click('[data-testid="next-button"]');
    await page.click('[data-testid="create-gathering-button"]');
    
    // Wait for gathering to be created
    await page.waitForSelector('[data-testid="gathering-created-success"]');
    const gatheringUrl = page.url();
    
    // Open a new page as another user
    const otherUserPage = await context.newPage();
    await setupTestUser(otherUserPage, 'senior-engineer');
    
    // Simulate accepting invitation from the other user
    await simulateAcceptInvitation(otherUserPage, gatheringUrl);
    
    // Original page should show real-time update
    await expect(page.locator('[data-testid="attendee-count"]')).toContainText('2 attending');
    
    // Check attendee list updated
    await expect(page.locator('[data-testid="attendee-list"]')).toContainText('John Engineer');
    
    // Close the other page
    await otherUserPage.close();
  });
  
  test('should handle auto-acceptance for high-scoring matches', async ({ page }) => {
    // Create gathering with specific targeting for auto-acceptance
    await page.click('[data-testid="create-gathering-btn"]');
    await page.waitForSelector('[data-testid="gathering-modal"]');
    
    // Select demo/workshop type (higher auto-accept rate)
    await page.click('[data-testid="gathering-type-demo"]');
    
    await page.fill('[data-testid="gathering-title"]', 'AI/ML Demo for Engineers');
    await page.fill('[data-testid="gathering-description"]', 
      'Live demo of our new ML pipeline for engineers interested in AI applications.'
    );
    
    // Add specific tags that trigger auto-acceptance
    await page.fill('[data-testid="gathering-tags"]', 'AI, Machine Learning, Engineering, Demo');
    
    await page.selectOption('[data-testid="gathering-venue"]', 'demo-booth-7');
    await page.click('[data-testid="next-button"]');
    await page.click('[data-testid="create-gathering-button"]');
    
    // Wait for auto-acceptances
    await page.waitForSelector('[data-testid="auto-accepted-section"]', { timeout: 15000 });
    
    // Check that some invitations were auto-accepted
    const autoAcceptedCount = await page.textContent('[data-testid="auto-accepted-count"]');
    expect(autoAcceptedCount).toMatch(/\d+ auto-accepted/);
    
    // Verify auto-accepted users appear in attendee list
    const attendeeList = await page.textContent('[data-testid="attendee-list"]');
    expect(attendeeList).not.toBe('');
  });
  
  test('should allow editing gathering details', async ({ page }) => {
    // Create a gathering
    await page.click('[data-testid="create-gathering-btn"]');
    await page.waitForSelector('[data-testid="gathering-modal"]');
    
    await page.click('[data-testid="gathering-type-coffee"]');
    await page.fill('[data-testid="gathering-title"]', 'Original Title');
    await page.fill('[data-testid="gathering-description"]', 'Original description');
    await page.selectOption('[data-testid="gathering-venue"]', 'starbucks-hall-6');
    await page.click('[data-testid="next-button"]');
    await page.click('[data-testid="create-gathering-button"]');
    
    await page.waitForSelector('[data-testid="gathering-created-success"]');
    
    // Click edit button
    await page.click('[data-testid="edit-gathering-btn"]');
    
    // Update title and description
    await page.fill('[data-testid="gathering-title"]', 'Updated Title');
    await page.fill('[data-testid="gathering-description"]', 'Updated description with more details');
    
    // Save changes
    await page.click('[data-testid="save-changes-btn"]');
    
    // Verify updates are reflected
    await page.waitForSelector('[data-testid="update-success"]');
    await expect(page.locator('[data-testid="gathering-title-display"]')).toContainText('Updated Title');
    await expect(page.locator('[data-testid="gathering-description-display"]')).toContainText('Updated description');
  });
  
  test('should handle gathering cancellation', async ({ page }) => {
    // Create a gathering
    await page.click('[data-testid="create-gathering-btn"]');
    await page.waitForSelector('[data-testid="gathering-modal"]');
    
    await page.click('[data-testid="gathering-type-coffee"]');
    await page.fill('[data-testid="gathering-title"]', 'To Be Cancelled');
    await page.fill('[data-testid="gathering-description"]', 'This will be cancelled');
    await page.selectOption('[data-testid="gathering-venue"]', 'starbucks-hall-6');
    await page.click('[data-testid="next-button"]');
    await page.click('[data-testid="create-gathering-button"]');
    
    await page.waitForSelector('[data-testid="gathering-created-success"]');
    
    // Click cancel gathering
    await page.click('[data-testid="cancel-gathering-btn"]');
    
    // Confirm cancellation
    await page.waitForSelector('[data-testid="cancel-confirmation-modal"]');
    await page.fill('[data-testid="cancellation-reason"]', 'Schedule conflict');
    await page.click('[data-testid="confirm-cancel-btn"]');
    
    // Verify gathering is marked as cancelled
    await page.waitForSelector('[data-testid="gathering-cancelled"]');
    await expect(page.locator('[data-testid="gathering-status"]')).toContainText('Cancelled');
    
    // Verify attendees were notified
    await expect(page.locator('[data-testid="cancellation-notice"]')).toContainText('All attendees have been notified');
  });
  
  test('should validate gathering form inputs', async ({ page }) => {
    await page.click('[data-testid="create-gathering-btn"]');
    await page.waitForSelector('[data-testid="gathering-modal"]');
    
    // Try to proceed without selecting type
    await page.click('[data-testid="next-button"]');
    await expect(page.locator('[data-testid="type-error"]')).toContainText('Please select a gathering type');
    
    // Select type and try to create without required fields
    await page.click('[data-testid="gathering-type-coffee"]');
    await page.click('[data-testid="next-button"]');
    await page.click('[data-testid="create-gathering-button"]');
    
    // Should show validation errors
    await expect(page.locator('[data-testid="title-error"]')).toContainText('Title is required');
    await expect(page.locator('[data-testid="description-error"]')).toContainText('Description is required');
    await expect(page.locator('[data-testid="venue-error"]')).toContainText('Please select a venue');
    
    // Fill in required fields
    await page.fill('[data-testid="gathering-title"]', 'Valid Title');
    await page.fill('[data-testid="gathering-description"]', 'Valid description');
    await page.selectOption('[data-testid="gathering-venue"]', 'starbucks-hall-6');
    
    // Should now be able to create
    await page.click('[data-testid="create-gathering-button"]');
    await page.waitForSelector('[data-testid="gathering-created-success"]');
  });
  
  test('should show gathering analytics', async ({ page }) => {
    // Create a gathering
    await page.click('[data-testid="create-gathering-btn"]');
    await page.waitForSelector('[data-testid="gathering-modal"]');
    
    await page.click('[data-testid="gathering-type-workshop"]');
    await page.fill('[data-testid="gathering-title"]', 'Workshop with Analytics');
    await page.fill('[data-testid="gathering-description"]', 'Testing analytics features');
    await page.selectOption('[data-testid="gathering-venue"]', 'workshop-room-1');
    await page.click('[data-testid="next-button"]');
    await page.click('[data-testid="create-gathering-button"]');
    
    await page.waitForSelector('[data-testid="gathering-created-success"]');
    
    // Navigate to analytics tab
    await page.click('[data-testid="analytics-tab"]');
    
    // Verify analytics are shown
    await expect(page.locator('[data-testid="invitations-sent"]')).toBeVisible();
    await expect(page.locator('[data-testid="acceptance-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="attendee-demographics"]')).toBeVisible();
    
    // Check that numbers are reasonable
    const invitationsSent = await page.textContent('[data-testid="invitations-sent-count"]');
    expect(parseInt(invitationsSent)).toBeGreaterThan(0);
    
    const acceptanceRate = await page.textContent('[data-testid="acceptance-rate-percentage"]');
    expect(acceptanceRate).toMatch(/\d+%/);
  });
});

// Export test configuration
module.exports = {
  setupTestUser,
  cleanupTestData,
  simulateAcceptInvitation
};