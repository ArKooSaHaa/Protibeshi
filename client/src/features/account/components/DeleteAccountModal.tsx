import { useMemo, useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Trash2 } from 'lucide-react';
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

interface DeleteAccountModalProps {
  open: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { password: string; confirmationText: string }) => Promise<void>;
}

const CONFIRM_TEXT = 'DELETE';

export const DeleteAccountModal = ({
  open,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: DeleteAccountModalProps) => {
  const [password, setPassword] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmationText?: string }>({});

  const canDelete = useMemo(
    () => password.trim().length > 0 && confirmationText.trim() === CONFIRM_TEXT,
    [confirmationText, password]
  );

  const resetForm = () => {
    setPassword('');
    setConfirmationText('');
    setPasswordVisible(false);
    setErrors({});
  };

  const handleSubmit = async () => {
    const nextErrors: { password?: string; confirmationText?: string } = {};

    if (!password.trim()) {
      nextErrors.password = 'Current password is required.';
    }

    if (confirmationText.trim() !== CONFIRM_TEXT) {
      nextErrors.confirmationText = `Please type ${CONFIRM_TEXT} to continue.`;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      await onSubmit({
        password: password.trim(),
        confirmationText: confirmationText.trim(),
      });

      onOpenChange(false);
    } catch {
      // keep modal open so the error toast is visible
    }
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
        overlayClassName="bg-slate-950/50 backdrop-blur-sm"
        className="max-h-[92vh] w-[min(96vw,34rem)] overflow-y-auto border border-red-200/80 bg-white/95 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:p-6"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            This action permanently removes your account and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-700">
            Deleting your account will erase profile details and linked activity. Please proceed only if you are certain.
          </div>

          <div className="space-y-1.5">
            <label htmlFor="delete-account-password" className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Current Password
            </label>
            <div className="relative">
              <Input
                id="delete-account-password"
                type={passwordVisible ? 'text' : 'password'}
                value={password}
                aria-invalid={Boolean(errors.password)}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                className="h-11 border-slate-300 bg-white/90 pr-11"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setPasswordVisible((prev) => !prev)}
                className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label={passwordVisible ? 'Hide password' : 'Show password'}
              >
                {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password ? <p className="text-xs text-red-600">{errors.password}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="delete-confirmation" className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Type {CONFIRM_TEXT} To Confirm
            </label>
            <Input
              id="delete-confirmation"
              value={confirmationText}
              aria-invalid={Boolean(errors.confirmationText)}
              onChange={(event) => {
                setConfirmationText(event.target.value);
                if (errors.confirmationText) {
                  setErrors((prev) => ({ ...prev, confirmationText: undefined }));
                }
              }}
              className="h-11 border-slate-300 bg-white/90"
              autoComplete="off"
            />
            {errors.confirmationText ? <p className="text-xs text-red-600">{errors.confirmationText}</p> : null}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-3">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !canDelete}
            className="w-full bg-red-600 transition-all hover:-translate-y-0.5 hover:bg-red-700 sm:w-auto"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
