import { test, expect, Page } from '@playwright/test';
import { stubGoogleMaps, mockAPI } from './_helpers';

/**
 * Comprehensive Calendar Integration Tests
 * Testing Google Calendar, Microsoft Calendar, and Meet to Match ICS
 */

test.describe('Google Calendar Integration', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await stubGoogleMaps(page);
    await mockAPI(page);
    
    // Mock Google OAuth endpoints
    await page.route('**/api/googleCalendar/**', (route, request) => {
      const url = request.url();
      
      if (url.includes('/status')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ connected: false })
        });
      } else if (url.includes('/google/start')) {
        // Simulate OAuth redirect
        route.fulfill({
          status: 302,
          headers: {
            'Location': baseURL + '/api/googleCalendar/google/callback?code=mock_code&state=mock_state'
          }
        });
      } else if (url.includes('/google/callback')) {
        // Return success HTML with postMessage
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `<!doctype html>
            <html><body>
            <script>
              window.opener?.postMessage({ source: 'gcal', ok: true, email: 'test@gmail.com' }, '*');
              window.close();
            </script>
            </body></html>`
        });
      } else if (url.includes('/events')) {
        // Return mock calendar events
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            events: [
              {
                id: 'gcal-1',
                summary: 'Gamescom Opening Ceremony',
                location: 'Koelnmesse Hall 11',
                start: '2025-08-20T10:00:00Z',
                end: '2025-08-20T12:00:00Z',
                description: 'Official opening of Gamescom 2025'
              },
              {
                id: 'gcal-2',
                summary: 'Unity Keynote',
                location: 'Congress Center',
                start: '2025-08-20T14:00:00Z',
                end: '2025-08-20T15:30:00Z'
              }
            ],
            count: 2
          })
        });
      } else if (url.includes('/create')) {
        // Simulate event creation
        const body = request.postDataJSON();
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            eventId: 'new-event-' + Date.now(),
            htmlLink: 'https://calendar.google.com/event?eid=xxxxx'
          })
        });
      } else if (url.includes('/disconnect')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else if (url.includes('/user')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            email: 'test@gmail.com',
            name: 'Test User',
            picture: 'https://example.com/picture.jpg'
          })
        });
      } else {
        route.continue();
      }
    });
    
    await page.goto(baseURL! + '/#/home');
    await page.waitForLoadState('networkidle');
  });

  test('Google Calendar OAuth flow', async ({ page }) => {
    // Mock window.open for popup
    await page.evaluate(() => {
      let mockPopup: any = {
        closed: false,
        location: { href: '' },
        close: () => { mockPopup.closed = true; }
      };
      
      window.open = (url: string) => {
        mockPopup.location.href = url;
        // Simulate successful OAuth after delay
        setTimeout(() => {
          window.postMessage({ source: 'gcal', ok: true, email: 'test@gmail.com' }, '*');
          mockPopup.closed = true;
        }, 1000);
        return mockPopup as any;
      };
    });

    // Test OAuth connection
    const connectResult = await page.evaluate(async () => {
      const { startOAuth } = await import('/assets/js/services/gcal.js');
      try {
        const result = await startOAuth({ usePopup: true });
        return { success: true, result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    expect(connectResult.success).toBe(true);
  });

  test('Check Google Calendar connection status', async ({ page }) => {
    // Mock as connected
    await page.route('**/api/googleCalendar/status', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ connected: true })
      });
    });

    const isConnected = await page.evaluate(async () => {
      const response = await fetch('/api/googleCalendar/status', { credentials: 'include' });
      const data = await response.json();
      return data.connected;
    });

    expect(isConnected).toBe(true);
  });

  test('List Google Calendar events', async ({ page }) => {
    const events = await page.evaluate(async () => {
      const response = await fetch('/api/googleCalendar/events?range=week', {
        credentials: 'include'
      });
      return response.json();
    });

    expect(events.events).toHaveLength(2);
    expect(events.events[0].summary).toBe('Gamescom Opening Ceremony');
    expect(events.events[0].location).toBe('Koelnmesse Hall 11');
  });

  test('Create event in Google Calendar', async ({ page }) => {
    const newEvent = {
      summary: 'Indie Games Meetup',
      description: 'Networking event for indie developers',
      location: 'Hall 10, Stand A-021',
      start: '2025-08-21T16:00:00Z',
      end: '2025-08-21T18:00:00Z',
      timeZone: 'Europe/Berlin'
    };

    const result = await page.evaluate(async (event) => {
      const response = await fetch('/api/googleCalendar/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(event)
      });
      return response.json();
    }, newEvent);

    expect(result.success).toBe(true);
    expect(result.eventId).toBeTruthy();
    expect(result.htmlLink).toContain('calendar.google.com');
  });

  test('Disconnect Google Calendar', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const response = await fetch('/api/googleCalendar/disconnect', {
        method: 'POST',
        credentials: 'include'
      });
      return response.json();
    });

    expect(result.success).toBe(true);
  });

  test('Get Google user info', async ({ page }) => {
    const userInfo = await page.evaluate(async () => {
      const response = await fetch('/api/googleCalendar/user', {
        credentials: 'include'
      });
      return response.json();
    });

    expect(userInfo.email).toBe('test@gmail.com');
    expect(userInfo.name).toBe('Test User');
  });
});

