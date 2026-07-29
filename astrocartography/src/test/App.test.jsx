import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock supabase before importing components
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockReturnThis(),
    })),
  },
}));

// Mock Dashboard to avoid heavy D3/astronomy imports in unit tests
vi.mock('../pages/Dashboard', () => ({
  default: ({ demo }) => <div data-testid="dashboard">{demo ? 'Demo Mode' : 'Full Dashboard'}</div>,
}));

vi.mock('../pages/AuthPage', () => ({
  default: () => <div data-testid="auth-page">Auth Page</div>,
}));

vi.mock('../pages/BirthDataPage', () => ({
  default: () => <div data-testid="birth-data-page">Birth Data Page</div>,
}));

vi.mock('../pages/AdminPage', () => ({
  default: () => <div data-testid="admin-page">Admin Page</div>,
}));

import App, { isEmbeddedDemoRequest } from '../App';

describe('App routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('shows loading screen initially', () => {
    render(<App />);
    expect(screen.getByText('NATAL NAVIGATOR')).toBeInTheDocument();
  });

  it('ignores and clears a stale embedded-demo flag in the top-level window', () => {
    window.sessionStorage.setItem('nn_embedded_demo', '1');

    expect(window.self).toBe(window.top);
    expect(isEmbeddedDemoRequest()).toBe(false);
    expect(window.sessionStorage.getItem('nn_embedded_demo')).toBeNull();
  });
});

describe('App component structure', () => {
  it('wraps app in error boundary', () => {
    // App should not throw - error boundary catches errors
    expect(() => render(<App />)).not.toThrow();
  });
});
