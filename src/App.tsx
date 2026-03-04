import { useState, useEffect } from 'react';
import Masonry from 'react-masonry-css';
// 🔥 검색어 지우기용 'X' 아이콘을 추가로 불러왔습니다.
import { Search, X } from 'lucide-react'; 
import VideoCard from './components/VideoCard';
import AddVideoModal from './components/AddVideoModal';
import { supabase } from './lib/supabaseClient'; 
import './masonry.css';
import logoImg from './assets/ONROE.png';

interface Video {
  id: string; 
  title: string; 
  url: string; 
  thumbnail_url: string; 
  category: string; 
  tags: string[]; 
  created_at: string;
}

const DEFAULT_CATEGORIES = ['Illustrator', 'Photoshop', 'Video Edit', 'AI Art', 'Cutout', 'Font', 'Reference', 'Fools', 'Motion', 'Layout'];

function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCategoryEditMode, setIsCategoryEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'large' | 'small'>('large'); 

  const ITEMS_PER_PAGE = viewMode === 'large' ? 40 : 80;

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setVideos(data || []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchVideos();
    const saved = localStorage.getItem('my_categories');
    if (saved) setCategories(JSON.parse(saved));
  }, []);

  useEffect(() => {
    let filtered = Array.isArray(videos) ? videos : [];
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(v => v.category === selectedCategory);
    }
    
    // 🔥 방탄 검색 기능: 제목과 태그를 무조건 텍스트로 변환해서 이잡듯이 다 뒤집니다!
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v => {
        const titleMatch = v.title ? v.title.toLowerCase().includes(query) : false;
        
        // 태그가 배열이든 문자열이든 강제로 하나의 긴 문장으로 만들어서 검색합니다.
        const tagsText = Array.isArray(v.tags) ? v.tags.join(' ').toLowerCase() : String(v.tags || '').toLowerCase();
        const tagMatch = tagsText.includes(query);
        
        return titleMatch || tagMatch;
      });
    }
    
    setFilteredVideos(filtered);
    setCurrentPage(1); 
  }, [videos, selectedCategory, searchQuery]);

  const handleEditCategory = async (oldName: string) => {
    const newName = window.prompt(`'${oldName}'의 새 이름을 입력하세요:`, oldName);
    if (newName && newName.trim() && newName !== oldName) {
      const trimmed = newName.trim();
      const updatedCats = categories.map(c => c === oldName ? trimmed : c);
      setCategories(updatedCats);
      localStorage.setItem('my_categories', JSON.stringify(updatedCats));

      await supabase.from('videos').update({ category: trimmed }).eq('category', oldName);
      fetchVideos();
      if (selectedCategory === oldName) setSelectedCategory(trimmed);
    }
  };

  const handleDeleteCategory = (e: React.MouseEvent, catToDelete: string) => {
    e.stopPropagation(); 
    if (window.confirm(`'${catToDelete}' 카테고리를 삭제하시겠습니까?`)) {
      const updatedCats = categories.filter(c => c !== catToDelete);
      setCategories(updatedCats);
      localStorage.setItem('my_categories', JSON.stringify(updatedCats));
      if (selectedCategory === catToDelete) setSelectedCategory('All');
    }
  };

  const breakpointColumnsLarge = { default: 5, 1536: 5, 1280: 4, 1024: 3, 768: 2, 640: 1 };
  const breakpointColumnsSmall = { default: 10, 1536: 10, 1280: 8, 1024: 6, 768: 4, 640: 2 };
  const currentBreakpoints = viewMode === 'large' ? breakpointColumnsLarge : breakpointColumnsSmall;

  const totalPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE);
  const currentVideos = filteredVideos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff0f5] via-white via-40% to-[#f0f8ff] text-black overflow-x-hidden w-full">
      
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 pt-3 md:pt-7 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 w-full">
        {/* 🔥 로고를 누르면 All 카테고리로 초기화되고 검색어도 날아가도록 설정! */}
        <div 
          onClick={() => { setSelectedCategory('All'); setSearchQuery(''); setCurrentPage(1); }}
          className="flex items-center gap-3 md:gap-4 leading-none cursor-pointer hover:opacity-80 transition-opacity"
          title="처음으로 (초기화)"
        >
          <img src={logoImg} alt="Logo" className="h-12 sm:h-14 md:h-16 w-auto object-contain" />
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter">SCRAP ROE</h1>
        </div>
        
        <div className="w-full md:w-auto flex flex-wrap items-center justify-end gap-2 md:gap-3">
          <button onClick={() => setIsAddOpen(true)} className="px-5 md:px-7 py-2 md:py-3 bg-[#FF66C4] text-white rounded-full text-sm md:text-base font-bold shadow-md hover:bg-[#ff4d94] transition-all">Add</button>
          <button onClick={() => setIsCategoryEditMode(!isCategoryEditMode)} className={`px-4 md:px-6 py-2 md:py-3 border-[2px] md:border-[3px] border-black rounded-full text-sm md:text-base font-bold transition-all ${isCategoryEditMode ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>Edit</button>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 pb-4 md:pb-6">
        
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
          <div className="relative flex-1 w-full h-12 md:h-14 group">
            <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            
            {/* 🔥 우측 여백(pr-10 md:pr-14)을 줘서 글씨가 X 버튼을 뚫고 지나가지 않게 막았습니다 */}
            <input 
              type="text" 
              placeholder="검색..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full h-full pl-10 md:pl-14 pr-10 md:pr-14 bg-white border-2 border-black rounded-full focus:outline-none text-sm md:text-base" 
            />
            
            {/* 🔥 글씨를 한 글자라도 쓰면 나타나는 우측 X 버튼! */}
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all"
                title="검색어 지우기"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center bg-white/50 border-2 border-black rounded-full p-1 shrink-0 w-full sm:w-auto h-12 md:h-14 overflow-hidden">
            <button onClick={() => { setViewMode('large'); setCurrentPage(1); }} className={`h-full flex items-center justify-center px-4 rounded-full text-sm font-bold transition-all ${viewMode === 'large' ? 'bg-[#FF66C4] text-white shadow-sm' : 'text-gray-600 hover:text-black hover:bg-white/80'}`} title="크게 보기">
              ■ 크게
            </button>
            <button onClick={() => { setViewMode('small'); setCurrentPage(1); }} className={`h-full flex items-center justify-center px-4 rounded-full text-sm font-bold transition-all ${viewMode === 'small' ? 'bg-[#FF66C4] text-white shadow-sm' : 'text-gray-600 hover:text-black hover:bg-white/80'}`} title="작게 보기 (50%)">
              ▦ 작게
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-2.5">
          {['All', ...categories].map((cat) => (
            <button 
              key={cat} 
              onClick={() => (isCategoryEditMode && cat !== 'All') ? handleEditCategory(cat) : setSelectedCategory(cat)}
              className={`relative px-4 md:px-6 py-1.5 md:py-2.5 rounded-full text-sm font-bold transition-all border-2 ${
                selectedCategory === cat ? 'bg-pink-100 text-pink-600 border-pink-200 shadow-inner' : 'bg-white text-gray-700 border-gray-300 hover:bg-pink-50'
              } ${isCategoryEditMode && cat !== 'All' ? 'border-dashed border-pink-400 animate-pulse pr-8' : ''}`}
            >
              {cat} {isCategoryEditMode && cat !== 'All' && <span className="text-[10px] opacity-60 ml-1">(Edit)</span>}
              
              {isCategoryEditMode && cat !== 'All' && (
                <span 
                  onClick={(e) => handleDeleteCategory(e, cat)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center bg-red-100 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors text-xs leading-none"
                  title="삭제"
                >
                  ✕
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 pb-10">
        <Masonry breakpointCols={currentBreakpoints} className="masonry-grid" columnClassName="masonry-grid_column">
          {currentVideos.map((video) => (
            <VideoCard 
              key={video.id} 
              id={video.id} 
              title={video.title} 
              thumbnailUrl={video.thumbnail_url} 
              tags={video.tags} 
              postUrl={video.url}
              viewMode={viewMode}
              onEdit={(id) => { const v = videos.find(x => x.id === id); if(v) { setEditing(v); setIsEditOpen(true); } }}
              onDelete={async (id) => { if(window.confirm('삭제하시겠습니까?')) { await supabase.from('videos').delete().eq('id', id); fetchVideos(); } }}
              onTagClick={(tag) => setSearchQuery(tag)} 
            />
          ))}
        </Masonry>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12 pb-10">
            <button onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={currentPage === 1} className="px-4 py-2 border-2 border-black rounded-full text-sm font-bold disabled:opacity-20 hover:bg-gray-100 transition-all">
              &lt;&lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button key={pageNum} onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`w-10 h-10 flex justify-center items-center border-2 rounded-full text-sm font-bold transition-all ${currentPage === pageNum ? 'bg-[#FF66C4] border-[#FF66C4] text-white shadow-md' : 'bg-white border-black text-black hover:bg-pink-50'}`}>
                {pageNum}
              </button>
            ))}
            <button onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={currentPage === totalPages} className="px-4 py-2 border-2 border-black rounded-full text-sm font-bold disabled:opacity-20 hover:bg-gray-100 transition-all">
              &gt;&gt;
            </button>
          </div>
        )}
      </div>

      <AddVideoModal open={isAddOpen} onClose={() => setIsAddOpen(false)} categories={categories} onSubmit={async (p) => { await supabase.from('videos').insert([{ title: p.title, url: p.url, thumbnail_url: p.thumbnailUrl, category: p.category, tags: p.tags }]); fetchVideos(); setIsAddOpen(false); }} />
      <AddVideoModal open={isEditOpen} onClose={() => { setIsEditOpen(false); setEditing(null); }} categories={categories} initial={editing ? { title: editing.title, url: editing.url, thumbnailUrl: editing.thumbnail_url, category: editing.category, tags: editing.tags } : null} submitLabel="수정 완료" onSubmit={async (p) => { if (!editing) return; await supabase.from('videos').update({ title: p.title, url: p.url, thumbnail_url: p.thumbnailUrl, category: p.category, tags: p.tags }).eq('id', editing.id); fetchVideos(); setIsEditOpen(false); setEditing(null); }} />
    </div>
  );
}

export default App;