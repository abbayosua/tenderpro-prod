// Type definitions for TenderPro

export interface Contractor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isVerified: boolean;
  verificationStatus: string;
  company: {
    name: string;
    specialization?: string;
    experienceYears: number;
    rating: number;
    totalProjects: number;
    completedProjects: number;
    city?: string;
    province?: string;
    description?: string;
  } | null;
  portfolios: Array<{
    id: string;
    title: string;
    category: string;
    location?: string;
    budget?: number;
  }>;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget: number;
  duration?: number;
  status: string;
  viewCount: number;
  owner: { name: string; isVerified: boolean; company?: string; };
  bidCount: number;
}

export interface Bid {
  id: string;
  price: number;
  duration: number;
  status: string;
  proposal: string;
  contractor: {
    id: string;
    name: string;
    isVerified: boolean;
    company?: string;
    rating?: number;
    totalProjects?: number;
  };
}

export interface OwnerStats {
  totalProjects: number;
  activeProjects: number;
  openProjects: number;
  completedProjects: number;
  totalPendingBids: number;
  trends?: {
    totalProjects: { value: string; isUp: boolean };
    activeProjects: { value: string; isUp: boolean };
    openProjects: { value: string; isUp: boolean };
    pendingBids: { value: string; isUp: boolean };
  };
  projects: Array<{
    id: string;
    title: string;
    category: string;
    location: string;
    budget: number;
    status: string;
    bidCount: number;
    bids: Bid[];
  }>;
}

export interface ContractorStats {
  totalBids: number;
  acceptedBids: number;
  pendingBids: number;
  rejectedBids: number;
  winRate: string;
  recentBids: Array<{
    id: string;
    price: number;
    status: string;
    project: { id: string; title: string; category: string; location: string; budget: number; owner: { name: string }; };
  }>;
  availableProjects: Array<{
    id: string;
    title: string;
    category: string;
    location: string;
    budget: number;
    duration?: number;
    bidCount: number;
    hasBid: boolean;
    owner: { name: string; company?: string };
  }>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Favorite {
  id: string;
  notes?: string;
  createdAt: string;
  contractor: Contractor;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completedAt?: string;
  status: string;
  order: number;
  amount?: number;
  paymentStatus?: string;
  paidAt?: string;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  milestoneId: string;
  amount: number;
  method: string;
  status: string;
  transactionId?: string;
  notes?: string;
  proofUrl?: string;
  paidAt?: string;
  confirmedAt?: string;
  createdAt: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  uploadedBy: string;
  name: string;
  type: string;
  fileUrl: string;
  fileSize: number;
  description?: string;
  isApproved: boolean;
  approvedAt?: string;
  createdAt: string;
}

export interface UserDocument {
  id: string;
  type: string;
  name: string;
  verified: boolean;
}

export interface NewProject {
  title: string;
  description: string;
  category: string;
  location: string;
  budget: string;
  duration: string;
  requirements: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  // Contractor fields
  companyName: string;
  companyType: string;
  npwp: string;
  nib: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  specialization: string;
  experienceYears: string;
  employeeCount: string;
  description: string;
  // Owner fields
  ownerCompanyName: string;
  ownerCompanyType: string;
  ownerNpwp: string;
  ownerAddress: string;
  ownerCity: string;
  ownerProvince: string;
  ownerPostalCode: string;
}

export const defaultRegisterForm: RegisterForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  companyType: '',
  npwp: '',
  nib: '',
  address: '',
  city: '',
  province: '',
  postalCode: '',
  specialization: '',
  experienceYears: '',
  employeeCount: '',
  description: '',
  ownerCompanyName: '',
  ownerCompanyType: '',
  ownerNpwp: '',
  ownerAddress: '',
  ownerCity: '',
  ownerProvince: '',
  ownerPostalCode: '',
};

export const defaultNewProject: NewProject = {
  title: '',
  description: '',
  category: 'Pembangunan Baru',
  location: '',
  budget: '',
  duration: '',
  requirements: '',
};
