export type MemberType =
  | 'Member'
  | 'Executive Member'
  | 'Assistant Member'
  | 'Secretary'
  | 'Joint Secretary'
  | 'Treasurer'
  | 'Vice President'
  | 'President'
  | string;

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export type ApplicationStatus = 'Pending' | 'Approved' | 'Rejected';

export interface RegistrationFormData {
  fullName: string;
  fatherName: string;
  motherName: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  bloodGroup: BloodGroup;
  phone: string;
  email: string;
  presentAddress: string;
  permanentAddressSame: boolean;
  permanentAddress: string;
  occupation: string;
  companyName: string;
  photoUrl: string; // base64 or hosted image url
  photoFileId?: string;
}

export interface MemberRecord extends RegistrationFormData {
  id: string;
  registrationNumber?: string; // e.g. JG-2025-001
  memberType?: MemberType;
  status: ApplicationStatus;
  submissionDate: string;
  approvalDate?: string;
  qrCodeUrl?: string;
  rejectedReason?: string;
}

export interface DashboardStats {
  totalMembers: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  bloodGroupCounts: Record<string, number>;
  recentApproved: MemberRecord[];
}

export interface AppSettings {
  gasWebAppUrl: string;
  spreadsheetId: string;
  driveFolderId: string;
  useLiveGas: boolean;
  memberTypes: string[];
  orgName: string;
  orgAddress: string;
  orgPhone: string;
  orgEmail: string;
  authoritySignatureUrl?: string;
  authorityTitle?: string;
}

export interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}
