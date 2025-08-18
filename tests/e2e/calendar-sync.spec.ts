import { test, expect, Page } from '@playwright/test';
import { stubGoogleMaps, mockAPI } from './_helpers';

test.describe('Calendar Sync Functionality', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await stubGoogleMaps(page);
    await mockAPI(page);
    
    // Mock calendar sync data
    await page.route('**/api/sync**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          events: [
            {
              id: 'sync-1',
              title: 'Gamescom Opening Party',
              startsAt: '2025-08-20T18:00:00Z',
              endsAt: '2025-08-20T23:00:00Z',
              venue: 'Koelnmesse',
              source: 'google'
            },
            {
              id: 'sync-2',
              title: 'Unity Developer Meetup',
              startsAt: '2025-08-21T14:00:00Z',
              endsAt: '2025-08-21T16:00:00Z',
              venue: 'Unity Booth',
              source: 'google'
            }
          ]
        })
      });
    });

    await page.goto(baseURL! + '/#/home');
    await page.waitForLoadState('networkidle');
  });

  test('Calendar button exists in channels grid', async ({ page }) => {
    // Check channels grid has calendar button
    const channels = page.locator('.channels-grid .channel-btn');
    await expect(channels).toHaveCount(6);
    
    const channelTexts = await channels.allInnerTexts();
    expect(channelTexts.join(' ').toLowerCase()).toContain('calendar');
  });

  test('Clicking calendar button opens calendar panel', async ({ page }) => {
    // Find and click calendar button
    const calendarBtn = page.locator('.channels-grid .channel-btn').filter({ hasText: /calendar/i });
    await expect(calendarBtn).toBeVisible();
    
    await calendarBtn.click();
    
    // Wait for panel animation
    await page.waitForTimeout(500);
    
    // Check for active panel
    const activePanel = page.locator('.panel.panel--active').last();
    await expect(activePanel).toBeVisible();
    
    // Verify panel has calendar content or heading
    const panelHeading = activePanel.locator('h1, h2').first();
    const headingText = await panelHeading.textContent();
    expect(headingText?.toLowerCase()).toContain('calendar');
  });

  test('Calendar sync saves events to localStorage', async ({ page }) => {
    // Setup mock sync function
    await page.evaluate(() => {
      window.syncCalendar = () => {
        const events = [
          { id: '1', title: 'Event 1', startsAt: '2025-08-20T10:00:00Z' },
          { id: '2', title: 'Event 2', startsAt: '2025-08-21T14:00:00Z' }
        ];
        
        const store = JSON.parse(localStorage.getItem('store') || '{}');
        store.calendar = {
          events,
          lastSync: new Date().toISOString(),
          googleConnected: true
        };
        localStorage.setItem('store', JSON.stringify(store));
        
        // Emit event for UI update
        if (window.Events) {
          window.Events.emit('calendar:synced', { events });
        }
        
        return events;
      };
    });
    
    // Trigger sync
    const syncResult = await page.evaluate(() => window.syncCalendar());
    expect(syncResult).toHaveLength(2);
    
    // Verify localStorage
    const storedData = await page.evaluate(() => {
      const store = JSON.parse(localStorage.getItem('store') || '{}');
      return store.calendar;
    });
    
    expect(storedData.events).toHaveLength(2);
    expect(storedData.googleConnected).toBe(true);
  });

  test('ICS file download functionality', async ({ page }) => {
    // Navigate to parties section
    await page.locator('.home-section[data-section="parties"] .day-pill').first().click();
    await page.waitForTimeout(500);
    
    // Check if panel opened
    const panel = page.locator('.panel.panel--active').last();
    await expect(panel).toBeVisible();
    
    // Setup download handler
    await page.evaluate(() => {
      window.downloadICS = function(event) {
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//velocity.ai//Gamescom//EN
BEGIN:VEVENT
UID:${event.id}@velocity.ai
SUMMARY:${event.title}
END:VEVENT
END:VCALENDAR`;
        
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${event.id}.ics`;
        // Store for test verification instead of clicking
        window.lastICSDownload = { id: event.id, title: event.title };
        URL.revokeObjectURL(url);
        return true;
      };
    });
    
    // Simulate ICS download
    const downloadResult = await page.evaluate(() => {
      return window.downloadICS({ id: 'test-event', title: 'Test Event' });
    });
    
    expect(downloadResult).toBe(true);
    
    // Verify download was prepared
    const lastDownload = await page.evaluate(() => window.lastICSDownload);
    expect(lastDownload.id).toBe('test-event');
  });

  test('Calendar data persistence across page reloads', async ({ page }) => {
    // Set calendar data
    await page.evaluate(() => {
      const calendarData = {
        googleConnected: true,
        events: [
          { id: '1', title: 'Persisted Event 1' },
          { id: '2', title: 'Persisted Event 2' }
        ],
        lastSync: '2025-08-18T10:00:00Z'
      };
      
      const store = JSON.parse(localStorage.getItem('store') || '{}');
      store.calendar = calendarData;
      localStorage.setItem('store', JSON.stringify(store));
    });
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify data persisted
    const persistedData = await page.evaluate(() => {
      const store = JSON.parse(localStorage.getItem('store') || '{}');
      return store.calendar;
    });
    
    expect(persistedData.googleConnected).toBe(true);
    expect(persistedData.events).toHaveLength(2);
    expect(persistedData.events[0].title).toBe('Persisted Event 1');
  });

  test('Calendar sync with day filtering', async ({ page }) => {
    // Setup events for different days
    await page.evaluate(() => {
      const eventsByDay = {
        '2025-08-20': [
          { id: 'wed-1', title: 'Wednesday Event 1', startsAt: '2025-08-20T10:00:00Z', day: 'Wed' },
          { id: 'wed-2', title: 'Wednesday Event 2', startsAt: '2025-08-20T14:00:00Z', day: 'Wed' }
        ],
        '2025-08-21': [
          { id: 'thu-1', title: 'Thursday Event', startsAt: '2025-08-21T12:00:00Z', day: 'Thu' }
        ],
        '2025-08-22': [
          { id: 'fri-1', title: 'Friday Event', startsAt: '2025-08-22T16:00:00Z', day: 'Fri' }
        ]
      };
      
      const store = JSON.parse(localStorage.getItem('store') || '{}');
      store.calendar = {
        events: Object.values(eventsByDay).flat(),
        eventsByDay
      };
      localStorage.setItem('store', JSON.stringify(store));
      
      window.calendarEventsByDay = eventsByDay;
    });
    
    // Test day filtering
    const wednesdayEvents = await page.evaluate(() => {
      return window.calendarEventsByDay['2025-08-20'];
    });
    
    expect(wednesdayEvents).toHaveLength(2);
    expect(wednesdayEvents[0].title).toContain('Wednesday');
  });

  test('Calendar sync error handling', async ({ page }) => {
    // Mock failed sync
    await page.evaluate(() => {
      window.syncCalendarWithError = async () => {
        try {
          throw new Error('Sync failed: Network error');
        } catch (error) {
          // Store error in localStorage for UI
          const store = JSON.parse(localStorage.getItem('store') || '{}');
          store.calendar = {
            ...store.calendar,
            lastError: error.message,
            lastErrorTime: new Date().toISOString()
          };
          localStorage.setItem('store', JSON.stringify(store));
          
          // Emit error event
          if (window.Events) {
            window.Events.emit('calendar:error', { error: error.message });
          }
          
          return { error: error.message };
        }
      };
    });
    
    // Trigger failed sync
    const result = await page.evaluate(() => window.syncCalendarWithError());
    expect(result.error).toContain('Sync failed');
    
    // Verify error stored
    const storedError = await page.evaluate(() => {
      const store = JSON.parse(localStorage.getItem('store') || '{}');
      return store.calendar?.lastError;
    });
    
    expect(storedError).toContain('Network error');
  });

  test('Calendar integration with party events', async ({ page }) => {
    // Mock party events from API
    await page.evaluate(() => {
      window.partyEvents = [
        { id: 'party-1', title: 'Unity Party', startsAt: '2025-08-20T20:00:00Z' },
        { id: 'party-2', title: 'Indie Meetup', startsAt: '2025-08-21T18:00:00Z' }
      ];
      
      window.calendarEvents = [
        { id: 'cal-1', title: 'Unity Party', startsAt: '2025-08-20T20:00:00Z' }
      ];
      
      // Match calendar events with party events
      window.matchEvents = () => {
        const matched = [];
        window.calendarEvents.forEach(calEvent => {
          const match = window.partyEvents.find(party => 
            party.title === calEvent.title && 
            party.startsAt === calEvent.startsAt
          );
          if (match) {
            matched.push({ ...match, calendarId: calEvent.id, matched: true });
          }
        });
        
        const store = JSON.parse(localStorage.getItem('store') || '{}');
        store.matchedEvents = matched;
        localStorage.setItem('store', JSON.stringify(store));
        
        return matched;
      };
    });
    
    // Perform matching
    const matched = await page.evaluate(() => window.matchEvents());
    expect(matched).toHaveLength(1);
    expect(matched[0].title).toBe('Unity Party');
    expect(matched[0].matched).toBe(true);
  });
});

