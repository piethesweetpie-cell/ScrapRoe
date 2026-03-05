import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Link as LinkIcon, Image as ImageIcon, Type, Tag } from 'lucide-react';

export interface AddVideoPayload {
  title: string; url: string; thumbnailUrl: string; category: string; tags: string[];
}

interface Props { open: boolean; onClose: () => void; categories: string[]; onSubmit: (payload: AddVideoPayload) => void; initial?: AddVideoPayload | null; submitLabel?: string; }

export default function AddVideoModal({ open, onClose, categories, onSubmit, initial, submitLabel = '추가하기' }: Props) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [category, setCategory] = useState(categories[0] || '');
  const [tagsInput, setTagsInput] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      if (initial) {
        setUrl(initial.url); setTitle(initial.title); setThumbnailUrl(initial.thumbnailUrl);
        setCategory(initial.category); setTagsInput(initial.tags.join(', '));
      } else {
        setUrl(''); setTitle(''); setThumbnailUrl(''); setCategory(categories[0] || ''); setTagsInput('');
      }
    }
  }, [open, initial, categories]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value.trim();
    setUrl(newUrl);
    if (!newUrl.startsWith("http")) return;

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setIsFetching(true);
      try {
        const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(newUrl)}`);
        const json = await res.json();
        if (json?.status === "success") {
          if (json.data.title && !title) setTitle(json.data.title);
          if (json.data.image?.url) setThumbnailUrl(json.data.image.url);
        }
      } catch (err) { console.error("추출 실패", err); }
      finally { setIsFetching(false); }
    }, 600);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white border-[3px] border-black rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl text-black">
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-100">
          <h2 className="text-xl font-bold flex items-center gap-2"><LinkIcon className="w-6 h-6 text-[#FF66C4]" /> {initial ? '레퍼런스 수정' : '새 레퍼런스 추가'}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-black transition"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ title, url, thumbnailUrl, category, tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean) });
        }} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-black mb-1.5 flex items-center gap-2">원본 URL <span className="text-[#FF66C4] text-xs font-medium">(붙여넣으면 썸네일 자동 추출)</span></label>
            <div className="relative">
              <input type="url" required value={url} onChange={handleUrlChange} placeholder="인스타 릴스나 유튜브 주소를 붙여넣으세요" className="w-full pl-4 pr-10 py-3 bg-white border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-[#FF66C4] transition shadow-sm" />
              {isFetching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FF66C4] animate-spin" />}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-black mb-1.5 flex items-center gap-2"><Type className="w-4 h-4 text-gray-500" /> 제목</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="자동으로 채워집니다" className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-[#FF66C4] transition shadow-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-black mb-1.5 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-gray-500" /> 썸네일 이미지</label>
              <div className="flex gap-3">
                {thumbnailUrl && <img src={thumbnailUrl} alt="미리보기" className="w-16 h-16 object-cover rounded-xl border-2 border-gray-200" />}
                <input type="url" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="자동으로 추출됩니다" className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-[#FF66C4] transition shadow-sm" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-black mb-1.5">카테고리</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-[#FF66C4] transition appearance-none font-medium shadow-sm">
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-1.5 flex items-center gap-2"><Tag className="w-4 h-4 text-gray-500" /> 태그</label>
              <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="예: 누끼, 색보정" className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-[#FF66C4] transition shadow-sm" />
            </div>
          </div>
          <div className="pt-6 mt-2 border-t border-gray-100 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-500 hover:text-black font-bold transition">취소</button>
            <button type="submit" className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg active:scale-95">{submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}