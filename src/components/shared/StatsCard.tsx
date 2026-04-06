'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}

export function StatsCard({ label, value, icon: Icon, trend, trendUp, color = 'primary' }: StatsCardProps) {
  const colorClasses: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-l-primary', gradient: 'from-primary/15 to-primary/5' },
    blue: { bg: 'bg-sky-100', text: 'text-sky-600', border: 'border-l-sky-500', gradient: 'from-sky-500/15 to-sky-500/5' },
    yellow: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-l-amber-500', gradient: 'from-amber-500/15 to-amber-500/5' },
    purple: { bg: 'bg-violet-100', text: 'text-violet-600', border: 'border-l-violet-500', gradient: 'from-violet-500/15 to-violet-500/5' },
    green: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-l-emerald-500', gradient: 'from-emerald-500/15 to-emerald-500/5' },
    red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-l-red-500', gradient: 'from-red-500/15 to-red-500/5' },
  };

  const colorClass = colorClasses[color] || colorClasses.primary;

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      <Card className={`hover:shadow-lg transition-all duration-300 border-l-4 ${colorClass.border} overflow-hidden`}>
        <CardContent className="p-5 bg-gradient-to-br from-white to-slate-50/50">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-500 mb-1 font-medium">{label}</p>
              <motion.p
                className="text-3xl font-bold text-slate-900"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {value}
              </motion.p>
              {trend && (
                <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                  {trendUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  <span>{trend} dari bulan lalu</span>
                </div>
              )}
            </div>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
              <Icon className={`h-6 w-6 ${colorClass.text}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface SimpleStatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}

export function SimpleStatsCard({ label, value, icon: Icon, color = 'primary' }: SimpleStatsCardProps) {
  const colorClasses: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-l-primary', gradient: 'from-primary/15 to-primary/5' },
    blue: { bg: 'bg-sky-100', text: 'text-sky-600', border: 'border-l-sky-500', gradient: 'from-sky-500/15 to-sky-500/5' },
    yellow: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-l-amber-500', gradient: 'from-amber-500/15 to-amber-500/5' },
    purple: { bg: 'bg-violet-100', text: 'text-violet-600', border: 'border-l-violet-500', gradient: 'from-violet-500/15 to-violet-500/5' },
    green: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-l-emerald-500', gradient: 'from-emerald-500/15 to-emerald-500/5' },
    red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-l-red-500', gradient: 'from-red-500/15 to-red-500/5' },
  };

  const colorClass = colorClasses[color] || colorClasses.primary;

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      <Card className={`border-l-4 ${colorClass.border} hover:shadow-lg transition-all duration-300 overflow-hidden`}>
        <CardContent className="p-6 bg-gradient-to-br from-white to-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">{label}</p>
              <motion.p
                className="text-3xl font-bold text-slate-900"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {value}
              </motion.p>
            </div>
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorClass.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
              <Icon className={`h-6 w-6 ${colorClass.text}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
