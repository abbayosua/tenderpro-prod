'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle, Clock, Circle, Calendar, Loader2, ChevronDown, ChevronUp,
  DollarSign, AlertTriangle, ArrowRight, FileText, Plus, Pencil, Trash2, X, Save,
  LayoutList, AlignJustify, ZoomIn, ZoomOut, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRupiah, formatDate } from '@/lib/helpers';
import { useToast } from '@/hooks/use-toast';

type ViewMode = 'vertical' | 'horizontal';
type ZoomLevel = 'compact' | 'normal' | 'expanded';

interface TimelineMilestone {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  amount: number | null;
  order: number;
  progress?: number;
  paymentStatus?: string | null;
  paidAmount?: number | null;
  dependencies?: string[];
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
  gradientBg: string;
}> = {
  COMPLETED: {
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-500',
    lineStyle: 'bg-emerald-500',
    label: 'Selesai',
    icon: CheckCircle,
    gradientBg: 'from-emerald-500 to-emerald-600',
  },
  IN_PROGRESS: {
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary',
    lineStyle: 'bg-primary',
    label: 'Berjalan',
    icon: Clock,
    gradientBg: 'from-primary to-teal-500',
  },
  PENDING: {
    color: 'text-slate-400',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
    lineStyle: 'bg-slate-200',
    label: 'Menunggu',
    icon: Circle,
    gradientBg: 'from-slate-400 to-slate-500',
  },
  OVERDUE: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-500',
    lineStyle: 'bg-red-400',
    label: 'Terlambat',
    icon: AlertTriangle,
    gradientBg: 'from-red-500 to-rose-500',
  },
};

function isOverdue(milestone: TimelineMilestone): boolean {
  if (!milestone.dueDate || milestone.status === 'COMPLETED') return false;
  return new Date(milestone.dueDate) < new Date();
}

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

const horizontalItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  },
};

interface MilestoneFormData {
  title: string;
  description: string;
  dueDate: string;
  percentage: string;
}

const emptyForm: MilestoneFormData = {
  title: '',
  description: '',
  dueDate: '',
  percentage: '',
};

