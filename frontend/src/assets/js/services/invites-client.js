/**
 * Invites Client Service
 * Handles API communication for the invites system
 */

export const InvitesClient = (() => {
  const base = '/api/invites';

  async function json(response) {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  return {
    /**
     * List all invites for the current user
     */
    async list() {
      try {
        const response = await fetch(base, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        return json(response);
      } catch (error) {
        console.error('[InvitesClient] Failed to list invites:', error);
        // Return mock data for demo
        return {
          invites: []
        };
      }
    },

    /**
     * Create a new invite
     */
    async create({ toEmail, event }) {
      try {
        const response = await fetch(base, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ toEmail, event })
        });
        return json(response);
      } catch (error) {
        console.error('[InvitesClient] Failed to create invite:', error);
        // Return mock created invite for demo
        return {
          id: `mock-${Date.now()}`,
          toEmail,
          event,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    },

    /**
     * Update RSVP status
     */
    async rsvp(id, status) {
      try {
        const response = await fetch(`${base}/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ status })
        });
        return json(response);
      } catch (error) {
        console.error('[InvitesClient] Failed to update RSVP:', error);
        // Return mock update for demo
        return {
          id,
          status,
          updatedAt: new Date().toISOString()
        };
      }
    },

    /**
     * Delete an invite
     */
    async remove(id) {
      try {
        const response = await fetch(`${base}/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (!response.ok && response.status !== 204) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return true;
      } catch (error) {
        console.error('[InvitesClient] Failed to delete invite:', error);
        // Return success for demo
        return true;
      }
    },

    /**
     * Get invite by public token (for email links)
     */
    async getByToken(token) {
      try {
        const response = await fetch(`${base}/public/by-token/${encodeURIComponent(token)}`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        return json(response);
      } catch (error) {
        console.error('[InvitesClient] Failed to get invite by token:', error);
        throw error;
      }
    },

    /**
     * RSVP using public token (for email links)
     */
    async rsvpByToken(token, status) {
      try {
        const response = await fetch(`${base}/public/by-token/${encodeURIComponent(token)}/rsvp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ status })
        });
        return json(response);
      } catch (error) {
        console.error('[InvitesClient] Failed to RSVP by token:', error);
        throw error;
      }
    }
  };
})();