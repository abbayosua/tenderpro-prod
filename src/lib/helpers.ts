/**
 * Utility helper functions for TenderPro
 */

import { Contractor } from '@/types';

/**
 * Format currency to Indonesian Rupiah
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate match score between contractor and project
 */
export function calculateMatchScore(
  contractor: Contractor | null,
  projectCategory: string,
  projectBudget: number
): number {
  if (!contractor || !contractor.company) return 50;

  let score = 50; // Base score

  // Category match
  if (contractor.company.specialization?.toLowerCase().includes(projectCategory.toLowerCase())) {
    score += 20;
  }

  // Experience bonus
  if (contractor.company.experienceYears >= 5) score += 10;
  if (contractor.company.experienceYears >= 10) score += 5;

  // Rating bonus
  if (contractor.company.rating >= 4.5) score += 10;
  if (contractor.company.rating >= 4.8) score += 5;

  // Completed projects bonus
  if (contractor.company.completedProjects >= 10) score += 5;
  if (contractor.company.completedProjects >= 50) score += 5;

  // Verification bonus
  if (contractor.verificationStatus === 'VERIFIED') score += 10;

  return Math.min(score, 100); // Cap at 100
}

/**
 * Format date to Indonesian locale
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  };
  return new Date(date).toLocaleDateString('id-ID', defaultOptions);
}

/**
 * Format date time to Indonesian locale
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get status badge color class
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'bg-primary';
    case 'IN_PROGRESS':
      return 'bg-blue-600';
    case 'COMPLETED':
      return 'bg-green-600';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-700';
    case 'ACCEPTED':
      return 'bg-primary';
    case 'REJECTED':
      return 'bg-red-100 text-red-700';
    default:
      return '';
  }
}

/**
 * Get status label in Indonesian
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'Tender Terbuka';
    case 'IN_PROGRESS':
      return 'Sedang Berjalan';
    case 'COMPLETED':
      return 'Selesai';
    case 'PENDING':
      return 'Pending';
    case 'ACCEPTED':
      return 'Diterima';
    case 'REJECTED':
      return 'Ditolak';
    default:
      return status;
  }
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Indonesian format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ''));
}

/**
 * Slugify string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Get relative time string
 */
export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  return formatDate(date);
}
