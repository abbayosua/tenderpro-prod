'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}

export function StatsCard({ label, value, icon: Icon, trend, trendUp, color = 'primary' }: StatsCardProps) {
  const colorClasses: Record<string, { bg: string; text: string }> = {
    primary: { bg: 'bg-primary/10', text: 'text-primary' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600' },
  };

  const colorClass = colorClasses[color] || colorClasses.primary;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-slate-500 mb-1">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${trendUp ? 'text-primary' : 'text-red-500'}`}>
                {trendUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span>{trend} dari bulan lalu</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 ${colorClass.bg} rounded-xl flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${colorClass.text}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SimpleStatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}

export function SimpleStatsCard({ label, value, icon: Icon, color = 'primary' }: SimpleStatsCardProps) {
  const colorClasses: Record<string, { bg: string; text: string }> = {
    primary: { bg: 'bg-primary/10', text: 'text-primary' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600' },
  };

  const colorClass = colorClasses[color] || colorClasses.primary;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
          <div className={`w-12 h-12 ${colorClass.bg} rounded-full flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${colorClass.text}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
