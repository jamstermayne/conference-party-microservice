/**
 * Push Notification Manager
 * Handles push notification subscription and management
 */

export class PushManager {
  constructor() {
    this.vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY'; // Replace with actual VAPID key
    this.isSupported = this.checkSupport();
    this.permission = Notification.permission;
    this.subscription = null;
  }
  
  /**
   * Check if push notifications are supported
   */
  checkSupport() {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }
  
  /**
   * Initialize push notifications
   */
  async initialize() {
    if (!this.isSupported) {
      console.warn('Push notifications not supported');
      return false;
    }
    
    // Check current permission status
    this.permission = Notification.permission;
    
    if (this.permission === 'denied') {
      console.warn('Push notifications denied by user');
      return false;
    }
    
    // Get current subscription if exists
    try {
      const registration = await navigator.serviceWorker.ready;
      this.subscription = await registration.pushManager.getSubscription();
      
      if (this.subscription) {
        console.log('Existing push subscription found');
        await this.sendSubscriptionToServer(this.subscription);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize push manager:', error);
      return false;
    }
  }
  
  /**
   * Request permission and subscribe to push notifications
   */
  async subscribe() {
    if (!this.isSupported) {
      throw new Error('Push notifications not supported');
    }
    
    // Request permission if not granted
    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }
    
    if (this.permission !== 'granted') {
      throw new Error('Push notification permission denied');
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });
      
