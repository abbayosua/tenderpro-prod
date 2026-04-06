'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Video, Camera, Flag, MapPin, DollarSign, Activity, Clock, CheckCircle,
  AlertCircle, Info, Shield
} from 'lucide-react';
import type { Milestone } from '@/types';
import { formatRupiah } from '@/lib/helpers';

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

export function CCTVModal({ open, onOpenChange, project, onViewProgress }: CCTVModalProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch milestones and activity log when project changes
  useEffect(() => {
    if (!project || !open) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch milestones
        const milestoneRes = await fetch(`/api/milestones?projectId=${project.id}`);
        const milestoneData = await milestoneRes.json();
        if (milestoneData.milestones) {
          setMilestones(milestoneData.milestones);
        }
      } catch (e) {
        console.error('Failed to fetch milestones:', e);
      }

      try {
        // Fetch notifications as activity log
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'Sedang Berjalan';
      case 'COMPLETED': return 'Selesai';
      case 'OPEN': return 'Tender Terbuka';
      case 'CANCELLED': return 'Dibatalkan';
      default: return status;
    }
  };

  const getMilestoneStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Selesai';
      case 'IN_PROGRESS': return 'Berjalan';
      case 'PENDING': return 'Pending';
      default: return status;
    }
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'bid': return <DollarSign className="h-4 w-4 text-primary" />;
      case 'milestone': return <Flag className="h-4 w-4 text-green-600" />;
      case 'payment': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'alert': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: return <Info className="h-4 w-4 text-slate-500" />;
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const date = new Date(ts);
      return date.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Monitoring Proyek
          </DialogTitle>
          <DialogDescription>
            Pusat monitoring dan aktivitas proyek Anda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-500" />
                Ringkasan Proyek
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Nama Proyek</p>
                  <p className="font-medium text-sm">{project?.title || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <Badge variant="outline" className="mt-0.5">
                    {project?.status ? getStatusLabel(project.status) : '-'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Progress</p>
                  <p className="font-medium text-sm text-primary">{getProgress()}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Terakhir Update
                  </p>
                  <p className="font-medium text-sm">{new Date().toLocaleDateString('id-ID')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CCTV Feed Placeholder */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="h-4 w-4 text-blue-600" />
                CCTV Live
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="relative bg-slate-100 rounded-lg overflow-hidden aspect-video flex items-center justify-center border-2 border-dashed border-slate-300">
                <div className="text-center space-y-3 p-6">
                  <div className="mx-auto w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
                    <Camera className="h-8 w-8 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-600">CCTV Tidak Tersedia</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Hubungi admin untuk mengaktifkan fitur CCTV
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" disabled>
                    <Shield className="h-4 w-4" />
                    Memerlukan Aktivasi Admin
                  </Button>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Fitur CCTV memerlukan setup kamera di lokasi proyek. Silakan hubungi admin untuk informasi lebih lanjut.
              </p>
            </CardContent>
          </Card>

          {/* Milestones Progress */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Flag className="h-4 w-4 text-primary" />
                  Progress Milestone
                </CardTitle>
                <span className="text-sm text-slate-500">
                  {milestones.filter(m => m.status === 'COMPLETED').length}/{milestones.length} selesai
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Progress value={getProgress()} className="h-2 mb-4" />
              {milestones.length === 0 && !loading ? (
                <p className="text-sm text-slate-400 text-center py-4">Belum ada milestone</p>
              ) : (
                <ScrollArea className="max-h-48">
                  <div className="space-y-2">
                    {milestones.map((milestone, idx) => (
                      <div
                        key={milestone.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            milestone.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : milestone.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {milestone.status === 'COMPLETED' ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              idx + 1
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{milestone.title}</p>
                            {milestone.description && (
                              <p className="text-xs text-slate-400">{milestone.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {milestone.amount && (
                            <span className="text-xs text-slate-500">
                              {formatRupiah(milestone.amount)}
                            </span>
                          )}
                          <Badge variant="secondary" className={`text-xs ${getMilestoneStatusColor(milestone.status)}`}>
                            {getMilestoneStatusLabel(milestone.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-500" />
                Log Aktivitas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {activityLog.length === 0 && !loading ? (
                <p className="text-sm text-slate-400 text-center py-4">Belum ada aktivitas</p>
              ) : (
                <ScrollArea className="max-h-64">
                  <div className="space-y-3">
                    {activityLog.map((log) => (
                      <div key={log.id} className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">{getActivityIcon(log.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{log.message}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{formatTimestamp(log.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {onViewProgress && (
              <Button variant="outline" onClick={handleViewProgress}>
                <Flag className="h-4 w-4 mr-2" /> Detail Progress
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
