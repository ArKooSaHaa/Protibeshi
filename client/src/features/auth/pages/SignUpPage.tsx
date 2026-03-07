import { useEffect } from 'react';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes.config';
import { SignUpForm } from '../components/SignUpForm';
import { useSignUp } from '../hooks/useSignUp';

export const SignUpPage = () => {
	const signUp = useSignUp();
	const navigate = useNavigate();

	useEffect(() => {
		if (signUp.status === 'redirect') {
			navigate(ROUTES.FEED, { replace: true });
		}
	}, [navigate, signUp.status]);

	return (
		<LazyMotion features={domAnimation}>
			<m.main
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.45, ease: 'easeOut' }}
				className="h-screen overflow-hidden bg-linear-to-br from-slate-100 via-slate-50 to-emerald-50"
			>
				<section className="relative h-full overflow-hidden">
					<aside className="relative hidden overflow-hidden bg-linear-to-br from-slate-900 to-slate-700 p-12 text-white lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:h-screen lg:w-[55vw] lg:flex-col lg:justify-between">
						<div className="absolute inset-0 opacity-30">
							<div className="absolute left-10 top-12 h-28 w-28 rounded-3xl border border-white/30 bg-white/10" />
							<div className="absolute bottom-20 left-24 h-20 w-20 rounded-full border border-white/20 bg-white/10" />
							<div className="absolute right-20 top-32 h-24 w-24 rounded-full border border-white/20 bg-emerald-300/15" />
							<div className="absolute bottom-12 right-12 h-36 w-36 rounded-4xl border border-white/20 bg-white/5" />
						</div>

						<m.div
							className="absolute left-10 top-12 h-28 w-28 rounded-3xl border border-white/30 bg-white/10"
							animate={{ y: [0, -16, 0], rotate: [0, 4, 0] }}
							transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
						/>
						<m.div
							className="absolute bottom-20 left-24 h-20 w-20 rounded-full border border-white/20 bg-white/10"
							animate={{ y: [0, 10, 0], x: [0, 8, 0] }}
							transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }}
						/>
						<m.div
							className="absolute right-20 top-32 h-24 w-24 rounded-full border border-white/20 bg-emerald-300/20"
							animate={{ y: [0, -12, 0], x: [0, -8, 0] }}
							transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
						/>

						<div className="relative z-10 max-w-md space-y-6">
							<p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">Protibeshi</p>
							<h1 className="font-['Sora','Manrope','Segoe_UI',sans-serif] text-5xl font-semibold leading-tight tracking-tight">
								Build trust with your neighborhood
							</h1>
							<p className="text-lg leading-relaxed text-slate-200">
								Join local conversations, find verified services, and coordinate help faster with people nearby.
							</p>
						</div>

						<div className="relative z-10 mt-8 max-w-sm rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
							<p className="text-sm text-slate-100">Trusted onboarding for communities that need speed, safety, and clarity.</p>
						</div>
					</aside>

					<div className="flex h-screen w-full items-start justify-center overflow-y-auto overscroll-contain px-5 py-8 sm:px-8 lg:ml-[55vw] lg:w-[45vw] lg:px-10">
						<div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
							<SignUpForm signUp={signUp} />
						</div>
					</div>
				</section>
			</m.main>
		</LazyMotion>
	);
};
