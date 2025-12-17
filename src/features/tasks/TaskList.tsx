// Lista zadań z filtrowaniem i wyszukiwaniem

import React, { useState, useMemo } from 'react';
import { Task, Priority, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Plus, SortAsc, Filter } from 'lucide-react';
import { getPriorityLabel, getStatusLabel } from '@/lib/utils/helpers';

interface TaskListProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskStatusChange: (task: Task, status: 'done' | 'todo') => void;
  onAddTask: () => void;
  showAddButton?: boolean;
  emptyMessage?: string;
  filterStatus?: TaskStatus;
}

type SortField = 'dueDate' | 'priority' | 'status' | 'order';
type SortDirection = 'asc' | 'desc';

export function TaskList({
  tasks,
  onTaskClick,
  onTaskStatusChange,
  onAddTask,
  showAddButton = true,
  emptyMessage = 'Brak zadań',
  filterStatus,
}: TaskListProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('order');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterTag, setFilterTag] = useState<string>('all');

  // Wszystkie tagi z zadań
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    tasks.forEach((task) => task.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [tasks]);

  // Filtrowanie i sortowanie
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Filtrowanie po statusie
    if (filterStatus) {
      result = result.filter((task) => task.status === filterStatus);
    }

    // Wyszukiwanie
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filtrowanie po priorytecie
    if (filterPriority !== 'all') {
      result = result.filter((task) => task.priority === filterPriority);
    }

    // Filtrowanie po tagu
    if (filterTag !== 'all') {
      result = result.filter((task) => task.tags.includes(filterTag));
    }

    // Sortowanie
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'status':
          const statusOrder = { todo: 0, in_progress: 1, done: 2 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'order':
        default:
          comparison = a.order - b.order;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tasks, search, filterStatus, filterPriority, filterTag, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj zadań..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as Priority | 'all')}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Priorytet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="high">{getPriorityLabel('high')}</SelectItem>
            <SelectItem value="medium">{getPriorityLabel('medium')}</SelectItem>
            <SelectItem value="low">{getPriorityLabel('low')}</SelectItem>
          </SelectContent>
        </Select>

        {allTags.length > 0 && (
          <Select value={filterTag} onValueChange={setFilterTag}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie tagi</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={sortField} onValueChange={(v) => toggleSort(v as SortField)}>
          <SelectTrigger className="w-[140px]">
            <SortAsc className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sortuj" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="order">Kolejność</SelectItem>
            <SelectItem value="dueDate">Termin</SelectItem>
            <SelectItem value="priority">Priorytet</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>

        {showAddButton && (
          <Button onClick={onAddTask}>
            <Plus className="h-4 w-4 mr-2" />
            Nowe zadanie
          </Button>
        )}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg text-muted-foreground">{emptyMessage}</p>
            {showAddButton && (
              <Button variant="outline" className="mt-4" onClick={onAddTask}>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj pierwsze zadanie
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
                onStatusChange={(status) => onTaskStatusChange(task, status)}
                draggable
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
