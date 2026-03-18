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

  return { totalUsers: totalUsers || 0, recentSignups: recentSignups || 0, withBirthData: withBirthData || 0 };
}
