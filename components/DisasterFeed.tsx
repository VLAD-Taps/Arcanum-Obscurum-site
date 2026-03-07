import React, { useState, useMemo } from 'react';
import { Radio, RefreshCw, AlertTriangle, Zap, Wind, Droplets, Flame, AlertOctagon, X, FileText, Globe, Newspaper, TrendingUp, Bell, Plus, Trash2, Filter, Calendar, ArrowDownUp } from 'lucide-react';
import { generateFullNewsReport } from '../services/geminiService';
import { DisasterEvent, DisasterAlertPreference } from '../types';

interface DisasterFeedProps {
  events: DisasterEvent[];
  prefs: DisasterAlertPreference;
  onUpdatePrefs: (prefs: DisasterAlertPreference) => void;
  onRetry?: () => void;
}

const DisasterFeed: React.FC<DisasterFeedProps> = ({ events, prefs, onUpdatePrefs, onRetry }) => {
  // Reading Modal State
  const [selectedEvent, setSelectedEvent] = useState<DisasterEvent | null>(null);
  const [articleContent, setArticleContent] = useState<string>('');
  const [loadingArticle, setLoadingArticle] = useState(false);
  
  // Alert Config Modal State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [newType, setNewType] = useState('');
  const [newLocation, setNewLocation] = useState('');

  // Filter & Sort State
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

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
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-blue-600 text-white';
    }
  };

  const handleAddType = () => {
    if (newType && !prefs.watchedTypes.includes(newType)) {
      onUpdatePrefs({
        ...prefs,
        watchedTypes: [...prefs.watchedTypes, newType]
      });
      setNewType('');
    }
  };

  const handleRemoveType = (type: string) => {
    onUpdatePrefs({
      ...prefs,
      watchedTypes: prefs.watchedTypes.filter(t => t !== type)
    });
  };

  const handleAddLocation = () => {
    if (newLocation && !prefs.watchedLocations.includes(newLocation)) {
      onUpdatePrefs({
        ...prefs,
        watchedLocations: [...prefs.watchedLocations, newLocation]
      });
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (loc: string) => {
    onUpdatePrefs({
      ...prefs,
      watchedLocations: prefs.watchedLocations.filter(l => l !== loc)
    });
  };

  // Filtered & Sorted Events
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Filter by Type
    if (filterType !== 'all') {
      result = result.filter(e => e.type === filterType);
    }

    // Filter by Severity
    if (filterSeverity !== 'all') {
      result = result.filter(e => e.severity === filterSeverity);
    }

    // Sort by Time
    result.sort((a, b) => {
      // Assuming timestamp is HH:mm string, simple string comparison works for same day
      // For more complex dates, we'd need parsing
      if (sortOrder === 'newest') {
        return b.timestamp.localeCompare(a.timestamp);
      } else {
        return a.timestamp.localeCompare(b.timestamp);
      }
    });

    return result;
  }, [events, filterType, filterSeverity, sortOrder]);

  // Get unique types for filter dropdown
  const uniqueTypes = useMemo(() => {
    const types = new Set(events.map(e => e.type));
    return Array.from(types);
  }, [events]);

  return (
    <div className="h-full flex flex-col space-y-4 pb-24 relative overflow-hidden">
      
      {/* News Ticker Section */}
      <div className="bg-black text-white py-1 px-2 overflow-hidden whitespace-nowrap flex items-center gap-4 text-xs font-mono border-b-2 border-arcane-red shadow-md">
         <span className="bg-arcane-red text-white px-2 py-0.5 font-black animate-pulse">URGENTE</span>
         <div className="inline-block animate-marquee w-full">
            {events.length > 0 ? (
                events.slice(0, 5).map((e, i) => (
                    <span key={i} className="mr-8 text-gray-300">
                        <span className="text-red-500 font-bold">[{e.timestamp}]</span> {e.description.toUpperCase()} <span className="mx-2 text-gray-600">///</span>
                    </span>
                ))
            ) : (
                <span className="text-gray-500">Buscando canais criptografados...</span>
            )}
         </div>
         <style>{`
            @keyframes marquee {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
            }
            .animate-marquee {
                animation: marquee 20s linear infinite;
            }
         `}</style>
      </div>

      {/* Header Panel */}
      <div className="bg-white dark:bg-void-light p-5 rounded-xl shadow-lg border-t-4 border-arcane-red dark:border-red-600 mx-1">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
            <Radio className="text-arcane-red animate-pulse" />
            Rede de Vigilância
          </h2>
          
          <div className="flex items-center gap-2">
             <button
               onClick={() => setIsConfigOpen(true)}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all border ${
                 prefs.enabled 
                   ? 'bg-red-600 text-white border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]' 
                   : 'bg-gray-100 dark:bg-black text-gray-500 border-gray-300 dark:border-gray-700'
               }`}
             >
               <Bell size={12} fill={prefs.enabled ? "currentColor" : "none"} />
               {prefs.enabled ? 'ALERTAS ATIVOS' : 'ALERTAS OFF'}
             </button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 font-mono mt-2">
           <span className="flex items-center gap-1"><Globe size={12} /> GLOBAL</span>
           <span className="flex items-center gap-1"><TrendingUp size={12} /> EM ALTA</span>
           <span className="text-arcane-red font-bold ml-auto">IA REPORTING ACTIVE</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 px-1">
        <div className="relative flex-1 min-w-[120px]">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full appearance-none bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 pl-9 text-xs font-bold uppercase text-gray-700 dark:text-gray-300 focus:outline-none focus:border-arcane-red"
          >
            <option value="all">Todas Categorias</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <div className="relative flex-1 min-w-[120px]">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="w-full appearance-none bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 pl-9 text-xs font-bold uppercase text-gray-700 dark:text-gray-300 focus:outline-none focus:border-arcane-red"
          >
            <option value="all">Qualquer Severidade</option>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="critical">Crítica</option>
          </select>
          <AlertTriangle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <div className="relative flex-1 min-w-[120px]">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="w-full appearance-none bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 pl-9 text-xs font-bold uppercase text-gray-700 dark:text-gray-300 focus:outline-none focus:border-arcane-red"
          >
            <option value="newest">Mais Recentes</option>
            <option value="oldest">Mais Antigos</option>
          </select>
          <ArrowDownUp size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* News Feed List */}
      <div className="flex-1 space-y-3 overflow-y-auto px-1 scrollbar-hide">
        {events.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <Radio size={64} className="mx-auto mb-6 animate-pulse text-arcane-red" />
            <p className="font-bold text-lg">Interceptando sinais de rádio...</p>
            <p className="text-xs font-mono mt-2 text-gray-500">Decodificando frequências ocultas...</p>
            {onRetry && (
               <button 
                 onClick={onRetry}
                 className="mt-6 px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-full text-xs font-bold uppercase hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
               >
                 Forçar Reconexão
               </button>
            )}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <Filter size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="font-bold text-sm">Nenhum evento encontrado com estes filtros.</p>
            <button 
              onClick={() => { setFilterType('all'); setFilterSeverity('all'); }}
              className="mt-4 text-arcane-red text-xs font-bold uppercase hover:underline"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div 
              key={event.id}
              onClick={() => handleEventClick(event)}
              className="bg-white dark:bg-black/40 border-l-4 border-gray-200 dark:border-gray-700 p-4 rounded-r-lg shadow-sm hover:border-l-arcane-red hover:bg-gray-50 dark:hover:bg-void transition-all group relative overflow-hidden cursor-pointer active:scale-[0.99] animate-in slide-in-from-bottom-2 duration-300"
              style={{ borderLeftColor: event.severity === 'critical' ? '#dc2626' : undefined }}
            >
              
              <div className="flex justify-between items-start mb-2 relative z-10 pl-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-sm ${getSeverityColor(event.severity)}`}>
                    {event.type}
                  </span>
                  <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                    {event.timestamp}
                  </span>
                </div>
                {event.severity === 'critical' && (
                    <span className="animate-pulse text-red-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-1">
                        <AlertTriangle size={10} /> BREAKING NEWS
                    </span>
                )}
              </div>

              <div className="flex items-start gap-4 relative z-10 pl-1">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight mb-2 group-hover:text-arcane-red transition-colors font-serif">
                    {event.description}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
                     <span className="flex items-center gap-1 text-arcane-red"><Globe size={10} /> {event.location}</span>
                     <span className="text-gray-300 dark:text-gray-700">|</span>
                     <span className="flex items-center gap-1 hover:underline">LER MATÉRIA COMPLETA &rarr;</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Alert Configuration Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-void w-full max-w-md rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 relative">
              <button 
                onClick={() => setIsConfigOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                <Bell className="text-arcane-red" /> Configurar Alertas
              </h3>

              <div className="space-y-6">
                {/* Toggle Enable */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/30 rounded-lg">
                   <span className="font-bold text-sm">Ativar Monitoramento</span>
                   <button 
                     onClick={() => onUpdatePrefs({ ...prefs, enabled: !prefs.enabled })}
                     className={`w-12 h-6 rounded-full p-1 transition-colors ${prefs.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                   >
                     <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${prefs.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                   </button>
                </div>

                {/* Watched Types */}
                <div>
                   <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Tipos de Evento (ex: Anomalia)</label>
                   <div className="flex gap-2 mb-2">
                      <input 
                        type="text" 
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        placeholder="Adicionar tipo..."
                        className="flex-1 bg-gray-100 dark:bg-black border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm"
                      />
                      <button onClick={handleAddType} className="bg-gray-200 dark:bg-gray-800 p-2 rounded hover:bg-gray-300 dark:hover:bg-gray-700">
                        <Plus size={18} />
                      </button>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {prefs.watchedTypes.map(type => (
                        <span key={type} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded flex items-center gap-1">
                           {type}
                           <button onClick={() => handleRemoveType(type)}><X size={12} /></button>
                        </span>
                      ))}
                   </div>
                </div>

                {/* Watched Locations */}
                <div>
                   <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Locais de Interesse</label>
                   <div className="flex gap-2 mb-2">
                      <input 
                        type="text" 
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="Adicionar local..."
                        className="flex-1 bg-gray-100 dark:bg-black border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm"
                      />
                      <button onClick={handleAddLocation} className="bg-gray-200 dark:bg-gray-800 p-2 rounded hover:bg-gray-300 dark:hover:bg-gray-700">
                        <Plus size={18} />
                      </button>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {prefs.watchedLocations.map(loc => (
                        <span key={loc} className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded flex items-center gap-1">
                           {loc}
                           <button onClick={() => handleRemoveLocation(loc)}><X size={12} /></button>
                        </span>
                      ))}
                   </div>
                </div>

                {/* Min Severity */}
                <div>
                   <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Severidade Mínima</label>
                   <select 
                     value={prefs.minSeverity}
                     onChange={(e) => onUpdatePrefs({ ...prefs, minSeverity: e.target.value as any })}
                     className="w-full bg-gray-100 dark:bg-black border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm"
                   >
                      <option value="low">Baixa (Todas)</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                      <option value="critical">Crítica</option>
                   </select>
                </div>

              </div>
           </div>
        </div>
      )}

      {/* Article Reading Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-void w-full max-w-3xl max-h-[90vh] rounded-none shadow-2xl border-t-8 border-arcane-red flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-void flex justify-between items-start relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Newspaper size={120} />
               </div>
               <div className="relative z-10 w-full pr-10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 text-xs font-black uppercase tracking-widest ${getSeverityColor(selectedEvent.severity)}`}>
                        {selectedEvent.type}
                    </span>
                    <span className="text-sm text-gray-500 font-mono border-l pl-3 border-gray-300 dark:border-gray-700">
                        {new Date().toLocaleDateString()} • {selectedEvent.timestamp}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight font-serif mb-2">
                    {selectedEvent.description}
                  </h2>
                  <p className="text-arcane-red font-bold text-sm uppercase flex items-center gap-1">
                     <Globe size={14} /> {selectedEvent.location} — COBERTURA EXCLUSIVA
                  </p>
               </div>
               <button 
                 onClick={() => setSelectedEvent(null)}
                 className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full transition-colors z-20"
               >
                 <X size={24} />
               </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 font-serif text-lg leading-relaxed text-gray-800 dark:text-gray-300 bg-gray-50 dark:bg-black/20">
               {loadingArticle ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-6">
                     <RefreshCw size={48} className="animate-spin text-arcane-red" />
                     <div className="text-center">
                        <p className="font-bold text-xl text-gray-900 dark:text-white mb-2">Redigindo Matéria...</p>
                        <p className="font-mono text-sm text-gray-500 uppercase tracking-widest">Consultando fontes proibidas</p>
                     </div>
                  </div>
               ) : (
                  <div className="prose dark:prose-invert max-w-none prose-headings:font-sans prose-p:mb-4 first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-arcane-red">
                     <div className="whitespace-pre-wrap">{articleContent}</div>
                     
                     <div className="mt-12 pt-8 border-t border-gray-300 dark:border-gray-700 flex flex-col items-center gap-4">
                        <div className="w-16 h-1 bg-arcane-red"></div>
                        <p className="text-xs font-mono text-gray-400 text-center uppercase tracking-widest">
                            O Observador Arcano &copy; {new Date().getFullYear()} <br/>
                            A verdade está nas sombras.
                        </p>
                     </div>
                  </div>
               )}
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default DisasterFeed;
