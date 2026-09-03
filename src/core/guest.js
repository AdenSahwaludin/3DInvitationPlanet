const RESERVED = new Set(['undangan', 'db', 'api', 'assets', 'src', 'libs', 'data', 'index.html', 'admin.html', 'favicon.ico', 'robots.txt']);

function parse() {
  try {
    let seg = location.pathname.split('/').filter(Boolean);
    // preview undangan klasik via path: /undangan/NamaTamu
    if (seg.length && seg[0].toLowerCase() === 'undangan') seg = seg.slice(1);
    if (!seg.length) return '';
    const first = decodeURIComponent(seg[0]).trim();
    if (!first || first.length > 32) return '';
    if (RESERVED.has(first.toLowerCase())) return '';
    if (!/^[\p{L}\p{M}0-9 .,'&\-]+$/u.test(first)) return '';
    return first.replace(/\s+/g, ' ');
  } catch {
    return '';
  }
}

export const GUEST = parse();
export const GUEST_LINE = GUEST ? `Kepada Yth. ${GUEST}` : '';
