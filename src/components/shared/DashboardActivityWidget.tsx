'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Activity,
  Send,
  CheckCircle,
  DollarSign,
  FileText,
  Clock,
  Star,
  FolderOpen,
  RefreshCw,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { getRelativeTime } from '@/lib/helpers';

interface ActivityItem {
  id: string;
  action: string;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatar: string | null;
    isVerified: boolean;
  } | null;
  project?: {
    id: string;
    title: string;
    category: string;
  } | null;
}

const ACTION_CONFIG: Record<string, {
  icon: typeof Send;
  color: string;
  bgColor: string;
  label: string;
}> = {
  BID_SUBMITTED: {
    icon: Send,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    label: 'Penawaran',
  },
  BID_ACCEPTED: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Diterima',
  },
  BID_REJECTED: {
    icon: FileText,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    label: 'Ditolak',
  },
  MILESTONE_COMPLETED: {
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    label: 'Milestone',
  },
  PAYMENT_MADE: {
    icon: DollarSign,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    label: 'Pembayaran',
  },
  DOCUMENT_UPLOADED: {
    icon: FileText,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    label: 'Dokumen',
  },
  PROJECT_CREATED: {
    icon: FolderOpen,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    label: 'Proyek Baru',
  },
  PROJECT_STARTED: {
    icon: Clock,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    label: 'Dimulai',
  },
  PROJECT_COMPLETED: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Selesai',
  },
  REVIEW_SUBMITTED: {
    icon: Star,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Review',
  },
};

const DEFAULT_CONFIG = {
  icon: Activity,
  color: 'text-slate-600',
  bgColor: 'bg-slate-100',
  label: 'Aktivitas',
};

function getConfig(action: string) {
  return ACTION_CONFIG[action] || DEFAULT_CONFIG;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

interface DashboardActivityWidgetProps {
  userId?: string;
  projectId?: string;
  limit?: number;
  compact?: boolean;
  onViewAll?: () => void;
}

export function DashboardActivityWidget({
  userId,
  projectId,
  limit = 5,
  compact = false,
  onViewAll,
}: DashboardActivityWidgetProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (userId) params.set('userId', userId);
      if (projectId) params.set('projectId', projectId);

      const res = await fetch(`/api/activity?${params.toString()}`);
      const data = await res.json();

      if (data.activities) {
        setActivities(data.activities);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [limit, userId, projectId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-teal-500 to-emerald-500" />
        <CardHeader className={`${compact ? 'p-4 pb-2' : 'p-4 pb-3'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`rounded-lg bg-gradient-to-br from-primary/10 to-teal-500/10 flex items-center justify-center ${compact ? 'w-7 h-7' : 'w-8 h-8'}`}>
                <Activity className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-primary`} />
              </div>
              <div>
                <h3 className={`${compact ? 'text-xs' : 'text-sm'} font-bold text-slate-800`}>
                  Aktivitas Terbaru
                </h3>
                {!loading && activities.length > 0 && (
                  <p className="text-[10px] text-slate-400">{activities.length} aktivitas tercatat</p>
                )}
              </div>
            </div>
            <button
              onClick={() => fetchActivities(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 transition-all duration-200"
              title="Segarkan"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </CardHeader>
        <CardContent className={compact ? 'p-4 pt-0' : 'p-4 pt-0'}>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Skeleton className="h-7 w-7 rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-3.5 w-3/4 mb-1.5" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-6">
              <div className={`rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 ${compact ? 'w-12 h-12' : 'w-14 h-14'}`}>
                <MessageSquare className={`${compact ? 'h-6 w-6' : 'h-7 w-7'} text-slate-300`} />
              </div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Belum ada aktivitas</p>
              <p className={`text-slate-400 leading-relaxed ${compact ? 'text-[10px]' : 'text-[11px]'} max-w-[200px] mx-auto`}>
                Aktivitas terbaru akan muncul di sini
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-1"
            >
              {activities.map((activity) => {
                const config = getConfig(activity.action);
                const IconComponent = config.icon;

                return (
                  <motion.div
                    key={activity.id}
                    variants={itemVariants}
                    className="flex items-start gap-2.5 py-2 border-b border-slate-50 last:border-0 group"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${config.bgColor} group-hover:scale-110`}
                    >
                      <IconComponent className={`h-3.5 w-3.5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`${compact ? 'text-[11px]' : 'text-xs'} text-slate-700 leading-relaxed line-clamp-2`}>
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {getRelativeTime(activity.createdAt)}
                        </span>
                        {activity.project && !compact && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1.5 py-0 h-4 font-normal"
                          >
                            {activity.project.title}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 h-4 font-medium border-slate-200 flex-shrink-0 ${config.bgColor} ${config.color}`}
                    >
                      {config.label}
                    </Badge>
                  </motion.div>
                );
              })}

              {/* "Lihat Semua" link */}
              <motion.div
                variants={itemVariants}
                className="pt-2"
              >
                <button
                  onClick={onViewAll}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors group mx-auto"
                >
                  Lihat Semua Aktivitas
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
