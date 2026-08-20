
export interface CustomField {
  key: string;
  value: string;
}

export type BearerRank = 'Concept' | 'Object';

export interface Bearer {
  name: string;
  rank: BearerRank;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface CatalogObject {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  dateAdded: number;
  tags: string[];
  location?: string;
  coordinates?: Coordinates; // New field for Map
  notes?: string;
  customFields?: CustomField[];
  bearer?: Bearer;
  threatGrade?: string; // Vínculo com a Classificação de Ameaça
  powerLevel?: number; // 0 a 10000+ para ranqueamento de força
  containmentLog?: string; // Registro de contenção colocado pelo admin
}

export interface ThreatLevel {
  id: string;
  grade: string; // e.g., "Classe Especial", "Classe 1"
  color: string;
  description: string;
  clearanceLevel: number;
}

export interface Story {
  id: string;
  imageUrl: string;
  title: string;
  isSeen: boolean;
  date: number;
}

export interface DisasterEvent {
  id: string;
  location: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  createdAt?: number;
  fullArticle?: string;
  coordinates?: { lat: number, lng: number };
}

export interface InfectionNewsItem {
  id: string;
  title: string;
  source: string;
  url?: string;
  publishedDate?: string;
  category: 'surto' | 'estudo' | 'alerta_oms' | 'resistencia' | 'mutacao' | 'outro';
  summary: string;
  fullAnalysis?: string;
  location?: string;
  pathogen?: string; // e.g. "H5N1", "Mpox", "Candida auris", "Dengue", "SARS-CoV-2", etc.
  groundingLinks?: Array<{ title: string; uri: string }>;
  keyFindings?: string[];
  createdAt: number;
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  groundingLinks?: Array<{ title: string; uri: string }>;
}

export interface MapResult {
  title: string;
  uri: string;
  snippet?: string;
}

export enum AiMode {
  FAST = 'fast',
  THINKING = 'thinking',
  SEARCH = 'search',
  MAPS = 'maps',
  VISION = 'vision',
  IMAGE_GEN = 'image_gen'
}

export interface NotificationPreferences {
  enabled: boolean;
  watchedTags: string[];
  watchedGrades: string[];
}

export interface DisasterAlertPreference {
  enabled: boolean;
  watchedTypes: string[];
  watchedLocations: string[];
  minSeverity: 'low' | 'medium' | 'high' | 'critical';
}

export interface BackgroundPreferences {
  enabled: boolean;
  opacity: number; // 10 to 100
  blur: number; // 0 to 10px
  customUrl?: string;
  dimOverlay: boolean;
  position: 'center' | 'left' | 'right';
}
