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
  onTagClick?: (tag: string) => void;
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
  onTagClick
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
        
        {/* 🔥 크게 보기(large) 모드: 반투명 그라데이션 배경 + 4줄 제목 + 태그 복구 */}
        {viewMode === 'large' && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 flex flex-col justify-end">
            
            {/* 제목: line-clamp-4로 4줄까지 표시 */}
            <h3 className="text-white text-base font-bold leading-tight line-clamp-4 mb-3 group-hover:text-pink-100 transition-colors">
              {title}
            </h3>
            
            <div className="flex flex-wrap gap-1.5">
              {tags && tags.map(tag => (
                <button 
                  key={tag} 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation(); 
                    if (onTagClick) onTagClick(tag);
                  }}
                  className="px-2.5 py-0.5 bg-white/20 hover:bg-[#FF66C4] text-white rounded-full text-xs font-medium backdrop-blur-sm transition-colors cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 🔥 작게 보기(small) 모드: 배경 없이 이미지만 강조 (호버시에만 태그 살짝) */}
        {viewMode === 'small' && (
          <div className="absolute inset-0 p-2 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
            <div className="flex flex-wrap gap-1">
              {tags && tags.slice(0, 2).map(tag => (
                <button 
                  key={tag} 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation(); 
                    if (onTagClick) onTagClick(tag);
                  }}
                  className="px-2 py-0.5 bg-[#FF66C4] text-white rounded-full text-[10px] font-medium transition-colors cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </a>

      {/* 수정/삭제 버튼 (z-index 20으로 최상단 유지) */}
      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(id); }} 
          className="p-2 bg-white/90 text-gray-700 rounded-full hover:bg-white hover:text-black shadow-md backdrop-blur-sm transition-all" 
          title="수정"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(id); }} 
          className="p-2 bg-white/90 text-red-500 rounded-full hover:bg-white hover:text-red-600 shadow-md backdrop-blur-sm transition-all" 
          title="삭제"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default VideoCard;