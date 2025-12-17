// Formularz przypomnienia

import React, { useState } from 'react';
import { Reminder, ReminderChannel } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { generateId } from '@/lib/utils/helpers';
import { format } from 'date-fns';

interface ReminderFormProps {
  taskId: string;
  taskTitle: string;
  onSave: (reminder: Reminder) => void;
  onCancel: () => void;
}

export function ReminderForm({ taskId, taskTitle, onSave, onCancel }: ReminderFormProps) {
  const [title, setTitle] = useState(taskTitle);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [channels, setChannels] = useState<ReminderChannel[]>(['desktop']);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleChannel = (channel: ReminderChannel) => {
    if (channels.includes(channel)) {
      setChannels(channels.filter((c) => c !== channel));
    } else {
      setChannels([...channels, channel]);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Tytuł jest wymagany';
    }
    if (!date) {
      newErrors.date = 'Data jest wymagana';
    }
    if (!time) {
      newErrors.time = 'Godzina jest wymagana';
    }
    if (channels.length === 0) {
      newErrors.channels = 'Wybierz przynajmniej jeden kanał';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const datetime = new Date(`${date}T${time}`).toISOString();

    const reminder: Reminder = {
      id: generateId(),
      taskId,
      datetime,
      channels,
      title: title.trim(),
      description: description.trim() || undefined,
      completed: false,
    };

    onSave(reminder);
  };

  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reminderTitle">Tytuł przypomnienia *</Label>
          <Input
            id="reminderTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tytuł"
          />
          {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reminderDescription">Krótki opis</Label>
          <Input
            id="reminderDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opcjonalny opis"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="reminderDate">Data *</Label>
            <Input
              id="reminderDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminderTime">Godzina *</Label>
            <Input
              id="reminderTime"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Kanały powiadomienia *</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={channels.includes('desktop')}
                onCheckedChange={() => toggleChannel('desktop')}
              />
              <span className="text-sm">Pulpit</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={channels.includes('email')}
                onCheckedChange={() => toggleChannel('email')}
              />
              <span className="text-sm">E-mail</span>
            </label>
          </div>
          {errors.channels && <p className="text-sm text-destructive">{errors.channels}</p>}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Anuluj
          </Button>
          <Button type="submit" size="sm">
            Dodaj przypomnienie
          </Button>
        </div>
      </form>
    </div>
  );
}
