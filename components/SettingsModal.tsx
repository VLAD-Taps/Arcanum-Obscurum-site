import React, { useState } from 'react';
import { X, Moon, Sun, Settings, Bell, Tag, AlertTriangle, Trash2, Plus } from 'lucide-react';
import { NotificationPreferences } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  notificationPrefs?: NotificationPreferences;
  onUpdatePrefs?: (prefs: NotificationPreferences) => void;
}

const THREAT_GRADES = [
  'Classe Especial',
  'Classe 1',
  'Classe 2',
  'Classe 3',
  'Classe 4'
];

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  isDark, 
  toggleTheme,
  notificationPrefs,
  onUpdatePrefs
}) => {
  const [newTag, setNewTag] = useState('');

  if (!isOpen) return null;

  const handleToggleNotifications = () => {
    if (notificationPrefs && onUpdatePrefs) {
      onUpdatePrefs({
        ...notificationPrefs,
        enabled: !notificationPrefs.enabled
      });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && notificationPrefs && onUpdatePrefs) {
      if (!notificationPrefs.watchedTags.includes(newTag.trim())) {
        onUpdatePrefs({
          ...notificationPrefs,
          watchedTags: [...notificationPrefs.watchedTags, newTag.trim()]
        });
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (notificationPrefs && onUpdatePrefs) {
      onUpdatePrefs({
        ...notificationPrefs,
        watchedTags: notificationPrefs.watchedTags.filter(t => t !== tagToRemove)
      });
    }
  };

  const handleToggleGrade = (grade: string) => {
    if (notificationPrefs && onUpdatePrefs) {
      const currentGrades = notificationPrefs.watchedGrades;
      let newGrades;
      if (currentGrades.includes(grade)) {
        newGrades = currentGrades.filter(g => g !== grade);
      } else {
        newGrades = [...currentGrades, grade];
      }
      onUpdatePrefs({
        ...notificationPrefs,
        watchedGrades: newGrades
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-void-light w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-void sticky top-0 z-10">
          <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white">
            <Settings className="w-5 h-5 text-gray-500" />
            Configurações do Sistema
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors dark:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Theme Setting */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Moon size={16} /> Aparência
              </h3>
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

          {/* Notification Settings */}
          {notificationPrefs && (
            <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Bell size={16} className="text-arcane-red" /> Protocolos de Vigilância
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Alertar novos registros suspeitos</p>
                </div>
                <button
                  onClick={handleToggleNotifications}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    notificationPrefs.enabled ? 'bg-arcane-red' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      notificationPrefs.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {notificationPrefs.enabled && (
                <div className="space-y-4 bg-gray-50 dark:bg-black/20 p-4 rounded-lg animate-in fade-in slide-in-from-top-2">
                  
                  {/* Tag Watchlist */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 block">
                      Monitorar Tags
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input 
                        type="text" 
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="Ex: maldição"
                        className="flex-1 text-sm p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-void outline-none focus:border-arcane-red dark:text-white"
                      />
                      <button 
                        onClick={handleAddTag}
                        disabled={!newTag.trim()}
                        className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-arcane-red hover:text-white rounded transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {notificationPrefs.watchedTags.length === 0 && (
                        <span className="text-xs text-gray-400 italic">Nenhuma tag monitorada.</span>
                      )}
                      {notificationPrefs.watchedTags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-2 py-1 rounded-full dark:text-gray-200">
                          <Tag size={10} /> {tag}
                          <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 ml-1">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Threat Grade Watchlist */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 block">
                      Monitorar Níveis de Ameaça
                    </label>
                    <div className="flex flex-col gap-2">
                      {THREAT_GRADES.map(grade => {
                        const isSelected = notificationPrefs.watchedGrades.includes(grade);
                        return (
                          <button
                            key={grade}
                            onClick={() => handleToggleGrade(grade)}
                            className={`flex items-center justify-between p-2 rounded text-xs font-bold transition-all border ${
                              isSelected 
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' 
                                : 'bg-white dark:bg-void border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <AlertTriangle size={12} className={isSelected ? 'opacity-100' : 'opacity-30'} />
                              {grade}
                            </span>
                            {isSelected && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
             <p className="text-xs text-center text-gray-400">
               ARCANUM OBSCURUM v1.1
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;