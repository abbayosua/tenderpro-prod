'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2, Star, MapPin, Briefcase, CheckCircle,
  User, UserPlus, Eye
} from 'lucide-react';
import { Contractor, Project } from '@/types';
import { formatRupiah } from '@/lib/helpers';
import { BackgroundPaths } from '@/components/background-paths';
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
