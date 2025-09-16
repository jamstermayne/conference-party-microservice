/**
 * Lightweight force-directed graph for match visualization
 * Shows nodes sized by connectivity, edges by match score
 */

export function renderMatchGraph({ mountId, nodes, edges }) {
  const canvas = document.getElementById(mountId);
  if (!canvas) {
    console.error(`Canvas element with id "${mountId}" not found`);
    return;
  }

  const dpi = window.devicePixelRatio || 1;
  const width = 900;
  const height = 520;

  canvas.width = width * dpi;
  canvas.height = height * dpi;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpi, dpi);

  // Initialize node positions in a circle
  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    node.x = width / 2 + 280 * Math.cos(angle);
    node.y = height / 2 + 180 * Math.sin(angle);
    node.vx = 0;
    node.vy = 0;
  });

  // Physics simulation step
  function simulationStep() {
    // Apply spring forces between connected nodes
    edges.forEach(edge => {
      const nodeA = nodes.find(n => n.id === edge.a);
      const nodeB = nodes.find(n => n.id === edge.b);
      if (!nodeA || !nodeB) return;

      const dx = nodeB.x - nodeA.x;
      const dy = nodeB.y - nodeA.y;
      const distance = Math.max(1, Math.hypot(dx, dy));

      // Ideal distance based on score (inverse - higher score = closer)
      const idealDistance = 150 * (2 - (edge.score || 0.5));
      const springForce = 0.001 * (distance - idealDistance);

      const fx = dx / distance * springForce;
      const fy = dy / distance * springForce;

      nodeA.vx += fx;
      nodeA.vy += fy;
      nodeB.vx -= fx;
      nodeB.vy -= fy;
    });

    // Apply repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.max(1, Math.hypot(dx, dy));

        if (distance < 200) {
          const repulsionForce = 50 / (distance * distance);
          const fx = dx / distance * repulsionForce;
          const fy = dy / distance * repulsionForce;

          nodeA.vx -= fx;
          nodeA.vy -= fy;
          nodeB.vx += fx;
          nodeB.vy += fy;
        }
      }
    }

    // Apply centering force and update positions
    nodes.forEach(node => {
      // Center attraction
      node.vx += (width / 2 - node.x) * 0.0005;
      node.vy += (height / 2 - node.y) * 0.0005;

      // Apply velocity with damping
      node.x += node.vx;
      node.y += node.vy;
      node.vx *= 0.9;
      node.vy *= 0.9;

      // Keep nodes within bounds
      node.x = Math.max(20, Math.min(width - 20, node.x));
      node.y = Math.max(20, Math.min(height - 20, node.y));
    });
  }

  // Drawing function
  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#0d0e1a';
    ctx.fillRect(0, 0, width, height);

    // Draw edges
    ctx.globalAlpha = 0.6;
    edges.forEach(edge => {
      const nodeA = nodes.find(n => n.id === edge.a);
      const nodeB = nodes.find(n => n.id === edge.b);
      if (!nodeA || !nodeB) return;

      // Edge color and width based on score
      const score = edge.score || 0.5;
      const hue = 260 - 60 * score; // Purple to cyan gradient
      ctx.strokeStyle = `hsl(${hue}, 70%, ${40 + 20 * score}%)`;
      ctx.lineWidth = 0.5 + 3 * score;

      ctx.beginPath();
      ctx.moveTo(nodeA.x, nodeA.y);
      ctx.lineTo(nodeB.x, nodeB.y);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // Draw nodes
    nodes.forEach(node => {
      const radius = 6 + (node.degree || 0) * 0.5;

      // Node glow for high-degree nodes
      if (node.degree > 5) {
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = node.color || '#aab';
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Node circle
      ctx.fillStyle = node.color || '#aab';
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Node border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Node label
      ctx.fillStyle = '#dfe3f0';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(node.label || node.id, node.x + radius + 5, node.y + 4);
    });

    // Draw legend
    drawLegend();
  }

  function drawLegend() {
    const legendX = width - 150;
    const legendY = 20;

    ctx.fillStyle = 'rgba(22, 23, 46, 0.9)';
    ctx.fillRect(legendX - 10, legendY - 10, 140, 100);

    ctx.strokeStyle = '#2a2c5a';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX - 10, legendY - 10, 140, 100);

    ctx.fillStyle = '#A8B0C3';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'left';

    // Node type legend
    const types = [
      { color: '#6aa2ff', label: 'Company' },
      { color: '#b483ff', label: 'Sponsor' },
      { color: '#5fd0b5', label: 'Attendee' }
    ];

    types.forEach((type, i) => {
      ctx.fillStyle = type.color;
      ctx.beginPath();
      ctx.arc(legendX, legendY + i * 20 + 5, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#A8B0C3';
      ctx.fillText(type.label, legendX + 12, legendY + i * 20 + 9);
    });

    // Edge score indicator
    ctx.fillStyle = '#A8B0C3';
    ctx.fillText('Edge = Score', legendX, legendY + 75);
  }

  // Animation loop
  let animationId;
  function animate() {
    simulationStep();
    draw();
    animationId = requestAnimationFrame(animate);
  }

  // Start animation
  animate();

  // Cleanup function
  canvas._cleanup = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  };

  // Return control object
  return {
    stop: () => canvas._cleanup(),
    restart: () => {
      canvas._cleanup();
      animate();
    }
  };
}

