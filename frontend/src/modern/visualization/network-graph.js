/**
 * Network Graph Visualization Component
 * Renders interactive network visualizations for conference connections
 */

class NetworkGraph {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      width: options.width || 800,
      height: options.height || 600,
      nodeRadius: options.nodeRadius || 8,
      linkDistance: options.linkDistance || 80,
      charge: options.charge || -300,
      theme: options.theme || 'dark',
      interactive: options.interactive !== false,
      showLabels: options.showLabels !== false,
      ...options
    };
    
    this.nodes = [];
    this.links = [];
    this.simulation = null;
    this.svg = null;
    this.tooltip = null;
    
    this.initialize();
  }
  
  /**
   * Initialize the network graph
   */
  initialize() {
    // Create SVG container
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', this.options.width);
    this.svg.setAttribute('height', this.options.height);
    this.svg.setAttribute('viewBox', `0 0 ${this.options.width} ${this.options.height}`);
    this.svg.style.background = this.options.theme === 'dark' ? '#0b0f14' : '#ffffff';
    
    this.container.appendChild(this.svg);
    
    // Create tooltip
    this.createTooltip();
    
    // Set up zoom and pan if interactive
    if (this.options.interactive) {
      this.setupInteraction();
    }
    
    // Create graph elements
    this.createGraphElements();
  }
  
  /**
   * Create tooltip element
   */
  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'network-tooltip';
    this.tooltip.style.cssText = `
      position: absolute;
      background: ${this.options.theme === 'dark' ? '#1a1f26' : '#ffffff'};
      color: ${this.options.theme === 'dark' ? '#e1e5ea' : '#333333'};
      padding: 12px;
      border-radius: 8px;
      border: 1px solid ${this.options.theme === 'dark' ? '#2a3038' : '#e0e0e0'};
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s;
      z-index: 1000;
      max-width: 250px;
    `;
    document.body.appendChild(this.tooltip);
  }
  
  /**
   * Set up interaction handlers
   */
  setupInteraction() {
    // Add zoom behavior using custom implementation
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    
    this.svg.addEventListener('wheel', (event) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 0.9 : 1.1;
      scale = Math.min(Math.max(scale * delta, 0.5), 3);
      this.updateTransform();
    });
    
    this.svg.addEventListener('mousedown', (event) => {
      if (event.target === this.svg) {
        isDragging = true;
        lastX = event.clientX;
        lastY = event.clientY;
        this.svg.style.cursor = 'grabbing';
      }
    });
    
    document.addEventListener('mousemove', (event) => {
      if (isDragging) {
        const deltaX = event.clientX - lastX;
        const deltaY = event.clientY - lastY;
        translateX += deltaX;
        translateY += deltaY;
        lastX = event.clientX;
        lastY = event.clientY;
        this.updateTransform();
      }
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
      this.svg.style.cursor = 'grab';
    });
    
    this.updateTransform = () => {
      const graphGroup = this.svg.querySelector('.graph-group');
      if (graphGroup) {
        graphGroup.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
      }
    };
  }
  
  /**
   * Create graph elements
   */
  createGraphElements() {
    // Create main graph group
    const graphGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    graphGroup.classList.add('graph-group');
    this.svg.appendChild(graphGroup);
    
    // Create links group
    this.linksGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.linksGroup.classList.add('links');
    graphGroup.appendChild(this.linksGroup);
    
    // Create nodes group
    this.nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.nodesGroup.classList.add('nodes');
    graphGroup.appendChild(this.nodesGroup);
    
    // Create labels group
    this.labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.labelsGroup.classList.add('labels');
    graphGroup.appendChild(this.labelsGroup);
  }
  
  /**
   * Update graph with new data
   */
  updateData(graphData) {
    this.nodes = [...graphData.nodes];
    this.links = [...graphData.links];
    
    // Initialize positions if not set
    this.nodes.forEach((node, i) => {
      if (!node.x) node.x = this.options.width / 2 + (Math.random() - 0.5) * 100;
      if (!node.y) node.y = this.options.height / 2 + (Math.random() - 0.5) * 100;
      node.vx = node.vx || 0;
      node.vy = node.vy || 0;
    });
    
    // Start simulation
    this.startSimulation();
    this.render();
  }
  
  /**
   * Start force simulation
   */
  startSimulation() {
    // Simple force simulation implementation
    const simulation = {
      nodes: this.nodes,
      links: this.links,
      alpha: 1,
      alphaDecay: 0.02,
      velocityDecay: 0.4,
      forces: {
        link: { strength: 0.1, distance: this.options.linkDistance },
        charge: { strength: this.options.charge },
        center: { x: this.options.width / 2, y: this.options.height / 2, strength: 0.1 },
        collision: { radius: this.options.nodeRadius * 2 }
      }
    };
    
    const tick = () => {
      // Apply forces
      this.applyLinkForce(simulation);
      this.applyChargeForce(simulation);
      this.applyCenterForce(simulation);
      this.applyCollisionForce(simulation);
      
      // Update positions
      this.nodes.forEach(node => {
        node.vx *= simulation.velocityDecay;
        node.vy *= simulation.velocityDecay;
        node.x += node.vx;
        node.y += node.vy;
      });
      
      // Update visual elements
      this.updatePositions();
      
      // Continue simulation
      simulation.alpha *= (1 - simulation.alphaDecay);
      if (simulation.alpha > 0.01) {
        requestAnimationFrame(tick);
      }
    };
    
    this.simulation = simulation;
    tick();
  }
  
  /**
   * Apply link force
   */
  applyLinkForce(simulation) {
    simulation.links.forEach(link => {
      const source = this.nodes.find(n => n.id === link.source);
      const target = this.nodes.find(n => n.id === link.target);
      
      if (!source || !target) return;
      
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const targetDistance = simulation.forces.link.distance;
      const strength = simulation.forces.link.strength;
      
      const force = (distance - targetDistance) * strength / distance;
      
      source.vx += dx * force;
      source.vy += dy * force;
      target.vx -= dx * force;
      target.vy -= dy * force;
    });
  }
  
  /**
   * Apply charge force (repulsion)
   */
  applyChargeForce(simulation) {
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeA = this.nodes[i];
        const nodeB = this.nodes[j];
        
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = simulation.forces.charge.strength / (distance * distance);
        
        nodeA.vx -= dx * force / distance;
        nodeA.vy -= dy * force / distance;
        nodeB.vx += dx * force / distance;
        nodeB.vy += dy * force / distance;
      }
    }
  }
  
  /**
   * Apply center force
   */
  applyCenterForce(simulation) {
    const { x: centerX, y: centerY, strength } = simulation.forces.center;
    
    this.nodes.forEach(node => {
      node.vx += (centerX - node.x) * strength;
      node.vy += (centerY - node.y) * strength;
    });
  }
  
  /**
   * Apply collision force
   */
  applyCollisionForce(simulation) {
    const radius = simulation.forces.collision.radius;
    
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeA = this.nodes[i];
        const nodeB = this.nodes[j];
        
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < radius) {
          const overlap = radius - distance;
          const moveDistance = overlap * 0.5;
          
          if (distance === 0) {
            nodeA.x -= 1;
            nodeB.x += 1;
          } else {
            const moveX = (dx / distance) * moveDistance;
            const moveY = (dy / distance) * moveDistance;
            
            nodeA.x -= moveX;
            nodeA.y -= moveY;
            nodeB.x += moveX;
            nodeB.y += moveY;
          }
        }
      }
    }
  }
  
  /**
   * Render the graph
   */
  render() {
    this.renderLinks();
    this.renderNodes();
    if (this.options.showLabels) {
      this.renderLabels();
    }
  }
  
  /**
   * Render links
   */
  renderLinks() {
    // Clear existing links
    this.linksGroup.innerHTML = '';
    
    this.links.forEach(link => {
      const source = this.nodes.find(n => n.id === link.source);
      const target = this.nodes.find(n => n.id === link.target);
      
      if (!source || !target) return;
      
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', source.x);
      line.setAttribute('y1', source.y);
      line.setAttribute('x2', target.x);
      line.setAttribute('y2', target.y);
      line.setAttribute('stroke', this.getLinkColor(link));
      line.setAttribute('stroke-width', this.getLinkWidth(link));
      line.setAttribute('stroke-opacity', '0.6');
      
      this.linksGroup.appendChild(line);
    });
  }
  
  /**
   * Render nodes
   */
  renderNodes() {
    // Clear existing nodes
    this.nodesGroup.innerHTML = '';
    
    this.nodes.forEach(node => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', node.x);
      circle.setAttribute('cy', node.y);
      circle.setAttribute('r', this.getNodeRadius(node));
      circle.setAttribute('fill', this.getNodeColor(node));
      circle.setAttribute('stroke', this.getNodeBorderColor(node));
      circle.setAttribute('stroke-width', '2');
      
      // Add interaction
      if (this.options.interactive) {
        circle.style.cursor = 'pointer';
        circle.addEventListener('mouseenter', (event) => this.showTooltip(event, node));
        circle.addEventListener('mouseleave', () => this.hideTooltip());
        circle.addEventListener('click', () => this.onNodeClick(node));
      }
      
      this.nodesGroup.appendChild(circle);
    });
  }
  
  /**
   * Render labels
   */
  renderLabels() {
    // Clear existing labels
    this.labelsGroup.innerHTML = '';
    
    this.nodes.forEach(node => {
      if (!node.name) return;
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.x);
      text.setAttribute('y', node.y + this.getNodeRadius(node) + 16);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', this.options.theme === 'dark' ? '#e1e5ea' : '#333333');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      text.textContent = node.name;
      
      this.labelsGroup.appendChild(text);
    });
  }
  
  /**
   * Update positions during simulation
   */
  updatePositions() {
    // Update links
    const links = this.linksGroup.querySelectorAll('line');
    links.forEach((line, i) => {
      const link = this.links[i];
      const source = this.nodes.find(n => n.id === link.source);
      const target = this.nodes.find(n => n.id === link.target);
      
      if (source && target) {
        line.setAttribute('x1', source.x);
        line.setAttribute('y1', source.y);
        line.setAttribute('x2', target.x);
        line.setAttribute('y2', target.y);
      }
    });
    
    // Update nodes
    const nodes = this.nodesGroup.querySelectorAll('circle');
    nodes.forEach((circle, i) => {
      const node = this.nodes[i];
      circle.setAttribute('cx', node.x);
      circle.setAttribute('cy', node.y);
    });
    
    // Update labels
    const labels = this.labelsGroup.querySelectorAll('text');
    labels.forEach((text, i) => {
      const node = this.nodes[i];
      text.setAttribute('x', node.x);
      text.setAttribute('y', node.y + this.getNodeRadius(node) + 16);
    });
  }
  
  /**
   * Get node color based on type and properties
   */
  getNodeColor(node) {
    const colors = {
      user: '#6366f1',
      connection: '#10b981',
      event: '#f59e0b',
      company: '#ec4899',
      skill: '#8b5cf6'
    };
    
    return colors[node.type] || '#6b7280';
  }
  
  /**
   * Get node border color
   */
  getNodeBorderColor(node) {
    return node.isHighlighted ? '#fbbf24' : 
           this.options.theme === 'dark' ? '#374151' : '#d1d5db';
  }
  
  /**
   * Get node radius based on importance/size
   */
  getNodeRadius(node) {
    const baseRadius = this.options.nodeRadius;
    const sizeMultiplier = node.size || 1;
    return baseRadius * sizeMultiplier;
  }
  
  /**
   * Get link color based on relationship strength
   */
  getLinkColor(link) {
    const strength = link.strength || 0.5;
    if (strength > 0.8) return '#10b981';
    if (strength > 0.5) return '#6366f1';
    return '#6b7280';
  }
  
  /**
   * Get link width based on relationship strength
   */
  getLinkWidth(link) {
    const strength = link.strength || 0.5;
    return Math.max(1, strength * 3);
  }
  
  /**
   * Show tooltip on node hover
   */
  showTooltip(event, node) {
    const tooltip = this.tooltip;
    
    tooltip.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px;">${node.name || node.id}</div>
      <div style="font-size: 12px; color: ${this.options.theme === 'dark' ? '#9ca3af' : '#6b7280'};">
        ${node.title || node.type}
      </div>
      ${node.company ? `<div style="font-size: 12px; margin-top: 4px;">${node.company}</div>` : ''}
      ${node.connections ? `<div style="font-size: 12px; margin-top: 4px;">${node.connections} connections</div>` : ''}
    `;
    
    tooltip.style.left = event.pageX + 10 + 'px';
    tooltip.style.top = event.pageY - 10 + 'px';
    tooltip.style.opacity = '1';
  }
  
  /**
   * Hide tooltip
   */
  hideTooltip() {
    this.tooltip.style.opacity = '0';
  }
  
  /**
   * Handle node click
   */
  onNodeClick(node) {
    // Emit custom event for node selection
    const event = new CustomEvent('nodeclick', {
      detail: { node }
    });
    this.container.dispatchEvent(event);
  }
  
  /**
   * Highlight specific nodes
   */
  highlightNodes(nodeIds) {
    this.nodes.forEach(node => {
      node.isHighlighted = nodeIds.includes(node.id);
    });
    this.render();
  }
  
  /**
   * Export graph as SVG
   */
  exportSVG() {
    const svgData = new XMLSerializer().serializeToString(this.svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    return URL.createObjectURL(blob);
  }
  
  /**
   * Resize graph
   */
  resize(width, height) {
    this.options.width = width;
    this.options.height = height;
    this.svg.setAttribute('width', width);
    this.svg.setAttribute('height', height);
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    
    // Restart simulation with new center
    if (this.simulation) {
      this.simulation.forces.center.x = width / 2;
      this.simulation.forces.center.y = height / 2;
      this.startSimulation();
    }
  }
  
  /**
   * Clean up
   */
  destroy() {
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }
    
    if (this.svg && this.svg.parentNode) {
      this.svg.parentNode.removeChild(this.svg);
    }
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NetworkGraph;
}

// Global access
window.NetworkGraph = NetworkGraph;