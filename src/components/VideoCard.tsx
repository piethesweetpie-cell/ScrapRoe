import React from 'react';
import { Pencil, Trash2, ExternalLink } from 'lucide-react';

interface VideoCardProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  tags: string[];
  postUrl: string;
  // 🔥 viewMode 프롭 추가
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
  // 🔥 기본값은 'large'
  viewMode = 'large', 
  onEdit, 
  onDelete 
}) => {
  return (
    <div className="group relative bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 masonry-item mb-4 md:mb-5">
      
      {/* 썸네일 이미지 - 비율 유지 */}
      <div className="relative aspect-[9/16] w-full overflow-hidden">
        <img 
          src={thumbnailUrl} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* 🔥 요청하신 조건부 렌더링: large 뷰일 때만 블랙 배경 박스와 제목 표시 */}
        {viewMode === 'large' && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-end">
            <h3 className="text-white text-base font-bold leading-tight line-clamp-2 mb-2 group-hover:text-pink-100 transition-colors">
              {title}
            </h3>
            
            {/* 태그 영역 - large 뷰에서만 표시 */}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {tags.map(tag => (
                <span key={tag} className="px-2.5 py-0.5 bg-white/20 text-white rounded-full text-xs font-medium backdrop-blur-sm">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 호버 시 나타나는 도구 모음 */}
      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
        <button 
          onClick={() => onEdit(id)}
          className="p-2 bg-white/90 text-gray-700 rounded-full hover:bg-white hover:text-black shadow-md backdrop-blur-sm transition-all"
          title="수정"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onDelete(id)}
          className="p-2 bg-white/90 text-red-500 rounded-full hover:bg-white hover:text-red-600 shadow-md backdrop-blur-sm transition-all"
          title="삭제"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <a 
          href={postUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 bg-white/90 text-blue-500 rounded-full hover:bg-white hover:text-blue-600 shadow-md backdrop-blur-sm transition-all"
          title="원본 링크 열기"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default VideoCard;