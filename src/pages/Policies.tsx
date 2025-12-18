import { useState } from 'react';
import {
  Search, Shield, Calendar, DollarSign, FileText, AlertTriangle,
  MoreHorizontal, Plus, Eye, Edit, Download, CheckCircle, Clock, Loader2, AlertCircle, Trash2,
  RefreshCw, Power, PowerOff
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
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePolicies, Policy } from '@/hooks/usePolicies';
import { useClients } from '@/hooks/useClients';
import { AddPolicyDialog } from '@/components/dialogs/AddPolicyDialog';
import { EditPolicyDialog } from '@/components/dialogs/EditPolicyDialog';
import { api } from '@/services/api';
import { toast } from 'sonner';

export default function Policies() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deletePolicy, setDeletePolicy] = useState<Policy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editPolicy, setEditPolicy] = useState<Policy | null>(null);

  const { policies, total, isLoading, error, refetch, summary } = usePolicies();
  const { clients } = useClients();

  const handleDeletePolicy = async () => {
    if (!deletePolicy) return;
    setIsDeleting(true);
    try {
      const result = await api.deletePolicy(deletePolicy.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Policy deleted successfully');
        refetch();
      }
    } catch (err) {
      toast.error('Failed to delete policy');
    } finally {
      setIsDeleting(false);
      setDeletePolicy(null);
    }
  };

  const handleInitiateRenewal = async (policyId: string) => {
    try {
      const result = await api.createRenewal(policyId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Renewal initiated successfully! Check the Dashboard for renewal tracking.');
      }
    } catch (err) {
      toast.error('Failed to initiate renewal');
    }
  };

  const handleTogglePolicyStatus = async (policy: Policy) => {
    const newStatus = policy.status === 'ACTIVE' ? 'CANCELLED' : 'ACTIVE';
    try {
      const result = await api.updatePolicy(policy.id, { status: newStatus });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Policy ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`);
        refetch();
      }
    } catch (err) {
      toast.error('Failed to update policy status');
    }
  };

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || policy.status?.toLowerCase() === activeTab;
    return matchesSearch && matchesTab;
  });

  const getStatusVariant = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'EXPIRED': return 'danger';
      case 'CANCELLED': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const getDaysUntilExpiry = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const now = new Date();
    const diff = expDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getExpiryBadge = (expirationDate: string) => {
    const days = getDaysUntilExpiry(expirationDate);
    if (days < 0) return null;
    if (days <= 14) return <Badge variant="danger" className="ml-2"><Clock className="h-3 w-3 mr-1" />{days}d</Badge>;
    if (days <= 30) return <Badge variant="warning" className="ml-2"><Clock className="h-3 w-3 mr-1" />{days}d</Badge>;
    return null;
  };

  const activePolicies = policies.filter(p => p.status?.toUpperCase() === 'ACTIVE').length;
  const expiringSoon = policies.filter(p => {
    const days = getDaysUntilExpiry(p.expirationDate);
    return days > 0 && days <= 30;
  }).length;

  return (
    <AppLayout
      title="Policies"
      subtitle={`${total} total policies`}
      actions={
        <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Policy</span>
        </Button>
      }
    >
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading policies...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load policies</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <>
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
                    <p className="text-2xl font-bold text-foreground">{activePolicies}</p>
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
                    <p className="text-2xl font-bold text-warning">{expiringSoon}</p>
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
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(summary?.totalPremium || 0)}</p>
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
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(summary?.totalCoverage || 0)}</p>
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
                              </div>
                            </td>
                            <td className="py-3 px-4 hidden lg:table-cell text-foreground">{policy.carrier}</td>
                            <td className="py-3 px-4 font-medium text-foreground">${(policy.premium / 1000).toFixed(0)}K</td>
                            <td className="py-3 px-4 hidden sm:table-cell">
                              <span className="text-foreground">{policy.expirationDate}</span>
                              {getExpiryBadge(policy.expirationDate)}
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
                                  <DropdownMenuItem onClick={() => setEditPolicy(policy)}>
                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleInitiateRenewal(policy.id)}>
                                    <RefreshCw className="h-4 w-4 mr-2" /> Initiate Renewal
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleTogglePolicyStatus(policy)}>
                                    {policy.status === 'ACTIVE' ? (
                                      <><PowerOff className="h-4 w-4 mr-2" /> Deactivate</>
                                    ) : (
                                      <><Power className="h-4 w-4 mr-2" /> Activate</>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="h-4 w-4 mr-2" /> Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => setDeletePolicy(policy)}>
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
            </TabsContent>
          </Tabs>
        </>
      )}

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
                    <p className="font-medium text-foreground">{selectedPolicy.clientName || 'N/A'}</p>
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
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(selectedPolicy.premium)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Coverage Limit</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(selectedPolicy.coverageLimit)}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Effective Date</p>
                      <p className="font-medium text-foreground">{new Date(selectedPolicy.effectiveDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-center">
                      <Calendar className="h-5 w-5 text-muted-foreground mx-auto" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Expiration Date</p>
                      <p className="font-medium text-foreground">{new Date(selectedPolicy.expirationDate).toLocaleDateString()}</p>
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

      {/* Add Policy Dialog */}
      <AddPolicyDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={refetch}
        clients={clients.map(c => ({ id: c.id, name: c.name, company: c.company }))}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletePolicy} onOpenChange={() => setDeletePolicy(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Policy</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete policy <strong>{deletePolicy?.policyNumber}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeletePolicy(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePolicy} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Policy Dialog */}
      {editPolicy && (
        <EditPolicyDialog
          open={!!editPolicy}
          onOpenChange={(open) => !open && setEditPolicy(null)}
          policy={editPolicy}
          onSuccess={() => {
            setEditPolicy(null);
            refetch();
          }}
          clients={clients.map(c => ({ id: c.id, name: c.name, company: c.company }))}
        />
      )}
    </AppLayout>
  );
}
