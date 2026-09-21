import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Phone,
  Briefcase,
  Mail,
  Calendar,
  Building,
  Droplet
} from 'lucide-react';
import { MemberRecord } from '@/types';
import { formatPhoneNumber, matchesPhoneNumber, DEFAULT_AVATAR } from '@/lib/storage';

interface VerificationPageProps {
  approvedMembers: MemberRecord[];
  initialRegNo?: string;
  onNavigate?: (tab: string) => void;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({
  approvedMembers,
  initialRegNo = '',
  onNavigate
}) => {
  const router = useRouter();
  const [searchRegNo, setSearchRegNo] = useState<string>(initialRegNo || '');
  const [verifiedMember, setVerifiedMember] = useState<MemberRecord | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const navTo = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    } else {
      const path = tab === 'dashboard' || tab === 'home' ? '/' : `/${tab}`;
      router.push(path);
    }
  };

  const handleVerify = (query: string) => {
    setHasSearched(true);
    const cleanQuery = query.trim().toUpperCase();

    if (!cleanQuery) {
      setVerifiedMember(null);
      return;
    }

    const match = approvedMembers.find(
      (m) =>
        String(m.registrationNumber || '').toUpperCase() === cleanQuery ||
        String(m.id || '').toUpperCase() === cleanQuery ||
        matchesPhoneNumber(m.phone, query)
    );

    setVerifiedMember(match || null);
  };

  useEffect(() => {
    // Check if query parameter exists in URL query string or hash
    const search = window.location.search;
    const hash = window.location.hash;
    const matchParam =
      search.match(/regNo=([^&]+)/) ||
      search.match(/id=([^&]+)/) ||
      hash.match(/regNo=([^&]+)/) ||
      hash.match(/id=([^&]+)/);
    const idFromUrl = matchParam ? decodeURIComponent(matchParam[1]) : initialRegNo;

    if (idFromUrl) {
      setSearchRegNo(idFromUrl);
      handleVerify(idFromUrl);
    }
  }, [initialRegNo, approvedMembers]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl border border-slate-800 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-black uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" /> Official QR Verification Portal
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Janatha Garage Member Verification</h1>
        <p className="text-slate-300 text-sm font-medium max-w-lg mx-auto">
          Scan QR code or enter Registration Number to confirm official active membership credentials.
        </p>

      </div>

      {/* Lookup Bar */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify(searchRegNo);
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchRegNo}
              onChange={(e) => setSearchRegNo(e.target.value)}
              placeholder="Enter Registration Number (e.g. JG-2025-001)..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-extrabold focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" /> Verify Now
          </button>
        </form>
      </div>

      {/* Verification Result Section */}
      {hasSearched ? (
        <>
          {verifiedMember ? (
            /* ================= VERIFIED MEMBER CARD ================= */
            <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-2xl overflow-hidden">
              {/* Status Banner */}
              <div className="bg-emerald-600 text-white p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">Verified Member</h2>
                    <p className="text-xs text-emerald-100 font-medium">Official Active Record Confirmed</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-white text-emerald-900 font-black text-xs rounded-full uppercase tracking-wider">
                  Status: Active
                </span>
              </div>

              {/* Member Details */}
              <div className="p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-emerald-50/50 rounded-2xl border border-emerald-200/80">
                  <img
                    src={verifiedMember.photoUrl || DEFAULT_AVATAR}
                    alt={verifiedMember.fullName}
                    className="w-28 h-28 min-w-[7rem] min-h-[7rem] max-w-[7rem] max-h-[7rem] rounded-2xl object-cover object-top border-4 border-white shadow-lg flex-shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                    }}
                  />
                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <h3 className="text-2xl font-black text-slate-900">{verifiedMember.fullName}</h3>
                    <p className="text-sm font-extrabold text-blue-800 bg-blue-100 border border-blue-300 px-3 py-1 rounded-lg w-fit mx-auto sm:mx-0">
                      Registration Number: {verifiedMember.registrationNumber}
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      Member Type: <span className="text-emerald-700 font-extrabold">{verifiedMember.memberType}</span>
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                      <span className="px-3 py-1 text-xs font-black bg-rose-100 text-rose-800 rounded-lg border border-rose-200 flex items-center gap-1">
                        <Droplet className="w-3.5 h-3.5 text-rose-600" /> Blood Group: {verifiedMember.bloodGroup}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Phone Number
                    </p>
                    <p className="font-bold text-slate-900">{formatPhoneNumber(verifiedMember.phone)}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email Address
                    </p>
                    <p className="font-bold text-slate-900 truncate">{verifiedMember.email}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" /> Occupation
                    </p>
                    <p className="font-bold text-slate-900">{verifiedMember.occupation}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" /> Company / Institute
                    </p>
                    <p className="font-bold text-slate-900">{verifiedMember.companyName || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs font-bold text-slate-500">
                Official Verification Record issued by Janatha Garage Authority
              </div>
            </div>
          ) : (
            /* ================= NOT FOUND CARD ================= */
            <div className="bg-white rounded-3xl border-2 border-rose-500 shadow-2xl overflow-hidden">
              <div className="bg-rose-600 text-white p-6 flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <XCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Membership Not Found</h2>
                  <p className="text-xs text-rose-100 font-medium">Invalid or Unverified Member Record</p>
                </div>
              </div>

              <div className="p-8 text-center space-y-4">
                <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
                <h3 className="text-2xl font-black text-slate-900">Invalid Member Record</h3>
                <p className="text-sm font-medium text-slate-600 max-w-md mx-auto leading-relaxed">
                  The registration number <strong className="text-rose-700">"{searchRegNo}"</strong> could not be verified in the Janatha Garage approved membership registry.
                </p>
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 font-semibold max-w-md mx-auto">
                  If you hold an official card, please contact the Janatha Garage administration office for record validation.
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-10 text-center bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
          <ShieldCheck className="w-16 h-16 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-slate-800">Verify Official Membership</h3>
            <p className="text-sm font-medium text-slate-500 max-w-md mx-auto">
              Scan a QR code or enter a Registration Number (e.g. JG-2025-001) or Phone Number to verify membership status.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
