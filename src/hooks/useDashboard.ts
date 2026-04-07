'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type {
  Contractor,
  Project,
  OwnerStats,
  ContractorStats,
  Notification,
  Favorite,
  Milestone,
  Payment,
  ProjectDocument,
  UserDocument,
} from '@/types';

// =============================================================================
// TYPES
// =============================================================================

export interface SpendingCategoryData {
  name: string;
  budget: number;
  spent: number;
  percentage: number;
}

export interface MonthlyProgressData {
  month: string;
  proyek: number;
  selesai: number;
  completionRate: number;
}

export interface CompletionTrend {
  direction: 'up' | 'down' | 'stable';
  value: number;
  avgCompletion: number;
}

export interface ChartData {
  categoryData: Array<{ name: string; value: number; count: number }>;
  spendingCategoryData?: SpendingCategoryData[];
  monthlyProgressData: MonthlyProgressData[];
  completionTrend?: CompletionTrend;
  trends: { projectTrend: number; bidTrend: number };
}

export interface ContractorChartData {
  totalBids: number;
  acceptedBids: number;
  rejectedBids: number;
  pendingBids: number;
  overallWinRate: number;
  monthlyBidSubmissions: Array<{
    month: string;
    total: number;
    accepted: number;
    rejected: number;
    pending: number;
    winRate: number;
  }>;
  winRateTrend: {
    direction: 'up' | 'down' | 'stable';
    value: number;
    current: number;
    previous: number;
  };
  performanceComparison: {
    accepted: number;
    rejected: number;
    pending: number;
    acceptanceRate: number;
    rejectionRate: number;
  };
  winRateHistory: Array<{ month: string; winRate: number }>;
}

export interface PaymentSummary {
  totalBudget: number;
  totalPaid: number;
  totalPending: number;
  remainingBudget: number;
}

export interface MilestoneBreakdownItem {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  order: number;
  paymentCount: number;
  percentage: number;
}

export interface ProjectMilestoneBreakdown {
  projectId: string;
  projectTitle: string;
  projectBudget: number;
  projectStatus: string;
  milestones: MilestoneBreakdownItem[];
  totalMilestoneBudget: number;
  totalMilestonePaid: number;
  totalMilestonePending: number;
}

export interface PaymentData {
  summary: PaymentSummary;
  payments: Payment[];
  milestoneBreakdown?: ProjectMilestoneBreakdown[];
}

export interface AllProjectDocument {
  id: string;
  name: string;
  type: string;
  projectId: string;
  project: string;
  fileSize: number;
  fileUrl: string;
  isApproved: boolean;
  createdAt: Date;
  viewCount: number;
  downloadCount: number;
}

interface UseDashboardProps {
  user: { id: string; role: string } | null;
}

// Refresh interval type
export type RefreshInterval = '30s' | '1m' | '5m' | 'manual';

// Convert interval string to milliseconds
function getRefreshIntervalMs(interval: RefreshInterval): number | null {
  switch (interval) {
    case '30s': return 30 * 1000;
    case '1m': return 60 * 1000;
    case '5m': return 5 * 60 * 1000;
    case 'manual': return null;
    default: return 60 * 1000;
  }
}

// =============================================================================
// HELPER HOOK: useDashboardData
// Handles all data fetching and state management
// =============================================================================

