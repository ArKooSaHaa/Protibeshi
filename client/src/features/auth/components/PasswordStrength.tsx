import { Check, Circle } from 'lucide-react';
import { m } from 'framer-motion';

type PasswordChecks = {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
};

type PasswordStrengthProps = {
  level: 'weak' | 'medium' | 'strong';
  checks: PasswordChecks;
};

const LEVEL_STYLES = {
  weak: {
    label: 'Weak',
    color: 'bg-rose-500',
    text: 'text-rose-600',
    width: '33%',
  },
  medium: {
    label: 'Medium',
    color: 'bg-amber-500',
    text: 'text-amber-600',
    width: '66%',
  },
  strong: {
    label: 'Strong',
    color: 'bg-emerald-500',
    text: 'text-emerald-600',
    width: '100%',
  },
} as const;

const CHECK_LABELS: Array<{ key: keyof PasswordChecks; label: string }> = [
  { key: 'minLength', label: '8 characters' },
  { key: 'uppercase', label: 'Uppercase letter' },
  { key: 'lowercase', label: 'Lowercase letter' },
  { key: 'number', label: 'Number' },
  { key: 'special', label: 'Special character' },
];

export const PasswordStrength = ({ level, checks }: PasswordStrengthProps) => {
  const style = LEVEL_STYLES[level];

  return (
    <div className="space-y-3 rounded-lg bg-gray-50 p-3 text-sm">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">Password Strength</span>
        <span className={`font-semibold ${style.text}`}>{style.label}</span>
      </div>

      <div className="h-2 rounded-full bg-slate-200/90">
        <m.div
          className={`h-2 rounded-full ${style.color}`}
          initial={{ width: 0 }}
          animate={{ width: style.width }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        />
      </div>

      <ul className="grid gap-1 text-xs text-slate-700 sm:grid-cols-2">
        {CHECK_LABELS.map((item) => (
          <li key={item.key} className="inline-flex items-center gap-1.5">
            {checks[item.key] ? (
              <Check size={14} className="text-emerald-600" aria-hidden="true" />
            ) : (
              <Circle size={14} className="text-slate-400" aria-hidden="true" />
            )}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
