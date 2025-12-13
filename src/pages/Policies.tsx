import { useState } from 'react';
import {
  Search, Shield, Calendar, DollarSign, FileText, AlertTriangle,
  MoreHorizontal, Plus, Filter, Eye, Edit, Download, CheckCircle,
  Moon, Sun, Home, Users, CalendarDays, BarChart3, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface Policy {
  id: string;
  policyNumber: string;
  type: string;
  clientName: string;
  clientCompany: string;
  carrier: string;
  premium: number;
  coverageLimit: number;
  effectiveDate: string;
  expirationDate: string;
  status: 'active' | 'pending' | 'expired' | 'cancelled';
  daysUntilExpiry: number;
}

const mockPolicies: Policy[] = [
  {
    id: '1',
    policyNumber: 'POL-2024-001',
    type: 'General Liability',
    clientName: 'Sarah Mitchell',
    clientCompany: 'TechFlow Industries',
    carrier: 'Hartford',
    premium: 85000,
    coverageLimit: 2000000,
    effectiveDate: '2024-01-15',
    expirationDate: '2025-01-15',
    status: 'active',
    daysUntilExpiry: 45,
  },
  {
    id: '2',
    policyNumber: 'POL-2024-002',
    type: 'Professional Liability',
    clientName: 'Michael Chen',
    clientCompany: 'Coastal Manufacturing',
    carrier: 'Chubb',
    premium: 125000,
    coverageLimit: 5000000,
    effectiveDate: '2024-03-01',
    expirationDate: '2025-03-01',
    status: 'active',
    daysUntilExpiry: 90,
  },
  {
    id: '3',
    policyNumber: 'POL-2024-003',
    type: 'Cyber Liability',
    clientName: 'Emily Rodriguez',
    clientCompany: 'GreenLeaf Logistics',
    carrier: 'AIG',
    premium: 45000,
    coverageLimit: 1000000,
    effectiveDate: '2024-02-01',
    expirationDate: '2025-02-01',
    status: 'active',
    daysUntilExpiry: 12,
  },
  {
    id: '4',
    policyNumber: 'POL-2024-004',
    type: 'Workers Compensation',
    clientName: 'David Park',
    clientCompany: 'Summit Healthcare',
    carrier: 'Travelers',
    premium: 220000,
    coverageLimit: 1000000,
    effectiveDate: '2024-04-15',
    expirationDate: '2025-04-15',
    status: 'pending',
    daysUntilExpiry: 135,
  },
  {
    id: '5',
    policyNumber: 'POL-2023-089',
    type: 'Property Insurance',
    clientName: 'Jennifer Walsh',
    clientCompany: 'Metro Construction',
    carrier: 'Liberty Mutual',
    premium: 175000,
    coverageLimit: 10000000,
    effectiveDate: '2023-06-01',
    expirationDate: '2024-06-01',
    status: 'expired',
    daysUntilExpiry: -180,
  },
  {
    id: '6',
    policyNumber: 'POL-2024-005',
    type: 'Directors & Officers',
    clientName: 'Sarah Mitchell',
    clientCompany: 'TechFlow Industries',
    carrier: 'AXA',
    premium: 95000,
    coverageLimit: 3000000,
    effectiveDate: '2024-05-01',
    expirationDate: '2025-05-01',
    status: 'active',
    daysUntilExpiry: 150,
  },
];

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Clients', path: '/clients' },
  { icon: Shield, label: 'Policies', path: '/policies' },
  { icon: CalendarDays, label: 'Calendar', path: '/calendar' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
];

export default function Policies() {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const filteredPolicies = mockPolicies.filter(policy => {
    const matchesSearch = policy.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || policy.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getStatusVariant = (status: Policy['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'expired': return 'danger';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const getExpiryBadge = (days: number) => {
    if (days < 0) return null;
    if (days <= 14) return <Badge variant="danger" className="ml-2"><Clock className="h-3 w-3 mr-1" />{days}d</Badge>;
    if (days <= 30) return <Badge variant="warning" className="ml-2"><Clock className="h-3 w-3 mr-1" />{days}d</Badge>;
    return null;
  };

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
            <h1 className="text-xl font-semibold text-foreground">Policies</h1>
            <Badge variant="secondary">{mockPolicies.length} total</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Policy</span>
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Policies</p>
                    <p className="text-2xl font-bold text-foreground">{mockPolicies.filter(p => p.status === 'active').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expiring Soon</p>
                    <p className="text-2xl font-bold text-warning">{mockPolicies.filter(p => p.daysUntilExpiry > 0 && p.daysUntilExpiry <= 30).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <DollarSign className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Premium</p>
                    <p className="text-2xl font-bold text-foreground">${(mockPolicies.reduce((sum, p) => sum + p.premium, 0) / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Coverage</p>
                    <p className="text-2xl font-bold text-foreground">${(mockPolicies.reduce((sum, p) => sum + p.coverageLimit, 0) / 1000000).toFixed(0)}M</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Tabs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Policy</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Client</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Carrier</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Premium</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Expiration</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPolicies.map((policy) => (
                          <tr key={policy.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-foreground">{policy.policyNumber}</p>
                                <p className="text-sm text-muted-foreground">{policy.type}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell">
                              <div>
                                <p className="text-foreground">{policy.clientName}</p>
                                <p className="text-sm text-muted-foreground">{policy.clientCompany}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 hidden lg:table-cell text-foreground">{policy.carrier}</td>
                            <td className="py-3 px-4 font-medium text-foreground">${(policy.premium / 1000).toFixed(0)}K</td>
                            <td className="py-3 px-4 hidden sm:table-cell">
                              <span className="text-foreground">{policy.expirationDate}</span>
                              {getExpiryBadge(policy.daysUntilExpiry)}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={getStatusVariant(policy.status)}>{policy.status}</Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedPolicy(policy)}>
                                    <Eye className="h-4 w-4 mr-2" /> View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="h-4 w-4 mr-2" /> Download
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
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Policy Detail Dialog */}
      <Dialog open={!!selectedPolicy} onOpenChange={() => setSelectedPolicy(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Policy Details</DialogTitle>
          </DialogHeader>
          {selectedPolicy && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{selectedPolicy.policyNumber}</h3>
                  <p className="text-muted-foreground">{selectedPolicy.type}</p>
                </div>
                <Badge variant={getStatusVariant(selectedPolicy.status)} className="text-sm">{selectedPolicy.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Client</p>
                    <p className="font-medium text-foreground">{selectedPolicy.clientName}</p>
                    <p className="text-sm text-muted-foreground">{selectedPolicy.clientCompany}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Carrier</p>
                    <p className="font-medium text-foreground">{selectedPolicy.carrier}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Premium</p>
                    <p className="text-2xl font-bold text-foreground">${selectedPolicy.premium.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Coverage Limit</p>
                    <p className="text-2xl font-bold text-foreground">${(selectedPolicy.coverageLimit / 1000000).toFixed(1)}M</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Effective Date</p>
                      <p className="font-medium text-foreground">{selectedPolicy.effectiveDate}</p>
                    </div>
                    <div className="text-center">
                      <Calendar className="h-5 w-5 text-muted-foreground mx-auto" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Expiration Date</p>
                      <p className="font-medium text-foreground">{selectedPolicy.expirationDate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" /> Renew Policy
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" /> Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
