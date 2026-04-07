'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Badge, Button, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Card, CardContent, Separator, ScrollArea,
} from '@/components/ui';
import {
  AlertTriangle, MessageSquare, FileText, User, Clock, Building2,
  ChevronRight, Send, Shield, Loader2, Paperclip, CheckCircle, XCircle, Eye, ArrowUpRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { formatDateTime, getRelativeTime } from '@/lib/helpers';

interface DisputeParty {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  contractor?: { companyName: string } | null;
}

interface DisputeProject {
  id: string;
  title: string;
  status: string;
  budget: number;
  category: string;
  owner?: { id: string; name: string; avatar?: string } | null;
}

interface TimelineEvent {
  id: string;
  type: string;
  description: string;
  user?: DisputeParty;
  timestamp: string;
  resolution?: string | null;
  resolvedBy?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface DisputeData {
  id: string;
  projectId: string;
  type: string;
  description: string;
  status: string;
  priority: string;
  resolution?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  attachments: string[];
  timeline: TimelineEvent[];
  reporter: DisputeParty;
  against: DisputeParty | null;
  project: DisputeProject;
  createdAt: string;
  updatedAt: string;
}

interface DisputeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disputeId?: string;
  dispute?: DisputeData | null;
  currentUser?: { id: string; name: string } | null;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; gradient: string; dotColor: string }> = {
  OPEN: { label: 'Terbuka', color: 'text-red-700', bgColor: 'bg-red-100', gradient: 'from-red-500 to-red-600', dotColor: 'bg-red-500' },
  IN_PROGRESS: { label: 'Diproses', color: 'text-amber-700', bgColor: 'bg-amber-100', gradient: 'from-amber-500 to-orange-500', dotColor: 'bg-amber-500' },
  UNDER_REVIEW: { label: 'Dalam Tinjauan', color: 'text-orange-700', bgColor: 'bg-orange-100', gradient: 'from-orange-400 to-orange-600', dotColor: 'bg-orange-500' },
  ESCALATED: { label: 'Dieskalasi', color: 'text-purple-700', bgColor: 'bg-purple-100', gradient: 'from-purple-500 to-violet-600', dotColor: 'bg-purple-500' },
  RESOLVED: { label: 'Selesai', color: 'text-green-700', bgColor: 'bg-green-100', gradient: 'from-green-500 to-emerald-600', dotColor: 'bg-green-500' },
  CLOSED: { label: 'Ditutup', color: 'text-slate-700', bgColor: 'bg-slate-200', gradient: 'from-slate-400 to-slate-500', dotColor: 'bg-slate-400' },
};

const priorityConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  LOW: { label: 'Rendah', color: 'text-slate-600', bgColor: 'bg-slate-100', icon: '🟢' },
  MEDIUM: { label: 'Sedang', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: '🟡' },
  HIGH: { label: 'Tinggi', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: '🟠' },
  URGENT: { label: 'Mendesak', color: 'text-red-600', bgColor: 'bg-red-100', icon: '🔴' },
};

const typeLabels: Record<string, string> = {
  PAYMENT: 'Pembayaran',
  QUALITY: 'Kualitas',
  DELAY: 'Keterlambatan',
  SCOPE: 'Ruang Lingkup',
  OTHER: 'Lainnya',
};

const validStatusOptions: Record<string, string[]> = {
  OPEN: ['IN_PROGRESS', 'UNDER_REVIEW', 'ESCALATED'],
  IN_PROGRESS: ['UNDER_REVIEW', 'ESCALATED', 'RESOLVED'],
  UNDER_REVIEW: ['IN_PROGRESS', 'ESCALATED', 'RESOLVED'],
  ESCALATED: ['UNDER_REVIEW', 'RESOLVED'],
};

