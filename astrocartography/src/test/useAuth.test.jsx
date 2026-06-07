import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signUp: vi.fn().mockResolvedValue({
        data: { user: { id: 'new-user', email: 'new@test.com' }, session: null },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@test.com' }, session: {} },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'test-user',
          email: 'test@test.com',
          birth_date: '1990-06-15',
          birth_time: '14:30',
          birth_lat: 51.51,
          birth_lng: -0.13,
          birth_city: 'London',
          is_admin: false,
        },
        error: null,
      }),
      upsert: vi.fn().mockReturnThis(),
    })),
  },
}));

import { AuthProvider, useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

function wrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in loading state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
  });

  it('sets ready after timeout (3s safety net)', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.loading).toBe(true);
    act(() => { vi.advanceTimersByTime(3100); });
    expect(result.current.loading).toBe(false);
  });

  it('throws when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within AuthProvider');
  });

  it('provides signIn, signUp, signOut, resetPassword functions', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signUp).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
    expect(typeof result.current.resetPassword).toBe('function');
    expect(typeof result.current.saveBirthData).toBe('function');
  });

  it('hasBirthData is false when no profile', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.hasBirthData).toBe(false);
  });

  it('isAdmin is false when no profile', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAdmin).toBe(false);
  });

  it('provides loadProfile function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.loadProfile).toBe('function');
  });

  it('does not mark an expected missing profile row as a load failure', async () => {
    supabase.from.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'PGRST116: no rows returned' },
      }),
    }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.signIn('new@test.com', 'password1234');
    });

    expect(result.current.user?.id).toBe('test-user');
    expect(result.current.profile).toBe(null);
    expect(result.current.profileResolved).toBe(true);
    expect(result.current.profileLoadFailed).toBe(false);
    expect(result.current.hasBirthData).toBe(false);
  });

  it('marks persistent profile fetch errors as recovery state instead of clearing to birth-data state', async () => {
    supabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Lock broken: request aborted' },
      }),
    }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      const promise = result.current.signIn('test@test.com', 'password1234');
      await vi.runAllTimersAsync();
      await promise;
    });

    expect(result.current.user?.id).toBe('test-user');
    expect(result.current.profile).toBe(null);
    expect(result.current.profileResolved).toBe(true);
    expect(result.current.profileLoadFailed).toBe(true);
    expect(result.current.hasBirthData).toBe(false);
  });
});