/**
 * Add interactive tooltips to the graph
 */
export function addGraphInteractivity(canvas, nodes, edges) {
  const tooltip = document.createElement('div');
  tooltip.style.position = 'absolute';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.padding = '8px 12px';
  tooltip.style.background = '#16172e';
  tooltip.style.border = '1px solid #2a2c5a';
  tooltip.style.color = '#fff';
  tooltip.style.borderRadius = '8px';
  tooltip.style.font = '12px system-ui';
  tooltip.style.display = 'none';
  tooltip.style.zIndex = '1000';
  tooltip.style.maxWidth = '300px';

  canvas.parentElement.style.position = 'relative';
  canvas.parentElement.appendChild(tooltip);

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find closest node
    let closestNode = null;
    let minDistance = 20; // Detection radius

    nodes.forEach(node => {
      const distance = Math.hypot(node.x - x, node.y - y);
      if (distance < minDistance) {
        minDistance = distance;
        closestNode = node;
      }
    });

    if (closestNode) {
      // Find edges for this node
      const nodeEdges = edges.filter(e =>
        e.a === closestNode.id || e.b === closestNode.id
      );

      // Get top matches
      const topMatches = nodeEdges
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(edge => {
          const otherId = edge.a === closestNode.id ? edge.b : edge.a;
          const otherNode = nodes.find(n => n.id === otherId);
          return {
            name: otherNode?.label || otherId,
            score: Math.round(edge.score * 100),
            reasons: edge.reasons
          };
        });

      tooltip.style.display = 'block';
      tooltip.style.left = (x + 12) + 'px';
      tooltip.style.top = (y + 12) + 'px';

      let html = `
        <strong>${closestNode.label}</strong><br>
        <span style="opacity:.7">${closestNode.subtitle || ''}</span><br>
        <span style="opacity:.7">Connections: ${closestNode.degree || 0}</span>
      `;

      if (topMatches.length > 0) {
        html += '<br><br><strong>Top Matches:</strong>';
        topMatches.forEach(match => {
          html += `<br>• ${match.name} (${match.score}%)`;
          if (match.reasons && match.reasons[0]) {
            html += `<br>  <span style="opacity:.7;font-size:10px">${match.reasons[0]}</span>`;
          }
        });
      }

      tooltip.innerHTML = html;
    } else {
      tooltip.style.display = 'none';
    }
  });

  canvas.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
  });
}

/**
 * Build graph data from matches
 */
export function graphFromMatches(actors, matches, threshold = 0.65) {
  const actorMap = Object.fromEntries(actors.map(a => [a.id, a]));

  // Filter edges by threshold
  const edges = matches
    .filter(m => m.score >= threshold)
    .map(m => ({
      a: m.a,
      b: m.b,
      score: m.score,
      reasons: m.reasons
    }));

  // Calculate node degrees
  const degrees = {};
  edges.forEach(edge => {
    degrees[edge.a] = (degrees[edge.a] || 0) + 1;
    degrees[edge.b] = (degrees[edge.b] || 0) + 1;
  });

  // Define colors by actor type
  const colorByType = {
    company: '#6aa2ff',
    sponsor: '#b483ff',
    attendee: '#5fd0b5'
  };

  // Create nodes
  const nodes = Object.values(actorMap)
    .filter(actor => degrees[actor.id] > 0) // Only show connected nodes
    .map(actor => ({
      id: actor.id,
      label: actor.name || actor.id,
      degree: degrees[actor.id] || 0,
      color: colorByType[actor.actorType] || '#aab',
      subtitle: (actor.actorType || '').toUpperCase()
    }));

  return { nodes, edges };
}