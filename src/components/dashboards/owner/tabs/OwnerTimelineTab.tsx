'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge, Progress } from '@/components/ui';
import { Flag, Eye, Calendar } from 'lucide-react';
import { formatRupiah } from '@/lib/helpers';
import type { Milestone } from '@/types';
import type { OwnerTimelineTabProps } from './types';

export function OwnerTimelineTab({
  ownerStats,
  onShowProgress,
  loadMilestones,
  milestones = [],
}: OwnerTimelineTabProps) {
  const projects = ownerStats?.projects ?? [];
  const activeOrCompletedProjects = projects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'COMPLETED');

  // Calculate progress from milestones
  const getProgress = () => {
    const completed = milestones.filter((m: Milestone) => m.status === 'COMPLETED').length;
    const total = milestones.length || 1;
    return Math.round((completed / total) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-primary" />
          Timeline Proyek
        </CardTitle>
        <CardDescription>Pantau progress dan milestone semua proyek Anda</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {activeOrCompletedProjects.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>Tidak ada proyek yang sedang berjalan atau selesai</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrCompletedProjects.map((project) => (
              <Card key={project.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={project.status === 'IN_PROGRESS' ? 'bg-blue-600' : 'bg-primary'}>
                          {project.status === 'IN_PROGRESS' ? 'Sedang Berjalan' : 'Selesai'}
                        </Badge>
                        <Badge variant="outline">{project.category}</Badge>
                      </div>
                      <h3 className="font-semibold text-lg">{project.title}</h3>
                      <p className="text-sm text-slate-500">{project.location} • {formatRupiah(project.budget)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onShowProgress({ id: project.id, title: project.title, category: project.category, budget: project.budget });
                        loadMilestones(project.id);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" /> Detail
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-medium text-primary">{getProgress()}%</span>
                      </div>
                      <Progress value={getProgress()} className="h-2" />
                    </div>
                    <div className="text-sm text-slate-500">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Est. {project.duration || 90} hari
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
