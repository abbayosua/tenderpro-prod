'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Star, MapPin, Briefcase, Award, Shield, Trophy, Clock,
  Plus, X, Search, Loader2, Users, GitCompareArrows,
  CheckCircle, Circle, ChevronRight, Check, Zap, StarHalf
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRupiah } from '@/lib/helpers';

interface ContractorData {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  isVerified: boolean;
  verificationStatus: string;
  rating: number;
  totalReviews: number;
  totalBids: number;
  specialization: string | null;
  experienceYears: number;
  completedProjects: number;
  totalProjects: number;
  city: string | null;
  province: string | null;
  companyName: string | null;
  certifications: Array<{ type: string; number: string; issuedBy: string }>;
  certificationCount: number;
  averageBidPrice: number;
  badges: Array<{ type: string; label: string; icon: string }>;
  badgeCount: number;
}

interface ComparisonRow {
  label: string;
  key: string;
  icon: typeof Star;
  format?: (val: unknown, contractor: ContractorData) => string;
  highlightBest: 'max' | 'min' | null;
}

const comparisonRows: ComparisonRow[] = [
  { label: 'Rating', key: 'rating', icon: Star, highlightBest: 'max' },
  { label: 'Pengalaman', key: 'experienceYears', icon: Clock, format: (val) => `${val} tahun`, highlightBest: 'max' },
  { label: 'Proyek Selesai', key: 'completedProjects', icon: Briefcase, highlightBest: 'max' },
  { label: 'Spesialisasi', key: 'specialization', icon: Award, highlightBest: null },
  { label: 'Sertifikasi', key: 'certificationCount', icon: Shield, highlightBest: 'max' },
  { label: 'Lencana', key: 'badgeCount', icon: Trophy, highlightBest: 'max' },
  { label: 'Lokasi', key: 'city', icon: MapPin, highlightBest: null },
  { label: 'Rata-rata Bid', key: 'averageBidPrice', icon: Briefcase, format: (val) => formatRupiah(val as number), highlightBest: 'min' },
];

// Feature checklist for contractor comparison
const featureChecklist = [
  { label: 'Terverifikasi', key: 'isVerified' },
  { label: 'Pengalaman ≥ 3 tahun', check: (c: ContractorData) => c.experienceYears >= 3 },
  { label: 'Rating ≥ 4.0', check: (c: ContractorData) => c.rating >= 4.0 },
  { label: 'Sertifikasi', check: (c: ContractorData) => c.certificationCount > 0 },
  { label: 'Proyek Selesai ≥ 5', check: (c: ContractorData) => c.completedProjects >= 5 },
  { label: 'Memiliki Lencana', check: (c: ContractorData) => c.badgeCount > 0 },
];

