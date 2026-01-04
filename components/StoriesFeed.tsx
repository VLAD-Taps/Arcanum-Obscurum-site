import React, { useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Story } from '../types';

interface StoriesFeedProps {
  stories: Story[];
  onStoryClick: (index: number) => void;
  onAddStory: () => void;
}

const StoriesFeed: React.FC<StoriesFeedProps> = ({ stories, onStoryClick, onAddStory }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; // Quantidade de scroll por clique
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative w-full group">
      {/* Botão Esquerdo (Visível apenas em Desktop ao passar o mouse) */}
      <button 
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/80 dark:bg-black/60 hover:bg-white dark:hover:bg-black text-gray-800 dark:text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hidden md:flex backdrop-blur-sm -ml-2 border border-gray-200 dark:border-gray-700"
        aria-label="Rolar para esquerda"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Container de Rolagem */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1 scrollbar-hide snap-x scroll-smooth"
      >
        {/* Add Story Button */}
        <div className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer snap-start group/item" onClick={onAddStory}>
          <div className="w-[68px] h-[68px] rounded-full p-[2px] border-2 border-dashed border-gray-300 dark:border-gray-600 group-hover/item:border-neon-purple transition-colors relative">
            <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Plus className="text-gray-400 group-hover/item:text-neon-purple" />
            </div>
            <div className="absolute bottom-0 right-0 bg-neon-purple text-white rounded-full p-0.5 border-2 border-white dark:border-void">
               <Plus size={12} />
            </div>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400 truncate w-full text-center">Novo</span>
        </div>

        {/* Stories List */}
        {stories.map((story, index) => (
          <div 
            key={story.id} 
            className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer snap-start group/item"
            onClick={() => onStoryClick(index)}
          >
            <div className={`w-[68px] h-[68px] rounded-full p-[3px] ${story.isSeen ? 'bg-gray-300 dark:bg-gray-700' : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600'}`}>
              <div className="w-full h-full rounded-full border-2 border-white dark:border-void overflow-hidden bg-white dark:bg-black">
                <img 
                  src={story.imageUrl} 
                  alt={story.title} 
                  className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300" 
                />
              </div>
            </div>
            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate w-[74px] text-center">
              {story.title}
            </span>
          </div>
        ))}
      </div>

      {/* Botão Direito (Visível apenas em Desktop ao passar o mouse) */}
      <button 
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/80 dark:bg-black/60 hover:bg-white dark:hover:bg-black text-gray-800 dark:text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hidden md:flex backdrop-blur-sm -mr-2 border border-gray-200 dark:border-gray-700"
        aria-label="Rolar para direita"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default StoriesFeed;