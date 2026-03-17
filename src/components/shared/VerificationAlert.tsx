'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface VerificationAlertProps {
  user: { verificationStatus: string } | null;
  onUploadClick: () => void;
}

export function VerificationAlert({ user, onUploadClick }: VerificationAlertProps) {
  if (!user) return null;
  if (user.verificationStatus === 'VERIFIED') return null;

  return (
    <Alert className="mb-6 border-yellow-200 bg-yellow-50">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800">Akun Belum Terverifikasi</AlertTitle>
      <AlertDescription className="text-yellow-700">
        <p className="mb-2">Lengkapi dokumen verifikasi untuk mendapatkan kepercayaan lebih dari pengguna lain.</p>
        <Button size="sm" onClick={onUploadClick} className="bg-yellow-600 hover:bg-yellow-700">
          Unggah Dokumen
        </Button>
      </AlertDescription>
    </Alert>
  );
}
