import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AddVideoModalProps {
  open: boolean;
  onClose: () => void;
  categories: string[];
  initial?: any;
  submitLabel?: string;
  onSubmit: (data: any) => void;
}

const AddVideoModal: React.FC<AddVideoModalProps> = ({ 
  open, onClose, categories, initial, submitLabel = "추가하기", onSubmit 
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (initial) {
      setUrl(initial.url || '');
      setTitle(initial.title || '');
      setThumbnailUrl(initial.thumbnailUrl || '');
      setCategory(initial.category || '');
      setTags(initial.tags ? initial.tags.join(', ') : '');
    } else {
      setUrl(''); setTitle(''); setThumbnailUrl(''); setCategory(categories[0] || ''); setTags('');
    }
  }, [initial, open, categories]);

  // 🔥 [핵심] 다시 살아난 자동 썸네일 추출 엔진
  useEffect(() => {
    if (!url || initial) return;

    let detectedThumb = '';

    // 1. 유튜브 썸네일 추출
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop()?.split('?')[0];
      if (videoId) detectedThumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    } 
    // 2. 인스타그램 썸네일 추출 (가장 확실한 방법으로 복구)
    else if (url.includes('instagram.com')) {
      const cleanUrl = url.split('?')[0];
      detectedThumb = `${cleanUrl}media/?size=l`;
    }

    if (detectedThumb) {
      setThumbnailUrl(detectedThumb);
    }
  }, [url, initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">🔗 {initial ? '정보 수정' : '새 레퍼런스 추가'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-black"><X /></button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">원본 URL (붙여넣으면 썸네일 자동 추출)</label>
              <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-4 py-2 border-2 border-gray-100 rounded-lg focus:border-black outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">제목</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 border-2 border-gray-100 rounded-lg focus:border-black outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">썸네일 미리보기</label>
              <div className="flex gap-3 items-center">
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} className="w-full h-full object-cover" alt="미리보기" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">이미지 없음</div>
                  )}
                </div>
                <input type="text" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} className="flex-1 px-3 py-2 border border-gray-100 rounded-lg text-[10px] text-gray-400 outline-none" placeholder="썸네일 주소 자동 생성됨" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">카테고리</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border-2 border-gray-100 rounded-lg outline-none">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">태그 (쉼표 구분)</label>
                <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full px-3 py-2 border-2 border-gray-100 rounded-lg outline-none" placeholder="누끼, AI" />
              </div>
            </div>
          </div>

          <button 
            onClick={() => onSubmit({ title, url, thumbnailUrl, category, tags: tags.split(',').map(t => t.trim()).filter(Boolean) })}
            className="w-full py-4 bg-pink-500 text-white rounded-xl font-bold mt-6 hover:bg-pink-600 shadow-lg active:scale-95 transition-all"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddVideoModal;