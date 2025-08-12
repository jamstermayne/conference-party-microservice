/**
 * Account section aggregator
 * Shows: contacts, invites, email, tel, LinkedIn, password actions
 */
export function initAccountSection() {
  const el = document.getElementById('account-section');
  if (!el) return;

  // Dummy data fetch — replace with real API
  const data = {
    contacts: 42,
    invitesSent: 10,
    invitesRedeemed: 4,
    invitesLeft: 6,
    email: 'user@example.com',
    telephone: '+44 7700 900123',
    linkedin: 'https://linkedin.com/in/example'
  };

  el.innerHTML = `
    <h2>Account Overview</h2>
    <div class="info-row"><span>Contacts</span><span>${data.contacts}</span></div>
    <div class="info-row"><span>Invites Sent</span><span>${data.invitesSent}</span></div>
    <div class="info-row"><span>Invites Redeemed</span><span>${data.invitesRedeemed}</span></div>
    <div class="info-row"><span>Invites Left</span><span>${data.invitesLeft}</span></div>
    <div class="info-row"><span>Email</span><span>${data.email}</span></div>
    <div class="info-row"><span>Telephone</span><span>${data.telephone}</span></div>
    <div class="info-row"><span>LinkedIn</span><a href="${data.linkedin}" target="_blank">View</a></div>
    <button id="add-email-btn">Add Email Account</button>
    <button id="change-password-btn">Change Password</button>
  `;

  el.querySelector('#add-email-btn').addEventListener('click', () => {
    alert('Add Email flow...');
  });
  el.querySelector('#change-password-btn').addEventListener('click', () => {
    alert('Change Password flow...');
  });
}