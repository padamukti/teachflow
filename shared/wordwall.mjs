export function validateWordwall(raw, kind = 'resource') {
  let url;
  try { url = new URL(raw.trim()); } catch { throw new Error('Masukkan URL Wordwall lengkap (https://...).'); }
  if (url.protocol !== 'https:' || !['wordwall.net','www.wordwall.net'].includes(url.hostname) || url.port || url.username || url.password) throw new Error('Hanya URL HTTPS dari wordwall.net yang diizinkan.');
  const pattern = kind === 'embed' ? /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?embed\/[a-z0-9]+\/?$/i : /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?resource\/(\d+)(?:\/[^?#]*)?$/i;
  const match = url.pathname.match(pattern);
  if (!match) throw new Error(kind === 'embed' ? 'Gunakan URL /embed/ Wordwall, bukan URL /resource/.' : 'Gunakan link halaman aktivitas Wordwall yang memuat /resource/.');
  url.hash = '';
  return { url: url.href, id: kind === 'resource' ? match[1] : null };
}
export function httpsUrl(raw) { try { const u = new URL(raw); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; } }
export function extractEmbed(html) {
  // Read one quoted src from the provider's iframe; never execute provider HTML.
  const tag = String(html ?? '').match(/<iframe\b[^>]*>/i)?.[0] ?? '';
  const src = tag.match(/\s+src\s*=\s*(["'])(.*?)\1/i)?.[2];
  if (!src) throw new Error('Wordwall tidak memberikan iframe yang dapat digunakan.');
  return validateWordwall(src.replace(/&amp;|&#38;|&#x26;/gi, '&'), 'embed').url;
}
export function normalizeOembed(data, resource) {
  return { originalUrl: resource.url, resourceId: resource.id, title: typeof data.title === 'string' && data.title.trim() ? data.title.trim().slice(0,300) : 'Aktivitas Wordwall', embedUrl: extractEmbed(data.html), thumbnailUrl: httpsUrl(data.thumbnail_url), authorName: typeof data.author_name === 'string' ? data.author_name.slice(0,200) : '', authorUrl: httpsUrl(data.author_url) };
}
const json = (body,status=200) => new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export async function handleWordwall(request, fetcher = fetch) {
  if (request.method !== 'GET') return json({error:'Metode tidak didukung.'},405);
  let resource;
  try { resource = validateWordwall(new URL(request.url).searchParams.get('url') || ''); } catch(e) { return json({error:e.message},400); }
  const endpoint = new URL('https://wordwall.net/api/oembed');
  endpoint.searchParams.set('url',resource.url); endpoint.searchParams.set('format','json');
  try {
    const upstream = await fetcher(endpoint,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000),redirect:'error'});
    if (!upstream.ok) return json({error:`Wordwall mengembalikan HTTP ${upstream.status}. Coba URL aktivitas publik lain atau gunakan embed manual.`},502);
    const data = await upstream.json();
    return json(normalizeOembed(data,resource));
  } catch(e) { return json({error:'Impor otomatis gagal. Periksa koneksi, coba lagi, atau gunakan embed manual.'},502); }
}
