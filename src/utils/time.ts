export function timeStringToSeconds(timeString: string): number {
  let totalSeconds = 0;

  const timeRegex = /(\d+)([hms])/g;
  let match;

  while ((match = timeRegex.exec(timeString)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2];

    // Convert the time units to seconds
    if (unit === "h") {
      totalSeconds += value * 3600; // 1 hour = 3600 seconds
    } else if (unit === "m") {
      totalSeconds += value * 60; // 1 minute = 60 seconds
    } else if (unit === "s") {
      totalSeconds += value; // seconds are already in seconds
    }
  }

  return totalSeconds;
}
