const admin = require('firebase-admin');

// Initialize admin if not already done
try {
  if (!admin.apps || !admin.apps.length) {
    admin.initializeApp();
  }
} catch (error) {
  // Already initialized
}

/**
 * Middleware to check Firebase Auth token
 * Adds req.user with uid and email if authenticated
 */
async function checkAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No auth token provided' });
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || ''
    };
    next();
  } catch (error) {
    console.error('Auth token verification failed:', error);
    return res.status(401).json({ error: 'Invalid auth token' });
  }
}

module.exports = checkAuth;