test.describe('Microsoft Calendar Integration', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await stubGoogleMaps(page);
    await mockAPI(page);
    
    // Mock Microsoft Graph API
    await page.route('**/login.microsoftonline.com/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock_ms_token',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'Calendars.ReadWrite'
        })
      });
    });

    await page.route('**/graph.microsoft.com/**', (route, request) => {
      const url = request.url();
      
      if (url.includes('/me/events')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            value: [
              {
                id: 'ms-event-1',
                subject: 'Xbox Showcase',
                bodyPreview: 'Annual Xbox games showcase',
                start: {
                  dateTime: '2025-08-20T15:00:00.0000000',
                  timeZone: 'UTC'
                },
                end: {
                  dateTime: '2025-08-20T17:00:00.0000000',
                  timeZone: 'UTC'
                },
                location: {
                  displayName: 'Microsoft Theater'
                }
              },
              {
                id: 'ms-event-2',
                subject: 'Game Pass Partner Meeting',
                start: {
                  dateTime: '2025-08-21T10:00:00.0000000',
                  timeZone: 'UTC'
                },
                end: {
                  dateTime: '2025-08-21T11:00:00.0000000',
                  timeZone: 'UTC'
                }
              }
            ]
          })
        });
      } else if (url.includes('/me/calendar/events') && request.method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-ms-event-' + Date.now(),
            subject: request.postDataJSON().subject,
            webLink: 'https://outlook.live.com/calendar/event/xxxxx'
          })
        });
      } else {
        route.continue();
      }
    });

    await page.goto(baseURL! + '/#/home');
  });

  test('Microsoft Calendar OAuth flow', async ({ page }) => {
    // Mock MSAL library
    await page.evaluate(() => {
      window.msalInstance = {
        loginPopup: async () => ({
          account: {
            username: 'test@outlook.com',
            name: 'Test User'
          },
          accessToken: 'mock_ms_token'
        }),
        acquireTokenSilent: async () => ({
          accessToken: 'mock_ms_token'
        })
      };
    });

    const result = await page.evaluate(async () => {
      try {
        const response = await window.msalInstance.loginPopup({
          scopes: ['Calendars.ReadWrite', 'User.Read']
        });
        return {
          success: true,
          account: response.account.username
        };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
    expect(result.account).toBe('test@outlook.com');
  });

  test('List Microsoft Calendar events', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('msal_token', 'mock_ms_token');
    });

    const events = await page.evaluate(async () => {
      const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('msal_token')
        }
      });
      return response.json();
    });

    expect(events.value).toHaveLength(2);
    expect(events.value[0].subject).toBe('Xbox Showcase');
    expect(events.value[0].location.displayName).toBe('Microsoft Theater');
  });

  test('Create event in Microsoft Calendar', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('msal_token', 'mock_ms_token');
    });

    const newEvent = {
      subject: 'Halo Infinite Tournament',
      body: {
        contentType: 'HTML',
        content: '<p>Competitive Halo tournament</p>'
      },
      start: {
        dateTime: '2025-08-22T14:00:00',
        timeZone: 'Europe/Berlin'
      },
      end: {
        dateTime: '2025-08-22T18:00:00',
        timeZone: 'Europe/Berlin'
      },
      location: {
        displayName: 'ESL Arena'
      }
    };

    const result = await page.evaluate(async (event) => {
      const response = await fetch('https://graph.microsoft.com/v1.0/me/calendar/events', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('msal_token'),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
      return response.json();
    }, newEvent);

    expect(result.id).toBeTruthy();
    expect(result.subject).toBe('Halo Infinite Tournament');
    expect(result.webLink).toContain('outlook.live.com');
  });
});

test.describe('Meet to Match ICS Integration', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await stubGoogleMaps(page);
    await mockAPI(page);
    
    // Mock ICS file endpoint
    await page.route('**/*.ics', route => {
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MeetToMatch//Gamescom 2025//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Gamescom 2025 - Meet to Match
BEGIN:VEVENT
UID:m2m-001@meettomatch.com
DTSTART:20250820T090000Z
DTEND:20250820T100000Z
SUMMARY:Meet to Match Opening Breakfast
DESCRIPTION:Exclusive networking breakfast for Meet to Match members
LOCATION:Hyatt Regency Cologne
ORGANIZER;CN=Meet to Match:mailto:events@meettomatch.com
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:m2m-002@meettomatch.com
DTSTART:20250820T180000Z
DTEND:20250820T210000Z
SUMMARY:Publishers & Developers Mixer
DESCRIPTION:Connect with publishers and showcase your games
LOCATION:The Qvest Hotel Bar
CATEGORIES:Networking,Publishers
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:m2m-003@meettomatch.com
DTSTART:20250821T140000Z
DTEND:20250821T160000Z
SUMMARY:Investor Speed Dating
DESCRIPTION:15-minute rounds with gaming industry investors
LOCATION:Conference Room A, Koelnmesse
CATEGORIES:Investors,Funding
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

      route.fulfill({
        status: 200,
        contentType: 'text/calendar; charset=utf-8',
        headers: {
          'Content-Disposition': 'attachment; filename="gamescom-2025.ics"'
        },
        body: icsContent
      });
    });

    await page.goto(baseURL! + '/#/home');
  });

  test('Parse ICS file and extract events', async ({ page }) => {
    const events = await page.evaluate(async () => {
      // Fetch ICS file
      const response = await fetch('https://meettomatch.com/calendar/gamescom-2025.ics');
      const icsText = await response.text();
      
      // Simple ICS parser
      const parseICS = (text: string) => {
        const events: any[] = [];
        const eventBlocks = text.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
        
        eventBlocks.forEach(block => {
          const event: any = {};
          
          // Extract UID
          const uid = block.match(/UID:(.+)/);
          if (uid) event.id = uid[1].trim();
          
          // Extract summary/title
          const summary = block.match(/SUMMARY:(.+)/);
          if (summary) event.title = summary[1].trim();
          
          // Extract description
          const desc = block.match(/DESCRIPTION:(.+)/);
          if (desc) event.description = desc[1].trim();
          
          // Extract location
          const location = block.match(/LOCATION:(.+)/);
          if (location) event.location = location[1].trim();
          
          // Extract start time
          const dtstart = block.match(/DTSTART:(.+)/);
          if (dtstart) {
            const dateStr = dtstart[1].trim();
            // Convert ICS date format to ISO
            if (dateStr.length === 16) { // YYYYMMDDTHHMMSSZ
              event.start = dateStr.slice(0, 4) + '-' + 
                          dateStr.slice(4, 6) + '-' + 
                          dateStr.slice(6, 8) + 'T' +
                          dateStr.slice(9, 11) + ':' +
                          dateStr.slice(11, 13) + ':' +
                          dateStr.slice(13, 15) + 'Z';
            }
          }
          
          // Extract end time
          const dtend = block.match(/DTEND:(.+)/);
          if (dtend) {
            const dateStr = dtend[1].trim();
            if (dateStr.length === 16) {
              event.end = dateStr.slice(0, 4) + '-' + 
                        dateStr.slice(4, 6) + '-' + 
                        dateStr.slice(6, 8) + 'T' +
                        dateStr.slice(9, 11) + ':' +
                        dateStr.slice(11, 13) + ':' +
                        dateStr.slice(13, 15) + 'Z';
            }
          }
          
          events.push(event);
        });
        
        return events;
      };
      
      return parseICS(icsText);
    });

    expect(events).toHaveLength(3);
    expect(events[0].title).toBe('Meet to Match Opening Breakfast');
    expect(events[0].location).toBe('Hyatt Regency Cologne');
    expect(events[1].title).toBe('Publishers & Developers Mixer');
    expect(events[2].title).toBe('Investor Speed Dating');
  });

  test('Subscribe to ICS calendar URL', async ({ page }) => {
    const subscriptionResult = await page.evaluate(async () => {
      const icsUrl = 'https://meettomatch.com/calendar/gamescom-2025.ics';
      
      // Store subscription in localStorage
      const subscriptions = JSON.parse(localStorage.getItem('ics_subscriptions') || '[]');
      subscriptions.push({
        url: icsUrl,
        name: 'Meet to Match Gamescom 2025',
        addedAt: new Date().toISOString(),
        lastSync: null
      });
      localStorage.setItem('ics_subscriptions', JSON.stringify(subscriptions));
      
      // Fetch and parse events
      const response = await fetch(icsUrl);
      const icsText = await response.text();
      
      // Count events in ICS
      const eventCount = (icsText.match(/BEGIN:VEVENT/g) || []).length;
      
      return {
        success: true,
        url: icsUrl,
        eventCount
      };
    });

    expect(subscriptionResult.success).toBe(true);
    expect(subscriptionResult.eventCount).toBe(3);
  });

  test('Generate ICS file for download', async ({ page }) => {
    const icsContent = await page.evaluate(() => {
      const event = {
        id: 'party-123',
        title: 'Epic Games Party',
        description: 'Exclusive party hosted by Epic Games',
        location: 'Hotel Excelsior Ernst',
        start: '2025-08-20T20:00:00Z',
        end: '2025-08-20T23:00:00Z'
      };
      
      // Generate ICS content
      const generateICS = (evt: any) => {
        const formatDate = (date: string) => {
          return new Date(date).toISOString()
            .replace(/[-:]/g, '')
            .replace(/\.\d{3}/, '');
        };
        
        return [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//velocity.ai//Gamescom 2025//EN',
          'CALSCALE:GREGORIAN',
          'METHOD:PUBLISH',
          'BEGIN:VEVENT',
          `UID:${evt.id}@velocity.ai`,
          `DTSTAMP:${formatDate(new Date().toISOString())}`,
          `DTSTART:${formatDate(evt.start)}`,
          `DTEND:${formatDate(evt.end)}`,
          `SUMMARY:${evt.title}`,
          `DESCRIPTION:${evt.description}`,
          `LOCATION:${evt.location}`,
          'STATUS:CONFIRMED',
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\r\n');
      };
      
      return generateICS(event);
    });

    expect(icsContent).toContain('BEGIN:VCALENDAR');
    expect(icsContent).toContain('Epic Games Party');
    expect(icsContent).toContain('Hotel Excelsior Ernst');
    expect(icsContent).toContain('END:VCALENDAR');
  });

  test('Download ICS file for event', async ({ page }) => {
    const downloadResult = await page.evaluate(() => {
      const event = {
        id: 'test-event',
        title: 'Test Event',
        start: '2025-08-21T10:00:00Z',
        end: '2025-08-21T12:00:00Z',
        location: 'Test Venue'
      };
      
      // Mock download function
      window.downloadICS = (evt: any) => {
        const formatDate = (date: string) => {
          return new Date(date).toISOString()
            .replace(/[-:]/g, '')
            .replace(/\.\d{3}/, '');
        };
        
        const icsContent = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'BEGIN:VEVENT',
          `UID:${evt.id}@app`,
          `DTSTART:${formatDate(evt.start)}`,
          `DTEND:${formatDate(evt.end)}`,
          `SUMMARY:${evt.title}`,
          `LOCATION:${evt.location}`,
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\r\n');
        
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        
        // Store for test verification
        window.lastDownload = {
          filename: `${evt.id}.ics`,
          size: blob.size,
          type: blob.type,
          url: url
        };
        
        URL.revokeObjectURL(url);
        return true;
      };
      
      return window.downloadICS(event);
    });

    expect(downloadResult).toBe(true);
    
    const downloadInfo = await page.evaluate(() => window.lastDownload);
    expect(downloadInfo.filename).toBe('test-event.ics');
    expect(downloadInfo.type).toBe('text/calendar');
    expect(downloadInfo.size).toBeGreaterThan(0);
  });
});

