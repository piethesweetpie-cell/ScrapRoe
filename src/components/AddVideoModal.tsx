import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AddVideoModalProps {
  open: boolean;
  onClose: () => void;
  categories: string[];
  initial?: any;
  onSubmit: (data: any) => void;
}

const AddVideoModal: React.FC<AddVideoModalProps> = ({ open, onClose, categories, initial, onSubmit }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const JSONLINK_API_KEY = 'pk_7b6c2135e19c2d3e2e6f58bc8c3be201a0763f01';

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

  useEffect(() => {
    if (!url || initial || !open) return;

    const fetchMetadata = async () => {
      setIsFetching(true);
      setErrorMsg('');

      const inputUrl = url.trim();

      try {
        // ✅ 유튜브 처리
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
            }
          } catch (e) {
            console.error('유튜브 추출 실패', e);
          }

          setIsFetching(false);
          return;
        }

        // ✅ 인스타그램 처리 (JSONLink + 캐시)
        if (inputUrl.includes('instagram.com')) {
          const cleanUrl = inputUrl.split('?')[0].replace(/\/$/, '');
          const cacheKey = `meta:${cleanUrl}`;

          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              setTitle(parsed.title || '');
              setThumbnailUrl(parsed.thumbnailUrl || '');
              setIsFetching(false);
              return;
            } catch (e) {}
          }

          setTitle('정보를 불러오는 중입니다...');

          try {
            const res1 = await fetch(
              `https://jsonlink.io/api/extract?api_key=${encodeURIComponent(JSONLINK_API_KEY)}&url=${encodeURIComponent(cleanUrl)}`
            );

            if (!res1.ok) {
              throw new Error(`JSONLink 실패 (${res1.status})`);
            }

            const data1 = await res1.json();
            
            // 🔥 제목(Title) 추출 초강화 로직: description(본문) 탐색
            let extractedTitle =
              data1?.description ||
              data1?.meta?.description ||
              data1?.og?.description ||
              data1?.title ||
              data1?.meta?.title ||
              data1?.og?.title ||
              '';

            const junkPhrases = ['Instagram', 'Instagram photo/video', 'Create an account', 'Log in', 'Welcome back'];
            if (junkPhrases.some(phrase => extractedTitle.includes(phrase)) && extractedTitle.length < 100) {
              extractedTitle = ''; 
            }

            if (extractedTitle.length > 40) {
              extractedTitle = extractedTitle.substring(0, 40) + '...';
            }

            const fetchedTitle = extractedTitle.trim() || 'Instagram Video';

            const fetchedThumb =
              (Array.isArray(data1?.images) && data1.images.length > 0 ? data1.images[0] : '') ||
              data1?.image ||
              data1?.meta?.image ||
              data1?.og?.image ||
              data1?.twitter?.image ||
              '';

            setTitle(fetchedTitle);
            setThumbnailUrl(fetchedThumb);

            localStorage.setItem(
              cacheKey,
              JSON.stringify({ title: fetchedTitle, thumbnailUrl: fetchedThumb })
            );
          } catch (err1: any) {
            console.error('인스타 추출 실패:', err1);
            setErrorMsg('자동 추출 실패: 직접 입력해주세요.');
            setTitle('');
          } finally {
            setIsFetching(false);
          }
          return;
        }

        setIsFetching(false);
      } catch (e) {
        console.error('추출 실패:', e);
        setErrorMsg('알 수 없는 오류가 발생했습니다.');
        setIsFetching(false);
      }
    };

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
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
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