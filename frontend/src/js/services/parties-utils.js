// Group parties by calendar day (UTC-safe; replace with tz if available)
export function groupPartiesByDay(list) {
  const byDay = new Map();
  for (const p of list || []) {
    const d = new Date(p.start || p.startsAt || p.startTime);
    if (isNaN(d)) continue;
    const dayKey = d.toISOString().slice(0, 10); // YYYY-MM-DD
    (byDay.get(dayKey) || byDay.set(dayKey, []).get(dayKey)).push(p);
  }
  const days = [...byDay.keys()].sort(); // ascending
  return { days, byDay };
}

export function prettyDayLabel(isoDay) {
  // Noon avoids DST shenanigans when localizing month/day names
  const d = new Date(`${isoDay}T12:00:00Z`);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}