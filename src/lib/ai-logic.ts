import { Formalidade, Clima } from './types';

interface OcasionMap {
  keywords: string[];
  formalidade: Formalidade;
}

const ocasionMappings: OcasionMap[] = [
  {
    keywords: ['casamento', 'formatura', 'colação', 'gala', 'festa elegante', 'cerimônia', 'baile'],
    formalidade: 'Formal',
  },
  {
    keywords: ['jantar', 'restaurante', 'teatro', 'ópera', 'coquetel', 'evento corporativo', 'entrevista'],
    formalidade: 'Esporte Fino',
  },
  {
    keywords: ['trabalho', 'escritório', 'reunião', 'almoço', 'café', 'shopping', 'faculdade', 'aula'],
    formalidade: 'Casual',
  },
  {
    keywords: ['praia', 'parque', 'casa', 'academia', 'corrida', 'fim de semana', 'relaxar', 'treino', 'caminhada'],
    formalidade: 'Informal',
  },
];

// Detectar clima na mensagem
export function detectClima(message: string): Clima | null {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('calor') || lowerMessage.includes('quente') || lowerMessage.includes('sol')) {
    return 'Quente';
  }
  if (lowerMessage.includes('frio') || lowerMessage.includes('gelado') || lowerMessage.includes('inverno')) {
    return 'Frio';
  }
  if (lowerMessage.includes('chuva') || lowerMessage.includes('chuvoso') || lowerMessage.includes('molhado')) {
    return 'Chuvoso';
  }
  if (lowerMessage.includes('ameno') || lowerMessage.includes('fresco')) {
    return 'Ameno';
  }
  
  return null;
}

export function detectFormalidade(message: string): Formalidade {
  const lowerMessage = message.toLowerCase();
  
  for (const mapping of ocasionMappings) {
    for (const keyword of mapping.keywords) {
      if (lowerMessage.includes(keyword)) {
        return mapping.formalidade;
      }
    }
  }
  
  // Default para Casual se não detectar nada específico
  return 'Casual';
}

export function generateResponse(formalidade: Formalidade, hasItems: boolean, clima?: Clima | null): string {
  if (!hasItems) {
    return `Percebi que você quer um look para uma ocasião ${formalidade}${clima ? ` com clima ${clima.toLowerCase()}` : ''}, mas ainda não há peças limpas suficientes no seu guarda-roupa com essas características. Que tal adicionar mais peças fotografando suas roupas? 📸`;
  }

  const climaText = clima ? ` perfeito para o clima ${clima.toLowerCase()}` : '';

  const responses: Record<Formalidade, string[]> = {
    'Formal': [
      `Excelente! Para uma ocasião formal${climaText}, preparei uma combinação elegante e sofisticada:`,
      `Perfeito! Montei um look impecável para esse evento formal${climaText}:`,
      `Que ocasião especial! Aqui está uma combinação formal${climaText} que vai te deixar incrível:`,
    ],
    'Esporte Fino': [
      `Ótima escolha! Para um evento esporte fino${climaText}, selecionei esta combinação equilibrada:`,
      `Perfeito! Montei um look esporte fino${climaText} que une elegância e conforto:`,
      `Para essa ocasião esporte fino${climaText}, preparei uma combinação sofisticada:`,
    ],
    'Casual': [
      `Entendi! Para um dia casual${climaText}, montei esta combinação confortável e estilosa:`,
      `Perfeito! Aqui está um look casual${climaText} que vai te deixar super confortável:`,
      `Para o dia a dia${climaText}, selecionei esta combinação casual e prática:`,
    ],
    'Informal': [
      `Beleza! Para um momento mais descontraído${climaText}, preparei este look informal:`,
      `Perfeito! Montei uma combinação super confortável${climaText} para relaxar:`,
      `Para esse momento informal${climaText}, selecionei peças confortáveis e práticas:`,
    ],
  };

  const options = responses[formalidade];
  return options[Math.floor(Math.random() * options.length)];
}

// Categorias adequadas para cada clima
export function getCategoriasParaClima(clima: Clima): string[] {
  const climaMap: Record<Clima, string[]> = {
    'Quente': ['Blusa', 'Camisa', 'Shorts', 'Vestido', 'Saia', 'Tênis'],
    'Ameno': ['Blusa', 'Camisa', 'Calça', 'Vestido', 'Saia', 'Jaqueta', 'Tênis', 'Sapato'],
    'Frio': ['Moletom', 'Casaco', 'Jaqueta', 'Calça', 'Blazer', 'Sapato', 'Tênis'],
    'Chuvoso': ['Jaqueta', 'Casaco', 'Calça', 'Moletom', 'Tênis'],
  };
  
  return climaMap[clima] || [];
}
