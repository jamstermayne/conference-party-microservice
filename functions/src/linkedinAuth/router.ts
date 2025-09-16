import { Router } from 'express';
import axios from 'axios';
import { ensureSession, saveTokens, loadTokens, clearTokens } from '../lib/session';
import { createState, consumeState } from '../lib/oauthState';

// eslint-disable-next-line new-cap
const router = Router();

const HOSTING_ORIGIN = process.env['HOSTING_ORIGIN'] || 'https://conference-party-app.web.app';

function baseUrl(req: any) {
  const proto = (req.get('x-forwarded-proto') || 'https').toLowerCase();
  const host  = (req.get('x-forwarded-host') || req.get('host')).toLowerCase();
  return `${proto}://${host}`;
}

// LinkedIn OAuth configuration - check both secrets and env vars for compatibility
function getLinkedInCredentials() {
  // First try Firebase secrets (accessed at runtime)
  const secretId = process.env['LINKEDIN_CLIENT_ID'] || '';
  const secretSecret = process.env['LINKEDIN_CLIENT_SECRET'] || '';
  
  // Return credentials if available
  if (secretId && secretSecret) {
    return { clientId: secretId, clientSecret: secretSecret };
  }
  
  // Fallback to environment variables for local development
  const envId = process.env['LINKEDIN_CLIENT_ID'];
  const envSecret = process.env['LINKEDIN_CLIENT_SECRET'];
  
  if (envId && envSecret) {
    return { clientId: envId, clientSecret: envSecret };
  }
  
  return null;
}

// LinkedIn OAuth URLs
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_PROFILE_URL = 'https://api.linkedin.com/v2/userinfo';

async function getAuthenticatedClient(sid: string) {
  const tokens = await loadTokens(sid, 'linkedin');
  if (!tokens) return null;
  
  // LinkedIn tokens don't expire as quickly as Google tokens
  // but we should still check if we have a valid access token
  if (!tokens['access_token']) {
    return null;
  }
  
  return tokens;
}

// ---- status endpoint
router.get('/linkedin/status', async (req: any, res: any) => {
  try {
    const sid = req.cookies?.sid;
    if (!sid) {
      return res.json({ connected: false });
    }
    
    const tokens = await getAuthenticatedClient(sid);
    res.json({ connected: !!tokens });
  } catch (e) {
    console.error('[linkedin] Status check error:', e);
    res.json({ connected: false });
  }
});

