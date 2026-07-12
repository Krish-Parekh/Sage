"use client";

import { Message01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLiveQuery } from "@tanstack/react-db";

import { NavUser } from "@/components/layout/nav-user";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { conversationsCollection } from "@/lib/db/conversations";

type Props = {
	activeThreadId: string;
	onSelect: (threadId: string) => void;
	onNew: () => void;
};

export function AppSidebar({ activeThreadId, onSelect, onNew }: Props) {
	const { data: conversations } = useLiveQuery((q) =>
		q
			.from({ c: conversationsCollection })
			.orderBy(({ c }) => c.updated_at, "desc"),
	);

	return (
		<Sidebar
			collapsible="offcanvas"
			className="border-none [&_[data-slot=sidebar-inner]]:bg-transparent"
		>
			<SidebarHeader className="gap-3 p-3">
				<span className="px-1 text-lg font-semibold tracking-tight">Sage</span>
				<Button
					onClick={onNew}
					className="h-10 w-full justify-start gap-2 rounded-xl text-sm font-medium"
				>
					<HugeiconsIcon icon={PlusSignIcon} className="size-4" />
					New chat
				</Button>
			</SidebarHeader>

			<SidebarContent className="px-1">
				<SidebarGroup className="pt-1">
					<SidebarGroupLabel className="px-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
						Conversations
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu className="gap-0.5">
							{conversations?.map((c) => (
								<SidebarMenuItem key={c.thread_id}>
									<SidebarMenuButton
										isActive={c.thread_id === activeThreadId}
										onClick={() => onSelect(c.thread_id)}
										className="h-9 rounded-xl px-3"
									>
										<HugeiconsIcon
											icon={Message01Icon}
											className="size-4 shrink-0 text-muted-foreground"
										/>
										<span className="truncate">{c.title ?? "New chat"}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="p-3">
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
