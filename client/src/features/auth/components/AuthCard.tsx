import type { ReactNode } from 'react';
import { m } from 'framer-motion';

type AuthCardProps = {
	children: ReactNode;
};

export const AuthCard = ({ children }: AuthCardProps) => {
	return (
		<m.section
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.45, ease: 'easeOut' }}
			className="rounded-2xl border border-emerald-200/70 bg-white/70 p-5 shadow-xl shadow-slate-900/10 backdrop-blur-md sm:p-6"
		>
			{children}
		</m.section>
	);
};
