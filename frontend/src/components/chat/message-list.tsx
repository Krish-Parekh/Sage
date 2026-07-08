"use client";

import { useEffect, useRef } from "react";

import type { ChatMessage as ChatMessageType } from "@/types/chat";

import { ChatMessage } from "./chat-message";

function EmptyState() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-2 text-center">
			<p className="text-lg font-medium">Ask about your documents</p>
			<p className="max-w-sm text-sm text-muted-foreground">
				Start a conversation below to search and get answers grounded in your
				documents.
			</p>
		</div>
	);
}

export function MessageList({ messages }: { messages: ChatMessageType[] }) {
	const viewportRef = useRef<HTMLDivElement>(null);

	// Keep the newest message in view as the conversation grows.
	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport || messages.length === 0) return;
		viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
	}, [messages]);

	return (
		<div
			ref={viewportRef}
			className="scroll-fade no-scrollbar min-h-0 flex-1 overflow-y-auto"
		>
			{messages.length === 0 ? (
				<EmptyState />
			) : (
				<div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
					{messages.map((message) => (
						<ChatMessage key={message.id} message={message} />
					))}
				</div>
			)}
		</div>
	);
}
