'use client';

import { Card, CardContent, Button, Badge } from '@/components/ui';
import { Heart, Building2, Star, Briefcase, Trash2 } from 'lucide-react';
import type { OwnerFavoritesTabProps } from './types';

export function OwnerFavoritesTab({ favorites, onRemoveFavorite }: OwnerFavoritesTabProps) {
  return (
    <Card>
      <CardContent className="p-6">
        {!favorites || favorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-600 font-medium mb-1">Belum ada kontraktor favorit</p>
            <p className="text-sm text-slate-400">Tambahkan kontraktor ke favorit dari daftar penawaran</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {favorites.map((fav) => (
              <Card key={fav.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{fav.contractor.name}</p>
                        <p className="text-sm text-slate-500">{fav.contractor.company?.name}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onRemoveFavorite(fav.id)}>
                      <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                    </Button>
                  </div>
                  {fav.contractor.company && (
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm">{fav.contractor.company.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-500">{fav.contractor.company.totalProjects} proyek</span>
                      </div>
                    </div>
                  )}
                  {fav.notes && (
                    <p className="text-sm text-slate-600 italic">"{fav.notes}"</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
