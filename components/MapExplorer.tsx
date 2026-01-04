import React, { useState, useMemo } from 'react';
import { MapPin, Navigation, X, Globe } from 'lucide-react';
import { CatalogObject } from '../types';

interface MapExplorerProps {
  catalog: CatalogObject[];
  onObjectSelect: (obj: CatalogObject) => void;
}

// Simplified World Map SVG Path (Mercator-ish)
const WORLD_PATH = "M156.4,28.2l-2.9,3.4l-3.2-1.2l-1.2,1.9l-2.4-0.5l-0.5,1.7l1.2,2.4l-1.9,1.7l-4.1-1.2l-1.7,2.2l-3.6,0.2l-1.5,2.4 l1.2,3.2l-2.9,2.7l0.5,2.7l-2.7,2.2l1.9,4.4l-2.7,2.4l-0.7,3.6l-3.9,1.9l-0.7,2.9l2.7,3.4l-1.7,3.2l0.2,3.6l-3.2,2.7l-0.5,3.9 l2.9,4.4l-1.5,4.9l2.2,2.7l-1.2,4.6l1.9,2.4l-0.5,3.9l-4.1,2.9l0.5,3.4l-2.7,2.7l1.2,3.9l-2.2,2.4l0.7,3.6l-3.4,2.9l0.5,3.4 l-3.2,1.5l1.9,5.8l-1.9,3.6l0.2,4.4l-3.9,3.2l0.5,4.6l-2.4,2.4l1.5,4.4l-2.7,3.6l0.2,5.1l-4.1,3.4l0.2,4.1l-3.9,2.9l1.2,5.3 l-2.9,2.7l1.2,4.1l-3.2,3.2l0.7,4.6l-2.9,2.4l1.2,4.1l-3.2,2.9l0.5,4.6l-3.6,1.9l1.2,4.9l-2.7,2.9l0.7,4.4l-3.6,2.7l1.2,5.1 l-3.2,2.4l0.5,4.9l-3.6,2.2l0.7,4.4l-4.1,2.9l1.2,5.1l-3.4,2.2l0.5,4.6l-3.9,2.4l1.2,5.1l-3.2,2.2l0.5,4.4l-3.6,1.9l0.7,4.6 l-4.1,2.4l1.2,5.3l-3.2,1.9l0.5,4.1l-3.6,1.9l1.2,5.6l-2.2,0.2l-2.2-2.7l-3.6,1.2l-1.9-2.9l-4.4,0.7l-1.5-3.6l-3.6,1.7 l-0.7-3.9l-4.1,1.2l-0.2-3.6l-3.4,1.7l0.5-4.1l-3.9,0.7l1-4.4l-3.6,0.2l1.7-4.1l-3.2-0.5l2.4-4.1l-3.2-1l3.2-3.9l-2.7-1.5 l3.6-3.2l-1.9-2.2l4.6-2.2l-1-2.9l5.1-1.2l-0.2-2.9l5.1-0.2l0.5-3.2l5.1,1l1.2-2.9l4.9,1.9l1.9-2.7l4.6,2.9l2.7-1.9l3.9,3.6 l3.2-1l3.2,3.2l3.2-1.2l2.7,2.9l3.6-0.7l2.2,2.9l3.4-0.5l1.9,2.9l3.6,0.5l1.2,2.9l3.9,1.5l1-3.2l4.1,1.9l1.9-2.7l4.4,2.4 l2.7-2.2l3.6,3.4l3.2-1.7l3.2,3.4l2.9-1.2l2.7,2.9l3.6-0.2l2.2,2.9l3.4,0.2l1.9,3.2l3.6,1l1.2,3.2l4.1,1.7l1.7-2.9l4.1,2.2 l2.7-2.4l3.9,3.4l3.2-1.5l3.4,3.4l2.7-1.5l3.2,3.2l3.4-0.5l2.4,2.9l3.4,0.7l1.9,3.2l3.9,1.5l1.5-3.2l4.1,2.2l1.9-2.7l4.4,2.7 l2.7-2.4l3.9,3.6l3.2-1.5l3.2,3.6l2.9-1.2l3.2,3.2l3.4,0.2l2.2,2.9l3.6,1l1.9,3.4l3.9,1.5l1.5-3.2l4.4,2.2l2.2-2.9l4.4,2.9 l2.9-2.4l3.9,3.6l3.4-1.5l3.4,3.9l2.7-1.7l3.2,3.4l3.4,0.2l2.4,3.2l3.6,1.2l1.9,3.4l3.9,2.2l1.5-3.2l4.4,2.7l2.2-2.9l4.6,3.2 l2.9-2.4l3.9,3.9l3.4-1.7l3.4,3.9l2.7-1.9l3.4,3.4l3.6,0.5l2.4,3.2l3.9,1.5l1.9,3.4l4.4,2.2ZM700,50 L750,80 L720,100 Z";

