import { z } from "zod";

export const loginSchema = z.object({
	email: z.string().trim().email("Enter a valid email"),
	password: z.string().min(1, "Enter your password"),
});

export const signupSchema = z.object({
	username: z.string().trim().min(1, "Choose a username"),
	email: z.string().trim().email("Enter a valid email"),
	password: z.string().min(6, "At least 6 characters"),
});

export const profileSchema = z.object({
	username: z.string().trim().min(1, "Choose a username"),
});

export const forgotPasswordSchema = z.object({
	email: z.string().trim().email("Enter a valid email"),
});

export const resetPasswordSchema = z
	.object({
		password: z.string().min(6, "At least 6 characters"),
		confirmPassword: z.string().min(1, "Confirm your password"),
	})
	.refine((values) => values.password === values.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
