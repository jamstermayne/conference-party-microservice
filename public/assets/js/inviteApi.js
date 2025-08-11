// Simple Invite API module for direct backend calls
export async function fetchInviteDetails(code) {
  if (!code) {
    throw new Error('Invite code is required');
  }
  
  try {
    const res = await fetch(`/api/invites/status?code=${encodeURIComponent(code)}`);
    
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Invite not found');
      }
      if (res.status === 410) {
        throw new Error('Invite has expired');
      }
      throw new Error(`Failed to fetch invite: ${res.status}`);
    }
    
    const data = await res.json();
    return {
      valid: true,
      ...data
    };
  } catch (error) {
    console.error('Error fetching invite details:', error);
    throw error;
  }
}

export async function redeemInvite(code) {
  if (!code) {
    throw new Error('Invite code is required');
  }
  
  try {
    const res = await fetch(`/api/invites/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code }),
      credentials: 'include' // Include cookies for auth
    });
    
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Invite not found');
      }
      if (res.status === 410) {
        throw new Error('Invite has expired');
      }
      if (res.status === 409) {
        throw new Error('Invite already redeemed');
      }
      if (res.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error(`Failed to redeem invite: ${res.status}`);
    }
    
    const data = await res.json();
    return {
      success: true,
      ...data
    };
  } catch (error) {
    console.error('Error redeeming invite:', error);
    throw error;
  }
}

// Additional helper functions
export async function validateInviteCode(code) {
  try {
    const details = await fetchInviteDetails(code);
    return {
      valid: true,
      ...details
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

export async function trackInviteView(code) {
  try {
    await fetch(`/api/referral/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, action: 'view' })
    });
  } catch (error) {
    console.warn('Failed to track invite view:', error);
  }
}

export async function getMyInvites() {
  try {
    const res = await fetch('/api/invites/me', {
      credentials: 'include'
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch user invites');
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching user invites:', error);
    throw error;
  }
}

export async function sendInvite(email, message) {
  try {
    const res = await fetch('/api/invites/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, message })
    });
    
    if (!res.ok) {
      if (res.status === 400) {
        throw new Error('Invalid email address');
      }
      if (res.status === 429) {
        throw new Error('Too many invites sent. Please try again later.');
      }
      throw new Error('Failed to send invite');
    }
    
    return res.json();
  } catch (error) {
    console.error('Error sending invite:', error);
    throw error;
  }
}