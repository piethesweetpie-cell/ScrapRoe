import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

type MetaCache = Record<string, { title?: string; image?: string }>;

const AddVideoModal = ({ open, onClose, categories, initial, onSubmit }: any) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [metaError, setMetaError] = useState(''); // ✅ “알 수 없는 오류” 대신 정확한 에러 표기

  // ✅ 요청 취소용
  const abortRef = useRef<AbortController | null>(null);

  // ✅ 간단 캐시(세션 동안만)
  const cacheRef = useRef<MetaCache>({});

  useEffect(() => {
    if (open) {
      setUrl(initial?.url || '');
      setTitle(initial?.title || '');
      setThumbnailUrl(initial?.thumbnailUrl || initial?.thumbnail_url || '');
      setCategory(initial?.category || categories[0] || '');
      setTags(initial?.tags ? initial.tags.join(', ') : '');
      setMetaError('');
    } else {
      // 모달 닫힐 때 진행중 요청 취소
      abortRef.current?.abort();
      abortRef.current = null;
    }
  }, [open, initial, categories]);

  useEffect(() => {
    if (!url || initial || !open) return;

    const normalizedUrl = url.trim();

    const fetchMetadata = async () => {
      setIsFetching(true);
      setMetaError('');

      // 이전 요청이 있으면 즉시 취소
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // ✅ 유튜브
        if (normalizedUrl.includes('youtube.com') || normalizedUrl.includes('youtu.be')) {
          const videoId =
            normalizedUrl.split('v=')[1]?.split('&')[0] ||
            normalizedUrl.split('/').pop()?.split('?')[0];

          if (videoId) {
            setThumbnailUrl(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
          }

          // noembed도 가끔 레이트리밋/실패 가능하니 ok 체크
          const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(normalizedUrl)}`, {
            signal: controller.signal,
          });
          if (!res.ok) {
            setMetaError(`유튜브 제목 불러오기 실패 (${res.status})`);
            return;
          }
          const data = await res.json();
          if (data?.title) setTitle(data.title);
          return;
        }

        // ✅ 인스타
        if (normalizedUrl.includes('instagram.com')) {
          // 캐시 히트면 재호출 금지(429 예방)
          const cached = cacheRef.current[normalizedUrl];
          if (cached) {
            if (cached.title) setTitle(cached.title);
            if (cached.image !== undefined) setThumbnailUrl(cached.image || '');
            return;
          }

          setTitle('정보를 불러오는 중입니다...');

          // ✅ Microlink URL 형식 고정 (/?url=)
          const endpoint = `https://api.microlink.io/?url=${encodeURIComponent(normalizedUrl)}`;
          const res = await fetch(endpoint, { signal: controller.signal });

          if (!res.ok) {
            // ✅ 여기서 429를 “알 수 없는 오류”로 뭉개지 않음
            if (res.status === 429) {
              const retryAfter = res.headers.get('retry-after');
              setTitle('Instagram Video');
              setThumbnailUrl('');
              setMetaError(
                `Microlink가 요청 과다로 차단(429)했습니다.${retryAfter ? ` ${retryAfter}초 후 재시도하세요.` : ' 잠시 후 다시 시도하세요.'}`
              );
              return;
            }

            setTitle('Instagram Video');
            setThumbnailUrl('');
            setMetaError(`Microlink 오류 (${res.status})`);
            return;
          }

          const data = await res.json();

          if (data?.status === 'success') {
            const t = data?.data?.title || 'Instagram Video';
            const img = data?.data?.image?.url || '';

            setTitle(t);
            setThumbnailUrl(img);

            // ✅ 캐시에 저장(같은 URL 재호출 방지)
            cacheRef.current[normalizedUrl] = { title: t, image: img };
          } else {
            setTitle('Instagram Video');
            setThumbnailUrl('');
            cacheRef.current[normalizedUrl] = { title: 'Instagram Video', image: '' };
          }
        }
      } catch (e: any) {
        // abort는 정상 동작이니 조용히 종료
        if (e?.name === 'AbortError') return;

        console.error('추출 실패:', e);
        if (normalizedUrl.includes('instagram.com')) setTitle('Instagram Video');
        setThumbnailUrl('');
        setMetaError(e?.message || '메타데이터 추출 실패');
      } finally {
        setIsFetching(false);
      }
    };

    // ✅ 디바운스 (그리고 Abort까지 있어서 중복이 훨씬 줄어듦)
    const timer = setTimeout(fetchMetadata, 700);
    return () => clearTimeout(timer);
  }, [url, initial, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-pink-500">🔗</span> {initial ? '레퍼런스 수정' : '새 레퍼런스 추가'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[11px] font-black text-pink-400 mb-1.5 ml-1 uppercase tracking-wider">원본 URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-5 py-3.5 border-2 border-gray-100 rounded-2xl focus:border-black outline-none text-sm transition-all"
              placeholder="인스타 릴스나 유튜브 주소 붙여넣기"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
              제목 {isFetching && <span className="text-pink-400 lowercase font-normal ml-2 animate-pulse">불러오는 중...</span>}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-5 py-3.5 border-2 border-gray-100 rounded-2xl focus:border-black outline-none text-sm transition-all"
            />
            {/* ✅ 이제 “알 수 없는 오류” 대신 정확히 뜸 */}
            {metaError ? <p className="mt-2 text-[11px] font-bold text-red-500">{metaError}</p> : null}
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">썸네일 미리보기</label>
            <div className="flex gap-4 items-center">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden border-2 border-gray-100 flex-shrink-0 relative">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    className="w-full h-full object-cover"
                    alt=""
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300 font-bold uppercase">
                    {isFetching ? '로딩중' : 'No Img'}
                  </div>
                )}
              </div>
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-100 rounded-xl text-[10px] text-gray-400 outline-none"
                placeholder="자동으로 추출됩니다"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-100 rounded-2xl outline-none text-sm bg-white appearance-none"
              >
                {categories.map((c: string) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">태그</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-100 rounded-2xl outline-none text-sm"
                placeholder="예: 누끼, AI"
              />
            </div>
          </div>
        </div>

        <button
          onClick={() =>
            onSubmit({
              title,
              url: url.trim(),
              thumbnailUrl,
              category,
              tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            })
          }
          className="w-full py-4 bg-black text-white rounded-2xl font-bold mt-10 hover:bg-gray-800 active:scale-95 transition-all shadow-lg"
        >
          저장하기
        </button>
      </div>
    </div>
  );
};

export default AddVideoModal;