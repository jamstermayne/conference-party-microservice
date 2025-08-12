// Account section - read-only profile + auth buttons
const Store = window.Store || { get: () => null, set: () => {} };

export function renderAccount() {
  const main = document.getElementById('main') || document.getElementById('page-root');
  if (!main) return;
  
  // Get stored data (placeholders for now)
  const profile = Store.get('profile') || {};
  const invites = Store.get('invites') || {};
  
  main.innerHTML = `
    <section class="panel">
      <div class="panel-head">
        <h2>Account</h2>
        <p class="subtle">Manage your profile and settings</p>
      </div>
      
      <div class="account-sections">
        <!-- Profile Card -->
        <div class="account-card">
          <h3 class="card-title">Profile</h3>
          <div class="profile-info">
            <div class="info-row">
              <span class="info-label">Email</span>
              <span class="info-value">${profile.email || 'Not connected'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone</span>
              <span class="info-value">${profile.phone || 'Not set'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Company</span>
              <span class="info-value">${profile.company || 'Not set'}</span>
            </div>
          </div>
        </div>
        
        <!-- Invites Card -->
        <div class="account-card">
          <h3 class="card-title">Invites</h3>
          <div class="invite-stats">
            <div class="stat">
              <div class="stat-value">${invites.sent || 0}</div>
              <div class="stat-label">Sent</div>
            </div>
            <div class="stat">
              <div class="stat-value">${invites.redeemed || 0}</div>
              <div class="stat-label">Redeemed</div>
            </div>
            <div class="stat">
              <div class="stat-value">${invites.remaining || 10}</div>
              <div class="stat-label">Left</div>
            </div>
          </div>
        </div>
        
        <!-- Auth Card -->
        <div class="account-card">
          <h3 class="card-title">Connect Accounts</h3>
          <div class="auth-buttons">
            <button class="auth-btn google" data-auth="google">
              <span class="auth-icon">G</span>
              Sign in with Google
            </button>
            <button class="auth-btn linkedin" data-auth="linkedin">
              <span class="auth-icon">in</span>
              Sign in with LinkedIn
            </button>
          </div>
        </div>
      </div>
    </section>
    
    <style>
      .account-sections {
        display: grid;
        gap: 20px;
        margin-top: 24px;
      }
      
      .account-card {
        background: rgba(26, 29, 36, 0.5);
        border: 1px solid rgba(107, 123, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
      }
      
      .card-title {
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 16px;
      }
      
      .profile-info {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .info-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid rgba(107, 123, 255, 0.05);
      }
      
      .info-row:last-child {
        border-bottom: none;
      }
      
      .info-label {
        color: #6b7280;
        font-size: 14px;
      }
      
      .info-value {
        color: #ffffff;
        font-size: 14px;
        font-weight: 500;
      }
      
      .invite-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        text-align: center;
      }
      
      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: #6b7bff;
      }
      
      .stat-label {
        font-size: 12px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 4px;
      }
      
      .auth-buttons {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .auth-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 12px 20px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.05);
        color: #ffffff;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .auth-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-1px);
      }
      
      .auth-btn.google {
        border-color: rgba(66, 133, 244, 0.3);
      }
      
      .auth-btn.google:hover {
        background: rgba(66, 133, 244, 0.1);
      }
      
      .auth-btn.linkedin {
        border-color: rgba(0, 119, 181, 0.3);
      }
      
      .auth-btn.linkedin:hover {
        background: rgba(0, 119, 181, 0.1);
      }
      
      .auth-icon {
        font-weight: 700;
        font-size: 16px;
      }
      
      @media (min-width: 768px) {
        .account-sections {
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }
      }
    </style>
  `;
  
  // Wire up auth buttons
  main.addEventListener('click', (e) => {
    const authBtn = e.target.closest('[data-auth]');
    if (authBtn) {
      const provider = authBtn.dataset.auth;
      console.log(`Auth with ${provider} clicked`);
      // TODO: Implement actual auth flow
      alert(`${provider} authentication coming soon!`);
    }
  });
}

export default { renderAccount };