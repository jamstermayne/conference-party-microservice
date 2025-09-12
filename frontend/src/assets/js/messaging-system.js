/**
 * Real-time Messaging System
 * iMessage-inspired chat for professional networking
 */

class MessagingSystem {
  constructor() {
    this.conversations = new Map();
    this.activeConversation = null;
    this.currentUser = localStorage.getItem('user_email') || 'You';
    this.unreadCount = 0;
    this.isOpen = false;
    
    // Mock contacts for demo
    this.contacts = [
      { id: 1, name: 'Sarah Chen', role: 'Game Designer', company: 'Ubisoft', avatar: 'profile', status: 'online', lastSeen: 'now' },
      { id: 2, name: 'Marcus Johnson', role: 'Publisher', company: 'EA Games', avatar: 'profile', status: 'online', lastSeen: '2m ago' },
      { id: 3, name: 'Emma Wilson', role: 'Indie Developer', company: 'Pixel Dreams', avatar: 'profile', status: 'away', lastSeen: '15m ago' },
      { id: 4, name: 'Alex Kumar', role: 'Investor', company: 'GameVentures', avatar: 'profile', status: 'offline', lastSeen: '1h ago' },
      { id: 5, name: 'Team MAU', role: 'Support', company: 'MAU Platform', avatar: 'ai', status: 'online', lastSeen: 'now', isBot: true }
    ];
    
    this.init();
  }

  init() {
    this.injectStyles();
    this.createMessagingUI();
    this.setupEventListeners();
    this.initializeMockConversations();
    this.simulateIncomingMessages();
  }

  createMessagingUI() {
    // Floating message button
    const messageBtn = document.createElement('button');
    messageBtn.className = 'message-fab';
    messageBtn.innerHTML = `
      <span class="message-fab-icon">${window.getIcon ? window.getIcon('message') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'}</span>
      <span class="message-fab-badge" style="display: none;">0</span>
    `;
    messageBtn.onclick = () => this.toggle();
    document.body.appendChild(messageBtn);

    // Main messaging container
    const container = document.createElement('div');
    container.className = 'messaging-container';
    container.innerHTML = `
      <div class="messaging-header">
        <button class="messaging-back" onclick="window.messaging.showConversationList()">
          <span>←</span>
        </button>
        <div class="messaging-title">
          <h3>Messages</h3>
          <p class="messaging-subtitle">5 conversations</p>
        </div>
        <div class="messaging-actions">
          <button class="messaging-action" onclick="window.messaging.startNewChat()">
            <span>✏️</span>
          </button>
          <button class="messaging-close" onclick="window.messaging.close()">
            <span>×</span>
          </button>
        </div>
      </div>

      <div class="messaging-search">
        <input type="text" placeholder="Search conversations..." class="messaging-search-input">
        <span class="messaging-search-icon">🔍</span>
      </div>

      <div class="messaging-content">
        <!-- Conversation List -->
        <div class="conversation-list active">
          ${this.contacts.map(contact => this.createConversationItem(contact)).join('')}
        </div>

        <!-- Active Chat -->
        <div class="chat-view">
          <div class="chat-header">
            <div class="chat-contact">
              <span class="chat-avatar">${window.getIcon ? window.getIcon('profile') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'}</span>
              <div class="chat-contact-info">
                <h4 class="chat-contact-name">Select a conversation</h4>
                <p class="chat-contact-status">Choose someone to start chatting</p>
              </div>
            </div>
            <div class="chat-actions">
              <button class="chat-action" onclick="window.messaging.showContactInfo()">${window.getIcon ? window.getIcon('info') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'}</button>
              <button class="chat-action" onclick="window.messaging.startVideoCall()">${window.getIcon ? window.getIcon('video') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>'}</button>
            </div>
          </div>

          <div class="chat-messages">
            <div class="chat-empty">
              <span class="chat-empty-icon">${window.getIcon ? window.getIcon('message') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'}</span>
              <p>Select a conversation to start messaging</p>
            </div>
          </div>

          <div class="chat-input-container">
            <div class="chat-typing-indicator" style="display: none;">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-text">typing...</span>
            </div>
            <form class="chat-input-form" onsubmit="window.messaging.sendMessage(event)">
              <button type="button" class="chat-attach">${window.getIcon ? window.getIcon('attach') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>'}</button>
              <input type="text" class="chat-input" placeholder="Type a message..." disabled>
              <button type="submit" class="chat-send" disabled>
                <span>↑</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- New Chat Modal -->
      <div class="new-chat-modal" style="display: none;">
        <div class="new-chat-header">
          <button class="new-chat-close" onclick="window.messaging.closeNewChat()">×</button>
          <h3>New Conversation</h3>
        </div>
        <div class="new-chat-search">
          <input type="text" placeholder="Search attendees..." class="new-chat-search-input">
        </div>
        <div class="new-chat-suggestions">
          <h4>Suggested Connections</h4>
          <div class="suggested-contacts">
            ${this.contacts.filter(c => !c.isBot).map(contact => `
              <div class="suggested-contact" onclick="window.messaging.startChatWith(${contact.id})">
                <span class="suggested-avatar">${contact.avatar}</span>
                <div class="suggested-info">
                  <p class="suggested-name">${contact.name}</p>
                  <p class="suggested-role">${contact.role} at ${contact.company}</p>
                </div>
                <button class="suggested-add">+</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(container);
  }

  createConversationItem(contact) {
    const lastMessage = this.getLastMessage(contact.id);
    const unread = Math.random() > 0.6 ? Math.floor(Math.random() * 3) + 1 : 0;
    
    const avatarIcon = contact.avatar === 'ai' ? 
      (window.getIcon ? window.getIcon('ai') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>') :
      (window.getIcon ? window.getIcon('profile') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>');
    
    return `
      <div class="conversation-item ${unread ? 'unread' : ''}" onclick="window.messaging.openChat(${contact.id})">
        <span class="conversation-avatar">${avatarIcon}</span>
        <div class="conversation-content">
          <div class="conversation-header">
            <h4 class="conversation-name">${contact.name}</h4>
            <span class="conversation-time">${contact.lastSeen}</span>
          </div>
          <div class="conversation-preview">
            <p class="conversation-message">${lastMessage}</p>
            ${unread ? `<span class="conversation-badge">${unread}</span>` : ''}
          </div>
        </div>
        <span class="conversation-status conversation-status-${contact.status}"></span>
      </div>
    `;
  }

  getLastMessage(contactId) {
    const messages = [
      "Looking forward to meeting at the Unity booth!",
      "The new game engine features look amazing",
      "Would love to discuss partnership opportunities",
      "See you at the indie showcase tomorrow",
      "Thanks for connecting! Let's grab coffee"
    ];
    return messages[contactId % messages.length];
  }

  initializeMockConversations() {
    // Create some mock message history
    this.contacts.forEach(contact => {
      const messages = [];
      
      // Add welcome message from MAU bot
      if (contact.isBot) {
        messages.push({
          id: Date.now(),
          sender: contact.name,
          content: "Welcome to MAU! I'm here to help you navigate the conference and connect with the right people. How can I assist you today?",
          timestamp: new Date(Date.now() - 3600000),
          type: 'text'
        });
      } else {
        // Add some mock conversation
        messages.push({
          id: Date.now() - 2000,
          sender: contact.name,
          content: `Hi! I saw you're attending the conference. Would love to connect!`,
          timestamp: new Date(Date.now() - 7200000),
          type: 'text'
        });
        
        messages.push({
          id: Date.now() - 1000,
          sender: 'You',
          content: `Absolutely! Looking forward to networking with fellow professionals.`,
          timestamp: new Date(Date.now() - 3600000),
          type: 'text'
        });
      }
      
      this.conversations.set(contact.id, messages);
    });
  }

  openChat(contactId) {
    const contact = this.contacts.find(c => c.id === contactId);
    if (!contact) return;

    this.activeConversation = contactId;
    
    // Update UI
    const chatView = document.querySelector('.chat-view');
    const conversationList = document.querySelector('.conversation-list');
    
    conversationList.classList.remove('active');
    chatView.classList.add('active');
    
    // Update header
    const header = chatView.querySelector('.chat-header');
    const avatarIcon = contact.avatar === 'ai' ? 
      (window.getIcon ? window.getIcon('ai') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>') :
      (window.getIcon ? window.getIcon('profile') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>');
    
    header.innerHTML = `
      <div class="chat-contact">
        <span class="chat-avatar">${avatarIcon}</span>
        <div class="chat-contact-info">
          <h4 class="chat-contact-name">${contact.name}</h4>
          <p class="chat-contact-status">${contact.role} • ${contact.status === 'online' ? 'Active now' : `Last seen ${contact.lastSeen}`}</p>
        </div>
      </div>
      <div class="chat-actions">
        <button class="chat-action" onclick="window.messaging.showContactInfo()">${window.getIcon ? window.getIcon('info') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'}</button>
        <button class="chat-action" onclick="window.messaging.startVideoCall()">${window.getIcon ? window.getIcon('video') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>'}</button>
      </div>
    `;
    
    // Load messages
    this.loadMessages(contactId);
    
    // Enable input
    const input = document.querySelector('.chat-input');
    const sendBtn = document.querySelector('.chat-send');
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
    
    // Clear unread badge
    const item = document.querySelector(`.conversation-item:nth-child(${contactId})`);
    if (item) {
      item.classList.remove('unread');
      const badge = item.querySelector('.conversation-badge');
      if (badge) badge.remove();
    }
    
    // Update unread count
    this.updateUnreadCount();
    
    // Haptic feedback
    if (window.haptic) {
      window.haptic.selection();
    }
  }

  loadMessages(contactId) {
    const messages = this.conversations.get(contactId) || [];
    const messagesContainer = document.querySelector('.chat-messages');
    
    messagesContainer.innerHTML = messages.map(msg => this.createMessage(msg)).join('');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  createMessage(message) {
    const isOwn = message.sender === 'You' || message.sender === this.currentUser;
    const time = new Date(message.timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    
    return `
      <div class="chat-message ${isOwn ? 'own' : ''}">
        <div class="chat-bubble">
          <p class="chat-text">${message.content}</p>
          <span class="chat-time">${time}</span>
        </div>
      </div>
    `;
  }

  sendMessage(event) {
    event.preventDefault();
    
    const input = document.querySelector('.chat-input');
    const content = input.value.trim();
    
    if (!content || !this.activeConversation) return;
    
    // Add message to conversation
    const message = {
      id: Date.now(),
      sender: 'You',
      content: content,
      timestamp: new Date(),
      type: 'text'
    };
    
    const messages = this.conversations.get(this.activeConversation) || [];
    messages.push(message);
    this.conversations.set(this.activeConversation, messages);
    
    // Update UI
    this.loadMessages(this.activeConversation);
    input.value = '';
    
    // Haptic feedback
    if (window.haptic) {
      window.haptic.impact('light');
    }
    
    // Simulate reply after delay
    if (Math.random() > 0.3) {
      this.simulateTyping();
      setTimeout(() => this.simulateReply(), 2000 + Math.random() * 2000);
    }
  }

  simulateTyping() {
    const indicator = document.querySelector('.chat-typing-indicator');
    if (indicator) {
      indicator.style.display = 'flex';
      setTimeout(() => {
        indicator.style.display = 'none';
      }, 3000);
    }
  }

  simulateReply() {
    if (!this.activeConversation) return;
    
    const contact = this.contacts.find(c => c.id === this.activeConversation);
    if (!contact) return;
    
    const replies = [
      "That sounds great! Count me in.",
      "I completely agree with your perspective.",
      "Looking forward to discussing this further at the conference.",
      "Thanks for sharing! This is really interesting.",
      "Would love to explore potential collaboration opportunities.",
      "Let's definitely connect at the networking event!"
    ];
    
    const message = {
      id: Date.now(),
      sender: contact.name,
      content: replies[Math.floor(Math.random() * replies.length)],
      timestamp: new Date(),
      type: 'text'
    };
    
    const messages = this.conversations.get(this.activeConversation) || [];
    messages.push(message);
    this.conversations.set(this.activeConversation, messages);
    
    // Update UI
    this.loadMessages(this.activeConversation);
    
    // Notification sound
    if (window.haptic) {
      window.haptic.notification('success');
    }
  }

  simulateIncomingMessages() {
    // Simulate random incoming messages every 30-60 seconds
    setInterval(() => {
      if (this.isOpen) return; // Don't simulate when chat is open
      
      const randomContact = this.contacts[Math.floor(Math.random() * this.contacts.length)];
      this.unreadCount++;
      this.updateUnreadCount();
      
      // Show notification
      this.showNotification(randomContact);
    }, 30000 + Math.random() * 30000);
  }

  showNotification(contact) {
    const notification = document.createElement('div');
    notification.className = 'message-notification';
    notification.innerHTML = `
      <span class="notification-avatar">${contact.avatar}</span>
      <div class="notification-content">
        <p class="notification-name">${contact.name}</p>
        <p class="notification-message">Sent you a message</p>
      </div>
    `;
    
    notification.onclick = () => {
      this.open();
      this.openChat(contact.id);
      notification.remove();
    };
    
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('active');
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.classList.remove('active');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Haptic notification
    if (window.haptic) {
      window.haptic.notification('success');
    }
  }

  updateUnreadCount() {
    const badge = document.querySelector('.message-fab-badge');
    if (badge) {
      if (this.unreadCount > 0) {
        badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    const container = document.querySelector('.messaging-container');
    container.classList.add('active');
    this.isOpen = true;
    
    // Reset unread count when opening
    this.unreadCount = 0;
    this.updateUnreadCount();
    
    if (window.haptic) {
      window.haptic.impact('medium');
    }
  }

  close() {
    const container = document.querySelector('.messaging-container');
    container.classList.remove('active');
    this.isOpen = false;
    
    if (window.haptic) {
      window.haptic.impact('light');
    }
  }

  showConversationList() {
    const chatView = document.querySelector('.chat-view');
    const conversationList = document.querySelector('.conversation-list');
    
    chatView.classList.remove('active');
    conversationList.classList.add('active');
    
    // Update header
    const title = document.querySelector('.messaging-title h3');
    title.textContent = 'Messages';
  }

  startNewChat() {
    const modal = document.querySelector('.new-chat-modal');
    modal.style.display = 'block';
    
    requestAnimationFrame(() => {
      modal.classList.add('active');
    });
  }

  closeNewChat() {
    const modal = document.querySelector('.new-chat-modal');
    modal.classList.remove('active');
    
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }

  startChatWith(contactId) {
    this.closeNewChat();
    this.openChat(contactId);
  }

  showContactInfo() {
    const contact = this.contacts.find(c => c.id === this.activeConversation);
    if (contact) {
      alert(`${contact.name}\n${contact.role} at ${contact.company}\nStatus: ${contact.status}`);
    }
  }

  startVideoCall() {
    const contact = this.contacts.find(c => c.id === this.activeConversation);
    if (contact) {
      this.showToast(`📹 Starting video call with ${contact.name}...`);
    }
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'message-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.classList.add('active');
    });
    
    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.querySelector('.messaging-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterConversations(e.target.value);
      });
    }
  }

  filterConversations(query) {
    const items = document.querySelectorAll('.conversation-item');
    items.forEach(item => {
      const name = item.querySelector('.conversation-name').textContent.toLowerCase();
      if (name.includes(query.toLowerCase())) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Message FAB */
      .message-fab {
        position: fixed;
        bottom: 150px;
        right: 24px;
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
        border: none;
        border-radius: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(0, 122, 255, 0.3);
        z-index: 998;
        transition: all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .message-fab:hover {
        transform: scale(1.1);
        box-shadow: 0 12px 32px rgba(0, 122, 255, 0.4);
      }
      
      .message-fab-icon {
        font-size: 24px;
      }
      
      .message-fab-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        background: #ff3b30;
        color: white;
        font-size: 11px;
        font-weight: 700;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      /* Messaging Container */
      .messaging-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 380px;
        height: 600px;
        background: #000;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        z-index: 999;
        transform: scale(0) translateY(20px);
        transform-origin: bottom right;
        opacity: 0;
        visibility: hidden;
        transition: all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      }
      
      .messaging-container.active {
        transform: scale(1) translateY(0);
        opacity: 1;
        visibility: visible;
      }
      
      .messaging-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .messaging-back {
        width: 32px;
        height: 32px;
        background: transparent;
        border: none;
        color: #007aff;
        font-size: 20px;
        cursor: pointer;
        display: none;
      }
      
      .chat-view.active .messaging-back {
        display: block;
      }
      
      .messaging-title h3 {
        font-size: 18px;
        font-weight: 600;
        color: white;
        margin: 0;
      }
      
      .messaging-subtitle {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        margin: 2px 0 0 0;
      }
      
      .messaging-actions {
        display: flex;
        gap: 8px;
      }
      
      .messaging-action,
      .messaging-close {
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 50%;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 200ms ease;
      }
      
      .messaging-action:hover,
      .messaging-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      /* Search */
      .messaging-search {
        position: relative;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .messaging-search-input {
        width: 100%;
        padding: 8px 12px 8px 36px;
        background: rgba(255, 255, 255, 0.05);
        border: none;
        border-radius: 10px;
        color: white;
        font-size: 14px;
      }
      
      .messaging-search-input::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
      
      .messaging-search-icon {
        position: absolute;
        left: 28px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 16px;
      }
      
      /* Content Area */
      .messaging-content {
        flex: 1;
        position: relative;
        overflow: hidden;
      }
      
      /* Conversation List */
      .conversation-list {
        position: absolute;
        inset: 0;
        overflow-y: auto;
        display: none;
      }
      
      .conversation-list.active {
        display: block;
      }
      
      .conversation-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        cursor: pointer;
        transition: background 200ms ease;
        position: relative;
      }
      
      .conversation-item:hover {
        background: rgba(255, 255, 255, 0.05);
      }
      
      .conversation-item.unread .conversation-name {
        font-weight: 600;
      }
      
      .conversation-avatar {
        font-size: 32px;
        flex-shrink: 0;
      }
      
      .conversation-content {
        flex: 1;
        min-width: 0;
      }
      
      .conversation-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
      }
      
      .conversation-name {
        font-size: 15px;
        font-weight: 500;
        color: white;
        margin: 0;
      }
      
      .conversation-time {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
      }
      
      .conversation-preview {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .conversation-message {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.6);
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
      }
      
      .conversation-badge {
        min-width: 18px;
        height: 18px;
        padding: 0 6px;
        background: #007aff;
        color: white;
        font-size: 11px;
        font-weight: 600;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .conversation-status {
        position: absolute;
        bottom: 12px;
        left: 44px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        border: 2px solid #000;
      }
      
      .conversation-status-online {
        background: #34c759;
      }
      
      .conversation-status-away {
        background: #ff9500;
      }
      
      .conversation-status-offline {
        background: #8e8e93;
      }
      
      /* Chat View */
      .chat-view {
        position: absolute;
        inset: 0;
        display: none;
        flex-direction: column;
      }
      
      .chat-view.active {
        display: flex;
      }
      
      .chat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .chat-contact {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .chat-avatar {
        font-size: 32px;
      }
      
      .chat-contact-name {
        font-size: 15px;
        font-weight: 600;
        color: white;
        margin: 0;
      }
      
      .chat-contact-status {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        margin: 2px 0 0 0;
      }
      
      .chat-actions {
        display: flex;
        gap: 8px;
      }
      
      .chat-action {
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        transition: all 200ms ease;
      }
      
      .chat-action:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      /* Messages */
      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .chat-empty {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.4);
      }
      
      .chat-empty-icon {
        font-size: 48px;
        margin-bottom: 12px;
        opacity: 0.5;
      }
      
      .chat-message {
        display: flex;
        max-width: 70%;
      }
      
      .chat-message.own {
        align-self: flex-end;
      }
      
      .chat-bubble {
        padding: 8px 12px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.1);
        position: relative;
      }
      
      .chat-message.own .chat-bubble {
        background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
      }
      
      .chat-text {
        font-size: 14px;
        color: white;
        margin: 0;
        word-wrap: break-word;
      }
      
      .chat-time {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.6);
        margin-top: 4px;
        display: block;
      }
      
      /* Input */
      .chat-input-container {
        padding: 12px 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .chat-typing-indicator {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 12px;
        margin-bottom: 8px;
        color: rgba(255, 255, 255, 0.6);
        font-size: 12px;
      }
      
      .typing-dot {
        width: 6px;
        height: 6px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        animation: typingPulse 1.4s infinite;
      }
      
      .typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }
      
      @keyframes typingPulse {
        0%, 60%, 100% {
          opacity: 0.3;
        }
        30% {
          opacity: 1;
        }
      }
      
      .chat-input-form {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      
      .chat-attach {
        width: 32px;
        height: 32px;
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        font-size: 20px;
        cursor: pointer;
      }
      
      .chat-input {
        flex: 1;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        color: white;
        font-size: 14px;
      }
      
      .chat-input:focus {
        outline: none;
        border-color: #007aff;
      }
      
      .chat-send {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 200ms ease;
      }
      
      .chat-send:hover:not(:disabled) {
        transform: scale(1.1);
      }
      
      .chat-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      /* New Chat Modal */
      .new-chat-modal {
        position: absolute;
        inset: 0;
        background: #000;
        border-radius: 20px;
        z-index: 10;
        transform: translateY(100%);
        transition: transform 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .new-chat-modal.active {
        transform: translateY(0);
      }
      
      .new-chat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .new-chat-header h3 {
        font-size: 18px;
        font-weight: 600;
        color: white;
        margin: 0;
      }
      
      .new-chat-close {
        width: 32px;
        height: 32px;
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        font-size: 24px;
        cursor: pointer;
      }
      
      .new-chat-search {
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .new-chat-search-input {
        width: 100%;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.05);
        border: none;
        border-radius: 10px;
        color: white;
        font-size: 14px;
      }
      
      .new-chat-suggestions {
        padding: 16px;
      }
      
      .new-chat-suggestions h4 {
        font-size: 14px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.6);
        margin: 0 0 12px 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .suggested-contacts {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .suggested-contact {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .suggested-contact:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .suggested-avatar {
        font-size: 32px;
      }
      
      .suggested-info {
        flex: 1;
      }
      
      .suggested-name {
        font-size: 15px;
        font-weight: 500;
        color: white;
        margin: 0;
      }
      
      .suggested-role {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.6);
        margin: 2px 0 0 0;
      }
      
      .suggested-add {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 20px;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .suggested-add:hover {
        transform: scale(1.1);
      }
      
      /* Notification */
      .message-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        cursor: pointer;
        z-index: 1000;
        transform: translateX(400px);
        transition: transform 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .message-notification.active {
        transform: translateX(0);
      }
      
      .notification-avatar {
        font-size: 24px;
      }
      
      .notification-name {
        font-size: 14px;
        font-weight: 600;
        color: white;
        margin: 0;
      }
      
      .notification-message {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        margin: 2px 0 0 0;
      }
      
      /* Toast */
      .message-toast {
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        padding: 12px 20px;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: white;
        font-size: 14px;
        z-index: 1001;
        transition: transform 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .message-toast.active {
        transform: translateX(-50%) translateY(0);
      }
      
      /* Mobile adjustments */
      @media (max-width: 480px) {
        .messaging-container {
          width: calc(100vw - 40px);
          height: calc(100vh - 100px);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize messaging system
window.messaging = new MessagingSystem();

export default window.messaging;