"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { AuthSpinner, autofillBlock } from "@/components/auth/auth-shared";
import { UserAvatar } from "@/components/settings/user-avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { SmoothInput } from "@/components/ui/smooth-input";
import { type ProfileValues, profileSchema } from "@/lib/auth/schema";
import { createClient } from "@/lib/supabase/client";

const EMPTY_PROFILE: ProfileValues = { username: "" };

export function SettingsView() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [userId, setUserId] = useState<string | null>(null);
	const [email, setEmail] = useState("");
	const form = useForm<ProfileValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: EMPTY_PROFILE,
	});

	useEffect(() => {
		const supabase = createClient();
		supabase.auth.getUser().then(({ data }) => {
			const u = data.user;
			if (u) {
				setUserId(u.id);
				setEmail(u.email ?? "");
				form.reset({ username: (u.user_metadata?.username as string) ?? "" });
			}
			setLoading(false);
		});
	}, [form]);

	async function onSubmit(data: ProfileValues) {
		const supabase = createClient();
		const { error } = await supabase.auth.updateUser({
			data: { username: data.username },
		});

		if (error) {
			form.setError("root", { message: error.message });
			return;
		}

		form.reset(data);
		router.refresh();
	}

	function handleDiscard() {
		form.reset();
	}

	const { isSubmitting, isDirty, errors } = form.formState;
	const username = form.watch("username");

	return (
		<div className="flex min-h-screen w-full justify-center bg-background px-6 py-10">
			<div className="w-full max-w-2xl space-y-8">
				{/* Header */}
				<div className="space-y-4">
					<Button
						variant="ghost"
						size="sm"
						nativeButton={false}
						className="-ml-1.5 gap-1.5 text-muted-foreground"
						render={<Link href="/" />}
					>
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
						Back to chat
					</Button>
					<div className="flex items-center gap-4">
						<UserAvatar avatarId={userId} name={username} size={64} />
						<div className="space-y-1">
							<h1 className="text-2xl font-semibold tracking-tight">
								Your profile
							</h1>
							<p className="text-sm text-muted-foreground">
								This controls how you appear across the app.
							</p>
						</div>
					</div>
				</div>

				<form
					onSubmit={form.handleSubmit(onSubmit)}
					noValidate
					className="space-y-6"
				>
					{/* Identity */}
					<section className="rounded-2xl border border-border bg-card">
						<div className="space-y-4 p-6">
							<div className="space-y-1">
								<h2 className="text-sm font-medium">Identity</h2>
								<p className="text-sm text-muted-foreground">
									How your name shows up in the app.
								</p>
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								<Controller
									name="username"
									control={form.control}
									render={({ field, fieldState }) => (
										<Field data-invalid={fieldState.invalid || undefined}>
											<FieldLabel htmlFor={field.name}>Display name</FieldLabel>
											<SmoothInput
												{...field}
												{...autofillBlock}
												id={field.name}
												type="text"
												placeholder="alpaca"
												disabled={loading}
												aria-invalid={fieldState.invalid || undefined}
											/>
											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</Field>
									)}
								/>
								<Field>
									<FieldLabel htmlFor="email">Email</FieldLabel>
									<SmoothInput
										id="email"
										type="email"
										value={email}
										readOnly
										disabled
										aria-label="Email (read-only)"
									/>
								</Field>
							</div>
						</div>
					</section>

					{/* Unsaved-changes toast — slides up only when there are edits */}
					<AnimatePresence>
						{isDirty && (
							<motion.div
								initial={{ y: 24, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								exit={{ y: 24, opacity: 0 }}
								transition={{ type: "spring", stiffness: 400, damping: 32 }}
								className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-6"
							>
								<div className="flex items-center gap-4 rounded-full border border-border bg-card/95 py-2 pr-2 pl-5 shadow-lg backdrop-blur">
									<p
										aria-live="polite"
										className={
											errors.root
												? "text-sm text-destructive"
												: "text-sm text-muted-foreground"
										}
									>
										{errors.root ? errors.root.message : "Unsaved changes"}
									</p>
									<div className="flex gap-2">
										<Button
											type="button"
											variant="ghost"
											onClick={handleDiscard}
											disabled={isSubmitting}
										>
											Discard
										</Button>
										<Button type="submit" disabled={isSubmitting || loading}>
											{isSubmitting ? (
												<>
													<AuthSpinner />
													Saving…
												</>
											) : (
												"Save changes"
											)}
										</Button>
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</form>
			</div>
		</div>
	);
}
