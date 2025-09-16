/**
 * Push Notification System
 * Real-time notifications for matches, gatherings, and smart opportunities
 */

export class PushNotificationSystem {
  constructor() {
    this.permission = 'default';
    this.subscription = null;
    this.fcmTokens = [];
    this.preferences = this.loadPreferences();
    this.notificationQueue = [];
    this.isInitialized = false;
    this.vapidKey = 'YOUR_VAPID_PUBLIC_KEY'; // Replace with actual key
  }
  
  /**
   * Initialize push notification system
   */
  async initialize() {
    // Check browser support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }
    
    // Check current permission
    this.permission = Notification.permission;
    
    // Register service worker if needed
    await this.registerServiceWorker();
    
    // Get existing subscription
    await this.checkExistingSubscription();
    
    // Setup message listeners
    this.setupMessageListeners();
    
    // Setup visibility listeners
    this.setupVisibilityListeners();
    
    this.isInitialized = true;
    console.log('Push notification system initialized');
    
    return true;
  }
  
  /**
   * Request permission and subscribe
   */
  async requestPermission() {
    if (this.permission === 'granted') {
      return true;
    }
    
    if (this.permission === 'denied') {
      console.warn('Push notifications denied by user');
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        await this.subscribe();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to request permission:', error);
      return false;
    }
  }
  
