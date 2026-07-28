import React from 'react';
import { motion } from 'motion/react';
import { X, User, Phone, Mail, MapPin, Briefcase, Calendar, ShieldCheck, Clock, FileText, XCircle, CheckCircle2 } from 'lucide-react';
import { MemberRecord } from '@/types';
import { formatPhoneNumber, DEFAULT_AVATAR } from '@/lib/storage';

interface MemberCardModalProps {
  member: MemberRecord;
  onClose: () => void;
  onApproveClick?: (member: MemberRecord) => void;
  onRejectClick?: (memberId: string) => void;
}

export const MemberCardModal: React.FC<MemberCardModalProps> = ({
  member,
  onClose,
  onApproveClick,
  onRejectClick
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden"
      >
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-white">Member Application Details</h3>
              <p className="text-xs text-slate-400">Janatha Garage Membership Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <img
              src={member.photoUrl || DEFAULT_AVATAR}
              alt={member.fullName}
              className="w-28 h-28 min-w-[7rem] min-h-[7rem] max-w-[7rem] max-h-[7rem] rounded-2xl object-cover object-top border-4 border-white shadow-lg flex-shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
              }}
            />
            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-black text-slate-900">{member.fullName}</h2>
                {member.status === 'Approved' ? (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Approved Member
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs rounded-full flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Pending Approval
                  </span>
                )}
              </div>

              {member.registrationNumber && (
                <p className="text-sm font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg w-fit">
                  Registration Number: {member.registrationNumber}
                </p>
              )}

              {member.memberType && (
                <p className="text-sm font-bold text-slate-700">
                  Role: <span className="text-emerald-700 font-extrabold">{member.memberType}</span>
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <span className="px-3 py-1 text-xs font-black bg-rose-100 text-rose-800 rounded-lg border border-rose-200">
                  Blood Group: {member.bloodGroup}
                </span>
                <span className="px-3 py-1 text-xs font-bold bg-slate-200 text-slate-800 rounded-lg">
                  {member.gender}
                </span>
                <span className="px-3 py-1 text-xs font-bold bg-slate-200 text-slate-800 rounded-lg">
                  DOB: {member.dob}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Parents' Information
              </p>
              <p className="font-semibold text-slate-800">
                Father: <span className="font-normal text-slate-600">{member.fatherName}</span>
              </p>
              <p className="font-semibold text-slate-800">
                Mother: <span className="font-normal text-slate-600">{member.motherName}</span>
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Profession
              </p>
              <p className="font-semibold text-slate-800">
                Occupation: <span className="font-normal text-slate-600">{member.occupation}</span>
              </p>
              <p className="font-semibold text-slate-800">
                Company/Institute: <span className="font-normal text-slate-600">{member.companyName || 'N/A'}</span>
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Contact Details
              </p>
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-400" /> {formatPhoneNumber(member.phone)}
              </p>
              <p className="font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                <Mail className="w-3 h-3 text-slate-400" /> {member.email}
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Approval Dates
              </p>
              
              {member.approvalDate && (
                <p className="font-semibold text-slate-800">
                  Approved: <span className="font-normal text-slate-600">{new Date(member.approvalDate).toLocaleDateString()}</span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Present Address
              </p>
              <p className="text-sm font-medium text-slate-800">{member.presentAddress}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Permanent Address
              </p>
              <p className="text-sm font-medium text-slate-800">{member.permanentAddress}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>

          {member.status === 'Pending' && (
            <div className="flex items-center gap-2">
              {onRejectClick && (
                <button
                  onClick={() => {
                    onClose();
                    onRejectClick(member.id);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-100 hover:bg-rose-200 text-rose-800 transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Reject Applicant
                </button>
              )}
              {onApproveClick && (
                <button
                  onClick={() => {
                    onClose();
                    onApproveClick(member);
                  }}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Applicant
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
