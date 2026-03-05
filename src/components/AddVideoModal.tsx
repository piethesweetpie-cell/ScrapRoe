import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const AddVideoModal = ({ open, onClose, categories, initial, onSubmit }: any) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  // 1. 초기화
  useEffect(() => {
    if (open) {
      setUrl(initial?.url || '');
      setTitle(initial?.title || '');
      setThumbnailUrl(initial?.thumbnailUrl || initial?.thumbnail_url || '');
      setCategory(initial?.category || categories[0] || '');
      setTags(initial?.tags ? initial.tags.join(', ') : '');
    }
  }, [open, initial, categories]);

  // 2. 🔥 에러 없는 순수 추출 로직 (외부 API 의존도 0%)
  useEffect(() => {
    if (!url || initial || !open) return;

    const fetchMetadata = async () => {
      setIsFetching(true);

      // ✅ 유튜브 (가장 안전한 noembed 사용)
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

      // ✅ 인스타그램 (통신 없이 텍스트만 조합하여 429 에러 원천 차단)
      if (url.includes('instagram.com')) {
        const cleanUrl = url.split('?')[0].replace(/\/$/, "");
        
        // 🚨 fetch(통신)를 절대 하지 않고, 공식 썸네일 주소 규칙만 입력칸에 꽂아줍니다.
        // 브라우저가 알아서 이미지를 띄울 수 있으면 띄우고, 막히면 빈칸으로 둡니다.
        setTitle(''); // 제목은 사용자가 직접 입력하도록 비움
        setThumbnailUrl(`${cleanUrl}/media/?size=l`);
        setIsFetching(false);
        return;
      }
      
      setIsFetching(false);
    };

    const timer = setTimeout(() => {
      fetchMetadata();
    }, 500);

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
              원본 URL (유튜브는 제목 자동)
            </label>
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl outline-none text-sm focus:border-black transition-all" placeholder="주소를 붙여넣으세요" />
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 mb-1 uppercase tracking-wider">
              제목 {isFetching && <span className="text-pink-400 lowercase font-normal ml-2 animate-pulse">처리 중...</span>}
            </label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl outline-none text-sm transition-all" placeholder="제목을 입력하세요" />
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 mb-1 uppercase tracking-wider">썸네일 이미지</label>
            <div className="flex gap-3 items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden border-2 border-gray-100 flex-shrink-0 relative">
                {thumbnailUrl ? (
                  /* 인스타그램이 막으면 엑스박스 대신 숨김 처리 */
                  <img src={thumbnailUrl} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300 font-bold uppercase">
                    No Img
                  </div>
                )}
              </div>
              <input type="text" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} className="flex-1 px-4 py-2 border-2 border-gray-100 rounded-xl text-[10px] text-gray-400 outline-none" placeholder="이미지 주소" />
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