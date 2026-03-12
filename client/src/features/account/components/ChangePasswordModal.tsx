import { useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface ChangePasswordModalProps {
  open: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { 
    current_password: string; 
    new_password: string; 
    new_password_confirmation: string;
  }) => Promise<void>;
}

type FormState = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ErrorState = Partial<Record<keyof FormState, string>>;

const getValidationErrors = (form: FormState): ErrorState => {
  const errors: ErrorState = {};
  const oldPassword = form.oldPassword.trim();
  const newPassword = form.newPassword.trim();
  const confirmPassword = form.confirmPassword.trim();

  if (!oldPassword) {
    errors.oldPassword = 'Old password is required.';
  }

  if (!newPassword) {
    errors.newPassword = 'New password is required.';
  } else {
    if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters.';
    } else if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      errors.newPassword = 'Use uppercase, lowercase, number, and special character.';
    }
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your new password.';
  } else if (confirmPassword !== newPassword) {
    errors.confirmPassword = 'Confirm password must match the new password.';
  }

  return errors;
};

const PasswordInput = ({
  id,
  label,
  value,
  error,
  visible,
  onToggle,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  visible: boolean;
  onToggle: () => void;
  onChange: (nextValue: string) => void;
}) => {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 border-slate-300 bg-white/90 pr-11"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
};

export const ChangePasswordModal = ({ open, isSubmitting, onOpenChange, onSubmit }: ChangePasswordModalProps) => {
  const [form, setForm] = useState<FormState>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<ErrorState>({});
  const [visible, setVisible] = useState({
    old: false,
    next: false,
    confirm: false,
  });

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) {
        return prev;
      }

      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async () => {
    const nextErrors = getValidationErrors(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      await onSubmit({
        current_password: form.oldPassword.trim(),
        new_password: form.newPassword.trim(),
        new_password_confirmation: form.confirmPassword.trim(),
      });

      onOpenChange(false);
    } catch {
      // Keep dialog open when API fails so user can correct inputs.
    }
  };

  const resetForm = () => {
    setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setErrors({});
    setVisible({ old: false, next: false, confirm: false });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogContent
        overlayClassName="bg-slate-950/45 backdrop-blur-sm"
        className="max-h-[92vh] w-[min(96vw,34rem)] overflow-y-auto border border-slate-200/90 bg-white/95 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.25)] backdrop-blur-xl sm:p-6"
      >
        <DialogHeader>
          <DialogTitle className="text-slate-950">Change Password</DialogTitle>
          <DialogDescription className="text-slate-600">
            Protect your account with a strong new password.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <PasswordInput
            id="old-password"
            label="Old Password"
            value={form.oldPassword}
            error={errors.oldPassword}
            visible={visible.old}
            onToggle={() => setVisible((prev) => ({ ...prev, old: !prev.old }))}
            onChange={(value) => handleChange('oldPassword', value)}
          />

          <PasswordInput
            id="new-password"
            label="New Password"
            value={form.newPassword}
            error={errors.newPassword}
            visible={visible.next}
            onToggle={() => setVisible((prev) => ({ ...prev, next: !prev.next }))}
            onChange={(value) => handleChange('newPassword', value)}
          />

          <PasswordInput
            id="confirm-password"
            label="Confirm New Password"
            value={form.confirmPassword}
            error={errors.confirmPassword}
            visible={visible.confirm}
            onToggle={() => setVisible((prev) => ({ ...prev, confirm: !prev.confirm }))}
            onChange={(value) => handleChange('confirmPassword', value)}
          />

          <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-700">
            Password must contain at least 8 characters including uppercase, lowercase, number, and special character.
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-3">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || hasErrors}
            className="w-full bg-emerald-600 text-white transition-all hover:-translate-y-0.5 hover:bg-emerald-700 sm:w-auto"
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
