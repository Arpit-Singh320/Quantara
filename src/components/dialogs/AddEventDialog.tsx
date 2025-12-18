/**
 * Add/Edit Event Dialog
 * Production-grade form for creating and editing calendar events
 */

import { useState, useEffect } from 'react';
import { Loader2, Calendar, Clock, Users, Video, Phone, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const EVENT_TYPES = [
  { value: 'meeting', label: 'Client Meeting', icon: Users },
  { value: 'call', label: 'Phone Call', icon: Phone },
  { value: 'video', label: 'Video Conference', icon: Video },
  { value: 'renewal', label: 'Renewal Review', icon: FileText },
  { value: 'deadline', label: 'Deadline', icon: Clock },
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00',
];

const DURATIONS = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
];

interface Client {
  id: string;
  name: string;
  company: string;
}

interface EventFormData {
  title: string;
  type: string;
  clientId: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  description: string;
  attendees: string;
  addGoogleMeet: boolean;
  syncToGoogle: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  client: string;
  date: string;
  time: string;
  duration: number;
  location?: string;
  description?: string;
}

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (event: CalendarEvent) => void;
  clients: Client[];
  preselectedDate?: string;
  editEvent?: CalendarEvent | null;
  isGoogleConnected?: boolean;
  onGoogleEventCreated?: () => void;
}

const initialFormData: EventFormData = {
  title: '',
  type: 'meeting',
  clientId: '',
  date: '',
  time: '09:00',
  duration: '60',
  location: '',
  description: '',
  attendees: '',
  addGoogleMeet: false,
  syncToGoogle: false,
};