export function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<MilestoneFormData>(emptyForm);
  const [addFormLoading, setAddFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MilestoneFormData>(emptyForm);
  const [editFormLoading, setEditFormLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('vertical');
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('normal');
  const { toast } = useToast();

  const fetchTimeline = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/timeline`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Gagal memuat timeline');
      }
    } catch {
      setError('Gagal memuat timeline');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

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

  const toggleExpand = (id: string) => {
    setExpandedMilestones(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Create Milestone ────────────────────────────────────
  const handleCreateMilestone = async () => {
    if (!addForm.title.trim()) {
      toast({ title: 'Judul wajib diisi', variant: 'destructive' });
      return;
    }

    setAddFormLoading(true);
    try {
      const res = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: addForm.title,
          description: addForm.description || null,
          dueDate: addForm.dueDate || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Milestone berhasil ditambahkan' });
        setAddForm(emptyForm);
        setShowAddForm(false);
        await fetchTimeline();
      } else {
        toast({ title: json.error || 'Gagal menambahkan milestone', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Terjadi kesalahan', variant: 'destructive' });
    } finally {
      setAddFormLoading(false);
    }
  };

  // ─── Update Milestone ────────────────────────────────────
  const handleUpdateMilestone = async () => {
    if (!editingId || !editForm.title.trim()) return;

    setEditFormLoading(true);
    try {
      const res = await fetch(`/api/milestones/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description || null,
          dueDate: editForm.dueDate || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Milestone berhasil diperbarui' });
        setEditingId(null);
        setEditForm(emptyForm);
        await fetchTimeline();
      } else {
        toast({ title: json.error || 'Gagal memperbarui milestone', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Terjadi kesalahan', variant: 'destructive' });
    } finally {
      setEditFormLoading(false);
    }
  };

  // ─── Delete Milestone ────────────────────────────────────
  const handleDeleteMilestone = async (id: string) => {
    try {
      const res = await fetch(`/api/milestones/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Milestone berhasil dihapus' });
        setDeleteConfirmId(null);
        await fetchTimeline();
      } else {
        toast({ title: json.error || 'Gagal menghapus milestone', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Terjadi kesalahan', variant: 'destructive' });
    }
  };

  // ─── Start Edit ──────────────────────────────────────────
  const startEdit = (milestone: TimelineMilestone) => {
    setEditingId(milestone.id);
    setEditForm({
      title: milestone.title,
      description: milestone.description || '',
      dueDate: milestone.dueDate ? milestone.dueDate.split('T')[0] : '',
      percentage: '',
    });
    setDeleteConfirmId(null);
  };

  // Check if today falls between any milestone dates
  const todayMarkerIndex = useMemo(() => {
    if (!data) return -1;
    const today = new Date();
    const sortedMilestones = [...data.milestones].sort((a, b) => {
      const dA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return dA - dB;
    });

    for (let i = 0; i < sortedMilestones.length - 1; i++) {
      const startDate = sortedMilestones[i].dueDate ? new Date(sortedMilestones[i].dueDate) : null;
      const endDate = sortedMilestones[i + 1].dueDate ? new Date(sortedMilestones[i + 1].dueDate) : null;
      if (startDate && endDate && today >= startDate && today <= endDate) {
        return sortedMilestones.indexOf(sortedMilestones[i]) + 0.5;
      }
    }
    // Before first milestone
    if (sortedMilestones.length > 0 && sortedMilestones[0].dueDate) {
      if (today < new Date(sortedMilestones[0].dueDate)) return -0.5;
    }
    return -1;
  }, [data]);

  // ─── Milestone Form Component ────────────────────────────
  const MilestoneForm = ({
    form,
    setForm,
    onSubmit,
    loading,
    submitLabel,
    onCancel,
  }: {
    form: MilestoneFormData;
    setForm: (f: MilestoneFormData) => void;
    onSubmit: () => void;
    loading: boolean;
    submitLabel: string;
    onCancel?: () => void;
  }) => (
    <div className="space-y-3 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 shadow-sm">
      <div>
        <Label htmlFor={submitLabel}>Judul Milestone *</Label>
        <Input
          id={submitLabel}
          placeholder="Contoh: Pondasi & Struktur"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label>Deskripsi</Label>
        <Textarea
          placeholder="Detail milestone..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="mt-1.5 resize-none"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tenggat Waktu</Label>
          <Input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Persentase (%)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            placeholder="25"
            value={form.percentage}
            onChange={(e) => setForm({ ...form, percentage: e.target.value })}
            className="mt-1.5"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm"
          onClick={onSubmit}
          disabled={loading || !form.title.trim()}
        >
          {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" /> Batal
          </Button>
        )}
      </div>
    </div>
  );

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
          <p className="text-slate-500 max-w-md mx-auto mb-4">
            Timeline akan muncul setelah milestone proyek ditambahkan
          </p>
          <Button
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> Tambah Milestone Pertama
          </Button>

          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 text-left"
              >
                <MilestoneForm
                  form={addForm}
                  setForm={setAddForm}
                  onSubmit={handleCreateMilestone}
                  loading={addFormLoading}
                  submitLabel="Tambah"
                  onCancel={() => setShowAddForm(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    );
  }

  const progressColor =
    data.progress >= 75 ? 'text-emerald-600' :
    data.progress >= 50 ? 'text-primary' :
    data.progress >= 25 ? 'text-amber-600' :
    'text-slate-500';

  const progressGradient =
    data.progress >= 75 ? 'from-emerald-500 to-teal-500' :
    data.progress >= 50 ? 'from-primary to-teal-500' :
    data.progress >= 25 ? 'from-amber-500 to-yellow-500' :
    'from-slate-400 to-slate-500';

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              Timeline Proyek
            </CardTitle>
            <CardDescription className="mt-1">
              {data.completedMilestones} dari {data.totalMilestones} milestone selesai
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('vertical')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'vertical' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <AlignJustify className="h-3.5 w-3.5" />
                Vertikal
              </button>
              <button
                onClick={() => setViewMode('horizontal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'horizontal' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <LayoutList className="h-3.5 w-3.5" />
                Horizontal
              </button>
            </div>
            {/* Zoom Controls */}
            {viewMode === 'horizontal' && (
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setZoomLevel('compact')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    zoomLevel === 'compact' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel('normal')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    zoomLevel === 'normal' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setZoomLevel('expanded')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    zoomLevel === 'expanded' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <Button
              size="sm"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm h-8"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> Tambah
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Add Milestone Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <MilestoneForm
                form={addForm}
                setForm={setAddForm}
                onSubmit={handleCreateMilestone}
                loading={addFormLoading}
                submitLabel="Tambah Milestone"
                onCancel={() => { setShowAddForm(false); setAddForm(emptyForm); }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overall Progress */}
        <div className="mb-8 p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Progress Keseluruhan</span>
            <span className={`text-2xl font-bold ${progressColor}`}>{data.progress}%</span>
          </div>
          <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${progressGradient} rounded-full`}
            />
          </div>
          <div className="flex justify-between mt-2.5 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> {data.completedMilestones} selesai
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" /> {data.inProgressMilestones} berjalan
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-slate-300" /> {data.pendingMilestones} menunggu
            </span>
          </div>
        </div>

        {/* VERTICAL TIMELINE VIEW */}
        {viewMode === 'vertical' && (
          <motion.div
            key="vertical"
            className="relative"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Vertical line */}
            <div className="absolute left-[19px] md:left-[23px] top-2 bottom-2 w-0.5 bg-slate-200" />

            <div className="space-y-4">
              {data.milestones.map((milestone, index) => {
                const overdue = isOverdue(milestone);
                const effectiveStatus = overdue ? 'OVERDUE' : milestone.status;
                const config = statusConfig[effectiveStatus] || statusConfig.PENDING;
                const StatusIcon = config.icon;
                const isLast = index === data.milestones.length - 1;
                const isExpanded = expandedMilestones.has(milestone.id);
                const isEditing = editingId === milestone.id;
                const milestoneProgress = milestone.status === 'COMPLETED' ? 100
                  : milestone.status === 'IN_PROGRESS' ? (milestone.progress ?? 50)
                  : 0;
                const isToday = todayMarkerIndex === index;

                return (
                  <motion.div
                    key={milestone.id}
                    variants={itemVariants}
                    className="relative flex gap-4 md:gap-6"
                  >
                    {/* Timeline dot and line */}
                    <div className="relative flex flex-col items-center z-10">
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br ${config.gradientBg} border-2 ${config.borderColor} flex items-center justify-center shadow-md ${
                        milestone.status === 'IN_PROGRESS' ? 'animate-pulse' : ''
                      }`}>
                        <StatusIcon className={`h-4 w-4 md:h-5 md:w-5 text-white`} />
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 flex-1 mt-1 ${
                          milestone.status === 'COMPLETED'
                            ? 'bg-emerald-300'
                            : milestone.status === 'IN_PROGRESS'
                              ? 'border-l-2 border-dashed border-primary/40'
                              : overdue
                                ? 'border-l-2 border-dashed border-red-300'
                                : 'border-l-2 border-dashed border-slate-200'
                        }`} style={{ minHeight: '24px' }} />
                      )}
                    </div>

                    {/* Today marker */}
                    {isToday && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute left-0 top-0 flex items-center z-20"
                      >
                        <div className="relative ml-[-30px] md:ml-[-36px]">
                          <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30 w-4 h-4" />
                          <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow-md" />
                        </div>
                      </motion.div>
                    )}

                    {/* Content */}
                    <div className="flex-1 pb-2 -mt-1">
                      <div className={`bg-white border rounded-xl hover:shadow-md transition-all duration-300 overflow-hidden ${
                        milestone.status === 'IN_PROGRESS' ? 'border-primary/30 shadow-sm' : ''
                      }`}>
                        {/* Main content */}
                        <div className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                #{milestone.order + 1}
                              </span>
                              <h4 className={`font-semibold text-sm ${
                                milestone.status === 'COMPLETED' ? 'text-slate-600' : 'text-slate-800'
                              }`}>
                                {milestone.title}
                              </h4>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-2 py-0 ${config.color} ${config.bgColor} border-0 font-semibold`}
                              >
                                {config.label}
                              </Badge>
                              {overdue && (
                                <Badge variant="destructive" className="text-[10px] px-2 py-0">
                                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                  Terlambat
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {milestone.status === 'PENDING' && (
                                <>
                                  <button
                                    className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                    onClick={() => startEdit(milestone)}
                                    title="Edit milestone"
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
                                  </button>
                                  <button
                                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                    onClick={() => {
                                      setDeleteConfirmId(milestone.id);
                                      setEditingId(null);
                                    }}
                                    title="Hapus milestone"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
                                  </button>
                                </>
                              )}
                              {milestone.amount && milestone.amount > 0 && (
                                <span className="text-xs font-semibold text-primary whitespace-nowrap">
                                  {formatRupiah(milestone.amount)}
                                </span>
                              )}
                              {milestone.paymentStatus && (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-2 py-0 ${
                                    milestone.paymentStatus === 'PAID'
                                      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                                      : milestone.paymentStatus === 'PENDING'
                                        ? 'text-amber-600 bg-amber-50 border-amber-200'
                                        : 'text-slate-500 bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <DollarSign className="h-2.5 w-2.5 mr-0.5" />
                                  {milestone.paymentStatus === 'PAID' ? 'Dibayar' : milestone.paymentStatus === 'PENDING' ? 'Belum Bayar' : milestone.paymentStatus}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Progress bar */}
                          {(milestone.status === 'IN_PROGRESS' || milestone.status === 'COMPLETED') && (
                            <div className="mb-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-slate-400">Progress</span>
                                <span className={`text-[10px] font-bold ${
                                  milestoneProgress >= 100 ? 'text-emerald-600' :
                                  milestoneProgress >= 50 ? 'text-primary' :
                                  'text-slate-500'
                                }`}>{milestoneProgress}%</span>
                              </div>
                              <Progress value={milestoneProgress} className="h-1.5" />
                            </div>
                          )}

                          {/* Dates */}
                          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                            {milestone.dueDate && (
                              <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : ''}`}>
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

                          {/* Edit Form */}
                          <AnimatePresence>
                            {isEditing && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 overflow-hidden"
                              >
                                <MilestoneForm
                                  form={editForm}
                                  setForm={setEditForm}
                                  onSubmit={handleUpdateMilestone}
                                  loading={editFormLoading}
                                  submitLabel="Simpan"
                                  onCancel={() => { setEditingId(null); setEditForm(emptyForm); }}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Delete Confirmation */}
                          <AnimatePresence>
                            {deleteConfirmId === milestone.id && !isEditing && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 overflow-hidden"
                              >
                                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                                  <p className="text-sm text-red-700">Hapus milestone ini?</p>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="h-7 text-xs"
                                      onClick={() => handleDeleteMilestone(milestone.id)}
                                    >
                                      <Trash2 className="h-3 w-3 mr-1" /> Hapus
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs"
                                      onClick={() => setDeleteConfirmId(null)}
                                    >
                                      Batal
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Expand button */}
                          {(milestone.description || milestone.amount) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 h-7 text-xs text-slate-500 hover:text-slate-700 p-0"
                              onClick={() => toggleExpand(milestone.id)}
                            >
                              {isExpanded ? (
                                <><ChevronUp className="h-3 w-3 mr-1" /> Sembunyikan Detail</>
                              ) : (
                                <><ChevronDown className="h-3 w-3 mr-1" /> Lihat Detail</>
                              )}
                            </Button>
                          )}
                        </div>

                        {/* Expandable detail section */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-0">
                                <div className="border-t pt-3 space-y-3">
                                  {milestone.description && (
                                    <div>
                                      <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                                        <FileText className="h-3 w-3" /> Deskripsi
                                      </p>
                                      <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                        {milestone.description}
                                      </p>
                                    </div>
                                  )}
                                  {milestone.amount && milestone.amount > 0 && (
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="bg-slate-50 p-3 rounded-lg">
                                        <p className="text-xs text-slate-500">Nilai Milestone</p>
                                        <p className="text-sm font-bold text-slate-800">{formatRupiah(milestone.amount)}</p>
                                      </div>
                                      <div className="bg-slate-50 p-3 rounded-lg">
                                        <p className="text-xs text-slate-500">Status Pembayaran</p>
                                        <p className={`text-sm font-bold ${
                                          milestone.paymentStatus === 'PAID' ? 'text-emerald-600' :
                                          milestone.paymentStatus === 'PENDING' ? 'text-amber-600' :
                                          'text-slate-500'
                                        }`}>
                                          {milestone.paymentStatus === 'PAID' ? 'Sudah Dibayar' :
                                           milestone.paymentStatus === 'PENDING' ? 'Belum Dibayar' :
                                           milestone.paymentStatus || 'N/A'}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  {milestone.dependencies && milestone.dependencies.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                                        <ArrowRight className="h-3 w-3" /> Dependensi
                                      </p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {milestone.dependencies.map((depId) => {
                                          const depMilestone = data.milestones.find(m => m.id === depId);
                                          const depStatus = depMilestone ? (isOverdue(depMilestone) ? 'OVERDUE' : depMilestone.status) : 'PENDING';
                                          const depConfig = statusConfig[depStatus] || statusConfig.PENDING;
                                          return (
                                            <Badge key={depId} variant="outline" className={`text-[10px] ${depConfig.color} ${depConfig.bgColor} border-0`}>
                                              {depMilestone ? depMilestone.title : depId}
                                            </Badge>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* HORIZONTAL TIMELINE VIEW */}
        {viewMode === 'horizontal' && (
          <motion.div
            key="horizontal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="overflow-x-auto pb-4">
              <div className="flex items-start gap-0 min-w-max px-4 py-4">
                {data.milestones.map((milestone, index) => {
                  const overdue = isOverdue(milestone);
                  const effectiveStatus = overdue ? 'OVERDUE' : milestone.status;
                  const config = statusConfig[effectiveStatus] || statusConfig.PENDING;
                  const StatusIcon = config.icon;
                  const isLast = index === data.milestones.length - 1;
                  const isExpanded = expandedMilestones.has(milestone.id);
                  const milestoneProgress = milestone.status === 'COMPLETED' ? 100
                    : milestone.status === 'IN_PROGRESS' ? (milestone.progress ?? 50)
                    : 0;

                  const cardWidth = zoomLevel === 'compact' ? 'w-44' : zoomLevel === 'expanded' ? 'w-72' : 'w-56';

                  return (
                    <motion.div
                      key={milestone.id}
                      variants={horizontalItemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start"
                    >
                      {/* Node */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br ${config.gradientBg} border-2 ${config.borderColor} flex items-center justify-center shadow-md z-10 ${
                          milestone.status === 'IN_PROGRESS' ? 'animate-pulse' : ''
                        }`}>
                          <StatusIcon className="h-4 w-4 text-white" />
                        </div>
                        {/* Connecting line */}
                        {!isLast && (
                          <div className={`h-0.5 w-8 md:w-12 mt-5 ${
                            milestone.status === 'COMPLETED'
                              ? 'bg-gradient-to-r from-emerald-400 to-emerald-300'
                              : milestone.status === 'IN_PROGRESS'
                                ? 'bg-gradient-to-r from-primary/60 to-slate-200'
                                : overdue
                                  ? 'bg-gradient-to-r from-red-300 to-slate-200'
                                  : 'bg-slate-200'
                          }`} />
                        )}
                      </div>

                      {/* Card */}
                      <div className={`${cardWidth} mt-[-4px] ml-3 mb-4`}>
                        <div className={`rounded-xl border p-3 bg-white hover:shadow-md transition-all duration-300 cursor-pointer ${
                          milestone.status === 'IN_PROGRESS' ? 'border-primary/30 shadow-sm' : 'border-slate-100'
                        }`} onClick={() => toggleExpand(milestone.id)}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                              #{milestone.order + 1}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 ${config.color} ${config.bgColor} border-0 font-semibold`}
                            >
                              {config.label}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-xs text-slate-800 mb-1 line-clamp-2">{milestone.title}</h4>

                          {/* Progress */}
                          {(milestone.status === 'IN_PROGRESS' || milestone.status === 'COMPLETED') && (
                            <div className="mb-2">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[9px] text-slate-400">Progress</span>
                                <span className={`text-[9px] font-bold ${
                                  milestoneProgress >= 100 ? 'text-emerald-600' :
                                  milestoneProgress >= 50 ? 'text-primary' :
                                  'text-slate-500'
                                }`}>{milestoneProgress}%</span>
                              </div>
                              <Progress value={milestoneProgress} className="h-1" />
                            </div>
                          )}

                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar className="h-2.5 w-2.5" />
                            {milestone.dueDate ? formatDate(milestone.dueDate) : 'Tanpa tenggat'}
                          </div>

                          {milestone.amount && milestone.amount > 0 && (
                            <p className="text-[10px] font-semibold text-primary mt-1">
                              {formatRupiah(milestone.amount)}
                            </p>
                          )}
                        </div>

                        {/* Expanded details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden mt-2"
                            >
                              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-2">
                                {milestone.description && (
                                  <p className="text-[11px] text-slate-600">{milestone.description}</p>
                                )}
                                {overdue && (
                                  <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                                    <AlertTriangle className="h-2 w-2 mr-0.5" /> Terlambat
                                  </Badge>
                                )}
                                {milestone.paymentStatus && (
                                  <p className={`text-[10px] font-semibold ${
                                    milestone.paymentStatus === 'PAID' ? 'text-emerald-600' :
                                    milestone.paymentStatus === 'PENDING' ? 'text-amber-600' :
                                    'text-slate-500'
                                  }`}>
                                    {milestone.paymentStatus === 'PAID' ? '✓ Sudah Dibayar' :
                                     milestone.paymentStatus === 'PENDING' ? '⏳ Belum Dibayar' :
                                     milestone.paymentStatus}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Today marker bar for horizontal */}
            <div className="mx-4 mt-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30" />
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              </div>
              <span className="text-xs font-medium text-primary">Hari ini</span>
              <span className="text-[10px] text-slate-500">— {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
