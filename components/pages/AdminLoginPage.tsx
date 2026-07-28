import React, { useState } from 'react';
import { Lock, User, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { JanathaGarageLogo } from '@/components/JanathaGarageLogo';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess }) => {
  const [userId, setUserId] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const executeServerLogin = async (u: string, p: string) => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: u, password: p })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess();
      } else {
        setError(data.message || 'Invalid User ID or Password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication service error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeServerLogin(userId, password);
  };

  const handleQuickLogin = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setUserId('admin');
    setPassword('admin123');
    executeServerLogin('admin', 'admin123');
  };


  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-8 text-center space-y-4">
          <JanathaGarageLogo size="lg" lightText={true} className="justify-center" />
          <div>
            <h2 className="text-2xl font-black">Executive Admin Portal</h2>
            <p className="text-xs text-slate-400 font-medium">Janatha Garage Member Management System</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              User ID
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter User ID"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center justify-between gap-2">
            <div>
              <strong>Default Credentials:</strong><br />
              User ID: <code className="font-bold">admin</code> | Password: <code className="font-bold">admin123</code>
            </div>
            <button
              type="button"
              onClick={handleQuickLogin}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition-all flex-shrink-0"
            >
              One-Click Login
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <ShieldCheck className="w-5 h-5" /> Login to Admin Panel <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
};
