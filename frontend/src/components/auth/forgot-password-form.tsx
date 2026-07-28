"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
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
import {
	type ForgotPasswordValues,
	forgotPasswordSchema,
} from "@/lib/auth/schema";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
	const [message, setMessage] = useState<string | null>(null);
	const form = useForm<ForgotPasswordValues>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: { email: "" },
	});

	async function onSubmit(data: ForgotPasswordValues) {
		setMessage(null);

		const supabase = createClient();
		const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
			redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
		});

		if (error) {
			form.setError("root", { message: error.message });
			return;
		}

		setMessage("If that email has an account, a reset link is on its way.");
	}

	const { isSubmitting, errors } = form.formState;

	return (
		<div className="space-y-6">
			<AuthHeader
				title="Forgot your password?"
				subtitle="Enter your email and we'll send you a link to set a new one."
			/>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				autoComplete="off"
				noValidate
				className="space-y-4"
			>
				<FieldGroup className="gap-4">
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
							Sending link…
						</>
					) : (
						"Send reset link"
					)}
				</Button>
			</form>
			<p className="text-center text-sm text-muted-foreground">
				Remembered it?{" "}
				<Link
					href="/login"
					className="font-medium text-foreground underline-offset-4 hover:underline"
				>
					Log in
				</Link>
			</p>
		</div>
	);
}
