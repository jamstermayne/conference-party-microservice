/**
 * ME CONTROLLER
 * User profile, settings, and account management
 */

import { Store } from '../store.js?v=b021';
import { Events } from '../events.js?v=b021';
import * as Inv from '../services/invites.js?v=b021';

export function MeController(section){
  const profile = section.querySelector('#profile');
  const invites = section.querySelector('#invites');
  const history = section.querySelector('#history');
  const privacy = section.querySelector('#privacy');

  renderProfile(); renderInvites(); renderHistory(); renderPrivacy();

  async function renderInvites(){
    const tpl = document.getElementById('tpl-invite-card');
    const node = tpl.content.firstElementChild.cloneNode(true);
    const remain = node.querySelector('#invites-remaining');
    const codeEl = node.querySelector('#invite-code');

    const s = Store.get();
    remain.textContent = s.invites.left;

    // Code generation ritual
    Events.on('invite.open', async ()=>{
      const code = await Inv.generate();
      Store.patch('invites', { left: Math.max(0, (s.invites.left||10) - 1) });
      typeIn(codeEl, code, 200);
    });

    section.addEventListener('click', async (e)=>{
      if (!e.target.closest('[data-action="invite.share"]')) return;
      const code = codeEl.textContent.trim();
      const ok = await Inv.share(code);
      if (ok) {
        remain.textContent = String(Math.max(0,(parseInt(remain.textContent)||0)-1));
        // one-shot confetti arc (minimal)
        flash(node);
      }
    });

    invites.replaceChildren(node);
  }

  function typeIn(el, text, delay=120){
    el.textContent = '';
    [...text].forEach((ch,i)=> setTimeout(()=> el.textContent += ch, i*delay));
  }
  function flash(node){
    node.animate([{ filter:'brightness(1.0)' }, { filter:'brightness(1.3)' }, { filter:'brightness(1.0)'}],
      { duration:400, easing:'ease-out' });
  }

  function renderProfile(){
    profile.innerHTML = `
      <div class="card">
        <div class="text-md" style="font-weight:700">Profile</div>
        <div class="text-sm" style="color:var(--text-secondary)">Minimal, role-forward profile. Edit coming soon.</div>
      </div>`;
  }

  function renderHistory(){
    const n = Store.get().network;
    history.innerHTML = `
      <div class="network-summary">
        <div class="network-stats">
          <div class="stat-item"><span class="stat-value">${n.connections||0}</span><span class="stat-label">Connections</span></div>
          <div class="stat-item"><span class="stat-value">${n.events||0}</span><span class="stat-label">Events</span></div>
          <div class="stat-item"><span class="stat-value">${n.messages||0}</span><span class="stat-label">Messages</span></div>
        </div>
      </div>`;
  }

  function renderPrivacy(){
    privacy.innerHTML = `
      <div class="card">
        <div class="text-md" style="font-weight:700">Privacy & Controls</div>
        <div class="text-sm" style="color:var(--text-secondary)">Defaults: City, 4h, min-3 rule.</div>
        <button class="btn" data-action="presence.edit">Edit Presence</button>
      </div>`;
  }
}

// Legacy class-based controller for backward compatibility
export default class MeControllerLegacy {
  constructor(context) {
    this.context = context;
    this.subscriptions = [];
    this.initialized = false;
    this.activeSection = 'profile';
  }

  async init() {
    if (this.initialized) return;

    try {
      // Show current view
      this.showCurrentView();
      
      // Load user data
      await this.loadUserData();
      
      // Render interface
      this.render();
      
      // Set up subscriptions
      this.setupSubscriptions();
      
      // Initialize animations
      motion.initializeView('me');
      
      // Handle query parameters (like ?action=invite)
      this.handleQueryParams();
      
      this.initialized = true;
    } catch (error) {
      console.error('Me controller initialization error:', error);
      store.actions.showError('Failed to load profile');
    }
  }

  async loadUserData() {
    try {
      // Load invite data
      const inviteData = await invites.getMyInvites();
      store.set('invites', inviteData);
      
      // Load connection history
      const connections = await api.getConnections();
      store.set('network.connections', connections);
      
      // Load event history
      const eventHistory = await api.getUserEventHistory();
      store.set('user.eventHistory', eventHistory);
      
    } catch (error) {
      console.warn('Failed to load user data:', error);
    }
  }

