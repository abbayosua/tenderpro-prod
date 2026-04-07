'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Plus,
  CheckCircle,
  DollarSign,
  FileText,
  Clock,
  Activity,
  RefreshCw,
  User,
  FolderOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Map action types to icons, colors, and dot colors for timeline
const ACTION_CONFIG: Record<string, { icon: typeof Send; color: string; bgColor: string; dotColor: string; label: string; borderColor: string }> = {
  BID_SUBMITTED: {
    icon: Send,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    dotColor: 'bg-primary',
    label: 'Penawaran',
    borderColor: 'border-l-primary',
  },
  BID_ACCEPTED: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    dotColor: 'bg-green-500',
    label: 'Diterima',
    borderColor: 'border-l-green-500',
  },
  BID_REJECTED: {
    icon: FileText,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    dotColor: 'bg-rose-500',
    label: 'Ditolak',
    borderColor: 'border-l-rose-500',
  },
  MILESTONE_COMPLETED: {
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    dotColor: 'bg-emerald-500',
    label: 'Milestone',
    borderColor: 'border-l-emerald-500',
  },
  PAYMENT_MADE: {
    icon: DollarSign,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    dotColor: 'bg-amber-500',
    label: 'Pembayaran',
    borderColor: 'border-l-amber-500',
  },
  DOCUMENT_UPLOADED: {
    icon: FileText,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    dotColor: 'bg-violet-500',
    label: 'Dokumen',
    borderColor: 'border-l-violet-500',
  },
  PROJECT_CREATED: {
    icon: Plus,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    dotColor: 'bg-primary',
    label: 'Proyek Baru',
    borderColor: 'border-l-primary',
  },
  PROJECT_STARTED: {
    icon: Clock,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    dotColor: 'bg-teal-500',
    label: 'Proyek Dimulai',
    borderColor: 'border-l-teal-500',
  },
  PROJECT_COMPLETED: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    dotColor: 'bg-green-500',
    label: 'Proyek Selesai',
    borderColor: 'border-l-green-500',
  },
};

const DEFAULT_CONFIG = {
  icon: Activity,
  color: 'text-slate-600',
  bgColor: 'bg-slate-100',
  dotColor: 'bg-slate-400',
  label: 'Aktivitas',
  borderColor: 'border-l-slate-400',
};

function getConfig(action: string) {
  return ACTION_CONFIG[action] || DEFAULT_CONFIG;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

interface ActivityFeedProps {
  limit?: number;
  userId?: string;
  projectId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function ActivityFeed({
  limit = 10,
  userId,
  projectId,
  autoRefresh = true,
  refreshInterval = 30000,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Initial fetch
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Auto-refresh every N seconds
  useEffect(() => {
    if (!autoRefresh) return;

    intervalRef.current = setInterval(() => {
      fetchActivities(true);
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchActivities]);

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      {/* Header with gradient accent */}
      <div className="h-1 bg-gradient-to-r from-primary via-teal-500 to-emerald-500" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-teal-500/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Aktivitas Terbaru</h3>
              {!loading && activities.length > 0 && (
                <p className="text-[10px] text-slate-400">{activities.length} aktivitas tercatat</p>
              )}
            </div>
          </div>
          <button
            onClick={() => fetchActivities(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 transition-all duration-200"
            title="Segarkan"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-1.5" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-500 mb-1">Belum ada aktivitas</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Aktivitas terbaru seperti penawaran, milestone, dan pembayaran akan muncul di sini
            </p>
          </div>
        ) : (
          <div className="h-80 overflow-y-auto pr-1">
            <AnimatePresence mode="wait">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {activities.map((activity) => {
                  const config = getConfig(activity.action);
                  const IconComponent = config.icon;
                  const isHovered = hoveredId === activity.id;

                  return (
                    <motion.div
                      key={activity.id}
                      variants={itemVariants}
                      className="relative group pl-8"
                      onMouseEnter={() => setHoveredId(activity.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      {/* Vertical timeline line */}
                      <div className="absolute left-[15px] top-5 bottom-0 w-px bg-slate-100" />

                      {/* Timeline dot */}
                      <div className={`absolute left-[9px] top-[18px] w-[13px] h-[13px] rounded-full ${config.dotColor} border-2 border-white shadow-sm z-10 transition-transform duration-200 ${isHovered ? 'scale-125' : ''}`} />

                      {/* Content card */}
                      <div className={`py-3 pb-4 ${isHovered ? 'relative' : ''}`}>
                        <div className={`relative rounded-lg p-3 border-l-[3px] ${config.borderColor} transition-all duration-200 ${
                          isHovered
                            ? 'bg-slate-50/80 shadow-sm -translate-x-0.5'
                            : 'bg-transparent'
                        }`}>
                          {/* Top row: icon + description */}
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${config.bgColor}`}
                            >
                              <IconComponent className={`h-3.5 w-3.5 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {activity.description}
                              </p>
                              {/* Metadata row */}
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {activity.user && (
                                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                                    <User className="h-3 w-3" />
                                    {activity.user.name}
                                    {activity.user.isVerified && (
                                      <CheckCircle className="h-3 w-3 text-primary" />
                                    )}
                                  </span>
                                )}
                                {activity.project && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0 h-4 font-normal"
                                  >
                                    {activity.project.title}
                                  </Badge>
                                )}
                              </div>
                              {/* Timestamp */}
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {getRelativeTime(activity.createdAt)}
                                </span>
                                {/* Action label badge - visible on hover */}
                                <motion.div
                                  initial={{ opacity: 0, x: 5 }}
                                  animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 5 }}
                                  transition={{ duration: 0.15 }}
                                >
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] px-1.5 py-0 h-5 font-medium border-slate-200 ${config.bgColor} ${config.color}`}
                                  >
                                    {config.label}
                                  </Badge>
                                </motion.div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
