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
  thumbnail_url: string; // DB 필드명
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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchVideos = async () => {
    const { data, error } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
    if (!error) setVideos(data || []);
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
  }, [videos, selectedCategory, searchQuery]);

  const handleEditCategory = async (oldName: string) => {
    if (oldName === 'All') return;
    const newName = window.prompt(`'${oldName}'의 새 이름을 입력하세요:`, oldName);
    if (newName?.trim() && newName !== oldName) {
      const trimmed = newName.trim();
      const updatedCats = categories.map(c => c === oldName ? trimmed : c);
      setCategories(updatedCats);
      localStorage.setItem('my_categories', JSON.stringify(updatedCats));
      await supabase.from('videos').update({ category: trimmed }).eq('category', oldName);
      fetchVideos();
    }
  };

  const breakpointColumns = { default: 5, 1536: 5, 1280: 4, 1024: 3, 768: 2, 640: 1 };

  return (
    // overflow-x-hidden: 가로 스크롤 절대 방지 (가로 풀 고정)
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-[#fff0f5] via-white to-[#f0f8ff] text-black">
      
      {/* 1. 헤더: 모바일 텍스트 크기 조절 및 겹침 방지 */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 pt-6 md:pt-10 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-3 leading-none">
            <img src={logoImg} alt="Logo" className="h-10 sm:h-12 md:h-16 w-auto object-contain" />
            {/* text-3xl로 줄여서 모바일 짤림 방지 */}
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">SCRAP ROE</h1>
          </div>
          <div className="flex gap-2 self-start md:self-auto">
            <button onClick={() => setIsAddOpen(true)} className="px-5 md:px-7 py-2 md:py-3 bg-[#FF66C4] text-white rounded-full text-xs md:text-base font-bold shadow-md">Add</button>
            <button onClick={() => setIsCategoryEditMode(!isCategoryEditMode)} className={`px-4 md:px-6 py-2 border-2 md:border-3 border-black rounded-full text-xs md:text-base font-bold transition-all ${isCategoryEditMode ? 'bg-black text-white' : 'bg-white'}`}>Edit</button>
          </div>
        </div>
      </div>

      {/* 2. 카테고리 & 검색: flex-wrap으로 줄바꿈 강제 */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 pb-6 md:pb-10 space-y-4 md:space-y-6">
        {/* flex-wrap: 공간 모자라면 다음 줄로 이동 */}
        <div className="flex flex-wrap gap-2 md:gap-2.5">
          {['All', ...categories].map((cat) => (
            <button key={cat} onClick={() => isCategoryEditMode ? handleEditCategory(cat) : setSelectedCategory(cat)}
              className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[11px] md:text-sm font-bold border-2 transition-all ${
                selectedCategory === cat ? 'bg-pink-100 text-pink-600 border-pink-200' : 'bg-white text-gray-700 border-gray-300'
              } ${isCategoryEditMode && cat !== 'All' ? 'border-dashed border-pink-400 animate-pulse' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {/* 검색바 */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-black rounded-full text-sm focus:outline-none" />
        </div>
      </div>

      {/* 3. 메이슨리 그리드 */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 pb-20 w-full">
        <Masonry breakpointCols={breakpointColumns} className="masonry-grid" columnClassName="masonry-grid_column">
          {filteredVideos.map((v) => (
            <VideoCard key={v.id} id={v.id} title={v.title} thumbnailUrl={v.thumbnail_url} tags={v.tags} postUrl={v.url}
              onEdit={(id) => { const video = videos.find(x => x.id === id); if(video) { setEditing(video); setIsEditOpen(true); } }}
              onDelete={async (id) => { if(window.confirm('삭제하시겠습니까?')) { await supabase.from('videos').delete().eq('id', id); fetchVideos(); } }}
            />
          ))}
        </Masonry>
      </div>

      {/* 모달 */}
      <AddVideoModal open={isAddOpen} onClose={() => setIsAddOpen(false)} categories={categories} 
        onSubmit={async (p) => { await supabase.from('videos').insert([{ title: p.title, url: p.url, thumbnail_url: p.thumbnailUrl, category: p.category, tags: p.tags }]); fetchVideos(); setIsAddOpen(false); }} 
      />

      <AddVideoModal open={isEditOpen} onClose={() => { setIsEditOpen(false); setEditing(null); }} categories={categories}
        initial={editing ? { title: editing.title, url: editing.url, thumbnailUrl: editing.thumbnail_url, category: editing.category, tags: editing.tags } : null}
        submitLabel="수정 완료"
        onSubmit={async (p) => {
          if (!editing) return;
          // DB 필드명인 thumbnail_url로 정확히 매칭
          await supabase.from('videos').update({ title: p.title, url: p.url, thumbnail_url: p.thumbnailUrl, category: p.category, tags: p.tags }).eq('id', editing.id);
          fetchVideos(); setIsEditOpen(false); setEditing(null);
        }} 
      />
    </div>
  );
}

export default App;