function useDashboardData(user: { id: string; role: string } | null) {
  // --- Public Data (no auth required) ---
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // --- User Stats ---
  const [ownerStats, setOwnerStats] = useState<OwnerStats | null>(null);
  const [contractorStats, setContractorStats] = useState<ContractorStats | null>(null);

  // --- Auto-refresh state ---
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>('1m');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- User Documents ---
  const [documents, setDocuments] = useState<UserDocument[]>([]);

  // --- Notifications ---
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- Favorites (Owner only) ---
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  // --- Project Progress ---
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projectDocuments, setProjectDocuments] = useState<ProjectDocument[]>([]);

  // --- Owner-specific Data ---
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [milestoneBreakdown, setMilestoneBreakdown] = useState<ProjectMilestoneBreakdown[]>([]);
  const [allProjectDocuments, setAllProjectDocuments] = useState<AllProjectDocument[]>([]);

  // --- Contractor-specific Data ---
  const [contractorChartData, setContractorChartData] = useState<ContractorChartData | null>(null);

  const isOwner = user?.role === 'OWNER';

  // Load public data on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [contractorsRes, projectsRes] = await Promise.all([
          fetch('/api/contractors'),
          fetch('/api/projects?status=OPEN&limit=6'),
        ]);
        const contractorsData = await contractorsRes.json();
        const projectsData = await projectsRes.json();
        if (!cancelled) {
          setContractors(contractorsData.contractors || []);
          setProjects(projectsData.projects || []);
          setLastRefreshed(new Date());
        }
      } catch (error) {
        console.error('Failed to fetch public data:', error);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load user-dependent data
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetchAll = async () => {
      const promises: Promise<void>[] = [];

      // Stats
      promises.push((async () => {
        try {
          const res = await fetch(`/api/stats?userId=${user.id}`);
          const data = await res.json();
          if (!cancelled) {
            if (isOwner) setOwnerStats(data);
            else setContractorStats(data);
          }
        } catch (e) { console.error('Stats fetch failed:', e); }
      })());

      // Documents
      promises.push((async () => {
        try {
          const res = await fetch(`/api/documents?userId=${user.id}`);
          const data = await res.json();
          if (!cancelled) setDocuments(data.documents || []);
        } catch (e) { console.error('Documents fetch failed:', e); }
      })());

      // Notifications
      promises.push((async () => {
        try {
          const res = await fetch(`/api/notifications?userId=${user.id}&limit=10`);
          const data = await res.json();
          if (!cancelled) {
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
          }
        } catch (e) { console.error('Notifications fetch failed:', e); }
      })());

      // Owner-specific data
      if (isOwner) {
        // Favorites
        promises.push((async () => {
          try {
            const res = await fetch(`/api/favorites?userId=${user.id}`);
            const data = await res.json();
            if (!cancelled) setFavorites(data.favorites || []);
          } catch (e) { console.error('Favorites fetch failed:', e); }
        })());

        // Chart data
        promises.push((async () => {
          try {
            const res = await fetch(`/api/charts?userId=${user.id}`);
            const data = await res.json();
            if (!cancelled) setChartData(data);
          } catch (e) { console.error('Chart data fetch failed:', e); }
        })());

        // Payment summary
        promises.push((async () => {
          try {
            const res = await fetch(`/api/owner-payments?userId=${user.id}`);
            const data = await res.json();
            if (!cancelled) {
              setPaymentSummary(data.summary);
              setPayments(data.payments || []);
              setMilestoneBreakdown(data.milestoneBreakdown || []);
            }
          } catch (e) { console.error('Payment summary fetch failed:', e); }
        })());

        // All project documents
        promises.push((async () => {
          try {
            const res = await fetch(`/api/owner-documents?userId=${user.id}`);
            const data = await res.json();
            if (!cancelled) setAllProjectDocuments(data.documents || []);
          } catch (e) { console.error('Project documents fetch failed:', e); }
        })());
      } else {
        // Contractor-specific data
        // Chart data for contractor performance metrics
        promises.push((async () => {
          try {
            const res = await fetch(`/api/charts?userId=${user.id}`);
            const data = await res.json();
            if (!cancelled) setContractorChartData(data);
          } catch (e) { console.error('Contractor chart data fetch failed:', e); }
        })());
      }

      await Promise.all(promises);
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [user, isOwner]);

  // Auto-refresh effect
  useEffect(() => {
    const intervalMs = getRefreshIntervalMs(refreshInterval);
    
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Don't set interval if manual or no user
    if (!intervalMs || !user) return;

    // Setup auto-refresh with visibility check
    const refreshData = async () => {
      // Don't refresh if document is hidden (user not on page)
      if (document.hidden) return;
      
      setIsRefreshing(true);
      try {
        // Fetch all relevant data
        const promises: Promise<void>[] = [];
        
        // Stats
        promises.push((async () => {
          try {
            const res = await fetch(`/api/stats?userId=${user.id}`);
            const data = await res.json();
            if (isOwner) setOwnerStats(data);
            else setContractorStats(data);
          } catch (e) { console.error('Stats refresh failed:', e); }
        })());

        // Chart data
        if (isOwner) {
          promises.push((async () => {
            try {
              const res = await fetch(`/api/charts?userId=${user.id}`);
              const data = await res.json();
              setChartData(data);
            } catch (e) { console.error('Chart refresh failed:', e); }
          })());
        } else {
          promises.push((async () => {
            try {
              const res = await fetch(`/api/charts?userId=${user.id}`);
              const data = await res.json();
              setContractorChartData(data);
            } catch (e) { console.error('Contractor chart refresh failed:', e); }
          })());
        }

        // Notifications
        promises.push((async () => {
          try {
            const res = await fetch(`/api/notifications?userId=${user.id}&limit=10`);
            const data = await res.json();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
          } catch (e) { console.error('Notifications refresh failed:', e); }
        })());

        await Promise.all(promises);
        setLastRefreshed(new Date());
      } finally {
        setIsRefreshing(false);
      }
    };

    intervalRef.current = setInterval(refreshData, intervalMs);

    // Cleanup on unmount or interval change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refreshInterval, user, isOwner]);

  // --- Loaders (for manual refresh) ---
  const loadContractors = useCallback(async () => {
    try {
      const res = await fetch('/api/contractors');
      const data = await res.json();
      setContractors(data.contractors || []);
    } catch (e) { console.error('Failed to fetch contractors:', e); }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects?status=OPEN&limit=6');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (e) { console.error('Failed to fetch projects:', e); }
  }, []);

  const loadDashboardStats = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/stats?userId=${user.id}`);
      const data = await res.json();
      if (isOwner) setOwnerStats(data);
      else setContractorStats(data);
    } catch (e) { console.error('Failed to fetch stats:', e); }
  }, [user, isOwner]);

  const loadDocuments = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/documents?userId=${user.id}`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (e) { console.error('Failed to fetch documents:', e); }
  }, [user]);

  const loadFavorites = useCallback(async () => {
    if (!user || !isOwner) return;
    try {
      const res = await fetch(`/api/favorites?userId=${user.id}`);
      const data = await res.json();
      setFavorites(data.favorites || []);
    } catch (e) { console.error('Failed to fetch favorites:', e); }
  }, [user, isOwner]);

  const loadMilestones = useCallback(async (projectId: string) => {
    try {
      const res = await fetch(`/api/milestones?projectId=${projectId}`);
      const data = await res.json();
      setMilestones(data.milestones || []);
      setProgressPercent(data.progress || 0);
    } catch (e) { console.error('Failed to fetch milestones:', e); }
  }, []);

  const loadPayments = useCallback(async (milestoneId: string) => {
    try {
      const res = await fetch(`/api/payments?milestoneId=${milestoneId}`);
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (e) { console.error('Failed to fetch payments:', e); }
  }, []);

  const loadProjectDocuments = useCallback(async (projectId: string) => {
    try {
      const res = await fetch(`/api/project-documents?projectId=${projectId}`);
      const data = await res.json();
      setProjectDocuments(data.documents || []);
    } catch (e) { console.error('Failed to fetch project documents:', e); }
  }, []);

  const loadChartData = useCallback(async () => {
    if (!user || !isOwner) return;
    try {
      const res = await fetch(`/api/charts?userId=${user.id}`);
      const data = await res.json();
      setChartData(data);
    } catch (e) { console.error('Failed to fetch chart data:', e); }
  }, [user, isOwner]);

  const loadPaymentSummary = useCallback(async () => {
    if (!user || !isOwner) return;
    try {
      const res = await fetch(`/api/owner-payments?userId=${user.id}`);
      const data = await res.json();
      setPaymentSummary(data.summary);
      setPayments(data.payments || []);
      setMilestoneBreakdown(data.milestoneBreakdown || []);
    } catch (e) { console.error('Failed to fetch payment summary:', e); }
  }, [user, isOwner]);

  const loadAllProjectDocuments = useCallback(async () => {
    if (!user || !isOwner) return;
    try {
      const res = await fetch(`/api/owner-documents?userId=${user.id}`);
      const data = await res.json();
      setAllProjectDocuments(data.documents || []);
    } catch (e) { console.error('Failed to fetch all project documents:', e); }
  }, [user, isOwner]);

  const loadContractorChartData = useCallback(async () => {
    if (!user || isOwner) return;
    try {
      const res = await fetch(`/api/charts?userId=${user.id}`);
      const data = await res.json();
      setContractorChartData(data);
    } catch (e) { console.error('Failed to fetch contractor chart data:', e); }
  }, [user, isOwner]);

  // Manual refresh function
  const refreshAllData = useCallback(async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const promises: Promise<void>[] = [];

      // Stats
      promises.push((async () => {
        try {
          const res = await fetch(`/api/stats?userId=${user.id}`);
          const data = await res.json();
          if (isOwner) setOwnerStats(data);
          else setContractorStats(data);
        } catch (e) { console.error('Stats refresh failed:', e); }
      })());

      // Notifications
      promises.push((async () => {
        try {
          const res = await fetch(`/api/notifications?userId=${user.id}&limit=10`);
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        } catch (e) { console.error('Notifications refresh failed:', e); }
      })());

      // Chart data
      if (isOwner) {
        promises.push((async () => {
          try {
            const res = await fetch(`/api/charts?userId=${user.id}`);
            const data = await res.json();
            setChartData(data);
          } catch (e) { console.error('Chart refresh failed:', e); }
        })());

        promises.push((async () => {
          try {
            const res = await fetch(`/api/owner-payments?userId=${user.id}`);
            const data = await res.json();
            setPaymentSummary(data.summary);
            setPayments(data.payments || []);
            setMilestoneBreakdown(data.milestoneBreakdown || []);
          } catch (e) { console.error('Payment refresh failed:', e); }
        })());

        promises.push((async () => {
          try {
            const res = await fetch(`/api/owner-documents?userId=${user.id}`);
            const data = await res.json();
            setAllProjectDocuments(data.documents || []);
          } catch (e) { console.error('Documents refresh failed:', e); }
        })());

        promises.push((async () => {
          try {
            const res = await fetch(`/api/favorites?userId=${user.id}`);
            const data = await res.json();
            setFavorites(data.favorites || []);
          } catch (e) { console.error('Favorites refresh failed:', e); }
        })());
      } else {
        promises.push((async () => {
          try {
            const res = await fetch(`/api/charts?userId=${user.id}`);
            const data = await res.json();
            setContractorChartData(data);
          } catch (e) { console.error('Contractor chart refresh failed:', e); }
        })());
      }

      await Promise.all(promises);
      setLastRefreshed(new Date());
      toast.success('Data berhasil diperbarui');
    } catch (e) {
      console.error('Refresh failed:', e);
      toast.error('Gagal memperbarui data');
    } finally {
      setIsRefreshing(false);
    }
  }, [user, isOwner]);

  return {
    // Data
    contractors, projects, ownerStats, contractorStats,
    notifications, unreadCount, favorites, documents,
    milestones, progressPercent, payments, projectDocuments,
    chartData, paymentSummary, milestoneBreakdown, allProjectDocuments, contractorChartData,
    // Loaders
    loadContractors, loadProjects, loadDashboardStats,
    loadMilestones, loadPayments, loadProjectDocuments,
    loadChartData, loadPaymentSummary, loadAllProjectDocuments, loadDocuments, loadFavorites,
    loadContractorChartData,
    // Setters (for actions to update)
    setFavorites, setNotifications, setUnreadCount,
    // Auto-refresh
    refreshInterval, setRefreshInterval, lastRefreshed, isRefreshing, refreshAllData,
  };
}