function RatingBar({ rating, max = 5 }: { rating: number; max?: number }) {
  const percentage = (rating / max) * 100;
  const color =
    rating >= 4 ? 'bg-emerald-500' :
    rating >= 3 ? 'bg-amber-500' :
    rating >= 2 ? 'bg-orange-500' :
    'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
      <span className="text-sm font-bold text-slate-700 flex items-center gap-0.5">
        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export function ContractorCompare() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [contractors, setContractors] = useState<ContractorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; company?: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [preferredId, setPreferredId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchId.trim()) {
      toast.error('Masukkan ID atau nama kontraktor');
      return;
    }
    setSearching(true);
    try {
      const res = await fetch('/api/contractors/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchId.trim(), limit: 10 }),
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.contractors || []);
        setShowSearch(true);
      } else {
        toast.error('Gagal mencari kontraktor');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setSearching(false);
    }
  };

  const addContractor = (id: string) => {
    if (selectedIds.length >= 3) {
      toast.error('Maksimal 3 kontraktor untuk perbandingan');
      return;
    }
    if (selectedIds.includes(id)) {
      toast.info('Kontraktor sudah ditambahkan');
      return;
    }
    setSelectedIds(prev => [...prev, id]);
    setShowSearch(false);
    setSearchId('');
    setSearchResults([]);
  };

  const removeContractor = (id: string) => {
    setSelectedIds(prev => prev.filter(i => i !== id));
    setContractors(prev => prev.filter(c => c.id !== id));
    if (preferredId === id) setPreferredId(null);
  };

  const compare = async () => {
    if (selectedIds.length < 2) {
      toast.error('Pilih minimal 2 kontraktor untuk dibandingkan');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/contractors/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractorIds: selectedIds }),
      });
      const data = await res.json();
      if (data.success) {
        setContractors(data.contractors);
        // Auto-select highest rated as preferred
        const best = data.contractors.reduce((a: ContractorData, b: ContractorData) => a.rating >= b.rating ? a : b);
        setPreferredId(best.id);
      } else {
        toast.error(data.error || 'Gagal membandingkan kontraktor');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const getBestValue = (key: string): number | string | null => {
    if (contractors.length < 2) return null;
    const row = comparisonRows.find(r => r.key === key);
    if (!row || !row.highlightBest) return null;

    const values = contractors.map(c => {
      const val = (c as Record<string, unknown>)[key];
      return typeof val === 'number' ? val : 0;
    }).filter(v => v > 0);

    if (values.length === 0) return null;
    return row.highlightBest === 'max' ? Math.max(...values) : Math.min(...values);
  };

  const handleChooseContractor = (id: string) => {
    const contractor = contractors.find(c => c.id === id);
    if (contractor) {
      setPreferredId(id);
      toast.success(`${contractor.name} dipilih sebagai kontraktor pilihan`);
    }
  };

  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
        <CardTitle className="text-lg flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <GitCompareArrows className="h-5 w-5 text-primary" />
          </div>
          Bandingkan Kontraktor
        </CardTitle>
        <CardDescription>
          Pilih hingga 3 kontraktor untuk dibandingkan secara berdampingan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Add Contractors Search */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari ID atau nama kontraktor..."
              className="pl-10 h-10 border-slate-200 focus-visible:ring-primary/30"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button
            variant="outline"
            onClick={handleSearch}
            disabled={searching}
            className="h-10 border-slate-200"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            Cari
          </Button>
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showSearch && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border rounded-xl p-2 max-h-48 overflow-y-auto bg-white shadow-lg border-slate-200"
            >
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-primary/5 rounded-lg text-left transition-colors"
                  onClick={() => addContractor(r.id)}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{r.name}</p>
                      {r.company && <p className="text-xs text-slate-400">{r.company}</p>}
                    </div>
                  </div>
                  {selectedIds.includes(r.id) ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <Plus className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
          {showSearch && searchResults.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6 text-sm text-slate-400 bg-slate-50 rounded-xl"
            >
              Tidak ada kontraktor ditemukan
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Contractors Badges */}
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const existing = contractors.find(c => c.id === id);
            return (
              <motion.div
                key={id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2 shadow-sm">
                  {existing ? existing.name : id.slice(0, 8)}
                  <button onClick={() => removeContractor(id)} className="hover:text-red-500 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </motion.div>
            );
          })}
          {selectedIds.length < 3 && (
            <Badge variant="outline" className="px-3 py-1.5 text-sm text-slate-400 border-dashed">
              + Tambah ({3 - selectedIds.length} tersisa)
            </Badge>
          )}
        </div>

        {/* Compare Button */}
        <Button
          className="w-full h-11 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
          onClick={compare}
          disabled={loading || selectedIds.length < 2}
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Membandingkan...</>
          ) : (
            <><GitCompareArrows className="h-4 w-4 mr-2" /> Bandingkan ({selectedIds.length} kontraktor)</>
          )}
        </Button>

        {/* Comparison Content */}
        {contractors.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Separator className="my-4" />

            {/* Side-by-side Contractor Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {contractors.map((c, idx) => {
                const isPreferred = preferredId === c.id;
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.4 }}
                  >
                    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                      isPreferred ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-slate-200'
                    }`}>
                      {isPreferred && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-teal-500" />
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                            isPreferred ? 'bg-gradient-to-br from-primary to-teal-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'
                          }`}>
                            {c.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-slate-800 truncate">{c.name}</h4>
                            <div className="flex items-center gap-1.5">
                              {c.isVerified && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-emerald-600 bg-emerald-50 border-emerald-200">
                                  <Shield className="h-2.5 w-2.5 mr-0.5" /> Terverifikasi
                                </Badge>
                              )}
                              {c.city && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                  <MapPin className="h-2.5 w-2.5" />{c.city}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <RatingBar rating={c.rating} />
                        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                          <span>{c.totalReviews} ulasan</span>
                          <span>{c.completedProjects} proyek selesai</span>
                        </div>
                        <Button
                          size="sm"
                          className={`w-full mt-3 h-9 text-xs transition-all duration-200 ${
                            isPreferred
                              ? 'bg-gradient-to-r from-primary to-teal-600 text-white shadow-md'
                              : 'bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary'
                          }`}
                          onClick={() => handleChooseContractor(c.id)}
                        >
                          {isPreferred ? (
                            <><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Kontraktor Pilihan</>
                          ) : (
                            <><Zap className="h-3.5 w-3.5 mr-1.5" /> Pilih Kontraktor</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Feature Checklist Comparison */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Perbandingan Fitur
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left p-3 text-xs font-medium text-slate-500 min-w-[160px]">Fitur</th>
                      {contractors.map(c => (
                        <th key={c.id} className="text-center p-3 min-w-[120px]">
                          <span className="text-xs font-semibold text-slate-700">{c.name.split(' ')[0]}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {featureChecklist.map((feature, idx) => (
                      <tr key={feature.label} className={`border-t hover:bg-slate-50/50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                        <td className="p-3 text-xs text-slate-600 font-medium">{feature.label}</td>
                        {contractors.map(c => {
                          const hasFeature = feature.key
                            ? !!(c as Record<string, unknown>)[feature.key]
                            : feature.check(c);
                          return (
                            <td key={c.id} className="p-3 text-center">
                              {hasFeature ? (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100"
                                >
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                </motion.div>
                              ) : (
                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100">
                                  <X className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-3 text-xs font-medium text-slate-500 min-w-[140px]">Metrik</th>
                    {contractors.map((c) => (
                      <th key={c.id} className="text-center p-3 min-w-[160px]">
                        <span className="text-xs font-semibold text-slate-700">{c.name}</span>
                      </th>
                    ))}
                    {contractors.length >= 2 && (
                      <th className="p-1 w-10">
                        <div className="flex flex-col items-center gap-2">
                          {Array.from({ length: comparisonRows.length + 1 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-center text-[10px] font-bold text-slate-300">
                              {i === 0 ? '' : 'VS'}
                            </div>
                          ))}
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, idx) => {
                    const bestVal = getBestValue(row.key);
                    const RowIcon = row.icon;

                    return (
                      <tr key={row.key} className={`border-t hover:bg-slate-50/50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                        <td className="p-3">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                              <RowIcon className="h-3.5 w-3.5 text-slate-400" />
                            </div>
                            <span className="font-medium">{row.label}</span>
                          </div>
                        </td>
                        {contractors.map((c) => {
                          const val = (c as Record<string, unknown>)[row.key];
                          const isBest = bestVal !== null && val === bestVal;
                          const formatted = row.format
                            ? row.format(val, c)
                            : val != null ? String(val) : '-';

                          return (
                            <td
                              key={c.id}
                              className={`p-3 text-center text-sm transition-colors ${
                                isBest
                                  ? 'bg-emerald-50/80 text-emerald-700 font-semibold'
                                  : 'text-slate-600'
                              }`}
                            >
                              <div className="flex flex-col items-center gap-0.5">
                                <span>{formatted}</span>
                                {isBest && (
                                  <span className="text-[10px] text-emerald-500 flex items-center gap-0.5 font-medium">
                                    <Trophy className="h-2.5 w-2.5" /> Terbaik
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-1" />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Final CTA for preferred contractor */}
            {preferredId && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-teal-50 rounded-xl border border-primary/20"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {contractors.find(c => c.id === preferredId)?.name}
                      </p>
                      <p className="text-xs text-slate-500">Dipilih sebagai kontraktor pilihan</p>
                    </div>
                  </div>
                  <Button className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20 h-10 px-6">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Lanjutkan dengan Kontraktor
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
