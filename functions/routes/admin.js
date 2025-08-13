const express = require('express');
const admin = require('firebase-admin');
const checkAuth = require('../lib/checkAuth');
const db = admin.firestore();
const ALLOWED_EMAILS = new Set([
  'jamy@nigriconsulting.com',
  'jamynigri@gmail.com'
]);

const router = express.Router();
router.post('/promoteByEmail', checkAuth, express.json(), async (req,res)=>{
  try{
    const caller = (req.user.email||'').toLowerCase();
    if(!ALLOWED_EMAILS.has(caller)) return res.status(403).json({success:false,error:'forbidden'});
    const target = String(req.body?.email || caller).trim().toLowerCase();
    const user = await admin.auth().getUserByEmail(target);
    await db.collection('users').doc(user.uid).set({ isAdmin:true }, { merge:true });
    return res.json({ success:true, uid:user.uid, email:target, isAdmin:true });
  }catch(e){ res.status(500).json({success:false,error:String(e)}); }
});

module.exports = router;