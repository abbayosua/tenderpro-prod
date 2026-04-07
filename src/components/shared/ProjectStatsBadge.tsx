'use client';

import { motion } from 'framer-motion';
import { Clock, Users, Wallet } from 'lucide-react';
import { formatRupiah, getStatusColor, getStatusLabel } from '@/lib/helpers';

interface ProjectStatsBadgeProps {
  status: string;
  bidCount: number;
  budget: number;
  progress: number;
  daysRemaining?: number;
  compact?: boolean;
}

const STATUS_DOT_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-400',
  OPEN: 'bg-primary',
  IN_PROGRESS: 'bg-blue-500',
  COMPLETED: 'bg-green-500',
  CANCELLED: 'bg-red-400',
};

function getProgressColor(progress: number): string {
  if (progress >= 75) return 'bg-green-500';
  if (progress >= 50) return 'bg-blue-500';
  if (progress >= 25) return 'bg-amber-500';
  return 'bg-orange-500';
}

function getProgressTrackColor(progress: number): string {
  if (progress >= 75) return 'bg-green-100';
  if (progress >= 50) return 'bg-blue-100';
  if (progress >= 25) return 'bg-amber-100';
  return 'bg-orange-100';
}

export function ProjectStatsBadge({
  status,
  bidCount,
  budget,
  progress,
  daysRemaining,
  compact = false,
}: ProjectStatsBadgeProps) {
  const dotColor = STATUS_DOT_COLORS[status] || 'bg-slate-400';
  const isPulsing = status === 'OPEN' || status === 'IN_PROGRESS';
  const progressClamped = Math.min(100, Math.max(0, progress));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      {/* Status dot with pulse animation */}
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5">
          {isPulsing && (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dotColor} opacity-40`}
            />
          )}
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dotColor}`}
          />
        </span>
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${getStatusColor(status)}`}
        >
          {getStatusLabel(status)}
        </span>
      </div>

      {/* Divider */}
      <span className="h-3 w-px bg-slate-200" />

      {/* Bid count */}
      <div className="flex items-center gap-1 text-slate-500">
        <Users className={`h-3 w-3 ${compact ? '' : ''}`} />
        <span className={`font-medium text-slate-700 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
          {bidCount}
        </span>
      </div>

      {/* Divider */}
      <span className="h-3 w-px bg-slate-200" />

      {/* Budget */}
      <div className="flex items-center gap-1 text-slate-500">
        <Wallet className={`h-3 w-3`} />
        <span className={`font-medium text-slate-700 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
          {formatRupiah(budget)}
        </span>
      </div>

      {/* Divider */}
      <span className="h-3 w-px bg-slate-200" />

      {/* Progress mini bar */}
      <div className="flex items-center gap-1.5">
        <div
          className={`${compact ? 'w-12' : 'w-16'} h-1.5 rounded-full ${getProgressTrackColor(progressClamped)} overflow-hidden`}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressClamped}%` }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
            className={`h-full rounded-full ${getProgressColor(progressClamped)}`}
          />
        </div>
        <span className={`font-medium text-slate-600 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
          {progressClamped}%
        </span>
      </div>

      {/* Days remaining (if applicable) */}
      {daysRemaining !== undefined && status !== 'COMPLETED' && status !== 'CANCELLED' && status !== 'DRAFT' && (
        <>
          <span className="h-3 w-px bg-slate-200" />
          <div className={`flex items-center gap-1 ${daysRemaining < 7 ? 'text-red-500' : 'text-slate-500'}`}>
            <Clock className="h-3 w-3" />
            <span className={`font-medium ${daysRemaining < 7 ? 'text-red-600' : 'text-slate-700'} ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
              {daysRemaining < 0 ? 'Lewat!' : `${daysRemaining} hari`}
            </span>
          </div>
        </>
      )}
    </motion.div>
  );
}
