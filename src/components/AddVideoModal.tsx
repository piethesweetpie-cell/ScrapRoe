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

  useEffect(() => {
    if (!url || initial || !open) return;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const id = url.split('v=')[1]?.split('&')[0] || url.split('/').pop()?.split('?')[0];
      if (id) {
        setThumbnailUrl(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`);
        fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`)
          .then(res => res.json()).then(data => { if(data.title) setTitle(data.title); });
      }
    } else if (url.includes('instagram.com')) {
      setThumbnailUrl(`${url.split('?')[0]}media/?size=l`);
      setTitle('Instagram Video');
    }
  }, [url, initial, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{initial ? '레퍼런스 수정' : '새 레퍼런스 추가'}</h2>
          <button onClick={onClose} className="text-gray-400"><X /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-black text-pink-400 mb-1 uppercase">원본 URL</label>
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl outline-none text-sm" />
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-400 mb-1 uppercase">제목</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl outline-none text-sm" />
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-400 mb-1 uppercase">썸네일 이미지</label>
            <div className="flex gap-3 items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden border-2 border-gray-100 flex-shrink-0">
                {thumbnailUrl ? <img src={thumbnailUrl} className="w-full h-full object-cover" /> : <div className="text-[10px] text-gray-300 w-full h-full flex items-center justify-center font-bold">NO IMG</div>}
              </div>
              <input type="text" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} className="flex-1 px-4 py-2 border-2 border-gray-100 rounded-xl text-[10px] text-gray-400 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black text-gray-400 mb-1 uppercase">카테고리</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl outline-none text-sm bg-white">
                {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-400 mb-1 uppercase">태그</label>
              <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl outline-none text-sm" />
            </div>
          </div>
        </div>
        <button onClick={() => onSubmit({ title, url, thumbnailUrl, category, tags: tags.split(',').map(t => t.trim()).filter(Boolean) })} className="w-full py-4 bg-black text-white rounded-2xl font-bold mt-8">저장하기</button>
      </div>
    </div>
  );
};

export default AddVideoModal;