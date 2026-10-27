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
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'brand';
  delay?: number;
}

const variantStyles = {
  default:
    'bg-card/85 backdrop-blur-xl border border-border/80 hover:border-[#00D8F6]/40 hover:shadow-lg text-foreground',
  primary:
    'bg-gradient-to-br from-[#0B0E2B] via-[#161D4C] to-[#2E1065] text-white border border-[#FF1B7A]/30 shadow-md shadow-[#FF1B7A]/15',
  brand:
    'bg-gradient-to-br from-[#0B0E2B] via-[#161D4C] to-[#2E1065] text-white border border-[#FF1B7A]/30 shadow-lg shadow-[#FF1B7A]/20',
  accent:
    'bg-gradient-to-br from-[#FF1B7A] to-[#7928CA] text-white shadow-lg shadow-[#FF1B7A]/20',
  success:
    'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-500/20',
  warning:
    'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20',
};

const iconStyles = {
  default: 'bg-secondary text-primary border border-border/60',
  primary: 'bg-white/10 text-[#00D8F6] border border-white/20 backdrop-blur-md',
  brand: 'bg-white/10 text-[#00D8F6] border border-white/20 backdrop-blur-md',
  accent: 'bg-white/20 text-white backdrop-blur-md',
  success: 'bg-white/20 text-white backdrop-blur-md',
  warning: 'bg-white/20 text-white backdrop-blur-md',
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
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay * 0.05 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={cn(
        'relative p-5 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden group select-none',
        variantStyles[variant]
      )}
    >
      {/* Dynamic Ambient Blur Glow */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br from-[#FF1B7A]/10 to-[#00D8F6]/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p
            className={cn(
              'text-xs font-semibold uppercase tracking-wider',
              variant === 'default' ? 'text-muted-foreground' : 'text-slate-300'
            )}
          >
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight truncate">
            {value}
          </p>
          {subtitle && (
            <p
              className={cn(
                'text-xs font-medium truncate',
                variant === 'default' ? 'text-muted-foreground' : 'text-slate-300/80'
              )}
            >
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1.5 pt-1">
              <span
                className={cn(
                  'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold',
                  trend.isPositive
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-[11px] text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>

        <div
          className={cn(
            'p-3 rounded-xl transition-all duration-300 group-hover:scale-110 shrink-0 shadow-sm',
            iconStyles[variant]
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}
