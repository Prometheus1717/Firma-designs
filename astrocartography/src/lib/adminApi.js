import { supabase } from './supabase';

export async function fetchAllProfiles({ search = '', sortField = 'updated_at', sortAsc = false, page = 1, pageSize = 25 } = {}) {
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(`display_name.ilike.%${search}%,birth_city.ilike.%${search}%,email.ilike.%${search}%`);
  }

  query = query
    .order(sortField, { ascending: sortAsc })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw error;
  return { data: data || [], total: count || 0 };
}

export async function fetchAdminStats() {
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { count: recentSignups } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('updated_at', weekAgo);

  const { count: withBirthData } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .not('birth_date', 'is', null);

  const { count: premiumUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_premium', true);

  return { totalUsers: totalUsers || 0, recentSignups: recentSignups || 0, withBirthData: withBirthData || 0, premiumUsers: premiumUsers || 0 };
}

export async function fetchPaywallSetting() {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'paywall_enabled')
    .single();
  return data?.value === 'true';
}

export async function updatePaywallSetting(enabled) {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: 'paywall_enabled', value: enabled ? 'true' : 'false', updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function toggleUserPremium(userId, isPremium) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_premium: isPremium, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}
