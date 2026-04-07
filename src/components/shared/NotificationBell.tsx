'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bell, MessageSquare, DollarSign, CheckCircle, Clock,
  FileText, Settings, ExternalLink, CheckCheck, Star, UserPlus,
  ShieldCheck, XCircle, Upload, Send, Zap, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { getRelativeTime } from '@/lib/helpers';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
  category?: string;
  projectTitle?: string;
  contractorName?: string;
  quickAction?: { label: string; href: string } | null;
}

interface NotificationCategory {
  key: string;
  label: string;
  count: number;
  unreadCount: number;
  icon: string;
}

interface DashboardData {
  unreadCount: number;
  totalCount: number;
  latestNotifications: NotificationItem[];
  categories: NotificationCategory[];
  quickActions: Array<{ label: string; href: string; type: string }>;
}

interface NotificationBellProps {
  userId: string;
  onNavigate?: (href: string) => void;
}

// ─── Icon map ─────────────────────────────────────────────────────────────────

const notificationIconMap: Record<string, { icon: typeof Bell; gradient: string; label: string }> = {
  BID_RECEIVED: { icon: Send, gradient: 'from-sky-400 to-blue-500', label: 'Bid Masuk' },
  BID_ACCEPTED: { icon: CheckCircle, gradient: 'from-emerald-400 to-green-500', label: 'Bid Diterima' },
  BID_REJECTED: { icon: XCircle, gradient: 'from-red-400 to-rose-500', label: 'Bid Ditolak' },
  PROJECT_UPDATE: { icon: FileText, gradient: 'from-violet-400 to-purple-500', label: 'Update Proyek' },
  PAYMENT: { icon: DollarSign, gradient: 'from-emerald-400 to-teal-500', label: 'Pembayaran' },
  PAYMENT_MADE: { icon: DollarSign, gradient: 'from-emerald-400 to-teal-500', label: 'Pembayaran' },
  PAYMENT_CONFIRMED: { icon: CheckCircle, gradient: 'from-emerald-400 to-green-500', label: 'Pembayaran' },
  MILESTONE_UPDATE: { icon: CheckCircle, gradient: 'from-amber-400 to-orange-500', label: 'Milestone' },
  MILESTONE_COMPLETED: { icon: Star, gradient: 'from-amber-400 to-yellow-500', label: 'Milestone' },
  MESSAGE: { icon: MessageSquare, gradient: 'from-violet-400 to-indigo-500', label: 'Pesan' },
  SYSTEM: { icon: Settings, gradient: 'from-slate-400 to-gray-500', label: 'Sistem' },
  VERIFICATION: { icon: ShieldCheck, gradient: 'from-cyan-400 to-blue-500', label: 'Verifikasi' },
  USER_JOINED: { icon: UserPlus, gradient: 'from-teal-400 to-cyan-500', label: 'User Baru' },
  DOCUMENT: { icon: Upload, gradient: 'from-amber-400 to-orange-400', label: 'Dokumen' },
  GENERAL: { icon: Bell, gradient: 'from-slate-400 to-gray-500', label: 'Notifikasi' },
};

const categoryTabIcons: Record<string, typeof Bell> = {
  Bell,
  FileText,
  Send,
  DollarSign,
};

const categoryGradients: Record<string, string> = {
  semua: 'from-primary to-primary/60',
  proyek: 'from-violet-500 to-purple-500',
  bid: 'from-sky-500 to-blue-500',
  pembayaran: 'from-emerald-500 to-teal-500',
};

