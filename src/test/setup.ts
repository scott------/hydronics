import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Reset localStorage before each test
beforeEach(() => {
  localStorage.clear();
});
