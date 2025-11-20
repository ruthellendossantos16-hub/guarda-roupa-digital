export type Formalidade = 'Formal' | 'Esporte Fino' | 'Casual' | 'Informal';

export type Categoria = 'Vestido' | 'Calça' | 'Blusa' | 'Sapato' | 'Blazer' | 'Saia' | 'Camisa' | 'Tênis' | 'Jaqueta' | 'Shorts' | 'Moletom' | 'Casaco';

export type Clima = 'Quente' | 'Ameno' | 'Frio' | 'Chuvoso';

export interface ClothingItem {
  id: string;
  userId?: string; // ID do usuário dono da peça
  nome: string;
  categoria: Categoria;
  cor: string;
  formalidade: Formalidade | Formalidade[];
  status: 'Limpo' | 'Sujo';
  imageUrl?: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  lookSuggestion?: ClothingItem[];
  timestamp: Date;
}

export interface WeatherData {
  temp: number;
  condition: string;
  clima: Clima;
}

export interface SavedLook {
  id: string;
  userId?: string; // ID do usuário dono do look
  nome: string;
  items: ClothingItem[];
  ocasiao?: string;
  data?: Date;
  createdAt: Date;
}

export interface CalendarLook {
  id: string;
  userId?: string; // ID do usuário dono do look
  lookId: string;
  date: string; // formato YYYY-MM-DD
  ocasiao: string;
  items: ClothingItem[];
}
