"use client";

import Image from "next/image";
import { useState } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";

type Mode = "login" | "signup";

export function AuthView({ initialMode }: { initialMode: Mode }) {
	const [mode, setMode] = useState<Mode>(initialMode);

	function switchTo(next: Mode) {
		setMode(next);
		window.history.replaceState(null, "", `/${next}`);
	}

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
				<div className="w-full max-w-sm">
					{mode === "login" ? (
						<LoginForm onSwitch={() => switchTo("signup")} />
					) : (
						<SignupForm onSwitch={() => switchTo("login")} />
					)}
				</div>
			</div>
		</div>
	);
}
