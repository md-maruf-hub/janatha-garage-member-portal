import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Settings,
  Plus,
  Trash2,
  Copy,
  Check,
  Shield,
  Search,
  Code,
  Download,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { MemberRecord, MemberType, AppSettings, DashboardStats } from '@/types';
import { ApprovalModal } from '@/components/ApprovalModal';
import { MemberCardModal } from '@/components/MemberCardModal';
import { formatPhoneNumber, matchesPhoneNumber, DEFAULT_AVATAR } from '@/lib/storage';

interface AdminDashboardPageProps {
  stats: DashboardStats;
  pendingMembers: MemberRecord[];
  approvedMembers: MemberRecord[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onConfirmApprove: (pendingId: string, memberType: MemberType) => void;
  onRejectMember: (pendingId: string, email?: string, fullName?: string) => void;
  onGoToIdCard: (regNo: string) => void;
  onRefreshData?: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  stats,
  pendingMembers,
  approvedMembers,
  settings,
  onUpdateSettings,
  onConfirmApprove,
  onRejectMember,
  onGoToIdCard,
  onRefreshData
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'approved' | 'settings'>('pending');
  const [selectedPendingMember, setSelectedPendingMember] = useState<MemberRecord | null>(null);
  const [viewingMember, setViewingMember] = useState<MemberRecord | null>(null);
  const [adminSearchInput, setAdminSearchInput] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [newMemberType, setNewMemberType] = useState('');
  const [copiedGasCode, setCopiedGasCode] = useState(false);

  // Settings State
  const [gasUrlInput, setGasUrlInput] = useState(settings.gasWebAppUrl);
  const [useLiveGasInput, setUseLiveGasInput] = useState(settings.useLiveGas);
  const [authoritySignatureInput, setAuthoritySignatureInput] = useState<string>(settings.authoritySignatureUrl || '');
  const [authorityTitleInput, setAuthorityTitleInput] = useState<string>(settings.authorityTitle || 'Authorized Signature');
  const [signatureSaveSuccess, setSignatureSaveSuccess] = useState<boolean>(false);

  // Sync tab with URL search parameter reactively
  const searchParams = useSearchParams();
  const urlTab = searchParams ? searchParams.get('tab') : null;

  useEffect(() => {
    if (urlTab === 'approved' || urlTab === 'settings' || urlTab === 'pending') {
      setActiveSubTab(urlTab);
    }
  }, [urlTab]);

  const handleSubTabChange = (tab: 'pending' | 'approved' | 'settings') => {
    setActiveSubTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.pathname + url.search);
    }
  };

  const handleExecuteSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setHasSearched(true);
    setActiveSearchQuery(adminSearchInput.trim());
    if (onRefreshData) {
      onRefreshData();
    }
  };

  const handleLoadAllRecords = () => {
    setAdminSearchInput('');
    setActiveSearchQuery('');
    setHasSearched(false);
    if (onRefreshData) {
      onRefreshData();
    }
  };

  const handleResetSearch = () => {
    setAdminSearchInput('');
    setActiveSearchQuery('');
    setHasSearched(false);
  };

  const searchQ = activeSearchQuery.toLowerCase().trim();
  const isMemberMatch = (m: MemberRecord) => {
    if (!searchQ || searchQ === '*') return true;
    return (
      String(m.registrationNumber || '').toLowerCase().includes(searchQ) ||
      String(m.id || '').toLowerCase().includes(searchQ) ||
      matchesPhoneNumber(m.phone, activeSearchQuery) ||
      String(m.memberType || '').toLowerCase().includes(searchQ) ||
      String(m.email || '').toLowerCase().includes(searchQ) ||
      String(m.fullName || '').toLowerCase().includes(searchQ) ||
      String(m.bloodGroup || '').toLowerCase() === searchQ
    );
  };

  // Always load database records by default; filter if active search query exists
  const searchedApproved = searchQ && searchQ !== '*' ? approvedMembers.filter(isMemberMatch) : approvedMembers;
  const searchedPending = searchQ && searchQ !== '*' ? pendingMembers.filter(isMemberMatch) : pendingMembers;

  const handleSaveSettings = () => {
    onUpdateSettings({
      ...settings,
      gasWebAppUrl: gasUrlInput.trim(),
      useLiveGas: useLiveGasInput
    });
    alert('Settings updated successfully!');
  };

  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Signature image file size must be less than 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setAuthoritySignatureInput(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignature = () => {
    setAuthoritySignatureInput('');
  };

  const handleSaveAuthoritySettings = () => {
    const updated: AppSettings = {
      ...settings,
      authoritySignatureUrl: authoritySignatureInput,
      authorityTitle: authorityTitleInput.trim() || 'Authorized Signature'
    };
    onUpdateSettings(updated);
    setSignatureSaveSuccess(true);
    setTimeout(() => setSignatureSaveSuccess(false), 3000);
  };

  const handleAddMemberType = () => {
    const trimmed = newMemberType.trim();
    if (!trimmed) return;
    if (settings.memberTypes.includes(trimmed)) {
      alert('This Member Type already exists.');
      return;
    }
    const updated = [...settings.memberTypes, trimmed];
    onUpdateSettings({ ...settings, memberTypes: updated });
    setNewMemberType('');
  };

  const handleRemoveMemberType = (typeToRemove: string) => {
    if (settings.memberTypes.length <= 1) {
      alert('You must maintain at least one Member Type.');
      return;
    }
    const updated = settings.memberTypes.filter((t) => t !== typeToRemove);
    onUpdateSettings({ ...settings, memberTypes: updated });
  };

  const gasCodeSnippet = `/**
 * ====================================================================================
 * JANATHA GARAGE - MEMBER MANAGEMENT SYSTEM
 * Google Apps Script Backend (Code.gs)
 * ====================================================================================
 * 
 * 📋 STEP-BY-STEP INSTRUCTIONS TO CONNECT GOOGLE SHEETS & DRIVE WITH THIS WEB APP:
 * 
 * 1. CREATE A NEW GOOGLE SHEET:
 *    - Go to Google Sheets (https://sheets.google.com) and create a Blank Spreadsheet.
 *    - Name your spreadsheet: "Janatha Garage - Member Registry".
 * 
 * 2. OPEN GOOGLE APPS SCRIPT:
 *    - In your Google Sheet, click "Extensions" in the top menu bar -> select "Apps Script".
 *    - Delete any existing code in the editor (Code.gs).
 *    - Paste THIS ENTIRE FILE content into Code.gs.
 *    - Click the Save icon (💾 or Ctrl+S / Cmd+S).
 * 
 * 3. RUN INITIAL SETUP (AUTO-CREATE SHEETS & HEADERS):
 *    - Select function "setupSheets" from the top dropdown -> Click "Run".
 *    - Click "Review Permissions" -> Choose Account -> Advanced -> "Go to Code.gs (unsafe)" -> "Allow".
 * 
 * 4. DEPLOY AS WEB APP:
 *    - Click "Deploy" (top right) -> "New deployment".
 *    - Click Gear icon -> Select "Web app".
 *    - Set "Execute as": "Me" & "Who has access": "Anyone" -> Click "Deploy".
 *    - Copy the generated Web App URL and paste it below into "Google Apps Script Web App URL".
 * ====================================================================================
 */

const S_PENDING = "Pending Members";
const S_APPROVED = "Approved Members";
const S_MEMBER_TYPES = "Member Types";
const S_ADMIN = "Admin";
const S_LOGS = "Audit Logs";

function doGet(e) {
  let action = e && e.parameter ? e.parameter.action || "" : "";
  let response = { success: false, message: "Invalid action" };
  try {
    setupSheets();
    if (action === "getStats") response = { success: true, data: getDashboardStats() };
    else if (action === "getApprovedMembers") response = { success: true, data: getApprovedMembers() };
    else if (action === "getPendingMembers") response = { success: true, data: getPendingMembers() };
    else if (action === "searchMember") response = { success: true, data: searchMember(e ? e.parameter.query : "") };
    else if (action === "getMemberTypes") response = { success: true, data: getMemberTypes() };
    else if (action === "verifyMember") response = { success: true, data: verifyMember(e ? e.parameter.regNo : "") };
    else response = { success: true, message: "Janatha Garage API Active" };
  } catch (err) { response = { success: false, message: err.toString() }; }
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let response = { success: false, message: "Invalid payload" };
  try {
    setupSheets();
    let data = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    const action = data.action;
    if (action === "registerMember") response = registerMember(data.payload);
    else if (action === "adminLogin") response = adminLogin(data.payload);
    else if (action === "approveMember") response = approveMember(data.payload);
    else if (action === "rejectMember") response = rejectMember(data.payload);
    else if (action === "getPendingMembers") response = { success: true, data: getPendingMembers() };
    else if (action === "getApprovedMembers") response = { success: true, data: getApprovedMembers() };
    else if (action === "getStats") response = { success: true, data: getDashboardStats() };
    else if (action === "getMemberTypes") response = { success: true, data: getMemberTypes() };
    else if (action === "verifyMember") response = { success: true, data: verifyMember(data.regNo || (data.payload ? data.payload.regNo : "")) };
  } catch (err) { response = { success: false, message: err.toString() }; }
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(S_PENDING)) {
    const s = ss.insertSheet(S_PENDING);
    s.appendRow(["ID", "Submission Date", "Full Name", "Father Name", "Mother Name", "Gender", "DOB", "Blood Group", "Phone", "Email", "Present Address", "Permanent Address", "Occupation", "Company Name", "Photo URL", "Photo File ID", "Status"]);
  }
  if (!ss.getSheetByName(S_APPROVED)) {
    const s = ss.insertSheet(S_APPROVED);
    s.appendRow(["ID", "Registration Number", "Member Type", "Approval Date", "Full Name", "Father Name", "Mother Name", "Gender", "DOB", "Blood Group", "Phone", "Email", "Present Address", "Permanent Address", "Occupation", "Company Name", "Photo URL", "Photo File ID", "Status"]);
  }
  if (!ss.getSheetByName(S_MEMBER_TYPES)) {
    const s = ss.insertSheet(S_MEMBER_TYPES);
    s.appendRow(["Member Type Name"]);
    s.getRange(2, 1, 8, 1).setValues([["Executive Member"],["Assistant Member"],["Secretary"],["Joint Secretary"],["Treasurer"],["Vice President"],["President"],["Member"]]);
  }
  if (!ss.getSheetByName(S_ADMIN)) {
    const s = ss.insertSheet(S_ADMIN);
    s.appendRow(["User ID", "Password", "Role"]);
    s.appendRow(["admin", "admin123", "Super Admin"]);
  }
}

function normPhone(p) {
  var d = (p || "").toString().replace(/\D/g, "");
  if (d.indexOf("8801") === 0 && d.length === 13) d = d.substring(2);
  else if (d.indexOf("1") === 0 && d.length === 10) d = "0" + d;
  return d;
}

function registerMember(data) {
  setupSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rawPhone = (data.phone || "").trim();
  const cleanPhone = normPhone(rawPhone);
  const email = (data.email || "").toLowerCase().trim();
  const pendingSheet = ss.getSheetByName(S_PENDING);
  const pendingValues = pendingSheet.getDataRange().getValues();
  for (let i = 1; i < pendingValues.length; i++) {
    const rowP = normPhone(pendingValues[i][8]);
    if (cleanPhone && rowP === cleanPhone) return { success: false, message: "This phone number is already registered and waiting for admin approval." };
    if (email && (pendingValues[i][9]||"").toString().toLowerCase().trim() === email) return { success: false, message: "Email address already in pending requests." };
  }
  const approvedSheet = ss.getSheetByName(S_APPROVED);
  const approvedValues = approvedSheet.getDataRange().getValues();
  for (let i = 1; i < approvedValues.length; i++) {
    const rowP = normPhone(approvedValues[i][10]);
    if (cleanPhone && rowP === cleanPhone) return { success: false, message: "This phone number is already registered as an approved member." };
    if (email && (approvedValues[i][11]||"").toString().toLowerCase().trim() === email) return { success: false, message: "Email address already registered in approved members." };
  }
  const rawImage = (data.photoBase64 || data.photoUrl || "").toString();
  let photoUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400";
  let photoFileId = "";
  if (rawImage && (rawImage.startsWith("data:image") || rawImage.includes("base64"))) {
    try {
      const folderName = "Janatha Garage Member Photos";
      const folders = DriveApp.getFoldersByName(folderName);
      let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
      const split = rawImage.split(",");
      const matchType = split[0].match(/:(.*?);/);
      const contentType = matchType ? matchType[1] : "image/jpeg";
      const bytes = Utilities.base64Decode(split[1]);
      const file = folder.createFile(Utilities.newBlob(bytes, contentType, "photo_" + phone + "_" + Date.now() + ".jpg"));
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      photoFileId = file.getId();
      photoUrl = "https://lh3.googleusercontent.com/d/" + photoFileId;
    } catch (e) {
      if (!rawImage.startsWith("data:image")) photoUrl = rawImage;
    }
  } else if (rawImage && (rawImage.startsWith("http://") || rawImage.startsWith("https://"))) {
    photoUrl = rawImage;
  }
  const id = "PEND_" + Date.now();
  pendingSheet.appendRow([id, new Date().toISOString(), data.fullName.trim(), (data.fatherName||"").trim(), (data.motherName||"").trim(), data.gender||"Male", data.dob||"", data.bloodGroup||"O+", phone, email, (data.presentAddress||"").trim(), (data.permanentAddress||"").trim(), (data.occupation||"").trim(), (data.companyName||"").trim(), photoUrl, photoFileId, "Pending"]);
  return { success: true, message: "Registration Submitted to Google Sheets!", id: id };
}

function approveMember(payload) {
  setupSheets();
  const { pendingId, memberType } = payload;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pendingSheet = ss.getSheetByName(S_PENDING);
  const approvedSheet = ss.getSheetByName(S_APPROVED);
  const pendingData = pendingSheet.getDataRange().getValues();
  let foundRow = -1, memberData = null;
  for (let i = 1; i < pendingData.length; i++) {
    if (pendingData[i][0] === pendingId) { foundRow = i + 1; memberData = pendingData[i]; break; }
  }
  if (foundRow === -1) return { success: false, message: "Pending application not found." };
  const approvedData = approvedSheet.getDataRange().getValues();
  let maxSeq = 0;
  const year = new Date().getFullYear().toString().substring(2);
  for (let i = 1; i < approvedData.length; i++) {
    const reg = (approvedData[i][1]||"").toString();
    if (reg.startsWith("JG" + year)) {
      const seq = parseInt(reg.replace("JG" + year, ""), 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  }
  const regNumber = "JG" + year + (maxSeq + 1).toString().padStart(4, "0");
  approvedSheet.appendRow([memberData[0], regNumber, memberType, new Date().toISOString(), memberData[2], memberData[3], memberData[4], memberData[5], memberData[6], memberData[7], memberData[8], memberData[9], memberData[10], memberData[11], memberData[12], memberData[13], memberData[14], memberData[15], "Active"]);
  
  if (memberData[9] && memberData[9].indexOf("@") !== -1) {
    var approvedEmail = memberData[9].toString().trim();
    var approvedName = memberData[2].toString().trim();
    var idCardUrl = "https://janatha-garage-member-portal.vercel.app/idcard?regNo=" + encodeURIComponent(regNumber);
    var approvedSubject = "🎉 Janatha Garage Membership Approved - Reg No: " + regNumber;
    var approvedBody = "<div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;'><div style='background-color: #0f172a; color: #ffffff; padding: 20px; text-align: center; border-radius: 8px;'><h1 style='margin: 0;'>JANATHA GARAGE</h1><p style='margin: 4px 0 0 0; font-size: 12px; color: #10b981; font-weight: bold;'>Official Membership Approval Notice</p></div><div style='padding: 20px;'><h2 style='color: #16a34a; margin-top: 10px;'>Registration Approved!</h2><p style='color: #334155; font-size: 15px;'>Dear <strong>" + approvedName + "</strong>,</p><p style='color: #334155; font-size: 15px; line-height: 1.6;'>Congratulations! Your membership request for <strong>Janatha Garage</strong> has been approved.</p><div style='background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 6px;'><p style='color: #047857; font-size: 12px; font-weight: bold; margin: 0;'>OFFICIAL REGISTRATION NUMBER</p><p style='color: #166534; font-size: 26px; font-weight: bold; margin: 4px 0 0 0;'>" + regNumber + "</p><p style='color: #047857; font-size: 13px; margin: 4px 0 0 0;'>Role Assigned: <strong>" + memberType + "</strong></p></div><p style='color: #334155; font-size: 15px; line-height: 1.6;'>Your Digital Membership PVC Card is now ready. Click the button below to view, verify, or download your official digital card:</p><div style='text-align: center; margin: 24px 0;'><a href='" + idCardUrl + "' target='_blank' style='display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;'>🪪 View & Download Digital ID Card</a></div><p style='color: #64748b; font-size: 12px; text-align: center;'>Direct link: <a href='" + idCardUrl + "' style='color: #059669;'>" + idCardUrl + "</a></p><hr style='border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;' /><p style='color: #64748b; font-size: 13px; margin-bottom: 0;'>Warm regards,<br /><strong>Janatha Garage Administration Team</strong></p></div></div>";

    try {
      GmailApp.sendEmail(approvedEmail, approvedSubject, "", { htmlBody: approvedBody });
    } catch (e1) {
      try {
        MailApp.sendEmail({ to: approvedEmail, subject: approvedSubject, htmlBody: approvedBody });
      } catch (e2) {}
    }
  }

  // Delete from pending sheet AFTER email is dispatched
  pendingSheet.deleteRow(foundRow);

  return { success: true, message: "Member approved! Reg No: " + regNumber, registrationNumber: regNumber };
}

function rejectMember(payload) {
  setupSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pendingSheet = ss.getSheetByName(S_PENDING);
  const data = pendingSheet.getDataRange().getValues();

  var targetId = "";
  var targetEmail = "";
  var targetName = "Applicant";
  var reason = "";

  if (typeof payload === "string") {
    targetId = payload.trim();
  } else if (payload && typeof payload === "object") {
    if (payload.pendingId) targetId = payload.pendingId.toString().trim();
    if (payload.id) targetId = payload.id.toString().trim();
    if (payload.email) targetEmail = payload.email.toString().trim();
    if (payload.fullName) targetName = payload.fullName.toString().trim();
    if (payload.reason) reason = payload.reason.toString().trim();
  }

  if (!targetId && !targetEmail) {
    return { success: false, message: "Missing pending applicant ID or email." };
  }

  var targetRowIndex = -1;
  var emailToSend = targetEmail;
  var nameToSend = targetName;

  for (let i = 1; i < data.length; i++) {
    var cellId = (data[i][0] || "").toString().trim();
    var cellName = (data[i][2] || "").toString().trim();
    var cellEmail = (data[i][9] || "").toString().trim();

    var matchId = targetId && cellId === targetId;
    var matchEmail = targetEmail && cellEmail.toLowerCase() === targetEmail.toLowerCase();

    if (matchId || matchEmail) {
      if (cellName) nameToSend = cellName;
      if (cellEmail) emailToSend = cellEmail;
      targetRowIndex = i + 1;
      break;
    }
  }

  if (targetRowIndex === -1 && !emailToSend) {
    return { success: false, message: "Pending application not found." };
  }

  var emailSent = false;
  if (emailToSend && emailToSend.indexOf("@") !== -1) {
    var subject = "Janatha Garage Membership Application Status Update";
    var htmlBody = "<div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;'><div style='background-color: #0f172a; color: #ffffff; padding: 20px; text-align: center; border-radius: 8px;'><h1 style='margin: 0;'>JANATHA GARAGE</h1><p style='margin: 4px 0 0 0; font-size: 12px; color: #f87171; font-weight: bold;'>Membership Status Update</p></div><div style='padding: 20px;'><h2 style='color: #dc2626; margin-top: 10px;'>Dear " + nameToSend + ",</h2><p style='color: #334155; font-size: 15px; line-height: 1.6;'>Thank you for your interest in joining <strong>Janatha Garage</strong>. After reviewing your application, we regret to inform you that your membership request could not be approved at this time.</p>" + (reason ? "<div style='background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0; border-radius: 4px;'><p style='color: #991b1b; font-size: 13px; margin: 0;'><strong>Note:</strong> " + reason + "</p></div>" : "") + "<p style='color: #334155; font-size: 15px; line-height: 1.6;'>If you believe this was in error or if you wish to apply again with updated details, please feel free to submit a new application on our website.</p><hr style='border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;' /><p style='color: #64748b; font-size: 13px; margin-bottom: 0;'>Warm regards,<br /><strong>Janatha Garage Administration Team</strong></p></div></div>";

    try {
      GmailApp.sendEmail(emailToSend, subject, "", { htmlBody: htmlBody });
      emailSent = true;
    } catch (e1) {
      try {
        MailApp.sendEmail({ to: emailToSend, subject: subject, htmlBody: htmlBody });
        emailSent = true;
      } catch (e2) {}
    }
  }

  // Delete row AFTER dispatching rejection email
  if (targetRowIndex !== -1) {
    pendingSheet.deleteRow(targetRowIndex);
  }

  return {
    success: true,
    message: emailSent
      ? "Application rejected and rejection email sent to " + emailToSend + "."
      : "Application rejected successfully."
  };
}

function getApprovedMembers() {
  setupSheets();
  const data = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(S_APPROVED).getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) list.push({ id: (data[i][0]||"").toString(), registrationNumber: (data[i][1]||"").toString(), memberType: (data[i][2]||"").toString(), approvalDate: (data[i][3]||"").toString(), fullName: (data[i][4]||"").toString(), fatherName: (data[i][5]||"").toString(), motherName: (data[i][6]||"").toString(), gender: (data[i][7]||"").toString(), dob: (data[i][8]||"").toString(), bloodGroup: (data[i][9]||"").toString(), phone: (data[i][10]||"").toString(), email: (data[i][11]||"").toString(), presentAddress: (data[i][12]||"").toString(), permanentAddress: (data[i][13]||"").toString(), occupation: (data[i][14]||"").toString(), companyName: (data[i][15]||"").toString(), photoUrl: (data[i][16]||"").toString(), status: (data[i][18]||"Approved").toString() });
  }
  return list;
}

function getPendingMembers() {
  setupSheets();
  const data = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(S_PENDING).getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) list.push({ id: (data[i][0]||"").toString(), submissionDate: (data[i][1]||"").toString(), fullName: (data[i][2]||"").toString(), fatherName: (data[i][3]||"").toString(), motherName: (data[i][4]||"").toString(), gender: (data[i][5]||"").toString(), dob: (data[i][6]||"").toString(), bloodGroup: (data[i][7]||"").toString(), phone: (data[i][8]||"").toString(), email: (data[i][9]||"").toString(), presentAddress: (data[i][10]||"").toString(), permanentAddress: (data[i][11]||"").toString(), occupation: (data[i][12]||"").toString(), companyName: (data[i][13]||"").toString(), photoUrl: (data[i][14]||"").toString(), status: "Pending" });
  }
  return list;
}

function verifyMember(regNo) {
  if (!regNo) return null;
  const q = regNo.toString().toUpperCase().trim();
  const data = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(S_APPROVED).getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if ((data[i][1]||"").toString().toUpperCase().trim() === q || (data[i][10]||"").toString().trim() === q) {
      return { id: (data[i][0]||"").toString(), registrationNumber: (data[i][1]||"").toString(), memberType: (data[i][2]||"").toString(), approvalDate: (data[i][3]||"").toString(), fullName: (data[i][4]||"").toString(), fatherName: (data[i][5]||"").toString(), motherName: (data[i][6]||"").toString(), gender: (data[i][7]||"").toString(), dob: (data[i][8]||"").toString(), bloodGroup: (data[i][9]||"").toString(), phone: (data[i][10]||"").toString(), email: (data[i][11]||"").toString(), presentAddress: (data[i][12]||"").toString(), permanentAddress: (data[i][13]||"").toString(), occupation: (data[i][14]||"").toString(), companyName: (data[i][15]||"").toString(), photoUrl: (data[i][16]||"").toString(), status: (data[i][18]||"Active").toString() };
    }
  }
  return null;
}

function searchMember(query) {
  if (!query) return [];
  const q = query.toString().toLowerCase().trim();
  return getApprovedMembers().filter(m => (m.fullName && m.fullName.toString().toLowerCase().includes(q)) || (m.registrationNumber && m.registrationNumber.toString().toLowerCase().includes(q)) || (m.phone && m.phone.toString().toLowerCase().includes(q)));
}

function getDashboardStats() {
  const approved = getApprovedMembers(), pending = getPendingMembers();
  const blood = { "A+": 0, "A-": 0, "B+": 0, "B-": 0, "O+": 0, "O-": 0, "AB+": 0, "AB-": 0 };
  approved.forEach(m => { if (m.bloodGroup && blood[m.bloodGroup] !== undefined) blood[m.bloodGroup]++; });
  return { totalMembers: approved.length, pendingCount: pending.length, approvedCount: approved.length, bloodGroupCounts: blood, recentApproved: approved.slice(-5).reverse() };
}

function getMemberTypes() {
  const data = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(S_MEMBER_TYPES).getDataRange().getValues();
  const types = [];
  for (let i = 1; i < data.length; i++) if (data[i][0]) types.push(data[i][0].toString().trim());
  return types.length > 0 ? types : ["Executive Member","Assistant Member","Secretary","Joint Secretary","Treasurer","Vice President","President","Member"];
}

function adminLogin(payload) {
  const data = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(S_ADMIN).getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === payload.userId && data[i][1].toString() === payload.password) return { success: true, token: "ADMIN_" + Date.now() };
  }
  return { success: false, message: "Invalid Admin User ID or Password." };
}
`;

  const copyGasCode = () => {
    navigator.clipboard.writeText(gasCodeSnippet);
    setCopiedGasCode(true);
    setTimeout(() => setCopiedGasCode(false), 2500);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold mb-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" /> Executive Admin Portal
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Control Center</h1>
          <p className="text-slate-600 font-medium text-sm">
            Review pending applications, assign member ranks, manage approved rosters, and configure Apps Script sync.
          </p>
        </div>

        {onRefreshData && (
          <button
            onClick={onRefreshData}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" /> Sync with Google Sheet
          </button>
        )}
      </div>

      {/* Admin Member Database Search Bar */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-400" /> Filter Member Database
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Database records are loaded automatically. Use the filter input below to quickly narrow down member records.
            </p>
          </div>
          {activeSearchQuery && (
            <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-3.5 py-1.5 rounded-full border border-emerald-800/80">
              Filtered Query: "{activeSearchQuery}"
            </span>
          )}
        </div>

        <form onSubmit={handleExecuteSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              value={adminSearchInput}
              onChange={(e) => {
                setAdminSearchInput(e.target.value);
                setActiveSearchQuery(e.target.value.trim());
              }}
              placeholder="Search by Reg Number (e.g. JG260001), Name, Phone, Email, Role..."
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Search className="w-4 h-4" /> Filter
          </button>

          {activeSearchQuery && (
            <button
              type="button"
              onClick={handleResetSearch}
              className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </form>
      </div>

      {/* Top Stat Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <button
          type="button"
          onClick={() => handleSubTabChange('pending')}
          className={`p-6 rounded-2xl border transition-all text-left flex items-center gap-4 ${
            activeSubTab === 'pending'
              ? 'bg-amber-50/60 border-amber-400 shadow-sm ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200 hover:border-amber-300 shadow-xs'
          }`}
        >
          <div className="p-3.5 bg-amber-100 text-amber-800 rounded-2xl">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Pending Requests</p>
            <h3 className="text-3xl font-black text-slate-900">
              {searchedPending.length}
            </h3>
            <p className="text-[11px] font-bold text-amber-700">
              {settings.gasWebAppUrl ? 'Database Connected' : 'Local Storage'}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSubTabChange('approved')}
          className={`p-6 rounded-2xl border transition-all text-left flex items-center gap-4 ${
            activeSubTab === 'approved'
              ? 'bg-emerald-50/60 border-emerald-400 shadow-sm ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200 hover:border-emerald-300 shadow-xs'
          }`}
        >
          <div className="p-3.5 bg-emerald-100 text-emerald-800 rounded-2xl">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Approved Members</p>
            <h3 className="text-3xl font-black text-slate-900">
              {searchedApproved.length}
            </h3>
            <p className="text-[11px] font-bold text-emerald-700">
              {settings.gasWebAppUrl ? 'Database Connected' : 'Local Storage'}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSubTabChange('approved')}
          className={`p-6 rounded-2xl border transition-all text-left flex items-center gap-4 ${
            activeSubTab === 'approved'
              ? 'bg-blue-50/60 border-blue-400 shadow-sm'
              : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs'
          }`}
        >
          <div className="p-3.5 bg-blue-100 text-blue-800 rounded-2xl">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Total Records</p>
            <h3 className="text-3xl font-black text-slate-900">
              {searchedApproved.length + searchedPending.length}
            </h3>
            <p className="text-[11px] font-bold text-blue-700">Total Loaded Records</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSubTabChange('settings')}
          className={`p-6 rounded-2xl border transition-all text-left flex items-center gap-4 ${
            activeSubTab === 'settings'
              ? 'bg-purple-50/60 border-purple-400 shadow-sm ring-2 ring-purple-400/20'
              : 'bg-white border-slate-200 hover:border-purple-300 shadow-xs'
          }`}
        >
          <div className="p-3.5 bg-purple-100 text-purple-800 rounded-2xl">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Member Types</p>
            <h3 className="text-3xl font-black text-slate-900">{settings.memberTypes.length}</h3>
          </div>
        </button>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => handleSubTabChange('pending')}
          className={`px-6 py-3 font-bold text-sm rounded-t-2xl border-t border-x transition-all flex items-center gap-2 ${
            activeSubTab === 'pending'
              ? 'bg-white text-slate-900 border-slate-200 shadow-xs border-b-white translate-y-px'
              : 'bg-slate-100 text-slate-600 border-transparent hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          Pending Applications ({searchedPending.length})
        </button>

        <button
          type="button"
          onClick={() => handleSubTabChange('approved')}
          className={`px-6 py-3 font-bold text-sm rounded-t-2xl border-t border-x transition-all flex items-center gap-2 ${
            activeSubTab === 'approved'
              ? 'bg-white text-slate-900 border-slate-200 shadow-xs border-b-white translate-y-px'
              : 'bg-slate-100 text-slate-600 border-transparent hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Approved Members ({searchedApproved.length})
        </button>

        <button
          type="button"
          onClick={() => handleSubTabChange('settings')}
          className={`px-6 py-3 font-bold text-sm rounded-t-2xl border-t border-x transition-all flex items-center gap-2 ${
            activeSubTab === 'settings'
              ? 'bg-white text-slate-900 border-slate-200 shadow-xs border-b-white translate-y-px'
              : 'bg-slate-100 text-slate-600 border-transparent hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4 text-blue-600" />
          Settings &amp; Signature
        </button>
      </div>

      {/* SUB-TAB 1: PENDING APPLICATIONS */}
      {activeSubTab === 'pending' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Pending Membership Applications</h2>
            <p className="text-xs font-semibold text-slate-500">
              Select Member Type on approval to issue sequential registration numbers.
            </p>
          </div>

          {searchedPending.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-bold text-lg text-slate-800">
                {activeSearchQuery ? 'No Matching Pending Applications' : 'No Pending Applications'}
              </h3>
              <p className="text-xs">
                {activeSearchQuery
                  ? `No pending applications match filter "${activeSearchQuery}".`
                  : 'There are currently no pending membership applications awaiting review.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchedPending.map((member) => (
                <div
                  key={member.id}
                  className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={member.photoUrl || DEFAULT_AVATAR}
                      alt={member.fullName}
                      className="w-16 h-16 min-w-[4rem] min-h-[4rem] max-w-[4rem] max-h-[4rem] rounded-xl object-cover object-top border-2 border-white shadow-sm flex-shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                      }}
                    />
                    <div className="overflow-hidden flex-1">
                      <h3 className="font-extrabold text-base text-slate-900 truncate">
                        {member.fullName}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600">{formatPhoneNumber(member.phone)}</p>
                      <p className="text-xs text-slate-500 truncate">{member.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-black bg-rose-100 text-rose-800 rounded-md">
                        Blood: {member.bloodGroup}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setViewingMember(member)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRejectMember(member.id, member.email, member.fullName)}
                        className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>

                      <button
                        onClick={() => setSelectedPendingMember(member)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: APPROVED MEMBERS ROSTER */}
      {activeSubTab === 'approved' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Approved Roster Registry</h2>
            <span className="text-xs font-bold text-slate-500">
              {searchedApproved.length} Approved Members
            </span>
          </div>

          {searchedApproved.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Users className="w-12 h-12 text-slate-400 mx-auto" />
              <div>
                <h3 className="font-extrabold text-lg text-slate-800">
                  {activeSearchQuery ? 'No Approved Members Found' : 'No Approved Members'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {activeSearchQuery
                    ? `No approved members match filter "${activeSearchQuery}".`
                    : 'There are currently no approved members in the registry.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-wider">
                    <th className="py-3 px-4">Member Photo & Name</th>
                    <th className="py-3 px-4">Registration No.</th>
                    <th className="py-3 px-4">Member Type</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm font-medium">
                  {searchedApproved.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.photoUrl || DEFAULT_AVATAR}
                            alt={member.fullName}
                            className="w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] max-w-[2.5rem] max-h-[2.5rem] rounded-xl object-cover object-top border border-slate-200 flex-shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                            }}
                          />
                          <div>
                            <p className="font-bold text-slate-900">{member.fullName}</p>
                            <p className="text-xs text-slate-500">{member.occupation}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 text-xs font-black bg-blue-50 text-blue-800 border border-blue-200 rounded-md">
                          {member.registrationNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-800">{member.memberType}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 text-xs font-black bg-rose-100 text-rose-800 rounded-md">
                          {member.bloodGroup}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">{formatPhoneNumber(member.phone)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingMember(member)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            title="View Member Record"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onGoToIdCard(member.registrationNumber!)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> ID Card
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: SETTINGS & GOOGLE APPS SCRIPT CONFIG */}
      {activeSubTab === 'settings' && (
        <div className="space-y-8">
          {/* Member Types Manager */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" /> Dynamic Member Types Manager
            </h3>
            <p className="text-xs text-slate-600">
              Manage executive roles loaded during member approval (e.g. Executive Member, Secretary, Treasurer, President).
            </p>

            <div className="flex gap-3 max-w-md">
              <input
                type="text"
                value={newMemberType}
                onChange={(e) => setNewMemberType(e.target.value)}
                placeholder="Enter new role (e.g. Joint Secretary)..."
                className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
              />
              <button
                onClick={handleAddMemberType}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {settings.memberTypes.map((type) => (
                <div
                  key={type}
                  className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2"
                >
                  <span>{type}</span>
                  <button
                    onClick={() => handleRemoveMemberType(type)}
                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Authority Signature & ID Card Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" /> Authorized Signature for ID Cards
              </h3>
              {signatureSaveSuccess && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Signature Saved!
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600">
              Upload the official authority signature (PNG or JPG) and configure the title. This signature will be automatically printed on all member ID cards.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Signature Upload & Preview */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Signature Image
                </label>

                {authoritySignatureInput ? (
                  <div className="flex flex-col items-center p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3">
                    <div className="h-24 w-full max-w-[260px] bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center shadow-inner">
                      <img
                        src={authoritySignatureInput}
                        alt="Authorized Signature Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl cursor-pointer transition-colors">
                        Change Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureFileChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveSignature}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl bg-slate-50/60 hover:bg-indigo-50/30 cursor-pointer transition-all">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">Upload Signature Image</span>
                    <span className="text-xs text-slate-500 mt-0.5">PNG or JPG (transparent PNG recommended)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Title Input & Save */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Signatory Title / Designation
                  </label>
                  <input
                    type="text"
                    value={authorityTitleInput}
                    onChange={(e) => setAuthorityTitleInput(e.target.value)}
                    placeholder="e.g. Authorized Signature, President, Secretary"
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white transition-colors"
                  />
                  <p className="text-[11px] text-slate-500">
                    This text is displayed right underneath the signature line on the ID card.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAuthoritySettings}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Save Authority Signature
                </button>
              </div>
            </div>
          </div>

          {/* Google Apps Script Integration */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-600" /> Google Apps Script Sync Config
              </h3>
              <button
                onClick={copyGasCode}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
              >
                {copiedGasCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedGasCode ? 'Code Copied!' : 'Copy Code.gs'}
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Google Apps Script Web App URL
                </label>
                <input
                  type="text"
                  value={gasUrlInput}
                  onChange={(e) => setGasUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="useLiveGas"
                  checked={useLiveGasInput}
                  onChange={(e) => setUseLiveGasInput(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="useLiveGas" className="text-sm font-bold text-slate-800">
                  Enable Live Google Apps Script Sync
                </label>
              </div>

              <button
                onClick={handleSaveSettings}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition-all"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {selectedPendingMember && (
        <ApprovalModal
          member={selectedPendingMember}
          memberTypes={settings.memberTypes}
          onClose={() => setSelectedPendingMember(null)}
          onConfirmApprove={(pendingId, memberType) => {
            onConfirmApprove(pendingId, memberType);
            setSelectedPendingMember(null);
          }}
        />
      )}

      {viewingMember && (
        <MemberCardModal
          member={viewingMember}
          onClose={() => setViewingMember(null)}
          onApproveClick={(m) => setSelectedPendingMember(m)}
          onRejectClick={(memberId) => onRejectMember(memberId, viewingMember.email, viewingMember.fullName)}
        />
      )}
    </div>
  );
};