// =============================================================================
// MAIN HOOK: useDashboard
// =============================================================================

export function useDashboard({ user }: UseDashboardProps) {
  const data = useDashboardData(user);

  // --- Bid Actions ---
  const handleAcceptBid = useCallback(async (bidId: string) => {
    try {
      const res = await fetch('/api/bids', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId, status: 'ACCEPTED' }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Penawaran diterima!');
        data.loadDashboardStats();
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
  }, [data]);

  const handleRejectBid = useCallback(async (bidId: string) => {
    try {
      const res = await fetch('/api/bids', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId, status: 'REJECTED' }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Penawaran ditolak');
        data.loadDashboardStats();
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
  }, [data]);

  // --- Favorite Actions ---
  const handleAddFavorite = useCallback(async (contractorId: string, notes?: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, contractorId, notes }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Kontraktor ditambahkan ke favorit!');
        data.loadFavorites();
      } else {
        toast.error(result.error || 'Gagal menambahkan favorit');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
  }, [user, data]);

  const handleRemoveFavorite = useCallback(async (favoriteId: string) => {
    try {
      const res = await fetch(`/api/favorites?id=${favoriteId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        toast.success('Kontraktor dihapus dari favorit');
        data.setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
  }, [data]);

  // --- Notification Actions ---
  const handleMarkNotificationRead = useCallback(async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      data.setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
      data.setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  }, [data]);

  const handleMarkAllRead = useCallback(async () => {
    if (!user) return;
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true, userId: user.id }),
      });
      data.setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      data.setUnreadCount(0);
      toast.success('Semua notifikasi ditandai sudah dibaca');
    } catch {
      toast.error('Terjadi kesalahan');
    }
  }, [user, data]);

  // --- Milestone Actions ---
  const handleUpdateMilestone = useCallback(async (milestoneId: string, status: string, projectId?: string) => {
    try {
      const res = await fetch('/api/milestones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneId, status }),
      });
      const result = await res.json();
      if (result.success && projectId) {
        await data.loadMilestones(projectId);
        toast.success('Status milestone diperbarui');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
  }, [data]);

  // --- Document Actions ---
  const handleUploadDocument = useCallback(async (docType: string, docName: string) => {
    if (!user || !docName.trim()) return false;
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: docType,
          name: docName,
          fileUrl: `/documents/${docType.toLowerCase()}_${user.id}.pdf`,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Dokumen berhasil diunggah!');
        data.loadDocuments();
        return true;
      }
      toast.error(result.error || 'Gagal mengunggah dokumen');
      return false;
    } catch {
      toast.error('Terjadi kesalahan');
      return false;
    }
  }, [user, data]);

  const handleRequestVerification = useCallback(async () => {
    if (!user) return false;
    try {
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Permintaan verifikasi berhasil dikirim!');
        return true;
      }
      toast.error(result.error || 'Gagal mengirim permintaan verifikasi');
      return false;
    } catch {
      toast.error('Terjadi kesalahan');
      return false;
    }
  }, [user]);

  // --- Project Actions ---
  const handleCreateProject = useCallback(async (projectData: {
    title: string; description: string; category: string; location: string;
    budget: string; duration: string; requirements: string;
  }) => {
    if (!user || !projectData.title || !projectData.budget) {
      toast.error('Mohon lengkapi data proyek');
      return false;
    }
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: user.id,
          ...projectData,
          budget: parseFloat(projectData.budget),
          duration: parseInt(projectData.duration) || null,
          requirements: projectData.requirements.split('\n').filter(r => r.trim()),
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Proyek berhasil dibuat!');
        data.loadDashboardStats();
        return true;
      }
      toast.error(result.error || 'Gagal membuat proyek');
      return false;
    } catch {
      toast.error('Terjadi kesalahan');
      return false;
    }
  }, [user, data]);

  const handleBid = useCallback(async (project: Project, proposal: string, price: string, duration: string) => {
    if (!project || !user) return false;
    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          contractorId: user.id,
          proposal,
          price: parseFloat(price),
          duration: parseInt(duration),
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Penawaran berhasil dikirim!');
        data.loadDashboardStats();
        return true;
      }
      toast.error(result.error || 'Gagal mengirim penawaran');
      return false;
    } catch {
      toast.error('Terjadi kesalahan');
      return false;
    }
  }, [user, data]);

  return {
    // Data
    contractors: data.contractors,
    projects: data.projects,
    ownerStats: data.ownerStats,
    contractorStats: data.contractorStats,
    notifications: data.notifications,
    unreadCount: data.unreadCount,
    favorites: data.favorites,
    documents: data.documents,
    milestones: data.milestones,
    payments: data.payments,
    projectDocuments: data.projectDocuments,
    progressPercent: data.progressPercent,
    chartData: data.chartData,
    paymentSummary: data.paymentSummary,
    milestoneBreakdown: data.milestoneBreakdown,
    allProjectDocuments: data.allProjectDocuments,
    contractorChartData: data.contractorChartData,
    // Loaders
    loadContractors: data.loadContractors,
    loadProjects: data.loadProjects,
    loadDashboardStats: data.loadDashboardStats,
    loadMilestones: data.loadMilestones,
    loadPayments: data.loadPayments,
    loadProjectDocuments: data.loadProjectDocuments,
    loadChartData: data.loadChartData,
    loadPaymentSummary: data.loadPaymentSummary,
    loadAllProjectDocuments: data.loadAllProjectDocuments,
    loadContractorChartData: data.loadContractorChartData,
    // Auto-refresh
    refreshInterval: data.refreshInterval,
    setRefreshInterval: data.setRefreshInterval,
    lastRefreshed: data.lastRefreshed,
    isRefreshing: data.isRefreshing,
    refreshAllData: data.refreshAllData,
    // Actions
    handleAcceptBid,
    handleRejectBid,
    handleAddFavorite,
    handleRemoveFavorite,
    handleMarkNotificationRead,
    handleMarkAllRead,
    handleUpdateMilestone,
    handleUploadDocument,
    handleRequestVerification,
    handleCreateProject,
    handleBid,
  };
}
