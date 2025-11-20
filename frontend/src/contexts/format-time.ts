/**
 * Formats a given Date object into a string array containing time and a relative date or full date.
 *
 * @param target The Date object to format.
 * @returns A string array where the first element is the formatted time (HH:MM) and the second (if present) is a relative date (e.g., "Yesterday", "Tomorrow", "Monday") or a full date (e.g., "01 Jan 2023").
 */
export const formatTime = (target: Date): string[] => {
  const time = target.toTimeString().split(':').slice(0, 2).join(':');
  const now = new Date();

  if (now.getMonth() == target.getMonth() && now.getFullYear() == target.getFullYear()) {
    if (now.getDate() == target.getDate()) return [time];
    if (now.getDate() - 1 == target.getDate()) return [time, 'Yesterday'];
    if (now.getDate() + 1 == target.getDate()) return [time, 'Tomorrow'];
    if (Math.abs(now.getDate() - target.getDate()) < 7) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return [time, days[target.getDay()]];
    }
  }

  const parts = target.toDateString().split(' ');
  const date = [parts[2], parts[1], parts[3]].join(' ');
  return [time, date];
};
