import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Users,
  Droplet,
  UserCheck,
  Phone,
  Briefcase,
  ExternalLink,
  Filter,
  UserPlus,
  CreditCard,
  ShieldCheck,
  Lock,
  ArrowRight,
  Settings,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { MemberRecord, DashboardStats, BloodGroup } from '@/types';
import { formatPhoneNumber, matchesPhoneNumber, DEFAULT_AVATAR } from '@/lib/storage';

interface DashboardPageProps {
  stats: DashboardStats;
  approvedMembers: MemberRecord[];
  onSelectMember: (member: MemberRecord) => void;
  onGoToIdCard?: (registrationNumber: string) => void;
  onNavigate?: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  approvedMembers,
  onSelectMember,
  onGoToIdCard,
  onNavigate
}) => {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);

  const bloodGroupsList: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setHasSearched(true);
      setSearchQuery(searchInput.trim());
    }
  };

  const handleShowAll = () => {
    setSearchInput('*');
    setSearchQuery('*');
    setSelectedBloodGroup('');
    setHasSearched(true);
  };

  const handleBloodGroupClick = (bg: string) => {
    if (selectedBloodGroup === bg) {
      setSelectedBloodGroup('');
      if (!searchQuery || searchQuery === '*') {
        setHasSearched(false);
        setSearchQuery('');
        setSearchInput('');
      }
    } else {
      setSelectedBloodGroup(bg);
      setHasSearched(true);
    }
  };

  // Filter members ONLY when a search action has been performed
  const displayedMembers = hasSearched
    ? approvedMembers.filter((m) => {
        const q = searchQuery.toLowerCase().trim();
        const matchQuery =
          !q ||
          q === '*' ||
          String(m.registrationNumber || '').toLowerCase().includes(q) ||
          matchesPhoneNumber(m.phone, searchQuery);

        const matchBlood = !selectedBloodGroup || m.bloodGroup === selectedBloodGroup;

        return matchQuery && matchBlood;
      })
    : [];

  return (
    <div className="space-y-10 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Janatha Garage Member Portal</h1>
          <p className="text-slate-600 font-medium text-sm mt-1">
            Realtime directory search, blood donor registry, and membership management portal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-emerald-200 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            System Live & Ready
          </span>
        </div>
      </div>

      {/* Top Stat Cards (Clickable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="p-3.5 bg-emerald-100 text-emerald-700 rounded-2xl">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Total Members</p>
            <h3 className="text-3xl font-black text-slate-900">{stats.totalMembers}</h3>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:border-rose-300 transition-all">
          <div className="p-3.5 bg-rose-100 text-rose-700 rounded-2xl">
            <Droplet className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Blood Donors</p>
            <h3 className="text-3xl font-black text-slate-900">{stats.totalMembers}</h3>
          </div>
        </div>

        <Link
          href="/admin?tab=approved"
          className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:border-emerald-400 hover:shadow-md transition-all group block"
        >
          <div className="p-3.5 bg-amber-100 text-amber-700 group-hover:bg-emerald-600 group-hover:text-white rounded-2xl transition-colors">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase text-slate-500 group-hover:text-emerald-700 tracking-wider">Approved Active</p>
            <h3 className="text-3xl font-black text-slate-900">{stats.approvedCount}</h3>
          </div>
        </Link>

        <Link
          href="/admin?tab=pending"
          className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:border-blue-400 hover:shadow-md transition-all group block"
        >
          <div className="p-3.5 bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white rounded-2xl transition-colors">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase text-slate-500 group-hover:text-blue-700 tracking-wider">Pending Review</p>
            <h3 className="text-3xl font-black text-slate-900">{stats.pendingCount}</h3>
          </div>
        </Link>
      </div>

      {/* Blood Group Statistics Grid */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Droplet className="w-5 h-5 text-rose-600" />
            Blood Group Distribution & Emergency Search
          </h3>
          {selectedBloodGroup && (
            <button
              onClick={() => setSelectedBloodGroup('')}
              className="text-xs font-bold text-rose-600 hover:underline"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {bloodGroupsList.map((bg) => {
            const count = stats.bloodGroupCounts[bg] || 0;
            const isSelected = selectedBloodGroup === bg;
            return (
              <button
                key={bg}
                onClick={() => handleBloodGroupClick(bg)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-105'
                    : 'bg-slate-50 border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-slate-900'
                }`}
              >
                <p className={`text-base font-black ${isSelected ? 'text-white' : 'text-rose-600'}`}>{bg}</p>
                <p className={`text-xs font-bold ${isSelected ? 'text-rose-100' : 'text-slate-500'}`}>{count} Donors</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Find Control */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl shadow-xl space-y-4">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by Registration Number or Phone Number..."
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 flex-shrink-0 cursor-pointer"
            >
              <Search className="w-4 h-4" /> Find
            </button>
            {hasSearched && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearchQuery('');
                  setSelectedBloodGroup('');
                  setHasSearched(false);
                }}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold">
              <Filter className="w-4 h-4 text-amber-400" />
              <span>
                {selectedBloodGroup ? `Blood Group: ${selectedBloodGroup}` : 'All Blood Groups'}
              </span>
            </div>
          </div>
        </form>

        {hasSearched && (
          <p className="text-xs text-slate-400">
            Showing <span className="font-bold text-white">{displayedMembers.length}</span> matching approved members
          </p>
        )}
      </div>

      {/* Search Results / Member Roster Display Area */}
      {!hasSearched ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <Search className="w-14 h-14 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-800">Search Member Directory</h3>
            <p className="text-sm font-medium text-slate-500 max-w-md mx-auto leading-relaxed">
              Enter Your Registration Number, Phone Number, or Name in the search box above and click <strong>Find</strong>, or select an emergency blood group filter.
            </p>
          </div>
          <div className="pt-2">

          </div>
        </div>
      ) : displayedMembers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Members Found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            No approved member records matched your search query. Try searching by registration number, phone number, or clearing blood group filters.
          </p>
        </div>
      ) : selectedBloodGroup ? (
        /* Blood Group Specific View: Shows ONLY Picture, Name, Phone Number, Blood Group */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-rose-600 fill-rose-600" />
              <h4 className="font-extrabold text-sm text-rose-900">
                Blood Donors (<span className="text-base font-black underline">{selectedBloodGroup}</span>) — {displayedMembers.length} Found
              </h4>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg">
              Showing Picture, Name, Phone & Blood Group
            </span>
          </div>
          <table className="w-full text-left border-collapse min-w-[550px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4 w-20">Picture</th>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Blood Group</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {displayedMembers.map((member) => (
                <tr key={member.id} className="hover:bg-rose-50/40 transition-colors">
                  <td className="py-3 px-4">
                    <img
                      src={member.photoUrl || DEFAULT_AVATAR}
                      alt={member.fullName}
                      className="w-12 h-12 min-w-[3rem] min-h-[3rem] max-w-[3rem] max-h-[3rem] rounded-xl object-cover object-top border-2 border-rose-200 flex-shrink-0 shadow-xs"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                      }}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-extrabold text-sm text-slate-900">{member.fullName}</p>
                    {/* <p className="text-[11px] text-slate-500 font-bold">{member.registrationNumber || member.id}</p> */}
                  </td>
                  <td className="py-3 px-4 font-extrabold text-slate-900 text-sm whitespace-nowrap">
                    {formatPhoneNumber(member.phone)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 text-xs font-black bg-rose-600 text-white rounded-lg shadow-xs">
                      {member.bloodGroup}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Standard Member Search / Roster Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto space-y-2">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              {hasSearched ? 'Search Results' : 'Official Member Directory Roster'}
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {displayedMembers.length} Approved Members Listed
            </span>
          </div>

          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Member Info</th>
                <th className="py-3.5 px-4">Reg No.</th>
                <th className="py-3.5 px-4">Role / Type</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Blood Group</th>
                <th className="py-3.5 px-4">Occupation</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {displayedMembers.map((member) => (
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
                        <p className="font-extrabold text-sm text-slate-900">{member.fullName}</p>
                        <p className="text-[11px] text-slate-500">{member.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                      {member.registrationNumber || member.id}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-700">
                    {member.memberType || 'Member'}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {formatPhoneNumber(member.phone)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 text-xs font-extrabold bg-rose-100 text-rose-800 rounded-lg border border-rose-200">
                      {member.bloodGroup}
                    </span>
                  </td>
                  <td className="py-3 px-4 truncate max-w-[150px]">
                    {member.occupation || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onSelectMember(member)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-400" /> View Profile
                      </button>

                      {member.registrationNumber && onGoToIdCard && (
                        <button
                          onClick={() => onGoToIdCard(member.registrationNumber!)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 active:scale-95"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> ID Card
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
