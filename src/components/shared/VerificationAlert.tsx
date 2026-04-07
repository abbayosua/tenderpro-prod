'use client';

import { AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface VerificationAlertProps {
  user: { verificationStatus: string } | null;
  onUploadClick: () => void;
}

export function VerificationAlert({ user, onUploadClick }: VerificationAlertProps) {
  if (!user) return null;

  const isVerified = user.verificationStatus === 'VERIFIED';
  const isPending = user.verificationStatus === 'PENDING';

  // If verified, show success (optional - currently returns null for verified)
  if (isVerified) return null;

  return (
    <Alert
      className={`mb-6 border-2 ${
        isPending
          ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50'
          : 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50'
      } rounded-xl shadow-sm overflow-hidden`}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0 mt-0.5">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <AlertTitle className="text-amber-900 font-bold text-sm">
            {isPending ? 'Verifikasi Sedang Diproses' : 'Akun Belum Terverifikasi'}
          </AlertTitle>
          <AlertDescription className="text-amber-800 mt-1">
            <p className="text-sm mb-3">
              {isPending
                ? 'Dokumen verifikasi Anda sedang ditinjau oleh tim kami. Proses ini biasanya memakan waktu 1-3 hari kerja.'
                : 'Lengkapi dokumen verifikasi untuk meningkatkan kepercayaan dan mendapatkan lebih banyak proyek.'}
            </p>
            {!isPending && (
              <Button
                size="sm"
                onClick={onUploadClick}
                className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white shadow-sm shadow-amber-200 transition-all duration-200 hover:shadow-md"
              >
                <ShieldCheck className="h-4 w-4 mr-1.5" />
                Unggah Dokumen
              </Button>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
