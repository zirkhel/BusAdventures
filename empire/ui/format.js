// Number and time formatting for the Empire UI.

const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

export function fmt(n, { decimals = false } = {}) {
  if (!isFinite(n)) return '∞';
  const neg = n < 0; n = Math.abs(n);
  let out;
  if (n < 1000) out = decimals && n < 100 && n % 1 ? n.toFixed(1) : Math.floor(n).toString();
  else {
    const tier = Math.floor(Math.log10(n) / 3);
    if (tier >= SUFFIX.length) out = n.toExponential(2).replace('+', '');
    else {
      const v = n / 1000 ** tier;
      out = (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + SUFFIX[tier];
    }
  }
  return (neg ? '-' : '') + out;
}

export function fmtTime(sec) {
  sec = Math.max(0, Math.round(sec));
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60), mm = m % 60;
  if (h < 48) return mm ? `${h}h ${mm}m` : `${h}h`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
