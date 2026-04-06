'use client';

import { Skeleton } from '@/components/ui/skeleton';

// =============================================================================
// LandingSkeleton — Full-page skeleton for landing page
// =============================================================================
export function LandingSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-7 w-28 rounded" />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 w-20 rounded" />
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-16 rounded-md hidden md:block" />
            <Skeleton className="h-9 w-20 rounded-md hidden md:block" />
            <Skeleton className="h-9 w-9 rounded-md md:hidden" />
          </div>
        </div>
      </header>

      {/* Hero Section Skeleton */}
      <section className="relative py-20 md:py-28 bg-gradient-to-br from-slate-50 via-primary/5 to-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Skeleton className="h-6 w-72 mx-auto mb-4 rounded-full" />
          <Skeleton className="h-12 w-96 mx-auto mb-4 rounded" />
          <Skeleton className="h-12 w-80 mx-auto mb-6 rounded" />
          <Skeleton className="h-5 w-xl max-w-xl mx-auto mb-2 rounded" />
          <Skeleton className="h-5 w-lg max-w-lg mx-auto mb-8 rounded" />
          <div className="flex items-center justify-center gap-4 mb-10">
            <Skeleton className="h-12 w-44 rounded-lg" />
            <Skeleton className="h-12 w-40 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-100">
                <Skeleton className="h-8 w-16 mx-auto mb-1 rounded" />
                <Skeleton className="h-3 w-24 mx-auto rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section Skeleton */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <Skeleton className="h-8 w-48 mx-auto mb-2 rounded" />
            <Skeleton className="h-4 w-64 mx-auto rounded" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-2xl p-6">
                <Skeleton className="w-12 h-12 rounded-xl mb-4" />
                <Skeleton className="h-6 w-36 mb-2 rounded" />
                <Skeleton className="h-4 w-full mb-1 rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section Skeleton */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <Skeleton className="h-8 w-40 mb-2 rounded" />
            <Skeleton className="h-4 w-56 rounded" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border p-0">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Skeleton className="h-6 w-28 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-full mb-2 rounded" />
                  <Skeleton className="h-4 w-32 mb-4 rounded" />
                  <Skeleton className="h-3 w-full mb-1 rounded" />
                  <Skeleton className="h-3 w-2/3 mb-4 rounded" />
                  <div className="flex items-center justify-between">
                    <div>
                      <Skeleton className="h-3 w-16 mb-1 rounded" />
                      <Skeleton className="h-5 w-28 rounded" />
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-3 w-12 mb-1 rounded" />
                      <Skeleton className="h-4 w-16 rounded" />
                    </div>
                  </div>
                </div>
                <div className="border-t px-5 py-3 bg-slate-50 flex items-center justify-between">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Skeleton */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <Skeleton className="h-8 w-48 mx-auto mb-2 rounded" />
            <Skeleton className="h-4 w-64 mx-auto rounded" />
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <Skeleton className="w-16 h-16 rounded-2xl mx-auto mb-3" />
                <Skeleton className="h-5 w-24 mx-auto mb-1 rounded" />
                <Skeleton className="h-3 w-full max-w-xs mx-auto mb-1 rounded" />
                <Skeleton className="h-3 w-4/5 max-w-xs mx-auto rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Skeleton */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <Skeleton className="h-8 w-48 mx-auto mb-2 rounded" />
            <Skeleton className="h-4 w-64 mx-auto rounded" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border shadow-sm">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Skeleton key={s} className="w-4 h-4 rounded" />
                  ))}
                </div>
                <Skeleton className="h-3 w-full mb-2 rounded" />
                <Skeleton className="h-3 w-full mb-2 rounded" />
                <Skeleton className="h-3 w-2/3 mb-4 rounded" />
                <div className="flex items-center gap-3 pt-4 border-t">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-28 mb-1 rounded" />
                    <Skeleton className="h-3 w-36 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Skeleton */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="h-5 w-24 mb-4 rounded bg-slate-700" />
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-3 w-full mb-2 rounded bg-slate-700" />
                ))}
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-6 text-center">
            <Skeleton className="h-3 w-48 mx-auto rounded bg-slate-700" />
          </div>
        </div>
      </footer>
    </div>
  );
}
