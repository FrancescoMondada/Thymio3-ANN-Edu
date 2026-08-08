/**
 * Sliding 1-second window of event timestamps → instantaneous Hz.
 */
export function createRateMeter() {
  const times = [];

  function prune(now) {
    while (times.length && now - times[0] > 1000) times.shift();
  }

  return {
    tick() {
      const now = performance.now();
      times.push(now);
      prune(now);
    },

    /** Events per second over the last second (0 if quiet). */
    hz() {
      const now = performance.now();
      prune(now);
      return times.length;
    },

    clear() {
      times.length = 0;
    },
  };
}
