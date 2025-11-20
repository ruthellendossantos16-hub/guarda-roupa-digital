'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import AuthPage from '@/components/auth-page';
import ChatbotStylish from '@/components/chatbot-stylish';
import WardrobeManager from '@/components/wardrobe-manager';
import CalendarView from '@/components/calendar-view';
import SidebarMenu from '@/components/sidebar-menu';
import { Toaster } from 'sonner';
import { ClothingItem, CalendarLook } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<'wardrobe' | 'calendar' | 'chat'>('wardrobe');
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [looksCount, setLooksCount] = useState(0);

  // Carregar dados do usuário
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Carregar peças do usuário
      const { data: clothingData, error: clothingError } = await supabase
        .from('clothingItems')
        .select('*')
        .eq('userId', user.id);

      if (clothingError) throw clothingError;

      const items = (clothingData || []).map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
      })) as ClothingItem[];
      setClothingItems(items);

      // Carregar looks do calendário do usuário
      const { data: looksData, error: looksError } = await supabase
        .from('calendarLooks')
        .select('*', { count: 'exact', head: true })
        .eq('userId', user.id);

      if (looksError) throw looksError;

      setLooksCount(looksData?.length || 0);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleDataUpdate = () => {
    loadData();
  };

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-gray-950 dark:via-slate-900 dark:to-zinc-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-300 dark:border-slate-700 border-t-slate-800 dark:border-t-slate-300 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Mostrar página de autenticação se não estiver logado
  if (!user) {
    return <AuthPage />;
  }

  // Mostrar aplicação principal se estiver logado
  return (
    <>
      <div className="h-screen flex bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-gray-950 dark:via-slate-900 dark:to-zinc-950">
        {/* Sidebar Menu */}
        <SidebarMenu
          activeView={activeView}
          onViewChange={setActiveView}
          wardrobeCount={clothingItems.length}
          looksCount={looksCount}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden p-6">
          {activeView === 'wardrobe' && (
            <WardrobeManager onDataUpdate={handleDataUpdate} />
          )}
          {activeView === 'calendar' && (
            <CalendarView clothingItems={clothingItems} />
          )}
          {activeView === 'chat' && <ChatbotStylish />}
        </main>
      </div>
      <Toaster position="top-right" />
    </>
  );
}
