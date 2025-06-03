export function daysBetween(from: number | string | Date, to: number | string | Date) {
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  return Math.floor((toMs - fromMs) / (60 * 60 * 24 * 1000));
}
