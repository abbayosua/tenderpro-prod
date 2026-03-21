/**
 * CSV Export Utilities for TenderPro
 * Handles client-side CSV generation and download
 */

/**
 * Convert array of objects to CSV string
 * @param data - Array of data objects
 * @param headers - Object mapping data keys to CSV header names
 * @param columns - Array of keys to include (in order)
 */
export function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers: Record<string, string>,
  columns: (keyof T)[]
): string {
  if (data.length === 0) {
    return '';
  }

  // Create header row with Indonesian headers
  const headerRow = columns.map(col => headers[col as string] || String(col)).join(',');

  // Create data rows
  const dataRows = data.map(item => {
    return columns.map(col => {
      const value = item[col];
      return formatCSVValue(value);
    }).join(',');
  });

  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Format a value for CSV output
 * Handles strings, numbers, dates, null/undefined
 */
function formatCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'number') {
    // Format numbers without thousand separators for CSV
    return String(value);
  }

  if (value instanceof Date) {
    return formatDateForCSV(value);
  }

  if (typeof value === 'string') {
    // Check if it's a date string (YYYY-MM-DD format)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    // Escape quotes and wrap in quotes if contains comma, newline, or quote
    return escapeCSVString(value);
  }

  // Convert other types to string
  return escapeCSVString(String(value));
}

/**
 * Escape a string for CSV output
 */
function escapeCSVString(str: string): string {
  // If string contains comma, newline, or quote, wrap in quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    // Double any existing quotes
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Format a date as YYYY-MM-DD for CSV
 */
function formatDateForCSV(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Download a string as a file
 * Uses UTF-8 BOM for proper encoding of Indonesian characters
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add UTF-8 BOM for proper encoding
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(baseName: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${baseName}_${year}${month}${day}_${hours}${minutes}.csv`;
}

// ==============================
// Budget Summary Export Types & Functions
// ==============================

export interface BudgetSummaryItem {
  name: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
}

/**
 * Export budget summary to CSV
 */
export function exportBudgetSummary(data: BudgetSummaryItem[]): void {
  const headers: Record<string, string> = {
    name: 'Kategori',
    budget: 'Anggaran',
    spent: 'Terpakai',
    remaining: 'Sisa',
    percentage: 'Persentase',
  };

  const columns: (keyof BudgetSummaryItem)[] = ['name', 'budget', 'spent', 'remaining', 'percentage'];

  // Format percentage with % symbol
  const formattedData = data.map(item => ({
    ...item,
    percentage: `${item.percentage}%`,
  }));

  const csv = arrayToCSV(formattedData, headers, columns);
  
  if (csv) {
    downloadCSV(csv, generateFilename('ringkasan_anggaran'));
  }
}

// ==============================
// Payment History Export Types & Functions
// ==============================

export interface PaymentHistoryItem {
  date: string;
  projectName: string;
  milestoneTitle: string;
  amount: number;
  method: string;
  status: string;
}

/**
 * Export payment history to CSV
 */
export function exportPaymentHistory(data: PaymentHistoryItem[]): void {
  const headers: Record<string, string> = {
    date: 'Tanggal',
    projectName: 'Proyek',
    milestoneTitle: 'Milestone',
    amount: 'Jumlah',
    method: 'Metode',
    status: 'Status',
  };

  const columns: (keyof PaymentHistoryItem)[] = ['date', 'projectName', 'milestoneTitle', 'amount', 'method', 'status'];

  // Format status to Indonesian
  const formattedData = data.map(item => ({
    ...item,
    status: item.status === 'PAID' ? 'Dibayar' : item.status === 'PENDING' ? 'Menunggu' : item.status,
  }));

  const csv = arrayToCSV(formattedData, headers, columns);
  
  if (csv) {
    downloadCSV(csv, generateFilename('riwayat_pembayaran'));
  }
}

// ==============================
// Milestone Breakdown Export Types & Functions
// ==============================

export interface MilestoneExportItem {
  projectTitle: string;
  milestoneTitle: string;
  budget: number;
  paid: number;
  pending: number;
  status: string;
  targetDate: string;
}

/**
 * Export milestone breakdown to CSV
 */
export function exportMilestoneBreakdown(data: MilestoneExportItem[]): void {
  const headers: Record<string, string> = {
    projectTitle: 'Proyek',
    milestoneTitle: 'Milestone',
    budget: 'Anggaran',
    paid: 'Dibayar',
    pending: 'Pending',
    status: 'Status',
    targetDate: 'Target',
  };

  const columns: (keyof MilestoneExportItem)[] = [
    'projectTitle', 'milestoneTitle', 'budget', 'paid', 'pending', 'status', 'targetDate'
  ];

  // Format status to Indonesian
  const formattedData = data.map(item => ({
    ...item,
    status: formatMilestoneStatus(item.status),
  }));

  const csv = arrayToCSV(formattedData, headers, columns);
  
  if (csv) {
    downloadCSV(csv, generateFilename('rincian_milestone'));
  }
}

/**
 * Format milestone status to Indonesian
 */
function formatMilestoneStatus(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'Selesai';
    case 'IN_PROGRESS':
      return 'Berjalan';
    case 'PENDING':
    default:
      return 'Menunggu';
  }
}

/**
 * Check if data is empty for export
 */
export function hasDataToExport<T>(data: T[] | undefined | null): boolean {
  return data !== null && data !== undefined && data.length > 0;
}
