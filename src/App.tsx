import { useState, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { Search, Plus } from 'lucide-react';
import VideoCard from './components/VideoCard';
import AddVideoModal from './components/AddVideoModal';
import { supabase } from './lib/supabaseClient'; 
import './masonry.css';
import logoImg from './assets/ONROE.png';

function App() {
  const [videos, setVideos] = useState<any[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]); 
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCategoryEditMode, setIsCategoryEditMode] = useState(false);
  
  const [modal, setModal] = useState<{open: boolean, initial: any}>({ open: false, initial: null });

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
  }, [videos, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-white text-black w-full overflow-x-hidden">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 py-6 flex justify-between items-center">
        <div onClick={() => setSelectedCategory('All')} className="flex items-center gap-4 cursor-pointer">
          <img src={logoImg} alt="Logo" className="h-10 md:h-16" />
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter">SCRAP ROE</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal({ open: true, initial: null })} className="px-5 py-2 bg-[#FF66C4] text-white rounded-full font-bold shadow-md hover:bg-[#ff4d94]">Add</button>
          <button onClick={() => setIsCategoryEditMode(!isCategoryEditMode)} className={`px-5 py-2 border-2 border-black rounded-full font-bold ${isCategoryEditMode ? 'bg-black text-white' : ''}`}>Edit</button>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-8">
        <div className="flex gap-2 mb-8 flex-wrap">
          <button onClick={() => setSelectedCategory('All')} className={`px-4 py-1.5 rounded-full font-bold border-2 ${selectedCategory === 'All' ? 'bg-pink-100 border-pink-200 text-pink-600' : 'bg-white border-gray-300'}`}>All</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full font-bold border-2 ${selectedCategory === cat ? 'bg-pink-100 border-pink-200 text-pink-600' : 'bg-white border-gray-300'}`}>{cat}</button>
          ))}
          {isCategoryEditMode && <button onClick={() => { const n = prompt('새 카테고리:'); if(n) setCategories([...categories, n.trim()]); }} className="px-4 py-1.5 rounded-full border-2 border-dashed border-gray-400 text-gray-400"><Plus className="w-4 h-4" /></button>}
        </div>

        <Masonry breakpointCols={{ default: 5, 1280: 4, 1024: 3, 768: 2, 640: 1 }} className="masonry-grid" columnClassName="masonry-grid_column">
          {filteredVideos.map(video => (
            <VideoCard key={video.id} {...video} id={video.id} thumbnailUrl={video.thumbnail_url} postUrl={video.url} onEdit={() => setModal({ open: true, initial: video })} onDelete={async () => { if(confirm('삭제하시겠습니까?')) { await supabase.from('videos').delete().eq('id', video.id); fetchVideos(); } }} />
          ))}
        </Masonry>
      </div>

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