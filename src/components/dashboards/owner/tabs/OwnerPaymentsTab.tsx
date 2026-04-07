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
  ChevronDown, ChevronUp, Milestone, Calendar, CheckCircle, Clock, AlertCircle, FileSpreadsheet,
  Wallet, Hourglass, CreditCard, CircleCheck, XCircle, Eye,
  Building2, User, ArrowRightLeft
} from 'lucide-react';
import { formatRupiah } from '@/lib/helpers';
import { motion, AnimatePresence } from 'framer-motion';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

// Enhanced payment status configuration with gradient support
const paymentStatusConfig: Record<string, {
  label: string;
  gradient: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  timelineColor: string;
  icon: typeof Clock;
  amountColor: string;
}> = {
  PENDING: {
    label: 'Menunggu',
    gradient: 'from-amber-400 to-yellow-500',
    badgeBg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-300/60',
    dotColor: 'bg-amber-400',
    timelineColor: 'border-amber-300',
    icon: Hourglass,
    amountColor: 'text-amber-700',
  },
  PROCESSING: {
    label: 'Diproses',
    gradient: 'from-blue-400 to-sky-500',
    badgeBg: 'bg-gradient-to-r from-blue-50 to-sky-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-300/60',
    dotColor: 'bg-blue-400',
    timelineColor: 'border-blue-300',
    icon: Clock,
    amountColor: 'text-blue-700',
  },
  PAID: {
    label: 'Dibayar',
    gradient: 'from-emerald-400 to-green-500',
    badgeBg: 'bg-gradient-to-r from-emerald-50 to-green-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-300/60',
    dotColor: 'bg-emerald-400',
    timelineColor: 'border-emerald-300',
    icon: CircleCheck,
    amountColor: 'text-emerald-600',
  },
  CONFIRMED: {
    label: 'Dikonfirmasi',
    gradient: 'from-teal-400 to-cyan-500',
    badgeBg: 'bg-gradient-to-r from-teal-50 to-cyan-50',
    badgeText: 'text-teal-700',
    badgeBorder: 'border-teal-300/60',
    dotColor: 'bg-teal-400',
    timelineColor: 'border-teal-300',
    icon: CheckCircle,
    amountColor: 'text-teal-600',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    gradient: 'from-red-400 to-rose-500',
    badgeBg: 'bg-gradient-to-r from-red-50 to-rose-50',
    badgeText: 'text-red-700',
    badgeBorder: 'border-red-300/60',
    dotColor: 'bg-red-400',
    timelineColor: 'border-red-300',
    icon: XCircle,
    amountColor: 'text-red-500 line-through',
  },
  FAILED: {
    label: 'Gagal',
    gradient: 'from-red-400 to-rose-500',
    badgeBg: 'bg-gradient-to-r from-red-50 to-rose-50',
    badgeText: 'text-red-700',
    badgeBorder: 'border-red-300/60',
    dotColor: 'bg-red-400',
    timelineColor: 'border-red-300',
    icon: XCircle,
    amountColor: 'text-red-500 line-through',
  },
};

// Filter pill configuration with gradient active states
const filterPills: { key: string; label: string; activeGradient: string; activeShadow: string; dotColor: string }[] = [
  { key: 'ALL', label: 'Semua', activeGradient: 'from-slate-700 to-slate-800', activeShadow: 'shadow-slate-400/30', dotColor: '' },
  { key: 'PENDING', label: 'Menunggu', activeGradient: 'from-amber-500 to-yellow-500', activeShadow: 'shadow-amber-400/30', dotColor: 'bg-amber-400' },
  { key: 'PROCESSING', label: 'Diproses', activeGradient: 'from-blue-500 to-sky-500', activeShadow: 'shadow-blue-400/30', dotColor: 'bg-blue-400' },
  { key: 'PAID', label: 'Dibayar', activeGradient: 'from-emerald-500 to-green-500', activeShadow: 'shadow-emerald-400/30', dotColor: 'bg-emerald-400' },
  { key: 'CANCELLED', label: 'Batal', activeGradient: 'from-red-500 to-rose-500', activeShadow: 'shadow-red-400/30', dotColor: 'bg-red-400' },
  { key: 'FAILED', label: 'Gagal', activeGradient: 'from-red-500 to-rose-500', activeShadow: 'shadow-red-400/30', dotColor: 'bg-red-400' },
];

