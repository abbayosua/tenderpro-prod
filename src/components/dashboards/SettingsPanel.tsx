'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Shield, Camera, Mail, Phone, Building2, AlertTriangle, Settings,
  Check, MapPin, FileText,
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
    address: string | null;
    npwp: string | null;
    nib: string | null;
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

const companyTypes = [
  { value: 'PT', label: 'PT (Perseroan Terbatas)' },
  { value: 'CV', label: 'CV (Commanditaire Vennootschap)' },
  { value: 'Firma', label: 'Firma' },
  { value: 'PO', label: 'PO (Perorangan)' },
  { value: 'Koperasi', label: 'Koperasi' },
  { value: 'BUMN', label: 'BUMN' },
  { value: 'Lainnya', label: 'Lainnya' },
];

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

function SectionHeader({ children, color = 'bg-primary' }: { children: React.ReactNode; color?: string }) {
  return (
    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
      <div className={`w-1 h-4 ${color} rounded-full`} />
      {children}
    </h3>
  );
}

function FormField({
  id, label, icon: Icon, children, hint,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        <Icon className="h-3.5 w-3.5 text-slate-400" /> {label}
      </Label>
      {children}
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
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

  // Contractor profile form
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [npwp, setNpwp] = useState('');
  const [nib, setNib] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification preferences
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [projectNotif, setProjectNotif] = useState(true);
  const [bidNotif, setBidNotif] = useState(true);
  const [marketingNotif, setMarketingNotif] = useState(false);

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
        // Contractor fields
        const c = data.user.contractor;
        if (c) {
          setCompanyName(c.companyName || '');
          setCompanyType(c.companyType || '');
          setSpecialization(c.specialization || '');
          setDescription(c.description || '');
          setCity(c.city || '');
          setProvince(c.province || '');
          setAddress(c.address || '');
          setNpwp(c.npwp || '');
          setNib(c.nib || '');
        }
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
        body: JSON.stringify({
          userId, name, email, phone, avatar,
          contractor: {
            companyName, companyType, specialization, description,
            address, city, province, npwp, nib,
          },
        }),
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
  const isContractor = profileRole === 'CONTRACTOR';

  const inputClasses = 'h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200';
  const selectClasses = 'w-full h-11 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200';

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-2"
      >
        {tabs.map((tab, index) => (
          <motion.div
            key={tab.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <Button
              variant={activeTab === tab.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20'
                : 'border-slate-200 hover:border-primary/30 hover:bg-primary/5'
              }
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </Button>
          </motion.div>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ====== Profile Tab ====== */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            {/* Profile Overview Card */}
            <motion.div variants={staggerItem}>
              <Card className="border border-slate-100 shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  {/* Avatar & Identity */}
                  <div className="flex items-start gap-5">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-20 w-20 ring-4 ring-primary/10 shadow-lg">
                        <AvatarImage src={avatar || undefined} />
                        <AvatarFallback className="text-lg bg-gradient-to-br from-primary/10 to-teal-500/10 text-primary font-bold">
                          {getInitials(name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="icon"
                        variant="outline"
                        className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full border-white shadow-md"
                        onClick={() => toast.info('Fitur upload avatar akan segera tersedia')}
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 truncate">{name}</h3>
                      <div className="flex items-center flex-wrap gap-2 mt-1.5">
                        <Badge variant={userData?.isVerified ? 'default' : 'secondary'} className="text-xs shadow-sm">
                          <Shield className="h-3 w-3 mr-1" />
                          {userData?.verificationStatus === 'VERIFIED' ? 'Terverifikasi' : 'Belum Terverifikasi'}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-slate-200">
                          <Settings className="h-3 w-3 mr-1" />
                          {profileRole === 'OWNER' ? 'Pemilik Proyek' : 'Kontraktor'}
                        </Badge>
                      </div>
                      {profileCompany && (
                        <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" /> {profileCompany}
                        </p>
                      )}
                      <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" /> {email}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Data Pribadi Card */}
            <motion.div variants={staggerItem}>
              <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-6 space-y-5">
                  <SectionHeader color="bg-primary">
                    <User className="h-4 w-4 text-primary" />
                    Data Pribadi
                  </SectionHeader>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField id="settings-name" label="Nama Lengkap" icon={User}>
                      <Input
                        id="settings-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Masukkan nama lengkap"
                        className={inputClasses}
                      />
                    </FormField>
                    <FormField id="settings-email" label="Email" icon={Mail}>
                      <Input
                        id="settings-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Masukkan email"
                        className={inputClasses}
                      />
                    </FormField>
                    <FormField id="settings-phone" label="Nomor Telepon" icon={Phone}>
                      <Input
                        id="settings-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className={inputClasses}
                      />
                    </FormField>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Data Perusahaan Card (Contractor Only) */}
            {isContractor && (
              <motion.div variants={staggerItem}>
                <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-6 space-y-5">
                    <SectionHeader color="bg-teal-500">
                      <Building2 className="h-4 w-4 text-teal-500" />
                      Data Perusahaan
                    </SectionHeader>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField id="settings-company-name" label="Nama Perusahaan" icon={Building2}>
                        <Input
                          id="settings-company-name"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Contoh: PT Karya Konstruksi Sejahtera"
                          className={inputClasses}
                        />
                      </FormField>
                      <FormField id="settings-company-type" label="Jenis Perusahaan" icon={Building2}>
                        <Select value={companyType} onValueChange={setCompanyType}>
                          <SelectTrigger className={selectClasses}>
                            <SelectValue placeholder="Pilih jenis perusahaan" />
                          </SelectTrigger>
                          <SelectContent>
                            {companyTypes.map((ct) => (
                              <SelectItem key={ct.value} value={ct.value}>
                                {ct.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                      <FormField id="settings-specialization" label="Spesialisasi" icon={Settings}>
                        <Input
                          id="settings-specialization"
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                          placeholder="Contoh: Konstruksi Gedung, Jalan, Jembatan"
                          className={inputClasses}
                        />
                      </FormField>
                      <FormField id="settings-phone-company" label="Telepon Perusahaan" icon={Phone}>
                        <Input
                          id="settings-phone-company"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="08xxxxxxxxxx"
                          className={inputClasses}
                        />
                      </FormField>
                    </div>

                    <FormField id="settings-description" label="Deskripsi Perusahaan" icon={FileText}>
                      <Textarea
                        id="settings-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Jelaskan tentang perusahaan Anda, pengalaman, dan keahlian utama..."
                        rows={3}
                        className="border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-200 resize-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Deskripsi singkat tentang perusahaan Anda untuk menarik klien
                      </p>
                    </FormField>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Alamat & Legalitas Card (Contractor Only) */}
            {isContractor && (
              <motion.div variants={staggerItem}>
                <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-6 space-y-5">
                    <SectionHeader color="bg-amber-500">
                      <MapPin className="h-4 w-4 text-amber-500" />
                      Alamat & Legalitas
                    </SectionHeader>

                    <FormField id="settings-address" label="Alamat" icon={MapPin}>
                      <Input
                        id="settings-address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Jl. Contoh No. 123, RT/RW"
                        className={inputClasses}
                      />
                    </FormField>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField id="settings-city" label="Kota/Kabupaten" icon={MapPin}>
                        <Input
                          id="settings-city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Contoh: Jakarta Selatan"
                          className={inputClasses}
                        />
                      </FormField>
                      <FormField id="settings-province" label="Provinsi" icon={MapPin}>
                        <Input
                          id="settings-province"
                          value={province}
                          onChange={(e) => setProvince(e.target.value)}
                          placeholder="Contoh: DKI Jakarta"
                          className={inputClasses}
                        />
                      </FormField>
                    </div>

                    <Separator />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField id="settings-npwp" label="NPWP" icon={FileText} hint="Nomor Pokok Wajib Pajak perusahaan">
                        <Input
                          id="settings-npwp"
                          value={npwp}
                          onChange={(e) => setNpwp(e.target.value)}
                          placeholder="Contoh: 01.234.567.8-901.000"
                          className={inputClasses}
                        />
                      </FormField>
                      <FormField id="settings-nib" label="NIB" icon={FileText} hint="Nomor Induk Berusaha dari OSS">
                        <Input
                          id="settings-nib"
                          value={nib}
                          onChange={(e) => setNib(e.target.value)}
                          placeholder="Contoh: 1234567890123"
                          className={inputClasses}
                        />
                      </FormField>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Save Button */}
            <motion.div variants={staggerItem} className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={loadSettings}
                className="border-slate-200 hover:bg-slate-50 h-11"
              >
                <X className="h-4 w-4 mr-2" /> Batal
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="h-11 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
              >
                {savingProfile ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyimpan...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Simpan Perubahan</>
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* ====== Password Tab ====== */}
        {activeTab === 'password' && (
          <motion.div
            key="password"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <motion.div variants={staggerItem}>
              <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/10 to-amber-500/10 flex items-center justify-center border border-red-100">
                      <Lock className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Ubah Password</h3>
                      <p className="text-xs text-slate-500">Pastikan password baru Anda kuat dan mudah diingat</p>
                    </div>
                  </div>

                  <Separator />

                  <SectionHeader color="bg-red-500">
                    <Lock className="h-4 w-4 text-red-500" />
                    Keamanan Akun
                  </SectionHeader>

                  <div className="space-y-4 max-w-md">
                    <FormField id="current-password" label="Password Saat Ini" icon={Lock}>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Masukkan password saat ini"
                        className={inputClasses}
                      />
                    </FormField>
                    <FormField id="new-password" label="Password Baru" icon={Lock} hint="Minimal 8 karakter, kombinasi huruf dan angka">
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 8 karakter"
                        className={inputClasses}
                      />
                      {newPassword && (
                        <div className="mt-1.5 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${newPassword.length >= 8 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                            <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${/[A-Z]/.test(newPassword) ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                            <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${/\d/.test(newPassword) ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {newPassword.length < 8 ? 'Panjang minimal 8 karakter' : /[A-Z]/.test(newPassword) && /\d/.test(newPassword) ? 'Kuat' : 'Tambahkan huruf besar & angka'}
                          </p>
                        </div>
                      )}
                    </FormField>
                    <FormField id="confirm-password" label="Konfirmasi Password Baru" icon={Lock}>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi password baru"
                        className={inputClasses}
                      />
                      {confirmPassword && newPassword !== confirmPassword && (
                        <motion.p
                          initial={{ opacity: 0, y: 3 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-500 mt-1 flex items-center gap-1"
                        >
                          <AlertTriangle className="h-3 w-3" /> Password tidak cocok
                        </motion.p>
                      )}
                      {confirmPassword && newPassword === confirmPassword && (
                        <motion.p
                          initial={{ opacity: 0, y: 3 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-emerald-600 mt-1 flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" /> Password cocok
                        </motion.p>
                      )}
                    </FormField>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs text-amber-700 flex items-start gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      Setelah mengubah password, Anda perlu login ulang pada semua perangkat.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="border-slate-200 hover:bg-slate-50 h-11"
                    >
                      Batal
                    </Button>
                    <Button
                      onClick={handleChangePassword}
                      disabled={savingPassword}
                      className="h-11 bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white shadow-md shadow-red-500/20 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
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
          </motion.div>
        )}

        {/* ====== Notifications Tab ====== */}
        {activeTab === 'notifications' && (
          <motion.div
            key="notifications"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <motion.div variants={staggerItem}>
              <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-teal-500/10 flex items-center justify-center border border-primary/10">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Preferensi Notifikasi</h3>
                      <p className="text-xs text-slate-500">Atur jenis notifikasi yang ingin Anda terima</p>
                    </div>
                  </div>

                  <Separator />

                  <SectionHeader color="bg-primary">
                    <Bell className="h-4 w-4 text-primary" />
                    Kanal Notifikasi
                  </SectionHeader>

                  <div className="space-y-1">
                    {[
                      {
                        id: 'email-notif',
                        icon: Mail,
                        title: 'Notifikasi Email',
                        desc: 'Terima update proyek dan penawaran via email',
                        checked: emailNotif,
                        onChange: setEmailNotif,
                        iconBg: 'bg-primary/10',
                        iconColor: 'text-primary',
                      },
                      {
                        id: 'push-notif',
                        icon: Bell,
                        title: 'Notifikasi Push',
                        desc: 'Notifikasi langsung di browser',
                        checked: pushNotif,
                        onChange: setPushNotif,
                        iconBg: 'bg-emerald-100',
                        iconColor: 'text-emerald-600',
                      },
                      {
                        id: 'sms-notif',
                        icon: Phone,
                        title: 'Notifikasi SMS',
                        desc: 'Terima peringatan penting via SMS',
                        checked: smsNotif,
                        onChange: setSmsNotif,
                        iconBg: 'bg-amber-100',
                        iconColor: 'text-amber-600',
                      },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-slate-50/80 transition-colors duration-200">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${item.iconBg} flex items-center justify-center`}>
                            <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-800">{item.title}</p>
                            <p className="text-xs text-slate-500">{item.desc}</p>
                          </div>
                        </div>
                        <Switch checked={item.checked} onCheckedChange={item.onChange} />
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <SectionHeader color="bg-teal-500">
                    <FileText className="h-4 w-4 text-teal-500" />
                    Jenis Notifikasi
                  </SectionHeader>

                  <div className="space-y-1">
                    {[
                      {
                        id: 'project-notif',
                        icon: Building2,
                        title: 'Update Proyek',
                        desc: 'Perubahan status dan milestone proyek',
                        checked: projectNotif,
                        onChange: setProjectNotif,
                        iconBg: 'bg-teal-100',
                        iconColor: 'text-teal-600',
                      },
                      {
                        id: 'bid-notif',
                        icon: FileText,
                        title: 'Penawaran Baru',
                        desc: 'Notifikasi saat ada penawaran masuk',
                        checked: bidNotif,
                        onChange: setBidNotif,
                        iconBg: 'bg-blue-100',
                        iconColor: 'text-blue-600',
                      },
                      {
                        id: 'marketing-notif',
                        icon: Mail,
                        title: 'Marketing & Promo',
                        desc: 'Info fitur baru dan penawaran khusus',
                        checked: marketingNotif,
                        onChange: setMarketingNotif,
                        iconBg: 'bg-violet-100',
                        iconColor: 'text-violet-600',
                      },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-slate-50/80 transition-colors duration-200">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${item.iconBg} flex items-center justify-center`}>
                            <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-800">{item.title}</p>
                            <p className="text-xs text-slate-500">{item.desc}</p>
                          </div>
                        </div>
                        <Switch checked={item.checked} onCheckedChange={item.onChange} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* ====== Preferences Tab ====== */}
        {activeTab === 'preferences' && (
          <motion.div
            key="preferences"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <motion.div variants={staggerItem}>
              <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 flex items-center justify-center border border-violet-100">
                      <Globe className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Preferensi Aplikasi</h3>
                      <p className="text-xs text-slate-500">Sesuaikan pengalaman menggunakan TenderPro</p>
                    </div>
                  </div>

                  <Separator />

                  <SectionHeader color="bg-violet-500">
                    <Globe className="h-4 w-4 text-violet-500" />
                    Tampilan & Bahasa
                  </SectionHeader>

                  <div className="space-y-4">
                    <FormField id="settings-language" label="Bahasa" icon={Globe}>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className={selectClasses}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="id">Bahasa Indonesia</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-400 mt-1">Bahasa yang digunakan di seluruh aplikasi</p>
                    </FormField>

                    <Separator />

                    <FormField id="settings-theme" label="Tema" icon={Palette}>
                      <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger className={selectClasses}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Terang</SelectItem>
                          <SelectItem value="dark">Gelap</SelectItem>
                          <SelectItem value="system">Sesuai Sistem</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-400 mt-1">Tampilan aplikasi (terang, gelap, atau otomatis)</p>
                    </FormField>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* ====== Danger Zone Tab ====== */}
        {activeTab === 'danger' && (
          <motion.div
            key="danger"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Card className="border border-red-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/10 flex items-center justify-center border border-red-100">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-red-600">Zona Berbahaya</h3>
                    <p className="text-xs text-slate-500">Tindakan di sini tidak dapat dibatalkan</p>
                  </div>
                </div>

                <Separator />

                <div className="p-5 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Trash2 className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-800">Hapus Akun</h4>
                      <p className="text-sm text-red-600 mt-1">
                        Menghapus akun akan menghapus semua data Anda termasuk proyek, penawaran, dan dokumen secara permanen.
                      </p>
                      <Button
                        variant="destructive"
                        className="mt-3 h-10"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Hapus Akun Saya
                      </Button>
                    </div>
                  </div>
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
                    className={inputClasses}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmText(''); }} className="border-slate-200">
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
