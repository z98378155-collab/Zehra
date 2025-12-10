export interface FinancialRecord {
  tuitionFee: number; // Yıllık Eğitim Ücreti
  materialFee: number; // Araç-Gereç ve Yemek
  totalDebt: number;
  paidAmount: number;
  remainingDebt: number;
}

export interface PaymentReceipt {
  id: number;
  date: string;
  amount: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  fileUrl: string; // Mock url
  studentName?: string; // For admin view
}

export interface WeeklySchedule {
  day: string;
  lessons: string[];
}

export interface SchoolActivity {
  id: number;
  title: string;
  date: string;
  cost: number;
  description: string;
}

export interface Student {
  id: number;
  name: string;
  grade: string;
  gender: 'male' | 'female'; // Added gender
  parentName: string;
  phone: string; // Added phone number
  financials: FinancialRecord;
  receipts: PaymentReceipt[];
}

export interface MessageTemplate {
  subject: string;
  body: string;
}

export interface SearchResult {
  title: string;
  uri: string;
}

export enum UserRole {
  ADMIN = 'ADMIN', // Okul Müdürü / Muhasebe
  CUSTOMER = 'CUSTOMER', // Veli
  GUEST = 'GUEST'
}