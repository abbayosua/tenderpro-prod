'use client';

import { Card, CardContent, Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Progress, ScrollArea } from '@/components/ui';
import { FolderOpen, MapPin, FileText, Eye, Plus, ChevronRight, Building2, Star, CheckCircle, Video, Flag, Search } from 'lucide-react';
import { formatRupiah, getStatusColor, getStatusLabel } from '@/lib/helpers';
import type { OwnerProjectsTabProps } from './types';

export function OwnerProjectsTab({
  ownerStats,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  onShowCreateProject,
  onShowCCTV,
  onShowProgress,
  onAcceptBid,
  onRejectBid,
  loadMilestones,
}: OwnerProjectsTabProps) {
  const projects = ownerStats?.projects ?? [];
  const filteredProjects = projects
    .filter(project => filterStatus === 'all' || project.status === filterStatus)
    .filter(project => searchQuery === '' || project.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari proyek..."
              className="pl-10 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="OPEN">Tender Terbuka</SelectItem>
              <SelectItem value="IN_PROGRESS">Sedang Berjalan</SelectItem>
              <SelectItem value="COMPLETED">Selesai</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">Belum ada proyek</p>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={onShowCreateProject}>
              <Plus className="h-4 w-4 mr-2" /> Buat Proyek Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="mb-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              if (project.status === 'IN_PROGRESS') {
                onShowCCTV({ id: project.id, title: project.title, status: project.status });
              }
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{project.category}</Badge>
                    <Badge className={getStatusColor(project.status)}>
                      {getStatusLabel(project.status)}
                    </Badge>
                    {project.status === 'IN_PROGRESS' && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Video className="h-3 w-3" /> CCTV Live
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold">{project.title}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" /> {project.location}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Anggaran</p>
                  <p className="text-xl font-bold text-primary">{formatRupiah(project.budget)}</p>
                </div>
              </div>

              {project.status === 'IN_PROGRESS' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-medium">65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowProgress({ id: project.id, title: project.title, category: project.category, budget: project.budget });
                        loadMilestones(project.id);
                      }}
                    >
                      <Flag className="h-4 w-4 mr-2" /> Detail Progress
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowCCTV({ id: project.id, title: project.title, status: project.status });
                      }}
                    >
                      <Video className="h-4 w-4 mr-2" /> Lihat CCTV
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><FileText className="h-4 w-4" /> {project.bidCount} Penawaran</span>
                  <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {project.viewCount || 0}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  if (project.status === 'IN_PROGRESS') {
                    onShowProgress({ id: project.id, title: project.title, category: project.category, budget: project.budget });
                    loadMilestones(project.id);
                  }
                }}>
                  Lihat Detail <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {project.bids.length > 0 && project.status === 'OPEN' && (
                <div className="mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                  <h4 className="font-semibold mb-3">Penawaran Terbaru</h4>
                  <ScrollArea className="h-48">
                    {project.bids.map((bid) => (
                      <div key={bid.id} className="border rounded-lg p-3 mb-2 hover:bg-slate-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-slate-500" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{bid.contractor.name}</p>
                              <p className="text-xs text-slate-500">{bid.contractor.company}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary text-sm">{formatRupiah(bid.price)}</p>
                            <p className="text-xs text-slate-500">{bid.duration} hari</p>
                          </div>
                        </div>
                        {bid.contractor.rating && (
                          <div className="flex items-center gap-1 mt-2">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs">{bid.contractor.rating}</span>
                            <span className="text-xs text-slate-400">({bid.contractor.totalProjects} proyek)</span>
                          </div>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" className="bg-primary hover:bg-primary/90 h-7 text-xs" onClick={() => onAcceptBid(bid.id)}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Terima
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onRejectBid(bid.id)}>Tolak</Button>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </>
  );
}
