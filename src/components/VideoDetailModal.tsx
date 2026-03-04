import { useMemo } from 'react';
import { X, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { detectSource, instagramEmbedUrl, youtubeEmbedUrl } from '../lib/urlHelpers';

export type VideoDetail = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  videoUrl?: string;
  category: string;
  tags: string[];
  memo?: string;
  createdAt: string;
};

export default function VideoDetailModal({
  open,
  video,
  onClose,
  onEdit,
  onDelete,
}: {
  open: boolean;
  video: VideoDetail | null;
  onClose: () => void;
  onEdit: (video: VideoDetail) => void;
  onDelete: (id: string) => void;
}) {
  const source = useMemo(() => (video ? detectSource(video.url) : { kind: 'unknown' as const }), [video?.url]);

  const player = useMemo(() => {
    if (!video) return null;

    // 1) direct mp4 or explicit videoUrl
    const directVideo = video.videoUrl || (source.kind === 'direct_mp4' ? video.url : undefined);
    if (directVideo) {
      return (
        <video
          src={directVideo}
          controls
          playsInline
          className="absolute inset-0 w-full h-full object-cover bg-black"
        />
      );
    }

    // 2) YouTube iframe
    if (source.kind === 'youtube') {
      return (
        <iframe
          title="YouTube Player"
          src={youtubeEmbedUrl(source.videoId)}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      );
    }

    // 3) Instagram embed iframe
    if (source.kind === 'instagram_reel') {
      return (
        <iframe
          title="Instagram Reel"
          src={instagramEmbedUrl(source.shortcode, 'reel')}
          className="absolute inset-0 w-full h-full bg-white"
          allow="encrypted-media; picture-in-picture"
        />
      );
    }
    if (source.kind === 'instagram_post') {
      return (
        <iframe
          title="Instagram Post"
          src={instagramEmbedUrl(source.shortcode, 'post')}
          className="absolute inset-0 w-full h-full bg-white"
          allow="encrypted-media; picture-in-picture"
        />
      );
    }

    // 4) fallback thumbnail
    return (
      <img
        src={video.thumbnailUrl}
        alt={video.title}
        className="absolute inset-0 w-full h-full object-cover"
      />
    );
  }, [video, source]);

  if (!open || !video) return null;

  const openOriginal = () => {
    window.open(video.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="닫기" className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="absolute left-1/2 top-1/2 w-[min(980px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-white truncate">{video.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
              <span className="inline-flex items-center rounded-full border border-gray-800 bg-gray-900 px-2 py-1 text-gray-200">{video.category}</span>
              <span className="truncate">{video.url}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openOriginal}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-800 bg-gray-900 text-gray-200 hover:bg-gray-800 transition"
              aria-label="원본 열기"
            >
              <ExternalLink className="w-4 h-4" />
              원본
            </button>
            <button
              onClick={() => onEdit(video)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-800 bg-gray-900 text-gray-200 hover:bg-gray-800 transition"
              aria-label="수정"
            >
              <Pencil className="w-4 h-4" />
              수정
            </button>
            <button
              onClick={() => onDelete(video.id)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-900/40 bg-red-950/40 text-red-200 hover:bg-red-950/70 transition"
              aria-label="삭제"
            >
              <Trash2 className="w-4 h-4" />
              삭제
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-900 text-gray-300" aria-label="닫기">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-0">
          {/* left: player */}
          <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-800">
            <div className="relative w-full rounded-xl overflow-hidden border border-gray-800 bg-black aspect-[9/16]">
              {player}
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {video.tags.map((tag, idx) => (
                <span key={idx} className="text-[11px] bg-gray-900 text-gray-300 border border-gray-800 px-2 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* right: meta */}
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-gray-200 mb-2">메모</div>
                <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 text-sm text-gray-200 min-h-[120px] whitespace-pre-wrap">
                  {video.memo?.trim() ? video.memo : <span className="text-gray-500">메모가 없습니다.</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                  <div className="text-xs text-gray-400">추가 날짜</div>
                  <div className="mt-1 text-sm text-gray-200">{new Date(video.createdAt).toLocaleString()}</div>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                  <div className="text-xs text-gray-400">미리보기</div>
                  <div className="mt-1 text-sm text-gray-200">
                    {source.kind === 'youtube' && 'YouTube 임베드'}
                    {source.kind === 'instagram_reel' && 'Instagram Reel 임베드'}
                    {source.kind === 'instagram_post' && 'Instagram Post 임베드'}
                    {source.kind === 'direct_mp4' && 'MP4 재생'}
                    {source.kind === 'unknown' && '썸네일만 표시'}
                  </div>
                  {(source.kind === 'instagram_reel' || source.kind === 'instagram_post') && (
                    <div className="mt-2 text-xs text-gray-500">
                      인스타그램은 정책/로그인 상태에 따라 임베드가 막힐 수 있습니다. 이 경우 “원본” 버튼으로 여시면 됩니다.
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-500">
                * 자동 썸네일은 YouTube에선 가능하지만, Instagram은 클라이언트만으로 안정적인 썸네일 추출이 어렵습니다(대부분 CORS/토큰 제한). 필요하시면 서버리스(Cloudflare Worker/Supabase Edge Function)로 썸네일/OG를 가져오는 방식으로 확장해드릴게요.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
