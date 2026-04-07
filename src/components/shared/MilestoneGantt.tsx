'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui';
import { CheckCircle, Clock, AlertCircle, XCircle, ZoomIn, ZoomOut, Calendar, BarChart3, GanttChart, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '@/lib/helpers';

export interface MilestoneGanttItem {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'OVERDUE';
  progress?: number;
  description?: string;
  amount?: number;
}

interface MilestoneGanttProps {
  milestones: MilestoneGanttItem[];
  title?: string;
}

// Enhanced status colors with gradient support
const statusConfig: Record<string, {
  bg: string;
  text: string;
  border: string;
  barGradient: string;
  barShadow: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
}> = {
  COMPLETED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    barGradient: 'from-emerald-400 to-green-500',
    barShadow: 'shadow-emerald-300/40',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  IN_PROGRESS: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    barGradient: 'from-amber-400 to-yellow-500',
    barShadow: 'shadow-amber-300/40',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    dotColor: 'bg-amber-500',
  },
  PENDING: {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    barGradient: 'from-slate-400 to-slate-500',
    barShadow: 'shadow-slate-300/30',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
    dotColor: 'bg-slate-400',
  },
  OVERDUE: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    barGradient: 'from-red-400 to-rose-500',
    barShadow: 'shadow-red-300/40',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
    dotColor: 'bg-red-500',
  },
};

const statusLabels: Record<string, string> = {
  COMPLETED: 'Selesai',
  IN_PROGRESS: 'Berjalan',
  PENDING: 'Menunggu',
  OVERDUE: 'Terlambat',
};

const statusIcons: Record<string, typeof CheckCircle> = {
  COMPLETED: CheckCircle,
  IN_PROGRESS: Clock,
  PENDING: AlertCircle,
  OVERDUE: XCircle,
};

