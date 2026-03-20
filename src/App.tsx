import { useState, useEffect, useRef } from 'react';
import Masonry from 'react-masonry-css';
import { Search, Plus, LogIn, LogOut, Lock } from 'lucide-react';
import { motion, useMotionValue, useTransform, useSpring, useScroll } from 'framer-motion';
import VideoCard from './components/VideoCard';
import AddVideoModal from './components/AddVideoModal';
import LoginModal from './components/Login';
import { supabase } from './lib/supabaseClient';
import { useAuth } from './hooks/useAuth';
import './masonry.css';
import logoImg from './assets/ONROE.png';
import objBlob from './assets/obj-blob.png';
import objDiamond from './assets/obj-diamond.png';
import objTorus from './assets/obj-torus.png';

const INTER = "'Inter', sans-serif";
const ACCENT = '#FF66C4';

function App() {
  const [videos, setVideos] = useState<any[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCategoryEditMode, setIsCategoryEditMode] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; initial: any }>({ open: false, initial: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'large' | 'small'>(
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'small' : 'large'
  );
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const { user, isAdmin, signOut } = useAuth();

  // 보석 애니메이션 - 마우스 패럴랙스
  const heroRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { damping: 32, stiffness: 80 });
  useSpring(mouseY, { damping: 32, stiffness: 80 });
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const smoothScroll = useSpring(scrollYProgress, { damping: 26, stiffness: 130 });

  const blobX = useTransform(springX, [-0.5, 0.5], [-30, 30]);
  const blobScrollY = useTransform(smoothScroll, [0, 0.5], [0, -500]);
  const diamondX = useTransform(springX, [-0.5, 0.5], [25, -25]);
  const diamondScrollY = useTransform(smoothScroll, [0, 0.5], [0, 500]);
  const torusX = useTransform(springX, [-0.5, 0.5], [-18, 18]);
  const torusScrollY = useTransform(smoothScroll, [0, 0.5], [0, -380]);
  const objOpacity = useTransform(smoothScroll, [0, 0.4], [1, 0]);
  const objScale = useTransform(smoothScroll, [0, 0.5], [1, 0.82]);
  const rotateLeft = useTransform(smoothScroll, [0, 0.5], [0, -45]);
  const rotateRight = useTransform(smoothScroll, [0, 0.5], [0, 45]);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

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
      filtered = filtered.filter(v =>
        v.title.toLowerCase().includes(q) ||
        (v.tags?.some((t: string) => t.toLowerCase().includes(q)))
      );
    }
    setFilteredVideos(filtered);
  }, [videos, selectedCategory, searchQuery]);

  useEffect(() => { setCurrentPage(1); }, [selectedCategory, searchQuery]);

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

  const currentBreakpoints = viewMode === 'large'
    ? { default: 5, 1280: 4, 1024: 3, 768: 2, 640: 1 }
    : { default: 10, 1280: 8, 1024: 6, 768: 4, 640: 2 };

  const ITEMS_PER_PAGE = viewMode === 'large' ? 30 : 80;
  const totalPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE);
  const currentVideos = filteredVideos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#09090B] overflow-x-hidden">

      {/*── Bottom gradient ── */}
      <div className="fixed bottom-0 left-0 right-0 h-80 pointer-events-none z-0" style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(232,232,232,0.25) 40%, rgba(218,218,218,0.6) 100%)' }} />

      {/* ── Floating pill nav ── */}
      <div className="sticky top-5 left-0 right-0 z-50 flex items-center justify-between gap-6 px-6 md:px-12">
        <header
          className="flex w-fit items-center gap-4 px-5 py-2.5 backdrop-blur-md rounded-[40px] border border-black/[0.07] shadow-[0_4px_24px_rgba(0,0,0,0.07)] whitespace-nowrap"
          style={{ backgroundColor: 'rgba(255,255,255,0.94)' }}
        >
          <button
            type="button"
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); setCurrentPage(1); }}
            className="flex items-center gap-2"
          >
            <img src={logoImg} alt="Scrap Roe" className="w-6 h-6 object-contain" />
            <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#09090B] hidden sm:block" style={{ fontFamily: INTER }}>
              SCRAP ROE
            </span>
          </button>

          <div className="w-px h-4 bg-black/10" />

          <a
            href="https://flowroe.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold tracking-[0.08em] uppercase text-gray-400 hover:text-[#09090B] transition-colors"
            style={{ fontFamily: INTER }}
          >
            Flow Roe
          </a>

          {user ? (
            <button
              type="button"
              onClick={() => signOut()}
              className="flex items-center gap-1 text-gray-400 hover:text-[#09090B] transition-colors"
              title={user.email ?? ''}
            >
              <Lock className="w-3.5 h-3.5" />
              <LogOut className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setLoginModalOpen(true)}
              className="text-gray-400 hover:text-[#09090B] transition-colors"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </header>

        {isAdmin && (
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setModal({ open: true, initial: null })}
              className="px-4 py-2 rounded-full text-[11px] font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: ACCENT, fontFamily: INTER, boxShadow: '0 4px_14px rgba(255,102,196,0.3)' }}
            >
              + ADD
            </button>
            <button
              onClick={() => setIsCategoryEditMode(!isCategoryEditMode)}
              className="px-4 py-2 rounded-full text-[11px] font-bold border transition-all duration-200"
              style={{
                backgroundColor: isCategoryEditMode ? '#09090B' : '#fff',
                color: isCategoryEditMode ? '#fff' : '#555',
                borderColor: isCategoryEditMode ? '#09090B' : 'rgba(0,0,0,0.08)',
                fontFamily: INTER,
              }}
            >
              EDIT
            </button>
          </div>
        )}
      </div>

      {/* ── Hero ── */}
      <section ref={heroRef} onMouseMove={handleHeroMouseMove} className="relative flex flex-col items-center justify-center text-center px-6 pt-12 pb-6">

        {/* Blob - 좌측 */}
        <div className="absolute left-[-5%] top-[3%] pointer-events-none z-10 hidden lg:block" style={{ marginTop: '-60px', marginLeft: '-20px' }}>
          <motion.div initial={{ scale: 1.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}>
            <motion.div animate={{ y: [0, -16, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}>
              <motion.div style={{ x: blobX, y: blobScrollY, scale: objScale, opacity: objOpacity, rotateZ: rotateLeft }}>
                <img src={objBlob} alt="" className="w-[342px] h-auto md:w-[420px]" style={{ filter: 'drop-shadow(0 9px 14px rgba(15,23,42,0.12))' }} draggable={false} />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Diamond - 우측 상단 */}
        <div className="absolute right-[-10%] top-[-31%] pointer-events-none z-10 hidden sm:block overflow-hidden" style={{ marginRight: '55px' }}>
          <motion.div initial={{ scale: 1.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.4, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}>
            <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}>
              <motion.div style={{ x: diamondX, y: diamondScrollY, scale: objScale, opacity: objOpacity, rotateZ: rotateRight }}>
                <img src={objDiamond} alt="" className="w-[268px] h-auto md:w-[340px] lg:w-[389px]" style={{ filter: 'drop-shadow(0 10px 15px rgba(88,28,135,0.14))' }} draggable={false} />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Torus - 우측 하단 */}
        <div className="absolute right-[-11%] bottom-[-8%] pointer-events-none z-50 hidden sm:block" style={{ marginRight: '-30px' }}>
          <motion.div initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.4, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}>
            <motion.div animate={{ y: [0, 14, 0], rotate: [0, 4, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}>
              <motion.div style={{ x: torusX, y: torusScrollY, rotateZ: rotateLeft, scale: objScale, opacity: objOpacity }}>
                <img src={objTorus} alt="" className="w-[247px] h-auto md:w-[302px] lg:w-[358px]" style={{ filter: 'drop-shadow(0 11px 16px rgba(30,41,59,0.14))' }} draggable={false} />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
        <p className="text-[11px] font-semibold tracking-[0.45em] uppercase text-gray-400 mb-5" style={{ fontFamily: INTER }}>
          Reference &amp; Inspiration Archive
        </p>

        <h1
          className="leading-[0.9] tracking-[-0.05em] text-[#09090B] whitespace-nowrap"
          style={{ fontSize: 'clamp(3rem, 9vw, 7.8rem)', fontFamily: INTER, fontWeight: 600 }}
        >
          SCRAP ROE<span style={{ color: ACCENT }}>.</span>
        </h1>

        <p className="mt-5 text-sm text-gray-400" style={{ fontFamily: INTER }}>
          레퍼런스·영감·스크랩 아카이브
        </p>

        {/* 검색창 */}
        <div className="mt-8 w-full max-w-[560px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-[45px] rounded-full border border-black/[0.08] bg-white/95 pl-12 pr-10 text-base shadow-[0_8px_30px_rgba(0,0,0,0.06)] outline-none focus:ring-2 focus:ring-pink-100 focus:border-[#FF66C4] placeholder-gray-400 transition-all"
              style={{ fontFamily: INTER }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── 카테고리 버튼 (FlowRoe 스타일) ── */}
        <div className="mt-8 w-full max-w-[900px]">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 pb-1 justify-center flex-wrap">

              {/* ALL */}
              <button
                onClick={() => setSelectedCategory('All')}
                onMouseEnter={() => setHoveredCategory('All')}
                onMouseLeave={() => setHoveredCategory(null)}
                className="relative flex shrink-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-all duration-200"
                style={{ fontFamily: INTER }}
              >
                <div
                  className="flex h-[40px] w-[40px] items-center justify-center rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: selectedCategory === 'All' ? ACCENT : '#09090B',
                    boxShadow: (hoveredCategory === 'All' || selectedCategory === 'All') ? `0 0 0 4px ${ACCENT}30` : 'none',
                    border: hoveredCategory === 'All' && selectedCategory !== 'All' ? `2px solid ${ACCENT}` : 'none',
                    transform: hoveredCategory === 'All' ? 'scale(1.08)' : 'scale(1)',
                  }}
                >
                  <span style={{ color: '#fff', fontSize: '15px' }}>⦿</span>
                </div>
                <span
                  className="text-[11px] font-semibold tracking-wide whitespace-nowrap transition-colors"
                  style={{
                    color: selectedCategory === 'All' || hoveredCategory === 'All' ? ACCENT : 'rgba(9,9,11,0.45)',
                    fontWeight: selectedCategory === 'All' || hoveredCategory === 'All' ? 700 : 500,
                  }}
                >
                  ALL
                </span>
              </button>

              {/* 동적 카테고리 */}
              {categories.map(cat => {
                const isActive = selectedCategory === cat;
                const isHovered = hoveredCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => isCategoryEditMode ? handleEditCategory(cat) : setSelectedCategory(cat)}
                    onMouseEnter={() => setHoveredCategory(cat)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className="relative flex shrink-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-all duration-200"
                    style={{ fontFamily: INTER }}
                  >
                    <div
                      className="flex h-[40px] w-[40px] items-center justify-center rounded-full transition-all duration-200"
                      style={{
                        backgroundColor: isActive ? ACCENT : '#09090B',
                        boxShadow: (isHovered || isActive) ? `0 0 0 4px ${ACCENT}30` : 'none',
                        border: isHovered && !isActive ? `2px solid ${ACCENT}` : 'none',
                        transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                      }}
                    >
                      <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>
                        {cat.slice(0, 1).toUpperCase()}
                      </span>
                    </div>
                    <span
                      className="text-[11px] font-semibold tracking-wide whitespace-nowrap transition-colors"
                      style={{
                        color: isActive || isHovered ? ACCENT : 'rgba(9,9,11,0.45)',
                        fontWeight: isActive || isHovered ? 700 : 500,
                      }}
                    >
                      {cat.toUpperCase()}
                    </span>
                    {isCategoryEditMode && (
                      <span
                        onClick={e => handleDeleteCategory(e, cat)}
                        className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-red-500 text-white rounded-full text-[9px] hover:bg-red-700 cursor-pointer z-10"
                      >
                        ✕
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Edit 모드 추가 버튼 */}
              {isCategoryEditMode && (
                <button
                  onClick={handleAddCategory}
                  className="flex shrink-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-all duration-200"
                  style={{ fontFamily: INTER }}
                >
                  <div
                    className="flex h-[40px] w-[40px] items-center justify-center rounded-full border-2 border-dashed transition-all duration-200"
                    style={{ borderColor: ACCENT, color: ACCENT }}
                  >
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-wide" style={{ color: ACCENT }}>ADD</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 콘텐츠 ── */}
      <main className="relative z-10 max-w-[1920px] mx-auto px-4 sm:px-8 pb-10">

        {/* 뷰 모드 토글 + 결과 수 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-gray-400" style={{ fontFamily: INTER }}>
              {selectedCategory === 'All' ? 'All Scraps' : selectedCategory}
            </p>
            <p className="mt-1 text-sm text-gray-400" style={{ fontFamily: INTER }}>
              {filteredVideos.length}개의 스크랩
            </p>
          </div>
          <div className="flex border border-black/[0.07] rounded-full p-1 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <button
              onClick={() => { setViewMode('large'); setCurrentPage(1); }}
              className="px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200"
              style={{
                backgroundColor: viewMode === 'large' ? ACCENT : 'transparent',
                color: viewMode === 'large' ? '#fff' : 'rgba(9,9,11,0.4)',
                fontFamily: INTER,
              }}
            >
              ▣ 크게
            </button>
            <button
              onClick={() => { setViewMode('small'); setCurrentPage(1); }}
              className="px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200"
              style={{
                backgroundColor: viewMode === 'small' ? ACCENT : 'transparent',
                color: viewMode === 'small' ? '#fff' : 'rgba(9,9,11,0.4)',
                fontFamily: INTER,
              }}
            >
              ⦿ 작게
            </button>
          </div>
        </div>

        <Masonry breakpointCols={currentBreakpoints} className="masonry-grid" columnClassName="masonry-grid_column">
          {currentVideos.map(video => (
            <VideoCard
              key={video.id}
              {...video}
              id={video.id}
              thumbnailUrl={video.thumbnail_url}
              postUrl={video.url}
              viewMode={viewMode}
              isAdmin={isAdmin}
              onEdit={() => setModal({ open: true, initial: video })}
              onDelete={async () => {
                if (confirm('삭제하시겠습니까?')) {
                  await supabase.from('videos').delete().eq('id', video.id);
                  fetchVideos();
                }
              }}
              onTagClick={setSearchQuery}
            />
          ))}
        </Masonry>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12 pb-12">
            <button
              onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-black/[0.08] rounded-full text-sm font-medium disabled:opacity-30 hover:bg-gray-50 transition-all"
              style={{ fontFamily: INTER }}
            >
              &lt;&lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="w-10 h-10 flex justify-center items-center border rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: currentPage === pageNum ? ACCENT : '#fff',
                  borderColor: currentPage === pageNum ? ACCENT : 'rgba(0,0,0,0.08)',
                  color: currentPage === pageNum ? '#fff' : '#555',
                  fontFamily: INTER,
                }}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-black/[0.08] rounded-full text-sm font-medium disabled:opacity-30 hover:bg-gray-50 transition-all"
              style={{ fontFamily: INTER }}
            >
              &gt;&gt;
            </button>
          </div>
        )}
      </main>

      <footer className="relative z-10 px-6 py-5 text-center md:px-12">
        <p className="text-[11px] tracking-[0.16em] text-gray-400 uppercase" style={{ fontFamily: INTER }}>
          Copyright 2026{' '}
          <a href="mailto:onroeway@gmail.com" className="transition-colors hover:text-[#09090B]">ONROE</a>
          . All rights reserved.
        </p>
      </footer>

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
          if (error) alert(error.message);
          else { fetchVideos(); setModal({ open: false, initial: null }); }
        }}
      />
    </div>
  );
}

export default App;
