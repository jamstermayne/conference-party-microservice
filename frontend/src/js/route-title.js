import Events from '/assets/js/events.js?v=b021';

const FRIENDLY = {
  parties:'Parties',
  hotspots:'Hotspots',
  map:'Map',
  calendar:'Calendar',
  invites:'Invites',
  me:'Account'
};

function setTitles(route){
  const name = FRIENDLY[route] || 'Parties';
  // We purposefully do not render a page-level h1 here to avoid duplication.
  document.title = `velocity.ai — ${name}`;
}
Events.on?.('navigate', setTitles);
