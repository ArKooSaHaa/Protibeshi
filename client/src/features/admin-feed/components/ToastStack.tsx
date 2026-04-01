import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, OctagonAlert, X } from 'lucide-react';
import type { AdminToast, ToastTone } from '../types/adminFeed.types';

interface ToastStackProps {
  toasts: AdminToast[];
  onDismiss: (toastId: string) => void;
}

const toastIconMap = {
  success: CheckCircle2,
  danger: OctagonAlert,
  info: Info,
} as const satisfies Record<ToastTone, typeof CheckCircle2>;

const toastToneClass: Record<ToastTone, string> = {
  success: 'afd-toast-success',
  danger: 'afd-toast-danger',
  info: 'afd-toast-info',
};

export const ToastStack = ({ toasts, onDismiss }: ToastStackProps) => {
  return (
    <div className="afd-toast-stack" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = toastIconMap[toast.tone];

          return (
            <motion.div
              key={toast.id}
              className={`afd-toast ${toastToneClass[toast.tone]}`}
              initial={{ opacity: 0, x: 22, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 22, scale: 0.94 }}
              transition={{ duration: 0.2 }}
            >
              <div className="afd-toast-body">
                <Icon size={16} />
                <span>{toast.message}</span>
              </div>
              <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
