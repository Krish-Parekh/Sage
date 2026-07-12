"use client";

import { nanoid } from "nanoid";
import { useState } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";

import { ChatPanel } from "./chat-panel";

type Thread = { id: string; load: boolean };

export function ChatShell() {
	const [thread, setThread] = useState<Thread>(() => ({
		id: nanoid(),
		load: false,
	}));

	return (
		<SidebarProvider className="h-svh overflow-hidden bg-background">
			<AppSidebar
				activeThreadId={thread.id}
				onSelect={(id) => setThread({ id, load: true })}
				onNew={() => setThread({ id: nanoid(), load: false })}
			/>
			<SidebarInset className="m-2 ml-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm max-md:m-0 max-md:rounded-none max-md:border-0 max-md:shadow-none md:peer-data-[state=collapsed]:ml-2">
				<header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 px-3">
					<SidebarTrigger className="-ml-1" />
					<span className="text-sm font-medium text-muted-foreground">
						Sage
					</span>
				</header>
				<div className="flex min-h-0 flex-1 flex-col">
					<ChatPanel key={thread.id} threadId={thread.id} load={thread.load} />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
