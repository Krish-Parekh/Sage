"use client";

import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import type { ReactNode } from "react";

export const autofillBlock = {
	autoComplete: "off" as const,
	"data-1p-ignore": true,
	"data-lpignore": "true",
	"data-bwignore": true,
	"data-form-type": "other",
};

export function AuthShell({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-screen w-full">
			<div className="relative hidden overflow-hidden bg-muted lg:block lg:w-1/2">
				<Image
					src="/login.png"
					alt=""
					fill
					priority
					sizes="50vw"
					className="object-cover object-center"
				/>
			</div>

			<div className="flex w-full items-center justify-center bg-card p-6 lg:w-1/2">
				<div className="w-full max-w-sm">{children}</div>
			</div>
		</div>
	);
}

export function AuthHeader({
	title,
	subtitle,
}: {
	title: string;
	subtitle: string;
}) {
	return (
		<div className="space-y-2">
			<h1 className="text-2xl font-semibold tracking-tight text-balance text-foreground">
				{title}
			</h1>
			<p className="text-sm leading-relaxed text-muted-foreground">
				{subtitle}
			</p>
		</div>
	);
}

export function AuthFooter({
	prompt,
	action,
	onSwitch,
}: {
	prompt: string;
	action: string;
	onSwitch: () => void;
}) {
	return (
		<p className="text-center text-sm text-muted-foreground">
			{prompt}{" "}
			<button
				type="button"
				onClick={onSwitch}
				className="font-medium text-foreground underline-offset-4 hover:underline"
			>
				{action}
			</button>
		</p>
	);
}

export function AuthSpinner() {
	return (
		<HugeiconsIcon
			icon={Loading03Icon}
			className="size-4 animate-spin"
			aria-hidden
		/>
	);
}
