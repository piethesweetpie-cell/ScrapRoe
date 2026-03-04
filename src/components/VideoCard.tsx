import React from 'react';
import { Pencil, Trash2 } from 'lucide-react'; // 🔥 안 쓰는 ExternalLink(외부 링크) 아이콘 삭제

interface VideoCardProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  tags: string[];
  postUrl: string;
  viewMode?: 'large' | 'small'; 
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ 
  id, 
  title, 
  thumbnailUrl, 
  tags, 
  postUrl, 
  viewMode = 'large', 
  onEdit, 
  onDelete 
}) => {
  return (
    <div className="group relative bg-white border-2 border-black rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 masonry-item mb-4 md:mb-5">
      
      {/* 🔥 썸네일 영역 전체를 <a> 태그로 감싸서 클릭하면 무조건 바로 넘어가게 수정했습니다 */}
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
              {tags.map(tag => (
                <span key={tag} className="px-2.5 py-0.5 bg-white/20 text-white rounded-full text-xs font-medium backdrop-blur-sm">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </a>

      {/* 🔥 삭제/수정 버튼만 남기고 링크 아이콘은 싹 없앴습니다 */}
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