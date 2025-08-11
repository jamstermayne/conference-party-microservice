// Gamescom Calendar Sync Application
class GamescomCalendarApp {
    constructor() {
        this.events = [];
        this.filteredEvents = [];
        this.selectedEvents = new Set();
        this.currentView = 'list';
        this.currentWeek = new Date('2025-08-21'); // Gamescom week
        this.filters = {
            category: 'all',
            day: 'all'
        };
        
        // Export settings
        this.exportSettings = {
            format: 'ics',
            includeReminders: true,
            includeLocation: true,
            includeDescription: true,
            includeHost: true,
            calendarName: 'Gamescom 2025 Events'
        };
    }

    async init() {
        console.log('📅 Initializing Gamescom Calendar v2.0...');
        
        try {
            // Initialize theme
            this.initTheme();
            
            // Load events
            await this.loadEvents();
            
            // Setup UI
            this.setupUI();
            
            // Render initial view
            this.renderCurrentView();
            
            // Update stats
            this.updateStats();
            
            console.log(`✅ Calendar loaded with ${this.events.length} events`);
            
        } catch (error) {
            console.error('❌ Calendar initialization failed:', error);
            this.showError('Failed to load calendar events');
        }
    }

    async loadEvents() {
        try {
            this.events = await window.api.getEvents();
            this.filteredEvents = [...this.events];
        } catch (error) {
            console.error('❌ Failed to load events:', error);
            throw error;
        }
    }

    setupUI() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // View toggles
        document.getElementById('listView').addEventListener('click', () => {
            this.setView('list');
        });
        document.getElementById('calendarView').addEventListener('click', () => {
            this.setView('calendar');
        });
        document.getElementById('timelineView').addEventListener('click', () => {
            this.setView('timeline');
        });

        // Filters
        document.getElementById('calendarCategoryFilter').addEventListener('change', (e) => {
            this.setFilter('category', e.target.value);
        });
        document.getElementById('dayFilter').addEventListener('change', (e) => {
            this.setFilter('day', e.target.value);
        });

        // Selection actions
        document.getElementById('selectAllBtn').addEventListener('click', () => {
            this.selectAllEvents();
        });
        document.getElementById('exportSelectedBtn').addEventListener('click', () => {
            this.exportSelected();
        });

        // Quick actions
        document.getElementById('bulkExportBtn').addEventListener('click', () => {
            this.bulkExportAll();
        });

        // Calendar navigation
        document.getElementById('prevWeek').addEventListener('click', () => {
            this.navigateWeek(-1);
        });
        document.getElementById('nextWeek').addEventListener('click', () => {
            this.navigateWeek(1);
        });

        // Sync actions
        document.getElementById('refreshSyncBtn').addEventListener('click', () => {
            this.refreshSync();
        });

