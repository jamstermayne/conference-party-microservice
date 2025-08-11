import { API } from './api.js';
import { Store, Events, EVENTS } from './state.js';
import { qs, toast } from './ui.js';
import { createErrorState, createRetryButton } from './error-states.js';

export function PartiesView(){
  const wrap = document.createElement('section');
  wrap.innerHTML = `
    <div class="card-row">
      <div><div class="h1">Pick Your Parties</div><div class="sub">Real Gamescom events • Save now, sync later</div></div>
      <div class="cta"><button id="btn-save" class="btn btn-primary">Save Selection</button></div>
    </div>
    <div id="party-list" class="list" role="list"></div>
  `;
  loadParties(wrap);
  wrap.querySelector('#btn-save').addEventListener('click', onSave);
  return wrap;
}

async function loadParties(root){
  const list = root.querySelector('#party-list');
  
  // Show loading state
  list.innerHTML = '';
  list.appendChild(createErrorState('loading'));
  
  const retryLoad = async () => {
    list.innerHTML = '';
    list.appendChild(createErrorState('loading'));
    
    try {
      const parties = await API.listParties();
      Store.parties = parties;
      list.innerHTML = '';
      
      if (parties && parties.length > 0) {
        parties.forEach(p => list.appendChild(renderPartyRow(p)));
        console.log(`✅ Rendered ${parties.length} parties`);
      } else {
        // Empty state
        list.appendChild(createErrorState('empty-state', {
          title: 'No Events Available',
          message: 'No Gamescom 2025 events found. Check back later for updates.',
          icon: '🎮',
          actionText: 'Refresh',
          refreshFn: retryLoad
        }));
      }
    } catch (error) {
      console.error('Failed to load parties:', error);
      
      // Determine error type and show appropriate state
      const errorType = error.message?.includes('timeout') ? 'network-error' : 'network-error';
      
      list.innerHTML = '';
      list.appendChild(createErrorState(errorType, {
        message: error.message || 'Unable to load events from our servers.',
        retryFn: retryLoad,
        offlineFn: () => {
          // Show local data if available
          if (Store.parties && Store.parties.length > 0) {
            list.innerHTML = '';
            Store.parties.forEach(p => list.appendChild(renderPartyRow(p)));
            toast('📱 Showing cached events');
          } else {
            toast('No offline events available');
          }
        }
      }));
    }
  };
  
  // Initial load
  await retryLoad();
}

function renderPartyRow(p){
  const li = document.createElement('div');
  li.className = 'list-item';
  li.setAttribute('role', 'listitem');
  li.dataset.id = p.id || p.eventId || 'unknown';
  const selected = Store.savedPartyIds.has(li.dataset.id);
  
  li.innerHTML = `
    <div>
      <div class="list-title">${escapeHTML(p.title || p.name || 'Untitled Event')}</div>
      <div class="list-sub">${escapeHTML(p.venue || p.location || 'TBD')} • ${fmtTime(p.start || p.startTime)} – ${fmtTime(p.end || p.endTime)}</div>
      <div class="badges">
        ${badge(p.persona?.dev || 0,'dev')} ${badge(p.persona?.pub || 0,'pub')}
        ${badge(p.persona?.inv || 0,'inv')} ${badge(p.persona?.sp || 0,'sp')}
      </div>
    </div>
    <div class="cta">
      <button class="btn btn-small ${selected?'btn-accent':''}" data-act="toggle">${selected?'Saved':'Save'}</button>
      <button class="btn btn-small btn-ghost" data-act="nav">Navigate</button>
    </div>
  `;
  
  li.addEventListener('click', e => {
    const act = e.target.closest('button')?.dataset.act;
    if (act === 'toggle') {
      toggleSave(li.dataset.id, e.target);
      e.stopPropagation();
    } else if (act === 'nav') {
      openMaps(p.venue || p.location || p.address);
      e.stopPropagation();
    }
  });
  return li;
}

function badge(n, cls){ 
  return (n>0)?`<span class="badge ${cls}">${n} ${cls.toUpperCase()}</span>`:''; 
}

function fmtTime(iso){ 
  try{ 
    if (!iso) return 'TBD';
    return new Date(iso).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  } catch { 
    return 'TBD';
  } 
}

function openMaps(venue){ 
  if (!venue) return;
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`,'_blank'); 
}

async function onSave(){
  if (!Store.savedPartyIds.size){ 
    toast('Select at least one party'); 
    return; 
  }
  
  try {
    await API.saveParties([...Store.savedPartyIds]);
    toast('Saved. You can sync to your calendar next.');
    Events.emit(EVENTS.SAVED_PARTIES, { count: Store.savedPartyIds.size });
  } catch (error) {
    console.error('Failed to save parties:', error);
    toast('Saved locally. Will sync when online.');
    Events.emit(EVENTS.SAVED_PARTIES, { count: Store.savedPartyIds.size });
  }
}

function toggleSave(id, btn){
  if (Store.savedPartyIds.has(id)) { 
    Store.savedPartyIds.delete(id); 
    btn.classList.remove('btn-accent'); 
    btn.textContent='Save'; 
  } else { 
    Store.savedPartyIds.add(id); 
    btn.classList.add('btn-accent'); 
    btn.textContent='Saved'; 
  }
}

// safe escape
function escapeHTML(s){ 
  return String(s??'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); 
}