"use client";

import { GradientAvatar } from "@outpacelabs/avatars";

import { cn } from "@/lib/utils";

type UserAvatarProps = {
	/** Seed for the generated gradient — pass the user's account id. */
	avatarId?: string | null;
	name?: string | null;
	/** Rendered size in pixels. */
	size?: number;
	/** Corner radius: number = px, string = CSS length. Default: full circle. */
	radius?: number | string;
	className?: string;
};

// Renders the user's avatar as a deterministic mesh gradient
// (@outpacelabs/avatars) seeded by their account id, falling back to an initial
// circle while the id is still loading.
export function UserAvatar({
	avatarId,
	name,
	size = 36,
	radius = "9999px",
	className,
}: UserAvatarProps) {
	if (avatarId) {
		return (
			<GradientAvatar
				seed={avatarId}
				size={size}
				radius={radius}
				className={cn("shrink-0", className)}
			/>
		);
	}

	const initial = (name ?? "?").charAt(0).toUpperCase();
	return (
		<span
			className={cn(
				"flex shrink-0 items-center justify-center bg-sidebar-primary font-medium text-sidebar-primary-foreground",
				className,
			)}
			style={{
				width: size,
				height: size,
				fontSize: size * 0.4,
				borderRadius: radius,
			}}
		>
			{initial}
		</span>
	);
}
