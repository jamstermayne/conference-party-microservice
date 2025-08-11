// Structured logger w/ level control via localStorage.LOG_LEVEL = 'debug'|'info'|'warn'|'error'
const LEVELS = ['debug','info','warn','error'];
function level(){ const v = (localStorage.getItem('LOG_LEVEL')||'info').toLowerCase(); return Math.max(0, LEVELS.indexOf(v)); }
function logAt(l, args){ if (LEVELS.indexOf(l) < level()) return; const ts = new Date().toISOString(); console[l](`[${ts}] [${l.toUpperCase()}]`, ...args); }

const Logger = {
  debug: (...a)=> logAt('debug', a),
  info:  (...a)=> logAt('info', a),
  warn:  (...a)=> logAt('warn', a),
  error: (...a)=> logAt('error', a),
  __verified: true
};
if (!window.Logger) window.Logger = Logger;

// Global traps
window.addEventListener('error', e=> Logger.error('window.error', e.message, e.filename, e.lineno, e.colno));
window.addEventListener('unhandledrejection', e=> Logger.error('unhandledrejection', e.reason));

export default Logger;