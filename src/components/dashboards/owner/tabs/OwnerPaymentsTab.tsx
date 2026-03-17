'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge, Progress } from '@/components/ui';
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Download, FileText } from 'lucide-react';
import { formatRupiah } from '@/lib/helpers';
import type { OwnerPaymentsTabProps } from './types';

export function OwnerPaymentsTab({ ownerStats, paymentSummary }: OwnerPaymentsTabProps) {
  const payments = ownerStats.projects.flatMap(p => 
    (p.milestones || []).flatMap(m => 
      (m.payments || []).map(pay => ({
        ...pay,
        projectName: p.title,
        milestoneTitle: m.title,
      }))
    )
  );

  return (
    <div className="space-y-6">
      {/* Payment Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Anggaran</p>
                <p className="text-2xl font-bold">{formatRupiah(paymentSummary?.totalBudget || 0)}</p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Sudah Dibayar</p>
                <p className="text-2xl font-bold text-green-600">{formatRupiah(paymentSummary?.totalPaid || 0)}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Menunggu Pembayaran</p>
                <p className="text-2xl font-bold text-yellow-600">{formatRupiah(paymentSummary?.totalPending || 0)}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Sisa Anggaran</p>
                <p className="text-2xl font-bold text-blue-600">{formatRupiah(paymentSummary?.remainingBudget || 0)}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      {paymentSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progress Pembayaran</CardTitle>
            <CardDescription>Status pembayaran keseluruhan proyek</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress Pembayaran</span>
                  <span>{paymentSummary.totalBudget > 0 ? Math.round((paymentSummary.totalPaid / paymentSummary.totalBudget) * 100) : 0}%</span>
                </div>
                <Progress value={paymentSummary.totalBudget > 0 ? (paymentSummary.totalPaid / paymentSummary.totalBudget) * 100 : 0} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Riwayat Pembayaran</CardTitle>
              <CardDescription>Daftar semua transaksi pembayaran</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Belum ada riwayat pembayaran</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payment.status === 'PAID' ? 'bg-green-100' : payment.status === 'PENDING' ? 'bg-yellow-100' : 'bg-slate-100'}`}>
                      {payment.status === 'PAID' ? (
                        <ArrowUpRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{payment.milestoneTitle}</p>
                      <p className="text-sm text-slate-500">{payment.projectName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatRupiah(payment.amount)}</p>
                    <Badge variant={payment.status === 'PAID' ? 'default' : 'secondary'}>
                      {payment.status === 'PAID' ? 'Dibayar' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
