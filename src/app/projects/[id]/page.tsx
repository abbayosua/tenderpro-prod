'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, DollarSign, Clock, Eye, FileText, Building2, 
  Calendar, ArrowLeft, Send, AlertCircle, CheckCircle,
  Star, Briefcase, Users, CheckCircle2, Loader2, ChevronRight
} from 'lucide-react';
import { formatRupiah, getStatusColor, getStatusLabel, getRelativeTime } from '@/lib/helpers';
import { useAuthStore } from '@/lib/auth-store';

interface Milestone {
  id: string;
  title: string;
  description?: string | null;
  amount?: number | null;
  dueDate?: string | null;
  completedAt?: string | null;
  status: string;
  order: number;
}

interface RelatedProject {
  id: string;
  title: string;
  category: string;
  location: string;
  budget: number;
  bidCount: number;
  owner: { name: string; avatar?: string | null; isVerified: boolean };
  createdAt: string;
}

interface ProjectOwner {
  id: string;
  name: string;
  avatar?: string | null;
  isVerified: boolean;
  company: string | null;
  totalProjects: number;
  activeProjects: number;
}

interface ProjectData {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget: number;
  duration: number | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  requirements: string[];
  owner: ProjectOwner;
  milestones: Milestone[];
  progress: number;
  bidCount: number;
  lowestBid: number | null;
  relatedProjects: RelatedProject[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  
  const { user, token } = useAuthStore();
  
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBidForm, setShowBidForm] = useState(false);
  
