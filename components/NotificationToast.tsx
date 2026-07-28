import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { NotificationState } from '@/types';

interface NotificationToastProps {
  notification: NotificationState;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  if (!notification.show) return null;

  const icons = {
    success: <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />,
    error: <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />,
    info: <Info className="w-6 h-6 text-blue-600 flex-shrink-0" />
  };

  const borderBg = {
    success: 'bg-emerald-50 border-emerald-300 text-emerald-950',
    error: 'bg-rose-50 border-rose-300 text-rose-950',
    info: 'bg-blue-50 border-blue-300 text-blue-950'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full max-w-md p-6 rounded-2xl border-2 shadow-2xl ${borderBg[notification.type]}`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 p-1 rounded-full hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200">
              {icons[notification.type]}
            </div>
            <div className="flex-1 pr-4">
              <h3 className="font-bold text-lg leading-tight mb-1">
                {notification.title}
              </h3>
              <p className="text-sm font-medium opacity-90 leading-relaxed whitespace-pre-line">
                {notification.message}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 ${
                notification.type === 'success'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : notification.type === 'error'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              OK, Got it
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
