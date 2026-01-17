import React, { useState, useEffect, useRef } from 'react';
import { LayoutGrid, Plus, Globe, Image as ImageIcon, Box, Crown, Settings, Shield, Search } from 'lucide-react';
import AddObjectForm from './components/AddObjectForm';
import ChatBot from './components/ChatBot';
import MapExplorer from './components/MapExplorer';
import ObjectDetailModal from './components/ObjectDetailModal';
import SettingsModal from './components/SettingsModal';
import StoriesFeed from './components/StoriesFeed';
import StoryViewer from './components/StoryViewer';
import ThreatLevels from './components/ThreatLevels';
import SearchTab from './components/SearchTab';
import { CatalogObject, Story, NotificationPreferences } from './types';

function App() {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState<'catalog' | 'add' | 'chat' | 'maps' | 'threats' | 'search'>('catalog');
  const [catalog, setCatalog] = useState<CatalogObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<CatalogObject | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Notification State using LocalStorage (Global App Badge)
  const [hasNotification, setHasNotification] = useState(() => {
    return localStorage.getItem('arcanum_has_notification') === 'true';
  });

  // Watchlist Preferences State
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(() => {
    const saved = localStorage.getItem('arcanum_watch_prefs');
    return saved ? JSON.parse(saved) : {
      enabled: false,
      watchedTags: [],
      watchedGrades: ['Classe Especial']
    };
  });

  // Save prefs whenever they change
  useEffect(() => {
    localStorage.setItem('arcanum_watch_prefs', JSON.stringify(notificationPrefs));
  }, [notificationPrefs]);
  
  // Modal Animation State
  const [modalOrigin, setModalOrigin] = useState<{x: number, y: number} | null>(null);

  // Stories State
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  
  // Infinite Scroll State
  const [visibleItems, setVisibleItems] = useState(12);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Clear notification when visiting catalog
  useEffect(() => {
    if (activeTab === 'catalog') {
      setHasNotification(false);
      localStorage.removeItem('arcanum_has_notification');
    }
  }, [activeTab]);

  // Derive stories from catalog (mock simulation for "Recent Updates")
  useEffect(() => {
    if (catalog.length > 0) {
      const newStories: Story[] = catalog
        .filter(item => item.imageUrl)
        .slice(0, 10)
        .map(item => ({
          id: item.id,
          title: item.title,
          imageUrl: item.imageUrl!,
          date: item.dateAdded,
          isSeen: false
        }));
      setStories(newStories);
    } else {
      setStories([]);
    }
  }, [catalog]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleSaveObject = (obj: CatalogObject) => {
    setCatalog(prev => [obj, ...prev]);
    // Trigger notification badge
    setHasNotification(true);
    localStorage.setItem('arcanum_has_notification', 'true');
    
    // Check Watchlist logic
    let alertMessage = "Registro arquivado com sucesso no Acervo.";
    
    if (notificationPrefs.enabled) {
      const tagMatch = obj.tags.some(tag => 
        notificationPrefs.watchedTags.some(watched => watched.toLowerCase() === tag.toLowerCase())
      );
      const gradeMatch = obj.threatGrade && notificationPrefs.watchedGrades.includes(obj.threatGrade);

      if (tagMatch || gradeMatch) {
        alertMessage = `⚠️ ALERTA DE VIGILÂNCIA ⚠️\n\nO objeto "${obj.title}" corresponde aos seus protocolos de monitoramento!\n` +
                       (gradeMatch ? `• Nível de Ameaça: ${obj.threatGrade}\n` : '') +
                       (tagMatch ? `• Tags Suspeitas Detectadas` : '');
        
        // Play a subtle sound or just rely on the alert
        try {
          const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/alien_shoot.mp3'); // Placeholder short beep
          audio.volume = 0.2;
          audio.play().catch(e => console.log('Audio play blocked', e));
        } catch (e) {}
      }
    }

    window.alert(alertMessage);
  };

  const handleDeleteObject = (id: string) => {
    setCatalog(prev => prev.filter(obj => obj.id !== id));
    setSelectedObject(null);
  };

  // Card Click Handler with Coordinate Capture
  const handleCardClick = (e: React.MouseEvent, item: CatalogObject) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Calculate center of the clicked card relative to viewport
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    setModalOrigin({ x, y });
    setSelectedObject(item);
  };

  // Infinite Scroll Handler
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      if (visibleItems < catalog.length) {
        setVisibleItems(prev => prev + 12);
      }
    }
  };

  return (
    <div className="min-h-screen bg-off-white dark:bg-void transition-colors duration-300 font-sans flex flex-col overflow-hidden text-gray-900 dark:text-gray-100">
      {/* Navbar - Red/White Theme */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 dark:bg-void/95 backdrop-blur-md border-b border-gray-200 dark:border-red-900/50 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-arcane-red rounded flex items-center justify-center shadow-lg shadow-red-600/20">
            <Box className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-black text-arcane-red tracking-widest uppercase">
            ARCANUM OBSCURUM
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
            title="Configurações"
          >
            <Settings size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content Area - Scrollable Container */}
      <main 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 pt-20 pb-28 px-4 overflow-y-auto w-full max-w-7xl mx-auto scrollbar-thin scrollbar-thumb-arcane-red scrollbar-track-transparent"
      >
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            
            {/* Stories Feed */}
            {stories.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-500 dark:text-red-400 mb-2 px-1 uppercase tracking-wide">Descobertas Recentes</h3>
                <StoriesFeed 
                  stories={stories} 
                  onStoryClick={(idx) => setActiveStoryIndex(idx)}
                  onAddStory={() => setActiveTab('add')}
                />
              </div>
            )}

            <div className="flex justify-between items-end border-b-2 border-arcane-red/20 pb-4 mb-6">
              <div>
                <h2 className="text-4xl font-black dark:text-white uppercase tracking-tighter">Acervo Global</h2>
                <p className="text-arcane-red font-medium">Itens contidos: {catalog.length}</p>
              </div>
              <button
                onClick={() => setActiveTab('add')}
                className="bg-arcane-red hover:bg-red-700 text-white px-5 py-2.5 rounded font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all uppercase text-sm tracking-wider"
              >
                <Plus size={18} /> Novo Registro
              </button>
            </div>

            {catalog.length === 0 ? (
              <div className="text-center py-20 opacity-50 border-2 border-dashed border-gray-300 dark:border-red-900/30 rounded-xl">
                <Box size={64} className="mx-auto text-gray-400 dark:text-red-900 mb-4" />
                <p className="text-xl dark:text-gray-300 font-bold">O Vazio predomina.</p>
                <p className="text-sm dark:text-gray-500">Inicie o protocolo de catalogação.</p>
              </div>
            ) : (
              // Changed grid to grid-cols-2 for mobile and up to grid-cols-4 for large screens
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pb-10">
                {catalog.slice(0, visibleItems).map((item) => (
                  <div 
                    key={item.id} 
                    onClick={(e) => handleCardClick(e, item)}
                    className="bg-white dark:bg-void-light rounded overflow-hidden shadow-lg border border-gray-200 dark:border-red-900/40 hover:border-arcane-red dark:hover:border-arcane-red transition-all group cursor-pointer hover:shadow-xl hover:shadow-red-900/20 flex flex-col h-full transform hover:-translate-y-1 duration-200"
                  >
                    {/* Increased height for prominent image */}
                    <div className="h-48 md:h-64 overflow-hidden bg-gray-200 dark:bg-black relative">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <ImageIcon size={32} className="md:w-10 md:h-10 opacity-30" />
                        </div>
                      )}
                      
                      {/* Bearer Indicators (Discreet) */}
                      {item.bearer && (
                        <div 
                          className={`absolute top-2 left-2 p-1.5 rounded-full backdrop-blur-md shadow-sm border border-white/10 ${
                            item.bearer.rank === 'Concept' 
                              ? 'bg-black text-red-500 border border-red-500' 
                              : 'bg-white text-blue-900'
                          }`}
                          title={item.bearer.rank === 'Concept' ? 'Portador de Conceito' : 'Portador de Objeto'}
                        >
                          {item.bearer.rank === 'Concept' ? <Crown size={12} fill="currentColor" /> : <Shield size={12} fill="currentColor" />}
                        </div>
                      )}

                      <div className="absolute top-2 right-2">
                         <span className="bg-arcane-red text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase">
                           {new Date(item.dateAdded).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
                         </span>
                      </div>
                    </div>
                    
                    <div className="p-4 flex flex-col flex-1">
                      {/* Prominent Title with Icon */}
                      <h3 className="text-lg md:text-xl font-black dark:text-white mb-1 leading-tight line-clamp-2 uppercase flex items-center gap-1.5">
                        <span className="truncate">{item.title}</span>
                        {item.bearer && (
                          <span 
                            title={item.bearer.rank === 'Concept' ? 'Portador de Conceito' : 'Portador de Objeto'}
                            className="inline-flex items-center flex-shrink-0"
                          >
                             {item.bearer.rank === 'Concept' 
                               ? <Crown size={16} className="text-red-600 dark:text-red-500 fill-current" /> 
                               : <Shield size={16} className="text-blue-600 dark:text-blue-500 fill-current" />}
                          </span>
                        )}
                      </h3>
                      
                      {/* Bearer Subtitle & Type Indicator */}
                      {item.bearer && (
                        <div className="flex items-center gap-2 mb-3">
                           <p className={`text-xs font-bold uppercase tracking-wider ${item.bearer.rank === 'Concept' ? 'text-red-600' : 'text-blue-600'}`}>
                             {item.bearer.name}
                           </p>
                           <span className={`text-[8px] px-1.5 py-0.5 rounded border font-black ${
                             item.bearer.rank === 'Concept' 
                               ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800' 
                               : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800'
                           }`}>
                             {item.bearer.rank === 'Concept' ? 'CONCEITO' : 'OBJETO'}
                           </span>
                        </div>
                      )}

                      {/* Reduced Description Size/Color */}
                      <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-2 mb-4 flex-1 font-medium border-l-2 border-arcane-red/30 pl-2">
                        {item.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {item.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-black text-gray-800 dark:text-gray-300 text-[10px] font-bold uppercase rounded-sm border border-gray-200 dark:border-gray-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Loading Indicator for Infinite Scroll */}
            {visibleItems < catalog.length && (
               <div className="py-4 text-center text-arcane-red font-bold text-sm animate-pulse">
                 Carregando arquivos adicionais...
               </div>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="max-w-2xl mx-auto w-full">
            {/* Key forces component reset on save */}
            <AddObjectForm key={catalog.length} onSave={handleSaveObject} onCancel={() => setActiveTab('catalog')} />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto w-full h-full">
            <ChatBot />
          </div>
        )}

        {activeTab === 'maps' && (
          <div className="max-w-6xl mx-auto w-full h-[80vh]">
            <MapExplorer catalog={catalog} onObjectSelect={(obj) => {
              setSelectedObject(obj);
              setModalOrigin(null); // Reset origin for map clicks
            }} />
          </div>
        )}

        {activeTab === 'threats' && (
          <div className="max-w-4xl mx-auto w-full h-full pb-10">
            {/* Passando o catálogo para o componente ThreatLevels */}
            <ThreatLevels catalog={catalog} />
          </div>
        )}

        {activeTab === 'search' && (
          <div className="max-w-4xl mx-auto w-full h-full pb-10">
            <SearchTab 
              catalog={catalog} 
              onObjectSelect={(obj) => {
                setSelectedObject(obj);
                setModalOrigin(null);
              }}
            />
          </div>
        )}
      </main>

      {/* Story Viewer Overlay */}
      {activeStoryIndex !== null && (
        <StoryViewer 
          stories={stories}
          initialStoryIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
        />
      )}

      {/* Modal Integration */}
      <ObjectDetailModal 
        object={selectedObject} 
        isOpen={!!selectedObject} 
        onClose={() => setSelectedObject(null)}
        onDelete={handleDeleteObject}
        originCoords={modalOrigin}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDark={isDark}
        toggleTheme={toggleTheme}
        notificationPrefs={notificationPrefs}
        onUpdatePrefs={setNotificationPrefs}
      />

      {/* Bottom Tab Bar (Red/White Theme) */}
      <div className="fixed bottom-0 w-full bg-white dark:bg-void border-t-4 border-arcane-red py-2 px-2 z-50 shadow-[0_-5px_15px_rgba(220,38,38,0.1)]">
        <div className="grid grid-cols-5 items-end max-w-lg mx-auto md:max-w-2xl">
          {/* 1. Acervo */}
          <NavButton 
            active={activeTab === 'catalog'} 
            onClick={() => setActiveTab('catalog')} 
            icon={<LayoutGrid size={22} />} 
            label="ACERVO" 
            notification={hasNotification}
          />
          
          {/* 2. Global */}
          <NavButton 
            active={activeTab === 'maps'} 
            onClick={() => setActiveTab('maps')} 
            icon={<Globe size={22} />} 
            label="GLOBAL" 
          />
          
          {/* 3. Center ADD Button */}
          <div className="flex justify-center relative -top-6">
             <button 
               onClick={() => setActiveTab('add')}
               className={`bg-arcane-red text-white w-14 h-14 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/40 hover:scale-105 transition-transform rotate-45 border-4 border-white dark:border-void ${activeTab === 'add' ? 'ring-2 ring-red-400' : ''}`}
             >
               <Plus size={28} className="-rotate-45" />
             </button>
          </div>

          {/* 4. Buscas */}
          <NavButton 
            active={activeTab === 'search'} 
            onClick={() => setActiveTab('search')} 
            icon={<Search size={22} />} 
            label="BUSCAS" 
          />

          {/* 5. Ameaças */}
          <NavButton 
            active={activeTab === 'threats'} 
            onClick={() => setActiveTab('threats')} 
            icon={<Shield size={22} />} 
            label="AMEAÇAS" 
          />
        </div>
      </div>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label, notification }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, notification?: boolean }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-end gap-1 transition-colors h-12 pb-1 relative ${
      active ? 'text-arcane-red font-bold' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
    }`}
  >
    <div className="relative">
      {icon}
      {notification && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-arcane-red rounded-full border-2 border-white dark:border-void animate-pulse" />
      )}
    </div>
    <span className="text-[9px] font-black tracking-widest leading-none">{label}</span>
  </button>
);

export default App;