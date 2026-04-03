const LIGHT = {
  bg: '#F2F0ED', p: '#FFFFFF', c: '#FAF9F7', b: '#F7F6F4', d: '#EDEAE6', a: '#F4F2EF',
  bd: '#D6D2CC', bs: '#E5E2DD',
  tx: '#1C1B1A', tm: '#55524E', td: '#8A8580', mu: '#B5B0AA',
  ac: '#00A86B', acBg: 'rgba(0,168,107,.06)', acBd: 'rgba(0,168,107,.20)',
};

const DARK = {
  bg: '#0A1018', p: '#0D1520', c: '#101C28', b: '#0B1218', d: '#14202C', a: '#0C1620',
  bd: '#1A2840', bs: '#182030',
  tx: '#D0DDE8', tm: '#8A9BB0', td: '#5A7088', mu: '#3A5068',
  ac: '#00D88A', acBg: 'rgba(0,216,138,.08)', acBd: 'rgba(0,216,138,.25)',
};

export function isLightMode() {
  try { return localStorage.getItem('nn_theme') === 'light'; } catch { return false; }
}

export function getTheme(light) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
  }
  return light ? LIGHT : DARK;
}
