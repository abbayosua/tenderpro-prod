'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthStore, UserRole } from '@/lib/auth-store';
import { defaultRegisterForm, defaultNewProject, RegisterForm, Project } from '@/types';
import { useDashboard } from '@/hooks/useDashboard';

// Dashboard Components
import { OwnerDashboard } from '@/components/dashboards/OwnerDashboard';
import { ContractorDashboard } from '@/components/dashboards/ContractorDashboard';
import { LandingPage } from '@/components/landing/LandingPage';

// Modal Components
import { LoginModal } from '@/components/modals/LoginModal';
import { RegisterModal } from '@/components/modals/RegisterModal';
import { CreateProjectModal } from '@/components/modals/CreateProjectModal';
import { VerificationModal } from '@/components/modals/VerificationModal';
import { CCTVModal } from '@/components/modals/CCTVModal';
import { BidModal } from '@/components/modals/BidModal';
import { ProgressModal } from '@/components/modals/ProgressModal';
import { CompareBidsModal } from '@/components/modals/CompareBidsModal';
import { ExportModal } from '@/components/modals/ExportModal';
import { ContractorDetailModal } from '@/components/modals/ContractorDetailModal';
import { CostEstimatorModal } from '@/components/modals/CostEstimatorModal';

// Types for selected items
interface SelectedContractor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isVerified: boolean;
  verificationStatus: string;
  company: {
    name: string;
    specialization?: string;
    experienceYears: number;
    rating: number;
    totalProjects: number;
    completedProjects: number;
    city?: string;
    province?: string;
    description?: string;
  } | null;
  portfolios: Array<{ id: string; title: string; category: string; location?: string; budget?: number; }>;
}

interface SelectedProjectForCCTV {
  id: string;
  title: string;
  status: string;
}

interface SelectedProjectForProgress {
  id: string;
  title: string;
  category: string;
  budget: number;
}