  showCurrentView() {
    // Show me section, hide others
    document.querySelectorAll('[data-route]').forEach(section => {
      section.hidden = section.dataset.route !== 'me';
    });
  }

  render() {
    this.renderProfile();
    this.renderInvites();
    this.renderHistory();
    this.renderPrivacySettings();
  }

  renderProfile() {
    const container = document.getElementById('profile');
    if (!container) return;

    const user = store.get('user');
    const stats = this.calculateUserStats();

    container.innerHTML = templates.profileSection({
      user,
      stats,
      isOwnProfile: true
    });
  }

  renderInvites() {
    const container = document.getElementById('invites');
    if (!container) return;

    const inviteData = store.get('invites') || {};
    const {
      myCode = null,
      remainingInvites = 10,
      usedInvites = [],
      inviteStats = { sent: 0, accepted: 0, pending: 0 }
    } = inviteData;

    container.innerHTML = templates.inviteSection({
      code: myCode,
      remaining: remainingInvites,
      used: usedInvites,
      stats: inviteStats
    });

    // Add sharing functionality
    this.setupInviteSharing(container);
  }

  renderHistory() {
    const container = document.getElementById('history');
    if (!container) return;

    const eventHistory = store.get('user.eventHistory') || [];
    const connections = store.get('network.connections') || [];
    
    container.innerHTML = templates.historySection({
      events: eventHistory.slice(0, 10), // Show last 10 events
      connections: connections.slice(0, 5), // Show recent connections
      totalEvents: eventHistory.length,
      totalConnections: connections.length
    });
  }

  renderPrivacySettings() {
    const container = document.getElementById('privacy');
    if (!container) return;

    const preferences = store.get('user.preferences') || {};

    container.innerHTML = templates.privacySection({
      proximityEnabled: store.get('proximity.enabled'),
      opportunitiesEnabled: store.get('user.opportunityIntent'),
      notificationsEnabled: preferences.notifications,
      theme: preferences.theme || 'dark'
    });
  }

  calculateUserStats() {
    const connections = store.get('network.connections') || [];
    const eventHistory = store.get('user.eventHistory') || [];
    const inviteStats = store.get('invites.inviteStats') || {};
    
    return {
      connectionsCount: connections.length,
      eventsAttended: eventHistory.length,
      invitesSent: inviteStats.sent || 0,
      level: store.get('user.level') || 'starter',
      score: store.get('user.score') || 0
    };
  }