      this.subscription = subscription;
      console.log('Push subscription successful:', subscription);
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      // Show success notification
      await this.showNotification(
        'Notifications Enabled!',
        {
          body: 'You\'ll now receive updates about matches, connections, and messages.',
          icon: '/images/icon-192x192.png',
          badge: '/images/badge-72x72.png',
          tag: 'subscription-success'
        }
      );
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }
  
  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    if (!this.subscription) {
      console.warn('No active subscription to unsubscribe from');
      return false;
    }
    
    try {
      await this.subscription.unsubscribe();
      await this.removeSubscriptionFromServer(this.subscription);
      this.subscription = null;
      console.log('Push subscription cancelled');
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      throw error;
    }
  }
  
  /**
   * Send subscription to server
   */
  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      console.log('Subscription sent to server');
      return await response.json();
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
      // Store locally for retry
      this.storeSubscriptionLocally(subscription);
    }
  }
  
  /**
   * Remove subscription from server
   */
  async removeSubscriptionFromServer(subscription) {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      console.log('Subscription removed from server');
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }
  
  /**
   * Store subscription locally for retry
   */
  storeSubscriptionLocally(subscription) {
    localStorage.setItem('push_subscription_pending', JSON.stringify({
      subscription: subscription.toJSON(),
      timestamp: Date.now()
    }));
  }
  
  /**
   * Retry sending stored subscription
   */
  async retrySendingSubscription() {
    const stored = localStorage.getItem('push_subscription_pending');
    if (!stored) return;
    
    try {
      const { subscription } = JSON.parse(stored);
      await this.sendSubscriptionToServer(subscription);
      localStorage.removeItem('push_subscription_pending');
    } catch (error) {
      console.error('Failed to retry sending subscription:', error);
    }
  }
  
  /**
   * Show notification
   */
  async showNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted');
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/images/icon-192x192.png',
        badge: '/images/badge-72x72.png',
        vibrate: [200, 100, 200],
        ...options
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }
  
  /**
   * Show match notification
   */
  async showMatchNotification(match) {
    await this.showNotification(
      `New Match: ${match.name}`,
      {
        body: `${match.score}% compatibility - ${match.title} at ${match.company}`,
        icon: match.avatar || '/images/icon-192x192.png',
        tag: `match-${match.id}`,
        data: { matchId: match.id },
        actions: [
          {
            action: 'view-match',
            title: 'View Profile',
            icon: '/images/icons/user.png'
          },
          {
            action: 'send-message',
            title: 'Message',
            icon: '/images/icons/message.png'
          }
        ]
      }
    );
  }
  
  /**
   * Show connection notification
   */
  async showConnectionNotification(connection) {
    await this.showNotification(
      `Connection Request from ${connection.name}`,
      {
        body: `${connection.title} at ${connection.company} wants to connect`,
        icon: connection.avatar || '/images/icon-192x192.png',
        tag: `connection-${connection.id}`,
        data: { connectionId: connection.id },
        actions: [
          {
            action: 'accept-connection',
            title: 'Accept',
            icon: '/images/icons/check.png'
          },
          {
            action: 'view-profile',
            title: 'View Profile',
            icon: '/images/icons/user.png'
          }
        ]
      }
    );
  }
  
  /**
   * Show message notification
   */
  async showMessageNotification(message) {
    await this.showNotification(
      message.senderName,
      {
        body: message.preview || 'Sent you a message',
        icon: message.senderAvatar || '/images/icon-192x192.png',
        tag: `message-${message.conversationId}`,
        data: { 
          messageId: message.id,
          conversationId: message.conversationId 
        },
        actions: [
          {
            action: 'reply',
            title: 'Reply',
            icon: '/images/icons/reply.png'
          },
          {
            action: 'view-message',
            title: 'View',
            icon: '/images/icons/message.png'
          }
        ]
      }
    );
  }
  
  /**
   * Show event reminder notification
   */
  async showEventNotification(event) {
    await this.showNotification(
      `Event Starting Soon: ${event.name}`,
      {
        body: `${event.venue} - Starting in ${event.timeUntil}`,
        icon: '/images/icon-192x192.png',
        tag: `event-${event.id}`,
        data: { eventId: event.id },
        actions: [
          {
            action: 'view-event',
            title: 'View Details',
            icon: '/images/icons/calendar.png'
          },
          {
            action: 'get-directions',
            title: 'Get Directions',
            icon: '/images/icons/map.png'
          }
        ]
      }
    );
  }
  
  /**
   * Convert VAPID key to Uint8Array
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
   * Get notification preferences
   */
  getPreferences() {
    const stored = localStorage.getItem('notification_preferences');
    return stored ? JSON.parse(stored) : {
      matches: true,
      connections: true,
      messages: true,
      events: true,
      updates: true
    };
  }
  
  /**
   * Update notification preferences
   */
  updatePreferences(preferences) {
    localStorage.setItem('notification_preferences', JSON.stringify(preferences));
  }
  
  /**
   * Check if notification type is enabled
   */
  isTypeEnabled(type) {
    const preferences = this.getPreferences();
    return preferences[type] !== false;
  }
  
  /**
   * Test push notification
   */
  async testNotification() {
    await this.showNotification(
      'Test Notification',
      {
        body: 'Push notifications are working correctly!',
        icon: '/images/icon-192x192.png',
        badge: '/images/badge-72x72.png',
        tag: 'test-notification',
        requireInteraction: false
      }
    );
  }
  
  /**
   * Get subscription status
   */
  getStatus() {
    return {
      supported: this.isSupported,
      permission: this.permission,
      subscribed: !!this.subscription,
      endpoint: this.subscription?.endpoint
    };
  }
  
  /**
   * Handle notification click from service worker
   */
  async handleNotificationClick(action, data) {
    console.log('Notification action:', action, data);
    
    switch (action) {
      case 'view-match':
        window.location.href = `/matches#${data.matchId}`;
        break;
      
      case 'accept-connection':
        await this.acceptConnection(data.connectionId);
        break;
      
      case 'view-message':
        window.location.href = `/messages#${data.conversationId}`;
        break;
      
      case 'view-event':
        window.location.href = `/events#${data.eventId}`;
        break;
      
      case 'get-directions':
        const event = await this.getEvent(data.eventId);
        if (event?.venue) {
          window.open(`https://maps.google.com/maps?q=${encodeURIComponent(event.venue)}`);
        }
        break;
      
      default:
        console.log('Unknown notification action:', action);
    }
  }
  
  /**
   * Accept connection (helper for notification action)
   */
  async acceptConnection(connectionId) {
    try {
      const response = await fetch(`/api/connections/${connectionId}/accept`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await this.showNotification(
          'Connection Accepted!',
          {
            body: 'You are now connected',
            tag: 'connection-accepted'
          }
        );
      }
    } catch (error) {
      console.error('Failed to accept connection:', error);
    }
  }
  
  /**
   * Get event details (helper for notification action)
   */
  async getEvent(eventId) {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get event:', error);
    }
    return null;
  }
}

// Export singleton instance
export const pushManager = new PushManager();