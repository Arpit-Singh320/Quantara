/**
 * Shared App Layout Component
 * Provides consistent sidebar, header, and main content structure across all pages
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Calendar, BarChart3, Settings, Bell,
  Moon, Sun, Search, Command, Sparkles, PanelLeft, PanelLeftClose, RefreshCw, LogOut
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useLiveSync } from '@/hooks/useLiveSync';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onOpenSearch?: () => void;
  onOpenChat?: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Clients', path: '/clients' },
  { icon: FileText, label: 'Policies', path: '/policies' },
  { icon: Calendar, label: 'Calendar', path: '/calendar' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
];

export function AppLayout({ children, title, subtitle, actions, onOpenSearch, onOpenChat }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { relativeTime, isSyncing, triggerSync } = useLiveSync();
  const navigate = useNavigate();

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          {!sidebarCollapsed && (
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
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn('text-sidebar-foreground hover:bg-sidebar-accent', sidebarCollapsed && 'mx-auto')}
          >
            {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                sidebarCollapsed && 'justify-center px-0'
              )}
              activeClassName="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-4 left-0 right-0 px-2 space-y-1">
          <NavLink
            to="/integrations"
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
              sidebarCollapsed && 'justify-center px-0'
            )}
            activeClassName="bg-sidebar-primary text-sidebar-primary-foreground"
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Integrations</span>}
          </NavLink>
          <NavLink
            to="/settings"
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
              sidebarCollapsed && 'justify-center px-0'
            )}
            activeClassName="bg-sidebar-primary text-sidebar-primary-foreground"
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Settings</span>}
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn('flex-1 flex flex-col transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-64')}>
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur-sm">
          <div className="flex h-full items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              </div>
              <button
                onClick={triggerSync}
                className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
              >
                <span className={cn('h-1.5 w-1.5 rounded-full bg-accent', isSyncing && 'animate-pulse')} />
                <span>Live</span>
                <span className="text-accent/70">• {relativeTime}</span>
                <RefreshCw className={cn('h-3 w-3', isSyncing && 'animate-spin')} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {onOpenSearch && (
                <button
                  onClick={onOpenSearch}
                  className="flex items-center gap-2 h-9 px-3 rounded-lg border bg-secondary/50 text-muted-foreground text-sm hover:bg-secondary transition-colors"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden md:inline">Search...</span>
                  <kbd className="hidden md:flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 text-[10px] font-medium">
                    <Command className="h-3 w-3" />K
                  </kbd>
                </button>
              )}

              {onOpenChat && (
                <Button variant="ai" size="sm" onClick={onOpenChat} className="hidden md:flex">
                  <Sparkles className="h-4 w-4" />
                  Ask AI
                </Button>
              )}

              <Button variant="ghost" size="icon-sm" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                  3
                </span>
              </Button>

              <Button variant="ghost" size="icon-sm" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              {actions}

              <div className="ml-2 pl-2 border-l">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                      title={user?.name || 'User'}
                    >
                      {userInitials}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/integrations')}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Integrations
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
