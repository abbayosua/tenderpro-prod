'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge, Progress } from '@/components/ui';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ChartContainer } from '@/components/ui/chart';
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { 
  DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Download, FileText, PieChartIcon, 
  ChevronDown, ChevronUp, Milestone, Calendar, CheckCircle, Clock, AlertCircle, FileSpreadsheet
} from 'lucide-react';
import { formatRupiah } from '@/lib/helpers';
import { 
  exportBudgetSummary, 
  exportPaymentHistory, 
  exportMilestoneBreakdown, 
  hasDataToExport,
  type BudgetSummaryItem,
  type PaymentHistoryItem,
  type MilestoneExportItem
} from '@/lib/export-utils';
import { BudgetAlert, calculateBudgetAlerts, type BudgetAlertThresholds } from '@/components/shared/BudgetAlert';
import type { OwnerPaymentsTabProps, ProjectMilestoneBreakdown, MilestoneBreakdownItem } from './types';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const chartConfig: ChartConfig = {
  spent: { label: 'Terpakai', color: 'hsl(var(--primary))' },
  budget: { label: 'Anggaran', color: 'hsl(var(--chart-2))' },
};

// Get status color and icon for milestone status
function getMilestoneStatusInfo(status: string) {
  switch (status) {
    case 'COMPLETED':
      return { 
        color: 'bg-green-100 text-green-700 border-green-200', 
        icon: CheckCircle,
        label: 'Selesai' 
      };
    case 'IN_PROGRESS':
      return { 
        color: 'bg-blue-100 text-blue-700 border-blue-200', 
        icon: Clock,
        label: 'Berjalan' 
      };
    case 'PENDING':
    default:
      return { 
        color: 'bg-slate-100 text-slate-700 border-slate-200', 
        icon: AlertCircle,
        label: 'Menunggu' 
      };
  }
}

// Get project status info
function getProjectStatusInfo(status: string) {
  switch (status) {
    case 'COMPLETED':
      return { color: 'bg-green-500', label: 'Selesai' };
    case 'IN_PROGRESS':
      return { color: 'bg-blue-500', label: 'Berjalan' };
    case 'OPEN':
      return { color: 'bg-yellow-500', label: 'Terbuka' };
    case 'CANCELLED':
      return { color: 'bg-red-500', label: 'Dibatalkan' };
    default:
      return { color: 'bg-slate-500', label: 'Draft' };
  }
}