// Month names in Indonesian
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function getDaysDiff(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

// Format date with month/year for headers
function formatMonthYear(date: Date): string {
  return `${monthShort[date.getMonth()]} ${date.getFullYear()}`;
}

function formatMonthYearFull(date: Date): string {
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

// Empty state component with illustration
function GanttEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-6"
    >
      {/* Illustration */}
      <div className="relative mb-6">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center"
        >
          <GanttChart className="h-10 w-10 text-slate-300" />
        </motion.div>
        {/* Decorative dots */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-amber-200"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-emerald-200"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
          className="absolute top-1 -left-5 w-2 h-2 rounded-full bg-teal-200"
        />
      </div>

      <h3 className="text-lg font-semibold text-slate-700 mb-2">Belum Ada Milestone</h3>
      <p className="text-sm text-slate-400 text-center max-w-xs leading-relaxed">
        Timeline milestone akan muncul setelah Anda menambahkan milestone pada proyek ini.
      </p>

      {/* Mini mockup bars */}
      <div className="mt-8 w-full max-w-xs space-y-2 opacity-30">
        <div className="h-3 rounded-full bg-gradient-to-r from-emerald-200 to-emerald-300 w-full" />
        <div className="h-3 rounded-full bg-gradient-to-r from-amber-200 to-amber-300 w-3/4" />
        <div className="h-3 rounded-full bg-gradient-to-r from-slate-200 to-slate-300 w-1/2" />
      </div>
    </motion.div>
  );
}

// Enhanced tooltip for milestones
function MilestoneTooltip({ milestone, barStyle, isVisible }: { milestone: any; barStyle: { left: string; width: string }; isVisible: boolean }) {
  if (!isVisible) return null;

  const cfg = statusConfig[milestone.status];
  const Icon = statusIcons[milestone.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute z-30 bg-slate-900 text-white rounded-xl p-4 shadow-2xl min-w-[220px] pointer-events-none"
      style={{
        left: barStyle.left,
        top: 'calc(100% + 8px)',
        transform: `translateX(min(0, calc(-${barStyle.left} + 50%)))`,
      }}
    >
      {/* Arrow */}
      <div className="absolute -top-1.5 left-6 w-3 h-3 bg-slate-900 rotate-45 rounded-sm" />

      <div className="flex items-center gap-2 mb-2.5">
        <Icon className="h-4 w-4 text-white/70" />
        <span className="font-bold text-sm">{milestone.title}</span>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Status</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
            {statusLabels[milestone.status]}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Mulai</span>
          <span>{formatDate(milestone.startDate)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Selesai</span>
          <span>{formatDate(milestone.endDate)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Durasi</span>
          <span className="font-medium">{milestone.duration} hari</span>
        </div>
        {milestone.progress !== undefined && (
          <>
            <div className="border-t border-white/10 my-1.5" />
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400">Progress</span>
              <span className="font-bold text-white">{milestone.progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${milestone.progress}%` }}
                transition={{ duration: 0.4 }}
                className={`h-full rounded-full bg-gradient-to-r ${cfg.barGradient}`}
              />
            </div>
          </>
        )}
        {milestone.amount !== undefined && milestone.amount > 0 && (
          <>
            <div className="border-t border-white/10 my-1.5" />
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Anggaran</span>
              <span className="font-bold text-emerald-400">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(milestone.amount)}
              </span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

export function MilestoneGantt({ milestones, title = 'Timeline Milestone' }: MilestoneGanttProps) {
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('monthly');
  const [hoveredMilestone, setHoveredMilestone] = useState<string | null>(null);

  const processedMilestones = useMemo(() => {
    if (!milestones || milestones.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return milestones.map((m) => {
      const start = new Date(m.startDate);
      const end = new Date(m.endDate);
      let status = m.status;

      if (status === 'PENDING' || status === 'IN_PROGRESS') {
        if (end < today) {
          status = 'OVERDUE';
        }
      }

      return {
        ...m,
        status,
        start,
        end,
        duration: getDaysDiff(m.startDate, m.endDate),
      };
    }).sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [milestones]);

  // Calculate timeline range
  const timelineRange = useMemo(() => {
    if (processedMilestones.length === 0) return null;

    const allDates = processedMilestones.flatMap((m) => [m.start, m.end]);
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);

    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

    return { minDate, maxDate, totalDays };
  }, [processedMilestones]);

  // Generate timeline columns based on view mode
  const timelineColumns = useMemo(() => {
    if (!timelineRange) return [];

    const columns: Array<{ date: Date; label: string; fullLabel: string; isToday?: boolean }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (viewMode === 'monthly') {
      const current = new Date(timelineRange.minDate);
      current.setDate(1);
      while (current <= timelineRange.maxDate) {
        const isCurrentMonth = current.getMonth() === today.getMonth() && current.getFullYear() === today.getFullYear();
        columns.push({
          date: new Date(current),
          label: formatMonthYear(current),
          fullLabel: formatMonthYearFull(current),
          isToday: isCurrentMonth,
        });
        current.setMonth(current.getMonth() + 1);
      }
    } else {
      const current = new Date(timelineRange.minDate);
      current.setDate(current.getDate() - current.getDay());
      while (current <= timelineRange.maxDate) {
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const isThisWeek = today >= current && today <= weekEnd;
        const day = current.getDate();
        const month = current.getMonth();
        columns.push({
          date: new Date(current),
          label: `${day}/${month + 1}`,
          fullLabel: `${day} ${monthShort[month]} ${current.getFullYear()}`,
          isToday: isThisWeek,
        });
        current.setDate(current.getDate() + 7);
      }
    }

    return columns;
  }, [timelineRange, viewMode]);

  // Get bar position (left % and width %)
  const getBarStyle = (milestone: (typeof processedMilestones)[0]) => {
    if (!timelineRange || timelineColumns.length === 0) return { left: '0%', width: '0%' };

    const totalMs = timelineRange.maxDate.getTime() - timelineRange.minDate.getTime();
    const left = ((milestone.start.getTime() - timelineRange.minDate.getTime()) / totalMs) * 100;
    const width = Math.max(((milestone.end.getTime() - milestone.start.getTime()) / totalMs) * 100, 1.5);

    return { left: `${Math.max(left, 0)}%`, width: `${Math.min(width, 100 - left)}%` };
  };

  // Get today marker position
  const todayPosition = useMemo(() => {
    if (!timelineRange) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalMs = timelineRange.maxDate.getTime() - timelineRange.minDate.getTime();
    const position = ((today.getTime() - timelineRange.minDate.getTime()) / totalMs) * 100;
    if (position < 0 || position > 100) return null;
    return `${position}%`;
  }, [timelineRange]);

  // Empty state
  if (!milestones || milestones.length === 0) {
    return (
      <Card className="border-slate-200">
        <GanttEmptyState />
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-slate-200 overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-teal-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {/* Status Legend Badges */}
              <div className="flex items-center gap-1.5 mr-3 flex-wrap">
                {Object.entries(statusLabels).map(([key, label]) => {
                  const Icon = statusIcons[key];
                  const count = processedMilestones.filter((m) => m.status === key).length;
                  if (count === 0) return null;
                  return (
                    <Badge
                      key={key}
                      className={`${statusConfig[key].badgeBg} ${statusConfig[key].badgeText} border-0 text-xs gap-1`}
                    >
                      <Icon className="h-3 w-3" />
                      {label} ({count})
                    </Badge>
                  );
                })}
              </div>
              {/* View Mode Toggle */}
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'weekly' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 px-3 rounded-none border-0"
                  onClick={() => setViewMode('weekly')}
                >
                  <ZoomIn className="h-3.5 w-3.5 mr-1" /> Mingguan
                </Button>
                <Button
                  variant={viewMode === 'monthly' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 px-3 rounded-none border-0"
                  onClick={() => setViewMode('monthly')}
                >
                  <ZoomOut className="h-3.5 w-3.5 mr-1" /> Bulanan
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Responsive horizontal scroll wrapper */}
          <div className="overflow-x-auto custom-gantt-scroll">
            <div className="min-w-[700px]">
              {/* Timeline Header with enhanced date formatting */}
              <div className="flex border-b border-slate-200 bg-slate-50/50">
                <div className="w-56 flex-shrink-0 p-3 border-r border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Milestone</p>
                </div>
                <div className="flex-1 relative flex">
                  {timelineColumns.map((col, idx) => (
                    <TooltipProvider key={idx}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`flex-1 text-center py-3 text-xs border-r border-slate-100 last:border-r-0 cursor-default transition-colors duration-200 ${
                              col.isToday
                                ? 'bg-primary/5 font-bold text-primary border-b-2 border-b-primary'
                                : 'text-slate-500 hover:bg-slate-100/50'
                            }`}
                          >
                            <span className="block">{col.label}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          {col.fullLabel}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>

              {/* Milestone Rows */}
              <div className="relative">
                {processedMilestones.map((milestone, idx) => {
                  const barStyle = getBarStyle(milestone);
                  const cfg = statusConfig[milestone.status];
                  const Icon = statusIcons[milestone.status];
                  const isHovered = hoveredMilestone === milestone.id;

                  return (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06, duration: 0.3 }}
                      className={`flex border-b border-slate-100 last:border-b-0 transition-colors duration-200 ${
                        isHovered ? 'bg-slate-50/80' : 'hover:bg-slate-50/50'
                      }`}
                      onMouseEnter={() => setHoveredMilestone(milestone.id)}
                      onMouseLeave={() => setHoveredMilestone(null)}
                    >
                      {/* Milestone Label */}
                      <div className="w-56 flex-shrink-0 p-3 border-r border-slate-200">
                        <div className="flex items-start gap-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${cfg.badgeBg}`}>
                            <Icon className={`h-3 w-3 ${cfg.text}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{milestone.title}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {formatDate(milestone.startDate)} — {formatDate(milestone.endDate)}
                            </p>
                            {/* Mini progress bar under label */}
                            {milestone.progress !== undefined && (
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                                  <div
                                    className={`h-full rounded-full bg-gradient-to-r ${cfg.barGradient}`}
                                    style={{ width: `${milestone.progress}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-semibold text-slate-500">{milestone.progress}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bar Area */}
                      <div className="flex-1 relative py-3">
                        {/* Grid lines */}
                        {timelineColumns.map((col, colIdx) => (
                          <div
                            key={colIdx}
                            className={`absolute top-0 bottom-0 border-r border-slate-100/50 ${
                              col.isToday ? 'border-primary/20' : ''
                            }`}
                            style={{
                              left: `${(colIdx / timelineColumns.length) * 100}%`,
                              width: `${100 / timelineColumns.length}%`,
                            }}
                          />
                        ))}

                        {/* Today Marker - Dashed vertical line */}
                        {todayPosition && (
                          <div
                            className="absolute top-0 bottom-0 z-10 pointer-events-none"
                            style={{ left: todayPosition }}
                          >
                            {/* Dashed line */}
                            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-px w-[2px]"
                              style={{
                                backgroundImage: 'repeating-linear-gradient(to bottom, #ef4444 0, #ef4444 6px, transparent 6px, transparent 10px)',
                              }}
                            />
                            {/* Label */}
                            <div className="absolute -top-0 -left-7 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-b-md font-semibold shadow-sm">
                              Hari ini
                            </div>
                            {/* Triangle */}
                            <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-red-500" />
                          </div>
                        )}

                        {/* Milestone Bar with Gradient Fill */}
                        <div className="absolute top-1/2 -translate-y-1/2 z-5" style={{ ...barStyle }}>
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: idx * 0.06 + 0.2, duration: 0.5, ease: 'easeOut' }}
                            style={{ transformOrigin: 'left' }}
                            className={`relative h-8 rounded-lg bg-gradient-to-r ${cfg.barGradient} shadow-md ${cfg.barShadow} cursor-pointer transition-all duration-200 ${
                              isHovered ? 'shadow-lg brightness-110 scale-y-110' : 'opacity-85'
                            }`}
                          >
                            {/* Progress fill overlay */}
                            {milestone.progress !== undefined && milestone.progress > 0 && milestone.status !== 'COMPLETED' && (
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${milestone.progress}%` }}
                                transition={{ delay: idx * 0.06 + 0.5, duration: 0.6 }}
                                className="absolute inset-y-0 left-0 bg-white/20 rounded-l-lg"
                              />
                            )}

                            {/* Content inside bar */}
                            <div className="relative flex items-center justify-center h-full px-2 gap-1.5">
                              {/* Duration and progress text */}
                              <span className="text-[10px] font-bold text-white drop-shadow-sm truncate">
                                {milestone.duration}h
                              </span>
                              {milestone.progress !== undefined && barStyle.width !== '0%' && (
                                <>
                                  <span className="text-[9px] text-white/70">•</span>
                                  <span className="text-[10px] font-semibold text-white drop-shadow-sm">
                                    {milestone.progress}%
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Completed checkmark */}
                            {milestone.status === 'COMPLETED' && (
                              <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                                <CheckCircle className="h-4 w-4 text-white/80" />
                              </div>
                            )}
                          </motion.div>
                        </div>

                        {/* Enhanced Tooltip */}
                        <AnimatePresence>
                          {isHovered && (
                            <MilestoneTooltip
                              milestone={milestone}
                              barStyle={barStyle}
                              isVisible={true}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Legend bar at bottom */}
              <div className="flex items-center gap-4 px-4 py-3 border-t border-slate-100 bg-slate-50/30 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gradient-to-r from-emerald-400 to-green-500" />
                  <span>Selesai</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gradient-to-r from-amber-400 to-yellow-500" />
                  <span>Berjalan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gradient-to-r from-slate-400 to-slate-500" />
                  <span>Menunggu</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gradient-to-r from-red-400 to-rose-500" />
                  <span>Terlambat</span>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  <span>Arahkan kursor ke bar untuk detail</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom scrollbar style */}
      <style jsx global>{`
        .custom-gantt-scroll::-webkit-scrollbar {
          height: 6px;
        }
        .custom-gantt-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-gantt-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-gantt-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </motion.div>
  );
}
