import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const AddVideoModal = ({ open, onClose, categories, initial, onSubmit }: any) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ✅ JSONLink API Key (여기에 키만 넣으세요)
  const JSONLINK_API_KEY = 'pk_7b6c2135e19c2d3e2e6f58bc8c3be201a0763f01';

  // 1. 초기화
  useEffect(() => {
    if (open) {
      setUrl(initial?.url || '');
      setTitle(initial?.title || '');
      setThumbnailUrl(initial?.thumbnailUrl || initial?.thumbnail_url || '');
      setCategory(initial?.category || categories[0] || '');
      setTags(initial?.tags ? initial.tags.join(', ') : '');
      setErrorMsg('');
    }
  }, [open, initial, categories]);

  // 2. 🔥 메타데이터 추출 엔진 (유튜브: noembed / 인스타: JSONLink + 캐시)
  useEffect(() => {
    if (!url || initial || !open) return;

    const fetchMetadata = async () => {
      setIsFetching(true);
      setErrorMsg('');

      const inputUrl = url.trim();

      try {
        // ✅ 유튜브 처리 (안정적)
        if (inputUrl.includes('youtube.com') || inputUrl.includes('youtu.be')) {
          const videoId =
            inputUrl.split('v=')[1]?.split('&')[0] ||
            inputUrl.split('/').pop()?.split('?')[0];

          if (videoId) {
            setThumbnailUrl(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
          }

          try {
            const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(inputUrl)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.title) setTitle(data.title);
            } else {
              setErrorMsg(`유튜브 제목 추출 실패 (${res.status})`);
            }
          } catch (e) {
            console.error('유튜브 추출 실패', e);
            setErrorMsg('유튜브 제목 추출 실패');
          }

          setIsFetching(false);
          return;
        }

        // ✅ 인스타그램 처리 (JSONLink + 캐시)
        if (inputUrl.includes('instagram.com')) {
          const cleanUrl = inputUrl.split('?')[0].replace(/\/$/, '');
          const cacheKey = `meta:${cleanUrl}`;

          // [캐시 확인]
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              setTitle(parsed.title || '');
              setThumbnailUrl(parsed.thumbnailUrl || '');
              setIsFetching(false);
              return;
            } catch (e) {
              // 캐시가 깨졌으면 무시하고 계속 진행
            }
          }

          // 키 없으면 여기서 바로 안내
          if (!JSONLINK_API_KEY || JSONLINK_API_KEY === '키복사할곳') {
            setErrorMsg('JSONLink API 키가 필요합니다. 코드의 "키복사할곳"에 붙여넣어 주세요.');
            setTitle('');
            setThumbnailUrl('');
            setIsFetching(false);
            return;
          }

          setTitle('정보를 불러오는 중입니다...');

          try {
            // 🚀 JSONLink API (키 포함)
            const res1 = await fetch(
              `https://jsonlink.io/api/extract?api_key=${encodeURIComponent(JSONLINK_API_KEY)}&url=${encodeURIComponent(cleanUrl)}`
            );

            if (!res1.ok) {
              throw new Error(`JSONLink 실패 (${res1.status})`);
            }

            const data1 = await res1.json();

            const fetchedTitle = data1.title || 'Instagram Video';
            const fetchedThumb =
              (data1.images && Array.isArray(data1.images) && data1.images.length > 0)
                ? data1.images[0]
                : '';

            setTitle(fetchedTitle);
            setThumbnailUrl(fetchedThumb);

            localStorage.setItem(
              cacheKey,
              JSON.stringify({ title: fetchedTitle, thumbnailUrl: fetchedThumb })
            );
          } catch (err1: any) {
            console.error('인스타 추출 실패:', err1);
            setErrorMsg('자동 추출 실패: 인스타가 차단했거나 JSONLink 제한에 걸렸습니다.');
            setTitle('');
            setThumbnailUrl('');
          } finally {
            setIsFetching(false);
          }

          return;
        }

        // ✅ 기타 링크는 자동 추출 안 함 (원하면 여기서 확장)
        setIsFetching(false);
      } catch (e) {
        console.error('추출 실패:', e);
        setErrorMsg('알 수 없는 오류가 발생했습니다.');
        setIsFetching(false);
      }
    };

    // 🛑 디바운스: 입력 멈춘 뒤 0.8초 후 1회 실행
    const timer = setTimeout(fetchMetadata, 800);
    return () => clearTimeout(timer);
  }, [url, initial, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-pink-500">🔗</span> {initial ? '레퍼런스 수정' : '새 레퍼런스 추가'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-black text-pink-400 mb-1 uppercase tracking-wider">
              원본 URL {errorMsg && <span className="text-red-500 lowercase font-normal ml-2">{errorMsg}</span>}
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl outline-none text-sm focus:border-black transition-all"
              placeholder="인스타 릴스 주소를 붙여넣으세요"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 mb-1 uppercase tracking-wider">
              제목 {isFetching && <span className="text-pink-400 lowercase font-normal ml-2 animate-pulse">자동 추출 중...</span>}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl outline-none text-sm transition-all"
              placeholder="제목이 추출됩니다"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 mb-1 uppercase tracking-wider">썸네일 이미지</label>
            <div className="flex gap-3 items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden border-2 border-gray-100 flex-shrink-0 relative">
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
                className="flex-1 px-4 py-2 border-2 border-gray-100 rounded-xl text-[10px] text-gray-400 outline-none"
                placeholder="이미지 주소가 추출됩니다"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black text-gray-400 mb-1 uppercase tracking-wider">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl outline-none text-sm bg-white appearance-none"
              >
                {categories.map((c: string) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-400 mb-1 uppercase tracking-wider">태그</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl outline-none text-sm"
                placeholder="예: 누끼, 색보정"
              />
            </div>
          </div>
        </div>

        <button
          onClick={() =>
            onSubmit({
              title,
              url,
              thumbnailUrl,
              category,
              tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            })
          }
          className="w-full py-4 bg-black text-white rounded-2xl font-bold mt-8 hover:bg-gray-800 active:scale-95 transition-all shadow-lg"
        >
          저장하기
        </button>
      </div>
    </div>
  );
};

export default AddVideoModal;