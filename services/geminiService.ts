import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
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

// 1. Fast AI Responses (Gemini 3.1 Flash-Lite)
export const generateFastDescription = async (title: string, tags: string[]) => {
  const ai = getAiClient();
  const prompt = `Gere uma descrição curta, misteriosa e intrigante para um objeto chamado "${title}" com as tags: ${tags.join(', ')}. Use no máximo 2 frases.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite-preview', // Correct model name per guidelines
    contents: prompt,
  });
  return response.text;
};

// 2. Image Analysis (Gemini 3.1 Pro Preview)
export const analyzeImage = async (base64Image: string) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
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

// 3. Thinking Mode Chat (Gemini 3.1 Pro Preview + ThinkingLevel.HIGH)
export const chatWithThinking = async (message: string, history: any[]) => {
  const ai = getAiClient();
  
  const chat = ai.chats.create({
    model: 'gemini-3.1-pro-preview',
    history: history,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
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

// 7. Global News Feed (Gemini 3 Flash - More Robust & Varied)
export const fetchGlobalDisasters = async (count: number = 3, recentHeadlines: string[] = []) => {
  // Helper to generate random time
  const randomTime = () => {
    const h = Math.floor(Math.random() * 24).toString().padStart(2, '0');
    const m = Math.floor(Math.random() * 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  // Expanded fallback data with more variety
  const fallbackNews = [
    {
      location: "Ponto Nemo, Pacífico",
      type: "ANOMALIA",
      severity: "critical",
      description: "Sinal de rádio desconhecido emitido do fundo do oceano repete sequência matemática.",
      timestamp: randomTime()
    },
    {
      location: "Deserto do Atacama, Chile",
      type: "TECNOCULTO",
      severity: "high",
      description: "Monólitos de metal vibrante surgem durante a noite; moradores relatam zumbido constante.",
      timestamp: randomTime()
    },
    {
      location: "Tóquio, Japão",
      type: "PSIÔNICO",
      severity: "medium",
      description: "Milhares de corvos pousam em silêncio absoluto no cruzamento de Shibuya.",
      timestamp: randomTime()
    },
    {
      location: "Cairo, Egito",
      type: "ARQUEOLOGIA",
      severity: "high",
      description: "Esfinge emite som de baixa frequência que causa alucinações em turistas.",
      timestamp: randomTime()
    },
    {
      location: "Antártida",
      type: "CLIMA",
      severity: "critical",
      description: "Nuvem verde estática cobre estação de pesquisa; comunicações cortadas.",
      timestamp: randomTime()
    },
    {
      location: "Nova York, EUA",
      type: "ANOMALIA",
      severity: "medium",
      description: "Gravidade invertida temporariamente no Central Park; objetos flutuam.",
      timestamp: randomTime()
    },
    {
      location: "Sibéria, Rússia",
      type: "BIO-HAZARD",
      severity: "high",
      description: "Cratera gigante revela fungo bioluminescente desconhecido pela ciência.",
      timestamp: randomTime()
    },
    {
      location: "Londres, UK",
      type: "TEMPORAL",
      severity: "low",
      description: "Relógios da cidade param simultaneamente por 3 minutos.",
      timestamp: randomTime()
    },
    {
      location: "Amazônia, Brasil",
      type: "BIO-HAZARD",
      severity: "critical",
      description: "Árvores com veias pulsantes descobertas em área remota.",
      timestamp: randomTime()
    },
    {
      location: "Paris, França",
      type: "PSIÔNICO",
      severity: "medium",
      description: "Catacumbas emitem brilho violeta visível da superfície.",
      timestamp: randomTime()
    },
    {
      location: "Sydney, Austrália",
      type: "CLIMA",
      severity: "high",
      description: "Chuva de cinzas azuis cobre a Opera House sem origem vulcânica.",
      timestamp: randomTime()
    },
    {
      location: "Moscou, Rússia",
      type: "TECNOCULTO",
      severity: "medium",
      description: "Sinais de TV invadidos por transmissão de estática inteligente.",
      timestamp: randomTime()
    },
    {
      location: "Cidade do México, México",
      type: "ARQUEOLOGIA",
      severity: "high",
      description: "Pirâmide do Sol vibra em frequência audível por cães.",
      timestamp: randomTime()
    },
    {
      location: "Reykjavik, Islândia",
      type: "ANOMALIA",
      severity: "low",
      description: "Auroras boreais formam padrões geométricos perfeitos.",
      timestamp: randomTime()
    },
    {
      location: "Mumbai, Índia",
      type: "TEMPORAL",
      severity: "medium",
      description: "Trem chega à estação 50 anos após sua partida.",
      timestamp: randomTime()
    },
    {
      location: "Berlim, Alemanha",
      type: "PSIÔNICO",
      severity: "high",
      description: "Sonho coletivo reportado por 10.000 pessoas na mesma noite.",
      timestamp: randomTime()
    },
    {
      location: "Pequim, China",
      type: "TECNOCULTO",
      severity: "critical",
      description: "IA urbana desenvolve linguagem própria e assume controle de semáforos.",
      timestamp: randomTime()
    },
    {
      location: "Cidade do Cabo, África do Sul",
      type: "CLIMA",
      severity: "medium",
      description: "Nevoeiro denso e sólido isola a Table Mountain.",
      timestamp: randomTime()
    },
    {
      location: "Roma, Itália",
      type: "ARQUEOLOGIA",
      severity: "low",
      description: "Estátuas de mármore 'choram' líquido negro viscoso.",
      timestamp: randomTime()
    },
    {
      location: "Las Vegas, EUA",
      type: "ANOMALIA",
      severity: "high",
      description: "Miragem sólida de cidade desconhecida aparece no deserto.",
      timestamp: randomTime()
    },
    {
      location: "Istambul, Turquia",
      type: "PSIÔNICO",
      severity: "low",
      description: "Gatos de rua começam a miar em uníssono formando código Morse.",
      timestamp: randomTime()
    },
    {
      location: "Viena, Áustria",
      type: "ANOMALIA",
      severity: "low",
      description: "Estátuas de praça mudam de pose sutilmente quando ninguém está olhando.",
      timestamp: randomTime()
    },
    {
      location: "São Paulo, Brasil",
      type: "TEMPORAL",
      severity: "low",
      description: "Sinal de rádio pirata transmite músicas e notícias datadas de 2050.",
      timestamp: randomTime()
    },
    {
      location: "Iowa, EUA",
      type: "BIO-HAZARD",
      severity: "low",
      description: "Plantação de milho cresce em espirais perfeitas da noite para o dia.",
      timestamp: randomTime()
    },
    {
      location: "Dubai, EAU",
      type: "ANOMALIA",
      severity: "medium",
      description: "Espelhos em hotel de luxo deixam de refletir pessoas, apenas o ambiente.",
      timestamp: randomTime()
    },
    {
      location: "Monte Fuji, Japão",
      type: "CLIMA",
      severity: "medium",
      description: "Nuvem em formato de olho humano paira sobre o vulcão há 3 dias.",
      timestamp: randomTime()
    },
    {
      location: "Toronto, Canadá",
      type: "TECNOCULTO",
      severity: "medium",
      description: "Todos os semáforos da cidade piscam em sincronia com batimentos cardíacos.",
      timestamp: randomTime()
    },
    {
      location: "Oxford, UK",
      type: "PSIÔNICO",
      severity: "medium",
      description: "Livros da seção de ocultismo de biblioteca reescrevem seus próprios finais.",
      timestamp: randomTime()
    },
    {
      location: "Seul, Coreia do Sul",
      type: "COSMICO",
      severity: "high",
      description: "Fenda brilhante aparece no céu noturno, emitindo sons de engrenagens gigantes.",
      timestamp: randomTime()
    },
    {
      location: "Costa da Grécia",
      type: "ARQUEOLOGIA",
      severity: "high",
      description: "Ruínas de cidade submersa desconhecida começam a emergir rapidamente do mar.",
      timestamp: randomTime()
    },
    {
      location: "Alasca, EUA",
      type: "BIO-HAZARD",
      severity: "high",
      description: "População inteira de pequena cidade perde a necessidade e capacidade de dormir.",
      timestamp: randomTime()
    },
    {
      location: "Nova Delhi, Índia",
      type: "ANOMALIA",
      severity: "high",
      description: "Sombras de pedestres se desprendem de seus donos e andam sozinhas pelas ruas.",
      timestamp: randomTime()
    },
    {
      location: "Costa Leste, EUA",
      type: "CLIMA",
      severity: "critical",
      description: "Oceano Atlântico recua 5km repentinamente sem qualquer sinal de tsunami iminente.",
      timestamp: randomTime()
    },
    {
      location: "Observatório Arecibo (Antigo), Porto Rico",
      type: "COSMICO",
      severity: "critical",
      description: "Sinal alienígena decodificado em ruínas alerta repetidamente: 'Eles estão acordando'.",
      timestamp: randomTime()
    },
    {
      location: "Vale do Silício, EUA",
      type: "TECNOCULTO",
      severity: "critical",
      description: "Vírus digital transforma monitores em portais hipnóticos letais; milhares afetados.",
      timestamp: randomTime()
    },
    {
      location: "Genebra, Suíça",
      type: "TEMPORAL",
      severity: "critical",
      description: "Fissura temporal no CERN revela visão de uma Terra devastada e irreconhecível.",
      timestamp: randomTime()
    }
  ];

  // Helper to filter duplicates
  const getUniqueNews = (candidates: any[], count: number) => {
    const unique = candidates.filter(item => 
      !recentHeadlines.some(headline => headline.toLowerCase() === item.description.toLowerCase())
    );
    return unique.sort(() => 0.5 - Math.random()).slice(0, count);
  };

  try {
    // Move client initialization inside try/catch to handle missing API keys gracefully
    const ai = getAiClient();
    if (!ai) throw new Error("AI Client not initialized");

    // 1. Dynamic Themes for Variety - Randomly select themes to force the AI to explore different topics
    const themes = [
      "Falhas na Realidade (Glitch in the Matrix)",
      "Criptozoologia Urbana (criaturas em metrôs, esgotos)",
      "Sinais de Rádio do Espaço Profundo",
      "Arqueologia Proibida / Artefatos Amaldiçoados",
      "Fenômenos Meteorológicos Impossíveis (chuva de objetos, céu roxo)",
      "Comportamento Animal Bizarro (animais falando, marchando em círculos)",
      "Objetos Fora do Tempo (OOPARTS)",
      "Silêncio Súbito em Grandes Áreas Urbanas",
      "Luzes Não Identificadas no Oceano / USOs",
      "Sonhos Compartilhados em Massa",
      "Aparições de Doppelgängers ou Pessoas Sombra",
      "Tecnologia Antiga Ativando Sozinha",
      "Geometria Não-Euclidiana em Arquitetura",
      "Plantas com Comportamento Agressivo/Senciente",
      "Sinais de Satélites Hackeados por Entidades Desconhecidas",
      "Desaparecimentos em Massa em Pequenas Vilas",
      "Sons do Céu (The Hum) em Frequências Nocivas"
    ];

    // Pick 2 random themes to focus on for this request
    const shuffledThemes = themes.sort(() => 0.5 - Math.random()).slice(0, 2);

    const recentContext = recentHeadlines.length > 0 
      ? `IMPORTANTE: NÃO repita estes assuntos recentes: ${JSON.stringify(recentHeadlines.slice(0, 15))}.` 
      : "";

    const prompt = `Atue como um monitor de anomalias globais para "O Observador Arcano". 
    Gere ${count} alertas de "Breaking News" sobre eventos sobrenaturais ÚNICOS e INTRIGANTES.

    TEMAS DESTA RODADA (Foque nestes para garantir variedade):
    ${shuffledThemes.map(t => `- ${t}`).join('\n')}
    
    ${recentContext}
    
    REGRAS CRÍTICAS:
    1. Retorne APENAS um JSON Array puro.
    2. Campos obrigatórios: 
       - "location": Cidade/País real e específico.
       - "type": Categoria curta (ex: ANOMALIA, BIO-HAZARD, PSIÔNICO, COSMICO, TECNOCULTO, TEMPORAL).
       - "severity": "low", "medium", "high", ou "critical".
       - "description": Manchete impactante, misteriosa e concisa (MÁXIMO 15 palavras).
       - "timestamp": Hora atual (HH:mm).
    3. SEM formatação markdown (sem \`\`\`json).
    4. SEJA CRIATIVO! Invente eventos bizarros e nunca vistos antes. Evite clichês.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 2000,
        temperature: 0.9, // Higher temperature for more variety
      }
    });

    const text = response.text || "[]";
    try {
      // Clean potential markdown just in case
      const cleanText = text.replace(/```json\n?|```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter AI results against recent headlines
        const uniqueAiNews = parsed.filter((item: any) => 
          !recentHeadlines.some(headline => headline.toLowerCase() === item.description.toLowerCase())
        );
        
        // If AI returned duplicates, fill with fallback
        if (uniqueAiNews.length < count) {
           const needed = count - uniqueAiNews.length;
           const extras = getUniqueNews(fallbackNews, needed);
           return [...uniqueAiNews, ...extras];
        }
        
        return uniqueAiNews.slice(0, count);
      }
      throw new Error("Invalid JSON format or empty array");
    } catch (e) {
      console.warn("JSON parse failed, using fallback data.", e);
      return getUniqueNews(fallbackNews, count);
    }
  } catch (e: any) {
    // If it's a rate limit error, just warn quietly
    const isRateLimit = e?.status === 429 || e?.error?.code === 429 || e?.message?.includes('429') || e?.message?.includes('RESOURCE_EXHAUSTED');
    if (isRateLimit) {
      console.warn("Rate limit exceeded for news feed. Using fallback data.");
    } else {
      console.warn("Failed to fetch news feed. Using fallback data.", e);
    }
    return getUniqueNews(fallbackNews, count);
  }
};

// 8. Generate Full News Report (Gemini 3 Pro)
export const generateFullNewsReport = async (event: any) => {
  try {
    const ai = getAiClient();
    if (!ai) throw new Error("AI Client not initialized");

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
  } catch (error) {
    console.error("Failed to generate full report, using procedural fallback.", error);
    
    // Procedural Fallback Generator
    return `## ${event.description}

**LOCAL:** ${event.location}
**CLASSIFICAÇÃO:** ${event.type}
**NÍVEL DE AMEAÇA:** ${event.severity.toUpperCase()}

**(TRANSMISSÃO DE EMERGÊNCIA - SINAL DE BACKUP)**

Nossas fontes em campo confirmam a ocorrência de um evento anômalo de alta magnitude em ${event.location}. Relatórios preliminares indicam que a situação escalou rapidamente, desafiando as explicações convencionais das autoridades locais.

"Foi como se a realidade se doesse ao meio," relatou uma testemunha ocular que preferiu manter o anonimato por medo de represálias. "As leis da física simplesmente deixaram de funcionar por alguns instantes."

O Observador Arcano detectou picos de energia psiônica coincidentes com o horário do evento. Enquanto o governo oficial atribui o incidente a "falhas na infraestrutura" ou "fenômenos naturais raros", nossos especialistas acreditam se tratar de uma ruptura na membrana dimensional.

Equipes de contenção foram avistadas isolando o perímetro. Recomendamos que a população mantenha distância e relate qualquer atividade suspeita adicional através dos canais criptografados.

*A verdade está nas sombras.*`;
  }
};
