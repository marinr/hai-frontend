export function formatDateLabel(date: Date, today: Date): string {
  const sameDay = date.toDateString() === today.toDateString();
  if (sameDay) return 'Today';

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

  return date.toLocaleDateString('en-GB');
}
