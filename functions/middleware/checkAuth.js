const admin = require('firebase-admin');
module.exports = async function checkAuth(req,res,next){
  try{
    const h=req.headers.authorization||''; const m=h.match(/^Bearer\s+(.+)$/i);
    if(!m) return res.status(401).json({error:'missing_auth'});
    const decoded=await admin.auth().verifyIdToken(m[1]);
    req.user={uid:decoded.uid,email:decoded.email||null,claims:decoded}; next();
  }catch(e){ res.status(401).json({error:'invalid_auth',details:String(e)}); }
};