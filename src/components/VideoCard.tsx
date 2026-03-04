import React from 'react';
import { Play, ExternalLink, Pencil, Trash2 } from 'lucide-react';

interface VideoCardProps {
  id?: string; title?: string; tags?: string[]; thumbnailUrl?: string; postUrl?: string; 
  onEdit?: (id: string) => void; onDelete?: (id: string) => void;
}

export default function VideoCard({ id = '', title = "제목 없음", tags = [], thumbnailUrl, postUrl, onEdit, onDelete }: VideoCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (postUrl) window.open(postUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div onClick={handleClick} className="relative group rounded-3xl overflow-hidden bg-white border-[3px] border-black cursor-pointer transition-all duration-300 mb-5 aspect-[9/16] hover:border-[#38bdf8] hover:shadow-xl">
      <img src={thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400'} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 z-10" />
      <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-15 pointer-events-none" />

      {/* ★ 기능 복구: onEdit 연결 */}
      <div className="absolute top-6 left-0 right-0 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-40 items-center justify-center">
        <button onClick={(e) => { e.stopPropagation(); onEdit?.(id); }} className="p-2.5 bg-white border-2 border-black hover:bg-[#FF66C4] rounded-full text-black transition w-11 h-11 flex items-center justify-center shadow-lg active:scale-90">
          <Pencil className="w-5 h-5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete?.(id); }} className="p-2.5 bg-white border-2 border-black hover:bg-red-500 rounded-full text-black hover:text-white transition w-11 h-11 flex items-center justify-center shadow-lg active:scale-90">
          <Trash2 className="w-5 h-5" />
        </button>
        <button className="p-2.5 bg-white border-2 border-black rounded-full text-black w-11 h-11 flex items-center justify-center shadow-lg hover:bg-sky-100">
          <ExternalLink className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
          <div className="bg-white/80 p-4 rounded-full shadow-lg">
            <Play className="w-10 h-10 text-black ml-1.5" fill="#000000" /> 
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/65 rounded-2xl z-30">
        <h3 className="text-white font-bold mb-2 line-clamp-4 text-[15px] leading-snug break-keep">{title}</h3>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {tags.map((tag, idx) => (
            <span key={idx} className="text-[10px] bg-transparent text-gray-300 border border-gray-600 px-2 py-0.5 rounded-full font-medium">#{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}