/**
 * Chat Interface Component
 * Real-time messaging UI with AI-powered features
 */

class ChatInterface extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.chatSystem = window.RealTimeChatSystem;
    this.currentConversation = null;
    this.currentMessages = [];
    this.typingTimeout = null;
    this.unsubscribe = null;
  }
  
  connectedCallback() {
    this.render();
    this.setupEventListeners();
    
    // Load conversation if ID provided
    const conversationId = this.getAttribute('conversation-id');
    if (conversationId) {
      this.loadConversation(conversationId);
    }
  }
  
  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-surface, #0b0f14);
          border-radius: var(--r-3, 12px);
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .chat-header {
          display: flex;
          align-items: center;
          padding: var(--s-4, 16px);
          background: var(--color-bg, #12151b);
          border-bottom: 1px solid var(--color-border, #1e2128);
        }
        
        .participant-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: var(--s-3, 12px);
        }
        
        .participant-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-accent), var(--color-purple));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
        }
        
        .participant-details {
          flex: 1;
        }
        
        .participant-name {
          font-weight: 600;
          color: var(--color-text, #e8eaed);
          margin-bottom: 2px;
        }
        
        .participant-status {
          font-size: 0.875rem;
          color: var(--color-text-dim, #9aa0a6);
        }
        
        .status-indicator {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 4px;
        }
        
        .status-indicator.online {
          background: var(--color-success, #34c759);
        }
        
        .status-indicator.typing {
          background: var(--color-accent);
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        .chat-actions {
          display: flex;
          gap: var(--s-2, 8px);
        }
        
        .action-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--color-bg, #12151b);
          border: 1px solid var(--color-border, #1e2128);
          color: var(--color-text-dim, #9aa0a6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .action-btn:hover {
          background: var(--color-surface, #0b0f14);
          color: var(--color-text, #e8eaed);
        }
        
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: var(--s-4, 16px);
          display: flex;
          flex-direction: column;
          gap: var(--s-3, 12px);
        }
        
        .conversation-starters {
          display: flex;
          flex-direction: column;
          gap: var(--s-2, 8px);
          padding: var(--s-4, 16px);
          background: var(--color-bg, #12151b);
          border-radius: var(--r-2, 8px);
          margin-bottom: var(--s-4, 16px);
        }
        
        .starters-title {
          font-size: 0.875rem;
          color: var(--color-text-dim, #9aa0a6);
          margin-bottom: var(--s-2, 8px);
        }
        
        .starter-option {
          padding: var(--s-3, 12px);
          background: var(--color-surface, #0b0f14);
          border: 1px solid var(--color-border, #1e2128);
          border-radius: var(--r-2, 8px);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .starter-option:hover {
          background: var(--color-bg, #12151b);
          border-color: var(--color-accent);
        }
        
        .starter-text {
          color: var(--color-text, #e8eaed);
          font-size: 0.9375rem;
          line-height: 1.4;
        }
        
        .starter-reasoning {
          font-size: 0.75rem;
          color: var(--color-text-dim, #9aa0a6);
          margin-top: 4px;
          font-style: italic;
        }
        
        .message {
          display: flex;
          gap: var(--s-2, 8px);
          max-width: 70%;
          animation: slideIn 0.3s ease-out;
        }
        
        .message.sent {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        
        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-accent), var(--color-purple));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          flex-shrink: 0;
        }
        
        .message-content {
          background: var(--color-bg, #12151b);
          padding: var(--s-3, 12px);
          border-radius: var(--r-2, 8px);
          position: relative;
        }
        
        .message.sent .message-content {
          background: var(--color-accent);
          color: white;
        }
        
        .message-text {
          font-size: 0.9375rem;
          line-height: 1.4;
          word-wrap: break-word;
        }
        
        .message-time {
          font-size: 0.75rem;
          color: var(--color-text-dim, #9aa0a6);
          margin-top: 4px;
        }
        
        .message.sent .message-time {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .message-status {
          display: inline-block;
          margin-left: 4px;
          font-size: 0.75rem;
        }
        
        .message-reactions {
          display: flex;
          gap: 4px;
          margin-top: 4px;
          flex-wrap: wrap;
        }
        
        .reaction {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 2px 6px;
          background: var(--color-surface, #0b0f14);
          border-radius: 12px;
          font-size: 0.875rem;
          cursor: pointer;
        }
        
        .reaction-emoji {
          font-size: 1rem;
        }
        
        .reaction-count {
          font-size: 0.75rem;
          color: var(--color-text-dim, #9aa0a6);
        }
        
        .input-container {
          padding: var(--s-4, 16px);
          background: var(--color-bg, #12151b);
          border-top: 1px solid var(--color-border, #1e2128);
        }
        
        .smart-replies {
          display: flex;
          gap: var(--s-2, 8px);
          margin-bottom: var(--s-3, 12px);
          flex-wrap: wrap;
        }
        
        .smart-reply {
          padding: var(--s-2, 8px) var(--s-3, 12px);
          background: var(--color-surface, #0b0f14);
          border: 1px solid var(--color-border, #1e2128);
          border-radius: 20px;
          font-size: 0.875rem;
          color: var(--color-text, #e8eaed);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .smart-reply:hover {
          background: var(--color-accent);
          color: white;
          border-color: var(--color-accent);
        }
        
        .input-row {
          display: flex;
          gap: var(--s-2, 8px);
          align-items: flex-end;
        }
        
        .message-input {
          flex: 1;
          min-height: 40px;
          max-height: 120px;
          padding: var(--s-2, 8px) var(--s-3, 12px);
          background: var(--color-surface, #0b0f14);
          border: 1px solid var(--color-border, #1e2128);
          border-radius: 20px;
          color: var(--color-text, #e8eaed);
          font-size: 0.9375rem;
          resize: none;
          outline: none;
        }
        
        .message-input:focus {
          border-color: var(--color-accent);
        }
        
        .send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--color-accent);
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .send-btn:hover {
          transform: scale(1.1);
        }
        
        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      </style>
      
      <div class="chat-header">
        <div class="participant-info">
          <div class="participant-avatar">
            <span class="avatar-initial">?</span>
          </div>
          <div class="participant-details">
            <div class="participant-name">Select a conversation</div>
            <div class="participant-status">
              <span class="status-indicator"></span>
              <span class="status-text">Offline</span>
            </div>
          </div>
        </div>
        <div class="chat-actions">
          <button class="action-btn video-btn" title="Video call">
            📹
          </button>
          <button class="action-btn info-btn" title="Conversation info">
            ℹ️
          </button>
        </div>
      </div>
      
      <div class="messages-container">
        <div class="conversation-starters" style="display: none;">
          <div class="starters-title">💡 Conversation starters</div>
        </div>
      </div>
      
      <div class="input-container">
        <div class="smart-replies" style="display: none;"></div>
        <div class="input-row">
          <textarea 
            class="message-input" 
            placeholder="Type a message..."
            rows="1"
          ></textarea>
          <button class="send-btn" disabled>
            ➤
          </button>
        </div>
      </div>
    `;
  }
  
  setupEventListeners() {
    const input = this.shadowRoot.querySelector('.message-input');
    const sendBtn = this.shadowRoot.querySelector('.send-btn');
    
    // Handle input changes
    input.addEventListener('input', () => {
      sendBtn.disabled = !input.value.trim();
      this.handleTyping();
      this.autoResizeInput();
    });
    
    // Handle send
    sendBtn.addEventListener('click', () => this.sendMessage());
    
    // Handle enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (input.value.trim()) {
          this.sendMessage();
        }
      }
    });
  }
  
  async loadConversation(conversationId) {
    this.currentConversation = conversationId;
    
    // Get conversation details
    const [participant1, participant2] = conversationId.split('_');
    const userId = this.chatSystem.userId;
    const otherParticipant = participant1 === userId ? participant2 : participant1;
    
    // Update header
    await this.updateHeader(otherParticipant);
    
    // Subscribe to messages
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    this.unsubscribe = this.chatSystem.subscribeToMessages(
      conversationId,
      (messages) => this.displayMessages(messages)
    );
    
    // Load conversation starters if no messages
    const messages = this.chatSystem.loadMessages(conversationId);
    if (messages.length === 0) {
      this.showConversationStarters(conversationId);
    }
    
    // Generate smart replies for recent messages
    if (messages.length > 0) {
      this.generateSmartReplies(messages);
    }
  }
  
  async updateHeader(participantId) {
    const profile = await this.chatSystem.getUserProfile(participantId);
    
    const avatar = this.shadowRoot.querySelector('.participant-avatar');
    const name = this.shadowRoot.querySelector('.participant-name');
    const statusIndicator = this.shadowRoot.querySelector('.status-indicator');
    const statusText = this.shadowRoot.querySelector('.status-text');
    
    avatar.querySelector('.avatar-initial').textContent = profile.name[0].toUpperCase();
    name.textContent = profile.name;
    
    // Mock online status
    const isOnline = Math.random() > 0.5;
    statusIndicator.className = `status-indicator ${isOnline ? 'online' : ''}`;
    statusText.textContent = isOnline ? 'Online' : 'Last seen recently';
  }
  
  displayMessages(messages) {
    this.currentMessages = messages;
    const container = this.shadowRoot.querySelector('.messages-container');
    const startersDiv = container.querySelector('.conversation-starters');
    
    // Hide starters if messages exist
    if (messages.length > 0) {
      startersDiv.style.display = 'none';
    }
    
    // Clear existing messages (except starters)
    const existingMessages = container.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Display messages
    messages.forEach(message => {
      const messageEl = this.createMessageElement(message);
      container.appendChild(messageEl);
    });
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }
  
  createMessageElement(message) {
    const userId = this.chatSystem.userId;
    const isSent = message.senderId === userId;
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${isSent ? 'sent' : 'received'}`;
    messageEl.dataset.messageId = message.id;
    
    const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
    
    const statusIcon = message.status === 'delivered' ? '✓✓' : 
                      message.status === 'sent' ? '✓' : 
                      message.status === 'sending' ? '⏱' : '❌';
    
    messageEl.innerHTML = `
      <div class="message-avatar">
        <span>${message.senderId.substr(0, 1).toUpperCase()}</span>
      </div>
      <div class="message-content">
        <div class="message-text">${this.escapeHtml(message.content)}</div>
        <div class="message-time">
          ${time}
          ${isSent ? `<span class="message-status">${statusIcon}</span>` : ''}
        </div>
        ${message.reactions?.length > 0 ? this.renderReactions(message.reactions) : ''}
      </div>
    `;
    
    // Add click handler for reactions
    messageEl.addEventListener('click', (e) => {
      if (!e.target.closest('.reaction')) {
        this.showReactionPicker(message.id);
      }
    });
    
    return messageEl;
  }
  
  renderReactions(reactions) {
    const grouped = {};
    reactions.forEach(r => {
      grouped[r.emoji] = (grouped[r.emoji] || 0) + 1;
    });
    
    return `
      <div class="message-reactions">
        ${Object.entries(grouped).map(([emoji, count]) => `
          <span class="reaction">
            <span class="reaction-emoji">${emoji}</span>
            ${count > 1 ? `<span class="reaction-count">${count}</span>` : ''}
          </span>
        `).join('')}
      </div>
    `;
  }
  
  async showConversationStarters(conversationId) {
    const starters = await this.chatSystem.generateConversationStarters(
      conversationId,
      this.chatSystem.userId
    );
    
    const startersDiv = this.shadowRoot.querySelector('.conversation-starters');
    startersDiv.style.display = 'flex';
    
    // Clear existing starters
    const existing = startersDiv.querySelectorAll('.starter-option');
    existing.forEach(el => el.remove());
    
    // Add new starters
    starters.forEach(starter => {
      const starterEl = document.createElement('div');
      starterEl.className = 'starter-option';
      starterEl.innerHTML = `
        <div class="starter-text">${starter.starter}</div>
        <div class="starter-reasoning">${starter.reasoning}</div>
      `;
      
      starterEl.addEventListener('click', () => {
        this.shadowRoot.querySelector('.message-input').value = starter.starter;
        this.sendMessage();
        startersDiv.style.display = 'none';
      });
      
      startersDiv.appendChild(starterEl);
    });
  }
  
  async generateSmartReplies(messages) {
    const lastMessages = messages.slice(-5);
    const replies = await this.chatSystem.generateSmartReply(
      this.currentConversation,
      this.chatSystem.userId,
      lastMessages
    );
    
    const repliesDiv = this.shadowRoot.querySelector('.smart-replies');
    repliesDiv.innerHTML = '';
    
    if (replies.length > 0) {
      repliesDiv.style.display = 'flex';
      
      replies.forEach(reply => {
        const replyEl = document.createElement('button');
        replyEl.className = 'smart-reply';
        replyEl.textContent = reply;
        
        replyEl.addEventListener('click', () => {
          this.shadowRoot.querySelector('.message-input').value = reply;
          this.sendMessage();
          repliesDiv.style.display = 'none';
        });
        
        repliesDiv.appendChild(replyEl);
      });
    } else {
      repliesDiv.style.display = 'none';
    }
  }
  
  async sendMessage() {
    const input = this.shadowRoot.querySelector('.message-input');
    const content = input.value.trim();
    
    if (!content || !this.currentConversation) return;
    
    // Send message
    await this.chatSystem.sendMessage(
      this.currentConversation,
      this.chatSystem.userId,
      content
    );
    
    // Clear input
    input.value = '';
    this.shadowRoot.querySelector('.send-btn').disabled = true;
    this.autoResizeInput();
    
    // Hide smart replies
    this.shadowRoot.querySelector('.smart-replies').style.display = 'none';
    
    // Generate new smart replies after a delay
    setTimeout(() => {
      this.generateSmartReplies(this.currentMessages);
    }, 1000);
  }
  
  handleTyping() {
    if (!this.currentConversation) return;
    
    // Send typing indicator
    this.chatSystem.sendTypingIndicator(this.currentConversation, true);
    
    // Clear previous timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    // Set timeout to stop typing
    this.typingTimeout = setTimeout(() => {
      this.chatSystem.sendTypingIndicator(this.currentConversation, false);
    }, 2000);
  }
  
  autoResizeInput() {
    const input = this.shadowRoot.querySelector('.message-input');
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }
  
  showReactionPicker(messageId) {
    // Simple emoji picker
    const emojis = ['👍', '❤️', '😂', '😮', '🔥', '👏'];
    
    // Create picker UI (simplified for demo)
    const picker = document.createElement('div');
    picker.style.cssText = `
      position: fixed;
      background: var(--color-surface, #0b0f14);
      border: 1px solid var(--color-border, #1e2128);
      border-radius: 8px;
      padding: 8px;
      display: flex;
      gap: 8px;
      z-index: 1000;
    `;
    
    emojis.forEach(emoji => {
      const btn = document.createElement('button');
      btn.textContent = emoji;
      btn.style.cssText = `
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 4px;
      `;
      
      btn.addEventListener('click', () => {
        this.chatSystem.addReaction(
          this.currentConversation,
          messageId,
          this.chatSystem.userId,
          emoji
        );
        picker.remove();
      });
      
      picker.appendChild(btn);
    });
    
    // Position near message
    const messageEl = this.shadowRoot.querySelector(`[data-message-id="${messageId}"]`);
    const rect = messageEl.getBoundingClientRect();
    picker.style.left = rect.left + 'px';
    picker.style.top = (rect.bottom + 5) + 'px';
    
    document.body.appendChild(picker);
    
    // Remove on click outside
    setTimeout(() => {
      document.addEventListener('click', () => picker.remove(), { once: true });
    }, 100);
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Register custom element
customElements.define('chat-interface', ChatInterface);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatInterface;
}