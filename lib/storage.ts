import { MemberRecord, RegistrationFormData, MemberType, AppSettings, DashboardStats } from '@/types';

const STORAGE_KEYS = {
  PENDING: 'jg_pending_members_v1',
  APPROVED: 'jg_approved_members_v1',
  SETTINGS: 'jg_app_settings_v1',
  ADMIN_SESSION: 'jg_admin_session_v1'
};

export const DEFAULT_AVATAR = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNDAiIGhlaWdodD0iMjgwIiB2aWV3Qm94PSIwIDAgMjQwIDI4MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YxZjVmOSIvPjxjaXJjbGUgY3g9IjEyMCIgY3k9IjEwMCIgcj0iNTAiIGZpbGw9IiNjYmQ1ZTEiLz48cGF0aCBkPSJNMCAyNTAgQyAwIDE3MCwgMjQw IDE3MCwgMjQwIDI1MCBaIiBmaWxsPSIjY2JkNWUxIi8+PC9zdmc+`;

export const DEFAULT_MEMBER_TYPES: MemberType[] = [
  'Executive Member',
  'Assistant Member',
  'Secretary',
  'Joint Secretary',
  'Treasurer',
  'Vice President',
  'President',
  'Member'
];

export const PERMANENT_ORG_ADDRESS = 'Jamuna Para Jame Masjid, Paterbhita, Chandanbaisha, Shariakandi, Bogura, Bangladesh';

export const DEFAULT_APPROVED_MEMBER: MemberRecord = {
  id: 'M_JG-2025-001',
  registrationNumber: 'JG-2025-001',
  memberType: 'Member',
  fullName: 'NIROB KAZI',
  fatherName: 'Kazi Ruhul Amin',
  motherName: 'Nurun Nahar',
  gender: 'Male',
  dob: '2000-01-01',
  bloodGroup: 'A+',
  phone: '01712345678',
  email: 'nirobkazi@gmail.com',
  presentAddress: PERMANENT_ORG_ADDRESS,
  permanentAddressSame: true,
  permanentAddress: PERMANENT_ORG_ADDRESS,
  occupation: 'Business',
  companyName: 'Janatha Garage',
  photoUrl: '/nirob-kazi.jpg',
  status: 'Approved',
  submissionDate: '2025-01-01T00:00:00.000Z',
  approvalDate: '2025-01-15T10:00:00.000Z'
};

export const DEFAULT_SETTINGS: AppSettings = {
  gasWebAppUrl: typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_GAS_WEB_APP_URL || process.env.VITE_GAS_WEB_APP_URL) ? (process.env.NEXT_PUBLIC_GAS_WEB_APP_URL || process.env.VITE_GAS_WEB_APP_URL)! : 'https://script.google.com/macros/s/AKfycbzoJKOiVcrBLJHvxfN8KFdNJDRWkShYBzDvo5CQFuk_9JPckOYWmRBRZ_yC61r-ExxS2g/exec',
  spreadsheetId: '',
  driveFolderId: '',
  useLiveGas: true,
  memberTypes: DEFAULT_MEMBER_TYPES,
  orgName: 'Janatha Garage',
  orgAddress: PERMANENT_ORG_ADDRESS,
  orgPhone: '+8801700000000',
  orgEmail: 'info@janathagarage.org',
  authoritySignatureUrl: '',
  authorityTitle: 'Authorized Signature'
};

function purgeLegacyStaticData() {
  if (typeof window === 'undefined') return;
  try {
    const rawApproved = localStorage.getItem(STORAGE_KEYS.APPROVED);
    if (rawApproved && (rawApproved.includes('M_JG260001') || rawApproved.includes('M_JG-2025-001'))) {
      const parsed = JSON.parse(rawApproved);
      if (Array.isArray(parsed)) {
        const withoutFakeDemo = parsed.filter(
          (m: any) => m.id !== 'M_JG-2025-001' && m.registrationNumber !== 'JG-2025-001'
        );
        if (withoutFakeDemo.length > 0) {
          localStorage.setItem(STORAGE_KEYS.APPROVED, JSON.stringify(withoutFakeDemo));
        } else {
          localStorage.removeItem(STORAGE_KEYS.APPROVED);
        }
      } else {
        localStorage.removeItem(STORAGE_KEYS.APPROVED);
      }
    }
    const rawPending = localStorage.getItem(STORAGE_KEYS.PENDING);
    if (rawPending && rawPending.includes('PEND_1001')) {
      localStorage.removeItem(STORAGE_KEYS.PENDING);
    }
  } catch (e) {
    // Ignore
  }
}
if (typeof window !== 'undefined') {
  purgeLegacyStaticData();
}

export function getStoredSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.gasWebAppUrl || parsed.gasWebAppUrl.includes('YOUR_DEPLOYMENT_ID')) {
        parsed.gasWebAppUrl = DEFAULT_SETTINGS.gasWebAppUrl;
      }
      if (!parsed.orgAddress || parsed.orgAddress.includes('Dhanmondi')) {
        parsed.orgAddress = PERMANENT_ORG_ADDRESS;
      }
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    // Ignore error
  }
  return DEFAULT_SETTINGS;
}

export function saveStoredSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function getApprovedMembers(): MemberRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPROVED);
    if (raw) {
      const parsed: MemberRecord[] = JSON.parse(raw);
      const list = parsed
        .filter((m) => m.id !== 'M_JG-2025-001' && m.registrationNumber !== 'JG-2025-001')
        .map((m) => ({
          ...m,
          status: 'Approved' as const,
          phone: formatPhoneNumber(m.phone)
        }));
      return list;
    }
    return [];
  } catch (e) {
    return [];
  }
}

export function getPendingMembers(): MemberRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENDING);
    if (raw) {
      const parsed: MemberRecord[] = JSON.parse(raw);
      return parsed.map((m) => ({
        ...m,
        phone: formatPhoneNumber(m.phone)
      }));
    }
    return [];
  } catch (e) {
    return [];
  }
}

export function saveApprovedMembers(members: MemberRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.APPROVED, JSON.stringify(members));
}

export function savePendingMembers(members: MemberRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PENDING, JSON.stringify(members));
}

export function formatPhoneNumber(phone: string | number | undefined | null): string {
  if (phone === undefined || phone === null || phone === '') return '';
  const str = String(phone).trim();
  if (!str) return '';
  if (/^1[3-9]\d{8}$/.test(str)) {
    return '0' + str;
  }
  return str;
}

export function normalizePhoneDigits(phone: string | number | undefined | null): string {
  if (phone === undefined || phone === null || phone === '') return '';
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('8801') && digits.length === 13) {
    digits = digits.slice(2);
  } else if (digits.startsWith('1') && digits.length === 10) {
    digits = '0' + digits;
  }
  return digits;
}

export function isSamePhoneNumber(p1: string | number | undefined | null, p2: string | number | undefined | null): boolean {
  const norm1 = normalizePhoneDigits(p1);
  const norm2 = normalizePhoneDigits(p2);
  if (!norm1 || !norm2) return false;
  return norm1 === norm2;
}

export function matchesPhoneNumber(storedPhone: string | number | undefined | null, query: string): boolean {
  if (storedPhone === undefined || storedPhone === null || storedPhone === '') return false;
  const q = String(query || '').trim();
  if (!q) return false;

  const rawStored = String(storedPhone).trim();
  const formattedStored = formatPhoneNumber(rawStored);
  const formattedQuery = formatPhoneNumber(q);

  const qLower = q.toLowerCase();
  const qFormattedLower = formattedQuery.toLowerCase();

  if (
    rawStored.toLowerCase().includes(qLower) ||
    formattedStored.toLowerCase().includes(qLower) ||
    rawStored.toLowerCase().includes(qFormattedLower) ||
    formattedStored.toLowerCase().includes(qFormattedLower)
  ) {
    return true;
  }

  const storedDigits = rawStored.replace(/\D/g, '');
  const queryDigits = q.replace(/\D/g, '');
  if (queryDigits.length > 0) {
    const formattedStoredDigits = formattedStored.replace(/\D/g, '');
    const formattedQueryDigits = formattedQuery.replace(/\D/g, '');
    if (
      storedDigits.includes(queryDigits) ||
      formattedStoredDigits.includes(queryDigits) ||
      storedDigits.includes(formattedQueryDigits) ||
      formattedStoredDigits.includes(formattedQueryDigits)
    ) {
      return true;
    }
  }

  return false;
}

export function checkDuplicateMember(phone: string, email: string): { isDuplicate: boolean; message?: string } {
  const cleanPhone = normalizePhoneDigits(phone);
  const cleanEmail = String(email || '').toLowerCase().trim();

  const pending = getPendingMembers();
  const approved = getApprovedMembers();

  for (const item of pending) {
    if (cleanPhone && isSamePhoneNumber(item.phone, cleanPhone)) {
      return { isDuplicate: true, message: `This phone number (${formatPhoneNumber(phone)}) is already registered and waiting for admin approval.` };
    }
    if (cleanEmail && String(item.email || '').toLowerCase().trim() === cleanEmail) {
      return { isDuplicate: true, message: `This email address (${email}) is already registered and waiting for admin approval.` };
    }
  }

  for (const item of approved) {
    if (cleanPhone && isSamePhoneNumber(item.phone, cleanPhone)) {
      return { isDuplicate: true, message: `This phone number (${formatPhoneNumber(phone)}) is already registered as an approved member of Janatha Garage.` };
    }
    if (cleanEmail && String(item.email || '').toLowerCase().trim() === cleanEmail) {
      return { isDuplicate: true, message: `This email address (${email}) is already registered as an approved member.` };
    }
  }

  return { isDuplicate: false };
}

export function submitRegistration(formData: RegistrationFormData): { success: boolean; message: string; record?: MemberRecord } {
  const dup = checkDuplicateMember(formData.phone, formData.email);
  if (dup.isDuplicate) {
    return { success: false, message: dup.message || 'Duplicate registration detected.' };
  }

  const pending = getPendingMembers();
  const formattedPhone = formatPhoneNumber(formData.phone);
  const newRecord: MemberRecord = {
    ...formData,
    phone: formattedPhone,
    id: 'PEND_' + Date.now(),
    status: 'Pending',
    submissionDate: new Date().toISOString()
  };

  pending.unshift(newRecord);
  savePendingMembers(pending);

  return {
    success: true,
    message: 'Registration Submitted Successfully. Please wait for Admin Approval. Your Registration Number will be sent to your email after approval.',
    record: newRecord
  };
}

export function approvePendingMember(pendingId: string, memberType: MemberType): { success: boolean; message: string; registrationNumber?: string } {
  const pending = getPendingMembers();
  const approved = getApprovedMembers();

  const pendingIndex = pending.findIndex((p) => p.id === pendingId);
  if (pendingIndex === -1) {
    return { success: false, message: 'Pending application not found.' };
  }

  const pendingRecord = pending[pendingIndex];

  const currentYear = new Date().getFullYear().toString();
  const prefix = `JG-${currentYear}-`;

  let maxSeq = 0;
  approved.forEach((m) => {
    if (m.registrationNumber) {
      const match = m.registrationNumber.match(/JG[-]?\d{2,4}[-]0*(\d+)/i) || m.registrationNumber.match(/JG\d{2}0*(\d+)/i);
      if (match && match[1]) {
        const seq = parseInt(match[1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  });

  const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
  const regNo = `JG-${currentYear}-${nextSeq}`;

  const approvedRecord: MemberRecord = {
    ...pendingRecord,
    id: 'M_' + regNo,
    registrationNumber: regNo,
    memberType,
    status: 'Approved',
    approvalDate: new Date().toISOString()
  };

  pending.splice(pendingIndex, 1);
  approved.unshift(approvedRecord);

  savePendingMembers(pending);
  saveApprovedMembers(approved);

  return {
    success: true,
    message: `Member Approved Successfully! Registration Number generated: ${regNo}`,
    registrationNumber: regNo
  };
}

export function rejectPendingMember(pendingId: string): { success: boolean; message: string } {
  const pending = getPendingMembers();
  const filtered = pending.filter((p) => p.id !== pendingId);
  if (pending.length === filtered.length) {
    return { success: false, message: 'Pending record not found.' };
  }
  savePendingMembers(filtered);
  return { success: true, message: 'Application rejected successfully.' };
}

export function searchApprovedMembers(query: string, bloodGroupFilter?: string): MemberRecord[] {
  const approved = getApprovedMembers();
  const q = String(query || '').trim().toLowerCase();

  return approved.filter((m) => {
    const matchQuery =
      !q ||
      String(m.registrationNumber || '').toLowerCase().includes(q) ||
      matchesPhoneNumber(m.phone, q);

    const matchBlood = !bloodGroupFilter || m.bloodGroup === bloodGroupFilter;

    return matchQuery && matchBlood;
  });
}

export function getStats(): DashboardStats {
  const approved = getApprovedMembers();
  const pending = getPendingMembers();

  const bloodGroupCounts: Record<string, number> = {
    'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'O+': 0, 'O-': 0, 'AB+': 0, 'AB-': 0
  };

  approved.forEach((m) => {
    if (bloodGroupCounts[m.bloodGroup] !== undefined) {
      bloodGroupCounts[m.bloodGroup]++;
    }
  });

  return {
    totalMembers: approved.length,
    pendingCount: pending.length,
    approvedCount: approved.length,
    rejectedCount: 0,
    bloodGroupCounts,
    recentApproved: approved.slice(0, 5)
  };
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const session = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
    return session === 'true';
  } catch (e) {
    return false;
  }
}

export function setAdminLoggedIn(loggedIn: boolean): void {
  if (typeof window === 'undefined') return;
  if (loggedIn) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
  } else {
    localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'false');
  }
}
