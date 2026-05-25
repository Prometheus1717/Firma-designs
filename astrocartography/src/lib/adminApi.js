import { supabase } from './supabase';

// ─── Helper: call the server-side admin endpoint ───
async function adminFetch(action, params = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, ...params }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Admin API error (${res.status})`);
  }

  return res.json();
}

// ─── Profiles ───

export async function fetchAllProfiles({ search = '', sortField = 'updated_at', sortAsc = false, page = 1, pageSize = 25 } = {}) {
  const result = await adminFetch('fetchProfiles', { search, sortField, sortAsc, page, pageSize });
  // result is { data: [...], total: N }
  return result;
}

export async function toggleUserPremium(userId, isPremium) {
  await adminFetch('togglePremium', { userId, isPremium });
}

// ─── Stats ───

export async function fetchAdminStats() {
  // result is { totalUsers, recentSignups, withBirthData, premiumUsers }
  return adminFetch('fetchStats');
}

// ─── Paywall ───

export async function fetchPaywallSetting() {
  const settings = await adminFetch('fetchSettings');
  return settings.paywall_enabled === 'true';
}

export async function updatePaywallSetting(enabled) {
  await adminFetch('updatePaywall', { enabled });
}

// ─── App Settings (generic key-value) ───

export async function fetchAllAppSettings() {
  // result is { key1: value1, key2: value2, ... }
  return adminFetch('fetchSettings');
}

export async function updateAppSetting(key, value) {
  await adminFetch('updateSetting', { key, value });
}

// ─── Demographics ───

export async function fetchDemographics() {
  // result is { ageBuckets, withBirthData, total, premium, free, signupTrend }
  return adminFetch('fetchDemographics');
}

// ─── Usage analytics (PostHog) ───

export async function fetchUsageStats() {
  // result is { configured, dau, wau, mau, opens24h/7d/30d, avg/medianSessionSeconds, totalSessions }
  return adminFetch('fetchUsage');
}
