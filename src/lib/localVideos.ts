export interface LocalVideoRecord {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string;
  video_url?: string;
  category: string;
  tags: string[];
  memo?: string;
  created_at: string;
}

const STORAGE_KEY = 'reels_scrapbook_videos_v1';

export function loadLocalVideos(): LocalVideoRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    // 최소한의 스키마 방어
    return parsed
      .filter(Boolean)
      .map((v: any) => ({
        id: String(v.id ?? ''),
        title: String(v.title ?? ''),
        url: String(v.url ?? ''),
        thumbnail_url: String(v.thumbnail_url ?? ''),
        video_url: v.video_url ? String(v.video_url) : undefined,
        category: String(v.category ?? '레퍼런스'),
        tags: Array.isArray(v.tags) ? v.tags.map((t: any) => String(t)) : [],
        memo: v.memo ? String(v.memo) : undefined,
        created_at: String(v.created_at ?? new Date(0).toISOString()),
      }))
      .filter((v) => v.id && v.url)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  } catch {
    return [];
  }
}

export function saveLocalVideos(videos: LocalVideoRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
  } catch {
    // 용량 초과 등은 조용히 무시 (UI는 그대로 유지)
  }
}
