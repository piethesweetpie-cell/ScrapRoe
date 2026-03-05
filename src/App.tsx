import { useState, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { Search, Plus } from 'lucide-react'; // 🔥 Plus 아이콘 추가
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

  // DB에서 데이터를 가져와 카테고리 목록 생성 (기기 간 동기화)
  const fetchVideos = async () => {
    const { data, error } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setVideos(data);
      const uniqueCats = Array.from(new Set(data.map(v => v.category))).filter(Boolean);
      // 기존에 있던 카테고리들과 새로 추가된(아직 영상이 없는) 카테고리를 합쳐서 보여줍니다.
      setCategories(prev => {
        const combined = Array.from(new Set([...prev, ...(uniqueCats as string[])]));
        return combined;
      });
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

  // 🔥 [신규] 카테고리 직접 추가 함수 복구
  const handleAddCategory = () => {
    const name = window.prompt('새 카테고리 이름을 입력하세요:');
    if (name && name.trim()) {
      const trimmed = name.trim();
      if (!categories.includes(trimmed)) {
        setCategories([...categories, trimmed]); // 목록에 즉시 추가
      }
    }
  };

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
      setCategories(categories.filter(c => c !== catToDelete)); // 목록에서도 즉시 삭제
      fetchVideos();
    }
  };

  const currentBreakpoints = viewMode === 'large' 
    ? { default: 5, 1280: 4, 1024: 3, 768: 2, 640: 1 } 
    : { default: 10, 1280: 8, 1024: 6, 768: 4, 640: 2 };

  const ITEMS_PER_PAGE = viewMode === 'large' ? 40 : 80;
  const totalPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE);
  const currentVideos = filteredVideos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff0f5] via-white to-[#f0f8ff] text-black w-full overflow-x-hidden">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 pt-5 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div onClick={() => { setSelectedCategory('All'); setSearchQuery(''); setCurrentPage(1); }} className="flex items-center gap-4 cursor-pointer">
          <img src={logoImg} alt="Logo" className="h-10 md:h-16 w-auto" />
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter">SCRAP ROE</h1>
        </div>
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button onClick={() => setIsAddOpen(true)} className="px-5 py-2 bg-[#FF66C4] text-white rounded-full font-bold shadow-md hover:bg-[#ff4d94] transition-all">Add</button>
          <button onClick={() => setIsCategoryEditMode(!isCategoryEditMode)} className={`px-5 py-2 border-2 border-black rounded-full font-bold transition-all ${isCategoryEditMode ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>Edit</button>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-8">
        <div className="flex flex-row items-center gap-2 mb-4">
          <div className="relative flex-1 h-11 md:h-12">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
            <input type="text" placeholder="검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-full pl-10 md:pl-12 pr-10 border-2 border-black rounded-full outline-none text-sm md:text-base focus:border-[#FF66C4] transition-colors" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors text-xs">✕</button>}
          </div>
          <div className="flex border-2 border-black rounded-full p-1 h-11 md:h-12 bg-white shrink-0">
            <button onClick={() => { setViewMode('large'); setCurrentPage(1); }} className={`px-3 md:px-5 rounded-full text-[10px] md:text-xs font-bold transition-all ${viewMode === 'large' ? 'bg-[#FF66C4] text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}>■ 크게</button>
            <button onClick={() => { setViewMode('small'); setCurrentPage(1); }} className={`px-3 md:px-5 rounded-full text-[10px] md:text-xs font-bold transition-all ${viewMode === 'small' ? 'bg-[#FF66C4] text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}>▦ 작게</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setSelectedCategory('All')} className={`px-4 py-1.5 rounded-full font-bold border-2 text-sm transition-all ${selectedCategory === 'All' ? 'bg-pink-100 border-pink-200 text-pink-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>All</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => isCategoryEditMode ? handleEditCategory(cat) : setSelectedCategory(cat)} className={`relative px-4 py-1.5 rounded-full font-bold border-2 text-sm transition-all ${selectedCategory === cat ? 'bg-pink-100 border-pink-200 text-pink-600' : 'bg-white border-gray-300 hover:bg-gray-50'} ${isCategoryEditMode ? 'border-dashed border-pink-400 pr-9 animate-pulse' : ''}`}>
              {cat}
              {isCategoryEditMode && <span onClick={(e) => handleDeleteCategory(e, cat)} className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center bg-red-100 text-red-500 rounded-full text-[10px] hover:bg-red-500 hover:text-white transition-colors text-xs">✕</span>}
            </button>
          ))}
          
          {/* 🔥 사라졌던 [+] 버튼 복구! */}
          {isCategoryEditMode && (
            <button 
              onClick={handleAddCategory}
              className="px-4 py-1.5 rounded-full font-bold border-2 border-dashed border-gray-400 text-gray-400 hover:border-black hover:text-black transition-all flex items-center justify-center gap-1"
              title="카테고리 추가"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        <Masonry breakpointCols={currentBreakpoints} className="masonry-grid" columnClassName="masonry-grid_column">
          {currentVideos.map(video => (
            <VideoCard key={video.id} {...video} id={video.id} thumbnailUrl={video.thumbnail_url} postUrl={video.url} viewMode={viewMode} onEdit={(id) => { const v = videos.find(x => x.id === id); if(v) { setEditing(v); setIsEditOpen(true); } }} onDelete={async (id) => { if(window.confirm('삭제하시겠습니까?')) { await supabase.from('videos').delete().eq('id', id); fetchVideos(); } }} onTagClick={setSearchQuery} />
          ))}
        </Masonry>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12 pb-12">
            <button onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={currentPage === 1} className="px-4 py-2 border-2 border-black rounded-full text-sm font-bold disabled:opacity-20 hover:bg-gray-100 transition-all"> &lt;&lt; </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button key={pageNum} onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`w-10 h-10 flex justify-center items-center border-2 rounded-full text-sm font-bold transition-all ${currentPage === pageNum ? 'bg-[#FF66C4] border-[#FF66C4] text-white shadow-md' : 'bg-white border-black text-black hover:bg-pink-50'}`}>{pageNum}</button>
            ))}
            <button onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={currentPage === totalPages} className="px-4 py-2 border-2 border-black rounded-full text-sm font-bold disabled:opacity-20 hover:bg-gray-100 transition-all"> &gt;&gt; </button>
          </div>
        )}
      </div>

      <AddVideoModal 
        open={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        categories={categories} 
        onSubmit={async (p) => { 
          const { error } = await supabase.from('videos').insert([{ 
            title: p.title, url: p.url, thumbnail_url: p.thumbnailUrl, category: p.category, tags: p.tags 
          }]); 
          if (error) alert('등록 실패: ' + error.message);
          else { fetchVideos(); setIsAddOpen(false); }
        }} 
      />

      <AddVideoModal 
        open={isEditOpen} 
        onClose={() => { setIsEditOpen(false); setEditing(null); }} 
        categories={categories} 
        initial={editing ? { title: editing.title, url: editing.url, thumbnailUrl: editing.thumbnail_url, category: editing.category, tags: editing.tags } : null} 
        submitLabel="수정 완료"
        onSubmit={async (p) => { 
          if (!editing) return;
          const { error } = await supabase.from('videos').update({ 
            title: p.title, url: p.url, thumbnail_url: p.thumbnailUrl, category: p.category, tags: p.tags 
          }).eq('id', editing.id);
          if (error) alert('수정 실패: ' + error.message);
          else { fetchVideos(); setIsEditOpen(false); setEditing(null); }
        }} 
      />
    </div>
  );
}

export default App;