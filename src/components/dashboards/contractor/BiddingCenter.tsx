'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Button, Input, Label, Textarea, Badge, Tabs, TabsContent,
  TabsList, TabsTrigger, Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue, Separator, Popover, PopoverTrigger,
  PopoverContent, Slider, AlertDialog, AlertDialogAction,
  AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, Skeleton,
} from '@/components/ui';
import {
  Search, MapPin, Clock, Briefcase, FileText, Send, Sparkles,
  ChevronRight, ChevronLeft, Users, CalendarDays, ArrowUpDown,
  Filter, X, Save, Loader2, AlertTriangle, CheckCircle2,
  CircleDot, XCircle, RotateCcw, Eye, TrendingDown, TrendingUp,
  Gavel, Building2, Shield, BadgeCheck, Target, Zap, Brain,
  Star, ArrowDown, ArrowUp, BarChart3, MessageSquareText,
  Lightbulb, Trash2, ExternalLink, RefreshCw, Bookmark,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRupiah, formatDate, getRelativeTime, getStatusColor, getStatusLabel } from '@/lib/helpers';
import { toast } from 'sonner';

// ============================================================
// Types
// ============================================================

interface BiddingCenterProps {
  userId: string;
  contractorId: string;
  onBidSubmitted?: () => void;
}

interface AvailableProject {
  id: string;
  title: string;
  category: string;
  location: string;
  budget: number;
  duration?: number;
  bidCount: number;
  hasBid: boolean;
  description?: string;
  deadline?: string;
  requirements?: string;
  createdAt?: string;
  owner: {
    id?: string;
    name: string;
    company?: string;
    isVerified?: boolean;
  };
}

interface MyBid {
  id: string;
  projectId: string;
  projectTitle: string;
  projectCategory: string;
  projectBudget: number;
  projectLocation: string;
  price: number;
  duration: number;
  proposal: string;
  notes?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'DRAFT';
  startDate?: string;
  createdAt: string;
  updatedAt?: string;
  ownerName?: string;
  ownerCompany?: string;
}

interface BidStats {
  totalBids: number;
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
}

interface AISuggestion {
  suggestedPrice: string;
  suggestedDuration: string;
  proposalOutline: string;
  keyPoints: string[];
  confidence: number;
}

interface BidFormData {
  price: string;
  duration: string;
  startDate: string;
  proposal: string;
  notes: string;
}

// ============================================================
// Constants
// ============================================================

const CATEGORY_CONFIG: Record<string, {
  emoji: string;
  gradient: string;
  badge: string;
  bg: string;
}> = {
  'Pembangunan Baru': {
    emoji: '🏗️',
    gradient: 'from-teal-600 to-cyan-600',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    bg: 'bg-teal-50/50',
  },
  'Renovasi': {
    emoji: '🔨',
    gradient: 'from-amber-500 to-orange-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    bg: 'bg-amber-50/50',
  },
  'Interior': {
    emoji: '🎨',
    gradient: 'from-violet-500 to-purple-500',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    bg: 'bg-violet-50/50',
  },
  'Konstruksi': {
    emoji: '🏗️',
    gradient: 'from-emerald-500 to-green-600',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bg: 'bg-emerald-50/50',
  },
  'MEP': {
    emoji: '⚡',
    gradient: 'from-orange-500 to-red-500',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    bg: 'bg-orange-50/50',
  },
  'Lainnya': {
    emoji: '📋',
    gradient: 'from-slate-400 to-slate-500',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    bg: 'bg-slate-50/50',
  },
};

const CATEGORY_PILLS = [
  'Semua', 'Pembangunan Baru', 'Renovasi', 'Interior', 'Konstruksi', 'MEP',
];

const BUDGET_FILTERS = [
  { value: 'all', label: 'Semua Budget' },
  { value: 'low', label: '< 100 Juta' },
  { value: 'mid', label: '100-500 Juta' },
  { value: 'high', label: '> 500 Juta' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'budget_high', label: 'Budget Tertinggi' },
  { value: 'deadline', label: 'Deadline Terdekat' },
  { value: 'bid_count', label: 'Paling Sedikit Bid' },
];

const PROPOSAL_HINTS = [
  'Pendekatan & Metodologi',
  'Tim & SDM',
  'Jadwal Pelaksanaan',
  'Material & Peralatan',
  'Jaminan Kualitas',
];

const EMPTY_FORM: BidFormData = {
  price: '',
  duration: '',
  startDate: '',
  proposal: '',
  notes: '',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ============================================================
// Helpers
// ============================================================

function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG['Lainnya'];
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'ACCEPTED':
      return { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2, label: 'Diterima' };
    case 'PENDING':
      return { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: CircleDot, label: 'Pending' };
    case 'REJECTED':
      return { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Ditolak' };
    case 'WITHDRAWN':
      return { color: 'bg-slate-100 text-slate-500 border-slate-200', icon: RotateCcw, label: 'Ditarik' };
    case 'DRAFT':
      return { color: 'bg-blue-100 text-blue-600 border-blue-200', icon: FileText, label: 'Draf' };
    default:
      return { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: CircleDot, label: status };
  }
}

