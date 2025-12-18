/**
 * Add/Edit Policy Dialog
 * Production-grade form for creating and editing policies
 */

import { useState, useEffect } from 'react';
import { Loader2, Shield, Building2, DollarSign, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/services/api';
import { toast } from 'sonner';

const POLICY_TYPES = [
  { value: 'GENERAL_LIABILITY', label: 'General Liability' },
  { value: 'PROFESSIONAL_LIABILITY', label: 'Professional Liability (E&O)' },
  { value: 'CYBER_LIABILITY', label: 'Cyber Liability' },
  { value: 'WORKERS_COMPENSATION', label: 'Workers Compensation' },
  { value: 'PROPERTY', label: 'Property Insurance' },
  { value: 'AUTO', label: 'Commercial Auto' },
  { value: 'UMBRELLA', label: 'Umbrella / Excess' },
  { value: 'DIRECTORS_OFFICERS', label: 'Directors & Officers (D&O)' },
  { value: 'EMPLOYMENT_PRACTICES', label: 'Employment Practices (EPLI)' },
  { value: 'OTHER', label: 'Other' },
];

const CARRIERS = [
  'Hartford',
  'Chubb',
  'AIG',
  'Travelers',
  'Liberty Mutual',
  'Zurich',
  'AXA',
  'Allianz',
  'CNA',
  'Nationwide',
  'Progressive',
  'State Farm',
  'Other',
];

interface Client {
  id: string;
  name: string;
  company: string;
}

interface PolicyFormData {
  clientId: string;
  policyNumber: string;
  type: string;
  carrier: string;
  premium: string;
  coverageLimit: string;
  deductible: string;
  effectiveDate: string;
  expirationDate: string;
}

interface AddPolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  clients: Client[];
  preselectedClientId?: string;
  editPolicy?: {
    id: string;
    clientId: string;
    policyNumber: string;
    type: string;
    carrier: string;
    premium: number;
    coverageLimit: number;
    deductible: number;
    effectiveDate: string;
    expirationDate: string;
  } | null;
}

const initialFormData: PolicyFormData = {
  clientId: '',
  policyNumber: '',
  type: '',
  carrier: '',
  premium: '',
  coverageLimit: '',
  deductible: '',
  effectiveDate: '',
  expirationDate: '',
};

