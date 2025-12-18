import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard, Users, FileText, Calendar, BarChart3, Settings as SettingsIcon,
  Plug, User, Bell, Shield, Palette, LogOut, Save, Loader2, Moon, Sun, ChevronRight
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [company, setCompany] = useState(user?.company || '');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [renewalReminders, setRenewalReminders] = useState(true);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    // TODO: Implement profile update API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Profile updated successfully');
    setIsLoading(false);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Quantara" className="h-8 w-8" />
            <span className="font-semibold text-lg">Quantara</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm">
            <LayoutDashboard className="h-4 w-4" />Dashboard
          </Link>
          <Link to="/clients" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm">
            <Users className="h-4 w-4" />Clients
          </Link>
          <Link to="/policies" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm">
            <FileText className="h-4 w-4" />Policies
          </Link>
          <Link to="/calendar" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm">
            <Calendar className="h-4 w-4" />Calendar
          </Link>
          <Link to="/reports" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm">
            <BarChart3 className="h-4 w-4" />Reports
          </Link>
          <Separator className="my-4" />
          <Link to="/integrations" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm">
            <Plug className="h-4 w-4" />Integrations
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary text-sm font-medium">
            <SettingsIcon className="h-4 w-4" />Settings
          </Link>
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>

          {/* Profile Section */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Profile</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Your company"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={user?.role || 'BROKER'}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveProfile} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Appearance Section */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Appearance</h2>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
                <Moon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </Card>

          {/* Notifications Section */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive browser notifications</p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Renewal Reminders</p>
                  <p className="text-sm text-muted-foreground">Get notified about upcoming renewals</p>
                </div>
                <Switch
                  checked={renewalReminders}
                  onCheckedChange={setRenewalReminders}
                />
              </div>
            </div>
          </Card>

          {/* Security Section */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Security</h2>
            </div>

            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors">
              <div className="space-y-1 text-left">
                <p className="font-medium">Change Password</p>
                <p className="text-sm text-muted-foreground">Update your password</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </Card>

          {/* Logout Section */}
          <Card className="p-6 border-destructive/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium text-destructive">Sign Out</p>
                <p className="text-sm text-muted-foreground">Sign out of your account</p>
              </div>
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
