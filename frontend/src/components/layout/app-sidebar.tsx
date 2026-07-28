"use client";

import {
	Delete02Icon,
	Loading03Icon,
	Message01Icon,
	PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLiveQuery } from "@tanstack/react-db";
import { useMutationState } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { NavUser } from "@/components/layout/nav-user";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DotmCircular7 } from "@/components/ui/dotm-circular-7";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { conversationsCollection } from "@/lib/db/conversations";
import type { QueryRequest } from "@/types/api";

type Props = {
	activeThreadId: string;
	onSelect: (threadId: string) => void;
	onNew: () => void;
};

type PendingDelete = {
	threadId: string;
	title: string;
};

function QueryActivity() {
	return (
		<span className="flex size-4 shrink-0 items-center justify-center text-primary">
			<DotmCircular7
				size={14}
				dotSize={2}
				boxSize={16}
				speed={1.4}
				ariaLabel="Working on this conversation"
			/>
		</span>
	);
}

export function AppSidebar({ activeThreadId, onSelect, onNew }: Props) {
	const { data: conversations } = useLiveQuery((q) =>
		q
			.from({ c: conversationsCollection })
			.orderBy(({ c }) => c.updated_at, "desc"),
	);
	const pendingQueryThreadIds = useMutationState({
		filters: { mutationKey: ["query"], status: "pending" },
		select: (mutation) =>
			(mutation.state.variables as QueryRequest | undefined)?.thread_id,
	});
	// Stable identity across renders while the running set is unchanged.
	const runningKey = pendingQueryThreadIds
		.filter((id): id is string => Boolean(id))
		.sort()
		.join("|");
	const runningThreadIds = useMemo(
		() => new Set(runningKey ? runningKey.split("|") : []),
		[runningKey],
	);
	const persistedIds = useMemo(
		() => new Set((conversations ?? []).map((c) => c.thread_id)),
		[conversations],
	);

	// A brand-new thread has no DB row until its first `/query` finishes AND the
	// Supabase Realtime insert propagates — which lags the HTTP response. We keep
	// a placeholder for such threads until the real row syncs in, so the row
	// never disappears and reappears (that gap was the flicker).
	const [placeholderIds, setPlaceholderIds] = useState<ReadonlySet<string>>(
		() => new Set(),
	);

	useEffect(() => {
		const toAdd = [...runningThreadIds].filter((id) => !persistedIds.has(id));
		if (toAdd.length === 0) return;
		setPlaceholderIds((prev) => {
			const next = new Set(prev);
			for (const id of toAdd) next.add(id);
			return next.size === prev.size ? prev : next;
		});
	}, [runningThreadIds, persistedIds]);

	// Drop a placeholder the instant its real conversation row appears.
	useEffect(() => {
		setPlaceholderIds((prev) => {
			if (prev.size === 0) return prev;
			let changed = false;
			const next = new Set(prev);
			for (const id of prev) {
				if (persistedIds.has(id)) {
					next.delete(id);
					changed = true;
				}
			}
			return changed ? next : prev;
		});
	}, [persistedIds]);

	// Clean up placeholders whose query ended without ever persisting (e.g. a
	// failed request), after a grace window that comfortably covers Realtime lag.
	useEffect(() => {
		const orphans = [...placeholderIds].filter(
			(id) => !runningThreadIds.has(id) && !persistedIds.has(id),
		);
		if (orphans.length === 0) return;
		const timer = setTimeout(() => {
			setPlaceholderIds((prev) => {
				const next = new Set(prev);
				for (const id of orphans) next.delete(id);
				return next.size === prev.size ? prev : next;
			});
		}, 4000);
		return () => clearTimeout(timer);
	}, [placeholderIds, runningThreadIds, persistedIds]);

	// Merge placeholders into the same list, keyed by thread_id, so when the real
	// conversation syncs in the row is reused in place instead of being
	// unmounted/remounted.
	const rows = useMemo(() => {
		const persisted = conversations ?? [];
		const placeholderThreadIds = [
			...new Set([...placeholderIds, ...runningThreadIds]),
		].filter((id) => !persistedIds.has(id));
		return [
			...placeholderThreadIds.map((threadId) => ({
				thread_id: threadId,
				title: null,
				persisted: false as const,
			})),
			...persisted.map((c) => ({
				thread_id: c.thread_id,
				title: c.title,
				persisted: true as const,
			})),
		];
	}, [conversations, placeholderIds, runningThreadIds, persistedIds]);

	const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
		null,
	);
	const [deletingIds, setDeletingIds] = useState<ReadonlySet<string>>(
		() => new Set(),
	);

	const handleConfirmDelete = () => {
		if (!pendingDelete) return;
		const { threadId } = pendingDelete;
		setPendingDelete(null);

		if (!conversationsCollection.has(threadId)) return;

		setDeletingIds((prev) => new Set(prev).add(threadId));
		if (threadId === activeThreadId) onNew();

		const tx = conversationsCollection.delete(threadId, {
			optimistic: false,
		});
		void tx.isPersisted.promise.finally(() => {
			setDeletingIds((prev) => {
				const next = new Set(prev);
				next.delete(threadId);
				return next;
			});
		});
	};

	return (
		<>
			<Sidebar
				collapsible="offcanvas"
				className="border-none [&_[data-slot=sidebar-inner]]:bg-transparent"
			>
				<SidebarHeader className="gap-3 p-3">
					<span className="px-1 text-lg font-semibold tracking-tight">
						Sage
					</span>
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
							{rows.length === 0 ? (
								<p className="px-3 py-2 text-sm text-muted-foreground">
									No conversations yet. Start a new chat to begin.
								</p>
							) : (
								<SidebarMenu className="gap-0.5">
									{rows.map((row) => {
										const isDeleting = deletingIds.has(row.thread_id);
										const isRunning = runningThreadIds.has(row.thread_id);
										return (
											<SidebarMenuItem
												key={row.thread_id}
												className={
													isDeleting
														? "pointer-events-none opacity-60"
														: undefined
												}
												aria-busy={isDeleting || isRunning || undefined}
											>
												<SidebarMenuButton
													isActive={row.thread_id === activeThreadId}
													onClick={() => onSelect(row.thread_id)}
													disabled={isDeleting}
													className="h-9 rounded-xl px-3 pr-8"
												>
													{isDeleting ? (
														<HugeiconsIcon
															icon={Loading03Icon}
															className="size-4 shrink-0 animate-spin text-muted-foreground"
														/>
													) : isRunning ? (
														<QueryActivity />
													) : (
														<HugeiconsIcon
															icon={Message01Icon}
															className="size-4 shrink-0 text-muted-foreground"
														/>
													)}
													<span className="truncate">
														{row.title ?? "New chat"}
													</span>
												</SidebarMenuButton>
												{row.persisted && !isDeleting && (
													<SidebarMenuAction
														showOnHover
														aria-label="Delete conversation"
														onClick={(e) => {
															e.stopPropagation();
															setPendingDelete({
																threadId: row.thread_id,
																title: row.title ?? "New chat",
															});
														}}
														className="right-1.5 top-1.5 text-muted-foreground hover:text-destructive"
													>
														<HugeiconsIcon
															icon={Delete02Icon}
															className="size-3.5"
														/>
													</SidebarMenuAction>
												)}
											</SidebarMenuItem>
										);
									})}
								</SidebarMenu>
							)}
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

				<SidebarFooter className="p-3">
					<NavUser />
				</SidebarFooter>
			</Sidebar>

			<AlertDialog
				open={pendingDelete !== null}
				onOpenChange={(open) => {
					if (!open) setPendingDelete(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete conversation?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete{" "}
							<span className="font-medium text-foreground">
								{pendingDelete?.title ?? "this conversation"}
							</span>
							. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setPendingDelete(null)}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={handleConfirmDelete}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
