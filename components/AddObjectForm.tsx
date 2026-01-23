import React, { useState, useRef } from 'react';
import { Camera, Sparkles, Loader2, Save, Plus, Trash2, User, Crown, Box, MapPin, Zap, Skull, CheckCircle } from 'lucide-react';
import { analyzeImage, generateFastDescription } from '../services/geminiService';
import { CatalogObject, CustomField, BearerRank } from '../types';

interface AddObjectFormProps {
  onSave: (obj: CatalogObject) => void;
  onCancel: () => void;
}

const THREAT_GRADES = [
  'Classe Especial',
  'Classe 1',
  'Classe 2',
  'Classe 3',
  'Classe 4'
];

const AddObjectForm: React.FC<AddObjectFormProps> = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  
  // Location State
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');

  // Bearer State
  const [bearerName, setBearerName] = useState('');
  const [bearerRank, setBearerRank] = useState<BearerRank>('Object');

  // Threat & Power State
  const [threatGrade, setThreatGrade] = useState<string>('Classe 4');
  const [powerLevel, setPowerLevel] = useState<number>(100);

  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingFast, setLoadingFast] = useState(false);
  
  // Animation State
  const [isSuccessAnim, setIsSuccessAnim] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoadingAnalysis(true);
    try {
      const base64 = image.split(',')[1];
      const jsonStr = await analyzeImage(base64);
      if (jsonStr) {
        // Parse safely
        try {
            const data = JSON.parse(jsonStr);
            setTitle(data.title || '');
            setDescription(data.description || '');
            setTags(data.tags?.join(', ') || '');
        } catch (jsonError) {
            console.error("Failed to parse AI JSON", jsonError);
            setDescription(jsonStr); // Fallback to raw text if JSON fails
        }
      }
    } catch (error) {
      console.error("Erro na análise", error);
      alert("Falha ao analisar imagem. Tente novamente.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleFastDescription = async () => {
    if (!title) return;
    setLoadingFast(true);
    try {
      const tagList = tags.split(',').map(t => t.trim());
      const desc = await generateFastDescription(title, tagList);
      if (desc) setDescription(desc);
    } catch (error) {
      console.error("Erro rápido", error);
    } finally {
      setLoadingFast(false);
    }
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, field: 'key' | 'value', text: string) => {
    const newFields = [...customFields];
    newFields[index][field] = text;
    setCustomFields(newFields);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse Coordinates with comma support
    let coordinates = undefined;
    const parsedLat = parseFloat(lat.replace(',', '.'));
    const parsedLng = parseFloat(lng.replace(',', '.'));
    
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      coordinates = { lat: parsedLat, lng: parsedLng };
    }

    const newObj: CatalogObject = {
      id: Date.now().toString(),
      title,
      description,
      tags: tags.split(',').map(t => t.trim()).filter(t => t !== ''),
      imageUrl: image || undefined,
      dateAdded: Date.now(),
      notes: notes || undefined,
      coordinates: coordinates,
      customFields: customFields.filter(f => f.key.trim() !== ''),
      bearer: bearerName.trim() ? { name: bearerName, rank: bearerRank } : undefined,
      threatGrade: threatGrade,
      powerLevel: powerLevel
    };

    // Trigger Animation
    setIsSuccessAnim(true);
    
    // Delay save slightly to show animation
    setTimeout(() => {
        onSave(newObj);
    }, 700);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white dark:bg-void-light rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
        <Save className="w-6 h-6 text-arcane-red" />
        Novo Artefato
      </h2>

      {/* Image Section */}
      <div className="flex flex-col items-center gap-4">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-arcane-red transition-colors bg-gray-50 dark:bg-void overflow-hidden relative"
        >
          {image ? (
            <img src={image} alt="Preview" className="w-full h-full object-contain" />
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Camera className="w-8 h-8 mx-auto mb-2" />
              <span className="text-sm font-medium">Capturar Imagem do Objeto</span>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        {image && (
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loadingAnalysis}
            className="flex items-center gap-2 px-4 py-2 bg-arcane-red text-white rounded font-bold uppercase text-xs hover:bg-red-700 disabled:opacity-50"
          >
            {loadingAnalysis ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            Analisar Visão Arcana
          </button>
        )}
      </div>

      {/* Basic Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Identificação do Objeto</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 rounded bg-gray-50 dark:bg-void border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-arcane-red outline-none dark:text-white font-bold"
            placeholder="Ex: Dedo de Sukuna"
            required
          />
        </div>

        {/* Threat Level & Power Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1">
                    <Skull size={12} /> Grau de Ameaça
                </label>
                <select
                    value={threatGrade}
                    onChange={(e) => setThreatGrade(e.target.value)}
                    className="w-full p-2.5 rounded bg-gray-50 dark:bg-void border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-arcane-red outline-none dark:text-white text-sm font-bold"
                >
                    {THREAT_GRADES.map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1">
                    <Zap size={12} /> Nível de Poder Estimado: {powerLevel}
                </label>
                <input 
                    type="range"
                    min="0"
                    max="10000"
                    step="50"
                    value={powerLevel}
                    onChange={(e) => setPowerLevel(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-arcane-red"
                />
            </div>
        </div>

        {/* Bearer Section */}
        <div className="p-4 bg-gray-100 dark:bg-black/30 rounded border border-gray-200 dark:border-gray-600">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2 uppercase">
            <User size={16} className="text-arcane-red" /> Registro de Posse
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Nome do Portador</label>
              <input
                type="text"
                value={bearerName}
                onChange={(e) => setBearerName(e.target.value)}
                placeholder="Entidade ou Indivíduo"
                className="w-full p-2 text-sm rounded bg-white dark:bg-void border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-arcane-red outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Tipo de Vínculo</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBearerRank('Object')}
                  className={`flex-1 py-2 px-2 text-xs rounded border transition-all flex items-center justify-center gap-1 font-bold ${
                    bearerRank === 'Object' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white dark:bg-void text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <Box size={12} /> OBJETO
                </button>
                <button
                  type="button"
                  onClick={() => setBearerRank('Concept')}
                  className={`flex-1 py-2 px-2 text-xs rounded border transition-all flex items-center justify-center gap-1 font-bold ${
                    bearerRank === 'Concept' 
                      ? 'bg-black text-red-500 border-red-600 ring-1 ring-red-600' 
                      : 'bg-white dark:bg-void text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <Crown size={12} /> CONCEITO
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Tags (Separadas por vírgula)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full p-2 rounded bg-gray-50 dark:bg-void border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-arcane-red outline-none dark:text-white text-sm"
            placeholder="Ex: amaldiçoado, classe especial, tóquio"
          />
        </div>

        {/* Location Section */}
        <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Latitude</label>
             <input
               type="text"
               value={lat}
               onChange={(e) => setLat(e.target.value)}
               placeholder="Ex: -23.5505"
               className="w-full p-2 rounded bg-gray-50 dark:bg-void border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-arcane-red outline-none dark:text-white text-sm"
             />
           </div>
           <div>
             <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Longitude</label>
             <input
               type="text"
               value={lng}
               onChange={(e) => setLng(e.target.value)}
               placeholder="Ex: -46.6333"
               className="w-full p-2 rounded bg-gray-50 dark:bg-void border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-arcane-red outline-none dark:text-white text-sm"
             />
           </div>
        </div>

        {/* Custom Fields */}
        <div className="bg-gray-50 dark:bg-black/20 p-4 rounded border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Campos Personalizados</label>
                <button 
                  type="button" 
                  onClick={addCustomField}
                  className="text-xs flex items-center gap-1 text-arcane-red hover:text-red-400 font-bold uppercase"
                >
                    <Plus size={14} /> Adicionar
                </button>
            </div>
            {customFields.length === 0 && (
                <p className="text-xs text-gray-400 italic">Sem dados adicionais.</p>
            )}
            <div className="space-y-2">
                {customFields.map((field, index) => (
                    <div key={index} className="flex gap-2">
                        <input
                            type="text"
                            value={field.key}
                            onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                            placeholder="Propriedade"
                            className="flex-1 p-2 text-sm rounded bg-white dark:bg-void border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-arcane-red outline-none dark:text-white"
                        />
                        <input
                            type="text"
                            value={field.value}
                            onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                            placeholder="Valor"
                            className="flex-1 p-2 text-sm rounded bg-white dark:bg-void border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-arcane-red outline-none dark:text-white"
                        />
                        <button
                            type="button"
                            onClick={() => removeCustomField(index)}
                            className="p-2 text-red-500 hover:bg-red-100 rounded"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Descrição Pública</label>
            <button
              type="button"
              onClick={handleFastDescription}
              disabled={!title || loadingFast}
              className="text-xs text-arcane-red hover:text-red-400 flex items-center gap-1 font-bold uppercase"
            >
              {loadingFast ? <Loader2 className="animate-spin w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
              Gerar Rápido
            </button>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 rounded bg-gray-50 dark:bg-void border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-arcane-red outline-none dark:text-white h-24 resize-none"
            placeholder="Detalhes visuais e históricos..."
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Anotações Ocultas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 rounded bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 focus:ring-2 focus:ring-arcane-red outline-none dark:text-white h-20 resize-none text-red-900 dark:text-red-200"
            placeholder="Segredos, localização exata, selos necessários..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded font-medium"
        >
          CANCELAR
        </button>
        <button
          type="submit"
          disabled={isSuccessAnim}
          className={`px-6 py-2 font-bold rounded shadow-lg uppercase tracking-wider transition-all duration-500 transform ${
            isSuccessAnim 
              ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.7)] scale-105 ring-2 ring-purple-400 border-transparent' 
              : 'bg-arcane-red text-white hover:bg-red-700 shadow-red-500/30'
          }`}
        >
          {isSuccessAnim ? (
             <span className="flex items-center gap-2 animate-pulse">
               <CheckCircle size={18} /> SELANDO...
             </span>
          ) : (
             "REGISTRAR"
          )}
        </button>
      </div>
    </form>
  );
};

export default AddObjectForm;