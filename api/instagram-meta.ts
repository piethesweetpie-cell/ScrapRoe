export const config = { runtime: 'edge' };

function decodeHtml(str: string) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

function extractImage(html: string) {
  const raw =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1] ||
    html.match(/<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image:secure_url["']/i)?.[1] ||
    '';
  return decodeHtml(raw);
}

async function hashUrl(url: string): Promise<string> {
  const encoded = new TextEncoder().encode(url);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

async function uploadToStorage(imageUrl: string, filename: string): Promise<string | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const buffer = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/thumbnails/${filename}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
        body: buffer,
      }
    );

    if (!uploadRes.ok) return null;

    return `${supabaseUrl}/storage/v1/object/public/thumbnails/${filename}`;
  } catch {
    return null;
  }
}

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url') || '';

  if (!url || !/^https?:\/\//.test(url)) {
    return Response.json({ ok: false, title: '', image: '' }, { status: 400 });
  }

  try {
    // 1. 인스타 직접 파싱 (facebookexternalhit UA)
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    const html = await res.text();

    const ogTitle =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1] ||
      '';
    const titleTag = html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';

    let title = decodeHtml(ogTitle || titleTag || '');
    const junkPhrases = ['Create an account', 'Log in', 'Welcome back'];
    if (junkPhrases.some(p => title.includes(p))) title = '';
    if (title.length > 40) title = title.substring(0, 40) + '...';

    let image = extractImage(html);

    // 2. Microlink fallback (이미지 못 가져온 경우)
    if (!image) {
      try {
        const mlRes = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
        const mlJson = await mlRes.json();
        if (mlJson?.status === 'success') {
          image = mlJson.data?.image?.url || '';
          if (!title) title = mlJson.data?.title || '';
        }
      } catch { /* fallback 실패 무시 */ }
    }

    // 3. Supabase Storage에 영구 저장
    if (image) {
      const hash = await hashUrl(url);
      const ext = image.includes('.png') ? 'png' : 'jpg';
      const permanentUrl = await uploadToStorage(image, `${hash}.${ext}`);
      if (permanentUrl) image = permanentUrl;
    }

    return Response.json({
      ok: true,
      title: title.trim() || 'Instagram',
      image,
    }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (err) {
    return Response.json({ ok: false, title: '', image: '' }, { status: 500 });
  }
}
