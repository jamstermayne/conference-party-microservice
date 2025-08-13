import { cardGrid, calendarSlotCard } from './components/cards.js?v=b018';

export async function renderCalendar(mount){
  if(!mount) return;
  
  // Create header
  const container = document.createElement('div');
  container.innerHTML = `<div class="section-card"><div class="section-head"><div>My Calendar</div><span style="opacity:.6;font-size:.85rem">Tap to add / open</span></div></div>`;
  mount.appendChild(container);
  
  // Create grid
  const grid = cardGrid(document.createElement('div'));
  mount.appendChild(grid);

  // Mock calendar data - mix of busy and available slots
  const mockSlots = [
    {
      id: 'meet-1',
      title: 'MeetToMatch Opening',
      time: '09:00 - 10:00',
      location: 'Koelnmesse Hall 1',
      dayLabel: 'Monday Aug 18',
      date: '2025-08-18'
    },
    {
      id: 'avail-1',
      title: '',  // Empty = available
      time: '10:00 - 11:00',
      dayLabel: 'Monday Aug 18',
      date: '2025-08-18'
    },
    {
      id: 'meet-2',
      title: 'Developer Conference',
      time: '11:00 - 13:00',
      location: 'Confex Center',
      dayLabel: 'Monday Aug 18',
      date: '2025-08-18'
    },
    {
      id: 'avail-2',
      title: '',
      time: '14:00 - 15:00',
      dayLabel: 'Monday Aug 18',
      date: '2025-08-18'
    },
    {
      id: 'meet-3',
      title: 'VIP Mixer',
      time: '17:00 - 19:00',
      location: 'Marriott Rooftop',
      dayLabel: 'Monday Aug 18',
      date: '2025-08-18'
    },
    {
      id: 'avail-3',
      title: '',
      time: '09:00 - 10:00',
      dayLabel: 'Tuesday Aug 19',
      date: '2025-08-19'
    },
    {
      id: 'meet-4',
      title: 'Gamescom Launch Party',
      time: '20:00 - 23:00',
      location: 'rooftop58',
      dayLabel: 'Tuesday Aug 19',
      date: '2025-08-19'
    },
    {
      id: 'avail-4',
      title: '',
      time: '15:00 - 16:00',
      dayLabel: 'Wednesday Aug 20',
      date: '2025-08-20'
    }
  ];

  // Render calendar slots
  mockSlots.forEach(s => grid.appendChild(calendarSlotCard(s)));

  // Wire up actions
  mount.addEventListener('click', (e)=>{
    const el = e.target.closest('[data-action]');
    if(!el) return;
    if(el.dataset.action==='addMeeting'){ 
      console.log('[UI] Add meeting', el.dataset.date, el.dataset.at); 
      // Open meeting scheduler
    }
    if(el.dataset.action==='openEvent'){ 
      console.log('[UI] Open event', el.dataset.id); 
      // Show event details
    }
  });
}

export default { renderCalendar };