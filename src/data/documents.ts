/**
 * Mock document data
 * Note: In production, this data should come from the database/API
 */

export interface MockDocument {
  name: string;
  type: string;
  project: string;
  date: string;
  size: string;
  approved: boolean;
}

/**
 * Mock documents data for OwnerDashboard
 */
export const mockDocuments: MockDocument[] = [
  { name: 'Kontrak_Kerja_Rumah_2Lantai.pdf', type: 'KONTRAK', project: 'Pembangunan Rumah 2 Lantai', date: '15 Jan 2025', size: '2.4 MB', approved: true },
  { name: 'Gambar_Teknis_Floor_Plan.pdf', type: 'GAMBAR', project: 'Pembangunan Rumah 2 Lantai', date: '14 Jan 2025', size: '5.1 MB', approved: true },
  { name: 'RAB_Renovasi_Kantor.pdf', type: 'RAB', project: 'Renovasi Kantor Pusat', date: '10 Jan 2025', size: '1.2 MB', approved: false },
  { name: 'Invoice_Pembayaran_1.pdf', type: 'INVOICE', project: 'Pembangunan Rumah 2 Lantai', date: '08 Jan 2025', size: '340 KB', approved: true },
  { name: 'SPK_Pembangunan_Gudang.pdf', type: 'SPK', project: 'Pembangunan Gudang Baru', date: '05 Jan 2025', size: '890 KB', approved: true },
];

// Legacy export for backward compatibility
export const mockDocumentsData = mockDocuments;
