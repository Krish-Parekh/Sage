"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
	AuthHeader,
	AuthSpinner,
	autofillBlock,
} from "@/components/auth/auth-shared";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { SmoothInput } from "@/components/ui/smooth-input";
import {
	type ResetPasswordValues,
	resetPasswordSchema,
} from "@/lib/auth/schema";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
	const router = useRouter();
	const [hasSession, setHasSession] = useState<boolean | null>(null);
	const form = useForm<ResetPasswordValues>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: { password: "", confirmPassword: "" },
	});

	useEffect(() => {
		const supabase = createClient();
		supabase.auth
			.getSession()
			.then(({ data }) => setHasSession(Boolean(data.session)));
	}, []);

	async function onSubmit(data: ResetPasswordValues) {
		const supabase = createClient();
		const { error } = await supabase.auth.updateUser({
			password: data.password,
		});

		if (error) {
			form.setError("root", { message: error.message });
			return;
		}

		router.push("/");
		router.refresh();
	}

	const { isSubmitting, errors } = form.formState;

	if (hasSession === false) {
		return (
			<div className="space-y-6">
				<AuthHeader
					title="This link has expired"
					subtitle="Password reset links can only be used once, and they don't last forever. Request a fresh one to continue."
				/>
				<Link
					href="/forgot-password"
					className={buttonVariants({
						className: "h-12 w-full rounded-full text-sm",
					})}
				>
					Request a new link
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<AuthHeader
				title="Set a new password"
				subtitle="Choose a new password for your account."
			/>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				autoComplete="off"
				noValidate
				className="space-y-4"
			>
				<FieldGroup className="gap-4">
					<Controller
						name="password"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid || undefined}>
								<FieldLabel htmlFor={field.name}>New password</FieldLabel>
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
					<Controller
						name="confirmPassword"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid || undefined}>
								<FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
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

				<Button
					type="submit"
					className="h-12 w-full rounded-full text-sm"
					disabled={isSubmitting || hasSession === null}
				>
					{isSubmitting ? (
						<>
							<AuthSpinner />
							Updating…
						</>
					) : (
						"Update password"
					)}
				</Button>
			</form>
		</div>
	);
}
