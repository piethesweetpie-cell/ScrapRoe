import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const AddVideoModal = ({ open, onClose, categories, initial, onSubmit }: any) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (open) {
      setUrl(initial?.url || ''); setTitle(initial?.title || '');
      setThumbnailUrl(initial?.thumbnailUrl || ''); setCategory(initial?.category || categories[0] || '');
      setTags(initial?.tags ? initial.tags.join(', ') : '');
    }
  }, [open, initial, categories]);

  // 🔥 유튜브 제목 & 썸네일 자동 추출 로직
  useEffect(() => {
    if (!url || initial || !open) return;
    
    const fetchMetadata = async () => {
      // 유튜브 처리
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop()?.split('?')[0];
        if (videoId) {
          setThumbnailUrl(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
          try {
            const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            if (data.title) setTitle(data.title);
          } catch (e) { console.error("제목 추출 실패"); }
        }
      } 
      // 인스타그램 처리 (썸네일만)
      else if (url.includes('instagram.com')) {
        const cleanUrl = url.split('?')[0].replace(/\/$/, "");
        setThumbnailUrl(`${cleanUrl}/media/?size=l`);
        setTitle('Instagram Video');
      }
    };
    fetchMetadata();
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
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-5 py-3.5 border-2 border-gray-100 rounded-2xl focus:border-black outline-none text-sm transition-all" placeholder="https://..." />
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">제목</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-5 py-3.5 border-2 border-gray-100 rounded-2xl focus:border-black outline-none text-sm transition-all" />
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">썸네일 미리보기</label>
            <div className="flex gap-4 items-center">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden border-2 border-gray-100 flex-shrink-0">
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} className="w-full h-full object-cover" alt="" onError={(e) => e.currentTarget.src = 'https://www.instagram.com/static/images/ico/favicon-192.png/b306addcc586.png'} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300 font-bold uppercase">No Img</div>
                )}
              </div>
              <input type="text" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} className="flex-1 px-4 py-3 border-2 border-gray-100 rounded-xl text-[10px] text-gray-400 outline-none" placeholder="썸네일 주소" />
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
              <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full px-4 py-3.5 border-2 border-gray-100 rounded-2xl outline-none text-sm" placeholder="누끼, AI" />
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