import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Email tidak valid');
const passwordSchema = z.string().min(6, 'Password minimal 6 karakter');
const phoneSchema = z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Nomor telepon tidak valid').optional();
const nameSchema = z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter');

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['OWNER', 'CONTRACTOR'], {
    message: 'Role harus OWNER atau CONTRACTOR',
  }),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  phone: phoneSchema,
  role: z.enum(['OWNER', 'CONTRACTOR']),
  companyName: z.string().min(2).max(200).optional(),
});

// Project schemas
export const createProjectSchema = z.object({
  title: z.string().min(5, 'Judul proyek minimal 5 karakter').max(200),
  description: z.string().min(20, 'Deskripsi minimal 20 karakter'),
  category: z.enum(['Pembangunan Baru', 'Renovasi', 'Komersial', 'Interior', 'Fasilitas', 'Lainnya']),
  location: z.string().min(3, 'Lokasi minimal 3 karakter'),
  budget: z.number().positive('Budget harus lebih dari 0'),
  duration: z.number().int().positive('Durasi harus angka bulat positif').optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  requirements: z.array(z.string()).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// Bid schemas
export const createBidSchema = z.object({
  projectId: z.string().cuid('Project ID tidak valid'),
  proposal: z.string().min(20, 'Proposal minimal 20 karakter'),
  price: z.number().positive('Harga harus lebih dari 0'),
  duration: z.number().int().positive('Durasi harus angka bulat positif'),
  startDate: z.string().datetime().optional(),
});

export const updateBidSchema = z.object({
  proposal: z.string().min(20).optional(),
  price: z.number().positive().optional(),
  duration: z.number().int().positive().optional(),
});

// Document schemas
export const uploadDocumentSchema = z.object({
  name: z.string().min(2).max(200),
  type: z.enum(['KONTRAK', 'GAMBAR', 'INVOICE', 'SPK', 'RAB', 'LAINNYA']),
  projectId: z.string().cuid(),
  description: z.string().max(500).optional(),
});

// Milestone schemas
export const createMilestoneSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  amount: z.number().nonnegative().optional(),
  dueDate: z.string().datetime().optional(),
  order: z.number().int().nonnegative().optional(),
});

// Payment schemas
export const createPaymentSchema = z.object({
  milestoneId: z.string().cuid(),
  amount: z.number().positive(),
  method: z.enum(['BANK_TRANSFER', 'CASH', 'DIGITAL_WALLET', 'OTHER']),
  notes: z.string().max(500).optional(),
  proofUrl: z.string().url().optional(),
});

// Review schemas
export const createReviewSchema = z.object({
  projectId: z.string().cuid(),
  contractorId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  qualityRating: z.number().int().min(1).max(5),
  timelinessRating: z.number().int().min(1).max(5),
  communicationRating: z.number().int().min(1).max(5),
  valueRating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// Message schemas
export const sendMessageSchema = z.object({
  conversationId: z.string().cuid(),
  content: z.string().min(1, 'Pesan tidak boleh kosong').max(5000),
});

// Profile schemas
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema,
  avatar: z.string().url().optional(),
});

export const updateContractorProfileSchema = z.object({
  companyName: z.string().min(2).max(200).optional(),
  companyType: z.string().max(50).optional(),
  npwp: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}$/, 'NPWP tidak valid').optional(),
  nib: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  postalCode: z.string().regex(/^\d{5}$/, 'Kode pos harus 5 digit').optional(),
  specialization: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Filter schemas
export const projectFilterSchema = z.object({
  status: z.enum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  minBudget: z.number().nonnegative().optional(),
  maxBudget: z.number().positive().optional(),
  search: z.string().max(100).optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateBidInput = z.infer<typeof createBidSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
