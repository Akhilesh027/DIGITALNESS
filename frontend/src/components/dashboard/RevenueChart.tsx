import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { monthlyRevenueData } from '@/data/dummyData';

export function RevenueChart() {
  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${(value / 1000).toFixed(0)}K`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-card rounded-xl border border-border shadow-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-heading font-semibold text-foreground">
            Revenue Overview
          </h3>
          <p className="text-sm text-muted-foreground">
            Last 6 months performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-sm text-muted-foreground">Customers</span>
          </div>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyRevenueData}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(210, 55%, 25%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(210, 55%, 25%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(168, 75%, 40%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(168, 75%, 40%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 88%)" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 15%, 45%)', fontSize: 12 }}
            />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 15%, 45%)', fontSize: 12 }}
              tickFormatter={formatCurrency}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 15%, 45%)', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(210, 20%, 88%)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px hsl(215, 25%, 15%, 0.1)',
              }}
              formatter={(value: number, name: string) => [
                name === 'income' ? formatCurrency(value) : value,
                name === 'income' ? 'Income' : 'Customers',
              ]}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="income"
              stroke="hsl(210, 55%, 25%)"
              strokeWidth={2}
              fill="url(#colorIncome)"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="customers"
              stroke="hsl(168, 75%, 40%)"
              strokeWidth={2}
              fill="url(#colorCustomers)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
