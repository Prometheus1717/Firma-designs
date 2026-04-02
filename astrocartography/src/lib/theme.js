const LIGHT = {
  bg: '#F2F2F7', p: '#FFFFFF', c: '#F5F5FA', b: '#FAFAFA', d: '#F0F0F5', a: '#EEEEF3',
  bd: '#D1D1D6', bs: '#E5E5EA',
  tx: '#1C1C1E', tm: '#48484A', td: '#8E8E93', mu: '#AEAEB2',
  ac: '#00A86B', acBg: 'rgba(0,168,107,.08)', acBd: 'rgba(0,168,107,.25)',
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
