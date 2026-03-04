export type DetectedSource =
  | { kind: 'youtube'; videoId: string }
  | { kind: 'instagram_reel'; shortcode: string }
  | { kind: 'instagram_post'; shortcode: string }
  | { kind: 'direct_mp4' }
  | { kind: 'unknown' };

export function detectSource(url: string): DetectedSource {
  const u = url.trim();

  // Direct MP4
  if (/\.mp4(\?.*)?$/i.test(u)) return { kind: 'direct_mp4' };

  // YouTube
  try {
    const parsed = new URL(u);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      if (id) return { kind: 'youtube', videoId: id };
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const v = parsed.searchParams.get('v');
      if (v) return { kind: 'youtube', videoId: v };
      const m = parsed.pathname.match(/\/shorts\/([^/?]+)/);
      if (m?.[1]) return { kind: 'youtube', videoId: m[1] };
      const m2 = parsed.pathname.match(/\/embed\/([^/?]+)/);
      if (m2?.[1]) return { kind: 'youtube', videoId: m2[1] };
    }

    // Instagram (reel / p)
    const igHost = host.endsWith('instagram.com');
    if (igHost) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      // /reel/{code}/
      const reelIdx = parts.indexOf('reel');
      if (reelIdx >= 0 && parts[reelIdx + 1]) return { kind: 'instagram_reel', shortcode: parts[reelIdx + 1] };
      // /p/{code}/
      const postIdx = parts.indexOf('p');
      if (postIdx >= 0 && parts[postIdx + 1]) return { kind: 'instagram_post', shortcode: parts[postIdx + 1] };
    }
  } catch {
    // ignore
  }

  return { kind: 'unknown' };
}

export function youtubeEmbedUrl(videoId: string) {
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=0&rel=0`;
}

export function youtubeThumbUrl(videoId: string) {
  // hqdefault는 거의 항상 존재
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
}

export function instagramEmbedUrl(shortcode: string, kind: 'reel' | 'post') {
  // Instagram embed는 상황에 따라 로그인 벽이 뜰 수 있습니다.
  // 그래도 "바로 인스타로 튕기지 않고" 앱 안에서 시도하는 목적에선 최선의 클라이언트-only 방법입니다.
  const base = kind === 'reel' ? 'reel' : 'p';
  return `https://www.instagram.com/${base}/${encodeURIComponent(shortcode)}/embed/`;
}
