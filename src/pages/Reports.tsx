import { useState } from 'react';
import {
  Download, Filter, TrendingUp, TrendingDown, DollarSign, Users, Shield,
  Moon, Sun, Home, CalendarDays, BarChart3, FileText, Target, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTheme } from '@/hooks/useTheme';
import { NavLink } from '@/components/NavLink';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const revenueData = [
  { month: 'Jan', premium: 420000, target: 400000 },
  { month: 'Feb', premium: 380000, target: 400000 },
  { month: 'Mar', premium: 510000, target: 450000 },
  { month: 'Apr', premium: 470000, target: 450000 },
  { month: 'May', premium: 540000, target: 500000 },
  { month: 'Jun', premium: 620000, target: 500000 },
  { month: 'Jul', premium: 580000, target: 550000 },
  { month: 'Aug', premium: 650000, target: 550000 },
  { month: 'Sep', premium: 710000, target: 600000 },
  { month: 'Oct', premium: 680000, target: 600000 },
  { month: 'Nov', premium: 750000, target: 650000 },
  { month: 'Dec', premium: 820000, target: 700000 },
];

const policyTypeData = [
  { name: 'General Liability', value: 35, color: 'hsl(var(--primary))' },
  { name: 'Professional Liability', value: 25, color: 'hsl(var(--success))' },
  { name: 'Cyber', value: 15, color: 'hsl(var(--warning))' },
  { name: 'Workers Comp', value: 15, color: 'hsl(var(--ai))' },
  { name: 'Property', value: 10, color: 'hsl(var(--danger))' },
];

const renewalData = [
  { month: 'Jan', renewed: 12, lost: 2 },
  { month: 'Feb', renewed: 15, lost: 1 },
  { month: 'Mar', renewed: 18, lost: 3 },
  { month: 'Apr', renewed: 14, lost: 2 },
  { month: 'May', renewed: 20, lost: 1 },
  { month: 'Jun', renewed: 22, lost: 2 },
];

const topClients = [
  { name: 'Summit Healthcare', premium: 890000, policies: 8, growth: 12 },
  { name: 'Coastal Manufacturing', premium: 520000, policies: 6, growth: 8 },
  { name: 'Metro Construction', premium: 425000, policies: 5, growth: -5 },
  { name: 'TechFlow Industries', premium: 285000, policies: 4, growth: 15 },
  { name: 'GreenLeaf Logistics', premium: 175000, policies: 3, growth: 22 },
];

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Clients', path: '/clients' },
  { icon: Shield, label: 'Policies', path: '/policies' },
  { icon: CalendarDays, label: 'Calendar', path: '/calendar' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
];

export default function Reports() {
  const { theme, toggleTheme } = useTheme();
  const [timeRange, setTimeRange] = useState('year');

  const totalPremium = revenueData.reduce((sum, d) => sum + d.premium, 0);
  const totalTarget = revenueData.reduce((sum, d) => sum + d.target, 0);
  const performancePercent = ((totalPremium / totalTarget) * 100).toFixed(1);

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
            <h1 className="text-xl font-semibold text-foreground">Reports</h1>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Premium</p>
                    <p className="text-2xl font-bold text-foreground">${(totalPremium / 1000000).toFixed(1)}M</p>
                    <div className="flex items-center gap-1 text-success text-sm">
                      <TrendingUp className="h-3 w-3" />
                      <span>+18.2%</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Clients</p>
                    <p className="text-2xl font-bold text-foreground">127</p>
                    <div className="flex items-center gap-1 text-success text-sm">
                      <TrendingUp className="h-3 w-3" />
                      <span>+8 this month</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-success/10">
                    <Users className="h-6 w-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Renewal Rate</p>
                    <p className="text-2xl font-bold text-foreground">94.2%</p>
                    <div className="flex items-center gap-1 text-success text-sm">
                      <TrendingUp className="h-3 w-3" />
                      <span>+2.1%</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-warning/10">
                    <Target className="h-6 w-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Target Progress</p>
                    <p className="text-2xl font-bold text-foreground">{performancePercent}%</p>
                    <div className="flex items-center gap-1 text-success text-sm">
                      <TrendingUp className="h-3 w-3" />
                      <span>On track</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-ai/10">
                    <BarChart3 className="h-6 w-6 text-ai" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="revenue" className="space-y-6">
            <TabsList>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="policies">Policies</TabsTrigger>
              <TabsTrigger value="renewals">Renewals</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
            </TabsList>

            {/* Revenue Tab */}
            <TabsContent value="revenue" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Premium vs Target</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v/1000}K`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => [`$${(value/1000).toFixed(0)}K`, '']}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="premium" name="Premium" stroke="hsl(var(--primary))" fill="url(#premiumGradient)" strokeWidth={2} />
                        <Area type="monotone" dataKey="target" name="Target" stroke="hsl(var(--muted-foreground))" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Policies Tab */}
            <TabsContent value="policies" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Policy Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={policyTypeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {policyTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {policyTypeData.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm text-muted-foreground">{item.name}</span>
                          <span className="text-sm font-medium text-foreground ml-auto">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Policy Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-primary" />
                        <span className="text-foreground">Total Active Policies</span>
                      </div>
                      <span className="text-xl font-bold text-foreground">284</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-success" />
                        <span className="text-foreground">Average Premium</span>
                      </div>
                      <span className="text-xl font-bold text-foreground">$124K</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-warning" />
                        <span className="text-foreground">Pending Renewals</span>
                      </div>
                      <span className="text-xl font-bold text-foreground">18</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-danger" />
                        <span className="text-foreground">Expiring This Month</span>
                      </div>
                      <span className="text-xl font-bold text-foreground">7</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Renewals Tab */}
            <TabsContent value="renewals" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Renewal Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={renewalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="renewed" name="Renewed" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="lost" name="Lost" fill="hsl(var(--danger))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Clients Tab */}
            <TabsContent value="clients" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Clients by Premium</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Premium</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Policies</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Growth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topClients.map((client, idx) => (
                          <tr key={client.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                  {idx + 1}
                                </div>
                                <span className="font-medium text-foreground">{client.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium text-foreground">${(client.premium / 1000).toFixed(0)}K</td>
                            <td className="py-3 px-4 hidden sm:table-cell text-foreground">{client.policies}</td>
                            <td className="py-3 px-4">
                              <div className={`flex items-center gap-1 ${client.growth >= 0 ? 'text-success' : 'text-danger'}`}>
                                {client.growth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                <span>{client.growth >= 0 ? '+' : ''}{client.growth}%</span>
                              </div>
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
    </div>
  );
}
