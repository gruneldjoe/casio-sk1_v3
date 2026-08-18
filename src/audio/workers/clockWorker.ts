/**
 * Web Worker Clock for high-precision lookahead sequencer timing.
 * Runs independently of main UI thread throttling.
 */

export const clockWorkerCode = `
let timerId = null;
let interval = 25; // 25ms tick rate

self.onmessage = function(e) {
  const data = e.data;
  if (!data) return;

  if (data.action === 'start') {
    interval = data.interval || interval;
    if (timerId !== null) clearInterval(timerId);
    timerId = setInterval(() => {
      self.postMessage({ type: 'tick' });
    }, interval);
    self.postMessage({ type: 'started' });
  } else if (data.action === 'stop') {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
    self.postMessage({ type: 'stopped' });
  } else if (data.action === 'setInterval') {
    interval = data.interval || interval;
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = setInterval(() => {
        self.postMessage({ type: 'tick' });
      }, interval);
    }
  }
};
`;

export function createClockWorker(): Worker {
  const blob = new Blob([clockWorkerCode], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  return worker;
}