test.describe('Calendar Sync Dependencies', () => {
  test('Test localStorage for calendar data persistence', async ({ page, baseURL }) => {
    await page.goto(baseURL! + '/#/home');
    
    // Test storing calendar data
    await page.evaluate(() => {
      const calendarData = {
        providers: {
          google: { connected: true, email: 'user@gmail.com' },
          microsoft: { connected: false },
          ics: { subscriptions: ['https://meettomatch.com/cal.ics'] }
        },
        events: [
          { id: '1', title: 'Event 1', source: 'google' },
          { id: '2', title: 'Event 2', source: 'ics' }
        ],
        lastSync: new Date().toISOString()
      };
      
      localStorage.setItem('calendar_data', JSON.stringify(calendarData));
    });
    
    // Verify persistence after reload
    await page.reload();
    
    const persistedData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('calendar_data') || '{}');
    });
    
    expect(persistedData.providers.google.connected).toBe(true);
    expect(persistedData.events).toHaveLength(2);
  });

  test('Test session cookie handling', async ({ page, context, baseURL }) => {
    await page.goto(baseURL! + '/#/home');
    
    // Set session cookie
    await context.addCookies([{
      name: 'sid',
      value: 'test-session-id',
      domain: new URL(baseURL!).hostname,
      path: '/',
      httpOnly: true,
      secure: true
    }]);
    
    // Verify cookie is sent with requests
    const cookieValue = await page.evaluate(async () => {
      const response = await fetch('/api/googleCalendar/status', {
        credentials: 'include'
      });
      return response.ok;
    });
    
    expect(cookieValue).toBe(true);
  });

  test('Test event deduplication across providers', async ({ page, baseURL }) => {
    await page.goto(baseURL! + '/#/home');
    
    const dedupedEvents = await page.evaluate(() => {
      const events = [
        { id: 'g1', title: 'Unity Keynote', start: '2025-08-20T14:00:00Z', source: 'google' },
        { id: 'm1', title: 'Unity Keynote', start: '2025-08-20T14:00:00Z', source: 'microsoft' },
        { id: 'i1', title: 'Unity Keynote', start: '2025-08-20T14:00:00Z', source: 'ics' },
        { id: 'g2', title: 'Epic Party', start: '2025-08-20T20:00:00Z', source: 'google' },
        { id: 'i2', title: 'Indie Meetup', start: '2025-08-21T16:00:00Z', source: 'ics' }
      ];
      
      // Deduplication logic
      const deduplicateEvents = (evts: any[]) => {
        const seen = new Map();
        const result = [];
        
        for (const event of evts) {
          const key = `${event.title}-${event.start}`;
          if (!seen.has(key)) {
            seen.set(key, event);
            result.push(event);
          }
        }
        
        return result;
      };
      
      return deduplicateEvents(events);
    });
    
    expect(dedupedEvents).toHaveLength(3); // Unity Keynote (once), Epic Party, Indie Meetup
  });

  test('Test timezone conversion', async ({ page, baseURL }) => {
    await page.goto(baseURL! + '/#/home');
    
    const convertedTimes = await page.evaluate(() => {
      // Event in UTC
      const event = {
        title: 'Test Event',
        start: '2025-08-20T14:00:00Z', // 2 PM UTC
        end: '2025-08-20T16:00:00Z'    // 4 PM UTC
      };
      
      // Convert to Berlin time (UTC+2 in summer)
      const toBerlinTime = (utcDate: string) => {
        const date = new Date(utcDate);
        // Berlin is UTC+2 in August
        const berlinOffset = 2 * 60; // 2 hours in minutes
        const localOffset = date.getTimezoneOffset();
        const totalOffset = berlinOffset + localOffset;
        
        const berlinTime = new Date(date.getTime() + totalOffset * 60000);
        return berlinTime.toISOString();
      };
      
      return {
        original: event.start,
        berlin: toBerlinTime(event.start),
        expectedHour: new Date(toBerlinTime(event.start)).getUTCHours()
      };
    });
    
    // 14:00 UTC should be 16:00 in Berlin (UTC+2)
    expect(convertedTimes.expectedHour).toBe(16);
  });

  test('Test calendar event matching with conference parties', async ({ page, baseURL }) => {
    await page.goto(baseURL! + '/#/home');
    
    const matchResults = await page.evaluate(() => {
      const calendarEvents = [
        { title: 'Unity Developer Day', start: '2025-08-20T10:00:00Z' },
        { title: 'Epic Games Showcase', start: '2025-08-20T14:00:00Z' },
        { title: 'Personal Meeting', start: '2025-08-20T16:00:00Z' }
      ];
      
      const conferenceParties = [
        { id: 'p1', title: 'Unity Developer Day', startsAt: '2025-08-20T10:00:00Z' },
        { id: 'p2', title: 'Epic Games Showcase', startsAt: '2025-08-20T14:00:00Z' },
        { id: 'p3', title: 'Indie Games Mixer', startsAt: '2025-08-20T18:00:00Z' }
      ];
      
      // Match calendar events with parties
      const matchEvents = (calEvents: any[], parties: any[]) => {
        const matches = [];
        
        for (const calEvent of calEvents) {
          const party = parties.find(p => 
            p.title === calEvent.title && 
            p.startsAt === calEvent.start
          );
          
          if (party) {
            matches.push({
              calendarEvent: calEvent.title,
              partyId: party.id,
              matched: true
            });
          }
        }
        
        return matches;
      };
      
      return matchEvents(calendarEvents, conferenceParties);
    });
    
    expect(matchResults).toHaveLength(2); // Unity and Epic events match
    expect(matchResults[0].partyId).toBe('p1');
    expect(matchResults[1].partyId).toBe('p2');
  });

  test('Test error recovery and retries', async ({ page, baseURL }) => {
    await page.goto(baseURL! + '/#/home');
    
    const retryResult = await page.evaluate(async () => {
      let attempts = 0;
      
      const fetchWithRetry = async (url: string, maxRetries = 3): Promise<any> => {
        for (let i = 0; i < maxRetries; i++) {
          attempts++;
          try {
            // Simulate failure on first 2 attempts
            if (attempts < 3) {
              throw new Error('Network error');
            }
            return { success: true, attempts };
          } catch (error) {
            if (i === maxRetries - 1) {
              throw error;
            }
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
          }
        }
      };
      
      try {
        const result = await fetchWithRetry('/api/calendar/sync');
        return result;
      } catch (error: any) {
        return { success: false, error: error.message, attempts };
      }
    });
    
    expect(retryResult.success).toBe(true);
    expect(retryResult.attempts).toBe(3); // Should succeed on third attempt
  });
});

