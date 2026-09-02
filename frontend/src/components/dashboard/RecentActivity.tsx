import { motion } from 'framer-motion';
import { Phone, FileCheck, UserPlus, DollarSign, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'call' | 'task' | 'lead' | 'payment' | 'alert';
  title: string;
  description: string;
  time: string;
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'call',
    title: 'Call completed with Praveen Kumar',
    description: 'Interested in website package',
    time: '2 hours ago',
  },
  {
    id: '2',
    type: 'task',
    title: 'Website redesign completed',
    description: 'Sunrise Hospital project',
    time: '3 hours ago',
  },
  {
    id: '3',
    type: 'lead',
    title: 'New lead assigned',
    description: 'Metro Fitness Gym - App Development',
    time: '5 hours ago',
  },
  {
    id: '4',
    type: 'payment',
    title: 'Payment received',
    description: '₹40,000 from Andhra Spices',
    time: '6 hours ago',
  },
  {
    id: '5',
    type: 'alert',
    title: 'Follow-up reminder',
    description: 'Mahesh Traders - Call back scheduled',
    time: '8 hours ago',
  },
];

const iconMap = {
  call: Phone,
  task: FileCheck,
  lead: UserPlus,
  payment: DollarSign,
  alert: AlertCircle,
};

const colorMap = {
  call: 'bg-info/15 text-info',
  task: 'bg-success/15 text-success',
  lead: 'bg-accent/15 text-accent',
  payment: 'bg-success/15 text-success',
  alert: 'bg-warning/15 text-warning',
};

export function RecentActivity() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-card rounded-xl border border-border shadow-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-heading font-semibold text-foreground">
            Recent Activity
          </h3>
          <p className="text-sm text-muted-foreground">
            Latest updates across the CRM
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type];
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className={cn('p-2 rounded-lg', colorMap[activity.type])}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {activity.description}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {activity.time}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
