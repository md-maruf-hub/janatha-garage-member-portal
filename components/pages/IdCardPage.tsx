import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CreditCard, AlertCircle, ShieldCheck } from 'lucide-react';
import { MemberRecord, AppSettings } from '@/types';
import { IdCardPreview } from '@/components/IdCardPreview';
import { matchesPhoneNumber } from '@/lib/storage';

interface IdCardPageProps {
  approvedMembers: MemberRecord[];
  settings: AppSettings;
  initialRegNo?: string;
  onNavigate?: (tab: string) => void;
}

export const IdCardPage: React.FC<IdCardPageProps> = ({
  approvedMembers,
  settings,
  initialRegNo = '',
  onNavigate
}) => {
  const router = useRouter();
  const [searchRegNo, setSearchRegNo] = useState<string>(initialRegNo || '');
  const [selectedMember, setSelectedMember] = useState<MemberRecord | null>(null);
  const [notFoundError, setNotFoundError] = useState<string>('');

  const navTo = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    } else {
      const path = tab === 'dashboard' || tab === 'home' ? '/' : `/${tab}`;
      router.push(path);
    }
  };

  // Handle Search
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setNotFoundError('');

    const rawInput = searchRegNo.trim();
    if (!rawInput) {
      setNotFoundError('Please enter a Registration Number (e.g. JG260001) or Phone Number.');
      setSelectedMember(null);
      return;
    }

    const cleanInput = rawInput.toUpperCase();

    // Search ONLY from Approved Members
    const match = approvedMembers.find(
      (m) =>
        String(m.registrationNumber || '').toUpperCase() === cleanInput ||
        String(m.id || '').toUpperCase() === cleanInput ||
        matchesPhoneNumber(m.phone, rawInput)
    );

    if (match) {
      setSelectedMember(match);
      setNotFoundError('');
    } else {
      setSelectedMember(null);
      setNotFoundError(`No approved member found matching "${searchRegNo}". ID cards are issued only to approved members.`);
    }
  };

  useEffect(() => {
    if (initialRegNo) {
      setSearchRegNo(initialRegNo);
      const cleanInput = initialRegNo.trim().toUpperCase();
      const match = approvedMembers.find(
        (m) =>
          String(m.registrationNumber || '').toUpperCase() === cleanInput ||
          matchesPhoneNumber(m.phone, initialRegNo)
      );
      if (match) setSelectedMember(match);
    }
  }, [initialRegNo, approvedMembers]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold">
            <CreditCard className="w-4 h-4" /> PVC CR80 Membership Card
          </div>
          <h1 className="text-3xl font-black tracking-tight">Digital Membership ID Card Generator</h1>
          <p className="text-slate-300 text-sm font-medium">
            Search approved members by Registration Number to preview and download printable PVC ID cards.
          </p>
        </div>

      </div>

      {/* Search Input Bar */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-md">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchRegNo}
              onChange={(e) => setSearchRegNo(e.target.value)}
              placeholder="Enter Registration Number (e.g. JG260001) or Phone Number..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4 text-emerald-400" /> Search Member
          </button>
        </form>

        {notFoundError && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{notFoundError}</span>
          </div>
        )}
      </div>

      {/* ID Card Display Area */}
      {selectedMember ? (
        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{selectedMember.fullName}</h2>
              <p className="text-xs font-bold text-slate-500">
                Registration Number: <span className="text-blue-700 font-extrabold">{selectedMember.registrationNumber}</span> • Role: <span className="text-emerald-700 font-bold">{selectedMember.memberType}</span>
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Approved Member
            </span>
          </div>

          <IdCardPreview member={selectedMember} settings={settings} />
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
          <CreditCard className="w-16 h-16 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-slate-800">Search for an Approved Member</h3>
            <p className="text-sm font-medium text-slate-500 max-w-md mx-auto">
              Please enter a valid Registration Number (e.g. JG260001) or Phone Number in the search box above.
            </p>
          </div>

          {approvedMembers.length > 0 && (
            <div className="pt-4 border-t border-slate-100 max-w-2xl mx-auto">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Quick Select Approved Member ({approvedMembers.length})
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {approvedMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSearchRegNo(m.registrationNumber || m.id);
                      setSelectedMember(m);
                      setNotFoundError('');
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="font-mono text-emerald-600">{m.registrationNumber}</span>
                    <span>{m.fullName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
