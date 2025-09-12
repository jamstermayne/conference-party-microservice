/**
 * Real-time Updates System
 * WebSocket and polling-based real-time features
 */

export class RealTimeUpdates {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.heartbeatInterval = null;
    this.subscriptions = new Map();
    this.eventHandlers = new Map();
    this.isConnected = false;
    this.userId = null;
    this.pollingIntervals = new Map();
  }
  
  /**
   * Initialize real-time connection
   */
  async initialize(userId) {
    this.userId = userId;
    
    // Try WebSocket first
    const wsSupported = await this.connectWebSocket();
    
    if (!wsSupported) {
      // Fallback to polling
      console.log('WebSocket not available, using polling');
      this.setupPolling();
    }
    
    // Setup visibility change handlers
    this.setupVisibilityHandlers();
    
    // Setup online/offline handlers
    this.setupConnectivityHandlers();
    
    console.log('Real-time updates initialized');
  }
  
  /**
   * Connect to WebSocket server
   */
  async connectWebSocket() {
    try {
      // Get WebSocket URL from config
      const wsUrl = this.getWebSocketUrl();
      
      if (!wsUrl) {
        return false;
      }
      
      this.ws = new WebSocket(wsUrl);
      
      // Setup WebSocket event handlers
      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onerror = (error) => this.handleError(error);
      this.ws.onclose = () => this.handleClose();
      
      // Wait for connection
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 5000);
        
        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.handleOpen();
          resolve(true);
        };
      });
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      return false;
    }
  }
  
  /**
   * Handle WebSocket open
   */
  handleOpen() {
    console.log('WebSocket connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    // Authenticate
    this.send({
      type: 'auth',
      userId: this.userId,
      token: this.getAuthToken()
    });
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Resubscribe to all channels
    this.resubscribeAll();
    
    // Emit connected event
    this.emit('connected');
  }
  
  /**
   * Handle WebSocket message
   */
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      console.log('WebSocket message:', message);
      
      // Handle different message types
      switch (message.type) {
        case 'ping':
          this.send({ type: 'pong' });
          break;
          
        case 'match_update':
          this.handleMatchUpdate(message.data);
          break;
          
        case 'gathering_update':
          this.handleGatheringUpdate(message.data);
          break;
          
        case 'message':
          this.handleNewMessage(message.data);
          break;
          
        case 'invitation':
          this.handleInvitation(message.data);
          break;
          
        case 'notification':
          this.handleNotification(message.data);
          break;
          
        case 'presence':
          this.handlePresenceUpdate(message.data);
          break;
          
        default:
          this.emit(message.type, message.data);
      }
    } catch (error) {
      console.error('Failed to handle message:', error);
    }
  }
  
  /**
   * Handle WebSocket error
   */
  handleError(error) {
    console.error('WebSocket error:', error);
    this.emit('error', error);
  }
  
  /**
   * Handle WebSocket close
   */
  handleClose() {
    console.log('WebSocket disconnected');
    this.isConnected = false;
    
    // Stop heartbeat
    this.stopHeartbeat();
    
    // Emit disconnected event
    this.emit('disconnected');
    
    // Attempt reconnection
    this.reconnect();
  }
  
  /**
   * Reconnect WebSocket
   */
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached, switching to polling');
      this.setupPolling();
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connectWebSocket();
    }, delay);
  }
  
  /**
   * Send WebSocket message
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }
  
  /**
   * Start heartbeat
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000); // 30 seconds
  }
  
  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  /**
   * Setup polling fallback
   */
  setupPolling() {
    // Poll for different data types at different intervals
    this.setupPollingFor('matches', 30000); // 30 seconds
    this.setupPollingFor('gatherings', 20000); // 20 seconds
    this.setupPollingFor('messages', 10000); // 10 seconds
    this.setupPollingFor('notifications', 60000); // 1 minute
  }
  
  /**
   * Setup polling for specific data type
   */
  setupPollingFor(dataType, interval) {
    // Clear existing interval
    if (this.pollingIntervals.has(dataType)) {
      clearInterval(this.pollingIntervals.get(dataType));
    }
    
    // Start new interval
    const intervalId = setInterval(() => {
      this.pollForUpdates(dataType);
    }, interval);
    
    this.pollingIntervals.set(dataType, intervalId);
    
    // Initial poll
    this.pollForUpdates(dataType);
  }
  
  /**
   * Poll for updates
   */
  async pollForUpdates(dataType) {
    try {
      const lastUpdate = this.getLastUpdateTime(dataType);
      
      const response = await fetch(`/api/updates/${dataType}`, {
        headers: {
          'X-Last-Update': lastUpdate,
          'X-User-ID': this.userId
        }
      });
      
      if (!response.ok) return;
      
      const updates = await response.json();
      
      if (updates && updates.length > 0) {
        this.processUpdates(dataType, updates);
        this.setLastUpdateTime(dataType, Date.now());
      }
    } catch (error) {
      console.error(`Failed to poll ${dataType}:`, error);
    }
  }
  
  /**
   * Process polled updates
   */
  processUpdates(dataType, updates) {
    switch (dataType) {
      case 'matches':
        updates.forEach(update => this.handleMatchUpdate(update));
        break;
      case 'gatherings':
        updates.forEach(update => this.handleGatheringUpdate(update));
        break;
      case 'messages':
        updates.forEach(update => this.handleNewMessage(update));
        break;
      case 'notifications':
        updates.forEach(update => this.handleNotification(update));
        break;
    }
  }
  
  /**
   * Subscribe to updates
   */
  subscribe(channel, callback) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    
    this.subscriptions.get(channel).add(callback);
    
    // Send subscription to server if connected
    if (this.isConnected) {
      this.send({
        type: 'subscribe',
        channel: channel
      });
    }
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(channel);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(channel);
          this.send({
            type: 'unsubscribe',
            channel: channel
          });
        }
      }
    };
  }
  
  /**
   * Resubscribe to all channels
   */
  resubscribeAll() {
    for (const channel of this.subscriptions.keys()) {
      this.send({
        type: 'subscribe',
        channel: channel
      });
    }
  }
  
  /**
   * Handle match update
   */
  handleMatchUpdate(data) {
    console.log('Match update:', data);
    
    // Emit to subscribers
    this.emit('match_update', data);
    
    // Update UI
    this.updateMatchUI(data);
    
    // Show notification if needed
    if (data.isNew && data.score > 80) {
      this.showMatchNotification(data);
    }
  }
  
  /**
   * Handle gathering update
   */
  handleGatheringUpdate(data) {
    console.log('Gathering update:', data);
    
    // Emit to subscribers
    this.emit('gathering_update', data);
    
    // Update UI
    this.updateGatheringUI(data);
    
    // Show notification for important updates
    if (data.status === 'confirmed' || data.status === 'cancelled') {
      this.showGatheringNotification(data);
    }
  }
  
  /**
   * Handle new message
   */
  handleNewMessage(data) {
    console.log('New message:', data);
    
    // Emit to subscribers
    this.emit('new_message', data);
    
    // Update UI
    this.updateMessageUI(data);
    
    // Show notification if not from current user
    if (data.senderId !== this.userId) {
      this.showMessageNotification(data);
    }
  }
  
  /**
   * Handle invitation
   */
  handleInvitation(data) {
    console.log('New invitation:', data);
    
    // Emit to subscribers
    this.emit('invitation', data);
    
    // Update UI
    this.updateInvitationUI(data);
    
    // Show notification
    this.showInvitationNotification(data);
  }
  
  /**
   * Handle notification
   */
  handleNotification(data) {
    console.log('Notification:', data);
    
    // Emit to subscribers
    this.emit('notification', data);
    
    // Show notification
    this.showGeneralNotification(data);
  }
  
  /**
   * Handle presence update
   */
  handlePresenceUpdate(data) {
    console.log('Presence update:', data);
    
    // Emit to subscribers
    this.emit('presence_update', data);
    
    // Update UI
    this.updatePresenceUI(data);
  }
  
  /**
   * UI Update Methods
   */
  
  updateMatchUI(match) {
    // Update match count badge
    const matchBadge = document.querySelector('.match-badge');
    if (matchBadge && match.isNew) {
      const count = parseInt(matchBadge.textContent || '0') + 1;
      matchBadge.textContent = count;
      matchBadge.style.display = 'block';
    }
    
    // Update match list if visible
    const matchList = document.querySelector('#match-list');
    if (matchList) {
      this.insertOrUpdateMatch(matchList, match);
    }
  }
  
  updateGatheringUI(gathering) {
    // Update gathering card if exists
    const gatheringCard = document.querySelector(`[data-gathering-id="${gathering.id}"]`);
    if (gatheringCard) {
      // Update status
      const statusEl = gatheringCard.querySelector('.gathering-status');
      if (statusEl) {
        statusEl.textContent = gathering.status;
        statusEl.className = `gathering-status status-${gathering.status}`;
      }
      
      // Update attendee count
      const attendeeCount = gatheringCard.querySelector('.attendee-count');
      if (attendeeCount) {
        attendeeCount.textContent = `${gathering.attendees.accepted.length}/${gathering.maxAttendees}`;
      }
    }
  }
  
  updateMessageUI(message) {
    // Update unread count
    const unreadBadge = document.querySelector('.message-badge');
    if (unreadBadge && !message.isRead) {
      const count = parseInt(unreadBadge.textContent || '0') + 1;
      unreadBadge.textContent = count;
      unreadBadge.style.display = 'block';
    }
    
    // Update conversation if open
    const conversation = document.querySelector(`[data-conversation-id="${message.conversationId}"]`);
    if (conversation) {
      this.appendMessage(conversation, message);
    }
  }
  
  updateInvitationUI(invitation) {
    // Update invitation count
    const inviteBadge = document.querySelector('.invite-badge');
    if (inviteBadge) {
      const count = parseInt(inviteBadge.textContent || '0') + 1;
      inviteBadge.textContent = count;
      inviteBadge.style.display = 'block';
    }
  }
  
  updatePresenceUI(presence) {
    // Update user status indicators
    const userStatus = document.querySelector(`[data-user-id="${presence.userId}"] .status-indicator`);
    if (userStatus) {
      userStatus.className = `status-indicator status-${presence.status}`;
      userStatus.title = presence.status;
    }
  }
  
  /**
   * Notification Methods
   */
  
  async showMatchNotification(match) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🎯 New Match!', {
        body: `${match.name} (${match.score}% match)`,
        icon: '/images/icon-192x192.png',
        tag: `match-${match.id}`
      });
      
      notification.onclick = () => {
        window.focus();
        window.location.href = `/matches#${match.id}`;
      };
    }
  }
  
  async showGatheringNotification(gathering) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = gathering.status === 'confirmed' 
        ? '✅ Gathering Confirmed' 
        : '❌ Gathering Cancelled';
        
      const notification = new Notification(title, {
        body: gathering.title,
        icon: '/images/icon-192x192.png',
        tag: `gathering-${gathering.id}`
      });
      
      notification.onclick = () => {
        window.focus();
        window.location.href = `/gatherings#${gathering.id}`;
      };
    }
  }
  
  async showMessageNotification(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`💬 ${message.senderName}`, {
        body: message.text,
        icon: message.senderAvatar || '/images/icon-192x192.png',
        tag: `message-${message.id}`
      });
      
      notification.onclick = () => {
        window.focus();
        window.location.href = `/messages#${message.conversationId}`;
      };
    }
  }
  
  async showInvitationNotification(invitation) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🎪 New Invitation', {
        body: invitation.gatheringTitle,
        icon: '/images/icon-192x192.png',
        tag: `invitation-${invitation.id}`
      });
      
      notification.onclick = () => {
        window.focus();
        window.location.href = `/invitations#${invitation.id}`;
      };
    }
  }
  
  async showGeneralNotification(data) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(data.title || 'Conference Party', {
        body: data.body,
        icon: data.icon || '/images/icon-192x192.png',
        tag: data.tag || `notification-${Date.now()}`
      });
      
      notification.onclick = () => {
        window.focus();
        if (data.url) {
          window.location.href = data.url;
        }
      };
    }
  }
  
  /**
   * Event Emitter Methods
   */
  
  on(event, callback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(callback);
    
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(callback);
      }
    };
  }
  
  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }
  
  /**
   * Visibility and Connectivity Handlers
   */
  
  setupVisibilityHandlers() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Reduce update frequency when hidden
        this.reduceUpdateFrequency();
      } else {
        // Restore normal frequency and fetch updates
        this.restoreUpdateFrequency();
        this.fetchMissedUpdates();
      }
    });
  }
  
  setupConnectivityHandlers() {
    window.addEventListener('online', () => {
      console.log('Back online - reconnecting');
      if (!this.isConnected) {
        this.connectWebSocket();
      }
      this.fetchMissedUpdates();
    });
    
    window.addEventListener('offline', () => {
      console.log('Gone offline');
      this.stopPolling();
    });
  }
  
  reduceUpdateFrequency() {
    // Double polling intervals when page is hidden
    for (const [dataType, intervalId] of this.pollingIntervals) {
      clearInterval(intervalId);
      const newInterval = this.getPollingInterval(dataType) * 2;
      this.setupPollingFor(dataType, newInterval);
    }
  }
  
  restoreUpdateFrequency() {
    // Restore normal polling intervals
    for (const [dataType] of this.pollingIntervals) {
      const normalInterval = this.getPollingInterval(dataType);
      this.setupPollingFor(dataType, normalInterval);
    }
  }
  
  async fetchMissedUpdates() {
    // Fetch any updates missed while offline/hidden
    for (const dataType of ['matches', 'gatherings', 'messages', 'notifications']) {
      await this.pollForUpdates(dataType);
    }
  }
  
  stopPolling() {
    for (const intervalId of this.pollingIntervals.values()) {
      clearInterval(intervalId);
    }
    this.pollingIntervals.clear();
  }
  
  /**
   * Helper Methods
   */
  
  getWebSocketUrl() {
    // In production, this would be configured
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }
  
  getAuthToken() {
    return localStorage.getItem('auth_token') || '';
  }
  
  getLastUpdateTime(dataType) {
    return localStorage.getItem(`last_update_${dataType}`) || '0';
  }
  
  setLastUpdateTime(dataType, time) {
    localStorage.setItem(`last_update_${dataType}`, time.toString());
  }
  
  getPollingInterval(dataType) {
    const intervals = {
      matches: 30000,
      gatherings: 20000,
      messages: 10000,
      notifications: 60000
    };
    return intervals[dataType] || 30000;
  }
  
  insertOrUpdateMatch(container, match) {
    let matchEl = container.querySelector(`[data-match-id="${match.id}"]`);
    
    if (!matchEl) {
      // Create new match element
      matchEl = document.createElement('div');
      matchEl.className = 'match-item';
      matchEl.dataset.matchId = match.id;
      container.prepend(matchEl);
    }
    
    // Update content
    matchEl.innerHTML = `
      <div class="match-avatar">
        <img src="${match.avatar || '/images/default-avatar.png'}" alt="${match.name}">
      </div>
      <div class="match-info">
        <div class="match-name">${match.name}</div>
        <div class="match-title">${match.title}</div>
        <div class="match-score">${match.score}% match</div>
      </div>
    `;
  }
  
  appendMessage(container, message) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${message.senderId === this.userId ? 'sent' : 'received'}`;
    messageEl.innerHTML = `
      <div class="message-content">${message.text}</div>
      <div class="message-time">${this.formatTime(message.timestamp)}</div>
    `;
    container.appendChild(messageEl);
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }
  
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
  
  /**
   * Cleanup
   */
  dispose() {
    // Close WebSocket
    if (this.ws) {
      this.ws.close();
    }
    
    // Stop heartbeat
    this.stopHeartbeat();
    
    // Stop polling
    this.stopPolling();
    
    // Clear subscriptions
    this.subscriptions.clear();
    this.eventHandlers.clear();
  }
}

// Export singleton instance
export const realTimeUpdates = new RealTimeUpdates();