  setupInviteSharing(container) {
    const shareButtons = container.querySelectorAll('[data-action^="invite.share"]');
    
    shareButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        const platform = e.target.dataset.action.split('.')[2];
        await this.shareInvite(platform);
      });
    });

    // Copy code button
    const copyButton = container.querySelector('[data-action="invite.copy"]');
    if (copyButton) {
      copyButton.addEventListener('click', () => this.copyInviteCode());
    }

    // Generate new code button
    const generateButton = container.querySelector('[data-action="invite.generate"]');
    if (generateButton) {
      generateButton.addEventListener('click', () => this.generateNewInviteCode());
    }
  }

  async shareInvite(platform) {
    try {
      const inviteCode = store.get('invites.myCode');
      if (!inviteCode) {
        store.actions.showError('No invite code available');
        return;
      }

      const shareContent = await invites.generateShareContent(inviteCode, platform);
      
      switch (platform) {
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(shareContent.message)}`);
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareContent.message)}`);
          break;
        case 'linkedin':
          window.open(`https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareContent.url)}`);
          break;
        case 'native':
          if (navigator.share) {
            await navigator.share({
              title: shareContent.title,
              text: shareContent.message,
              url: shareContent.url
            });
          }
          break;
      }
      
      store.actions.showNotification('Invite shared! 🚀');
      
    } catch (error) {
      store.actions.showError('Failed to share invite');
    }
  }

  async copyInviteCode() {
    try {
      const inviteCode = store.get('invites.myCode');
      if (!inviteCode) {
        store.actions.showError('No invite code available');
        return;
      }

      await navigator.clipboard.writeText(inviteCode);
      store.actions.showNotification('Invite code copied! 📋');
      
      // Animate button
      const button = document.querySelector('[data-action="invite.copy"]');
      if (button) {
        motion.animate(button, {
          transform: ['scale(1)', 'scale(1.1)', 'scale(1)']
        }, { duration: 200 });
      }
      
    } catch (error) {
      store.actions.showError('Failed to copy invite code');
    }
  }

  async generateNewInviteCode() {
    try {
      const result = await invites.generateNewCode();
      if (result.success) {
        store.set('invites.myCode', result.code);
        this.renderInvites(); // Re-render invites section
        store.actions.showNotification('New invite code generated! ✨');
      }
    } catch (error) {
      store.actions.showError('Failed to generate new code');
    }
  }

  setupSubscriptions() {
    // Update when user data changes
    this.subscriptions.push(
      store.subscribe('user', () => this.renderProfile()),
      store.subscribe('invites', () => this.renderInvites()),
      store.subscribe('network.connections', () => this.renderHistory()),
      store.subscribe('user.preferences', () => this.renderPrivacySettings())
    );

    // Handle settings changes
    document.addEventListener('change', (e) => {
      if (e.target.matches('[data-setting]')) {
        this.handleSettingChange(e.target.dataset.setting, e.target);
      }
    });

    // Handle profile actions
    document.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action?.startsWith('profile.')) {
        this.handleProfileAction(action.split('.')[1], e);
      }
    });
  }

  async handleSettingChange(setting, element) {
    const value = element.type === 'checkbox' ? element.checked : element.value;
    
    try {
      switch (setting) {
        case 'proximity':
          store.set('proximity.enabled', value);
          if (value) {
            const { proximity } = await import('../services/proximity.js?v=b021');
            await proximity.requestPermission();
            proximity.startTracking();
          } else {
            const { proximity } = await import('../services/proximity.js?v=b021');
            proximity.stopTracking();
          }
          break;
          
        case 'opportunities':
          store.set('user.opportunityIntent', value);
          break;
          
        case 'notifications':
          store.set('user.preferences.notifications', value);
          break;
          
        case 'theme':
          store.actions.setTheme(value);
          break;
      }
      
      // Sync with server
      await api.updateUserPreferences({
        [setting]: value
      });
      
      store.actions.showNotification('Settings updated ⚙️');
      
    } catch (error) {
      console.error('Failed to update setting:', error);
      // Revert UI change
      if (element.type === 'checkbox') {
        element.checked = !value;
      } else {
        element.value = store.get(`user.preferences.${setting}`);
      }
      store.actions.showError('Failed to update settings');
    }
  }

  async handleProfileAction(action, event) {
    switch (action) {
      case 'edit':
        this.editProfile();
        break;
      case 'export':
        await this.exportData();
        break;
      case 'delete':
        this.showDeleteAccountDialog();
        break;
    }
  }

  editProfile() {
    const user = store.get('user');
    store.actions.openModal({
      type: 'profileEdit',
      data: user,
      onSubmit: async (profileData) => {
        try {
          await api.updateProfile(profileData);
          store.actions.setUser(profileData);
          store.actions.showNotification('Profile updated! ✨');
        } catch (error) {
          store.actions.showError('Failed to update profile');
        }
      }
    });
  }

  async exportData() {
    try {
      const userData = await api.exportUserData();
      
      // Create download link
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `pronet-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      
      store.actions.showNotification('Data exported! 📄');
      
    } catch (error) {
      store.actions.showError('Failed to export data');
    }
  }

  showDeleteAccountDialog() {
    store.actions.openModal({
      type: 'confirmDelete',
      data: {
        title: 'Delete Account',
        message: 'This will permanently delete your account and all associated data. This cannot be undone.',
        confirmText: 'Delete Forever',
        onConfirm: async () => {
          try {
            await api.deleteAccount();
            store.reset();
            window.location.href = '/#/goodbye';
          } catch (error) {
            store.actions.showError('Failed to delete account');
          }
        }
      }
    });
  }

  handleQueryParams() {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const action = params.get('action');
    
    if (action === 'invite') {
      // Scroll to invites section
      setTimeout(() => {
        const invitesSection = document.getElementById('invites');
        if (invitesSection) {
          invitesSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  }

  destroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
    
    this.initialized = false;
  }
}