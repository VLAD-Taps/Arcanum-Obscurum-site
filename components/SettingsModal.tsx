import React from 'react';
import { X, Moon, Sun, Settings } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, isDark, toggleTheme }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-void-light w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-void">
          <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white">
            <Settings className="w-5 h-5 text-gray-500" />
            Configurações
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors dark:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Theme Setting */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Aparência</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Alternar entre modo claro e escuro</p>
            </div>
            
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-neon-purple focus:ring-offset-2 ${
                isDark ? 'bg-neon-purple' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  isDark ? 'translate-x-7' : 'translate-x-1'
                } flex items-center justify-center`}
              >
                {isDark ? <Moon size={12} className="text-neon-purple" /> : <Sun size={12} className="text-yellow-500" />}
              </span>
            </button>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
             <p className="text-xs text-center text-gray-400">
               ARCANUM OBSCURUM v1.0
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;