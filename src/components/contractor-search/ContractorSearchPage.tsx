'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Search, MapPin, Star, Briefcase, CheckCircle,
  Building2, Filter, X, ChevronLeft, ChevronRight,
  Loader2, SlidersHorizontal, MessageCircle, Eye
} from 'lucide-react';
import { Contractor } from '@/types';

interface ContractorSearchResult {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  isVerified: boolean;
  company: {
    name: string;
    specialization?: string | null;
    experienceYears: number;
    employeeCount: number;
    rating: number;
    totalProjects: number;
    completedProjects: number;
    city?: string | null;
    province?: string | null;
    description?: string | null;
  } | null;
  portfolioCount: number;
  badges: Array<{ type: string; label: string; icon: string | null }>;
  certifications: Array<{ type: string; isVerified: boolean }>;
}

interface FilterOptions {
  specializations: string[];
  cities: string[];
}

interface ContractorSearchPageProps {
  onSelectContractor?: (contractor: Contractor) => void;
  onContactContractor?: (contractorId: string) => void;
}

export function ContractorSearchPage({ onSelectContractor, onContactContractor }: ContractorSearchPageProps) {
  const [contractors, setContractors] = useState<ContractorSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [minExperience, setMinExperience] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'rating' | 'projects' | 'experience' | 'newest'>('rating');
  const [showFilters, setShowFilters] = useState(false);

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ specializations: [], cities: [] });

  const LIMIT = 12;

  const fetchContractors = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contractors/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          specialization: selectedSpecializations,
          city: selectedCities,
          minRating,
          minExperience,
          sortBy,
          page: currentPage,
          limit: LIMIT,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setContractors(data.data.contractors);
        setTotalResults(data.data.pagination.total);
        setTotalPages(data.data.pagination.totalPages);
        if (data.data.filters) {
          setFilterOptions(data.data.filters);
        }
      }
    } catch (error) {
      console.error('Error searching contractors:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedSpecializations, selectedCities, minRating, minExperience, sortBy, currentPage]);

  useEffect(() => {
    fetchContractors();
  }, [fetchContractors]);

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecializations(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
    setCurrentPage(1);
  };

  const toggleCity = (city: string) => {
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSpecializations([]);
    setSelectedCities([]);
    setMinRating(0);
    setMinExperience(0);
    setSortBy('rating');
    setCurrentPage(1);
  };

  const activeFilterCount = selectedSpecializations.length + selectedCities.length + (minRating > 0 ? 1 : 0) + (minExperience > 0 ? 1 : 0);

  const handleSelectContractor = (c: ContractorSearchResult) => {
    if (onSelectContractor) {
      onSelectContractor(c as unknown as Contractor);
    }
  };

  return (
    <div className="w-full">
      {/* Search Header */}
      <div className="bg-white border-b rounded-t-xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Cari Kontraktor</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {isLoading ? 'Mencari...' : `${totalResults} kontraktor ditemukan`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama, perusahaan, atau keahlian..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={sortBy} onValueChange={(v) => { setSortBy(v as typeof sortBy); setCurrentPage(1); }}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Rating Tertinggi</SelectItem>
              <SelectItem value="projects">Proyek Terbanyak</SelectItem>
              <SelectItem value="experience">Pengalaman Terbanyak</SelectItem>
              <SelectItem value="newest">Terbaru</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-0">
        {/* Filter Sidebar */}
        <div className={`md:w-72 bg-white border-r md:border-t-0 border-t p-4 ${showFilters ? 'block' : 'hidden'} md:block`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filter
            </h3>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs text-red-500 hover:text-red-700" onClick={clearFilters}>
                Hapus Semua
              </Button>
            )}
          </div>

          <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
            {/* Specialization Filter */}
            {filterOptions.specializations.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Spesialisasi</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filterOptions.specializations.map((spec) => (
                    <label key={spec} className="flex items-center gap-2 cursor-pointer group">
                      <Checkbox
                        checked={selectedSpecializations.includes(spec)}
                        onCheckedChange={() => toggleSpecialization(spec)}
                      />
                      <span className="text-sm text-slate-600 group-hover:text-slate-800">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* City Filter */}
            {filterOptions.cities.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Kota</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filterOptions.cities.map((city) => (
                    <label key={city} className="flex items-center gap-2 cursor-pointer group">
                      <Checkbox
                        checked={selectedCities.includes(city)}
                        onCheckedChange={() => toggleCity(city)}
                      />
                      <span className="text-sm text-slate-600 group-hover:text-slate-800">{city}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Rating Filter */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Rating Minimum</h4>
              <div className="space-y-1">
                {[0, 3, 3.5, 4, 4.5].map((rating) => (
                  <button
                    key={rating}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors ${
                      minRating === rating
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    onClick={() => { setMinRating(rating); setCurrentPage(1); }}
                  >
                    {rating === 0 ? (
                      'Semua Rating'
                    ) : (
                      <span className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < Math.round(rating) ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'}`} />
                        ))}
                        <span className="ml-1">ke atas</span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Experience Filter */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pengalaman Minimum</h4>
              <div className="space-y-1">
                {[
                  { value: 0, label: 'Semua' },
                  { value: 2, label: '2+ tahun' },
                  { value: 5, label: '5+ tahun' },
                  { value: 10, label: '10+ tahun' },
                  { value: 15, label: '15+ tahun' },
                ].map((exp) => (
                  <button
                    key={exp.value}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors ${
                      minExperience === exp.value
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    onClick={() => { setMinExperience(exp.value); setCurrentPage(1); }}
                  >
                    {exp.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 p-4 md:p-6 bg-slate-50">
          {/* Active filter tags */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedSpecializations.map(spec => (
                <Badge key={spec} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleSpecialization(spec)}>
                  {spec} <X className="h-3 w-3" />
                </Badge>
              ))}
              {selectedCities.map(city => (
                <Badge key={city} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleCity(city)}>
                  <MapPin className="h-3 w-3" /> {city} <X className="h-3 w-3" />
                </Badge>
              ))}
              {minRating > 0 && (
                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setMinRating(0)}>
                  <Star className="h-3 w-3 text-yellow-500" /> {minRating}+ <X className="h-3 w-3" />
                </Badge>
              )}
              {minExperience > 0 && (
                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setMinExperience(0)}>
                  {minExperience}+ tahun <X className="h-3 w-3" />
                </Badge>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-slate-500">Mencari kontraktor...</span>
            </div>
          ) : contractors.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="h-16 w-16 text-slate-200 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-600 mb-1">Tidak ada kontraktor ditemukan</p>
              <p className="text-sm text-slate-400 mb-4">Coba ubah filter atau kata kunci pencarian</p>
              <Button variant="outline" onClick={clearFilters}>Hapus Semua Filter</Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contractors.map((c) => (
                <Card key={c.id} className="hover:shadow-lg transition-shadow group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{c.company?.name || c.name}</CardTitle>
                        <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{c.company?.city || 'Lokasi tidak tersedia'}</span>
                        </div>
                      </div>
                      {c.isVerified && (
                        <Badge className="bg-green-600 text-white flex-shrink-0 ml-2 gap-1">
                          <CheckCircle className="h-3 w-3" /> Verified
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{c.company?.rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-slate-400 text-sm">•</span>
                      <span className="text-sm text-slate-500">{c.company?.totalProjects || 0} proyek</span>
                      <span className="text-slate-400 text-sm">•</span>
                      <span className="text-sm text-slate-500">{c.portfolioCount} portfolio</span>
                    </div>

                    {c.company?.specialization && (
                      <div className="flex flex-wrap gap-1">
                        {c.company.specialization.split(',').slice(0, 3).map((spec, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{spec.trim()}</Badge>
                        ))}
                        {c.company.specialization.split(',').length > 3 && (
                          <Badge variant="secondary" className="text-xs">+{c.company.specialization.split(',').length - 3}</Badge>
                        )}
                      </div>
                    )}

                    {c.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {c.badges.slice(0, 2).map((badge) => (
                          <Badge key={badge.type} variant="outline" className="text-xs gap-0.5">
                            {badge.icon} {badge.label}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" /> {c.company?.experienceYears || 0} tahun
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" /> {c.company?.completedProjects || 0} selesai
                      </span>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSelectContractor(c)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> Lihat Profil
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => onContactContractor?.(c.id)}
                      >
                        <MessageCircle className="h-3.5 w-3.5 mr-1" /> Hubungi
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && contractors.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Sebelumnya
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                  if (pageNum > totalPages || pageNum < 1) return null;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      className="w-9"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Selanjutnya <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
