"use client";

import { useState } from "react";

import { AuthShell } from "@/components/auth/auth-shared";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";

type Mode = "login" | "signup";

export function AuthView({
	initialMode,
	error,
}: {
	initialMode: Mode;
	error?: string;
}) {
	const [mode, setMode] = useState<Mode>(initialMode);

	function switchTo(next: Mode) {
		setMode(next);
		window.history.replaceState(null, "", `/${next}`);
	}

	return (
		<AuthShell>
			{mode === "login" ? (
				<LoginForm onSwitch={() => switchTo("signup")} error={error} />
			) : (
				<SignupForm onSwitch={() => switchTo("login")} />
			)}
		</AuthShell>
	);
}
