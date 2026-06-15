// "Updated 2 days ago" style relative time, matching the design's copy.
export function relativeTime(date: Date | number): string {
  const then = typeof date === 'number' ? date : date.getTime();
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);

  if (sec < 45) return 'just now';
  if (min < 60) return `${min} min ago`;
  if (hr < 24) return `${hr} hr ago`;
  if (day === 1) return 'yesterday';
  if (day < 7) return `${day} days ago`;
  if (day < 14) return 'last week';
  if (day < 60) return `${Math.round(day / 7)} weeks ago`;
  // Older: show a short date.
  return new Date(then).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** "120 mi" / "1,240 mi" — whole miles with a thousands separator. */
export function miles(n: number): string {
  return `${Math.round(n).toLocaleString()} mi`;
}

export function pluralize(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

// Rough drive-time estimate from straight-line miles. Real routing comes from a
// distance API later (see ROADMAP); for now assume ~55 mph effective average
// plus a small road-vs-crow-flies factor.
export function driveEstimate(straightMiles: number): { miles: number; label: string } {
  const roadMiles = Math.round(straightMiles * 1.25);
  const minutes = Math.round((roadMiles / 55) * 60);
  let label: string;
  if (minutes < 60) label = `${minutes} min`;
  else {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    label = m === 0 ? `${h}h` : `${h}h ${m}m`;
  }
  return { miles: roadMiles, label };
}
