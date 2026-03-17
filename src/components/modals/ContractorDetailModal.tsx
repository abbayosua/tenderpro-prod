'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Star, Briefcase, CheckCircle, Clock, Mail, Phone, MapPin } from 'lucide-react';
import { Contractor } from '@/types';
import { formatRupiah } from '@/lib/helpers';

interface ContractorDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractor: Contractor | null;
}

export function ContractorDetailModal({ open, onOpenChange, contractor }: ContractorDetailModalProps) {
  if (!contractor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contractor.company?.name}</DialogTitle>
          <DialogDescription>{contractor.company?.specialization}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Star, value: contractor.company?.rating, label: 'Rating', color: 'yellow' },
              { icon: Briefcase, value: contractor.company?.totalProjects, label: 'Total Proyek', color: 'primary' },
              { icon: CheckCircle, value: contractor.company?.completedProjects, label: 'Selesai', color: 'blue' },
              { icon: Clock, value: contractor.company?.experienceYears, label: 'Tahun', color: 'purple' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 bg-slate-50 rounded-lg">
                <stat.icon className={`h-6 w-6 text-${stat.color}-500 mx-auto mb-1`} />
                <p className="font-bold">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
          <div>
            <h4 className="font-semibold mb-2">Tentang</h4>
            <p className="text-slate-600">{contractor.company?.description}</p>
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
                <span className="text-sm">{contractor.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="text-sm">{contractor.company?.city}</span>
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
                        <p className="text-sm text-slate-500">{portfolio.location}</p>
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
      </DialogContent>
    </Dialog>
  );
}
