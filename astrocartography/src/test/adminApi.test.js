import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSelect = vi.fn().mockReturnThis();
const mockOr = vi.fn().mockReturnThis();
const mockOrder = vi.fn().mockReturnThis();
const mockRange = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
const mockGte = vi.fn().mockReturnThis();
const mockNot = vi.fn().mockResolvedValue({ count: 5 });

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn((sel, opts) => {
        if (opts?.head) {
          return {
            gte: mockGte,
            not: mockNot,
            then: (cb) => cb({ count: 10 }),
          };
        }
        return {
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({ data: [{ id: '1' }], count: 1, error: null }),
            }),
          }),
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({ data: [{ id: '1' }, { id: '2' }], count: 2, error: null }),
          }),
        };
      }),
    })),
  },
}));

import { fetchAllProfiles, fetchAdminStats } from '../lib/adminApi';

describe('adminApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAllProfiles', () => {
    it('returns data and total', async () => {
      const result = await fetchAllProfiles();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('accepts search parameter', async () => {
      const result = await fetchAllProfiles({ search: 'test' });
      expect(result).toHaveProperty('data');
    });

    it('accepts pagination parameters', async () => {
      const result = await fetchAllProfiles({ page: 2, pageSize: 10 });
      expect(result).toHaveProperty('data');
    });

    it('accepts sort parameters', async () => {
      const result = await fetchAllProfiles({ sortField: 'email', sortAsc: true });
      expect(result).toHaveProperty('data');
    });
  });

  describe('fetchAdminStats', () => {
    it('returns stats object', async () => {
      const result = await fetchAdminStats();
      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('recentSignups');
      expect(result).toHaveProperty('withBirthData');
    });

    it('returns numeric values', async () => {
      const result = await fetchAdminStats();
      expect(typeof result.totalUsers).toBe('number');
      expect(typeof result.recentSignups).toBe('number');
      expect(typeof result.withBirthData).toBe('number');
    });
  });
});
