// TypeScript interfaces for AI Roofing Estimator

// Re-export database types for convenience
export type {
  Conversation,
  Message as DbMessage,
  StoredEstimate,
} from './database.types';

export interface RoofingProject {
  roofSqft: number;
  pitch: string;
  pitchMultiplier: number;
  shingleType: 'three-tab' | 'architectural' | 'premium';
  stories: number;
  tearOffLayers: number;
  chimneys: number;
  skylights: number;
  valleys: number;
  location: string;
}

export interface LineItem {
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  total: number;
}

export interface Estimate {
  id: string;
  createdAt: string;
  project: RoofingProject;
  roofArea: number;
  squares: number;
  roofPerimeter: number;
  lineItems: LineItem[];
  subtotal: number;
  lowEstimate: number;
  midEstimate: number;
  highEstimate: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ConversationState {
  messages: ChatMessage[];
  isComplete: boolean;
  collectedData: Partial<RoofingProject>;
}

// Pitch multiplier lookup type
export type PitchMultipliers = {
  [key: string]: number;
};

// Regional pricing adjustment type
export interface RegionalPricing {
  region: string;
  states: string[];
  multiplier: number;
}

// Material pricing type
export interface MaterialPricing {
  material: number;
  labor: number;
  installed: {
    low: number;
    mid: number;
    high: number;
  };
}
