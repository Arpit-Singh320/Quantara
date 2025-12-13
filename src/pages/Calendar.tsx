import { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Clock, Users, Video, Phone, MapPin,
  Moon, Sun, Home, Shield, CalendarDays, BarChart3, MoreHorizontal, Edit, Trash2
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
import { useTheme } from '@/hooks/useTheme';
import { NavLink } from '@/components/NavLink';

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
}

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Renewal Review',
    client: 'TechFlow Industries',
    type: 'meeting',
    date: '2024-12-11',
    time: '09:00',
    duration: 60,
    location: 'Video Call',
    description: 'Annual renewal discussion for GL and Cyber policies',
  },
  {
    id: '2',
    title: 'Policy Expiration',
    client: 'GreenLeaf Logistics',
    type: 'renewal',
    date: '2024-12-11',
    time: '00:00',
    duration: 0,
    description: 'Cyber Liability policy expires',
  },
  {
    id: '3',
    title: 'Quote Follow-up',
    client: 'Summit Healthcare',
    type: 'call',
    date: '2024-12-12',
    time: '14:00',
    duration: 30,
    description: 'Discuss workers comp quote options',
  },
  {
    id: '4',
    title: 'Claims Review',
    client: 'Coastal Manufacturing',
    type: 'meeting',
    date: '2024-12-12',
    time: '10:30',
    duration: 45,
    location: 'Office - Room 3B',
    description: 'Review pending claims and coverage adjustments',
  },
  {
    id: '5',
    title: 'New Client Onboarding',
    client: 'Atlas Ventures',
    type: 'meeting',
    date: '2024-12-13',
    time: '11:00',
    duration: 90,
    location: 'Video Call',
    description: 'Initial consultation and needs assessment',
  },
  {
    id: '6',
    title: 'Submission Deadline',
    client: 'Metro Construction',
    type: 'deadline',
    date: '2024-12-13',
    time: '17:00',
    duration: 0,
    description: 'Property insurance submission deadline',
  },
  {
    id: '7',
    title: 'Quarterly Review',
    client: 'TechFlow Industries',
    type: 'meeting',
    date: '2024-12-14',
    time: '15:00',
    duration: 60,
    location: 'Client Office',
    description: 'Q4 portfolio review and 2025 planning',
  },
];

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Clients', path: '/clients' },
  { icon: Shield, label: 'Policies', path: '/policies' },
  { icon: CalendarDays, label: 'Calendar', path: '/calendar' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
];

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const { theme, toggleTheme } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<'week' | 'day'>('week');

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
    return mockEvents.filter(event => event.date === formatDate(date));
  };

  const todaysEvents = mockEvents.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });

  const upcomingEvents = mockEvents.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    return eventDate > today;
  }).slice(0, 5);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Marsh McLennan Navy Theme */}
      <aside className="w-16 lg:w-64 border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-sm">Q</span>
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="font-semibold text-sidebar-foreground">Quantara</span>
              <span className="text-[10px] text-sidebar-foreground/60">by Marsh McLennan</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors mb-1"
              activeClassName="bg-sidebar-primary text-sidebar-primary-foreground"
            >
              <item.icon className="h-5 w-5" />
              <span className="hidden lg:block">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-foreground">Calendar</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(selectedDate.getDate() - 7);
                setSelectedDate(newDate);
              }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-foreground min-w-[140px] text-center">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <Button variant="outline" size="icon" onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(selectedDate.getDate() + 7);
                setSelectedDate(newDate);
              }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Event</span>
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
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
                              className={`w-full text-left p-2 rounded mb-1 text-xs ${getEventTypeColor(event.type)} text-white hover:opacity-90 transition-opacity`}
                            >
                              <p className="font-medium truncate">{event.title}</p>
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
        </div>
      </main>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{selectedEvent?.title}</DialogTitle>
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
            </div>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <Badge variant={getEventTypeBadge(selectedEvent.type)}>
                {selectedEvent.type}
              </Badge>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{selectedEvent.client}</span>
                </div>
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
              </div>

              {selectedEvent.description && (
                <div className="pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                {selectedEvent.type === 'meeting' && (
                  <Button className="flex-1">
                    <Video className="h-4 w-4 mr-2" /> Join Meeting
                  </Button>
                )}
                {selectedEvent.type === 'call' && (
                  <Button className="flex-1">
                    <Phone className="h-4 w-4 mr-2" /> Start Call
                  </Button>
                )}
                <Button variant="outline" className="flex-1">
                  View Client
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
