/**
 * Add/Edit Client Dialog
 * Production-grade form for creating and editing clients
 */

import { useState, useEffect } from 'react';
import { Loader2, User, Building2, Mail, Phone, MapPin, Briefcase } from 'lucide-react';
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

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Manufacturing',
  'Financial Services',
  'Retail',
  'Construction',
  'Real Estate',
  'Transportation',
  'Energy',
  'Professional Services',
  'Hospitality',
  'Education',
  'Non-Profit',
  'Other',
];

interface ClientFormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editClient?: {
    id: string;
    name: string;
    company: string;
    email?: string;
    phone?: string;
    industry?: string;
  } | null;
}

const initialFormData: ClientFormData = {
  name: '',
  company: '',
  email: '',
  phone: '',
  industry: '',
  address: {
    street: '',
    city: '',
    state: '',
    zip: '',
  },
};

export function AddClientDialog({ open, onOpenChange, onSuccess, editClient }: AddClientDialogProps) {
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});

  const isEditMode = !!editClient;

  useEffect(() => {
    if (editClient) {
      setFormData({
        name: editClient.name || '',
        company: editClient.company || '',
        email: editClient.email || '',
        phone: editClient.phone || '',
        industry: editClient.industry || '',
        address: { street: '', city: '', state: '', zip: '' },
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [editClient, open]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ClientFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Contact name is required';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
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
        name: formData.name.trim(),
        company: formData.company.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        industry: formData.industry || undefined,
        address: formData.address.street ? formData.address : undefined,
      };

      let result;
      if (isEditMode && editClient) {
        result = await api.updateClient(editClient.id, payload);
      } else {
        result = await api.createClient(payload);
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(isEditMode ? 'Client updated successfully' : 'Client created successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const updateAddress = (field: keyof ClientFormData['address'], value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {isEditMode ? 'Edit Client' : 'Add New Client'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact Name *
                </Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company Name *
                </Label>
                <Input
                  id="company"
                  placeholder="Acme Corporation"
                  value={formData.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  className={errors.company ? 'border-destructive' : ''}
                />
                {errors.company && (
                  <p className="text-xs text-destructive">{errors.company}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@acme.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Business Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="industry" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Industry
              </Label>
              <Select value={formData.industry} onValueChange={(value) => updateField('industry', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address (Optional)
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  placeholder="123 Main Street"
                  value={formData.address.street}
                  onChange={(e) => updateAddress('street', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="New York"
                    value={formData.address.city}
                    onChange={(e) => updateAddress('city', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="NY"
                    value={formData.address.state}
                    onChange={(e) => updateAddress('state', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    placeholder="10001"
                    value={formData.address.zip}
                    onChange={(e) => updateAddress('zip', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditMode ? 'Update Client' : 'Create Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddClientDialog;
