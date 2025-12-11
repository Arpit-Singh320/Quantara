import { SourceType } from '@/types/broker';
import { Cloud, Mail, Calendar, Database, FileText, Building, BarChart3, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceIconProps {
  type: SourceType;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

const sourceConfig: Record<SourceType, { icon: typeof Cloud; color: string; bgColor: string; label: string }> = {
  salesforce: { icon: Cloud, color: 'text-sky-500', bgColor: 'bg-sky-500/10', label: 'Salesforce' },
  outlook: { icon: Mail, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Outlook' },
  gmail: { icon: Mail, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Gmail' },
  calendar: { icon: Calendar, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Calendar' },
  hubspot: { icon: Database, color: 'text-orange-500', bgColor: 'bg-orange-500/10', label: 'HubSpot' },
  applied: { icon: FileText, color: 'text-purple-500', bgColor: 'bg-purple-500/10', label: 'Applied' },
  ams360: { icon: Building, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', label: 'AMS360' },
  quotesys: { icon: BarChart3, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'QuoteSys' },
};

const sizeClasses = {
  sm: 'h-3 w-3',
  default: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function SourceIcon({ type, className, size = 'default' }: SourceIconProps) {
  const config = sourceConfig[type];
  const Icon = config.icon;

  return <Icon className={cn(sizeClasses[size], config.color, className)} />;
}

export function SourceBadge({ type, className }: { type: SourceType; className?: string }) {
  const config = sourceConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium', config.bgColor, config.color, className)}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </div>
  );
}

export function getSourceConfig(type: SourceType) {
  return sourceConfig[type];
}
