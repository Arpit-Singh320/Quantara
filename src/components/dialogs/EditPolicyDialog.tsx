/**
 * EditPolicyDialog Component
 * Dialog for editing existing policy details
 */

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Policy } from '@/hooks/usePolicies';

interface EditPolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: Policy;
  onSuccess: () => void;
  clients: { id: string; name: string; company: string }[];
}

const policyTypes = [
  'General Liability',
  'Professional Liability',
  'Property',
  'Workers Compensation',
  'Commercial Auto',
  'Cyber Liability',
  'Directors & Officers',
  'Employment Practices',
  'Umbrella',
  'Business Owners Policy',
];

const carriers = [
  'Hartford',
  'Travelers',
  'Chubb',
  'AIG',
  'Liberty Mutual',
  'Zurich',
  'CNA',
  'Nationwide',
  'Progressive',
  'State Farm',
];

export function EditPolicyDialog({
  open,
  onOpenChange,
  policy,
  onSuccess,
  clients,
}: EditPolicyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    policyNumber: '',
    type: '',
    carrier: '',
    premium: '',
    coverageLimit: '',
    deductible: '',
    effectiveDate: '',
    expirationDate: '',
    status: '',
  });

  useEffect(() => {
    if (policy) {
      setFormData({
        policyNumber: policy.policyNumber || '',
        type: policy.type || '',
        carrier: policy.carrier || '',
        premium: policy.premium?.toString() || '',
        coverageLimit: policy.coverageLimit?.toString() || '',
        deductible: policy.deductible?.toString() || '',
        effectiveDate: policy.effectiveDate?.split('T')[0] || '',
        expirationDate: policy.expirationDate?.split('T')[0] || '',
        status: policy.status || 'ACTIVE',
      });
    }
  }, [policy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.policyNumber || !formData.type || !formData.carrier) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: any = {
        policyNumber: formData.policyNumber,
        type: formData.type,
        carrier: formData.carrier,
        status: formData.status,
      };

      if (formData.premium) updateData.premium = parseFloat(formData.premium);
      if (formData.coverageLimit) updateData.coverageLimit = parseFloat(formData.coverageLimit);
      if (formData.deductible) updateData.deductible = parseFloat(formData.deductible);
      if (formData.effectiveDate) updateData.effectiveDate = formData.effectiveDate;
      if (formData.expirationDate) updateData.expirationDate = formData.expirationDate;

      const result = await api.updatePolicy(policy.id, updateData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Policy updated successfully');
        onSuccess();
      }
    } catch (err) {
      toast.error('Failed to update policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Policy</DialogTitle>
          <DialogDescription>
            Update the details for policy {policy.policyNumber}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="policyNumber">Policy Number *</Label>
              <Input
                id="policyNumber"
                value={formData.policyNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, policyNumber: e.target.value }))}
                placeholder="POL-2024-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Policy Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {policyTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="carrier">Carrier *</Label>
              <Select
                value={formData.carrier}
                onValueChange={(value) => setFormData(prev => ({ ...prev, carrier: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  {carriers.map((carrier) => (
                    <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="premium">Premium ($)</Label>
              <Input
                id="premium"
                type="number"
                value={formData.premium}
                onChange={(e) => setFormData(prev => ({ ...prev, premium: e.target.value }))}
                placeholder="50000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverageLimit">Coverage Limit ($)</Label>
              <Input
                id="coverageLimit"
                type="number"
                value={formData.coverageLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, coverageLimit: e.target.value }))}
                placeholder="1000000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deductible">Deductible ($)</Label>
              <Input
                id="deductible"
                type="number"
                value={formData.deductible}
                onChange={(e) => setFormData(prev => ({ ...prev, deductible: e.target.value }))}
                placeholder="5000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input
                id="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditPolicyDialog;
