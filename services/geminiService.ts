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

// 9. Real Infections & Scientific Studies Live Surface Web Search (Google Search Grounding)
export const fetchRealInfectionNews = async (
  queryTopic: string = '',
  categoryFilter: string = 'all'
) => {
  const fallbackInfections = [
    {
      id: "real_inf_1",
      title: "Vigilância Genômica da Gripe Aviária H5N1: Transmissão em Mamíferos e Monitoramento Global",
      source: "Nature Medicine / OMS",
      url: "https://www.who.int/emergencies/disease-outbreak-news",
      publishedDate: "Recente",
      category: "surto",
      pathogen: "Vírus Influenza A (H5N1)",
      location: "Global / América do Norte / Europa",
      summary: "Estudos recentes de sequenciamento genético monitoram mutações no vírus H5N1 após detecção em rebanhos leiteiros e mamíferos selvagens, com agências de saúde pública reforçando protocolos de biossegurança.",
      keyFindings: [
        "Aumento da vigilância em trabalhadores agrícolas e rebanhos",
        "Análise de mutações na proteína hemaglutinina para avaliar risco de adaptação humana",
        "Desenvolvimento e estocagem de vacinas candidatas por consórcios internacionais"
      ],
      createdAt: Date.now() - 3600000
    },
    {
      id: "real_inf_2",
      title: "Mpox Clado Ib: Dinâmica de Disseminação e Eficácia de Campanhas Vacinais",
      source: "The Lancet Infectious Diseases / CDC",
      url: "https://www.cdc.gov/poxvirus/mpox/",
      publishedDate: "Recente",
      category: "alerta_oms",
      pathogen: "Orthopoxvirus (Mpox)",
      location: "África Central / Internacional",
      summary: "Pesquisas avaliam a transmissão e a resposta imunológica induzida pela vacina MVA-BN contra a variante Clado Ib, com reforço de medidas de contenção em pontos de entrada internacionais.",
      keyFindings: [
        "Identificação de vias de transmissão intradomiciliar e comunitária",
        "Resultados positivos preliminares sobre imunogenicidade das vacinas",
        "Recomendações da OMS para distribuição equitativa de insumos e testes diagnósticos"
      ],
      createdAt: Date.now() - 7200000
    },
    {
      id: "real_inf_3",
      title: "Superbactérias e Resistência a Carbapenêmicos: Nova Classe de Antibióticos em Fase Clínica",
      source: "Science Translational Medicine",
      url: "https://www.science.org/journal/scitranslmed",
      publishedDate: "Estudo Recente",
      category: "resistencia",
      pathogen: "Klebsiella pneumoniae & Pseudomonas aeruginosa",
      location: "Centros de Pesquisa Globais",
      summary: "Novo estudo revela compostos sintéticos capazes de contornar mecanismos de efluxo e enzimas beta-lactamases em bactérias Gram-negativas multirresistentes.",
      keyFindings: [
        "Mecanismo de ação baseado na inibição da síntese de lipopolissacarídeos de membrana",
        "Alta potência in vitro contra cepas resistentes a colistina",
        "Avanço para testes clínicos de fase II para infecções hospitalares complexas"
      ],
      createdAt: Date.now() - 10800000
    },
    {
      id: "real_inf_4",
      title: "Candida auris: Mapeamento de Focos Hospitalares e Estratégias de Descontaminação",
      source: "CDC Emerging Infectious Diseases",
      url: "https://wwwnc.cdc.gov/eid",
      publishedDate: "Alerta Ativo",
      category: "mutacao",
      pathogen: "Fungo Candida auris",
      location: "Américas / Ásia / Europa",
      summary: "Diretrizes atualizadas para controle de infecções fúngicas invasivas resistentes a equinocandinas e azóis em UTIs e unidades de longa permanência.",
      keyFindings: [
        "Capacidade persistente de colonização em superfícies hospitalares",
        "Eficácia superior de desinfetantes à base de peróxido de hidrogênio vaporizado",
        "Uso de testes de PCR multiplex para diagnóstico precoce em pacientes críticos"
      ],
      createdAt: Date.now() - 14400000
    },
    {
      id: "real_inf_5",
      title: "Vacinas de RNAm para Vírus Respiratórios Sazonais e Zoonóticos",
      source: "New England Journal of Medicine (NEJM)",
      url: "https://www.nejm.org",
      publishedDate: "Publicação Científica",
      category: "estudo",
      pathogen: "Vírus Sincicial Respiratório (VSR) & Coronavírus",
      location: "Internacional",
      summary: "Ensaios clínicos demonstram durabilidade da resposta imune celular (células T CD8+) após imunização com formulações de nanopartículas lipídicas de nova geração.",
      keyFindings: [
        "Proteção cruzada estendida contra linhagens variantes",
        "Redução significativa de hospitalizações em grupos de risco",
        "Novos adjuvantes que reduzem a reatogenia e melhoram a estabilidade térmica"
      ],
      createdAt: Date.now() - 18000000
    }
  ];

  try {
    const ai = getAiClient();
    if (!ai) return fallbackInfections;

    let searchTopic = queryTopic.trim();
    if (!searchTopic) {
      if (categoryFilter === 'surto') searchTopic = 'surtos epidemiologicos recentes infecções virais oms cdc';
      else if (categoryFilter === 'estudo') searchTopic = 'novos estudos cientificos infeccoes bacterias virus natureza the lancet';
      else if (categoryFilter === 'alerta_oms') searchTopic = 'alertas organizacao mundial da saude oms epidemias recentes';
      else if (categoryFilter === 'resistencia') searchTopic = 'resistencia antimicrobiana superbacterias novos antibioticos estudos';
      else if (categoryFilter === 'mutacao') searchTopic = 'mutacao virus patogenos vigilância genomica';
      else searchTopic = 'ultimas noticias sobre infeccoes virais surtos bacterianos doencas emergentes estudos cientificos recentes';
    }

    const prompt = `Realize uma busca em tempo real na surface web sobre notícias reais e estudos científicos recentes sobre infecções, surtos, vírus, superbactérias e epidemiologia médica.
Busca: "${searchTopic}".

Retorne um JSON Array puro contendo entre 4 a 6 notícias/estudos reais e recentes.
Cada item deve ter a seguinte estrutura:
[
  {
    "id": "inf_" + número_único,
    "title": "Título informativo e claro da notícia ou estudo científico real",
    "source": "Nome do veículo ou periódico (ex: Nature, The Lancet, OMS, CDC, Reuters, BBC, G1, etc.)",
    "url": "URL da fonte original se identificada",
    "publishedDate": "Data ou período da publicação",
    "category": "surto" | "estudo" | "alerta_oms" | "resistencia" | "mutacao" | "outro",
    "location": "Local ou alcance geográfico",
    "pathogen": "Nome do vírus, bactéria, fungo ou doença em questão",
    "summary": "Resumo objetivo e científico em português com 2 a 3 frases explicando o que aconteceu ou o que o estudo descobriu.",
    "keyFindings": [
      "Ponto chave 1 sobre a descoberta ou situação",
      "Ponto chave 2 sobre dados clínicos ou medidas",
      "Ponto chave 3 sobre impacto na saúde pública"
    ]
  }
]

REGRAS:
1. Retorne APENAS o JSON Array puro (sem blocos markdown como \`\`\`json).
2. As notícias devem ser REAIS, fundamentadas em fontes da surface web.
3. Não invente ficção neste modo: este módulo é para jornalismo e ciência real.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3
      }
    });

    // Extract grounding chunks if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webLinks = groundingChunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri && web.title);

    let text = response.text || "[]";
    const cleanText = text.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(cleanText);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item: any, idx: number) => ({
        ...item,
        id: item.id || `inf_${Date.now()}_${idx}`,
        createdAt: Date.now() - (idx * 60000),
        groundingLinks: webLinks.length > 0 ? webLinks.slice(idx * 2, (idx + 1) * 2 + 1) : undefined
      }));
    }

    return fallbackInfections;
  } catch (error) {
    console.warn("Busca de infecções na surface web falhou, utilizando catálogo base.", error);
    return fallbackInfections;
  }
};

// 10. Generate In-depth Scientific Report on a Real Infection / Study
export const generateDetailedInfectionReport = async (item: any) => {
  try {
    const ai = getAiClient();
    if (!ai) throw new Error("AI Client not initialized");

    const prompt = `Escreva um dossiê epidemiológico e científico aprofundado em português sobre o seguinte estudo ou notícia real:
    
    Título: ${item.title}
    Fonte: ${item.source}
    Patógeno/Doença: ${item.pathogen || 'Não especificado'}
    Localização: ${item.location || 'Global'}
    Categoria: ${item.category}
    Resumo Inicial: ${item.summary}

    O relatório deve conter a seguinte estrutura em Markdown:
    ## Visão Geral & Contexto Epidemiológico
    (Explicação detalhada do cenário atual e da importância do patógeno)

    ## Descobertas Científicas & Metodologia
    (Dados sobre transmissão, mutações genéticas, resistência, respostas imunológicas ou testes clínicos)

    ## Impacto na Saúde Pública & Recomendações
    (Diretrizes de prevenção, vacinas, tratamentos e orientações das autoridades como OMS/CDC)

    ## Fontes Verificadas & Leitura Recomendada
    (Mencione os periódicos científicos e órgãos de saúde envolvidos)
    
    Mantenha um tom rigorosamente científico, informativo e acessível.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    return response.text;
  } catch (error) {
    console.error("Falha ao gerar dossiê científico", error);
    return `## Dossiê Informativo: ${item.title}

**Fonte Original:** ${item.source} | **Patógeno:** ${item.pathogen || 'N/A'} | **Localização:** ${item.location || 'Global'}

### Resumo Executivo
${item.summary}

### Principais Pontos Observados
${item.keyFindings?.map((k: string) => `- ${k}`).join('\n') || '- Monitoramento contínuo pelas autoridades de saúde pública.'}

### Recomendações
- Consulte sempre fontes oficiais como a Organização Mundial da Saúde (OMS) e o Ministério da Saúde para orientações atualizadas.
- Mantenha esquemas vacinais atualizados conforme preconizado pelas diretrizes epidemiológicas.`;
  }
};

