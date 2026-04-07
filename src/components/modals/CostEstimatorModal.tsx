'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calculator, Loader2, Sparkles, TrendingUp, TrendingDown, Info,
  Lightbulb, Hammer, Users, Wrench, FileText, BarChart3
} from 'lucide-react';
import { formatRupiah } from '@/lib/helpers';

interface CostEstimatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CostBreakdown {
  item: string;
  min: number;
  max: number;
}

interface EstimationResult {
  totalMin: number;
  totalMax: number;
  breakdown: CostBreakdown[];
  tips: string[];
}

const PROJECT_CATEGORIES = [
  'Renovasi Rumah',
  'Pembangunan Rumah Baru',
  'Renovasi Kantor',
  'Pembangunan Ruko',
  'Interior Design',
  'Konstruksi Baja',
  'MEP (Mekanikal/Elektrikal/Plumbing)',
  'Pekerjaan Tanah',
  'Pembangunan Gudang',
  'Renovasi Apartemen',
  'Pembangunan Villa',
  'Pekerjaan Atap',
  'Instalasi Pipa',
  'Pengecatan',
  'Lainnya',
];

export function CostEstimatorModal({ open, onOpenChange }: CostEstimatorModalProps) {
  const [category, setCategory] = useState('Renovasi Rumah');
  const [location, setLocation] = useState('');
  const [size, setSize] = useState('');
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EstimationResult | null>(null);

  const handleEstimate = async () => {
    if (!category || !location) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/ai/cost-estimator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          location,
          size: size || undefined,
          requirements: requirements || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.estimation) {
        setResult(data.estimation);
      } else {
        setResult(null);
      }
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCategory('Renovasi Rumah');
    setLocation('');
    setSize('');
    setRequirements('');
    setResult(null);
  };

  const getBreakdownIcon = (item: string): React.ReactNode => {
    const lower = item.toLowerCase();
    if (lower.includes('material') || lower.includes('bahan')) return <Hammer className="h-4 w-4 text-amber-500" />;
    if (lower.includes('tenaga') || lower.includes('kerja') || lower.includes('pekerja')) return <Users className="h-4 w-4 text-blue-500" />;
    if (lower.includes('peralatan') || lower.includes('teknis')) return <Wrench className="h-4 w-4 text-purple-500" />;
    if (lower.includes('perizinan') || lower.includes('admin')) return <FileText className="h-4 w-4 text-green-500" />;
    if (lower.includes('desain')) return <Sparkles className="h-4 w-4 text-pink-500" />;
    return <BarChart3 className="h-4 w-4 text-slate-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Kalkulator Estimasi Biaya Proyek
          </DialogTitle>
          <DialogDescription>
            Dapatkan estimasi biaya proyek konstruksi yang akurat dengan bantuan AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!result ? (
            <>
              {/* Form */}
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Kategori Proyek</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="Pilih kategori proyek" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Lokasi Proyek</label>
                  <Input
                    placeholder="Contoh: Jakarta Selatan, Bandung, Surabaya..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Ukuran / Luas (m²) <span className="text-slate-400 font-normal">- opsional</span></label>
                  <Input
                    type="number"
                    placeholder="Contoh: 100"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Persyaratan Khusus <span className="text-slate-400 font-normal">- opsional</span></label>
                  <Textarea
                    placeholder="Contoh: 3 kamar tidur, 2 kamar mandi, dapur, taman..."
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Estimate Button */}
              <Button
                className="w-full bg-primary hover:bg-primary/90 h-12 text-base"
                onClick={handleEstimate}
                disabled={!category || !location || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menganalisis Estimasi Biaya...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Hitung Estimasi dengan AI
                  </>
                )}
              </Button>

              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-1">Estimasi AI untuk Kontraktor Lokal Indonesia</p>
                    <p>Estimasi ini disesuaikan dengan harga pasar konstruksi Indonesia dan merekomendasikan penggunaan material serta tenaga kerja lokal untuk mendukung ekonomi nasional.</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Results */}
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-50">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <p className="text-sm text-slate-500 mb-1">Estimasi Biaya Total</p>
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Minimum</p>
                        <p className="text-lg font-bold text-green-600">{formatRupiah(result.totalMin)}</p>
                      </div>
                      <span className="text-slate-300">—</span>
                      <div className="text-left">
                        <p className="text-xs text-slate-400">Maksimum</p>
                        <p className="text-lg font-bold text-primary">{formatRupiah(result.totalMax)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{category} di {location}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Rincian Biaya</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {result.breakdown.map((item, idx) => {
                      const rangeWidth = Math.min(100, ((item.max - item.min) / result.totalMax) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getBreakdownIcon(item.item)}
                              <span className="text-sm font-medium">{item.item}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-medium text-primary">{formatRupiah(item.min)}</span>
                              <span className="text-xs text-slate-400 mx-1">-</span>
                              <span className="text-sm font-medium text-primary">{formatRupiah(item.max)}</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-primary/60 to-primary rounded-full h-2"
                              style={{ width: `${rangeWidth}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Tips Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Tips & Rekomendasi
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {result.tips.map((tip, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 p-2.5 rounded-lg text-sm ${
                          idx === 0 ? 'bg-green-50 border border-green-200' : 'bg-slate-50'
                        }`}
                      >
                        {idx === 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        )}
                        <span className={idx === 0 ? 'text-green-700' : 'text-slate-600'}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <TrendingDown className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    Estimasi ini bersifat perkiraan dan dapat berbeda tergantung kondisi lapangan, spesifikasi material, dan negosiasi dengan kontraktor. Gunakan sebagai referensi awal untuk perencanaan anggaran.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleReset}>
                  <Calculator className="h-4 w-4 mr-2" /> Hitung Ulang
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={() => onOpenChange(false)}>
                  Selesai
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
