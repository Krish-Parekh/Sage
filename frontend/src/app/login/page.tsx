"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleLogin(event: React.FormEvent) {
		event.preventDefault();
		setError(null);
		setLoading(true);

		const supabase = createClient();
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		setLoading(false);
		if (error) {
			setError(error.message);
			return;
		}

		router.push("/");
		router.refresh();
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
				<h1 className="text-2xl font-semibold">Log in</h1>

				<Input
					type="email"
					placeholder="Email"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					required
				/>
				<Input
					type="password"
					placeholder="Password"
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					required
				/>

				{error && <p className="text-sm text-red-500">{error}</p>}

				<Button type="submit" className="w-full" disabled={loading}>
					{loading ? "Logging in…" : "Log in"}
				</Button>

				<p className="text-center text-sm text-muted-foreground">
					No account?{" "}
					<Link href="/signup" className="underline">
						Sign up
					</Link>
				</p>
			</form>
		</div>
	);
}
