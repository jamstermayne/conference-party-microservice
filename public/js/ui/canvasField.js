/**
 * CANVAS FIELD MODULE
 * Proximity Signal Field - adaptive, reduced-motion safe
 * Signature visual element for Professional Intelligence Platform
 */

export function mountSignalField(canvas, getHotspots){
  const ctx = canvas.getContext('2d');
  let w=0,h=0, parts=[], running=false, last=0, densityBase=60, degraded=false;

  function resize(){
    const r = canvas.getBoundingClientRect();
    w = canvas.width = Math.floor(r.width * devicePixelRatio);
    h = canvas.height = Math.floor(r.height * devicePixelRatio);
    ctx.scale(devicePixelRatio, devicePixelRatio);
  }
  function spawn(){
    const hs = getHotspots()||[];
    const total = hs.reduce((a,b)=>a+(b.total||0),0);
    const max = degraded ? 30 : 90;
    const count = Math.min(max, Math.round(total*0.8) + densityBase);
    parts = Array.from({length:count},()=>({
      x:Math.random()* (w/devicePixelRatio),
      y:Math.random()* (h/devicePixelRatio),
      r: 6+Math.random()*10, a:0.05+Math.random()*0.15,
      vx:-0.3+Math.random()*0.6, vy:-0.3+Math.random()*0.6,
      hue:[226,200,50,140][(Math.random()*4)|0]
    }));
  }
  function frame(ts){
    if(!running) return;
    const dt = Math.min(32, ts-last); last=ts;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    parts.forEach(p=>{
      p.x+=p.vx*dt/16; p.y+=p.vy*dt/16;
      if (p.x<0||p.x>(w/devicePixelRatio)) p.vx*=-1;
      if (p.y<0||p.y>(h/devicePixelRatio)) p.vy*=-1;
      const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
      g.addColorStop(0,`hsla(${p.hue} 100% 70% / ${p.a})`);
      g.addColorStop(1,`hsla(${p.hue} 100% 70% / 0)`);
      ctx.fillStyle=g; ctx.globalCompositeOperation='lighter';
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      ctx.globalCompositeOperation='source-over';
    });
    requestAnimationFrame(frame);
  }
  function start(){ running=true; last=performance.now(); resize(); spawn(); requestAnimationFrame(frame); }
  function stop(){ running=false; }

  const ro = new ResizeObserver(()=>{ resize(); spawn(); });
  ro.observe(canvas);

  const io = new IntersectionObserver((e)=> e[0].isIntersecting ? start() : stop(), {threshold:.1});
  io.observe(canvas);

  document.addEventListener('perf:fps', (e)=>{
    degraded = !!e.detail.degraded;
    spawn();
  });

  return { refresh(){ spawn(); }, destroy(){ stop(); ro.disconnect(); io.disconnect(); } };
}

// Enhanced Canvas Field class for Professional Intelligence Platform
class CanvasField {
  constructor() {
    this.signalFields = new Map();
    this.initialized = false;
    this.globalHotspots = [];
  }

  /**
   * Initialize canvas field system
   */
  init(canvas) {
    if (!canvas) {
      console.warn('Canvas element required for signal field');
      return;
    }

    // Mount the main signal field
    const field = mountSignalField(canvas, () => this.getHotspots());
    this.signalFields.set('main', field);
    
    this.initialized = true;
    console.log('✅ Signal field initialized');
    
    return field;
  }

  /**
   * Get current hotspots data for signal field
   */
  getHotspots() {
    // Try to get from store first
    if (typeof window !== 'undefined' && window.store) {
      const hotspots = window.store.get('hotspots') || [];
      if (hotspots.length > 0) return hotspots;
    }

    // Fallback to global hotspots or simulate data
    if (this.globalHotspots.length > 0) {
      return this.globalHotspots;
    }

    // Generate simulated hotspot data based on professional activity
    return this.generateSimulatedHotspots();
  }

  /**
   * Generate simulated hotspot data for signal field
   */
  generateSimulatedHotspots() {
    const venues = [
      { name: 'Hall 1-3', total: 45, dev: 15, pub: 12, inv: 8, sp: 10 },
      { name: 'Hall 4-5', total: 38, dev: 18, pub: 8, inv: 6, sp: 6 },
      { name: 'Hall 6-8', total: 62, dev: 25, pub: 15, inv: 12, sp: 10 },
      { name: 'Business Area', total: 28, dev: 5, pub: 8, inv: 10, sp: 5 },
      { name: 'Outside Area', total: 15, dev: 8, pub: 3, inv: 2, sp: 2 }
    ];

    return venues.map((venue, index) => ({
      id: `venue-${index}`,
      name: venue.name,
      total: venue.total + Math.floor(Math.random() * 20 - 10), // Add some variance
      dev: venue.dev,
      pub: venue.pub,
      inv: venue.inv,
      sp: venue.sp
    }));
  }

