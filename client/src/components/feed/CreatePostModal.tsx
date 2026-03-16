import { ChangeEvent, FormEvent, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import styles from './CreatePostModal.module.css';

type CreatePostPayload = {
  title: string;
  short_description: string;
  content: string;
  label: string;
  location: string;
  image: File | null;
};

type CreatePostModalProps = {
  open: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: CreatePostPayload) => Promise<boolean>;
};

const LABEL_OPTIONS = ['Emergency', 'Community', 'Help Needed', 'Service', 'Utilities', 'Events', 'Marketplace'];

const INITIAL_STATE: CreatePostPayload = {
  title: '',
  short_description: '',
  content: '',
  label: 'Community',
  location: '',
  image: null,
};

export const CreatePostModal = ({ open, submitting, error, onClose, onSubmit }: CreatePostModalProps) => {
  const [formState, setFormState] = useState<CreatePostPayload>(INITIAL_STATE);

  if (!open) {
    return null;
  }

  const handleTextChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormState((previous) => ({ ...previous, [name]: value }));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFormState((previous) => ({ ...previous, image: file }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isSuccess = await onSubmit(formState);

    if (isSuccess) {
      setFormState(INITIAL_STATE);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Create post</h3>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Title</span>
            <input
              name="title"
              value={formState.title}
              onChange={handleTextChange}
              className={styles.input}
              placeholder="Post title"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Short description</span>
            <textarea
              name="short_description"
              value={formState.short_description}
              onChange={handleTextChange}
              className={styles.textarea}
              rows={2}
              placeholder="Add a short summary"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Content</span>
            <textarea
              name="content"
              value={formState.content}
              onChange={handleTextChange}
              className={styles.textarea}
              rows={4}
              placeholder="Share full details"
              required
            />
          </label>

          <div className={styles.gridTwo}>
            <label className={styles.field}>
              <span className={styles.label}>Label</span>
              <select name="label" value={formState.label} onChange={handleTextChange} className={styles.input}>
                {LABEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Location</span>
              <input
                name="location"
                value={formState.location}
                onChange={handleTextChange}
                className={styles.input}
                placeholder="Neighborhood"
              />
            </label>
          </div>

          <label className={styles.uploadBox}>
            <input type="file" className={styles.hiddenFile} accept="image/*" onChange={handleImageChange} />
            <ImagePlus size={16} />
            <span>{formState.image ? formState.image.name : 'Upload image'}</span>
          </label>

          {error ? <p className={styles.errorText}>{error}</p> : null}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton} disabled={submitting}>
              {submitting ? <Loader2 size={14} className={styles.spin} /> : null}
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export type { CreatePostPayload };