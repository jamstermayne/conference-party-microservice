/**
 * Minimal Canvas Heatmap for Capabilities x Needs
 * Shows concentration of potential matches
 */

export function renderHeatmap({ mountId, matrix, rows, cols }) {
  const canvas = document.getElementById(mountId);
  if (!canvas) {
    console.error(`Canvas element with id "${mountId}" not found`);
    return;
  }

  const dpi = window.devicePixelRatio || 1;
  const cellSize = 22;
  const padding = 120;
  const width = padding + cols.length * cellSize + 1;
  const height = padding + rows.length * cellSize + 1;

  // Set canvas dimensions
  canvas.width = width * dpi;
  canvas.height = height * dpi;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpi, dpi);

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw axes labels
  ctx.font = '12px system-ui';
  ctx.fillStyle = '#A8B0C3';

  // Row labels (capabilities)
  rows.forEach((label, i) => {
    ctx.save();
    ctx.translate(8, padding + i * cellSize + 16);
    // Truncate long labels
    const truncated = label.length > 15 ? label.substring(0, 14) + '…' : label;
    ctx.fillText(truncated, 0, 0);
    ctx.restore();
  });

  // Column labels (needs) - rotated
  cols.forEach((label, j) => {
    ctx.save();
    ctx.translate(padding + j * cellSize + cellSize / 2, padding - 5);
    ctx.rotate(-Math.PI / 4);
    const truncated = label.length > 15 ? label.substring(0, 14) + '…' : label;
    ctx.fillText(truncated, 0, 0);
    ctx.restore();
  });

  // Draw heatmap cells
  const maxValue = Math.max(1, ...matrix.flat());

  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < cols.length; j++) {
      const value = matrix[i][j];
      const intensity = value / maxValue;

      // Color gradient from dark blue to bright purple
      const hue = 220 - 220 * intensity;
      const saturation = 70;
      const lightness = 18 + 40 * intensity;
      const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

      ctx.fillStyle = color;
      ctx.fillRect(
        padding + j * cellSize,
        padding + i * cellSize,
        cellSize - 1,
        cellSize - 1
      );

      // Add value text for high-intensity cells
      if (intensity > 0.5 && cellSize > 20) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          value.toString(),
          padding + j * cellSize + cellSize / 2,
          padding + i * cellSize + cellSize / 2
        );
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    }
  }

  // Draw legend
  const legendX = width - 120;
  const legendY = 20;
  const legendWidth = 100;
  const legendHeight = 10;

  // Legend gradient
  for (let x = 0; x < legendWidth; x++) {
    const intensity = x / legendWidth;
    const hue = 220 - 220 * intensity;
    ctx.fillStyle = `hsl(${hue}, 70%, ${18 + 40 * intensity}%)`;
    ctx.fillRect(legendX + x, legendY, 1, legendHeight);
  }

  // Legend labels
  ctx.fillStyle = '#A8B0C3';
  ctx.font = '11px system-ui';
  ctx.fillText('Low', legendX, legendY + 24);
  ctx.fillText('High', legendX + legendWidth - 28, legendY + 24);

  // Title
  ctx.fillStyle = '#F5F6FA';
  ctx.font = '14px system-ui';
  ctx.fillText('Capability-Need Match Density', 10, 20);
}

/**
 * Build capability-need matrix from actors
 */
export function buildCapNeedMatrix(actors) {
  const capabilities = new Set();
  const needs = new Set();

  // Collect all unique capabilities and needs
  actors.forEach(actor => {
    (actor.capabilities || []).forEach(cap => capabilities.add(cap));
    (actor.needs || []).forEach(need => needs.add(need));
  });

  const rows = [...capabilities].sort();
  const cols = [...needs].sort();

  // Create index maps for fast lookup
  const rowIndex = Object.fromEntries(rows.map((r, i) => [r, i]));
  const colIndex = Object.fromEntries(cols.map((c, i) => [c, i]));

  // Initialize matrix
  const matrix = Array.from({ length: rows.length }, () =>
    Array(cols.length).fill(0)
  );

  // Count matches
  actors.forEach(actor => {
    const actorCaps = actor.capabilities || [];
    const actorNeeds = actor.needs || [];

    // Self-declared capabilities and needs create potential matches
    actorCaps.forEach(cap => {
      actorNeeds.forEach(need => {
        if (rowIndex[cap] !== undefined && colIndex[need] !== undefined) {
          matrix[rowIndex[cap]][colIndex[need]] += 1;
        }
      });
    });
  });

  // Also count cross-actor matches
  actors.forEach(actorA => {
    actors.forEach(actorB => {
      if (actorA.id === actorB.id) return;

      const capsA = actorA.capabilities || [];
      const needsB = actorB.needs || [];

      capsA.forEach(cap => {
        needsB.forEach(need => {
          if (cap === need || cap.toLowerCase().includes(need.toLowerCase()) ||
              need.toLowerCase().includes(cap.toLowerCase())) {
            if (rowIndex[cap] !== undefined && colIndex[need] !== undefined) {
              matrix[rowIndex[cap]][colIndex[need]] += 0.5; // Half weight for cross-matches
            }
          }
        });
      });
    });
  });

  return { matrix, rows, cols };
}

/**
 * Interactive heatmap with tooltips
 */
export function addHeatmapInteractivity(canvas, matrix, rows, cols) {
  const padding = 120;
  const cellSize = 22;

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

  canvas.parentElement.style.position = 'relative';
  canvas.parentElement.appendChild(tooltip);

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate cell position
    const col = Math.floor((x - padding) / cellSize);
    const row = Math.floor((y - padding) / cellSize);

    if (row >= 0 && row < rows.length && col >= 0 && col < cols.length) {
      const value = matrix[row][col];
      tooltip.style.display = 'block';
      tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
      tooltip.style.top = (e.clientY - rect.top + 12) + 'px';
      tooltip.innerHTML = `
        <strong>Capability:</strong> ${rows[row]}<br>
        <strong>Need:</strong> ${cols[col]}<br>
        <strong>Matches:</strong> ${value}
      `;
    } else {
      tooltip.style.display = 'none';
    }
  });

  canvas.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
  });
}