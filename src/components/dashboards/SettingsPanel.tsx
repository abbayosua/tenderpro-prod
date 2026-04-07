'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  User, Lock, Bell, Globe, Palette, Trash2, Save, X, Loader2,
  Shield, Camera, Mail, Phone, Building2, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { getInitials } from '@/lib/helpers';
import { motion, AnimatePresence } from 'framer-motion';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  isVerified: boolean;
  verificationStatus: string;
  contractor: {
    companyName: string | null;
    companyType: string | null;
    specialization: string | null;
    city: string | null;
    province: string | null;
    description: string | null;
  } | null;
  owner: {
    companyName: string | null;
    companyType: string | null;
    city: string | null;
    province: string | null;
  } | null;
}

interface SettingsPanelProps {
  userId: string;
  onLogout?: () => void;
}

export function SettingsPanel({ userId, onLogout }: SettingsPanelProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification preferences
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);

  // Preferences
  const [language, setLanguage] = useState('id');
  const [theme, setTheme] = useState('system');

  // Saving states
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/settings?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setUserData(data.user);
        setName(data.user.name);
        setEmail(data.user.email);
        setPhone(data.user.phone || '');
        setAvatar(data.user.avatar);
        if (data.notificationPreferences) {
          setEmailNotif(data.notificationPreferences.email);
          setPushNotif(data.notificationPreferences.push);
          setSmsNotif(data.notificationPreferences.sms);
        }
        if (data.preferences) {
          setLanguage(data.preferences.language || 'id');
          setTheme(data.preferences.theme || 'system');
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveProfile = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error('Nama dan email wajib diisi');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name, email, phone, avatar }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Profil berhasil diperbarui');
        loadSettings();
      } else {
        toast.error(data.error || 'Gagal memperbarui profil');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Semua field password wajib diisi');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password baru minimal 8 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password berhasil diubah');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error || 'Gagal mengubah password');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'HAPUS') {
      toast.error('Ketik HAPUS untuk konfirmasi');
      return;
    }
    setDeleting(true);
    try {
      // In a real app, call DELETE /api/user?id=xxx
      await new Promise((r) => setTimeout(r, 1500));
      toast.success('Akun berhasil dihapus');
      setDeleteDialogOpen(false);
      onLogout?.();
    } catch {
      toast.error('Gagal menghapus akun');
    } finally {
      setDeleting(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'preferences', label: 'Preferensi', icon: Globe },
    { id: 'danger', label: 'Zona Berbahaya', icon: AlertTriangle },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><div className="animate-pulse h-24 bg-slate-100 rounded-lg" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const profileCompany = userData?.contractor?.companyName || userData?.owner?.companyName || null;
  const profileRole = userData?.role || 'USER';

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informasi Profil
                </CardTitle>
                <CardDescription>Kelola informasi profil dan data perusahaan Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={avatar || undefined} />
                      <AvatarFallback className="text-lg bg-primary/10 text-primary font-semibold">
                        {getInitials(name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
                      onClick={() => toast.info('Fitur upload avatar akan segera tersedia')}
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={userData?.isVerified ? 'default' : 'secondary'} className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        {userData?.verificationStatus === 'VERIFIED' ? 'Terverifikasi' : 'Belum Terverifikasi'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {profileRole === 'OWNER' ? 'Pemilik Proyek' : 'Kontraktor'}
                      </Badge>
                    </div>
                    {profileCompany && (
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" /> {profileCompany}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="settings-name" className="flex items-center gap-1.5">
                      <User className="h-4 w-4 text-slate-400" /> Nama Lengkap
                    </Label>
                    <Input
                      id="settings-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-email" className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-slate-400" /> Email
                    </Label>
                    <Input
                      id="settings-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Masukkan email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-phone" className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-slate-400" /> Nomor Telepon
                    </Label>
                    <Input
                      id="settings-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                </div>

                {/* Company Info (Read-only) */}
                {(userData?.contractor || userData?.owner) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-1.5">
                        <Building2 className="h-4 w-4" /> Informasi Perusahaan
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-400">Nama Perusahaan</p>
                          <p className="text-sm font-medium text-slate-700">
                            {userData.contractor?.companyName || userData.owner?.companyName || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Jenis Perusahaan</p>
                          <p className="text-sm font-medium text-slate-700">
                            {userData.contractor?.companyType || userData.owner?.companyType || '-'}
                          </p>
                        </div>
                        {userData.contractor?.specialization && (
                          <div>
                            <p className="text-xs text-slate-400">Spesialisasi</p>
                            <p className="text-sm font-medium text-slate-700">{userData.contractor.specialization}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-slate-400">Lokasi</p>
                          <p className="text-sm font-medium text-slate-700">
                            {[userData.contractor?.city || userData.owner?.city, userData.contractor?.province || userData.owner?.province].filter(Boolean).join(', ') || '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={loadSettings}>
                    <X className="h-4 w-4 mr-2" /> Batal
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={savingProfile} className="bg-primary hover:bg-primary/90">
                    {savingProfile ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyimpan...</>
                    ) : (
                      <><Save className="h-4 w-4 mr-2" /> Simpan Perubahan</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <motion.div
            key="password"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Ubah Password
                </CardTitle>
                <CardDescription>Pastikan password baru Anda kuat dan mudah diingat</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Password Saat Ini</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan password saat ini"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Password Baru</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                  />
                  {newPassword && newPassword.length < 8 && (
                    <p className="text-xs text-red-500">Password minimal 8 karakter</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500">Password tidak cocok</p>
                  )}
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-xs text-amber-700">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    Setelah mengubah password, Anda perlu login ulang.
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    disabled={savingPassword}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {savingPassword ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Mengubah...</>
                    ) : (
                      <><Lock className="h-4 w-4 mr-2" /> Ubah Password</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Preferensi Notifikasi
                </CardTitle>
                <CardDescription>Atur jenis notifikasi yang ingin Anda terima</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">Notifikasi Email</p>
                      <p className="text-xs text-slate-500">Terima update proyek via email</p>
                    </div>
                  </div>
                  <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">Notifikasi Push</p>
                      <p className="text-xs text-slate-500">Notifikasi langsung di browser</p>
                    </div>
                  </div>
                  <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">Notifikasi SMS</p>
                      <p className="text-xs text-slate-500">Terima peringatan penting via SMS</p>
                    </div>
                  </div>
                  <Switch checked={smsNotif} onCheckedChange={setSmsNotif} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Preferensi Aplikasi
                </CardTitle>
                <CardDescription>Sesuaikan pengalaman menggunakan TenderPro</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-slate-400" /> Bahasa
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">🇮🇩 Bahasa Indonesia</SelectItem>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400">Bahasa yang digunakan di seluruh aplikasi</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Palette className="h-4 w-4 text-slate-400" /> Tema
                  </Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">☀️ Terang</SelectItem>
                      <SelectItem value="dark">🌙 Gelap</SelectItem>
                      <SelectItem value="system">💻 Sesuai Sistem</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400">Tampilan aplikasi (terang, gelap, atau otomatis)</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Danger Zone Tab */}
        {activeTab === 'danger' && (
          <motion.div
            key="danger"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Zona Berbahaya
                </CardTitle>
                <CardDescription>Tindakan di sini tidak dapat dibatalkan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                  <h4 className="font-medium text-red-800">Hapus Akun</h4>
                  <p className="text-sm text-red-600 mt-1">
                    Menghapus akun akan menghapus semua data Anda termasuk proyek, penawaran, dan dokumen secara permanen.
                  </p>
                  <Button
                    variant="destructive"
                    className="mt-3"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Hapus Akun Saya
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Konfirmasi Hapus Akun
                  </DialogTitle>
                  <DialogDescription>
                    Tindakan ini tidak dapat dibatalkan. Semua data Anda akan dihapus secara permanen.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-sm text-red-700">
                      Untuk mengkonfirmasi, ketik <span className="font-bold">HAPUS</span> di bawah ini:
                    </p>
                  </div>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder='Ketik "HAPUS" untuk konfirmasi'
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmText(''); }}>
                    Batal
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirmText !== 'HAPUS'}
                  >
                    {deleting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menghapus...</>
                    ) : (
                      <><Trash2 className="h-4 w-4 mr-2" /> Hapus Akun</>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
