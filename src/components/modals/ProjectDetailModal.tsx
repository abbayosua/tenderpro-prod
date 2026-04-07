'use client';

import { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MapPin, DollarSign, Calendar, Clock, FileText, Building2,
  CheckCircle, User, Phone, Mail, ChevronRight, Eye, ShieldCheck, MessageCircle
} from 'lucide-react';
import { formatRupiah, getStatusColor, getStatusLabel } from '@/lib/helpers';
import { motion } from 'framer-motion';

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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export function ProjectDetailModal({
  open,
  onOpenChange,
  project,
  userRole,
  onBid,
  onChat,
}: ProjectDetailModalProps) {
  const hasTrackedView = useRef(false);

  // Track view when modal opens with a project
  useEffect(() => {
    if (open && project && !hasTrackedView.current) {
      fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          action: 'increment_view',
        }),
      }).catch(err => console.error('Failed to track view:', err));
      
      hasTrackedView.current = true;
    }
    
    if (!open) {
      hasTrackedView.current = false;
    }
  }, [open, project]);

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-teal-700 px-6 py-6 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-bold text-white truncate">{project.title}</DialogTitle>
              <DialogDescription className="text-white/70 mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-white/90 text-xs font-medium backdrop-blur-sm">
                  {project.category}
                </span>
                <span className={`relative px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1.5 ${
                  project.status === 'OPEN' || project.status === 'IN_PROGRESS'
                    ? 'bg-emerald-400/20 text-white'
                    : 'bg-white/15 text-white/90'
                }`}>
                  {(project.status === 'OPEN' || project.status === 'IN_PROGRESS') && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                  )}
                  {getStatusLabel(project.status)}
                </span>
              </DialogDescription>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 pb-6 pt-5 space-y-5">
            <motion.div variants={containerVariants} initial="hidden" animate="show">
              {/* Project Image */}
              {project.images && project.images.length > 0 && (
                <motion.div variants={itemVariants} className="relative h-48 rounded-xl overflow-hidden bg-slate-100 mb-5">
                  <img
                    src={project.images[0]}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              )}

              {/* Info Grid with left border accents */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3 text-center hover:shadow-md transition-shadow duration-200 border-l-4 border-l-primary">
                  <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Anggaran</p>
                  <p className="font-bold text-sm text-slate-800 mt-0.5">{formatRupiah(project.budget)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3 text-center hover:shadow-md transition-shadow duration-200 border-l-4 border-l-teal-500">
                  <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-teal-600" />
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Durasi</p>
                  <p className="font-bold text-sm text-slate-800 mt-0.5">{project.duration ? `${project.duration} hari` : 'Fleksibel'}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3 text-center hover:shadow-md transition-shadow duration-200 border-l-4 border-l-amber-500">
                  <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-amber-100 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Lokasi</p>
                  <p className="font-bold text-sm text-slate-800 mt-0.5 truncate">{project.location}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3 text-center hover:shadow-md transition-shadow duration-200 border-l-4 border-l-emerald-500">
                  <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Penawaran</p>
                  <p className="font-bold text-sm text-slate-800 mt-0.5">
                    <span className="bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">{project.bidCount}</span>
                  </p>
                </div>
              </motion.div>

              {/* Description */}
              <motion.div variants={itemVariants}>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 bg-primary rounded-full" />
                  Deskripsi Proyek
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed pl-3 border-l-2 border-slate-100">
                  {project.description || 'Tidak ada deskripsi'}
                </p>
              </motion.div>

              {/* Requirements */}
              {project.requirements && project.requirements.length > 0 && (
                <motion.div variants={itemVariants}>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 bg-teal-500 rounded-full" />
                    Persyaratan
                  </h4>
                  <ul className="space-y-2">
                    {project.requirements.map((req, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start gap-2.5 text-sm text-slate-600 bg-slate-50/80 rounded-lg px-3 py-2"
                      >
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle className="h-3 w-3 text-emerald-600" />
                        </div>
                        {req}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}

              <Separator />

              {/* Owner Info with accent border */}
              <motion.div variants={itemVariants} className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 border-l-4 border-l-emerald-500">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                  Informasi Pemilik Proyek
                </h4>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-teal-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{project.owner.name}</p>
                      {project.owner.isVerified && (
                        <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                          <ShieldCheck className="h-3 w-3" /> Terverifikasi
                        </span>
                      )}
                    </div>
                    {project.owner.company && (
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
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
              </motion.div>

              {/* Footer stats */}
              <motion.div variants={itemVariants} className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                <p>Proyek dibuat: {new Date(project.createdAt).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{project.viewCount} dilihat</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 border-slate-200 transition-all duration-200 hover:bg-slate-50"
          >
            Tutup
          </Button>
          {userRole === 'CONTRACTOR' && project.status === 'OPEN' && (
            <>
              {onChat && (
                <Button
                  variant="outline"
                  onClick={onChat}
                  className="h-11 border-slate-200 transition-all duration-200 hover:bg-slate-50"
                >
                  <MessageCircle className="h-4 w-4 mr-2" /> Chat Owner
                </Button>
              )}
              {onBid && !project.hasBid && (
                <Button
                  className="h-11 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                  onClick={onBid}
                >
                  Ajukan Penawaran <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              {project.hasBid && (
                <Badge className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 h-11 flex items-center">
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Sudah Mengajukan
                </Badge>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
