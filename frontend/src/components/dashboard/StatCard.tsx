import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning';
  delay?: number;
}

const variantStyles = {
  default: 'bg-card hover:shadow-card-hover',
  primary: 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground',
  accent: 'bg-gradient-to-br from-accent to-accent/80 text-accent-foreground',
  success: 'bg-gradient-to-br from-success to-success/80 text-success-foreground',
  warning: 'bg-gradient-to-br from-warning to-warning/80 text-warning-foreground',
};

const iconStyles = {
  default: 'bg-primary/10 text-primary',
  primary: 'bg-primary-foreground/20 text-primary-foreground',
  accent: 'bg-accent-foreground/20 text-accent-foreground',
  success: 'bg-success-foreground/20 text-success-foreground',
  warning: 'bg-warning-foreground/20 text-warning-foreground',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  onClick,
  variant = 'default',
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={cn(
        'relative p-5 rounded-xl border border-border shadow-card transition-all duration-300 cursor-pointer overflow-hidden group',
        variantStyles[variant]
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-current" />
      </div>

      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className={cn(
            'text-sm font-medium',
            variant === 'default' ? 'text-muted-foreground' : 'text-current/80'
          )}>
            {title}
          </p>
          <p className="text-2xl font-heading font-bold tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              'text-xs',
              variant === 'default' ? 'text-muted-foreground' : 'text-current/70'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <p className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% vs last month
            </p>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl transition-transform duration-300 group-hover:scale-110',
          iconStyles[variant]
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}