  /**
   * Subscribe to push notifications
   */
  async subscribe() {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe with VAPID key
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidKey)
      });
      
      this.subscription = subscription;
      
      // Save subscription to server
      await this.saveSubscription(subscription);
      
      console.log('Push subscription successful');
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      throw error;
    }
  }
  
  /**
   * Register service worker
   */
  async registerServiceWorker() {
    if (!navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered:', registration);
    }
  }
  
  /**
   * Check for existing subscription
   */
  async checkExistingSubscription() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      this.subscription = subscription;
      console.log('Existing subscription found');
    }
    
    return subscription;
  }
  
  /**
   * Setup message listeners
   */
  setupMessageListeners() {
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event.data);
    });
    
    // Listen for notification clicks
    if ('Notification' in window) {
      document.addEventListener('notificationclick', (event) => {
        this.handleNotificationClick(event);
      });
    }
  }
  
  /**
   * Setup visibility listeners for smart timing
   */
  setupVisibilityListeners() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.notificationQueue.length > 0) {
        this.processNotificationQueue();
      }
    });
  }
  
  /**
   * Send match notification
   */
  async sendMatchNotification(match) {
    const notification = {
      title: '🎯 Perfect Match Found!',
      body: `${match.user.name} (${match.score.overall}% match) wants to connect`,
      icon: '/images/icon-192x192.png',
      badge: '/images/badge-72x72.png',
      tag: `match-${match.id}`,
      data: {
        type: 'new_match',
        matchId: match.id,
        userId: match.user.id,
        score: match.score.overall
      },
      actions: [
        {
          action: 'view_match',
          title: 'View Match',
          icon: '/images/icons/user.png'
        },
        {
          action: 'send_message',
          title: 'Send Message',
          icon: '/images/icons/message.png'
        }
      ],
      requireInteraction: match.score.overall > 90 // High matches require interaction
    };
    
    return this.showNotification(notification);
  }
  
  /**
   * Send gathering invitation notification
   */
  async sendGatheringInvitation(invitation) {
    const notification = {
      title: `🎪 You're invited to "${invitation.gatheringTitle}"`,
      body: invitation.personalizedMessage,
      icon: '/images/icon-192x192.png',
      badge: '/images/badge-72x72.png',
      tag: `gathering-${invitation.gatheringId}`,
      data: {
        type: 'gathering_invitation',
        gatheringId: invitation.gatheringId,
        invitationId: invitation.id
      },
      actions: [
        {
          action: 'accept_invitation',
          title: 'Accept',
          icon: '/images/icons/check.png'
        },
        {
          action: 'decline_invitation',
          title: 'Decline',
          icon: '/images/icons/x.png'
        }
      ],
      requireInteraction: true,
      vibrate: [200, 100, 200]
    };
    
    // Add to queue if auto-accept threshold met
    if (invitation.autoAccept) {
      this.notificationQueue.push({
        ...notification,
        priority: 'high',
        autoAction: 'accept_invitation'
      });
    }
    
    return this.showNotification(notification);
  }
  
  /**
   * Send smart notification based on opportunity
   */
  async sendSmartNotification(opportunity) {
    let notification;
    
    switch (opportunity.type) {
      case 'high_value_message':
        notification = {
          title: '💎 Important Message',
          body: `${opportunity.data.senderName} sent you a message`,
          icon: '/images/icon-192x192.png',
          tag: `message-${opportunity.data.conversationId}`,
          data: {
            type: 'message',
            conversationId: opportunity.data.conversationId
          },
          priority: 'high'
        };
        break;
        
      case 'missed_opportunity':
        notification = {
          title: '⚡ Don\'t Miss Out!',
          body: opportunity.data.description,
          icon: '/images/icon-192x192.png',
          tag: `opportunity-${opportunity.data.id}`,
          data: {
            type: 'opportunity',
            opportunityId: opportunity.data.id
          }
        };
        break;
        
      case 'gathering_starting':
        notification = {
          title: '⏰ Gathering Starting Soon',
          body: `"${opportunity.data.title}" starts in ${opportunity.data.timeUntil}`,
          icon: '/images/icon-192x192.png',
          tag: `reminder-${opportunity.data.gatheringId}`,
          data: {
            type: 'gathering_reminder',
            gatheringId: opportunity.data.gatheringId
          },
          requireInteraction: true
        };
        break;
        
      case 'connection_nearby':
        notification = {
          title: '📍 Connection Nearby',
          body: `${opportunity.data.name} is at ${opportunity.data.location}`,
          icon: '/images/icon-192x192.png',
          tag: `nearby-${opportunity.data.userId}`,
          data: {
            type: 'nearby',
            userId: opportunity.data.userId,
            location: opportunity.data.location
          },
          actions: [
            {
              action: 'view_location',
              title: 'View Location',
              icon: '/images/icons/map.png'
            }
          ]
        };
        break;
        
      default:
        notification = {
          title: 'Conference Party',
          body: opportunity.data.message,
          icon: '/images/icon-192x192.png',
          tag: `generic-${Date.now()}`
        };
    }
    
    // Apply smart timing
    if (this.shouldDelayNotification(opportunity)) {
      this.queueNotification(notification);
    } else {
      await this.showNotification(notification);
    }
  }
  
  /**
   * Show notification
   */
  async showNotification(options) {
    if (this.permission !== 'granted') {
      console.warn('No permission to show notifications');
      return false;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Add timestamp
      options.timestamp = Date.now();
      
      // Add default vibration pattern
      if (!options.vibrate) {
        options.vibrate = [200];
      }
      
      // Show notification
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon,
        badge: options.badge,
        tag: options.tag,
        data: options.data,
        actions: options.actions,
        requireInteraction: options.requireInteraction,
        vibrate: options.vibrate,
        silent: options.silent,
        renotify: options.renotify
      });
      
      // Track notification
      this.trackNotification(options);
      
      return true;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return false;
    }
  }
  
  /**
   * Handle notification click
   */
  handleNotificationClick(event) {
    event.notification.close();
    
    const { action, notification } = event;
    const data = notification.data;
    
    switch (action) {
      case 'view_match':
        window.location.href = `/matches#${data.matchId}`;
        break;
        
      case 'send_message':
        window.location.href = `/messages?userId=${data.userId}`;
        break;
        
      case 'accept_invitation':
        this.acceptGatheringInvitation(data.invitationId);
        break;
        
      case 'decline_invitation':
        this.declineGatheringInvitation(data.invitationId);
        break;
        
      case 'view_location':
        window.location.href = `/map?userId=${data.userId}`;
        break;
        
      default:
        // Default action based on notification type
        this.handleDefaultAction(data);
    }
  }
  
  /**
   * Handle service worker messages
   */
  handleServiceWorkerMessage(message) {
    console.log('Message from service worker:', message);
    
    switch (message.type) {
      case 'notification_clicked':
        this.handleNotificationClick({
          action: message.action,
          notification: message.notification
        });
        break;
        
      case 'push_received':
        this.handlePushReceived(message.data);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }
  
  /**
   * Handle push received
   */
  handlePushReceived(data) {
    // Process based on push type
    if (data.type === 'new_match') {
      this.sendMatchNotification(data);
    } else if (data.type === 'gathering_invitation') {
      this.sendGatheringInvitation(data);
    }
  }
  
  /**
   * Smart notification timing
   */
  shouldDelayNotification(opportunity) {
    // Don't delay high priority
    if (opportunity.priority === 'high') {
      return false;
    }
    
    // Check user activity
    const lastActivity = this.getLastActivity();
    const timeSinceActivity = Date.now() - lastActivity;
    
    // If user was recently active, don't delay
    if (timeSinceActivity < 5 * 60 * 1000) { // 5 minutes
      return false;
    }
    
    // Check notification fatigue
    const recentNotifications = this.getRecentNotificationCount();
    if (recentNotifications > 5) {
      return true; // Delay to prevent fatigue
    }
    
    // Check time of day
    const hour = new Date().getHours();
    if (hour < 9 || hour > 21) {
      return true; // Delay during quiet hours
    }
    
    return false;
  }
  
  /**
   * Queue notification for later
   */
  queueNotification(notification) {
    this.notificationQueue.push({
      ...notification,
      queuedAt: Date.now()
    });
    
    // Process queue after delay
    setTimeout(() => {
      this.processNotificationQueue();
    }, 5 * 60 * 1000); // 5 minutes
  }
  
  /**
   * Process notification queue
   */
  async processNotificationQueue() {
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      
      // Check if still relevant
      const age = Date.now() - notification.queuedAt;
      if (age < 30 * 60 * 1000) { // 30 minutes
        await this.showNotification(notification);
        
        // Add delay between notifications
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  /**
   * Find notification opportunities
   */
  async findNotificationOpportunities(userId) {
    const opportunities = [];
    
    // Check for unread messages from high-value connections
    const messages = await this.getUnreadMessages(userId);
    for (const message of messages) {
      const connectionValue = await this.calculateConnectionValue(userId, message.senderId);
      if (connectionValue > 80) {
        opportunities.push({
          type: 'high_value_message',
          priority: 'high',
          data: message
        });
      }
    }
    
    // Check for gatherings starting soon
    const upcomingGatherings = await this.getUpcomingGatherings(userId);
    for (const gathering of upcomingGatherings) {
      const timeUntil = gathering.startTime - Date.now();
      if (timeUntil < 15 * 60 * 1000 && timeUntil > 0) { // 15 minutes
        opportunities.push({
          type: 'gathering_starting',
          priority: 'medium',
          data: {
            ...gathering,
            timeUntil: this.formatTimeUntil(timeUntil)
          }
        });
      }
    }
    
    // Check for nearby connections
    const nearbyConnections = await this.getNearbyConnections(userId);
    for (const connection of nearbyConnections) {
      opportunities.push({
        type: 'connection_nearby',
        priority: 'low',
        data: connection
      });
    }
    
    // Check for missed opportunities
    const missedOpportunities = await this.findMissedOpportunities(userId);
    opportunities.push(...missedOpportunities);
    
    return opportunities;
  }
  
  /**
   * Calculate connection value
   */
  async calculateConnectionValue(userId, otherUserId) {
    // Get interaction history
    const interactions = await this.getInteractionHistory(userId, otherUserId);
    
    let value = 50; // Base value
    
    // Increase value based on interactions
    value += interactions.messages * 2;
    value += interactions.meetings * 10;
    value += interactions.collaborations * 20;
    
    // Increase value based on profile match
    const profileMatch = await this.getProfileMatch(userId, otherUserId);
    value += profileMatch * 0.3;
    
    // Cap at 100
    return Math.min(100, value);
  }
  
  /**
   * Find missed opportunities
   */
  async findMissedOpportunities(userId) {
    const opportunities = [];
    
    // Get user preferences
    const preferences = await this.getUserPreferences(userId);
    
    // Check for matches not responded to
    const pendingMatches = await this.getPendingMatches(userId);
    for (const match of pendingMatches) {
      if (match.score > 85 && match.ageHours > 12) {
        opportunities.push({
          type: 'missed_opportunity',
          priority: 'medium',
          data: {
            id: match.id,
            description: `High compatibility match with ${match.name} expires soon!`
          }
        });
      }
    }
    
    // Check for gatherings that match interests
    const relevantGatherings = await this.getRelevantGatherings(userId, preferences);
    for (const gathering of relevantGatherings) {
      if (gathering.spotsLeft < 3) {
        opportunities.push({
          type: 'missed_opportunity',
          priority: 'low',
          data: {
            id: gathering.id,
            description: `Only ${gathering.spotsLeft} spots left in "${gathering.title}"`
          }
        });
      }
    }
    
    return opportunities;
  }
  
  /**
   * Accept gathering invitation
   */
  async acceptGatheringInvitation(invitationId) {
    try {
      // Send acceptance to server
      const response = await fetch(`/api/gatherings/invitations/${invitationId}/accept`, {
        method: 'POST'
      });
      
      if (response.ok) {
        this.showNotification({
          title: '✅ Invitation Accepted',
          body: 'You\'ve been added to the gathering',
          tag: 'invitation-accepted'
        });
      }
    } catch (error) {
      console.error('Failed to accept invitation:', error);
    }
  }
  
  /**
   * Decline gathering invitation
   */
  async declineGatheringInvitation(invitationId) {
    try {
      const response = await fetch(`/api/gatherings/invitations/${invitationId}/decline`, {
        method: 'POST'
      });
      
      if (response.ok) {
        console.log('Invitation declined');
      }
    } catch (error) {
      console.error('Failed to decline invitation:', error);
    }
  }
  
  /**
   * Save subscription to server
   */
  async saveSubscription(subscription) {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          preferences: this.preferences
        })
      });
      
      if (response.ok) {
        console.log('Subscription saved to server');
      }
    } catch (error) {
      console.error('Failed to save subscription:', error);
    }
  }
  
  /**
   * Update notification preferences
   */
  updatePreferences(preferences) {
    this.preferences = {
      ...this.preferences,
      ...preferences
    };
    
    localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
    
    // Update on server
    this.savePreferences();
  }
  
  /**
   * Save preferences to server
   */
  async savePreferences() {
    try {
      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.preferences)
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }
  
  /**
   * Load preferences
   */
  loadPreferences() {
    const stored = localStorage.getItem('notification_preferences');
    return stored ? JSON.parse(stored) : {
      matches: true,
      gatherings: true,
      messages: true,
      opportunities: true,
      smart: true,
      quietHours: {
        enabled: true,
        start: 22,
        end: 9
      }
    };
  }
  
  /**
   * Track notification
   */
  trackNotification(notification) {
    const history = JSON.parse(localStorage.getItem('notification_history') || '[]');
    history.push({
      ...notification,
      shownAt: Date.now()
    });
    
    // Keep last 100
    if (history.length > 100) {
      history.shift();
    }
    
    localStorage.setItem('notification_history', JSON.stringify(history));
  }
  
  /**
   * Get recent notification count
   */
  getRecentNotificationCount() {
    const history = JSON.parse(localStorage.getItem('notification_history') || '[]');
    const recentTime = Date.now() - 60 * 60 * 1000; // 1 hour
    
    return history.filter(n => n.shownAt > recentTime).length;
  }
  
  /**
   * Get last activity time
   */
  getLastActivity() {
    return parseInt(localStorage.getItem('last_activity') || '0');
  }
  
  /**
   * Update last activity
   */
  updateLastActivity() {
    localStorage.setItem('last_activity', Date.now().toString());
  }
  
  /**
   * Format time until
   */
  formatTimeUntil(ms) {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  /**
   * Convert VAPID key
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
  
  /**
   * Mock data helpers (would connect to real API)
   */
  
  async getUnreadMessages(userId) {
    // Mock unread messages
    return [
      {
        id: 'msg1',
        senderId: 'user_002',
        senderName: 'Sarah Chen',
        conversationId: 'conv1',
        text: 'Looking forward to our coffee chat!',
        timestamp: Date.now() - 10 * 60 * 1000
      }
    ];
  }
  
  async getUpcomingGatherings(userId) {
    // Mock upcoming gatherings
    return [
      {
        id: 'gathering1',
        title: 'Coffee Chat',
        startTime: Date.now() + 10 * 60 * 1000,
        location: 'Conference Lobby'
      }
    ];
  }
  
  async getNearbyConnections(userId) {
    // Mock nearby connections
    return [];
  }
  
  async getInteractionHistory(userId, otherUserId) {
    // Mock interaction history
    return {
      messages: 5,
      meetings: 1,
      collaborations: 0
    };
  }
  
  async getProfileMatch(userId, otherUserId) {
    // Mock profile match score
    return 75;
  }
  
  async getPendingMatches(userId) {
    // Mock pending matches
    return [];
  }
  
  async getRelevantGatherings(userId, preferences) {
    // Mock relevant gatherings
    return [];
  }
  
  async getUserPreferences(userId) {
    return this.preferences;
  }
  
  handleDefaultAction(data) {
    switch (data.type) {
      case 'new_match':
        window.location.href = `/matches#${data.matchId}`;
        break;
      case 'gathering_invitation':
        window.location.href = `/gatherings#${data.gatheringId}`;
        break;
      case 'message':
        window.location.href = `/messages#${data.conversationId}`;
        break;
      default:
        window.location.href = '/';
    }
  }
}

// Export singleton instance
export const pushNotifications = new PushNotificationSystem();