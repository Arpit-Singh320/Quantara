/**
 * Connector Status Component
 * Shows live connector status for challenge compliance - visible proof of integrations
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cloud, CheckCircle2, XCircle, Loader2, ExternalLink,
  Database, Mail, Calendar, Users, MessageSquare, Settings
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';

interface Connector {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  connected: boolean;
  configured: boolean;
  category: 'crm' | 'email' | 'calendar' | 'broker' | 'communication';
  dataPoints?: string[];
}

interface ConnectorStatusProps {
  variant?: 'full' | 'compact' | 'sidebar';
  showConfigureButton?: boolean;
  className?: string;
}

export function ConnectorStatus({ variant = 'compact', showConfigureButton = true, className }: ConnectorStatusProps) {
  const navigate = useNavigate();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnectorStatus();
  }, []);

  const fetchConnectorStatus = async () => {
    try {
      const response = await api.getConnectors();
      if (response.data?.connectors) {
        const connectorData = response.data.connectors;
        const mappedConnectors: Connector[] = [
          {
            id: 'salesforce',
            name: 'Salesforce CRM',
            description: 'Client accounts, contacts, opportunities',
            icon: Database,
            connected: connectorData.salesforce?.connected || false,
            configured: connectorData.salesforce?.configured || false,
            category: 'crm',
            dataPoints: ['Accounts', 'Contacts', 'Opportunities'],
          },
          {
            id: 'google',
            name: 'Google Calendar',
            description: 'Meeting scheduling, calendar events',
            icon: Calendar,
            connected: connectorData.google?.connected || false,
            configured: connectorData.google?.configured || false,
            category: 'calendar',
            dataPoints: ['Events', 'Meetings', 'Schedules'],
          },
          {
            id: 'microsoft',
            name: 'Microsoft 365',
            description: 'Outlook email, Teams, Calendar',
            icon: Mail,
            connected: connectorData.microsoft?.connected || false,
            configured: connectorData.microsoft?.configured || false,
            category: 'email',
            dataPoints: ['Emails', 'Teams Chats', 'Calendar'],
          },
          {
            id: 'hubspot',
            name: 'HubSpot',
            description: 'CRM, contacts, deals',
            icon: Users,
            connected: connectorData.hubspot?.connected || false,
            configured: connectorData.hubspot?.configured || false,
            category: 'crm',
            dataPoints: ['Contacts', 'Deals', 'Companies'],
          },
        ];
        setConnectors(mappedConnectors);
      }
    } catch (error) {
      console.error('Failed to fetch connector status:', error);
      // Set default connectors with offline status
      setConnectors([
        { id: 'salesforce', name: 'Salesforce CRM', description: 'CRM data source', icon: Database, connected: false, configured: true, category: 'crm' },
        { id: 'google', name: 'Google Calendar', description: 'Calendar events', icon: Calendar, connected: false, configured: true, category: 'calendar' },
        { id: 'microsoft', name: 'Microsoft 365', description: 'Email & Teams', icon: Mail, connected: false, configured: false, category: 'email' },
        { id: 'hubspot', name: 'HubSpot', description: 'CRM alternative', icon: Users, connected: false, configured: false, category: 'crm' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const connectedCount = connectors.filter(c => c.connected).length;
  const totalCount = connectors.length;
  const coveragePercent = totalCount > 0 ? Math.round((connectedCount / totalCount) * 100) : 0;

  if (variant === 'sidebar') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Data Sources</span>
          <Badge variant={coveragePercent >= 50 ? 'default' : 'outline'} className="text-[10px]">
            {connectedCount}/{totalCount} Live
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1">
          {connectors.map((connector) => (
            <div
              key={connector.id}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-[10px]',
                connector.connected
                  ? 'bg-green-500/10 text-green-600 border border-green-500/30'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <connector.icon className="h-3 w-3" />
              {connector.connected && <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Live Data Sources</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={coveragePercent >= 80 ? 'default' : coveragePercent >= 50 ? 'secondary' : 'outline'}>
              {coveragePercent}% Coverage
            </Badge>
            {showConfigureButton && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/integrations')}>
                <Settings className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {connectors.map((connector) => (
            <div
              key={connector.id}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg border transition-colors',
                connector.connected
                  ? 'bg-green-500/5 border-green-500/30'
                  : 'bg-muted/50 border-transparent'
              )}
            >
              <connector.icon className={cn('h-4 w-4', connector.connected ? 'text-green-600' : 'text-muted-foreground')} />
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-medium truncate', connector.connected ? 'text-foreground' : 'text-muted-foreground')}>
                  {connector.name}
                </p>
              </div>
              {connector.connected ? (
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-green-600">Live</span>
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground">Offline</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>Data fetched live • No storage</span>
          <button onClick={() => navigate('/integrations')} className="text-primary hover:underline flex items-center gap-1">
            Configure <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </Card>
    );
  }

  // Full variant
  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            Connected Data Sources
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Live connectors providing real-time data (no document storage)
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{coveragePercent}%</div>
          <div className="text-xs text-muted-foreground">Coverage ({connectedCount}/{totalCount})</div>
        </div>
      </div>

      <div className="space-y-3">
        {connectors.map((connector) => (
          <div
            key={connector.id}
            className={cn(
              'flex items-center gap-4 p-3 rounded-lg border transition-all',
              connector.connected
                ? 'bg-green-500/5 border-green-500/30'
                : 'bg-muted/30 border-transparent hover:border-border'
            )}
          >
            <div className={cn(
              'h-10 w-10 rounded-lg flex items-center justify-center',
              connector.connected ? 'bg-green-500/10' : 'bg-muted'
            )}>
              <connector.icon className={cn('h-5 w-5', connector.connected ? 'text-green-600' : 'text-muted-foreground')} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{connector.name}</span>
                {connector.connected ? (
                  <Badge variant="default" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/30">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse mr-1" />
                    Connected
                  </Badge>
                ) : connector.configured ? (
                  <Badge variant="outline" className="text-[10px]">Available</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">Not Configured</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{connector.description}</p>
              {connector.connected && connector.dataPoints && (
                <div className="flex gap-1 mt-1">
                  {connector.dataPoints.map((dp, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 bg-background rounded border">
                      {dp}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {!connector.connected && connector.configured && (
              <Button variant="outline" size="sm" onClick={() => navigate('/integrations')}>
                Connect
              </Button>
            )}
          </div>
        ))}
      </div>

      {showConfigureButton && (
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" className="w-full" onClick={() => navigate('/integrations')}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Integrations
          </Button>
        </div>
      )}
    </Card>
  );
}

export default ConnectorStatus;
