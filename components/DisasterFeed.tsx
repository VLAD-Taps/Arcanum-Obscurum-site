import React, { useState, useEffect, useRef } from 'react';
import { Radio, RefreshCw, AlertTriangle, Zap, Wind, Droplets, Flame, AlertOctagon, Pause, Play, X, FileText, Globe } from 'lucide-react';
import { fetchGlobalDisasters, generateFullNewsReport } from '../services/geminiService';
import { DisasterEvent } from '../types';

const DisasterFeed: React.FC = () => {
  const [events, setEvents] = useState<DisasterEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  // Reading Modal State
  const [selectedEvent, setSelectedEvent] = useState<DisasterEvent | null>(null);
  const [articleContent, setArticleContent] = useState<string>('');
  const [loadingArticle, setLoadingArticle] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadFeed = async (append = false) => {
    if (loading) return;
    setLoading(true);
    try {
      // If live/appending, fetch just 1-2 new items. If manual refresh, fetch 5.
      const count = append ? 1 : 5;
      const data = await fetchGlobalDisasters(count);
      
      const newEvents = data.map((item: any) => ({
        ...item,
        id: Date.now().toString() + Math.random().toString().slice(2)
      }));

      if (append) {
        setEvents(prev => [...newEvents, ...prev].slice(0, 50)); // Keep max 50 items
      } else {
        setEvents(newEvents);
      }
    } catch (error) {
      console.error("Erro ao carregar feed", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    if (events.length === 0) loadFeed();
  }, []);

  // Live Feed Logic
  useEffect(() => {
    if (isLive) {
      intervalRef.current = setInterval(() => {
        loadFeed(true); // Append new items
      }, 15000); // Fetch every 15 seconds
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLive]);

  // Handle Event Click (Generate Report)
  const handleEventClick = async (event: DisasterEvent) => {
    setSelectedEvent(event);
    setArticleContent('');
    setLoadingArticle(true);
    
    try {
      const report = await generateFullNewsReport(event);
      setArticleContent(report || "Dados corrompidos durante a transmissão.");
    } catch (e) {
      setArticleContent("Falha na interceptação do sinal completo.");
    } finally {
      setLoadingArticle(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'bg-red-600 text-white animate-pulse shadow-red-500/50 shadow-lg';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('fogo') || t.includes('incêndio') || t.includes('vulcan')) return <Flame size={18} />;
    if (t.includes('tempestade') || t.includes('furacão') || t.includes('tornado')) return <Wind size={18} />;
    if (t.includes('inundação') || t.includes('tsunami') || t.includes('mar')) return <Droplets size={18} />;
    if (t.includes('energia') || t.includes('raio') || t.includes('eletro')) return <Zap size={18} />;
    return <AlertTriangle size={18} />;
  };

  return (
    <div className="h-full flex flex-col space-y-4 pb-24 relative">
      
      {/* Header Panel */}
      <div className="bg-white dark:bg-void-light p-6 rounded-xl shadow-lg border-l-4 border-arcane-red dark:border-red-600">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
            <Radio className={`text-arcane-red ${isLive ? 'animate-ping' : ''}`} />
            Sinais de Interceptação
          </h2>
          
          <div className="flex items-center gap-2">
             {/* Live Toggle */}
             <button
               onClick={() => setIsLive(!isLive)}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all border ${
                 isLive 
                   ? 'bg-red-600 text-white border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]' 
                   : 'bg-gray-100 dark:bg-black text-gray-500 border-gray-300 dark:border-gray-700'
               }`}
             >
               {isLive ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
               {isLive ? 'AO VIVO' : 'PAUSADO'}
             </button>

             <button 
               onClick={() => loadFeed(false)}
               disabled={loading}
               className="p-2 bg-gray-100 dark:bg-void hover:bg-gray-200 dark:hover:bg-red-900/30 rounded-full transition-all"
               title="Atualizar Feed"
             >
               <RefreshCw size={18} className={`text-gray-600 dark:text-gray-300 ${loading ? 'animate-spin' : ''}`} />
             </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono flex items-center gap-2">
          <Globe size={14} /> Monitoramento global de anomalias em tempo real.
        </p>
      </div>

      {/* News Feed List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {loading && events.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <Radio size={64} className="mx-auto mb-6 animate-pulse text-arcane-red" />
            <p className="font-bold text-lg">Sincronizando frequências globais...</p>
            <p className="text-xs font-mono mt-2">Buscando padrões anômalos...</p>
          </div>
        ) : (
          events.map((event) => (
            <div 
              key={event.id}
              onClick={() => handleEventClick(event)}
              className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800 p-4 rounded-lg shadow-sm hover:border-red-500 hover:shadow-red-900/20 transition-all group relative overflow-hidden cursor-pointer active:scale-[0.98] animate-in slide-in-from-top-4 duration-300"
            >
              {/* Critical Alert Stripe */}
              {event.severity === 'critical' && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600 animate-pulse" />
              )}

              <div className="flex justify-between items-start mb-2 relative z-10 pl-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${getSeverityColor(event.severity)}`}>
                    {event.severity}
                  </span>
                  <span className="text-xs font-mono text-gray-400 flex items-center gap-1 bg-gray-100 dark:bg-void px-2 rounded">
                    <AlertOctagon size={10} /> {event.timestamp}
                  </span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-arcane-red uppercase tracking-wide flex items-center gap-1">
                   LER RELATÓRIO <FileText size={12} />
                </div>
              </div>

              <div className="flex items-start gap-4 relative z-10 pl-2">
                <div className={`p-3 rounded-lg text-white shadow-inner flex-shrink-0 ${
                   event.severity === 'critical' ? 'bg-red-800' : 'bg-gray-200 dark:bg-void text-gray-600 dark:text-red-500'
                }`}>
                  {getIcon(event.type)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight mb-1 group-hover:text-arcane-red transition-colors">
                    {event.type}
                  </h3>
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                     <Globe size={10} /> {event.location}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                    {event.description}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Article Reading Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-void w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-200 dark:border-red-900/30 bg-gray-50 dark:bg-void-light flex justify-between items-start">
               <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${getSeverityColor(selectedEvent.severity)}`}>
                        {selectedEvent.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">{selectedEvent.timestamp}</span>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight uppercase">
                    {selectedEvent.type}
                  </h2>
                  <p className="text-arcane-red font-bold text-sm uppercase flex items-center gap-1 mt-1">
                     <Globe size={14} /> {selectedEvent.location}
                  </p>
               </div>
               <button 
                 onClick={() => setSelectedEvent(null)}
                 className="p-2 bg-gray-200 dark:bg-black hover:bg-red-600 hover:text-white rounded-full transition-colors"
               >
                 <X size={20} />
               </button>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 overflow-y-auto font-serif text-lg leading-relaxed text-gray-800 dark:text-gray-300">
               {loadingArticle ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4">
                     <RefreshCw size={32} className="animate-spin text-arcane-red" />
                     <p className="font-mono text-sm uppercase tracking-widest animate-pulse">Descriptografando relatório completo...</p>
                  </div>
               ) : (
                  <div className="prose dark:prose-invert max-w-none">
                     <div className="whitespace-pre-wrap">{articleContent}</div>
                     <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-800 text-xs font-mono text-gray-400 text-center">
                        *** FIM DA TRANSMISSÃO - ARCANUM OBSCURUM ***
                     </div>
                  </div>
               )}
            </div>
            
            {/* Decorative Footer */}
            <div className="bg-red-600 h-1.5 w-full"></div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DisasterFeed;