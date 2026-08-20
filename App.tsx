import React, { useState, useEffect, useRef } from 'react';
import { LayoutGrid, Plus, Globe, Image as ImageIcon, Box, Crown, Settings, Shield, Search, Save, Radio, AlertTriangle, X, BookOpen, Download } from 'lucide-react';
import AddObjectForm from './components/AddObjectForm';
import ChatBot from './components/ChatBot';
import MapExplorer from './components/MapExplorer';
import ObjectDetailModal from './components/ObjectDetailModal';
import SettingsModal from './components/SettingsModal';
import ThreatLevels from './components/ThreatLevels';
import SearchTab from './components/SearchTab';
import DisasterFeed from './components/DisasterFeed'; // Import DisasterFeed
import ArcaneBookIcon from './components/ArcaneBookIcon';
import { CatalogObject, NotificationPreferences, DisasterEvent, DisasterAlertPreference, InfectionNewsItem, BackgroundPreferences } from './types';
import { fetchGlobalDisasters, fetchRealInfectionNews } from './services/geminiService';
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

  // Real-world Infection & Study News State
  const [infectionItems, setInfectionItems] = useState<InfectionNewsItem[]>([]);
  const [isLoadingInfections, setIsLoadingInfections] = useState<boolean>(false);
  const recentInfectionHeadlinesRef = useRef<string[]>([]);

  // Background Customization State (Removable / Configurable)
  const [bgPrefs, setBgPrefs] = useState<BackgroundPreferences>(() => {
    const saved = localStorage.getItem('arcanum_bg_prefs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If it had the old low opacity default (<= 60), bump it to 85 for better visibility
        if (parsed.opacity && parsed.opacity <= 60) {
          parsed.opacity = 85;
        }
        return parsed;
      } catch (e) {
        console.error("Error parsing bg prefs", e);
      }
    }
    return {
      enabled: true,
      opacity: 85,
      blur: 0,
      customUrl: '/arcanum_bg.jpg',
      dimOverlay: true,
      position: 'center'
    };
  });

  // Save bgPrefs whenever they change
  useEffect(() => {
    localStorage.setItem('arcanum_bg_prefs', JSON.stringify(bgPrefs));
  }, [bgPrefs]);

  // Save prefs whenever they change
  useEffect(() => {
    localStorage.setItem('arcanum_watch_prefs', JSON.stringify(notificationPrefs));
  }, [notificationPrefs]);

  useEffect(() => {
    localStorage.setItem('arcanum_disaster_prefs', JSON.stringify(disasterAlertPrefs));
  }, [disasterAlertPrefs]);
  
  // Modal Animation State
  const [modalOrigin, setModalOrigin] = useState<{x: number, y: number} | null>(null);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsInstallable(false);
  };
  
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

  const [handledSharedObject, setHandledSharedObject] = useState(false);

  // Firebase Realtime Sync - Catalog
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

  // Firebase Realtime Sync - Signals / Disaster Feed (Persistent storage)
  useEffect(() => {
    const q = query(collection(db, 'signals'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: DisasterEvent[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as DisasterEvent);
      });
      setDisasterEvents(items);
      recentHeadlinesRef.current = items.map(i => i.description);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'signals');
    });

    return () => unsubscribe();
  }, []);

  // Firebase Realtime Sync - Real Infections & Studies Catalog (Persistent storage)
  useEffect(() => {
    const q = query(collection(db, 'real_infections'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: InfectionNewsItem[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as InfectionNewsItem);
      });
      setInfectionItems(items);
      recentInfectionHeadlinesRef.current = items.map(i => i.title);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'real_infections');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (catalog.length > 0 && !handledSharedObject) {
      const searchParams = new URLSearchParams(window.location.search);
      const objectId = searchParams.get('objectId');
      if (objectId) {
        const foundObject = catalog.find(obj => obj.id === objectId);
        if (foundObject) {
          setSelectedObject(foundObject);
          setHandledSharedObject(true);
          
          // Optionally clean the URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('objectId');
          newUrl.searchParams.delete('lat');
          newUrl.searchParams.delete('lng');
          window.history.replaceState({}, '', newUrl.toString());
        }
      } else {
        setHandledSharedObject(true);
      }
    }
  }, [catalog, handledSharedObject]);

  // Global Disaster Fetching Logic
  const recentHeadlinesRef = useRef<string[]>([]);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAlertExiting, setIsAlertExiting] = useState(false);

  const dismissAlerts = () => {
    setIsAlertExiting(true);
    setTimeout(() => {
      setActiveAlerts([]);
      setIsAlertExiting(false);
    }, 500);
  };

  const loadDisasters = async (append = false) => {
    console.log("Iniciando busca de desastres globais...");
    try {
      // Generate 1-2 new articles at a time
      const count = append ? 2 : 3;
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

      const now = Date.now();
      const newEvents: DisasterEvent[] = uniqueNewEvents.map((item: any, idx: number) => ({
        ...item,
        id: (now + idx).toString() + Math.random().toString().slice(2),
        createdAt: now - idx
      }));

      // Store permanently in Firestore
      for (const eventObj of newEvents) {
        try {
          await setDoc(doc(db, 'signals', eventObj.id), eventObj);
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, 'signals');
        }
      }

      // Check for alerts
      if (disasterAlertPrefs.enabled && newEvents.length > 0) {
        const matchedEvents = newEvents.filter((event: DisasterEvent) => {
          const severityLevels = ['low', 'medium', 'high', 'critical'];
          const eventSeverityIndex = severityLevels.indexOf(event.severity);
          const minSeverityIndex = severityLevels.indexOf(disasterAlertPrefs.minSeverity);
          if (eventSeverityIndex < minSeverityIndex) return false;

          const typeMatch = disasterAlertPrefs.watchedTypes.length === 0 || 
            disasterAlertPrefs.watchedTypes.some(t => event.type.toLowerCase().includes(t.toLowerCase()));
          
          const locMatch = disasterAlertPrefs.watchedLocations.length === 0 || 
            disasterAlertPrefs.watchedLocations.some(l => event.location.toLowerCase().includes(l.toLowerCase()));

          return typeMatch && locMatch;
        });

        if (matchedEvents.length > 0) {
          if (alertTimeoutRef.current) {
            clearTimeout(alertTimeoutRef.current);
          }

          setIsAlertExiting(false);
          setActiveAlerts(matchedEvents.slice(0, 3));

          // Sound effect
          try {
             const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/alien_shoot.mp3');
             audio.volume = 0.3;
             audio.play().catch(() => {});
          } catch (e) {}

          // Display timer logic: 5s default, 3s if vast generation count
          const displayDuration = (newEvents.length >= 2 || matchedEvents.length >= 3) ? 3000 : 5000;
          alertTimeoutRef.current = setTimeout(() => {
            dismissAlerts();
          }, displayDuration);
        }
      }

    } catch (error) {
      console.error("Erro ao carregar feed global", error);
    }
  };

  useEffect(() => {
    // Initial load if empty
    if (disasterEvents.length === 0) {
      loadDisasters();
    }

    // Increased frequency: every 25 seconds
    const interval = setInterval(() => {
      loadDisasters(true);
    }, 25000);

    return () => clearInterval(interval);
  }, [disasterAlertPrefs, disasterEvents.length]);

  // Admin signal actions
  const handleDeleteSignal = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'signals', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'signals');
    }
  };

  const handleUpdateSignal = async (signal: DisasterEvent) => {
    try {
      await setDoc(doc(db, 'signals', signal.id), signal);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'signals');
    }
  };

  const handleCreateSignal = async (signal: DisasterEvent) => {
    try {
      await setDoc(doc(db, 'signals', signal.id), signal);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'signals');
    }
  };

  // Real-world Infection & Study News Fetching Logic (Surface Web Searches via Gemini Grounding)
  const loadRealInfections = async () => {
    console.log("Iniciando varredura na Surface Web por notícias reais de infecções e estudos...");
    setIsLoadingInfections(true);
    try {
      const items = await fetchRealInfectionNews(recentInfectionHeadlinesRef.current);
      if (items && items.length > 0) {
        // Save fetched items to Firestore
        for (const item of items) {
          try {
            await setDoc(doc(db, 'real_infections', item.id), item);
          } catch (e) {
            handleFirestoreError(e, OperationType.CREATE, 'real_infections');
          }
        }
      }
    } catch (error) {
      console.error("Erro na busca de notícias reais de infecções:", error);
    } finally {
      setIsLoadingInfections(false);
    }
  };

  // 5-Minute Interval for generating / fetching real news while active on the site
  useEffect(() => {
    // Initial fetch if the catalog is empty
    if (infectionItems.length === 0) {
      loadRealInfections();
    }

    // 5 minutes interval = 300,000 milliseconds
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const interval = setInterval(() => {
      console.log("[5min Interval] Executando varredura periódica de notícias reais de infecções...");
      loadRealInfections();
    }, FIVE_MINUTES_MS);

    return () => clearInterval(interval);
  }, [infectionItems.length]);

  // Admin Infection News Actions
  const handleDeleteInfection = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'real_infections', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'real_infections');
    }
  };

  const handleSaveInfection = async (item: InfectionNewsItem) => {
    try {
      await setDoc(doc(db, 'real_infections', item.id), item);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'real_infections');
    }
  };

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
      
      {/* Imagem de Fundo Arcanum Obscurum (Com Controle de Remoção / Opacidade / Desfoque) */}
      {bgPrefs.enabled && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-opacity duration-500"
          style={{ opacity: bgPrefs.opacity / 100 }}
        >
          <img
            src={bgPrefs.customUrl || "/arcanum_bg.jpg"}
            alt="Fundo Arcanum Obscurum"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-left-top select-none transition-all duration-300"
            style={{
              filter: bgPrefs.blur > 0 ? `blur(${bgPrefs.blur}px)` : undefined,
            }}
          />
          {/* Camada de Vinheta e Contraste suave para garantir visibilidade da arte */}
          {bgPrefs.dimOverlay && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 dark:from-void/40 dark:via-transparent dark:to-void/25 pointer-events-none" />
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pageTurnFirst {
          0% {
            transform: rotateY(0deg);
            opacity: 0.95;
            stroke: #ef4444;
          }
          50% {
            transform: rotateY(-90deg) scaleX(0.7);
            opacity: 0.8;
            stroke: #f59e0b;
          }
          100% {
            transform: rotateY(-180deg);
            opacity: 0;
            stroke: #dc2626;
          }
        }

        @keyframes pageTurnSecond {
          0% {
            transform: rotateY(0deg);
            opacity: 0;
            stroke: #ef4444;
          }
          30% {
            transform: rotateY(-30deg);
            opacity: 0.9;
            stroke: #f59e0b;
          }
          80% {
            transform: rotateY(-140deg);
            opacity: 0.5;
            stroke: #dc2626;
          }
          100% {
            transform: rotateY(-180deg);
            opacity: 0;
          }
        }

        .animate-pageTurnFirst {
          animation: pageTurnFirst 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .animate-pageTurnSecond {
          animation: pageTurnSecond 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.4s infinite;
        }

        @keyframes bookAuraPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 10px rgba(220, 38, 38, 0.4);
          }
          50% {
            transform: scale(1.12);
            box-shadow: 0 0 24px rgba(239, 68, 68, 0.9), 0 0 8px rgba(245, 158, 11, 0.6);
          }
        }

        @keyframes notificationFluidEnter {
          0% {
            opacity: 0;
            transform: translateY(-120%) scale(0.96);
            filter: blur(8px);
          }
          60% {
            opacity: 1;
            transform: translateY(4px) scale(1.01);
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
        }

        @keyframes notificationFluidExit {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
          40% {
            opacity: 0.9;
            transform: translateY(4px) scale(0.99);
            filter: blur(1px);
          }
          100% {
            opacity: 0;
            transform: translateY(-120%) scale(0.95);
            filter: blur(10px);
          }
        }

        .animate-notification-fluid {
          animation: notificationFluidEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-notification-fluid-exit {
          animation: notificationFluidExit 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Global Alert Banner - Enhanced Fluid Entry & Exit Animation */}
      {activeAlerts.length > 0 && (
        <div className={`fixed top-[57px] left-0 w-full z-40 ${isAlertExiting ? 'animate-notification-fluid-exit' : 'animate-notification-fluid'} pointer-events-auto`}>
          <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white px-4 py-2.5 shadow-xl flex justify-between items-center border-b border-red-500/80 backdrop-blur-md relative overflow-hidden">
            {/* Fluid background pulse overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent animate-pulse pointer-events-none" />

            <div className="flex items-center gap-3 overflow-hidden relative z-10">
               <div className="bg-white text-red-600 p-1.5 rounded shadow-md animate-bounce shrink-0">
                 <AlertTriangle size={18} />
               </div>
               <div 
                 className="flex flex-col min-w-0 cursor-pointer group"
                 onClick={() => {
                   setActiveTab('news');
                   dismissAlerts();
                 }}
               >
                 <span className="text-[10px] font-black uppercase tracking-widest text-amber-200 flex items-center gap-1.5">
                   <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                   {activeAlerts.length} NOVO SINAL / MATÉRIA DETECTADA
                 </span>
                 <span className="text-sm font-black truncate leading-tight group-hover:underline group-hover:text-amber-100 transition-colors">
                   {activeAlerts[0].description} <span className="opacity-80 font-normal text-xs"> — {activeAlerts[0].location}</span>
                 </span>
               </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0 ml-2 relative z-10">
               {activeAlerts.length > 1 && (
                 <div className="flex gap-1.5 items-center">
                    {activeAlerts.slice(1, 4).map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
                    ))}
                 </div>
               )}
               <button 
                 onClick={dismissAlerts}
                 className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/90 hover:text-white"
                 title="Dispensar Todos"
               >
                 <X size={18} />
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar - Red/White Theme */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 dark:bg-void/95 backdrop-blur-md border-b border-gray-200 dark:border-red-900/50 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <ArcaneBookIcon isAnimating={activeAlerts.length > 0 || hasNotification} />
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
          {isInstallable && (
            <button 
              onClick={handleInstallClick}
              className="flex items-center gap-2 px-3 py-1.5 bg-arcane-red hover:bg-red-700 text-white text-xs font-bold rounded-full shadow-lg transition-transform active:scale-95"
              title="Instalar Aplicativo"
            >
              <Download size={14} />
              <span className="hidden sm:inline">INSTALAR APP</span>
            </button>
          )}
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
                    style={{
                      animation: 'fadeInUp 0.15s ease-out forwards',
                      animationDelay: `${(index % 12) * 0.02}s`,
                      opacity: 0
                    }}
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
          <div className="max-w-6xl mx-auto w-full h-[80vh] min-h-[600px]">
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
              isAdmin={isAdmin}
              onDeleteSignal={handleDeleteSignal}
              onUpdateSignal={handleUpdateSignal}
              onCreateSignal={handleCreateSignal}
              infectionItems={infectionItems}
              isLoadingInfections={isLoadingInfections}
              onRefreshInfections={loadRealInfections}
              onDeleteInfection={handleDeleteInfection}
              onSaveInfection={handleSaveInfection}
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
        onUpdate={handleSaveObject}
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
        bgPrefs={bgPrefs}
        onUpdateBgPrefs={setBgPrefs}
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