export default function TenderProApp() {
  const { user, login, logout, isLoading } = useAuthStore();
  const dashboard = useDashboard({ user });

  // View state
  const [activeTab, setActiveTab] = useState('landing');

  // Modal states
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [cctvModalOpen, setCctvModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [costEstimatorOpen, setCostEstimatorOpen] = useState(false);

  // Form states
  const [loginRole, setLoginRole] = useState<UserRole>('OWNER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerForm, setRegisterForm] = useState<RegisterForm>(defaultRegisterForm);
  const [newProject, setNewProject] = useState(defaultNewProject);

  // Verification states
  const [docType, setDocType] = useState('KTP');
  const [docName, setDocName] = useState('');

  // Compare bids state
  const [selectedBidsForCompare, setSelectedBidsForCompare] = useState<string[]>([]);

  // Bid modal states
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedProjectForBid, setSelectedProjectForBid] = useState<Project | null>(null);
  const [bidProposal, setBidProposal] = useState('');
  const [bidPrice, setBidPrice] = useState('');
  const [bidDuration, setBidDuration] = useState('');

  // Pre-filled bid data from AI assistant
  const [prefilledBidData, setPrefilledBidData] = useState<{ proposal: string; price: string; duration: string } | null>(null);

  // Selected items for modals
  const [selectedContractor, setSelectedContractor] = useState<SelectedContractor | null>(null);
  const [selectedProjectForCCTV, setSelectedProjectForCCTV] = useState<SelectedProjectForCCTV | null>(null);
  const [selectedProjectForProgress, setSelectedProjectForProgress] = useState<SelectedProjectForProgress | null>(null);

  // Data states for landing page
  const [contractors, setContractors] = useState<SelectedContractor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<Array<{id: string; type: string; name: string; verified: boolean}>>([]);
  const [localContractors, setLocalContractors] = useState<Array<SelectedContractor & { isLocal?: boolean; certifications?: Array<{ type: string; isVerified: boolean }>; badges?: Array<{ type: string; label: string; icon: string }> }>>([]);

  // Load initial data for landing page
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [contractorsRes, projectsRes, localRes] = await Promise.all([
          fetch('/api/contractors'),
          fetch('/api/projects?status=OPEN&limit=6'),
          fetch('/api/contractors/local?limit=3'),
        ]);
        const contractorsData = await contractorsRes.json();
        const projectsData = await projectsRes.json();
        const localData = await localRes.json();
        if (!cancelled) {
          setContractors(contractorsData.contractors || []);
          setProjects(projectsData.projects || []);
          setLocalContractors(localData.contractors || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load documents when user changes
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/documents?userId=${user.id}`);
        const data = await res.json();
        if (!cancelled) setDocuments(data.documents || []);
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Hydration effect
  useEffect(() => {
    const timeout = setTimeout(() => {
      const state = useAuthStore.getState();
      if (!state._hasHydrated) {
        state.setHasHydrated(true);
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  // Toggle bid selection for compare
  const toggleBidSelection = useCallback((bidId: string) => {
    setSelectedBidsForCompare(prev =>
      prev.includes(bidId)
        ? prev.filter(id => id !== bidId)
        : prev.length < 3 ? [...prev, bidId] : prev
    );
  }, []);

  // Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password, loginRole);
    if (success) {
      toast.success('Login berhasil!');
      setLoginOpen(false);
      setEmail('');
      setPassword('');
      setActiveTab('dashboard');
    } else {
      toast.error('Login gagal. Periksa email dan password Anda.');
    }
  };

  const handleLogout = () => {
    logout();
    setActiveTab('landing');
    toast.success('Logout berhasil');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });
      const data = await res.json();
      if (data.success) {
        setRegisterOpen(false);
        setLoginOpen(true);
        setEmail(registerForm.email);
        toast.success('Registrasi berhasil! Silakan login.');
      } else {
        toast.error(data.message || 'Registrasi gagal. Silakan coba lagi.');
      }
    } catch {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  const handleCreateProject = async () => {
    if (!user || !newProject.title || !newProject.budget) {
      toast.error('Mohon lengkapi data proyek');
      return;
    }
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: user.id,
          ...newProject,
          budget: parseFloat(newProject.budget),
          duration: parseInt(newProject.duration) || null,
          requirements: newProject.requirements.split('\n').filter(r => r.trim()),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Proyek berhasil dibuat!');
        setCreateProjectOpen(false);
        setNewProject(defaultNewProject);
        dashboard.loadDashboardStats();
      } else {
        toast.error(data.error || 'Gagal membuat proyek');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
  };

  const handleUploadDocument = async (fileUrl: string) => {
    if (!user || !docName.trim()) return false;
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: docType,
          name: docName,
          fileUrl: fileUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const docRes = await fetch(`/api/documents?userId=${user.id}`);
        const docData = await docRes.json();
        setDocuments(docData.documents || []);
        setDocName('');
        return true;
      } else {
        toast.error(data.error || 'Gagal mengunggah dokumen');
        return false;
      }
    } catch {
      toast.error('Terjadi kesalahan');
      return false;
    }
  };

  // Render Owner Dashboard with real data
  if (activeTab === 'dashboard' && user?.role === 'OWNER' && dashboard.ownerStats) {
    return (
      <>
        <OwnerDashboard
          user={user}
          ownerStats={dashboard.ownerStats}
          notifications={dashboard.notifications}
          unreadCount={dashboard.unreadCount}
          favorites={dashboard.favorites}
          milestones={dashboard.milestones}
          progressPercent={dashboard.progressPercent}
          selectedBidsForCompare={selectedBidsForCompare}
          chartData={dashboard.chartData}
          paymentSummary={dashboard.paymentSummary}
          milestoneBreakdown={dashboard.milestoneBreakdown}
          allProjectDocuments={dashboard.allProjectDocuments}
          onLogout={handleLogout}
          onShowVerification={() => setVerificationOpen(true)}
          onShowCreateProject={() => setCreateProjectOpen(true)}
          onShowCCTV={(project) => {
            setSelectedProjectForCCTV(project);
            setCctvModalOpen(true);
          }}
          onShowProgress={(project) => {
            setSelectedProjectForProgress(project);
            dashboard.loadMilestones(project.id);
            setProgressModalOpen(true);
          }}
          onShowCompare={() => setCompareModalOpen(true)}
          onShowExport={() => setExportModalOpen(true)}
          onAcceptBid={dashboard.handleAcceptBid}
          onRejectBid={dashboard.handleRejectBid}
          onAddFavorite={dashboard.handleAddFavorite}
          onRemoveFavorite={dashboard.handleRemoveFavorite}
          onMarkNotificationRead={dashboard.handleMarkNotificationRead}
          onMarkAllRead={dashboard.handleMarkAllRead}
          onUpdateMilestone={dashboard.handleUpdateMilestone}
          toggleBidSelection={toggleBidSelection}
          loadMilestones={dashboard.loadMilestones}
          // Auto-refresh props
          refreshInterval={dashboard.refreshInterval}
          onSetRefreshInterval={dashboard.setRefreshInterval}
          lastRefreshed={dashboard.lastRefreshed}
          isRefreshing={dashboard.isRefreshing}
          onRefresh={dashboard.refreshAllData}
        />
        <CreateProjectModal
          open={createProjectOpen}
          onOpenChange={setCreateProjectOpen}
          project={newProject}
          setProject={setNewProject}
          onSubmit={handleCreateProject}
        />
        <VerificationModal
          open={verificationOpen}
          onOpenChange={setVerificationOpen}
          docType={docType}
          setDocType={setDocType}
          docName={docName}
          setDocName={setDocName}
          documents={documents}
          onUpload={handleUploadDocument}
          onRequestVerification={async () => {
            toast.success('Permintaan verifikasi dikirim!');
            setVerificationOpen(false);
          }}
        />
        <CCTVModal
          open={cctvModalOpen}
          onOpenChange={setCctvModalOpen}
          project={selectedProjectForCCTV}
        />
        <ProgressModal
          open={progressModalOpen}
          onOpenChange={setProgressModalOpen}
          project={selectedProjectForProgress}
          milestones={dashboard.milestones}
          progressPercent={dashboard.progressPercent}
          onUpdateMilestone={dashboard.handleUpdateMilestone}
        />
        <CompareBidsModal
          open={compareModalOpen}
          onOpenChange={setCompareModalOpen}
          selectedBidIds={selectedBidsForCompare}
          onAcceptBid={dashboard.handleAcceptBid}
        />
        <ExportModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
          userId={user.id}
          userRole="OWNER"
          projects={projects.map(p => ({ id: p.id, title: p.title }))}
        />
      </>
    );
  }

  // Render Contractor Dashboard with real data
  if (activeTab === 'dashboard' && user?.role === 'CONTRACTOR' && dashboard.contractorStats) {
    return (
      <>
        <ContractorDashboard
          user={user}
          contractorStats={dashboard.contractorStats}
          contractorChartData={dashboard.contractorChartData}
          onLogout={handleLogout}
          onShowVerification={() => setVerificationOpen(true)}
          onShowBidModal={(project, prefillData) => {
            setSelectedProjectForBid(project);
            if (prefillData) {
              setBidProposal(prefillData.proposal);
              setBidPrice(prefillData.price);
              setBidDuration(prefillData.duration);
              setPrefilledBidData(prefillData);
            } else {
              setBidProposal('');
              setBidPrice('');
              setBidDuration('');
              setPrefilledBidData(null);
            }
            setBidModalOpen(true);
          }}
          // Auto-refresh props
          refreshInterval={dashboard.refreshInterval}
          onSetRefreshInterval={dashboard.setRefreshInterval}
          lastRefreshed={dashboard.lastRefreshed}
          isRefreshing={dashboard.isRefreshing}
          onRefresh={dashboard.refreshAllData}
        />
        <VerificationModal
          open={verificationOpen}
          onOpenChange={setVerificationOpen}
          docType={docType}
          setDocType={setDocType}
          docName={docName}
          setDocName={setDocName}
          documents={documents}
          onUpload={handleUploadDocument}
          onRequestVerification={async () => {
            toast.success('Permintaan verifikasi dikirim!');
            setVerificationOpen(false);
          }}
        />
        <BidModal
          open={bidModalOpen}
          onOpenChange={setBidModalOpen}
          project={selectedProjectForBid}
          proposal={bidProposal}
          setProposal={setBidProposal}
          price={bidPrice}
          setPrice={setBidPrice}
          duration={bidDuration}
          setDuration={setBidDuration}
          onSubmit={async () => {
            if (!selectedProjectForBid || !bidProposal.trim() || !bidPrice || !bidDuration) {
              toast.error('Mohon lengkapi semua field penawaran');
              return;
            }
            const success = await dashboard.handleBid(selectedProjectForBid, bidProposal, bidPrice, bidDuration);
            if (success) {
              setBidModalOpen(false);
              setSelectedProjectForBid(null);
              setBidProposal('');
              setBidPrice('');
              setBidDuration('');
              setPrefilledBidData(null);
            }
          }}
        />
      </>
    );
  }

  // Landing Page
  return (
    <>
      <LandingPage
        user={user}
        contractors={contractors}
        projects={projects}
        selectedContractor={selectedContractor}
        setSelectedContractor={setSelectedContractor}
        onLogin={() => setLoginOpen(true)}
        onRegister={(role) => { setLoginRole(role); setRegisterOpen(true); }}
        onLogout={handleLogout}
        onDashboard={() => setActiveTab('dashboard')}
        onShowCostEstimator={() => setCostEstimatorOpen(true)}
        localContractors={localContractors}
      />
      <LoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        loginRole={loginRole}
        setLoginRole={setLoginRole}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        isLoading={isLoading}
        onSubmit={handleLogin}
        onOpenRegister={() => { setLoginOpen(false); setRegisterOpen(true); }}
      />
      <RegisterModal
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSubmit={handleRegister}
        onOpenLogin={() => { setRegisterOpen(false); setLoginOpen(true); }}
      />
      <ContractorDetailModal
        open={!!selectedContractor}
        onOpenChange={() => setSelectedContractor(null)}
        contractor={selectedContractor}
      />
      <CostEstimatorModal
        open={costEstimatorOpen}
        onOpenChange={setCostEstimatorOpen}
      />
    </>
  );
}
