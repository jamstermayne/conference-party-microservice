// hotspots-controller.js
export function renderHotspots(root) {
  const main = root || document.getElementById('main') || document.getElementById('page-root');
  if (!main) return;
  
  main.innerHTML = `
    <section class="panel">
      <div class="panel-head">
        <h2>Hotspots</h2>
        <p class="subtle">Live venue heat tracking</p>
      </div>
      <div class="empty-state">
        <div class="empty-icon">🔥</div>
        <h3 class="empty-title">Live heat isn't available yet</h3>
        <p class="empty-message">
          Real-time venue tracking will show where the action is during the conference.
        </p>
        <button class="btn btn-primary" onclick="location.reload()">
          Refresh
        </button>
      </div>
    </section>
    
    <style>
      .empty-state {
        text-align: center;
        padding: 60px 20px;
        max-width: 400px;
        margin: 0 auto;
      }
      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.8;
      }
      .empty-title {
        font-size: 20px;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 12px;
      }
      .empty-message {
        font-size: 14px;
        color: #6b7280;
        margin: 0 0 24px;
        line-height: 1.5;
      }
    </style>
  `;
}
export default { renderHotspots };