export function DisputeModal({ open, onOpenChange, disputeId, dispute, currentUser }: DisputeModalProps) {
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [disputeData, setDisputeData] = useState<DisputeData | null>(dispute || null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [escalating, setEscalating] = useState(false);

  const fetchDispute = useCallback(async () => {
    if (!disputeId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/disputes/${disputeId}`);
      const data = await res.json();
      if (data.success) {
        setDisputeData(data.dispute);
      } else {
        toast.error(data.error || 'Gagal memuat detail sengketa');
      }
    } catch {
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  }, [disputeId]);

  useEffect(() => {
    if (open && disputeId && !dispute) {
      fetchDispute();
    }
    if (open && dispute) {
      setDisputeData(dispute);
    }
  }, [open, disputeId, dispute, fetchDispute]);

  const handleUpdateStatus = async () => {
    if (!disputeId || !selectedStatus) return;

    if ((selectedStatus === 'RESOLVED' || selectedStatus === 'CLOSED') && !resolutionNotes.trim()) {
      toast.error('Catatan resolusi diperlukan untuk menyelesaikan sengketa');
      return;
    }

    setUpdating(true);
    try {
      const body: Record<string, unknown> = { status: selectedStatus };
      if (resolutionNotes.trim()) {
        body.resolution = resolutionNotes;
        body.resolvedBy = currentUser?.id;
      }
      const res = await fetch(`/api/disputes/${disputeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setDisputeData(data.dispute);
        setSelectedStatus('');
        setResolutionNotes('');
      } else {
        toast.error(data.error || 'Gagal memperbarui sengketa');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setUpdating(false);
    }
  };

  const handleEscalate = async () => {
    if (!disputeId) return;
    setEscalating(true);
    try {
      const res = await fetch(`/api/disputes/${disputeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ESCALATED',
          resolution: 'Sengketa dieskalasi ke admin untuk penanganan lebih lanjut.',
          resolvedBy: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Sengketa berhasil dieskalasi ke Admin');
        setDisputeData(data.dispute);
      } else {
        toast.error(data.error || 'Gagal mengeskalasi sengketa');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setEscalating(false);
    }
  };

  const statusCfg = disputeData ? statusConfig[disputeData.status] || statusConfig.OPEN : statusConfig.OPEN;
  const priorityCfg = disputeData ? priorityConfig[disputeData.priority] || priorityConfig.MEDIUM : priorityConfig.MEDIUM;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
        {/* Severity color gradient top border */}
        <div className={`h-1 bg-gradient-to-r ${statusCfg.gradient}`} />
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-slate-500">Memuat detail sengketa...</span>
          </div>
        ) : disputeData ? (
          <ScrollArea className="max-h-[90vh]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              {/* Header with gradient */}
              <DialogHeader className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`p-2.5 rounded-xl bg-gradient-to-br ${statusCfg.bgColor} to-transparent`}
                  >
                    <AlertTriangle className={`h-5 w-5 ${statusCfg.color}`} />
                  </motion.div>
                  <div className="flex-1">
                    <DialogTitle className="text-lg">
                      Sengketa #{disputeData.id.slice(-6).toUpperCase()}
                    </DialogTitle>
                    <DialogDescription>
                      {typeLabels[disputeData.type] || disputeData.type} &middot; Dibuat {getRelativeTime(disputeData.createdAt)}
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${statusCfg.bgColor} ${statusCfg.color} border-0 font-semibold`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor} mr-1.5`} />
                      {statusCfg.label}
                    </Badge>
                    <Badge className={`${priorityCfg.bgColor} ${priorityCfg.color} border-0`}>
                      {priorityCfg.icon} {priorityCfg.label}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              {/* Project Info */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg mt-0.5">
                      <Building2 className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-500">Proyek Terkait</p>
                      <p className="font-semibold">{disputeData.project.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span>{disputeData.project.category}</span>
                        <span>ID: {disputeData.project.id.slice(-6).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Involved Parties */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-slate-700 mb-3">Pihak yang Terlibat</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                      <div className="p-2 bg-red-100 rounded-full">
                        <User className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Pelapor</p>
                        <p className="font-medium text-sm">{disputeData.reporter.name}</p>
                        <p className="text-xs text-slate-400">
                          {disputeData.reporter.contractor?.companyName || disputeData.reporter.role}
                        </p>
                      </div>
                    </div>
                    {disputeData.against ? (
                      <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                        <div className="p-2 bg-orange-100 rounded-full">
                          <User className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Terlapor</p>
                          <p className="font-medium text-sm">{disputeData.against.name}</p>
                          <p className="text-xs text-slate-400">
                            {disputeData.against.contractor?.companyName || disputeData.against.role}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="p-2 bg-slate-100 rounded-full">
                          <User className="h-4 w-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Terlapor</p>
                          <p className="font-medium text-sm text-slate-400">Tidak ditentukan</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Deskripsi Sengketa</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{disputeData.description}</p>
                </CardContent>
              </Card>

              {/* Attachments */}
              {disputeData.attachments && disputeData.attachments.length > 0 && (
                <Card className="mb-4">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                      <Paperclip className="h-4 w-4" /> Bukti Pendukung
                    </p>
                    <div className="space-y-2">
                      {disputeData.attachments.map((url: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-sm">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="flex-1 truncate text-slate-600">
                            {url.split('/').pop() || `Bukti ${idx + 1}`}
                          </span>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Resolution (if resolved) */}
              {disputeData.resolution && (
                <Card className="mb-4 border-green-200 bg-green-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium text-green-700">Resolusi</p>
                    </div>
                    <p className="text-sm text-green-800 leading-relaxed">{disputeData.resolution}</p>
                    {disputeData.resolvedAt && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Diselesaikan pada {formatDateTime(disputeData.resolvedAt)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Separator className="my-4" />

              {/* Timeline */}
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Timeline Sengketa
                  <Badge variant="outline" className="text-[10px] ml-1">{disputeData.timeline.length} aktivitas</Badge>
                </p>
                <div className="relative pl-7">
                  {/* Animated gradient timeline line */}
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/40 via-slate-200 to-transparent origin-top"
                  />
                  <AnimatePresence>
                    {disputeData.timeline.map((event, idx) => {
                      const eventColor = event.type === 'RESOLVED' ? 'green' :
                        event.type === 'STATUS_CHANGE' ? 'amber' :
                        event.type === 'ESCALATED' ? 'purple' :
                        event.type === 'CREATED' ? 'primary' : 'slate';
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.12, duration: 0.3 }}
                          className="relative mb-5 last:mb-0"
                        >
                          {/* Timeline dot with pulse for latest */}
                          <div className="absolute -left-[18px] top-1">
                            {idx === 0 && disputeData.status !== 'RESOLVED' && disputeData.status !== 'CLOSED' && (
                              <motion.div
                                className={`absolute inset-0 w-3.5 h-3.5 rounded-full bg-${eventColor}-400/30`}
                                animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            )}
                            <div className={`w-3.5 h-3.5 rounded-full border-2 border-white bg-${eventColor}-500 shadow-sm`} />
                          </div>
                          <div className="ml-2">
                            <div className="flex items-center gap-2 mb-0.5">
                              {event.type === 'RESOLVED' && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                              {event.type === 'STATUS_CHANGE' && <ChevronRight className="h-3.5 w-3.5 text-amber-500" />}
                              {event.type === 'ESCALATED' && <Shield className="h-3.5 w-3.5 text-purple-500" />}
                              {event.type === 'CREATED' && <MessageSquare className="h-3.5 w-3.5 text-primary" />}
                              {event.user && (
                                <span className="text-xs font-semibold text-slate-600">{event.user.name}</span>
                              )}
                              <span className="text-[10px] text-slate-400">{formatDateTime(event.timestamp)}</span>
                            </div>
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.12 + 0.1 }}
                              className="text-sm text-slate-600 leading-relaxed"
                            >
                              {event.description}
                            </motion.p>
                            {event.resolution && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                transition={{ delay: idx * 0.12 + 0.2 }}
                                className="mt-2 p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg"
                              >
                                <p className="text-sm text-green-700 flex items-start gap-1.5">
                                  <CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                  {event.resolution}
                                </p>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* Action Form */}
              {disputeData.status !== 'RESOLVED' && disputeData.status !== 'CLOSED' && (
                <>
                  <Separator className="my-4" />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                      <Send className="h-4 w-4 text-primary" />
                      Kelola Sengketa
                    </p>

                    <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100">
                      {/* Status Selector */}
                      <div>
                        <label className="text-xs text-slate-500 mb-1.5 block font-medium">Ubah Status</label>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                          <SelectTrigger className="w-full h-10 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all">
                            <SelectValue placeholder="Pilih status baru..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(validStatusOptions[disputeData.status] || []).map((s) => (
                              <SelectItem key={s} value={s}>
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${statusConfig[s]?.dotColor || 'bg-slate-400'}`} />
                                  {statusConfig[s]?.label || s}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Resolution Notes */}
                      <div>
                        <label className="text-xs text-slate-500 mb-1.5 block font-medium">Catatan Resolusi</label>
                        <Textarea
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="Tambahkan catatan atau detail resolusi..."
                          rows={3}
                          className="border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all resize-none"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <Button
                          onClick={handleUpdateStatus}
                          disabled={!selectedStatus || updating}
                          className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 flex-1 shadow-sm transition-all duration-200"
                        >
                          {updating ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...</>
                          ) : (
                            <><Send className="h-4 w-4 mr-2" /> Perbarui Status</>
                          )}
                        </Button>
                        {disputeData.status !== 'ESCALATED' && (
                          <Button
                            variant="outline"
                            onClick={handleEscalate}
                            disabled={escalating}
                            className="border-purple-200 text-purple-700 hover:bg-purple-50 flex-1 transition-all duration-200"
                          >
                            {escalating ? (
                              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Mengeskalasi...</>
                            ) : (
                              <><Shield className="h-4 w-4 mr-2" /> Eskalasi ke Admin</>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </motion.div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <XCircle className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500">Detail sengketa tidak tersedia</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
