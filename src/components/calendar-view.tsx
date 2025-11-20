'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarLook, ClothingItem } from '@/lib/types';
import { collection, addDoc, query, getDocs, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

interface CalendarViewProps {
  clothingItems: ClothingItem[];
}

export default function CalendarView({ clothingItems }: CalendarViewProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarLooks, setCalendarLooks] = useState<CalendarLook[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [ocasiao, setOcasiao] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Carregar looks do calendário do usuário
  useEffect(() => {
    if (user) {
      loadCalendarLooks();
    }
  }, [user]);

  const loadCalendarLooks = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'calendarLooks'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const looks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CalendarLook[];
      setCalendarLooks(looks);
    } catch (error) {
      console.error('Erro ao carregar looks do calendário:', error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getLookForDate = (dateStr: string) => {
    return calendarLooks.find((look) => look.date === dateStr);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    const existingLook = getLookForDate(dateStr);
    if (!existingLook) {
      setIsDialogOpen(true);
      setOcasiao('');
      setSelectedItems([]);
    }
  };

  const handleSaveLook = async () => {
    if (!user) {
      toast.error('Você precisa estar logado!');
      return;
    }

    if (!selectedDate || !ocasiao || selectedItems.length === 0) {
      toast.error('Preencha todos os campos e selecione pelo menos uma peça');
      return;
    }

    try {
      const items = clothingItems.filter((item) => selectedItems.includes(item.id));
      
      await addDoc(collection(db, 'calendarLooks'), {
        userId: user.uid,
        lookId: `look-${Date.now()}`,
        date: selectedDate,
        ocasiao,
        items,
      });

      toast.success('Look salvo no calendário!');
      setIsDialogOpen(false);
      loadCalendarLooks();
    } catch (error) {
      console.error('Erro ao salvar look:', error);
      toast.error('Erro ao salvar look');
    }
  };

  const handleDeleteLook = async (lookId: string) => {
    try {
      await deleteDoc(doc(db, 'calendarLooks', lookId));
      toast.success('Look removido do calendário');
      loadCalendarLooks();
    } catch (error) {
      console.error('Erro ao deletar look:', error);
      toast.error('Erro ao remover look');
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">
            {monthName}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
              className="rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-7 gap-2">
          {/* Week days header */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Calendar days */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dateStr = formatDate(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              day
            );
            const look = getLookForDate(dateStr);
            const isToday =
              dateStr ===
              formatDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

            return (
              <div
                key={day}
                onClick={() => handleDateClick(dateStr)}
                className={`aspect-square border rounded-lg p-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isToday
                    ? 'border-slate-700 bg-slate-50 dark:bg-slate-900'
                    : 'border-gray-200 dark:border-gray-700 hover:border-slate-400'
                } ${look ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
              >
                <div className="flex flex-col h-full">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {day}
                  </span>
                  {look && (
                    <div className="flex-1 flex flex-col justify-center items-center mt-1">
                      <Sparkles className="w-4 h-4 text-slate-600 dark:text-slate-400 mb-1" />
                      <span className="text-xs text-gray-600 dark:text-gray-400 text-center line-clamp-2">
                        {look.ocasiao}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLook(look.id);
                        }}
                        className="mt-1 p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                      >
                        <X className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialog para adicionar look */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Planejar Look para {selectedDate}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="ocasiao">Ocasião</Label>
              <Input
                id="ocasiao"
                placeholder="Ex: Reunião de trabalho, Jantar, Festa..."
                value={ocasiao}
                onChange={(e) => setOcasiao(e.target.value)}
              />
            </div>

            <div>
              <Label>Selecione as peças do look</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {clothingItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleItemSelection(item.id)}
                    className={`cursor-pointer border-2 rounded-lg p-2 transition-all ${
                      selectedItems.includes(item.id)
                        ? 'border-slate-700 bg-slate-50 dark:bg-slate-900'
                        : 'border-gray-200 dark:border-gray-700 hover:border-slate-400'
                    }`}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.nome}
                        className="w-full h-24 object-cover rounded"
                      />
                    ) : (
                      <div
                        className="w-full h-24 rounded flex items-center justify-center"
                        style={{ backgroundColor: item.cor }}
                      >
                        <span className="text-xs text-white font-medium">{item.nome}</span>
                      </div>
                    )}
                    <p className="text-xs text-center mt-1 text-gray-700 dark:text-gray-300">
                      {item.nome}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSaveLook} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Salvar Look
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
