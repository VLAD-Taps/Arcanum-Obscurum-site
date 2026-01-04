import React, { useState } from 'react';
import { Shield, AlertTriangle, Lock, Unlock, Edit2, Save, X, Skull } from 'lucide-react';
import { ThreatLevel } from '../types';

const INITIAL_LEVELS: ThreatLevel[] = [
  { id: '1', grade: 'Classe Especial', color: 'bg-black text-red-500 border-red-500', description: 'Anomalias capazes de destruir cidades inteiras. O contato deve ser evitado a todo custo.', clearanceLevel: 5 },
  { id: '2', grade: 'Classe 1', color: 'bg-red-900 text-white', description: 'Ameaças de alto nível. Requer feiticeiros de elite para contenção.', clearanceLevel: 4 },
  { id: '3', grade: 'Classe 2', color: 'bg-red-700 text-white', description: 'Perigo significativo para civis. Habitualmente letais.', clearanceLevel: 3 },
  { id: '4', grade: 'Classe 3', color: 'bg-red-500 text-white', description: 'Ameaças convencionais. Podem causar ferimentos graves.', clearanceLevel: 2 },
  { id: '5', grade: 'Classe 4', color: 'bg-gray-600 text-white', description: 'Baixo risco. Geralmente travessuras ou maldições menores.', clearanceLevel: 1 },
];

const ThreatLevels: React.FC = () => {
  const [levels, setLevels] = useState<ThreatLevel[]>(INITIAL_LEVELS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ThreatLevel>>({});

  const toggleAdmin = () => {
    setIsAdmin(!isAdmin);
    setEditingId(null);
  };

  const startEdit = (level: ThreatLevel) => {
    setEditingId(level.id);
    setEditForm(level);
  };

  const saveEdit = () => {
    setLevels(prev => prev.map(l => l.id === editingId ? { ...l, ...editForm } as ThreatLevel : l));
    setEditingId(null);
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-white dark:bg-void-light rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
      
      <div className="flex justify-between items-center mb-8 border-b border-gray-200 dark:border-red-900/30 pb-4">
        <div>
           <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
             <Skull className="text-arcane-red w-8 h-8" />
             Classificação de Ameaças
           </h2>
           <p className="text-gray-500 dark:text-gray-400 mt-1">Diretrizes oficiais para objetos e conceitos amaldiçoados.</p>
        </div>

        <button 
          onClick={toggleAdmin}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
            isAdmin 
              ? 'bg-arcane-red text-white shadow-lg shadow-red-500/30' 
              : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          {isAdmin ? <Unlock size={16} /> : <Lock size={16} />}
          {isAdmin ? 'MODO ADMIN ATIVO' : 'VISUALIZAÇÃO PÚBLICA'}
        </button>
      </div>

      <div className="space-y-6">
        {levels.map((level) => (
          <div 
            key={level.id} 
            className={`relative p-6 rounded-xl border-l-8 shadow-sm transition-all hover:shadow-md ${
              editingId === level.id 
                ? 'bg-gray-50 dark:bg-black border-arcane-red ring-2 ring-arcane-red' 
                : 'bg-white dark:bg-void border-gray-300 dark:border-gray-700 hover:border-l-arcane-red'
            }`}
            style={{ borderLeftColor: editingId !== level.id && level.grade.includes('Especial') ? '#dc2626' : undefined }}
          >
            {isAdmin && editingId !== level.id && (
              <button 
                onClick={() => startEdit(level)}
                className="absolute top-4 right-4 text-gray-400 hover:text-arcane-red"
              >
                <Edit2 size={18} />
              </button>
            )}

            {editingId === level.id ? (
              <div className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome da Classe</label>
                   <input 
                     type="text" 
                     value={editForm.grade || ''} 
                     onChange={(e) => setEditForm({...editForm, grade: e.target.value})}
                     className="w-full p-2 border rounded bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição do Protocolo</label>
                   <textarea 
                     value={editForm.description || ''} 
                     onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                     className="w-full p-2 border rounded bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700 h-24"
                   />
                 </div>
                 <div className="flex justify-end gap-2">
                   <button onClick={() => setEditingId(null)} className="p-2 text-gray-500"><X size={20}/></button>
                   <button onClick={saveEdit} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded font-bold"><Save size={16}/> Salvar</button>
                 </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className={`
                   w-full md:w-48 py-3 px-4 rounded-lg font-black text-center uppercase tracking-wider shadow-inner text-sm flex-shrink-0
                   ${level.grade.includes('Especial') ? 'bg-black text-red-500 border border-red-600' : 'bg-arcane-red text-white'}
                `}>
                  {level.grade}
                </div>
                
                <div className="flex-1">
                   <p className="text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
                     {level.description}
                   </p>
                   {level.clearanceLevel >= 4 && (
                     <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">
                       <AlertTriangle size={10} />
                       PROTOCOLO DE CONTENÇÃO MÁXIMA
                     </div>
                   )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {isAdmin && (
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700 rounded text-center">
           <p className="text-sm text-yellow-800 dark:text-yellow-500 font-semibold">
             Você está logado como Administrador. Todas as alterações são registradas nos arquivos akashicos.
           </p>
        </div>
      )}
    </div>
  );
};

export default ThreatLevels;