export interface StudentPaymentStatus {
  studentId: number;
  firstName: string;
  lastName: string;
  paidAmount: number; // in grosze
  paidAt: number | null;
  status: 'PENDING' | 'PAID' | 'PARTIAL';
}
