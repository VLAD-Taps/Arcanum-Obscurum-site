import React, { useState } from 'react';
import { Shield, AlertTriangle, Lock, Unlock, Edit2, Save, X, Skull, ArrowLeft, Zap, User, Box } from 'lucide-react';
import { ThreatLevel, CatalogObject } from '../types';

const INITIAL_LEVELS: ThreatLevel[] = [
  { id: '1', grade: 'Classe Especial', color: 'bg-black text-red-500 border-red-500', description: 'Anomalias capazes de destruir países ou continentes. O contato deve ser evitado a todo custo.', clearanceLevel: 5 },
  { id: '2', grade: 'Classe 1', color: 'bg-red-900 text-white', description: 'Ameaças de alto nível. Requer agentes de elite para contenção.', clearanceLevel: 4 },
  { id: '3', grade: 'Classe 2', color: 'bg-red-700 text-white', description: 'Perigo significativo para civis. Habitualmente letais.', clearanceLevel: 3 },
  { id: '4', grade: 'Classe 3', color: 'bg-red-500 text-white', description: 'Ameaças convencionais. Podem causar ferimentos graves.', clearanceLevel: 2 },
  { id: '5', grade: 'Classe 4', color: 'bg-gray-600 text-white', description: 'Baixo risco. Geralmente travessuras ou maldições menores.', clearanceLevel: 1 },
];

interface ThreatLevelsProps {
  catalog: CatalogObject[];
}

