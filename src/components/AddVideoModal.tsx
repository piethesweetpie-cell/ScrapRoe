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

  // 2. 🔥 [완전체 엔진] 이중 API + 디바운스 + 캐시 복구본
  useEffect(() => {
    if (!url || initial || !open) return;

    const fetchMetadata = async () => {
      setIsFetching(true);
      setErrorMsg('');

      // ✅ 유튜브 처리 (안정적)
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

      // ✅ 인스타그램 처리 (Microlink 버리고 JSONLink & Dub.co 이중 백업)
      if (url.includes('instagram.com')) {
        const cleanUrl = url.split('?')[0].replace(/\/$/, "");
        const cacheKey = `meta:${cleanUrl}`;

        // [캐시 확인] 이미 성공했던 주소면 0.1초 만에 로컬에서 꺼냄
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setTitle(parsed.title || '');
            setThumbnailUrl(parsed.thumbnailUrl || '');
            setIsFetching(false);
            return; 
          } catch (e) { }
        }

        setTitle('정보를 불러오는 중입니다...');
        
        try {
          // 🚀 시도 1: JSONLink API (새로운 무료 추출기)
          const res1 = await fetch(`https://jsonlink.io/api/extract?url=${encodeURIComponent(cleanUrl)}`);
          if (!res1.ok) throw new Error('1차 API 실패');
          
          const data1 = await res1.json();
          const fetchedTitle = data1.title || 'Instagram Video';
          const fetchedThumb = (data1.images && data1.images.length > 0) ? data1.images[0] : '';

          setTitle(fetchedTitle);
          setThumbnailUrl(fetchedThumb);
          localStorage.setItem(cacheKey, JSON.stringify({ title: fetchedTitle, thumbnailUrl: fetchedThumb }));

        } catch (err1) {
          try {
            // 🚀 시도 2: Dub.co API (1차가 막히면 자동으로 2차 시도)
            const res2 = await fetch(`https://api.dub.co/metatags?url=${encodeURIComponent(cleanUrl)}`);
            if (!res2.ok) throw new Error('2차 API 실패');
            
            const data2 = await res2.json();
            const fetchedTitle = data2.title || 'Instagram Video';
            const fetchedThumb = data2.image || '';

            setTitle(fetchedTitle);
            setThumbnailUrl(fetchedThumb);
            localStorage.setItem(cacheKey, JSON.stringify({ title: fetchedTitle, thumbnailUrl: fetchedThumb }));

          } catch (err2) {
            // 이중 백업마저 뚫리면 그때만 에러 표시
            setErrorMsg(' 자동 추출 실패. 썸네일/제목을 직접 확인해주세요.');
            setTitle('');
            setThumbnailUrl('');
          }
        } finally {
          setIsFetching(false);
        }
      }
    };

    // 🛑 [디바운스 핵심] 타자를 치는 동안에는 절대 호출 안 함. 타자를 멈추고 0.8초 뒤에 딱 한 번만 출발.
    const timer = setTimeout(() => {
      fetchMetadata();
    }, 800);

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
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors"><X className="w-6 h-6" /></button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-black text-pink-400 mb-1 uppercase tracking-wider">
              원본 URL {errorMsg && <span className="text-red-500 lowercase font-normal ml-2">{errorMsg}</span>}
            </label>
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl outline-none text-sm focus:border-black transition-all" placeholder="인스타 릴스 주소를 붙여넣으세요" />
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 mb-1 uppercase tracking-wider">
              제목 {isFetching && <span className="text-pink-400 lowercase font-normal ml-2 animate-pulse">자동 추출 중...</span>}
            </label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl outline-none text-sm transition-all" placeholder="제목이 추출됩니다" />
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
              <input type="text" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} className="flex-1 px-4 py-2 border-2 border-gray-100 rounded-xl text-[10px] text-gray-400 outline-none" placeholder="이미지 주소가 추출됩니다" />
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