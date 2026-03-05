import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const AddVideoModal = ({ open, onClose, categories, initial, onSubmit }: any) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isFetching, setIsFetching] = useState(false); // 로딩 피드백용 상태

  useEffect(() => {
    if (open) {
      setUrl(initial?.url || '');
      setTitle(initial?.title || '');
      setThumbnailUrl(initial?.thumbnailUrl || initial?.thumbnail_url || '');
      setCategory(initial?.category || categories[0] || '');
      setTags(initial?.tags ? initial.tags.join(', ') : '');
    }
  }, [open, initial, categories]);

  // 🔥 [핵심] 인스타그램 차단 우회 및 메타데이터 자동 추출 엔진
  useEffect(() => {
    if (!url || initial || !open) return;

    const fetchMetadata = async () => {
      setIsFetching(true);
      try {
        // 1. 유튜브 처리 (가장 안전한 hqdefault 사용)
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop()?.split('?')[0];
          if (videoId) {
            setThumbnailUrl(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
            const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            if (data.title) setTitle(data.title);
          }
        } 
        // 2. 인스타그램 처리 (막힌 방식을 버리고 Microlink API로 우회 추출)
        else if (url.includes('instagram.com')) {
          setTitle('정보를 불러오는 중입니다...');
          const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
          const data = await res.json();

          if (data.status === 'success') {
            if (data.data.title) setTitle(data.data.title);
            if (data.data.image?.url) setThumbnailUrl(data.data.image.url);
            else setThumbnailUrl(''); // 이미지가 막혀있을 경우 빈칸 유지
          } else {
            setTitle('Instagram Video');
            setThumbnailUrl('');
          }
        }
      } catch (e) {
        console.error("추출 실패:", e);
        if (url.includes('instagram.com')) setTitle('Instagram Video');
      } finally {
        setIsFetching(false);
      }
    };

    // 타이핑 중 중복 호출을 막기 위해 0.6초 딜레이
    const timer = setTimeout(() => fetchMetadata(), 600);
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
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[11px] font-black text-pink-400 mb-1.5 ml-1 uppercase tracking-wider">원본 URL</label>
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-5 py-3.5 border-2 border-gray-100 rounded-2xl focus:border-black outline-none text-sm transition-all" placeholder="인스타 릴스나 유튜브 주소 붙여넣기" />
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
              제목 {isFetching && <span className="text-pink-400 lowercase font-normal ml-2 animate-pulse">불러오는 중...</span>}
            </label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-5 py-3.5 border-2 border-gray-100 rounded-2xl focus:border-black outline-none text-sm transition-all" />
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">썸네일 미리보기</label>
            <div className="flex gap-4 items-center">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden border-2 border-gray-100 flex-shrink-0 relative">
                {thumbnailUrl ? (
                  /* 깨진 이미지가 나올 경우 숨김 처리하여 엑스박스 방지 */
                  <img src={thumbnailUrl} className="w-full h-full object-cover" alt="" onError={(e) => e.currentTarget.style.display = 'none'} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300 font-bold uppercase">
                    {isFetching ? '로딩중' : 'No Img'}
                  </div>
                )}
              </div>
              <input type="text" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} className="flex-1 px-4 py-3 border-2 border-gray-100 rounded-xl text-[10px] text-gray-400 outline-none" placeholder="자동으로 추출됩니다" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">카테고리</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3.5 border-2 border-gray-100 rounded-2xl outline-none text-sm bg-white appearance-none">
                {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">태그</label>
              <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full px-4 py-3.5 border-2 border-gray-100 rounded-2xl outline-none text-sm" placeholder="예: 누끼, AI" />
            </div>
          </div>
        </div>

        <button 
          onClick={() => onSubmit({ title, url, thumbnailUrl, category, tags: tags.split(',').map(t => t.trim()).filter(Boolean) })}
          className="w-full py-4 bg-black text-white rounded-2xl font-bold mt-10 hover:bg-gray-800 active:scale-95 transition-all shadow-lg"
        >
          저장하기
        </button>
      </div>
    </div>
  );
};

export default AddVideoModal;