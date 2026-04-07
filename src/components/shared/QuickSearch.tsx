'use client';

import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search, Clock, X, Briefcase, Building2, ArrowRight,
  Hash, Sparkles, Trash2, TrendingUp
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface SearchSuggestion {
  id: string;
  type: 'project' | 'contractor';
  title: string;
  subtitle: string;
}

interface QuickSearchProps {
  onSearch: (query: string) => void;
}

const RECENT_SEARCHES_KEY = 'tenderpro-recent-searches';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(RECENT_SEARCHES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(searches: string[]) {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, MAX_RECENT)));
  } catch {
    // ignore
  }
}

function addRecentSearch(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const existing = getRecentSearches();
  const filtered = existing.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
  saveRecentSearches([trimmed, ...filtered]);
}

function removeRecentSearch(query: string) {
  const existing = getRecentSearches();
  saveRecentSearches(existing.filter((s) => s !== query));
}

export function QuickSearch({ onSearch }: QuickSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Refresh recent searches when dialog opens
  const refreshRecent = useCallback(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        if (!open) refreshRecent();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, refreshRecent]);

  const handleSelect = useCallback(
    (value: string) => {
      addRecentSearch(value);
      onSearch(value);
      setOpen(false);
      setQuery('');
      refreshRecent();
    },
    [onSearch, refreshRecent]
  );

  const handleRecentRemove = useCallback(
    (e: React.MouseEvent, search: string) => {
      e.stopPropagation();
      removeRecentSearch(search);
      refreshRecent();
    },
    [refreshRecent]
  );

  const handleClearRecent = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      saveRecentSearches([]);
      refreshRecent();
    },
    [refreshRecent]
  );

  // Generate mock suggestions based on query
  const hasQuery = query.trim().length > 0;
  const suggestions: SearchSuggestion[] = hasQuery
    ? [
        { id: 'p1', type: 'project', title: `Proyek "${query}" di Jakarta`, subtitle: 'Pembangunan Baru • Rp 500jt' },
        { id: 'p2', type: 'project', title: `Renovasi "${query}"`, subtitle: 'Renovasi • Rp 200jt' },
        { id: 'c1', type: 'contractor', title: `Kontraktor ${query}`, subtitle: 'Jakarta • ⭐ 4.8' },
        { id: 'c2', type: 'contractor', title: `PT ${query} Konstruksi`, subtitle: 'Bandung • ⭐ 4.5' },
      ]
    : [];

  return (
    <>
      {/* Trigger button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-slate-500 hover:text-slate-700 transition-colors"
        onClick={() => {
          refreshRecent();
          setOpen(true);
        }}
        aria-label="Pencarian cepat"
      >
        <Search className="h-4 w-4" />
      </Button>

      {/* Ctrl+K Badge */}
      <Badge
        variant="secondary"
        className="hidden lg:flex items-center gap-1 px-1.5 py-0 h-5 text-[10px] text-slate-400 font-mono bg-slate-100/80 border border-slate-200 cursor-pointer hover:bg-slate-200 hover:border-slate-300 transition-all duration-200"
        onClick={() => {
          refreshRecent();
          setOpen(true);
        }}
      >
        <CommandShortcut className="text-[10px] ml-0">Ctrl+K</CommandShortcut>
      </Badge>

      {/* Command Dialog */}
      <CommandDialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setQuery('');
          } else {
            refreshRecent();
          }
        }}
        title="Pencarian Cepat"
        description="Cari proyek, kontraktor, dan lainnya..."
      >
        <CommandInput
          placeholder="Cari proyek atau kontraktor..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty className="py-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Search className="h-7 w-7 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">Tidak ditemukan hasil</p>
              <p className="text-xs text-slate-400">Coba kata kunci yang berbeda untuk &ldquo;{query}&rdquo;</p>
            </motion.div>
          </CommandEmpty>

          {/* Recent searches - only when no query */}
          {!hasQuery && recentSearches.length > 0 && (
            <CommandGroup heading="Pencarian Terbaru">
              {recentSearches.map((search) => (
                <CommandItem
                  key={search}
                  value={search}
                  onSelect={() => handleSelect(search)}
                  className="group"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center mr-2.5 shrink-0">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <span className="flex-1 text-sm">{search}</span>
                  <button
                    onClick={(e) => handleRecentRemove(e, search)}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-md transition-all duration-200 hover:bg-slate-100 hover:text-red-500"
                    aria-label="Hapus pencarian"
                  >
                    <X className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </CommandItem>
              ))}
              <CommandSeparator />
              <CommandItem
                onSelect={() => handleClearRecent({ stopPropagation: () => {} } as React.MouseEvent)}
                className="text-xs text-slate-400 group"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center mr-2.5 shrink-0">
                  <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                </div>
                Hapus semua pencarian terbaru
              </CommandItem>
            </CommandGroup>
          )}

          {/* Suggestion results */}
          {hasQuery && suggestions.length > 0 && (
            <>
              <CommandGroup heading="Proyek">
                {suggestions
                  .filter((s) => s.type === 'project')
                  .map((s) => (
                    <CommandItem
                      key={s.id}
                      value={`project-${s.title}`}
                      onSelect={() => handleSelect(s.title)}
                      className="group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center mr-2.5 shrink-0">
                        <Briefcase className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.title}</p>
                        <p className="text-xs text-slate-500 truncate">{s.subtitle}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
                    </CommandItem>
                  ))}
              </CommandGroup>

              <CommandGroup heading="Kontraktor">
                {suggestions
                  .filter((s) => s.type === 'contractor')
                  .map((s) => (
                    <CommandItem
                      key={s.id}
                      value={`contractor-${s.title}`}
                      onSelect={() => handleSelect(s.title)}
                      className="group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center mr-2.5 shrink-0">
                        <Building2 className="h-3.5 w-3.5 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.title}</p>
                        <p className="text-xs text-slate-500 truncate">{s.subtitle}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
                    </CommandItem>
                  ))}
              </CommandGroup>
            </>
          )}

          {/* Quick links - always shown when no query */}
          {!hasQuery && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Navigasi Cepat">
                <CommandItem onSelect={() => handleSelect('Proyek Aktif')} className="group">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center mr-2.5 shrink-0">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="flex-1">Lihat Proyek Aktif</span>
                  <ArrowRight className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CommandItem>
                <CommandItem onSelect={() => handleSelect('Kontraktor Terpercaya')} className="group">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center mr-2.5 shrink-0">
                    <Building2 className="h-3.5 w-3.5 text-teal-600" />
                  </div>
                  <span className="flex-1">Kontraktor Terpercaya</span>
                  <ArrowRight className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CommandItem>
                <CommandItem onSelect={() => handleSelect('Kontraktor Lokal')} className="group">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center mr-2.5 shrink-0">
                    <Hash className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span className="flex-1">Kontraktor Lokal Indonesia</span>
                  <ArrowRight className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>

        {/* Footer hint */}
        <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <kbd className="px-1.5 py-0.5 bg-white rounded text-[10px] font-mono border border-slate-200 shadow-sm">↑↓</kbd>
              <span>Navigasi</span>
              <kbd className="px-1.5 py-0.5 bg-white rounded text-[10px] font-mono border border-slate-200 shadow-sm">↵</kbd>
              <span>Pilih</span>
              <kbd className="px-1.5 py-0.5 bg-white rounded text-[10px] font-mono border border-slate-200 shadow-sm">esc</kbd>
              <span>Tutup</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="font-medium">TenderPro</span>
            </div>
          </div>
        </div>
      </CommandDialog>
    </>
  );
}
