'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Notification } from '@/types';
import { formatDateTime } from '@/lib/helpers';

interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  onToggle: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function NotificationPanel({
  notifications,
  unreadCount,
  isOpen,
  onToggle,
  onMarkRead,
  onMarkAllRead,
}: NotificationPanelProps) {
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative" onClick={onToggle}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-semibold">Notifikasi</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onMarkAllRead}>
                Tandai Semua Dibaca
              </Button>
            )}
          </div>
          <ScrollArea className="h-80">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">Tidak ada notifikasi</p>
                <p className="text-xs text-slate-400 mt-1">Notifikasi baru akan muncul di sini</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 border-b hover:bg-slate-50 cursor-pointer ${!notif.isRead ? 'bg-primary/10' : ''}`}
                  onClick={() => onMarkRead(notif.id)}
                >
                  <div className="flex items-start gap-2">
                    {!notif.isRead && <div className="w-2 h-2 bg-primary rounded-full mt-2" />}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDateTime(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
