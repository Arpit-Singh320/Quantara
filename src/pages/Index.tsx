import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Bell, Moon, Sun, Command, Sparkles, Calendar, Mail, Phone, TrendingUp,
  AlertTriangle, CheckCircle, Clock, ChevronRight, X, Download, ExternalLink,
  MessageSquare, Filter, SortAsc, RefreshCw, DollarSign, Send, Copy, Share,
  Lightbulb, LayoutDashboard, Users, FileText, Settings, PanelLeftClose, PanelLeft,
  Building, BarChart3, Cloud, Database, Play, Pause, Plus, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SourceIcon, SourceBadge, getSourceConfig } from '@/components/common/SourceIcon';
import { Skeleton, SkeletonCard, SkeletonText, SkeletonChart } from '@/components/common/Skeleton';
import { mockRenewals, mockChatHistory, suggestedQuestions, mockAgendaItems, mockTalkingPoints, mockEmailTemplates } from '@/data/brokerData';
import { Renewal, ChatMessage, Source, RiskLevel, SourceType, MeetingAgendaItem, TalkingPoint } from '@/types/broker';
import { useTheme } from '@/hooks/useTheme';
import { useLiveSync } from '@/hooks/useLiveSync';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAIChat } from '@/hooks/useAIChat';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';

// ============ UTILITIES ============
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
const riskConfig = {
  high: { variant: 'risk-high' as const, icon: AlertTriangle, label: 'High Risk', color: 'text-risk-high', border: 'border-l-risk-high' },
  medium: { variant: 'risk-medium' as const, icon: Clock, label: 'Medium', color: 'text-risk-medium', border: 'border-l-risk-medium' },
  low: { variant: 'risk-low' as const, icon: CheckCircle, label: 'Low Risk', color: 'text-risk-low', border: 'border-l-risk-low' },
};

// ============ SIDEBAR ============
function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Clients', path: '/clients' },
    { icon: FileText, label: 'Policies', path: '/policies' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
  ];

  return (
    <aside className={cn('fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300', collapsed ? 'w-16' : 'w-56')}>
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-sm">Q</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-sidebar-foreground">Quantara</span>
              <span className="text-[10px] text-sidebar-foreground/60">by Marsh McLennan</span>
            </div>
          </div>
        )}
        <Button variant="ghost" size="icon-sm" onClick={onToggle} className={cn('text-sidebar-foreground hover:bg-sidebar-accent', collapsed ? 'mx-auto' : '')}>
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
              collapsed && 'justify-center px-0',
            )}
            activeClassName="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="absolute bottom-4 left-0 right-0 px-2">
        <button className={cn('flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors', collapsed && 'justify-center px-0')}>
          <Settings className="h-4 w-4" />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
}

