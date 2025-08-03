#!/usr/bin/env node
const { execSync } = require('child_process');

console.log('🚀 SESSION STARTUP - CONFERENCE PARTY MICROSERVICE');
console.log('=' .repeat(60));

// Auto-run all diagnostic tools
try {
  console.log('\n📊 PROJECT STATUS:');
  execSync('npm run api-status', { stdio: 'inherit' });
  
  console.log('\n🔧 DEVELOPMENT SERVER:');
  execSync('npm run dev &', { stdio: 'inherit' });
  
  console.log('\n🧪 QUICK HEALTH CHECK:');
  setTimeout(() => {
    execSync('curl -s http://localhost:3000/api/health || echo "❌ Server not ready"', { stdio: 'inherit' });
  }, 2000);
  
  console.log('\n✅ READY FOR SESSION 2 DEVELOPMENT!');
  console.log('🎯 Goals: File processing + Sessions API + Firestore integration');
  
} catch (error) {
  console.error('❌ Startup failed:', error.message);
}