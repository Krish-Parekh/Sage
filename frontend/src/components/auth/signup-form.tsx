"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
	AuthFooter,
	AuthHeader,
	AuthSpinner,
	autofillBlock,
} from "@/components/auth/auth-shared";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { SmoothInput } from "@/components/ui/smooth-input";
import { type SignupValues, signupSchema } from "@/lib/auth/schema";
import { createClient } from "@/lib/supabase/client";

export function SignupForm({ onSwitch }: { onSwitch: () => void }) {
	const [message, setMessage] = useState<string | null>(null);
	const form = useForm<SignupValues>({
		resolver: zodResolver(signupSchema),
		defaultValues: { username: "", email: "", password: "" },
	});

	async function onSubmit(data: SignupValues) {
		setMessage(null);

		const supabase = createClient();
		const { error } = await supabase.auth.signUp({
			email: data.email,
			password: data.password,
			options: {
				data: { username: data.username },
				emailRedirectTo: `${window.location.origin}/auth/confirm`,
			},
		});

		if (error) {
			form.setError("root", { message: error.message });
			return;
		}

		setMessage("Check your email to confirm your account, then log in.");
	}

	const { isSubmitting, errors } = form.formState;

	return (
		<div className="space-y-6">
			<AuthHeader
				title="Create your account"
				subtitle="Sign up to start chatting with your documents."
			/>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				autoComplete="off"
				noValidate
				className="space-y-4"
			>
				<FieldGroup className="gap-4">
					<Controller
						name="username"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid || undefined}>
								<FieldLabel htmlFor={field.name}>Username</FieldLabel>
								<SmoothInput
									{...field}
									{...autofillBlock}
									id={field.name}
									type="text"
									placeholder="alpaca"
									aria-invalid={fieldState.invalid || undefined}
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						name="email"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid || undefined}>
								<FieldLabel htmlFor={field.name}>Email</FieldLabel>
								<SmoothInput
									{...field}
									{...autofillBlock}
									id={field.name}
									type="email"
									placeholder="you@example.com"
									aria-invalid={fieldState.invalid || undefined}
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						name="password"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid || undefined}>
								<FieldLabel htmlFor={field.name}>Password</FieldLabel>
								<SmoothInput
									{...field}
									{...autofillBlock}
									id={field.name}
									type="password"
									placeholder="••••••••"
									autoComplete="new-password"
									aria-invalid={fieldState.invalid || undefined}
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
				</FieldGroup>

				{errors.root && (
					<p aria-live="polite" className="text-sm text-destructive">
						{errors.root.message}
					</p>
				)}
				{message && (
					<p aria-live="polite" className="text-sm text-brand-blue">
						{message}
					</p>
				)}

				<Button
					type="submit"
					className="h-12 w-full rounded-full text-sm"
					disabled={isSubmitting}
				>
					{isSubmitting ? (
						<>
							<AuthSpinner />
							Signing up…
						</>
					) : (
						"Sign up"
					)}
				</Button>
			</form>
			<AuthFooter
				prompt="Already have an account?"
				action="Log in"
				onSwitch={onSwitch}
			/>
		</div>
	);
}
