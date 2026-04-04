import { useMemo, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import type { UserProfile } from '../hooks/useUserPosts';

interface EditProfileModalProps {
  open: boolean;
  profile: UserProfile;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: Partial<UserProfile>) => Promise<void>;
}

type FormState = {
  fullName: string;
  username: string;
  phone: string;
  city: string;
  neighborhood: string;
  fullAddress: string;
  avatarUrl: string;
  bio: string;
};
type ErrorState = Partial<Record<keyof FormState, string>>;

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const validateForm = (formState: FormState): ErrorState => {
  const errors: ErrorState = {};
  const trimmedPhone = formState.phone.trim();
  const trimmedCity = formState.city.trim();
  const trimmedNeighborhood = formState.neighborhood.trim();
  const trimmedFullAddress = formState.fullAddress.trim();
  const trimmedAvatarUrl = formState.avatarUrl.trim();
  const trimmedBio = formState.bio.trim();

  if (formState.fullName.trim().length < 2) errors.fullName = 'Name is required';
  if (formState.fullName.trim().length > 70) errors.fullName = 'Name must be 70 characters or fewer';

  if (formState.username.trim().length < 3) errors.username = 'Username must be at least 3 characters';
  if (formState.username.trim().length > 40) errors.username = 'Username must be 40 characters or fewer';

  if (trimmedPhone && trimmedPhone.length < 8) errors.phone = 'Enter a valid phone number';
  if (trimmedPhone.length > 20) errors.phone = 'Phone number is too long';

  if (trimmedCity.length > 60) errors.city = 'City must be 60 characters or fewer';

  if (trimmedNeighborhood.length > 60) {
    errors.neighborhood = 'Neighborhood must be 60 characters or fewer';
  }

  if (trimmedFullAddress.length > 255) {
    errors.fullAddress = 'Full address must be 255 characters or fewer';
  }

  if (trimmedAvatarUrl && !isValidUrl(trimmedAvatarUrl)) errors.avatarUrl = 'Profile picture must be a valid URL';

  if (trimmedBio && trimmedBio.length < 8) errors.bio = 'Bio should be at least 8 characters';
  if (trimmedBio.length > 240) errors.bio = 'Bio must be 240 characters or fewer';

  return errors;
};

const buildFormState = (profile: UserProfile): FormState => ({
  fullName: profile.fullName,
  username: profile.username,
  phone: profile.phone,
  city: profile.city,
  neighborhood: profile.neighborhood,
  fullAddress: profile.fullAddress,
  avatarUrl: profile.avatarUrl,
  bio: profile.bio,
});

export const EditProfileModal = ({ open, profile, isSaving, onOpenChange, onSave }: EditProfileModalProps) => {
  const [formState, setFormState] = useState<FormState>(() => buildFormState(profile));
  const [errors, setErrors] = useState<ErrorState>({});

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  const onFieldChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) {
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const onSubmit = async () => {
    const nextErrors = validateForm(formState);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    await onSave({
      fullName: formState.fullName.trim(),
      username: formState.username.trim(),
      phone: formState.phone.trim(),
      city: formState.city.trim(),
      neighborhood: formState.neighborhood.trim(),
      fullAddress: formState.fullAddress.trim(),
      avatarUrl: formState.avatarUrl.trim(),
      bio: formState.bio.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (nextOpen) {
          setFormState(buildFormState(profile));
          setErrors({});
        }
      }}
    >
      <DialogContent
        overlayClassName="bg-slate-950/40 backdrop-blur-sm"
        className="max-h-[88vh] w-[min(92vw,44rem)] overflow-y-auto border border-slate-200/90 bg-white/95 p-4 shadow-[0_30px_90px_rgba(15,23,42,0.25)] backdrop-blur-xl sm:p-5"
      >
        <DialogHeader>
          <DialogTitle className="text-slate-950">Edit Profile</DialogTitle>
          <DialogDescription className="text-slate-600">Update your account details visible on your public profile.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500" htmlFor="fullName">
              Name
            </label>
            <Input
              id="fullName"
              value={formState.fullName}
              aria-invalid={Boolean(errors.fullName)}
              onChange={(e) => onFieldChange('fullName', e.target.value)}
              className="h-11 border-slate-300 bg-white/90"
            />
            {errors.fullName ? <p className="text-xs text-red-600">{errors.fullName}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500" htmlFor="username">
              Username
            </label>
            <Input
              id="username"
              value={formState.username}
              aria-invalid={Boolean(errors.username)}
              onChange={(e) => onFieldChange('username', e.target.value)}
              className="h-11 border-slate-300 bg-white/90"
            />
            {errors.username ? <p className="text-xs text-red-600">{errors.username}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500" htmlFor="phone">
              Phone
            </label>
            <Input
              id="phone"
              value={formState.phone}
              aria-invalid={Boolean(errors.phone)}
              onChange={(e) => onFieldChange('phone', e.target.value)}
              className="h-11 border-slate-300 bg-white/90"
            />
            {errors.phone ? <p className="text-xs text-red-600">{errors.phone}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500" htmlFor="city">
              City
            </label>
            <Input
              id="city"
              value={formState.city}
              aria-invalid={Boolean(errors.city)}
              onChange={(e) => onFieldChange('city', e.target.value)}
              className="h-11 border-slate-300 bg-white/90"
            />
            {errors.city ? <p className="text-xs text-red-600">{errors.city}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500" htmlFor="neighborhood">
              Neighborhood
            </label>
            <Input
              id="neighborhood"
              value={formState.neighborhood}
              aria-invalid={Boolean(errors.neighborhood)}
              onChange={(e) => onFieldChange('neighborhood', e.target.value)}
              className="h-11 border-slate-300 bg-white/90"
            />
            {errors.neighborhood ? <p className="text-xs text-red-600">{errors.neighborhood}</p> : null}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500" htmlFor="fullAddress">
              Full Address
            </label>
            <Textarea
              id="fullAddress"
              value={formState.fullAddress}
              aria-invalid={Boolean(errors.fullAddress)}
              onChange={(e) => onFieldChange('fullAddress', e.target.value)}
              placeholder="House, road, area, city"
              className="min-h-20 border-slate-300 bg-white/90"
            />
            {errors.fullAddress ? <p className="text-xs text-red-600">{errors.fullAddress}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500" htmlFor="avatarUrl">
              Profile Picture URL
            </label>
            <Input
              id="avatarUrl"
              value={formState.avatarUrl}
              aria-invalid={Boolean(errors.avatarUrl)}
              onChange={(e) => onFieldChange('avatarUrl', e.target.value)}
              className="h-11 border-slate-300 bg-white/90"
            />
            {errors.avatarUrl ? <p className="text-xs text-red-600">{errors.avatarUrl}</p> : null}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500" htmlFor="bio">
              Bio
            </label>
            <Textarea
              id="bio"
              value={formState.bio}
              aria-invalid={Boolean(errors.bio)}
              onChange={(e) => onFieldChange('bio', e.target.value)}
              className="min-h-24 border-slate-300 bg-white/90"
            />
            {errors.bio ? <p className="text-xs text-red-600">{errors.bio}</p> : null}
          </div>
        </div>

        <DialogFooter className="mt-2 gap-2 sm:gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button className="w-full bg-emerald-600 transition-all hover:bg-emerald-700 sm:w-auto" onClick={onSubmit} disabled={isSaving || hasErrors}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
