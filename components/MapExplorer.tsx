import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Navigation, X, Globe as GlobeIcon } from 'lucide-react';
import { CatalogObject } from '../types';
import Globe from 'react-globe.gl';

interface MapExplorerProps {
  catalog: CatalogObject[];
  onObjectSelect: (obj: CatalogObject) => void;
}

interface MapItem extends CatalogObject {
  tempCoords: {
    lat: number;
    lng: number;
  };
}

const MapExplorer: React.FC<MapExplorerProps> = ({ catalog, onObjectSelect }) => {
  const [selectedPin, setSelectedPin] = useState<MapItem | null>(null);
  const globeEl = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle resize for the globe
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    
    // Initial dimensions
    setDimensions({
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight
    });

    return () => resizeObserver.disconnect();
  }, []);

  // Generate fake coordinates for demo purposes if not present
  const mapItems: MapItem[] = useMemo(() => {
    return catalog.map((item) => {
      // Prioritize existing coordinates, else generate deterministic pseudo-random ones
      if (item.coordinates) {
          return {
              ...item,
              tempCoords: { lat: item.coordinates.lat, lng: item.coordinates.lng }
          };
      }

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

  // Point globe to selected pin
  useEffect(() => {
    if (selectedPin && globeEl.current) {
      globeEl.current.pointOfView({ 
        lat: selectedPin.tempCoords.lat, 
        lng: selectedPin.tempCoords.lng, 
        altitude: 1.5 
      }, 1000);
    }
  }, [selectedPin]);

  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-void-light rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
      
      {/* Header / Overlay Controls */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-void/90 backdrop-blur p-3 rounded-lg shadow-lg border border-gray-200 dark:border-arcane-dark max-w-xs">
        <h2 className="text-xl font-bold dark:text-arcane-red flex items-center gap-2">
          <GlobeIcon className="text-arcane-red" />
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

      {/* The 3D Globe */}
      <div ref={containerRef} className="flex-1 min-h-[500px] w-full bg-[#050505] relative overflow-hidden cursor-move flex items-center justify-center">
        {dimensions.width === 0 && (
          <div className="text-white z-50">Carregando mapa... (Largura: {dimensions.width}, Altura: {dimensions.height})</div>
        )}
        {dimensions.width > 0 && dimensions.height > 0 && (
          <Globe
            ref={globeEl}
            width={dimensions.width}
            height={dimensions.height}
            globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
            backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
            showGlobe={true}
            showAtmosphere={true}
            
            // Points (Markers)
            pointsData={mapItems}
            pointLat={(d: any) => d.tempCoords.lat}
            pointLng={(d: any) => d.tempCoords.lng}
            pointColor={(d: any) => selectedPin?.id === d.id ? '#ffffff' : '#dc2626'}
            pointAltitude={(d: any) => selectedPin?.id === d.id ? 0.1 : 0.05}
            pointRadius={(d: any) => selectedPin?.id === d.id ? 0.8 : 0.4}
            pointsMerge={false}
            onPointClick={(point: any) => setSelectedPin(point)}
            
            // Labels
            labelsData={mapItems}
            labelLat={(d: any) => d.tempCoords.lat}
            labelLng={(d: any) => d.tempCoords.lng}
            labelText={(d: any) => d.title}
            labelSize={(d: any) => selectedPin?.id === d.id ? 2 : 1.5}
            labelDotRadius={0.2}
            labelColor={(d: any) => selectedPin?.id === d.id ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'}
            labelResolution={2}
            labelAltitude={0.06}
            onLabelClick={(label: any) => setSelectedPin(label)}
            
            // Rings for selected item
            ringsData={selectedPin ? [selectedPin] : []}
            ringLat={(d: any) => d.tempCoords.lat}
            ringLng={(d: any) => d.tempCoords.lng}
            ringColor={() => '#dc2626'}
            ringMaxRadius={5}
            ringPropagationSpeed={2}
            ringRepeatPeriod={1000}
          />
        )}

        {/* Selected Item Floating Card */}
        {selectedPin && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 md:left-auto md:right-4 md:translate-x-0 z-20 w-72 max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-void/95 backdrop-blur-md border-2 border-arcane-red rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 md:slide-in-from-right-4 duration-300">
            <button 
              onClick={() => setSelectedPin(null)}
              className="absolute -top-3 -right-3 bg-arcane-red text-white rounded-full p-1.5 hover:bg-red-700 shadow-lg transition-transform hover:scale-110"
            >
              <X size={16} />
            </button>
            
            <div className="h-36 w-full bg-gray-200 dark:bg-black rounded-lg mb-3 overflow-hidden border border-gray-300 dark:border-gray-800">
              {selectedPin.imageUrl ? (
                <img src={selectedPin.imageUrl} className="w-full h-full object-cover" alt={selectedPin.title} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Sem Imagem</div>
              )}
            </div>
            
            <h3 className="font-black text-lg text-gray-900 dark:text-white truncate uppercase tracking-tight">{selectedPin.title}</h3>
            
            <div className="bg-gray-100 dark:bg-black/50 rounded p-2 my-2 border border-gray-200 dark:border-gray-800">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Coordenadas de Rastreamento</p>
              <p className="text-sm text-arcane-red font-mono font-bold">
                {Math.abs(selectedPin.tempCoords.lat).toFixed(4)}° {selectedPin.tempCoords.lat >= 0 ? 'N' : 'S'}
                <br />
                {Math.abs(selectedPin.tempCoords.lng).toFixed(4)}° {selectedPin.tempCoords.lng >= 0 ? 'E' : 'W'}
              </p>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 font-medium">
              {selectedPin.description}
            </p>
            
            <button 
              onClick={() => onObjectSelect(selectedPin)}
              className="w-full py-2 bg-arcane-red hover:bg-red-700 text-white text-xs font-black rounded uppercase tracking-widest transition-colors shadow-lg shadow-red-900/20"
            >
              Acessar Arquivo Completo
            </button>
          </div>
        )}

      </div>
      
      {/* Footer Info */}
      <div className="bg-white dark:bg-void border-t border-gray-200 dark:border-gray-800 p-2 flex justify-between items-center text-xs text-gray-500">
         <span>Sistema de Rastreamento Arcano v4.0</span>
         <span className="flex items-center gap-1"><Navigation size={10} /> Projeção: Satélite 3D (Google Earth)</span>
      </div>
    </div>
  );
};

export default MapExplorer;