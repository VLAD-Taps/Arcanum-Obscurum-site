import React, { useState } from 'react';
import { X, Calendar, MapPin, Tag, FileText, Box, Trash2, AlertTriangle, User, Crown, Shield, ExternalLink } from 'lucide-react';
import { CatalogObject } from '../types';

interface ObjectDetailModalProps {
  object: CatalogObject | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  originCoords: { x: number; y: number } | null;
}

const ObjectDetailModal: React.FC<ObjectDetailModalProps> = ({ object, isOpen, onClose, onDelete, originCoords }) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (!isOpen || !object) return null;

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
              onClick={handleDeleteClick}
              className="p-2 bg-black/50 hover:bg-red-600 text-white rounded-full transition-colors"
              title="Excluir Artefato"
            >
              <Trash2 size={20} />
            </button>
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

          {/* Bearer Detail Section */}
          {object.bearer && (
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
                    {isConceptBearer 
                      ? "Este portador detém poder sobre um Conceito. Nível de ameaça: Extremo." 
                      : "Este portador detém um Objeto singular. Nível de ameaça: Moderado."}
                  </p>
                </div>
             </div>
          )}

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
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {object.description}
            </p>
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
      </div>
    </div>
  );
};

export default ObjectDetailModal;