  /**
   * Update hotspots data (triggers field refresh)
   */
  updateHotspots(hotspots) {
    this.globalHotspots = hotspots;
    
    // Refresh all active signal fields
    this.signalFields.forEach(field => {
      if (field && typeof field.refresh === 'function') {
        field.refresh();
      }
    });
  }

  /**
   * Create additional signal field instances
   */
  createSignalField(canvas, id = null, customHotspotGetter = null) {
    const fieldId = id || `field-${Date.now()}`;
    const hotspotGetter = customHotspotGetter || (() => this.getHotspots());
    
    const field = mountSignalField(canvas, hotspotGetter);
    this.signalFields.set(fieldId, field);
    
    return { id: fieldId, field };
  }

  /**
   * Remove signal field instance
   */
  removeSignalField(id) {
    const field = this.signalFields.get(id);
    if (field && typeof field.destroy === 'function') {
      field.destroy();
    }
    this.signalFields.delete(id);
  }

  /**
   * Pause all signal fields (for performance)
   */
  pauseAll() {
    this.signalFields.forEach(field => {
      if (field && typeof field.destroy === 'function') {
        // Temporarily stop rendering
        field.running = false;
      }
    });
  }

  /**
   * Resume all signal fields
   */
  resumeAll() {
    this.signalFields.forEach(field => {
      if (field) {
        // Restart rendering if not reduced motion
        const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReduced && field.start) {
          field.start();
        }
      }
    });
  }

  /**
   * Refresh all signal fields
   */
  refreshAll() {
    this.signalFields.forEach(field => {
      if (field && typeof field.refresh === 'function') {
        field.refresh();
      }
    });
  }

  /**
   * Get signal field stats for debugging
   */
  getStats() {
    const hotspots = this.getHotspots();
    const totalProfessionals = hotspots.reduce((sum, h) => sum + (h.total || 0), 0);
    
    return {
      activeFields: this.signalFields.size,
      hotspots: hotspots.length,
      totalProfessionals,
      breakdown: {
        developers: hotspots.reduce((sum, h) => sum + (h.dev || 0), 0),
        publishers: hotspots.reduce((sum, h) => sum + (h.pub || 0), 0),
        investors: hotspots.reduce((sum, h) => sum + (h.inv || 0), 0),
        serviceProviders: hotspots.reduce((sum, h) => sum + (h.sp || 0), 0)
      }
    };
  }

  /**
   * Professional Intelligence integration - proximity updates
   */
  onProximityUpdate(nearbyProfessionals) {
    // Convert proximity data to hotspot format
    if (!nearbyProfessionals || nearbyProfessionals.length === 0) return;
    
    const proximityHotspots = [{
      id: 'proximity-current',
      name: 'Your Current Area',
      total: nearbyProfessionals.length,
      dev: nearbyProfessionals.filter(p => p.persona === 'developer').length,
      pub: nearbyProfessionals.filter(p => p.persona === 'publisher').length,
      inv: nearbyProfessionals.filter(p => p.persona === 'investor').length,
      sp: nearbyProfessionals.filter(p => p.persona === 'service').length
    }];

    this.updateHotspots(proximityHotspots);
  }

  /**
   * Professional Intelligence integration - venue updates
   */
  onVenueChange(venue, professionalCounts) {
    const venueHotspot = {
      id: `venue-${venue.replace(/\s+/g, '-').toLowerCase()}`,
      name: venue,
      total: Object.values(professionalCounts).reduce((sum, count) => sum + count, 0),
      dev: professionalCounts.developers || 0,
      pub: professionalCounts.publishers || 0,
      inv: professionalCounts.investors || 0,
      sp: professionalCounts.serviceProviders || 0
    };

    // Update with single venue data
    this.updateHotspots([venueHotspot]);
  }

  /**
   * Destroy all signal fields
   */
  destroy() {
    this.signalFields.forEach(field => {
      if (field && typeof field.destroy === 'function') {
        field.destroy();
      }
    });
    this.signalFields.clear();
    this.initialized = false;
    console.log('🗑️ Signal field destroyed');
  }
}

// Create singleton instance
export const canvasField = new CanvasField();

// Export class for testing
export default CanvasField;

// Professional Intelligence event integration
if (typeof window !== 'undefined') {
  // Listen for proximity events
  window.addEventListener('proximity:nearby', (e) => {
    canvasField.onProximityUpdate(e.detail.professionals);
  });

  // Listen for venue changes
  window.addEventListener('proximity:venue', (e) => {
    canvasField.onVenueChange(e.detail.venue, e.detail.counts || {});
  });

  // Listen for app visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      canvasField.pauseAll();
    } else {
      canvasField.resumeAll();
    }
  });

  // Attach to window for debugging
  window.canvasField = canvasField;
  window.mountSignalField = mountSignalField;
}