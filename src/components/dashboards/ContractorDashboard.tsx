'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Building2, Star, MapPin, Clock, Briefcase, CheckCircle, TrendingUp,
  FileText, Eye, Upload, Plus, Search, MessageSquare, FolderOpen, LogOut,
  User, X, Edit, Trash2, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { ContractorStats, Project } from '@/types';
import { formatRupiah, getStatusColor, getStatusLabel } from '@/lib/helpers';
import { SimpleStatsCard } from '@/components/shared/StatsCard';
import { VerificationAlert } from '@/components/shared/VerificationAlert';
import { PortfolioModal } from '@/components/modals/PortfolioModal';
import { ChatModal } from '@/components/modals/ChatModal';

interface Portfolio {
  id: string;
  title: string;
  description: string;
  category: string;
  clientName?: string;
  location?: string;
  year: number;
  budget?: number;
  images: string[];
  createdAt: Date;
}

interface ContractorDashboardProps {
  user: { id: string; name: string; verificationStatus: string };
  contractorStats: ContractorStats;
  onLogout: () => void;
  onShowVerification: () => void;
  onShowBidModal: (project: Project) => void;
}

export function ContractorDashboard({
  user,
  contractorStats,
  onLogout,
  onShowVerification,
  onShowBidModal,
}: ContractorDashboardProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loadingPortfolios, setLoadingPortfolios] = useState(true);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [withdrawConfirmBid, setWithdrawConfirmBid] = useState<{ id: string; title: string } | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  // Load portfolios
  const loadPortfolios = useCallback(async () => {
    setLoadingPortfolios(true);
    try {
      const res = await fetch(`/api/portfolios?userId=${user.id}`);
      const data = await res.json();
      if (data.portfolios) {
        setPortfolios(data.portfolios);
      }
    } catch (error) {
      console.error('Error loading portfolios:', error);
    } finally {
      setLoadingPortfolios(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadPortfolios();
  }, [loadPortfolios]);

  // Handle add portfolio
  const handleAddPortfolio = () => {
    setSelectedPortfolio(null);
    setPortfolioModalOpen(true);
  };

  // Handle edit portfolio
  const handleEditPortfolio = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
    setPortfolioModalOpen(true);
  };

  // Handle delete portfolio
  const handleDeletePortfolio = async (portfolioId: string) => {
    try {
      const res = await fetch(`/api/portfolios?id=${portfolioId}&userId=${user.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Portofolio dihapus');
        setPortfolios(prev => prev.filter(p => p.id !== portfolioId));
        setDeleteConfirmId(null);
      } else {
        toast.error(data.error || 'Gagal menghapus portofolio');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
  };

  // Handle portfolio success
  const handlePortfolioSuccess = () => {
    loadPortfolios();
  };

  // Handle bid withdrawal
  const handleWithdrawBid = async (bidId: string) => {
    setWithdrawing(true);
    try {
      const res = await fetch(`/api/bids?id=${bidId}&contractorId=${user.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Penawaran berhasil dibatalkan');
        setWithdrawConfirmBid(null);
        // Refresh the page to update the bids list
        window.location.reload();
      } else {
        toast.error(data.error || 'Gagal membatalkan penawaran');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="TenderPro" className="h-8 w-auto" />
            <span className="text-2xl font-bold text-slate-800">TenderPro</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setChatModalOpen(true)}>
              <MessageSquare className="h-5 w-5" />
            </Button>
            <div className="text-right">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-slate-500">Kontraktor</p>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Keluar
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <VerificationAlert user={user} onUploadClick={onShowVerification} />

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <SimpleStatsCard label="Total Penawaran" value={contractorStats.totalBids} icon={FileText} color="primary" />
          <SimpleStatsCard label="Diterima" value={contractorStats.acceptedBids} icon={CheckCircle} color="primary" />
          <SimpleStatsCard label="Pending" value={contractorStats.pendingBids} icon={Clock} color="yellow" />
          <SimpleStatsCard label="Win Rate" value={`${contractorStats.winRate}%`} icon={TrendingUp} color="purple" />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => {
            const tenderTab = document.querySelector('[value="tender"]') as HTMLButtonElement;
            if (tenderTab) tenderTab.click();
          }}>
            <Search className="h-4 w-4 mr-2" /> Cari Proyek
          </Button>
          <Button variant="outline" onClick={onShowVerification}>
            <Upload className="h-4 w-4 mr-2" /> Verifikasi Akun
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="bids" className="w-full">
          <TabsList className="mb-6 flex flex-wrap">
            <TabsTrigger value="bids"><FileText className="h-4 w-4 mr-2" /> Penawaran Saya</TabsTrigger>
            <TabsTrigger value="portfolio"><FolderOpen className="h-4 w-4 mr-2" /> Portofolio</TabsTrigger>
          </TabsList>

          {/* Bids Tab */}
          <TabsContent value="bids">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Penawaran Saya
                </CardTitle>
                <CardDescription>Kelola penawaran proyek yang telah Anda ajukan</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {contractorStats.recentBids.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-4">Belum ada penawaran</p>
                    <Button className="bg-primary hover:bg-primary/90" onClick={() => {
                      const tenderTab = document.querySelector('[value="tender"]') as HTMLButtonElement;
                      if (tenderTab) tenderTab.click();
                    }}>
                      <Search className="h-4 w-4 mr-2" /> Cari Proyek
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contractorStats.recentBids.map((bid) => (
                      <div key={bid.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{bid.project?.title || 'Proyek'}</h4>
                            <p className="text-sm text-slate-500">{bid.project?.location || '-'}</p>
                          </div>
                          <Badge className={bid.status === 'ACCEPTED' ? 'bg-green-500' : bid.status === 'REJECTED' ? 'bg-red-500' : 'bg-yellow-500'}>
                            {bid.status === 'ACCEPTED' ? 'Diterima' : bid.status === 'REJECTED' ? 'Ditolak' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span><DollarSign className="h-3 w-3 inline mr-1" />{formatRupiah(bid.price)}</span>
                          <span><Clock className="h-3 w-3 inline mr-1" />{bid.duration} hari</span>
                        </div>
                        {/* Withdraw button for PENDING bids */}
                        {bid.status === 'PENDING' && (
                          <div className="mt-3 flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              onClick={() => setWithdrawConfirmBid({ id: bid.id, title: bid.project?.title || 'Proyek' })}
                            >
                              <Trash2 className="h-3 w-3 mr-1" /> Batalkan Penawaran
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      Portofolio Proyek
                    </CardTitle>
                    <CardDescription>Tampilkan hasil kerja Anda untuk menarik klien</CardDescription>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90" onClick={handleAddPortfolio}>
                    <Plus className="h-4 w-4 mr-2" /> Tambah Portofolio
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {loadingPortfolios ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-slate-500 mt-4">Memuat portofolio...</p>
                  </div>
                ) : portfolios.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-4">Belum ada portofolio</p>
                    <p className="text-sm text-slate-400 mb-4">Tambahkan portofolio untuk menarik klien potensial</p>
                    <Button className="bg-primary hover:bg-primary/90" onClick={handleAddPortfolio}>
                      <Plus className="h-4 w-4 mr-2" /> Tambah Portofolio Pertama
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {portfolios.map((portfolio) => (
                      <Card key={portfolio.id} className="overflow-hidden group">
                        <div className="relative h-40 bg-slate-200">
                          {portfolio.images && portfolio.images.length > 0 ? (
                            <img
                              src={portfolio.images[0]}
                              alt={portfolio.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="h-12 w-12 text-slate-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white hover:bg-white/20"
                              onClick={() => handleEditPortfolio(portfolio)}
                            >
                              <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white hover:bg-red-500/50"
                              onClick={() => setDeleteConfirmId(portfolio.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Hapus
                            </Button>
                          </div>
                          {/* Category Badge */}
                          <Badge className="absolute top-2 left-2 bg-primary/90">
                            {portfolio.category}
                          </Badge>
                        </div>
                        <CardContent className="p-3">
                          <h4 className="font-medium text-sm line-clamp-1">{portfolio.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            {portfolio.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {portfolio.location}
                              </span>
                            )}
                            <span>• {portfolio.year}</span>
                          </div>
                          {portfolio.budget && (
                            <p className="text-xs text-primary font-medium mt-1">
                              {formatRupiah(portfolio.budget)}
                            </p>
                          )}
                          {portfolio.images && portfolio.images.length > 1 && (
                            <p className="text-xs text-slate-400 mt-1">
                              +{portfolio.images.length - 1} foto lainnya
                            </p>
                          )}
                        </CardContent>

                        {/* Delete Confirmation */}
                        {deleteConfirmId === portfolio.id && (
                          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4">
                            <p className="text-white text-sm text-center mb-3">
                              Hapus portofolio ini?
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-white border-white hover:bg-white/20"
                                onClick={() => setDeleteConfirmId(null)}
                              >
                                Batal
                              </Button>
                              <Button
                                size="sm"
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => handleDeletePortfolio(portfolio.id)}
                              >
                                Hapus
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Portfolio Modal */}
      <PortfolioModal
        open={portfolioModalOpen}
        onOpenChange={setPortfolioModalOpen}
        portfolio={selectedPortfolio}
        userId={user.id}
        onSuccess={handlePortfolioSuccess}
      />

      {/* Chat Modal */}
      <ChatModal
        open={chatModalOpen}
        onOpenChange={setChatModalOpen}
        currentUser={{ id: user.id, name: user.name }}
      />

      {/* Withdraw Confirmation Modal */}
      {withdrawConfirmBid && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-lg">Batalkan Penawaran?</CardTitle>
              <CardDescription>
                Apakah Anda yakin ingin membatalkan penawaran untuk proyek "{withdrawConfirmBid.title}"?
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setWithdrawConfirmBid(null)}
                disabled={withdrawing}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleWithdrawBid(withdrawConfirmBid.id)}
                disabled={withdrawing}
              >
                {withdrawing ? 'Membatalkan...' : 'Ya, Batalkan'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
