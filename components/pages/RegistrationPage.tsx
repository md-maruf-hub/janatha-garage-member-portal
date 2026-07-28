import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  CheckSquare,
  Square,
  AlertCircle,
  Loader2,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { RegistrationFormData, BloodGroup, AppSettings } from '@/types';
import { registerMemberToGAS } from '@/lib/gasApi';
import { submitRegistration, checkDuplicateMember, DEFAULT_AVATAR } from '@/lib/storage';

interface RegistrationPageProps {
  settings: AppSettings;
  onSuccessSubmit: (msg: string) => void;
  onErrorSubmit: (msg: string) => void;
  onNavigate?: (tab: string) => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({
  settings,
  onSuccessSubmit,
  onErrorSubmit,
  onNavigate
}) => {
  const router = useRouter();
  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: '',
    fatherName: '',
    motherName: '',
    gender: 'Male',
    dob: '',
    bloodGroup: 'A+',
    phone: '',
    email: '',
    presentAddress: '',
    permanentAddressSame: false,
    permanentAddress: '',
    occupation: '',
    companyName: '',
    photoUrl: ''
  });

  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  // Handle Photo Select & 2MB Validation
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setFormError('Image must be in JPG, JPEG, or PNG format.');
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setFormError('Image size exceeds maximum allowed limit of 2MB.');
      return;
    }

    setFormError('');
    setPhotoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      setFormData((prev) => ({ ...prev, photoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  // Sync permanent address if checkbox toggled
  const handleSameAddressToggle = () => {
    const nextState = !formData.permanentAddressSame;
    setFormData((prev) => ({
      ...prev,
      permanentAddressSame: nextState,
      permanentAddress: nextState ? prev.presentAddress : prev.permanentAddress
    }));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Trim Inputs
    const trimmedData: RegistrationFormData = {
      fullName: formData.fullName.trim(),
      fatherName: formData.fatherName.trim(),
      motherName: formData.motherName.trim(),
      gender: formData.gender,
      dob: formData.dob,
      bloodGroup: formData.bloodGroup,
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase(),
      presentAddress: formData.presentAddress.trim(),
      permanentAddressSame: formData.permanentAddressSame,
      permanentAddress: formData.permanentAddressSame ? formData.presentAddress.trim() : formData.permanentAddress.trim(),
      occupation: formData.occupation.trim(),
      companyName: formData.companyName.trim(),
      photoUrl: formData.photoUrl
    };

    // Mandatory Field Checks
    if (!trimmedData.fullName || !trimmedData.fatherName || !trimmedData.motherName) {
      setFormError('Please enter Full Name, Father\'s Name, and Mother\'s Name.');
      return;
    }

    if (!trimmedData.dob) {
      setFormError('Please select Date of Birth.');
      return;
    }

    // Bangladesh Phone Validation
    // Valid BD Phone format: 013-019 followed by 8 digits, or +88013-+88019...
    const bdPhoneRegex = /^(?:\+8801|01)[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(trimmedData.phone)) {
      setFormError('Please enter a valid Bangladesh Phone Number (e.g. 01700000000).');
      return;
    }

    // Email Format Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedData.email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (!trimmedData.presentAddress) {
      setFormError('Please enter Present Address.');
      return;
    }

    if (!trimmedData.occupation) {
      setFormError('Please enter Occupation.');
      return;
    }

    if (!trimmedData.photoUrl) {
      setFormError('Please upload a member photo (JPG, JPEG, or PNG up to 2MB).');
      return;
    }

    // Check duplicate phone number or email BEFORE submitting
    const dupCheck = checkDuplicateMember(trimmedData.phone, trimmedData.email);
    if (dupCheck.isDuplicate) {
      const errorMsg = dupCheck.message || 'This phone number or email is already registered.';
      setFormError(errorMsg);
      onErrorSubmit(errorMsg);
      return;
    }

    setIsSubmitting(true);

    try {
      let finalMessage = '';

      if (settings.gasWebAppUrl) {
        // Upload directly to Google Sheets via GAS API proxy
        const gasRes = await registerMemberToGAS(settings.gasWebAppUrl, trimmedData);
        if (!gasRes.success) {
          setFormError(gasRes.message);
          onErrorSubmit(gasRes.message);
          setIsSubmitting(false);
          return;
        }
        // Also keep local record so UI updates instantly
        submitRegistration(trimmedData);
        finalMessage = gasRes.message || 'Registration submitted and saved to Google Sheets successfully!';
      } else {
        // Submit locally and prompt user
        const localRes = submitRegistration(trimmedData);
        if (!localRes.success) {
          setFormError(localRes.message);
          onErrorSubmit(localRes.message);
          setIsSubmitting(false);
          return;
        }
        finalMessage = localRes.message;
      }

      onSuccessSubmit(finalMessage);

      // Reset Form on Success
      setFormData({
        fullName: '',
        fatherName: '',
        motherName: '',
        gender: 'Male',
        dob: '',
        bloodGroup: 'A+',
        phone: '',
        email: '',
        presentAddress: '',
        permanentAddressSame: false,
        permanentAddress: '',
        occupation: '',
        companyName: '',
        photoUrl: ''
      });
      setPhotoPreview('');
      setPhotoFile(null);
    } catch (err: any) {
      setFormError(err?.message || 'An unexpected error occurred during submission.');
      onErrorSubmit(err?.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold">
            <FileText className="w-4 h-4" /> Membership Application
          </div>
          <h1 className="text-3xl font-black tracking-tight">Janatha Garage Member Registration</h1>
          <p className="text-slate-300 text-sm font-medium">
            Please fill out all required fields accurately. Applications are reviewed by executive admins.
          </p>
        </div>


      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl space-y-8">
        {formError && (
          <div className="p-4 bg-rose-50 border-2 border-rose-300 text-rose-900 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-base text-rose-900">Validation Notice</h4>
              <p className="text-sm font-semibold text-rose-800">{formError}</p>
            </div>
          </div>
        )}

        {/* Section 1: Member Photo Upload */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-600" /> Member Photo Upload
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
            <div className="w-32 h-36 min-w-[8rem] min-h-[9rem] max-w-[8rem] max-h-[9rem] rounded-2xl overflow-hidden border-2 border-slate-300 bg-white flex items-center justify-center relative shadow-sm flex-shrink-0">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Applicant Preview"
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                  }}
                />
              ) : (
                <div className="text-center p-4 text-slate-400">
                  <User className="w-12 h-12 mx-auto mb-1 opacity-50" />
                  <span className="text-[10px] font-bold uppercase tracking-wider block">No Photo</span>
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1 text-center sm:text-left">
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl cursor-pointer shadow-md transition-all active:scale-95">
                <Upload className="w-4 h-4 text-emerald-400" /> Choose Photo
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs font-semibold text-slate-500">
                Allowed formats: JPG, JPEG, PNG. Maximum file size: 2MB. Clear passport style image recommended.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" /> Personal Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5 md:col-span-3">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter full name"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Father's Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                placeholder="Father's full name"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Mother's Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.motherName}
                onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                placeholder="Mother's full name"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Gender <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Date of Birth <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Blood Group <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as any })}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-rose-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
              >
                {bloodGroups.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Contact & Address */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
            <Phone className="w-5 h-5 text-emerald-600" /> Contact & Address Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Phone Number (Bangladesh) <span className="text-rose-600">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 01700000000"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Email Address <span className="text-rose-600">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. user@example.com"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Present Address <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={formData.presentAddress}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    presentAddress: val,
                    permanentAddress: prev.permanentAddressSame ? val : prev.permanentAddress
                  }));
                }}
                placeholder="House, Road, Area, City, District"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="button"
                onClick={handleSameAddressToggle}
                className="flex items-center gap-2.5 text-sm font-bold text-slate-800 hover:text-emerald-700 select-none cursor-pointer py-1"
              >
                {formData.permanentAddressSame ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 flex-shrink-0" />
                )}
                Permanent Address Same as Present Address
              </button>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Permanent Address <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={2}
                required
                disabled={formData.permanentAddressSame}
                value={formData.permanentAddress}
                onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                placeholder="Permanent Address"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-sm disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Occupation */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-600" /> Occupation & Organization
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Occupation <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="e.g. Engineer, Business, Student, Doctor..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Company / Institute Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Company or Educational Institute"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium text-slate-500">
            By submitting, you declare that all provided information is accurate and true.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting Application...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Submit Application
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
