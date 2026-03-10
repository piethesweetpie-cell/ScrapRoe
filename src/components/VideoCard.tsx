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
  isAdmin?: boolean;
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
  onTagClick,
  isAdmin = false
}) => {
  return (
    <div className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/8 transition-all duration-300 masonry-item mb-4 md:mb-5 cursor-pointer">
      
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
        
        {/* ✅ [CASE 1] 크게 보기 모드: 모든 기기에서 제목 박스 노출 (4줄) */}
        {viewMode === 'large' && (
          <div className="absolute inset-x-3 bottom-3 bg-black/70 backdrop-blur-md p-4 rounded-xl z-10 border border-white/10">
            <h3 className="text-white text-sm md:text-base font-semibold leading-snug line-clamp-4 mb-2.5 group-hover:text-pink-100 transition-colors duration-300">
              {title}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {tags && tags.map(tag => (
                <button
                  key={tag}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onTagClick) onTagClick(tag); }}
                  className="px-2 py-0.5 bg-white/15 hover:bg-[#FF66C4] text-white/90 hover:text-white rounded-full text-[10px] md:text-xs font-medium transition-all duration-200 cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ✅ [CASE 2] 작게 보기 모드: 모바일에서만 제목 박스 노출 (2줄), PC(md)에서는 숨김 */}
        {viewMode === 'small' && (
          <div className="md:hidden absolute inset-x-2 bottom-2 bg-black/60 backdrop-blur-sm p-2.5 rounded-xl z-10 border border-white/10">
            <h3 className="text-white text-[11px] font-bold leading-tight line-clamp-2 mb-1">
              {title}
            </h3>
            <div className="flex flex-wrap gap-1">
              {tags && tags.slice(0, 2).map(tag => (
                <button 
                  key={tag} 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onTagClick) onTagClick(tag); }}
                  className="px-1.5 py-0.5 bg-[#FF66C4] text-white rounded-full text-[9px] font-medium"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </a>

      {/* 관리 버튼 - 어드민만 */}
      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(id); }} className="p-1.5 bg-white/90 text-gray-700 rounded-full hover:bg-white hover:text-black shadow-md backdrop-blur-sm transition-all">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(id); }} className="p-1.5 bg-white/90 text-red-500 rounded-full hover:bg-white hover:text-red-600 shadow-md backdrop-blur-sm transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoCard;