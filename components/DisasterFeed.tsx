import React, { useState, useMemo } from 'react';
import { 
  Radio, RefreshCw, AlertTriangle, Zap, Wind, Droplets, Flame, AlertOctagon, 
  X, FileText, Globe, Newspaper, TrendingUp, Bell, Plus, Trash2, Edit2, Filter, 
  Calendar, ArrowDownUp, Check, Save, Activity, FlaskConical, Dna, Sparkles 
} from 'lucide-react';
import { generateFullNewsReport } from '../services/geminiService';
import { DisasterEvent, DisasterAlertPreference, InfectionNewsItem } from '../types';
import { RealInfectionsCatalog } from './RealInfectionsCatalog';

interface DisasterFeedProps {
  events: DisasterEvent[];
  prefs: DisasterAlertPreference;
  onUpdatePrefs: (prefs: DisasterAlertPreference) => void;
  onRetry?: () => void;
  isAdmin?: boolean;
  onDeleteSignal?: (id: string) => Promise<void>;
  onUpdateSignal?: (signal: DisasterEvent) => Promise<void>;
  onCreateSignal?: (signal: DisasterEvent) => Promise<void>;
  infectionItems?: InfectionNewsItem[];
  isLoadingInfections?: boolean;
  onRefreshInfections?: (query?: string, category?: string) => Promise<void>;
  onDeleteInfection?: (id: string) => Promise<void>;
  onSaveInfection?: (item: InfectionNewsItem) => Promise<void>;
}

const DisasterFeed: React.FC<DisasterFeedProps> = ({ 
  events, 
  prefs, 
  onUpdatePrefs, 
  onRetry,
  isAdmin = false,
  onDeleteSignal,
  onUpdateSignal,
  onCreateSignal,
  infectionItems = [],
  isLoadingInfections = false,
  onRefreshInfections = async () => {},
  onDeleteInfection,
  onSaveInfection
}) => {
  // Sub-tab Section switcher: 'signals' (Sinais Ocultos) vs 'infections' (Vigilância Real na Surface Web)
  const [activeSection, setActiveSection] = useState<'signals' | 'infections'>('signals');

  // Reading Modal State
  const [selectedEvent, setSelectedEvent] = useState<DisasterEvent | null>(null);
  const [articleContent, setArticleContent] = useState<string>('');
  const [loadingArticle, setLoadingArticle] = useState(false);
  
  // Alert Config Modal State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [newType, setNewType] = useState('');
  const [newLocation, setNewLocation] = useState('');

  // Admin Edit / Create Modal State
  const [editingSignal, setEditingSignal] = useState<DisasterEvent | null>(null);
  const [isCreatingSignal, setIsCreatingSignal] = useState(false);
  const [formData, setFormData] = useState<Partial<DisasterEvent>>({});

  // Filter & Sort State
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Handle Event Click (Generate Report)
  const handleEventClick = async (event: DisasterEvent) => {
    setSelectedEvent(event);
    if (event.fullArticle) {
      setArticleContent(event.fullArticle);
      setLoadingArticle(false);
      return;
    }
    setArticleContent('');
    setLoadingArticle(true);
    
    try {
      const report = await generateFullNewsReport(event);
      const content = report || "Dados corrompidos durante a transmissão.";
      setArticleContent(content);
      if (onUpdateSignal) {
        onUpdateSignal({ ...event, fullArticle: content });
      }
    } catch (e) {
      setArticleContent("Falha na interceptação do sinal completo.");
    } finally {
      setLoadingArticle(false);
    }
  };

  const openEditModal = (e: React.MouseEvent, event: DisasterEvent) => {
    e.stopPropagation();
    setEditingSignal(event);
    setFormData({ ...event });
  };

  const openCreateModal = () => {
    setIsCreatingSignal(true);
    setFormData({
      description: '',
      location: '',
      type: 'ANOMALIA',
      severity: 'medium',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      fullArticle: ''
    });
  };

  const handleDeleteClick = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Deseja realmente apagar esta matéria de forma permanente?")) {
      if (onDeleteSignal) {
        await onDeleteSignal(id);
      }
      if (selectedEvent && selectedEvent.id === id) {
        setSelectedEvent(null);
      }
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.location) {
      alert("Por favor, preencha a descrição e a localização da matéria.");
      return;
    }

    if (editingSignal && onUpdateSignal) {
      const updated: DisasterEvent = {
        ...editingSignal,
        description: formData.description || '',
        location: formData.location || '',
        type: formData.type || 'ANOMALIA',
        severity: (formData.severity as any) || 'medium',
        timestamp: formData.timestamp || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        fullArticle: formData.fullArticle || ''
      };
      await onUpdateSignal(updated);
      if (selectedEvent?.id === updated.id) {
        setSelectedEvent(updated);
        setArticleContent(updated.fullArticle || articleContent);
      }
    } else if (isCreatingSignal && onCreateSignal) {
      const created: DisasterEvent = {
        id: Date.now().toString() + Math.random().toString().slice(2),
        description: formData.description || '',
        location: formData.location || '',
        type: formData.type || 'ANOMALIA',
        severity: (formData.severity as any) || 'medium',
        timestamp: formData.timestamp || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now(),
        fullArticle: formData.fullArticle || ''
      };
      await onCreateSignal(created);
    }

    setEditingSignal(null);
    setIsCreatingSignal(false);
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
        <div className="flex flex-wrap justify-between items-center gap-3 mb-1">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
            <Radio className="text-arcane-red animate-pulse" />
            Rede de Vigilância & Sinais
          </h2>
          
          <div className="flex items-center gap-2">
             {isAdmin && activeSection === 'signals' && (
               <button
                 onClick={openCreateModal}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-arcane-red text-white text-xs font-bold uppercase rounded-full hover:bg-red-700 transition-colors shadow-md"
               >
                 <Plus size={14} />
                 Nova Matéria
               </button>
             )}
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

        {/* Sub-tab Navigation */}
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center p-1 bg-gray-100 dark:bg-black/60 rounded-xl border border-gray-200 dark:border-gray-800 gap-1">
            <button
              id="subtab-signals-arcane"
              onClick={() => setActiveSection('signals')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                activeSection === 'signals'
                  ? 'bg-arcane-red text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Radio size={14} className={activeSection === 'signals' ? 'animate-pulse' : ''} />
              Sinais Ocultos & Anomalias ({events.length})
            </button>

            <button
              id="subtab-real-infections"
              onClick={() => setActiveSection('infections')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                activeSection === 'infections'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Activity size={14} className={activeSection === 'infections' ? 'animate-pulse text-emerald-300' : 'text-emerald-500'} />
              <span>Infecções & Estudos Reais</span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] px-1.5 py-0.2 rounded font-mono font-black">
                SURFACE WEB
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-mono">
            <span className="flex items-center gap-1"><Globe size={12} /> GLOBAL</span>
            <span className="flex items-center gap-1"><TrendingUp size={12} /> EM ALTA</span>
            {isAdmin && <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold">MODO ADMIN</span>}
          </div>
        </div>
      </div>

      {activeSection === 'infections' ? (
        <div className="px-1">
          <RealInfectionsCatalog
            items={infectionItems}
            isLoading={isLoadingInfections}
            isAdmin={isAdmin}
            onRefreshFromWeb={onRefreshInfections}
            onDeleteItem={onDeleteInfection}
            onSaveItem={onSaveInfection}
          />
        </div>
      ) : (
        <>
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
                    <div className="flex items-center gap-2">
                      {event.severity === 'critical' && (
                          <span className="animate-pulse text-red-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-1">
                              <AlertTriangle size={10} /> BREAKING NEWS
                          </span>
                      )}
                      {isAdmin && (
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-black/60 rounded px-1.5 py-0.5 border border-gray-200 dark:border-gray-800">
                          <button
                            onClick={(e) => openEditModal(e, event)}
                            title="Editar Matéria"
                            className="p-1 hover:text-arcane-red text-gray-500 transition-colors"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(e, event.id)}
                            title="Excluir Matéria"
                            className="p-1 hover:text-red-600 text-gray-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
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
        </>
      )}

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
               <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                  {isAdmin && (
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-black/80 rounded-lg p-1 border border-gray-300 dark:border-gray-700">
                      <button
                        onClick={(e) => openEditModal(e, selectedEvent)}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold uppercase flex items-center gap-1 transition-colors"
                      >
                        <Edit2 size={12} />
                        Editar
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, selectedEvent.id)}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold uppercase flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={12} />
                        Apagar
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={() => setSelectedEvent(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
               </div>
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

      {/* Admin Edit / Create Signal Modal */}
      {(editingSignal || isCreatingSignal) && (
        <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-void w-full max-w-xl max-h-[90vh] rounded-xl shadow-2xl border-t-8 border-arcane-red flex flex-col relative overflow-hidden">
            
            <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-black/40">
              <h3 className="text-xl font-black uppercase flex items-center gap-2 text-gray-900 dark:text-white">
                <Edit2 className="text-arcane-red" size={20} />
                {isCreatingSignal ? 'Criar Nova Matéria' : 'Editar Matéria'}
              </h3>
              <button 
                onClick={() => { setEditingSignal(null); setIsCreatingSignal(false); }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Título / Descrição da Matéria *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Sinal de rádio desconhecido emitido do fundo do oceano..."
                  className="w-full bg-gray-100 dark:bg-black/60 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-arcane-red"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Localização *</label>
                  <input
                    type="text"
                    required
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ex: Ponto Nemo, Pacífico"
                    className="w-full bg-gray-100 dark:bg-black/60 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-arcane-red"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Tipo / Categoria</label>
                  <input
                    type="text"
                    value={formData.type || ''}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="Ex: ANOMALIA, CLIMA, PSIÔNICO"
                    className="w-full bg-gray-100 dark:bg-black/60 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-arcane-red"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Severidade</label>
                  <select
                    value={formData.severity || 'medium'}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                    className="w-full bg-gray-100 dark:bg-black/60 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-arcane-red"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Horário / Marcação</label>
                  <input
                    type="text"
                    value={formData.timestamp || ''}
                    onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
                    placeholder="Ex: 14:30"
                    className="w-full bg-gray-100 dark:bg-black/60 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-arcane-red"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Conteúdo Completo da Matéria (Opcional)</label>
                <textarea
                  rows={6}
                  value={formData.fullArticle || ''}
                  onChange={(e) => setFormData({ ...formData, fullArticle: e.target.value })}
                  placeholder="Texto completo da reportagem. Se deixado em branco, a IA gerará automaticamente quando o usuário clicar."
                  className="w-full bg-gray-100 dark:bg-black/60 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm font-serif focus:outline-none focus:border-arcane-red"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => { setEditingSignal(null); setIsCreatingSignal(false); }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold uppercase text-xs rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-arcane-red text-white font-bold uppercase text-xs rounded-lg hover:bg-red-700 flex items-center gap-1.5 shadow-lg"
                >
                  <Save size={14} />
                  Salvar Matéria
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default DisasterFeed;
