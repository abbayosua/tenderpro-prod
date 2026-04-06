'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetTrigger, SheetClose
} from '@/components/ui/sheet';
import {
  Building2, Star, MapPin, Briefcase, CheckCircle,
  User, UserPlus, Eye, Calculator, Sparkles, Globe,
  FileCheck, Shield, Award, Lightbulb, TrendingUp,
  Menu, LogIn, ChevronRight
} from 'lucide-react';
import { Contractor, Project } from '@/types';
import { formatRupiah } from '@/lib/helpers';
import { BackgroundPaths } from '@/components/background-paths';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import {
  HeroSection,
  TrustSection,
  HowItWorksSection,
  TestimonialsSection,
  SuccessProjectsSection,
  ProjectCategoriesSection,
  PartnersSection,
  FAQSection,
  CTASection,
  FooterSection,
} from './sections';

interface LocalContractor extends Contractor {
  isLocal?: boolean;
  certifications?: Array<{ type: string; isVerified: boolean }>;
  badges?: Array<{ type: string; label: string; icon: string }>;
}

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
  onShowCostEstimator?: () => void;
  localContractors?: LocalContractor[];
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
  onShowCostEstimator,
  localContractors = [],
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
            <a href="#contractors" className="text-slate-600 hover:text-primary transition-colors text-sm font-medium">Kontraktor</a>
            <a href="#local-contractors" className="text-slate-600 hover:text-green-600 transition-colors flex items-center gap-1 text-sm font-medium">
              <Globe className="h-4 w-4" /> Lokal
            </a>
            <a href="#projects" className="text-slate-600 hover:text-primary transition-colors text-sm font-medium">Proyek</a>
            <a href="#cost-estimator" className="text-slate-600 hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium">
              <Calculator className="h-4 w-4" /> Estimasi
            </a>
            <a href="#how-it-works" className="text-slate-600 hover:text-primary transition-colors text-sm font-medium">Cara Kerja</a>
            <a href="#testimonials" className="text-slate-600 hover:text-primary transition-colors text-sm font-medium">Testimoni</a>
            <a href="#faq" className="text-slate-600 hover:text-primary transition-colors text-sm font-medium">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Button variant="ghost" onClick={onDashboard} className="text-sm font-medium">Dashboard</Button>
                  <Button variant="outline" onClick={onLogout} className="text-sm"><User className="h-4 w-4 mr-2" /> Keluar</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={onLogin} className="text-sm h-10">Masuk</Button>
                  <Button onClick={() => onRegister('OWNER')} className="bg-primary hover:bg-primary/90 text-sm h-10 shadow-sm shadow-primary/20">
                    <UserPlus className="h-4 w-4 mr-2" /> Daftar
                  </Button>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Menu className="h-5 w-5 text-slate-700" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0">
                  {/* Mobile menu header */}
                  <div className="bg-gradient-to-br from-primary via-primary/90 to-teal-700 px-6 py-6">
                    <div className="flex items-center gap-2 mb-1">
                      <img src="/logo.png" alt="TenderPro" className="h-7 w-auto" />
                      <span className="text-xl font-bold text-white">TenderPro</span>
                    </div>
                    <p className="text-white/60 text-xs">Platform Tender Konstruksi Terpercaya</p>
                  </div>

                  {/* Navigation links */}
                  <div className="px-4 py-4">
                    <nav className="space-y-1">
                      <SheetClose asChild>
                        <a href="#contractors" className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-primary transition-all duration-200 font-medium">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            <span>Kontraktor</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </a>
                      </SheetClose>
                      <SheetClose asChild>
                        <a href="#local-contractors" className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-700 hover:bg-green-50 hover:text-green-600 transition-all duration-200 font-medium">
                          <div className="flex items-center gap-3">
                            <Globe className="h-4 w-4 text-slate-400" />
                            <span>Kontraktor Lokal</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </a>
                      </SheetClose>
                      <SheetClose asChild>
                        <a href="#projects" className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-primary transition-all duration-200 font-medium">
                          <div className="flex items-center gap-3">
                            <Briefcase className="h-4 w-4 text-slate-400" />
                            <span>Proyek</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </a>
                      </SheetClose>
                      <SheetClose asChild>
                        <a href="#cost-estimator" className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-primary transition-all duration-200 font-medium">
                          <div className="flex items-center gap-3">
                            <Calculator className="h-4 w-4 text-slate-400" />
                            <span>Estimasi Biaya</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </a>
                      </SheetClose>
                      <SheetClose asChild>
                        <a href="#how-it-works" className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-primary transition-all duration-200 font-medium">
                          <div className="flex items-center gap-3">
                            <Lightbulb className="h-4 w-4 text-slate-400" />
                            <span>Cara Kerja</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </a>
                      </SheetClose>
                      <SheetClose asChild>
                        <a href="#testimonials" className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-primary transition-all duration-200 font-medium">
                          <div className="flex items-center gap-3">
                            <Star className="h-4 w-4 text-slate-400" />
                            <span>Testimoni</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </a>
                      </SheetClose>
                      <SheetClose asChild>
                        <a href="#faq" className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-primary transition-all duration-200 font-medium">
                          <div className="flex items-center gap-3">
                            <FileCheck className="h-4 w-4 text-slate-400" />
                            <span>FAQ</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </a>
                      </SheetClose>
                    </nav>

                    {/* Divider */}
                    <div className="h-px bg-slate-100 my-4" />

                    {/* Dark mode toggle in mobile */}
                    <div className="flex items-center justify-between px-4 py-2 mb-2">
                      <span className="text-sm font-medium text-slate-700">Mode Gelap</span>
                      <ThemeToggle />
                    </div>

                    {/* Auth buttons */}
                    <div className="space-y-2 px-1">
                      {user ? (
                        <>
                          <SheetClose asChild>
                            <Button variant="outline" onClick={onDashboard} className="w-full h-11 font-medium">
                              Dashboard
                            </Button>
                          </SheetClose>
                          <SheetClose asChild>
                            <Button variant="outline" onClick={onLogout} className="w-full h-11 font-medium border-slate-200">
                              <User className="h-4 w-4 mr-2" /> Keluar
                            </Button>
                          </SheetClose>
                        </>
                      ) : (
                        <>
                          <SheetClose asChild>
                            <Button variant="outline" onClick={onLogin} className="w-full h-11 font-medium border-slate-200">
                              <LogIn className="h-4 w-4 mr-2" /> Masuk
                            </Button>
                          </SheetClose>
                          <SheetClose asChild>
                            <Button onClick={() => onRegister('OWNER')} className="w-full h-11 font-medium bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20">
                              <UserPlus className="h-4 w-4 mr-2" /> Daftar Sekarang
                            </Button>
                          </SheetClose>
                        </>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection onRegister={onRegister} />

      {/* Trust Section */}
      <TrustSection />

      {/* Contractors Section */}
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

      {/* Local Contractor Highlight Section */}
      <section id="local-contractors" className="relative z-10 py-16 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-2 mb-4">
              <Globe className="h-5 w-5" />
              <span className="font-semibold text-sm">Dukung Kontraktor Indonesia</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Kontraktor Lokal Indonesia</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Kontraktor dengan sertifikasi Indonesia yang terverifikasi. Prioritaskan kontraktor lokal untuk mendukung perekonomian bangsa.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="border-green-200 bg-white shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-bold text-slate-800 mb-1">Sertifikasi Resmi</h3>
                <p className="text-sm text-slate-600">SIUJK, SBU, SKA, SKT - sertifikasi resmi dari lembaga pemerintah Indonesia</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-white shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-bold text-slate-800 mb-1">Badge Penghargaan</h3>
                <p className="text-sm text-slate-600">Sistem badge untuk mengakui keunggulan kontraktor lokal Indonesia</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-white shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-bold text-slate-800 mb-1">Prioritas Lokal</h3>
                <p className="text-sm text-slate-600">Kontraktor lokal mendapat prioritas tampilan di pencarian proyek</p>
              </CardContent>
            </Card>
          </div>

          {localContractors.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {localContractors.slice(0, 6).map((c) => (
                <Card key={c.id} className="hover:shadow-lg transition-shadow border-green-200 bg-white">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{c.company?.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" /> {c.company?.city}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        {c.isLocal && (
                          <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1">
                            <Globe className="h-3 w-3" /> Lokal
                          </Badge>
                        )}
                        {c.isVerified && (
                          <Badge className="bg-primary text-xs gap-1">
                            <CheckCircle className="h-3 w-3" /> Terverifikasi
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{c.company?.rating || '0'}</span>
                      <span className="text-slate-500 text-sm">({c.company?.totalProjects} proyek)</span>
                    </div>
                    {c.certifications && c.certifications.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {c.certifications.slice(0, 3).map((cert, i) => (
                          <Badge key={i} variant="secondary" className="text-xs bg-blue-50 text-blue-700 gap-1">
                            <FileCheck className="h-3 w-3" /> {cert.type}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {c.badges && c.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {c.badges.slice(0, 3).map((badge, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {badge.icon} {badge.label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-green-50/50 border-t border-green-100">
                    <Button variant="ghost" size="sm" className="w-full text-green-700 hover:text-green-800 hover:bg-green-50" onClick={() => setSelectedContractor(c)}>
                      Lihat Profil Lengkap
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg border border-green-200">
              <Building2 className="h-12 w-12 text-green-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-1">Belum ada kontraktor lokal terdaftar</p>
              <p className="text-sm text-slate-400">Kontraktor dengan sertifikasi Indonesia akan ditampilkan di sini</p>
            </div>
          )}
        </div>
      </section>

      {/* Cost Estimator CTA Section */}
      <section id="cost-estimator" className="relative z-10 py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-gradient-to-r from-primary/5 via-purple-50 to-primary/5 rounded-2xl p-8 md:p-12 border border-primary/10">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 mb-4">
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold text-sm">Fitur AI Baru</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-3">Kalkulator Estimasi Biaya AI</h2>
              <p className="text-slate-600 mb-6">
                Dapatkan estimasi biaya proyek konstruksi yang akurat dengan bantuan AI. Estimasi disesuaikan dengan harga pasar Indonesia dan merekomendasikan material lokal serta kontraktor Indonesia.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { icon: Calculator, label: 'Estimasi Cerdas', desc: 'AI analisis harga pasar' },
                  { icon: Globe, label: 'Harga Lokal', desc: 'Sesuai pasar Indonesia' },
                  { icon: Lightbulb, label: 'Tips Eksklusif', desc: 'Rekomendasi ahli' },
                  { icon: TrendingUp, label: 'Rincian Lengkap', desc: 'Breakdown biaya detail' },
                ].map((item) => (
                  <div key={item.label} className="text-center p-3 bg-white rounded-lg shadow-sm">
                    <item.icon className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-xs font-semibold">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 h-12 px-8 text-base"
                onClick={onShowCostEstimator}
              >
                <Sparkles className="h-5 w-5 mr-2" /> Hitung Estimasi Biaya Sekarang
              </Button>
              <p className="text-xs text-slate-400 mt-3">Gratis - Tanpa perlu mendaftar</p>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
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

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Success Projects Section */}
      <SuccessProjectsSection />

      {/* Project Categories Section */}
      <ProjectCategoriesSection />

      {/* Partners Section */}
      <PartnersSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <CTASection onRegister={onRegister} />

      {/* Footer Section */}
      <FooterSection />
    </div>
  );
}
