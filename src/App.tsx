import { useState, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { Search } from 'lucide-react'; 
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
    if (selectedCategory !== 'All') filtered = filtered.filter(v => v.category === selectedCategory);
    if (searchQuery) filtered = filtered.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()));
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
      
      {/* 1. 헤더 영역 */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 pt-3 md:pt-7 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 w-full">
        <div className="flex items-center gap-3 md:gap-4 leading-none">
          <img src={logoImg} alt="Logo" className="h-12 sm:h-14 md:h-16 w-auto object-contain" />
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter">SCRAP ROE</h1>
        </div>
        
        {/* 🔥 여기서 뷰어 토글 버튼을 뺐습니다! */}
        <div className="w-full md:w-auto flex flex-wrap items-center justify-end gap-2 md:gap-3">
          <button onClick={() => setIsAddOpen(true)} className="px-5 md:px-7 py-2 md:py-3 bg-[#FF66C4] text-white rounded-full text-sm md:text-base font-bold shadow-md hover:bg-[#ff4d94] transition-all">Add</button>
          <button onClick={() => setIsCategoryEditMode(!isCategoryEditMode)} className={`px-4 md:px-6 py-2 md:py-3 border-[2px] md:border-[3px] border-black rounded-full text-sm md:text-base font-bold transition-all ${isCategoryEditMode ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>Edit</button>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 pb-4 md:pb-6">
        
        {/* 🔥 검색창 & 뷰어 토글 버튼 합체! */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
          
          {/* 1. 검색창 (flex-1로 남는 가로 공간을 다 먹게 설정) */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            <input type="text" placeholder="검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 md:pl-14 pr-6 py-3 md:py-4 bg-white border-2 border-black rounded-full focus:outline-none text-sm md:text-base" />
          </div>

          {/* 2. 뷰어 토글 버튼 (우측에 딱 붙어있게 shrink-0 설정) */}
          <div className="flex bg-white/50 border-2 border-black rounded-full p-1 gap-1 shrink-0 w-full sm:w-auto justify-center">
            <button onClick={() => { setViewMode('large'); setCurrentPage(1); }} className={`px-4 py-2 md:py-2.5 rounded-full text-sm font-bold transition-all ${viewMode === 'large' ? 'bg-[#FF66C4] text-white shadow-sm' : 'text-gray-600 hover:text-black hover:bg-white/80'}`} title="크게 보기">
              ■ 크게
            </button>
            <button onClick={() => { setViewMode('small'); setCurrentPage(1); }} className={`px-4 py-2 md:py-2.5 rounded-full text-sm font-bold transition-all ${viewMode === 'small' ? 'bg-[#FF66C4] text-white shadow-sm' : 'text-gray-600 hover:text-black hover:bg-white/80'}`} title="작게 보기 (50%)">
              ▦ 작게
            </button>
          </div>

        </div>

        {/* 3. 카테고리 버튼들 (가장 아래로 유지) */}
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