type PaymentFilter = 'ALL' | 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'CONFIRMED';

// Helper: get amount color based on size (large = green)
function getAmountColor(amount: number, status: string): string {
  const cfg = paymentStatusConfig[status];
  if (cfg && (status === 'CANCELLED' || status === 'FAILED')) return cfg.amountColor;
  if (amount >= 100_000_000) return 'text-emerald-600'; // >= 100jt
  if (amount >= 50_000_000) return 'text-teal-700';   // >= 50jt
  return 'text-slate-900';
}

function getAmountSize(amount: number): string {
  if (amount >= 100_000_000) return 'text-lg';
  return 'text-base';
}

// Get status color and icon for milestone status
function getMilestoneStatusInfo(status: string) {
  switch (status) {
    case 'COMPLETED':
      return { 
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200', 
        icon: CheckCircle,
        label: 'Selesai' 
      };
    case 'IN_PROGRESS':
      return { 
        color: 'bg-teal-100 text-teal-700 border-teal-200', 
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
      return { color: 'bg-emerald-500', label: 'Selesai' };
    case 'IN_PROGRESS':
      return { color: 'bg-teal-500', label: 'Berjalan' };
    case 'OPEN':
      return { color: 'bg-amber-500', label: 'Terbuka' };
    case 'CANCELLED':
      return { color: 'bg-red-500', label: 'Dibatalkan' };
    default:
      return { color: 'bg-slate-500', label: 'Draft' };
  }
}

// Generate avatar initials
function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

// Generate avatar color from name
function getAvatarColor(name: string): string {
  const colors = [
    'from-emerald-400 to-teal-500',
    'from-teal-400 to-cyan-500',
    'from-amber-400 to-orange-500',
    'from-rose-400 to-pink-500',
    'from-violet-400 to-purple-500',
    'from-sky-400 to-blue-500',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

// Single milestone item component
function MilestoneItem({ milestone, index }: { milestone: MilestoneBreakdownItem; index: number }) {
  const statusInfo = getMilestoneStatusInfo(milestone.status);
  const StatusIcon = statusInfo.icon;
  
  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
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
          <p className="font-semibold text-emerald-600">{formatRupiah(milestone.paidAmount)}</p>
        </div>
        <div>
          <p className="text-slate-500">Pending</p>
          <p className="font-semibold text-amber-600">{formatRupiah(milestone.pendingAmount)}</p>
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
        <Progress value={milestone.percentage} className="h-2" />
      </div>
      
      {milestone.dueDate && (
        <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500">
          <Calendar className="h-3 w-3" />
          <span>Tenggat: {milestone.dueDate}</span>
          {milestone.completedAt && (
            <>
              <span className="mx-1">•</span>
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-600">Selesai: {milestone.completedAt}</span>
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
  const projectProgress = project.totalMilestoneBudget > 0 
    ? Math.round((project.totalMilestonePaid / project.totalMilestoneBudget) * 100) 
    : 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow duration-200">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-teal-500/10">
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
                    <p className="font-semibold text-emerald-600">{formatRupiah(project.totalMilestonePaid)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500">Pending</p>
                    <p className="font-semibold text-amber-600">{formatRupiah(project.totalMilestonePending)}</p>
                  </div>
                  <div className="w-24">
                    <p className="text-slate-500 text-xs mb-1">Progress</p>
                    <Progress value={projectProgress} className="h-2" />
                    <p className="text-xs text-slate-500 mt-1 text-right">{projectProgress}%</p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                </motion.div>
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
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <AlertCircle className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">Belum ada milestone untuk proyek ini</p>
                <p className="text-sm text-slate-400 mt-1">Tambahkan milestone untuk melacak progress pembayaran</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// Payment Timeline Item with vertical dot-and-line connector
function PaymentTimelineItem({ payment, index, isLast }: { payment: any; index: number; isLast: boolean }) {
  const status = payment.status || 'PENDING';
  const statusCfg = paymentStatusConfig[status] || paymentStatusConfig.PENDING;
  const StatusIcon = statusCfg.icon;
  const amountColor = getAmountColor(payment.amount, status);
  const amountSize = getAmountSize(payment.amount);
  const avatarGradient = getAvatarColor(payment.contractorName || 'Kontraktor');

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: 'easeOut' }}
      className="relative flex gap-4 group"
    >
      {/* Vertical Timeline Connector */}
      <div className="flex flex-col items-center shrink-0">
        {/* Dot */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.05 + 0.1, type: 'spring', stiffness: 300 }}
          className={`relative z-10 w-10 h-10 rounded-full bg-gradient-to-br ${statusCfg.gradient} flex items-center justify-center shadow-lg shadow-slate-200 ring-4 ring-white`}
        >
          <StatusIcon className="h-4 w-4 text-white" />
          {/* Pulse ring for pending */}
          {status === 'PENDING' && (
            <motion.div
              animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              className={`absolute inset-0 rounded-full ${statusCfg.dotColor}`}
            />
          )}
        </motion.div>
        {/* Line */}
        {!isLast && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: index * 0.05 + 0.2, duration: 0.4 }}
            className={`w-0.5 flex-1 min-h-[20px] ${statusCfg.timelineColor} bg-gradient-to-b from-current to-slate-200`}
            style={{ transformOrigin: 'top' }}
          />
        )}
      </div>

      {/* Content Card */}
      <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
        <motion.div
          whileHover={{ y: -2, boxShadow: '0 8px 25px -5px rgba(0,0,0,0.08)' }}
          className="border border-slate-200 rounded-xl p-4 bg-white transition-all duration-200 hover:border-slate-300 group-hover:shadow-sm"
        >
          {/* Top row: milestone + status badge */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-slate-900 text-sm truncate">{payment.milestoneTitle}</h4>
              {/* Milestone association */}
              <div className="flex items-center gap-1.5 mt-1">
                <Milestone className="h-3 w-3 text-slate-400" />
                <span className="text-xs text-slate-400">{payment.projectName}</span>
              </div>
            </div>
            {/* Status Badge with gradient */}
            <Badge
              variant="outline"
              className={`shrink-0 text-[10px] px-2.5 py-0.5 font-semibold ${statusCfg.badgeBg} ${statusCfg.badgeText} ${statusCfg.badgeBorder}`}
            >
              <StatusIcon className="h-3 w-3 mr-0.5" />
              {statusCfg.label}
            </Badge>
          </div>

          {/* Middle row: Contractor info + Amount */}
          <div className="flex items-center justify-between gap-3">
            {/* Contractor info with avatar */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center shrink-0 shadow-sm`}>
                <span className="text-[10px] font-bold text-white">
                  {payment.contractorAvatar ? '' : getInitials(payment.contractorName || 'K')}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                  <p className="text-xs font-medium text-slate-600 truncate">{payment.contractorName || 'Kontraktor'}</p>
                </div>
                {payment.paidAt && (
                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    {new Date(payment.paidAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Amount with color coding */}
            <div className="text-right shrink-0">
              <p className={`font-bold ${amountSize} ${amountColor}`}>
                {formatRupiah(payment.amount)}
              </p>
              {payment.amount >= 100_000_000 && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="inline-flex items-center gap-0.5 text-[9px] text-emerald-500 font-medium"
                >
                  <ArrowUpRight className="h-2.5 w-2.5" />
                  Jumlah besar
                </motion.span>
              )}
            </div>
          </div>

          {/* Bottom: Pay button for pending */}
          {status === 'PENDING' && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <Button
                size="sm"
                className="w-full h-8 text-xs bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-sm shadow-primary/20 transition-all duration-200 hover:shadow-md"
              >
                <CreditCard className="h-3 w-3 mr-1.5" /> Bayar Sekarang
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
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
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('ALL');

  const projects = ownerStats?.projects ?? [];
  const allPayments = projects.flatMap(p => 
    ((p.milestones || []) as Array<Record<string, any>>).flatMap(m => 
      ((m.payments || []) as Array<Record<string, any>>).map((pay: any) => ({
        ...pay,
        projectName: p.title,
        milestoneTitle: m.title,
        contractorName: m.contractorName || p.contractorName || 'Kontraktor',
        contractorAvatar: m.contractorAvatar || null,
      }))
    )
  );

  // Filter payments based on selected pill
  const filteredPayments = paymentFilter === 'ALL' 
    ? allPayments 
    : allPayments.filter((p: any) => p.status === paymentFilter);

  // Count payments per status
  const paymentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filterPills.forEach(pill => {
      if (pill.key !== 'ALL') counts[pill.key] = 0;
    });
    allPayments.forEach((p: any) => {
      const status = p.status as string;
      if (status in counts) counts[status]++;
      else counts['PENDING'] = (counts['PENDING'] || 0) + 1;
    });
    return counts;
  }, [allPayments]);

  const hasSpendingData = spendingCategoryData && spendingCategoryData.length > 0;
  const totalSpent = hasSpendingData ? spendingCategoryData.reduce((sum, item) => sum + item.spent, 0) : 0;
  const totalBudget = hasSpendingData ? spendingCategoryData.reduce((sum, item) => sum + item.budget, 0) : 0;

  const calculatedAlerts = useMemo(() => {
    if (externalAlerts) return externalAlerts;
    if (!hasSpendingData) return [];
    const defaultThresholds: BudgetAlertThresholds = { warning: 75, critical: 90, exceeded: 100 };
    return calculateBudgetAlerts(
      spendingCategoryData.map(item => ({ name: item.name, budget: item.budget, spent: item.spent })),
      alertThresholds || defaultThresholds,
      'category'
    );
  }, [externalAlerts, hasSpendingData, spendingCategoryData, alertThresholds]);

  const pieData = hasSpendingData 
    ? spendingCategoryData.map((item, index) => ({
        name: item.name,
        value: totalSpent > 0 ? Math.round((item.spent / totalSpent) * 100) : 0,
        spent: item.spent,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }))
    : [];

  const hasMilestoneBreakdown = milestoneBreakdown && milestoneBreakdown.length > 0;

  const budgetSummaryData: BudgetSummaryItem[] = useMemo(() => {
    if (!hasSpendingData) return [];
    return spendingCategoryData.map(item => ({
      name: item.name, budget: item.budget, spent: item.spent,
      remaining: item.budget - item.spent,
      percentage: item.budget > 0 ? Math.round((item.spent / item.budget) * 100) : 0,
    }));
  }, [hasSpendingData, spendingCategoryData]);

  const paymentHistoryData: PaymentHistoryItem[] = useMemo(() => {
    return allPayments.map((payment: any) => ({
      date: payment.paidAt ? new Date(payment.paidAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      projectName: payment.projectName,
      milestoneTitle: payment.milestoneTitle,
      amount: payment.amount,
      method: payment.method || 'BANK_TRANSFER',
      status: payment.status,
    }));
  }, [allPayments]);

  const milestoneExportData: MilestoneExportItem[] = useMemo(() => {
    if (!hasMilestoneBreakdown) return [];
    return milestoneBreakdown.flatMap(project => 
      project.milestones.map(milestone => ({
        projectTitle: project.projectTitle, milestoneTitle: milestone.title,
        budget: milestone.amount, paid: milestone.paidAmount, pending: milestone.pendingAmount,
        status: milestone.status, targetDate: milestone.dueDate || '',
      }))
    );
  }, [hasMilestoneBreakdown, milestoneBreakdown]);

  const handleExportBudgetSummary = () => {
    if (!hasDataToExport(budgetSummaryData)) { toast.error('Tidak ada data anggaran untuk diekspor'); return; }
    toast.success('Mengekspor ringkasan anggaran...');
    exportBudgetSummary(budgetSummaryData);
  };

  const handleExportPaymentHistory = () => {
    if (!hasDataToExport(paymentHistoryData)) { toast.error('Tidak ada riwayat pembayaran untuk diekspor'); return; }
    toast.success('Mengekspor riwayat pembayaran...');
    exportPaymentHistory(paymentHistoryData);
  };

  const handleExportMilestoneBreakdown = () => {
    if (!hasDataToExport(milestoneExportData)) { toast.error('Tidak ada data milestone untuk diekspor'); return; }
    toast.success('Mengekspor rincian milestone...');
    exportMilestoneBreakdown(milestoneExportData);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Budget Alerts Section */}
      {calculatedAlerts.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-slate-200 bg-slate-50">
            <CardContent className="p-4">
              <BudgetAlert alerts={calculatedAlerts} thresholds={alertThresholds} onThresholdsChange={onAlertThresholdsChange} showSettings={true} />
            </CardContent>
          </Card>
        </motion.div>
      )}
      
      {/* Enhanced Summary Stats Row */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Ringkasan Pembayaran</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50">
                <Download className="h-4 w-4 mr-2" /> Export Data
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Pilih Data untuk Export</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportBudgetSummary} disabled={!hasDataToExport(budgetSummaryData)}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Ringkasan Anggaran (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPaymentHistory} disabled={!hasDataToExport(paymentHistoryData)}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Riwayat Pembayaran (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportMilestoneBreakdown} disabled={!hasDataToExport(milestoneExportData)}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Rincian Milestone (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Total Pembayaran */}
          <motion.div whileHover={{ y: -3, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
            <Card className="border-slate-200 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Total Pembayaran</p>
                    <p className="text-2xl font-bold text-slate-900">{formatRupiah(paymentSummary?.totalBudget || 0)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-teal-500/10 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Menunggu Pembayaran */}
          <motion.div whileHover={{ y: -3, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600">Menunggu Pembayaran</p>
                    <p className="text-2xl font-bold text-amber-700">{formatRupiah(paymentSummary?.totalPending || 0)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
                    <Hourglass className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sudah Dibayar */}
          <motion.div whileHover={{ y: -3, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-green-50/50 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-600">Sudah Dibayar</p>
                    <p className="text-2xl font-bold text-emerald-700">{formatRupiah(paymentSummary?.totalPaid || 0)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                    <CircleCheck className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Budget by Phase Section */}
      {hasMilestoneBreakdown && (
        <motion.div variants={itemVariants}>
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-teal-500/10 flex items-center justify-center">
                  <Milestone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Anggaran per Fase Proyek</CardTitle>
                  <CardDescription>Rincian anggaran dan pembayaran berdasarkan milestone</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {milestoneBreakdown.map((project) => (
                <ProjectBreakdownSection key={project.projectId} project={project} />
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Spend Analytics Charts */}
      {hasSpendingData && (
        <motion.div variants={itemVariants}>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-teal-500/10 flex items-center justify-center">
                    <PieChartIcon className="h-4 w-4 text-primary" />
                  </div>
                  Distribusi Pengeluaran
                </CardTitle>
                <CardDescription>Persentase pengeluaran berdasarkan kategori</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} formatter={(value, name, props) => (
                      <div className="flex flex-col gap-1">
                        <span>{name}: {value}%</span>
                        <span className="text-xs text-muted-foreground">{formatRupiah(props.payload.spent)}</span>
                      </div>
                    )} />
                  </PieChart>
                </ChartContainer>
                <div className="flex flex-wrap gap-3 mt-4 justify-center">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  Anggaran vs Realisasi
                </CardTitle>
                <CardDescription>Perbandingan anggaran dan pengeluaran per kategori</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64">
                  <BarChart data={spendingCategoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(value) => `${(value / 1000000).toFixed(0)} jt`} />
                    <YAxis dataKey="name" type="category" width={100} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} formatter={(value) => formatRupiah(value as number)} />
                    <Bar dataKey="budget" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} name="Anggaran" />
                    <Bar dataKey="spent" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Terpakai" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Category Spending Breakdown Table */}
      {hasSpendingData && (
        <motion.div variants={itemVariants}>
          <Card className="border-slate-200">
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
                        <tr key={index} className="border-b hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4">{formatRupiah(item.budget)}</td>
                          <td className="text-right py-3 px-4 text-primary font-medium">{formatRupiah(item.spent)}</td>
                          <td className={`text-right py-3 px-4 ${remaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatRupiah(remaining)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Progress value={Math.min(percentage, 100)} className="h-2 flex-1" />
                              <span className="text-sm text-slate-500 w-12 text-right">{Math.round(percentage)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50 font-medium">
                      <td className="py-3 px-4">Total</td>
                      <td className="text-right py-3 px-4">{formatRupiah(totalBudget)}</td>
                      <td className="text-right py-3 px-4 text-primary">{formatRupiah(totalSpent)}</td>
                      <td className={`text-right py-3 px-4 ${totalBudget - totalSpent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatRupiah(totalBudget - totalSpent)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Progress value={totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0} className="h-2 flex-1" />
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
        </motion.div>
      )}

      {/* Payment Progress */}
      {paymentSummary && (
        <motion.div variants={itemVariants}>
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-teal-500/10 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                Progress Pembayaran
              </CardTitle>
              <CardDescription>Status pembayaran keseluruhan proyek</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Progress Keseluruhan</span>
                    <span className="text-primary font-bold">{paymentSummary.totalBudget > 0 ? Math.round((paymentSummary.totalPaid / paymentSummary.totalBudget) * 100) : 0}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${paymentSummary.totalBudget > 0 ? (paymentSummary.totalPaid / paymentSummary.totalBudget) * 100 : 0}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Payment History Timeline with Filter Pills */}
      <motion.div variants={itemVariants}>
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
                    <ArrowRightLeft className="h-4 w-4 text-amber-600" />
                  </div>
                  Riwayat Pembayaran
                </CardTitle>
                <CardDescription>Daftar semua transaksi pembayaran</CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={allPayments.length === 0} className="border-slate-200">
                    <Download className="h-4 w-4 mr-2" /> Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Export Data</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExportPaymentHistory}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Export Riwayat Pembayaran
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportBudgetSummary} disabled={!hasDataToExport(budgetSummaryData)}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Export Ringkasan Anggaran
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportMilestoneBreakdown} disabled={!hasDataToExport(milestoneExportData)}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Export Rincian Milestone
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Filter Pills with Gradient Active States */}
            {allPayments.length > 0 && (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
                {filterPills.map((pill) => {
                  const isActive = paymentFilter === pill.key;
                  const count = pill.key === 'ALL' 
                    ? allPayments.length 
                    : (paymentCounts[pill.key] || 0);
                  
                  return (
                    <motion.button
                      key={pill.key}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setPaymentFilter(pill.key as PaymentFilter)}
                      className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 border-0 ${
                        isActive
                          ? `bg-gradient-to-r ${pill.activeGradient} text-white shadow-lg ${pill.activeShadow}`
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {pill.dotColor && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white/80' : pill.dotColor}`} />
                      )}
                      {pill.label}
                      <span className={`min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-1 ${
                        isActive ? 'bg-white/25 text-white' : 'bg-white text-slate-500'
                      }`}>
                        {count}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}

            <AnimatePresence mode="wait">
              {allPayments.length === 0 ? (
                /* Empty State */
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-slate-600 font-semibold">Belum ada riwayat pembayaran</h3>
                  <p className="text-sm text-slate-400 mt-1.5 max-w-sm mx-auto">
                    Riwayat pembayaran akan muncul setelah Anda melakukan pembayaran untuk milestone proyek
                  </p>
                </motion.div>
              ) : filteredPayments.length === 0 ? (
                <motion.div
                  key="no-filter"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center py-12"
                >
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Eye className="h-7 w-7 text-slate-300" />
                  </div>
                  <h3 className="text-slate-600 font-semibold">Tidak ada pembayaran untuk filter ini</h3>
                  <p className="text-sm text-slate-400 mt-1">Coba pilih filter status lain</p>
                </motion.div>
              ) : (
                /* Payment Timeline */
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative max-h-[600px] overflow-y-auto pl-1 pr-1 custom-scrollbar"
                >
                  {filteredPayments.map((payment: any, idx: number) => (
                    <PaymentTimelineItem
                      key={payment.id}
                      payment={payment}
                      index={idx}
                      isLast={idx === filteredPayments.length - 1}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Custom scrollbar style */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.div>
  );
}
