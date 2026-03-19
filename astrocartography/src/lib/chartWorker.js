import { calculateChart } from './calculateChart';

self.onmessage = (e) => {
  try {
    const result = calculateChart(e.data);
    self.postMessage({ type: 'success', data: result });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
};