// ---- start OAuth flow
router.get('/linkedin/start', async (req: any, res: any) => {
  const credentials = getLinkedInCredentials();
  
  if (!credentials) {
    // Return HTML response for better user experience
    return res
      .status(200)
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="dark light">
  <title>LinkedIn Setup Required</title>
  <style>
    body {
      font: 14px system-ui, -apple-system, sans-serif;
      padding: 32px;
      max-width: 600px;
      margin: 0 auto;
      background: #0a0a0a;
      color: #fff;
    }
    .notice {
      background: linear-gradient(135deg, #0077b5 0%, #00a0dc 100%);
      color: white;
      padding: 24px;
      border-radius: 12px;
      margin: 32px 0;
    }
    .notice h2 {
      margin: 0 0 12px 0;
      font-size: 20px;
    }
    .notice p {
      margin: 8px 0;
      opacity: 0.95;
      line-height: 1.5;
    }
    .steps {
      background: rgba(255,255,255,0.05);
      padding: 20px;
      border-radius: 8px;
      margin: 24px 0;
    }
    .steps h3 {
      margin: 0 0 16px 0;
      color: #00a0dc;
    }
    .steps ol {
      margin: 0;
      padding-left: 24px;
      line-height: 1.8;
    }
    .steps li {
      margin: 8px 0;
    }
    .steps code {
      background: rgba(0,0,0,0.3);
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 13px;
    }
    .return-link {
      text-align: center;
      margin-top: 32px;
    }
    .return-link a {
      color: #00a0dc;
      text-decoration: none;
      padding: 12px 24px;
      border: 1px solid #00a0dc;
      border-radius: 8px;
      display: inline-block;
      transition: all 0.2s;
    }
    .return-link a:hover {
      background: rgba(0,160,220,0.1);
    }
  </style>
</head>
<body>
  <div class="notice">
    <h2>LinkedIn Authentication Coming Soon</h2>
    <p>LinkedIn OAuth integration requires API credentials that haven't been configured yet.</p>
    <p>This feature will be available once the LinkedIn App is set up.</p>
  </div>
  
  <div class="steps">
    <h3>Setup Instructions (for administrators):</h3>
    <ol>
      <li>Go to <a href="https://www.linkedin.com/developers/" target="_blank" style="color:#00a0dc">LinkedIn Developers</a></li>
      <li>Create a new app or select an existing one</li>
      <li>Add OAuth 2.0 redirect URL:<br>
        <code>https://us-central1-conference-party-app.cloudfunctions.net/api/linkedin/callback</code>
      </li>
      <li>Request scopes: <code>openid profile email</code></li>
      <li>Save the Client ID and Client Secret</li>
      <li>Add to Firebase secrets:<br>
        <code>firebase functions:secrets:set LINKEDIN_CLIENT_ID</code><br>
        <code>firebase functions:secrets:set LINKEDIN_CLIENT_SECRET</code>
      </li>
      <li>Deploy functions: <code>firebase deploy --only functions</code></li>
    </ol>
  </div>
  
  <div class="return-link">
    <a href="${HOSTING_ORIGIN}#profile">Return to Profile</a>
  </div>
  
  <script>
    // Auto-close if opened as popup
    if (window.opener) {
      window.opener.postMessage({
        type: 'oauth-unavailable',
        provider: 'linkedin',
        message: 'LinkedIn authentication is not yet configured'
      }, '${HOSTING_ORIGIN}');
      
      setTimeout(() => window.close(), 5000);
    }
  </script>
</body>
</html>`);
  }

  const state = await createState();
  const redirectUri = `${baseUrl(req)}/api/linkedin/callback`;
  
  // LinkedIn OAuth 2.0 scopes
  const scope = 'openid profile email';
  
  const authUrl = new URL(LINKEDIN_AUTH_URL);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', credentials.clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('scope', scope);
  authUrl.searchParams.append('state', state);
  
  res.redirect(authUrl.toString());
});

// ---- OAuth callback
router.get('/linkedin/callback', async (req: any, res: any) => {
  const returnedState = String(req.query.state || '');
  const code = String(req.query.code || '');
  const error = req.query.error;
  
  // Handle user denying access
  if (error) {
    return res
      .status(200)
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="dark light">
  <title>Authorization Cancelled</title>
</head>
<body style="font:14px system-ui;padding:16px">
  <h2>Authorization Cancelled</h2>
  <p>You cancelled LinkedIn authorization.</p>
  <script>
    setTimeout(() => {
      if (window.opener) {
        window.opener.postMessage({ type: 'oauth-cancelled', provider: 'linkedin' }, '${HOSTING_ORIGIN}');
        window.close();
      } else {
        window.location.href = '${HOSTING_ORIGIN}';
      }
    }, 1500);
  </script>
</body>
</html>`);
  }
  
  // Verify state
  const valid = await consumeState(returnedState);
  if (!valid) {
    return res
      .status(400)
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="dark light">
  <title>Invalid Request</title>
</head>
<body style="font:14px system-ui;padding:16px">
  <h2 style="color:red">Invalid Request</h2>
  <p>The authorization request was invalid or expired.</p>
  <p><a href="${HOSTING_ORIGIN}">Return to app</a></p>
</body>
</html>`);
  }
  
  if (!code) {
    return res
      .status(400)
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="dark light">
  <title>Authorization Failed</title>
</head>
<body style="font:14px system-ui;padding:16px">
  <h2>Authorization Failed</h2>
  <p>No authorization code received from LinkedIn.</p>
  <p><a href="${HOSTING_ORIGIN}">Return to app</a></p>
</body>
</html>`);
  }
  
  try {
    // Get credentials
    const credentials = getLinkedInCredentials();
    if (!credentials) {
      throw new Error('LinkedIn OAuth not configured');
    }
    
    // Exchange code for access token
    const redirectUri = `${baseUrl(req)}/api/linkedin/callback`;
    
    const tokenResponse = await axios.post(LINKEDIN_TOKEN_URL, null, {
      params: {
        grant_type: 'authorization_code',
        code: code,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        redirect_uri: redirectUri
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const tokens = tokenResponse.data;
    
    // Get user profile to display name
    let userName = 'LinkedIn User';
    try {
      const profileResponse = await axios.get(LINKEDIN_PROFILE_URL, {
        headers: {
          'Authorization': `Bearer ${tokens['access_token']}`
        }
      });
      
      const profile = profileResponse.data;
      userName = profile.name || `${profile.given_name} ${profile.family_name}` || userName;
      
      // Store profile info with tokens
      tokens['profile'] = {
        name: userName,
        email: profile.email,
        picture: profile.picture
      };
    } catch (profileErr) {
      console.error('[linkedin] Profile fetch error:', profileErr);
    }
    
    // Store tokens in session
    const sid = await ensureSession(req, res);
    await saveTokens(sid, tokens, 'linkedin');
    
    // Success response with postMessage to parent window
    return res
      .status(200)
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="dark light">
  <title>LinkedIn Connected</title>
  <style>
    body {
      font: 14px system-ui, -apple-system, sans-serif;
      padding: 32px;
      max-width: 600px;
      margin: 0 auto;
      background: #0a0a0a;
      color: #fff;
    }
    .success {
      background: linear-gradient(135deg, #0077b5 0%, #00a0dc 100%);
      color: white;
      padding: 24px;
      border-radius: 12px;
      text-align: center;
      margin: 32px 0;
    }
    .success h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
    }
    .success p {
      margin: 0;
      opacity: 0.9;
    }
    .profile {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      margin: 24px 0;
    }
    .profile img {
      width: 48px;
      height: 48px;
      border-radius: 50%;
    }
    .closing {
      text-align: center;
      color: #666;
      font-size: 13px;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="success">
    <h2>✓ LinkedIn Connected!</h2>
    <p>Successfully connected as ${userName}</p>
  </div>
  
  <div class="closing">
    This window will close automatically...
  </div>
  
  <script>
    // Notify parent window
    if (window.opener) {
      window.opener.postMessage({
        type: 'oauth-success',
        provider: 'linkedin',
        userName: '${userName.replace(/'/g, "\\'")}'
      }, '${HOSTING_ORIGIN}');
      
      // Close after brief delay
      setTimeout(() => window.close(), 2000);
    } else {
      // Redirect if not a popup
      setTimeout(() => {
        window.location.href = '${HOSTING_ORIGIN}#profile';
      }, 2000);
    }
  </script>
</body>
</html>`);
    
  } catch (err: any) {
    console.error('[linkedin] Token exchange error:', err.response?.data || err.message);
    
    return res
      .status(500)
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="dark light">
  <title>Connection Failed</title>
</head>
<body style="font:14px system-ui;padding:16px">
  <h2 style="color:red">Connection Failed</h2>
  <p>Unable to connect to LinkedIn. Please try again.</p>
  <p style="color:#666;font-size:12px">${err.message || 'Unknown error'}</p>
  <p><a href="${HOSTING_ORIGIN}">Return to app</a></p>
</body>
</html>`);
  }
});

