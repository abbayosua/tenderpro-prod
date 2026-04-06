'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users, FolderOpen, FileText, DollarSign, Shield,
  Star, AlertTriangle, Clock, CheckCircle, XCircle,
  TrendingUp, Building2, HardHat, Activity, RefreshCw,
} from 'lucide-react';
import { formatRupiah, getRelativeTime, formatDate } from '@/lib/helpers';
import { toast } from 'sonner';

interface AdminData {
  totalUsers: number;
  usersByRole: { owners: number; contractors: number; admins: number };
  verifiedUsers: number;
  recentSignups: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isVerified: boolean;
    createdAt: string;
  }>;
  verificationRate: number;
  totalProjects: number;
  projectsByStatus: {
    draft: number;
    open: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  totalBids: number;
  bidsByStatus: {
    accepted: number;
    pending: number;
    rejected: number;
  };
  totalRevenue: number;
  totalDisputes: number;
  openDisputes: number;
  totalReviews: number;
  totalDocuments: number;
  totalPortfolios: number;
  totalCertifications: number;
  healthMetrics: {
    verificationRate: number;
    completionRate: number;
    acceptanceRate: number;
    openDisputeRate: number;
    overallHealth: number;
  };
}

function HealthBar({ label, value, color }: { label: string; value: number; color: string }) {
  const getColor = () => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    if (value >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-800">{value}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function AdminOverview() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview?key=admin');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error('Gagal memuat data admin');
      }
    } catch {
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-24 mb-2" />
                  <div className="h-8 bg-slate-200 rounded w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Gagal memuat data admin</p>
          <Button onClick={loadData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" /> Coba Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Platform Health */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Kesehatan Platform
              </CardTitle>
              <CardDescription>Indikator performa platform secara keseluruhan</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Skor Kesehatan:</span>
              <span className={`text-2xl font-bold ${
                data.healthMetrics.overallHealth >= 80 ? 'text-green-600' :
                data.healthMetrics.overallHealth >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {data.healthMetrics.overallHealth}
              </span>
              <span className="text-sm text-slate-400">/100</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <HealthBar label="Tingkat Verifikasi" value={data.healthMetrics.verificationRate} />
          <HealthBar label="Tingkat Penyelesaian Proyek" value={data.healthMetrics.completionRate} />
          <HealthBar label="Tingkat Penerimaan Bid" value={data.healthMetrics.acceptanceRate} />
          <HealthBar label="Tingkat Sengketa Aktif" value={100 - data.healthMetrics.openDisputeRate} />
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Pengguna</p>
                <p className="text-2xl font-bold text-slate-800">{data.totalUsers}</p>
                <p className="text-xs text-slate-400">
                  {data.usersByRole.owners} pemilik · {data.usersByRole.contractors} kontraktor
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FolderOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Proyek</p>
                <p className="text-2xl font-bold text-slate-800">{data.totalProjects}</p>
                <p className="text-xs text-slate-400">
                  {data.projectsByStatus.open} terbuka · {data.projectsByStatus.inProgress} berjalan
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Estimasi Pendapatan</p>
                <p className="text-2xl font-bold text-slate-800">{formatRupiah(data.totalRevenue)}</p>
                <p className="text-xs text-slate-400">Dari bid yang diterima</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Sengketa Aktif</p>
                <p className="text-2xl font-bold text-slate-800">{data.openDisputes}</p>
                <p className="text-xs text-slate-400">dari total {data.totalDisputes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-5 w-5 text-slate-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-slate-800">{data.totalBids}</p>
            <p className="text-xs text-slate-500">Total Bid</p>
            <div className="flex justify-center gap-1 mt-1">
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">{data.bidsByStatus.accepted} diterima</Badge>
              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">{data.bidsByStatus.pending} pending</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-5 w-5 text-slate-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-slate-800">{data.totalReviews}</p>
            <p className="text-xs text-slate-500">Total Review</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-5 w-5 text-slate-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-slate-800">{data.verifiedUsers}</p>
            <p className="text-xs text-slate-500">Pengguna Terverifikasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <HardHat className="h-5 w-5 text-slate-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-slate-800">{data.totalCertifications}</p>
            <p className="text-xs text-slate-500">Sertifikasi</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects by Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Proyek per Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <span className="text-sm text-slate-600">Draf</span>
                </div>
                <span className="font-semibold">{data.projectsByStatus.draft}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm text-slate-600">Terbuka</span>
                </div>
                <span className="font-semibold">{data.projectsByStatus.open}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-slate-600">Berjalan</span>
                </div>
                <span className="font-semibold">{data.projectsByStatus.inProgress}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-slate-600">Selesai</span>
                </div>
                <span className="font-semibold">{data.projectsByStatus.completed}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="text-sm text-slate-600">Dibatalkan</span>
                </div>
                <span className="font-semibold">{data.projectsByStatus.cancelled}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Signups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pendaftar Terbaru
            </CardTitle>
            <CardDescription>10 pengguna terakhir yang mendaftar</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentSignups.length === 0 ? (
              <div className="text-center py-6">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Belum ada pendaftar</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {data.recentSignups.map((user) => (
                  <div key={user.id} className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-slate-500">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 flex items-center gap-1">
                          {user.name}
                          {user.isVerified && (
                            <CheckCircle className="h-3 w-3 text-primary" />
                          )}
                        </p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          user.role === 'OWNER' ? 'bg-primary/10 text-primary' :
                          user.role === 'CONTRACTOR' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {user.role === 'OWNER' ? 'Pemilik' : user.role === 'CONTRACTOR' ? 'Kontraktor' : 'Admin'}
                      </Badge>
                      <p className="text-xs text-slate-400 mt-1">{getRelativeTime(user.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Perbarui Data
        </Button>
      </div>
    </div>
  );
}
