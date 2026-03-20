import '@testing-library/jest-dom';

// Mock Web Worker
class MockWorker {
  constructor() { this.onmessage = null; }
  postMessage(data) {
    if (this.onmessage) {
      setTimeout(() => this.onmessage({ data: { type: 'done', result: null } }), 0);
    }
  }
  terminate() {}
}
globalThis.Worker = MockWorker;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
