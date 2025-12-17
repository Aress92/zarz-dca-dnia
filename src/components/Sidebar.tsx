// Nawigacja boczna

import React from 'react';
import { CalendarDays, CheckCircle, Clock, ListTodo, Settings, AlertTriangle, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewType = 'today' | 'tasks' | 'calendar' | 'upcoming' | 'overdue' | 'completed' | 'settings';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  taskCounts: {
    today: number;
    overdue: number;
    upcoming: number;
  };
}

const navItems: Array<{ id: ViewType; label: string; icon: React.ElementType; showBadge?: boolean }> = [
  { id: 'today', label: 'Dzisiaj', icon: CalendarCheck, showBadge: true },
  { id: 'tasks', label: 'Zadania', icon: ListTodo },
  { id: 'calendar', label: 'Kalendarz', icon: CalendarDays },
  { id: 'upcoming', label: 'Nadchodzące', icon: Clock, showBadge: true },
  { id: 'overdue', label: 'Zaległe', icon: AlertTriangle, showBadge: true },
  { id: 'completed', label: 'Zakończone', icon: CheckCircle },
];

export function Sidebar({ currentView, onViewChange, taskCounts }: SidebarProps) {
  const getBadgeCount = (id: ViewType): number | undefined => {
    switch (id) {
      case 'today':
        return taskCounts.today > 0 ? taskCounts.today : undefined;
      case 'overdue':
        return taskCounts.overdue > 0 ? taskCounts.overdue : undefined;
      case 'upcoming':
        return taskCounts.upcoming > 0 ? taskCounts.upcoming : undefined;
      default:
        return undefined;
    }
  };

  return (
    <aside className="h-full w-64 border-r border-border bg-sidebar flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-semibold text-sidebar-foreground flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-primary" />
          Produktywność
        </h1>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const badge = item.showBadge ? getBadgeCount(item.id) : undefined;
          const isActive = currentView === item.id;
          const isOverdue = item.id === 'overdue' && badge;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1 text-left">{item.label}</span>
              {badge !== undefined && (
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs rounded-full font-medium',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : isOverdue
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => onViewChange('settings')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            currentView === 'settings'
              ? 'bg-primary text-primary-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          <Settings className="h-5 w-5" />
          <span>Ustawienia</span>
        </button>
      </div>

      <div className="px-4 py-3 text-xs text-muted-foreground border-t border-sidebar-border">
        <p>Skróty: Ctrl+N (nowe), Ctrl+F (szukaj)</p>
      </div>
    </aside>
  );
}
