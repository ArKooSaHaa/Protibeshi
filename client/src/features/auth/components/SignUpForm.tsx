import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, LocateFixed, LockKeyhole, UploadCloud } from 'lucide-react';
import { m } from 'framer-motion';
import { ENV } from '@/config/env';
import {
	loadGoogleMapsPlaces,
	reverseGeocode,
	resolveCityFromPlace,
	resolveNeighborhoodFromPlace,
	type GoogleMapsAutocompleteListener,
	type GooglePlaceResult,
} from '@/lib/googleMaps';
import { ROUTES } from '@/config/routes.config';
import { PasswordStrength } from './PasswordStrength';
import type { useSignUp } from '../hooks/useSignUp';

type SignUpFormProps = {
	signUp: ReturnType<typeof useSignUp>;
};

const INPUT_CLASS =
	'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30';

const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-slate-700';
const ERROR_CLASS = 'mt-1 text-xs text-rose-600';

type LocationFeedback = {
	tone: 'info' | 'success' | 'error';
	text: string;
};

export const SignUpForm = ({ signUp }: SignUpFormProps) => {
	const {
		register,
		setValue,
		trigger,
		formState: { errors, isValid },
	} = signUp.form;

	const mapsApiKey = ENV.GOOGLE_MAPS_API_KEY;
	const [isLocationLoading, setIsLocationLoading] = useState(false);
	const [locationFeedback, setLocationFeedback] = useState<LocationFeedback | null>(null);
	const neighborhoodInputRef = useRef<HTMLInputElement | null>(null);
	const autocompleteListenerRef = useRef<GoogleMapsAutocompleteListener | null>(null);

	const neighborhoodRegistration = register('neighborhood');

	const applyPlaceToAddressFields = useCallback((place: GooglePlaceResult): boolean => {
		const neighborhood = resolveNeighborhoodFromPlace(place);
		const city = resolveCityFromPlace(place);
		let hasUpdatedFields = false;

		if (city) {
			setValue('city', city, { shouldDirty: true, shouldValidate: true });
			hasUpdatedFields = true;
		}

		if (neighborhood) {
			setValue('neighborhood', neighborhood, { shouldDirty: true, shouldValidate: true });
			hasUpdatedFields = true;
		} else if (place.formatted_address?.trim()) {
			setValue('neighborhood', place.formatted_address.trim(), { shouldDirty: true, shouldValidate: true });
			hasUpdatedFields = true;
		}

		if (hasUpdatedFields) {
			void trigger(['city', 'neighborhood']);
		}

		return hasUpdatedFields;
	}, [setValue, trigger]);

	useEffect(() => {
		if (!mapsApiKey) {
			setLocationFeedback({
				tone: 'info',
				text: 'Location suggestions are unavailable because Google Maps is not configured.',
			});
			return;
		}

		if (!neighborhoodInputRef.current) {
			return;
		}

		let cancelled = false;

		const setupAutocomplete = async () => {
			try {
				const mapsApi = await loadGoogleMapsPlaces(mapsApiKey);

				if (cancelled || !neighborhoodInputRef.current) {
					return;
				}

				const autocomplete = new mapsApi.maps.places.Autocomplete(neighborhoodInputRef.current, {
					fields: ['address_components', 'formatted_address', 'name'],
					types: ['geocode'],
				});

				autocompleteListenerRef.current = autocomplete.addListener('place_changed', () => {
					const place = autocomplete.getPlace();
					const hasUpdate = applyPlaceToAddressFields(place);

					if (hasUpdate) {
						setLocationFeedback({
							tone: 'success',
							text: 'Neighborhood and city were filled from Google Maps.',
						});
					}
				});
			} catch {
				if (!cancelled) {
					setLocationFeedback({
						tone: 'error',
						text: 'Unable to load Google Maps suggestions right now.',
					});
				}
			}
		};

		void setupAutocomplete();

		return () => {
			cancelled = true;
			autocompleteListenerRef.current?.remove();
			autocompleteListenerRef.current = null;
		};
	}, [applyPlaceToAddressFields, mapsApiKey]);

	const handleShareCurrentLocation = async () => {
		if (!mapsApiKey) {
			setLocationFeedback({
				tone: 'error',
				text: 'Google Maps API key is missing. Please configure it first.',
			});
			return;
		}

		if (!navigator.geolocation) {
			setLocationFeedback({
				tone: 'error',
				text: 'Geolocation is not supported in this browser.',
			});
			return;
		}

		setIsLocationLoading(true);
		setLocationFeedback(null);

		try {
			const mapsApi = await loadGoogleMapsPlaces(mapsApiKey);
			const coordinates = await new Promise<{ lat: number; lng: number }>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(
					(position) => {
						resolve({
							lat: position.coords.latitude,
							lng: position.coords.longitude,
						});
					},
					() => reject(new Error('Unable to access current location.')),
					{
						enableHighAccuracy: true,
						timeout: 10000,
						maximumAge: 30000,
					},
				);
			});

			const place = await reverseGeocode(mapsApi, coordinates);
			const hasUpdate = applyPlaceToAddressFields(place);

			if (!hasUpdate) {
				setLocationFeedback({
					tone: 'error',
					text: 'Could not derive neighborhood from your current location.',
				});
				return;
			}

			setLocationFeedback({
				tone: 'success',
				text: 'Current location shared. Neighborhood and city are now filled.',
			});
		} catch {
			setLocationFeedback({
				tone: 'error',
				text: 'Unable to share your location right now. Please try again.',
			});
		} finally {
			setIsLocationLoading(false);
		}
	};

	return (
		<div className="space-y-6 text-slate-800">
			<header className="mb-6 space-y-2">
				<p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Get Started</p>
				<h1 className="font-['Sora','Manrope','Segoe_UI',sans-serif] text-3xl font-semibold tracking-tight text-slate-900">
					Create your Protibeshi account
				</h1>
				<p className="text-sm text-slate-600">A neighborhood-first network for trusted local living</p>
			</header>

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
					<input
						id="signup-neighborhood"
						className={INPUT_CLASS}
						autoComplete="off"
						placeholder="Search your neighborhood"
						{...neighborhoodRegistration}
						ref={(element) => {
							neighborhoodRegistration.ref(element);
							neighborhoodInputRef.current = element;
						}}
					/>
					<div className="mt-2 flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={() => void handleShareCurrentLocation()}
							disabled={isLocationLoading}
							className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-70"
						>
							<LocateFixed size={13} aria-hidden="true" />
							{isLocationLoading ? 'Sharing location...' : 'Share current location'}
						</button>
						<span className="text-xs text-slate-500">Pick from Google Maps suggestions or share your live location.</span>
					</div>
					{locationFeedback ? (
						<p
							className={`mt-1 text-xs ${
								locationFeedback.tone === 'success'
									? 'text-emerald-600'
									: locationFeedback.tone === 'error'
										? 'text-rose-600'
										: 'text-slate-500'
							}`}
						>
							{locationFeedback.text}
						</p>
					) : null}
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
