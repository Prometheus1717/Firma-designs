import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchAllProfiles, fetchAdminStats, fetchPaywallSetting, updatePaywallSetting, toggleUserPremium, fetchAllAppSettings, updateAppSetting, fetchDemographics, fetchUsageStats } from '../lib/adminApi';
import { isLightMode, getTheme } from '../lib/theme';

const F = { fontFamily: 'JetBrains Mono, monospace' };

function StatCard({ label, value, color, T }) {
  return (
    <div style={{ background: T.p, border: `1px solid ${T.bd}`, borderRadius: 10, padding: '18px 20px', flex: 1, minWidth: 140 }}>
      <div style={{ ...F, fontSize: 8, color: T.td, letterSpacing: 1.5, marginBottom: 8 }}>{label}</div>
      <div style={{ ...F, fontSize: 28, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function SettingRow({ label, description, children, T }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${T.d}`, flexWrap: 'wrap', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ ...F, fontSize: 11, fontWeight: 600, color: T.tx }}>{label}</div>
        {description && <div style={{ ...F, fontSize: 9, color: T.td, marginTop: 3, lineHeight: 1.5 }}>{description}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{children}</div>
    </div>
  );
}

function ToggleButton({ active, onToggle, loading, activeLabel, inactiveLabel, activeColor = '#00D88A', inactiveColor = '#F04060' }) {
  const color = active ? inactiveColor : activeColor;
  return (
    <div
      onClick={loading ? undefined : onToggle}
      style={{ ...F, fontSize: 9, fontWeight: 600, cursor: loading ? 'default' : 'pointer', padding: '8px 20px', borderRadius: 6, letterSpacing: 0.5, transition: 'all .2s', color, border: `1px solid ${color}40`, background: `${color}10` }}
    >
      {loading ? '...' : active ? inactiveLabel : activeLabel}
    </div>
  );
}

function formatDate(d) {
  if (!d) return '\u2014';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y?.slice(-2)}`;
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  return `${h}:${m}`;
}

function formatDuration(s) {
  if (!s || s < 0) return '0s';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m === 0 ? `${sec}s` : `${m}m ${sec}s`;
}

function MetricCell({ label, value, color, T }) {
  return (
    <div style={{ background: T.bg, borderRadius: 8, padding: '12px 16px' }}>
      <div style={{ ...F, fontSize: 8, color: T.td, letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ ...F, fontSize: 18, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function BarRow({ label, count, max, color, T, labelWidth = 48 }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
      <div
        title={typeof label === 'string' ? label : undefined}
        style={{ ...F, fontSize: 9, color: T.tm, width: labelWidth, flexShrink: 0, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {label}
      </div>
      <div style={{ flex: 1, height: 16, background: T.bg, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .3s', minWidth: count > 0 ? 3 : 0 }} />
      </div>
      <div style={{ ...F, fontSize: 9, color: T.tx, width: 36, flexShrink: 0 }}>{count}</div>
    </div>
  );
}

function TrendBars({ data, color, T }) {
  const max = Math.max(1, ...data.map(d => d.count));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 56 }}>
      {data.map(d => (
        <div
          key={d.date}
          title={`${d.date}: ${d.count}`}
          style={{ flex: 1, height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? 3 : 1, background: d.count > 0 ? color : T.d, borderRadius: 2, transition: 'height .3s' }}
        />
      ))}
    </div>
  );
}

function OverviewTab({ stats, demographics, usage, paywallEnabled, setPaywallEnabled, T }) {
  const [paywallLoading, setPaywallLoading] = useState(false);

  return (
    <>
      {stats && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
          <StatCard label="TOTAL USERS" value={stats.totalUsers} color="#00D88A" T={T} />
          <StatCard label="LAST 7 DAYS" value={stats.recentSignups} color="#D8A030" T={T} />
          <StatCard label="PROFILES COMPLETE" value={stats.withBirthData} color="#5BA8D4" T={T} />
          <StatCard label="PREMIUM USERS" value={stats.premiumUsers} color="#E8A838" T={T} />
        </div>
      )}

      <div style={{ background: T.p, border: `1px solid ${paywallEnabled ? '#E8A83830' : '#00D88A30'}`, borderRadius: 10, padding: '14px 20px', marginBottom: 20 }}>
        <SettingRow
          label="Paywall"
          description={paywallEnabled ? 'Active \u2014 free users see the upgrade screen' : 'Disabled \u2014 all users have full access'}
          T={T}
        >
          <ToggleButton
            active={paywallEnabled}
            loading={paywallLoading}
            onToggle={async () => {
              setPaywallLoading(true);
              try {
                await updatePaywallSetting(!paywallEnabled);
                setPaywallEnabled(!paywallEnabled);
              } catch (e) { console.error('Paywall toggle error:', e); }
              setPaywallLoading(false);
            }}
            activeLabel="ENABLE"
            inactiveLabel="DISABLE"
          />
        </SettingRow>
      </div>

      <div style={{ background: T.p, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 20 }}>
        <div style={{ ...F, fontSize: 9, color: T.td, letterSpacing: 1.2, marginBottom: 14 }}>QUICK INFO</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {[
            ['Conversion Rate', stats ? `${stats.totalUsers > 0 ? ((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1) : 0}%` : '\u2014', '#E8A838'],
            ['Completion Rate', stats ? `${stats.totalUsers > 0 ? ((stats.withBirthData / stats.totalUsers) * 100).toFixed(1) : 0}%` : '\u2014', '#5BA8D4'],
            ['Weekly Growth', stats ? `${stats.totalUsers > 0 ? ((stats.recentSignups / stats.totalUsers) * 100).toFixed(1) : 0}%` : '\u2014', '#D8A030'],
          ].map(([label, val, color]) => (
            <div key={label} style={{ background: T.bg, borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ ...F, fontSize: 8, color: T.td, letterSpacing: 1, marginBottom: 6 }}>{label}</div>
              <div style={{ ...F, fontSize: 18, fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── App Usage (PostHog) ─── */}
      <div style={{ background: T.p, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 20, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ ...F, fontSize: 9, color: '#A070D0', letterSpacing: 1.2 }}>APP USAGE</div>
          <div style={{ ...F, fontSize: 7, color: T.td, letterSpacing: 1, background: T.bg, padding: '2px 7px', borderRadius: 3 }}>POSTHOG · LAST 30 DAYS</div>
        </div>

        {!usage ? (
          <div style={{ ...F, fontSize: 10, color: T.td }}>Loading usage data…</div>
        ) : usage.configured === false ? (
          <div style={{ ...F, fontSize: 10, color: T.td, lineHeight: 1.6 }}>
            PostHog analytics not connected. Set <span style={{ color: T.tm }}>POSTHOG_PERSONAL_API_KEY</span> and <span style={{ color: T.tm }}>POSTHOG_PROJECT_ID</span> in your environment to see app-open and session metrics here.
          </div>
        ) : usage.error ? (
          <div style={{ ...F, fontSize: 10, color: '#F04060', lineHeight: 1.6 }}>
            Could not load PostHog data ({usage.error}). Check the personal API key and project ID.
          </div>
        ) : (
          <>
            <div style={{ ...F, fontSize: 8, color: T.td, letterSpacing: 1, marginBottom: 8 }}>ACTIVE USERS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
              <MetricCell label="ACTIVE TODAY" value={usage.dau} color="#00D88A" T={T} />
              <MetricCell label="ACTIVE · 7 DAYS" value={usage.wau} color="#5BA8D4" T={T} />
              <MetricCell label="ACTIVE · 30 DAYS" value={usage.mau} color="#A070D0" T={T} />
            </div>
            <div style={{ ...F, fontSize: 8, color: T.td, letterSpacing: 1, marginBottom: 8 }}>APP OPENS & SESSIONS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              <MetricCell label="OPENS · 24H" value={usage.opens24h} color="#D8A030" T={T} />
              <MetricCell label="OPENS · 7 DAYS" value={usage.opens7d} color="#D8A030" T={T} />
              <MetricCell label="OPENS · 30 DAYS" value={usage.opens30d} color="#D8A030" T={T} />
              <MetricCell label="AVG TIME ON SITE" value={formatDuration(usage.avgSessionSeconds)} color="#E8A838" T={T} />
              <MetricCell label="MEDIAN TIME" value={formatDuration(usage.medianSessionSeconds)} color="#E8A838" T={T} />
              <MetricCell label="SESSIONS · 30D" value={usage.totalSessions} color="#5BA8D4" T={T} />
            </div>
          </>
        )}
      </div>

      {/* ─── Demographics ─── */}
      <div style={{ background: T.p, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 20, marginTop: 20 }}>
        <div style={{ ...F, fontSize: 9, color: '#5BA8D4', letterSpacing: 1.2, marginBottom: 16 }}>DEMOGRAPHICS</div>

        {!demographics ? (
          <div style={{ ...F, fontSize: 10, color: T.td }}>Loading demographics…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
            {/* Age distribution */}
            <div>
              <div style={{ ...F, fontSize: 8, color: T.td, letterSpacing: 1, marginBottom: 12 }}>
                AGE DISTRIBUTION
                <span style={{ color: T.mu, marginLeft: 6 }}>({demographics.withBirthData} with birth data)</span>
              </div>
              {demographics.ageStats && demographics.ageStats.count > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  {[
                    ['AVG AGE', demographics.ageStats.avg],
                    ['MEDIAN', demographics.ageStats.median],
                    ['YOUNGEST', demographics.ageStats.min],
                    ['OLDEST', demographics.ageStats.max],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: T.bg, borderRadius: 6, padding: '8px 12px', flex: 1, minWidth: 56 }}>
                      <div style={{ ...F, fontSize: 7, color: T.td, letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                      <div style={{ ...F, fontSize: 15, fontWeight: 700, color: '#5BA8D4' }}>{val ?? '—'}</div>
                    </div>
                  ))}
                </div>
              )}
              {(() => {
                const maxAge = Math.max(1, ...demographics.ageBuckets.map(b => b.count));
                return demographics.ageBuckets.map(b => (
                  <BarRow key={b.label} label={b.label} count={b.count} max={maxAge} color="#5BA8D4" T={T} />
                ));
              })()}
            </div>

            {/* Premium vs Free */}
            <div>
              <div style={{ ...F, fontSize: 8, color: T.td, letterSpacing: 1, marginBottom: 12 }}>PREMIUM VS FREE</div>
              {(() => {
                const maxPF = Math.max(1, demographics.premium, demographics.free);
                return (
                  <>
                    <BarRow label="PRO" count={demographics.premium} max={maxPF} color="#E8A838" T={T} />
                    <BarRow label="FREE" count={demographics.free} max={maxPF} color="#5A7088" T={T} />
                  </>
                );
              })()}
              <div style={{ ...F, fontSize: 9, color: T.td, marginTop: 10 }}>
                {demographics.total > 0 ? ((demographics.premium / demographics.total) * 100).toFixed(1) : 0}% premium of {demographics.total} users
              </div>
            </div>

            {/* Signup trend */}
            <div>
              <div style={{ ...F, fontSize: 8, color: T.td, letterSpacing: 1, marginBottom: 12 }}>
                NEW SIGNUPS
                <span style={{ color: T.mu, marginLeft: 6 }}>
                  (last 30 days · {demographics.signupTrend.reduce((s, d) => s + d.count, 0)} total)
                </span>
              </div>
              <TrendBars data={demographics.signupTrend} color="#00D88A" T={T} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ ...F, fontSize: 7, color: T.mu }}>30d ago</span>
                <span style={{ ...F, fontSize: 7, color: T.mu }}>today</span>
              </div>
            </div>

            {/* Birth-country distribution */}
            <div>
              <div style={{ ...F, fontSize: 8, color: T.td, letterSpacing: 1, marginBottom: 12 }}>
                BIRTH COUNTRIES
                <span style={{ color: T.mu, marginLeft: 6 }}>
                  ({demographics.totalWithCountry || 0} attributed)
                </span>
              </div>
              {(() => {
                const list = demographics.topCountries || [];
                if (list.length === 0) {
                  return <div style={{ ...F, fontSize: 9, color: T.mu }}>No country data yet.</div>;
                }
                const maxC = Math.max(1, ...list.map(c => c.count));
                // Native ISO-2 → country name via Intl.DisplayNames. Avoids
                // shipping a country-name lookup table; falls back to the code
                // if the runtime doesn't support it (very old browsers).
                let nameOf;
                try {
                  const dn = new Intl.DisplayNames(['en'], { type: 'region' });
                  nameOf = (code) => dn.of(code) || code;
                } catch { nameOf = (code) => code; }
                // ISO-2 → flag emoji (regional indicator symbols).
                const flagOf = (code) => /^[A-Z]{2}$/.test(code)
                  ? String.fromCodePoint(...[...code].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)))
                  : '·';
                return list.map(c => {
                  const label = c.code === 'OTHER'
                    ? '· OTHER'
                    : `${flagOf(c.code)} ${nameOf(c.code)}`;
                  return <BarRow key={c.code} label={label} count={c.count} max={maxC} color="#8068C0" T={T} labelWidth={120} />;
                });
              })()}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function SettingsTab({ settings, onSave, T }) {
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('');
  const [priceLabel, setPriceLabel] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [announcementColor, setAnnouncementColor] = useState('');
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    if (!settings) return;
    setPrice(settings.display_price || '3.99');
    setCurrency(settings.display_currency || 'EUR');
    setPriceLabel(settings.price_label || 'ONE-TIME \u00B7 LIFETIME ACCESS');
    setAnnouncementText(settings.announcement_text || '');
    setAnnouncementActive(settings.announcement_active === 'true');
    setAnnouncementColor(settings.announcement_color || '#D8A030');
  }, [settings]);

  const save = async (key, value) => {
    setSaving(key);
    try {
      await onSave(key, value);
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } catch (e) { console.error('Save error:', e); }
    setSaving(null);
  };

  const inputStyle = { padding: '8px 12px', background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 6, color: T.tx, ...F, fontSize: 12, outline: 'none', boxSizing: 'border-box', width: '100%', maxWidth: 240 };
  const saveBtn = (key, value) => (
    <div
      onClick={() => save(key, value)}
      style={{ ...F, fontSize: 9, fontWeight: 600, cursor: saving === key ? 'default' : 'pointer', padding: '8px 16px', borderRadius: 6, letterSpacing: 0.5, transition: 'all .2s', color: saved === key ? '#00D88A' : '#5BA8D4', border: `1px solid ${saved === key ? '#00D88A40' : '#5BA8D440'}`, background: saved === key ? '#00D88A10' : '#5BA8D410', whiteSpace: 'nowrap' }}
    >
      {saving === key ? '...' : saved === key ? 'SAVED' : 'SAVE'}
    </div>
  );

  return (
    <>
      <div style={{ background: T.p, border: `1px solid ${T.bd}`, borderRadius: 10, padding: '6px 20px 10px', marginBottom: 20 }}>
        <div style={{ ...F, fontSize: 9, color: '#E8A838', letterSpacing: 1.5, padding: '14px 0 8px', borderBottom: `1px solid ${T.d}` }}>PRICING</div>

        <SettingRow label="Display Price" description="The price shown on the paywall screen. Make sure it matches your Stripe price." T={T}>
          <input value={price} onChange={e => setPrice(e.target.value)} style={{ ...inputStyle, maxWidth: 100, textAlign: 'right' }} placeholder="3.99" />
          {saveBtn('display_price', price)}
        </SettingRow>

        <SettingRow label="Currency" description="Currency symbol or code shown next to the price." T={T}>
          <select
            value={currency}
            onChange={e => { setCurrency(e.target.value); save('display_currency', e.target.value); }}
            style={{ ...inputStyle, maxWidth: 120, cursor: 'pointer', WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', paddingRight: 28, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%235A7088'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="CHF">CHF</option>
          </select>
        </SettingRow>

        <SettingRow label="Price Label" description="Text shown below the price (e.g. ONE-TIME \u00B7 LIFETIME ACCESS)." T={T}>
          <input value={priceLabel} onChange={e => setPriceLabel(e.target.value)} style={{ ...inputStyle, maxWidth: 260 }} placeholder="ONE-TIME \u00B7 LIFETIME ACCESS" />
          {saveBtn('price_label', priceLabel)}
        </SettingRow>

        <div style={{ ...F, fontSize: 9, color: T.td, padding: '14px 0 6px', lineHeight: 1.6 }}>
          The actual charge amount is controlled by your Stripe Price ID (environment variable). Change the display price here whenever you update Stripe.
        </div>
      </div>

      <div style={{ background: T.p, border: `1px solid ${T.bd}`, borderRadius: 10, padding: '6px 20px 10px', marginBottom: 20 }}>
        <div style={{ ...F, fontSize: 9, color: '#D8A030', letterSpacing: 1.5, padding: '14px 0 8px', borderBottom: `1px solid ${T.d}` }}>ANNOUNCEMENT BANNER</div>

        <SettingRow label="Banner Active" description="Show a banner at the top of the dashboard for all users." T={T}>
          <ToggleButton
            active={announcementActive}
            loading={saving === 'announcement_active'}
            onToggle={() => {
              const newVal = !announcementActive;
              setAnnouncementActive(newVal);
              save('announcement_active', newVal ? 'true' : 'false');
            }}
            activeLabel="ENABLE"
            inactiveLabel="DISABLE"
          />
        </SettingRow>

        <SettingRow label="Banner Text" description="Message shown in the announcement banner." T={T}>
          <input value={announcementText} onChange={e => setAnnouncementText(e.target.value)} style={{ ...inputStyle, maxWidth: 320 }} placeholder="Scheduled maintenance tonight at 22:00 CET" />
          {saveBtn('announcement_text', announcementText)}
        </SettingRow>

        <SettingRow label="Banner Color" description="Accent color for the announcement banner." T={T}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['#D8A030', '#F04060', '#00D88A', '#5BA8D4', '#A070D0'].map(c => (
              <div
                key={c}
                onClick={() => { setAnnouncementColor(c); save('announcement_color', c); }}
                style={{ width: 28, height: 28, borderRadius: 6, background: c, cursor: 'pointer', border: announcementColor === c ? `2px solid ${T.tx}` : '2px solid transparent', transition: 'border .15s' }}
              />
            ))}
          </div>
        </SettingRow>

        {announcementText && (
          <div style={{ marginTop: 12, marginBottom: 8 }}>
            <div style={{ ...F, fontSize: 8, color: T.td, letterSpacing: 1, marginBottom: 8 }}>PREVIEW</div>
            <div style={{ ...F, fontSize: 10, color: announcementColor, background: `${announcementColor}10`, border: `1px solid ${announcementColor}30`, borderRadius: 6, padding: '8px 14px', lineHeight: 1.5 }}>
              {announcementText}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function UsersTab({ users, total, loading, selected, setSelected, premiumToggling, setPremiumToggling, page, setPage, pageSize, searchInput, setSearchInput, sortField, setSortField, sortAsc, setSortAsc, setUsers, T }) {
  const totalPages = Math.ceil(total / pageSize);

  function handleSort(field) {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
    setPage(1);
  }

  const sortArrow = (field) => sortField === field ? (sortAsc ? ' \u25B2' : ' \u25BC') : '';

  const columns = [
    { key: 'display_name', label: 'NAME', w: 140 },
    { key: 'email', label: 'EMAIL', w: 220 },
    { key: 'birth_city', label: 'BIRTH CITY', w: 140 },
    { key: 'birth_date', label: 'BIRTH DATE', w: 100 },
    { key: 'birth_time', label: 'TIME', w: 70 },
    { key: 'updated_at', label: 'LAST UPDATE', w: 120 },
  ];

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search by name, email, or city..."
          style={{ width: '100%', maxWidth: 400, padding: '10px 14px', background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 6, color: T.tx, ...F, fontSize: 11, outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ background: T.p, border: `1px solid ${T.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'flex', background: T.b, borderBottom: `1px solid ${T.bd}`, padding: '10px 14px', overflowX: 'auto' }}>
          {columns.map(col => (
            <div
              key={col.key}
              onClick={() => handleSort(col.key)}
              style={{ ...F, fontSize: 8, color: T.td, letterSpacing: 1.2, cursor: 'pointer', width: col.w, minWidth: col.w, flexShrink: 0, userSelect: 'none' }}
            >
              {col.label}{sortArrow(col.key)}
            </div>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', ...F, fontSize: 11, color: T.td }}>Loading...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', ...F, fontSize: 11, color: T.td }}>No users found</div>
          ) : (
            users.map(u => (
              <div
                key={u.id}
                onClick={() => setSelected(selected?.id === u.id ? null : u)}
                style={{ display: 'flex', padding: '10px 14px', borderBottom: `1px solid ${T.d}`, cursor: 'pointer', background: selected?.id === u.id ? T.c : 'transparent', transition: 'background .15s', minWidth: 'fit-content' }}
                onMouseEnter={e => { if (selected?.id !== u.id) e.currentTarget.style.background = T.a; }}
                onMouseLeave={e => { if (selected?.id !== u.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ ...F, fontSize: 11, color: T.tx, width: 140, minWidth: 140, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.display_name || '\u2014'}
                  {u.is_admin && <span style={{ ...F, fontSize: 7, color: '#D8A030', marginLeft: 6 }}>ADMIN</span>}
                  {u.is_premium && <span style={{ ...F, fontSize: 7, color: '#E8A838', marginLeft: 4 }}>PRO</span>}
                </div>
                <div style={{ ...F, fontSize: 11, color: T.tm, width: 220, minWidth: 220, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email || '\u2014'}</div>
                <div style={{ ...F, fontSize: 11, color: T.tm, width: 140, minWidth: 140, flexShrink: 0 }}>{u.birth_city || '\u2014'}</div>
                <div style={{ ...F, fontSize: 11, color: T.tm, width: 100, minWidth: 100, flexShrink: 0 }}>{formatDate(u.birth_date)}</div>
                <div style={{ ...F, fontSize: 11, color: T.tm, width: 70, minWidth: 70, flexShrink: 0 }}>{formatTime(u.birth_time)}</div>
                <div style={{ ...F, fontSize: 11, color: T.td, width: 120, minWidth: 120, flexShrink: 0 }}>{u.updated_at ? new Date(u.updated_at).toLocaleDateString('de-DE') : '\u2014'}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16 }}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            style={{ ...F, fontSize: 9, color: page <= 1 ? T.mu : T.ac, background: 'transparent', border: `1px solid ${T.bd}`, borderRadius: 4, padding: '6px 12px', cursor: page <= 1 ? 'default' : 'pointer' }}
          >
            PREV
          </button>
          <span style={{ ...F, fontSize: 9, color: T.td }}>{page} / {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            style={{ ...F, fontSize: 9, color: page >= totalPages ? T.mu : T.ac, background: 'transparent', border: `1px solid ${T.bd}`, borderRadius: 4, padding: '6px 12px', cursor: page >= totalPages ? 'default' : 'pointer' }}
          >
            NEXT
          </button>
        </div>
      )}

      {selected && (
        <div style={{ marginTop: 16, background: T.p, border: `1px solid ${selected.is_admin ? '#D8A03040' : T.bd}`, borderRadius: 10, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ ...F, fontSize: 16, fontWeight: 700, color: T.tx }}>
              {selected.display_name || 'No name'}
              {selected.is_admin && <span style={{ ...F, fontSize: 9, color: '#D8A030', marginLeft: 10 }}>ADMIN</span>}
              {selected.is_premium && <span style={{ ...F, fontSize: 9, color: '#E8A838', marginLeft: 10 }}>PREMIUM</span>}
            </div>
            <span onClick={() => setSelected(null)} style={{ ...F, fontSize: 11, color: T.td, cursor: 'pointer' }}>CLOSE</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {[
              ['EMAIL', selected.email],
              ['USER ID', selected.id],
              ['BIRTH DATE', formatDate(selected.birth_date)],
              ['BIRTH TIME', formatTime(selected.birth_time)],
              ['BIRTH CITY', selected.birth_city],
              ['COORDINATES', selected.birth_lat != null ? `${selected.birth_lat?.toFixed(2)}, ${selected.birth_lng?.toFixed(2)}` : '\u2014'],
              ['STRIPE ID', selected.stripe_customer_id || '\u2014'],
              ['LAST UPDATE', selected.updated_at ? new Date(selected.updated_at).toLocaleString('de-DE') : '\u2014'],
              ['CREATED', selected.created_at ? new Date(selected.created_at).toLocaleString('de-DE') : '\u2014'],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ ...F, fontSize: 8, color: T.td, letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                <div style={{ ...F, fontSize: 11, color: T.tm, wordBreak: 'break-all' }}>{val || '\u2014'}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.bd}`, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ ...F, fontSize: 10, fontWeight: 600, color: T.tx }}>Premium Status</div>
              <div style={{ ...F, fontSize: 9, color: T.td, marginTop: 2 }}>
                {selected.is_premium ? 'This user has premium access' : 'This user is on the free plan'}
              </div>
            </div>
            <div
              onClick={async () => {
                if (premiumToggling === selected.id) return;
                setPremiumToggling(selected.id);
                try {
                  const newVal = !selected.is_premium;
                  await toggleUserPremium(selected.id, newVal);
                  setSelected({ ...selected, is_premium: newVal });
                  setUsers(prev => prev.map(u => u.id === selected.id ? { ...u, is_premium: newVal } : u));
                } catch (e) { console.error('Premium toggle error:', e); }
                setPremiumToggling(null);
              }}
              style={{ ...F, fontSize: 9, fontWeight: 600, cursor: premiumToggling === selected.id ? 'default' : 'pointer', padding: '8px 18px', borderRadius: 6, letterSpacing: 0.5, transition: 'all .2s', color: selected.is_premium ? '#F04060' : '#E8A838', border: `1px solid ${selected.is_premium ? '#F0406040' : '#E8A83840'}`, background: selected.is_premium ? '#F0406010' : '#E8A83810' }}
            >
              {premiumToggling === selected.id ? '...' : selected.is_premium ? 'REVOKE PREMIUM' : 'GRANT PREMIUM'}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const TABS = [
  { key: 'overview', label: 'OVERVIEW', color: '#00D88A' },
  { key: 'settings', label: 'SETTINGS', color: '#E8A838' },
  { key: 'users', label: 'USERS', color: '#5BA8D4' },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const T = getTheme(isLightMode());
  const [activeTab, setActiveTab] = useState('overview');

  const [stats, setStats] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [usage, setUsage] = useState(null);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('updated_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paywallEnabled, setPaywallEnabled] = useState(true);
  const [premiumToggling, setPremiumToggling] = useState(null);
  const [appSettings, setAppSettings] = useState(null);
  const pageSize = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, pw, as] = await Promise.all([
        fetchAdminStats(),
        fetchAllProfiles({ search, sortField, sortAsc, page, pageSize }),
        fetchPaywallSetting(),
        fetchAllAppSettings(),
      ]);
      setStats(s);
      setUsers(u.data);
      setTotal(u.total);
      setPaywallEnabled(pw);
      setAppSettings(as);
    } catch (e) {
      console.error('Admin fetch error:', e);
    }
    setLoading(false);
  }, [search, sortField, sortAsc, page]);

  useEffect(() => { load(); }, [load]);

  // Demographics & PostHog usage don't depend on search/sort/page — fetch once.
  useEffect(() => {
    fetchDemographics().then(setDemographics).catch(() => setDemographics(null));
    fetchUsageStats().then(setUsage).catch(() => setUsage(null));
  }, []);

  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSaveSetting = async (key, value) => {
    await updateAppSetting(key, value);
    setAppSettings(prev => ({ ...prev, [key]: String(value) }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: T.bg, color: T.tx, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 38, minHeight: 38, background: T.p, borderBottom: `1px solid ${T.bd}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ ...F, fontSize: 12, fontWeight: 700, color: T.ac, letterSpacing: 3 }}>NATAL NAVIGATOR</span>
          <div style={{ width: 1, height: 16, background: T.bd }} />
          <span style={{ ...F, fontSize: 9, color: '#D8A030', background: '#D8A03015', padding: '2px 8px', borderRadius: 3, letterSpacing: 1 }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ ...F, fontSize: 9, color: T.td }}>{profile?.display_name}</span>
          <span
            onClick={() => navigate('/dashboard')}
            style={{ ...F, fontSize: 9, color: T.ac, cursor: 'pointer', background: T.c, padding: '4px 10px', borderRadius: 4, border: `1px solid ${T.bd}` }}
          >
            DASHBOARD
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, background: T.b, borderBottom: `1px solid ${T.bd}`, flexShrink: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {TABS.map(t => {
          const active = activeTab === t.key;
          return (
            <div
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{ ...F, fontSize: 9, fontWeight: 600, letterSpacing: 1.5, padding: '12px 24px', cursor: 'pointer', color: active ? t.color : T.td, borderBottom: active ? `2px solid ${t.color}` : '2px solid transparent', transition: 'all .15s', whiteSpace: 'nowrap', userSelect: 'none' }}
            >
              {t.label}
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20, WebkitOverflowScrolling: 'touch' }}>
        {activeTab === 'overview' && (
          <OverviewTab stats={stats} demographics={demographics} usage={usage} paywallEnabled={paywallEnabled} setPaywallEnabled={setPaywallEnabled} T={T} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab settings={appSettings} onSave={handleSaveSetting} T={T} />
        )}
        {activeTab === 'users' && (
          <UsersTab
            users={users}
            total={total}
            loading={loading}
            selected={selected}
            setSelected={setSelected}
            premiumToggling={premiumToggling}
            setPremiumToggling={setPremiumToggling}
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            sortField={sortField}
            setSortField={setSortField}
            sortAsc={sortAsc}
            setSortAsc={setSortAsc}
            setUsers={setUsers}
            T={T}
          />
        )}
      </div>
    </div>
  );
}