        // Modal controls
        this.setupModalControls();
    }

    setupModalControls() {
        // Custom export modal
        document.getElementById('closeExportModal').addEventListener('click', () => {
            this.closeModal('customExportModal');
        });
        document.getElementById('cancelExport').addEventListener('click', () => {
            this.closeModal('customExportModal');
        });
        document.getElementById('performExport').addEventListener('click', () => {
            this.performCustomExport();
        });

        // Export format change
        document.getElementById('exportFormat').addEventListener('change', (e) => {
            this.exportSettings.format = e.target.value;
        });

        // Success modal
        document.getElementById('closeSuccessModal').addEventListener('click', () => {
            this.closeModal('exportSuccessModal');
        });
    }

    setView(view) {
        this.currentView = view;
        
        // Update view buttons
        document.querySelectorAll('.view-toggle').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${view}View`).classList.add('active');
        
        // Show/hide view containers
        document.getElementById('listViewContainer').classList.toggle('hidden', view !== 'list');
        document.getElementById('calendarViewContainer').classList.toggle('hidden', view !== 'calendar');
        document.getElementById('timelineViewContainer').classList.toggle('hidden', view !== 'timeline');
        
        // Render current view
        this.renderCurrentView();
    }

    setFilter(filterType, value) {
        this.filters[filterType] = value;
        this.applyFilters();
        this.renderCurrentView();
        this.updateStats();
    }

    applyFilters() {
        let filtered = [...this.events];
        
        // Category filter
        if (this.filters.category !== 'all') {
            filtered = filtered.filter(e => 
                (e.category || e.Category || '').toLowerCase() === this.filters.category
            );
        }
        
        // Day filter
        if (this.filters.day !== 'all') {
            filtered = filtered.filter(e => 
                (e.date || e.Date) === this.filters.day
            );
        }
        
        this.filteredEvents = filtered;
    }

    renderCurrentView() {
        switch (this.currentView) {
            case 'list':
                this.renderListView();
                break;
            case 'calendar':
                this.renderCalendarView();
                break;
            case 'timeline':
                this.renderTimelineView();
                break;
        }
    }

    renderListView() {
        const container = document.getElementById('eventsList');
        
        if (this.filteredEvents.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 48px; margin-bottom: 16px;">📅</div>
                    <h3>No events found</h3>
                    <p>Try adjusting your filters to see more events.</p>
                </div>
            `;
            return;
        }

        // Group events by date
        const groupedEvents = this.groupEventsByDate(this.filteredEvents);
        
        let html = '';
        Object.keys(groupedEvents).sort().forEach(date => {
            const events = groupedEvents[date];
            html += `
                <div class="date-group">
                    <div class="date-header">
                        <h3>${this.formatDateHeader(date)}</h3>
                        <span class="event-count">${events.length} events</span>
                    </div>
                    <div class="date-events">
                        ${events.map(event => this.renderCalendarEventCard(event)).join('')}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    renderCalendarView() {
        const container = document.getElementById('calendarGrid');
        const weekDays = this.getWeekDays();
        
        // Update week header
        document.getElementById('currentWeek').textContent = `${this.formatWeekRange()} - Gamescom 2025`;
        
        let html = `
            <div class="calendar-days-header">
                ${weekDays.map(day => `
                    <div class="calendar-day-header">
                        <div class="day-name">${day.name}</div>
                        <div class="day-date">${day.date}</div>
                    </div>
                `).join('')}
            </div>
            <div class="calendar-days-grid">
                ${weekDays.map(day => this.renderCalendarDay(day)).join('')}
            </div>
        `;
        
        container.innerHTML = html;
    }

    renderTimelineView() {
        const container = document.getElementById('timeline');
        
        // Sort events by date and time
        const sortedEvents = [...this.filteredEvents].sort((a, b) => {
            const dateA = new Date(`${a.date || a.Date} ${a.startTime || a['Start Time']}`);
            const dateB = new Date(`${b.date || b.Date} ${b.startTime || b['Start Time']}`);
            return dateA - dateB;
        });
        
        let html = '';
        let currentDate = '';
        
        sortedEvents.forEach(event => {
            const eventDate = event.date || event.Date;
            
            if (eventDate !== currentDate) {
                currentDate = eventDate;
                html += `
                    <div class="timeline-date-marker">
                        <div class="timeline-date">${this.formatDateHeader(eventDate)}</div>
                    </div>
                `;
            }
            
            html += this.renderTimelineEvent(event);
        });
        
        container.innerHTML = html || '<div class="empty-timeline">No events to display in timeline.</div>';
    }

    renderCalendarEventCard(event) {
        const eventName = event.name || event['Event Name'];
        const eventTime = event.startTime || event['Start Time'];
        const eventVenue = event.venue || event.Address;
        const eventHosts = event.hosts || event.Hosts || event.creator;
        const isUGC = event.isUGC || event.collection === 'ugc-events';
        const isSelected = this.selectedEvents.has(event.id);

        return `
            <div class="calendar-event-card ${isSelected ? 'selected' : ''}" data-event-id="${event.id}">
                <div class="event-card-header">
                    <div class="event-checkbox">
                        <input type="checkbox" id="event-${event.id}" ${isSelected ? 'checked' : ''} 
                               onchange="calendarApp.toggleEventSelection('${event.id}')">
                        <label for="event-${event.id}"></label>
                    </div>
                    <div class="event-card-info">
                        <h4 class="event-card-title">${eventName}</h4>
                        ${isUGC ? '<span class="ugc-badge">👥 Community</span>' : ''}
                    </div>
                </div>
                
                <div class="event-card-meta">
                    <div class="meta-item">
                        <span class="meta-icon">🕐</span>
                        <span>${eventTime}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-icon">📍</span>
                        <span>${this.truncateText(eventVenue, 30)}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-icon">👤</span>
                        <span>${eventHosts}</span>
                    </div>
                </div>
                
                <div class="event-card-actions">
                    <button onclick="calendarApp.addSingleToCalendar('${event.id}')" class="btn-secondary btn-small">
                        📅 Add to Calendar
                    </button>
                    <button onclick="calendarApp.viewEventDetails('${event.id}')" class="btn-secondary btn-small">
                        👁️ Details
                    </button>
                </div>
            </div>
        `;
    }

    renderCalendarDay(day) {
        const dayEvents = this.filteredEvents.filter(event => 
            (event.date || event.Date) === day.dateStr
        );
        
        return `
            <div class="calendar-day" data-date="${day.dateStr}">
                ${dayEvents.map(event => `
                    <div class="calendar-day-event ${this.selectedEvents.has(event.id) ? 'selected' : ''}" 
                         data-event-id="${event.id}" 
                         onclick="calendarApp.toggleEventSelection('${event.id}')">
                        <div class="day-event-time">${event.startTime || event['Start Time']}</div>
                        <div class="day-event-name">${this.truncateText(event.name || event['Event Name'], 25)}</div>
                        ${event.isUGC ? '<div class="day-event-badge">👥</div>' : ''}
                    </div>
                `).join('')}
                ${dayEvents.length === 0 ? '<div class="no-events">No events</div>' : ''}
            </div>
        `;
    }

    renderTimelineEvent(event) {
        const eventName = event.name || event['Event Name'];
        const eventTime = event.startTime || event['Start Time'];
        const eventVenue = event.venue || event.Address;
        const isSelected = this.selectedEvents.has(event.id);

        return `
            <div class="timeline-event ${isSelected ? 'selected' : ''}" data-event-id="${event.id}">
                <div class="timeline-time">${eventTime}</div>
                <div class="timeline-content">
                    <div class="timeline-event-header">
                        <input type="checkbox" ${isSelected ? 'checked' : ''} 
                               onchange="calendarApp.toggleEventSelection('${event.id}')">
                        <h4>${eventName}</h4>
                    </div>
                    <div class="timeline-event-meta">
                        <span>📍 ${eventVenue}</span>
                    </div>
                </div>
            </div>
        `;
    }

    toggleEventSelection(eventId) {
        if (this.selectedEvents.has(eventId)) {
            this.selectedEvents.delete(eventId);
        } else {
            this.selectedEvents.add(eventId);
        }
        
        this.updateSelectionUI();
        this.updateStats();
    }

    selectAllEvents() {
        const allSelected = this.selectedEvents.size === this.filteredEvents.length;
        
        if (allSelected) {
            // Deselect all
            this.selectedEvents.clear();
        } else {
            // Select all filtered events
            this.filteredEvents.forEach(event => {
                this.selectedEvents.add(event.id);
            });
        }
        
        this.updateSelectionUI();
        this.updateStats();
        this.renderCurrentView();
    }

    updateSelectionUI() {
        // Update checkboxes
        document.querySelectorAll('.calendar-event-card, .calendar-day-event, .timeline-event').forEach(card => {
            const eventId = card.dataset.eventId;
            const checkbox = card.querySelector('input[type="checkbox"]');
            const isSelected = this.selectedEvents.has(eventId);
            
            if (checkbox) {
                checkbox.checked = isSelected;
            }
            card.classList.toggle('selected', isSelected);
        });
        
        // Update buttons
        const selectedCount = this.selectedEvents.size;
        document.getElementById('exportSelectedBtn').disabled = selectedCount === 0;
        document.getElementById('selectedCount').textContent = selectedCount;
        
        const selectAllBtn = document.getElementById('selectAllBtn');
        selectAllBtn.textContent = selectedCount === this.filteredEvents.length ? '✗ Deselect All' : '✓ Select All';
    }

    exportSelected() {
        if (this.selectedEvents.size === 0) {
            alert('Please select events to export');
            return;
        }
        
        this.customExport();
    }

    customExport() {
        this.updateModalCounts();
        this.showModal('customExportModal');
    }

    bulkExportAll() {
        // Select all events and export
        this.filteredEvents.forEach(event => {
            this.selectedEvents.add(event.id);
        });
        
        this.exportSettings.format = 'ics';
        this.performExport('all');
    }

    async performCustomExport() {
        const exportType = document.querySelector('input[name="exportType"]:checked').value;
        const format = document.getElementById('exportFormat').value;
        const calendarName = document.getElementById('calendarName').value;
        
        // Update settings
        this.exportSettings.format = format;
        this.exportSettings.calendarName = calendarName;
        this.exportSettings.includeReminders = document.getElementById('includeReminders').checked;
        this.exportSettings.includeLocation = document.getElementById('includeLocation').checked;
        this.exportSettings.includeDescription = document.getElementById('includeDescription').checked;
        this.exportSettings.includeHost = document.getElementById('includeHost').checked;
        
        this.closeModal('customExportModal');
        await this.performExport(exportType);
    }

    async performExport(exportType) {
        try {
            let eventsToExport = [];
            
            switch (exportType) {
                case 'selected':
                    eventsToExport = this.events.filter(e => this.selectedEvents.has(e.id));
                    break;
                case 'filtered':
                    eventsToExport = this.filteredEvents;
                    break;
                case 'all':
                default:
                    eventsToExport = this.events;
                    break;
            }
            
            if (eventsToExport.length === 0) {
                alert('No events to export');
                return;
            }
            
            const exportData = await this.generateExport(eventsToExport);
            
            // Handle different export formats
            switch (this.exportSettings.format) {
                case 'ics':
                    this.downloadFile(exportData, 'gamescom-2025-events.ics', 'text/calendar');
                    break;
                case 'google':
                    this.openGoogleCalendar(eventsToExport);
                    break;
                case 'outlook':
                    this.openOutlookCalendar(eventsToExport);
                    break;
                case 'json':
                    this.downloadFile(JSON.stringify(exportData, null, 2), 'gamescom-2025-events.json', 'application/json');
                    break;
            }
            
            this.showExportSuccess(eventsToExport.length);
            
        } catch (error) {
            console.error('❌ Export failed:', error);
            alert('Failed to export calendar. Please try again.');
        }
    }

    async generateExport(events) {
        if (this.exportSettings.format === 'ics') {
            return this.generateICS(events);
        } else {
            return events.map(event => this.normalizeEventData(event));
        }
    }

    generateICS(events) {
        let ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Gamescom Party Discovery//EN',
            `X-WR-CALNAME:${this.exportSettings.calendarName}`,
            'X-WR-TIMEZONE:Europe/Berlin'
        ];
        
        events.forEach(event => {
            const eventData = this.normalizeEventData(event);
            const startDateTime = this.formatICSDateTime(eventData.date, eventData.startTime);
            const endDateTime = this.formatICSDateTime(eventData.date, eventData.startTime, 2); // 2 hours duration
            
            ics.push(
                'BEGIN:VEVENT',
                `UID:${event.id}@gamescom-party-discovery.com`,
                `DTSTAMP:${this.formatICSDateTime(new Date())}`,
                `DTSTART:${startDateTime}`,
                `DTEND:${endDateTime}`,
                `SUMMARY:${eventData.name}`,
                this.exportSettings.includeLocation ? `LOCATION:${eventData.venue}` : '',
                this.exportSettings.includeDescription ? `DESCRIPTION:${eventData.description || ''}` : '',
                this.exportSettings.includeHost ? `ORGANIZER:${eventData.host}` : '',
                this.exportSettings.includeReminders ? 'BEGIN:VALARM\nACTION:DISPLAY\nDESCRIPTION:Event reminder\nTRIGGER:-PT30M\nEND:VALARM' : '',
                'END:VEVENT'
            );
        });
        
        ics.push('END:VCALENDAR');
        return ics.filter(line => line).join('\r\n');
    }

    normalizeEventData(event) {
        return {
            id: event.id,
            name: event.name || event['Event Name'],
            date: event.date || event.Date,
            startTime: event.startTime || event['Start Time'],
            venue: event.venue || event.Address,
            host: event.hosts || event.Hosts || event.creator,
            description: event.description || event.Description,
            category: event.category || event.Category,
            isUGC: event.isUGC || event.collection === 'ugc-events'
        };
    }

    formatICSDateTime(date, time, hoursToAdd = 0) {
        let dateTimeStr;
        
        if (date instanceof Date) {
            dateTimeStr = date.toISOString();
        } else {
            dateTimeStr = time ? `${date} ${time}` : date;
        }
        
        const dateTime = new Date(dateTimeStr);
        if (hoursToAdd) {
            dateTime.setHours(dateTime.getHours() + hoursToAdd);
        }
        
        return dateTime.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    openGoogleCalendar(events) {
        if (events.length === 1) {
            const event = this.normalizeEventData(events[0]);
            const url = this.generateGoogleCalendarURL(event);
            window.open(url, '_blank');
        } else {
            // For multiple events, download ICS and provide Google Calendar import instructions
            const ics = this.generateICS(events);
            this.downloadFile(ics, 'gamescom-2025-events.ics', 'text/calendar');
            alert('ICS file downloaded. Import it to Google Calendar by going to Settings > Import & Export.');
        }
    }

    generateGoogleCalendarURL(event) {
        const startDate = new Date(`${event.date} ${event.startTime}`);
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours
        
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: event.name,
            dates: `${this.formatGoogleDateTime(startDate)}/${this.formatGoogleDateTime(endDate)}`,
            location: event.venue,
            details: `${event.description || ''}\n\nHost: ${event.host}`
        });
        
        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    }

    formatGoogleDateTime(date) {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    }

    openOutlookCalendar(events) {
        // Similar to Google Calendar - single event or ICS download
        if (events.length === 1) {
            const event = this.normalizeEventData(events[0]);
            const url = this.generateOutlookURL(event);
            window.open(url, '_blank');
        } else {
            const ics = this.generateICS(events);
            this.downloadFile(ics, 'gamescom-2025-events.ics', 'text/calendar');
            alert('ICS file downloaded. Import it to Outlook.');
        }
    }

    generateOutlookURL(event) {
        const startDate = new Date(`${event.date} ${event.startTime}`);
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
        
        const params = new URLSearchParams({
            subject: event.name,
            startdt: startDate.toISOString(),
            enddt: endDate.toISOString(),
            location: event.venue,
            body: `${event.description || ''}\n\nHost: ${event.host}`
        });
        
        return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
    }

    showExportSuccess(eventCount) {
        const message = `Successfully exported ${eventCount} event${eventCount !== 1 ? 's' : ''} to your calendar!`;
        document.getElementById('successMessage').textContent = message;
        this.showModal('exportSuccessModal');
    }

    addSingleToCalendar(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        const eventData = this.normalizeEventData(event);
        const url = this.generateGoogleCalendarURL(eventData);
        window.open(url, '_blank');
    }

    exportToGoogleCalendar() {
        this.exportSettings.format = 'google';
        this.performExport('all');
    }

    exportToOutlook() {
        this.exportSettings.format = 'outlook';
        this.performExport('all');
    }

    downloadICS() {
        this.exportSettings.format = 'ics';
        this.performExport('all');
    }

    // Helper functions
    groupEventsByDate(events) {
        return events.reduce((groups, event) => {
            const date = event.date || event.Date;
            if (!groups[date]) groups[date] = [];
            groups[date].push(event);
            return groups;
        }, {});
    }

    getWeekDays() {
        const days = [];
        const startOfWeek = new Date(this.currentWeek);
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            
            days.push({
                name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                date: date.getDate(),
                dateStr: date.toISOString().split('T')[0]
            });
        }
        
        return days;
    }

    navigateWeek(direction) {
        this.currentWeek.setDate(this.currentWeek.getDate() + (direction * 7));
        if (this.currentView === 'calendar') {
            this.renderCalendarView();
        }
    }

    formatWeekRange() {
        const endOfWeek = new Date(this.currentWeek);
        endOfWeek.setDate(this.currentWeek.getDate() + 6);
        
        const startStr = this.currentWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        return `${startStr} - ${endStr}`;
    }

    formatDateHeader(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        const dayDiff = Math.floor((eventDate - currentDate) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 0) return 'Today';
        if (dayDiff === 1) return 'Tomorrow';
        if (dayDiff === -1) return 'Yesterday';
        
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
    }

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text || '';
        return text.substring(0, maxLength).trim() + '...';
    }

    updateStats() {
        document.getElementById('totalCalendarEvents').textContent = `${this.events.length}+`;
        document.getElementById('syncedEvents').textContent = this.selectedEvents.size;
        document.getElementById('totalAvailable').textContent = this.events.length;
        document.getElementById('totalSelected').textContent = this.selectedEvents.size;
    }

    updateModalCounts() {
        document.getElementById('modalSelectedCount').textContent = this.selectedEvents.size;
        document.getElementById('modalFilteredCount').textContent = this.filteredEvents.length;
        document.getElementById('modalTotalCount').textContent = this.events.length;
    }

    async refreshSync() {
        try {
            await this.loadEvents();
            this.applyFilters();
            this.renderCurrentView();
            this.updateStats();
            
            // Show feedback
            const btn = document.getElementById('refreshSyncBtn');
            const originalText = btn.textContent;
            btn.textContent = '✅ Refreshed';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
            
        } catch (error) {
            console.error('❌ Refresh failed:', error);
            alert('Failed to refresh events');
        }
    }

    viewEventDetails(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        const eventData = this.normalizeEventData(event);
        alert(`Event: ${eventData.name}\nDate: ${eventData.date}\nTime: ${eventData.startTime}\nVenue: ${eventData.venue}\nHost: ${eventData.host}`);
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }

    showError(message) {
        const container = document.getElementById('eventsList');
        container.innerHTML = `
            <div class="error-state">
                <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                <h3>Error Loading Calendar</h3>
                <p>${message}</p>
                <button onclick="calendarApp.init()" class="btn-primary">Retry</button>
            </div>
        `;
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-theme', theme);
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.innerHTML = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
    }

    toggleTheme() {
        const html = document.documentElement;
        const themeToggle = document.getElementById('themeToggle');
        const currentTheme = html.getAttribute('data-theme');
        
        if (currentTheme === 'dark') {
            html.setAttribute('data-theme', 'light');
            themeToggle.innerHTML = '🌙 Dark Mode';
            localStorage.setItem('theme', 'light');
        } else {
            html.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '☀️ Light Mode';
            localStorage.setItem('theme', 'dark');
        }
    }
}

// Initialize calendar app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.calendarApp = new GamescomCalendarApp();
    window.calendarApp.init().catch(error => {
        console.error('Failed to initialize calendar app:', error);
    });
});