'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChatMessage, ClothingItem, Formalidade, Clima } from '@/lib/types';
import { detectFormalidade, detectClima, generateResponse, getCategoriasParaClima } from '@/lib/ai-logic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Cloud, Sun, CloudRain, Wind } from 'lucide-react';

const climaIcons = {
  'Quente': Sun,
  'Ameno': Wind,
  'Frio': Cloud,
  'Chuvoso': CloudRain,
};

export default function ChatbotStylish() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'chatHistory'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      })) as ChatMessage[];
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const montarLook = async (formalidade: Formalidade, clima?: Clima | null): Promise<ClothingItem[]> => {
    const itemsSnapshot = await getDocs(collection(db, 'clothingItems'));
    const allItems = itemsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ClothingItem[];

    // Filtrar peças limpas e com a formalidade correta
    let availableItems = allItems.filter(
      (item) => item.status === 'Limpo' && item.formalidade === formalidade
    );

    // Se clima foi detectado, filtrar por categorias adequadas
    if (clima) {
      const categoriasAdequadas = getCategoriasParaClima(clima);
      availableItems = availableItems.filter((item) => 
        categoriasAdequadas.includes(item.categoria)
      );
    }

    // Categorias de topo e fundo
    const topCategories = ['Blusa', 'Camisa', 'Blazer', 'Jaqueta', 'Moletom', 'Casaco'];
    const bottomCategories = ['Calça', 'Saia', 'Shorts'];
    const dressCategories = ['Vestido'];
    const shoeCategories = ['Sapato', 'Tênis'];

    const look: ClothingItem[] = [];

    // Tentar montar look com vestido
    const vestido = availableItems.find((item) => dressCategories.includes(item.categoria));
    if (vestido) {
      look.push(vestido);
    } else {
      // Montar look com top + bottom
      const top = availableItems.find((item) => topCategories.includes(item.categoria));
      const bottom = availableItems.find((item) => bottomCategories.includes(item.categoria));
      
      if (top) look.push(top);
      if (bottom) look.push(bottom);
    }

    // Adicionar calçado
    const shoe = availableItems.find((item) => shoeCategories.includes(item.categoria));
    if (shoe) look.push(shoe);

    return look;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      // Salvar mensagem do usuário
      await addDoc(collection(db, 'chatHistory'), {
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      });

      // Detectar formalidade e clima
      const formalidade = detectFormalidade(userMessage);
      const clima = detectClima(userMessage);

      // Montar look
      const look = await montarLook(formalidade, clima);

      // Gerar resposta
      const responseText = generateResponse(formalidade, look.length > 0, clima);

      // Salvar resposta da IA
      await addDoc(collection(db, 'chatHistory'), {
        role: 'assistant',
        content: responseText,
        lookSuggestion: look,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 dark:border-slate-800">
        <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-zinc-50 dark:from-slate-900 dark:to-zinc-900">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Bot className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            Assistente de Estilo IA
          </CardTitle>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Descreva a ocasião, clima e dia da semana para receber sugestões personalizadas
          </p>
        </CardHeader>
        <CardContent className="flex-1 p-0 flex flex-col">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 dark:text-slate-400 py-12">
                  <Bot className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="font-medium mb-2">Olá! Sou seu assistente de estilo pessoal 👔</p>
                  <p className="text-sm mb-4">Me conte sobre a ocasião e vou montar o look perfeito:</p>
                  <div className="mt-6 space-y-2 text-xs text-left max-w-md mx-auto bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                    <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">Exemplos:</p>
                    <p>• "Tenho um casamento amanhã e vai estar calor"</p>
                    <p>• "Preciso de um look casual para o trabalho, clima frio"</p>
                    <p>• "Vou a uma entrevista de emprego hoje"</p>
                    <p>• "Final de semana na praia, clima quente"</p>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-slate-700 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[75%] rounded-2xl p-4 ${
                      message.role === 'user'
                        ? 'bg-slate-800 dark:bg-slate-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    
                    {message.lookSuggestion && message.lookSuggestion.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {message.lookSuggestion.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow"
                            >
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.nome}
                                  className="aspect-square object-cover w-full"
                                />
                              ) : (
                                <div className="aspect-square bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                  <span className="text-xs text-slate-500">Sem foto</span>
                                </div>
                              )}
                              <div className="p-2 space-y-1">
                                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                  {item.nome}
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-400">
                                  {item.categoria}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-slate-700 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ex: Preciso de um look para jantar, clima ameno..."
                disabled={loading}
                className="flex-1 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={loading || !input.trim()}
                className="bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
