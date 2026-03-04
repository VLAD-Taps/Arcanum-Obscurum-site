import { GoogleGenAI, Type } from "@google/genai";
import { AspectRatio } from "../types";

// Helper to get client with current key safely
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// 1. Fast AI Responses (Gemini 2.5 Flash-Lite)
export const generateFastDescription = async (title: string, tags: string[]) => {
  const ai = getAiClient();
  const prompt = `Gere uma descrição curta, misteriosa e intrigante para um objeto chamado "${title}" com as tags: ${tags.join(', ')}. Use no máximo 2 frases.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-flash-lite-latest', // Correct model name per guidelines
    contents: prompt,
  });
  return response.text;
};

// 2. Image Analysis (Gemini 3 Pro Preview)
export const analyzeImage = async (base64Image: string) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: "Analise este objeto detalhadamente. Identifique o que é, estime sua época de origem se possível, e descreva suas características visuais. Retorne em formato JSON com chaves: 'title', 'description', 'tags'." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  
  // Clean potential markdown code blocks if the model adds them despite MIME type
  let text = response.text || "{}";
  text = text.replace(/```json\n?|```/g, '').trim();
  
  return text;
};

// 3. Thinking Mode Chat (Gemini 3 Pro Preview + Thinking Budget)
export const chatWithThinking = async (message: string, history: any[]) => {
  const ai = getAiClient();
  
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    history: history,
    config: {
      thinkingConfig: { thinkingBudget: 32768 }, // Max budget
    }
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};

// 4. Search Grounding (Gemini 3 Flash Preview + Google Search)
export const chatWithSearch = async (message: string) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: message,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });
  
  // Extract grounding
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const links = groundingChunks
    .map((chunk: any) => chunk.web)
    .filter((web: any) => web && web.uri && web.title);

  return { text: response.text, links };
};

// 5. Maps Grounding (Gemini 2.5 Flash + Google Maps)
export const searchPlaces = async (query: string, lat: number, long: number) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: query,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: long
          }
        }
      }
    }
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  const places = groundingChunks
    .map((chunk: any) => {
        // Handle explicit maps chunk or web fallback
        if (chunk.maps) return { title: chunk.maps.title || 'Local no Mapa', uri: chunk.maps.uri };
        if (chunk.web && chunk.web.uri && chunk.web.uri.includes('maps')) return { title: chunk.web.title, uri: chunk.web.uri };
        return null;
    })
    .filter((place: any) => place !== null);

  return { text: response.text, places };
};

// 6. Image Generation (Gemini 3 Pro Image Preview)
export const generateObjectImage = async (prompt: string, aspectRatio: AspectRatio) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: prompt,
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: "1K" 
      }
    }
  });

  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  return null;
};

// 7. Global News Feed (Gemini 2.5 Flash - Faster & Cheaper)
export const fetchGlobalDisasters = async (count: number = 5, recentHeadlines: string[] = []) => {
  const ai = getAiClient();
  
  const recentContext = recentHeadlines.length > 0 
    ? `EVITE REPETIR os seguintes eventos recentes: ${JSON.stringify(recentHeadlines.slice(0, 15))}.` 
    : "";

  // Dynamic Categories to force variety
  const allCategories = [
    "Anomalias Temporais (loops, objetos fora do tempo)",
    "Criptozoologia Urbana (criaturas em metrôs, esgotos)",
    "Fenômenos Psíquicos em Massa (sonhos compartilhados)",
    "Artefatos Amaldiçoados Ativados (museus, leilões)",
    "Sinais Tecnológicos Bizarros (IA senciente, hacks sobrenaturais)",
    "Clima Impossível (chuva de objetos, nuvens sólidas)",
    "Portais Dimensionais (falhas na realidade)",
    "Botânica Monstruosa (plantas carnívoras gigantes)",
    "Geometria Não-Euclidiana em Prédios",
    "Sussurros Coletivos vindos do Céu",
    "Animais com Comportamento Humano",
    "Objetos Inanimados Ganhando Vida",
    "Silêncio Absoluto em Cidades Movimentadas",
    "Cores Indescritíveis aparecendo no horizonte"
  ];

  // Shuffle and pick 3 random categories to focus on this time
  const shuffled = allCategories.sort(() => 0.5 - Math.random());
  const selectedCategories = shuffled.slice(0, 4);

  const prompt = `Atue como um jornalista de um jornal secreto chamado "O Observador Arcano". 
  Gere uma lista de ${count} manchetes urgentes (Breaking News) sobre FENÔMENOS INEXPLICÁVEIS e EVENTOS ANORMAIS ocorrendo AGORA no mundo.
  
  ${recentContext}

  Nesta edição, foque especialmente nestas categorias (mas pode variar):
  ${selectedCategories.map(c => `- ${c}`).join('\n')}

  Use cidades reais e variadas (evite repetir as mesmas capitais). Seja criativo, sério, alarmista e misterioso.
  Retorne APENAS um JSON array.
  Estrutura: [{ "location": string, "type": string (ex: "ANOMALIA", "CRIPTÍDEO", "PSIÔNICO", "TECNOCULTO"), "severity": "low"|"medium"|"high"|"critical", "description": string (manchete curta e impactante), "timestamp": string (horario HH:mm) }]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 2000,
        temperature: 1.2, // High creativity
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              location: { type: Type.STRING },
              type: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
              description: { type: Type.STRING },
              timestamp: { type: Type.STRING }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (e: any) {
    // Handle Rate Limits gracefully
    if (e.message?.includes('429') || e.status === 429) {
      console.warn("Quota exceeded for news feed. Pausing updates temporarily.");
      return [];
    }
    console.error("Failed to fetch/parse news feed", e);
    return [];
  }
};

// 8. Generate Full News Report (Gemini 3 Pro)
export const generateFullNewsReport = async (event: any) => {
  const ai = getAiClient();
  const prompt = `Escreva uma matéria jornalística completa e sensacionalista (aprox. 3 parágrafos) para o "O Observador Arcano" sobre:
  
  Manchete: ${event.description}
  Tipo: ${event.type}
  Local: ${event.location}
  Severidade: ${event.severity}

  Inclua:
  1. Um "Lead" impactante.
  2. Depoimentos de testemunhas aterrorizadas ou especialistas em ocultismo.
  3. Uma teoria da conspiração sobre o governo estar encobrindo o fato.
  
  O tom deve ser sério, como uma transmissão de emergência ou furo de reportagem investigativa.
  Use formatação Markdown simples.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text;
};
