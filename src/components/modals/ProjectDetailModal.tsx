'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MapPin, DollarSign, Calendar, Clock, FileText, Building2,
  CheckCircle, User, Phone, Mail, ChevronRight
} from 'lucide-react';
import { formatRupiah, getStatusColor, getStatusLabel } from '@/lib/helpers';

interface ProjectDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget: number;
  duration?: number;
  status: string;
  requirements?: string[];
  images?: string[];
  viewCount: number;
  createdAt: Date;
  owner: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    isVerified: boolean;
    company?: string;
  };
  bidCount: number;
  hasBid?: boolean;
}

interface ProjectDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectDetail | null;
  userRole: 'OWNER' | 'CONTRACTOR';
  onBid?: () => void;
  onChat?: () => void;
}

export function ProjectDetailModal({
  open,
  onOpenChange,
  project,
  userRole,
  onBid,
  onChat,
}: ProjectDetailModalProps) {
  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">{project.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Badge className={getStatusColor(project.status)}>
              {getStatusLabel(project.status)}
            </Badge>
            <Badge variant="outline">{project.category}</Badge>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Project Image */}
            {project.images && project.images.length > 0 && (
              <div className="relative h-48 rounded-lg overflow-hidden bg-slate-100">
                <img
                  src={project.images[0]}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-sm text-slate-500">Anggaran</p>
                <p className="font-bold text-primary">{formatRupiah(project.budget)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-sm text-slate-500">Durasi</p>
                <p className="font-bold">{project.duration ? `${project.duration} hari` : 'Fleksibel'}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <FileText className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-sm text-slate-500">Penawaran</p>
                <p className="font-bold">{project.bidCount}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="font-semibold mb-2">Deskripsi Proyek</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {project.description || 'Tidak ada deskripsi'}
              </p>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Lokasi Proyek</p>
                <p className="text-sm text-slate-600">{project.location}</p>
              </div>
            </div>

            {/* Requirements */}
            {project.requirements && project.requirements.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Persyaratan</h4>
                <ul className="space-y-1">
                  {project.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Separator />

            {/* Owner Info */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Informasi Pemilik Proyek</h4>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{project.owner.name}</p>
                    {project.owner.isVerified && (
                      <Badge className="bg-green-500 text-xs">Terverifikasi</Badge>
                    )}
                  </div>
                  {project.owner.company && (
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> {project.owner.company}
                    </p>
                  )}
                  {userRole === 'CONTRACTOR' && (
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      {project.owner.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {project.owner.email}
                        </span>
                      )}
                      {project.owner.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {project.owner.phone}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Project Timeline */}
            <div className="text-xs text-slate-400">
              <p>Proyek dibuat: {new Date(project.createdAt).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
              <p>Dilihat {project.viewCount} kali</p>
            </div>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          {userRole === 'CONTRACTOR' && project.status === 'OPEN' && (
            <>
              {onChat && (
                <Button variant="outline" onClick={onChat}>
                  <FileText className="h-4 w-4 mr-2" /> Chat Owner
                </Button>
              )}
              {onBid && !project.hasBid && (
                <Button className="bg-primary hover:bg-primary/90" onClick={onBid}>
                  Ajukan Penawaran <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              {project.hasBid && (
                <Badge className="bg-blue-500">Sudah Mengajukan</Badge>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
