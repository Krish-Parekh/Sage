"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { type LoginValues, loginSchema } from "@/lib/auth/schema";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ onSwitch }: { onSwitch: () => void }) {
	const router = useRouter();
	const form = useForm<LoginValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: "", password: "" },
	});

	async function onSubmit(data: LoginValues) {
		const supabase = createClient();
		const { error } = await supabase.auth.signInWithPassword(data);

		if (error) {
			form.setError("root", { message: error.message });
			return;
		}

		router.push("/");
		router.refresh();
	}

	const { isSubmitting, errors } = form.formState;

	return (
		<div className="space-y-6">
			<AuthHeader
				title="Welcome back"
				subtitle="Log in to pick up your conversations with your documents."
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

				<Button
					type="submit"
					className="h-12 w-full rounded-full text-sm"
					disabled={isSubmitting}
				>
					{isSubmitting ? (
						<>
							<AuthSpinner />
							Logging in…
						</>
					) : (
						"Log in"
					)}
				</Button>
			</form>
			<AuthFooter prompt="No account?" action="Sign up" onSwitch={onSwitch} />
		</div>
	);
}
