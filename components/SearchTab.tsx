import React, { useState, useMemo } from 'react';
import { Search, MapPin, Tag, User, Box, Crown, Shield } from 'lucide-react';
import { CatalogObject } from '../types';

interface SearchTabProps {
  catalog: CatalogObject[];
  onObjectSelect: (obj: CatalogObject) => void;
}

const SearchTab: React.FC<SearchTabProps> = ({ catalog, onObjectSelect }) => {
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();

    return catalog.filter((item) => {
      const inTitle = item.title.toLowerCase().includes(lowerQuery);
      const inDesc = item.description.toLowerCase().includes(lowerQuery);
      const inTags = item.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
      
      // Busca no nome do portador e no rank (em inglês ou português)
      const inBearer = item.bearer ? (
        item.bearer.name.toLowerCase().includes(lowerQuery) ||
        item.bearer.rank.toLowerCase().includes(lowerQuery) ||
        (item.bearer.rank === 'Concept' ? 'conceito' : 'objeto').includes(lowerQuery)
      ) : false;

      const inNotes = item.notes?.toLowerCase().includes(lowerQuery);

      return inTitle || inDesc || inTags || inBearer || inNotes;
    });
  }, [query, catalog]);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="bg-white dark:bg-void-light p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-black text-arcane-red uppercase tracking-wide mb-4 flex items-center gap-2">
          <Search className="w-6 h-6" />
          Investigação de Arquivos
        </h2>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, código, portador ou características..."
            className="w-full pl-12 pr-4 py-4 rounded-lg bg-gray-50 dark:bg-void border-2 border-gray-200 dark:border-red-900/30 focus:border-arcane-red focus:ring-0 outline-none transition-colors text-lg dark:text-white font-medium placeholder-gray-400"
            autoFocus
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-red-700" size={24} />
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">
          {query && `${filteredItems.length} resultados encontrados nos registros.`}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {query === '' ? (
          <div className="flex flex-col items-center justify-center h-64 opacity-40">
            <Search size={64} className="text-gray-300 dark:text-red-900 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Aguardando parâmetros de busca...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-400 dark:text-red-900/50 font-black text-xl">NENHUM DADO ENCONTRADO</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => onObjectSelect(item)}
                className="bg-white dark:bg-void-light p-4 rounded-lg shadow-sm border border-gray-100 dark:border-red-900/20 hover:border-arcane-red cursor-pointer transition-all flex gap-4 group"
              >
                <div className="w-20 h-20 bg-gray-200 dark:bg-black rounded-md flex-shrink-0 overflow-hidden relative">
                   {item.imageUrl ? (
                     <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-400">
                       <Box size={24} />
                     </div>
                   )}
                   {item.bearer && (
                     <div className={`absolute top-0 right-0 p-1 ${item.bearer.rank === 'Concept' ? 'bg-black text-red-500' : 'bg-blue-600 text-white'}`}>
                       {item.bearer.rank === 'Concept' ? <Crown size={10} /> : <Shield size={10} />}
                     </div>
                   )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate pr-2 uppercase">{item.title}</h3>
                    <span className="text-[10px] bg-gray-100 dark:bg-void px-2 py-0.5 rounded text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {new Date(item.dateAdded).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {item.bearer && (
                    <div className="flex items-center gap-1 text-xs text-arcane-red font-semibold mb-1">
                      <User size={10} /> {item.bearer.name}
                    </div>
                  )}

                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-2 overflow-hidden">
                    {item.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-[10px] flex items-center gap-0.5 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-black/30 px-1.5 py-0.5 rounded">
                        <Tag size={8} /> {tag}
                      </span>
                    ))}
                    {item.coordinates && (
                       <span className="text-[10px] text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 ml-auto">
                         <MapPin size={8} /> GPS
                       </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchTab;