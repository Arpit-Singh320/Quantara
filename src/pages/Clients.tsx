import { useState } from 'react';
import {
  Search, Phone, Mail, Building2, Calendar, FileText,
  MoreHorizontal, Plus, Eye, Edit, Trash2, Users, Loader2, AlertCircle
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
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { useClients, Client } from '@/hooks/useClients';
import { AddClientDialog } from '@/components/dialogs/AddClientDialog';
import { api } from '@/services/api';
import { toast } from 'sonner';

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { clients, total, isLoading, error, refetch } = useClients();

  const handleDeleteClient = async () => {
    if (!deleteClient) return;
    setIsDeleting(true);
    try {
      const result = await api.deleteClient(deleteClient.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Client deleted successfully');
        refetch();
      }
    } catch (err) {
      toast.error('Failed to delete client');
    } finally {
      setIsDeleting(false);
      setDeleteClient(null);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getRiskColor = (riskScore: string) => {
    switch (riskScore?.toUpperCase()) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'danger';
      default: return 'secondary';
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const totalPremium = clients.reduce((sum, c) => sum + (c.totalPremium || 0), 0);
  const avgPolicies = clients.length > 0
    ? (clients.reduce((sum, c) => sum + (c.policyCount || 0), 0) / clients.length).toFixed(1)
    : '0';

  return (
    <AppLayout
      title="Clients"
      subtitle={`${total} total clients`}
      actions={
        <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Client</span>
        </Button>
      }
    >
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading clients...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load clients</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <>
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
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Clients</p>
                    <p className="text-2xl font-bold text-foreground">{total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <FileText className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Premium</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totalPremium)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <FileText className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Policies</p>
                    <p className="text-2xl font-bold text-foreground">{avgPolicies}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold text-foreground">+{Math.min(total, 3)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Client List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">All Clients</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredClients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No clients found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or add a new client.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Industry</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Policies</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Premium</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Risk</th>
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
                            <Badge variant="outline">{client.industry || 'Other'}</Badge>
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell text-foreground">{client.policyCount || 0}</td>
                          <td className="py-3 px-4 font-medium text-foreground">{formatCurrency(client.totalPremium || 0)}</td>
                          <td className="py-3 px-4">
                            <Badge variant={getRiskColor(client.riskScore)}>{client.riskScore || 'MEDIUM'}</Badge>
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
                                <DropdownMenuItem onClick={() => setEditClient(client)}>
                                  <Edit className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteClient(client)}>
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
              )}
            </CardContent>
          </Card>
        </>
      )}

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
                  <span>{selectedClient.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{selectedClient.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>{selectedClient.industry || 'Other'}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold text-foreground">{selectedClient.policyCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Policies</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium text-foreground">{selectedClient.lastContact || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Last Contact</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Badge variant={getRiskColor(selectedClient.riskScore)} className="mb-2">{selectedClient.riskScore || 'MEDIUM'}</Badge>
                    <p className="text-sm text-muted-foreground">Risk Level</p>
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

      {/* Add/Edit Client Dialog */}
      <AddClientDialog
        open={showAddDialog || !!editClient}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditClient(null);
          }
        }}
        onSuccess={refetch}
        editClient={editClient}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteClient} onOpenChange={() => setDeleteClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteClient?.name}</strong> from <strong>{deleteClient?.company}</strong>?
              This action cannot be undone and will also delete all associated policies and renewals.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteClient(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClient} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
