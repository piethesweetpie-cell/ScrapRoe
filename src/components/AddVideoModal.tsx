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
            
            // 🚀 [수정됨] 제목(title) 우선순위 복구! (아이디가 정상적으로 나옵니다)
            let extractedTitle =
              data1?.title ||
              data1?.meta?.title ||
              data1?.og?.title ||
              data1?.open_graph?.title ||
              data1?.twitter?.title ||
              data1?.description ||
              '';

            // 🧹 인스타 특유의 "조회수, 좋아요" 쓰레기 텍스트 청소기 (한/영 완벽 대응)
            // 예: "1.2M Likes, 200 Comments - User (@id) ..." -> "User (@id) ..."
            if (extractedTitle.includes(' - ')) {
              const splitArr = extractedTitle.split(' - ');
              const possibleStats = splitArr[0];
              // 앞부분에 숫자와 좋아요/조회수 관련 단어가 있으면 그 부분만 날려버립니다.
              if (/[0-9]/.test(possibleStats) && /(Like|View|Comment|Play|좋아요|조회수|댓글)/i.test(possibleStats)) {
                extractedTitle = splitArr.slice(1).join(' - ');
              }
            }

            // 🚨 무의미한 로그인 요구 텍스트만 필터링 (Instagram 단어는 살려둠)
            const junkPhrases = ['Create an account', 'Log in', 'Welcome back'];
            if (junkPhrases.some(phrase => extractedTitle.includes(phrase))) {
              extractedTitle = ''; 
            }

            // 제목이 너무 길면 40자에서 자르기
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
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl shadow-black/10 p-8 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {initial ? '레퍼런스 수정' : '새 레퍼런스 추가'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors duration-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#FF66C4] mb-1 uppercase tracking-wider">
              원본 URL {errorMsg && <span className="text-red-500 lowercase font-normal ml-2">{errorMsg}</span>}
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:border-[#FF66C4] focus:ring-2 focus:ring-pink-100 transition-all duration-200"
              placeholder="인스타 릴스 주소를 붙여넣으세요"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">
              제목 {isFetching && <span className="text-pink-400 lowercase font-normal ml-2 animate-pulse">자동 추출 중...</span>}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:border-[#FF66C4] focus:ring-2 focus:ring-pink-100 transition-all duration-200"
              placeholder="제목이 추출됩니다"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">썸네일 이미지</label>
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
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-[10px] text-gray-400 outline-none focus:border-[#FF66C4] transition-all duration-200"
                placeholder="이미지 주소가 추출됩니다"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm bg-white appearance-none focus:border-[#FF66C4] focus:ring-2 focus:ring-pink-100 transition-all duration-200 cursor-pointer"
              >
                {categories.map((c: string) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">태그</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:border-[#FF66C4] focus:ring-2 focus:ring-pink-100 transition-all duration-200"
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
          className="w-full py-3.5 bg-[#FF66C4] text-white rounded-xl font-semibold mt-8 hover:bg-[#ff4db5] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-pink-200 cursor-pointer"
        >
          저장하기
        </button>
      </div>
    </div>
  );
};

export default AddVideoModal;