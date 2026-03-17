'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Project } from '@/types';
import { formatRupiah } from '@/lib/helpers';

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajukan Penawaran</DialogTitle>
          <DialogDescription>{project?.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Anggaran Proyek</Label>
            <p className="text-lg font-bold text-primary">{project && formatRupiah(project.budget)}</p>
          </div>
          <div>
            <Label htmlFor="proposal">Proposal</Label>
            <Textarea
              id="proposal"
              placeholder="Jelaskan proposal Anda..."
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              rows={4}
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
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={onSubmit}>Kirim Penawaran</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
