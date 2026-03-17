'use client';

import { useState, useEffect, useCallback } from 'react';
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

// Types for chart data
export interface ChartData {
  categoryData: Array<{ name: string; value: number; count: number }>;
  monthlyProgressData: Array<{ month: string; proyek: number; selesai: number }>;
  trends: {
    projectTrend: number;
    bidTrend: number;
  };
}

export interface PaymentSummary {
  totalBudget: number;
  totalPaid: number;
  totalPending: number;
  remainingBudget: number;
}

interface UseDashboardProps {
  user: { id: string; role: string } | null;
}

export function useDashboard({ user }: UseDashboardProps) {
  // Data states
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ownerStats, setOwnerStats] = useState<OwnerStats | null>(null);
  const [contractorStats, setContractorStats] = useState<ContractorStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projectDocuments, setProjectDocuments] = useState<ProjectDocument[]>([]);
  const [progressPercent, setProgressPercent] = useState(0);
  
  // New states for real data
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [allProjectDocuments, setAllProjectDocuments] = useState<Array<{
    id: string;
    name: string;
    type: string;
    projectId: string;
    project: string;
    fileSize: number;
    fileUrl: string;
    isApproved: boolean;
    createdAt: Date;
  }>>([]);

  // Load contractors
  const loadContractors = useCallback(async () => {
    try {
      const res = await fetch('/api/contractors');
      const data = await res.json();
      setContractors(data.contractors);
    } catch (error) {
      console.error('Failed to fetch contractors:', error);
    }
  }, []);

  // Load projects
  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects?status=OPEN&limit=6');
      const data = await res.json();
      setProjects(data.projects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  }, []);

  // Load dashboard stats
  const loadDashboardStats = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/stats?userId=${user.id}`);
      const data = await res.json();
      if (user.role === 'OWNER') setOwnerStats(data);
      else if (user.role === 'CONTRACTOR') setContractorStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [user]);

  // Load documents
  const loadDocuments = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/documents?userId=${user.id}`);
      const data = await res.json();
      setDocuments(data.documents);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  }, [user]);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}&limit=10`);
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [user]);

  // Load favorites
  const loadFavorites = useCallback(async () => {
    if (!user || user.role !== 'OWNER') return;
    try {
      const res = await fetch(`/api/favorites?userId=${user.id}`);
      const data = await res.json();
      setFavorites(data.favorites || []);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      setFavorites([]);
    }
  }, [user]);

  // Load milestones
  const loadMilestones = useCallback(async (projectId: string) => {
    try {
      const res = await fetch(`/api/milestones?projectId=${projectId}`);
      const data = await res.json();
      setMilestones(data.milestones);
      setProgressPercent(data.progress);
    } catch (error) {
      console.error('Failed to fetch milestones:', error);
    }
  }, []);

  // Load payments
  const loadPayments = useCallback(async (milestoneId: string) => {
    try {
      const res = await fetch(`/api/payments?milestoneId=${milestoneId}`);
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setPayments([]);
    }
  }, []);

  // Load project documents
  const loadProjectDocuments = useCallback(async (projectId: string) => {
    try {
      const res = await fetch(`/api/project-documents?projectId=${projectId}`);
      const data = await res.json();
      setProjectDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setProjectDocuments([]);
    }
  }, []);

  // Load chart data for owner
  const loadChartData = useCallback(async () => {
    if (!user || user.role !== 'OWNER') return;
    try {
      const res = await fetch(`/api/charts?userId=${user.id}`);
      const data = await res.json();
      setChartData(data);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    }
  }, [user]);

  // Load payment summary for owner
  const loadPaymentSummary = useCallback(async () => {
    if (!user || user.role !== 'OWNER') return;
    try {
      const res = await fetch(`/api/owner-payments?userId=${user.id}`);
      const data = await res.json();
      setPaymentSummary(data.summary);
      setPayments(data.payments);
    } catch (error) {
      console.error('Failed to fetch payment summary:', error);
    }
  }, [user]);

  // Load all project documents for owner
  const loadAllProjectDocuments = useCallback(async () => {
    if (!user || user.role !== 'OWNER') return;
    try {
      const res = await fetch(`/api/owner-documents?userId=${user.id}`);
      const data = await res.json();
      setAllProjectDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to fetch all project documents:', error);
    }
  }, [user]);

  // Initial data loading
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
          setContractors(contractorsData.contractors);
          setProjects(projectsData.projects);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // User-dependent data loading - use inline async function to avoid dependency issues
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    
    const loadData = async () => {
      try {
        const res = await fetch(`/api/stats?userId=${user.id}`);
        const data = await res.json();
        if (!cancelled) {
          if (user.role === 'OWNER') setOwnerStats(data);
          else if (user.role === 'CONTRACTOR') setContractorStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    
    const loadDocs = async () => {
      try {
        const res = await fetch(`/api/documents?userId=${user.id}`);
        const data = await res.json();
        if (!cancelled) setDocuments(data.documents);
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      }
    };
    
    const loadNotifs = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${user.id}&limit=10`);
        const data = await res.json();
        if (!cancelled) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    
    const loadFavs = async () => {
      if (user.role !== 'OWNER') return;
      try {
        const res = await fetch(`/api/favorites?userId=${user.id}`);
        const data = await res.json();
        if (!cancelled) setFavorites(data.favorites || []);
      } catch (error) {
        console.error('Failed to fetch favorites:', error);
      }
    };
    
    const loadCharts = async () => {
      if (user.role !== 'OWNER') return;
      try {
        const res = await fetch(`/api/charts?userId=${user.id}`);
        const data = await res.json();
        if (!cancelled) setChartData(data);
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      }
    };
    
    const loadPaymentsData = async () => {
      if (user.role !== 'OWNER') return;
      try {
        const res = await fetch(`/api/owner-payments?userId=${user.id}`);
        const data = await res.json();
        if (!cancelled) {
          setPaymentSummary(data.summary);
          setPayments(data.payments || []);
        }
      } catch (error) {
        console.error('Failed to fetch payment data:', error);
      }
    };
    
    const loadAllDocs = async () => {
      if (user.role !== 'OWNER') return;
      try {
        const res = await fetch(`/api/owner-documents?userId=${user.id}`);
        const data = await res.json();
        if (!cancelled) setAllProjectDocuments(data.documents || []);
      } catch (error) {
        console.error('Failed to fetch project documents:', error);
      }
    };
    
    loadData();
    loadDocs();
    loadNotifs();
    loadFavs();
    loadCharts();
    loadPaymentsData();
    loadAllDocs();
    
    return () => { cancelled = true; };
  }, [user]);

  // API Actions
  const handleAcceptBid = useCallback(async (bidId: string) => {
    try {
      const res = await fetch('/api/bids', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId, status: 'ACCEPTED' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Penawaran diterima!');
        loadDashboardStats();
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
  }, [loadDashboardStats]);

  const handleRejectBid = useCallback(async (bidId: string) => {
    try {
      const res = await fetch('/api/bids', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId, status: 'REJECTED' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Penawaran ditolak');
        loadDashboardStats();
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
  }, [loadDashboardStats]);

  const handleAddFavorite = useCallback(async (contractorId: string, notes?: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, contractorId, notes }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Kontraktor ditambahkan ke favorit!');
        loadFavorites();
      } else {
        toast.error(data.error || 'Gagal menambahkan favorit');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
  }, [user, loadFavorites]);

  const handleRemoveFavorite = useCallback(async (favoriteId: string) => {
    try {
      const res = await fetch(`/api/favorites?id=${favoriteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Kontraktor dihapus dari favorit');
        setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
  }, []);

  const handleMarkNotificationRead = useCallback(async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    if (!user) return;
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true, userId: user.id }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('Semua notifikasi ditandai sudah dibaca');
    } catch {
      toast.error('Terjadi kesalahan');
    }
  }, [user]);

  const handleUpdateMilestone = useCallback(async (milestoneId: string, status: string, projectId?: string) => {
    try {
      const res = await fetch('/api/milestones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneId, status }),
      });
      const data = await res.json();
      if (data.success && projectId) {
        await loadMilestones(projectId);
        toast.success('Status milestone diperbarui');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
  }, [loadMilestones]);

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
      const data = await res.json();
      if (data.success) {
        toast.success('Dokumen berhasil diunggah!');
        loadDocuments();
        return true;
      } else {
        toast.error(data.error || 'Gagal mengunggah dokumen');
        return false;
      }
    } catch {
      toast.error('Terjadi kesalahan');
      return false;
    }
  }, [user, loadDocuments]);

  const handleRequestVerification = useCallback(async () => {
    if (!user) return false;
    try {
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Permintaan verifikasi berhasil dikirim!');
        return true;
      } else {
        toast.error(data.error || 'Gagal mengirim permintaan verifikasi');
        return false;
      }
    } catch {
      toast.error('Terjadi kesalahan');
      return false;
    }
  }, [user]);

  const handleCreateProject = useCallback(async (projectData: {
    title: string;
    description: string;
    category: string;
    location: string;
    budget: string;
    duration: string;
    requirements: string;
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
      const data = await res.json();
      if (data.success) {
        toast.success('Proyek berhasil dibuat!');
        loadDashboardStats();
        return true;
      } else {
        toast.error(data.error || 'Gagal membuat proyek');
        return false;
      }
    } catch {
      toast.error('Terjadi kesalahan');
      return false;
    }
  }, [user, loadDashboardStats]);

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
      const data = await res.json();
      if (data.success) {
        toast.success('Penawaran berhasil dikirim!');
        loadDashboardStats();
        return true;
      } else {
        toast.error(data.error || 'Gagal mengirim penawaran');
        return false;
      }
    } catch {
      toast.error('Terjadi kesalahan');
      return false;
    }
  }, [user, loadDashboardStats]);

  return {
    // Data
    contractors,
    projects,
    ownerStats,
    contractorStats,
    notifications,
    unreadCount,
    favorites,
    documents,
    milestones,
    payments,
    projectDocuments,
    progressPercent,
    // New data for real implementation
    chartData,
    paymentSummary,
    allProjectDocuments,
    // Loaders
    loadContractors,
    loadProjects,
    loadDashboardStats,
    loadMilestones,
    loadPayments,
    loadProjectDocuments,
    loadChartData,
    loadPaymentSummary,
    loadAllProjectDocuments,
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
