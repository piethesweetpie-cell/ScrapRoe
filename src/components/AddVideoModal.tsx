import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react'; // 🔥 업로드 아이콘 추가

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

  // 🔥 URL 입력시 썸네일 자동 추출 시도
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    // 간단한 인스타/유튜브 썸네일 추출 로직 (여기에 기존 로직이 들어있을 겁니다)
    // 실패할 경우를 대비해 아래 '파일 업로드' 기능을 추가했습니다.
  };

  // 🔥 [신규] 파일을 직접 선택해서 썸네일로 쓰는 기능 (주소를 몰라도 됨!)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailUrl(reader.result as string); // 파일을 Base64 주소로 변환해 저장
      };
      reader.readAsDataURL(file);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-pink-500">🔗</span> {initial ? '레퍼런스 수정' : '새 레퍼런스 추가'}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="video-url" className="block text-xs font-bold text-gray-500 mb-1 ml-1">원본 URL</label>
              <input id="video-url" name="url" type="text" value={url} onChange={(e) => handleUrlChange(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-black outline-none transition-all text-sm" placeholder="https://..." />
            </div>

            <div>
              <label htmlFor="video-title" className="block text-xs font-bold text-gray-500 mb-1 ml-1">제목</label>
              <input id="video-title" name="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-black outline-none transition-all text-sm" placeholder="영상 제목 입력" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">썸네일 이미지</label>
              <div className="flex gap-3 items-center">
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} className="w-16 h-16 rounded-xl object-cover border-2 border-pink-200" alt="미리보기" />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300"><Upload /></div>
                )}
                <div className="flex-1 flex flex-col gap-1">
                  <input 
                    type="text" 
                    value={thumbnailUrl} 
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-100 rounded-lg text-[10px] outline-none" 
                    placeholder="자동 추출된 주소 (또는 직접 입력)"
                  />
                  {/* 🔥 파일 선택 버튼 추가 */}
                  <label className="cursor-pointer text-[11px] font-bold text-pink-500 hover:text-pink-600 flex items-center gap-1">
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    <Upload className="w-3 h-3" /> 직접 파일 업로드하기
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="video-category" className="block text-xs font-bold text-gray-500 mb-1 ml-1">카테고리</label>
                <select id="video-category" name="category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl outline-none text-sm">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label htmlFor="video-tags" className="block text-xs font-bold text-gray-500 mb-1 ml-1">태그</label>
                <input id="video-tags" name="tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl outline-none text-sm" placeholder="예: 누끼, 색보정" />
              </div>
            </div>
          </div>

          <button 
            onClick={() => onSubmit({ title, url, thumbnailUrl, category, tags: tags.split(',').map(t => t.trim()).filter(Boolean) })}
            className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg mt-2"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddVideoModal;