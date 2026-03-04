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
        
        {/* 🔥 크게 보기 모드: 배경 그라데이션과 제목 4줄을 확실히 강제 적용 */}
        {viewMode === 'large' && (
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-5 flex flex-col justify-end z-10">
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
      </a>

      {/* 관리 버튼 */}
      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(id); }} className="p-2 bg-white/90 text-gray-700 rounded-full hover:bg-white hover:text-black shadow-md backdrop-blur-sm transition-all">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(id); }} className="p-2 bg-white/90 text-red-500 rounded-full hover:bg-white hover:text-red-600 shadow-md backdrop-blur-sm transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default VideoCard;