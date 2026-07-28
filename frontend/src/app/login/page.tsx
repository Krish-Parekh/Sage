import { AuthView } from "@/components/auth/auth-view";

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ error?: string }>;
}) {
	const { error } = await searchParams;

	return <AuthView initialMode="login" error={error} />;
}