// ---- disconnect endpoint
router.post('/linkedin/disconnect', async (req: any, res: any) => {
  try {
    const sid = req.cookies?.sid;
    if (!sid) {
      return res.json({ success: false, message: 'No session' });
    }
    
    await clearTokens(sid, 'linkedin');
    res.json({ success: true });
  } catch (e) {
    console.error('[linkedin] Disconnect error:', e);
    res.status(500).json({ success: false, error: 'Disconnect failed' });
  }
});

// ---- get profile endpoint
router.get('/linkedin/profile', async (req: any, res: any) => {
  try {
    const sid = req.cookies?.sid;
    if (!sid) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const tokens = await getAuthenticatedClient(sid);
    if (!tokens) {
      return res.status(401).json({ error: 'LinkedIn not connected' });
    }
    
    // If we have cached profile info, return it
    if (tokens['profile']) {
      return res.json(tokens['profile']);
    }
    
    // Otherwise fetch it
    try {
      const profileResponse = await axios.get(LINKEDIN_PROFILE_URL, {
        headers: {
          'Authorization': `Bearer ${tokens['access_token']}`
        }
      });
      
      const profile = profileResponse.data;
      const profileData = {
        name: profile.name || `${profile.given_name} ${profile.family_name}`,
        email: profile.email,
        picture: profile.picture
      };
      
      // Cache the profile data
      tokens['profile'] = profileData;
      await saveTokens(sid, tokens, 'linkedin');
      
      res.json(profileData);
    } catch (err: any) {
      console.error('[linkedin] Profile fetch error:', err.response?.data || err.message);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  } catch (e) {
    console.error('[linkedin] Profile endpoint error:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;