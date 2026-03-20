import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import type { VideoDetail } from './VideoDetailModal';

function isMp4(url?: string) {
  return typeof url === 'string' && /\.mp4(\?|$)/i.test(url);
}

function toInstagramEmbedUrl(url: string) {
  // normalize: strip query, ensure no trailing slash, add /embed
  const clean = url.replace(/\?.*$/, '').replace(/\/$/, '');
  return clean + '/embed';
}

export default function VideoDetailPane({
  video,
  onEdit,
  onDelete,
}: {
  video: VideoDetail | null;
  onEdit: (video: VideoDetail) => void;
  onDelete: (id: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [embedKey, setEmbedKey] = useState(0);

  const mp4Url = useMemo(() => (video?.videoUrl && isMp4(video.videoUrl) ? video.videoUrl : null), [video?.videoUrl]);

  const instagramEmbedUrl = useMemo(() => {
    if (!video?.url) return null;
    if (!/instagram\.com/i.test(video.url)) return null;
    // reel, p, tv 등 모두 embed 시도
    return toInstagramEmbedUrl(video.url);
  }, [video?.url]);

  useEffect(() => {
    // 아이템 바뀔 때 iframe 재로딩(가끔 멈추는 현상 방지)
    setEmbedKey((k) => k + 1);
  }, [video?.id]);

  useEffect(() => {
    if (!mp4Url || !videoRef.current) return;
    // muted이면 대부분 자동재생 허용
    videoRef.current.play().catch(() => {});
  }, [mp4Url]);

  if (!video) {
    return (
      <div className="h-[calc(100vh-220px)] sticky top-[200px] rounded-2xl border border-gray-800 bg-gray-950/60 p-6 text-gray-400">
        <div className="text-lg font-semibold text-gray-200 mb-2">선택된 항목이 없습니다</div>
        <div className="text-sm leading-relaxed">
          왼쪽에서 튜토리얼 카드를 클릭하면, 여기에 크게 미리보기와 태그/메모가 표시됩니다.
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-220px)] sticky top-[200px] rounded-2xl border border-gray-800 bg-gray-950/60 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="min-w-0">
          <div className="text-white text-xl font-bold truncate">{video.title}</div>
          <div className="text-gray-500 text-xs mt-1 truncate">{video.url}</div>
        </div>
        <div className="flex gap-2 shrink-0">
          <a
            href={video.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 border border-gray-800 px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
            title="원본 열기"
          >
            <ExternalLink className="w-4 h-4" />
            원본
          </a>
          <button
            onClick={() => onEdit(video)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 border border-gray-800 px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
            title="수정"
          >
            <Pencil className="w-4 h-4" />
            수정
          </button>
          <button
            onClick={() => onDelete(video.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600/90 px-3 py-2 text-sm text-white hover:bg-red-600"
            title="삭제"
          >
            <Trash2 className="w-4 h-4" />
            삭제
          </button>
        </div>
      </div>

      {/* 본문: 9:16 미리보기 + 메타 */}
      <div className="p-5 grid grid-cols-1 xl:grid-cols-[minmax(280px,420px)_1fr] gap-5 h-full">
        {/* 9:16 뷰어 */}
        <div className="rounded-2xl overflow-hidden border border-gray-800 bg-black aspect-[9/16] w-full max-w-[420px] mx-auto xl:mx-0">
          {mp4Url ? (
            <video
              ref={videoRef}
              src={mp4Url}
              autoPlay
              muted
              loop
              playsInline
              controls
              className="w-full h-full object-cover"
            />
          ) : instagramEmbedUrl ? (
            <iframe
              key={embedKey}
              src={instagramEmbedUrl}
              className="w-full h-full"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              frameBorder={0}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              미리보기 불가 (인스타 링크 또는 mp4 필요)
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="space-y-4 overflow-auto pb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-800 bg-gray-950/50 p-4">
              <div className="text-gray-300 font-semibold mb-2">카테고리</div>
              <div className="inline-flex items-center rounded-full border border-gray-700 bg-gray-900/70 px-3 py-1 text-sm text-gray-100">
                {video.category}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-950/50 p-4">
              <div className="text-gray-300 font-semibold mb-2">추가 날짜</div>
              <div className="text-gray-200 text-sm">{new Date(video.createdAt).toLocaleString('ko-KR')}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-950/50 p-4">
            <div className="text-gray-300 font-semibold mb-2">태그</div>
            <div className="flex flex-wrap gap-2">
              {video.tags?.length ? (
                video.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-1 rounded-full bg-gray-900 text-gray-200 border border-gray-700"
                  >
                    #{t}
                  </span>
                ))
              ) : (
                <div className="text-gray-500 text-sm">태그가 없습니다.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-950/50 p-4">
            <div className="text-gray-300 font-semibold mb-2">메모</div>
            <div className="text-gray-200 text-sm whitespace-pre-wrap">
              {video.memo?.trim() ? video.memo : '메모가 없습니다.'}
            </div>
          </div>

          {instagramEmbedUrl && !mp4Url && (
            <div className="text-xs text-gray-500 leading-relaxed">
              * 인스타그램은 정책/로그인 상태에 따라 자동재생이 막히거나, 'Instagram에서 보기' 동작이 나타날 수 있습니다.
              이 경우 위의 <span className="text-gray-300 font-semibold">원본</span> 버튼으로 여시면 됩니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
