'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Project } from '@/types';
import { formatRupiah } from '@/lib/helpers';
import { MapPin, Calendar, DollarSign, Send, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';

interface BidModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  proposal: string;
  setProposal: (value: string) => void;
  price: string;
  setPrice: (value: string) => void;
  duration: string;
  setDuration: (value: string) => void;
  onSubmit: () => void;
}

export function BidModal({
  open,
  onOpenChange,
  project,
  proposal,
  setProposal,
  price,
  setPrice,
  duration,
  setDuration,
  onSubmit,
}: BidModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bidPercentage = useMemo(() => {
    if (!project || !price) return null;
    const pct = (parseFloat(price) / project.budget) * 100;
    return Math.round(pct * 10) / 10;
  }, [project, price]);

  const getBudgetColor = () => {
    if (!bidPercentage) return 'bg-slate-200';
    if (bidPercentage <= 80) return 'bg-emerald-500';
    if (bidPercentage <= 100) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getBudgetLabel = () => {
    if (!bidPercentage) return '';
    if (bidPercentage <= 80) return 'Di bawah anggaran';
    if (bidPercentage <= 100) return 'Dalam anggaran';
    return 'Melebihi anggaran';
  };

  const getBudgetTextColor = () => {
    if (!bidPercentage) return 'text-slate-500';
    if (bidPercentage <= 80) return 'text-emerald-600';
    if (bidPercentage <= 100) return 'text-amber-600';
    return 'text-red-600';
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit();
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-teal-700 px-6 py-6 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Send className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">Ajukan Penawaran</DialogTitle>
              <DialogDescription className="text-white/70 mt-0.5">{project?.title}</DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5">
          <div className="space-y-5">
            {/* Project info summary card */}
            {project && (
              <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ringkasan Proyek</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-slate-400 text-xs">Anggaran</p>
                      <p className="font-bold text-slate-800 text-sm">{formatRupiah(project.budget)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-slate-400 text-xs">Durasi Proyek</p>
                      <p className="font-bold text-slate-800 text-sm">{project.duration} hari</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm col-span-2">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-slate-400 text-xs">Lokasi</p>
                      <p className="font-medium text-slate-700 text-sm">{project.location}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Budget indicator */}
            {price && project && bidPercentage !== null && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Penawaran vs Anggaran</span>
                  <span className={`font-bold ${getBudgetTextColor()}`}>
                    {bidPercentage}% — {getBudgetLabel()}
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${getBudgetColor()}`}
                    style={{ width: `${Math.min(bidPercentage, 100)}%` }}
                  />
                </div>
                {bidPercentage > 100 && (
                  <p className="text-xs text-red-500 font-medium">
                    ⚠️ Penawaran Anda melebihi anggaran proyek
                  </p>
                )}
              </div>
            )}

            {/* Proposal textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="proposal" className="text-sm font-semibold text-slate-700">Proposal</Label>
                <span className="text-xs text-slate-400">{proposal.length}/500</span>
              </div>
              <Textarea
                id="proposal"
                placeholder="Jelaskan rencana kerja, keunggulan Anda, dan alasan memilih penawaran ini..."
                value={proposal}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setProposal(e.target.value);
                  }
                }}
                rows={4}
                className={`border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200 resize-none ${
                  proposal.length >= 480 ? 'border-amber-300' : ''
                }`}
              />
              <p className="text-xs text-slate-400">Jelaskan mengapa pemilik proyek harus memilih Anda</p>
            </div>

            {/* Price and duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-sm font-semibold text-slate-700">Harga Penawaran (Rp)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200 font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duration" className="text-sm font-semibold text-slate-700">Durasi (hari)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="0"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200"
                />
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex justify-end gap-3 pt-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-11 border-slate-200 transition-all duration-200 hover:bg-slate-50"
              >
                Batal
              </Button>
              <Button
                className="h-11 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengirim...
                  </span>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" /> Kirim Penawaran
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
