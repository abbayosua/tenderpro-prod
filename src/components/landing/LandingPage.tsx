'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2, Star, MapPin, Briefcase, CheckCircle, TrendingUp,
  User, UserPlus, Shield, Target, Handshake, FileCheck, Eye,
  ChevronRight, Mail, Phone
} from 'lucide-react';
import { Contractor, Project } from '@/types';
import { formatRupiah, testimonialData, successProjectData, projectCategoryData, partnerData, faqData } from '@/lib/helpers';
import { BackgroundPaths } from '@/components/background-paths';

interface LandingPageProps {
  user: { name: string } | null;
  contractors: Contractor[];
  projects: Project[];
  selectedContractor: Contractor | null;
  setSelectedContractor: (contractor: Contractor | null) => void;
  onLogin: () => void;
  onRegister: (role: 'OWNER' | 'CONTRACTOR') => void;
  onLogout: () => void;
  onDashboard: () => void;
}

export function LandingPage({
  user,
  contractors,
  projects,
  selectedContractor,
  setSelectedContractor,
  onLogin,
  onRegister,
  onLogout,
  onDashboard,
}: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white relative">
      <BackgroundPaths />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="TenderPro" className="h-8 w-auto" />
            <span className="text-2xl font-bold text-slate-800">TenderPro</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#contractors" className="text-slate-600 hover:text-primary transition-colors">Kontraktor</a>
            <a href="#projects" className="text-slate-600 hover:text-primary transition-colors">Proyek</a>
            <a href="#how-it-works" className="text-slate-600 hover:text-primary transition-colors">Cara Kerja</a>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button variant="ghost" onClick={onDashboard}>Dashboard</Button>
                <Button variant="outline" onClick={onLogout}><User className="h-4 w-4 mr-2" /> Keluar</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={onLogin}>Masuk</Button>
                <Button onClick={() => onRegister('OWNER')} className="bg-primary hover:bg-primary/90">
                  <UserPlus className="h-4 w-4 mr-2" /> Daftar
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative w-full overflow-hidden pb-10 pt-20 md:pb-16 md:pt-24">
        <div className="container relative z-10 mx-auto max-w-2xl px-4 text-center md:max-w-4xl md:px-6 lg:max-w-7xl">
          <span className="mb-6 inline-block rounded-full border border-primary/30 px-4 py-1.5 text-xs font-medium text-primary">
            PLATFORM TENDER KONSTRUKSI TERPERCAYA
          </span>
          <h1 className="mx-auto mb-6 max-w-4xl text-4xl font-bold text-slate-900 md:text-5xl lg:text-6xl">
            Hubungkan Kontraktor &{' '}
            <span className="text-primary">Pemilik Proyek</span> Terpercaya
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-600 md:text-xl">
            Platform tender konstruksi terpercaya di Indonesia. Temukan kontraktor berkualitas atau dapatkan proyek impian Anda dengan mudah dan aman.
          </p>
          <div className="mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="w-full rounded-full bg-primary px-8 py-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:bg-primary/90 sm:w-auto" onClick={() => onRegister('OWNER')}>
              <User className="h-5 w-5 mr-2" /> Daftar sebagai Pemilik Proyek
            </Button>
            <Button size="lg" variant="outline" className="w-full rounded-full border-slate-300 px-8 py-6 text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-100 hover:text-slate-900 sm:w-auto" onClick={() => onRegister('CONTRACTOR')}>
              <Building2 className="h-5 w-5 mr-2" /> Daftar sebagai Kontraktor
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8">
            {[
              { icon: CheckCircle, value: '500+', label: 'Proyek Selesai' },
              { icon: TrendingUp, value: 'Rp 50M+', label: 'Nilai Proyek' },
              { icon: Building2, value: '150+', label: 'Kontraktor Aktif' },
              { icon: Star, value: '4.8', label: 'Rating Rata-rata' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <stat.icon className="h-6 w-6 text-primary mb-2" />
                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="relative z-10 py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Mengapa Memilih TenderPro?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Terverifikasi', desc: 'Semua kontraktor dan pemilik proyek melalui proses verifikasi dokumen yang ketat' },
              { icon: Target, title: 'Transparan', desc: 'Proses tender yang transparan dengan informasi lengkap mengenai proyek dan kontraktor' },
              { icon: Handshake, title: 'Terpercaya', desc: 'Ribuan proyek telah berhasil diselesaikan melalui platform kami' },
            ].map((item) => (
              <div key={item.title} className="text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contractors */}
      <section id="contractors" className="relative z-10 py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Kontraktor Terpercaya</h2>
          <p className="text-slate-600 mb-8">Kontraktor terverifikasi dengan rekam jejak yang baik</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contractors.filter(c => c.isVerified).slice(0, 6).map((contractor) => (
              <Card key={contractor.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{contractor.company?.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" /> {contractor.company?.city}
                      </CardDescription>
                    </div>
                    {contractor.isVerified && (
                      <Badge className="bg-primary"><CheckCircle className="h-3 w-3 mr-1" /> Terverifikasi</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{contractor.company?.rating}</span>
                    <span className="text-slate-500 text-sm">({contractor.company?.totalProjects} proyek)</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {contractor.company?.specialization?.split(',').map((spec, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{spec.trim()}</Badge>
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{contractor.company?.description}</p>
                </CardContent>
                <CardFooter className="bg-slate-50 border-t">
                  <div className="flex items-center justify-between w-full text-sm text-slate-600">
                    <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {contractor.company?.experienceYears} tahun</span>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedContractor(contractor)}>Lihat Detail</Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="relative z-10 py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Proyek Aktif</h2>
          <p className="text-slate-600 mb-8">Proyek yang sedang mencari kontraktor</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.slice(0, 6).map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className="bg-primary/10 text-primary">{project.category}</Badge>
                    <Badge variant="secondary">{project.bidCount} Penawaran</Badge>
                  </div>
                  <CardTitle className="text-lg mt-3">{project.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {project.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-4">{project.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-slate-500">Anggaran</p>
                      <p className="font-bold text-primary">{formatRupiah(project.budget)}</p>
                    </div>
                    {project.duration && (
                      <div className="text-right">
                        <p className="text-slate-500">Durasi</p>
                        <p className="font-medium">{project.duration} hari</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50 border-t">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm text-slate-600 flex items-center gap-1">
                      <User className="h-4 w-4" /> {project.owner.company || project.owner.name}
                    </span>
                    <span className="text-sm text-slate-500 flex items-center gap-1"><Eye className="h-4 w-4" /> {project.viewCount}</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Cara Kerja</h2>
          </div>
          <Tabs defaultValue="owner" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="owner">Sebagai Pemilik Proyek</TabsTrigger>
              <TabsTrigger value="contractor">Sebagai Kontraktor</TabsTrigger>
            </TabsList>
            <TabsContent value="owner" className="space-y-8">
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { step: 1, title: 'Daftar Akun', desc: 'Buat akun sebagai pemilik proyek dan lengkapi profil' },
                  { step: 2, title: 'Pasang Proyek', desc: 'Unggah detail proyek beserta persyaratan' },
                  { step: 3, title: 'Pilih Penawaran', desc: 'Review dan pilih penawaran terbaik dari kontraktor' },
                  { step: 4, title: 'Mulai Proyek', desc: 'Konfirmasi dan mulai pengerjaan proyek' },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-slate-600 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="contractor" className="space-y-8">
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { step: 1, title: 'Daftar Akun', desc: 'Buat akun sebagai kontraktor dan lengkapi profil perusahaan' },
                  { step: 2, title: 'Verifikasi', desc: 'Unggah dokumen legalitas untuk proses verifikasi' },
                  { step: 3, title: 'Cari Proyek', desc: 'Temukan proyek yang sesuai dengan keahlian Anda' },
                  { step: 4, title: 'Ajukan Penawaran', desc: 'Kirim proposal dan penawaran harga' },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-slate-600 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Apa Kata Mereka?</h2>
            <p className="text-slate-600">Testimoni dari pengguna TenderPro</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonialData.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img src={testimonial.avatar} alt={testimonial.name} className="w-14 h-14 rounded-full object-cover border-2 border-primary/20" />
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-slate-500">{testimonial.role}</p>
                      <p className="text-xs text-primary">{testimonial.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-200'}`} />
                    ))}
                  </div>
                  <p className="text-slate-600 text-sm italic">"{testimonial.text}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Projects */}
      <section className="relative z-10 py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Proyek Sukses</h2>
            <p className="text-slate-600">Beberapa proyek yang telah berhasil diselesaikan melalui TenderPro</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {successProjectData.map((project, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="relative h-48 overflow-hidden">
                  <img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <Badge className="absolute top-3 left-3 bg-primary">{project.category}</Badge>
                  <Badge variant="secondary" className="absolute top-3 right-3"><CheckCircle className="h-3 w-3 mr-1" /> Selesai</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {project.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Nilai Proyek</span>
                      <span className="font-bold text-primary">{formatRupiah(project.budget)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Durasi</span>
                      <span className="font-medium">{project.duration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Kontraktor</span>
                      <span className="font-medium text-right">{project.contractor}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Project Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Kategori Proyek</h2>
            <p className="text-slate-600">Berbagai jenis proyek yang dapat Anda kelola di TenderPro</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {projectCategoryData.map((category, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer overflow-hidden">
                <div className="relative h-24 overflow-hidden">
                  <img src={category.image} alt={category.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                  <Building2 className="absolute bottom-2 left-3 h-5 w-5 text-white" />
                </div>
                <CardContent className="p-3 text-center">
                  <h3 className="font-medium text-sm mb-1">{category.name}</h3>
                  <p className="text-xs text-slate-500">{category.count}+ proyek</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership */}
      <section className="relative z-10 py-12 bg-white border-y">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Partner</h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {partnerData.map((partner, index) => (
              <div key={index} className="flex items-center justify-center h-12 md:h-14 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                <img src={partner.logo} alt={partner.name} className="h-full w-auto object-contain max-w-[120px] md:max-w-[150px]" />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-8 border-t">
            {[
              { icon: Shield, text: 'ISO 9001:2015' },
              { icon: CheckCircle, text: 'Terdaftar di Kemenparekraf' },
              { icon: FileCheck, text: 'Verifikasi Dokumen Ketat' },
              { icon: Handshake, text: 'Garansi Transaksi Aman' },
            ].map((badge, index) => (
              <div key={index} className="flex items-center gap-2 text-slate-600">
                <badge.icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Pertanyaan Umum</h2>
            <p className="text-slate-600">Jawaban untuk pertanyaan yang sering diajukan</p>
          </div>
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <details key={index} className="group border rounded-lg">
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50">
                  <span className="font-medium text-slate-800">{faq.q}</span>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-4 pb-4 text-slate-600 text-sm">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Siap Memulai Proyek Anda?</h2>
          <p className="text-xl text-primary-foreground/80 mb-8">Bergabung dengan ribuan pemilik proyek dan kontraktor yang telah mempercayai TenderPro</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto" onClick={() => onRegister('OWNER')}>
              <User className="h-5 w-5 mr-2" /> Daftar sebagai Pemilik Proyek
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto" onClick={() => onRegister('CONTRACTOR')}>
              <Building2 className="h-5 w-5 mr-2" /> Daftar sebagai Kontraktor
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 text-primary-foreground/80">
            <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5" /> <span>Gratis Mendaftar</span></div>
            <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5" /> <span>Proses Cepat</span></div>
            <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5" /> <span>Transaksi Aman</span></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="TenderPro" className="h-10 w-auto" />
                <span className="text-3xl font-bold">TenderPro</span>
              </div>
              <p className="text-slate-400 mb-6">Platform penghubung kontraktor dan pemilik proyek konstruksi terpercaya di Indonesia.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Tautan Cepat</h4>
              <ul className="space-y-3 text-slate-400">
                <li><a href="#contractors" className="hover:text-primary transition-colors">Kontraktor</a></li>
                <li><a href="#projects" className="hover:text-primary transition-colors">Proyek</a></li>
                <li><a href="#how-it-works" className="hover:text-primary transition-colors">Cara Kerja</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Kategori Proyek</h4>
              <ul className="space-y-3 text-slate-400">
                <li><a href="#" className="hover:text-primary transition-colors">Pembangunan Rumah</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Renovasi</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Komersial</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Kontak</h4>
              <ul className="space-y-3 text-slate-400">
                <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary/70" /> <span>info@tenderpro.id</span></li>
                <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary/70" /> <span>021-12345678</span></li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary/70" /> <span>Jakarta, Indonesia</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-700 text-center text-slate-400 text-sm">
            <p>© 2024 TenderPro. Semua hak dilindungi undang-undang.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