const ThreatLevels: React.FC<ThreatLevelsProps> = ({ catalog }) => {
  const [levels, setLevels] = useState<ThreatLevel[]>(INITIAL_LEVELS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ThreatLevel>>({});
  
  // State for viewing filtered objects by grade
  const [viewingGrade, setViewingGrade] = useState<string | null>(null);

  const toggleAdmin = () => {
    if (isAdmin) {
      setIsAdmin(false);
      setEditingId(null);
    } else {
      setTimeout(() => {
        const password = window.prompt("INSIRA A CREDENCIAL DE SEGURANÇA (NÍVEL 5):");
        if (password === '411521096') {
          setIsAdmin(true);
        } else if (password !== null) {
          alert("ACESSO NEGADO. Protocolo de segurança ativado.");
        }
      }, 50);
    }
  };

  const startEdit = (e: React.MouseEvent, level: ThreatLevel) => {
    e.stopPropagation(); // Prevent opening the filtered view
    setEditingId(level.id);
    setEditForm(level);
  };

  const saveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLevels(prev => prev.map(l => l.id === editingId ? { ...l, ...editForm } as ThreatLevel : l));
    setEditingId(null);
  };

  // Filter and sort objects based on the selected grade
  const getObjectsByGrade = (grade: string) => {
    return catalog
      .filter(obj => obj.threatGrade === grade)
      .sort((a, b) => (b.powerLevel || 0) - (a.powerLevel || 0));
  };

  const filteredObjects = viewingGrade ? getObjectsByGrade(viewingGrade) : [];
  const currentLevelInfo = levels.find(l => l.grade === viewingGrade);

  return (
    <div className="min-h-full p-6 bg-white dark:bg-void-light rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 relative">
      
      <div className="flex justify-between items-center mb-8 border-b border-gray-200 dark:border-red-900/30 pb-4 sticky top-0 bg-white dark:bg-void-light z-10">
        <div>
           <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
             <Skull className="text-arcane-red w-8 h-8" />
             {viewingGrade ? viewingGrade : 'Classificação de Ameaças'}
           </h2>
           <p className="text-gray-500 dark:text-gray-400 mt-1">
             {viewingGrade ? 'Relatório detalhado de entidades registradas.' : 'Diretrizes oficiais para objetos e conceitos amaldiçoados.'}
           </p>
        </div>

        <div className="flex items-center gap-3">
            {viewingGrade && (
                <button
                    onClick={() => setViewingGrade(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-bold text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                    <ArrowLeft size={16} /> VOLTAR
                </button>
            )}

            <button 
              type="button"
              onClick={toggleAdmin}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer relative z-20 ${
                isAdmin 
                  ? 'bg-arcane-red text-white shadow-lg shadow-red-500/30 hover:bg-red-700' 
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {isAdmin ? <Unlock size={16} /> : <Lock size={16} />}
              {isAdmin ? 'ADMIN' : 'ACESSAR'}
            </button>
        </div>
      </div>

      {viewingGrade ? (
        // FILTERED VIEW
        <div className="space-y-6 animate-in slide-in-from-right-10 duration-300">
             {filteredObjects.length === 0 ? (
                 <div className="text-center py-20 opacity-50 border-2 border-dashed border-gray-300 dark:border-red-900/30 rounded-xl">
                    <Skull size={64} className="mx-auto text-gray-400 dark:text-red-900 mb-4" />
                    <p className="text-xl dark:text-gray-300 font-bold">Nenhum registro encontrado.</p>
                    <p className="text-sm dark:text-gray-500">Esta categoria está atualmente contida ou vazia.</p>
                 </div>
             ) : (
                 <div className="flex flex-col gap-6">
                     <div className={`p-4 rounded-lg border-l-4 ${currentLevelInfo?.grade.includes('Especial') ? 'bg-red-900/10 border-red-600' : 'bg-gray-100 dark:bg-gray-800 border-gray-500'}`}>
                         <h3 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-70">Diretriz da Classe</h3>
                         <p className="italic">{currentLevelInfo?.description}</p>
                     </div>

                     {filteredObjects.map((obj, index) => (
                         <div key={obj.id} className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden flex flex-col md:flex-row shadow-lg hover:border-arcane-red transition-all">
                             <div className="md:w-48 h-48 md:h-auto relative bg-gray-200 dark:bg-void">
                                 {obj.imageUrl ? (
                                     <img src={obj.imageUrl} alt={obj.title} className="w-full h-full object-cover" />
                                 ) : (
                                     <div className="w-full h-full flex items-center justify-center"><Box className="opacity-20" size={40}/></div>
                                 )}
                                 <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 text-xs font-bold rounded flex items-center gap-1 backdrop-blur-sm">
                                     #{index + 1}
                                 </div>
                             </div>
                             
                             <div className="p-6 flex-1 flex flex-col">
                                 <div className="flex justify-between items-start mb-2">
                                     <h3 className="text-2xl font-black uppercase text-gray-900 dark:text-white">{obj.title}</h3>
                                     <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/20">
                                         <Zap size={14} fill="currentColor" /> 
                                         PODER: {obj.powerLevel || '?'}
                                     </div>
                                 </div>

                                 {obj.bearer && (
                                     <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                         <User size={16} className="text-arcane-red" />
                                         <span>Portador: {obj.bearer.name}</span>
                                         <span className={`text-[10px] px-2 py-0.5 rounded border ${obj.bearer.rank === 'Concept' ? 'bg-red-900/20 border-red-800 text-red-500' : 'bg-blue-900/20 border-blue-800 text-blue-400'}`}>
                                             {obj.bearer.rank === 'Concept' ? 'CONCEITO' : 'OBJETO'}
                                         </span>
                                     </div>
                                 )}

                                 <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4 flex-1">
                                     {obj.description}
                                 </p>

                                 <div className="flex gap-2 mt-auto">
                                     {obj.tags.slice(0, 5).map(tag => (
                                         <span key={tag} className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500 uppercase font-bold">
                                             {tag}
                                         </span>
                                     ))}
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
             )}
        </div>
      ) : (
        // DEFAULT DEFINITION LIST VIEW
        <div className="space-y-6">
            {levels.map((level) => (
            <div 
                key={level.id} 
                onClick={() => setViewingGrade(level.grade)}
                className={`relative p-6 rounded-xl border-l-8 shadow-sm transition-all cursor-pointer group ${
                editingId === level.id 
                    ? 'bg-gray-50 dark:bg-black border-arcane-red ring-2 ring-arcane-red cursor-default' 
                    : 'bg-white dark:bg-void border-gray-300 dark:border-gray-700 hover:border-l-arcane-red hover:shadow-lg hover:translate-x-1'
                }`}
                style={{ borderLeftColor: editingId !== level.id && level.grade.includes('Especial') ? '#dc2626' : undefined }}
            >
                {/* O botão de edição só aparece se for Admin */}
                {isAdmin && editingId !== level.id && (
                <button 
                    type="button"
                    onClick={(e) => startEdit(e, level)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-arcane-red p-2 z-20 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                    title="Editar Registro"
                >
                    <Edit2 size={18} />
                </button>
                )}

                {editingId === level.id ? (
                <div className="space-y-4 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                    <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome da Classe</label>
                    <input 
                        type="text" 
                        value={editForm.grade || ''} 
                        onChange={(e) => setEditForm({...editForm, grade: e.target.value})}
                        className="w-full p-2 border rounded bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700 focus:ring-1 focus:ring-arcane-red outline-none"
                    />
                    </div>
                    <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição do Protocolo</label>
                    <textarea 
                        value={editForm.description || ''} 
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        className="w-full p-2 border rounded bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700 h-24 focus:ring-1 focus:ring-arcane-red outline-none"
                    />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                    <button 
                        type="button"
                        onClick={() => setEditingId(null)} 
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    >
                        <X size={20}/>
                    </button>
                    <button 
                        type="button"
                        onClick={saveEdit} 
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold shadow-lg shadow-green-500/20"
                    >
                        <Save size={16}/> SALVAR ALTERAÇÕES
                    </button>
                    </div>
                </div>
                ) : (
                <div className="flex flex-col md:flex-row md:items-center gap-4 pointer-events-none">
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
                    <div className="mt-2 text-xs text-gray-400 font-bold uppercase tracking-widest group-hover:text-arcane-red transition-colors">
                        Clique para visualizar registros &rarr;
                    </div>
                    </div>
                </div>
                )}
            </div>
            ))}
        </div>
      )}
      
      {isAdmin && !viewingGrade && (
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700 rounded text-center animate-in slide-in-from-bottom-5">
           <p className="text-sm text-yellow-800 dark:text-yellow-500 font-semibold flex items-center justify-center gap-2">
             <Unlock size={14} />
             SESSÃO ADMINISTRATIVA ATIVA. ALTERAÇÕES PERMITIDAS.
           </p>
        </div>
      )}
    </div>
  );
};

export default ThreatLevels;