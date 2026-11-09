/** Calendar calculation shared by the planner and its tests. */
const dayLabels = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const fromKey = (v: string) => { const [y, m, d] = v.split('-').map(Number); return new Date(y, m - 1, d); };
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const plusDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const weekOptions = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
export type PlanPreview = { firstDate: string; endDate: string; totalPeriods: number; totalMeetings: number; counts: Record<string, number> };
export function previewTeachingPlan(start: string, weekdays: string[], credits: number): PlanPreview | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !Number.isInteger(credits) || credits < 1 || credits > 10 || weekdays.length < 1 || weekdays.length > 7 || new Set(weekdays).size !== weekdays.length) return null;
  const selected = new Set(weekdays);
  if (weekdays.some(day => !weekOptions.includes(day))) return null;
  const totalMeetings = credits * 5;
  if (weekdays.length > totalMeetings) return null;
  const counts: Record<string, number> = Object.fromEntries(weekOptions.map(day => [day, 0]));
  let current = fromKey(start);
  if (Number.isNaN(current.getTime()) || key(current) !== start) return null;
  let firstDate = '';
  let endDate = '';
  let completed = 0;
  while (completed < totalMeetings) {
    const day = dayLabels[current.getDay()];
    if (selected.has(day)) {
      const k = key(current);
      if (!firstDate) firstDate = k;
      endDate = k;
      counts[day]++;
      completed++;
    }
    current = plusDays(current, 1);
  }
  return { firstDate, endDate, totalPeriods: credits * 15, totalMeetings, counts };
}
