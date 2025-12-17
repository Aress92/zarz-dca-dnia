// Formularz zadania

import React, { useState, useEffect } from 'react';
import { Task, Priority, TaskStatus, RecurrenceType, Reminder } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Plus, Trash2, X, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { generateId, getPriorityLabel, getStatusLabel, getRecurrenceLabel } from '@/lib/utils/helpers';
import { ReminderForm } from './ReminderForm';

interface TaskFormProps {
  task: Task | null;
  onSave: (task: Task) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function TaskForm({ task, onSave, onDelete, onClose }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [dueDate, setDueDate] = useState<Date | undefined>(task?.dueDate ? new Date(task.dueDate) : undefined);
  const [dueTime, setDueTime] = useState(task?.dueTime || '');
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>(task?.recurrence || 'none');
  const [customInterval, setCustomInterval] = useState(task?.customRecurrenceInterval || 1);
  const [reminders, setReminders] = useState<Reminder[]>(task?.reminders || []);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isNew = !task || !task.title;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Tytuł jest wymagany';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const now = new Date().toISOString();
    const updatedTask: Task = {
      id: task?.id || generateId(),
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      dueDate: dueDate?.toISOString(),
      dueTime: dueTime || undefined,
      tags,
      recurrence,
      customRecurrenceInterval: recurrence === 'custom' ? customInterval : undefined,
      reminders,
      order: task?.order || 0,
      createdAt: task?.createdAt || now,
      updatedAt: now,
    };

    onSave(updatedTask);
  };

  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const addReminder = (reminder: Reminder) => {
    setReminders([...reminders, reminder]);
    setShowReminderForm(false);
  };

  const removeReminder = (reminderId: string) => {
    setReminders(reminders.filter((r) => r.id !== reminderId));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold">{isNew ? 'Nowe zadanie' : 'Edytuj zadanie'}</h2>
        <Button type="button" variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Tytuł */}
        <div className="space-y-2">
          <Label htmlFor="title">Tytuł *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nazwa zadania"
            className={cn(errors.title && 'border-destructive')}
          />
          {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
        </div>

        {/* Opis */}
        <div className="space-y-2">
          <Label htmlFor="description">Opis (Markdown)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Szczegóły zadania..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Priorytet */}
          <div className="space-y-2">
            <Label>Priorytet</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{getPriorityLabel('low')}</SelectItem>
                <SelectItem value="medium">{getPriorityLabel('medium')}</SelectItem>
                <SelectItem value="high">{getPriorityLabel('high')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">{getStatusLabel('todo')}</SelectItem>
                <SelectItem value="in_progress">{getStatusLabel('in_progress')}</SelectItem>
                <SelectItem value="done">{getStatusLabel('done')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Termin */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !dueDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP', { locale: pl }) : 'Wybierz datę'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  locale={pl}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueTime">Godzina</Label>
            <Input
              id="dueTime"
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
            />
          </div>
        </div>

        {/* Powtarzalność */}
        <div className="space-y-2">
          <Label>Powtarzalność</Label>
          <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrenceType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{getRecurrenceLabel('none')}</SelectItem>
              <SelectItem value="daily">{getRecurrenceLabel('daily')}</SelectItem>
              <SelectItem value="weekly">{getRecurrenceLabel('weekly')}</SelectItem>
              <SelectItem value="monthly">{getRecurrenceLabel('monthly')}</SelectItem>
              <SelectItem value="custom">{getRecurrenceLabel('custom')}</SelectItem>
            </SelectContent>
          </Select>
          {recurrence === 'custom' && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm">Co</span>
              <Input
                type="number"
                min={1}
                value={customInterval}
                onChange={(e) => setCustomInterval(parseInt(e.target.value) || 1)}
                className="w-20"
              />
              <span className="text-sm">dni</span>
            </div>
          )}
        </div>

        {/* Tagi */}
        <div className="space-y-2">
          <Label>Tagi</Label>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Dodaj tag"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" variant="secondary" size="icon" onClick={addTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Przypomnienia */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Przypomnienia
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowReminderForm(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Dodaj
            </Button>
          </div>

          {showReminderForm && (
            <ReminderForm
              taskId={task?.id || ''}
              taskTitle={title || 'Nowe zadanie'}
              onSave={addReminder}
              onCancel={() => setShowReminderForm(false)}
            />
          )}

          {reminders.length > 0 && (
            <div className="space-y-2">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{reminder.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(reminder.datetime), 'PPP HH:mm', { locale: pl })}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {reminder.channels.map((channel) => (
                        <Badge key={channel} variant="outline" className="text-xs">
                          {channel === 'desktop' ? 'Pulpit' : 'E-mail'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeReminder(reminder.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-border">
        {!isNew && onDelete ? (
          <Button type="button" variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Usuń
          </Button>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button type="submit">
            {isNew ? 'Dodaj' : 'Zapisz'}
          </Button>
        </div>
      </div>
    </form>
  );
}
