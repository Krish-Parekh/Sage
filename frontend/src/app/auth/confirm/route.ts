import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
	const { searchParams, origin } = new URL(request.url);
	const token_hash = searchParams.get("token_hash");
	const type = searchParams.get("type") as EmailOtpType | null;
	const code = searchParams.get("code");
	const next = searchParams.get("next") ?? "/";

	function fail(message: string) {
		return NextResponse.redirect(
			`${origin}/login?error=${encodeURIComponent(message)}`,
		);
	}

	const forwardedError =
		searchParams.get("error_description") ?? searchParams.get("error");
	if (forwardedError) {
		return fail(forwardedError);
	}

	const supabase = await createClient();

	if (token_hash && type) {
		const { error } = await supabase.auth.verifyOtp({ type, token_hash });
		return error
			? fail(error.message)
			: NextResponse.redirect(`${origin}${next}`);
	}

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		return error
			? fail(error.message)
			: NextResponse.redirect(`${origin}${next}`);
	}

	return fail("Could not confirm email");
}
