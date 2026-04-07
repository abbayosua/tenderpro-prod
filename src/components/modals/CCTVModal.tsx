'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Camera, Flag, Clock, CheckCircle, AlertCircle, Info, Shield,
  Eye, Wifi, Zap, Activity, TrendingUp, ChevronRight,
  Video, VideoOff, Signal, Timer, AlertTriangle
} from 'lucide-react';
import type { Milestone } from '@/types';
import { formatRupiah } from '@/lib/helpers';
import { motion } from 'framer-motion';

interface ActivityLog {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

interface CCTVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: { id: string; title: string; status: string } | null;
  onViewProgress?: (projectId: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

function ShimmerCard() {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

// Scan line animation for camera placeholder
function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent pointer-events-none"
      style={{ boxShadow: '0 0 8px 2px rgba(13, 148, 136, 0.3)' }}
      animate={{ top: ['0%', '100%'] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// Camera placeholder card
function CameraPlaceholder({ name, index }: { name: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden aspect-video border border-slate-700/50"
    >
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />

      {/* Scan line */}
      <ScanLine />

      {/* Corner brackets */}
      <div className="absolute top-2 left-2 w-5 h-5 border-l-2 border-t-2 border-primary/40 rounded-tl-sm" />
      <div className="absolute top-2 right-2 w-5 h-5 border-r-2 border-t-2 border-primary/40 rounded-tr-sm" />
      <div className="absolute bottom-2 left-2 w-5 h-5 border-l-2 border-b-2 border-primary/40 rounded-bl-sm" />
      <div className="absolute bottom-2 right-2 w-5 h-5 border-r-2 border-b-2 border-primary/40 rounded-br-sm" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
        <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center border border-white/10 mb-2">
          <VideoOff className="h-5 w-5 text-white/40" />
        </div>
        <p className="text-[10px] text-white/50 font-medium">{name}</p>
        <p className="text-[9px] text-white/30 mt-0.5">Tidak aktif</p>
      </div>

      {/* Camera label */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-white/60 font-medium">{name}</span>
          <Badge className="bg-slate-600 text-white/70 border-0 text-[8px] px-1.5 py-0 h-4">
            <VideoOff className="h-2.5 w-2.5 mr-0.5" /> Offline
          </Badge>
        </div>
      </div>
    </motion.div>
  );
}

export function CCTVModal({ open, onOpenChange, project, onViewProgress }: CCTVModalProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!project || !open) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const milestoneRes = await fetch(`/api/milestones?projectId=${project.id}`);
        const milestoneData = await milestoneRes.json();
        if (milestoneData.milestones) {
          setMilestones(milestoneData.milestones);
        }
      } catch (e) {
        console.error('Failed to fetch milestones:', e);
      }

      try {
        const notifRes = await fetch(`/api/notifications?projectId=${project.id}&limit=20`);
        const notifData = await notifRes.json();
        if (notifData.notifications) {
          setActivityLog(
            notifData.notifications.map((n: { id: string; type?: string; message: string; createdAt: string }) => ({
              id: n.id,
              type: n.type || 'info',
              message: n.message,
              timestamp: n.createdAt,
            }))
          );
        }
      } catch (e) {
        console.error('Failed to fetch activity log:', e);
      }

      setLoading(false);
    };

    fetchData();
  }, [project, open]);

  const getProgress = () => {
    const completed = milestones.filter(m => m.status === 'COMPLETED').length;
    const total = milestones.length || 1;
    return Math.round((completed / total) * 100);
  };

  const getMilestoneStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Selesai';
      case 'IN_PROGRESS': return 'Berjalan';
      case 'PENDING': return 'Pending';
      default: return status;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'bid': return 'border-l-primary bg-primary/5';
      case 'milestone': return 'border-l-emerald-500 bg-emerald-50';
      case 'payment': return 'border-l-teal-500 bg-teal-50';
      case 'alert': return 'border-l-amber-500 bg-amber-50';
      default: return 'border-l-slate-400 bg-slate-50';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'bid': return <TrendingUp className="h-4 w-4 text-primary" />;
      case 'milestone': return <Flag className="h-4 w-4 text-emerald-600" />;
      case 'payment': return <CheckCircle className="h-4 w-4 text-teal-600" />;
      case 'alert': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default: return <Info className="h-4 w-4 text-slate-500" />;
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const date = new Date(ts);
      return date.toLocaleString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  const handleViewProgress = () => {
    if (project && onViewProgress) {
      onViewProgress(project.id);
      onOpenChange(false);
    }
  };

  // Camera feeds data
  const cameraFeeds = [
    { id: 'cam-1', name: 'Area Utama', active: false },
    { id: 'cam-2', name: 'Area Kerja', active: false },
    { id: 'cam-3', name: 'Pintu Masuk', active: false },
    { id: 'cam-4', name: 'Gudang Material', active: false },
  ];

  const monitoringMetrics = [
    { label: 'Kualitas Gambar', value: '1080p HD', icon: Eye, color: 'text-emerald-600', bg: 'bg-emerald-100', indicator: 'bg-emerald-500', indicatorText: 'Aktif' },
    { label: 'Latensi', value: '24ms', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100', indicator: 'bg-emerald-500', indicatorText: 'Normal' },
    { label: 'Uptime Kamera', value: '99.8%', icon: Wifi, color: 'text-primary', bg: 'bg-primary/10', indicator: 'bg-emerald-500', indicatorText: 'Baik' },
    { label: 'Total Milestone', value: `${milestones.length} fase`, icon: Flag, color: 'text-teal-600', bg: 'bg-teal-100', indicator: 'bg-primary', indicatorText: 'Berjalan' },
    { label: 'Alert Terakhir', value: '2 jam lalu', icon: AlertTriangle, color: 'text-slate-500', bg: 'bg-slate-100', indicator: 'bg-emerald-500', indicatorText: 'Aman' },
    { label: 'Pengecekan', value: '5 menit lalu', icon: Timer, color: 'text-violet-600', bg: 'bg-violet-100', indicator: 'bg-emerald-500', indicatorText: 'Aktif' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden p-0">
        {/* Gradient Header */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 px-6 py-5 flex-shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-teal-400 to-emerald-400" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Monitoring Proyek</h2>
                <p className="text-sm text-slate-300">{project?.title || 'Pusat monitoring dan aktivitas'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-white/10 text-white/70 border-white/20 text-[10px] font-medium px-2.5 py-1 hidden sm:flex items-center gap-1.5">
                <Video className="h-3 w-3" /> 4 Kamera
              </Badge>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 bg-red-500/90 backdrop-blur-sm rounded-full px-3 py-1.5 border border-red-400/50 shadow-lg shadow-red-500/20"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                </span>
                <span className="text-xs font-bold text-white tracking-wider">LIVE</span>
              </motion.div>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="p-6">
            {loading ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-5"
              >
                <ShimmerCard />
                <ShimmerCard />
                <ShimmerCard />
                <Skeleton className="h-24 w-full rounded-xl" />
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-5"
              >
                {/* Monitoring Metrics Grid */}
                <motion.div variants={itemVariants}>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
                    {monitoringMetrics.map((metric) => {
                      const Icon = metric.icon;
                      return (
                        <motion.div
                          key={metric.label}
                          whileHover={{ y: -2, boxShadow: '0 8px 25px -5px rgba(0,0,0,0.1)' }}
                          className="bg-white border border-slate-200 rounded-xl p-3 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className={`w-7 h-7 rounded-lg ${metric.bg} flex items-center justify-center`}>
                              <Icon className={`h-3.5 w-3.5 ${metric.color}`} />
                            </div>
                            <div className="flex items-center gap-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${metric.indicator}`} />
                              <span className="text-[9px] text-slate-400">{metric.indicatorText}</span>
                            </div>
                          </div>
                          <p className="text-base font-bold text-slate-900">{metric.value}</p>
                          <p className="text-[10px] text-slate-500 leading-tight">{metric.label}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* CCTV Feed Grid - 2x2 */}
                <motion.div variants={itemVariants}>
                  <Card className="border-slate-200 overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                            <Video className="h-3.5 w-3.5 text-white" />
                          </div>
                          <h3 className="font-semibold text-sm text-slate-900">Feed Kamera</h3>
                        </div>
                        <Badge className="bg-slate-100 text-slate-500 border-0 text-[10px] font-medium">
                          <Signal className="h-2.5 w-2.5 mr-1" /> 4 dari 4 kamera
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {cameraFeeds.map((cam, idx) => (
                          <CameraPlaceholder key={cam.id} name={cam.name} index={idx} />
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <Shield className="h-3 w-3" />
                          Kamera CCTV memerlukan aktivasi oleh admin proyek
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[10px] text-primary h-6 px-2"
                          disabled
                        >
                          Hubungi Admin
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Milestone Progress */}
                <motion.div variants={itemVariants}>
                  <Card className="border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Flag className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm text-slate-900">Progress Milestone</h3>
                            <p className="text-xs text-slate-500">{milestones.filter(m => m.status === 'COMPLETED').length}/{milestones.length} selesai</p>
                          </div>
                        </div>
                        <Badge className="bg-gradient-to-r from-primary to-teal-600 text-white text-xs font-bold shadow-sm">
                          {getProgress()}%
                        </Badge>
                      </div>

                      {/* Gradient progress bar */}
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${getProgress()}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                          className="h-full rounded-full bg-gradient-to-r from-primary via-teal-500 to-emerald-500 relative overflow-hidden"
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
                          />
                        </motion.div>
                      </div>

                      {milestones.length === 0 ? (
                        <div className="text-center py-6">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                            <Flag className="h-6 w-6 text-slate-300" />
                          </div>
                          <p className="text-sm text-slate-500 font-medium">Belum ada milestone</p>
                          <p className="text-xs text-slate-400 mt-1">Milestone akan muncul setelah dibuat</p>
                        </div>
                      ) : (
                        <ScrollArea className="max-h-52">
                          <div className="space-y-2">
                            {milestones.map((milestone, idx) => {
                              const statusColor = milestone.status === 'COMPLETED'
                                ? 'from-emerald-500 to-emerald-400'
                                : milestone.status === 'IN_PROGRESS'
                                ? 'from-primary to-teal-400'
                                : 'from-slate-300 to-slate-200';

                              return (
                                <motion.div
                                  key={milestone.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                                >
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                    milestone.status === 'COMPLETED'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : milestone.status === 'IN_PROGRESS'
                                      ? 'bg-primary/10 text-primary'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {milestone.status === 'COMPLETED'
                                      ? <CheckCircle className="h-4 w-4" />
                                      : <span className="text-xs font-bold">{idx + 1}</span>
                                    }
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-slate-800 truncate">{milestone.title}</p>
                                      <Badge variant="outline" className="text-[10px] px-2 py-0 shrink-0 ml-2">
                                        {getMilestoneStatusLabel(milestone.status)}
                                      </Badge>
                                    </div>
                                    {milestone.amount && (
                                      <p className="text-xs text-slate-400 mt-0.5">{formatRupiah(milestone.amount)}</p>
                                    )}
                                    {/* Per-milestone gradient progress */}
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: milestone.status === 'COMPLETED' ? '100%' : milestone.status === 'IN_PROGRESS' ? '50%' : '0%' }}
                                        transition={{ duration: 0.8, delay: idx * 0.08 }}
                                        className={`h-full rounded-full bg-gradient-to-r ${statusColor}`}
                                      />
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Activity Log - Timeline Style */}
                <motion.div variants={itemVariants}>
                  <Card className="border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm text-slate-900">Log Aktivitas</h3>
                            <p className="text-xs text-slate-500">{activityLog.length} aktivitas tercatat</p>
                          </div>
                        </div>
                        {/* Timeline legend */}
                        <div className="hidden sm:flex items-center gap-3 text-[9px]">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Bid</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Milestone</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" /> Pembayaran</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Alert</span>
                        </div>
                      </div>

                      {activityLog.length === 0 ? (
                        <div className="text-center py-6">
                          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                            <Activity className="h-7 w-7 text-slate-300" />
                          </div>
                          <p className="text-sm text-slate-500 font-medium">Belum ada aktivitas</p>
                          <p className="text-xs text-slate-400 mt-1">Aktivitas akan muncul saat ada update proyek</p>
                        </div>
                      ) : (
                        <ScrollArea className="max-h-72">
                          <div className="relative pl-6 space-y-0">
                            {/* Timeline line */}
                            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-slate-300 via-slate-200 to-transparent" />
                            {activityLog.map((log, idx) => (
                              <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className="relative pb-4 last:pb-0"
                              >
                                {/* Timeline dot */}
                                <div className={`absolute -left-6 top-1 w-[22px] h-[22px] rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                                  log.type === 'milestone' ? 'bg-emerald-500' :
                                  log.type === 'payment' ? 'bg-teal-500' :
                                  log.type === 'alert' ? 'bg-amber-500' :
                                  log.type === 'bid' ? 'bg-primary' :
                                  'bg-slate-400'
                                }`}>
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                </div>
                                {/* Content */}
                                <div className={`ml-2 p-3 rounded-lg border-l-[3px] ${getActivityColor(log.type)} transition-colors hover:shadow-sm`}>
                                  <div className="flex items-start gap-2">
                                    <div className="mt-0.5 shrink-0">{getActivityIcon(log.type)}</div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-slate-700 leading-relaxed">{log.message}</p>
                                      <div className="flex items-center gap-1.5 mt-1.5">
                                        <Clock className="h-3 w-3 text-slate-400" />
                                        <p className="text-xs text-slate-400">{formatTimestamp(log.timestamp)}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  variants={itemVariants}
                  className="flex flex-wrap gap-3 pt-2"
                >
                  {onViewProgress && (
                    <Button
                      onClick={handleViewProgress}
                      className="bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Detail Progress
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="border-slate-200 hover:bg-slate-50 transition-all duration-200"
                    onClick={() => onOpenChange(false)}
                  >
                    Tutup
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
