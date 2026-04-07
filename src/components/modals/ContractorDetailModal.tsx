'use client';

import { useState, useEffect, useReducer, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Star, Briefcase, CheckCircle, Clock, Mail, Phone, MapPin,
  Award, Shield, FileCheck, TrendingUp, Users, Loader2,
  AlertTriangle, CheckCircle2, Globe, Building2, MessageSquareQuote,
  Camera, Quote, Calendar, DollarSign
} from 'lucide-react';
import { Contractor } from '@/types';
import { formatRupiah } from '@/lib/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { ReviewList } from '@/components/shared/ReviewList';

interface ContractorDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractor: Contractor | null;
}

interface EnhancedProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  isVerified: boolean;
  verificationStatus: string;
  isLocal: boolean;
  company: {
    name: string;
    type: string;
    npwp: string;
    nib: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    specialization: string;
    experienceYears: number;
    employeeCount: number;
    description: string;
  };
  stats: {
    totalProjects: number;
    completedProjects: number;
    totalBids: number;
    acceptedBids: number;
    pendingBids: number;
    rejectedBids: number;
    winRate: number;
    responseRate: number;
    rating: number;
    totalReviews: number;
  };
  ratingBreakdown: {
    averageRating: number;
    professionalism: number;
    quality: number;
    timeliness: number;
  };
  certifications: Array<{
    id: string;
    type: string;
    number: string;
    issuedBy: string;
    issuedAt: string;
    expiresAt: string | null;
    isVerified: boolean;
    isExpired: boolean;
  }>;
  badges: Array<{
    id: string;
    type: string;
    label: string;
    description: string | null;
    icon: string | null;
    earnedAt: string;
  }>;
  portfolios: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    clientName: string | null;
    location: string | null;
    year: number;
    budget: number | null;
    images: string[];
  }>;
  completedProjects: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    price: number;
    duration: number;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    review: string | null;
    professionalism: number;
    quality: number;
    timeliness: number;
    createdAt: string;
    fromUser: { id: string; name: string; avatar: string | null; company: string | null };
    project: { id: string; title: string; category: string };
  }>;
  verifiedDocuments: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

const tabContentVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } }
};