export function AddPolicyDialog({
  open,
  onOpenChange,
  onSuccess,
  clients,
  preselectedClientId,
  editPolicy
}: AddPolicyDialogProps) {
  const [formData, setFormData] = useState<PolicyFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof PolicyFormData, string>>>({});

  const isEditMode = !!editPolicy;

  useEffect(() => {
    if (editPolicy) {
      setFormData({
        clientId: editPolicy.clientId,
        policyNumber: editPolicy.policyNumber,
        type: editPolicy.type,
        carrier: editPolicy.carrier,
        premium: editPolicy.premium.toString(),
        coverageLimit: editPolicy.coverageLimit.toString(),
        deductible: editPolicy.deductible?.toString() || '',
        effectiveDate: editPolicy.effectiveDate.split('T')[0],
        expirationDate: editPolicy.expirationDate.split('T')[0],
      });
    } else {
      setFormData({
        ...initialFormData,
        clientId: preselectedClientId || '',
        policyNumber: generatePolicyNumber(),
        effectiveDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    }
    setErrors({});
  }, [editPolicy, preselectedClientId, open]);

  const generatePolicyNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `POL-${year}-${random}`;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PolicyFormData, string>> = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Please select a client';
    }

    if (!formData.policyNumber.trim()) {
      newErrors.policyNumber = 'Policy number is required';
    }

    if (!formData.type) {
      newErrors.type = 'Please select a policy type';
    }

    if (!formData.carrier) {
      newErrors.carrier = 'Please select a carrier';
    }

    if (!formData.premium || parseFloat(formData.premium) <= 0) {
      newErrors.premium = 'Please enter a valid premium amount';
    }

    if (!formData.coverageLimit || parseFloat(formData.coverageLimit) <= 0) {
      newErrors.coverageLimit = 'Please enter a valid coverage limit';
    }

    if (!formData.effectiveDate) {
      newErrors.effectiveDate = 'Effective date is required';
    }

    if (!formData.expirationDate) {
      newErrors.expirationDate = 'Expiration date is required';
    }

    if (formData.effectiveDate && formData.expirationDate) {
      if (new Date(formData.expirationDate) <= new Date(formData.effectiveDate)) {
        newErrors.expirationDate = 'Expiration date must be after effective date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        clientId: formData.clientId,
        policyNumber: formData.policyNumber.trim(),
        type: formData.type,
        carrier: formData.carrier,
        premium: parseFloat(formData.premium),
        coverageLimit: parseFloat(formData.coverageLimit),
        deductible: formData.deductible ? parseFloat(formData.deductible) : 0,
        effectiveDate: formData.effectiveDate,
        expirationDate: formData.expirationDate,
      };

      let result;
      if (isEditMode && editPolicy) {
        result = await api.updatePolicy(editPolicy.id, payload);
      } else {
        result = await api.createPolicy(payload);
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(isEditMode ? 'Policy updated successfully' : 'Policy created successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof PolicyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {isEditMode ? 'Edit Policy' : 'Add New Policy'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Client
            </h3>

            <div className="space-y-2">
              <Label htmlFor="client" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Select Client *
              </Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => updateField('clientId', value)}
                disabled={isEditMode}
              >
                <SelectTrigger className={errors.clientId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company} - {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && (
                <p className="text-xs text-destructive">{errors.clientId}</p>
              )}
            </div>
          </div>

          {/* Policy Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Policy Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="policyNumber" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Policy Number *
                </Label>
                <Input
                  id="policyNumber"
                  placeholder="POL-2024-0001"
                  value={formData.policyNumber}
                  onChange={(e) => updateField('policyNumber', e.target.value)}
                  className={errors.policyNumber ? 'border-destructive' : ''}
                  disabled={isEditMode}
                />
                {errors.policyNumber && (
                  <p className="text-xs text-destructive">{errors.policyNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Policy Type *
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => updateField('type', value)}
                  disabled={isEditMode}
                >
                  <SelectTrigger className={errors.type ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select policy type" />
                  </SelectTrigger>
                  <SelectContent>
                    {POLICY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-xs text-destructive">{errors.type}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="carrier">Carrier *</Label>
                <Select value={formData.carrier} onValueChange={(value) => updateField('carrier', value)}>
                  <SelectTrigger className={errors.carrier ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARRIERS.map((carrier) => (
                      <SelectItem key={carrier} value={carrier}>
                        {carrier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.carrier && (
                  <p className="text-xs text-destructive">{errors.carrier}</p>
                )}
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financial Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="premium">Annual Premium *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="premium"
                    type="number"
                    placeholder="50000"
                    value={formData.premium}
                    onChange={(e) => updateField('premium', e.target.value)}
                    className={`pl-7 ${errors.premium ? 'border-destructive' : ''}`}
                  />
                </div>
                {formData.premium && (
                  <p className="text-xs text-muted-foreground">{formatCurrency(formData.premium)}</p>
                )}
                {errors.premium && (
                  <p className="text-xs text-destructive">{errors.premium}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverageLimit">Coverage Limit *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="coverageLimit"
                    type="number"
                    placeholder="1000000"
                    value={formData.coverageLimit}
                    onChange={(e) => updateField('coverageLimit', e.target.value)}
                    className={`pl-7 ${errors.coverageLimit ? 'border-destructive' : ''}`}
                  />
                </div>
                {formData.coverageLimit && (
                  <p className="text-xs text-muted-foreground">{formatCurrency(formData.coverageLimit)}</p>
                )}
                {errors.coverageLimit && (
                  <p className="text-xs text-destructive">{errors.coverageLimit}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deductible">Deductible</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="deductible"
                    type="number"
                    placeholder="5000"
                    value={formData.deductible}
                    onChange={(e) => updateField('deductible', e.target.value)}
                    className="pl-7"
                  />
                </div>
                {formData.deductible && (
                  <p className="text-xs text-muted-foreground">{formatCurrency(formData.deductible)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Policy Period */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Policy Period
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Effective Date *</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => updateField('effectiveDate', e.target.value)}
                  className={errors.effectiveDate ? 'border-destructive' : ''}
                />
                {errors.effectiveDate && (
                  <p className="text-xs text-destructive">{errors.effectiveDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expirationDate">Expiration Date *</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => updateField('expirationDate', e.target.value)}
                  className={errors.expirationDate ? 'border-destructive' : ''}
                />
                {errors.expirationDate && (
                  <p className="text-xs text-destructive">{errors.expirationDate}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditMode ? 'Update Policy' : 'Create Policy'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddPolicyDialog;
