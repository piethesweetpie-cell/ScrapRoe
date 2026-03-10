import { useState, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { Search, Plus, LogIn, LogOut } from 'lucide-react';
import VideoCard from './components/VideoCard';
import AddVideoModal from './components/AddVideoModal';
import LoginModal from './components/Login';
import { supabase } from './lib/supabaseClient';
import { useAuth } from './hooks/useAuth';
import './masonry.css';
import logoImg from './assets/ONROE.png';

function App() {
  const [videos, setVideos] = useState<any[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]); 
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // 🔥 1. 검색창 상태 복구
  const [searchQuery, setSearchQuery] = useState('');
  const [isCategoryEditMode, setIsCategoryEditMode] = useState(false);
  const [modal, setModal] = useState<{open: boolean, initial: any}>({ open: false, initial: null });
  
  // 🔥 2. 페이지네이션 및 '크게/작게' 뷰 모드 상태 완벽 복구
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'large' | 'small'>(
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'small' : 'large'
  );
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();

  const fetchVideos = async () => {
    const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
    if (data) {
      setVideos(data);
      const uniqueCats = Array.from(new Set(data.map((v: any) => v.category))).filter(Boolean);
      setCategories(prev => Array.from(new Set([...prev, ...(uniqueCats as string[])])));
    }
  };

  useEffect(() => { fetchVideos(); }, []);

  useEffect(() => {
    let filtered = Array.isArray(videos) ? videos : [];
    if (selectedCategory !== 'All') filtered = filtered.filter(v => v.category === selectedCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(v => v.title.toLowerCase().includes(q) || (v.tags?.some((t: string) => t.toLowerCase().includes(q))));
    }
    setFilteredVideos(filtered);
    setCurrentPage(1); // 검색이나 카테고리 변경 시 무조건 1페이지로 이동
  }, [videos, selectedCategory, searchQuery]);

  const handleAddCategory = () => {
    const name = window.prompt('새 카테고리 이름:');
    if (name?.trim() && !categories.includes(name.trim())) {
      setCategories([...categories, name.trim()]);
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
      setCategories(categories.filter(c => c !== catToDelete));
      fetchVideos();
    }
  };

  // 🔥 3. 뷰 모드('크게/작게')에 따른 반응형 그리드 갯수 조절 로직
  const currentBreakpoints = viewMode === 'large' 
    ? { default: 5, 1280: 4, 1024: 3, 768: 2, 640: 1 } 
    : { default: 10, 1280: 8, 1024: 6, 768: 4, 640: 2 };

  const ITEMS_PER_PAGE = viewMode === 'large' ? 40 : 80;
  const totalPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE);
  const currentVideos = filteredVideos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // 🔥 4. 배경 그라데이션 복구 (bg-gradient-to-br)
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-black w-full overflow-x-hidden">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 pt-6 pb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100">
        <div onClick={() => { setSelectedCategory('All'); setSearchQuery(''); setCurrentPage(1); }} className="flex items-center gap-4 cursor-pointer">
          <img src={logoImg} alt="Logo" className="h-10 md:h-16 w-auto" />
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>SCRAP ROE</h1>
        </div>
        <div className="flex gap-2 w-full md:w-auto justify-end items-center">
          {isAdmin && (
            <>
              <button onClick={() => setModal({ open: true, initial: null })} className="px-5 py-2 bg-[#FF66C4] text-white rounded-full font-semibold text-sm shadow-lg shadow-pink-200 hover:bg-[#ff4db5] hover:shadow-pink-300 transition-all duration-300 cursor-pointer">Add</button>
              <button onClick={() => setIsCategoryEditMode(!isCategoryEditMode)} className={`px-5 py-2 rounded-full font-semibold text-sm border transition-all duration-300 cursor-pointer ${isCategoryEditMode ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50'}`}>Edit</button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-8">
        
        {/* 🔥 5. 검색창 및 크게보기/작게보기 버튼 UI 복구 */}
        <div className="flex flex-row items-center gap-2 mb-4">
          <div className="relative flex-1 h-11 md:h-12">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
            <input type="text" placeholder="검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-full pl-10 md:pl-12 pr-10 border border-gray-200 rounded-2xl outline-none text-sm md:text-base focus:border-[#FF66C4] focus:ring-2 focus:ring-pink-100 transition-all duration-200 bg-white font-medium placeholder-gray-400 cursor-text" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors text-xs cursor-pointer">✕</button>}
          </div>
          <div className="flex border border-gray-200 rounded-2xl p-1 h-11 md:h-12 bg-white shrink-0">
            <button onClick={() => { setViewMode('large'); setCurrentPage(1); }} className={`px-3 md:px-5 rounded-xl text-[10px] md:text-xs font-semibold transition-all duration-200 cursor-pointer ${viewMode === 'large' ? 'bg-[#FF66C4] text-white shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}>■ 크게</button>
            <button onClick={() => { setViewMode('small'); setCurrentPage(1); }} className={`px-3 md:px-5 rounded-xl text-[10px] md:text-xs font-semibold transition-all duration-200 cursor-pointer ${viewMode === 'small' ? 'bg-[#FF66C4] text-white shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}>▦ 작게</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setSelectedCategory('All')} className={`px-4 py-1.5 rounded-full font-medium border text-sm transition-all duration-200 cursor-pointer ${selectedCategory === 'All' ? 'bg-[#FF66C4] text-white border-[#FF66C4] shadow-sm shadow-pink-200' : 'bg-white border-gray-200 text-gray-600 hover:border-[#FF66C4] hover:text-[#FF66C4]'}`}>All</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => isCategoryEditMode ? handleEditCategory(cat) : setSelectedCategory(cat)} className={`relative px-4 py-1.5 rounded-full font-medium border text-sm transition-all duration-200 cursor-pointer ${selectedCategory === cat ? 'bg-[#FF66C4] text-white border-[#FF66C4] shadow-sm shadow-pink-200' : 'bg-white border-gray-200 text-gray-600 hover:border-[#FF66C4] hover:text-[#FF66C4]'} ${isCategoryEditMode ? 'border-dashed border-pink-300 pr-9' : ''}`}>
              {cat}
              {isCategoryEditMode && <span onClick={(e) => handleDeleteCategory(e, cat)} className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center bg-red-50 text-red-400 rounded-full text-[10px] hover:bg-red-500 hover:text-white transition-all duration-150 cursor-pointer">✕</span>}
            </button>
          ))}
          {isCategoryEditMode && (
            <button onClick={handleAddCategory} className="px-4 py-1.5 rounded-full font-medium border border-dashed border-gray-300 text-gray-400 hover:border-[#FF66C4] hover:text-[#FF66C4] transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 🔥 VideoCard에 viewMode 전달하여 모드별로 카드 렌더링되게 복구 */}
        <Masonry breakpointCols={currentBreakpoints} className="masonry-grid" columnClassName="masonry-grid_column">
          {currentVideos.map(video => (
            <VideoCard key={video.id} {...video} id={video.id} thumbnailUrl={video.thumbnail_url} postUrl={video.url} viewMode={viewMode} isAdmin={isAdmin} onEdit={() => setModal({ open: true, initial: video })} onDelete={async () => { if(confirm('삭제하시겠습니까?')) { await supabase.from('videos').delete().eq('id', video.id); fetchVideos(); } }} onTagClick={setSearchQuery} />
          ))}
        </Masonry>

        {/* 하단 페이지네이션 + 로그인 버튼 */}
        <div className="flex justify-center items-center gap-2 mt-12 pb-12 relative">
          {totalPages > 1 && (
            <>
              <button onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={currentPage === 1} className="px-4 py-2 border border-gray-200 rounded-full text-sm font-medium disabled:opacity-30 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 cursor-pointer"> &lt;&lt; </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button key={pageNum} onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`w-10 h-10 flex justify-center items-center border rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${currentPage === pageNum ? 'bg-[#FF66C4] border-[#FF66C4] text-white shadow-md shadow-pink-200' : 'bg-white border-gray-200 text-gray-600 hover:border-[#FF66C4] hover:text-[#FF66C4]'}`}>{pageNum}</button>
              ))}
              <button onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={currentPage === totalPages} className="px-4 py-2 border border-gray-200 rounded-full text-sm font-medium disabled:opacity-30 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 cursor-pointer"> &gt;&gt; </button>
            </>
          )}
          <div className="absolute right-0">
            {user ? (
              <button onClick={() => signOut()} className="p-2 rounded-full border border-gray-200 hover:border-gray-400 transition-all duration-200 cursor-pointer" title={user.email ?? ''}>
                <LogOut className="w-4 h-4 text-gray-500" />
              </button>
            ) : (
              <button onClick={() => setLoginModalOpen(true)} className="p-2 rounded-full border border-gray-200 hover:border-gray-400 transition-all duration-200 cursor-pointer">
                <LogIn className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {loginModalOpen && <LoginModal onClose={() => setLoginModalOpen(false)} />}

      <AddVideoModal
        open={modal.open} 
        onClose={() => setModal({ open: false, initial: null })} 
        categories={categories} 
        initial={modal.initial ? { ...modal.initial, thumbnailUrl: modal.initial.thumbnail_url } : null}
        onSubmit={async (p: any) => { 
          const payload = { title: p.title, url: p.url, thumbnail_url: p.thumbnailUrl, category: p.category, tags: p.tags };
          const { error } = modal.initial 
            ? await supabase.from('videos').update(payload).eq('id', modal.initial.id)
            : await supabase.from('videos').insert([payload]);
          if (error) alert(error.message); else { fetchVideos(); setModal({ open: false, initial: null }); }
        }} 
      />
    </div>
  );
}

export default App;