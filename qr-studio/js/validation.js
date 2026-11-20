// validation.js
window.QRValidation = {
  isUrl(v){ try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } },
  isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
  isPhone(v){ return /^\+?[0-9\s\-().]{6,}$/.test(v); },
  isLat(v){ const n = parseFloat(v); return !isNaN(n) && n >= -90 && n <= 90; },
  isLng(v){ const n = parseFloat(v); return !isNaN(n) && n >= -180 && n <= 180; },
  sanitize(s){ const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
};