const MapExplorer: React.FC<MapExplorerProps> = ({ catalog, onObjectSelect }) => {
  const [selectedPin, setSelectedPin] = useState<CatalogObject | null>(null);

  // Generate fake coordinates for demo purposes if not present
  // In a real app, this would use the `item.coordinates`
  const mapItems = useMemo(() => {
    return catalog.map((item, index) => {
      // Deterministic pseudo-random based on ID string
      const hash = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const lat = (hash % 140) - 70; // Range -70 to 70
      const lng = ((hash * 13) % 360) - 180; // Range -180 to 180
      
      return {
        ...item,
        tempCoords: { lat, lng }
      };
    });
  }, [catalog]);

  // Convert Lat/Lng to SVG coordinates (Approximate Equirectangular)
  // SVG ViewBox: 0 0 1000 500
  const getSvgCoords = (lat: number, lng: number) => {
    const x = (lng + 180) * (1000 / 360);
    const y = ((-1 * lat) + 90) * (500 / 180);
    return { x, y };
  };

  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-void-light rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
      
      {/* Header / Overlay Controls */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-void/90 backdrop-blur p-3 rounded-lg shadow-lg border border-gray-200 dark:border-arcane-dark max-w-xs">
        <h2 className="text-xl font-bold dark:text-arcane-red flex items-center gap-2">
          <Globe className="text-arcane-red" />
          Mapeamento Global
        </h2>
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
          Visualização de artefatos rastreados em tempo real.
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs font-mono text-arcane-red">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
          ONLINE - {catalog.length} SINAIS DETECTADOS
        </div>
      </div>

      {/* The Map */}
      <div className="flex-1 bg-[#0a0a0a] relative overflow-hidden cursor-move group">
        
        {/* Grid Background Effect */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#330000 1px, transparent 1px), linear-gradient(90deg, #330000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        <svg viewBox="0 0 1000 500" className="w-full h-full object-cover">
          {/* World Map Silhouette */}
          <path 
            d={WORLD_PATH} 
            fill="none" 
            stroke="#500000" 
            strokeWidth="2"
            className="opacity-60"
          />
          <path 
            d={WORLD_PATH} 
            fill="#2a0a0a" 
            className="opacity-80 hover:opacity-100 transition-opacity duration-500"
          />

          {/* Pins */}
          {mapItems.map((item) => {
            const { x, y } = getSvgCoords(item.tempCoords.lat, item.tempCoords.lng);
            const isSelected = selectedPin?.id === item.id;

            return (
              <g 
                key={item.id} 
                className="cursor-pointer transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPin(item);
                }}
              >
                {/* Ripple Effect */}
                <circle cx={x} cy={y} r={isSelected ? 15 : 0} className="fill-arcane-red opacity-20 animate-ping" />
                
                {/* Pin Head */}
                <circle 
                  cx={x} 
                  cy={y} 
                  r={isSelected ? 6 : 3} 
                  className={`transition-all duration-300 ${isSelected ? 'fill-white stroke-arcane-red stroke-2' : 'fill-arcane-red hover:fill-red-400'}`} 
                />
                
                {/* Label on Hover */}
                {isSelected && (
                   <line x1={x} y1={y} x2={x + 20} y2={y - 20} stroke="white" strokeWidth="1" />
                )}
              </g>
            );
          })}
        </svg>

        {/* Selected Item Floating Card */}
        {selectedPin && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 md:translate-x-10 md:-translate-y-20 z-20 w-64 bg-white dark:bg-void border-2 border-arcane-red rounded-xl shadow-2xl p-3 animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setSelectedPin(null)}
              className="absolute -top-2 -right-2 bg-arcane-red text-white rounded-full p-1 hover:bg-red-700"
            >
              <X size={14} />
            </button>
            
            <div className="h-32 w-full bg-gray-200 dark:bg-black rounded-lg mb-2 overflow-hidden">
              {selectedPin.imageUrl ? (
                <img src={selectedPin.imageUrl} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Sem Imagem</div>
              )}
            </div>
            
            <h3 className="font-bold text-gray-900 dark:text-white truncate">{selectedPin.title}</h3>
            <p className="text-xs text-arcane-red font-mono mb-2">
              LAT: {selectedPin.tempCoords.lat.toFixed(4)} | LNG: {selectedPin.tempCoords.lng.toFixed(4)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
              {selectedPin.description}
            </p>
            
            <button 
              onClick={() => onObjectSelect(selectedPin)}
              className="w-full py-1.5 bg-arcane-red hover:bg-red-700 text-white text-xs font-bold rounded uppercase tracking-wider transition-colors"
            >
              Acessar Arquivo
            </button>
          </div>
        )}

      </div>
      
      {/* Footer Info */}
      <div className="bg-white dark:bg-void border-t border-gray-200 dark:border-gray-800 p-2 flex justify-between items-center text-xs text-gray-500">
         <span>Sistema de Rastreamento Arcano v4.0</span>
         <span className="flex items-center gap-1"><Navigation size={10} /> Projeção: Vetorial</span>
      </div>
    </div>
  );
};

export default MapExplorer;