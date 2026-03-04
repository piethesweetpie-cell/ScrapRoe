import { useState, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { Search } from 'lucide-react'; 
import VideoCard from './components/VideoCard';
import AddVideoModal from './components/AddVideoModal';
import { supabase } from './lib/supabaseClient'; 
import './masonry.css';
import logoImg from './assets/ONROE.png';

interface Video {
  id: string; title: string; url: string; thumbnail_url: string; category: string; tags: string[]; created_at: string;
}

function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<string[]>([]); 
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCategoryEditMode, setIsCategoryEditMode] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'large' | 'small'>(
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'small' : 'large'
  ); 

  // 🔥 DB에서 실시간으로 고유 카테고리 목록 추출 (기기 간 동기화 핵심)
  const fetchVideos = async () => {
    const { data, error } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setVideos(data);
      const uniqueCats = Array.from(new Set(data.map(v => v.category))).filter(Boolean);
      setCategories(uniqueCats);
    }
  };

  useEffect(() => { fetchVideos(); }, []);

  useEffect(() => {
    let filtered = Array.isArray(videos) ? videos : [];
    if (selectedCategory !== 'All') filtered = filtered.filter(v => v.category === selectedCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.title.toLowerCase().includes(q) || (v.tags && v.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    setFilteredVideos(filtered);
    setCurrentPage(1); 
  }, [videos, selectedCategory, searchQuery]);

  // 카테고리 수정/삭제 시 DB를 건드려 모든 기기에 즉시 반영
  const handleEditCategory = async (oldName: string) => {
    const newName = window.prompt(`'${oldName}'의 새 이름을 입력하세요:`, oldName);
    if (newName && newName.trim() && newName !== oldName) {
      await supabase.from('videos').update({ category: newName.trim() }).eq('category', oldName);
      fetchVideos();
    }
  };

  const handleDeleteCategory = async (e: React.MouseEvent, catToDelete: string) => {
    e.stopPropagation(); 
    if (window.confirm(`'${catToDelete}' 카테고리의 데이터를 모두 삭제합니까?`)) {
      await supabase.from('videos').delete().eq('category', catToDelete);
      fetchVideos();
    }
  };

  const currentBreakpoints = viewMode === 'large' 
    ? { default: 5, 1280: 4, 1024: 3, 768: 2, 640: 1 } 
    : { default: 10, 1280: 8, 1024: 6, 768: 4, 640: 2 };

  const ITEMS_PER_PAGE = viewMode === 'large' ? 40 : 80;
  const currentVideos = filteredVideos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff0f5] via-white to-[#f0f8ff] text-black w-full overflow-x-hidden">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 pt-5 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }} className="flex items-center gap-4 cursor-pointer">
          <img src={logoImg} alt="Logo" className="h-10 md:h-16 w-auto" />
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter">SCRAP ROE</h1>
        </div>
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button onClick={() => setIsAddOpen(true)} className="px-5 py-2 bg-[#FF66C4] text-white rounded-full font-bold shadow-md">Add</button>
          <button onClick={() => setIsCategoryEditMode(!isCategoryEditMode)} className={`px-5 py-2 border-2 border-black rounded-full font-bold ${isCategoryEditMode ? 'bg-black text-white' : ''}`}>Edit</button>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-8">
        <div className="flex flex-row items-center gap-2 mb-4">
          <div className="relative flex-1 h-11 md:h-12">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
            <input type="text" placeholder="검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-full pl-10 md:pl-12 pr-10 border-2 border-black rounded-full outline-none text-sm md:text-base" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">✕</button>}
          </div>
          <div className="flex border-2 border-black rounded-full p-1 h-11 md:h-12 bg-white shrink-0">
            <button onClick={() => setViewMode('large')} className={`px-3 md:px-5 rounded-full text-[10px] md:text-xs font-bold transition-all ${viewMode === 'large' ? 'bg-[#FF66C4] text-white' : ''}`}>■ 크게</button>
            <button onClick={() => setViewMode('small')} className={`px-3 md:px-5 rounded-full text-[10px] md:text-xs font-bold transition-all ${viewMode === 'small' ? 'bg-[#FF66C4] text-white' : ''}`}>▦ 작게</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setSelectedCategory('All')} className={`px-4 py-1.5 rounded-full font-bold border-2 text-sm ${selectedCategory === 'All' ? 'bg-pink-100 border-pink-200 text-pink-600' : 'bg-white border-gray-300'}`}>All</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => isCategoryEditMode ? handleEditCategory(cat) : setSelectedCategory(cat)} className={`relative px-4 py-1.5 rounded-full font-bold border-2 text-sm ${selectedCategory === cat ? 'bg-pink-100 border-pink-200 text-pink-600' : 'bg-white border-gray-300'} ${isCategoryEditMode ? 'border-dashed border-pink-400 pr-9 animate-pulse' : ''}`}>
              {cat}
              {isCategoryEditMode && <span onClick={(e) => handleDeleteCategory(e, cat)} className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center bg-red-100 text-red-500 rounded-full text-xs">✕</span>}
            </button>
          ))}
        </div>

        <Masonry breakpointCols={currentBreakpoints} className="masonry-grid" columnClassName="masonry-grid_column">
          {currentVideos.map(video => (
            <VideoCard key={video.id} {...video} id={video.id} thumbnailUrl={video.thumbnail_url} postUrl={video.url} viewMode={viewMode} onEdit={(id) => { const v = videos.find(x => x.id === id); if(v) { setEditing(v); setIsEditOpen(true); } }} onDelete={async (id) => { if(window.confirm('삭제?')) { await supabase.from('videos').delete().eq('id', id); fetchVideos(); } }} onTagClick={setSearchQuery} />
          ))}
        </Masonry>
      </div>

      <AddVideoModal open={isAddOpen} onClose={() => setIsAddOpen(false)} categories={categories} onSubmit={async (p) => { await supabase.from('videos').insert([{ ...p, thumbnail_url: p.thumbnailUrl }]); fetchVideos(); setIsAddOpen(false); }} />
      <AddVideoModal open={isEditOpen} onClose={() => { setIsEditOpen(false); setEditing(null); }} categories={categories} initial={editing ? { title: editing.title, url: editing.url, thumbnailUrl: editing.thumbnail_url, category: editing.category, tags: editing.tags } : null} onSubmit={async (p) => { if (editing) { await supabase.from('videos').update({ ...p, thumbnail_url: p.thumbnailUrl }).eq('id', editing.id); fetchVideos(); setIsEditOpen(false); } }} />
    </div>
  );
}

export default App;