function getNotificationStyle(type: string) {
  return notificationIconMap[type] || notificationIconMap.GENERAL;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationBell({ userId, onNavigate }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('semua');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [markingRead, setMarkingRead] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Fetch dashboard data ──────────────────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications/dashboard?userId=${userId}`);
      const json = await res.json();
      if (json.success) {
        setDashboard(json.data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchDashboard();
      setActiveTab('semua');
    }
  }, [isOpen, userId, fetchDashboard]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Mark as read ──────────────────────────────────────────────────────────
  const handleMarkRead = async (notifId: string) => {
    setMarkingRead(notifId);
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notifId }),
      });
      // Optimistic update
      if (dashboard) {
        setDashboard({
          ...dashboard,
          latestNotifications: dashboard.latestNotifications.map((n) =>
            n.id === notifId ? { ...n, isRead: true } : n,
          ),
          unreadCount: Math.max(0, dashboard.unreadCount - 1),
        });
      }
    } catch {
      // Silently fail
    } finally {
      setMarkingRead(null);
    }
  };

  // ── Mark all as read ──────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    if (!userId) return;
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true, userId }),
      });
      if (dashboard) {
        setDashboard({
          ...dashboard,
          latestNotifications: dashboard.latestNotifications.map((n) => ({
            ...n,
            isRead: true,
          })),
          unreadCount: 0,
          categories: dashboard.categories.map((c) => ({
            ...c,
            unreadCount: 0,
          })),
        });
      }
    } catch {
      // Silently fail
    }
  };

  // ── Filtered notifications ────────────────────────────────────────────────
  const filteredNotifications = activeTab === 'semua'
    ? (dashboard?.latestNotifications ?? [])
    : (dashboard?.latestNotifications ?? []).filter(
        (n) => n.category === activeTab,
      );

  // ── Category tab data ────────────────────────────────────────────────────
  const categoryTabs = dashboard?.categories ?? [
    { key: 'semua', label: 'Semua', count: 0, unreadCount: 0, icon: 'Bell' },
    { key: 'proyek', label: 'Proyek', count: 0, unreadCount: 0, icon: 'FileText' },
    { key: 'bid', label: 'Bid', count: 0, unreadCount: 0, icon: 'Send' },
    { key: 'pembayaran', label: 'Pembayaran', count: 0, unreadCount: 0, icon: 'DollarSign' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {dashboard && dashboard.unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold shadow-sm"
          >
            {dashboard.unreadCount > 99 ? '99+' : dashboard.unreadCount}
          </motion.span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 top-12 w-80 sm:w-[440px] bg-white rounded-xl shadow-2xl border z-50 overflow-hidden"
          >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="p-4 bg-gradient-to-r from-slate-50 to-white border-b">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <Bell className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-800">Notifikasi</h3>
                  {dashboard && dashboard.unreadCount > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                      {dashboard.unreadCount} baru
                    </Badge>
                  )}
                </div>
                {dashboard && dashboard.unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 text-primary hover:text-primary/80 hover:bg-primary/5"
                    onClick={handleMarkAllRead}
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Tandai Semua Dibaca
                  </Button>
                )}
              </div>

              {/* ── Category Tabs ─────────────────────────────────────────── */}
              <div className="flex gap-1">
                {categoryTabs.map((tab) => {
                  const TabIcon = categoryTabIcons[tab.icon] || Bell;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? 'text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className={`absolute inset-0 rounded-lg bg-gradient-to-r ${categoryGradients[tab.key] || categoryGradients.semua}`}
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                      <TabIcon className="h-3.5 w-3.5 relative z-10" />
                      <span className="relative z-10">{tab.label}</span>
                      {tab.unreadCount > 0 && (
                        <span className={`relative z-10 min-w-[16px] h-4 px-1 rounded-full text-[9px] flex items-center justify-center font-bold ${
                          isActive ? 'bg-white/30 text-white' : 'bg-red-100 text-red-600'
                        }`}>
                          {tab.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Quick Actions ───────────────────────────────────────────── */}
            {dashboard && dashboard.quickActions.length > 0 && (
              <div className="px-4 py-2 bg-gradient-to-r from-slate-50/80 to-white border-b">
                <div className="flex gap-2 flex-wrap">
                  {dashboard.quickActions.map((action) => {
                    const gradient = categoryGradients[action.type] || categoryGradients.semua;
                    return (
                      <button
                        key={action.label}
                        onClick={() => {
                          setIsOpen(false);
                          onNavigate?.(action.href);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-white border border-slate-200 hover:border-primary/30 hover:shadow-sm transition-all text-slate-600"
                      >
                        <Zap className={`h-3 w-3 bg-gradient-to-r ${gradient} bg-clip-text`} style={{ color: 'var(--color-primary)' }} />
                        {action.label}
                        <ChevronRight className="h-2.5 w-2.5 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Notifications List ──────────────────────────────────────── */}
            <ScrollArea className="h-80">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-3 p-2">
                      <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-2.5 w-full" />
                        <Skeleton className="h-2 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Bell className="h-7 w-7 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">
                    {activeTab !== 'semua'
                      ? `Tidak ada notifikasi ${categoryTabs.find((t) => t.key === activeTab)?.label?.toLowerCase()}`
                      : 'Tidak ada notifikasi'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {activeTab !== 'semua'
                      ? 'Notifikasi baru akan muncul di sini'
                      : 'Notifikasi baru akan muncul di sini'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notif, idx) => {
                    const style = getNotificationStyle(notif.type);
                    const NotifIcon = style.icon;
                    const isMarking = markingRead === notif.id;

                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03, duration: 0.15 }}
                        className={`p-3 transition-colors ${
                          !notif.isRead
                            ? 'bg-primary/[0.03] hover:bg-primary/[0.06]'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Type Icon with gradient */}
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${style.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            <NotifIcon className="h-4 w-4 text-white" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm leading-snug ${
                                !notif.isRead
                                  ? 'font-semibold text-slate-800'
                                  : 'font-medium text-slate-600'
                              }`}>
                                {notif.title}
                              </p>
                              {!notif.isRead && (
                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-primary/60 flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>

                            {/* Related entity context */}
                            {notif.projectTitle && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-200 text-slate-500">
                                  <FileText className="h-2.5 w-2.5 mr-0.5" />
                                  {notif.projectTitle.length > 25
                                    ? notif.projectTitle.substring(0, 25) + '...'
                                    : notif.projectTitle}
                                </Badge>
                              </div>
                            )}

                            {/* Timestamp + Type label + Quick actions */}
                            <div className="flex items-center justify-between mt-1.5">
                              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {getRelativeTime(notif.createdAt)}
                              </p>
                              <div className="flex items-center gap-1.5">
                                {/* Quick action */}
                                {notif.quickAction && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsOpen(false);
                                      onNavigate?.(notif.quickAction!.href);
                                    }}
                                    className="text-[10px] text-primary font-medium hover:underline flex items-center gap-0.5"
                                  >
                                    {notif.quickAction.label}
                                  </button>
                                )}

                                {/* Mark as read button */}
                                {!notif.isRead && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkRead(notif.id);
                                    }}
                                    disabled={isMarking}
                                    className="text-[10px] text-slate-400 hover:text-primary transition-colors flex items-center gap-0.5"
                                    title="Tandai dibaca"
                                  >
                                    <CheckCheck className={`h-3 w-3 ${isMarking ? 'animate-spin' : ''}`} />
                                  </button>
                                )}

                                {/* Gradient category badge */}
                                <Badge
                                  className={`text-[9px] px-1.5 py-0 border-0 bg-gradient-to-r ${style.gradient} text-white`}
                                >
                                  {style.label}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <Separator />
            <div className="p-2 bg-slate-50/50 flex gap-1">
              <Button
                variant="ghost"
                className="flex-1 text-xs text-primary hover:text-primary/80 hover:bg-primary/5 justify-center"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate?.('/dashboard?tab=notifications');
                }}
              >
                Lihat Semua Notifikasi
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
