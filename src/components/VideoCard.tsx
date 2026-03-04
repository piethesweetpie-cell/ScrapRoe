import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

interface VideoCardProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  tags: string[];
  postUrl: string;
  viewMode?: 'large' | 'small'; 
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTagClick?: (tag: string) => void; // 🔥 태그 클릭 기능 추가
}

const VideoCard: React.FC<VideoCardProps> = ({ 
  id, 
  title, 
  thumbnailUrl, 
  tags, 
  postUrl, 
  viewMode = 'large', 
  onEdit, 
  onDelete,
  onTagClick // 🔥 프롭스로 받아오기
}) => {
  return (
    <div className="group relative bg-white border-2 border-black rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 masonry-item mb-4 md:mb-5">
      
      <a 
        href={postUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="relative aspect-[9/16] w-full overflow-hidden block cursor-pointer"
      >
        <img 
          src={thumbnailUrl} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {viewMode === 'large' && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-end">
            <h3 className="text-white text-base font-bold leading-tight line-clamp-2 mb-2 group-hover:text-pink-100 transition-colors">
              {title}
            </h3>
            
            <div className="flex flex-wrap gap-1.5 mt-1">
              {tags && tags.map(tag => (
                // 🔥 span을 button으로 바꾸고, 클릭 기능을 넣었습니다!
                <button 
                  key={tag} 
                  onClick={(e) => {
                    e.preventDefault(); // 🔥 태그 눌렀을 때 새 창(원본 링크) 열리는 거 방지
                    e.stopPropagation(); 
                    if (onTagClick) onTagClick(tag); // 🔥 누른 태그 이름 전달
                  }}
                  className="px-2.5 py-0.5 bg-white/20 hover:bg-[#FF66C4] text-white rounded-full text-xs font-medium backdrop-blur-sm transition-colors cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </a>

      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
        <button onClick={() => onEdit(id)} className="p-2 bg-white/90 text-gray-700 rounded-full hover:bg-white hover:text-black shadow-md backdrop-blur-sm transition-all" title="수정">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(id)} className="p-2 bg-white/90 text-red-500 rounded-full hover:bg-white hover:text-red-600 shadow-md backdrop-blur-sm transition-all" title="삭제">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default VideoCard;