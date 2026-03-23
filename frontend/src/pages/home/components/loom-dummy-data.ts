export const getLoomDummyData = () => {
  const times: string[] = [];
  const values: number[] = [];
  
  const now = new Date();
  now.setSeconds(0, 0);
  const endTime = now.getTime();
  const startTime = endTime - 24 * 60 * 60 * 1000;

  for (let t = startTime; t <= endTime; t += 60 * 1000) {
    const d = new Date(t);
    const hour = d.getHours();

    // Factory is offline from midnight to 6 AM and 10 PM to midnight
    if (hour < 6 || hour >= 22) {
      continue; // Missing time
    }

    // Power cut from 14:00 to 14:30
    if (hour === 14 && d.getMinutes() < 30) {
      continue; // Missing time
    }

    let isRunning = true;
    if (hour === 10 && d.getMinutes() < 30) isRunning = false; // Idle break
    if (hour === 12) isRunning = false; // Lunch hour idle

    times.push(d.toISOString());
    values.push(isRunning ? Number((Math.random() * 2 + 3.5).toFixed(1)) : 0);
  }

  return { times, values };
};
