import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw, AlertTriangle, Zap, Wind, Droplets, Flame, AlertOctagon } from 'lucide-react';
import { fetchGlobalDisasters } from '../services/geminiService';
import { DisasterEvent } from '../types';

const DisasterFeed: React.FC = () => {
  const [events, setEvents] = useState<DisasterEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const data = await fetchGlobalDisasters();
      setEvents(data.map((item: any, index: number) => ({
        ...item,
        id: index.toString()
      })));
    } catch (error) {
      console.error("Erro ao carregar feed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'bg-red-600 text-white animate-pulse';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('fogo') || t.includes('incêndio')) return <Flame size={18} />;
    if (t.includes('tempestade') || t.includes('furacão')) return <Wind size={18} />;
    if (t.includes('inundação') || t.includes('tsunami')) return <Droplets size={18} />;
    if (t.includes('energia') || t.includes('raio')) return <Zap size={18} />;
    return <AlertTriangle size={18} />;
  };

  return (
    <div className="h-full flex flex-col space-y-4 pb-24">
      <div className="bg-white dark:bg-void-light p-6 rounded-xl shadow-lg border-l-4 border-arcane-red dark:border-red-600">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
            <Radio className="text-arcane-red animate-pulse" />
            Sinais de Interceptação
          </h2>
          <button 
            onClick={loadFeed}
            disabled={loading}
            className="p-2 bg-gray-100 dark:bg-void hover:bg-gray-200 dark:hover:bg-red-900/30 rounded-full transition-all"
          >
            <RefreshCw size={20} className={`text-gray-600 dark:text-gray-300 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
          Monitoramento global de anomalias e catástrofes em tempo real.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {loading && events.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <Radio size={48} className="mx-auto mb-4 animate-ping text-arcane-red" />
            <p className="font-bold">Sincronizando frequências...</p>
          </div>
        ) : (
          events.map((event) => (
            <div 
              key={event.id}
              className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800 p-4 rounded-lg shadow-sm hover:border-red-500/50 transition-colors group relative overflow-hidden"
            >
              {/* Background Effect for Critical */}
              {event.severity === 'critical' && (
                <div className="absolute inset-0 bg-red-500/5 pointer-events-none animate-pulse" />
              )}

              <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${getSeverityColor(event.severity)}`}>
                    {event.severity}
                  </span>
                  <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                    <AlertOctagon size={10} /> {event.timestamp}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-4 relative z-10">
                <div className="p-3 bg-gray-100 dark:bg-void rounded-lg text-gray-600 dark:text-red-500">
                  {getIcon(event.type)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight mb-1">
                    {event.type} <span className="text-gray-400 mx-1">|</span> <span className="text-arcane-red uppercase">{event.location}</span>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DisasterFeed;
