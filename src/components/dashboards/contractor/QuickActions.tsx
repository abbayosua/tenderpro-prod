'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search, FileText, User, Upload, Award, Star,
  Zap,
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  badge?: string;
  onClick: () => void;
}

interface QuickActionsProps {
  onSearchProjects: () => void;
  onShowBidHistory: () => void;
  onEditProfile: () => void;
  onUploadPortfolio: () => void;
  onShowCertifications: () => void;
  onShowRatings: () => void;
  onShowSettings?: () => void;
}

export function QuickActions({
  onSearchProjects,
  onShowBidHistory,
  onEditProfile,
  onUploadPortfolio,
  onShowCertifications,
  onShowRatings,
  onShowSettings,
}: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      id: 'search',
      title: 'Cari Proyek Baru',
      description: 'Temukan proyek yang sesuai dengan keahlian Anda',
      icon: Search,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      badge: 'Populer',
      onClick: onSearchProjects,
    },
    {
      id: 'bids',
      title: 'Lihat Penawaran Saya',
      description: 'Pantau status penawaran yang sudah diajukan',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      onClick: onShowBidHistory,
    },
    {
      id: 'profile',
      title: 'Update Profil',
      description: 'Perbarui data perusahaan dan keahlian Anda',
      icon: User,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      onClick: onEditProfile,
    },
    {
      id: 'portfolio',
      title: 'Unggah Portfolio',
      description: 'Showcase proyek terbaik Anda untuk menarik klien',
      icon: Upload,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      badge: 'Penting',
      onClick: onUploadPortfolio,
    },
    {
      id: 'certifications',
      title: 'Lihat Sertifikasi',
      description: 'Kelola dan unggah sertifikasi profesional Anda',
      icon: Award,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      onClick: onShowCertifications,
    },
    {
      id: 'ratings',
      title: 'Cek Rating',
      description: 'Lihat review dan rating dari pemilik proyek',
      icon: Star,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      onClick: onShowRatings,
    },
  ];

  return (
    <Card className="shadow-sm border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Aksi Cepat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-all duration-200 text-left group"
            >
              <div className={`p-2.5 rounded-xl ${action.bgColor} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <action.icon className={`h-5 w-5 ${action.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-800 group-hover:text-primary transition-colors">
                    {action.title}
                  </h4>
                  {action.badge && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary">
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


