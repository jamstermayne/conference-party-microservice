/**
 * Real-Time Chat System
 * Handles instant messaging with AI-powered conversation features
 */

class RealTimeChatSystem {
  constructor() {
    this.messageListeners = new Map();
    this.conversationCache = new Map();
    this.wsConnection = null;
    this.userId = localStorage.getItem('userId');
    this.activeConversation = null;
    
    // Initialize WebSocket for real-time updates
    this.initializeWebSocket();
    
    // AI service for smart features
    this.aiService = window.AIService || { generateContent: this.mockAIGenerate.bind(this) };
  }
  
  /**
   * Initialize WebSocket connection for real-time messaging
   */
  initializeWebSocket() {
    const wsUrl = window.location.hostname === 'localhost' 
      ? 'ws://localhost:3001/chat'
      : 'wss://conference-party-app.web.app/chat';
    
    try {
      this.wsConnection = new WebSocket(wsUrl);
      
      this.wsConnection.onopen = () => {
        console.log('[Chat] WebSocket connected');
        this.sendWebSocketMessage({
          type: 'auth',
          userId: this.userId
        });
      };
      
      this.wsConnection.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      };
      
      this.wsConnection.onerror = (error) => {
        console.error('[Chat] WebSocket error:', error);
        // Fallback to polling
        this.startPollingFallback();
      };
      
      this.wsConnection.onclose = () => {
        console.log('[Chat] WebSocket closed, reconnecting...');
        setTimeout(() => this.initializeWebSocket(), 5000);
      };
    } catch (error) {
      console.log('[Chat] WebSocket not available, using polling');
      this.startPollingFallback();
    }
  }
  
  /**
   * Handle incoming WebSocket messages
   */
  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'message':
        this.onNewMessage(data.conversationId, data.message);
        break;
      case 'typing':
        this.onTypingIndicator(data.conversationId, data.userId, data.isTyping);
        break;
      case 'read':
        this.onMessageRead(data.conversationId, data.userId);
        break;
      case 'presence':
        this.onPresenceUpdate(data.userId, data.status);
        break;
    }
  }
  
  /**
   * Start a conversation between two users
   */
  async startConversation(participant1, participant2) {
    const conversationId = [participant1, participant2].sort().join('_');
    
    // Check cache first
    if (this.conversationCache.has(conversationId)) {
      return conversationId;
    }
    
    // Create conversation metadata
    const conversation = {
      id: conversationId,
      participants: [participant1, participant2],
      createdAt: new Date().toISOString(),
      lastMessage: null,
      lastMessageAt: null,
      messageCount: 0,
      unreadCount: {
        [participant1]: 0,
        [participant2]: 0
      },
      typing: {
        [participant1]: false,
        [participant2]: false
      }
    };
    
    // Store in local storage and cache
    this.saveConversation(conversation);
    this.conversationCache.set(conversationId, conversation);
    
    // Generate initial conversation starters
    await this.generateConversationStarters(conversationId, participant1);
    
    return conversationId;
  }
  
  /**
   * Send a message with real-time delivery
   */
  async sendMessage(conversationId, senderId, content, type = 'text') {
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      senderId,
      content,
      type,
      timestamp: new Date().toISOString(),
      status: 'sending',
      reactions: []
    };
    
    // Optimistic UI update
    this.addMessageToConversation(conversationId, message);
    
    // Send via WebSocket if connected
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.sendWebSocketMessage({
        type: 'message',
        conversationId,
        message
      });
      message.status = 'sent';
    } else {
      // Fallback to API
      try {
        await this.sendMessageViaAPI(conversationId, message);
        message.status = 'delivered';
      } catch (error) {
        message.status = 'failed';
        console.error('[Chat] Failed to send message:', error);
      }
    }
    
    // Update conversation metadata
    await this.updateConversationMetadata(conversationId, message);
    
    // Trigger notification for recipient
    const conversation = this.conversationCache.get(conversationId);
    const recipientId = conversation.participants.find(p => p !== senderId);
    await this.sendMessageNotification(recipientId, senderId, content);
    
    return message;
  }
  
  /**
   * Subscribe to real-time messages for a conversation
   */
  subscribeToMessages(conversationId, callback) {
    // Load existing messages
    const messages = this.loadMessages(conversationId);
    callback(messages);
    
    // Set up listener for new messages
    const listener = (newMessage) => {
      const updatedMessages = this.loadMessages(conversationId);
      callback(updatedMessages);
    };
    
    this.messageListeners.set(conversationId, listener);
    
    // Mark messages as read
    this.markMessagesAsRead(conversationId, this.userId);
    
    // Return unsubscribe function
    return () => {
      this.messageListeners.delete(conversationId);
    };
  }
  
  /**
   * Generate AI-powered conversation starters
   */
  async generateConversationStarters(conversationId, userId) {
    const conversation = this.conversationCache.get(conversationId);
    const otherParticipant = conversation.participants.find(p => p !== userId);
    
    // Get user profiles
    const [userProfile, otherProfile] = await Promise.all([
      this.getUserProfile(userId),
      this.getUserProfile(otherParticipant)
    ]);
    
    // Find common interests
    const commonInterests = this.findCommonInterests(userProfile, otherProfile);
    
    const prompt = `
    Generate 3 natural conversation starters for a professional networking chat.
    
    Context:
    - User 1: ${userProfile.name} - ${userProfile.title} at ${userProfile.company}
    - User 2: ${otherProfile.name} - ${otherProfile.title} at ${otherProfile.company}
    - Common interests: ${commonInterests.join(', ')}
    - Conference: Gamescom 2025
    
    Create starters that:
    1. Reference shared interests or conference sessions
    2. Provide clear value for connecting
    3. Are natural and conversational
    4. Include a specific question
    
    Return as JSON: [{"starter": "text", "reasoning": "why this works"}]
    `;
    
    try {
      const response = await this.aiService.generateContent(prompt);
      const starters = JSON.parse(response);
      
      // Cache starters
      localStorage.setItem(`starters_${conversationId}`, JSON.stringify(starters));
      
      return starters;
    } catch (error) {
      console.error('[Chat] Failed to generate starters:', error);
      return this.getFallbackStarters(userProfile, otherProfile, commonInterests);
    }
  }
  
  /**
   * Generate smart reply suggestions
   */
  async generateSmartReply(conversationId, userId, lastMessages) {
    const context = lastMessages.slice(-5).map(m => 
      `${m.senderId === userId ? 'You' : 'Them'}: ${m.content}`
    ).join('\n');
    
    const prompt = `
    Based on this conversation, suggest 3 brief reply options:
    
    ${context}
    
    Generate replies that:
    1. Are 1-2 sentences max
    2. Move the conversation forward
    3. Show genuine interest
    4. Are professional and friendly
    
    Return as array: ["reply1", "reply2", "reply3"]
    `;
    
    try {
      const response = await this.aiService.generateContent(prompt);
      return JSON.parse(response);
    } catch (error) {
      return this.getFallbackReplies(lastMessages);
    }
  }
  
  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId, isTyping) {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.sendWebSocketMessage({
        type: 'typing',
        conversationId,
        userId: this.userId,
        isTyping
      });
    }
    
    // Update local state
    const conversation = this.conversationCache.get(conversationId);
    if (conversation) {
      conversation.typing[this.userId] = isTyping;
      this.saveConversation(conversation);
    }
  }
  
  /**
   * Mark messages as read
   */
  markMessagesAsRead(conversationId, userId) {
    const conversation = this.conversationCache.get(conversationId);
    if (!conversation) return;
    
    // Reset unread count
    conversation.unreadCount[userId] = 0;
    this.saveConversation(conversation);
    
    // Send read receipt
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.sendWebSocketMessage({
        type: 'read',
        conversationId,
        userId
      });
    }
  }
  
  /**
   * Add reaction to message
   */
  async addReaction(conversationId, messageId, userId, emoji) {
    const messages = this.loadMessages(conversationId);
    const message = messages.find(m => m.id === messageId);
    
    if (!message) return;
    
    // Toggle reaction
    const existingReaction = message.reactions.find(r => 
      r.userId === userId && r.emoji === emoji
    );
    
    if (existingReaction) {
      message.reactions = message.reactions.filter(r => 
        !(r.userId === userId && r.emoji === emoji)
      );
    } else {
      message.reactions.push({ userId, emoji });
    }
    
    // Save updated messages
    this.saveMessages(conversationId, messages);
    
    // Send via WebSocket
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.sendWebSocketMessage({
        type: 'reaction',
        conversationId,
        messageId,
        userId,
        emoji,
        action: existingReaction ? 'remove' : 'add'
      });
    }
  }
  
  /**
   * Get conversation list for a user
   */
  getConversationList(userId) {
    const conversations = [];
    const stored = localStorage.getItem('conversations');
    
    if (stored) {
      const allConversations = JSON.parse(stored);
      Object.values(allConversations).forEach(conv => {
        if (conv.participants.includes(userId)) {
          conversations.push(conv);
        }
      });
    }
    
    // Sort by last message time
    conversations.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });
    
    return conversations;
  }
  
  /**
   * Helper: Send WebSocket message
   */
  sendWebSocketMessage(data) {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify(data));
    }
  }
  
  /**
   * Helper: Save conversation to storage
   */
  saveConversation(conversation) {
    const stored = localStorage.getItem('conversations') || '{}';
    const conversations = JSON.parse(stored);
    conversations[conversation.id] = conversation;
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }
  
  /**
   * Helper: Load messages for conversation
   */
  loadMessages(conversationId) {
    const stored = localStorage.getItem(`messages_${conversationId}`);
    return stored ? JSON.parse(stored) : [];
  }
  
  /**
   * Helper: Save messages for conversation
   */
  saveMessages(conversationId, messages) {
    localStorage.setItem(`messages_${conversationId}`, JSON.stringify(messages));
  }
  
  /**
   * Helper: Add message to conversation
   */
  addMessageToConversation(conversationId, message) {
    const messages = this.loadMessages(conversationId);
    messages.push(message);
    this.saveMessages(conversationId, messages);
    
    // Notify listeners
    const listener = this.messageListeners.get(conversationId);
    if (listener) {
      listener(message);
    }
  }
  
  /**
   * Helper: Update conversation metadata
   */
  async updateConversationMetadata(conversationId, message) {
    const conversation = this.conversationCache.get(conversationId);
    if (!conversation) return;
    
    conversation.lastMessage = message.content;
    conversation.lastMessageAt = message.timestamp;
    conversation.messageCount++;
    
    // Update unread count for recipient
    const recipientId = conversation.participants.find(p => p !== message.senderId);
    conversation.unreadCount[recipientId]++;
    
    this.saveConversation(conversation);
    this.conversationCache.set(conversationId, conversation);
  }
  
  /**
   * Helper: Get user profile
   */
  async getUserProfile(userId) {
    const stored = localStorage.getItem(`profile_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Mock profile for demo
    return {
      id: userId,
      name: `User ${userId.substr(0, 8)}`,
      title: 'Software Engineer',
      company: 'Tech Company',
      interests: ['AI', 'Gaming', 'Networking'],
      skills: ['JavaScript', 'React', 'Node.js']
    };
  }
  
  /**
   * Helper: Find common interests
   */
  findCommonInterests(profile1, profile2) {
    const interests1 = new Set([...profile1.interests, ...profile1.skills]);
    const interests2 = new Set([...profile2.interests, ...profile2.skills]);
    
    const common = [];
    interests1.forEach(interest => {
      if (interests2.has(interest)) {
        common.push(interest);
      }
    });
    
    return common.length > 0 ? common : ['Professional Networking', 'Gamescom 2025'];
  }
  
  /**
   * Helper: Get fallback conversation starters
   */
  getFallbackStarters(userProfile, otherProfile, commonInterests) {
    const starters = [
      {
        starter: `Hi ${otherProfile.name}! I noticed we both have an interest in ${commonInterests[0] || 'gaming'}. What sessions are you most excited about at Gamescom?`,
        reasoning: "References shared interest and asks an open question"
      },
      {
        starter: `Great to connect! I saw you work at ${otherProfile.company} - I'd love to hear about what you're working on there.`,
        reasoning: "Shows you've looked at their profile and expresses genuine interest"
      },
      {
        starter: `Hey! Thanks for connecting. Are you attending any of the ${commonInterests[0] || 'tech'} workshops this week? Would be great to meet up!`,
        reasoning: "Suggests potential in-person meeting at the conference"
      }
    ];
    
    return starters;
  }
  
  /**
   * Helper: Get fallback reply suggestions
   */
  getFallbackReplies(lastMessages) {
    const lastMessage = lastMessages[lastMessages.length - 1];
    
    if (!lastMessage) {
      return [
        "That sounds interesting! Tell me more.",
        "I'd love to learn more about that.",
        "Thanks for sharing! What got you interested in this?"
      ];
    }
    
    // Context-aware fallbacks based on keywords
    const content = lastMessage.content.toLowerCase();
    
    if (content.includes('session') || content.includes('talk')) {
      return [
        "I'm planning to attend that one too! What are you hoping to learn?",
        "That session looks great. Have you been to similar talks before?",
        "Sounds interesting! Are you going with your team?"
      ];
    }
    
    if (content.includes('work') || content.includes('project')) {
      return [
        "That sounds like an exciting project! How long have you been working on it?",
        "Very cool! What's been the most challenging part?",
        "Impressive! What tech stack are you using?"
      ];
    }
    
    // Generic fallbacks
    return [
      "That's really interesting! Tell me more.",
      "I'd love to hear more about your experience with that.",
      "Thanks for sharing! How did you get started?"
    ];
  }
  
  /**
   * Helper: Send notification for new message
   */
  async sendMessageNotification(recipientId, senderId, content) {
    // Check if user has notifications enabled
    const notificationsEnabled = localStorage.getItem(`notifications_${recipientId}`) !== 'false';
    if (!notificationsEnabled) return;
    
    // Get sender profile for notification
    const senderProfile = await this.getUserProfile(senderId);
    
    // Send push notification if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`New message from ${senderProfile.name}`, {
        body: content.length > 100 ? content.substring(0, 100) + '...' : content,
        icon: '/images/icon-192x192.png',
        badge: '/images/icon-192x192.png',
        vibrate: [200, 100, 200],
        data: {
          conversationId: `${senderId}_${recipientId}`.split('_').sort().join('_')
        }
      });
    }
  }
  
  /**
   * Polling fallback for environments without WebSocket
   */
  startPollingFallback() {
    if (this.pollingInterval) return;
    
    this.pollingInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/chat/updates?userId=${this.userId}&since=${this.lastPollTime || 0}`);
        if (response.ok) {
          const updates = await response.json();
          updates.forEach(update => this.handleWebSocketMessage(update));
          this.lastPollTime = Date.now();
        }
      } catch (error) {
        console.debug('[Chat] Polling error:', error);
      }
    }, 5000);
  }
  
  /**
   * Mock AI generate for demo
   */
  mockAIGenerate(prompt) {
    // Simple mock responses based on prompt content
    if (prompt.includes('conversation starters')) {
      return JSON.stringify([
        {
          starter: "Hi! I noticed we're both interested in AI and gaming. Are you attending the AI in Gaming panel tomorrow?",
          reasoning: "References shared interests and specific conference event"
        },
        {
          starter: "Great to connect! I saw you work on similar tech - would love to hear your thoughts on the latest Unity updates.",
          reasoning: "Shows professional interest and opens technical discussion"
        },
        {
          starter: "Hey! Thanks for connecting. Are you free to grab coffee between sessions? Would be great to chat about our shared interests in person.",
          reasoning: "Suggests face-to-face meeting for deeper connection"
        }
      ]);
    }
    
    if (prompt.includes('reply options')) {
      return JSON.stringify([
        "That's fascinating! How did you approach that challenge?",
        "I've had a similar experience. Would love to compare notes!",
        "Thanks for sharing! Have you considered trying [relevant suggestion]?"
      ]);
    }
    
    return '[]';
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    if (this.wsConnection) {
      this.wsConnection.close();
    }
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    this.messageListeners.clear();
    this.conversationCache.clear();
  }
}

// Create singleton instance
window.RealTimeChatSystem = new RealTimeChatSystem();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RealTimeChatSystem;
}