export function ContractorDetailModal({ open, onOpenChange, contractor }: ContractorDetailModalProps) {
  const [activeTab, setActiveTab] = useState('tentang');
  const [profileState, dispatch] = useReducer(
    (state: { profile: EnhancedProfile | null; loading: boolean }, action: { type: string; profile?: EnhancedProfile | null }) => {
      switch (action.type) {
        case 'LOAD_START': return { profile: null, loading: true };
        case 'LOAD_SUCCESS': return { profile: action.profile ?? null, loading: false };
        case 'LOAD_ERROR': return { profile: null, loading: false };
        case 'RESET': return { profile: null, loading: false };
        default: return state;
      }
    },
    { profile: null, loading: false }
  );
  const profile = profileState.profile;
  const loading = profileState.loading;

  const contractorId = contractor?.id;
  const profileKey = open && contractorId ? contractorId : null;

  const loadProfile = useCallback((key: string) => {
    dispatch({ type: 'LOAD_START' });
    fetch(`/api/contractors/${key}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          dispatch({ type: 'LOAD_SUCCESS', profile: data.contractor });
        } else {
          dispatch({ type: 'LOAD_ERROR' });
        }
      })
      .catch(err => {
        console.error('Failed to load enhanced profile:', err);
        dispatch({ type: 'LOAD_ERROR' });
      });
  }, []);

  useEffect(() => {
    if (profileKey) {
      loadProfile(profileKey);
    } else {
      dispatch({ type: 'RESET' });
    }
  }, [profileKey, loadProfile]);

  if (!contractor) return null;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.round(rating) ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'}`}
      />
    ));
  };

  const statsData = profile ? [
    { icon: Briefcase, value: profile.stats.totalProjects, label: 'Proyek', sublabel: `${profile.stats.completedProjects} selesai`, color: 'text-primary', bg: 'bg-gradient-to-br from-primary/10 to-teal-500/10' },
    { icon: Star, value: profile.stats.rating.toFixed(1), label: 'Rating', sublabel: `${profile.stats.totalReviews} ulasan`, color: 'text-yellow-600', bg: 'bg-gradient-to-br from-yellow-100 to-amber-100' },
    { icon: Clock, value: `${profile.company.experienceYears}`, label: 'Tahun', sublabel: 'Pengalaman', color: 'text-purple-600', bg: 'bg-gradient-to-br from-purple-100 to-fuchsia-100' },
    { icon: FileCheck, value: profile.certifications.length, label: 'Sertifikasi', sublabel: `${profile.certifications.filter(c => c.isVerified).length} terverifikasi`, color: 'text-emerald-600', bg: 'bg-gradient-to-br from-emerald-100 to-green-100' },
  ] : [
    { icon: Briefcase, value: contractor.company?.totalProjects || 0, label: 'Proyek', sublabel: `${contractor.company?.completedProjects || 0} selesai`, color: 'text-primary', bg: 'bg-gradient-to-br from-primary/10 to-teal-500/10' },
    { icon: Star, value: contractor.company?.rating || '0', label: 'Rating', sublabel: '-', color: 'text-yellow-600', bg: 'bg-gradient-to-br from-yellow-100 to-amber-100' },
    { icon: Clock, value: contractor.company?.experienceYears || 0, label: 'Tahun', sublabel: 'Pengalaman', color: 'text-purple-600', bg: 'bg-gradient-to-br from-purple-100 to-fuchsia-100' },
    { icon: FileCheck, value: 0, label: 'Sertifikasi', sublabel: '-', color: 'text-emerald-600', bg: 'bg-gradient-to-br from-emerald-100 to-green-100' },
  ];

  const companyName = profile?.company?.name || contractor.company?.name || contractor.name;
  const specialization = profile?.company?.specialization || contractor.company?.specialization;
  const description = profile?.company?.description || contractor.company?.description || 'Belum ada deskripsi';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        {/* Gradient Header */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 px-6 py-6 flex-shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="relative flex items-start gap-4">
            {/* Avatar with gradient ring */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-teal-400 to-emerald-500 p-[3px]">
                <div className="w-full h-full rounded-[13px] bg-slate-800 flex items-center justify-center text-white text-xl font-bold">
                  {companyName.charAt(0)}
                </div>
              </div>
              {(contractor.isVerified || profile?.isVerified) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                  className="absolute -bottom-1 -right-1"
                >
                  <div className="relative">
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
                    <div className="relative w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-slate-900">
                      <CheckCircle className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white truncate">{companyName}</h2>
                {profile?.isLocal && (
                  <Badge className="bg-emerald-600/80 hover:bg-emerald-600/90 text-white text-[10px] gap-1 border-0">
                    <Globe className="h-3 w-3" /> Lokal
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-300 mt-0.5">{specialization || 'Kontraktor'}</p>
              {profile && (
                <div className="flex items-center gap-1 mt-2">
                  {renderStars(profile.stats.rating)}
                  <span className="text-xs text-slate-400 ml-1">{profile.stats.rating.toFixed(1)} ({profile.stats.totalReviews})</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="p-6">
            {/* Stats Row */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-4 gap-3 mb-6"
            >
              {statsData.map((stat) => {
                const Icon = stat.icon;
                return (
                  <motion.div key={stat.label} variants={itemVariants} whileHover={{ y: -2 }}>
                    <Card className="border-slate-100 hover:shadow-md transition-shadow duration-200">
                      <CardContent className="p-3 text-center">
                        <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                          <Icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{stat.sublabel}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>

            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : (
              <>
                {/* Badges Section */}
                {profile && profile.badges.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                  >
                    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-teal-50/50">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                          <Award className="h-4 w-4 text-primary" /> Badge & Penghargaan
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.badges.map((badge) => (
                            <div
                              key={badge.id}
                              className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-sm border"
                              title={badge.description || undefined}
                            >
                              <span>{badge.icon || '🏅'}</span>
                              <span className="text-sm font-medium">{badge.label}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Tabs */}
                <Tabs key={profileKey || 'none'} value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full grid grid-cols-4 mb-6">
                    <TabsTrigger value="tentang" className="text-xs">Tentang</TabsTrigger>
                    <TabsTrigger value="portfolio" className="text-xs">Portfolio</TabsTrigger>
                    <TabsTrigger value="sertifikasi" className="text-xs">Sertifikasi</TabsTrigger>
                    <TabsTrigger value="ulasan" className="text-xs">Ulasan</TabsTrigger>
                  </TabsList>

                  {/* Tab: Tentang */}
                  <TabsContent value="tentang">
                    <AnimatePresence mode="wait">
                      <motion.div key="tentang" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                        {/* About */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            Tentang Perusahaan
                          </h4>
                          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
                        </div>

                        <Separator />

                        {/* Company Info + Contact */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="border-slate-100">
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-primary" /> Informasi Perusahaan
                              </h4>
                              <div className="space-y-2.5 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Tipe Perusahaan</span>
                                  <span className="font-medium">{profile?.company?.type || contractor.company?.type || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">NIB</span>
                                  <span className="font-medium">{profile?.company?.nib || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Jumlah Karyawan</span>
                                  <span className="font-medium">{profile?.company?.employeeCount || 0} orang</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Dokumen Terverifikasi</span>
                                  <span className="font-medium">{profile?.verifiedDocuments || 0} dokumen</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border-slate-100">
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" /> Kontak & Lokasi
                              </h4>
                              <div className="space-y-2.5 text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                    <Mail className="h-4 w-4 text-slate-500" />
                                  </div>
                                  <span className="truncate">{contractor.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                    <Phone className="h-4 w-4 text-slate-500" />
                                  </div>
                                  <span>{contractor.phone || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                    <MapPin className="h-4 w-4 text-slate-500" />
                                  </div>
                                  <span className="truncate">
                                    {profile?.company?.city || contractor.company?.city || '-'}{profile?.company?.province ? `, ${profile.company.province}` : ''}
                                  </span>
                                </div>
                                {profile?.company?.address && (
                                  <div className="flex items-start gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                      <MapPin className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <span className="text-slate-500 text-xs leading-relaxed">{profile.company.address}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Rating Breakdown */}
                        {profile && profile.stats.totalReviews > 0 && (
                          <Card className="border-slate-100">
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <Star className="h-4 w-4 text-yellow-500" /> Detail Rating
                              </h4>
                              <div className="grid grid-cols-3 gap-4">
                                {[
                                  { label: 'Profesionalisme', value: profile.ratingBreakdown.professionalism },
                                  { label: 'Kualitas', value: profile.ratingBreakdown.quality },
                                  { label: 'Ketepatan Waktu', value: profile.ratingBreakdown.timeliness },
                                ].map((item) => (
                                  <div key={item.label} className="text-center p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center justify-center gap-0.5 mb-1">
                                      {renderStars(item.value)}
                                    </div>
                                    <p className="text-lg font-bold text-slate-900">{item.value.toFixed(1)}</p>
                                    <p className="text-[10px] text-slate-500">{item.label}</p>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Contact Actions */}
                        <div className="flex gap-3">
                          <Button className="flex-1 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]">
                            <Mail className="h-4 w-4 mr-2" /> Hubungi
                          </Button>
                          <Button variant="outline" className="flex-1 border-slate-200 hover:bg-slate-50 transition-all duration-200">
                            <Briefcase className="h-4 w-4 mr-2" /> Ajukan Proyek
                          </Button>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </TabsContent>

                  {/* Tab: Portfolio */}
                  <TabsContent value="portfolio">
                    <AnimatePresence mode="wait">
                      <motion.div key="portfolio" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                        {profile && profile.portfolios.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profile.portfolios.slice(0, 6).map((portfolio, idx) => (
                              <motion.div
                                key={portfolio.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ y: -4, boxShadow: '0 12px 30px -8px rgba(0,0,0,0.15)' }}
                                className="border border-slate-200 rounded-xl overflow-hidden bg-white transition-shadow duration-200"
                              >
                                {/* Image */}
                                <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                                  {portfolio.images && portfolio.images.length > 0 ? (
                                    <img
                                      src={portfolio.images[0]}
                                      alt={portfolio.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Camera className="h-8 w-8 text-slate-300" />
                                    </div>
                                  )}
                                  <Badge className="absolute top-2 right-2 bg-white/90 text-slate-700 text-[10px] backdrop-blur-sm border-0 shadow-sm">
                                    {portfolio.category}
                                  </Badge>
                                </div>
                                {/* Info */}
                                <div className="p-4">
                                  <h5 className="font-semibold text-sm text-slate-900">{portfolio.title}</h5>
                                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                    {portfolio.location && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> {portfolio.location}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" /> {portfolio.year}
                                    </span>
                                  </div>
                                  {portfolio.budget && (
                                    <p className="text-sm text-primary font-bold mt-2 flex items-center gap-1">
                                      <DollarSign className="h-3.5 w-3.5" /> {formatRupiah(portfolio.budget)}
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : contractor.portfolios.length > 0 ? (
                          <div className="space-y-3">
                            {contractor.portfolios.map((portfolio) => (
                              <motion.div
                                key={portfolio.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h5 className="font-semibold text-sm">{portfolio.title}</h5>
                                    <p className="text-xs text-slate-500 mt-1">{portfolio.location || '-'}</p>
                                  </div>
                                  <Badge variant="outline">{portfolio.category}</Badge>
                                </div>
                                {portfolio.budget && (
                                  <p className="text-sm text-primary font-semibold mt-2">{formatRupiah(portfolio.budget)}</p>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-10">
                            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                              <Briefcase className="h-7 w-7 text-slate-300" />
                            </div>
                            <p className="text-sm font-medium text-slate-500">Belum ada portofolio</p>
                            <p className="text-xs text-slate-400 mt-1">Portofolio akan muncul setelah ditambahkan</p>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </TabsContent>

                  {/* Tab: Sertifikasi */}
                  <TabsContent value="sertifikasi">
                    <AnimatePresence mode="wait">
                      <motion.div key="sertifikasi" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                        {profile && profile.certifications.length > 0 ? (
                          <div className="space-y-3">
                            {profile.certifications.map((cert, idx) => (
                              <motion.div
                                key={cert.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`border-l-4 rounded-lg p-4 bg-white ${
                                  cert.isVerified ? 'border-l-emerald-500' :
                                  cert.isExpired ? 'border-l-red-400' :
                                  'border-l-amber-400'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${
                                      cert.isVerified ? 'bg-emerald-100' :
                                      cert.isExpired ? 'bg-red-50' :
                                      'bg-amber-50'
                                    }`}>
                                      <Shield className={`h-4 w-4 ${
                                        cert.isVerified ? 'text-emerald-600' :
                                        cert.isExpired ? 'text-red-500' :
                                        'text-amber-500'
                                      }`} />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-sm">{cert.type}</p>
                                      <p className="text-xs text-slate-500">{cert.number} — {cert.issuedBy}</p>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0 ml-3">
                                    {cert.isVerified ? (
                                      <Badge className="bg-emerald-100 text-emerald-700 text-xs gap-1 border-emerald-200">
                                        <CheckCircle2 className="h-3 w-3" /> Terverifikasi
                                      </Badge>
                                    ) : cert.isExpired ? (
                                      <Badge variant="destructive" className="text-xs gap-1">
                                        <AlertTriangle className="h-3 w-3" /> Kedaluwarsa
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-amber-100 text-amber-700 text-xs gap-1 border-amber-200">
                                        <Clock className="h-3 w-3" /> Menunggu
                                      </Badge>
                                    )}
                                    <p className="text-[10px] text-slate-400 mt-1">Diterbitkan: {cert.issuedAt}</p>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-10">
                            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                              <FileCheck className="h-7 w-7 text-slate-300" />
                            </div>
                            <p className="text-sm font-medium text-slate-500">Belum ada sertifikasi</p>
                            <p className="text-xs text-slate-400 mt-1">Sertifikasi akan muncul setelah diunggah</p>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </TabsContent>

                  {/* Tab: Ulasan */}
                  <TabsContent value="ulasan">
                    <AnimatePresence mode="wait">
                      <motion.div key="ulasan" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                        {contractor && (
                          <ReviewList contractorId={contractor.id} />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
