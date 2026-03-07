import { z } from 'zod';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const PHONE_PATTERN = /^(?:\+88|88)?01[3-9]\d{8}$/;

export const signUpSchema = z
	.object({
		firstName: z.string().trim().min(1, 'First name is required.'),
		lastName: z.string().trim().min(1, 'Last name is required.'),
		username: z
			.string()
			.trim()
			.min(3, 'Username must be at least 3 characters.')
			.max(30, 'Username must be 30 characters or less.')
			.regex(/^[a-zA-Z0-9_.-]+$/, 'Use letters, numbers, dot, underscore, or hyphen only.'),
		email: z.email('Enter a valid email address.'),
		phone: z
			.string()
			.trim()
			.min(1, 'Phone number is required.')
			.regex(PHONE_PATTERN, 'Enter a valid phone number.'),
		city: z.string().trim().min(1, 'City is required.'),
		neighborhood: z.string().trim().min(1, 'Neighborhood is required.'),
		password: z
			.string()
			.min(8, 'Password must be at least 8 characters.')
			.regex(
				PASSWORD_PATTERN,
				'Password must include uppercase, lowercase, number, and special character.',
			),
		confirmPassword: z.string().min(1, 'Please confirm your password.'),
		bio: z
			.string()
			.max(180, 'Bio must be 180 characters or less.')
			.optional()
			.or(z.literal('')),
		profilePicture: z
			.custom<FileList | null>((value) => value === null || value instanceof FileList)
			.optional(),
	})
	.refine((values) => values.password === values.confirmPassword, {
		path: ['confirmPassword'],
		message: 'Passwords do not match.',
	});

export type SignUpSchema = z.infer<typeof signUpSchema>;
