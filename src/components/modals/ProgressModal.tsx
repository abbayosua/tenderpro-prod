'use client';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, CheckCircle, Calendar, Circle, Loader2, Save, Clock, AlertCircle } from 'lucide-react';
import { Milestone } from '@/types';
import { formatRupiah } from '@/lib/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

interface ProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: { id: string; title: string; category: string; budget: number } | null;
  milestones: Milestone[];
  progressPercent: number;
  onUpdateMilestone: (milestoneId: string, status: string) => void;
}

function CircularProgress({ percent }: { percent: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40" cy="40" r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-100"
          strokeWidth="6"
        />
        <motion.circle
          cx="40" cy="40" r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatedPercentage target={percent} />
      </div>
    </div>
  );
}

function AnimatedPercentage({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 1200;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        setDisplay(target);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target]);

  return <span className="text-lg font-bold text-slate-800">{display}%</span>;
}

function getMilestoneProgress(milestone: Milestone): number {
  if (milestone.status === 'COMPLETED') return 100;
  if (milestone.status === 'IN_PROGRESS') return 50;
  return 0;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'COMPLETED': return 'Selesai';
    case 'IN_PROGRESS': return 'Dalam Proses';
    default: return 'Menunggu';
  }
}

export function ProgressModal({
  open,
  onOpenChange,
  project,
  milestones,
  progressPercent,
  onUpdateMilestone,
}: ProgressModalProps) {
  const completedCount = milestones.filter(m => m.status === 'COMPLETED').length;
  const inProgressCount = milestones.filter(m => m.status === 'IN_PROGRESS').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-teal-700 px-6 py-6 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">Tracking Progress</DialogTitle>
              <DialogDescription className="text-white/70 mt-0.5">
                {project?.title}
              </DialogDescription>
            </div>
          </div>
          {project && (
            <div className="flex items-center gap-3 mt-3">
              <span className="px-2.5 py-1 rounded-full bg-white/15 text-white/90 text-xs font-medium backdrop-blur-sm">
                {project.category}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/15 text-white/90 text-xs font-medium backdrop-blur-sm">
                {formatRupiah(project.budget)}
              </span>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-5 space-y-5">
          {/* Overall Progress */}
          <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5">
            <div className="flex items-center gap-5">
              <CircularProgress percent={progressPercent} />
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Progress Keseluruhan</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {completedCount} selesai · {inProgressCount} berjalan · {milestones.length - completedCount - inProgressCount} menunggu
                  </p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                      <CheckCircle className="h-3 w-3" /> {completedCount} Selesai
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold">
                      <Loader2 className="h-3 w-3 animate-spin" /> {inProgressCount} Berjalan
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold">
                      <Clock className="h-3 w-3" /> {milestones.length - completedCount - inProgressCount} Menunggu
                    </span>
                  </div>
                </div>
                <Progress value={progressPercent} className="h-2.5" />
              </div>
            </div>
          </div>

          {/* Milestones Timeline */}
          {milestones.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-10"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-slate-300" />
              </div>
              <p className="font-medium text-slate-600">Belum ada milestone untuk proyek ini</p>
              <p className="text-sm mt-1 text-slate-400">Milestone akan dibuat setelah proyek dimulai</p>
            </motion.div>
          ) : (
            <div className="space-y-0">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-teal-500 rounded-full" />
                Daftar Milestone
              </h3>
              <AnimatePresence>
                {milestones.map((milestone, idx) => {
                  const milestoneProgress = getMilestoneProgress(milestone);
                  const isLast = idx === milestones.length - 1;

                  return (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.3, ease: 'easeOut' }}
                      className="relative flex gap-4"
                    >
                      {/* Timeline line & icon */}
                      <div className="flex flex-col items-center">
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                          milestone.status === 'COMPLETED'
                            ? 'bg-emerald-500 shadow-md shadow-emerald-200'
                            : milestone.status === 'IN_PROGRESS'
                            ? 'bg-sky-500 shadow-md shadow-sky-200'
                            : 'bg-slate-200'
                        }`}>
                          {milestone.status === 'COMPLETED' ? (
                            <CheckCircle className="h-4 w-4 text-white" />
                          ) : milestone.status === 'IN_PROGRESS' ? (
                            <Loader2 className="h-4 w-4 text-white animate-spin" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-slate-400" />
                          )}
                        </div>
                        {!isLast && (
                          <div className={`w-0.5 flex-1 min-h-[24px] transition-colors duration-300 ${
                            milestone.status === 'COMPLETED'
                              ? 'bg-emerald-300'
                              : milestone.status === 'IN_PROGRESS'
                              ? 'bg-sky-200'
                              : 'bg-slate-200'
                          }`} />
                        )}
                      </div>

                      {/* Content card */}
                      <div className={`flex-1 pb-4 group`}>
                        <motion.div
                          whileHover={{ scale: 1.01, y: -1 }}
                          className={`rounded-xl border p-4 transition-all duration-200 ${
                            milestone.status === 'COMPLETED'
                              ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white hover:shadow-md hover:shadow-emerald-100'
                              : milestone.status === 'IN_PROGRESS'
                              ? 'border-sky-200 bg-gradient-to-br from-sky-50/80 to-white hover:shadow-md hover:shadow-sky-100'
                              : 'border-slate-100 bg-white hover:shadow-md hover:shadow-slate-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className={`font-semibold text-sm ${
                                  milestone.status === 'COMPLETED' ? 'text-emerald-800' :
                                  milestone.status === 'IN_PROGRESS' ? 'text-sky-800' :
                                  'text-slate-700'
                                }`}>
                                  {milestone.title}
                                </p>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  milestone.status === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : milestone.status === 'IN_PROGRESS'
                                    ? 'bg-sky-100 text-sky-700'
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {getStatusLabel(milestone.status)}
                                </span>
                              </div>
                              {milestone.description && (
                                <p className="text-xs text-slate-500 line-clamp-2 mb-2">{milestone.description}</p>
                              )}
                              {milestone.dueDate && (
                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Target: {new Date(milestone.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              )}

                              {/* Progress bar for milestone */}
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                  <span>Progress</span>
                                  <span className="font-bold">{milestoneProgress}%</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <motion.div
                                    className={`h-full rounded-full ${
                                      milestone.status === 'COMPLETED'
                                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                        : milestone.status === 'IN_PROGRESS'
                                        ? 'bg-gradient-to-r from-sky-400 to-sky-500'
                                        : 'bg-slate-200'
                                    }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${milestoneProgress}%` }}
                                    transition={{ delay: idx * 0.08 + 0.2, duration: 0.6, ease: 'easeOut' }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Status selector */}
                            {milestone.status !== 'COMPLETED' && (
                              <Select
                                value={milestone.status}
                                onValueChange={(v) => onUpdateMilestone(milestone.id, v)}
                              >
                                <SelectTrigger className="w-28 h-8 text-xs border-slate-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PENDING">Pending</SelectItem>
                                  <SelectItem value="IN_PROGRESS">Dalam Proses</SelectItem>
                                  <SelectItem value="COMPLETED">Selesai</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button
              className="h-11 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
              onClick={() => onOpenChange(false)}
            >
              <Save className="h-4 w-4 mr-2" />
              Simpan Perubahan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
