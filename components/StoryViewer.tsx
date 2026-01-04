import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Story } from '../types';

interface StoryViewerProps {
  stories: Story[];
  initialStoryIndex: number;
  onClose: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ stories, initialStoryIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const DURATION = 5000; // 5 seconds per story
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>();

  const currentStory = stories[currentIndex];

  useEffect(() => {
    setProgress(0);
    startTimeRef.current = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - (startTimeRef.current || now);
      const newProgress = (elapsed / DURATION) * 100;

      if (newProgress >= 100) {
        handleNext();
      } else {
        setProgress(newProgress);
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      // Reset current story if at start
      setProgress(0);
      startTimeRef.current = Date.now();
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black flex items-center justify-center animate-in fade-in duration-300">
      
      {/* Background blurred for desktop style */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl scale-110"
        style={{ backgroundImage: `url(${currentStory.imageUrl})` }}
      />

      {/* Main Container */}
      <div className="relative w-full h-full md:max-w-md md:h-[90vh] md:rounded-xl overflow-hidden bg-gray-900 shadow-2xl">
        
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
          {stories.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ 
                  width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-20 px-4 pt-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-neon-purple p-0.5">
               <img src={currentStory.imageUrl} className="w-full h-full rounded-full object-cover" />
            </div>
            <span className="text-white font-semibold text-sm drop-shadow-md">{currentStory.title}</span>
            <span className="text-gray-300 text-xs drop-shadow-md">
              {new Date(currentStory.date).toLocaleDateString(undefined, { hour: '2-digit', minute:'2-digit' })}
            </span>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1">
            <X size={24} />
          </button>
        </div>

        {/* Image Content */}
        <img 
          src={currentStory.imageUrl} 
          alt={currentStory.title} 
          className="w-full h-full object-cover animate-in zoom-in-105 duration-[5000ms] ease-linear"
        />

        {/* Navigation Overlays */}
        <div className="absolute inset-0 z-10 flex">
          <div className="w-1/3 h-full" onClick={handlePrev}></div>
          <div className="w-2/3 h-full" onClick={handleNext}></div>
        </div>

        {/* Caption Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent z-10 flex items-end p-6">
           <p className="text-white text-lg font-medium mb-4">
             Novo artefato descoberto: {currentStory.title}
           </p>
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;