// ============ HEADER ============
function Header({ onOpenSearch, onOpenChat }: { onOpenSearch: () => void; onOpenChat: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { relativeTime, isSyncing, triggerSync } = useLiveSync();

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-primary">Renewal Pipeline</h1>
          <button onClick={triggerSync} className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors">
            <span className={cn('h-1.5 w-1.5 rounded-full bg-accent', isSyncing && 'animate-pulse-soft')} />
            <span>Live</span>
            <span className="text-accent/70">• {relativeTime}</span>
            <RefreshCw className={cn('h-3 w-3', isSyncing && 'animate-spin')} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onOpenSearch} className="flex items-center gap-2 h-9 px-3 rounded-lg border bg-secondary/50 text-muted-foreground text-sm hover:bg-secondary transition-colors">
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">Search or ask AI...</span>
            <kbd className="hidden md:flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 text-[10px] font-medium">
              <Command className="h-3 w-3" />K
            </kbd>
          </button>
          <Button variant="ai" size="sm" onClick={onOpenChat} className="hidden md:flex">
            <Sparkles className="h-4 w-4" />
            Ask AI
          </Button>
          <Button variant="ghost" size="icon-sm" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">3</span>
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <div className="ml-2 pl-2 border-l flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">MC</div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ============ STATS CARDS ============
function StatsCards() {
  const stats = [
    { label: 'Due This Week', value: 8, sub: 'renewals', icon: Calendar, trend: -12, color: 'text-warning' },
    { label: 'High Risk', value: 3, sub: 'clients', icon: AlertTriangle, color: 'text-destructive' },
    { label: 'Pipeline Value', value: '$847K', sub: 'in premiums', icon: DollarSign, trend: 8, color: 'text-primary' },
    { label: 'Secured', value: 12, sub: 'this month', icon: CheckCircle, trend: 23, color: 'text-success' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4">
          <div className="flex items-start justify-between">
            <div className={cn('p-2 rounded-lg bg-secondary', stat.color)}>
              <stat.icon className="h-4 w-4" />
            </div>
            {stat.trend !== undefined && (
              <span className={cn('text-xs font-medium', stat.trend > 0 ? 'text-success' : 'text-destructive')}>
                {stat.trend > 0 ? '+' : ''}{stat.trend}%
              </span>
            )}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-semibold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.sub}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ============ FILTER BAR ============
function FilterBar({ filters, onFilterChange, sort, onSortChange }: { filters: { risk: RiskLevel[] }; onFilterChange: (f: { risk: RiskLevel[] }) => void; sort: string; onSortChange: (s: string) => void }) {
  const riskFilters: { value: RiskLevel; label: string; color: string }[] = [
    { value: 'high', label: 'High Risk', color: 'bg-risk-high/15 text-risk-high border-risk-high/30' },
    { value: 'medium', label: 'Medium', color: 'bg-risk-medium/15 text-risk-medium border-risk-medium/30' },
    { value: 'low', label: 'Low Risk', color: 'bg-risk-low/15 text-risk-low border-risk-low/30' },
  ];

  const toggleRisk = (risk: RiskLevel) => {
    const newRisk = filters.risk.includes(risk) ? filters.risk.filter(r => r !== risk) : [...filters.risk, risk];
    onFilterChange({ ...filters, risk: newRisk });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Filter className="h-3.5 w-3.5" />Filter:</span>
        {riskFilters.map((f) => (
          <button key={f.value} onClick={() => toggleRisk(f.value)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all', filters.risk.includes(f.value) ? f.color : 'bg-secondary text-muted-foreground border-transparent hover:border-border')}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground flex items-center gap-1.5"><SortAsc className="h-3.5 w-3.5" />Sort:</span>
        <div className="flex p-1 bg-secondary rounded-lg">
          {[{ value: 'date', label: 'Date' }, { value: 'risk', label: 'Risk' }, { value: 'value', label: 'Value' }].map((s) => (
            <button key={s.value} onClick={() => onSortChange(s.value)} className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all', sort === s.value ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ RENEWAL CARD ============
function RenewalCard({ renewal, onClick, index }: { renewal: Renewal; onClick: () => void; index: number }) {
  const risk = riskConfig[renewal.riskScore];
  const RiskIcon = risk.icon;

  return (
    <Card variant="interactive" className={cn('group relative border-l-4 animate-fade-in-up', risk.border)} onClick={onClick} style={{ animationDelay: `${index * 50}ms` }}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{renewal.client.company}</h3>
              <Badge variant={risk.variant} size="sm"><RiskIcon className="h-3 w-3 mr-1" />{risk.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{renewal.client.name} • {renewal.client.industry}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
          <div><span className="text-muted-foreground">Policy:</span> <span className="font-medium">{renewal.policy.type}</span></div>
          <div><span className="text-muted-foreground">Premium:</span> <span className="font-semibold text-primary">{formatCurrency(renewal.policy.premium)}</span></div>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 mb-3">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs"><span className="font-medium">{renewal.daysUntilRenewal}d</span> until renewal</span>
          {renewal.daysUntilRenewal <= 7 && <Badge variant="danger" size="sm" className="ml-auto">Urgent</Badge>}
        </div>
        {renewal.aiInsights[0] && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-ai-muted border-l-2 border-accent mb-3">
            <Sparkles className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
            <p className="text-xs line-clamp-2">{renewal.aiInsights[0]}</p>
          </div>
        )}
        <div className="flex items-center gap-1 mb-3">
          <span className="text-[10px] text-muted-foreground mr-1">Sources:</span>
          {renewal.sources.slice(0, 3).map((s, i) => <SourceIcon key={i} type={s.type} size="sm" />)}
          {renewal.sources.length > 3 && <span className="text-[10px] text-muted-foreground">+{renewal.sources.length - 3}</span>}
          <div className="ml-auto flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{renewal.metrics.emailsSent}</span>
            <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" />{renewal.metrics.quotesReceived}</span>
          </div>
        </div>
        <div className="flex gap-2 pt-3 border-t">
          <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); toast.success('Email draft opened'); }}><Mail className="h-3 w-3" />Email</Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); }}><Phone className="h-3 w-3" />Call</Button>
          <Button variant="ai" size="sm" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); onClick(); }}><Sparkles className="h-3 w-3" />Brief</Button>
        </div>
      </div>
    </Card>
  );
}

// ============ CHARTS ============
function RiskChart() {
  const data = [
    { name: 'High', value: 3, color: 'hsl(var(--risk-high))' },
    { name: 'Medium', value: 2, color: 'hsl(var(--risk-medium))' },
    { name: 'Low', value: 2, color: 'hsl(var(--risk-low))' },
  ];
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-4">Risk Distribution</h3>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart><Pie data={data} innerRadius={30} outerRadius={50} paddingAngle={4} dataKey="value">{data.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Pie></PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-4 mt-2">
        {data.map((d) => (<div key={d.name} className="flex items-center gap-1.5 text-xs"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name}: {d.value}</div>))}
      </div>
    </Card>
  );
}

function RevenueChart() {
  const data = [{ m: 'Jan', v: 120 }, { m: 'Feb', v: 180 }, { m: 'Mar', v: 150 }, { m: 'Apr', v: 220 }, { m: 'May', v: 280 }, { m: 'Jun', v: 320 }];
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Revenue Forecast</h3>
        <span className="text-xs text-muted-foreground">$847K total</span>
      </div>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}><defs><linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="m" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorV)" /></AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function TimelineChart() {
  const renewals = mockRenewals.slice(0, 5).map(r => ({ name: r.client.company.split(' ')[0], days: r.daysUntilRenewal, risk: r.riskScore }));
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-4">Renewal Timeline</h3>
      <div className="space-y-2">
        {renewals.map((r) => (
          <div key={r.name} className="flex items-center gap-2">
            <span className="text-xs w-20 truncate">{r.name}</span>
            <div className="flex-1 h-5 bg-secondary rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full', r.risk === 'high' ? 'bg-risk-high' : r.risk === 'medium' ? 'bg-risk-medium' : 'bg-risk-low')} style={{ width: `${Math.min(100, (30 - r.days) / 30 * 100)}%` }} />
            </div>
            <span className="text-xs text-muted-foreground w-8">{r.days}d</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ============ BRIEF MODAL ============
function BriefModal({ renewal, onClose, onOpenChat }: { renewal: Renewal; onClose: () => void; onOpenChat: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const risk = riskConfig[renewal.riskScore];

  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 800); return () => clearTimeout(t); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 pb-8 px-4 overflow-y-auto">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-card rounded-2xl border shadow-xl animate-scale-in overflow-hidden">
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b bg-card/95 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center text-base font-semibold text-primary-foreground">{renewal.client.company.charAt(0)}</div>
            <div>
              <div className="flex items-center gap-2"><h2 className="text-lg font-semibold">{renewal.client.company}</h2><Badge variant={risk.variant}>{risk.label}</Badge></div>
              <p className="text-sm text-muted-foreground">{renewal.policy.type} • {renewal.policy.carrier}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.success('PDF export started')}><Download className="h-4 w-4" />Export PDF</Button>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 p-6 border-r">
            <div className="flex items-center gap-2 text-sm text-accent mb-4"><Sparkles className="h-4 w-4" /><span className="font-medium">AI-Generated Brief</span></div>
            {isLoading ? <SkeletonText lines={6} /> : (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" />Executive Summary</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{renewal.aiSummary}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" />Key Insights</h3>
                  <div className="space-y-2">
                    {renewal.aiInsights.map((insight, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-lg bg-ai-muted border-l-2 border-accent">
                        <span className="shrink-0 h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center text-xs text-accent font-medium">{i + 1}</span>
                        <p className="text-sm">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3">Data Sources</h3>
                  <div className="space-y-2">
                    {renewal.sources.map((s) => (
                      <Tooltip key={s.id}>
                        <TooltipTrigger asChild>
                          <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-secondary/50 transition-colors cursor-pointer group">
                            <SourceIcon type={s.type} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5"><span className="text-sm font-medium">{s.label}</span><span className="text-xs text-muted-foreground">{s.relativeTime}</span></div>
                              <p className="text-xs text-muted-foreground truncate">{s.preview}</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs"><p className="text-xs">{s.fullContent || s.preview}</p></TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="w-full lg:w-72 p-5 bg-secondary/30 space-y-4">
            <Card className="p-4"><h4 className="text-xs font-semibold text-muted-foreground mb-3">CONTACT</h4><p className="font-medium text-sm mb-2">{renewal.client.name}</p><p className="text-xs text-muted-foreground flex items-center gap-2"><Mail className="h-3 w-3" />{renewal.client.email}</p><p className="text-xs text-muted-foreground flex items-center gap-2 mt-1"><Phone className="h-3 w-3" />{renewal.client.phone}</p></Card>
            <Card className="p-4"><h4 className="text-xs font-semibold text-muted-foreground mb-3">POLICY</h4><div className="space-y-2 text-xs"><div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono">{renewal.policy.id}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Carrier</span><span>{renewal.policy.carrier}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Premium</span><span className="font-semibold text-primary">{formatCurrency(renewal.policy.premium)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Coverage</span><span>{formatCurrency(renewal.policy.coverageLimit)}</span></div></div></Card>
            <Card className="p-4"><h4 className="text-xs font-semibold text-muted-foreground mb-3">ACTIVITY</h4><div className="space-y-2 text-xs"><div className="flex justify-between"><span className="text-muted-foreground">Emails Sent</span><span>{renewal.metrics.emailsSent}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Quotes</span><span>{renewal.metrics.quotesReceived}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Last Touch</span><span>{renewal.metrics.lastTouchedDays}d ago</span></div></div></Card>
          </div>
        </div>
        <div className="sticky bottom-0 p-4 border-t bg-card/95 backdrop-blur-sm">
          <button onClick={onOpenChat} className="flex items-center gap-3 w-full p-3 rounded-xl border-2 border-dashed border-accent/30 hover:border-accent/50 hover:bg-ai-muted cursor-pointer transition-all group">
            <div className="h-10 w-10 rounded-lg gradient-ai flex items-center justify-center"><MessageSquare className="h-5 w-5 text-accent-foreground" /></div>
            <div className="flex-1 text-left"><p className="font-medium text-sm">Ask follow-up questions</p><p className="text-xs text-muted-foreground">Get instant answers from all connected sources</p></div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ CHAT INTERFACE ============
function ChatInterface({ onClose, clientContext }: { onClose: () => void; clientContext?: string }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use real Gemini AI service
  const {
    messages,
    isTyping,
    streamedContent,
    isConfigured,
    sendMessage,
    setApiKey,
  } = useAIChat({ renewals: mockRenewals, clientContext });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamedContent]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const query = input;
    setInput('');
    await sendMessage(query);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl h-full bg-card border-l shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg gradient-ai flex items-center justify-center"><Sparkles className="h-5 w-5 text-accent-foreground" /></div>
            <div><h2 className="font-semibold">AI Assistant</h2><p className="text-xs text-muted-foreground">Q&A Runner</p></div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        {clientContext && <div className="px-4 py-2 bg-ai-muted border-b text-sm"><span className="text-muted-foreground">Context: </span><span className="font-medium">{clientContext}</span></div>}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={cn('flex gap-3', m.role === 'user' ? 'flex-row-reverse' : '')}>
              <div className={cn('shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-sm font-medium', m.role === 'user' ? 'bg-primary text-primary-foreground' : 'gradient-ai text-accent-foreground')}>{m.role === 'user' ? 'MC' : <Sparkles className="h-4 w-4" />}</div>
              <div className={cn('flex-1 max-w-[85%]', m.role === 'user' && 'text-right')}>
                <div className={cn('inline-block p-3 rounded-2xl text-sm', m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-secondary rounded-tl-sm')}><p className="whitespace-pre-wrap">{m.content}</p></div>
                {m.sources && m.sources.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{m.sources.map((s, i) => <Badge key={i} variant="source" className="cursor-pointer hover:bg-muted"><SourceIcon type={s.type} size="sm" /><span className="text-[10px]">{s.label}</span></Badge>)}</div>}
                {m.role === 'assistant' && <div className="flex gap-2 mt-2"><Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(m.content); toast.success('Copied to clipboard'); }}><Copy className="h-3 w-3" />Copy</Button><Button variant="ghost" size="sm" className="h-7 text-xs"><Share className="h-3 w-3" />Share</Button></div>}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-lg gradient-ai flex items-center justify-center"><Sparkles className="h-4 w-4 text-accent-foreground animate-pulse-soft" /></div>
              <div className="bg-secondary p-3 rounded-2xl rounded-tl-sm text-sm">{streamedContent || <span className="flex gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-pulse-dot" /><span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-pulse-dot" style={{ animationDelay: '0.2s' }} /><span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-pulse-dot" style={{ animationDelay: '0.4s' }} /></span>}</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="px-4 py-3 border-t bg-secondary/30">
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground"><Lightbulb className="h-3.5 w-3.5" />Suggested</div>
          <div className="flex flex-wrap gap-2">{suggestedQuestions.slice(0, 3).map((q, i) => <button key={i} onClick={() => setInput(q)} className="px-3 py-1.5 rounded-full text-xs bg-background border hover:border-primary/50 transition-colors truncate max-w-full">{q}</button>)}</div>
        </div>
        <div className="p-4 border-t">
          <div className="flex gap-2"><input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask anything..." className="flex-1 h-11 px-4 rounded-xl border bg-background text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" /><Button variant="gradient" size="icon" className="h-11 w-11" onClick={handleSend} disabled={!input.trim()}><Send className="h-4 w-4" /></Button></div>
        </div>
      </div>
    </div>
  );
}

// ============ COMMAND PALETTE ============
function CommandPalette({ onClose, onSelectRenewal, onOpenChat }: { onClose: () => void; onSelectRenewal: (r: Renewal) => void; onOpenChat: () => void }) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const filteredRenewals = mockRenewals.filter(r => r.client.company.toLowerCase().includes(search.toLowerCase()) || r.client.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card rounded-2xl border shadow-xl animate-scale-in overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input ref={inputRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients, policies, or ask AI..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-medium">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Quick Actions</div>
          <button onClick={() => { onClose(); onOpenChat(); }} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-left">
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center"><Sparkles className="h-4 w-4 text-accent" /></div>
            <div><p className="text-sm font-medium">Ask AI Assistant</p><p className="text-xs text-muted-foreground">Get instant answers from all sources</p></div>
          </button>
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground mt-2">Renewals</div>
          {filteredRenewals.slice(0, 5).map((r) => (
            <button key={r.id} onClick={() => { onClose(); onSelectRenewal(r); }} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-left">
              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center text-xs font-medium', r.riskScore === 'high' ? 'bg-risk-high/15 text-risk-high' : r.riskScore === 'medium' ? 'bg-risk-medium/15 text-risk-medium' : 'bg-risk-low/15 text-risk-low')}>{r.client.company.charAt(0)}</div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{r.client.company}</p><p className="text-xs text-muted-foreground">{r.policy.type} • {r.daysUntilRenewal}d</p></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function Index() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState<{ risk: RiskLevel[] }>({ risk: [] });
  const [sort, setSort] = useState('date');
  const [selectedRenewal, setSelectedRenewal] = useState<Renewal | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 1000); return () => clearTimeout(t); }, []);

  useKeyboardShortcuts({
    'cmd+k': () => setIsCommandOpen(true),
    'cmd+/': () => setIsChatOpen(true),
    'escape': () => { setIsCommandOpen(false); setIsChatOpen(false); setSelectedRenewal(null); },
  });

  const filteredRenewals = mockRenewals.filter(r => filters.risk.length === 0 || filters.risk.includes(r.riskScore)).sort((a, b) => {
    if (sort === 'date') return a.daysUntilRenewal - b.daysUntilRenewal;
    if (sort === 'risk') return ['high', 'medium', 'low'].indexOf(a.riskScore) - ['high', 'medium', 'low'].indexOf(b.riskScore);
    return b.policy.premium - a.policy.premium;
  });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={cn('transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-56')}>
        <Header onOpenSearch={() => setIsCommandOpen(true)} onOpenChat={() => setIsChatOpen(true)} />
        <main className="p-6">
          <StatsCards />
          <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex-1">
              <FilterBar filters={filters} onFilterChange={setFilters} sort={sort} onSortChange={setSort} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />) : filteredRenewals.map((r, i) => <RenewalCard key={r.id} renewal={r} onClick={() => setSelectedRenewal(r)} index={i} />)}
              </div>
              {!isLoading && filteredRenewals.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4"><MessageSquare className="h-8 w-8 text-muted-foreground" /></div>
                  <h3 className="text-lg font-semibold mb-2">No renewals match your filters</h3>
                  <p className="text-muted-foreground max-w-md">Try adjusting your filter criteria.</p>
                </div>
              )}
            </div>
            <aside className="w-full xl:w-80 space-y-4">
              <RiskChart />
              <RevenueChart />
              <TimelineChart />
            </aside>
          </div>
        </main>
      </div>
      {selectedRenewal && <BriefModal renewal={selectedRenewal} onClose={() => setSelectedRenewal(null)} onOpenChat={() => { setSelectedRenewal(null); setIsChatOpen(true); }} />}
      {isChatOpen && <ChatInterface onClose={() => setIsChatOpen(false)} clientContext={selectedRenewal?.client.company} />}
      {isCommandOpen && <CommandPalette onClose={() => setIsCommandOpen(false)} onSelectRenewal={setSelectedRenewal} onOpenChat={() => setIsChatOpen(true)} />}
      <Button variant="ai" size="icon" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg xl:hidden" onClick={() => setIsChatOpen(true)}><Sparkles className="h-6 w-6" /></Button>
    </div>
  );
}
