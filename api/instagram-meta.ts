export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url') || '';

  if (!url || !/^https?:\/\//.test(url)) {
    return Response.json({ ok: false, title: '', image: '' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    const html = await res.text();

    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1]
      || '';

    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]
      || '';

    const titleTag = html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';

    let title = ogTitle || titleTag || '';

    // 로그인 유도 텍스트 필터링
    const junkPhrases = ['Create an account', 'Log in', 'Welcome back'];
    if (junkPhrases.some(p => title.includes(p))) title = '';

    if (title.length > 40) title = title.substring(0, 40) + '...';

    return Response.json({
      ok: true,
      title: title.trim() || 'Instagram',
      image: ogImage,
    }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (err) {
    return Response.json({ ok: false, title: '', image: '' }, { status: 500 });
  }
}
