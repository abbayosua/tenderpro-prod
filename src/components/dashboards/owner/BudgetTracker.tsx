'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign, AlertTriangle, TrendingDown, TrendingUp,
  Wallet, PieChart, RefreshCw,
} from 'lucide-react';
import { formatRupiah } from '@/lib/helpers';
import { toast } from 'sonner';

interface BudgetProject {
  id: string;
  title: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: string;
}

interface BudgetAlert {
  projectId: string;
  projectTitle: string;
  type: string;
  message: string;
  severity: 'high' | 'warning' | 'info';
}

interface BudgetData {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  projects: BudgetProject[];
  alerts: BudgetAlert[];
}

interface BudgetTrackerProps {
  userId: string;
}

export function BudgetTracker({ userId }: BudgetTrackerProps) {
  const [data, setData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budget/tracker?userId=${userId}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  if (loading) {
    return (
      <Card className="shadow-sm border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Pelacak Anggaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-32" />
            <div className="h-3 bg-slate-200 rounded w-48" />
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.totalBudget === 0) {
    return (
      <Card className="shadow-sm border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Pelacak Anggaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <PieChart className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Belum ada data anggaran</p>
            <p className="text-xs text-slate-400 mt-1">Data akan muncul setelah Anda membuat proyek</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-amber-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-primary';
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50 text-red-700';
      case 'warning': return 'border-amber-200 bg-amber-50 text-amber-700';
      default: return 'border-blue-200 bg-blue-50 text-blue-700';
    }
  };

  return (
    <Card className="shadow-sm border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Pelacak Anggaran
            </CardTitle>
            <CardDescription>Pantau pengeluaran anggaran proyek Anda</CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={loadData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Overall Summary */}
        <div className="bg-gradient-to-r from-primary/5 to-teal-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-slate-500">Total Anggaran</p>
              <p className="text-2xl font-bold text-slate-800">{formatRupiah(data.totalBudget)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Sisa Anggaran</p>
              <p className={`text-xl font-bold ${data.totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatRupiah(data.totalRemaining)}
              </p>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Terpakai: {formatRupiah(data.totalSpent)}</span>
              <span className="font-semibold text-slate-800">{data.overallPercentage}%</span>
            </div>
            <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(data.overallPercentage)}`}
                style={{ width: `${Math.min(data.overallPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Per-Project Budget Bars */}
        {data.projects.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Anggaran per Proyek</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.projects.map((project) => (
                <div key={project.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium truncate max-w-[200px]">{project.title}</span>
                    <span className="text-slate-400">
                      {formatRupiah(project.spent)} / {formatRupiah(project.budget)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getBarColor(project.percentage)}`}
                      style={{ width: `${Math.min(project.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{project.percentage}% terpakai</span>
                    <span className={`font-medium ${
                      project.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatRupiah(project.remaining)} tersisa
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts */}
        {data.alerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Peringatan Anggaran
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {data.alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`text-xs p-2.5 rounded-lg border ${getAlertSeverityColor(alert.severity)}`}
                >
                  <p className="font-medium">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


