import { useState } from 'react';
import {
  Search, Phone, Mail, Building2, MapPin, Calendar, FileText,
  MoreHorizontal, Plus, Filter, ArrowUpDown, Eye, Edit, Trash2,
  Moon, Sun, ChevronLeft, Home, Users, Shield, CalendarDays, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/useTheme';
import { NavLink } from '@/components/NavLink';

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  location: string;
  totalPolicies: number;
  totalPremium: number;
  status: 'active' | 'pending' | 'churned';
  lastContact: string;
  avatar?: string;
}

const mockClients: Client[] = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    company: 'TechFlow Industries',
    email: 'sarah@techflow.com',
    phone: '(555) 123-4567',
    industry: 'Technology',
    location: 'San Francisco, CA',
    totalPolicies: 4,
    totalPremium: 285000,
    status: 'active',
    lastContact: '2 days ago',
  },
  {
    id: '2',
    name: 'Michael Chen',
    company: 'Coastal Manufacturing',
    email: 'mchen@coastal.com',
    phone: '(555) 234-5678',
    industry: 'Manufacturing',
    location: 'Seattle, WA',
    totalPolicies: 6,
    totalPremium: 520000,
    status: 'active',
    lastContact: '1 week ago',
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    company: 'GreenLeaf Logistics',
    email: 'emily@greenleaf.com',
    phone: '(555) 345-6789',
    industry: 'Logistics',
    location: 'Austin, TX',
    totalPolicies: 3,
    totalPremium: 175000,
    status: 'pending',
    lastContact: '3 days ago',
  },
  {
    id: '4',
    name: 'David Park',
    company: 'Summit Healthcare',
    email: 'dpark@summithc.com',
    phone: '(555) 456-7890',
    industry: 'Healthcare',
    location: 'Denver, CO',
    totalPolicies: 8,
    totalPremium: 890000,
    status: 'active',
    lastContact: '5 days ago',
  },
  {
    id: '5',
    name: 'Jennifer Walsh',
    company: 'Metro Construction',
    email: 'jwalsh@metrocon.com',
    phone: '(555) 567-8901',
    industry: 'Construction',
    location: 'Chicago, IL',
    totalPolicies: 5,
    totalPremium: 425000,
    status: 'churned',
    lastContact: '1 month ago',
  },
];

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Clients', path: '/clients' },
  { icon: Shield, label: 'Policies', path: '/policies' },
  { icon: CalendarDays, label: 'Calendar', path: '/calendar' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
];

export default function Clients() {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredClients = mockClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'churned': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-16 lg:w-64 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">Q</span>
            </div>
            <span className="hidden lg:block font-semibold text-foreground">Quantara</span>
          </div>
        </div>
        <nav className="flex-1 p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-1"
              activeClassName="bg-primary/10 text-primary"
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
            <h1 className="text-xl font-semibold text-foreground">Clients</h1>
            <Badge variant="secondary">{mockClients.length} total</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Client</span>
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Status: {statusFilter === 'all' ? 'All' : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('active')}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('churned')}>Churned</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold text-foreground">{mockClients.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-success">{mockClients.filter(c => c.status === 'active').length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Premium</p>
                <p className="text-2xl font-bold text-foreground">${(mockClients.reduce((sum, c) => sum + c.totalPremium, 0) / 1000).toFixed(0)}K</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Avg Policies</p>
                <p className="text-2xl font-bold text-foreground">{(mockClients.reduce((sum, c) => sum + c.totalPolicies, 0) / mockClients.length).toFixed(1)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Client List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">All Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Industry</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Policies</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Premium</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-medium">{client.name.split(' ').map(n => n[0]).join('')}</span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{client.name}</p>
                              <p className="text-sm text-muted-foreground">{client.company}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <Badge variant="outline">{client.industry}</Badge>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-foreground">{client.totalPolicies}</td>
                        <td className="py-3 px-4 font-medium text-foreground">${(client.totalPremium / 1000).toFixed(0)}K</td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusColor(client.status)}>{client.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedClient(client)}>
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Client Detail Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-xl">{selectedClient.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{selectedClient.name}</h3>
                  <p className="text-muted-foreground">{selectedClient.company}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{selectedClient.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{selectedClient.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>{selectedClient.industry}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedClient.location}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold text-foreground">{selectedClient.totalPolicies}</p>
                    <p className="text-sm text-muted-foreground">Policies</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium text-foreground">{selectedClient.lastContact}</p>
                    <p className="text-sm text-muted-foreground">Last Contact</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Badge variant={getStatusColor(selectedClient.status)} className="mb-2">{selectedClient.status}</Badge>
                    <p className="text-sm text-muted-foreground">Status</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1">
                  <Mail className="h-4 w-4 mr-2" /> Send Email
                </Button>
                <Button variant="outline" className="flex-1">
                  <Phone className="h-4 w-4 mr-2" /> Schedule Call
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
