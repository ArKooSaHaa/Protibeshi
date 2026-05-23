
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ImageUp, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { restaurantCategories, locationOptions } from './data';
import type { RestaurantCategory } from './types';

export type RestaurantFormValues = {
  name: string;
  owner: string;
  category: RestaurantCategory | '';
  address: string;
  phone: string;
  website: string;
  openingTime: string;
  closingTime: string;
  image: File | null;
  description: string;
  location: string;
};

type RestaurantFormProps = {
  onSubmit: (values: RestaurantFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
};

const initialState: RestaurantFormValues = {
  name: '',
  owner: '',
  category: '',
  address: '',
  phone: '',
  website: '',
  openingTime: '',
  closingTime: '',
  image: null,
  description: '',
  location: '',
};

const imageAccept = 'image/png,image/jpeg,image/jpg,image/webp';

export const RestaurantForm = ({ onSubmit, isSubmitting = false }: RestaurantFormProps) => {
  const [formState, setFormState] = useState(initialState);
  const [touched, setTouched] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const errors = useMemo(() => {
    const next: Partial<Record<keyof RestaurantFormValues, string>> = {};

    if (!formState.name.trim()) next.name = 'Restaurant name is required.';
    if (!formState.category) next.category = 'Select a category.';
    if (!formState.address.trim()) next.address = 'Address is required.';
    if (!formState.phone.trim()) next.phone = 'Contact number is required.';
    if (!formState.description.trim()) next.description = 'Short description is required.';
    
    if (!formState.location) next.location = 'Pick a location.';

    return next;
  }, [formState]);

  const isValid = Object.keys(errors).length === 0;

  const updateField = <K extends keyof RestaurantFormValues>(key: K, value: RestaurantFormValues[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!isValid) {
      return;
    }

    await onSubmit(formState);
    setFormState(initialState);
    setImagePreview(null);
    setTouched(false);
  };

  const showError = (field: keyof RestaurantFormValues) => touched && errors[field];

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="fc-floating-label">
          <Input
            id="restaurant-name"
            placeholder=" "
            className={cn('fc-floating-input', showError('name') ? 'border-rose-300' : '')}
            value={formState.name}
            onChange={(event) => updateField('name', event.target.value)}
          />
          <span>Restaurant Name</span>
          {showError('name') ? <p className="mt-1 text-xs text-rose-500">{errors.name}</p> : null}
        </div>
        <div className="fc-floating-label">
          <Input
            id="owner-name"
            placeholder=" "
            className="fc-floating-input"
            value={formState.owner}
            onChange={(event) => updateField('owner', event.target.value)}
          />
          <span>Owner Name</span>
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold text-slate-600">Restaurant Category</Label>
        <select
          value={formState.category}
          onChange={(e) => updateField('category', e.target.value as RestaurantCategory)}
          className={cn(
            'fc-field mt-2 w-full rounded-md border bg-transparent px-3 py-2 text-sm',
            showError('category') ? 'border-rose-300' : '',
          )}
        >
          <option value="">Select category</option>
          {restaurantCategories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        {showError('category') ? <p className="mt-1 text-xs text-rose-500">{errors.category}</p> : null}
      </div>

      <div className="fc-floating-label">
        <Input
          id="restaurant-address"
          placeholder=" "
          className={cn('fc-floating-input', showError('address') ? 'border-rose-300' : '')}
          value={formState.address}
          onChange={(event) => updateField('address', event.target.value)}
        />
        <span>Address / Area</span>
        {showError('address') ? <p className="mt-1 text-xs text-rose-500">{errors.address}</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="fc-floating-label">
          <Input
            id="contact"
            type="tel"
            placeholder=" "
            className={cn('fc-floating-input', showError('phone') ? 'border-rose-300' : '')}
            value={formState.phone}
            onChange={(event) => updateField('phone', event.target.value)}
          />
          <span className="flex items-center gap-1">
            <Phone size={12} /> Contact Number
          </span>
          {showError('phone') ? <p className="mt-1 text-xs text-rose-500">{errors.phone}</p> : null}
        </div>
        <div className="fc-floating-label">
          <Input
            id="website"
            placeholder=" "
            className="fc-floating-input"
            value={formState.website}
            onChange={(event) => updateField('website', event.target.value)}
          />
          <span>Facebook Page / Website</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="fc-floating-label">
          <Input
            id="opening"
            type="time"
            placeholder=" "
            className="fc-floating-input"
            value={formState.openingTime}
            onChange={(event) => updateField('openingTime', event.target.value)}
          />
          <span>Opening Time</span>
        </div>
        <div className="fc-floating-label">
          <Input
            id="closing"
            type="time"
            placeholder=" "
            className="fc-floating-input"
            value={formState.closingTime}
            onChange={(event) => updateField('closingTime', event.target.value)}
          />
          <span>Closing Time</span>
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold text-slate-600">Location</Label>
        <select
          value={formState.location}
          onChange={(e) => updateField('location', e.target.value)}
          className={cn(
            'fc-field mt-2 w-full rounded-md border bg-transparent px-3 py-2 text-sm',
            showError('location') ? 'border-rose-300' : '',
          )}
        >
          <option value="">Pick neighborhood</option>
          {locationOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        {showError('location') ? <p className="mt-1 text-xs text-rose-500">{errors.location}</p> : null}
      </div>

      <div className="fc-floating-label">
        <Textarea
          id="description"
          placeholder=" "
          className={cn('fc-floating-textarea min-h-[96px]', showError('description') ? 'border-rose-300' : '')}
          value={formState.description}
          onChange={(event) => updateField('description', event.target.value)}
        />
        <span>Short Description</span>
        {showError('description') ? <p className="mt-1 text-xs text-rose-500">{errors.description}</p> : null}
      </div>

      <div className="grid gap-2">
        <Label className="text-xs font-semibold text-slate-600">Upload Restaurant Image</Label>
        <label className="fc-upload-box flex cursor-pointer items-center gap-3 px-4 py-4 text-sm font-medium text-emerald-700">
          <ImageUp size={16} />
          <span>Upload image</span>
          <Input
            type="file"
            accept={imageAccept}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              updateField('image', file);
              if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
              }
              setImagePreview(file ? URL.createObjectURL(file) : null);
            }}
          />
        </label>
        {imagePreview ? (
          <div className="overflow-hidden rounded-xl border border-emerald-100/60">
            <img src={imagePreview} alt="Restaurant preview" className="h-36 w-full object-cover" />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          variant="outline"
          className="w-full gap-2 rounded-xl border-dashed border-emerald-200 bg-emerald-50/40 text-emerald-700 shadow-none hover:bg-emerald-50 hover:text-emerald-800"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Listing'}
        </Button>
        <p className="text-center text-xs text-slate-500">
          Your listing will be reviewed before appearing in the Food Corner.
        </p>
      </div>
    </form>
  );
};