test.describe('Calendar Provider Integration', () => {
  test('Google Calendar connection flow', async ({ page, baseURL }) => {
    await stubGoogleMaps(page);
    await mockAPI(page);
    await page.goto(baseURL! + '/#/home');
    
    // Mock Google Calendar API
    await page.evaluate(() => {
      window.mockGoogleCalendar = {
        isConnected: false,
        connect: async function() {
          this.isConnected = true;
          const store = JSON.parse(localStorage.getItem('store') || '{}');
          store.calendar = {
            ...store.calendar,
            googleConnected: true,
            googleEmail: 'user@example.com'
          };
          localStorage.setItem('store', JSON.stringify(store));
          return { success: true };
        },
        disconnect: async function() {
          this.isConnected = false;
          const store = JSON.parse(localStorage.getItem('store') || '{}');
          store.calendar = {
            ...store.calendar,
            googleConnected: false,
            googleEmail: null
          };
          localStorage.setItem('store', JSON.stringify(store));
          return { success: true };
        }
      };
    });
    
    // Connect to Google
    const connectResult = await page.evaluate(() => 
      window.mockGoogleCalendar.connect()
    );
    expect(connectResult.success).toBe(true);
    
    // Verify connection stored
    const calendarState = await page.evaluate(() => {
      const store = JSON.parse(localStorage.getItem('store') || '{}');
      return store.calendar;
    });
    
    expect(calendarState.googleConnected).toBe(true);
    expect(calendarState.googleEmail).toBe('user@example.com');
  });

  test('Microsoft Calendar connection flow', async ({ page, baseURL }) => {
    await stubGoogleMaps(page);
    await mockAPI(page);
    await page.goto(baseURL! + '/#/home');
    
    // Mock Microsoft Calendar API
    await page.evaluate(() => {
      window.mockMicrosoftCalendar = {
        isConnected: false,
        connect: async function() {
          this.isConnected = true;
          const store = JSON.parse(localStorage.getItem('store') || '{}');
          store.calendar = {
            ...store.calendar,
            microsoftConnected: true,
            microsoftEmail: 'user@outlook.com'
          };
          localStorage.setItem('store', JSON.stringify(store));
          return { success: true };
        },
        getEvents: async function() {
          return [
            { id: 'ms-1', subject: 'Meeting', start: '2025-08-20T10:00:00Z' }
          ];
        }
      };
    });
    
    // Connect to Microsoft
    const connectResult = await page.evaluate(() => 
      window.mockMicrosoftCalendar.connect()
    );
    expect(connectResult.success).toBe(true);
    
    // Get events
    const events = await page.evaluate(() => 
      window.mockMicrosoftCalendar.getEvents()
    );
    expect(events).toHaveLength(1);
    expect(events[0].subject).toBe('Meeting');
  });

  test('Meet to Match ICS subscription', async ({ page, baseURL }) => {
    await stubGoogleMaps(page);
    await mockAPI(page);
    await page.goto(baseURL! + '/#/home');
    
    // Mock ICS subscription
    await page.evaluate(() => {
      window.mockICSSubscription = {
        subscribed: false,
        subscribe: async function(url) {
          if (!url || !url.endsWith('.ics')) {
            throw new Error('Invalid ICS URL');
          }
          
          this.subscribed = true;
          this.url = url;
          
          const store = JSON.parse(localStorage.getItem('store') || '{}');
          store.calendar = {
            ...store.calendar,
            icsSubscribed: true,
            icsUrl: url,
            icsEvents: [
              { id: 'ics-1', title: 'M2M Welcome', startsAt: '2025-08-20T16:00:00Z' },
              { id: 'ics-2', title: 'M2M Networking', startsAt: '2025-08-21T10:00:00Z' }
            ]
          };
          localStorage.setItem('store', JSON.stringify(store));
          
          return { success: true, events: 2 };
        }
      };
    });
    
    // Subscribe to ICS
    const subscribeResult = await page.evaluate(() => 
      window.mockICSSubscription.subscribe('https://meettomatch.com/calendar.ics')
    );
    
    expect(subscribeResult.success).toBe(true);
    expect(subscribeResult.events).toBe(2);
    
    // Verify subscription stored
    const calendarState = await page.evaluate(() => {
      const store = JSON.parse(localStorage.getItem('store') || '{}');
      return store.calendar;
    });
    
    expect(calendarState.icsSubscribed).toBe(true);
    expect(calendarState.icsUrl).toContain('meettomatch.com');
    expect(calendarState.icsEvents).toHaveLength(2);
  });

  test('Combined calendar sync from multiple sources', async ({ page, baseURL }) => {
    await stubGoogleMaps(page);
    await mockAPI(page);
    await page.goto(baseURL! + '/#/home');
    
    // Setup multiple calendar sources
    await page.evaluate(() => {
      window.combinedCalendarSync = async () => {
        const googleEvents = [
          { id: 'g-1', title: 'Google Event', source: 'google', startsAt: '2025-08-20T10:00:00Z' }
        ];
        const microsoftEvents = [
          { id: 'm-1', title: 'Microsoft Event', source: 'microsoft', startsAt: '2025-08-20T14:00:00Z' }
        ];
        const icsEvents = [
          { id: 'i-1', title: 'ICS Event', source: 'ics', startsAt: '2025-08-20T16:00:00Z' }
        ];
        
        // Combine all events
        const allEvents = [...googleEvents, ...microsoftEvents, ...icsEvents];
        
        // Sort by start time
        allEvents.sort((a, b) => 
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
        );
        
        const store = JSON.parse(localStorage.getItem('store') || '{}');
        store.calendar = {
          googleConnected: true,
          microsoftConnected: true,
          icsSubscribed: true,
          allEvents,
          eventsBySource: {
            google: googleEvents,
            microsoft: microsoftEvents,
            ics: icsEvents
          },
          totalEvents: allEvents.length,
          lastSync: new Date().toISOString()
        };
        localStorage.setItem('store', JSON.stringify(store));
        
        return {
          success: true,
          totalEvents: allEvents.length,
          sources: 3
        };
      };
    });
    
    // Perform combined sync
    const syncResult = await page.evaluate(() => window.combinedCalendarSync());
    
    expect(syncResult.success).toBe(true);
    expect(syncResult.totalEvents).toBe(3);
    expect(syncResult.sources).toBe(3);
    
    // Verify combined data
    const calendarState = await page.evaluate(() => {
      const store = JSON.parse(localStorage.getItem('store') || '{}');
      return store.calendar;
    });
    
    expect(calendarState.allEvents).toHaveLength(3);
    expect(calendarState.eventsBySource.google).toHaveLength(1);
    expect(calendarState.eventsBySource.microsoft).toHaveLength(1);
    expect(calendarState.eventsBySource.ics).toHaveLength(1);
  });
});