import React, { useState, useMemo } from 'react';
import { 
  Activity, Globe, Search, RefreshCw, ExternalLink, BookOpen, 
  ShieldAlert, Dna, FlaskConical, Stethoscope, AlertTriangle, 
  Trash2, Plus, Edit2, X, Check, FileText, ChevronRight, Share2, Sparkles, Filter
} from 'lucide-react';
import { InfectionNewsItem } from '../types';
import { fetchRealInfectionNews, generateDetailedInfectionReport } from '../services/geminiService';

interface RealInfectionsCatalogProps {
  items: InfectionNewsItem[];
  isLoading: boolean;
  isAdmin?: boolean;
  onRefreshFromWeb: (customQuery?: string, category?: string) => Promise<void>;
  onDeleteItem?: (id: string) => Promise<void>;
  onSaveItem?: (item: InfectionNewsItem) => Promise<void>;
}

export const RealInfectionsCatalog: React.FC<RealInfectionsCatalogProps> = ({
  items,
  isLoading,
  isAdmin = false,
  onRefreshFromWeb,
  onDeleteItem,
  onSaveItem
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<InfectionNewsItem | null>(null);
  const [reportContent, setReportContent] = useState<string>('');
  const [loadingReport, setLoadingReport] = useState(false);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);

  // Admin Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InfectionNewsItem | null>(null);
  const [formData, setFormData] = useState<Partial<InfectionNewsItem>>({});

  const categories = [
    { id: 'all', label: 'Todos os Registros', icon: Activity },
    { id: 'surto', label: 'Surtos & Epidemias', icon: ShieldAlert },
    { id: 'estudo', label: 'Estudos Científicos', icon: FlaskConical },
    { id: 'alerta_oms', label: 'Alertas Globais (OMS/CDC)', icon: AlertTriangle },
    { id: 'resistencia', label: 'Superbactérias & Resistência', icon: Stethoscope },
    { id: 'mutacao', label: 'Vigilância Genômica & Mutações', icon: Dna },
  ];

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchingWeb(true);
    try {
      await onRefreshFromWeb(searchQuery, selectedCategory);
    } finally {
      setIsSearchingWeb(false);
    }
  };

  const handleOpenReport = async (item: InfectionNewsItem) => {
    setSelectedItem(item);
    if (item.fullAnalysis) {
      setReportContent(item.fullAnalysis);
      setLoadingReport(false);
      return;
    }

    setReportContent('');
    setLoadingReport(true);
    try {
      const fullText = await generateDetailedInfectionReport(item);
      setReportContent(fullText || item.summary);
      if (onSaveItem) {
        onSaveItem({ ...item, fullAnalysis: fullText || item.summary });
      }
    } catch (e) {
      setReportContent("Falha na geração do dossiê científico completo.");
    } finally {
      setLoadingReport(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      source: '',
      url: '',
      category: 'estudo',
      pathogen: '',
      location: '',
      summary: '',
      keyFindings: ['', '']
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: InfectionNewsItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Deseja remover este registro do catálogo de infecções?")) {
      if (onDeleteItem) {
        await onDeleteItem(id);
      }
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.summary) {
      alert("Por favor, preencha o título e o resumo.");
      return;
    }

    if (onSaveItem) {
      const itemToSave: InfectionNewsItem = {
        id: editingItem ? editingItem.id : `inf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: formData.title || '',
        source: formData.source || 'Estudo Verificado',
        url: formData.url || '',
        publishedDate: formData.publishedDate || 'Recente',
        category: (formData.category as any) || 'estudo',
        pathogen: formData.pathogen || '',
        location: formData.location || 'Global',
        summary: formData.summary || '',
        keyFindings: Array.isArray(formData.keyFindings) 
          ? formData.keyFindings.filter(Boolean) 
          : [],
        createdAt: editingItem?.createdAt || Date.now(),
        fullAnalysis: formData.fullAnalysis || editingItem?.fullAnalysis
      };
      await onSaveItem(itemToSave);
    }

    setIsModalOpen(false);
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.pathogen && item.pathogen.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'surto':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1"><ShieldAlert size={11} /> Surto Ativo</span>;
      case 'alerta_oms':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1"><AlertTriangle size={11} /> Alerta Global</span>;
      case 'resistencia':
        return <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1"><Stethoscope size={11} /> Superbactéria</span>;
      case 'mutacao':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1"><Dna size={11} /> Genômica</span>;
      default:
        return <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1"><FlaskConical size={11} /> Estudo Científico</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Bio-Intelligence Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-black border border-emerald-500/30 rounded-xl p-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                Surface Web Crawler // Monitoramento Epidemiológico Real
              </span>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Activity className="text-emerald-400" size={22} />
              Catálogo de Infecções & Estudos Científicos
            </h3>
            <p className="text-xs text-gray-300 max-w-2xl mt-1">
              Buscas automatizadas por toda a surface web com inteligência artificial para rastrear alertas da OMS, publicações em periódicos médicos (Nature, The Lancet, NEJM) e surtos infecciosos em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <button
                id="btn-admin-add-infection"
                onClick={openCreateModal}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase rounded-lg transition shadow-lg shadow-emerald-900/30"
              >
                <Plus size={14} /> Novo Estudo
              </button>
            )}
            <button
              id="btn-refresh-surface-web"
              disabled={isSearchingWeb || isLoading}
              onClick={() => onRefreshFromWeb(searchQuery, selectedCategory)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase rounded-lg transition disabled:opacity-50 shadow-md"
            >
              <RefreshCw size={14} className={isSearchingWeb || isLoading ? "animate-spin text-emerald-400" : "text-emerald-400"} />
              {isSearchingWeb ? 'Escaneando Surface Web...' : 'Escanear Web Agora'}
            </button>
          </div>
        </div>

        {/* Live Search & Filter Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" size={16} />
            <input
              id="input-surface-web-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar vírus, superbactérias, vacinas, mutações ou países (ex: H5N1, Mpox, Dengue, Candida auris)..."
              className="w-full bg-black/60 border border-emerald-500/30 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400 font-mono transition"
            />
          </div>
          <button
            id="btn-submit-infection-search"
            type="submit"
            disabled={isSearchingWeb}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase rounded-lg transition disabled:opacity-50"
          >
            <Sparkles size={14} />
            Buscar na Surface Web
          </button>
        </form>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                isSelected 
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950' 
                  : 'bg-black/40 hover:bg-black/60 text-gray-400 border-gray-800 hover:text-gray-200'
              }`}
            >
              <Icon size={13} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Items Counter & Active Status */}
      <div className="flex items-center justify-between text-xs font-mono text-gray-400 px-1">
        <span className="flex items-center gap-2">
          <Globe size={13} className="text-emerald-400" />
          <span>{filteredItems.length} matérias e estudos científicos catalogados</span>
        </span>
        <span className="text-[11px] text-emerald-400 font-bold">
          {isSearchingWeb ? 'BUSCA ATIVA NA WEB...' : 'BASE ATUALIZADA'}
        </span>
      </div>

      {/* Main Grid of Infection News & Studies */}
      {filteredItems.length === 0 ? (
        <div className="bg-black/40 border border-gray-800 rounded-xl p-10 text-center space-y-3">
          <FlaskConical className="mx-auto text-gray-600 animate-pulse" size={36} />
          <h4 className="text-base font-bold text-gray-300">Nenhum estudo encontrado para os filtros atuais</h4>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Clique no botão abaixo para que o sistema vasculhe a internet aberta e indexe novas notícias reais sobre infecções e pesquisas biomédicas.
          </p>
          <button
            onClick={() => onRefreshFromWeb(searchQuery, selectedCategory)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase rounded-lg transition"
          >
            <RefreshCw size={14} />
            Escanear Surface Web Agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenReport(item)}
              className="bg-gradient-to-b from-gray-900/90 to-black border border-gray-800 hover:border-emerald-500/50 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-950/20 cursor-pointer flex flex-col justify-between group relative"
            >
              <div>
                {/* Header Info */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {getCategoryBadge(item.category)}
                    {item.pathogen && (
                      <span className="bg-gray-800 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                        {item.pathogen}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <>
                        <button
                          onClick={(e) => openEditModal(item, e)}
                          title="Editar matéria"
                          className="p-1 text-gray-400 hover:text-emerald-400 hover:bg-emerald-950/40 rounded transition"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          title="Excluir matéria"
                          className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-950/40 rounded transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug line-clamp-2 mb-2">
                  {item.title}
                </h4>

                {/* Summary */}
                <p className="text-xs text-gray-300 line-clamp-3 mb-3 leading-relaxed">
                  {item.summary}
                </p>

                {/* Key findings bullet points if available */}
                {item.keyFindings && item.keyFindings.length > 0 && (
                  <div className="bg-black/50 border border-emerald-950/60 rounded-lg p-2.5 mb-3 space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <Check size={11} /> Destaques Científicos
                    </span>
                    {item.keyFindings.slice(0, 2).map((kf, i) => (
                      <p key={i} className="text-[11px] text-gray-300 flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span className="line-clamp-1">{kf}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Meta */}
              <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400/90 font-bold truncate max-w-[120px]">{item.source}</span>
                  {item.location && <span>• {item.location}</span>}
                </div>

                <div className="flex items-center gap-2">
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-400 hover:text-emerald-400 transition"
                      title="Abrir link original da fonte"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                  <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-bold">
                    Ler Dossiê <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Read In-depth Dossier Modal */}
      {selectedItem && (
        <div 
          id="modal-infection-report"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-gray-950 border border-emerald-500/40 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl shadow-emerald-950/50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-950/60 to-black border-b border-emerald-500/30 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {getCategoryBadge(selectedItem.category)}
                  {selectedItem.pathogen && (
                    <span className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                      {selectedItem.pathogen}
                    </span>
                  )}
                  <span className="text-xs font-mono text-gray-400">{selectedItem.location || 'Global'}</span>
                </div>
                <h3 className="text-lg font-bold text-white leading-snug">
                  {selectedItem.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-gray-400 font-mono mt-2">
                  <span>Fonte: <strong className="text-emerald-400">{selectedItem.source}</strong></span>
                  {selectedItem.publishedDate && <span>• {selectedItem.publishedDate}</span>}
                </div>
              </div>

              <button 
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-300 leading-relaxed font-sans scrollbar-thin">
              {loadingReport ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="animate-spin text-emerald-400 mx-auto" size={28} />
                  <p className="text-sm font-mono text-emerald-300">
                    Compilando dossiê científico e verificando publicações médicas...
                  </p>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none text-gray-300">
                  <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-4 mb-4">
                    <h5 className="text-xs font-mono uppercase font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                      <BookOpen size={14} /> Resumo Executivo
                    </h5>
                    <p className="text-xs text-gray-200 leading-relaxed">{selectedItem.summary}</p>
                  </div>

                  {selectedItem.keyFindings && selectedItem.keyFindings.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-xs font-mono uppercase font-bold text-gray-300 mb-2">Descobertas Chave</h5>
                      <ul className="space-y-1.5">
                        {selectedItem.keyFindings.map((finding, idx) => (
                          <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Main Markdown Text */}
                  <div className="space-y-3 text-xs leading-relaxed whitespace-pre-wrap border-t border-gray-800/80 pt-4">
                    {reportContent}
                  </div>

                  {/* Grounding Source Links from Surface Web */}
                  {selectedItem.groundingLinks && selectedItem.groundingLinks.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-800">
                      <h5 className="text-xs font-mono uppercase font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                        <Globe size={14} /> Fontes Verificadas na Surface Web
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.groundingLinks.map((link, lIdx) => (
                          <a
                            key={lIdx}
                            href={link.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-emerald-500/30 hover:border-emerald-400 text-xs text-emerald-300 rounded-lg hover:text-white transition"
                          >
                            <ExternalLink size={12} />
                            <span className="truncate max-w-[200px]">{link.title || 'Artigo Original'}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-900/80 border-t border-gray-800 flex items-center justify-between">
              {selectedItem.url ? (
                <a
                  href={selectedItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase rounded-lg transition"
                >
                  <ExternalLink size={14} /> Ver Matéria na Fonte ({selectedItem.source})
                </a>
              ) : (
                <span className="text-xs text-gray-500 font-mono">Fonte indexada: {selectedItem.source}</span>
              )}

              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold uppercase rounded-lg transition"
              >
                Fechar Dossiê
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-950 border border-emerald-500/40 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FlaskConical className="text-emerald-400" size={18} />
                {editingItem ? 'Editar Registro de Estudo' : 'Cadastrar Estudo / Notícia Real'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-bold text-gray-400 mb-1">Título da Matéria / Estudo</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500"
                  placeholder="Ex: Novo Estudo sobre Resistência a Antibióticos na Nature..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-mono font-bold text-gray-400 mb-1">Veículo / Fonte</label>
                  <input
                    type="text"
                    required
                    value={formData.source || ''}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500"
                    placeholder="Ex: The Lancet, OMS, BBC..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-gray-400 mb-1">Categoria</label>
                  <select
                    value={formData.category || 'estudo'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500"
                  >
                    <option value="estudo">Estudo Científico</option>
                    <option value="surto">Surto & Epidemia</option>
                    <option value="alerta_oms">Alerta Global (OMS/CDC)</option>
                    <option value="resistencia">Superbactéria / Resistência</option>
                    <option value="mutacao">Genômica / Mutações</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-mono font-bold text-gray-400 mb-1">Patógeno / Vírus / Bactéria</label>
                  <input
                    type="text"
                    value={formData.pathogen || ''}
                    onChange={(e) => setFormData({ ...formData, pathogen: e.target.value })}
                    className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500"
                    placeholder="Ex: H5N1, Candida auris..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-gray-400 mb-1">Localização</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500"
                    placeholder="Ex: Brasil / Global..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-gray-400 mb-1">Link URL Original</label>
                <input
                  type="url"
                  value={formData.url || ''}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-gray-400 mb-1">Resumo da Notícia / Estudo</label>
                <textarea
                  required
                  rows={3}
                  value={formData.summary || ''}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500"
                  placeholder="Explique resumidamente os resultados e fatos reais..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 text-xs font-bold uppercase rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase rounded-lg"
                >
                  Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
