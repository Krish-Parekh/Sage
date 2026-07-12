"use client";

import {
	Logout01Icon,
	Settings01Icon,
	UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { UserAvatar } from "@/components/settings/user-avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/client";

type User = { id: string; name: string; email: string };

export function NavUser() {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		const supabase = createClient();
		supabase.auth.getUser().then(({ data }) => {
			const u = data.user;
			if (!u) return;
			setUser({
				id: u.id,
				name: (u.user_metadata?.username as string) ?? u.email ?? "User",
				email: u.email ?? "",
			});
		});
	}, []);

	async function handleLogout() {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push("/login");
		router.refresh();
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<SidebarMenuButton
								size="lg"
								className="h-auto rounded-xl px-2 py-2 hover:bg-sidebar-accent"
							/>
						}
					>
						<UserAvatar avatarId={user?.id} name={user?.name} />
						<span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
							<span className="truncate text-sm font-medium">
								{user?.name ?? "…"}
							</span>
							<span className="truncate text-xs text-muted-foreground">
								{user?.email}
							</span>
						</span>
						<HugeiconsIcon
							icon={UnfoldMoreIcon}
							className="size-4 shrink-0 text-muted-foreground"
						/>
					</DropdownMenuTrigger>
					<DropdownMenuContent side="top" align="start" className="w-56">
						<DropdownMenuItem render={<Link href="/settings" />}>
							<HugeiconsIcon icon={Settings01Icon} className="size-4" />
							Profile
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={handleLogout}>
							<HugeiconsIcon icon={Logout01Icon} className="size-4" />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
