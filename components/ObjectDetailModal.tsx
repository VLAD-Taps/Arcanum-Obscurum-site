import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Tag, FileText, Box, Trash2, AlertTriangle, User, Crown, Shield, ExternalLink, Zap, Save, Edit2, Share2, Check } from 'lucide-react';
import { CatalogObject } from '../types';
import AddObjectForm from './AddObjectForm';

interface ObjectDetailModalProps {
  object: CatalogObject | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate?: (obj: CatalogObject) => void;
  originCoords: { x: number; y: number } | null;
  isAdmin?: boolean;
}

const ObjectDetailModal: React.FC<ObjectDetailModalProps> = ({ object, isOpen, onClose, onDelete, onUpdate, originCoords, isAdmin }) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [showContainmentLog, setShowContainmentLog] = useState(false);
  const [editedLog, setEditedLog] = useState('');
  const [isEditingLog, setIsEditingLog] = useState(false);
  const [isEditingEntireObject, setIsEditingEntireObject] = useState(false);

  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (object) {
      setEditedLog(object?.containmentLog || '');
      setIsEditingLog(false);
      setIsEditingEntireObject(false);
    }
  }, [object]);

  if (!isOpen || !object) return null;

  const handleFullSave = (updatedObj: CatalogObject) => {
    if (onUpdate) onUpdate(updatedObj);
    setIsEditingEntireObject(false);
  };

  const handleSaveLog = () => {
    if (onUpdate && object) {
      onUpdate({ ...object, containmentLog: editedLog });
      setIsEditingLog(false);
    }
  };

  const handleShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('objectId', object.id);
      if (object.coordinates) {
        url.searchParams.set('lat', object.coordinates.lat.toString());
        url.searchParams.set('lng', object.coordinates.lng.toString());
      }
      await navigator.clipboard.writeText(url.toString());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDeleteClick = () => {
    setIsConfirmingDelete(true);
  };

  const confirmDelete = () => {
    onDelete(object.id);
    onClose();
    setIsConfirmingDelete(false);
  };

  const cancelDelete = () => {
    setIsConfirmingDelete(false);
  };

  const handleOpenMap = () => {
    if (object.coordinates) {
      const { lat, lng } = object.coordinates;
      // Opens Google Maps search with coordinates
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    }
  };

  const isConceptBearer = object.bearer?.rank === 'Concept';

  // Calculate transform origin based on click coordinates
  const style = originCoords ? {
    transformOrigin: `${originCoords.x}px ${originCoords.y}px`,
  } : {};

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        style={style}
        className="bg-white dark:bg-void-light w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700 relative animate-in zoom-in-50 duration-300 ease-out"
      >
        
        {/* Delete Confirmation Overlay */}
        {isConfirmingDelete && (
          <div className="absolute inset-0 z-50 bg-white/95 dark:bg-void-light/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4">
              <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Excluir este artefato?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-xs">
              Esta ação não pode ser desfeita. O registro de "{object.title}" será perdido para sempre.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={cancelDelete}
                className="px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="px-5 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        )}

        {isEditingEntireObject ? (
           <div className="overflow-y-auto w-full h-full p-4 relative">
             <button 
                onClick={() => setIsEditingEntireObject(false)}
                className="absolute top-4 right-4 p-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-full transition-colors z-10"
             >
                <X size={20} className="text-gray-800 dark:text-white" />
             </button>
             <AddObjectForm 
                onSave={handleFullSave} 
                onCancel={() => setIsEditingEntireObject(false)} 
                initialData={object} 
             />
           </div>
        ) : (
          <>
            {/* Header Image */}
            <div className="relative h-72 bg-gray-100 dark:bg-black/50 flex-shrink-0">
          {object.imageUrl ? (
            <img 
              src={object.imageUrl} 
              alt={object.title} 
              className="w-full h-full object-contain"
            />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Box size={64} opacity={0.5} />
             </div>
          )}
          
          <div className="absolute top-4 right-4 flex gap-2">
            <button 
              onClick={handleShare}
              className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              title="Compartilhar"
            >
              {isCopied ? <Check size={20} className="text-green-400" /> : <Share2 size={20} />}
            </button>
            {isAdmin && (
              <button 
                onClick={handleDeleteClick}
                className="p-2 bg-black/50 hover:bg-red-600 text-white rounded-full transition-colors"
                title="Excluir Artefato"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              title="Fechar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Bearer Badge Overlay */}
          {object.bearer && (
            <div className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md border ${
              isConceptBearer 
                ? 'bg-amber-500/80 text-white border-amber-400' 
                : 'bg-blue-600/80 text-white border-blue-400'
            }`}>
              {isConceptBearer ? <Crown size={14} fill="currentColor" /> : <Shield size={14} />}
              <span className="text-xs font-bold uppercase tracking-wider">
                {isConceptBearer ? 'Portador de Conceito' : 'Portador de Objeto'}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          
          {/* Header Data */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                 <span className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">
                   <Calendar size={12} /> {new Date(object.dateAdded).toLocaleDateString()}
                 </span>
                 {object.coordinates && (
                   <span className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold border border-green-200 dark:border-green-800">
                     <MapPin size={12} /> LAT: {object.coordinates.lat.toFixed(4)}, LNG: {object.coordinates.lng.toFixed(4)}
                   </span>
                 )}
              </div>
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">{object.title}</h2>
              
              {/* Chips / Pills for Tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                {object.tags.map((tag, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-neon-purple/10 text-neon-purple border border-neon-purple/20 font-semibold shadow-sm">
                    <Tag size={12} /> {tag}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Map Action Button */}
            {object.coordinates && (
              <button
                onClick={handleOpenMap}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg shadow-blue-500/20 transition-all font-bold text-xs uppercase tracking-wide"
              >
                <MapPin size={16} />
                <span className="hidden sm:inline">Ver no Mapa</span>
                <ExternalLink size={12} className="opacity-70" />
              </button>
            )}
          </div>

          {/* Stats & Bearer Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Threat & Power Level */}
            <div className="p-5 rounded-xl border bg-gray-50 dark:bg-void border-gray-200 dark:border-gray-700 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-widest text-gray-500 mb-2">
                    Grau de Ameaça
                  </h4>
                  {object.threatGrade ? (
                    <span className={`inline-block px-3 py-1 text-xs font-bold uppercase rounded-md border ${
                      object.threatGrade.includes('Especial') ? 'bg-black text-red-500 border-red-500' :
                      object.threatGrade.includes('Classe 1') ? 'bg-red-900 text-white border-red-900' :
                      object.threatGrade.includes('Classe 2') ? 'bg-red-700 text-white border-red-700' :
                      object.threatGrade.includes('Classe 3') ? 'bg-red-500 text-white border-red-500' :
                      object.threatGrade.includes('Classe 4') ? 'bg-gray-600 text-white border-gray-600' :
                      'bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
                    }`}>
                      {object.threatGrade}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-gray-400">Não classificado</span>
                  )}
                </div>
                <div className="text-right">
                  <h4 className="text-xs uppercase font-bold tracking-widest text-gray-500 mb-2">
                    Nível de Poder
                  </h4>
                  {object.powerLevel !== undefined ? (
                    <div className="flex items-center justify-end gap-1 text-2xl font-black text-arcane-red">
                      <Zap size={20} fill="currentColor" />
                      {object.powerLevel.toLocaleString()}
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-gray-400">Desconhecido</span>
                  )}
                </div>
              </div>
              
              {/* Power Level Bar */}
              {object.powerLevel !== undefined && (
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 mt-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full" 
                    style={{ width: `${Math.min((object.powerLevel / 10000) * 100, 100)}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Bearer Detail Section */}
            {object.bearer ? (
              <div className={`p-5 rounded-xl border flex items-center gap-4 ${
                isConceptBearer 
                 ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700/50' 
                 : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-700/50'
              }`}>
                 <div className={`p-3 rounded-full ${
                   isConceptBearer ? 'bg-amber-100 text-amber-600 dark:bg-amber-800 dark:text-amber-200' : 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-200'
                 }`}>
                   <User size={24} />
                 </div>
                 <div>
                   <h4 className={`text-xs uppercase font-bold tracking-widest mb-1 ${
                     isConceptBearer ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
                   }`}>
                     Proprietário Atual
                   </h4>
                   <div className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                     {object.bearer.name}
                     {isConceptBearer && <Crown size={16} className="text-amber-500" fill="currentColor" />}
                   </div>
                   <p className="text-xs opacity-70 mt-1 dark:text-gray-300">
                     Rank: <strong className="uppercase">{object.bearer.rank === 'Concept' ? 'Conceito' : 'Objeto'}</strong>
                   </p>
                 </div>
              </div>
            ) : (
              <div className="p-5 rounded-xl border bg-gray-50 dark:bg-void border-gray-200 dark:border-gray-700 flex items-center gap-4 opacity-70">
                 <div className="p-3 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-500">
                   <User size={24} />
                 </div>
                 <div>
                   <h4 className="text-xs uppercase font-bold tracking-widest text-gray-500 mb-1">
                     Proprietário Atual
                   </h4>
                   <div className="text-lg font-bold text-gray-500">
                     Sem Portador
                   </div>
                 </div>
              </div>
            )}
          </div>

          {/* Custom Fields Grid */}
          {object.customFields && object.customFields.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-void rounded-xl border border-gray-200 dark:border-gray-700">
                {object.customFields.map((field, idx) => (
                    <div key={idx} className="flex flex-col">
                        <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{field.key}</span>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{field.value}</span>
                    </div>
                ))}
            </div>
          )}

          {/* Description */}
          <div className="prose dark:prose-invert max-w-none">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <FileText size={18} /> Descrição
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">
              {object.description}
            </p>

            {/* Containment Log */}
            <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
              <button
                onClick={() => setShowContainmentLog(!showContainmentLog)}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg text-sm font-bold uppercase transition-colors"
              >
                <Shield size={16} />
                {showContainmentLog ? "Ocultar Registro de Contenção" : "Ver Registro de Contenção"}
              </button>
              
              {showContainmentLog && (
                <div className="mt-3 p-4 bg-gray-900 rounded-lg border border-red-900 shadow-inner overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between border-b border-red-900/50 pb-2 mb-2">
                    <h4 className="text-red-500 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                      <AlertTriangle size={14} /> 
                      Arquivo Resguardado
                    </h4>
                    {isAdmin && !isEditingLog && (
                      <button 
                        onClick={() => setIsEditingLog(true)}
                        className="text-xs text-red-400 hover:text-red-300 underline font-mono"
                      >
                        [Editar]
                      </button>
                    )}
                  </div>

                  {isEditingLog && isAdmin ? (
                    <div className="mt-2 animate-in fade-in">
                      <textarea
                        value={editedLog}
                        onChange={(e) => setEditedLog(e.target.value)}
                        className="w-full bg-black/80 border border-red-900/50 text-green-500 font-mono text-sm p-3 rounded resize-none focus:ring-1 focus:ring-red-500 outline-none h-32"
                        placeholder="Insira os procedimentos de contenção aqui..."
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button 
                          onClick={() => {
                            setIsEditingLog(false);
                            setIsEditingEntireObject(true);
                          }}
                          className="px-3 py-1.5 bg-yellow-900/40 hover:bg-yellow-900/80 text-yellow-500 hover:text-yellow-400 rounded text-xs font-mono border border-yellow-800 flex items-center gap-1 transition-colors mr-auto"
                        >
                          <Edit2 size={14} /> [Editar Tudo]
                        </button>
                        <button 
                          onClick={() => {
                            setEditedLog(object.containmentLog || '');
                            setIsEditingLog(false);
                          }}
                          className="px-3 py-1.5 text-xs font-mono text-gray-400 hover:text-white"
                        >
                          [Cancelar]
                        </button>
                        <button 
                          onClick={handleSaveLog}
                          className="px-3 py-1.5 bg-red-900/40 hover:bg-red-900/80 text-white rounded text-xs font-mono border border-red-800 flex items-center gap-1 transition-colors"
                        >
                          <Save size={14} /> [Salvar]
                        </button>
                      </div>
                    </div>
                  ) : (
                    <pre className="text-green-500 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                      {object.containmentLog ? object.containmentLog : "Nenhum procedimento de contenção registrado para este artefato."}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Private Notes */}
          {object.notes && (
             <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 rounded-lg">
                <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-500 mb-1 flex items-center gap-1">
                   <MapPin size={14} /> Notas Privadas / Localização
                </h4>
                <p className="text-sm text-yellow-800/80 dark:text-yellow-200/80">
                   {object.notes}
                </p>
             </div>
          )}

        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default ObjectDetailModal;