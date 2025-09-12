const express = require('express');
const admin = require('firebase-admin');
const checkAuth = require('../middleware/checkAuth');
const db = admin.firestore();

// Admin emails should be stored in environment variables or Firebase config
// For security, we'll check against Firebase custom claims instead
const router = express.Router();
router.post('/promoteByEmail', checkAuth, express.json(), async (req,res)=>{
  try{
    // Check if the caller has admin custom claims
    const callerToken = await admin.auth().getUser(req.user.uid);
    const isAdmin = callerToken.customClaims?.admin === true;
    
    if(!isAdmin) return res.status(403).json({success:false,error:'forbidden'});
    const target = String(req.body?.email || '').trim().toLowerCase();
    if (!target) {
      return res.status(400).json({success:false,error:'email required'});
    }
    const user = await admin.auth().getUserByEmail(target);
    await db.collection('users').doc(user.uid).set({ isAdmin:true }, { merge:true });
    return res.json({ success:true, uid:user.uid, email:target, isAdmin:true });
  }catch(e){ res.status(500).json({success:false,error:String(e)}); }
});

module.exports = router;