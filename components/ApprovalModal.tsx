import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, CheckCircle, Shield, AlertCircle } from 'lucide-react';
import { MemberRecord, MemberType } from '@/types';
import { formatPhoneNumber } from '@/lib/storage';

interface ApprovalModalProps {
  member: MemberRecord;
  memberTypes: string[];
  onClose: () => void;
  onConfirmApprove: (pendingId: string, selectedMemberType: MemberType) => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  member,
  memberTypes,
  onClose,
  onConfirmApprove
}) => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleApprove = () => {
    if (!selectedType) {
      setError('Approval cannot continue until a Member Type is selected.');
      return;
    }
    setError('');
    onConfirmApprove(member.id, selectedType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
      >
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Approve Membership</h3>
              <p className="text-xs text-slate-400">Janatha Garage Registration System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <img
              src={member.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={member.fullName}
              className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md"
            />
            <div>
              <h4 className="font-bold text-slate-900 text-base">{member.fullName}</h4>
              <p className="text-xs font-semibold text-slate-500">{formatPhoneNumber(member.phone)} • {member.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-md">
                  Blood Group: {member.bloodGroup}
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-slate-200 text-slate-700 rounded-md">
                  {member.occupation}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800">
              Select Member Type <span className="text-rose-600">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Please designate the official organizational rank for this applicant. This will be embedded in their Membership ID Card.
            </p>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                if (e.target.value) setError('');
              }}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            >
              <option value="">-- Choose Member Type --</option>
              {memberTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> Auto-Generated Actions on Approval:
            </p>
            <ul className="list-disc list-inside space-y-0.5 pl-1 opacity-90">
              <li>Sequential Registration Number (e.g. JG-2025-001) generated</li>
              <li>Record transferred from Pending to Approved Sheet</li>
              <li>Verification QR Code created</li>
              <li>Approval email notice dispatched to {member.email}</li>
            </ul>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
          >
            <CheckCircle className="w-4 h-4" />
            Confirm Approval
          </button>
        </div>
      </motion.div>
    </div>
  );
};
