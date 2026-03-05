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

  // 1. 모달 열릴 때 초기화
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

  // 2. 🔥 [완벽 복구] 디바운스 + 로컬스토리지 캐싱이 적용된 추출 엔진
  useEffect(() => {
    // URL이 없거나, 수정 모드(initial)거나, 모달이 닫혀있으면 실행 안 함
    if (!url || initial || !open) return;

    const fetchMetadata = async () => {
      setIsFetching(true);
      setErrorMsg('');

      // ✅ 1. 유튜브 처리 (가장 빠르고 안전한 방식)
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop()?.split('?')[0];
        if (videoId) {
          setThumbnailUrl(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
          try {
            const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            if (data.title) setTitle(data.title);
          } catch (e) { console.error("유튜브 추출 실패"); }
        }
        setIsFetching(false);
        return;
      }

      // ✅ 2. 인스타그램 처리 (Microlink API + 캐싱)
      if (url.includes('instagram.com')) {
        // 주소 뒤의 지저분한 파라미터(?utm_source=...) 제거하여 고유 키 생성
        const cleanUrl = url.split('?')[0].replace(/\/$/, "");
        const cacheKey = `meta:${cleanUrl}`;

        // [캐시 확인] 이미 불러온 적 있는 주소면 API 호출 없이 로컬에서 바로 꺼냄
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setTitle(parsed.title || 'Instagram Video');
            setThumbnailUrl(parsed.thumbnailUrl || '');
            setIsFetching(false);
            return; // 캐시가 있으면 여기서 즉시 종료 (API 호출량 0)
          } catch (e) { /* 파싱 에러 시 무시하고 진행 */ }
        }

        // [API 호출] 캐시에 없으면 Microlink 호출
        setTitle('정보를 불러오는 중입니다...');
        try {
          const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(cleanUrl)}`);
          
          if (res.status === 429) {
            throw new Error('429');
          }

          const data = await res.json();
          let fetchedTitle = 'Instagram Video';
          let fetchedThumb = '';

          if (data.status === 'success') {
            if (data.data.title) fetchedTitle = data.data.title;
            if (data.data.image?.url) fetchedThumb = data.data.image.url;
          }

          setTitle(fetchedTitle);
          setThumbnailUrl(fetchedThumb);

          // [캐시 저장] 성공 시 로컬스토리지에 저장하여 다음번엔 호출 안 함
          localStorage.setItem(cacheKey, JSON.stringify({ title: fetchedTitle, thumbnailUrl: fetchedThumb }));

        } catch (e: any) {
          if (e.message === '429') {
            setErrorMsg('요청이 너무 많습니다. 잠시 후 시도하거나 직접 입력해주세요.');
            setTitle('Instagram Video');
          } else {
            setTitle('Instagram Video');
          }
        } finally {
          setIsFetching(false);
        }
      }
    };

    // 🔥 [디바운스 적용] 타자를 치는 동안에는 타이머를 계속 초기화하고, 입력을 멈추고 800ms가 지나야 딱 1번만 fetch 실행
    const timer = setTimeout(() => {
      fetchMetadata();
    }, 800);

    return () => clearTimeout(timer); // 800ms 안에 url이 또 바뀌면 이전 타이머 취소
  }, [url, initial, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-pink-500">🔗</span> {initial ? '레퍼런스 수정' : '새 레퍼런스 추가'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors"><X className="w-6 h-6" /></button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-black text-pink-400 mb-1 uppercase tracking-wider">
              원본 URL {errorMsg && <span className="text-red-500 lowercase font-normal ml-2">{errorMsg}</span>}
            </label>
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl outline-none text-sm focus:border-black transition-all" placeholder="주소를 붙여넣으세요" />
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 mb-1 uppercase tracking-wider">
              제목 {isFetching && <span className="text-pink-400 lowercase font-normal ml-2 animate-pulse">불러오는 중...</span>}
            </label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl outline-none text-sm transition-all" placeholder="제목을 입력하세요" />
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 mb-1 uppercase tracking-wider">썸네일 이미지</label>
            <div className="flex gap-3 items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden border-2 border-gray-100 flex-shrink-0 relative">
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300 font-bold uppercase">
                    {isFetching ? '로딩중' : 'No Img'}
                  </div>
                )}
              </div>
              <input type="text" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} className="flex-1 px-4 py-2 border-2 border-gray-100 rounded-xl text-[10px] text-gray-400 outline-none" placeholder="자동으로 추출됩니다" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
               <label className="block text-[11px] font-black text-gray-400 mb-1 uppercase tracking-wider">카테고리</label>
               <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl outline-none text-sm bg-white appearance-none">
                 {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>
            <div>
               <label className="block text-[11px] font-black text-gray-400 mb-1 uppercase tracking-wider">태그</label>
               <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl outline-none text-sm" placeholder="예: 누끼, 색보정" />
            </div>
          </div>
        </div>

        <button 
          onClick={() => onSubmit({ title, url, thumbnailUrl, category, tags: tags.split(',').map(t => t.trim()).filter(Boolean) })}
          className="w-full py-4 bg-black text-white rounded-2xl font-bold mt-8 hover:bg-gray-800 active:scale-95 transition-all shadow-lg"
        >
          저장하기
        </button>
      </div>
    </div>
  );
};

export default AddVideoModal;