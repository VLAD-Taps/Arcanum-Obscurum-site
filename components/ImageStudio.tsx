import React, { useState } from 'react';
import { Image as ImageIcon, Wand2, Loader2, Download } from 'lucide-react';
import { generateObjectImage } from '../services/geminiService';
import { AspectRatio } from '../types';

const ImageStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ratios: AspectRatio[] = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"];

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setGeneratedImage(null);
    try {
      const imgData = await generateObjectImage(prompt, aspectRatio);
      if (imgData) {
        setGeneratedImage(imgData);
      } else {
        alert("Não foi possível gerar a imagem.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro na geração de imagem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full p-6 bg-white dark:bg-void-light rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-6 dark:text-white flex items-center gap-2">
        <Wand2 className="text-pink-500" />
        Estúdio de Criação
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição Visual
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-50 dark:bg-void border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-pink-500 outline-none dark:text-white h-32 resize-none"
              placeholder="Um artefato futurista de cristal flutuando no espaço..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Proporção (Aspect Ratio)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ratios.map((r) => (
                <button
                  key={r}
                  onClick={() => setAspectRatio(r)}
                  className={`py-2 px-1 text-xs rounded border transition-all ${
                    aspectRatio === r
                      ? 'bg-pink-500 text-white border-pink-500'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-pink-500'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100"
          >
            {loading ? <Loader2 className="animate-spin" /> : <ImageIcon />}
            Gerar Imagem
          </button>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 bg-gray-100 dark:bg-black/40 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center min-h-[400px] relative overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <Loader2 className="animate-spin w-10 h-10 text-pink-500" />
              <p>A IA está sonhando...</p>
            </div>
          ) : generatedImage ? (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img 
                src={generatedImage} 
                alt="Generated" 
                className="max-w-full max-h-full rounded shadow-2xl object-contain"
              />
              <a 
                href={generatedImage} 
                download="omni-artifact.png"
                className="absolute bottom-4 right-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Download size={20} />
              </a>
            </div>
          ) : (
            <div className="text-gray-400 text-center p-6">
              <Wand2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Configure e gere para ver o resultado aqui.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageStudio;