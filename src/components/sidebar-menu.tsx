'use client';

import { Calendar, MessageSquare, Shirt, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

interface SidebarMenuProps {
  activeView: 'wardrobe' | 'calendar' | 'chat';
  onViewChange: (view: 'wardrobe' | 'calendar' | 'chat') => void;
  wardrobeCount: number;
  looksCount: number;
}

export default function SidebarMenu({
  activeView,
  onViewChange,
  wardrobeCount,
  looksCount,
}: SidebarMenuProps) {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      id: 'wardrobe' as const,
      label: 'Guarda-Roupa',
      icon: Shirt,
      count: wardrobeCount,
    },
    {
      id: 'calendar' as const,
      label: 'Calendário',
      icon: Calendar,
      count: looksCount,
    },
    {
      id: 'chat' as const,
      label: 'Assistente',
      icon: MessageSquare,
    },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 rounded-xl flex items-center justify-center">
            <Shirt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-900 dark:text-slate-100">
              Meu Guarda-Roupa
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Organize seus looks
            </p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <div className="w-8 h-8 bg-slate-300 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {user?.displayName || 'Usuário'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {item.count !== undefined && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <Button
          onClick={logout}
          variant="outline"
          className="w-full justify-start gap-3 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