  // Bid form state
  const [proposal, setProposal] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Fetch project detail from public API
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/public`);
        const data = await response.json();
        
        if (data.success) {
          setProject(data.data);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId, router]);
  
  // Check if should show bid form
  useEffect(() => {
    if (searchParams.get('bid') === 'true' && user?.role === 'CONTRACTOR') {
      setShowBidForm(true);
    }
  }, [searchParams, user]);
  
  // Handle bid submission
  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !token) {
      router.push('/?login=true');
      return;
    }
    
    if (user.role !== 'CONTRACTOR') {
      setError('Hanya kontraktor yang dapat mengajukan penawaran');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          proposal,
          price: parseFloat(price),
          duration: parseInt(duration),
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setProposal('');
        setPrice('');
        setDuration('');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(data.message || 'Gagal mengajukan penawaran');
      }
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-500">Memuat detail proyek...</p>
        </div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Proyek tidak ditemukan</p>
          <Link href="/">
            <Button className="mt-4">Kembali ke Beranda</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const statusColor = getStatusColor(project.status);
  const statusLabel = getStatusLabel(project.status);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="TenderPro" className="h-8 w-auto" />
            <span className="text-2xl font-bold text-slate-800">TenderPro</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost">Cari Proyek</Button>
            </Link>
            {user ? (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <Link href="/?login=true">
                <Button>Masuk</Button>
              </Link>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Back button */}
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="secondary">{project.category}</Badge>
                      <Badge className={statusColor}>{statusLabel}</Badge>
                    </div>
                    <CardTitle className="text-2xl">{project.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Eye className="h-4 w-4" />
                    <span>{project.viewCount} dilihat</span>
                    <span className="mx-1">•</span>
                    <Calendar className="h-4 w-4" />
                    <span>{getRelativeTime(project.createdAt)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{project.description}</p>
              </CardContent>
            </Card>
            
            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detail Proyek</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-green-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Anggaran</p>
                      <p className="font-semibold text-lg text-green-700">{formatRupiah(project.budget)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Lokasi</p>
                      <p className="font-semibold">{project.location}</p>
                    </div>
                  </div>
                  
                  {project.duration && (
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 rounded-lg">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Durasi</p>
                        <p className="font-semibold">{project.duration} hari</p>
                      </div>
                    </div>
                  )}
                  
                  {project.lowestBid && (
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-purple-50 rounded-lg">
                        <Star className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Penawaran Terendah</p>
                        <p className="font-semibold">{formatRupiah(project.lowestBid)}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-50 rounded-lg">
                      <FileText className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Total Penawaran</p>
                      <p className="font-semibold">{project.bidCount} penawaran</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Dibuat</p>
                      <p className="font-semibold">{new Date(project.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
                
                {project.requirements && project.requirements.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        Persyaratan Proyek
                      </h4>
                      <ul className="space-y-2">
                        {project.requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-2 text-slate-600">
                            <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{index + 1}</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Progress Milestones */}
            {project.milestones.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Progres Proyek</CardTitle>
                      <CardDescription className="mt-1">
                        {project.milestones.filter(m => m.status === 'COMPLETED').length} dari {project.milestones.length} milestone selesai
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{project.progress}%</p>
                    </div>
                  </div>
                  <Progress value={project.progress} className="h-2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {project.milestones.map((milestone, index) => (
                      <div key={milestone.id} className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          milestone.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-600'
                            : milestone.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {milestone.status === 'COMPLETED' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <span className="text-xs font-bold">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`font-medium text-sm ${milestone.status === 'COMPLETED' ? 'text-green-700' : ''}`}>
                              {milestone.title}
                            </p>
                            {milestone.amount && (
                              <p className="text-sm font-medium text-slate-500 flex-shrink-0 ml-3">
                                {formatRupiah(milestone.amount)}
                              </p>
                            )}
                          </div>
                          {milestone.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{milestone.description}</p>
                          )}
                          {milestone.dueDate && (
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Tenggat: {new Date(milestone.dueDate).toLocaleDateString('id-ID')}
                            </p>
                          )}
                          {milestone.completedAt && (
                            <p className="text-xs text-green-600 mt-1">
                              Selesai: {new Date(milestone.completedAt).toLocaleDateString('id-ID')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Owner Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Pemilik Proyek</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {project.owner.avatar ? (
                      <img src={project.owner.avatar} alt={project.owner.name} className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <Building2 className="h-7 w-7 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg">{project.owner.name}</p>
                      {project.owner.isVerified && (
                        <Badge className="bg-green-600 text-white gap-1">
                          <CheckCircle className="h-3 w-3" /> Terverifikasi
                        </Badge>
                      )}
                    </div>
                    {project.owner.company && (
                      <p className="text-sm text-slate-500">{project.owner.company}</p>
                    )}
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" /> {project.owner.totalProjects} proyek
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {project.owner.activeProjects} aktif
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Projects */}
            {project.relatedProjects.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Proyek Serupa</CardTitle>
                    <Link href="/">
                      <Button variant="ghost" size="sm" className="text-primary">
                        Lihat Semua <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {project.relatedProjects.map((rp) => (
                      <Link key={rp.id} href={`/projects/${rp.id}`}>
                        <div className="border rounded-lg p-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline" className="text-xs">{rp.category}</Badge>
                            <span className="text-xs text-slate-400">{getRelativeTime(rp.createdAt)}</span>
                          </div>
                          <h4 className="font-medium text-sm mb-1 line-clamp-1">{rp.title}</h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {rp.location}
                          </p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t">
                            <span className="text-sm font-semibold text-primary">{formatRupiah(rp.budget)}</span>
                            <span className="text-xs text-slate-500">{rp.bidCount} penawaran</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardContent className="p-5">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <Eye className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                    <p className="text-2xl font-bold">{project.viewCount}</p>
                    <p className="text-xs text-slate-500">Dilihat</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <FileText className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                    <p className="text-2xl font-bold">{project.bidCount}</p>
                    <p className="text-xs text-slate-500">Penawaran</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Bid Form */}
            {showBidForm ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ajukan Penawaran</CardTitle>
                  <CardDescription>
                    Isi form di bawah untuk mengajukan penawaran Anda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {success ? (
                    <div className="text-center py-4">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <p className="font-semibold text-green-600">Penawaran Berhasil Dikirim!</p>
                      <p className="text-sm text-slate-500 mt-1">Mengalihkan ke dashboard...</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitBid} className="space-y-4">
                      {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          <p className="text-sm">{error}</p>
                        </div>
                      )}
                      
                      <div>
                        <Label htmlFor="proposal">Proposal</Label>
                        <Textarea
                          id="proposal"
                          placeholder="Jelaskan proposal Anda..."
                          value={proposal}
                          onChange={(e) => setProposal(e.target.value)}
                          rows={4}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="price">Harga (Rp)</Label>
                          <Input
                            id="price"
                            type="number"
                            placeholder="0"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="duration">Durasi (hari)</Label>
                          <Input
                            id="duration"
                            type="number"
                            placeholder="0"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Anggaran Proyek</p>
                        <p className="font-semibold text-green-700">{formatRupiah(project.budget)}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setShowBidForm(false)}
                        >
                          Batal
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-1"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Kirim
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  {user?.role === 'CONTRACTOR' ? (
                    <>
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send className="h-7 w-7 text-primary" />
                      </div>
                      <p className="text-slate-600 mb-2 font-medium">
                        Tertarik dengan proyek ini?
                      </p>
                      <p className="text-sm text-slate-400 mb-4">
                        Ajukan penawaran terbaik Anda sekarang
                      </p>
                      <Button 
                        className="w-full"
                        size="lg"
                        onClick={() => setShowBidForm(true)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Ajukan Penawaran
                      </Button>
                    </>
                  ) : user?.role === 'OWNER' ? (
                    <>
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="h-7 w-7 text-slate-400" />
                      </div>
                      <p className="text-slate-500">
                        Anda login sebagai Pemilik Proyek. Pemilik tidak dapat mengajukan penawaran.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="h-7 w-7 text-primary" />
                      </div>
                      <p className="text-slate-600 mb-2 font-medium">
                        Login sebagai Kontraktor
                      </p>
                      <p className="text-sm text-slate-400 mb-4">
                        Untuk mengajukan penawaran pada proyek ini
                      </p>
                      <Link href="/?login=true" className="block">
                        <Button className="w-full" size="lg">
                          Masuk / Daftar
                        </Button>
                      </Link>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Info */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3 text-slate-700">Ringkasan Proyek</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kategori</span>
                    <span className="font-medium">{project.category}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-slate-500">Anggaran</span>
                    <span className="font-medium text-green-700">{formatRupiah(project.budget)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-slate-500">Durasi</span>
                    <span className="font-medium">{project.duration ? `${project.duration} hari` : '-'}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-slate-500">Penawaran</span>
                    <span className="font-medium">{project.bidCount}</span>
                  </div>
                  {project.milestones.length > 0 && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-slate-500">Milestone</span>
                        <span className="font-medium">{project.milestones.filter(m => m.status === 'COMPLETED').length}/{project.milestones.length}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
