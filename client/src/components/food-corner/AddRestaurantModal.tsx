import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createRestaurant, RestaurantApiError } from '@/api/restaurantApi';
import { RestaurantForm, type RestaurantFormValues } from './RestaurantForm';

interface AddRestaurantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export const AddRestaurantModal = ({ open, onOpenChange, onCreated }: AddRestaurantModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [onOpenChange, open]);

  const handleSubmit = async (values: RestaurantFormValues) => {
    setIsSubmitting(true);

    try {
      await createRestaurant(values);
      toast.success(`${values.name} submitted for review!`);
      onOpenChange(false);
      onCreated?.();
    } catch (error) {
      const message =
        error instanceof RestaurantApiError
          ? error.status === 401
            ? 'Please sign in first. Restaurant requests need a logged-in account.'
            : error.status === 422
              ? Object.values(error.data?.errors ?? {}).flat()[0] || error.message
              : error.message
          : 'Could not submit your restaurant. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-0 shadow-xl">
        <div className="fc-sheen">
          <DialogHeader className="px-6 pb-2 pt-6">
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Add your restaurant
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Promote your food place to neighbors. Listings appear after admin approval.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[70vh] px-6 pb-6">
            <RestaurantForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
