import { AuthShell } from "@/components/auth/auth-shared";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
	return (
		<AuthShell>
			<ResetPasswordForm />
		</AuthShell>
	);
}
