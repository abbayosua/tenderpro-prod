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
import { 
  MapPin, DollarSign, Clock, Eye, FileText, Building2, 
  Calendar, ArrowLeft, Send, AlertCircle, CheckCircle 
} from 'lucide-react';
import { formatRupiah } from '@/lib/helpers';
import { useAuthStore } from '@/lib/auth-store';

interface Project {
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
  requirements: string[];
  viewCount: number;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    owner?: {
      totalProjects: number;
    };
  };
  _count: {
    bids: number;
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  
  const { user, token } = useAuthStore();
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBidForm, setShowBidForm] = useState(false);
  
  // Bid form state
  const [proposal, setProposal] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Fetch project detail
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        const data = await response.json();
        
        if (data.success) {
          setProject(data.data);
        } else {
          router.push('/projects');
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        router.push('/projects');
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-500">Memuat detail proyek...</p>
        </div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">Proyek tidak ditemukan</p>
          <Link href="/projects">
            <Button className="mt-4">Kembali ke Daftar Proyek</Button>
          </Link>
        </div>
      </div>
    );
  }
  
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
            <Link href="/projects">
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
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="secondary" className="mb-2">{project.category}</Badge>
                    <CardTitle className="text-2xl">{project.title}</CardTitle>
                  </div>
                  <Badge className="bg-green-500 text-lg px-3 py-1">Buka untuk Penawaran</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 whitespace-pre-wrap">{project.description}</p>
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
                    <DollarSign className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-slate-500">Budget</p>
                      <p className="font-semibold text-lg">{formatRupiah(project.budget)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-slate-500">Lokasi</p>
                      <p className="font-semibold">{project.location}</p>
                    </div>
                  </div>
                  
                  {project.duration && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-slate-500">Durasi</p>
                        <p className="font-semibold">{project.duration} hari</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-slate-500">Dibuat</p>
                      <p className="font-semibold">{new Date(project.createdAt).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                </div>
                
                {project.requirements && project.requirements.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Persyaratan</h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-600">
                        {project.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Owner Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Pemilik Proyek</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{project.owner.name}</p>
                    <p className="text-sm text-slate-500">
                      {project.owner.owner?.totalProjects || 0} proyek
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <Eye className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                    <p className="text-2xl font-bold">{project.viewCount}</p>
                    <p className="text-xs text-slate-500">Views</p>
                  </div>
                  <div>
                    <FileText className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                    <p className="text-2xl font-bold">{project._count.bids}</p>
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
                          <Label htmlFor="price">Harga Penawaran (Rp)</Label>
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
                          {isSubmitting ? 'Mengirim...' : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Kirim Penawaran
                            </>
                          )}
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
                      <p className="text-slate-600 mb-4">
                        Tertarik dengan proyek ini?
                      </p>
                      <Button 
                        className="w-full"
                        onClick={() => setShowBidForm(true)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Ajukan Penawaran
                      </Button>
                    </>
                  ) : user?.role === 'OWNER' ? (
                    <p className="text-slate-500">
                      Anda login sebagai Owner. Owners tidak dapat mengajukan penawaran.
                    </p>
                  ) : (
                    <>
                      <p className="text-slate-600 mb-4">
                        Login sebagai Kontraktor untuk mengajukan penawaran
                      </p>
                      <Link href="/?login=true">
                        <Button className="w-full">Masuk</Button>
                      </Link>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
