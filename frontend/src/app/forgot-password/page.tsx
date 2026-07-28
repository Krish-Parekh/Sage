import { AuthShell } from "@/components/auth/auth-shared";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
	return (
		<AuthShell>
			<ForgotPasswordForm />
		</AuthShell>
	);
}