function parseRupiahToNumber(value: string): number {
  const cleaned = value.replace(/[^0-9]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

function formatNumberInput(value: string): string {
  const num = parseRupiahToNumber(value);
  return num > 0 ? num.toLocaleString('id-ID') : '';
}

function isNewProject(createdAt?: string): boolean {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================================
// Main Component
// ============================================================

export function BiddingCenter({ userId, contractorId, onBidSubmitted }: BiddingCenterProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'mybids'>('search');

  // --- Search / Project Discovery State ---
  const [projects, setProjects] = useState<AvailableProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [filterBudget, setFilterBudget] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedProject, setSelectedProject] = useState<AvailableProject | null>(null);

  // --- Bid Form State ---
  const [bidForm, setBidForm] = useState<BidFormData>(EMPTY_FORM);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // --- AI Assistant State ---
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);

  // --- Bid Statistics State ---
  const [bidStats, setBidStats] = useState<BidStats | null>(null);

  // --- My Bids State ---
  const [myBids, setMyBids] = useState<MyBid[]>([]);
  const [loadingBids, setLoadingBids] = useState(true);
  const [bidFilter, setBidFilter] = useState('all');
  const [selectedBidDetail, setSelectedBidDetail] = useState<MyBid | null>(null);
  const [withdrawDialogBid, setWithdrawDialogBid] = useState<MyBid | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  // --- Mobile sidebar state ---
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // --- Refs ---
  const proposalRef = useRef<HTMLTextAreaElement>(null);

  // ============================================================
  // Fetch available projects
  // ============================================================
  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch('/api/projects?status=OPEN&limit=50');
      const data = await res.json();

      let existingBidIds = new Set<string>();
      try {
        const bidsRes = await fetch(`/api/bids?contractorId=${contractorId}&limit=200`);
        const bidsData = await bidsRes.json();
        if (bidsData.bids) {
          existingBidIds = new Set(bidsData.bids.map((b: { projectId: string }) => b.projectId));
        }
      } catch { /* ignore */ }

      if (data.projects) {
        setProjects(data.projects.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          title: p.title as string,
          category: p.category as string,
          location: p.location as string,
          budget: p.budget as number,
          duration: p.duration as number | undefined,
          bidCount: p.bidCount as number || 0,
          hasBid: existingBidIds.has(p.id as string),
          description: p.description as string | undefined,
          deadline: p.endDate as string | undefined,
          requirements: p.requirements as string | undefined,
          createdAt: p.createdAt as string | undefined,
          owner: {
            id: (p.owner as Record<string, unknown>)?.id as string | undefined,
            name: (p.owner as Record<string, unknown>)?.name as string || 'Pemilik Proyek',
            company: (p.owner as Record<string, unknown>)?.company as string | undefined,
            isVerified: (p.owner as Record<string, unknown>)?.isVerified as boolean | undefined,
          },
        })));
      }
    } catch (err) {
      console.error('Gagal memuat proyek:', err);
    } finally {
      setLoadingProjects(false);
    }
  }, [contractorId]);

  // ============================================================
  // Fetch my bids
  // ============================================================
  const fetchMyBids = useCallback(async () => {
    setLoadingBids(true);
    try {
      const res = await fetch(`/api/bids?contractorId=${contractorId}&limit=50`);
      const data = await res.json();
      if (data.bids) {
        setMyBids(data.bids.map((b: Record<string, unknown>) => ({
          id: b.id as string,
          projectId: b.projectId as string,
          projectTitle: (b.project as Record<string, unknown>)?.title as string || 'Proyek Tidak Diketahui',
          projectCategory: (b.project as Record<string, unknown>)?.category as string || '',
          projectBudget: (b.project as Record<string, unknown>)?.budget as number || 0,
          projectLocation: (b.project as Record<string, unknown>)?.location as string || '',
          price: b.price as number,
          duration: b.duration as number,
          proposal: b.proposal as string || '',
          notes: (b as Record<string, unknown>).notes as string | undefined,
          status: b.status as MyBid['status'],
          startDate: b.startDate as string | undefined,
          createdAt: b.createdAt as string,
          updatedAt: b.updatedAt as string | undefined,
          ownerName: (b.project as Record<string, Record<string, unknown>>)?.owner?.name as string | undefined,
          ownerCompany: (b.project as Record<string, Record<string, unknown>>)?.owner?.company as string | undefined,
        })));
      }
    } catch (err) {
      console.error('Gagal memuat penawaran:', err);
    } finally {
      setLoadingBids(false);
    }
  }, [contractorId]);

  useEffect(() => {
    fetchProjects();
    fetchMyBids();
  }, [fetchProjects, fetchMyBids]);

  // ============================================================
  // Filtered projects
  // ============================================================
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (filterCategory !== 'Semua') {
      result = result.filter(p => p.category === filterCategory);
    }

    if (filterBudget !== 'all') {
      result = result.filter(p => {
        switch (filterBudget) {
          case 'low': return p.budget < 100_000_000;
          case 'mid': return p.budget >= 100_000_000 && p.budget <= 500_000_000;
          case 'high': return p.budget > 500_000_000;
          default: return true;
        }
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'budget_high':
        result.sort((a, b) => b.budget - a.budget);
        break;
      case 'deadline':
        result.sort((a, b) => {
          const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          return da - db;
        });
        break;
      case 'bid_count':
        result.sort((a, b) => a.bidCount - b.bidCount);
        break;
      default:
        break;
    }

    return result;
  }, [projects, filterCategory, filterBudget, searchQuery, sortBy]);

  // ============================================================
  // Filtered my bids
  // ============================================================
  const filteredMyBids = useMemo(() => {
    if (bidFilter === 'all') return myBids;
    return myBids.filter(b => b.status === bidFilter);
  }, [myBids, bidFilter]);

  // ============================================================
  // Selected project → load bid stats
  // ============================================================
  useEffect(() => {
    if (!selectedProject) {
      setBidStats(null);
      setAiSuggestion(null);
      return;
    }
    // Derive bid stats from project budget and bid count
    setBidStats({
      totalBids: selectedProject.bidCount,
      averagePrice: Math.round(selectedProject.budget * 0.85),
      lowestPrice: Math.round(selectedProject.budget * 0.7),
      highestPrice: Math.round(selectedProject.budget * 1.1),
    });
  }, [selectedProject]);

  // ============================================================
  // Handle project selection
  // ============================================================
  const handleSelectProject = useCallback((project: AvailableProject) => {
    setSelectedProject(project);
    setAiSuggestion(null);
    setBidForm(EMPTY_FORM);
    setSidebarOpen(false);
  }, []);

  // ============================================================
  // AI Bid Assistant
  // ============================================================
  const handleGetAISuggestion = useCallback(async () => {
    if (!selectedProject) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/bid-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject.id,
          contractorId: contractorId,
          projectBudget: selectedProject.budget,
          projectDescription: selectedProject.description || selectedProject.title,
          projectRequirements: selectedProject.requirements || selectedProject.category,
          contractorExperience: 3,
        }),
      });
      const data = await res.json();
      if (data.success && data.recommendation) {
        const rec = data.recommendation;
        setAiSuggestion({
          suggestedPrice: rec.suggestedPrice || '',
          suggestedDuration: rec.suggestedDuration || '',
          proposalOutline: rec.proposalTemplate || '',
          keyPoints: rec.keyPoints || [],
          confidence: 80,
        });
        toast.success('Rekomendasi AI berhasil didapatkan!');
      } else {
        toast.error(data.error || 'Gagal mendapatkan rekomendasi AI');
      }
    } catch {
      toast.error('Gagal mendapatkan rekomendasi AI');
    } finally {
      setAiLoading(false);
    }
  }, [selectedProject, contractorId]);

  // ============================================================
  // Apply AI suggestion to form
  // ============================================================
  const handleApplyAISuggestion = useCallback(() => {
    if (!aiSuggestion) return;
    const priceNum = parseRupiahToNumber(aiSuggestion.suggestedPrice);
    const durationMatch = aiSuggestion.suggestedDuration.match(/(\d+)/);
    setBidForm(prev => ({
      ...prev,
      price: priceNum > 0 ? priceNum.toLocaleString('id-ID') : '',
      duration: durationMatch ? durationMatch[1] : '',
      proposal: aiSuggestion.proposalOutline,
    }));
    toast.success('Rekomendasi AI diterapkan ke formulir');
  }, [aiSuggestion]);

  // ============================================================
  // Submit bid
  // ============================================================
  const handleSubmitBid = useCallback(async () => {
    if (!selectedProject) return;

    const price = parseRupiahToNumber(bidForm.price);
    const duration = parseInt(bidForm.duration, 10);

    if (!price || price <= 0) {
      toast.error('Masukkan harga penawaran yang valid');
      return;
    }
    if (!duration || duration <= 0) {
      toast.error('Masukkan durasi pengerjaan yang valid');
      return;
    }
    if (!bidForm.proposal.trim()) {
      toast.error('Masukkan proposal/deskripsi penawaran');
      return;
    }

    setSubmittingBid(true);
    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject.id,
          contractorId: contractorId,
          proposal: bidForm.proposal.trim(),
          price,
          duration,
          startDate: bidForm.startDate || undefined,
          notes: bidForm.notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Penawaran berhasil dikirim!');
        setShowConfirmDialog(false);
        setSelectedProject(null);
        setBidForm(EMPTY_FORM);
        setAiSuggestion(null);
        onBidSubmitted?.();
        fetchProjects();
        fetchMyBids();
      } else {
        toast.error(data.error || 'Gagal mengirim penawaran');
      }
    } catch {
      toast.error('Terjadi kesalahan saat mengirim penawaran');
    } finally {
      setSubmittingBid(false);
    }
  }, [selectedProject, bidForm, contractorId, onBidSubmitted, fetchProjects, fetchMyBids]);

  // ============================================================
  // Save as draft
  // ============================================================
  const handleSaveDraft = useCallback(async () => {
    if (!selectedProject) return;
    setSavingDraft(true);
    try {
      const price = parseRupiahToNumber(bidForm.price);
      const duration = parseInt(bidForm.duration, 10);
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject.id,
          contractorId: contractorId,
          proposal: bidForm.proposal.trim() || 'Draf penawaran',
          price: price > 0 ? price : 0,
          duration: duration > 0 ? duration : 0,
          startDate: bidForm.startDate || undefined,
          notes: bidForm.notes.trim() || undefined,
          status: 'DRAFT',
        }),
      });
      const data = await res.json();
      if (data.success || data.id) {
        toast.success('Draf berhasil disimpan!');
        fetchMyBids();
      } else {
        toast.error(data.error || 'Gagal menyimpan draf');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setSavingDraft(false);
    }
  }, [selectedProject, bidForm, contractorId, fetchMyBids]);

  // ============================================================
  // Withdraw bid
  // ============================================================
  const handleWithdrawBid = useCallback(async () => {
    if (!withdrawDialogBid) return;
    setWithdrawing(true);
    try {
      const res = await fetch(`/api/bids?id=${withdrawDialogBid.id}&contractorId=${contractorId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Penawaran berhasil ditarik');
        setWithdrawDialogBid(null);
        fetchMyBids();
        fetchProjects();
      } else {
        toast.error(data.error || 'Gagal menarik penawaran');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setWithdrawing(false);
    }
  }, [withdrawDialogBid, contractorId, fetchMyBids, fetchProjects]);

  // ============================================================
  // Budget percentage helper
  // ============================================================
  const budgetPercentage = useMemo(() => {
    if (!selectedProject) return 0;
    const price = parseRupiahToNumber(bidForm.price);
    if (price <= 0) return 0;
    return Math.round((price / selectedProject.budget) * 100);
  }, [selectedProject, bidForm.price]);

  const budgetBarColor = useMemo(() => {
    if (budgetPercentage <= 80) return 'bg-green-500';
    if (budgetPercentage <= 100) return 'bg-amber-500';
    return 'bg-red-500';
  }, [budgetPercentage]);

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Tab Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'search' | 'mybids')}>
            <TabsList className="bg-transparent border-0 h-14 p-0 gap-1">
              <TabsTrigger
                value="search"
                className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:text-slate-500 data-[state=inactive]:bg-transparent data-[state=inactive]:hover:bg-slate-100 gap-2 transition-all"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Cari Proyek</span>
              </TabsTrigger>
              <TabsTrigger
                value="mybids"
                className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:text-slate-500 data-[state=inactive]:bg-transparent data-[state=inactive]:hover:bg-slate-100 gap-2 transition-all"
              >
                <Gavel className="h-4 w-4" />
                <span className="hidden sm:inline">Penawaran Saya</span>
                {myBids.filter(b => b.status === 'PENDING').length > 0 && (
                  <span className="h-5 min-w-[20px] flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold px-1.5">
                    {myBids.filter(b => b.status === 'PENDING').length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'search' ? (
          <motion.div
            key="search"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Project Discovery View */}
            <div className="max-w-7xl mx-auto px-4 py-6">
              {/* Mobile: project selected overlay */}
              {selectedProject && (
                <div className="lg:hidden mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSelectedProject(null); setSidebarOpen(true); }}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Kembali ke Daftar Proyek
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ============================= */}
                {/* LEFT SIDEBAR: Project List     */}
                {/* ============================= */}
                <div className={`lg:col-span-4 xl:col-span-3 ${selectedProject ? 'hidden lg:block' : ''}`}>
                  <div className="sticky top-20 space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Cari proyek..."
                        className="pl-10 h-10 border-slate-200 focus-visible:ring-primary/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Category Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORY_PILLS.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setFilterCategory(cat)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                            filterCategory === cat
                              ? 'bg-primary text-white shadow-sm shadow-primary/25'
                              : 'bg-white text-slate-500 border border-slate-200 hover:border-primary/30 hover:text-primary'
                          }`}
                        >
                          {cat !== 'Semua' && getCategoryConfig(cat).emoji} {cat}
                        </button>
                      ))}
                    </div>

                    {/* Budget Quick Filters + Sort Row */}
                    <div className="flex gap-2">
                      <Select value={filterBudget} onValueChange={setFilterBudget}>
                        <SelectTrigger className="h-9 text-xs flex-1">
                          <Wallet className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BUDGET_FILTERS.map(f => (
                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="h-9 text-xs flex-1">
                          <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SORT_OPTIONS.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Results count */}
                    <div className="flex items-center justify-between px-1">
                      <p className="text-xs text-slate-400">
                        {filteredProjects.length} proyek ditemukan
                      </p>
                      <button
                        onClick={fetchProjects}
                        className="text-xs text-slate-400 hover:text-primary flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Refresh
                      </button>
                    </div>

                    {/* Project List */}
                    <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto pr-1 custom-scrollbar">
                      {loadingProjects ? (
                        <div className="space-y-3">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i} className="p-3">
                              <Skeleton className="h-4 w-3/4 mb-2" />
                              <Skeleton className="h-3 w-1/2 mb-1.5" />
                              <Skeleton className="h-3 w-1/3" />
                            </Card>
                          ))}
                        </div>
                      ) : filteredProjects.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-12 px-4"
                        >
                          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <Search className="h-8 w-8 text-slate-300" />
                          </div>
                          <p className="font-medium text-slate-500 mb-1">Tidak ada proyek ditemukan</p>
                          <p className="text-xs text-slate-400">Coba ubah filter pencarian Anda</p>
                        </motion.div>
                      ) : (
                        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-2">
                          {filteredProjects.map(project => {
                            const config = getCategoryConfig(project.category);
                            const isSelected = selectedProject?.id === project.id;
                            return (
                              <motion.div key={project.id} variants={itemVariants}>
                                <button
                                  onClick={() => handleSelectProject(project)}
                                  className={`w-full text-left rounded-xl border p-3 transition-all duration-200 group ${
                                    isSelected
                                      ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                                      : 'border-slate-100 bg-white hover:border-primary/30 hover:shadow-md'
                                  }`}
                                >
                                  {/* Category + New badge row */}
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${config.badge}`}>
                                      {config.emoji} {project.category}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      {isNewProject(project.createdAt) && (
                                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">BARU</span>
                                      )}
                                      {project.hasBid && (
                                        <span className="text-[9px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                          <CheckCircle2 className="h-2.5 w-2.5" /> Sudah Bid
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Title */}
                                  <h4 className={`text-sm font-semibold mb-1.5 line-clamp-2 leading-snug ${
                                    isSelected ? 'text-primary' : 'text-slate-700 group-hover:text-primary'
                                  } transition-colors`}>
                                    {project.title}
                                  </h4>

                                  {/* Budget */}
                                  <p className="text-sm font-bold text-primary mb-2">
                                    {formatRupiah(project.budget)}
                                  </p>

                                  {/* Meta row */}
                                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" /> {project.location}
                                    </span>
                                    {project.duration && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {project.duration}h
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" /> {project.bidCount}
                                    </span>
                                  </div>
                                </button>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ============================= */}
                {/* RIGHT PANEL: Detail & Bid Form */}
                {/* ============================= */}
                <div className={`lg:col-span-8 xl:col-span-9 ${!selectedProject ? 'hidden lg:block' : ''}`}>
                  {!selectedProject ? (
                    /* Empty / No Project Selected State */
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center py-32 text-center"
                    >
                      <div className="w-24 h-24 mb-6 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <Gavel className="h-12 w-12 text-primary/40" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-700 mb-2">Pilih Proyek untuk Menawar</h3>
                      <p className="text-sm text-slate-400 max-w-md">
                        Pilih proyek dari daftar di sebelah kiri untuk melihat detail lengkap dan mengajukan penawaran Anda
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={selectedProject.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      {/* --- PROJECT INFO SECTION --- */}
                      <Card className="overflow-hidden border-slate-200">
                        <div className={`h-1.5 bg-gradient-to-r ${getCategoryConfig(selectedProject.category).gradient}`} />
                        <CardHeader className="pb-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getCategoryConfig(selectedProject.category).badge}`}>
                                  {getCategoryConfig(selectedProject.category).emoji} {selectedProject.category}
                                </span>
                                {isNewProject(selectedProject.createdAt) && (
                                  <Badge className="bg-emerald-500 text-white text-[10px] px-2 py-0.5">
                                    BARU
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="text-xl leading-tight">{selectedProject.title}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs gap-1.5"
                                onClick={() => { setSelectedProject(null); setSidebarOpen(true); }}
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Kembali</span>
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-5">
                          {/* Quick Stats Row */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-primary/5 rounded-lg p-3">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Budget</p>
                              <p className="text-base font-bold text-primary mt-0.5">{formatRupiah(selectedProject.budget)}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Lokasi</p>
                              <p className="text-sm font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                {selectedProject.location}
                              </p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Durasi</p>
                              <p className="text-sm font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                {selectedProject.duration ? `${selectedProject.duration} hari` : '-'}
                              </p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Deadline</p>
                              <p className="text-sm font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                                {selectedProject.deadline
                                  ? formatDate(selectedProject.deadline)
                                  : '-'}
                              </p>
                            </div>
                          </div>

                          {/* Description */}
                          {selectedProject.description && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-700 mb-2">Deskripsi Proyek</h4>
                              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                {selectedProject.description}
                              </p>
                            </div>
                          )}

                          {/* Requirements */}
                          {selectedProject.requirements && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-700 mb-2">Persyaratan</h4>
                              <div className="bg-slate-50 rounded-lg p-3">
                                {selectedProject.requirements.split('\n').filter(Boolean).map((req, i) => (
                                  <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    <span>{req}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Owner Info */}
                          <div className="bg-gradient-to-r from-slate-50 to-slate-50/50 rounded-lg p-4 border border-slate-100">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">Pemilik Proyek</h4>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-800">{selectedProject.owner.name}</span>
                                  {selectedProject.owner.isVerified && (
                                    <BadgeCheck className="h-4 w-4 text-blue-500" />
                                  )}
                                </div>
                                {selectedProject.owner.company && (
                                  <p className="text-xs text-slate-500">{selectedProject.owner.company}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Bid Statistics */}
                          {bidStats && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-slate-400" />
                                Statistik Penawaran
                              </h4>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 rounded-lg p-3 text-center">
                                  <p className="text-lg font-bold text-slate-700">{bidStats.totalBids}</p>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Bid</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3 text-center">
                                  <p className="text-lg font-bold text-green-600">{formatRupiah(bidStats.lowestPrice)}</p>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Terendah</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3 text-center">
                                  <p className="text-lg font-bold text-slate-700">{formatRupiah(bidStats.averagePrice)}</p>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Rata-rata</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* --- AI BID ASSISTANT CARD --- */}
                      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/[0.02] to-purple-50/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-sm shadow-primary/20">
                                <Brain className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                  AI Bid Assistant
                                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                                </h4>
                                <p className="text-xs text-slate-500">Dapatkan rekomendasi harga & proposal dari AI</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-primary/30 text-primary hover:bg-primary/5 gap-1.5"
                              onClick={handleGetAISuggestion}
                              disabled={aiLoading || selectedProject.hasBid}
                            >
                              {aiLoading ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Menganalisis...
                                </>
                              ) : aiSuggestion ? (
                                <>
                                  <RefreshCw className="h-3.5 w-3.5" />
                                  Perbarui
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-3.5 w-3.5" />
                                  Dapatkan Saran
                                </>
                              )}
                            </Button>
                          </div>

                          {/* AI Suggestion Result */}
                          <AnimatePresence>
                            {aiSuggestion && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <Separator className="my-4" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                  <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
                                      <TrendingDown className="h-3 w-3 inline mr-1 text-green-500" />
                                      Harga Disarankan
                                    </p>
                                    <p className="text-lg font-bold text-green-600">{aiSuggestion.suggestedPrice}</p>
                                  </div>
                                  <div className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
                                      <Clock className="h-3 w-3 inline mr-1 text-blue-500" />
                                      Durasi Disarankan
                                    </p>
                                    <p className="text-lg font-bold text-blue-600">{aiSuggestion.suggestedDuration}</p>
                                  </div>
                                </div>

                                {/* Key Points */}
                                <div className="mb-3">
                                  <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                                    <Target className="h-3.5 w-3.5 text-primary" />
                                    Poin Keunggulan
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    {aiSuggestion.keyPoints.slice(0, 6).map((point, idx) => (
                                      <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                                        <Zap className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <span>{point}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Proposal Outline Preview */}
                                {aiSuggestion.proposalOutline && (
                                  <div className="bg-slate-50 rounded-lg p-3 mb-3">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1.5">
                                      Outline Proposal
                                    </p>
                                    <p className="text-xs text-slate-600 line-clamp-4">{aiSuggestion.proposalOutline}</p>
                                  </div>
                                )}

                                <Button
                                  size="sm"
                                  className="w-full bg-gradient-to-r from-primary to-purple-600 text-white hover:shadow-md transition-all gap-1.5"
                                  onClick={handleApplyAISuggestion}
                                >
                                  <Lightbulb className="h-3.5 w-3.5" />
                                  Terapkan ke Formulir
                                </Button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>

                      {/* --- BID FORM --- */}
                      {selectedProject.hasBid ? (
                        <Card className="border-slate-200">
                          <CardContent className="py-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center">
                              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-1">Sudah Menawar</h3>
                            <p className="text-sm text-slate-400">
                              Anda sudah mengajukan penawaran untuk proyek ini. Cek status di tab &quot;Penawaran Saya&quot;.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="border-slate-200">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Send className="h-5 w-5 text-primary" />
                              Formulir Penawaran
                            </CardTitle>
                            <CardDescription>
                              Isi formulir berikut dengan penawaran terbaik Anda
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-5">
                            {/* Harga Penawaran */}
                            <div className="space-y-2">
                              <Label htmlFor="bid-price" className="text-sm font-semibold text-slate-700">
                                Harga Penawaran <span className="text-red-500">*</span>
                              </Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">Rp</span>
                                <Input
                                  id="bid-price"
                                  placeholder="Contoh: 250.000.000"
                                  className="pl-10 h-11 text-base font-semibold tabular-nums"
                                  value={bidForm.price}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/[^0-9]/g, '');
                                    setBidForm(prev => ({
                                      ...prev,
                                      price: raw ? parseInt(raw, 10).toLocaleString('id-ID') : '',
                                    }));
                                  }}
                                />
                              </div>
                              {/* Budget comparison bar */}
                              {budgetPercentage > 0 && (
                                <div className="space-y-1.5 mt-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">
                                      {budgetPercentage}% dari budget proyek ({formatRupiah(selectedProject.budget)})
                                    </span>
                                    <span className={`font-semibold ${
                                      budgetPercentage <= 80 ? 'text-green-600' :
                                      budgetPercentage <= 100 ? 'text-amber-600' : 'text-red-600'
                                    }`}>
                                      {budgetPercentage <= 80 ? '💰 Kompetitif' :
                                       budgetPercentage <= 100 ? '⚠️ Sesuai' : '🚨 Di atas budget'}
                                    </span>
                                  </div>
                                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                      className={`h-full rounded-full ${budgetBarColor}`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                                      transition={{ duration: 0.5, ease: 'easeOut' }}
                                    />
                                  </div>
                                  {budgetPercentage > 100 && (
                                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      Harga Anda melebihi budget proyek
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Durasi & Tanggal Mulai row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="bid-duration" className="text-sm font-semibold text-slate-700">
                                  Durasi Pengerjaan (hari) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="bid-duration"
                                  type="number"
                                  placeholder="Contoh: 90"
                                  className="h-11"
                                  min={1}
                                  value={bidForm.duration}
                                  onChange={(e) => setBidForm(prev => ({ ...prev, duration: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="bid-start-date" className="text-sm font-semibold text-slate-700">
                                  Tanggal Mulai
                                </Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      id="bid-start-date"
                                      className="w-full h-11 justify-start text-left font-normal"
                                    >
                                      <CalendarDays className="mr-2 h-4 w-4 text-slate-400" />
                                      {bidForm.startDate
                                        ? formatDate(bidForm.startDate)
                                        : 'Pilih tanggal mulai...'}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <input
                                      type="date"
                                      className="w-full p-2"
                                      value={bidForm.startDate}
                                      onChange={(e) => setBidForm(prev => ({ ...prev, startDate: e.target.value }))}
                                      min={new Date().toISOString().split('T')[0]}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>

                            {/* Proposal */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="bid-proposal" className="text-sm font-semibold text-slate-700">
                                  Proposal / Deskripsi <span className="text-red-500">*</span>
                                </Label>
                                <span className={`text-xs ${bidForm.proposal.length > 2000 ? 'text-red-500' : 'text-slate-400'}`}>
                                  {bidForm.proposal.length} / 3000
                                </span>
                              </div>
                              <Textarea
                                ref={proposalRef}
                                id="bid-proposal"
                                placeholder={`Jelaskan pendekatan Anda untuk proyek ini...\n\nSaran bagian:\n• Pendekatan & Metodologi\n• Tim & SDM\n• Jadwal Pelaksanaan\n• Material & Peralatan\n• Jaminan Kualitas`}
                                className="min-h-[180px] max-h-[300px] resize-y text-sm leading-relaxed"
                                maxLength={3000}
                                value={bidForm.proposal}
                                onChange={(e) => setBidForm(prev => ({ ...prev, proposal: e.target.value }))}
                              />
                              {/* Suggested sections hints */}
                              <div className="flex flex-wrap gap-1.5">
                                {PROPOSAL_HINTS.map(hint => (
                                  <button
                                    key={hint}
                                    onClick={() => {
                                      const textarea = proposalRef.current;
                                      if (textarea) {
                                        const cursorPos = textarea.selectionStart;
                                        const before = bidForm.proposal.substring(0, cursorPos);
                                        const after = bidForm.proposal.substring(cursorPos);
                                        const insert = `\n## ${hint}\n`;
                                        setBidForm(prev => ({
                                          ...prev,
                                          proposal: before + insert + after,
                                        }));
                                        setTimeout(() => {
                                          textarea.focus();
                                          textarea.setSelectionRange(
                                            cursorPos + insert.length,
                                            cursorPos + insert.length
                                          );
                                        }, 0);
                                      }
                                    }}
                                    className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-500 hover:bg-primary/10 hover:text-primary transition-colors border border-slate-200 hover:border-primary/20"
                                  >
                                    + {hint}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Catatan Tambahan */}
                            <div className="space-y-2">
                              <Label htmlFor="bid-notes" className="text-sm font-semibold text-slate-700">
                                Catatan Tambahan <span className="text-slate-400 font-normal">(opsional)</span>
                              </Label>
                              <Textarea
                                id="bid-notes"
                                placeholder="Informasi tambahan yang ingin disampaikan..."
                                className="min-h-[80px] resize-y text-sm"
                                value={bidForm.notes}
                                onChange={(e) => setBidForm(prev => ({ ...prev, notes: e.target.value }))}
                              />
                            </div>

                            <Separator />

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3">
                              <Button
                                className="flex-1 bg-gradient-to-r from-primary to-teal-600 text-white hover:shadow-lg h-11 gap-2"
                                onClick={() => setShowConfirmDialog(true)}
                                disabled={submittingBid || savingDraft}
                              >
                                {submittingBid ? (
                                  <><Loader2 className="h-4 w-4 animate-spin" /> Mengirim...</>
                                ) : (
                                  <><Send className="h-4 w-4" /> Kirim Penawaran</>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                className="h-11 gap-2"
                                onClick={handleSaveDraft}
                                disabled={submittingBid || savingDraft}
                              >
                                {savingDraft ? (
                                  <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
                                ) : (
                                  <><Save className="h-4 w-4" /> Simpan Draf</>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="mybids"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* My Bids Tab */}
            <div className="max-w-7xl mx-auto px-4 py-6">
              {/* Header & Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    Penawaran Saya
                    <span className="text-sm font-normal text-slate-400">({myBids.length})</span>
                  </h3>
                  <p className="text-sm text-slate-500">Kelola dan pantau status penawaran Anda</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { value: 'all', label: 'Semua' },
                    { value: 'PENDING', label: 'Pending' },
                    { value: 'ACCEPTED', label: 'Diterima' },
                    { value: 'REJECTED', label: 'Ditolak' },
                    { value: 'DRAFT', label: 'Draf' },
                  ].map(f => (
                    <button
                      key={f.value}
                      onClick={() => setBidFilter(f.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        bidFilter === f.value
                          ? 'bg-primary text-white'
                          : 'bg-white text-slate-500 border border-slate-200 hover:border-primary/30'
                      }`}
                    >
                      {f.label}
                      {f.value !== 'all' && (
                        <span className="ml-1.5 text-[10px] opacity-70">
                          ({myBids.filter(b => b.status === f.value).length})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bid List */}
              {loadingBids ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-1/3" />
                          </div>
                          <Skeleton className="h-8 w-24 rounded-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredMyBids.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20"
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Gavel className="h-10 w-10 text-slate-300" />
                  </div>
                  <h4 className="font-bold text-slate-600 mb-1">
                    {bidFilter === 'all' ? 'Belum ada penawaran' : `Tidak ada penawaran ${getStatusLabel(bidFilter)}`}
                  </h4>
                  <p className="text-sm text-slate-400 mb-4">
                    {bidFilter === 'all'
                      ? 'Mulai cari proyek dan ajukan penawaran pertama Anda'
                      : 'Coba ubah filter untuk melihat penawaran lainnya'}
                  </p>
                  {bidFilter === 'all' && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setActiveTab('search')}
                    >
                      <Search className="h-4 w-4" />
                      Cari Proyek
                    </Button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {filteredMyBids.map(bid => {
                    const statusInfo = getStatusBadge(bid.status);
                    const StatusIcon = statusInfo.icon;
                    const config = getCategoryConfig(bid.projectCategory);

                    return (
                      <motion.div key={bid.id} variants={itemVariants}>
                        <Card
                          className="overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group"
                          onClick={() => setSelectedBidDetail(selectedBidDetail?.id === bid.id ? null : bid)}
                        >
                          <div className={`h-1 bg-gradient-to-r ${config.gradient}`} />
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                              {/* Main info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <h4 className="font-semibold text-slate-800 truncate group-hover:text-primary transition-colors">
                                    {bid.projectTitle}
                                  </h4>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mb-2">
                                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${config.badge}`}>
                                    {config.emoji} {bid.projectCategory}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {bid.projectLocation}
                                  </span>
                                  {(bid.ownerName || bid.ownerCompany) && (
                                    <span className="flex items-center gap-1">
                                      <Building2 className="h-3 w-3" /> {bid.ownerName || bid.ownerCompany}
                                    </span>
                                  )}
                                </div>

                                {/* Price and duration */}
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="font-bold text-primary">{formatRupiah(bid.price)}</span>
                                  <span className="text-slate-400">|</span>
                                  <span className="text-slate-500">{bid.duration} hari</span>
                                  <span className="text-slate-400">|</span>
                                  <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {getRelativeTime(bid.createdAt)}
                                  </span>
                                </div>

                                {/* Expanded Detail */}
                                <AnimatePresence>
                                  {selectedBidDetail?.id === bid.id && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.25 }}
                                      className="overflow-hidden"
                                    >
                                      <Separator className="my-3" />
                                      <div className="space-y-3">
                                        <div>
                                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Proposal</p>
                                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 rounded-lg p-3">
                                            {bid.proposal || 'Tidak ada proposal'}
                                          </p>
                                        </div>
                                        {bid.notes && (
                                          <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Catatan</p>
                                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 rounded-lg p-3">
                                              {bid.notes}
                                            </p>
                                          </div>
                                        )}
                                        {bid.startDate && (
                                          <p className="text-xs text-slate-500">
                                            Tanggal mulai: <span className="font-medium text-slate-700">{formatDate(bid.startDate)}</span>
                                          </p>
                                        )}

                                        {/* Timeline */}
                                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                                          <span>Diajukan: {getRelativeTime(bid.createdAt)}</span>
                                          {bid.updatedAt && (
                                            <>
                                              <span>•</span>
                                              <span>Diperbarui: {getRelativeTime(bid.updatedAt)}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* Status + Actions */}
                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                <Badge className={`${statusInfo.color} border text-xs gap-1`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {statusInfo.label}
                                </Badge>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedBidDetail(selectedBidDetail?.id === bid.id ? null : bid);
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors"
                                    title="Lihat detail"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>

                                  {bid.status === 'PENDING' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setWithdrawDialogBid(bid);
                                      }}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                      title="Tarik penawaran"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {/* My Bids Summary Cards */}
              {!loadingBids && myBids.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                  <Card className="bg-gradient-to-br from-primary/5 to-primary/[0.02] border-primary/10">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{myBids.length}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Total Penawaran</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-amber-50 to-amber-50/30 border-amber-100">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-amber-600">{myBids.filter(b => b.status === 'PENDING').length}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Pending</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-50 to-green-50/30 border-green-100">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{myBids.filter(b => b.status === 'ACCEPTED').length}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Diterima</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-red-50 to-red-50/30 border-red-100">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-red-600">{myBids.filter(b => b.status === 'REJECTED').length}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Ditolak</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================= */}
      {/* CONFIRM SUBMIT DIALOG          */}
      {/* ============================= */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Konfirmasi Penawaran
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 py-2">
                <p className="text-sm text-slate-600">
                  Anda akan mengirim penawaran untuk:
                </p>
                <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                  <p className="font-semibold text-slate-800">{selectedProject?.title}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {selectedProject?.location}</span>
                    <span>Budget: <span className="font-semibold text-primary">{selectedProject ? formatRupiah(selectedProject.budget) : ''}</span></span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-primary/5 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Harga Penawaran</p>
                    <p className="font-bold text-primary mt-0.5">
                      {bidForm.price ? `Rp ${bidForm.price}` : '-'}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Durasi</p>
                    <p className="font-bold text-blue-600 mt-0.5">
                      {bidForm.duration ? `${bidForm.duration} hari` : '-'}
                    </p>
                  </div>
                </div>
                {budgetPercentage > 100 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">
                      Perhatian: Harga penawaran Anda <strong>{budgetPercentage}%</strong> dari budget proyek. Pastikan ini sesuai dengan rencana kerja Anda.
                    </p>
                  </div>
                )}
                <p className="text-xs text-slate-400">
                  Penawaran yang sudah dikirim tidak dapat diubah. Pastikan semua data sudah benar.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submittingBid}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitBid}
              disabled={submittingBid}
              className="bg-gradient-to-r from-primary to-teal-600 text-white hover:shadow-md gap-2"
            >
              {submittingBid ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Mengirim...</>
              ) : (
                <><Send className="h-4 w-4" /> Ya, Kirim Penawaran</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================= */}
      {/* WITHDRAW BID DIALOG            */}
      {/* ============================= */}
      <AlertDialog open={!!withdrawDialogBid} onOpenChange={(open) => !open && setWithdrawDialogBid(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Tarik Penawaran
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 py-2">
                <p className="text-sm text-slate-600">
                  Apakah Anda yakin ingin menarik penawaran untuk proyek ini?
                </p>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="font-semibold text-slate-800">{withdrawDialogBid?.projectTitle}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Penawaran: <span className="font-semibold text-primary">{withdrawDialogBid ? formatRupiah(withdrawDialogBid.price) : ''}</span>
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  Tindakan ini tidak dapat dibatalkan. Anda bisa mengajukan penawaran baru nanti.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={withdrawing}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWithdrawBid}
              disabled={withdrawing}
              className="bg-red-500 hover:bg-red-600 text-white gap-2"
            >
              {withdrawing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Memproses...</>
              ) : (
                <><Trash2 className="h-4 w-4" /> Ya, Tarik Penawaran</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Named sub-component for the budget filter icon
function Wallet({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}
