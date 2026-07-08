"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function Navbar() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	async function handleLogout() {
		setLoading(true);
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push("/login");
		router.refresh();
	}

	return (
		<header>
			<div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
				<span className="text-lg font-semibold">Sage</span>
				<Button
					variant="outline"
					size="sm"
					onClick={handleLogout}
					disabled={loading}
				>
					{loading ? "Logging out…" : "Log out"}
				</Button>
			</div>
		</header>
	);
}
