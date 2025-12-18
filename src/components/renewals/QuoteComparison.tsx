/**
 * QuoteComparison Component
 * Side-by-side quote comparison table with selection
 */

import { useState, useEffect } from 'react';
import { Check, Plus, TrendingUp, TrendingDown, Minus, Star, FileText, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, Quote } from '@/services/api';
import { toast } from 'sonner';

interface QuoteComparisonProps {
  renewalId: string;
  onQuoteSelect?: (quoteId: string) => void;
}

interface RenewalInfo {
  id: string;
  clientName: string;
  policyType: string;
  policyNumber: string;
  currentCarrier: string;
  expiringPremium: number;
  dueDate: string;
}

interface QuoteSummary {
  totalQuotes: number;
  lowestPremium: number | null;
  highestPremium: number | null;
  averagePremium: number | null;
  expiringPremium: number;
  selectedQuote: string | null;
}

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

export function QuoteComparison({ renewalId, onQuoteSelect }: QuoteComparisonProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [renewal, setRenewal] = useState<RenewalInfo | null>(null);
  const [summary, setSummary] = useState<QuoteSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddQuote, setShowAddQuote] = useState(false);
  const [newQuote, setNewQuote] = useState({
    carrier: '',
    premium: '',
    coverageLimit: '',
    deductible: '',
  });

  useEffect(() => {
    fetchQuotes();
  }, [renewalId]);

  const fetchQuotes = async () => {
    try {
      setIsLoading(true);
      const response = await api.getRenewalQuotes(renewalId);
      if (response.data) {
        setQuotes(response.data.quotes);
        setRenewal(response.data.renewal);
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectQuote = async (quoteId: string) => {
    try {
      await api.selectQuote(quoteId);
      await fetchQuotes();
      onQuoteSelect?.(quoteId);
      toast.success('Quote selected for binding');
    } catch (error) {
      toast.error('Failed to select quote');
    }
  };

  const handleAddQuote = async () => {
    if (!newQuote.carrier || !newQuote.premium || !newQuote.coverageLimit) {
      toast.error('Please fill in carrier, premium, and coverage limit');
      return;
    }

    try {
      await api.createQuote({
        renewalId,
        carrier: newQuote.carrier,
        premium: parseFloat(newQuote.premium),
        coverageLimit: parseFloat(newQuote.coverageLimit),
        deductible: newQuote.deductible ? parseFloat(newQuote.deductible) : undefined,
      });

      setNewQuote({ carrier: '', premium: '', coverageLimit: '', deductible: '' });
      setShowAddQuote(false);
      await fetchQuotes();
      toast.success('Quote added');
    } catch (error) {
      toast.error('Failed to add quote');
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;

    try {
      await api.deleteQuote(quoteId);
      await fetchQuotes();
      toast.success('Quote deleted');
    } catch (error) {
      toast.error('Failed to delete quote');
    }
  };

  const getPriceChangeIcon = (change: number | null | undefined) => {
    if (change === null || change === undefined) return <Minus className="h-4 w-4 text-slate-400" />;
    if (change > 5) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (change < -5) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

  const getPriceChangeColor = (change: number | null | undefined) => {
    if (change === null || change === undefined) return 'text-muted-foreground';
    if (change > 5) return 'text-red-500';
    if (change < -5) return 'text-green-500';
    return 'text-muted-foreground';
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-secondary rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Quote Comparison</h3>
          {renewal && (
            <p className="text-sm text-muted-foreground">
              {renewal.policyType} • Current: {renewal.currentCarrier} @ {formatCurrency(renewal.expiringPremium)}
            </p>
          )}
        </div>
        <Button onClick={() => setShowAddQuote(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Quote
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && summary.totalQuotes > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Quotes</p>
            <p className="text-2xl font-bold">{summary.totalQuotes}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Lowest</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.lowestPremium)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Highest</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.highestPremium)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Expiring</p>
            <p className="text-2xl font-bold">{formatCurrency(summary.expiringPremium)}</p>
          </Card>
        </div>
      )}

      {/* Add Quote Form */}
      {showAddQuote && (
        <Card className="p-4 border-2 border-dashed border-primary/30 bg-primary/5">
          <h4 className="font-medium mb-4">Add New Quote</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Carrier *</label>
              <input
                type="text"
                value={newQuote.carrier}
                onChange={(e) => setNewQuote(prev => ({ ...prev, carrier: e.target.value }))}
                placeholder="e.g., Hartford"
                className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Premium *</label>
              <input
                type="number"
                value={newQuote.premium}
                onChange={(e) => setNewQuote(prev => ({ ...prev, premium: e.target.value }))}
                placeholder="50000"
                className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Coverage Limit *</label>
              <input
                type="number"
                value={newQuote.coverageLimit}
                onChange={(e) => setNewQuote(prev => ({ ...prev, coverageLimit: e.target.value }))}
                placeholder="1000000"
                className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Deductible</label>
              <input
                type="number"
                value={newQuote.deductible}
                onChange={(e) => setNewQuote(prev => ({ ...prev, deductible: e.target.value }))}
                placeholder="5000"
                className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-background"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAddQuote}>Save Quote</Button>
            <Button variant="ghost" onClick={() => setShowAddQuote(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Quote Cards Grid */}
      {quotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotes.map((quote) => {
            const isSelected = quote.isSelected;
            const isLowest = summary?.lowestPremium === quote.premium;
            const priceChange = quote.priceChange ?? (
              renewal ? ((quote.premium - renewal.expiringPremium) / renewal.expiringPremium) * 100 : null
            );

            return (
              <Card
                key={quote.id}
                className={cn(
                  'relative overflow-hidden transition-all',
                  isSelected && 'ring-2 ring-primary border-primary',
                  isLowest && !isSelected && 'ring-1 ring-green-500/50'
                )}
              >
                {/* Selected Badge */}
                {isSelected && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                    <Check className="h-3 w-3 inline mr-1" />
                    Selected
                  </div>
                )}

                {/* Best Value Badge */}
                {isLowest && !isSelected && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                    <Star className="h-3 w-3 inline mr-1" />
                    Best Value
                  </div>
                )}

                <div className="p-4">
                  {/* Carrier */}
                  <h4 className="font-semibold text-lg mb-1">{quote.carrier}</h4>

                  {/* Premium with Change */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl font-bold">{formatCurrency(quote.premium)}</span>
                    <div className={cn('flex items-center gap-1 text-sm', getPriceChangeColor(priceChange))}>
                      {getPriceChangeIcon(priceChange)}
                      <span>{formatPercent(priceChange)}</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coverage Limit</span>
                      <span className="font-medium">{formatCurrency(quote.coverageLimit)}</span>
                    </div>
                    {quote.deductible && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Deductible</span>
                        <span className="font-medium">{formatCurrency(quote.deductible)}</span>
                      </div>
                    )}
                    {quote.perOccurrence && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per Occurrence</span>
                        <span className="font-medium">{formatCurrency(quote.perOccurrence)}</span>
                      </div>
                    )}
                    {quote.aggregate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Aggregate</span>
                        <span className="font-medium">{formatCurrency(quote.aggregate)}</span>
                      </div>
                    )}
                  </div>

                  {/* Exclusions */}
                  {quote.exclusions && quote.exclusions.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Exclusions:</p>
                      <div className="flex flex-wrap gap-1">
                        {quote.exclusions.slice(0, 3).map((ex, i) => (
                          <Badge key={i} variant="outline" className="text-xs text-red-500">
                            {ex}
                          </Badge>
                        ))}
                        {quote.exclusions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{quote.exclusions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Coverage Score */}
                  {quote.coverageScore && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Coverage Score</span>
                        <Badge variant={quote.coverageScore >= 80 ? 'default' : 'secondary'}>
                          {quote.coverageScore}/100
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {quote.notes && (
                    <p className="mt-3 pt-3 border-t text-xs text-muted-foreground italic">
                      {quote.notes}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    {!isSelected && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSelectQuote(quote.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Select
                      </Button>
                    )}
                    {isSelected && (
                      <Button size="sm" variant="outline" className="flex-1" disabled>
                        <Check className="h-4 w-4 mr-1" />
                        Selected
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteQuote(quote.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
          <h4 className="font-medium mb-1">No quotes yet</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Add quotes from carriers to compare pricing and coverage
          </p>
          <Button onClick={() => setShowAddQuote(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Quote
          </Button>
        </Card>
      )}

      {/* Comparison Table (for 2+ quotes) */}
      {quotes.length >= 2 && (
        <Card className="overflow-hidden">
          <div className="p-4 bg-muted/30 border-b">
            <h4 className="font-medium">Detailed Comparison</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Metric</th>
                  {quotes.map(q => (
                    <th key={q.id} className="text-center p-3 font-medium">
                      {q.carrier}
                      {q.isSelected && <Badge className="ml-2 text-xs">Selected</Badge>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3 text-muted-foreground">Premium</td>
                  {quotes.map(q => (
                    <td key={q.id} className={cn(
                      'p-3 text-center font-medium',
                      summary?.lowestPremium === q.premium && 'text-green-600'
                    )}>
                      {formatCurrency(q.premium)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 text-muted-foreground">vs Expiring</td>
                  {quotes.map(q => {
                    const change = renewal
                      ? ((q.premium - renewal.expiringPremium) / renewal.expiringPremium) * 100
                      : null;
                    return (
                      <td key={q.id} className={cn('p-3 text-center', getPriceChangeColor(change))}>
                        {formatPercent(change)}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-3 text-muted-foreground">Coverage Limit</td>
                  {quotes.map(q => (
                    <td key={q.id} className="p-3 text-center">
                      {formatCurrency(q.coverageLimit)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 text-muted-foreground">Deductible</td>
                  {quotes.map(q => (
                    <td key={q.id} className="p-3 text-center">
                      {formatCurrency(q.deductible)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 text-muted-foreground">Status</td>
                  {quotes.map(q => (
                    <td key={q.id} className="p-3 text-center">
                      <Badge variant={q.status === 'SELECTED' ? 'default' : 'secondary'}>
                        {q.status}
                      </Badge>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default QuoteComparison;