export function AddEventDialog({
  open,
  onOpenChange,
  onSuccess,
  clients,
  preselectedDate,
  editEvent,
  isGoogleConnected = false,
  onGoogleEventCreated
}: AddEventDialogProps) {
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});
  const [createdMeetLink, setCreatedMeetLink] = useState<string | null>(null);

  const isEditMode = !!editEvent;

  useEffect(() => {
    if (editEvent) {
      const client = clients.find(c => c.company === editEvent.client || c.name === editEvent.client);
      setFormData({
        title: editEvent.title,
        type: editEvent.type,
        clientId: client?.id || '',
        date: editEvent.date,
        time: editEvent.time,
        duration: editEvent.duration?.toString() || '60',
        location: editEvent.location || '',
        description: editEvent.description || '',
        attendees: '',
        addGoogleMeet: false,
        syncToGoogle: false,
      });
    } else {
      setFormData({
        ...initialFormData,
        date: preselectedDate || new Date().toISOString().split('T')[0],
        syncToGoogle: isGoogleConnected,
      });
    }
    setErrors({});
    setCreatedMeetLink(null);
  }, [editEvent, preselectedDate, open, clients, isGoogleConnected]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.type) {
      newErrors.type = 'Please select an event type';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.time) {
      newErrors.time = 'Time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const selectedClient = clients.find(c => c.id === formData.clientId);

      // If syncing to Google Calendar
      if (formData.syncToGoogle && isGoogleConnected) {
        const apiUrl = import.meta.env.VITE_API_URL ||
          (import.meta.env.PROD ? 'https://backend-production-ceb3.up.railway.app' : 'http://localhost:3001');
        const token = localStorage.getItem('auth_token');

        // Calculate start and end times
        const startDateTime = new Date(`${formData.date}T${formData.time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + parseInt(formData.duration) * 60 * 1000);

        // Parse attendees
        const attendeeEmails = formData.attendees
          .split(',')
          .map(e => e.trim())
          .filter(e => e.length > 0 && e.includes('@'));

        const response = await fetch(`${apiUrl}/api/connectors/google/calendar/events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: formData.title.trim(),
            description: formData.description.trim(),
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            location: formData.location.trim(),
            attendees: attendeeEmails,
            addGoogleMeet: formData.addGoogleMeet,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.event?.meetLink) {
            setCreatedMeetLink(data.event.meetLink);
            toast.success(
              <div>
                <p>Event created with Google Meet!</p>
                <a href={data.event.meetLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                  Join Meeting
                </a>
              </div>
            );
          } else {
            toast.success('Event created in Google Calendar!');
          }
          onGoogleEventCreated?.();

          // Also create local event for immediate display
          const newEvent: CalendarEvent = {
            id: `google-${data.event?.id || Date.now()}`,
            title: formData.title.trim(),
            type: formData.type,
            client: selectedClient?.company || 'No client',
            date: formData.date,
            time: formData.time,
            duration: parseInt(formData.duration),
            location: data.event?.meetLink ? 'Google Meet' : formData.location.trim() || undefined,
            description: formData.description.trim() || undefined,
          };
          onSuccess?.(newEvent);
          onOpenChange(false);
        } else if (response.status === 401) {
          // Token expired or not connected
          toast.error('Google Calendar not connected. Please reconnect your Google account.');
          // Reset sync option
          setFormData(prev => ({ ...prev, syncToGoogle: false }));
        } else {
          const error = await response.text();
          console.error('Failed to create Google event:', error);
          toast.error('Failed to create event in Google Calendar');
        }
      } else {
        // Create local event only
        const newEvent: CalendarEvent = {
          id: editEvent?.id || `event-${Date.now()}`,
          title: formData.title.trim(),
          type: formData.type,
          client: selectedClient?.company || 'No client',
          date: formData.date,
          time: formData.time,
          duration: parseInt(formData.duration),
          location: formData.location.trim() || undefined,
          description: formData.description.trim() || undefined,
        };

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        toast.success(isEditMode ? 'Event updated successfully' : 'Event created successfully');
        onOpenChange(false);
        onSuccess?.(newEvent);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof EventFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getEventTypeIcon = (type: string) => {
    const eventType = EVENT_TYPES.find(t => t.value === type);
    return eventType?.icon || Calendar;
  };

  const EventIcon = getEventTypeIcon(formData.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EventIcon className="h-5 w-5 text-primary" />
            {isEditMode ? 'Edit Event' : 'Schedule New Event'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Event Details
            </h3>

            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Quarterly Review Meeting"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Event Type *</Label>
                <Select value={formData.type} onValueChange={(value) => updateField('type', value)}>
                  <SelectTrigger className={errors.type ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-xs text-destructive">{errors.type}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Client (Optional)</Label>
                <Select value={formData.clientId || "none"} onValueChange={(value) => updateField('clientId', value === "none" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company} - {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Date & Time
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className={errors.date ? 'border-destructive' : ''}
                />
                {errors.date && (
                  <p className="text-xs text-destructive">{errors.date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Start Time *</Label>
                <Select value={formData.time} onValueChange={(value) => updateField('time', value)}>
                  <SelectTrigger className={errors.time ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.time && (
                  <p className="text-xs text-destructive">{errors.time}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select value={formData.duration} onValueChange={(value) => updateField('duration', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((duration) => (
                      <SelectItem key={duration.value} value={duration.value}>
                        {duration.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Location & Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location & Details
            </h3>

            <div className="space-y-2">
              <Label htmlFor="location">Location / Meeting Link</Label>
              <Input
                id="location"
                placeholder="e.g., Conference Room A or https://zoom.us/..."
                value={formData.location}
                onChange={(e) => updateField('location', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendees">Attendees (comma-separated emails)</Label>
              <Input
                id="attendees"
                placeholder="e.g., john@example.com, jane@example.com"
                value={formData.attendees}
                onChange={(e) => updateField('attendees', e.target.value)}
              />
            </div>

            {/* Google Calendar Options */}
            {isGoogleConnected && (
              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Video className="h-4 w-4" />
                  <span className="text-sm font-medium">Google Calendar Options</span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="syncToGoogle"
                    checked={formData.syncToGoogle}
                    onChange={(e) => setFormData(prev => ({ ...prev, syncToGoogle: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="syncToGoogle" className="text-sm cursor-pointer">
                    Sync to Google Calendar
                  </Label>
                </div>

                {formData.syncToGoogle && (
                  <div className="flex items-center gap-3 ml-7">
                    <input
                      type="checkbox"
                      id="addGoogleMeet"
                      checked={formData.addGoogleMeet}
                      onChange={(e) => setFormData(prev => ({ ...prev, addGoogleMeet: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="addGoogleMeet" className="text-sm cursor-pointer flex items-center gap-2">
                      <Video className="h-4 w-4 text-green-600" />
                      Add Google Meet video call
                    </Label>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description / Notes</Label>
              <Textarea
                id="description"
                placeholder="Add any additional details or agenda items..."
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditMode ? 'Update Event' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddEventDialog;
