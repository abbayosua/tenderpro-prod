/**
 * Mock payment data
 * Note: In production, this data should come from the database/API
 */

export interface MockPayment {
  project: string;
  milestone: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'PROCESSING';
  date: string;
  method: string;
}

/**
 * Mock payment history data for OwnerDashboard
 */
export const mockPaymentHistory: MockPayment[] = [
  { project: 'Pembangunan Rumah 2 Lantai', milestone: 'Pembayaran Awal (DP 30%)', amount: 225000000, status: 'PAID', date: '15 Jan 2025', method: 'Transfer Bank' },
  { project: 'Pembangunan Rumah 2 Lantai', milestone: 'Pembayaran Progress 1 (20%)', amount: 150000000, status: 'PAID', date: '01 Feb 2025', method: 'Transfer Bank' },
  { project: 'Pembangunan Rumah 2 Lantai', milestone: 'Pembayaran Progress 2 (20%)', amount: 150000000, status: 'PENDING', date: 'Pending', method: '-' },
  { project: 'Renovasi Kantor Pusat', milestone: 'Down Payment (25%)', amount: 125000000, status: 'PAID', date: '10 Jan 2025', method: 'Transfer Bank' },
  { project: 'Renovasi Kantor Pusat', milestone: 'Pembayaran Progress (25%)', amount: 125000000, status: 'PENDING', date: 'Pending', method: '-' },
  { project: 'Pembangunan Gudang Baru', milestone: 'DP Kontrak (20%)', amount: 100000000, status: 'PAID', date: '05 Jan 2025', method: 'Transfer Bank' },
];

// Legacy export for backward compatibility
export const paymentHistoryData = mockPaymentHistory;
