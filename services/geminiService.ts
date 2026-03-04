import { GoogleGenAI, Type } from "@google/genai";
import { AspectRatio } from "../types";

// Helper to get client with current key safely
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key is missing! Please ensure GEMINI_API_KEY is set.");
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
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

// 7. Global News Feed (Gemini 3 Flash - More Robust)
export const fetchGlobalDisasters = async (count: number = 3, recentHeadlines: string[] = []) => {
  const ai = getAiClient();
  
  // Hardcoded fallback data in case of API failure
  const fallbackNews = [
    {
      location: "Ponto Nemo, Pacífico",
      type: "ANOMALIA",
      severity: "critical",
      description: "Sinal de rádio desconhecido emitido do fundo do oceano repete sequência matemática.",
      timestamp: "03:33"
    },
    {
      location: "Deserto do Atacama, Chile",
      type: "TECNOCULTO",
      severity: "high",
      description: "Monólitos de metal vibrante surgem durante a noite; moradores relatam zumbido constante.",
      timestamp: "05:12"
    },
    {
      location: "Tóquio, Japão",
      type: "PSIÔNICO",
      severity: "medium",
      description: "Milhares de corvos pousam em silêncio absoluto no cruzamento de Shibuya.",
      timestamp: "08:45"
    }
  ];

  const recentContext = recentHeadlines.length > 0 
    ? `EVITE: ${JSON.stringify(recentHeadlines.slice(0, 5))}.` 
    : "";

  const prompt = `Gere ${count} manchetes fictícias de "Breaking News" sobre eventos sobrenaturais/estranhos.
  ${recentContext}
  
  REGRAS:
  1. JSON Array puro.
  2. Campos: location, type (ANOMALIA, CRIPTÍDEO, PSIÔNICO, TECNOCULTO), severity (low, medium, high, critical), description (MAX 15 palavras), timestamp (HH:mm).
  3. SEM formatação markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Switching to 3-flash for better adherence
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 1000,
        temperature: 0.7,
      }
    });

    const text = response.text || "[]";
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      throw new Error("Invalid JSON format");
    } catch (e) {
      console.warn("JSON parse failed, using fallback data.", e);
      return fallbackNews;
    }
  } catch (e: any) {
    console.error("Failed to fetch news feed, using fallback.", e);
    return fallbackNews;
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
