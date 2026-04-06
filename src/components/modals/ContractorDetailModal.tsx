'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Star, Briefcase, CheckCircle, Clock, Mail, Phone, MapPin,
  Award, Shield, FileCheck, TrendingUp, Users, Loader2,
  AlertTriangle, CheckCircle2, Globe, Building2
} from 'lucide-react';
import { Contractor } from '@/types';
import { formatRupiah } from '@/lib/helpers';

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

export function ContractorDetailModal({ open, onOpenChange, contractor }: ContractorDetailModalProps) {
  const [profile, setProfile] = useState<EnhancedProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);

  const contractorId = contractor?.id;
  const profileKey = open && contractorId ? contractorId : null;

  // Trigger data load on key change
  if (profileKey !== lastKey) {
    if (profileKey) {
      setLoading(true);
      setProfile(null);
      setLastKey(profileKey);
      fetch(`/api/contractors/${profileKey}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setProfile(data.contractor);
          }
        })
        .catch(err => {
          console.error('Failed to load enhanced profile:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setProfile(null);
      setLoading(false);
      setLastKey(null);
    }
  }

  if (!contractor) return null;

  const profileData = profile;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.round(rating) ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'}`}
      />
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] p-0">
        <ScrollArea className="max-h-[85vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-xl">
                    {profile?.company?.name || contractor.company?.name || contractor.name}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    {profile?.company?.specialization || contractor.company?.specialization}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  {profile?.isLocal && (
                    <Badge className="bg-green-600 hover:bg-green-700 text-white gap-1">
                      <Globe className="h-3 w-3" /> Kontraktor Lokal
                    </Badge>
                  )}
                  {(contractor.isVerified || profile?.isVerified) && (
                    <Badge className="bg-primary gap-1">
                      <CheckCircle className="h-3 w-3" /> Terverifikasi
                    </Badge>
                  )}
                </div>
              </div>
            </DialogHeader>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-slate-500">Memuat profil lengkap...</span>
              </div>
            ) : profile ? (
              <div className="space-y-6">
                {/* Badges Section */}
                {profile.badges.length > 0 && (
                  <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-50">
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
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: Star, value: profile.stats.rating.toFixed(1), label: 'Rating', sublabel: `${profile.stats.totalReviews} ulasan`, color: 'text-yellow-500' },
                    { icon: Briefcase, value: profile.stats.totalProjects, label: 'Total Proyek', sublabel: `${profile.stats.completedProjects} selesai`, color: 'text-primary' },
                    { icon: TrendingUp, value: `${profile.stats.winRate}%`, label: 'Win Rate', sublabel: `${profile.stats.acceptedBids} diterima`, color: 'text-green-600' },
                    { icon: Clock, value: profile.company.experienceYears, label: 'Tahun', sublabel: 'Pengalaman', color: 'text-purple-600' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-3 bg-slate-50 rounded-lg">
                      <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-1`} />
                      <p className="font-bold text-lg">{stat.value}</p>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                      <p className="text-xs text-slate-400">{stat.sublabel}</p>
                    </div>
                  ))}
                </div>

                {/* Certifications Section */}
                {profile.certifications.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-primary" /> Sertifikasi
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {profile.certifications.map((cert) => (
                          <div key={cert.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${cert.isVerified ? 'bg-green-100' : 'bg-slate-200'}`}>
                                <Shield className={`h-4 w-4 ${cert.isVerified ? 'text-green-600' : 'text-slate-400'}`} />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{cert.type}</p>
                                <p className="text-xs text-slate-500">{cert.number} - {cert.issuedBy}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {cert.isVerified ? (
                                <Badge className="bg-green-100 text-green-700 text-xs gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Terverifikasi
                                </Badge>
                              ) : cert.isExpired ? (
                                <Badge variant="destructive" className="text-xs gap-1">
                                  <AlertTriangle className="h-3 w-3" /> Kedaluwarsa
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Menunggu Verifikasi</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Separator />

                {/* About */}
                <div>
                  <h4 className="font-semibold mb-2">Tentang Perusahaan</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {profile.company.description || contractor.company?.description || 'Belum ada deskripsi'}
                  </p>
                </div>

                {/* Company Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" /> Informasi Perusahaan
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tipe Perusahaan</span>
                          <span className="font-medium">{profile.company.type || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">NIB</span>
                          <span className="font-medium">{profile.company.nib || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Jumlah Karyawan</span>
                          <span className="font-medium">{profile.company.employeeCount} orang</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Dokumen Terverifikasi</span>
                          <span className="font-medium">{profile.verifiedDocuments} dokumen</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" /> Kontak & Lokasi
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span>{contractor.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span>{contractor.phone || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span>
                            {profile.company.city}{profile.company.province ? `, ${profile.company.province}` : ''}
                          </span>
                        </div>
                        {profile.company.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                            <span className="text-slate-500">{profile.company.address}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Rating Breakdown */}
                {profile.stats.totalReviews > 0 && (
                  <Card>
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
                          <div key={item.label} className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              {renderStars(item.value)}
                            </div>
                            <p className="text-lg font-bold">{item.value.toFixed(1)}</p>
                            <p className="text-xs text-slate-500">{item.label}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Portfolio */}
                {profile.portfolios.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" /> Portofolio ({profile.portfolios.length})
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {profile.portfolios.slice(0, 5).map((portfolio) => (
                        <div key={portfolio.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-medium text-sm">{portfolio.title}</h5>
                              <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                <MapPin className="h-3 w-3" /> {portfolio.location || '-'}
                                <span className="text-slate-300">|</span>
                                <Calendar className="h-3 w-3" /> {portfolio.year}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">{portfolio.category}</Badge>
                          </div>
                          {portfolio.budget && (
                            <p className="text-sm text-primary font-medium mt-2">
                              {formatRupiah(portfolio.budget)}
                            </p>
                          )}
                          {portfolio.images && portfolio.images.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {portfolio.images.slice(0, 3).map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`${portfolio.title} ${idx + 1}`}
                                  className="w-16 h-16 object-cover rounded-md"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Reviews */}
                {profile.reviews.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" /> Ulasan Terbaru
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {profile.reviews.slice(0, 3).map((review) => (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-primary">
                                  {review.fromUser.name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{review.fromUser.name}</p>
                                <p className="text-xs text-slate-400">
                                  {review.fromUser.company || review.project.title}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          {review.review && (
                            <p className="text-sm text-slate-600 mt-1">&quot;{review.review}&quot;</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Fallback to basic contractor info when enhanced profile not available */
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: Star, value: contractor.company?.rating || '0', label: 'Rating', color: 'text-yellow-500' },
                    { icon: Briefcase, value: contractor.company?.totalProjects || 0, label: 'Total Proyek', color: 'text-primary' },
                    { icon: CheckCircle, value: contractor.company?.completedProjects || 0, label: 'Selesai', color: 'text-blue-500' },
                    { icon: Clock, value: contractor.company?.experienceYears || 0, label: 'Tahun', color: 'text-purple-600' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-4 bg-slate-50 rounded-lg">
                      <stat.icon className={`h-6 w-6 ${stat.color} mx-auto mb-1`} />
                      <p className="font-bold">{stat.value}</p>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Tentang</h4>
                  <p className="text-slate-600">{contractor.company?.description || 'Belum ada deskripsi'}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Informasi Kontak</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">{contractor.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">{contractor.phone || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">{contractor.company?.city || '-'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Portofolio</h4>
                  {contractor.portfolios.length > 0 ? (
                    <div className="space-y-3">
                      {contractor.portfolios.map((portfolio) => (
                        <div key={portfolio.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-medium">{portfolio.title}</h5>
                              <p className="text-sm text-slate-500">{portfolio.location || '-'}</p>
                            </div>
                            <Badge variant="outline">{portfolio.category}</Badge>
                          </div>
                          {portfolio.budget && (
                            <p className="text-sm text-primary font-medium mt-2">{formatRupiah(portfolio.budget)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">Belum ada portofolio</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Calendar({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
    </svg>
  );
}