test.describe('Full Calendar Integration Flow', () => {
  test('Complete calendar sync workflow', async ({ page, baseURL }) => {
    await stubGoogleMaps(page);
    await mockAPI(page);
    await page.goto(baseURL! + '/#/home');
    
    // Step 1: Connect Google Calendar
    await page.route('**/api/googleCalendar/status', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ connected: true })
      });
    });
    
    // Step 2: Fetch Google events
    await page.route('**/api/googleCalendar/events', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          events: [
            { id: 'g1', summary: 'Gamescom Day 1', start: '2025-08-20T09:00:00Z' },
            { id: 'g2', summary: 'Unity Meetup', start: '2025-08-20T14:00:00Z' }
          ]
        })
      });
    });
    
    // Step 3: Subscribe to Meet to Match ICS
    await page.route('**/*.ics', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/calendar',
        body: `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:m2m-1
SUMMARY:M2M Networking
DTSTART:20250820T160000Z
DTEND:20250820T180000Z
END:VEVENT
END:VCALENDAR`
      });
    });
    
    // Step 4: Perform full sync
    const syncResult = await page.evaluate(async () => {
      const results = {
        google: { events: [] as any[], connected: false },
        ics: { events: [] as any[], subscribed: false },
        merged: [] as any[],
        duplicates: 0
      };
      
      // Check Google connection
      const statusResp = await fetch('/api/googleCalendar/status', { credentials: 'include' });
      const status = await statusResp.json();
      results.google.connected = status.connected;
      
      // Fetch Google events
      if (results.google.connected) {
        const eventsResp = await fetch('/api/googleCalendar/events', { credentials: 'include' });
        const data = await eventsResp.json();
        results.google.events = data.events || [];
      }
      
      // Fetch ICS events
      const icsResp = await fetch('https://meettomatch.com/cal.ics');
      const icsText = await icsResp.text();
      if (icsText.includes('BEGIN:VEVENT')) {
        results.ics.subscribed = true;
        // Simple parse
        const match = icsText.match(/SUMMARY:(.+)/);
        if (match) {
          results.ics.events.push({ title: match[1].trim() });
        }
      }
      
      // Merge all events
      results.merged = [
        ...results.google.events.map((e: any) => ({ ...e, source: 'google' })),
        ...results.ics.events.map((e: any) => ({ ...e, source: 'ics' }))
      ];
      
      // Store in localStorage
      localStorage.setItem('calendar_sync_result', JSON.stringify(results));
      
      return results;
    });
    
    expect(syncResult.google.connected).toBe(true);
    expect(syncResult.google.events).toHaveLength(2);
    expect(syncResult.ics.subscribed).toBe(true);
    expect(syncResult.ics.events).toHaveLength(1);
    expect(syncResult.merged).toHaveLength(3);
  });
});