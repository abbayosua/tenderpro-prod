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
  Menu, LogIn, ChevronRight, CreditCard, Search,
  Clock, Send, ArrowRight, Wrench
} from 'lucide-react';
import { Contractor, Project } from '@/types';
import { formatRupiah } from '@/lib/helpers';
import { BackgroundPaths } from '@/components/background-paths';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { ScrollToTop } from '@/components/shared/ScrollToTop';
import { QuickSearch } from '@/components/shared/QuickSearch';
import { PlatformStats } from '@/components/shared/PlatformStats';
import {
  HeroSection,
  TrustSection,
  HowItWorksSection,
  TestimonialsSection,
  SuccessProjectsSection,
  ProjectCategoriesSection,
  PartnersSection,
  PricingSection,
  FAQSection,
  CTASection,
  FooterSection,
  NewsletterSection,
  PortfolioShowcase,
} from './sections';
import { motion } from 'framer-motion';
import { useState } from 'react';

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
  onBid?: (project: Project) => void;
  localContractors?: LocalContractor[];
}

// ─── Shared Animation Variants ─────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

// ─── Star Rating Component ─────────────────────────────────
function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${iconSize} ${
            star <= Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-200 fill-slate-200'
          }`}
        />
      ))}
      <span className={`ml-1 font-semibold ${size === 'sm' ? 'text-xs' : 'text-sm'} text-slate-700`}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
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
  onBid,
  localContractors = [],
}: LandingPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    // Scroll to relevant section based on query
    if (query.toLowerCase().includes('proyek')) {
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
    } else if (query.toLowerCase().includes('kontraktor')) {
      document.getElementById('contractors')?.scrollIntoView({ behavior: 'smooth' });
    } else if (query.toLowerCase().includes('lokal')) {
      document.getElementById('local-contractors')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      <BackgroundPaths />

      {/* ═══════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════ */}
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
            <a href="#portfolio" className="text-slate-600 hover:text-primary transition-colors text-sm font-medium">Portofolio</a>
            <a href="#cost-estimator" className="text-slate-600 hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium">
              <Calculator className="h-4 w-4" /> Estimasi
            </a>
            <a href="#how-it-works" className="text-slate-600 hover:text-primary transition-colors text-sm font-medium">Cara Kerja</a>
            <a href="#testimonials" className="text-slate-600 hover:text-primary transition-colors text-sm font-medium">Testimoni</a>
            <a href="#pricing" className="text-slate-600 hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium">
              <CreditCard className="h-4 w-4" /> Harga
            </a>
            <a href="#faq" className="text-slate-600 hover:text-primary transition-colors text-sm font-medium">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <QuickSearch onSearch={handleQuickSearch} />
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
                        <a href="#pricing" className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-primary transition-all duration-200 font-medium">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-4 w-4 text-slate-400" />
                            <span>Harga</span>
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

      {/* ═══════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════ */}
      <HeroSection onRegister={onRegister} />

      {/* ═══════════════════════════════════════════════════════
          TRUST SECTION
      ═══════════════════════════════════════════════════════ */}
      <TrustSection />

      {/* ═══════════════════════════════════════════════════════
          PLATFORM STATS
      ═══════════════════════════════════════════════════════ */}
      <PlatformStats />

      {/* ═══════════════════════════════════════════════════════
          CONTRACTORS SECTION (Enhanced)
      ═══════════════════════════════════════════════════════ */}
      <section id="contractors" className="relative z-10 py-20 bg-white overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10"
          >
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Kontraktor Terpercaya</h2>
              <p className="text-slate-600">Kontraktor terverifikasi dengan rekam jejak yang baik</p>
            </div>
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 rounded-xl w-fit"
              onClick={() => document.getElementById('contractors')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Search className="h-4 w-4 mr-2" />
              Lihat Semua Kontraktor
            </Button>
          </motion.div>

          {/* Contractor Cards Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {contractors.filter(c => c.isVerified).slice(0, 6).map((contractor) => (
              <motion.div
                key={contractor.id}
                variants={itemVariants}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="group"
              >
                <Card className="h-full border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 overflow-hidden relative">
                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-teal-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg" />

                  <CardHeader className="relative z-10">
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
                  <CardContent className="relative z-10">
                    {/* Star rating display */}
                    <div className="mb-2">
                      <StarRating rating={contractor.company?.rating || 0} />
                    </div>
                    <div className="flex items-center gap-2 mb-2 text-sm text-slate-500">
                      <Briefcase className="h-3.5 w-3.5" />
                      <span>{contractor.company?.totalProjects} proyek selesai</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {contractor.company?.specialization?.split(',').map((spec, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{spec.trim()}</Badge>
                      ))}
                    </div>
                    {contractor.company?.specialization && (
                      <p className="text-xs text-slate-500 mb-2">
                        <span className="font-medium text-slate-600">Spesialisasi:</span>{' '}
                        {contractor.company.specialization.split(',').map(s => s.trim()).join(', ')}
                      </p>
                    )}
                    <p className="text-sm text-slate-600 line-clamp-2">{contractor.company?.description}</p>
                  </CardContent>
                  <CardFooter className="bg-slate-50/80 border-t relative z-10">
                    <div className="flex items-center justify-between w-full text-sm text-slate-600">
                      <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {contractor.company?.experienceYears} tahun</span>
                      <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 font-medium" onClick={() => setSelectedContractor(contractor)}>
                        Lihat Detail <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          LOCAL CONTRACTOR HIGHLIGHT SECTION (Enhanced)
      ═══════════════════════════════════════════════════════ */}
      <section id="local-contractors" className="relative z-10 py-20 bg-gradient-to-br from-green-50 via-emerald-50/80 to-teal-50 overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-green-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            {/* Pulsing "Dukung Lokal" badge */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-2 mb-4 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <Globe className="h-5 w-5" />
              <span className="font-semibold text-sm">Dukung Lokal</span>
            </motion.div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Kontraktor Lokal Indonesia</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Kontraktor dengan sertifikasi Indonesia yang terverifikasi. Prioritaskan kontraktor lokal untuk mendukung perekonomian bangsa.
            </p>
          </motion.div>

          {/* Info Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid md:grid-cols-3 gap-6 mb-10"
          >
            {[
              { icon: Shield, title: 'Sertifikasi Resmi', desc: 'SIUJK, SBU, SKA, SKT - sertifikasi resmi dari lembaga pemerintah Indonesia', gradient: 'from-green-100 to-emerald-50' },
              { icon: Award, title: 'Badge Penghargaan', desc: 'Sistem badge untuk mengakui keunggulan kontraktor lokal Indonesia', gradient: 'from-emerald-100 to-teal-50' },
              { icon: TrendingUp, title: 'Prioritas Lokal', desc: 'Kontraktor lokal mendapat prioritas tampilan di pencarian proyek', gradient: 'from-teal-100 to-green-50' },
            ].map((card) => (
              <motion.div
                key={card.title}
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
              >
                <Card className={`border-green-200 bg-gradient-to-br ${card.gradient} shadow-sm hover:shadow-lg transition-all duration-300 h-full`}>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <card.icon className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-1">{card.title}</h3>
                    <p className="text-sm text-slate-600">{card.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Local Contractor Cards */}
          {localContractors.length > 0 ? (
            <>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {localContractors.slice(0, 6).map((c) => (
                  <motion.div
                    key={c.id}
                    variants={itemVariants}
                    whileHover={{ y: -4, transition: { duration: 0.25 } }}
                    className="group"
                  >
                    <Card className="hover:shadow-xl transition-all duration-300 border-green-200 bg-white overflow-hidden relative">
                      {/* Hover gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/[0.03] to-emerald-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg" />

                      <CardHeader className="relative z-10">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-1.5">
                              <span>🇮🇩</span> {c.company?.name}
                            </CardTitle>
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
                      <CardContent className="relative z-10">
                        {/* Star rating */}
                        <div className="mb-2">
                          <StarRating rating={c.company?.rating || 0} />
                        </div>
                        <div className="flex items-center gap-2 mb-2 text-sm text-slate-500">
                          <Briefcase className="h-3.5 w-3.5" />
                          <span>{c.company?.totalProjects} proyek selesai</span>
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
                      <CardFooter className="bg-green-50/50 border-t border-green-100 relative z-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-green-700 hover:text-green-800 hover:bg-green-100 font-medium"
                          onClick={() => setSelectedContractor(c)}
                        >
                          Lihat Profil Lengkap <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              {/* "Lihat Semua Kontraktor Lokal" button */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex justify-center mt-8"
              >
                <Button
                  variant="outline"
                  className="border-green-600 text-green-700 hover:bg-green-600 hover:text-white transition-all duration-300 rounded-xl"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Lihat Semua Kontraktor Lokal
                </Button>
              </motion.div>
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-green-200 shadow-sm">
              <Building2 className="h-12 w-12 text-green-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-1">Belum ada kontraktor lokal terdaftar</p>
              <p className="text-sm text-slate-400">Kontraktor dengan sertifikasi Indonesia akan ditampilkan di sini</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          COST ESTIMATOR CTA SECTION
      ═══════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════
          PROJECTS SECTION (Enhanced)
      ═══════════════════════════════════════════════════════ */}
      <section id="projects" className="relative z-10 py-20 bg-slate-50 overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10"
          >
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Proyek Aktif</h2>
              <p className="text-slate-600">Proyek yang sedang mencari kontraktor</p>
            </div>
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 rounded-xl w-fit"
              onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Search className="h-4 w-4 mr-2" />
              Lihat Semua Proyek
            </Button>
          </motion.div>

          {/* Project Cards Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {projects.slice(0, 6).map((project) => (
              <motion.div
                key={project.id}
                variants={itemVariants}
                whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.3 } }}
                className="group"
              >
                <Card className="h-full border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative">
                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-teal-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg" />

                  <CardHeader className="relative z-10">
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{project.category}</Badge>
                      {/* Bid count badge with gradient */}
                      <Badge className="bg-gradient-to-r from-primary to-teal-500 text-white shadow-sm">
                        <Send className="h-3 w-3 mr-1" />
                        {project.bidCount} Penawaran
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-3">{project.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {project.location}</CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">{project.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-slate-500 text-xs">Anggaran</p>
                        <p className="font-bold text-primary text-lg">{formatRupiah(project.budget)}</p>
                      </div>
                      {project.duration ? (
                        <div className="text-right">
                          <p className="text-slate-500 text-xs flex items-center gap-1 justify-end">
                            <Clock className="h-3 w-3" /> Durasi
                          </p>
                          <p className="font-medium text-slate-700 text-lg">{project.duration} hari</p>
                        </div>
                      ) : (
                        <div className="text-right">
                          <p className="text-slate-500 text-xs flex items-center gap-1 justify-end">
                            <Eye className="h-3 w-3" /> Dilihat
                          </p>
                          <p className="font-medium text-slate-700">{project.viewCount}x</p>
                        </div>
                      )}
                    </div>

                    {/* Progress indicator bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500">Minat kontraktor</span>
                        <span className="font-semibold text-primary">{Math.min(project.bidCount * 17, 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-teal-400 rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${Math.min(project.bidCount * 17, 100)}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-slate-50/80 border-t relative z-10">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm text-slate-600 flex items-center gap-1">
                        <User className="h-4 w-4" /> {project.owner.company || project.owner.name}
                      </span>
                      {onBid && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-500/90 text-white shadow-sm h-8 text-xs"
                          onClick={() => onBid(project)}
                        >
                          <Wrench className="h-3 w-3 mr-1" />
                          Quick Bid
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION COMPONENTS
      ═══════════════════════════════════════════════════════ */}
      <HowItWorksSection />
      <TestimonialsSection />
      <SuccessProjectsSection />

      {/* ═══════════════════════════════════════════════════════
          PORTFOLIO SHOWCASE SECTION
      ═══════════════════════════════════════════════════════ */}
      <PortfolioShowcase />

      <ProjectCategoriesSection />
      <PartnersSection />

      {/* ═══════════════════════════════════════════════════════
          NEWSLETTER SECTION (New)
      ═══════════════════════════════════════════════════════ */}
      <NewsletterSection />

      {/* ═══════════════════════════════════════════════════════
          REMAINING SECTIONS
      ═══════════════════════════════════════════════════════ */}
      <PricingSection />
      <FAQSection />
      <CTASection onRegister={onRegister} />
      <FooterSection />

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
}