// Single milestone item component
function MilestoneItem({ milestone, index }: { milestone: MilestoneBreakdownItem; index: number }) {
  const statusInfo = getMilestoneStatusInfo(milestone.status);
  const StatusIcon = statusInfo.icon;
  
  return (
    <div className="border rounded-lg p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm shrink-0">
            {index + 1}
          </div>
          <div>
            <h4 className="font-medium text-slate-900">{milestone.title}</h4>
            {milestone.description && (
              <p className="text-sm text-slate-500 mt-1">{milestone.description}</p>
            )}
          </div>
        </div>
        <Badge variant="outline" className={`shrink-0 ${statusInfo.color}`}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusInfo.label}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
        <div>
          <p className="text-slate-500">Anggaran</p>
          <p className="font-semibold text-slate-900">{formatRupiah(milestone.amount)}</p>
        </div>
        <div>
          <p className="text-slate-500">Dibayar</p>
          <p className="font-semibold text-green-600">{formatRupiah(milestone.paidAmount)}</p>
        </div>
        <div>
          <p className="text-slate-500">Pending</p>
          <p className="font-semibold text-yellow-600">{formatRupiah(milestone.pendingAmount)}</p>
        </div>
        <div>
          <p className="text-slate-500">Jumlah Pembayaran</p>
          <p className="font-semibold text-slate-900">{milestone.paymentCount} transaksi</p>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Progress Pembayaran</span>
          <span>{milestone.percentage}%</span>
        </div>
        <Progress 
          value={milestone.percentage} 
          className="h-2"
        />
      </div>
      
      {milestone.dueDate && (
        <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500">
          <Calendar className="h-3 w-3" />
          <span>Tenggat: {milestone.dueDate}</span>
          {milestone.completedAt && (
            <>
              <span className="mx-1">•</span>
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-green-600">Selesai: {milestone.completedAt}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Project collapsible section with milestones
function ProjectBreakdownSection({ project }: { project: ProjectMilestoneBreakdown }) {
  const [isOpen, setIsOpen] = useState(false);
  const projectStatus = getProjectStatusInfo(project.projectStatus);
  const hasMilestones = project.milestones.length > 0;
  
  // Calculate overall project progress
  const projectProgress = project.totalMilestoneBudget > 0 
    ? Math.round((project.totalMilestonePaid / project.totalMilestoneBudget) * 100) 
    : 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <Milestone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {project.projectTitle}
                    <span className={`w-2 h-2 rounded-full ${projectStatus.color}`} title={projectStatus.label} />
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <span>{hasMilestones ? `${project.milestones.length} milestone` : 'Belum ada milestone'}</span>
                    <span>•</span>
                    <span>Anggaran: {formatRupiah(project.totalMilestoneBudget)}</span>
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-slate-500">Dibayar</p>
                    <p className="font-semibold text-green-600">{formatRupiah(project.totalMilestonePaid)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500">Pending</p>
                    <p className="font-semibold text-yellow-600">{formatRupiah(project.totalMilestonePending)}</p>
                  </div>
                  <div className="w-24">
                    <p className="text-slate-500 text-xs mb-1">Progress</p>
                    <Progress value={projectProgress} className="h-2" />
                    <p className="text-xs text-slate-500 mt-1 text-right">{projectProgress}%</p>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 border-t">
            {hasMilestones ? (
              <div className="space-y-3 pt-4">
                {project.milestones
                  .sort((a, b) => a.order - b.order)
                  .map((milestone, index) => (
                    <MilestoneItem key={milestone.id} milestone={milestone} index={index} />
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-slate-500">Belum ada milestone untuk proyek ini</p>
                <p className="text-sm text-slate-400 mt-1">Tambahkan milestone untuk melacak progress pembayaran</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function OwnerPaymentsTab({ 
  ownerStats, 
  paymentSummary, 
  spendingCategoryData,
  budgetAlerts: externalAlerts,
  alertThresholds,
  onAlertThresholdsChange,
  milestoneBreakdown,
}: OwnerPaymentsTabProps) {
  const projects = ownerStats?.projects ?? [];
  const payments = projects.flatMap(p => 
    (p.milestones || []).flatMap(m => 
      (m.payments || []).map(pay => ({
        ...pay,
        projectName: p.title,
        milestoneTitle: m.title,
      }))
    )
  );

  // Prepare data for charts
  const hasSpendingData = spendingCategoryData && spendingCategoryData.length > 0;
  const totalSpent = hasSpendingData 
    ? spendingCategoryData.reduce((sum, item) => sum + item.spent, 0) 
    : 0;
  const totalBudget = hasSpendingData 
    ? spendingCategoryData.reduce((sum, item) => sum + item.budget, 0) 
    : 0;

  // Calculate budget alerts from spending data
  const calculatedAlerts = useMemo(() => {
    if (externalAlerts) return externalAlerts;
    if (!hasSpendingData) return [];
    
    // Use default thresholds (75%, 90%, 100%)
    const defaultThresholds: BudgetAlertThresholds = {
      warning: 75,
      critical: 90,
      exceeded: 100,
    };
    
    return calculateBudgetAlerts(
      spendingCategoryData.map(item => ({
        name: item.name,
        budget: item.budget,
        spent: item.spent,
      })),
      alertThresholds || defaultThresholds,
      'category'
    );
  }, [externalAlerts, hasSpendingData, spendingCategoryData, alertThresholds]);

  // Prepare pie chart data with percentages
  const pieData = hasSpendingData 
    ? spendingCategoryData.map((item, index) => ({
        name: item.name,
        value: totalSpent > 0 ? Math.round((item.spent / totalSpent) * 100) : 0,
        spent: item.spent,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }))
    : [];

  // Check if milestone breakdown data is available
  const hasMilestoneBreakdown = milestoneBreakdown && milestoneBreakdown.length > 0;

  // Prepare budget summary data for export
  const budgetSummaryData: BudgetSummaryItem[] = useMemo(() => {
    if (!hasSpendingData) return [];
    return spendingCategoryData.map(item => ({
      name: item.name,
      budget: item.budget,
      spent: item.spent,
      remaining: item.budget - item.spent,
      percentage: item.budget > 0 ? Math.round((item.spent / item.budget) * 100) : 0,
    }));
  }, [hasSpendingData, spendingCategoryData]);

  // Prepare payment history data for export
  const paymentHistoryData: PaymentHistoryItem[] = useMemo(() => {
    return payments.map(payment => ({
      date: payment.paidAt ? new Date(payment.paidAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      projectName: payment.projectName,
      milestoneTitle: payment.milestoneTitle,
      amount: payment.amount,
      method: payment.method || 'BANK_TRANSFER',
      status: payment.status,
    }));
  }, [payments]);

  // Prepare milestone breakdown data for export
  const milestoneExportData: MilestoneExportItem[] = useMemo(() => {
    if (!hasMilestoneBreakdown) return [];
    return milestoneBreakdown.flatMap(project => 
      project.milestones.map(milestone => ({
        projectTitle: project.projectTitle,
        milestoneTitle: milestone.title,
        budget: milestone.amount,
        paid: milestone.paidAmount,
        pending: milestone.pendingAmount,
        status: milestone.status,
        targetDate: milestone.dueDate || '',
      }))
    );
  }, [hasMilestoneBreakdown, milestoneBreakdown]);

  // Export handlers
  const handleExportBudgetSummary = () => {
    if (!hasDataToExport(budgetSummaryData)) {
      toast.error('Tidak ada data anggaran untuk diekspor');
      return;
    }
    toast.success('Mengekspor ringkasan anggaran...');
    exportBudgetSummary(budgetSummaryData);
  };

  const handleExportPaymentHistory = () => {
    if (!hasDataToExport(paymentHistoryData)) {
      toast.error('Tidak ada riwayat pembayaran untuk diekspor');
      return;
    }
    toast.success('Mengekspor riwayat pembayaran...');
    exportPaymentHistory(paymentHistoryData);
  };

  const handleExportMilestoneBreakdown = () => {
    if (!hasDataToExport(milestoneExportData)) {
      toast.error('Tidak ada data milestone untuk diekspor');
      return;
    }
    toast.success('Mengekspor rincian milestone...');
    exportMilestoneBreakdown(milestoneExportData);
  };

  return (
    <div className="space-y-6">
      {/* Budget Alerts Section */}
      {calculatedAlerts.length > 0 && (
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="p-4">
            <BudgetAlert 
              alerts={calculatedAlerts}
              thresholds={alertThresholds}
              onThresholdsChange={onAlertThresholdsChange}
              showSettings={true}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Payment Summary Cards */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Ringkasan Pembayaran</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" /> Export Data
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Pilih Data untuk Export</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleExportBudgetSummary} 
              disabled={!hasDataToExport(budgetSummaryData)}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Ringkasan Anggaran (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleExportPaymentHistory} 
              disabled={!hasDataToExport(paymentHistoryData)}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Riwayat Pembayaran (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleExportMilestoneBreakdown} 
              disabled={!hasDataToExport(milestoneExportData)}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Rincian Milestone (CSV)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Anggaran</p>
                <p className="text-2xl font-bold">{formatRupiah(paymentSummary?.totalBudget || 0)}</p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Sudah Dibayar</p>
                <p className="text-2xl font-bold text-green-600">{formatRupiah(paymentSummary?.totalPaid || 0)}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Menunggu Pembayaran</p>
                <p className="text-2xl font-bold text-yellow-600">{formatRupiah(paymentSummary?.totalPending || 0)}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Sisa Anggaran</p>
                <p className="text-2xl font-bold text-blue-600">{formatRupiah(paymentSummary?.remainingBudget || 0)}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget by Phase Section */}
      {hasMilestoneBreakdown && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Milestone className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Anggaran per Fase Proyek</CardTitle>
            </div>
            <CardDescription>
              Rincian anggaran dan pembayaran berdasarkan milestone proyek
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {milestoneBreakdown.map((project) => (
              <ProjectBreakdownSection key={project.projectId} project={project} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Spend Analytics Charts */}
      {hasSpendingData && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Spending Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                Distribusi Pengeluaran per Kategori
              </CardTitle>
              <CardDescription>Persentase pengeluaran berdasarkan kategori proyek</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value, name, props) => (
                      <div className="flex flex-col gap-1">
                        <span>{name}: {value}%</span>
                        <span className="text-xs text-muted-foreground">
                          {formatRupiah(props.payload.spent)}
                        </span>
                      </div>
                    )}
                  />
                </PieChart>
              </ChartContainer>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 justify-center">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.fill }}
                    />
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Spending vs Budget Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Anggaran vs Realisasi per Kategori
              </CardTitle>
              <CardDescription>Perbandingan anggaran dan pengeluaran per kategori</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64">
                <BarChart data={spendingCategoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(value) => `${(value / 1000000).toFixed(0)} jt`} />
                  <YAxis dataKey="name" type="category" width={100} tickLine={false} axisLine={false} />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value) => formatRupiah(value as number)}
                  />
                  <Bar dataKey="budget" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} name="Anggaran" />
                  <Bar dataKey="spent" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Terpakai" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Spending Breakdown Table */}
      {hasSpendingData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rincian Pengeluaran per Kategori</CardTitle>
            <CardDescription>Detail anggaran dan realisasi pengeluaran</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Kategori</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-500">Anggaran</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-500">Terpakai</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-500">Sisa</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {spendingCategoryData.map((item, index) => {
                    const remaining = item.budget - item.spent;
                    const percentage = item.budget > 0 ? (item.spent / item.budget) * 100 : 0;
                    return (
                      <tr key={index} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">{formatRupiah(item.budget)}</td>
                        <td className="text-right py-3 px-4 text-primary font-medium">{formatRupiah(item.spent)}</td>
                        <td className={`text-right py-3 px-4 ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatRupiah(remaining)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Progress value={Math.min(percentage, 100)} className="h-2 flex-1" />
                            <span className="text-sm text-slate-500 w-12 text-right">
                              {Math.round(percentage)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Total Row */}
                  <tr className="bg-slate-50 font-medium">
                    <td className="py-3 px-4">Total</td>
                    <td className="text-right py-3 px-4">{formatRupiah(totalBudget)}</td>
                    <td className="text-right py-3 px-4 text-primary">{formatRupiah(totalSpent)}</td>
                    <td className={`text-right py-3 px-4 ${totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatRupiah(totalBudget - totalSpent)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0} 
                          className="h-2 flex-1" 
                        />
                        <span className="text-sm text-slate-500 w-12 text-right">
                          {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Progress */}
      {paymentSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progress Pembayaran</CardTitle>
            <CardDescription>Status pembayaran keseluruhan proyek</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress Pembayaran</span>
                  <span>{paymentSummary.totalBudget > 0 ? Math.round((paymentSummary.totalPaid / paymentSummary.totalBudget) * 100) : 0}%</span>
                </div>
                <Progress value={paymentSummary.totalBudget > 0 ? (paymentSummary.totalPaid / paymentSummary.totalBudget) * 100 : 0} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Riwayat Pembayaran</CardTitle>
              <CardDescription>Daftar semua transaksi pembayaran</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={payments.length === 0}>
                  <Download className="h-4 w-4 mr-2" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Data</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportPaymentHistory}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Riwayat Pembayaran
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportBudgetSummary} disabled={!hasDataToExport(budgetSummaryData)}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Ringkasan Anggaran
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportMilestoneBreakdown} disabled={!hasDataToExport(milestoneExportData)}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Rincian Milestone
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Belum ada riwayat pembayaran</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payment.status === 'PAID' ? 'bg-green-100' : payment.status === 'PENDING' ? 'bg-yellow-100' : 'bg-slate-100'}`}>
                      {payment.status === 'PAID' ? (
                        <ArrowUpRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{payment.milestoneTitle}</p>
                      <p className="text-sm text-slate-500">{payment.projectName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatRupiah(payment.amount)}</p>
                    <Badge variant={payment.status === 'PAID' ? 'default' : 'secondary'}>
                      {payment.status === 'PAID' ? 'Dibayar' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
