'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// =============================================================================
// StatsCardsSkeleton — 4 skeleton cards matching StatsCard layout
// =============================================================================
export function StatsCardsSkeleton() {
  const colors = ['border-l-primary', 'border-l-sky-500', 'border-l-amber-500', 'border-l-violet-500'];

  return (
    <div className="grid md:grid-cols-4 gap-4 mb-6">
      {colors.map((color, i) => (
        <Card key={i} className={`border-l-4 ${color} overflow-hidden`}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-24 mb-2 rounded" />
                <Skeleton className="h-8 w-16 mb-2 rounded" />
                <Skeleton className="h-3 w-32 rounded" />
              </div>
              <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// =============================================================================
// ProjectsListSkeleton — 3 skeleton project cards
// =============================================================================
export function ProjectsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="mb-4">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-5 w-28 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-6 w-64 mb-2 rounded" />
                <Skeleton className="h-4 w-40 rounded" />
              </div>
              <div className="text-right ml-4">
                <Skeleton className="h-4 w-16 mb-1 rounded" />
                <Skeleton className="h-6 w-32 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// =============================================================================
// BidsListSkeleton — 3 skeleton bid cards
// =============================================================================
export function BidsListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div>
                <Skeleton className="h-4 w-32 mb-1 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
            <div className="text-right">
              <Skeleton className="h-5 w-28 mb-1 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
          <Skeleton className="h-3 w-full mb-2 rounded" />
          <Skeleton className="h-3 w-3/4 mb-3 rounded" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-32 rounded" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-9 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// ChartSkeleton — 2 skeleton chart cards (h-64)
// =============================================================================
export function ChartSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-40 mb-1 rounded" />
            <Skeleton className="h-4 w-56 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// =============================================================================
// MilestoneListSkeleton — 4 skeleton milestone items
// =============================================================================
export function MilestoneListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-28 rounded-full" />
                </div>
                <Skeleton className="h-5 w-48 mb-1 rounded" />
                <Skeleton className="h-3 w-56 rounded" />
              </div>
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-3 w-8 rounded" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// =============================================================================
// DocumentsListSkeleton — 3 skeleton document rows
// =============================================================================
export function DocumentsListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
            <div>
              <Skeleton className="h-4 w-40 mb-1 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// ProfileSkeleton — Skeleton user profile area
// =============================================================================
export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-5 w-36 mb-1 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
    </div>
  );
}

// =============================================================================
// TimelineSkeleton — Skeleton timeline tab cards
// =============================================================================
export function TimelineSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-36 rounded" />
        </div>
        <Skeleton className="h-4 w-64 rounded" />
      </CardHeader>
      <CardContent className="p-6">
        <MilestoneListSkeleton />
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Full Dashboard Skeleton — combines all sections
// =============================================================================
export function DashboardLoadingSkeleton({ role = 'owner' }: { role?: 'owner' | 'contractor' }) {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      {/* Header Skeleton */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-7 w-28 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Verification Alert Skeleton */}
        <Skeleton className="h-14 w-full rounded-lg mb-6" />

        {/* Stats Cards Skeleton */}
        <StatsCardsSkeleton />

        {/* Quick Actions Skeleton */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Skeleton className="h-10 w-40 rounded-md" />
          <Skeleton className="h-10 w-36 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>

        {/* Charts Skeleton */}
        <ChartSkeleton />

        {/* Tabs Skeleton */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-32 rounded-md" />
          ))}
        </div>

        {/* Content Skeleton */}
        {role === 'owner' ? (
          <ProjectsListSkeleton />
        ) : (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Skeleton className="h-4 w-28 rounded-full" />
                      <Skeleton className="h-4 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-56 mb-1 rounded" />
                    <Skeleton className="h-3 w-40 rounded" />
                    <Skeleton className="h-4 w-32 mt-1 rounded" />
                    <Skeleton className="h-3 w-48 mt-1 rounded" />
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-4">
                    <Skeleton className="h-8 w-28 rounded-md" />
                    <Skeleton className="h-8 w-24 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
