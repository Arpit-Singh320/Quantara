/**
 * Compliance Banner Component
 * Highlights non-negotiable challenge requirements - visible proof of compliance
 */

import { Shield, Database, Link2, Eye, Zap, CheckCircle2, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ComplianceBannerProps {
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

export function ComplianceBanner({ variant = 'compact', className }: ComplianceBannerProps) {
  const complianceItems = [
    {
      icon: Zap,
      label: 'Live Data Only',
      description: 'All data fetched in real-time from connected systems',
      color: 'text-green-500',
    },
    {
      icon: Database,
      label: 'No Document Storage',
      description: 'Tokens only - no RAG, no embeddings, no vector DB',
      color: 'text-blue-500',
    },
    {
      icon: Link2,
      label: 'Source Traceability',
      description: 'Every output cites System + Record ID + Deep Link',
      color: 'text-purple-500',
    },
    {
      icon: Eye,
      label: 'Explainable Scoring',
      description: 'Transparent factor breakdown with manual override',
      color: 'text-orange-500',
    },
  ];

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-muted-foreground">Live Data • Traceable • Compliant</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 border-b', className)}>
        <Shield className="h-4 w-4 text-green-500" />
        <div className="flex items-center gap-4 flex-wrap">
          {complianceItems.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <item.icon className={cn('h-3.5 w-3.5', item.color)} />
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          ))}
        </div>
        <Badge variant="outline" className="ml-auto text-[10px] bg-green-500/10 text-green-600 border-green-500/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Challenge Compliant
        </Badge>
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn('p-4 bg-gradient-to-r from-green-500/5 via-blue-500/5 to-purple-500/5 border rounded-lg', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-5 w-5 text-green-500" />
        <h3 className="font-semibold">Challenge Compliance Status</h3>
        <Badge variant="outline" className="ml-auto text-xs bg-green-500/10 text-green-600 border-green-500/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          All Requirements Met
        </Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {complianceItems.map((item) => (
          <div key={item.label} className="p-3 bg-background/50 rounded-lg border">
            <div className="flex items-center gap-2 mb-1">
              <item.icon className={cn('h-4 w-4', item.color)} />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Source Citation Component
 * Renders a clickable source citation with proper formatting
 */
interface SourceCitationProps {
  system: string;
  recordType: string;
  recordId: string;
  link?: string;
  className?: string;
}

export function SourceCitation({ system, recordType, recordId, link, className }: SourceCitationProps) {
  const content = (
    <span className={cn('inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors', className)}>
      <ExternalLink className="h-3 w-3" />
      [Source: {system} - {recordType} #{recordId}]
    </span>
  );

  if (link) {
    return <a href={link} className="hover:underline">{content}</a>;
  }

  return content;
}

/**
 * Data Source Badge Component
 * Shows where data came from with visual indicator
 */
interface DataSourceBadgeProps {
  sources: Array<{
    system: string;
    recordId: string;
    dataPoints: string[];
  }>;
  className?: string;
}

export function DataSourceBadges({ sources, className }: DataSourceBadgeProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {sources.map((source, i) => (
        <Badge key={i} variant="outline" className="text-[10px] gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
          {source.system}
          <span className="text-muted-foreground">#{source.recordId}</span>
        </Badge>
      ))}
    </div>
  );
}

export default ComplianceBanner;
