import React, { useState } from 'react';
import { Send, Bot, Search, Brain, Loader2, Globe } from 'lucide-react';
import { chatWithThinking, chatWithSearch } from '../services/geminiService';
import { ChatMessage } from '../types';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Olá. Sou a inteligência do Arcanum. Posso ajudar com pesquisa profunda (Thinking) ou dados atuais (Search).' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'thinking' | 'search'>('thinking');

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      let resultText = '';
      let links: any[] = [];

      if (mode === 'thinking') {
        // Convert existing messages to Gemini history format for context
        const history = messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));
        resultText = await chatWithThinking(userMsg.text, history) || "Sem resposta.";
      } else {
        const result = await chatWithSearch(userMsg.text);
        resultText = result.text || "Sem resposta.";
        links = result.links;
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: resultText,
        groundingLinks: links
      }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Erro ao processar sua solicitação." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-void-light rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 bg-gray-50 dark:bg-void border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white uppercase tracking-wide">
          <Bot className="text-arcane-red" />
          Arcanum AI
        </h3>
        <div className="flex bg-gray-200 dark:bg-gray-900 rounded-lg p-1">
          <button
            onClick={() => setMode('thinking')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-all font-bold ${mode === 'thinking' ? 'bg-white dark:bg-arcane-red text-black dark:text-white shadow' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <Brain size={14} /> THINKING
          </button>
          <button
            onClick={() => setMode('search')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-all font-bold ${mode === 'search' ? 'bg-white dark:bg-blue-600 text-black dark:text-white shadow' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <Search size={14} /> SEARCH
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100 dark:bg-black/20">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-arcane-red text-white rounded-br-none shadow-lg shadow-red-500/20' 
                : 'bg-white dark:bg-void-light text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-700'
            }`}>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</div>
              
              {/* Grounding Links */}
              {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-bold mb-1 opacity-70 flex items-center gap-1 uppercase">
                    <Globe size={10} /> Fontes Conectadas:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingLinks.map((link, idx) => (
                      <a 
                        key={idx} 
                        href={link.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded truncate max-w-[200px]"
                      >
                        {link.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-void-light p-3 rounded-2xl rounded-bl-none flex items-center gap-2 border border-gray-200 dark:border-gray-700">
              <Loader2 className="animate-spin text-arcane-red" size={16} />
              <span className="text-xs text-gray-500 font-medium">{mode === 'thinking' ? 'Processando lógica complexa...' : 'Varrendo a rede...'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-void-light border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={mode === 'thinking' ? "Consulte a sabedoria profunda..." : "Busque dados da superfície..."}
            className="flex-1 p-2 bg-gray-100 dark:bg-void border-none rounded focus:ring-2 focus:ring-arcane-red outline-none dark:text-white font-medium"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-2 bg-arcane-red text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;