'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Circle, Calendar, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatRupiah, formatDate } from '@/lib/helpers';

interface TimelineMilestone {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  amount: number | null;
  order: number;
}

interface TimelineData {
  milestones: TimelineMilestone[];
  progress: number;
  totalMilestones: number;
  completedMilestones: number;
  inProgressMilestones: number;
  pendingMilestones: number;
}

interface ProjectTimelineProps {
  projectId: string;
}

const statusConfig: Record<string, {
  color: string;
  bgColor: string;
  borderColor: string;
  lineStyle: string;
  label: string;
  icon: typeof CheckCircle;
}> = {
  COMPLETED: {
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-500',
    lineStyle: 'bg-emerald-500',
    label: 'Selesai',
    icon: CheckCircle,
  },
  IN_PROGRESS: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-500',
    lineStyle: 'bg-amber-400',
    label: 'Berjalan',
    icon: Clock,
  },
  PENDING: {
    color: 'text-slate-400',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
    lineStyle: 'bg-slate-200',
    label: 'Menunggu',
    icon: Circle,
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  },
};

export function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/timeline`);
        const json = await res.json();
        if (!cancelled) {
          if (json.success) {
            setData(json.data);
          } else {
            setError(json.error || 'Gagal memuat timeline');
          }
        }
      } catch {
        if (!cancelled) setError('Gagal memuat timeline');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-slate-500">Memuat timeline...</p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-slate-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!data || data.totalMilestones === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Belum Ada Milestone</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Timeline akan muncul setelah milestone proyek ditambahkan
          </p>
        </CardContent>
      </Card>
    );
  }

  const progressColor =
    data.progress >= 75 ? 'text-emerald-600' :
    data.progress >= 50 ? 'text-blue-600' :
    data.progress >= 25 ? 'text-amber-600' :
    'text-slate-500';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Timeline Proyek
        </CardTitle>
        <CardDescription>
          {data.completedMilestones} dari {data.totalMilestones} milestone selesai
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Overall Progress */}
        <div className="mb-8 p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Progress Keseluruhan</span>
            <span className={`text-2xl font-bold ${progressColor}`}>{data.progress}%</span>
          </div>
          <Progress value={data.progress} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>{data.completedMilestones} selesai</span>
            <span>{data.inProgressMilestones} berjalan</span>
            <span>{data.pendingMilestones} menunggu</span>
          </div>
        </div>

        {/* Timeline */}
        <motion.div
          className="relative"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Vertical line */}
          <div className="absolute left-[19px] md:left-[23px] top-2 bottom-2 w-0.5 bg-slate-200" />

          <div className="space-y-6">
            {data.milestones.map((milestone, index) => {
              const config = statusConfig[milestone.status] || statusConfig.PENDING;
              const StatusIcon = config.icon;
              const isLast = index === data.milestones.length - 1;

              return (
                <motion.div
                  key={milestone.id}
                  variants={itemVariants}
                  className="relative flex gap-4 md:gap-6"
                >
                  {/* Timeline dot and line */}
                  <div className="relative flex flex-col items-center z-10">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center shadow-sm`}>
                      <StatusIcon className={`h-4 w-4 md:h-5 md:w-5 ${config.color}`} />
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 flex-1 mt-1 ${
                        milestone.status === 'COMPLETED'
                          ? 'bg-emerald-300'
                          : milestone.status === 'IN_PROGRESS'
                            ? 'border-l-2 border-dashed border-amber-300'
                            : 'border-l-2 border-dashed border-slate-200'
                      }`} style={{ minHeight: '24px' }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2 -mt-1">
                    <div className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-semibold text-sm ${milestone.status === 'COMPLETED' ? 'text-slate-700' : 'text-slate-800'}`}>
                            {milestone.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`text-xs ${config.color} ${config.bgColor} border-0`}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        {milestone.amount && milestone.amount > 0 && (
                          <span className="text-xs font-medium text-primary whitespace-nowrap">
                            {formatRupiah(milestone.amount)}
                          </span>
                        )}
                      </div>

                      {milestone.description && (
                        <p className="text-sm text-slate-500 mb-2">{milestone.description}</p>
                      )}

                      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                        {milestone.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Tenggat: {formatDate(milestone.dueDate)}
                          </span>
                        )}
                        {milestone.completedAt && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle className="h-3 w-3" />
                            Selesai: {formatDate(milestone.completedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
