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

const FALLBACK_IMAGE = '/fallback.svg';

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
  const safeThumbnailUrl = thumbnailUrl || FALLBACK_IMAGE;

  return (
    <div className="group relative bg-white border-2 border-black rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/8 hover:scale-[1.02] transition-all duration-300 masonry-item mb-4 md:mb-5 cursor-pointer">
      <a
        href={postUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative aspect-[9/16] w-full overflow-hidden block cursor-pointer bg-black"
      >
        <img
          src={safeThumbnailUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== window.location.origin + FALLBACK_IMAGE) {
              target.src = FALLBACK_IMAGE;
            }
          }}
        />

        {viewMode === 'large' && (
          <div className="absolute inset-x-0 bottom-0 bg-black/70 p-4 z-10 h-[140px] flex flex-col">
            <h3 className="text-white text-sm md:text-base font-semibold leading-snug line-clamp-3 group-hover:text-[#d4cef0] transition-colors duration-300">
              {title}
            </h3>
            <div className="flex flex-wrap gap-1.5 mt-auto">
              {tags && tags.map(tag => (
                <button
                  key={tag}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onTagClick) onTagClick(tag); }}
                  className="px-2 py-0.5 bg-white/15 hover:bg-[#605399] text-white/90 hover:text-white rounded-full text-[10px] md:text-xs font-medium transition-all duration-200 cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'small' && (
          <div className="md:hidden absolute inset-x-0 bottom-0 bg-black/70 p-2 z-10 h-[90px] flex flex-col">
            <h3 className="text-white text-[11px] font-bold leading-tight line-clamp-2">
              {title}
            </h3>
            <div className="flex flex-wrap gap-1 mt-auto">
              {tags && tags.slice(0, 2).map(tag => (
                <button
                  key={tag}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onTagClick) onTagClick(tag); }}
                  className="px-1.5 py-0.5 bg-[#605399] text-white rounded-full text-[9px] font-medium"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </a>

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
