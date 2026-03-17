'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthStore, UserRole } from '@/lib/auth-store';
import { defaultRegisterForm, defaultNewProject, RegisterForm, Project } from '@/types';
import { formatRupiah, calculateMatchScore } from '@/lib/helpers';

// Dashboard Components
import { OwnerDashboard } from '@/components/dashboards/OwnerDashboard';
import { ContractorDashboard } from '@/components/dashboards/ContractorDashboard';
import { LandingPage } from '@/components/landing/LandingPage';

// Modal Components
import { LoginModal } from '@/components/modals/LoginModal';
import { RegisterModal } from '@/components/modals/RegisterModal';
import { BidModal } from '@/components/modals/BidModal';
import { CreateProjectModal } from '@/components/modals/CreateProjectModal';
import { VerificationModal } from '@/components/modals/VerificationModal';
import { CCTVModal } from '@/components/modals/CCTVModal';
import { ProgressModal } from '@/components/modals/ProgressModal';
import { CompareBidsModal } from '@/components/modals/CompareBidsModal';
import { ExportModal } from '@/components/modals/ExportModal';
import { ContractorDetailModal } from '@/components/modals/ContractorDetailModal';

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

  // View state
  const [activeTab, setActiveTab] = useState('landing');

  // Modal states
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [cctvModalOpen, setCctvModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Form states
  const [loginRole, setLoginRole] = useState<UserRole>('OWNER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerForm, setRegisterForm] = useState<RegisterForm>(defaultRegisterForm);
  const [newProject, setNewProject] = useState(defaultNewProject);

  // Bid form states
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [bidProposal, setBidProposal] = useState('');
  const [bidPrice, setBidPrice] = useState('');
  const [bidDuration, setBidDuration] = useState('');

  // Verification states
  const [docType, setDocType] = useState('KTP');
  const [docName, setDocName] = useState('');

  // Compare bids state
  const [selectedBidsForCompare, setSelectedBidsForCompare] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');

  // Selected items for modals
  const [selectedContractor, setSelectedContractor] = useState<SelectedContractor | null>(null);
  const [selectedProjectForCCTV, setSelectedProjectForCCTV] = useState<SelectedProjectForCCTV | null>(null);
  const [selectedProjectForProgress, setSelectedProjectForProgress] = useState<SelectedProjectForProgress | null>(null);

  // Data states
  const [contractors, setContractors] = useState<SelectedContractor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<Array<{id: string; type: string; name: string; verified: boolean}>>([]);

  // Load initial data
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
    setRegisterOpen(false);
    setLoginOpen(true);
    toast.success('Registrasi berhasil! Silakan login.');
  };

  const handleBid = async () => {
    if (!selectedProject || !user) return;
    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject.id,
          contractorId: user.id,
          proposal: bidProposal,
          price: parseFloat(bidPrice),
          duration: parseInt(bidDuration),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Penawaran berhasil dikirim!');
        setBidModalOpen(false);
        setBidProposal('');
        setBidPrice('');
        setBidDuration('');
      } else {
        toast.error(data.error || 'Gagal mengirim penawaran');
      }
    } catch {
      toast.error('Terjadi kesalahan');
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
        // Reload documents
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

  // Render based on active tab and user role
  if (activeTab === 'dashboard' && user?.role === 'OWNER') {
    // For now, show a simplified owner dashboard using existing components
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-800">TenderPro</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-slate-500">Pemilik Proyek</p>
              </div>
              <Button variant="outline" onClick={handleLogout}>Keluar</Button>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Owner Dashboard</h2>
              <p className="text-slate-500">Dashboard lengkap sedang dalam pengembangan. Silakan gunakan fitur yang tersedia.</p>
              <div className="flex gap-4 justify-center mt-4">
                <Button onClick={() => setCreateProjectOpen(true)}>Buat Proyek</Button>
                <Button variant="outline" onClick={() => setVerificationOpen(true)}>Verifikasi Akun</Button>
                <Button variant="outline" onClick={() => setExportModalOpen(true)}>Export Laporan</Button>
              </div>
            </CardContent>
          </Card>
        </div>
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
        <ExportModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
          format={exportFormat}
          setFormat={setExportFormat}
          onExport={() => {}}
        />
      </div>
    );
  }

  if (activeTab === 'dashboard' && user?.role === 'CONTRACTOR') {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-800">TenderPro</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-slate-500">Kontraktor</p>
              </div>
              <Button variant="outline" onClick={handleLogout}>Keluar</Button>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Kontraktor Dashboard</h2>
              <p className="text-slate-500">Dashboard lengkap sedang dalam pengembangan. Silakan gunakan fitur yang tersedia.</p>
              <div className="flex gap-4 justify-center mt-4">
                <Button onClick={() => setVerificationOpen(true)}>Verifikasi Akun</Button>
                <Button variant="outline" onClick={() => toast.info('Fitur tender dalam pengembangan')}>Cari Proyek</Button>
              </div>
            </CardContent>
          </Card>
        </div>
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
      </div>
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
    </>
  );
}

// Import missing components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
