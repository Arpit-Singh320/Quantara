import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Plus, Clock, Users, Video, Phone, MapPin,
  MoreHorizontal, Edit, Trash2, CalendarDays, Link2, Loader2, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { useClients } from '@/hooks/useClients';
import { AddEventDialog } from '@/components/dialogs/AddEventDialog';
import { api, CalendarEvent as APICalendarEvent } from '@/services/api';
import { toast } from 'sonner';

type CalendarEventBadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'secondary';

interface CalendarEvent {
  id: string;
  title: string;
  client: string;
  type: 'meeting' | 'call' | 'renewal' | 'deadline';
  date: string;
  time: string;
  duration: number;
  location?: string;
  description?: string;
  source?: 'local' | 'google';
  htmlLink?: string;
  meetLink?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
    organizer?: boolean;
  }>;
  status?: string;
}

interface GoogleCalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  location: string;
  htmlLink: string;
  meetLink?: string;
  source: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
    organizer?: boolean;
  }>;
  creator?: string;
  organizer?: string;
  isAllDay?: boolean;
  status?: string;
}

// Generate current week dates for mock events
const today = new Date();
const getDateString = (daysOffset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

const initialMockEvents: CalendarEvent[] = [
  {
    id: 'mock-1',
    title: 'Renewal Review',
    client: 'TechFlow Industries',
    type: 'meeting',
    date: getDateString(0),
    time: '09:00',
    duration: 60,
    location: 'Video Call',
    description: 'Annual renewal discussion for GL and Cyber policies',
  },
  {
    id: 'mock-2',
    title: 'Policy Expiration',
    client: 'GreenLeaf Logistics',
    type: 'renewal',
    date: getDateString(1),
    time: '00:00',
    duration: 0,
    description: 'Cyber Liability policy expires',
  },
  {
    id: 'mock-3',
    title: 'Quote Follow-up',
    client: 'Summit Healthcare',
    type: 'call',
    date: getDateString(1),
    time: '14:00',
    duration: 30,
    description: 'Discuss workers comp quote options',
  },
  {
    id: 'mock-4',
    title: 'Claims Review',
    client: 'Coastal Manufacturing',
    type: 'meeting',
    date: getDateString(2),
    time: '10:30',
    duration: 45,
    location: 'Office - Room 3B',
    description: 'Review pending claims and coverage adjustments',
  },
  {
    id: 'mock-5',
    title: 'New Client Onboarding',
    client: 'Atlas Ventures',
    type: 'meeting',
    date: getDateString(3),
    time: '11:00',
    duration: 90,
    location: 'Video Call',
    description: 'Initial consultation and needs assessment',
  },
  {
    id: 'mock-6',
    title: 'Submission Deadline',
    client: 'Metro Construction',
    type: 'deadline',
    date: getDateString(4),
    time: '17:00',
    duration: 0,
    description: 'Property insurance submission deadline',
  },
  {
    id: 'mock-7',
    title: 'Quarterly Review',
    client: 'TechFlow Industries',
    type: 'meeting',
    date: getDateString(5),
    time: '15:00',
    duration: 60,
    location: 'Client Office',
    description: 'Q4 portfolio review and 2025 planning',
  },
];

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<'week' | 'day'>('week');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>(initialMockEvents);
  const [preselectedDate, setPreselectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [isMicrosoftConnected, setIsMicrosoftConnected] = useState(false);
  const [isConnectingMicrosoft, setIsConnectingMicrosoft] = useState(false);
  const [microsoftEvents, setMicrosoftEvents] = useState<CalendarEvent[]>([]);

  const { clients } = useClients();

  // Check if redirected from OAuth
  useEffect(() => {
    const connected = searchParams.get('connected');
    if (connected === 'google') {
      setIsGoogleConnected(true);
      toast.success('Google Calendar connected successfully!');
      fetchGoogleCalendarEvents();
    } else if (connected === 'microsoft') {
      setIsMicrosoftConnected(true);
      toast.success('Microsoft Calendar connected successfully!');
      fetchMicrosoftCalendarEvents();
    }
  }, [searchParams]);

  // Connect to Google Calendar
  const connectGoogleCalendar = async () => {
    try {
      setIsConnectingGoogle(true);
      const response = await api.getConnectorAuthUrl('google');
      if (response.data?.authUrl) {
        // Redirect to Google OAuth
        window.location.href = response.data.authUrl;
      } else {
        toast.error('Failed to get Google auth URL');
      }
    } catch (error) {
      toast.error('Failed to connect to Google Calendar');
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  // Connect to Microsoft Calendar
  const connectMicrosoftCalendar = async () => {
    try {
      setIsConnectingMicrosoft(true);
      const response = await api.getConnectorAuthUrl('microsoft');
      if (response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        toast.error('Failed to get Microsoft auth URL');
      }
    } catch (error) {
      toast.error('Failed to connect to Microsoft Calendar');
    } finally {
      setIsConnectingMicrosoft(false);
    }
  };

  // Fetch Microsoft Calendar events
  const fetchMicrosoftCalendarEvents = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL ||
        (import.meta.env.PROD ? 'https://backend-production-ceb3.up.railway.app' : 'http://localhost:3001');
      const token = localStorage.getItem('auth_token');

      const response = await fetch(
        `${apiUrl}/api/connectors/microsoft/calendar/events`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const transformedEvents: CalendarEvent[] = data.events.map((e: any) => {
          const startDate = new Date(e.start);
          const endDate = e.end ? new Date(e.end) : new Date(startDate.getTime() + 60 * 60 * 1000);
          const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

          return {
            id: `microsoft-${e.id}`,
            title: e.title,
            client: e.organizer || '',
            type: 'meeting' as const,
            date: startDate.toISOString().split('T')[0],
            time: startDate.toTimeString().slice(0, 5),
            duration: durationMinutes,
            location: e.location || (e.meetingUrl ? 'Microsoft Teams' : ''),
            description: '',
            source: 'microsoft' as 'local' | 'google',
            htmlLink: e.deepLink,
            meetLink: e.meetingUrl,
            attendees: e.attendees?.map((a: string) => ({ email: '', displayName: a })),
          };
        });
        setMicrosoftEvents(transformedEvents);
        setIsMicrosoftConnected(true);
      } else if (response.status === 401) {
        setIsMicrosoftConnected(false);
        setMicrosoftEvents([]);
      }
    } catch (error) {
      console.error('Failed to fetch Microsoft Calendar events:', error);
    }
  };

  // Fetch Google Calendar events
  const fetchGoogleCalendarEvents = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL ||
        (import.meta.env.PROD ? 'https://backend-production-ceb3.up.railway.app' : 'http://localhost:3001');
      const token = localStorage.getItem('auth_token');

      // Fetch events for 3 months range
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();

      const response = await fetch(
        `${apiUrl}/api/connectors/google/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Transform Google events to our format with full details
        const transformedEvents: CalendarEvent[] = data.events.map((e: GoogleCalendarEvent) => {
          const startDate = new Date(e.start);
          const endDate = e.end ? new Date(e.end) : new Date(startDate.getTime() + 60 * 60 * 1000);
          const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

          return {
            id: `google-${e.id}`,
            title: e.title,
            client: e.organizer || '',
            type: 'meeting' as const,
            date: startDate.toISOString().split('T')[0],
            time: e.isAllDay ? '00:00' : startDate.toTimeString().slice(0, 5),
            duration: durationMinutes,
            location: e.location || (e.meetLink ? 'Google Meet' : ''),
            description: e.description,
            source: 'google' as const,
            htmlLink: e.htmlLink,
            meetLink: e.meetLink,
            attendees: e.attendees,
            status: e.status,
          };
        });
        setGoogleEvents(transformedEvents);
        setIsGoogleConnected(true);
      } else if (response.status === 401) {
        // Token expired or not connected - reset state
        setIsGoogleConnected(false);
        setGoogleEvents([]);
      }
    } catch (error) {
      console.error('Failed to fetch Google Calendar events:', error);
    }
  };

  // Check calendar connection status on mount
  useEffect(() => {
    const checkCalendarConnections = async () => {
      try {
        const response = await api.getConnectors();
        if (response.data?.connectors?.google?.connected) {
          setIsGoogleConnected(true);
          fetchGoogleCalendarEvents();
        }
        if (response.data?.connectors?.microsoft?.connected) {
          setIsMicrosoftConnected(true);
          fetchMicrosoftCalendarEvents();
        }
      } catch (error) {
        // Ignore - not connected
      }
    };
    checkCalendarConnections();
  }, []);

  // Fetch events from API on mount
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.getCalendarEvents();
      if (response.data?.events) {
        // Merge API events with mock events (mock events have 'mock-' prefix)
        const apiEvents: CalendarEvent[] = response.data.events.map(e => ({
          id: e.id,
          title: e.title,
          client: e.client || '',
          type: e.type,
          date: e.date,
          time: e.time,
          duration: e.duration,
          location: e.location,
          description: e.description,
        }));
        // Keep mock events and add API events
        setEvents([...initialMockEvents, ...apiEvents]);
      }
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      // Keep using mock events on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleAddEvent = async (newEvent: CalendarEvent) => {
    // If it's a mock event (from AddEventDialog), try to persist to API
    try {
      const response = await api.createCalendarEvent({
        title: newEvent.title,
        description: newEvent.description,
        type: newEvent.type,
        date: newEvent.date,
        time: newEvent.time,
        duration: newEvent.duration,
        location: newEvent.location,
      });

      if (response.data?.event) {
        // Add the API-created event
        const apiEvent: CalendarEvent = {
          id: response.data.event.id,
          title: response.data.event.title,
          client: response.data.event.client || newEvent.client,
          type: response.data.event.type,
          date: response.data.event.date,
          time: response.data.event.time,
          duration: response.data.event.duration,
          location: response.data.event.location,
          description: response.data.event.description,
        };
        setEvents(prev => [...prev, apiEvent]);
        toast.success('Event created successfully');
      } else {
        // Fallback to local state if API fails
        setEvents(prev => [...prev, { ...newEvent, id: `local-${Date.now()}` }]);
        toast.success('Event created (offline mode)');
      }
    } catch (error) {
      // Fallback to local state
      setEvents(prev => [...prev, { ...newEvent, id: `local-${Date.now()}` }]);
      toast.success('Event created (offline mode)');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    // Don't try to delete mock events from API
    if (!eventId.startsWith('mock-') && !eventId.startsWith('local-')) {
      try {
        await api.deleteCalendarEvent(eventId);
      } catch (error) {
        console.error('Failed to delete event from API:', error);
      }
    }
    setEvents(prev => prev.filter(e => e.id !== eventId));
    setSelectedEvent(null);
    toast.success('Event deleted successfully');
  };

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return 'bg-primary';
      case 'call': return 'bg-success';
      case 'renewal': return 'bg-warning';
      case 'deadline': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getEventTypeBadge = (type: CalendarEvent['type']): CalendarEventBadgeVariant => {
    switch (type) {
      case 'meeting': return 'default';
      case 'call': return 'success';
      case 'renewal': return 'warning';
      case 'deadline': return 'danger';
      default: return 'secondary';
    }
  };

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return Video;
      case 'call': return Phone;
      case 'renewal': return CalendarDays;
      case 'deadline': return Clock;
      default: return CalendarDays;
    }
  };

  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    const localEvents = events.filter(event => event.date === dateStr);
    const gEvents = googleEvents.filter(event => event.date === dateStr);
    const msEvents = microsoftEvents.filter(event => event.date === dateStr);
    return [...localEvents, ...gEvents, ...msEvents];
  };

  const allEvents = [...events, ...googleEvents, ...microsoftEvents];

  const getEventSourceColor = (event: CalendarEvent) => {
    if (event.id.startsWith('google-')) return 'bg-blue-500';
    if (event.id.startsWith('microsoft-')) return 'bg-purple-500';
    return getEventTypeColor(event.type);
  };

  const getEventSourceBadge = (event: CalendarEvent) => {
    if (event.id.startsWith('google-')) return { label: 'G', color: 'bg-blue-500' };
    if (event.id.startsWith('microsoft-')) return { label: 'M', color: 'bg-purple-500' };
    return null;
  };

  const todaysEvents = allEvents.filter(event => {
    const eventDate = new Date(event.date);
    const todayDate = new Date();
    return eventDate.toDateString() === todayDate.toDateString();
  });

  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const todayDate = new Date();
    return eventDate > todayDate;
  }).slice(0, 5);

  return (
    <AppLayout
      title="Calendar"
      subtitle={selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(selectedDate.getDate() - 7);
            setSelectedDate(newDate);
          }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(selectedDate.getDate() + 7);
            setSelectedDate(newDate);
          }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Event</span>
          </Button>
          {/* Google Calendar Connection */}
          {!isGoogleConnected ? (
            <Button
              variant="outline"
              className="gap-2"
              onClick={connectGoogleCalendar}
              disabled={isConnectingGoogle}
            >
              {isConnectingGoogle ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Google</span>
            </Button>
          ) : (
            <Badge variant="outline" className="gap-1 py-1.5 px-3 text-blue-600 border-blue-600">
              <Link2 className="h-3 w-3" />
              <span className="hidden sm:inline">Google</span>
            </Badge>
          )}
          {/* Microsoft Calendar Connection */}
          {!isMicrosoftConnected ? (
            <Button
              variant="outline"
              className="gap-2"
              onClick={connectMicrosoftCalendar}
              disabled={isConnectingMicrosoft}
            >
              {isConnectingMicrosoft ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Microsoft</span>
            </Button>
          ) : (
            <Badge variant="outline" className="gap-1 py-1.5 px-3 text-purple-600 border-purple-600">
              <Link2 className="h-3 w-3" />
              <span className="hidden sm:inline">Microsoft</span>
            </Badge>
          )}
        </div>
      }
    >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Calendar Grid */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-4">
                  {/* Week Header */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {getWeekDates().map((date, idx) => {
                      const isToday = date.toDateString() === new Date().toDateString();
                      return (
                        <div key={idx} className="text-center">
                          <p className="text-sm text-muted-foreground mb-1">{weekDays[idx]}</p>
                          <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                            {date.getDate()}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Events Grid */}
                  <div className="grid grid-cols-7 gap-2 min-h-[400px]">
                    {getWeekDates().map((date, idx) => {
                      const dayEvents = getEventsForDate(date);
                      return (
                        <div key={idx} className="border border-border/50 rounded-lg p-2 min-h-[100px]">
                          {dayEvents.map(event => (
                            <button
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className={`w-full text-left p-2 rounded mb-1 text-xs ${getEventSourceColor(event)} text-white hover:opacity-90 transition-opacity`}
                            >
                              <div className="flex items-center gap-1">
                                <p className="font-medium truncate flex-1">{event.title}</p>
                                {getEventSourceBadge(event) && (
                                  <span className={`text-[8px] ${getEventSourceBadge(event)?.color} bg-white/20 px-1 rounded`}>
                                    {getEventSourceBadge(event)?.label}
                                  </span>
                                )}
                              </div>
                              {event.time !== '00:00' && (
                                <p className="opacity-80">{event.time}</p>
                              )}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Today's Events */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Today's Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {todaysEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No events today</p>
                  ) : (
                    todaysEvents.map(event => {
                      const Icon = getEventIcon(event.type);
                      return (
                        <button
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${getEventTypeColor(event.type)}/10`}>
                              <Icon className={`h-4 w-4 ${getEventTypeColor(event.type).replace('bg-', 'text-')}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">{event.title}</p>
                              <p className="text-xs text-muted-foreground">{event.client}</p>
                              {event.time !== '00:00' && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {event.time} • {event.duration}min
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Events */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {upcomingEvents.map(event => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{event.date}</p>
                        </div>
                        <Badge variant={getEventTypeBadge(event.type)} className="text-xs ml-2">
                          {event.type}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Legend */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Legend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-sm text-muted-foreground">Meeting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-sm text-muted-foreground">Call</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-warning" />
                    <span className="text-sm text-muted-foreground">Renewal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <span className="text-sm text-muted-foreground">Deadline</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                {selectedEvent?.title}
                {selectedEvent?.source === 'google' && (
                  <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">Google</Badge>
                )}
              </DialogTitle>
              {selectedEvent?.source !== 'google' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={getEventTypeBadge(selectedEvent.type)}>
                  {selectedEvent.type}
                </Badge>
                {selectedEvent.status && selectedEvent.status !== 'confirmed' && (
                  <Badge variant="outline" className="text-xs">{selectedEvent.status}</Badge>
                )}
              </div>

              <div className="space-y-3">
                {selectedEvent.client && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{selectedEvent.client}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>{selectedEvent.date}</span>
                </div>
                {selectedEvent.time !== '00:00' && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{selectedEvent.time} ({selectedEvent.duration} min)</span>
                  </div>
                )}
                {selectedEvent.location && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.meetLink && (
                  <div className="flex items-center gap-3 text-blue-600">
                    <Video className="h-4 w-4" />
                    <a href={selectedEvent.meetLink} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                      Google Meet Link <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Attendees */}
              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div className="pt-3 border-t border-border">
                  <p className="text-sm font-medium mb-2">Attendees ({selectedEvent.attendees.length})</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedEvent.attendees.map((attendee, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate">
                          {attendee.displayName || attendee.email}
                        </span>
                        {attendee.responseStatus && (
                          <Badge variant="outline" className={`text-xs ${
                            attendee.responseStatus === 'accepted' ? 'text-green-600 border-green-600' :
                            attendee.responseStatus === 'declined' ? 'text-red-600 border-red-600' :
                            attendee.responseStatus === 'tentative' ? 'text-yellow-600 border-yellow-600' :
                            ''
                          }`}>
                            {attendee.responseStatus}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEvent.description && (
                <div className="pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                {selectedEvent.meetLink && (
                  <Button className="flex-1" asChild>
                    <a href={selectedEvent.meetLink} target="_blank" rel="noopener noreferrer">
                      <Video className="h-4 w-4 mr-2" /> Join Meet
                    </a>
                  </Button>
                )}
                {selectedEvent.htmlLink && (
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={selectedEvent.htmlLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" /> Open in Calendar
                    </a>
                  </Button>
                )}
                {!selectedEvent.meetLink && !selectedEvent.htmlLink && selectedEvent.type === 'meeting' && (
                  <Button className="flex-1">
                    <Video className="h-4 w-4 mr-2" /> Join Meeting
                  </Button>
                )}
                {selectedEvent.type === 'call' && (
                  <Button className="flex-1">
                    <Phone className="h-4 w-4 mr-2" /> Start Call
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Add Event Dialog */}
      <AddEventDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleAddEvent}
        clients={clients.map(c => ({ id: c.id, name: c.name, company: c.company }))}
        preselectedDate={preselectedDate}
        isGoogleConnected={isGoogleConnected}
        onGoogleEventCreated={fetchGoogleCalendarEvents}
      />
    </AppLayout>
  );
}
