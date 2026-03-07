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

  if (formState.fullName.trim().length < 2) errors.fullName = 'Name is required';
  if (formState.fullName.trim().length > 70) errors.fullName = 'Name must be 70 characters or fewer';

  if (formState.username.trim().length < 3) errors.username = 'Username must be at least 3 characters';
  if (formState.username.trim().length > 40) errors.username = 'Username must be 40 characters or fewer';

  if (formState.phone.trim().length < 8) errors.phone = 'Enter a valid phone number';
  if (formState.phone.trim().length > 20) errors.phone = 'Phone number is too long';

  if (formState.city.trim().length < 2) errors.city = 'City is required';
  if (formState.city.trim().length > 60) errors.city = 'City must be 60 characters or fewer';

  if (formState.neighborhood.trim().length < 2) errors.neighborhood = 'Neighborhood is required';
  if (formState.neighborhood.trim().length > 60) {
    errors.neighborhood = 'Neighborhood must be 60 characters or fewer';
  }

  if (!isValidUrl(formState.avatarUrl.trim())) errors.avatarUrl = 'Profile picture must be a valid URL';

  if (formState.bio.trim().length < 8) errors.bio = 'Bio should be at least 8 characters';
  if (formState.bio.trim().length > 240) errors.bio = 'Bio must be 240 characters or fewer';

  return errors;
};

const buildFormState = (profile: UserProfile): FormState => ({
  fullName: profile.fullName,
  username: profile.username,
  phone: profile.phone,
  city: profile.city,
  neighborhood: profile.neighborhood,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your account details visible on your public profile.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-slate-600" htmlFor="fullName">
              Name
            </label>
            <Input
              id="fullName"
              value={formState.fullName}
              onChange={(e) => onFieldChange('fullName', e.target.value)}
            />
            {errors.fullName ? <p className="text-xs text-red-600">{errors.fullName}</p> : null}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600" htmlFor="username">
              Username
            </label>
            <Input
              id="username"
              value={formState.username}
              onChange={(e) => onFieldChange('username', e.target.value)}
            />
            {errors.username ? <p className="text-xs text-red-600">{errors.username}</p> : null}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600" htmlFor="phone">
              Phone
            </label>
            <Input id="phone" value={formState.phone} onChange={(e) => onFieldChange('phone', e.target.value)} />
            {errors.phone ? <p className="text-xs text-red-600">{errors.phone}</p> : null}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600" htmlFor="city">
              City
            </label>
            <Input id="city" value={formState.city} onChange={(e) => onFieldChange('city', e.target.value)} />
            {errors.city ? <p className="text-xs text-red-600">{errors.city}</p> : null}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600" htmlFor="neighborhood">
              Neighborhood
            </label>
            <Input
              id="neighborhood"
              value={formState.neighborhood}
              onChange={(e) => onFieldChange('neighborhood', e.target.value)}
            />
            {errors.neighborhood ? <p className="text-xs text-red-600">{errors.neighborhood}</p> : null}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600" htmlFor="avatarUrl">
              Profile Picture URL
            </label>
            <Input
              id="avatarUrl"
              value={formState.avatarUrl}
              onChange={(e) => onFieldChange('avatarUrl', e.target.value)}
            />
            {errors.avatarUrl ? <p className="text-xs text-red-600">{errors.avatarUrl}</p> : null}
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs text-slate-600" htmlFor="bio">
              Bio
            </label>
            <Textarea id="bio" value={formState.bio} onChange={(e) => onFieldChange('bio', e.target.value)} />
            {errors.bio ? <p className="text-xs text-red-600">{errors.bio}</p> : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onSubmit} disabled={isSaving || hasErrors}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
