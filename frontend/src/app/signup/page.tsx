"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSignup(event: React.FormEvent) {
		event.preventDefault();
		setError(null);
		setMessage(null);
		setLoading(true);

		const supabase = createClient();
		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				// username lands in raw_user_meta_data; the handle_new_user
				// trigger copies it into public.profiles.
				data: { username },
				emailRedirectTo: `${window.location.origin}/auth/confirm`,
			},
		});

		setLoading(false);
		if (error) {
			setError(error.message);
			return;
		}

		setMessage("Check your email to confirm your account, then log in.");
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<form onSubmit={handleSignup} className="w-full max-w-sm space-y-4">
				<h1 className="text-2xl font-semibold">Sign up</h1>

				<Input
					type="text"
					placeholder="Username"
					value={username}
					onChange={(event) => setUsername(event.target.value)}
					required
				/>
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
				{message && <p className="text-sm text-green-600">{message}</p>}

				<Button type="submit" className="w-full" disabled={loading}>
					{loading ? "Signing up…" : "Sign up"}
				</Button>

				<p className="text-center text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link href="/login" className="underline">
						Log in
					</Link>
				</p>
			</form>
		</div>
	);
}
