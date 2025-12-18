import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard, Users, FileText, Calendar, BarChart3, Settings,
  Plug, User, CheckCircle, XCircle, Loader2, ExternalLink, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface Connector {
  name: string;
  description: string;
  connected: boolean;
  configured: boolean;
}

const connectorIcons: Record<string, string> = {
  salesforce: '☁️',
  microsoft: '📧',
  google: '📅',
  hubspot: '🎯',
};

export default function Integrations() {
  const { user } = useAuth();
  const [connectors, setConnectors] = useState<Record<string, Connector>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [connectingType, setConnectingType] = useState<string | null>(null);

  useEffect(() => {
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    setIsLoading(true);
    const response = await api.getConnectors();
    if (response.data?.connectors) {
      setConnectors(response.data.connectors);
    }
    setIsLoading(false);
  };

  const handleConnect = async (type: string) => {
    setConnectingType(type);

    // Get auth URL
    const urlResponse = await api.getConnectorAuthUrl(type as 'salesforce' | 'microsoft' | 'google' | 'hubspot');

    if (urlResponse.data?.authUrl) {
      // In production, this would open OAuth popup
      // For now, simulate connection
      const connectResponse = await api.connectConnector(type as 'salesforce' | 'microsoft' | 'google' | 'hubspot');

      if (connectResponse.data?.connected) {
        toast.success(`${connectors[type]?.name || type} connected successfully`);
        await loadConnectors();
      } else {
        toast.error(connectResponse.error || 'Connection failed');
      }
    } else {
      toast.error(urlResponse.error || 'Could not get authorization URL');
    }

    setConnectingType(null);
  };

  const handleDisconnect = async (type: string) => {
    setConnectingType(type);

    const response = await api.disconnectConnector(type as 'salesforce' | 'microsoft' | 'google' | 'hubspot');

    if (response.data) {
      toast.success(`${connectors[type]?.name || type} disconnected`);
      await loadConnectors();
    } else {
      toast.error(response.error || 'Disconnection failed');
    }

    setConnectingType(null);
  };

  const handleSync = async (type: string) => {
    setConnectingType(type);

    const response = await api.syncConnector(type as 'salesforce' | 'microsoft' | 'google' | 'hubspot');

    if (response.data) {
      toast.success(`${connectors[type]?.name || type} synced successfully`);
    } else {
      toast.error(response.error || 'Sync failed');
    }

    setConnectingType(null);
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
          <Link to="/integrations" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary text-sm font-medium">
            <Plug className="h-4 w-4" />Integrations
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm">
            <Settings className="h-4 w-4" />Settings
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
            <h1 className="text-2xl font-bold">Integrations</h1>
            <p className="text-muted-foreground">Connect your external services to sync data in real-time</p>
          </div>

          {/* Info Banner */}
          <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <Plug className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Connector-First Architecture</p>
                <p className="text-sm text-muted-foreground">
                  Quantara fetches data directly from your connected services via secure OAuth 2.0 APIs.
                  No data is stored — everything is retrieved in real-time.
                </p>
              </div>
            </div>
          </Card>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4">
              {Object.entries(connectors).map(([type, connector]) => (
                <Card key={type} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center text-2xl">
                        {connectorIcons[type] || '🔌'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{connector.name}</h3>
                          {connector.connected ? (
                            <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              Not Connected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{connector.description}</p>
                        {!connector.configured && (
                          <p className="text-xs text-amber-600 mt-2">
                            ⚠️ API credentials not configured on server
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {connector.connected ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSync(type)}
                            disabled={connectingType === type}
                          >
                            {connectingType === type ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect(type)}
                            disabled={connectingType === type}
                          >
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleConnect(type)}
                          disabled={connectingType === type || !connector.configured}
                        >
                          {connectingType === type ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Connect
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Help Section */}
          <Card className="p-6 mt-6">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              To enable integrations, your administrator needs to configure the OAuth credentials
              for each service in the server environment variables.
            </p>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p>• <strong>Salesforce:</strong> SALESFORCE_CLIENT_ID, SALESFORCE_CLIENT_SECRET</p>
              <p>• <strong>Microsoft 365:</strong> MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET</p>
              <p>• <strong>Google:</strong> GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET</p>
              <p>• <strong>HubSpot:</strong> HUBSPOT_CLIENT_ID, HUBSPOT_CLIENT_SECRET</p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
