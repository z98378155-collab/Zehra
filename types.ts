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
  targetClass?: string; // 'all' or specific class like '11-D'
}

export interface Student {
  id: number;
  schoolNo: string; // Added school number
  name: string;
  grade: string;
  gender: 'male' | 'female'; // Added gender
  parentName: string;
  phone: string; // Added phone number
  financials: FinancialRecord;
  receipts: PaymentReceipt[];
}

export interface Grade {
  lesson: string;
  exam1?: number;
  exam2?: number;
  project?: number;
  average?: number;
}

export interface Attendance {
  id: number;
  date: string;
  type: 'Özürlü' | 'Özürsüz';
  duration: 'Tam Gün' | 'Yarım Gün';
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
  ADMIN = 'ADMIN', // Okul Müdürü / Müdür Yrd / Muhasebe
  CUSTOMER = 'CUSTOMER', // Veli
  GUEST = 'GUEST'
}

export interface SessionUser {
  role: UserRole;
  name: string; // Display name (e.g., "Ahmet Yılmaz" or "Okul Müdürü")
  studentId?: number; // Only for CUSTOMER role
  studentName?: string; // Only for CUSTOMER role
  grade?: string; // Only for CUSTOMER role
}