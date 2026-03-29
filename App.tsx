import React, { useState, useEffect, useRef } from 'react';
import { LayoutGrid, Plus, Globe, Image as ImageIcon, Box, Crown, Settings, Shield, Search, Save, Radio, AlertTriangle, X } from 'lucide-react';
import AddObjectForm from './components/AddObjectForm';
import ChatBot from './components/ChatBot';
import MapExplorer from './components/MapExplorer';
import ObjectDetailModal from './components/ObjectDetailModal';
import SettingsModal from './components/SettingsModal';
import ThreatLevels from './components/ThreatLevels';
import SearchTab from './components/SearchTab';
import DisasterFeed from './components/DisasterFeed'; // Import DisasterFeed
import { CatalogObject, NotificationPreferences, DisasterEvent, DisasterAlertPreference } from './types';
import { fetchGlobalDisasters } from './services/geminiService';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: false,
      isAnonymous: true,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Don't throw to avoid crashing the app, just log it.
}

function App() {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState<'catalog' | 'add' | 'chat' | 'maps' | 'threats' | 'search' | 'news'>('catalog');
  const [catalog, setCatalog] = useState<CatalogObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<CatalogObject | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Admin Mode State
  const [isAdmin, setIsAdmin] = useState(false);
  
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

  // Disaster Alert Preferences State
  const [disasterAlertPrefs, setDisasterAlertPrefs] = useState<DisasterAlertPreference>(() => {
    const saved = localStorage.getItem('arcanum_disaster_prefs');
    return saved ? JSON.parse(saved) : {
      enabled: true, // Enable by default for better discovery
      watchedTypes: [],
      watchedLocations: [],
      minSeverity: 'high'
    };
  });

  // Disaster Events State (Global)
  const [disasterEvents, setDisasterEvents] = useState<DisasterEvent[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<DisasterEvent[]>([]);

  // Save prefs whenever they change
  useEffect(() => {
    localStorage.setItem('arcanum_watch_prefs', JSON.stringify(notificationPrefs));
  }, [notificationPrefs]);

  useEffect(() => {
    localStorage.setItem('arcanum_disaster_prefs', JSON.stringify(disasterAlertPrefs));
  }, [disasterAlertPrefs]);
  
  // Modal Animation State
  const [modalOrigin, setModalOrigin] = useState<{x: number, y: number} | null>(null);
  
  // Infinite Scroll State
  const [visibleItems, setVisibleItems] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Catalog Search State
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');

  // Filtered Catalog
  const filteredCatalog = React.useMemo(() => {
    if (!catalogSearchQuery.trim()) return catalog;
    const query = catalogSearchQuery.toLowerCase();
    return catalog.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query) ||
      item.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [catalog, catalogSearchQuery]);

  // Firebase Realtime Sync
  useEffect(() => {
    const q = query(collection(db, 'catalog'), orderBy('dateAdded', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: CatalogObject[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as CatalogObject);
      });
      setCatalog(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'catalog');
    });

    return () => unsubscribe();
  }, []);

  // Global Disaster Fetching Logic
  const recentHeadlinesRef = useRef<string[]>([]);

  const loadDisasters = async (append = false) => {
    console.log("Iniciando busca de desastres globais...");
    try {
      // Reduce initial load to 3 to prevent JSON truncation
      const count = append ? 1 : 3;
      // Pass recent headlines to avoid repetition
      const data = await fetchGlobalDisasters(count, recentHeadlinesRef.current);
      
      console.log(`Recebidos ${data?.length || 0} eventos.`);
      
      if (!data || data.length === 0) {
         console.warn("Nenhum evento recebido da IA.");
         return;
      }

      // Strict De-duplication Logic
      const uniqueNewEvents = data.filter((item: any) => {
        const isDuplicateInRef = recentHeadlinesRef.current.some(h => h.toLowerCase() === item.description.toLowerCase());
        const isDuplicateInState = disasterEvents.some(e => e.description.toLowerCase() === item.description.toLowerCase());
        return !isDuplicateInRef && !isDuplicateInState;
      });

      if (uniqueNewEvents.length === 0) {
        console.log("Todos os eventos recebidos eram duplicatas. Ignorando atualização.");
        return;
      }

      const newEvents = uniqueNewEvents.map((item: any) => ({
        ...item,
        id: Date.now().toString() + Math.random().toString().slice(2)
      }));

      setDisasterEvents(prev => {
        // Keep max 50 events
        const updated = append ? [...newEvents, ...prev] : newEvents;
        
        // Update ref with new headlines
        const newHeadlines = newEvents.map((e: any) => e.description);
        recentHeadlinesRef.current = [...newHeadlines, ...recentHeadlinesRef.current].slice(0, 50); // Increased history to 50
        
        return updated.slice(0, 50);
      });

      // Check for alerts
      if (disasterAlertPrefs.enabled && newEvents.length > 0) {
        const matchedEvents = newEvents.filter((event: DisasterEvent) => {
          // Severity check logic
          const severityLevels = ['low', 'medium', 'high', 'critical'];
          const eventSeverityIndex = severityLevels.indexOf(event.severity);
          const minSeverityIndex = severityLevels.indexOf(disasterAlertPrefs.minSeverity);
          if (eventSeverityIndex < minSeverityIndex) return false;

          // Type check
          const typeMatch = disasterAlertPrefs.watchedTypes.length === 0 || 
            disasterAlertPrefs.watchedTypes.some(t => event.type.toLowerCase().includes(t.toLowerCase()));
          
          // Location check
          const locMatch = disasterAlertPrefs.watchedLocations.length === 0 || 
            disasterAlertPrefs.watchedLocations.some(l => event.location.toLowerCase().includes(l.toLowerCase()));

          return typeMatch && locMatch;
        });

        if (matchedEvents.length > 0) {
          setActiveAlerts(prev => {
            const newAlerts = [...matchedEvents, ...prev];
            return newAlerts.slice(0, 3); // Limit to 3 active alerts
          });
          // Play alert sound
          try {
             const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/alien_shoot.mp3');
             audio.volume = 0.3;
             audio.play().catch(() => {});
          } catch (e) {}
        }
      }

    } catch (error) {
      console.error("Erro ao carregar feed global", error);
    }
  };

  useEffect(() => {
    // Initial load
    if (disasterEvents.length === 0) {
      loadDisasters();
    }

    // Interval for updates (every 60 seconds)
    const interval = setInterval(() => {
      loadDisasters(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [disasterAlertPrefs]); // Re-run if prefs change to ensure logic uses latest prefs (though mainly for the interval setup, logic inside uses current state if referenced correctly or re-instantiated)

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

  const toggleTheme = () => setIsDark(!isDark);

  const handleSaveSystem = () => {
    // Simula salvamento persistente
    window.alert("Estado do Sistema salvo com sucesso.");
  };

  const handleSaveObject = async (obj: CatalogObject) => {
    try {
      await setDoc(doc(db, 'catalog', obj.id), obj);
      
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
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'catalog');
      window.alert("Erro ao salvar o registro no banco de dados.");
    }
  };

  const handleDeleteObject = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'catalog', id));
      setSelectedObject(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'catalog');
      window.alert("Erro ao excluir o registro.");
    }
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
    if (activeTab !== 'catalog') return;

    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    
    // Trigger load when within 100px of bottom
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      if (visibleItems < filteredCatalog.length && !isLoadingMore) {
        setIsLoadingMore(true);
        
        // Simulate network delay for smoother UX and to prevent rapid-fire updates
        setTimeout(() => {
          setVisibleItems(prev => prev + 12);
          setIsLoadingMore(false);
        }, 500);
      }
    }
  };

  return (
    <div className="min-h-screen bg-off-white dark:bg-void transition-colors duration-300 font-sans flex flex-col overflow-hidden text-gray-900 dark:text-gray-100 relative">

      {/* Global Alert Banner - Enhanced */}
      {activeAlerts.length > 0 && (
        <div className="fixed top-[57px] left-0 w-full z-40 animate-in slide-in-from-top-2 duration-300 pointer-events-auto">
          <div className="bg-red-600/95 backdrop-blur-md text-white px-4 py-2 shadow-lg flex justify-between items-center border-b border-red-500">
            <div className="flex items-center gap-3 overflow-hidden">
               <div className="bg-white text-red-600 p-1 rounded-sm animate-pulse shrink-0">
                 <AlertTriangle size={16} />
               </div>
               <div 
                 className="flex flex-col min-w-0 cursor-pointer group"
                 onClick={() => setActiveTab('news')}
               >
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-90 group-hover:text-red-200 transition-colors">
                   {activeAlerts.length} Ameaça(s) Detectada(s)
                 </span>
                 <span className="text-sm font-bold truncate leading-tight group-hover:underline">
                   {activeAlerts[0].description} <span className="opacity-80 font-normal text-xs"> — {activeAlerts[0].location}</span>
                 </span>
               </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0 ml-2">
               {activeAlerts.length > 1 && (
                 <div className="flex gap-1">
                    {activeAlerts.slice(1, 4).map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/50" />
                    ))}
                 </div>
               )}
               <button 
                 onClick={() => setActiveAlerts([])}
                 className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                 title="Dispensar Todos"
               >
                 <X size={16} />
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar - Red/White Theme */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 dark:bg-void/95 backdrop-blur-md border-b border-gray-200 dark:border-red-900/50 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-arcane-red rounded flex items-center justify-center shadow-lg shadow-red-600/20">
            <Box className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-black text-arcane-red tracking-widest uppercase flex items-center gap-3">
            ARCANUM OBSCURUM
            {/* Botão de Salvar apenas para Admin no Header */}
            {isAdmin && (
              <button 
                onClick={handleSaveSystem}
                className="bg-green-600 hover:bg-green-700 text-white p-1.5 rounded shadow-lg transition-transform active:scale-95"
                title="Salvar Estado do Sistema"
              >
                <Save size={16} />
              </button>
            )}
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
            
            <div className="flex justify-between items-end border-b-2 border-arcane-red/20 pb-4 mb-6">
              <div>
                <h2 className="text-4xl font-black dark:text-white uppercase tracking-tighter">Acervo Global</h2>
                <p className="text-arcane-red font-medium">Itens contidos: {filteredCatalog.length}</p>
              </div>
              
              {/* Botão Novo Registro: Exibido APENAS se for Admin */}
              {isAdmin && (
                <button
                    onClick={() => setActiveTab('add')}
                    className="bg-arcane-red hover:bg-red-700 text-white px-5 py-2.5 rounded font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all uppercase text-sm tracking-wider"
                >
                    <Plus size={18} /> Novo Registro
                </button>
              )}
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative">
              <input
                type="text"
                placeholder="Buscar no acervo por nome, descrição ou tag..."
                value={catalogSearchQuery}
                onChange={(e) => {
                  setCatalogSearchQuery(e.target.value);
                  setVisibleItems(12); // Reset infinite scroll on search
                }}
                className="w-full bg-white dark:bg-black/40 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 pl-10 text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:border-arcane-red dark:focus:border-arcane-red transition-colors"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              {catalogSearchQuery && (
                <button 
                  onClick={() => {
                    setCatalogSearchQuery('');
                    setVisibleItems(12);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {filteredCatalog.length === 0 ? (
              <div className="text-center py-20 opacity-50 border-2 border-dashed border-gray-300 dark:border-red-900/30 rounded-xl">
                <Box size={64} className="mx-auto text-gray-400 dark:text-red-900 mb-4" />
                <p className="text-xl dark:text-gray-300 font-bold">
                  {catalog.length === 0 ? "O Vazio predomina." : "Nenhum registro encontrado."}
                </p>
                <p className="text-sm dark:text-gray-500">
                  {catalog.length === 0 ? "Inicie o protocolo de catalogação." : "Tente buscar por outros termos."}
                </p>
              </div>
            ) : (
              // Changed grid to grid-cols-2 for mobile and up to grid-cols-4 for large screens
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pb-10">
                {filteredCatalog.slice(0, visibleItems).map((item, index) => (
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
            {isLoadingMore && (
               <div className="py-4 text-center text-arcane-red font-bold text-sm animate-pulse">
                 Carregando arquivos adicionais...
               </div>
            )}
          </div>
        )}

        {activeTab === 'add' && isAdmin && (
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

        {activeTab === 'news' && (
          <div className="max-w-4xl mx-auto w-full h-full">
            <DisasterFeed 
              events={disasterEvents} 
              prefs={disasterAlertPrefs} 
              onUpdatePrefs={setDisasterAlertPrefs} 
              onRetry={() => loadDisasters(false)}
            />
          </div>
        )}

        {activeTab === 'threats' && (
          <div className="max-w-4xl mx-auto w-full h-full pb-10">
            {/* Passando o catálogo para o componente ThreatLevels */}
            <ThreatLevels catalog={catalog} isAdmin={isAdmin} />
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

      {/* Modal Integration */}
      <ObjectDetailModal 
        object={selectedObject} 
        isOpen={!!selectedObject} 
        onClose={() => setSelectedObject(null)}
        onDelete={handleDeleteObject}
        originCoords={modalOrigin}
        isAdmin={isAdmin}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDark={isDark}
        toggleTheme={toggleTheme}
        notificationPrefs={notificationPrefs}
        onUpdatePrefs={setNotificationPrefs}
        onAdminLogin={() => setIsAdmin(true)}
        isAdmin={isAdmin}
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
          
          {/* 3. News (Substituindo botão central anterior) */}
          <NavButton 
            active={activeTab === 'news'} 
            onClick={() => setActiveTab('news')} 
            icon={<Radio size={22} />} 
            label="SINAIS" 
            notification={activeAlerts.length > 0}
          />

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