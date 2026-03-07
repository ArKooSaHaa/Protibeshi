import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, LockKeyhole, UploadCloud } from 'lucide-react';
import { m } from 'framer-motion';
import { ROUTES } from '@/config/routes.config';
import { SocialLoginButtons } from './SocialLoginButtons';
import { PasswordStrength } from './PasswordStrength';
import type { useSignUp } from '../hooks/useSignUp';

type SignUpFormProps = {
	signUp: ReturnType<typeof useSignUp>;
};

const INPUT_CLASS =
	'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30';

const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-slate-700';
const ERROR_CLASS = 'mt-1 text-xs text-rose-600';

export const SignUpForm = ({ signUp }: SignUpFormProps) => {
	const {
		register,
		formState: { errors, isValid },
	} = signUp.form;

	return (
		<div className="space-y-6 text-slate-800">
			<header className="mb-6 space-y-2">
				<p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Get Started</p>
				<h1 className="font-['Sora','Manrope','Segoe_UI',sans-serif] text-3xl font-semibold tracking-tight text-slate-900">
					Create your Protibeshi account
				</h1>
				<p className="text-sm text-slate-600">A neighborhood-first network for trusted local living</p>
			</header>

			<div className="space-y-3">
				<SocialLoginButtons mode="signup" disabled={signUp.isSubmitting} />
			</div>

			<div className="relative py-1 text-center text-[11px] font-semibold tracking-[0.16em] text-slate-500">
				<span className="relative z-10 bg-white px-2">OR SIGN UP WITH EMAIL</span>
				<span className="absolute inset-x-0 top-1/2 z-0 h-px -translate-y-1/2 bg-gray-200" aria-hidden="true" />
			</div>

			<form className="space-y-4" onSubmit={signUp.onSubmit} noValidate>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label className={LABEL_CLASS} htmlFor="signup-first-name">
							First Name
						</label>
						<input id="signup-first-name" className={INPUT_CLASS} {...register('firstName')} />
						{errors.firstName ? <p className={ERROR_CLASS}>{errors.firstName.message}</p> : null}
					</div>

					<div>
						<label className={LABEL_CLASS} htmlFor="signup-last-name">
							Last Name
						</label>
						<input id="signup-last-name" className={INPUT_CLASS} {...register('lastName')} />
						{errors.lastName ? <p className={ERROR_CLASS}>{errors.lastName.message}</p> : null}
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label className={LABEL_CLASS} htmlFor="signup-username">
							Username
						</label>
						<input id="signup-username" className={INPUT_CLASS} {...register('username')} />
						{errors.username ? <p className={ERROR_CLASS}>{errors.username.message}</p> : null}
					</div>

					<div>
						<label className={LABEL_CLASS} htmlFor="signup-email">
							Email
						</label>
						<input
							id="signup-email"
							type="email"
							autoComplete="email"
							className={INPUT_CLASS}
							{...register('email')}
						/>
						{errors.email ? <p className={ERROR_CLASS}>{errors.email.message}</p> : null}
					</div>
				</div>

				<div>
					<label className={LABEL_CLASS} htmlFor="signup-phone">
						Phone Number
					</label>
					<input
						id="signup-phone"
						type="tel"
						autoComplete="tel"
						placeholder="01XXXXXXXXX"
						className={INPUT_CLASS}
						{...register('phone')}
					/>
					{errors.phone ? <p className={ERROR_CLASS}>{errors.phone.message}</p> : null}
				</div>

				<div>
					<label className={LABEL_CLASS} htmlFor="signup-city">
						City
					</label>
					<input id="signup-city" className={INPUT_CLASS} {...register('city')} />
					{errors.city ? <p className={ERROR_CLASS}>{errors.city.message}</p> : null}
				</div>

				<div>
					<label className={LABEL_CLASS} htmlFor="signup-neighborhood">
						Neighborhood
					</label>
					<input id="signup-neighborhood" className={INPUT_CLASS} {...register('neighborhood')} />
					{errors.neighborhood ? <p className={ERROR_CLASS}>{errors.neighborhood.message}</p> : null}
				</div>

				<div>
					<label className={LABEL_CLASS} htmlFor="signup-password">
						Password
					</label>
					<div className="relative">
						<input
							id="signup-password"
							type={signUp.isPasswordVisible ? 'text' : 'password'}
							autoComplete="new-password"
							className={`${INPUT_CLASS} pr-10`}
							{...register('password')}
						/>
						<button
							type="button"
							aria-label={signUp.isPasswordVisible ? 'Hide password' : 'Show password'}
							className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
							onClick={() => signUp.setIsPasswordVisible(!signUp.isPasswordVisible)}
						>
							<LockKeyhole size={16} aria-hidden="true" />
						</button>
					</div>
					{errors.password ? <p className={ERROR_CLASS}>{errors.password.message}</p> : null}
				</div>

				<div>
					<label className={LABEL_CLASS} htmlFor="signup-confirm-password">
						Confirm Password
					</label>
					<div className="relative">
						<input
							id="signup-confirm-password"
							type={signUp.isConfirmPasswordVisible ? 'text' : 'password'}
							autoComplete="new-password"
							className={`${INPUT_CLASS} pr-10`}
							{...register('confirmPassword')}
						/>
						<button
							type="button"
							aria-label={signUp.isConfirmPasswordVisible ? 'Hide confirm password' : 'Show confirm password'}
							className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
							onClick={() => signUp.setIsConfirmPasswordVisible(!signUp.isConfirmPasswordVisible)}
						>
							<LockKeyhole size={16} aria-hidden="true" />
						</button>
					</div>
					{errors.confirmPassword ? <p className={ERROR_CLASS}>{errors.confirmPassword.message}</p> : null}
				</div>

				<PasswordStrength level={signUp.passwordLevel} checks={signUp.passwordChecks} />

				<div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50/60 p-4">
					<h2 className="text-sm font-semibold text-slate-800">Profile Details</h2>

					<div>
						<label className={LABEL_CLASS} htmlFor="signup-profile-picture">
							Profile Picture Upload
						</label>
						<div className="relative">
							<input
								id="signup-profile-picture"
								type="file"
								accept="image/*"
								className={`${INPUT_CLASS} file:mr-3 file:rounded-md file:border-0 file:bg-emerald-100 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-emerald-700`}
								{...register('profilePicture')}
							/>
							<UploadCloud
								size={16}
								aria-hidden="true"
								className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
							/>
						</div>
					</div>

					<div>
						<label className={LABEL_CLASS} htmlFor="signup-bio">
							Short Bio
						</label>
						<textarea
							id="signup-bio"
							rows={3}
							maxLength={180}
							className={INPUT_CLASS}
							placeholder="Tell your neighbors a bit about you"
							{...register('bio')}
						/>
						{errors.bio ? <p className={ERROR_CLASS}>{errors.bio.message}</p> : null}
					</div>
				</div>

				{signUp.globalError ? (
					<p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
						{signUp.globalError}
					</p>
				) : null}

				{signUp.status === 'success' ? (
					<m.div
						initial={{ opacity: 0, scale: 0.85 }}
						animate={{ opacity: 1, scale: 1 }}
						className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
						role="status"
					>
						<m.span initial={{ rotate: -10 }} animate={{ rotate: 0 }} transition={{ type: 'spring' }}>
							<CheckCircle2 size={17} aria-hidden="true" />
						</m.span>
						Account created for {signUp.submittedEmail}. Redirecting...
					</m.div>
				) : null}

				<m.button
					whileHover={{ scale: signUp.isSubmitting ? 1 : 1.02 }}
					whileTap={{ scale: signUp.isSubmitting ? 1 : 0.99 }}
					type="submit"
					disabled={!isValid || signUp.isSubmitting}
					className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:bg-emerald-300"
				>
					{signUp.isSubmitting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
					{signUp.isSubmitting ? 'Creating account...' : 'Create Account'}
				</m.button>
			</form>

			<p className="text-center text-sm text-slate-600">
				Already have an account?{' '}
				<Link
					to={ROUTES.SIGNIN}
					className="font-semibold text-emerald-700 underline-offset-2 transition hover:text-emerald-600 hover:underline"
				>
					Sign in
				</Link>
			</p>
		</div>
	);
};
