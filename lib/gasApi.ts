import { MemberRecord, RegistrationFormData, MemberType, DashboardStats } from '@/types';
import { formatPhoneNumber } from './storage';

async function callGasProxy(gasUrl: string, body: Record<string, any>) {
  try {
    const res = await fetch('/api/gas-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gasUrl, ...body })
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, message: 'Invalid response from server.' };
    }
  } catch (err: any) {
    console.error('GAS API Proxy Error:', err);
    return { success: false, message: err?.message || 'Failed to communicate with Google Sheets proxy.' };
  }
}

export async function fetchApprovedMembersFromGAS(gasUrl: string): Promise<MemberRecord[]> {
  if (!gasUrl) return [];
  const res = await callGasProxy(gasUrl, { action: 'getApprovedMembers' });
  if (res && res.success && Array.isArray(res.data)) {
    return res.data.map((m: MemberRecord) => ({
      ...m,
      phone: formatPhoneNumber(m.phone)
    }));
  }
  return [];
}

export async function fetchPendingMembersFromGAS(gasUrl: string): Promise<MemberRecord[]> {
  if (!gasUrl) return [];
  const res = await callGasProxy(gasUrl, { action: 'getPendingMembers' });
  if (res && res.success && Array.isArray(res.data)) {
    return res.data.map((m: MemberRecord) => ({
      ...m,
      phone: formatPhoneNumber(m.phone)
    }));
  }
  return [];
}

export async function fetchStatsFromGAS(gasUrl: string): Promise<DashboardStats | null> {
  if (!gasUrl) return null;
  const res = await callGasProxy(gasUrl, { action: 'getStats' });
  if (res && res.success && res.data) {
    return res.data as DashboardStats;
  }
  return null;
}

export async function fetchMemberTypesFromGAS(gasUrl: string): Promise<string[]> {
  if (!gasUrl) return [];
  const res = await callGasProxy(gasUrl, { action: 'getMemberTypes' });
  if (res && res.success && Array.isArray(res.data)) {
    return res.data;
  }
  return [];
}

export async function registerMemberToGAS(
  gasUrl: string,
  formData: RegistrationFormData
): Promise<{ success: boolean; message: string; id?: string }> {
  if (!gasUrl) {
    return { success: false, message: 'Google Apps Script Web App URL is not configured.' };
  }
  const payload = {
    ...formData,
    photoBase64: formData.photoUrl
  };
  const res = await callGasProxy(gasUrl, { action: 'registerMember', payload });
  return {
    success: !!res?.success,
    message: res?.message || 'Registration completed.',
    id: res?.id
  };
}

export async function approveMemberInGAS(
  gasUrl: string,
  pendingId: string,
  memberType: MemberType
): Promise<{ success: boolean; message: string; registrationNumber?: string }> {
  if (!gasUrl) {
    return { success: false, message: 'Google Apps Script Web App URL is not configured.' };
  }
  const res = await callGasProxy(gasUrl, {
    action: 'approveMember',
    payload: { pendingId, memberType }
  });
  return {
    success: !!res?.success,
    message: res?.message || 'Member approved in Google Sheets.',
    registrationNumber: res?.registrationNumber
  };
}

export async function rejectMemberInGAS(
  gasUrl: string,
  pendingId: string,
  email?: string,
  fullName?: string
): Promise<{ success: boolean; message: string }> {
  if (!gasUrl) {
    return { success: false, message: 'Google Apps Script Web App URL is not configured.' };
  }
  const res = await callGasProxy(gasUrl, {
    action: 'rejectMember',
    payload: { pendingId, email, fullName }
  });
  return {
    success: !!res?.success,
    message: res?.message || 'Member rejected in Google Sheets.'
  };
}

export async function verifyMemberInGAS(
  gasUrl: string,
  regNo: string
): Promise<MemberRecord | null> {
  if (!gasUrl || !regNo) return null;
  const res = await callGasProxy(gasUrl, { action: 'verifyMember', regNo });
  if (res && res.success && res.data) {
    return res.data as MemberRecord;
  }
  return null;
}

export async function adminLoginGAS(
  gasUrl: string,
  userId: string,
  password: string
): Promise<{ success: boolean; token?: string; message?: string }> {
  if (!gasUrl) {
    return { success: false, message: 'Google Apps Script Web App URL is not configured.' };
  }
  const res = await callGasProxy(gasUrl, {
    action: 'adminLogin',
    payload: { userId, password }
  });
  return {
    success: !!res?.success,
    token: res?.token,
    message: res?.message
  };
}
